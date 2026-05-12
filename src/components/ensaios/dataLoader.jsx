import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Project } from "@/entities/Project";
import { DiarioObra } from "@/entities/DiarioObra";
import { EnsaioDensidade } from "@/entities/EnsaioDensidade";
import { ChecklistUsina } from "@/entities/ChecklistUsina";
import { ChecklistAplicacao } from "@/entities/ChecklistAplicacao";
import { ChecklistMRAF } from "@/entities/ChecklistMRAF";
import { ChecklistConcretagem } from "@/entities/ChecklistConcretagem";
import { base44 } from "@/api/base44Client";
import { getDataEnsaio } from "./ensaioMappers";

// Retry helper para carregamento com fallback
const loadWithFallback = async (fn, entityName, fallback = []) => {
  try {
    return await fn();
  } catch (error) {
    console.warn(`⚠️ [${entityName}] Falha ao carregar - usando fallback:`, error?.message || error);
    return fallback;
  }
};

export const loadAllData = async () => {
  const currentUser = await User.me();
  
  // Carregar todos os usuários para mapear nomes corretamente
  const allUsers = await loadWithFallback(
    () => base44.entities.User.list(),
    "User",
    [currentUser]
  );

  const currentUserAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');

  // Carregar dados em paralelo com fallback por entidade
  const [
    obrasData,
    regionaisData,
    projectsData,
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
    manchaPenduloData,
    vigaBenkelmanData,
    taxaMRAFData,
    boletimSondagemData,
    boletimSondagemTradoData,
    ensaioProctorData,
    rompimentoConcretoData,
    granMisturaData
  ] = await Promise.all([
    loadWithFallback(() => Obra.list(), "Obra", []),
    loadWithFallback(() => Regional.list(), "Regional", []),
    loadWithFallback(() => Project.list(), "Project", []),
    loadWithFallback(() => DiarioObra.list("-created_date", 1000), "DiarioObra", []),
    loadWithFallback(() => base44.entities.EnsaioCAUQ.list("-created_date", 1000), "EnsaioCAUQ", []),
    loadWithFallback(() => base44.entities.EnsaioMRAF.list("-created_date", 1000), "EnsaioMRAF", []),
    loadWithFallback(() => EnsaioDensidade.list("-created_date", 1000), "EnsaioDensidade", []),
    loadWithFallback(() => base44.entities.EnsaioDensidadeInSitu.list("-created_date", 1000), "EnsaioDensidadeInSitu", []),
    loadWithFallback(() => base44.entities.EnsaioTaxaPinturaImprimacao.list("-created_date", 1000), "EnsaioTaxaPinturaImprimacao", []),
    loadWithFallback(() => ChecklistUsina.list("-created_date", 1000), "ChecklistUsina", []),
    loadWithFallback(() => ChecklistAplicacao.list("-created_date", 1000), "ChecklistAplicacao", []),
    loadWithFallback(() => ChecklistMRAF.list("-created_date", 1000), "ChecklistMRAF", []),
    loadWithFallback(() => ChecklistConcretagem.list("-created_date", 1000), "ChecklistConcretagem", []),
    loadWithFallback(() => base44.entities.ChecklistTerraplanagem.list("-created_date", 1000), "ChecklistTerraplanagem", []),
    loadWithFallback(() => base44.entities.ChecklistReciclagem.list("-created_date", 1000), "ChecklistReciclagem", []),
    loadWithFallback(() => base44.entities.EnsaioSondagem.list("-created_date", 1000), "EnsaioSondagem", []),
    loadWithFallback(() => base44.entities.EnsaioGranulometriaIndividual.list("-created_date", 1000), "EnsaioGranulometriaIndividual", []),
    loadWithFallback(() => base44.entities.AcompanhamentoUsinagem.list("-created_date", 1000), "AcompanhamentoUsinagem", []),
    loadWithFallback(() => base44.entities.AcompanhamentoCarga.list("-created_date", 1000), "AcompanhamentoCarga", []),
    loadWithFallback(() => base44.entities.EnsaioManchaPendulo.list("-created_date", 1000), "EnsaioManchaPendulo", []),
    loadWithFallback(() => base44.entities.EnsaioVigaBenkelman.list("-created_date", 1000), "EnsaioVigaBenkelman", []),
    loadWithFallback(() => base44.entities.EnsaioTaxaMRAF.list("-created_date", 1000), "EnsaioTaxaMRAF", []),
    loadWithFallback(() => base44.entities.BoletimSondagem.list("-created_date", 1000), "BoletimSondagem", []),
    loadWithFallback(() => base44.entities.BoletimSondagemTrado.list("-created_date", 1000), "BoletimSondagemTrado", []),
    loadWithFallback(() => base44.entities.EnsaioProctor.list("-created_date", 1000), "EnsaioProctor", []),
    loadWithFallback(() => base44.entities.EnsaioRompimentoConcreto.list("-created_date", 1000), "EnsaioRompimentoConcreto", []),
    loadWithFallback(() => base44.entities.GranuMistura.list("-created_date", 1000), "GranuMistura", [])
  ]);

  const combinedEnsaios = [
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
    ...manchaPenduloData.map((d) => ({ ...d, entityType: "EnsaioManchaPendulo" })),
    ...vigaBenkelmanData.map((d) => ({ ...d, entityType: "EnsaioVigaBenkelman" })),
    ...taxaMRAFData.map((d) => ({ ...d, entityType: "EnsaioTaxaMRAF" })),
    ...boletimSondagemData.map((d) => ({ ...d, entityType: "BoletimSondagem" })),
    ...boletimSondagemTradoData.map((d) => ({ ...d, entityType: "BoletimSondagemTrado" })),
    ...ensaioProctorData.map((d) => ({ ...d, entityType: "EnsaioProctor" })),
    ...rompimentoConcretoData.map((d) => ({ ...d, entityType: "EnsaioRompimentoConcreto" })),
    ...granMisturaData.map((d) => ({ ...d, entityType: "GranuMistura" }))
  ].sort((a, b) => {
    // Ordenar por data do ensaio (decrescente - mais recente primeiro)
    const dateA = new Date(getDataEnsaio(a));
    const dateB = new Date(getDataEnsaio(b));
    
    // Se ambas as datas são válidas, ordenar por data
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      // Critério de desempate: updated_date (mais recente primeiro)
      const updatedA = new Date(a.updated_date);
      const updatedB = new Date(b.updated_date);
      return updatedB.getTime() - updatedA.getTime();
    }
    
    // Se uma das datas for inválida, colocar registros com datas inválidas no final
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return 0;
  });

  return {
    currentUser,
    allUsers,
    currentUserAccessLevel,
    obrasData,
    regionaisData,
    projectsData,
    combinedEnsaios
  };
};