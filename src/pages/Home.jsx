import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await User.me();
        if (user) {
          if (user.role === 'admin') {
            navigate(createPageUrl('Dashboard'), { replace: true });
          } else {
            navigate(createPageUrl('Obras'), { replace: true });
          }
        }
      } catch (error) {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogin = async () => {
    await User.login();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" alt="Afirmaevias Logo" className="h-20 animate-pulse" width="auto" height="80"/>
            <p className="mt-4 text-slate-700 font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="text-center p-8 bg-white shadow-2xl rounded-xl max-w-md w-full">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" alt="Afirmaevias Logo" className="h-24 mx-auto mb-6" width="auto" height="96"/>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Bem-vindo à Afirmaevias</h1>
        <p className="text-slate-600 mb-6">Sistema de controle de qualidade para pavimentação.</p>
        
        <div className="space-y-4">
          <Button onClick={handleLogin} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
            <LogIn className="w-5 h-5 mr-2" />
            Entrar com Google
          </Button>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 text-center">
              <strong>Acesso Restrito:</strong><br/>
              Apenas usuários autorizados pela administração podem acessar o sistema.
              Entre em contato com seu supervisor para obter acesso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}