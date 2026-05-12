import { useEffect } from 'react';

/**
 * Hook que desabilita dark mode para páginas de relatório (impressão/PDF).
 * Restaura o estado original ao desmontar o componente.
 * Opera diretamente nas classList — não passa elementos DOM por funções auxiliares.
 */
export function useReportMode() {
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const wasHtmlDark = htmlEl.classList.contains('dark');
    const wasBodyDark = bodyEl.classList.contains('dark');

    htmlEl.classList.remove('dark');
    bodyEl.classList.remove('dark');

    return () => {
      if (wasHtmlDark) htmlEl.classList.add('dark');
      if (wasBodyDark) bodyEl.classList.add('dark');
    };
  }, []);
}