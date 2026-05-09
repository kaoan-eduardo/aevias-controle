import { FlaskConical, Gauge, ClipboardList, Book, FileText } from "lucide-react";
import { createPageUrl } from "@/utils";

// ─── Registro central: única fonte de verdade por tipo de ensaio ─────────────
// Adicionar um novo tipo = adicionar uma entrada aqui. Nada mais.

const ENSAIO_CONFIG = {
  DiarioObra:                   { name: "Diário de Obra",               icon: Book,         dateField: "data",             reportPage: "RelatorioDiario" },
  EnsaioCAUQ:                   { name: "Ensaio de CAUQ",               icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioCAUQ" },
  EnsaioMRAF:                   { name: "Ensaio MRAF",                  icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioEnsaio?tipo=mraf" },
  EnsaioDensidade:              { name: "Densidade CP Extraído",         icon: Gauge,        dateField: "extraction_date",  reportPage: "RelatorioEnsaio?tipo=densidade" },
  EnsaioDensidadeInSitu:        { name: "Densidade In Situ",            icon: Gauge,        dateField: "data_ensaio",      reportPage: "RelatorioDensidadeInSitu" },
  EnsaioTaxaPinturaImprimacao:  { name: "Taxa de Pintura/Imprimação",   icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioTaxaPinturaImprimacao" },
  ChecklistUsina:               { name: "Checklist de Usina",           icon: ClipboardList,dateField: "data",             reportPage: "RelatorioChecklist" },
  ChecklistAplicacao:           { name: "Checklist de Aplicação",       icon: ClipboardList,dateField: "data",             reportPage: "RelatorioChecklistAplicacao" },
  ChecklistMRAF:                { name: "Checklist de MRAF",            icon: ClipboardList,dateField: "data",             reportPage: "RelatorioChecklistMRAF" },
  ChecklistConcretagem:         { name: "Checklist de Concretagem",     icon: ClipboardList,dateField: "data",             reportPage: "RelatorioChecklistConcretagem" },
  ChecklistTerraplanagem:       { name: "Checklist de Terraplanagem",   icon: ClipboardList,dateField: "data",             reportPage: "RelatorioChecklistTerraplanagem" },
  ChecklistReciclagem:          { name: "Checklist de Reciclagem",      icon: ClipboardList,dateField: "data",             reportPage: "RelatorioChecklistReciclagem" },
  EnsaioSondagem:               { name: "Ensaio de Sondagem",           icon: Gauge,        dateField: "data",             reportPage: "RelatorioSondagem" },
  EnsaioGranulometriaIndividual:{ name: "Granulometria Individual",     icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioGranulometriaIndividual" },
  AcompanhamentoUsinagem:       { name: "Acompanhamento de Usinagem",   icon: FlaskConical, dateField: "data",             reportPage: "RelatorioAcompanhamentoUsinagem" },
  AcompanhamentoCarga:          { name: "Acompanhamento de Cargas",     icon: FlaskConical, dateField: "data",             reportPage: "RelatorioAcompanhamentoCarga" },
  EnsaioManchaPendulo:          { name: "Mancha + Pêndulo",             icon: Gauge,        dateField: "data_ensaio",      reportPage: "RelatorioManchaPendulo" },
  EnsaioVigaBenkelman:          { name: "Viga Benkelman",               icon: Gauge,        dateField: "data_realizacao",  reportPage: "RelatorioVigaBenkelman" },
  EnsaioTaxaMRAF:               { name: "Taxa de MRAF",                 icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioTaxaMRAF" },
  BoletimSondagem:              { name: "Boletim de Sondagem (PI)",     icon: FileText,     dateField: "data",             reportPage: "RelatorioBoletimSondagem" },
  BoletimSondagemTrado:         { name: "Boletim de Sondagem a Trado",  icon: FileText,     dateField: "data",             reportPage: "RelatorioBoletimSondagemTrado" },
  EnsaioProctor:                { name: "Ensaio Proctor",               icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioProctor" },
  EnsaioRompimentoConcreto:     { name: "Rompimento Concreto",          icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioRompimentoConcreto" },
  GranuMistura:                 { name: "Granulometria da Mistura",     icon: FlaskConical, dateField: "data_ensaio",      reportPage: "RelatorioGranuMistura" },
};

const FALLBACK = { name: "Ensaio Desconhecido", icon: FileText, dateField: "created_date", reportPage: null };

const getConfig = (ensaio) => ENSAIO_CONFIG[ensaio.entityType] ?? FALLBACK;

// ─── Exports públicos ─────────────────────────────────────────────────────────

export const getEnsaioTypeInfo = (ensaio) => {
  const { name, icon } = getConfig(ensaio);
  return { name, icon };
};

export const getReportLink = (ensaio) => {
  const { reportPage } = getConfig(ensaio);
  if (!reportPage) return "#";
  // reportPage pode conter query string embutida (e.g. "RelatorioEnsaio?tipo=mraf")
  const sep = reportPage.includes('?') ? '&' : '?';
  return createPageUrl(`${reportPage}${sep}id=${ensaio.id}`);
};

export const getDataEnsaio = (ensaio) => {
  const { dateField } = getConfig(ensaio);
  // EnsaioVigaBenkelman tem fallback para data_ensaio e created_date
  return ensaio[dateField] ?? ensaio.data_ensaio ?? ensaio.created_date ?? null;
};

export const getDataFormatted = (ensaio) => {
  const raw = getDataEnsaio(ensaio);
  if (!raw) return "Data não informada";
  return new Date(raw).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const typeOptions = [
  { value: 'all', label: 'Todos os tipos' },
  ...Object.entries(ENSAIO_CONFIG).map(([value, { name: label }]) => ({ value, label })),
];