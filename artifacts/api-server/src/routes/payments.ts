import { Router } from "express";
import { db } from "@workspace/db";
import {
  reservationsTable,
  transactionsTable,
  ticketsTable,
  destinationsTable,
  usersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { CreatePaymentBody, PaymentWebhookBody } from "@workspace/api-zod";
import { generateOrderId, generateTicketCode } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

const PAYMENT_EXPIRY_MINUTES = 15;

function getMidtransSnap() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY not configured");
  }
  const Midtrans = require("midtrans-client");
  return new Midtrans.Snap({
    isProduction: false,
    serverKey,
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
  });
}

/** Generate ONE ticket per reservation (not per person).
 *  The quantity field on the reservation already encodes how many people. */
async function generateTicketForReservation(reservation: typeof reservationsTable.$inferSelect) {
  // Check if ticket already exists for this reservation
  const existing = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.reservationId, reservation.id))
    .limit(1);

  if (existing.length > 0) return; // already generated

  const ticketCode = generateTicketCode();
  const qrCodeData = JSON.stringify({
    ticketCode,
    reservationId: reservation.id,
    destinationId: reservation.destinationId,
    visitDate: reservation.visitDate,
    quantity: reservation.quantity,
    issuer: "KATALA",
  });

  await db.insert(ticketsTable).values({
    reservationId: reservation.id,
    ticketCode,
    qrCodeData,
    status: "valid",
  });
}

