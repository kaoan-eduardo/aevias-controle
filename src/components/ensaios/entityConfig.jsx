import { DiarioObra } from "@/entities/DiarioObra";
import { EnsaioDensidade } from "@/entities/EnsaioDensidade";
import { ChecklistUsina } from "@/entities/ChecklistUsina";
import { ChecklistMRAF } from "@/entities/ChecklistMRAF";
import { ChecklistConcretagem } from "@/entities/ChecklistConcretagem";
import { base44 } from "@/api/base44Client";

export const entityMap = {
  "DiarioObra": DiarioObra,
  "EnsaioCAUQ": base44.entities.EnsaioCAUQ,
  "EnsaioMRAF": base44.entities.EnsaioMRAF,
  "EnsaioDensidade": EnsaioDensidade,
  "EnsaioDensidadeInSitu": base44.entities.EnsaioDensidadeInSitu,
  "EnsaioTaxaPinturaImprimacao": base44.entities.EnsaioTaxaPinturaImprimacao,
  "ChecklistUsina": ChecklistUsina,
  "ChecklistAplicacao": base44.entities.ChecklistAplicacao,
  "ChecklistMRAF": ChecklistMRAF,
  "ChecklistConcretagem": ChecklistConcretagem,
  "ChecklistTerraplanagem": base44.entities.ChecklistTerraplanagem,
  "ChecklistReciclagem": base44.entities.ChecklistReciclagem,
  "EnsaioSondagem": base44.entities.EnsaioSondagem,
  "EnsaioGranulometriaIndividual": base44.entities.EnsaioGranulometriaIndividual,
  "AcompanhamentoUsinagem": base44.entities.AcompanhamentoUsinagem,
  "AcompanhamentoCarga": base44.entities.AcompanhamentoCarga,
  "EnsaioManchaPendulo": base44.entities.EnsaioManchaPendulo
};

export const loadAllEnsaios = async () => {
  const [
    diariosData,
    ensaiosCAUQData,
    ensaiosMRAFData,
    densidadeData,
    densidadeInSituData,
    taxaPinturaData,
    checklistsData,
    checklistsAplicacaoData,
    checklistsMRAFData,
    checklistsConcretagemData,
    checklistsTerraplanamemData,
    checklistsReciclagemData,
    sondagemData,
    granulometriaIndividualData,
    acompanhamentoUsinagemData,
    acompanhamentoCargaData,
    manchaPenduloData
  ] = await Promise.all([
    DiarioObra.list("-created_date", 1000),
    base44.entities.EnsaioCAUQ.list("-created_date", 1000),
    base44.entities.EnsaioMRAF.list("-created_date", 1000),
    EnsaioDensidade.list("-created_date", 1000),
    base44.entities.EnsaioDensidadeInSitu.list("-created_date", 1000),
    base44.entities.EnsaioTaxaPinturaImprimacao.list("-created_date", 1000),
    ChecklistUsina.list("-created_date", 1000),
    base44.entities.ChecklistAplicacao.list("-created_date", 1000),
    ChecklistMRAF.list("-created_date", 1000),
    ChecklistConcretagem.list("-created_date", 1000),
    base44.entities.ChecklistTerraplanagem.list("-created_date", 1000),
    base44.entities.ChecklistReciclagem.list("-created_date", 1000),
    base44.entities.EnsaioSondagem.list("-created_date", 1000),
    base44.entities.EnsaioGranulometriaIndividual.list("-created_date", 1000),
    base44.entities.AcompanhamentoUsinagem.list("-created_date", 1000),
    base44.entities.AcompanhamentoCarga.list("-created_date", 1000),
    base44.entities.EnsaioManchaPendulo.list("-created_date", 1000)
  ]);

  return [
    ...diariosData.map((d) => ({ ...d, entityType: "DiarioObra" })),
    ...ensaiosCAUQData.map((d) => ({ ...d, entityType: "EnsaioCAUQ" })),
    ...ensaiosMRAFData.map((d) => ({ ...d, entityType: "EnsaioMRAF" })),
    ...densidadeData.map((d) => ({ ...d, entityType: "EnsaioDensidade" })),
    ...densidadeInSituData.map((d) => ({ ...d, entityType: "EnsaioDensidadeInSitu" })),
    ...taxaPinturaData.map((d) => ({ ...d, entityType: "EnsaioTaxaPinturaImprimacao" })),
    ...checklistsData.map((d) => ({ ...d, entityType: "ChecklistUsina" })),
    ...checklistsAplicacaoData.map((d) => ({ ...d, entityType: "ChecklistAplicacao" })),
    ...checklistsMRAFData.map((d) => ({ ...d, entityType: "ChecklistMRAF" })),
    ...checklistsConcretagemData.map((d) => ({ ...d, entityType: "ChecklistConcretagem" })),
    ...checklistsTerraplanamemData.map((d) => ({ ...d, entityType: "ChecklistTerraplanagem" })),
    ...checklistsReciclagemData.map((d) => ({ ...d, entityType: "ChecklistReciclagem" })),
    ...sondagemData.map((d) => ({ ...d, entityType: "EnsaioSondagem" })),
    ...granulometriaIndividualData.map((d) => ({ ...d, entityType: "EnsaioGranulometriaIndividual" })),
    ...acompanhamentoUsinagemData.map((d) => ({ ...d, entityType: "AcompanhamentoUsinagem" })),
    ...acompanhamentoCargaData.map((d) => ({ ...d, entityType: "AcompanhamentoCarga" })),
    ...manchaPenduloData.map((d) => ({ ...d, entityType: "EnsaioManchaPendulo" }))
  ];
};