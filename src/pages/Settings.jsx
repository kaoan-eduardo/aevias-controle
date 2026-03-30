import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun, Monitor, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";

const THEME_KEY = "aevias_theme";

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark");
  } else if (theme === "light") {
    root.setAttribute("data-theme", "light");
    root.classList.remove("dark");
  } else {
    // system
    root.removeAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

export default function Settings() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "system");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Listen to OS dark mode changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await base44.auth.logout();
  };

  const options = [
    { value: "light", label: "Claro", icon: Sun, desc: "Sempre usar tema claro" },
    { value: "dark", label: "Escuro", icon: Moon, desc: "Sempre usar tema escuro" },
    { value: "system", label: "Sistema", icon: Monitor, desc: "Seguir preferência do dispositivo" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 min-h-screen bg-transparent">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#00233B]">Configurações</h1>
        <p className="text-[#00233B]/80 mt-1">Personalize a aparência do aplicativo</p>
      </div>

      <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#00233B] flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#BFCF99]" />
            Tema
          </CardTitle>
          <p className="text-sm text-[#00233B]/70">Escolha como o aplicativo deve aparecer</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {options.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all select-none ${
                  theme === value
                    ? "border-[#BFCF99] bg-[#BFCF99]/20"
                    : "border-white/30 bg-white/10 hover:bg-white/20"
                }`}
              >
                <div className={`p-3 rounded-full ${theme === value ? "bg-[#00233B]" : "bg-black/10"}`}>
                  <Icon className={`w-6 h-6 ${theme === value ? "text-[#BFCF99]" : "text-[#00233B]/60"}`} />
                </div>
                <div className="text-center">
                  <p className={`font-semibold text-sm ${theme === value ? "text-[#00233B]" : "text-[#00233B]/70"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-[#00233B]/50 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/20 backdrop-blur-lg border border-red-200/30 text-[#00233B]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
          <p className="text-sm text-[#00233B]/70">Ações irreversíveis para a sua conta</p>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto" disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Processando...' : 'Excluir minha conta'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Sua conta e todos os seus dados serão permanentemente removidos do sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, excluir minha conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}