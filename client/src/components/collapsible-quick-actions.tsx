import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronUp, Edit3, Check, X, Calculator } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { InsertTransaction } from "@shared/schema";

interface CollapsibleQuickActionsProps {
  userId: string;
}

export default function CollapsibleQuickActions({ userId }: CollapsibleQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof allTemplates[0] | null>(null);
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

  const expenseTemplates = [
    { 
      id: 'breakfast', 
      emoji: '🥞', 
      name: 'Sarapan', 
      amount: '20000', 
      category: 'food', 
      type: 'expense' as const,
      description: 'Sarapan pagi',
      isEditable: true
    },
    { 
      id: 'coffee', 
      emoji: '☕', 
      name: 'Kopi', 
      amount: '15000', 
      category: 'food', 
      type: 'expense' as const,
      description: 'Kopi sore',
      isEditable: true
    },
    { 
      id: 'ojek', 
      emoji: '🏍️', 
      name: 'Ojek', 
      amount: '12000', 
      category: 'transport', 
      type: 'expense' as const,
      description: 'Ojek/Grab',
      isEditable: true
    },
    { 
      id: 'lunch', 
      emoji: '🍽️', 
      name: 'Makan Siang', 
      amount: '35000', 
      category: 'food', 
      type: 'expense' as const,
      description: 'Makan siang',
      isEditable: true
    },
    { 
      id: 'gas', 
      emoji: '⛽', 
      name: 'Bensin', 
      amount: '50000', 
      category: 'transport', 
      type: 'expense' as const,
      description: 'Isi bensin',
      isEditable: true
    },
    { 
      id: 'snack', 
      emoji: '🍪', 
      name: 'Snack', 
      amount: '10000', 
      category: 'food', 
      type: 'expense' as const,
      description: 'Jajan',
      isEditable: true
    },
  ];

  const incomeTemplates = [
    { 
      id: 'salary', 
      emoji: '💼', 
      name: 'Gaji', 
      amount: '5000000', 
      category: 'salary', 
      type: 'income' as const,
      description: 'Gaji bulanan',
      isEditable: true
    },
    { 
      id: 'freelance', 
      emoji: '💻', 
      name: 'Freelance', 
      amount: '1500000', 
      category: 'freelance', 
      type: 'income' as const,
      description: 'Projek freelance',
      isEditable: true
    },
    { 
      id: 'bonus', 
      emoji: '🎁', 
      name: 'Bonus', 
      amount: '500000', 
      category: 'bonus', 
      type: 'income' as const,
      description: 'Bonus kerja',
      isEditable: true
    },
  ];

  const allTemplates = [...expenseTemplates, ...incomeTemplates];

  const handleQuickTransaction = (template: typeof allTemplates[0], customAmount?: number) => {
    const amount = customAmount ? customAmount.toString() : template.amount;
    quickTransactionMutation.mutate({
      amount: amount,
      type: template.type,
      category: template.category as "food" | "transport" | "shopping" | "entertainment" | "bills" | "other" | "salary" | "freelance" | "business" | "investment" | "bonus",
      description: template.description,
      date: new Date(),
    });
  };

  const handleEditStart = (template: typeof allTemplates[0]) => {
    setSelectedTemplate(template);
    setEditAmount(template.amount);
    setShowEditDialog(true);
  };

  const handleDirectTransaction = () => {
    if (selectedTemplate) {
      handleQuickTransaction(selectedTemplate);
    }
    setShowEditDialog(false);
    setSelectedTemplate(null);
  };

  const handleEditTransaction = () => {
    if (selectedTemplate) {
      setEditingId(selectedTemplate.id);
      setEditAmount(selectedTemplate.amount);
    }
    setShowEditDialog(false);
  };

  const handleEditConfirm = (template: typeof allTemplates[0]) => {
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
          {/* Expense Templates */}
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
                    <div className="relative p-4 h-auto w-full flex flex-col items-center space-y-2 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors hover:border-red-300 group cursor-pointer">
                      {template.isEditable && (
                        <span
                          className="absolute top-1 right-1 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-100 rounded flex items-center justify-center z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart(template);
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </span>
                      )}
                      <div className="text-3xl">{template.emoji}</div>
                      <div className="text-sm font-medium text-gray-800">{template.name}</div>
                      <div className="text-xs text-red-600">-Rp {Number(template.amount).toLocaleString('id-ID')}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Income Templates */}
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
                    <div className="relative p-4 h-auto w-full flex items-center justify-between border border-gray-200 rounded-lg hover:bg-green-50 transition-colors hover:border-green-300 group cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{template.emoji}</span>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-800">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-bold text-green-600">
                          +Rp {Number(template.amount).toLocaleString('id-ID')}
                        </div>
                        {template.isEditable && (
                          <span
                            className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-100 rounded flex items-center justify-center z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStart(template);
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <div className="text-xs text-blue-700 text-center">
              💡 Klik ikon edit (✏️) untuk melakukan transaksi atau mengubah nominal terlebih dahulu.
            </div>
          </div>
        </CardContent>
      )}

      {/* Alert Dialog untuk konfirmasi edit */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">{selectedTemplate?.emoji}</span>
              <span>Pilih Aksi untuk {selectedTemplate?.name}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Nominal saat ini: <span className="font-semibold text-blue-600">
                Rp {selectedTemplate ? Number(selectedTemplate.amount).toLocaleString('id-ID') : '0'}
              </span>
              <br />
              Apa yang ingin Anda lakukan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
            </AlertDialogCancel>
            <Button 
              variant="default" 
              onClick={handleDirectTransaction}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Langsung Simpan
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleEditTransaction}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Edit Nominal Dulu
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}