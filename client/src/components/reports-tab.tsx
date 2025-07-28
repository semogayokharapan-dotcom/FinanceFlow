import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { Transaction } from "@shared/schema";

interface ReportsTabProps {
  userId: string;
}

export default function ReportsTab({ userId }: ReportsTabProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data: balance } = useQuery({
    queryKey: ['/api/analytics/balance', userId],
  });

  const { data: categories } = useQuery<Array<{ category: string; total: number; count: number }>>({
    queryKey: ['/api/analytics/categories', userId],
  });

  // Get today's date range for daily report
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const { data: todayTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/analytics/transactions', userId, 'range', startOfDay.toISOString(), endOfDay.toISOString()],
    queryFn: () => 
      fetch(`/api/analytics/transactions/${userId}/range?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`)
        .then(res => res.json()),
  });

  const todayIncome = todayTransactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const todayExpense = todayTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const todayBalance = todayIncome - todayExpense;

  const monthlyIncome = balance?.income || 0;
  const expenseRatio = monthlyIncome > 0 ? (todayExpense / monthlyIncome) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📅 Laporan</h3>
            <div className="text-sm text-gray-500">🔄 Putar ke landscape untuk tampilan lebih baik</div>
          </div>
          
          {/* Period Selector */}
          <div className="flex space-x-2 mb-6">
            <Button
              variant={period === 'daily' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setPeriod('daily')}
            >
              📊 Harian
            </Button>
            <Button
              variant={period === 'weekly' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setPeriod('weekly')}
            >
              📈 Mingguan
            </Button>
            <Button
              variant={period === 'monthly' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setPeriod('monthly')}
            >
              📅 Bulanan
            </Button>
          </div>

          {/* Daily Report */}
          {period === 'daily' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">📊 Ringkasan Hari Ini</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl mb-1">📈</div>
                    <div className="text-sm text-gray-600">Pemasukan</div>
                    <div className="font-bold text-success">{formatCurrency(todayIncome)}</div>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">📉</div>
                    <div className="text-sm text-gray-600">Pengeluaran</div>
                    <div className="font-bold text-danger">{formatCurrency(todayExpense)}</div>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-sm text-gray-600">Saldo</div>
                    <div className={`font-bold ${todayBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(todayBalance)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Warning System */}
              {expenseRatio > 70 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <h5 className="font-semibold text-red-800">Peringatan Pengeluaran!</h5>
                      <p className="text-sm text-red-600">
                        Pengeluaran hari ini sudah mencapai {Math.round(expenseRatio)}% dari rata-rata harian
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weekly Report */}
          {period === 'weekly' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">📊 Ringkasan Mingguan</h4>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🚧</div>
                <p>Fitur laporan mingguan</p>
                <p className="text-sm">Akan segera tersedia</p>
              </div>
            </div>
          )}

          {/* Monthly Report */}
          {period === 'monthly' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">📅 Laporan Bulanan</h4>
              
              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-sm text-gray-600">Total Pemasukan</div>
                  <div className="font-bold text-success">{formatCurrency(balance?.income || 0)}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="text-2xl mb-2">📉</div>
                  <div className="text-sm text-gray-600">Total Pengeluaran</div>
                  <div className="font-bold text-danger">{formatCurrency(balance?.expense || 0)}</div>
                </div>
              </div>

              {/* Top Expenses */}
              {categories && categories.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3">📉 Top Pengeluaran</h5>
                  <div className="space-y-2">
                    {categories.slice(0, 3).map((category) => (
                      <div key={category.category} className="flex justify-between items-center">
                        <span className="flex items-center space-x-2">
                          <span>{getCategoryEmoji(category.category)}</span>
                          <span className="text-sm">{getCategoryName(category.category)}</span>
                        </span>
                        <span className="font-semibold">{formatCurrency(category.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    entertainment: '🎬',
    bills: '📱',
    other: '📦',
  };
  return emojis[category] || '📦';
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    food: 'Makan & Minum',
    transport: 'Transport',
    shopping: 'Belanja',
    entertainment: 'Hiburan',
    bills: 'Tagihan',
    other: 'Lain-lain',
  };
  return names[category] || 'Lain-lain';
}
