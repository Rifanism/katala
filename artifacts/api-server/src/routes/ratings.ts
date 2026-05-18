import { Router } from "express";
import { db } from "@workspace/db";
import {
  ratingsTable,
  reservationsTable,
  ticketsTable,
  destinationsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, avg, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { z } from "zod";

const router = Router();

const CreateRatingBody = z.object({
  reservationId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

// POST /api/ratings
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = CreateRatingBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const { reservationId, rating, review } = parsed.data;

    const [reservation] = await db.select().from(reservationsTable)
      .where(and(eq(reservationsTable.id, reservationId), eq(reservationsTable.userId, user.id))).limit(1);
    if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }
    if (reservation.status !== "paid") { res.status(400).json({ error: "Can only rate paid reservations" }); return; }

    const [usedTicket] = await db.select().from(ticketsTable)
      .where(and(eq(ticketsTable.reservationId, reservationId), eq(ticketsTable.status, "used"))).limit(1);
    if (!usedTicket) { res.status(400).json({ error: "Can only rate after your ticket has been scanned" }); return; }

    const [existing] = await db.select().from(ratingsTable)
      .where(and(eq(ratingsTable.userId, user.id), eq(ratingsTable.reservationId, reservationId))).limit(1);
    if (existing) { res.status(409).json({ error: "Already rated this reservation" }); return; }

    const [newRating] = await db.insert(ratingsTable).values({
      userId: user.id,
      destinationId: reservation.destinationId,
      reservationId,
      rating,
      review: review ?? null,
    }).returning();

    // Update destination avg rating
    const result = await db.select({ avg: avg(ratingsTable.rating) }).from(ratingsTable)
      .where(eq(ratingsTable.destinationId, reservation.destinationId));
    const avgRating = result[0]?.avg ? parseFloat(result[0].avg as string) : null;
    if (avgRating !== null) {
      await db.update(destinationsTable)
        .set({ rating: String(Math.round(avgRating * 10) / 10) })
        .where(eq(destinationsTable.id, reservation.destinationId));
    }

    res.status(201).json({ id: newRating.id, rating: newRating.rating, review: newRating.review, createdAt: newRating.createdAt });
  } catch (err) {
    req.log.error(err, "create rating error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ratings/can-rate/:reservationId
router.get("/can-rate/:reservationId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const reservationId = parseInt(req.params.reservationId);
    if (isNaN(reservationId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [reservation] = await db.select().from(reservationsTable)
      .where(and(eq(reservationsTable.id, reservationId), eq(reservationsTable.userId, user.id))).limit(1);
    if (!reservation || reservation.status !== "paid") { res.json({ canRate: false, alreadyRated: false }); return; }

    const [usedTicket] = await db.select().from(ticketsTable)
      .where(and(eq(ticketsTable.reservationId, reservationId), eq(ticketsTable.status, "used"))).limit(1);
    if (!usedTicket) { res.json({ canRate: false, alreadyRated: false }); return; }

    const [existing] = await db.select().from(ratingsTable)
      .where(and(eq(ratingsTable.userId, user.id), eq(ratingsTable.reservationId, reservationId))).limit(1);

    res.json({
      canRate: !existing,
      alreadyRated: !!existing,
      existingRating: existing ? { rating: existing.rating, review: existing.review } : null,
    });
  } catch (err) {
    req.log.error(err, "can-rate error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ratings/destination/:destinationId
router.get("/destination/:destinationId", async (req, res) => {
  try {
    const destinationId = parseInt(req.params.destinationId);
    if (isNaN(destinationId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const ratings = await db
      .select({
        id: ratingsTable.id,
        rating: ratingsTable.rating,
        review: ratingsTable.review,
        createdAt: ratingsTable.createdAt,
        userId: ratingsTable.userId,
        userName: usersTable.name,
      })
      .from(ratingsTable)
      .leftJoin(usersTable, eq(ratingsTable.userId, usersTable.id))
      .where(eq(ratingsTable.destinationId, destinationId))
      .orderBy(desc(ratingsTable.createdAt))
      .limit(100);

    res.json(ratings);
  } catch (err) {
    req.log.error(err, "list ratings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
