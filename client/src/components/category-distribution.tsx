import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCategoryEmoji, getCategoryName } from "@/lib/format";

interface CategoryDistributionProps {
  userId: string;
}

export default function CategoryDistribution({ userId }: CategoryDistributionProps) {
  const { data: categories, isLoading } = useQuery<Array<{ category: string; total: number; count: number }>>({
    queryKey: ['/api/analytics/categories', userId],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Distribusi Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-3"></div>
                  <div className="h-4 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Distribusi Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>Belum ada data pengeluaran</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalExpense = categories.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Distribusi Pengeluaran</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => {
            const percentage = totalExpense > 0 ? (category.total / totalExpense) * 100 : 0;
            const colorClass = getColorClass(category.category);
            
            return (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCategoryEmoji(category.category)}</span>
                  <span className="font-medium">{getCategoryName(category.category)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${colorClass} rounded-full h-3 transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getColorClass(category: string): string {
  const colors: Record<string, string> = {
    food: 'bg-red-500',
    transport: 'bg-yellow-500',
    shopping: 'bg-blue-500',
    entertainment: 'bg-purple-500',
    bills: 'bg-green-500',
    other: 'bg-gray-500',
  };
  return colors[category] || 'bg-gray-500';
}
