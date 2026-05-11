import { useEffect } from 'react';

/**
 * Hook que desabilita dark mode para páginas de relatório (impressão/PDF).
 * Restaura o estado original ao desmontar o componente.
 * Opera diretamente nas classList — não passa elementos DOM por funções auxiliares.
 */
export function useReportMode() {
  useEffect(() => {
    const htmlClassList = document.documentElement.classList;
    const bodyClassList = document.body.classList;

    const wasHtmlDark = htmlClassList.contains('dark');
    const wasBodyDark = bodyClassList.contains('dark');

    htmlClassList.remove('dark');
    bodyClassList.remove('dark');

    return () => {
      if (wasHtmlDark) htmlClassList.add('dark');
      if (wasBodyDark) bodyClassList.add('dark');
    };
  }, []);
}