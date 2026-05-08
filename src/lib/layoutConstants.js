// Centralized constants for the Layout module
// Separating configuration from component logic (SRP)

export const SESSION_KEYS = {
  LAST_LOGIN: 'session_login_flag',
  TAB_STACK_PREFIX: 'tab_stack_',
};

export const TAB_ZONES = {
  home: ['/'],
  regionais: ['/Regionais', '/Obra', '/Regional'],
  projects: ['/Projects', '/Project'],
  registros: ['/MeusEnsaios', '/Ensaio', '/Checklist', '/Diario', '/Acompanhamento', '/Boletim'],
};

export const ACCESS_LEVELS = {
  ADMIN: 'admin',
  SALA_TECNICA: 'sala_tecnica_afirmaevias',
  GESTOR_CONTRATO: 'gestor_contrato',
  CLIENTE: 'cliente',
  USER: 'user',
};

export const REPORT_PAGES = new Set([
  "RelatorioEnsaio",
  "RelatorioDiario",
  "RelatorioChecklist",
  "RelatorioChecklistAplicacao",
  "RelatorioChecklistMRAF",
  "RelatorioChecklistConcretagem",
  "RelatorioChecklistTerraplanagem",
  "RelatorioChecklistReciclagem",
  "RelatorioSondagem",
  "RelatorioDensidadeInSitu",
  "RelatorioTaxaPinturaImprimacao",
  "RelatorioConsolidado",
  "RelatorioCAUQ",
  "RelatorioGranulometriaIndividual",
  "RelatorioAcompanhamentoUsinagem",
  "RelatorioAcompanhamentoCarga",
  "RelatorioManchaPendulo",
  "RelatorioVigaBenkelman",
  "RelatorioTaxaMRAF",
  "RelatorioNC",
  "RelatorioBoletimSondagem",
  "RelatorioBoletimSondagemTrado",
  "RelatorioProctor",
  "RelatorioRompimentoConcreto",
  "RelatorioGranuMistura",
  "RelatorioUnificado",
]);

/** Returns the tab zone key for a given pathname, or null */
export function getTabZone(pathname) {
  for (const [zone, prefixes] of Object.entries(TAB_ZONES)) {
    if (prefixes.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))) {
      return zone;
    }
  }
  return null;
}

/** Derives the effective access level from a user object */
export function getUserAccessLevel(user) {
  return user?.access_level || (user?.role === ACCESS_LEVELS.ADMIN ? ACCESS_LEVELS.ADMIN : ACCESS_LEVELS.USER);
}

/** Returns all synthetic "obra" stubs for non-laboratorist users (so all categories appear) */
export const ALL_OBRA_TYPE_STUBS = [
  { tipo_obra: 'supervisao' },
  { tipo_obra: 'implantacao' },
  { tipo_obra: 'conservacao' },
  { tipo_obra: 'sondagem' },
  { tipo_obra: 'levantamentos' },
];