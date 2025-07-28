import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

interface WeeklyReportProps {
  userId: string;
}

interface WeeklyStat {
  week: string;
  income: number;
  expense: number;
  balance: number;
  startDate: string;
  endDate: string;
}

export default function WeeklyReport({ userId }: WeeklyReportProps) {
  const { data: weeklyStats, isLoading } = useQuery<WeeklyStat[]>({
    queryKey: ['/api/analytics/weekly', userId],
    queryFn: () => fetch(`/api/analytics/weekly/${userId}?weeks=4`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800">📊 Ringkasan Mingguan</h4>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!weeklyStats || weeklyStats.length === 0) {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800">📊 Ringkasan Mingguan</h4>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Belum ada data mingguan</p>
        </div>
      </div>
    );
  }

  const totalIncome = weeklyStats.reduce((sum, week) => sum + week.income, 0);
  const totalExpense = weeklyStats.reduce((sum, week) => sum + week.expense, 0);
  const avgWeeklyExpense = totalExpense / weeklyStats.length;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">📊 Ringkasan Mingguan</h4>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-2xl mb-2">📈</div>
          <div className="text-sm text-gray-600">Total Pemasukan (4 Minggu)</div>
          <div className="font-bold text-success">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="text-2xl mb-2">📉</div>
          <div className="text-sm text-gray-600">Rata-rata per Minggu</div>
          <div className="font-bold text-danger">{formatCurrency(avgWeeklyExpense)}</div>
        </div>
      </div>

      {/* Weekly Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h5 className="font-semibold text-gray-800">📈 Tren Mingguan</h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Periode</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Pemasukan</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Pengeluaran</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {weeklyStats.map((week, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{week.week}</td>
                  <td className="px-4 py-3 text-right text-success font-medium">
                    {formatCurrency(week.income)}
                  </td>
                  <td className="px-4 py-3 text-right text-danger font-medium">
                    {formatCurrency(week.expense)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    week.balance >= 0 ? 'text-success' : 'text-danger'
                  }`}>
                    {formatCurrency(week.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h5 className="font-semibold text-gray-800 mb-3">📈 Analisis Tren</h5>
        <div className="space-y-2 text-sm">
          {weeklyStats.length >= 2 && (
            <>
              {(() => {
                const thisWeek = weeklyStats[0];
                const lastWeek = weeklyStats[1];
                const expenseChange = thisWeek.expense - lastWeek.expense;
                const expenseChangePercent = lastWeek.expense > 0 ? (expenseChange / lastWeek.expense) * 100 : 0;
                
                return (
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg ${expenseChange > 0 ? '📈' : '📉'}`}>
                      {expenseChange > 0 ? '📈' : '📉'}
                    </span>
                    <span className={expenseChange > 0 ? 'text-red-700' : 'text-green-700'}>
                      Pengeluaran {expenseChange > 0 ? 'naik' : 'turun'} {Math.abs(expenseChangePercent).toFixed(1)}% 
                      dari minggu lalu ({formatCurrency(Math.abs(expenseChange))})
                    </span>
                  </div>
                );
              })()}
              
              {(() => {
                const positiveWeeks = weeklyStats.filter(w => w.balance > 0).length;
                const positivePercentage = (positiveWeeks / weeklyStats.length) * 100;
                
                return (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🎯</span>
                    <span className={positivePercentage >= 75 ? 'text-green-700' : positivePercentage >= 50 ? 'text-yellow-700' : 'text-red-700'}>
                      {positiveWeeks} dari {weeklyStats.length} minggu memiliki saldo positif ({positivePercentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {weeklyStats.length >= 2 && (
        <div className="bg-yellow-50 rounded-xl p-4">
          <h5 className="font-semibold text-gray-800 mb-3">💡 Rekomendasi</h5>
          <div className="space-y-2 text-sm text-yellow-800">
            {(() => {
              const recommendations = [];
              const avgExpense = weeklyStats.reduce((sum, w) => sum + w.expense, 0) / weeklyStats.length;
              const thisWeekExpense = weeklyStats[0].expense;
              
              if (thisWeekExpense > avgExpense * 1.2) {
                recommendations.push("🔥 Pengeluaran minggu ini 20% lebih tinggi dari rata-rata, coba kurangi pengeluaran non-essential");
              }
              
              const negativeWeeks = weeklyStats.filter(w => w.balance < 0).length;
              if (negativeWeeks >= 2) {
                recommendations.push("⚠️ Sering mengalami defisit mingguan, pertimbangkan untuk menambah pemasukan atau mengurangi pengeluaran rutin");
              }
              
              if (recommendations.length === 0) {
                recommendations.push("✅ Pola keuangan mingguan Anda cukup baik, pertahankan kebiasaan ini!");
              }
              
              return recommendations.map((rec, index) => (
                <div key={index}>• {rec}</div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}