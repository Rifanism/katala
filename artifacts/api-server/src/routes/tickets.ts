import { Router } from "express";
import { db } from "@workspace/db";
import {
  ticketsTable,
  reservationsTable,
  destinationsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { ValidateTicketBody } from "@workspace/api-zod";

const router = Router();

// GET /api/tickets (my tickets)
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get user reservations
    const reservations = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.userId, user.id));

    const reservationIds = reservations.map((r) => r.id);
    if (!reservationIds.length) {
      res.json([]);
      return;
    }

    const tickets = await db
      .select()
      .from(ticketsTable)
      .where(inArray(ticketsTable.reservationId, reservationIds))
      .orderBy(ticketsTable.createdAt);

    const enriched = await Promise.all(
      tickets.map(async (t) => {
        const [reservation] = reservations.filter(
          (r) => r.id === t.reservationId,
        );
        const dest = reservation
          ? await db
              .select()
              .from(destinationsTable)
              .where(eq(destinationsTable.id, reservation.destinationId))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : null;
        return formatTicket(t, reservation ?? null, dest);
      }),
    );

    res.json(enriched);
  } catch (err) {
    req.log.error(err, "list tickets error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tickets/validate — before /:id
router.post("/validate", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!["admin", "staff"].includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const parsed = ValidateTicketBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { ticketCode } = parsed.data;
    const [ticket] = await db
      .select()
      .from(ticketsTable)
      .where(eq(ticketsTable.ticketCode, ticketCode))
      .limit(1);

    if (!ticket) {
      res.status(404).json({ valid: false, message: "Tiket tidak ditemukan", ticket: null });
      return;
    }

    if (ticket.status === "used") {
      res.status(400).json({ valid: false, message: "Tiket sudah digunakan", ticket: formatTicket(ticket, null, null) });
      return;
    }

    if (ticket.status === "expired") {
      res.status(400).json({ valid: false, message: "Tiket sudah kedaluwarsa", ticket: formatTicket(ticket, null, null) });
      return;
    }

    // Mark as used
    const [updated] = await db
      .update(ticketsTable)
      .set({ status: "used", usedAt: new Date() })
      .where(eq(ticketsTable.id, ticket.id))
      .returning();

    const [reservation] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, ticket.reservationId))
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
      valid: true,
      message: "Tiket valid dan berhasil digunakan",
      ticket: formatTicket(updated, reservation ?? null, dest),
    });
  } catch (err) {
    req.log.error(err, "validate ticket error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tickets/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const [ticket] = await db
      .select()
      .from(ticketsTable)
      .where(eq(ticketsTable.id, id))
      .limit(1);

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const [reservation] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, ticket.reservationId))
      .limit(1);

    // Check ownership
    if (
      reservation &&
      reservation.userId !== user.id &&
      user.role === "tourist"
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const dest = reservation
      ? await db
          .select()
          .from(destinationsTable)
          .where(eq(destinationsTable.id, reservation.destinationId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : null;

    res.json(formatTicket(ticket, reservation ?? null, dest));
  } catch (err) {
    req.log.error(err, "get ticket error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatDest(dest: typeof destinationsTable.$inferSelect) {
  return {
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
  };
}

function formatTicket(
  t: typeof ticketsTable.$inferSelect,
  reservation: typeof reservationsTable.$inferSelect | null,
  dest: typeof destinationsTable.$inferSelect | null,
) {
  return {
    id: t.id,
    reservationId: t.reservationId,
    ticketCode: t.ticketCode,
    qrCodeData: t.qrCodeData,
    status: t.status,
    usedAt: t.usedAt ?? null,
    createdAt: t.createdAt,
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
          destination: dest ? formatDest(dest) : null,
        }
      : null,
  };
}

export default router;
