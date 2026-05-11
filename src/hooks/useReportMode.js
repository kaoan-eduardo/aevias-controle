import { useEffect } from 'react';

/**
 * Hook que desabilita dark mode para páginas de relatório (impressão/PDF).
 * Restaura o estado original ao desmontar o componente.
 * Opera diretamente nas classList — não passa elementos DOM por funções auxiliares.
 */
export function useReportMode() {
  useEffect(() => {
    // classList operations — not used in HTML injection context
    const htmlClassList = document.documentElement.classList; // nosemgrep
    const bodyClassList = document.body.classList;

    const wasHtmlDark = htmlClassList.contains('dark'); // nosemgrep
    const wasBodyDark = bodyClassList.contains('dark');

    htmlClassList.remove('dark');
    bodyClassList.remove('dark');

    return () => {
      if (wasHtmlDark) htmlClassList.add('dark');
      if (wasBodyDark) bodyClassList.add('dark');
    };
  }, []);
}