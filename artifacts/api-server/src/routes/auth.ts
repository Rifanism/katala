import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const { name, email, password, role } = parsed.data;

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (existing.length) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
        role: (role as any) ?? "tourist",
      })
      .returning();

    // [FIX] Simpan token ke tabel sessions, bukan in-memory Map
    const token = generateToken();
    await db.insert(sessionsTable).values({ token, userId: user.id });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    req.log.error(err, "register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const { email, password } = parsed.data;

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (!users.length) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = users[0];
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // [FIX] Simpan token ke tabel sessions, bukan in-memory Map
    const token = generateToken();
    await db.insert(sessionsTable).values({ token, userId: user.id });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    req.log.error(err, "login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  // [FIX] Hapus token dari DB
  const token = (req as any).token;
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

// PATCH /api/auth/profile
// [FIX] Dipindahkan ke ATAS export default — sebelumnya route ini tidak pernah
// terdaftar karena ditulis setelah "export default router".
router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, oldPassword, newPassword } = req.body as {
      name?: string;
      oldPassword?: string;
      newPassword?: string;
    };

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400).json({ error: "Nama tidak boleh kosong" });
        return;
      }
      updates.name = name.trim();
    }

    if (newPassword !== undefined) {
      if (!oldPassword) {
        res.status(400).json({ error: "Password lama diperlukan" });
        return;
      }
      const valid = await verifyPassword(oldPassword, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Password lama salah" });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ error: "Password minimal 6 karakter" });
        return;
      }
      updates.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Tidak ada perubahan" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, user.id))
      .returning();

    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    req.log.error(err, "update profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
