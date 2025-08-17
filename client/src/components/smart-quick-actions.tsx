
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronUp, Edit3, Check, X, Calculator, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  isCustom?: boolean;
}

export default function SmartQuickActions({ userId }: SmartQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickActionTemplate | null>(null);
  const [customTemplates, setCustomTemplates] = useState<QuickActionTemplate[]>([]);
  
  // Form state for new template
  const [newTemplate, setNewTemplate] = useState({
    emoji: '📦',
    name: '',
    amount: '',
    category: 'other',
    type: 'expense' as 'income' | 'expense',
    description: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load custom templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`custom-templates-${userId}`);
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    }
  }, [userId]);

  // Save custom templates to localStorage
  const saveCustomTemplates = (templates: QuickActionTemplate[]) => {
    setCustomTemplates(templates);
    localStorage.setItem(`custom-templates-${userId}`, JSON.stringify(templates));
  };

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
      return [...getDefaultTemplates(), ...customTemplates];
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
      .slice(0, 6); // Limit to 6 most used

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

    // Add custom templates
    templates.push(...customTemplates);

    // If not enough smart templates, add some defaults
    if (templates.length < 4) {
      const defaults = getDefaultTemplates();
      defaults.forEach(def => {
        if (!templates.find(t => t.category === def.category && t.type === def.type)) {
          templates.push(def);
        }
      });
    }

    return templates.slice(0, 10);
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

  const handleTemplateClick = (template: QuickActionTemplate) => {
    setSelectedTemplate(template);
    setEditAmount(template.amount.toString());
    setShowEditDialog(true);
  };

  const handleEditStart = (template: QuickActionTemplate) => {
    setSelectedTemplate(template);
    setEditAmount(template.amount.toString());
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
      setEditAmount(selectedTemplate.amount.toString());
    }
    setShowEditDialog(false);
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

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.amount) {
      toast({
        title: "❌ Error",
        description: "Nama dan jumlah harus diisi",
        variant: "destructive",
      });
      return;
    }

    const template: QuickActionTemplate = {
      id: `custom_${Date.now()}`,
      emoji: newTemplate.emoji,
      name: newTemplate.name,
      amount: parseInt(newTemplate.amount),
      category: newTemplate.category,
      type: newTemplate.type,
      description: newTemplate.description || newTemplate.name,
      isEditable: true,
      isCustom: true
    };

    const updatedTemplates = [...customTemplates, template];
    saveCustomTemplates(updatedTemplates);

    setNewTemplate({
      emoji: '📦',
      name: '',
      amount: '',
      category: 'other',
      type: 'expense',
      description: ''
    });
    setShowAddDialog(false);

    toast({
      title: "✅ Berhasil!",
      description: "Template baru telah ditambahkan",
    });
  };

  const handleDeleteTemplate = () => {
    if (selectedTemplate?.isCustom) {
      const updatedTemplates = customTemplates.filter(t => t.id !== selectedTemplate.id);
      saveCustomTemplates(updatedTemplates);
      
      toast({
        title: "✅ Berhasil!",
        description: "Template telah dihapus",
      });
    }
    setShowDeleteDialog(false);
    setSelectedTemplate(null);
  };

  const categoryOptions = [
    { value: 'food', label: 'Makanan & Minuman' },
    { value: 'transport', label: 'Transport' },
    { value: 'shopping', label: 'Belanja' },
    { value: 'entertainment', label: 'Hiburan' },
    { value: 'bills', label: 'Tagihan' },
    { value: 'other', label: 'Lain-lain' },
    { value: 'salary', label: 'Gaji' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'business', label: 'Bisnis' },
    { value: 'investment', label: 'Investasi' },
    { value: 'bonus', label: 'Bonus' },
  ];

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
          {/* Add Template Button */}
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Template
            </Button>
          </div>

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
                      <div 
                        className="relative p-4 h-auto w-full flex flex-col items-center space-y-2 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors hover:border-red-300 group cursor-pointer"
                        onClick={() => handleTemplateClick(template)}
                      >
                        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {template.isEditable && (
                            <span
                              className="h-6 w-6 p-1 cursor-pointer hover:bg-gray-100 rounded flex items-center justify-center z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(template);
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                            </span>
                          )}
                          {template.isCustom && (
                            <span
                              className="h-6 w-6 p-1 cursor-pointer hover:bg-red-100 rounded flex items-center justify-center z-10 text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-3xl">{template.emoji}</div>
                        <div className="text-sm font-medium text-gray-800">{template.name}</div>
                        <div className="text-xs text-red-600">
                          -Rp {template.amount.toLocaleString('id-ID')}
                        </div>
                      </div>
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
                      <div 
                        className="relative p-4 h-auto w-full flex items-center justify-between border border-gray-200 rounded-lg hover:bg-green-50 transition-colors hover:border-green-300 group cursor-pointer"
                        onClick={() => handleTemplateClick(template)}
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
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {template.isEditable && (
                              <span
                                className="h-6 w-6 p-1 cursor-pointer hover:bg-gray-100 rounded flex items-center justify-center z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStart(template);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </span>
                            )}
                            {template.isCustom && (
                              <span
                                className="h-6 w-6 p-1 cursor-pointer hover:bg-red-100 rounded flex items-center justify-center z-10 text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTemplate(template);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <div className="text-xs text-blue-700 text-center">
              💡 Aksi cepat belajar dari kebiasaan transaksi Anda. Klik template untuk menjalankan transaksi, atau gunakan ikon edit (✏️) untuk mengubah nominal. Ikon sampah (🗑️) untuk menghapus template custom.
            </div>
          </div>
        </CardContent>
      )}

      {/* Alert Dialog untuk konfirmasi transaksi */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">{selectedTemplate?.emoji}</span>
              <span>Pilih Aksi untuk {selectedTemplate?.name}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Nominal saat ini: <span className="font-semibold text-blue-600">
                Rp {selectedTemplate?.amount.toLocaleString('id-ID')}
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

      {/* Dialog untuk menambah template baru */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Template Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Emoji</label>
              <Input
                value={newTemplate.emoji}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, emoji: e.target.value }))}
                placeholder="🍔"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama template"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                value={newTemplate.amount}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="25000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipe</label>
              <Select 
                value={newTemplate.type} 
                onValueChange={(value: 'income' | 'expense') => setNewTemplate(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <Select 
                value={newTemplate.category} 
                onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Deskripsi (opsional)</label>
              <Input
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi template"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddTemplate}>
              Tambah Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi hapus */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus template "{selectedTemplate?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
