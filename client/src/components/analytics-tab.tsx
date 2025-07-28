import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { apiRequest } from '@/lib/queryClient';

interface AnalyticsTabProps {
  userId: string;
}

interface DailyData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

interface WeeklyData {
  week: string;
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export function AnalyticsTab({ userId }: AnalyticsTabProps) {
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Fetch daily analytics data
  const { data: dailyTransactions } = useQuery({
    queryKey: ['/api/analytics/transactions', userId, 'daily'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const response = await apiRequest("GET", `/api/analytics/transactions/${userId}/range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return response.json();
    },
  });

  // Fetch weekly analytics data  
  const { data: weeklyAnalytics } = useQuery({
    queryKey: ['/api/analytics/weekly', userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/analytics/weekly/${userId}`);
      return response.json();
    },
  });

  // Process daily data
  const dailyData: DailyData[] = React.useMemo(() => {
    if (!dailyTransactions || !Array.isArray(dailyTransactions)) return [];

    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTransactions = dailyTransactions.filter((t: any) => 
        t.date && t.date.split('T')[0] === dateStr
      );

      const income = dayTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const expense = dayTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      last7Days.push({
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        income,
        expense,
        balance: income - expense
      });
    }

    return last7Days;
  }, [dailyTransactions]);

  // Process weekly data
  const weeklyData: WeeklyData[] = React.useMemo(() => {
    if (!weeklyAnalytics || !Array.isArray(weeklyAnalytics)) return [];

    return weeklyAnalytics.map((week: any, index: number) => ({
      week: week.week || `Minggu ${index + 1}`,
      income: week.income || 0,
      expense: week.expense || 0,
      balance: week.balance || 0
    }));
  }, [weeklyAnalytics]);

  // Generate monthly data from available transactions
  const monthlyData: MonthlyData[] = React.useMemo(() => {
    if (!dailyTransactions || !Array.isArray(dailyTransactions)) return [];

    const monthlyStats: Record<string, { income: number; expense: number }> = {};

    dailyTransactions.forEach((transaction: any) => {
      if (!transaction.date) return;

      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { income: 0, expense: 0 };
      }

      const amount = parseFloat(transaction.amount) || 0;
      if (transaction.type === 'income') {
        monthlyStats[monthKey].income += amount;
      } else {
        monthlyStats[monthKey].expense += amount;
      }
    });

    return Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      income: stats.income,
      expense: stats.expense,
      balance: stats.income - stats.expense
    }));
  }, [dailyTransactions]);

  const getCurrentData = () => {
    switch (viewType) {
      case 'daily': return dailyData;
      case 'weekly': return weeklyData;
      case 'monthly': return monthlyData;
      default: return dailyData;
    }
  };

  const getMaxValue = (data: any[]) => {
    if (!data || data.length === 0) return 100;
    const values = data.flatMap(d => [d.income || 0, d.expense || 0]);
    const maxVal = Math.max(...values);
    return maxVal > 0 ? maxVal : 100;
  };

  const currentData = getCurrentData();
  const maxValue = getMaxValue(currentData);

  return (
    <div className="space-y-4">
      {/* Period Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            📊 Analisa Keuangan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewType === 'daily' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setViewType('daily')}
            >
              📅 Harian
            </Button>
            <Button
              variant={viewType === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setViewType('weekly')}
            >
              📊 Mingguan
            </Button>
            <Button
              variant={viewType === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setViewType('monthly')}
            >
              📈 Bulanan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {viewType === 'daily' && '📅 Grafik Harian'}
            {viewType === 'weekly' && '📊 Grafik Mingguan'}
            {viewType === 'monthly' && '📈 Grafik Bulanan'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentData.map((item: any, index) => {
              const period = (item as any).date || (item as any).week || (item as any).month;
              const incomeWidth = (item.income / maxValue) * 100;
              const expenseWidth = (item.expense / maxValue) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{period}</span>
                    <span className="text-green-600">
                      {formatCurrency(item.balance)}
                    </span>
                  </div>

                  {/* Income Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">📈 Pemasukan</span>
                      <span className="text-green-600">{formatCurrency(item.income)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${incomeWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Expense Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-red-600">📉 Pengeluaran</span>
                      <span className="text-red-600">{formatCurrency(item.expense)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${expenseWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-xs text-gray-600 mb-1">Total Pemasukan</div>
              <div className="font-bold text-green-600">
                {formatCurrency(currentData.length > 0 ? currentData.reduce((sum, item) => sum + (item.income || 0), 0) : 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📉</div>
              <div className="text-xs text-gray-600 mb-1">Total Pengeluaran</div>
              <div className="font-bold text-red-600">
                {formatCurrency(currentData.length > 0 ? currentData.reduce((sum, item) => sum + (item.expense || 0), 0) : 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">💡 Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {viewType === 'daily' && (
              <>
                <div className="text-sm text-gray-600">
                  • Rata-rata pengeluaran harian: <span className="font-medium">
                    {formatCurrency(currentData.length > 0 ? currentData.reduce((sum, item) => sum + (item.expense || 0), 0) / currentData.length : 0)}
                  </span>
                </div>
                {currentData.length > 0 && (
                  <div className="text-sm text-gray-600">
                    • Hari dengan pengeluaran tertinggi: <span className="font-medium">
                      {(currentData as DailyData[]).reduce((max, item) => (item.expense || 0) > (max.expense || 0) ? item : max).date}
                    </span>
                  </div>
                )}
              </>
            )}
            {viewType === 'weekly' && (
              <>
                <div className="text-sm text-gray-600">
                  • Rata-rata surplus mingguan: <span className="font-medium text-green-600">
                    {currentData.length > 0 ? formatCurrency((currentData.reduce((sum, item) => sum + (item.income || 0), 0) - currentData.reduce((sum, item) => sum + (item.expense || 0), 0)) / currentData.length) : formatCurrency(0)}
                  </span>
                </div>
                {currentData.length > 0 && (
                  <div className="text-sm text-gray-600">
                    • Minggu terbaik: <span className="font-medium">
                      {(currentData as WeeklyData[]).reduce((max, item) => ((item.income || 0) - (item.expense || 0)) > ((max.income || 0) - (max.expense || 0)) ? item : max).week}
                    </span>
                  </div>
                )}
              </>
            )}
            {viewType === 'monthly' && (
              <>
                {currentData.length >= 2 && (
                  <>
                    <div className="text-sm text-gray-600">
                      • Pertumbuhan saldo: <span className="font-medium text-green-600">
                        +{formatCurrency((currentData[currentData.length - 1]?.balance || 0) - (currentData[0]?.balance || 0))} dalam {currentData.length} bulan
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      • Bulan dengan surplus tertinggi: <span className="font-medium">
                        {(currentData as MonthlyData[]).reduce((max, item) => ((item.income || 0) - (item.expense || 0)) > ((max.income || 0) - (max.expense || 0)) ? item : max).month}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}