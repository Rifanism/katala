import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// [FIX] In-memory Map dihapus. Token sekarang disimpan di tabel `sessions`
// di database sehingga tetap valid meski server restart atau crash.

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.substring(7);

  // Cari session di DB sekaligus JOIN ke users dalam satu query
  const rows = await db
    .select({
      user: usersTable,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.token, token))
    .limit(1);

  if (!rows.length) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as any).user = rows[0].user;
  (req as any).token = token;
  next();
}

export async function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await requireAuth(req, res, async () => {
      const user = (req as any).user;
      if (!roles.includes(user.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    });
  };
}
