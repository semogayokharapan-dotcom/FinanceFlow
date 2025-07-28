import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertTransaction } from "@shared/schema";

interface TransactionFormProps {
  userId: string;
}

export default function TransactionForm({ userId }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", `/api/transactions/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/balance', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/categories', userId] });

      toast({
        title: "✅ Berhasil!",
        description: "Transaksi berhasil ditambahkan",
      });

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Gagal menambahkan transaksi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) {
      toast({
        title: "❌ Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    addTransactionMutation.mutate({
      amount,
      type,
      category: category as "food" | "transport" | "shopping" | "entertainment" | "bills" | "other" | "salary" | "freelance" | "business" | "investment" | "bonus",
      description: description || undefined,
      date: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">📱 Input Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">💰 Jumlah</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="transactionType">📊 Tipe</Label>
              <Select value={type} onValueChange={(value) => {
                setType(value as 'income' | 'expense');
                setCategory(''); // Reset category when type changes
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">📈 Pemasukan</SelectItem>
                  <SelectItem value="expense">📉 Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="category">🏷️ Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {type === 'expense' ? (
                  <>
                    <SelectItem value="food">🍔 Makan</SelectItem>
                    <SelectItem value="transport">🚗 Transport</SelectItem>
                    <SelectItem value="shopping">🛍️ Belanja</SelectItem>
                    <SelectItem value="entertainment">🎬 Hiburan</SelectItem>
                    <SelectItem value="bills">📱 Tagihan</SelectItem>
                    <SelectItem value="other">📦 Lain-lain</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="salary">💼 Gaji</SelectItem>
                    <SelectItem value="freelance">💻 Freelance</SelectItem>
                    <SelectItem value="business">🏢 Bisnis</SelectItem>
                    <SelectItem value="investment">📈 Investasi</SelectItem>
                    <SelectItem value="bonus">🎁 Bonus</SelectItem>
                    <SelectItem value="other">📦 Lain-lain</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">📝 Deskripsi</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsional"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={addTransactionMutation.isPending}
          >
            {addTransactionMutation.isPending ? "⏳ Menambahkan..." : "✅ Tambah Transaksi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}