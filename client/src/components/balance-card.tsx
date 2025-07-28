import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { AuthUser } from "@/lib/auth";

interface BalanceCardProps {
  user: AuthUser;
}

export default function BalanceCard({ user }: BalanceCardProps) {
  const { data: balance, isLoading } = useQuery<{ balance: number; income: number; expense: number }>({
    queryKey: ['/api/analytics/balance', user.id],
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary to-emerald-600">
        <CardContent className="p-6 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-white bg-opacity-20 rounded mb-4"></div>
            <div className="h-6 bg-white bg-opacity-20 rounded mb-2"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBalance = balance?.balance || 0;
  const monthlyIncome = balance?.income || 0;
  const monthlyExpense = balance?.expense || 0;
  const monthlyTarget = Number(user.monthlyTarget);
  const targetProgress = monthlyTarget > 0 ? Math.min((currentBalance / monthlyTarget) * 100, 100) : 0;

  return (
    <Card className="bg-gradient-to-r from-primary to-emerald-600">
      <CardContent className="p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-emerald-100 text-sm">💰 Saldo Saat Ini</p>
            <p className="text-3xl font-bold">{formatCurrency(currentBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-sm">🎯 Progress Target</p>
            <p className="text-xl font-semibold">{Math.round(targetProgress)}%</p>
          </div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full h-3 mb-4">
          <div 
            className="bg-white rounded-full h-3 transition-all duration-300" 
            style={{ width: `${targetProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="flex items-center">
            <span className="text-2xl mr-2">📈</span>
            <span>{formatCurrency(monthlyIncome)}</span>
          </span>
          <span className="flex items-center">
            <span className="text-2xl mr-2">📉</span>
            <span>{formatCurrency(monthlyExpense)}</span>
          </span>
        </div>
        
        {/* Warning System */}
        {monthlyIncome > 0 && (monthlyExpense / monthlyIncome) > 0.7 && (
          <div className="mt-4 p-3 bg-red-500 bg-opacity-20 rounded-xl border border-red-300 border-opacity-20">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-semibold text-sm">Peringatan Pengeluaran!</p>
                <p className="text-xs">Pengeluaran sudah mencapai {Math.round((monthlyExpense / monthlyIncome) * 100)}% dari pemasukan</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