// POST /api/payments/create
router.post("/create", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = CreatePaymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { reservationId } = parsed.data;

    const [reservation] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservationId))
      .limit(1);

    if (!reservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }
    if (reservation.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (reservation.status === "paid") {
      res.status(400).json({ error: "Reservation already paid" });
      return;
    }

    // Check for existing pending transaction (reuse if not expired)
    const [existingTx] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.reservationId, reservationId))
      .limit(1);

    const now = new Date();
    if (existingTx && existingTx.status === "pending") {
      // Use stored expiresAt from DB (reliable, no timezone issues)
      const expiresAt = existingTx.expiresAt ? new Date(existingTx.expiresAt) : new Date(now.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);
      if (now < expiresAt) {
        // Reuse existing transaction
        res.status(200).json({
          snapToken: existingTx.snapToken,
          orderId: existingTx.orderId,
          redirectUrl: null,
          expiresAt: expiresAt.toISOString(),
        });
        return;
      }
      // Expired: mark old as expired
      await db
        .update(transactionsTable)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(transactionsTable.id, existingTx.id));

      // Also cancel the reservation
      await db
        .update(reservationsTable)
        .set({ status: "expired" })
        .where(eq(reservationsTable.id, reservationId));

      res.status(400).json({ error: "Pembayaran sebelumnya telah kedaluwarsa. Silakan buat reservasi baru." });
      return;
    }

    const orderId = generateOrderId();
    const amount = parseFloat(reservation.totalPrice as string);
    const expiresAt = new Date(now.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      // Demo mode: simulate payment with QR
      const [transaction] = await db
        .insert(transactionsTable)
        .values({
          reservationId,
          orderId,
          amount: String(amount),
          status: "pending",
          snapToken: `DEMO_TOKEN_${orderId}`,
          updatedAt: new Date(),
          expiresAt,
        })
        .returning();

      res.status(201).json({
        snapToken: transaction.snapToken,
        orderId: transaction.orderId,
        redirectUrl: null,
        expiresAt: expiresAt.toISOString(),
        demoMode: true,
      });
      return;
    }

    const snap = getMidtransSnap();
    const [dest] = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.id, reservation.destinationId))
      .limit(1);

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      item_details: [
        {
          id: String(reservation.destinationId),
          price: Math.round(parseFloat((dest?.price as string) ?? "0")),
          quantity: reservation.quantity,
          name: dest?.name ?? "Wisata",
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      expiry: {
        unit: "minutes",
        duration: PAYMENT_EXPIRY_MINUTES,
      },
    };

    const snapResponse = await snap.createTransaction(parameter);

    const [transaction] = await db
      .insert(transactionsTable)
      .values({
        reservationId,
        orderId,
        amount: String(amount),
        status: "pending",
        snapToken: snapResponse.token,
        updatedAt: new Date(),
        expiresAt,
      })
      .returning();

    res.status(201).json({
      snapToken: snapResponse.token,
      orderId: transaction.orderId,
      redirectUrl: snapResponse.redirect_url ?? null,
      expiresAt: expiresAt.toISOString(),
      demoMode: false,
    });
  } catch (err) {
    req.log.error(err, "create payment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payments/webhook
router.post("/webhook", async (req, res) => {
  try {
    const parsed = PaymentWebhookBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid webhook payload" });
      return;
    }

    const { order_id, transaction_status, fraud_status, payment_type, transaction_id } = parsed.data;

    const [transaction] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.orderId, order_id))
      .limit(1);

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    let newStatus: "pending" | "paid" | "failed" | "expired" | "refunded" = "pending";

    if (transaction_status === "capture") {
      newStatus = fraud_status === "accept" ? "paid" : "failed";
    } else if (transaction_status === "settlement") {
      newStatus = "paid";
    } else if (["cancel", "deny", "failure"].includes(transaction_status)) {
      newStatus = "failed";
    } else if (transaction_status === "expire") {
      newStatus = "expired";
    } else if (transaction_status === "refund") {
      newStatus = "refunded";
    }

    await db
      .update(transactionsTable)
      .set({
        status: newStatus,
        paymentType: payment_type ?? null,
        midtransTransactionId: transaction_id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(transactionsTable.id, transaction.id));

    if (newStatus === "paid") {
      const [reservation] = await db
        .select()
        .from(reservationsTable)
        .where(eq(reservationsTable.id, transaction.reservationId))
        .limit(1);

      if (reservation && reservation.status !== "paid") {
        await db
          .update(reservationsTable)
          .set({ status: "paid" })
          .where(eq(reservationsTable.id, reservation.id));

        // ONE ticket per reservation
        await generateTicketForReservation(reservation);
      }
    } else if (newStatus === "expired") {
      await db
        .update(reservationsTable)
        .set({ status: "expired" })
        .where(eq(reservationsTable.id, transaction.reservationId));
    }

    res.json({ message: "Webhook processed" });
  } catch (err) {
    logger.error(err, "webhook error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payments/simulate-success (dev only)
router.post("/simulate-success", requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body as { orderId: string };
    if (!orderId) {
      res.status(400).json({ error: "orderId required" });
      return;
    }

    const [transaction] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.orderId, orderId))
      .limit(1);

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    await db
      .update(transactionsTable)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(transactionsTable.id, transaction.id));

    const [reservation] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, transaction.reservationId))
      .limit(1);

    if (reservation && reservation.status !== "paid") {
      await db
        .update(reservationsTable)
        .set({ status: "paid" })
        .where(eq(reservationsTable.id, reservation.id));

      // ONE ticket per reservation
      await generateTicketForReservation(reservation);
    }

    res.json({ message: "Payment simulated as successful" });
  } catch (err) {
    req.log.error(err, "simulate payment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payments/:reservationId/status
router.get("/:reservationId/status", requireAuth, async (req, res) => {
  try {
    const reservationId = parseInt(req.params.reservationId);
    if (isNaN(reservationId)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const [transaction] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.reservationId, reservationId))
      .limit(1);

    if (!transaction) {
      res.status(404).json({ error: "No transaction found" });
      return;
    }

    // Auto-expire if past time and still pending
    const now = new Date();
    // Use stored expiresAt — reliable, no timezone calculation issues
    const expiresAt = transaction.expiresAt
      ? new Date(transaction.expiresAt)
      : new Date(now.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);
    let currentStatus = transaction.status;
    if (currentStatus === "pending" && now > expiresAt) {
      await db
        .update(transactionsTable)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(transactionsTable.id, transaction.id));
      await db
        .update(reservationsTable)
        .set({ status: "expired" })
        .where(eq(reservationsTable.id, reservationId));
      currentStatus = "expired";
    }

    const [reservation] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, transaction.reservationId))
      .limit(1);

    const dest = reservation
      ? await db
          .select()
          .from(destinationsTable)
          .where(eq(destinationsTable.id, reservation.destinationId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : null;

    res.json({
      id: transaction.id,
      reservationId: transaction.reservationId,
      orderId: transaction.orderId,
      amount: parseFloat(transaction.amount as string),
      status: currentStatus,
      paymentType: transaction.paymentType ?? null,
      midtransTransactionId: transaction.midtransTransactionId ?? null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      expiresAt: expiresAt.toISOString(),
      reservation: reservation
        ? {
            id: reservation.id,
            userId: reservation.userId,
            destinationId: reservation.destinationId,
            visitDate: reservation.visitDate,
            quantity: reservation.quantity,
            totalPrice: parseFloat(reservation.totalPrice as string),
            status: reservation.status,
            createdAt: reservation.createdAt,
            destination: dest
              ? {
                  id: dest.id,
                  name: dest.name,
                  description: dest.description,
                  location: dest.location,
                  latitude: parseFloat(dest.latitude as string),
                  longitude: parseFloat(dest.longitude as string),
                  price: parseFloat(dest.price as string),
                  dailyQuota: dest.dailyQuota,
                  category: dest.category,
                  imageUrl: dest.imageUrl,
                  rating: dest.rating != null ? parseFloat(dest.rating as string) : null,
                  featured: dest.featured,
                  createdAt: dest.createdAt,
                }
              : null,
          }
        : null,
    });
  } catch (err) {
    req.log.error(err, "get payment status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
