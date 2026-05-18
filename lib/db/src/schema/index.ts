import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["tourist", "admin", "staff"]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "paid",
  "cancelled",
  "expired",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "valid",
  "used",
  "expired",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
]);

// ─── USERS ───────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("tourist"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
// [FIX] Menggantikan in-memory Map di authMiddleware.
// Token disimpan di DB sehingga tetap valid meski server restart.

export const sessionsTable = pgTable("sessions", {
  token: varchar("token", { length: 64 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;

// ─── DESTINATIONS ─────────────────────────────────────────────────────────────

export const destinationsTable = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  dailyQuota: integer("daily_quota").notNull().default(100),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: text("image_url").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDestinationSchema = createInsertSchema(
  destinationsTable,
).omit({ id: true, createdAt: true });
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinationsTable.$inferSelect;

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinationsTable.id),
  visitDate: date("visit_date").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  status: reservationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReservationSchema = createInsertSchema(
  reservationsTable,
).omit({ id: true, createdAt: true });
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;

// ─── TICKETS ──────────────────────────────────────────────────────────────────

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id")
    .notNull()
    .references(() => reservationsTable.id),
  ticketCode: varchar("ticket_code", { length: 64 }).notNull().unique(),
  qrCodeData: text("qr_code_data").notNull(),
  status: ticketStatusEnum("status").notNull().default("valid"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id")
    .notNull()
    .references(() => reservationsTable.id),
  orderId: varchar("order_id", { length: 128 }).notNull().unique(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  paymentType: varchar("payment_type", { length: 64 }),
  midtransTransactionId: varchar("midtrans_transaction_id", { length: 128 }),
  snapToken: text("snap_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const insertTransactionSchema = createInsertSchema(
  transactionsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

// ─── RATINGS ──────────────────────────────────────────────────────────────────

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinationsTable.id),
  reservationId: integer("reservation_id")
    .notNull()
    .references(() => reservationsTable.id),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
