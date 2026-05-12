import { useEffect } from 'react';

/**
 * Hook que desabilita dark mode para páginas de relatório (impressão/PDF).
 * Restaura o estado original ao desmontar o componente.
 * Opera diretamente nas classList — não passa elementos DOM por funções auxiliares.
 */
export function useReportMode() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const rootHadDark = root.getAttribute('class')?.split(' ').includes('dark') ?? false;
    const bodyHadDark = body.getAttribute('class')?.split(' ').includes('dark') ?? false;

    const rootClasses = (root.getAttribute('class') || '').split(' ').filter(c => c !== 'dark');
    const bodyClasses = (body.getAttribute('class') || '').split(' ').filter(c => c !== 'dark');

    root.setAttribute('class', rootClasses.join(' '));
    body.setAttribute('class', bodyClasses.join(' '));

    return () => {
      if (rootHadDark) {
        const cur = (root.getAttribute('class') || '').split(' ');
        if (!cur.includes('dark')) root.setAttribute('class', [...cur, 'dark'].join(' ').trim());
      }
      if (bodyHadDark) {
        const cur = (body.getAttribute('class') || '').split(' ');
        if (!cur.includes('dark')) body.setAttribute('class', [...cur, 'dark'].join(' ').trim());
      }
    };
  }, []);
}