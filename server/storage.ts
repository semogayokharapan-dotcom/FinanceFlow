import { type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { nanoid } from "nanoid";

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
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
}

export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private transactions: Transaction[] = [];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByPrivateKey(privateKey: string): Promise<User | undefined> {
    return this.users.find(user => user.privateKey === privateKey);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: nanoid(),
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return this.transactions
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: nanoid(),
      ...transaction,
      description: transaction.description || null,
      createdAt: new Date(),
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    this.transactions = this.transactions.filter(
      transaction => !(transaction.id === id && transaction.userId === userId)
    );
  }

  async getUserBalance(userId: string): Promise<{ income: number; expense: number; balance: number }> {
    const userTransactions = this.transactions.filter(t => t.userId === userId);
    
    const income = userTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expense = userTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = income - expense;

    return { income, expense, balance };
  }

  async getUserTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.userId === userId && 
               transactionDate >= startDate && 
               transactionDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    // Alias for getUserTransactionsByDateRange for backward compatibility
    return this.getUserTransactionsByDateRange(userId, startDate, endDate);
  }

  async getUserCategoryStats(userId: string): Promise<Array<{ category: string; total: number; count: number }>> {
    const expenseTransactions = this.transactions.filter(
      t => t.userId === userId && t.type === 'expense'
    );

    const categoryStats: Record<string, { total: number; count: number }> = {};
    
    expenseTransactions.forEach(transaction => {
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

export const storage = new MemoryStorage();