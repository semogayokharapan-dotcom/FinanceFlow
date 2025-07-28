import { users, transactions, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sum, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPrivateKey(privateKey: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  deleteTransaction(id: string, userId: string): Promise<void>;
  
  // Analytics methods
  getUserBalance(userId: string): Promise<{ income: number; expense: number; balance: number }>;
  getUserTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  getUserCategoryStats(userId: string): Promise<Array<{ category: string; total: number; count: number }>>;
  getWeeklyStats(userId: string, weekCount: number): Promise<Array<{ week: string; income: number; expense: number; balance: number; startDate: Date; endDate: Date }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPrivateKey(privateKey: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.privateKey, privateKey));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }

  async createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  }

  async getUserBalance(userId: string): Promise<{ income: number; expense: number; balance: number }> {
    const result = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(transactions.type);

    const income = Number(result.find(r => r.type === 'income')?.total || 0);
    const expense = Number(result.find(r => r.type === 'expense')?.total || 0);
    const balance = income - expense;

    return { income, expense, balance };
  }

  async getUserTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    // Alias for getUserTransactionsByDateRange for backward compatibility
    return this.getUserTransactionsByDateRange(userId, startDate, endDate);
  }

  async getUserCategoryStats(userId: string): Promise<Array<{ category: string; total: number; count: number }>> {
    const result = await db
      .select({
        category: transactions.category,
        total: sum(transactions.amount),
        count: sql<number>`count(*)`.as('count'),
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, 'expense')))
      .groupBy(transactions.category);

    return result.map(r => ({
      category: r.category,
      total: Number(r.total || 0),
      count: r.count,
    }));
  }

  async getWeeklyStats(userId: string, weekCount: number = 4): Promise<Array<{ week: string; income: number; expense: number; balance: number; startDate: Date; endDate: Date }>> {
    const stats = [];
    const now = new Date();
    
    for (let i = 0; i < weekCount; i++) {
      // Calculate start and end of week (Monday to Sunday)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Get transactions for this week
      const weekTransactions = await this.getUserTransactionsByDateRange(userId, weekStart, weekEnd);
      
      const income = weekTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = weekTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const balance = income - expense;
      
      // Format week label
      const weekLabel = i === 0 ? 'Minggu Ini' : 
                      i === 1 ? 'Minggu Lalu' : 
                      `${i + 1} Minggu Lalu`;

      stats.push({
        week: weekLabel,
        income,
        expense,
        balance,
        startDate: weekStart,
        endDate: weekEnd,
      });
    }

    return stats;
  }
}

export const storage = new DatabaseStorage();
