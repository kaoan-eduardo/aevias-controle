import { useEffect } from 'react';

/**
 * Hook que desabilita dark mode para páginas de relatório (impressão/PDF).
 * Restaura o estado original ao desmontar o componente.
 */
/** Lê e remove a classe 'dark' de um elemento, retornando se estava presente. */
function disableDarkMode(el) {
  const wasDark = el.getAttribute('class')?.split(' ').includes('dark') ?? false;
  el.classList.remove('dark');
  return wasDark;
}

/** Restaura a classe 'dark' em um elemento caso estava presente antes. */
function restoreDarkMode(el, wasDark) {
  if (wasDark) el.classList.add('dark');
}

/**
 * Hook que desabilita dark mode para páginas de relatório (impressão/PDF).
 * Restaura o estado original ao desmontar o componente.
 * SRP: responsabilidade única de gerenciar o tema para modo relatório.
 */
export function useReportMode() {
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const wasHtmlDark = disableDarkMode(htmlEl);
    const wasBodyDark = disableDarkMode(bodyEl);

    return () => {
      restoreDarkMode(htmlEl, wasHtmlDark);
      restoreDarkMode(bodyEl, wasBodyDark);
    };
  }, []);
}