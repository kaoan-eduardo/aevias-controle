import { useEffect } from 'react';

/**
 * Hook que desabilita dark mode para páginas de relatório
 * Restaura o tema ao desmontar o componente
 */
export function useReportMode() {
  useEffect(() => {
    const htmlEl = document.documentElement;
    const wasDark = htmlEl.classList.contains('dark');
    
    // Remove dark mode
    htmlEl.classList.remove('dark');
    document.body.classList.remove('dark');
    
    return () => {
      // Restaura dark mode se estava ativo antes
      if (wasDark) {
        htmlEl.classList.add('dark');
      }
    };
  }, []);
}