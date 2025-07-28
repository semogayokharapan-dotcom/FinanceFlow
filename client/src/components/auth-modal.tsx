import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generatePrivateKey, validatePrivateKey } from "@/lib/crypto";
import { login, register, savePrivateKey, saveUserData } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from "@/lib/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const { toast } = useToast();

  // Form data
  const [privateKey, setPrivateKey] = useState('');
  const [fullName, setFullName] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');

  useEffect(() => {
    if (mode === 'register' && !generatedKey) {
      setGeneratedKey(generatePrivateKey());
    }
  }, [mode, generatedKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey) {
      toast({
        title: "❌ Error",
        description: "Mohon masukkan private key Anda",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await login({ privateKey });
      savePrivateKey(privateKey);
      saveUserData(user);
      onAuthenticated(user);
      onClose();
      toast({
        title: "🚀 Berhasil!",
        description: "Selamat datang kembali!",
      });
    } catch (error: any) {
      toast({
        title: "❌ Login Gagal",
        description: error.message || "Private key tidak valid",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !monthlyTarget || !generatedKey) {
      toast({
        title: "❌ Error",
        description: "Mohon lengkapi semua field",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        fullName,
        monthlyTarget,
        privateKey: generatedKey,
      });
      savePrivateKey(generatedKey);
      saveUserData(user);
      onAuthenticated(user);
      onClose();
      toast({
        title: "✅ Akun Berhasil Dibuat!",
        description: "Selamat datang di Smart Finance Tracker!",
      });
    } catch (error: any) {
      toast({
        title: "❌ Registrasi Gagal",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <CardTitle className="text-2xl">
            {mode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
          </CardTitle>
          <p className="text-gray-600 text-sm">Kelola keuangan Anda dengan aman</p>
        </CardHeader>
        
        <CardContent>
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="privateKey">🔑 Private Key</Label>
                <Input
                  id="privateKey"
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Masukkan private key Anda"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "⏳ Memproses..." : "🚀 Masuk Sekarang"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setMode('register')}
              >
                Belum punya akun? Daftar di sini
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="fullName">👤 Nama Lengkap</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <div>
                <Label htmlFor="monthlyTarget">💰 Target Tabungan Bulanan</Label>
                <Input
                  id="monthlyTarget"
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  placeholder="Contoh: 2000000"
                  required
                />
              </div>
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    🔑 Private Key Anda
                  </Label>
                  <div className="bg-white p-3 rounded-lg border font-mono text-sm break-all">
                    {generatedKey}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    ⚠️ Simpan private key ini dengan aman! Anda akan membutuhkannya untuk login.
                  </p>
                </AlertDescription>
              </Alert>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "⏳ Membuat Akun..." : "✅ Buat Akun"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setMode('login')}
              >
                Sudah punya akun? Masuk di sini
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
