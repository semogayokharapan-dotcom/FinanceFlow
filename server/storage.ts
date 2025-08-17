import { 
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction,
  type Contact,
  type InsertContact,
  type ChatMessage,
  type InsertChatMessage,
  type GlobalChat,
  type InsertGlobalChat
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPrivateKey(privateKey: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | null>;
  getUserByWeyId(weyId: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  generateWeyId(): string;
  
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
  getUserContacts(userId: string): Promise<any[]>;
  addContact(userId: string, data: InsertContact): Promise<Contact>;
  deleteContact(userId: string, contactId: string): Promise<void>;
  getChatMessages(userId: string, contactWeyId: string, limit?: number): Promise<any[]>;
  sendMessage(fromUserId: string, data: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(userId: string, contactWeyId: string): Promise<void>;
  getGlobalChatMessages(limit?: number): Promise<any[]>;
  sendGlobalMessage(userId: string, data: InsertGlobalChat): Promise<GlobalChat>;
}

export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private transactions: Transaction[] = [];
  private contacts: Contact[] = [];
  private chatMessages: ChatMessage[] = [];
  private globalChatMessages: GlobalChat[] = [];

  generateWeyId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByPrivateKey(privateKey: string): Promise<User | undefined> {
    return this.users.find(user => user.privateKey === privateKey);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByWeyId(weyId: string): Promise<User | null> {
    return this.users.find(user => user.weyId === weyId) || null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    let weyId: string;
    let isUnique = false;

    // Generate unique Wey ID
    do {
      weyId = this.generateWeyId();
      isUnique = !this.users.some(user => user.weyId === weyId);
    } while (!isUnique);

    const user: User = {
      id: nanoid(),
      weyId,
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
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekTransactions = await this.getUserTransactionsByDateRange(userId, weekStart, weekEnd);
      
      const income = weekTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = weekTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const balance = income - expense;
      
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

  // Chat methods
  async getUserContacts(userId: string): Promise<any[]> {
    const userContacts = this.contacts.filter(contact => contact.userId === userId);
    
    return await Promise.all(userContacts.map(async contact => {
      const contactUser = await this.getUserByWeyId(contact.contactWeyId);
      const lastMessage = this.chatMessages
        .filter(msg => 
          (msg.fromUserId === userId && msg.toWeyId === contact.contactWeyId) ||
          (msg.toWeyId === userId && msg.fromUserId === contactUser?.id)
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      const unreadCount = this.chatMessages
        .filter(msg => 
          msg.fromUserId === contactUser?.id && 
          msg.toWeyId === userId && 
          !msg.isRead
        ).length;

      return {
        id: contact.id,
        contactName: contact.contactName,
        contactWeyId: contact.contactWeyId,
        lastMessage: lastMessage?.content || '',
        lastMessageTime: lastMessage?.createdAt || contact.createdAt,
        unreadCount
      };
    }));
  }

  async addContact(userId: string, data: InsertContact): Promise<Contact> {
    const contact: Contact = {
      id: nanoid(),
      userId,
      ...data,
      createdAt: new Date(),
    };
    this.contacts.push(contact);
    return contact;
  }

  async deleteContact(userId: string, contactId: string): Promise<void> {
    this.contacts = this.contacts.filter(
      contact => !(contact.id === contactId && contact.userId === userId)
    );
  }

  async getChatMessages(userId: string, contactWeyId: string, limit = 50): Promise<any[]> {
    const contactUser = await this.getUserByWeyId(contactWeyId);
    if (!contactUser) return [];

    return this.chatMessages
      .filter(msg =>
        (msg.fromUserId === userId && msg.toWeyId === contactWeyId) ||
        (msg.fromUserId === contactUser.id && msg.toWeyId === userId)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.messageType,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
        fromUserId: msg.fromUserId,
        isFromCurrentUser: msg.fromUserId === userId
      }));
  }

  async sendMessage(fromUserId: string, data: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: nanoid(),
      fromUserId,
      ...data,
      messageType: data.messageType || "text",
      isRead: false,
      createdAt: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  async markMessagesAsRead(userId: string, contactWeyId: string): Promise<void> {
    const contactUser = await this.getUserByWeyId(contactWeyId);
    if (!contactUser) return;

    this.chatMessages
      .filter(msg => 
        msg.fromUserId === contactUser.id && 
        msg.toWeyId === userId && 
        !msg.isRead
      )
      .forEach(msg => {
        msg.isRead = true;
      });
  }

  async getGlobalChatMessages(limit = 50): Promise<any[]> {
    const messages = this.globalChatMessages
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return await Promise.all(messages.map(async msg => {
      const user = await this.getUserById(msg.userId);
      return {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          weyId: user.weyId
        } : null
      };
    }));
  }

  async sendGlobalMessage(userId: string, data: InsertGlobalChat): Promise<GlobalChat> {
    const message: GlobalChat = {
      id: nanoid(),
      userId,
      ...data,
      createdAt: new Date(),
    };
    this.globalChatMessages.push(message);
    return message;
  }
}

export const storage = new MemoryStorage();