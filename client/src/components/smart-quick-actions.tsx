import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronUp, Edit3, Check, X } from "lucide-react";
import type { InsertTransaction } from "@shared/schema";

interface SmartQuickActionsProps {
  userId: string;
}

interface CategoryAverage {
  type: string;
  category: string;
  averageAmount: number;
  transactionCount: number;
}

interface QuickActionTemplate {
  id: string;
  emoji: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  description: string;
  isEditable?: boolean;
}

export default function SmartQuickActions({ userId }: SmartQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's category averages
  const { data: averages } = useQuery({
    queryKey: ['/api/analytics/averages', userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/analytics/averages/${userId}`);
      return response.json() as Promise<CategoryAverage[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const quickTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", `/api/transactions/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/balance', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/averages', userId] });
      
      toast({
        title: "✅ Transaksi Cepat Berhasil!",
        description: "Transaksi telah ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal",
        description: "Terjadi kesalahan saat menambah transaksi",
        variant: "destructive",
      });
    },
  });

  // Create default templates
  const getDefaultTemplates = (): QuickActionTemplate[] => [
    // Default expense templates
    { 
      id: 'food', 
      emoji: '🍔', 
      name: 'Makan', 
      amount: 25000, 
      category: 'food', 
      type: 'expense',
      description: 'Makan' 
    },
    { 
      id: 'transport', 
      emoji: '🚗', 
      name: 'Transport', 
      amount: 15000, 
      category: 'transport', 
      type: 'expense',
      description: 'Transport' 
    },
    { 
      id: 'coffee', 
      emoji: '☕', 
      name: 'Kopi', 
      amount: 12000, 
      category: 'food', 
      type: 'expense',
      description: 'Kopi' 
    },
    // Default income templates
    { 
      id: 'salary', 
      emoji: '💼', 
      name: 'Gaji', 
      amount: 5000000, 
      category: 'salary', 
      type: 'income',
      description: 'Gaji bulanan' 
    },
  ];

  // Smart templates that learn from user behavior
  const getSmartTemplates = (): QuickActionTemplate[] => {
    if (!averages || averages.length === 0) {
      return getDefaultTemplates();
    }

    const templates: QuickActionTemplate[] = [];
    
    // Map of category to emoji and name
    const categoryInfo: Record<string, { emoji: string; name: string }> = {
      food: { emoji: '🍔', name: 'Makan' },
      transport: { emoji: '🚗', name: 'Transport' },
      shopping: { emoji: '🛍️', name: 'Belanja' },
      entertainment: { emoji: '🎬', name: 'Hiburan' },
      bills: { emoji: '📱', name: 'Tagihan' },
      other: { emoji: '📦', name: 'Lain-lain' },
      salary: { emoji: '💼', name: 'Gaji' },
      freelance: { emoji: '💻', name: 'Freelance' },
      business: { emoji: '🏢', name: 'Bisnis' },
      investment: { emoji: '📈', name: 'Investasi' },
      bonus: { emoji: '🎁', name: 'Bonus' },
    };

    // Create templates from user's most used categories
    const sortedAverages = averages
      .filter(avg => avg.transactionCount >= 2) // Only show categories used at least twice
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 8); // Limit to 8 most used

    sortedAverages.forEach(avg => {
      const info = categoryInfo[avg.category] || { emoji: '📦', name: avg.category };
      templates.push({
        id: `${avg.type}_${avg.category}`,
        emoji: info.emoji,
        name: info.name,
        amount: avg.averageAmount,
        category: avg.category,
        type: avg.type as 'income' | 'expense',
        description: `${info.name} (${avg.transactionCount}x)`,
        isEditable: true
      });
    });

    // If not enough smart templates, add some defaults
    if (templates.length < 4) {
      const defaults = getDefaultTemplates();
      defaults.forEach(def => {
        if (!templates.find(t => t.category === def.category && t.type === def.type)) {
          templates.push(def);
        }
      });
    }

    return templates.slice(0, 8);
  };

  const templates = getSmartTemplates();
  const expenseTemplates = templates.filter(t => t.type === 'expense');
  const incomeTemplates = templates.filter(t => t.type === 'income');

  const handleQuickTransaction = (template: QuickActionTemplate, customAmount?: number) => {
    const amount = customAmount || template.amount;
    quickTransactionMutation.mutate({
      amount: amount.toString(),
      type: template.type,
      category: template.category as any,
      description: template.description,
      date: new Date(),
    });
  };

  const handleEditStart = (templateId: string, currentAmount: number) => {
    setEditingId(templateId);
    setEditAmount(currentAmount.toString());
  };

  const handleEditConfirm = (template: QuickActionTemplate) => {
    const newAmount = parseInt(editAmount);
    if (newAmount && newAmount > 0) {
      handleQuickTransaction(template, newAmount);
    }
    setEditingId(null);
    setEditAmount("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditAmount("");
  };

  return (
    <Card className="shadow-sm border-l-4 border-l-blue-500">
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            📋 Aksi Cepat
            {averages && averages.length > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                Smart
              </span>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {isExpanded ? 'Tutup' : 'Buka'}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {/* Expense Templates */}
          {expenseTemplates.length > 0 && (
            <div className="mb-4">
              <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="text-lg mr-2">📉</span>Pengeluaran Cepat
              </h6>
              <div className="grid grid-cols-2 gap-3">
                {expenseTemplates.map((template) => (
                  <div key={template.id} className="relative">
                    {editingId === template.id ? (
                      <div className="p-3 border border-blue-300 rounded-xl bg-blue-50">
                        <div className="text-center mb-2">
                          <div className="text-2xl mb-1">{template.emoji}</div>
                          <div className="text-sm font-medium">{template.name}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Jumlah"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditConfirm(template)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={handleEditCancel}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="relative p-4 h-auto w-full flex flex-col items-center space-y-2 hover:bg-red-50 transition-colors border-gray-200 hover:border-red-300"
                        onClick={() => handleQuickTransaction(template)}
                        disabled={quickTransactionMutation.isPending}
                      >
                        {template.isEditable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStart(template.id, template.amount);
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                        <div className="text-3xl">{template.emoji}</div>
                        <div className="text-sm font-medium text-gray-800">{template.name}</div>
                        <div className="text-xs text-red-600">
                          -Rp {template.amount.toLocaleString('id-ID')}
                        </div>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income Templates */}
          {incomeTemplates.length > 0 && (
            <div className="mb-4">
              <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="text-lg mr-2">📈</span>Pemasukan Cepat
              </h6>
              <div className="grid grid-cols-1 gap-3">
                {incomeTemplates.map((template) => (
                  <div key={template.id}>
                    {editingId === template.id ? (
                      <div className="p-3 border border-green-300 rounded-xl bg-green-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{template.emoji}</span>
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Jumlah"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditConfirm(template)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={handleEditCancel}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="relative p-4 h-auto w-full flex items-center justify-between hover:bg-green-50 transition-colors border-gray-200 hover:border-green-300 group"
                        onClick={() => handleQuickTransaction(template)}
                        disabled={quickTransactionMutation.isPending}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{template.emoji}</span>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-800">{template.name}</div>
                            <div className="text-xs text-gray-500">{template.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-bold text-green-600">
                            +Rp {template.amount.toLocaleString('id-ID')}
                          </div>
                          {template.isEditable && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(template.id, template.amount);
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <div className="text-xs text-blue-700 text-center">
              💡 Aksi cepat belajar dari kebiasaan transaksi Anda. Klik tombol edit untuk mengubah nominal.
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}