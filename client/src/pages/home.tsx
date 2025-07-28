import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, Plus } from "lucide-react";
import AuthModal from "@/components/auth-modal";
import TransactionForm from "@/components/transaction-form";
import BalanceCard from "@/components/balance-card";
import RecentTransactions from "@/components/recent-transactions";
import CategoryDistribution from "@/components/category-distribution";
import CollapsibleQuickActions from "@/components/collapsible-quick-actions";
import ReportsTab from "@/components/reports-tab";
import TemplatesTab from "@/components/templates-tab";
import { login, getStoredPrivateKey, getStoredUserData, clearStoredPrivateKey, clearUserData } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from "@/lib/auth";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'templates'>('dashboard');
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
        <div className="bg-white rounded-2xl p-2 shadow-sm">
          <div className="flex space-x-1">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              className="flex-1 py-3 px-4 text-sm font-medium"
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'ghost'}
              className="flex-1 py-3 px-4 text-sm font-medium"
              onClick={() => setActiveTab('reports')}
            >
              📅 Laporan
            </Button>
            <Button
              variant={activeTab === 'templates' ? 'default' : 'ghost'}
              className="flex-1 py-3 px-4 text-sm font-medium"
              onClick={() => setActiveTab('templates')}
            >
              ⚡ Template
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {activeTab === 'dashboard' && (
          <>
            <CollapsibleQuickActions userId={currentUser.id} />
            <TransactionForm userId={currentUser.id} />
            <RecentTransactions userId={currentUser.id} />
            <CategoryDistribution userId={currentUser.id} />
          </>
        )}

        {activeTab === 'reports' && (
          <ReportsTab userId={currentUser.id} />
        )}

        {activeTab === 'templates' && (
          <TemplatesTab 
            userId={currentUser.id} 
            onSwitchTab={() => setActiveTab('dashboard')}
          />
        )}
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
