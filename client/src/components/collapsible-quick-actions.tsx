import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { InsertTransaction } from "@shared/schema";

interface CollapsibleQuickActionsProps {
  userId: string;
}

export default function CollapsibleQuickActions({ userId }: CollapsibleQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
    { 
      id: 'gas', 
      emoji: '⛽', 
      name: 'Bensin', 
      amount: '50000', 
      category: 'transport', 
      description: 'Isi bensin' 
    },
    { 
      id: 'snack', 
      emoji: '🍪', 
      name: 'Snack', 
      amount: '10000', 
      category: 'food', 
      description: 'Jajan' 
    },
  ];

  const handleQuickTransaction = (template: typeof templates[0]) => {
    quickTransactionMutation.mutate({
      amount: template.amount,
      type: 'expense',
      category: template.category as "food" | "transport" | "shopping" | "entertainment" | "bills" | "other",
      description: template.description,
      date: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">📋 Aksi Cepat</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {isExpanded ? 'Sembunyikan' : 'Tampilkan'}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="p-4 h-auto flex flex-col items-center space-y-2 hover:bg-gray-50 transition-colors border-gray-200 hover:border-primary"
                onClick={() => handleQuickTransaction(template)}
                disabled={quickTransactionMutation.isPending}
              >
                <div className="text-3xl">{template.emoji}</div>
                <div className="text-sm font-medium text-gray-800">{template.name}</div>
                <div className="text-xs text-gray-500">Rp {Number(template.amount).toLocaleString('id-ID')}</div>
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💡</span>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Tips:</p>
                <p>Klik template untuk langsung menambahkan transaksi dengan jumlah yang sudah ditentukan</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}