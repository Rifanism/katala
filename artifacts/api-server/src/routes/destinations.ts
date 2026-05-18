import { Router } from "express";
import { db } from "@workspace/db";
import { destinationsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  CreateDestinationBody,
  UpdateDestinationBody,
  ListDestinationsQueryParams,
} from "@workspace/api-zod";

const router = Router();

// GET /api/destinations
router.get("/", async (req, res) => {
  try {
    const parsed = ListDestinationsQueryParams.safeParse(req.query);
    const { search, category, page = 1, limit = 12 } = parsed.data ?? {};

    const offset = ((page ?? 1) - 1) * (limit ?? 12);

    // [FIX] Sebelumnya: fetch SEMUA row ke memory, lalu di-slice di JavaScript.
    // Sekarang: LIMIT dan OFFSET dikerjakan langsung oleh PostgreSQL.
    // Untuk total count, jalankan query COUNT terpisah — jauh lebih efisien.

    // Bangun kondisi filter (sama untuk data query maupun count query)
    const whereClause = search
      ? or(
          ilike(destinationsTable.name, `%${search}%`),
          ilike(destinationsTable.location, `%${search}%`),
        )
      : category
        ? eq(destinationsTable.category, category)
        : undefined;

    // Query data dengan pagination
    const dataQuery = db
      .select()
      .from(destinationsTable)
      .orderBy(desc(destinationsTable.featured), desc(destinationsTable.createdAt))
      .limit(limit ?? 12)
      .offset(offset);

    if (whereClause) {
      dataQuery.where(whereClause);
    }

    // Query total count
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(destinationsTable);

    if (whereClause) {
      countQuery.where(whereClause);
    }

    // Jalankan keduanya secara paralel
    const [rows, countResult] = await Promise.all([dataQuery, countQuery]);

    const total = countResult[0]?.count ?? 0;
    const data = rows.map(formatDest);

    res.json({ data, total, page: page ?? 1, limit: limit ?? 12 });
  } catch (err) {
    req.log.error(err, "list destinations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/destinations/featured — harus sebelum /:id
router.get("/featured", async (req, res) => {
  try {
    const featured = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.featured, true))
      .limit(6)
      .orderBy(desc(destinationsTable.createdAt));
    res.json(featured.map(formatDest));
  } catch (err) {
    req.log.error(err, "featured destinations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/destinations/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const rows = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.id, id))
      .limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    res.json(formatDest(rows[0]));
  } catch (err) {
    req.log.error(err, "get destination error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/destinations (admin)
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const parsed = CreateDestinationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error });
      return;
    }
    const d = parsed.data;
    const [dest] = await db
      .insert(destinationsTable)
      .values({
        name: d.name,
        description: d.description,
        location: d.location,
        latitude: String(d.latitude),
        longitude: String(d.longitude),
        price: String(d.price),
        dailyQuota: d.dailyQuota,
        category: d.category,
        imageUrl: d.imageUrl,
        rating: d.rating != null ? String(d.rating) : null,
        featured: d.featured ?? false,
      })
      .returning();
    res.status(201).json(formatDest(dest));
  } catch (err) {
    req.log.error(err, "create destination error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/destinations/:id (admin)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const parsed = UpdateDestinationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const d = parsed.data;
    const updates: Record<string, any> = {};
    if (d.name !== undefined) updates.name = d.name;
    if (d.description !== undefined) updates.description = d.description;
    if (d.location !== undefined) updates.location = d.location;
    if (d.latitude !== undefined) updates.latitude = String(d.latitude);
    if (d.longitude !== undefined) updates.longitude = String(d.longitude);
    if (d.price !== undefined) updates.price = String(d.price);
    if (d.dailyQuota !== undefined) updates.dailyQuota = d.dailyQuota;
    if (d.category !== undefined) updates.category = d.category;
    if (d.imageUrl !== undefined) updates.imageUrl = d.imageUrl;
    if (d.rating !== undefined) updates.rating = d.rating != null ? String(d.rating) : null;
    if (d.featured !== undefined) updates.featured = d.featured;

    const [updated] = await db
      .update(destinationsTable)
      .set(updates)
      .where(eq(destinationsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    res.json(formatDest(updated));
  } catch (err) {
    req.log.error(err, "update destination error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/destinations/:id (admin)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = parseInt(req.params.id);
    await db.delete(destinationsTable).where(eq(destinationsTable.id, id));
    res.json({ message: "Destination deleted" });
  } catch (err) {
    req.log.error(err, "delete destination error");
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
