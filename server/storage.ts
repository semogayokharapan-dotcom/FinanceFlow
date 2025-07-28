import { users, transactions, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sum, and, gte, lte } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
