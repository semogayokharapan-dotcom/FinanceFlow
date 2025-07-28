import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { formatCurrency } from '@/lib/format';

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

  // Mock data - replace with actual API calls
  const dailyData: DailyData[] = [
    { date: '2025-01-25', income: 500000, expense: 150000, balance: 350000 },
    { date: '2025-01-26', income: 0, expense: 75000, balance: 275000 },
    { date: '2025-01-27', income: 200000, expense: 100000, balance: 375000 },
    { date: '2025-01-28', income: 0, expense: 50000, balance: 325000 },
  ];

  const weeklyData: WeeklyData[] = [
    { week: 'Minggu 1', income: 2500000, expense: 800000, balance: 1700000 },
    { week: 'Minggu 2', income: 1500000, expense: 600000, balance: 2600000 },
    { week: 'Minggu 3', income: 3000000, expense: 750000, balance: 4850000 },
    { week: 'Minggu 4', income: 700000, expense: 375000, balance: 5175000 },
  ];

  const monthlyData: MonthlyData[] = [
    { month: 'Oktober', income: 7500000, expense: 2800000, balance: 4700000 },
    { month: 'November', income: 8200000, expense: 3100000, balance: 9800000 },
    { month: 'Desember', income: 6800000, expense: 4200000, balance: 12400000 },
    { month: 'Januari', income: 7700000, expense: 2525000, balance: 17575000 },
  ];

  const getCurrentData = () => {
    switch (viewType) {
      case 'daily': return dailyData;
      case 'weekly': return weeklyData;
      case 'monthly': return monthlyData;
      default: return dailyData;
    }
  };

  const getMaxValue = (data: any[]) => {
    const values = data.flatMap(d => [d.income, d.expense]);
    return Math.max(...values);
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
                {formatCurrency(currentData.reduce((sum, item) => sum + item.income, 0))}
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
                {formatCurrency(currentData.reduce((sum, item) => sum + item.expense, 0))}
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
                  • Rata-rata pengeluaran harian: <span className="font-medium">{formatCurrency(currentData.reduce((sum, item) => sum + item.expense, 0) / currentData.length)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  • Hari dengan pengeluaran tertinggi: <span className="font-medium">
                    {(currentData as DailyData[]).reduce((max, item) => item.expense > max.expense ? item : max).date}
                  </span>
                </div>
              </>
            )}
            {viewType === 'weekly' && (
              <>
                <div className="text-sm text-gray-600">
                  • Rata-rata surplus mingguan: <span className="font-medium text-green-600">
                    {formatCurrency((currentData.reduce((sum, item) => sum + item.income, 0) - currentData.reduce((sum, item) => sum + item.expense, 0)) / currentData.length)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  • Minggu terbaik: <span className="font-medium">
                    {(currentData as WeeklyData[]).reduce((max, item) => (item.income - item.expense) > (max.income - max.expense) ? item : max).week}
                  </span>
                </div>
              </>
            )}
            {viewType === 'monthly' && (
              <>
                <div className="text-sm text-gray-600">
                  • Pertumbuhan saldo: <span className="font-medium text-green-600">
                    +{formatCurrency(currentData[currentData.length - 1].balance - currentData[0].balance)} dalam 4 bulan
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  • Bulan dengan surplus tertinggi: <span className="font-medium">
                    {(currentData as MonthlyData[]).reduce((max, item) => (item.income - item.expense) > (max.income - max.expense) ? item : max).month}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}