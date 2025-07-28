import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronRight } from "lucide-react";
import type { InsertTransaction } from "@shared/schema";

interface TemplatesTabProps {
  userId: string;
  onSwitchTab: () => void;
}

export default function TemplatesTab({ userId, onSwitchTab }: TemplatesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useTemplateMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", `/api/transactions/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/balance', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/categories', userId] });
      
      toast({
        title: "✅ Template Berhasil Digunakan!",
        description: "Transaksi telah ditambahkan dari template",
      });
      
      // Switch to dashboard to show the new transaction
      onSwitchTab();
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Gagal menggunakan template",
        variant: "destructive",
      });
    },
  });

  const categories = [
    { emoji: '🍔', name: 'Makan', color: 'bg-red-50' },
    { emoji: '🚗', name: 'Transport', color: 'bg-blue-50' },
    { emoji: '🛍️', name: 'Belanja', color: 'bg-purple-50' },
    { emoji: '🎬', name: 'Hiburan', color: 'bg-yellow-50' },
    { emoji: '📱', name: 'Tagihan', color: 'bg-green-50' },
    { emoji: '📦', name: 'Lain-lain', color: 'bg-gray-50' },
  ];

  const templates = [
    { 
      emoji: '🥞', 
      name: 'Sarapan Pagi', 
      category: 'food', 
      amount: '20000', 
      description: 'Sarapan pagi', 
      color: 'bg-yellow-50 hover:bg-yellow-100' 
    },
    { 
      emoji: '☕', 
      name: 'Kopi Sore', 
      category: 'food', 
      amount: '15000', 
      description: 'Kopi sore', 
      color: 'bg-amber-50 hover:bg-amber-100' 
    },
    { 
      emoji: '🏍️', 
      name: 'Ojek/Grab', 
      category: 'transport', 
      amount: '12000', 
      description: 'Ojek/Grab', 
      color: 'bg-blue-50 hover:bg-blue-100' 
    },
  ];

  const tips = [
    { emoji: '⚡', text: 'Widget Home Screen untuk akses cepat', color: 'bg-blue-50' },
    { emoji: '🔄', text: 'Swipe kiri pada transaksi untuk hapus', color: 'bg-green-50' },
    { emoji: '📱', text: 'Mode Portrait: Input data cepat', color: 'bg-yellow-50' },
    { emoji: '📱', text: 'Mode Landscape: Lihat grafik', color: 'bg-purple-50' },
    { emoji: '🔄', text: 'Pull-to-refresh untuk update data', color: 'bg-pink-50' },
  ];

  const handleUseTemplate = (template: typeof templates[0]) => {
    useTemplateMutation.mutate({
      amount: template.amount,
      type: 'expense',
      category: template.category as any,
      description: template.description,
      date: new Date(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle>🏷️ Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <div key={category.name} className={`text-center p-3 ${category.color} rounded-xl`}>
                <div className="text-3xl mb-2">{category.emoji}</div>
                <div className="text-sm font-medium">{category.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Template Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                className={`w-full flex items-center justify-between p-4 h-auto ${template.color} border-transparent transition-colors`}
                onClick={() => handleUseTemplate(template)}
                disabled={useTemplateMutation.isPending}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{template.emoji}</span>
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-500">
                      {getCategoryName(template.category)} • Rp {Number(template.amount).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Tips */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Tips Mobile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {tips.map((tip, index) => (
              <div key={index} className={`flex items-center space-x-3 p-3 ${tip.color} rounded-xl`}>
                <span className="text-xl">{tip.emoji}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    food: 'Makan',
    transport: 'Transport',
    shopping: 'Belanja',
    entertainment: 'Hiburan',
    bills: 'Tagihan',
    other: 'Lain-lain',
  };
  return names[category] || 'Lain-lain';
}
