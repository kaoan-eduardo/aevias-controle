import { useEffect } from 'react';

/**
 * Hook que desabilita dark mode para páginas de relatório (impressão/PDF).
 * Restaura o estado original ao desmontar o componente.
 */
export function useReportMode() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const wasHtmlDark = html.classList.contains('dark');
    const wasBodyDark = body.classList.contains('dark');

    html.classList.remove('dark');
    body.classList.remove('dark');

    return () => {
      if (wasHtmlDark) html.classList.add('dark');
      if (wasBodyDark) body.classList.add('dark');
    };
  }, []);
}