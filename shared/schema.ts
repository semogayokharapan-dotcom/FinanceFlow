import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  privateKey: text("private_key").notNull().unique(),
  weyId: varchar("wey_id", { length: 8 }).notNull().unique(),
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

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contactWeyId: varchar("contact_wey_id").references(() => users.weyId).notNull(),
  contactName: text("contact_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chatMessages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toWeyId: varchar("to_wey_id").references(() => users.weyId).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { enum: ["text", "ping"] }).notNull().default("text"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const globalChat = pgTable("globalChat", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  contacts: many(contacts),
  sentMessages: many(chatMessages, { relationName: "sender" }),
  receivedMessages: many(chatMessages, { relationName: "receiver" }),
  globalMessages: many(globalChat),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  contact: one(users, {
    fields: [contacts.contactWeyId],
    references: [users.weyId],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sender: one(users, {
    fields: [chatMessages.fromUserId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [chatMessages.toWeyId],
    references: [users.weyId],
    relationName: "receiver",
  }),
}));

export const globalChatRelations = relations(globalChat, ({ one }) => ({
  user: one(users, {
    fields: [globalChat.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  weyId: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  fromUserId: true,
  createdAt: true,
});

export const insertGlobalChatSchema = createInsertSchema(globalChat).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertGlobalChat = z.infer<typeof insertGlobalChatSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type GlobalChat = typeof globalChat.$inferSelect;

// Authentication schemas
export const loginSchema = z.object({
  privateKey: z.string().min(1, "Private key is required"),
});

export const registerSchema = insertUserSchema.extend({
  privateKey: z.string().min(20, "Private key must be at least 20 characters"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;