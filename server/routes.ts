import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if private key already exists
      const existingUser = await storage.getUserByPrivateKey(data.privateKey);
      if (existingUser) {
        return res.status(400).json({ message: "Private key sudah digunakan" });
      }

      const user = await storage.createUser(data);
      res.json({ 
        message: "Akun berhasil dibuat", 
        user: { id: user.id, fullName: user.fullName, monthlyTarget: user.monthlyTarget }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { privateKey } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByPrivateKey(privateKey);
      if (!user) {
        return res.status(401).json({ message: "Private key tidak valid" });
      }

      res.json({ 
        message: "Login berhasil",
        user: { id: user.id, fullName: user.fullName, monthlyTarget: user.monthlyTarget }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });

  // Transaction routes
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data transaksi" });
    }
  });

  app.post("/api/transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const data = insertTransactionSchema.parse(req.body);
      
      const transaction = await storage.createTransaction({ ...data, userId });
      res.json({ message: "Transaksi berhasil ditambahkan", transaction });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data transaksi tidak valid", errors: error.errors });
      }
      res.status(500).json({ message: "Gagal menambahkan transaksi" });
    }
  });

  app.delete("/api/transactions/:userId/:transactionId", async (req, res) => {
    try {
      const { userId, transactionId } = req.params;
      
      await storage.deleteTransaction(transactionId, userId);
      res.json({ message: "Transaksi berhasil dihapus" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menghapus transaksi" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/balance/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const balance = await storage.getUserBalance(userId);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data saldo" });
    }
  });

  app.get("/api/analytics/categories/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const categories = await storage.getUserCategoryStats(userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil statistik kategori" });
    }
  });

  app.get("/api/analytics/transactions/:userId/range", async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate dan endDate diperlukan" });
      }

      const transactions = await storage.getUserTransactionsByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil data transaksi berdasarkan rentang tanggal" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
