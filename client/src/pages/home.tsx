import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, Plus } from "lucide-react";
import AuthModal from "@/components/auth-modal";
import TransactionForm from "@/components/transaction-form";
import BalanceCard from "@/components/balance-card";
import RecentTransactions from "@/components/recent-transactions";
import CategoryDistribution from "@/components/category-distribution";
import SmartQuickActions from "@/components/smart-quick-actions";
import ReportsTab from "@/components/reports-tab";
import { AnalyticsTab } from "@/components/analytics-tab";
import ChatTab from "@/components/chat-tab"; // Import ChatTab
import { login, getStoredPrivateKey, getStoredUserData, clearStoredPrivateKey, clearUserData } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'analytics' | 'chat'>('dashboard'); // Add 'chat' to the state type
  const [showQuickInput, setShowQuickInput] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const storedKey = getStoredPrivateKey();
    const storedUser = getStoredUserData();

    if (storedKey && storedUser) {
      // Validate with backend
      login({ privateKey: storedKey })
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          // Invalid stored credentials
          clearStoredPrivateKey();
          clearUserData();
          setIsAuthModalOpen(true);
        });
    } else {
      setIsAuthModalOpen(true);
    }
  }, []);

  const handleAuthenticated = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    toast({
      title: "🎉 Selamat datang!",
      description: `Halo ${user.fullName}, mari kelola keuangan Anda!`,
    });
  };

  const handleLogout = () => {
    clearStoredPrivateKey();
    clearUserData();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
    toast({
      title: "👋 Sampai jumpa!",
      description: "Anda telah berhasil logout",
    });
  };

  const handleShowProfile = () => {
    toast({
      title: "👤 Profile",
      description: `${currentUser?.fullName || 'User'} - Target: Rp ${Number(currentUser?.monthlyTarget || 0).toLocaleString('id-ID')}`,
    });
  };

  if (!currentUser) {
    return (
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">💰 Smart Finance</h1>
              <p className="text-sm text-gray-600">Kelola keuangan dengan mudah</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowProfile}
                className="p-2 rounded-full"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="p-2 rounded-full"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Balance Card */}
      <div className="max-w-md mx-auto px-4 py-4">
        <BalanceCard user={currentUser} />
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-md mx-auto px-4">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5"> {/* Changed col-span to 5 */}
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="reports">📅 Laporan</TabsTrigger>
            <TabsTrigger value="analytics">📊 Grafik</TabsTrigger>
            {/* <TabsTrigger value="templates">⚡ Templates</TabsTrigger> Removed as not in original code */}
            <TabsTrigger value="chat">💬 Wey Chat!</TabsTrigger> {/* Added Chat Tab */}
          </TabsList>
          
          {/* Tab Content */}
          <TabsContent value="dashboard">
            <SmartQuickActions userId={currentUser.id} />
            <TransactionForm userId={currentUser.id} />
            <RecentTransactions userId={currentUser.id} />
            <CategoryDistribution userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="chat"> {/* Added Chat Tab Content */}
            <ChatTab userId={currentUser.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg"
        onClick={() => {
          setActiveTab('dashboard');
          setShowQuickInput(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}