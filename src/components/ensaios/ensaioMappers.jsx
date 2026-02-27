import { FlaskConical, Gauge, ClipboardList, Book, FileText } from "lucide-react";
import { createPageUrl } from "@/utils";

export const getEnsaioTypeInfo = (ensaio) => {
  const entityType = ensaio.entityType;
  switch (entityType) {
    case "DiarioObra":
      return { name: "Diário de Obra", icon: Book };
    case "EnsaioCAUQ":
      return { name: "Ensaio de CAUQ", icon: FlaskConical };
    case "EnsaioMRAF":
      return { name: "Ensaio MRAF", icon: FlaskConical };
    case "EnsaioDensidade":
      return { name: "Densidade CP Extraído", icon: Gauge };
    case "EnsaioDensidadeInSitu":
      return { name: "Densidade In Situ", icon: Gauge };
    case "EnsaioTaxaPinturaImprimacao":
      return { name: "Taxa de Pintura/Imprimação", icon: FlaskConical };
    case "ChecklistUsina":
      return { name: "Checklist de Usina", icon: ClipboardList };
    case "ChecklistAplicacao":
      return { name: "Checklist de Aplicação", icon: ClipboardList };
    case "ChecklistMRAF":
      return { name: "Checklist de MRAF", icon: ClipboardList };
    case "ChecklistConcretagem":
      return { name: "Checklist de Concretagem", icon: ClipboardList };
    case "ChecklistTerraplanagem":
      return { name: "Checklist de Terraplanagem", icon: ClipboardList };
    case "ChecklistReciclagem":
      return { name: "Checklist de Reciclagem", icon: ClipboardList };
    case "EnsaioSondagem":
      return { name: "Ensaio de Sondagem", icon: Gauge };
    case "EnsaioGranulometriaIndividual":
      return { name: "Granulometria Individual", icon: FlaskConical };
    case "AcompanhamentoUsinagem":
      return { name: "Acompanhamento de Usinagem", icon: FlaskConical };
    case "AcompanhamentoCarga":
      return { name: "Acompanhamento de Cargas", icon: FlaskConical };
    case "EnsaioManchaPendulo":
      return { name: "Mancha + Pêndulo", icon: Gauge };
    case "EnsaioVigaBenkelman":
      return { name: "Viga Benkelman", icon: Gauge };
    default:
      return { name: "Ensaio Desconhecido", icon: FileText };
  }
};

export const getReportLink = (ensaio) => {
  const entityType = ensaio.entityType;
  switch (entityType) {
    case "DiarioObra":
      return createPageUrl(`RelatorioDiario?id=${ensaio.id}`);
    case "EnsaioCAUQ":
      return createPageUrl(`RelatorioCAUQ?id=${ensaio.id}`);
    case "EnsaioMRAF":
      return createPageUrl(`RelatorioEnsaio?id=${ensaio.id}&tipo=mraf`);
    case "EnsaioDensidade":
      return createPageUrl(`RelatorioEnsaio?id=${ensaio.id}&tipo=densidade`);
    case "EnsaioDensidadeInSitu":
      return createPageUrl(`RelatorioDensidadeInSitu?id=${ensaio.id}`);
    case "EnsaioTaxaPinturaImprimacao":
      return createPageUrl(`RelatorioTaxaPinturaImprimacao?id=${ensaio.id}`);
    case "ChecklistUsina":
      return createPageUrl(`RelatorioChecklist?id=${ensaio.id}`);
    case "ChecklistAplicacao":
      return createPageUrl(`RelatorioChecklistAplicacao?id=${ensaio.id}`);
    case "ChecklistMRAF":
      return createPageUrl(`RelatorioChecklistMRAF?id=${ensaio.id}`);
    case "ChecklistConcretagem":
      return createPageUrl(`RelatorioChecklistConcretagem?id=${ensaio.id}`);
    case "ChecklistTerraplanagem":
      return createPageUrl(`RelatorioChecklistTerraplanagem?id=${ensaio.id}`);
    case "ChecklistReciclagem":
      return createPageUrl(`RelatorioChecklistReciclagem?id=${ensaio.id}`);
    case "EnsaioSondagem":
      return createPageUrl(`RelatorioSondagem?id=${ensaio.id}`);
    case "EnsaioGranulometriaIndividual":
      return createPageUrl(`RelatorioGranulometriaIndividual?id=${ensaio.id}`);
    case "AcompanhamentoUsinagem":
      return createPageUrl(`RelatorioAcompanhamentoUsinagem?id=${ensaio.id}`);
    case "AcompanhamentoCarga":
      return createPageUrl(`RelatorioAcompanhamentoCarga?id=${ensaio.id}`);
    case "EnsaioManchaPendulo":
      return createPageUrl(`RelatorioManchaPendulo?id=${ensaio.id}`);
    case "EnsaioVigaBenkelman":
      return createPageUrl(`RelatorioVigaBenkelman?id=${ensaio.id}`);
    default:
      return "#";
  }
};

