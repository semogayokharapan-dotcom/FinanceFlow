
import { type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { nanoid } from "nanoid";
import * as schema from "@shared/schema";
import { desc, eq, gte, and, or, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPrivateKey(privateKey: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  getUserById(userId: string): Promise<schema.User | null>;

  // Transaction methods
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  deleteTransaction(id: string, userId: string): Promise<void>;

  // Analytics methods
  getUserBalance(userId: string): Promise<{ income: number; expense: number; balance: number }>;
  getUserTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  getUserCategoryStats(userId: string): Promise<Array<{ category: string; total: number; count: number }>>;
  getWeeklyStats(userId: string, weekCount: number): Promise<Array<{ week: string; income: number; expense: number; balance: number; startDate: Date; endDate: Date }>>;
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;

  // Chat methods
  generateWeyId(): string;
  createContact(userId: string, data: schema.InsertContact): Promise<schema.Contact>;
  getUserContacts(userId: string): Promise<any[]>;
  sendMessage(fromUserId: string, data: schema.InsertMessage): Promise<schema.Message>;
  getChatMessages(userId: string, contactWeyId: string, limit?: number): Promise<any[]>;
  markMessagesAsRead(userId: string, contactWeyId: string): Promise<void>;
  deleteContact(userId: string, contactId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user;
  }

  async getUserByPrivateKey(privateKey: string): Promise<schema.User | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.privateKey, privateKey))
      .limit(1);
    return user || null;
  }

  async createUser(userData: schema.InsertUser): Promise<schema.User> {
    let weyId: string;
    let isUnique = false;

    // Generate unique Wey ID
    do {
      weyId = this.generateWeyId();
      const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.weyId, weyId))
        .limit(1);
      isUnique = existing.length === 0;
    } while (!isUnique);

    const [user] = await db
      .insert(schema.users)
      .values({ ...userData, weyId })
      .returning();

    return user;
  }

  async getUserById(userId: string): Promise<schema.User | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    return user || null;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date))
      .limit(limit);
  }

  async createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(schema.transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.id, id),
          eq(schema.transactions.userId, userId)
        )
      );
  }

  async getUserBalance(userId: string): Promise<{ income: number; expense: number; balance: number }> {
    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId));

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expense;
    return { income, expense, balance };
  }

  async getUserTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          gte(schema.transactions.date, startDate),
          sql`${schema.transactions.date} <= ${endDate}`
        )
      )
      .orderBy(desc(schema.transactions.date));
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.getUserTransactionsByDateRange(userId, startDate, endDate);
  }

  async getUserCategoryStats(userId: string): Promise<Array<{ category: string; total: number; count: number }>> {
    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'expense')
        )
      );

    const categoryStats: Record<string, { total: number; count: number }> = {};

    transactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, count: 0 };
      }
      categoryStats[category].total += Number(transaction.amount);
      categoryStats[category].count += 1;
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count,
    }));
  }

  async getWeeklyStats(userId: string, weekCount: number = 4): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weekCount * 7));

    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          gte(schema.transactions.date, startDate)
        )
      )
      .orderBy(desc(schema.transactions.date));

    const weeklyData: Record<string, { income: number; expense: number; transactions: any[] }> = {};

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const weekStart = new Date(transactionDate);
      weekStart.setDate(transactionDate.getDate() - transactionDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { income: 0, expense: 0, transactions: [] };
      }

      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'income') {
        weeklyData[weekKey].income += amount;
      } else {
        weeklyData[weekKey].expense += amount;
      }
      weeklyData[weekKey].transactions.push(transaction);
    });

    return Object.entries(weeklyData)
      .map(([weekStart, data]) => {
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        return {
          week: `Minggu ${startDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}`,
          income: data.income,
          expense: data.expense,
          balance: data.income - data.expense,
          transactionCount: data.transactions.length,
          weekStart: weekStart
        };
      })
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
      .slice(0, weekCount);
  }

  generateWeyId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createContact(userId: string, data: schema.InsertContact): Promise<schema.Contact> {
    const targetUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.weyId, data.contactWeyId))
      .limit(1);

    if (targetUser.length === 0) {
      throw new Error("Wey ID tidak ditemukan");
    }

    const existingContact = await db
      .select()
      .from(schema.contacts)
      .where(
        and(
          eq(schema.contacts.userId, userId),
          eq(schema.contacts.contactWeyId, data.contactWeyId)
        )
      )
      .limit(1);

    if (existingContact.length > 0) {
      throw new Error("Kontak sudah ditambahkan");
    }

    const [contact] = await db
      .insert(schema.contacts)
      .values({ ...data, userId })
      .returning();

    return contact;
  }

  async getUserContacts(userId: string): Promise<any[]> {
    return await db
      .select({
        id: schema.contacts.id,
        contactName: schema.contacts.contactName,
        contactWeyId: schema.contacts.contactWeyId,
        fullName: schema.users.fullName,
        createdAt: schema.contacts.createdAt,
      })
      .from(schema.contacts)
      .leftJoin(schema.users, eq(schema.contacts.contactWeyId, schema.users.weyId))
      .where(eq(schema.contacts.userId, userId))
      .orderBy(desc(schema.contacts.createdAt));
  }

  async sendMessage(fromUserId: string, data: schema.InsertMessage): Promise<schema.Message> {
    const targetUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.weyId, data.toWeyId))
      .limit(1);

    if (targetUser.length === 0) {
      throw new Error("Wey ID tidak ditemukan");
    }

    const [message] = await db
      .insert(schema.messages)
      .values({ ...data, fromUserId })
      .returning();

    return message;
  }

  async getChatMessages(userId: string, contactWeyId: string, limit: number = 50): Promise<any[]> {
    const userWeyId = await db
      .select({ weyId: schema.users.weyId })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (userWeyId.length === 0) {
      throw new Error("User tidak ditemukan");
    }

    return await db
      .select({
        id: schema.messages.id,
        content: schema.messages.content,
        messageType: schema.messages.messageType,
        isRead: schema.messages.isRead,
        createdAt: schema.messages.createdAt,
        fromUserId: schema.messages.fromUserId,
        toWeyId: schema.messages.toWeyId,
        senderName: schema.users.fullName,
        isFromMe: sql<boolean>`${schema.messages.fromUserId} = ${userId}`,
      })
      .from(schema.messages)
      .leftJoin(schema.users, eq(schema.messages.fromUserId, schema.users.id))
      .where(
        or(
          and(
            eq(schema.messages.fromUserId, userId),
            eq(schema.messages.toWeyId, contactWeyId)
          ),
          and(
            eq(schema.messages.toWeyId, userWeyId[0].weyId),
            sql`${schema.messages.fromUserId} = (SELECT id FROM users WHERE wey_id = ${contactWeyId})`
          )
        )
      )
      .orderBy(desc(schema.messages.createdAt))
      .limit(limit);
  }

  async markMessagesAsRead(userId: string, contactWeyId: string): Promise<void> {
    const userWeyId = await db
      .select({ weyId: schema.users.weyId })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (userWeyId.length === 0) {
      return;
    }

    await db
      .update(schema.messages)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.messages.toWeyId, userWeyId[0].weyId),
          sql`${schema.messages.fromUserId} = (SELECT id FROM users WHERE wey_id = ${contactWeyId})`,
          eq(schema.messages.isRead, false)
        )
      );
  }

  async deleteContact(userId: string, contactId: string): Promise<void> {
    await db
      .delete(schema.contacts)
      .where(
        and(
          eq(schema.contacts.id, contactId),
          eq(schema.contacts.userId, userId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
