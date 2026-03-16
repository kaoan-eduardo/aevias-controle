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

export const loadAllData = async () => {
  const currentUser = await User.me();
  
  // Carregar todos os usuários para mapear nomes corretamente
  let allUsers;
  try {
    allUsers = await base44.entities.User.list();
  } catch (error) {
    console.warn("⚠️ Sem permissão para listar usuários - usando fallback");
    allUsers = [currentUser];
  }

  const currentUserAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');

  // Carregar dados em paralelo
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
    taxaMRAFData
  ] = await Promise.all([
    Obra.list(),
    Regional.list(),
    Project.list(),
    DiarioObra.list("-created_date", 1000),
    base44.entities.EnsaioCAUQ.list("-created_date", 1000),
    base44.entities.EnsaioMRAF.list("-created_date", 1000),
    EnsaioDensidade.list("-created_date", 1000),
    base44.entities.EnsaioDensidadeInSitu.list("-created_date", 1000),
    base44.entities.EnsaioTaxaPinturaImprimacao.list("-created_date", 1000),
    ChecklistUsina.list("-created_date", 1000),
    ChecklistAplicacao.list("-created_date", 1000),
    ChecklistMRAF.list("-created_date", 1000),
    ChecklistConcretagem.list("-created_date", 1000),
    base44.entities.ChecklistTerraplanagem.list("-created_date", 1000),
    base44.entities.ChecklistReciclagem.list("-created_date", 1000),
    base44.entities.EnsaioSondagem.list("-created_date", 1000),
    base44.entities.EnsaioGranulometriaIndividual.list("-created_date", 1000),
    base44.entities.AcompanhamentoUsinagem.list("-created_date", 1000),
    base44.entities.AcompanhamentoCarga.list("-created_date", 1000),
    base44.entities.EnsaioManchaPendulo.list("-created_date", 1000),
    base44.entities.EnsaioVigaBenkelman.list("-created_date", 1000),
    base44.entities.EnsaioTaxaMRAF.list("-created_date", 1000),
    base44.entities.BoletimSondagem.list("-created_date", 1000)
  ]);

  console.log("📊 [DEBUG] ChecklistAplicacao carregados:", checklistsAplicacaoData.length);
  console.log("📊 [DEBUG] ✨ EnsaioManchaPendulo carregados:", manchaPenduloData?.length || 0);
  if (manchaPenduloData && manchaPenduloData.length > 0) {
    console.log("  - Detalhes Mancha+Pêndulo:", manchaPenduloData.map(mp => ({ id: mp.id, status: mp.status, obra_id: mp.obra_id })));
  }

  console.log("📊 [DEBUG] ChecklistConcretagem carregados:", checklistsConcretagemData.length);
  checklistsConcretagemData.forEach(cc => {
    console.log("  - ChecklistConcretagem ID:", cc.id, "Status:", cc.status, "Approved:", cc.approved, "Data:", cc.data);
  });
  console.log("📊 [DEBUG] Obras carregadas:", obrasData.length);
  obrasData.forEach(o => console.log("  - Obra:", o.id, o.name, "Regional:", o.regional_id));
  console.log("📊 [DEBUG] Current user:", currentUser.email, "Access:", currentUserAccessLevel);

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
    ...taxaMRAFData.map((d) => ({ ...d, entityType: "EnsaioTaxaMRAF" }))
  ].sort((a, b) => {
    const getRelevantDate = (ensaio) => getDataEnsaio(ensaio);
    
    // Ordenar por data do ensaio (decrescente - mais recente primeiro)
    const dateA = new Date(getRelevantDate(a));
    const dateB = new Date(getRelevantDate(b));
    
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

  console.log("📊 [DEBUG] Total combinado:", combinedEnsaios.length);
  console.log("📊 [DEBUG] ✨ Mancha+Pêndulo no combinado:", combinedEnsaios.filter(e => e.entityType === 'EnsaioManchaPendulo').length);

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