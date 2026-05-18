import { Router } from "express";
import { db } from "@workspace/db";
import {
  reservationsTable,
  destinationsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { CreateReservationBody } from "@workspace/api-zod";

const router = Router();

// GET /api/reservations (my reservations)
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // [FIX] Sebelumnya: loop Promise.all → query destinations satu-satu (N+1).
    // Sekarang: satu query dengan LEFT JOIN.
    const rows = await db
      .select({
        r: reservationsTable,
        d: destinationsTable,
      })
      .from(reservationsTable)
      .leftJoin(
        destinationsTable,
        eq(reservationsTable.destinationId, destinationsTable.id),
      )
      .where(eq(reservationsTable.userId, user.id))
      .orderBy(sql`${reservationsTable.createdAt} desc`);

    const result = rows.map(({ r, d }) => formatReservation(r, d ?? null));
    res.json(result);
  } catch (err) {
    req.log.error(err, "list reservations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reservations
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = CreateReservationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const { destinationId, visitDate, quantity } = parsed.data;

    const [dest] = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.id, destinationId))
      .limit(1);
    if (!dest) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }

    // Cek daily quota
    const existing = await db
      .select()
      .from(reservationsTable)
      .where(
        and(
          eq(reservationsTable.destinationId, destinationId),
          eq(reservationsTable.visitDate, visitDate),
          sql`${reservationsTable.status} IN ('pending', 'paid')`,
        ),
      );
    const totalBooked = existing.reduce((sum, r) => sum + r.quantity, 0);
    if (totalBooked + quantity > dest.dailyQuota) {
      res.status(400).json({
        error: `Daily quota exceeded. Available: ${dest.dailyQuota - totalBooked}`,
      });
      return;
    }

    const totalPrice = parseFloat(dest.price as string) * quantity;

    const [reservation] = await db
      .insert(reservationsTable)
      .values({
        userId: user.id,
        destinationId,
        visitDate,
        quantity,
        totalPrice: String(totalPrice),
        status: "pending",
      })
      .returning();

    res.status(201).json(formatReservation(reservation, dest));
  } catch (err) {
    req.log.error(err, "create reservation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reservations/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    // [FIX] Satu query dengan JOIN, tidak perlu dua query terpisah.
    const [row] = await db
      .select({
        r: reservationsTable,
        d: destinationsTable,
      })
      .from(reservationsTable)
      .leftJoin(
        destinationsTable,
        eq(reservationsTable.destinationId, destinationsTable.id),
      )
      .where(eq(reservationsTable.id, id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }
    if (row.r.userId !== user.id && user.role === "tourist") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json(formatReservation(row.r, row.d ?? null));
  } catch (err) {
    req.log.error(err, "get reservation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatReservation(
  r: typeof reservationsTable.$inferSelect,
  dest: typeof destinationsTable.$inferSelect | null,
) {
  return {
    id: r.id,
    userId: r.userId,
    destinationId: r.destinationId,
    visitDate: r.visitDate,
    quantity: r.quantity,
    totalPrice: parseFloat(r.totalPrice as string),
    status: r.status,
    createdAt: r.createdAt,
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
  };
}

export { formatReservation };
export default router;
