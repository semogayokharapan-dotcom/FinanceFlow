import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getCategoryEmoji, getCategoryName } from "@/lib/format";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { Transaction } from "@shared/schema";

interface RecentTransactionsProps {
  userId: string;
}

export default function RecentTransactions({ userId }: RecentTransactionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', userId],
    queryFn: () => fetch(`/api/transactions/${userId}?limit=5`).then(res => res.json()),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await apiRequest("DELETE", `/api/transactions/${userId}/${transactionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/balance', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/categories', userId] });
      
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      
      toast({
        title: "✅ Berhasil!",
        description: "Transaksi berhasil dihapus",
      });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransactionMutation.mutate(transactionToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Belum ada transaksi</p>
            <p className="text-sm">Tambahkan transaksi pertama Anda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Transaksi Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getCategoryEmoji(transaction.category)}</span>
                <div>
                  <p className="font-medium text-gray-800">
                    {transaction.description || getCategoryName(transaction.category)}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(new Date(transaction.date))}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-success' : 'text-danger'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                  </p>
                  <p className="text-xs text-gray-500">{getCategoryName(transaction.category)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteClick(transaction)}
                  disabled={deleteTransactionMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Dialog konfirmasi hapus */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Konfirmasi Hapus Transaksi</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {transactionToDelete && (
                <div className="space-y-2">
                  <p>Apakah Anda yakin ingin menghapus transaksi ini?</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryEmoji(transactionToDelete.category)}</span>
                      <div>
                        <p className="font-medium text-gray-800">
                          {transactionToDelete.description || getCategoryName(transactionToDelete.category)}
                        </p>
                        <p className={`font-semibold ${
                          transactionToDelete.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transactionToDelete.type === 'income' ? '+' : '-'}{formatCurrency(Number(transactionToDelete.amount))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Tindakan ini tidak dapat dibatalkan!
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={deleteTransactionMutation.isPending}
              >
                {deleteTransactionMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
