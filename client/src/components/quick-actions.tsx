import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertTransaction } from "@shared/schema";

interface QuickActionsProps {
  userId: string;
}

export default function QuickActions({ userId }: QuickActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quickTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", `/api/transactions/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/balance', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/categories', userId] });
      
      toast({
        title: "✅ Transaksi Cepat Berhasil!",
        description: "Transaksi telah ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Gagal menambahkan transaksi",
        variant: "destructive",
      });
    },
  });

  const templates = [
    { 
      id: 'breakfast', 
      emoji: '🥞', 
      name: 'Sarapan', 
      amount: '20000', 
      category: 'food', 
      description: 'Sarapan pagi' 
    },
    { 
      id: 'coffee', 
      emoji: '☕', 
      name: 'Kopi', 
      amount: '15000', 
      category: 'food', 
      description: 'Kopi sore' 
    },
    { 
      id: 'ojek', 
      emoji: '🏍️', 
      name: 'Ojek', 
      amount: '12000', 
      category: 'transport', 
      description: 'Ojek/Grab' 
    },
    { 
      id: 'lunch', 
      emoji: '🍽️', 
      name: 'Makan Siang', 
      amount: '35000', 
      category: 'food', 
      description: 'Makan siang' 
    },
  ];

  const handleQuickTransaction = (template: typeof templates[0]) => {
    quickTransactionMutation.mutate({
      amount: template.amount,
      type: 'expense',
      category: template.category as any,
      description: template.description,
      date: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Aksi Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="p-4 h-auto flex flex-col items-center space-y-2 hover:bg-gray-50 transition-colors"
              onClick={() => handleQuickTransaction(template)}
              disabled={quickTransactionMutation.isPending}
            >
              <div className="text-3xl">{template.emoji}</div>
              <div className="text-sm font-medium">{template.name}</div>
              <div className="text-xs text-gray-500">~Rp {Number(template.amount).toLocaleString('id-ID')}</div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
