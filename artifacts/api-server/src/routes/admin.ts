import { Router } from "express";
import { db } from "@workspace/db";
import {
  reservationsTable,
  transactionsTable,
  destinationsTable,
  usersTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Middleware: require admin or staff
router.use(requireAuth);
router.use((req, res, next) => {
  const user = (req as any).user;
  if (!["admin", "staff"].includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [destCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(destinationsTable);
    const [resCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reservationsTable);
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable);

    const [revenueRow] = await db
      .select({ total: sql<string>`coalesce(sum(amount)::text, '0')` })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "paid"));

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reservationsTable)
      .where(eq(reservationsTable.status, "pending"));

    const today = new Date().toISOString().split("T")[0];
    const [todayRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reservationsTable)
      .where(sql`date(${reservationsTable.createdAt}) = ${today}`);

    res.json({
      totalDestinations: destCount?.count ?? 0,
      totalReservations: resCount?.count ?? 0,
      totalRevenue: parseFloat(revenueRow?.total ?? "0"),
      totalUsers: userCount?.count ?? 0,
      pendingReservations: pendingRow?.count ?? 0,
      todayReservations: todayRow?.count ?? 0,
    });
  } catch (err) {
    req.log.error(err, "admin stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/transactions
router.get("/transactions", async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { status: statusFilter } = req.query as { status?: string };

    // [FIX] Sebelumnya: loop Promise.all → setiap transaksi = 2 query tambahan (N+1).
    // Sekarang: satu query dengan LEFT JOIN ke reservations dan destinations.
    const rows = await db
      .select({
        t: transactionsTable,
        r: reservationsTable,
        d: destinationsTable,
      })
      .from(transactionsTable)
      .leftJoin(
        reservationsTable,
        eq(transactionsTable.reservationId, reservationsTable.id),
      )
      .leftJoin(
        destinationsTable,
        eq(reservationsTable.destinationId, destinationsTable.id),
      )
      .where(
        statusFilter ? eq(transactionsTable.status, statusFilter) : undefined,
      )
      .orderBy(sql`${transactionsTable.createdAt} desc`);

    const result = rows.map(({ t, r, d }) => ({
      id: t.id,
      reservationId: t.reservationId,
      orderId: t.orderId,
      amount: parseFloat(t.amount as string),
      status: t.status,
      paymentType: t.paymentType ?? null,
      midtransTransactionId: t.midtransTransactionId ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      reservation: r
        ? {
            id: r.id,
            userId: r.userId,
            destinationId: r.destinationId,
            visitDate: r.visitDate,
            quantity: r.quantity,
            totalPrice: parseFloat(r.totalPrice as string),
            status: r.status,
            createdAt: r.createdAt,
            destination: d ? formatDest(d) : null,
          }
        : null,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err, "admin transactions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/reservations
router.get("/reservations", async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // [FIX] Sebelumnya: loop Promise.all → N+1 query ke destinations.
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
      .orderBy(sql`${reservationsTable.createdAt} desc`);

    const result = rows.map(({ r, d }) => ({
      id: r.id,
      userId: r.userId,
      destinationId: r.destinationId,
      visitDate: r.visitDate,
      quantity: r.quantity,
      totalPrice: parseFloat(r.totalPrice as string),
      status: r.status,
      createdAt: r.createdAt,
      destination: d ? formatDest(d) : null,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err, "admin reservations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/revenue
router.get("/revenue", async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const rows = await db.execute(sql`
      SELECT
        TO_CHAR(t.created_at, 'Mon YYYY') as month,
        COALESCE(SUM(t.amount), 0)::float as revenue,
        COUNT(r.id)::int as reservations
      FROM transactions t
      JOIN reservations r ON t.reservation_id = r.id
      WHERE t.status = 'paid'
        AND t.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(t.created_at, 'Mon YYYY'), DATE_TRUNC('month', t.created_at)
      ORDER BY DATE_TRUNC('month', t.created_at)
    `);

    res.json(rows.rows ?? []);
  } catch (err) {
    req.log.error(err, "admin revenue error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(sql`${usersTable.createdAt} desc`);

    res.json(users);
  } catch (err) {
    req.log.error(err, "admin users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatDest(d: typeof destinationsTable.$inferSelect) {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    location: d.location,
    latitude: parseFloat(d.latitude as string),
    longitude: parseFloat(d.longitude as string),
    price: parseFloat(d.price as string),
    dailyQuota: d.dailyQuota,
    category: d.category,
    imageUrl: d.imageUrl,
    rating: d.rating != null ? parseFloat(d.rating as string) : null,
    featured: d.featured,
    createdAt: d.createdAt,
  };
}

export default router;