export const getDataFormatted = (ensaio) => {
  const entityType = ensaio.entityType;
  let dateField;

  switch (entityType) {
    case "DiarioObra":
      dateField = ensaio.data;
      break;
    case "EnsaioCAUQ":
      dateField = ensaio.data_ensaio;
      break;
    case "EnsaioDensidade":
      dateField = ensaio.extraction_date;
      break;
    case "EnsaioDensidadeInSitu":
      dateField = ensaio.data_ensaio;
      break;
    case "EnsaioTaxaPinturaImprimacao":
      dateField = ensaio.data_ensaio;
      break;
    case "EnsaioGranulometriaIndividual":
      dateField = ensaio.data_ensaio;
      break;
    case "AcompanhamentoCarga":
      dateField = ensaio.data;
      break;
    case "ChecklistUsina":
      dateField = ensaio.data;
      break;
    case "ChecklistAplicacao":
      dateField = ensaio.data;
      break;
    case "ChecklistMRAF":
      dateField = ensaio.data;
      break;
    case "ChecklistConcretagem":
      dateField = ensaio.data;
      break;
    case "ChecklistTerraplanagem":
      dateField = ensaio.data;
      break;
    case "ChecklistReciclagem":
      dateField = ensaio.data;
      break;
    case "EnsaioSondagem":
      dateField = ensaio.data;
      break;
    case "EnsaioManchaPendulo":
      dateField = ensaio.data_ensaio;
      break;
    case "EnsaioVigaBenkelman":
      dateField = ensaio.data_ensaio;
      break;
    case "AcompanhamentoUsinagem":
      dateField = ensaio.data;
      break;
    default:
      dateField = ensaio.created_date;
  }

  if (dateField) {
    return new Date(dateField).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  return "Data não informada";
};

export const getDataEnsaio = (ensaio) => {
  const entityType = ensaio.entityType;
  switch (entityType) {
    case "DiarioObra":
      return ensaio.data;
    case "EnsaioCAUQ":
      return ensaio.data_ensaio;
    case "EnsaioDensidade":
      return ensaio.extraction_date;
    case "EnsaioDensidadeInSitu":
      return ensaio.data_ensaio;
    case "EnsaioTaxaPinturaImprimacao":
      return ensaio.data_ensaio;
    case "ChecklistUsina":
      return ensaio.data;
    case "ChecklistAplicacao":
      return ensaio.data;
    case "ChecklistMRAF":
      return ensaio.data;
    case "ChecklistConcretagem":
      return ensaio.data;
    case "ChecklistTerraplanagem":
      return ensaio.data;
    case "ChecklistReciclagem":
      return ensaio.data;
    case "EnsaioSondagem":
      return ensaio.data;
    case "EnsaioGranulometriaIndividual":
      return ensaio.data_ensaio;
    case "AcompanhamentoUsinagem":
      return ensaio.data;
    case "AcompanhamentoCarga":
      return ensaio.data;
    case "EnsaioManchaPendulo":
      return ensaio.data_ensaio;
    case "EnsaioVigaBenkelman":
      return ensaio.data_ensaio;
    default:
      return ensaio.created_date;
  }
};

export const getEntityMap = () => ({
  "DiarioObra": "DiarioObra",
  "EnsaioCAUQ": "EnsaioCAUQ",
  "EnsaioMRAF": "EnsaioMRAF",
  "EnsaioDensidade": "EnsaioDensidade",
  "EnsaioDensidadeInSitu": "EnsaioDensidadeInSitu",
  "EnsaioTaxaPinturaImprimacao": "EnsaioTaxaPinturaImprimacao",
  "ChecklistUsina": "ChecklistUsina",
  "ChecklistAplicacao": "ChecklistAplicacao",
  "ChecklistMRAF": "ChecklistMRAF",
  "ChecklistConcretagem": "ChecklistConcretagem",
  "ChecklistTerraplanagem": "ChecklistTerraplanagem",
  "ChecklistReciclagem": "ChecklistReciclagem",
  "EnsaioSondagem": "EnsaioSondagem",
  "EnsaioGranulometriaIndividual": "EnsaioGranulometriaIndividual",
  "AcompanhamentoUsinagem": "AcompanhamentoUsinagem",
  "AcompanhamentoCarga": "AcompanhamentoCarga",
  "EnsaioManchaPendulo": "EnsaioManchaPendulo",
  "EnsaioVigaBenkelman": "EnsaioVigaBenkelman"
});

export const typeOptions = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'DiarioObra', label: 'Diário de Obra' },
  { value: 'EnsaioCAUQ', label: 'Ensaio de CAUQ' },
  { value: 'EnsaioMRAF', label: 'Ensaio MRAF' },
  { value: 'EnsaioDensidade', label: 'Densidade CP' },
  { value: 'EnsaioDensidadeInSitu', label: 'Densidade In Situ' },
  { value: 'EnsaioTaxaPinturaImprimacao', label: 'Taxa Pintura/Imprimação' },
  { value: 'ChecklistUsina', label: 'Checklist Usina' },
  { value: 'ChecklistAplicacao', label: 'Checklist Aplicação' },
  { value: 'ChecklistMRAF', label: 'Checklist MRAF' },
  { value: 'ChecklistConcretagem', label: 'Checklist Concretagem' },
  { value: 'ChecklistTerraplanagem', label: 'Checklist Terraplanagem' },
  { value: 'ChecklistReciclagem', label: 'Checklist Reciclagem' },
  { value: 'EnsaioSondagem', label: 'Ensaio Sondagem' },
  { value: 'EnsaioGranulometriaIndividual', label: 'Granulometria Individual' },
  { value: 'AcompanhamentoUsinagem', label: 'Acompanhamento de Usinagem' },
  { value: 'AcompanhamentoCarga', label: 'Acompanhamento de Cargas' },
  { value: 'EnsaioManchaPendulo', label: 'Mancha + Pêndulo' },
  { value: 'EnsaioVigaBenkelman', label: 'Viga Benkelman' },
];