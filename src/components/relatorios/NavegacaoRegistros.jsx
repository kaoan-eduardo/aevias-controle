import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Lê a lista salva no sessionStorage e exibe botões ← Anterior / Próximo →
// A lista é salva por MeusEnsaios ao clicar em "Ver PDF"
export default function NavegacaoRegistros() {
  const [navList, setNavList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('ensaios_navlist');
      if (!raw) return;
      const list = JSON.parse(raw);
      setNavList(list);

      // Descobrir índice atual pelo ?id= na URL
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const idx = list.findIndex(item => item.id === id);
        setCurrentIndex(idx);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  if (navList.length === 0 || currentIndex === -1) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < navList.length - 1;

  const go = (idx) => {
    window.location.href = navList[idx].url;
  };

  return (
    <div className="flex items-center gap-1 print:hidden">
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 gap-1 text-xs"
        disabled={!hasPrev}
        onClick={() => go(currentIndex - 1)}
        title="Registro anterior"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </Button>
      <span className="text-xs text-slate-500 px-1">
        {currentIndex + 1} / {navList.length}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 gap-1 text-xs"
        disabled={!hasNext}
        onClick={() => go(currentIndex + 1)}
        title="Próximo registro"
      >
        Próximo
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}