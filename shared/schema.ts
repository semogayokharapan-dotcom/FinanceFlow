import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  privateKey: text("private_key").notNull().unique(),
  monthlyTarget: decimal("monthly_target", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: varchar("type", { enum: ["income", "expense"] }).notNull(),
  category: varchar("category", { enum: ["food", "transport", "shopping", "entertainment", "bills", "other", "salary", "freelance", "business", "investment", "bonus"] }).notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

// Authentication schemas
export const loginSchema = z.object({
  privateKey: z.string().min(1, "Private key is required"),
});

export const registerSchema = insertUserSchema.extend({
  privateKey: z.string().min(20, "Private key must be at least 20 characters"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;