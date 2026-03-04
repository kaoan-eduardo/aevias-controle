import { MapPin, Building } from "lucide-react";

export const getLocalInfo = (ensaio) => {
  const entityType = ensaio.entityType;

  if (entityType === "DiarioObra") {
    if (ensaio.tipo_local === "usina") {
      return {
        tipo: "Usina",
        detalhes: ensaio.usina_selecionada || "Não informado",
        icon: Building
      };
    } else {
      return {
        tipo: "Campo",
        detalhes: `${ensaio.rodovia || "Rodovia não informada"} - ${ensaio.trecho || "Trecho não informado"}`,
        icon: MapPin
      };
    }
  } else if (entityType === "ChecklistUsina") {
    return {
      tipo: "Usina",
      detalhes: ensaio.usina || "Não informado",
      icon: Building
    };
  } else if (entityType === "ChecklistAplicacao" || entityType === "ChecklistMRAF" || entityType === "ChecklistConcretagem" || entityType === "ChecklistTerraplanagem" || entityType === "ChecklistReciclagem" || entityType === "EnsaioSondagem" || entityType === "EnsaioTaxaPinturaImprimacao" || entityType === "EnsaioGranulometriaIndividual" || entityType === "EnsaioManchaPendulo" || entityType === "EnsaioVigaBenkelman") {
    return {
      tipo: "Campo",
      detalhes: `${ensaio.rodovia || "Rodovia não informada"} - ${ensaio.trecho || ensaio.estaca || ensaio.local_coleta || "Trecho não informado"}`,
      icon: MapPin
    };
  } else {
    return {
      tipo: "Local",
      detalhes: ensaio.collection_point || ensaio.location || "Não informado",
      icon: MapPin
    };
  }
};

export const getLaboratoristaInfo = (ensaio, allUsers) => {
  if (ensaio.laboratorista_name) return ensaio.laboratorista_name;
  
  if (ensaio.created_by && allUsers) {
    const user = allUsers.find(u => u.email?.toLowerCase() === ensaio.created_by?.toLowerCase());
    if (user) {
      return user.laboratorista_name || user.full_name || ensaio.created_by.split('@')[0];
    }
  }
  
  return ensaio.created_by?.split('@')[0] || "Não identificado";
};

export const getResponsavelInfo = (ensaio) => {
  const entityType = ensaio.entityType;
  
  if (entityType === "ChecklistUsina" || entityType === "ChecklistAplicacao" || entityType === "ChecklistMRAF") {
    return ensaio.usina || "Não informado";
  } else if (entityType === "ChecklistConcretagem") {
    return ensaio.concreteira || "Não informado";
  } else if (entityType === "ChecklistTerraplanagem") {
    return ensaio.empreiteira || "Não informado";
  }
  
  return null;
};

export const getEmpireiteiraInfo = (ensaio) => {
  const entityType = ensaio.entityType;
  
  if (entityType === "DiarioObra" || entityType === "ChecklistAplicacao" || entityType === "ChecklistMRAF" || entityType === "ChecklistConcretagem" || entityType === "ChecklistTerraplanagem" || entityType === "ChecklistReciclagem") {
    return ensaio.empreiteira || null;
  }
  
  return null;
};

export const getRodoviaInfo = (ensaio) => {
  return ensaio.rodovia || null;
};

export const getTrechoInfo = (ensaio) => {
  return ensaio.trecho || ensaio.estaca || null;
};

export const getNaoConformidades = (ensaio) => {
  const naoConformidades = [];
  
  if (ensaio.entityType === "ChecklistUsina") {
    const controle = ensaio.controle_cauq || {};
    
    if (controle.granulometria?.conforme === false) {
      naoConformidades.push("Granulometria");
    }
    if (controle.volume_vazios?.conforme === false) {
      naoConformidades.push("Volume de Vazios");
    }
    if (controle.rbv?.conforme === false) {
      naoConformidades.push("RBV");
    }
    if (controle.rtcd_25c?.conforme === false) {
      naoConformidades.push("RTCD a 25°C");
    }
    if (controle.estabilidade?.conforme === false) {
      naoConformidades.push("Estabilidade");
    }
    if (controle.fluencia?.conforme === false) {
      naoConformidades.push("Fluência");
    }
    if (controle.extracao_ligante_rotarex?.conforme === false) {
      naoConformidades.push("Extração Ligante (Rotarex)");
    }
    if (controle.extracao_ligante_soxhlet?.conforme === false) {
      naoConformidades.push("Extração Ligante (Soxhlet)");
    }
  }
  
  if (ensaio.entityType === "ChecklistMRAF") {
    const acomp = ensaio.acompanhamento_aplicacao || {};
    
    if (acomp.taxa_aplicacao?.conforme === false) {
      naoConformidades.push("Taxa de Aplicação");
    }
    if (acomp.residuo_emulsao?.conforme === false) {
      naoConformidades.push("Resíduo da Emulsão");
    }
    if (acomp.espessura_camada?.conforme === false) {
      naoConformidades.push("Espessura da Camada");
    }
  }

  if (ensaio.entityType === "ChecklistAplicacao") {
    const pintura = ensaio.pintura_ligacao || {};
    
    if (pintura.taxa_pintura?.conforme === false) {
      naoConformidades.push("Taxa de Pintura");
    }
    if (pintura.taxa_pintura_residual?.conforme === false) {
      naoConformidades.push("Taxa de Pintura Residual");
    }
  }

  if (ensaio.entityType === "ChecklistConcretagem") {
    const cargas = ensaio.cargas_concreto || [];
    cargas.forEach((carga, idx) => {
      if (carga.slump_test?.conforme === false) {
        naoConformidades.push(`Slump Test (Carga ${carga.numero_carga || idx + 1})`);
      }
      if (carga.espessura_camada?.conforme === false) {
        naoConformidades.push(`Espessura da Camada (Carga ${carga.numero_carga || idx + 1})`);
      }
    });
  }
  
  if (ensaio.entityType === "EnsaioVigaBenkelman") {
    const def_admissivel = parseFloat(ensaio.def_admissivel) || 0;
    if (def_admissivel > 0) {
      const levantamentos = ensaio.levantamentos || [];
      const pontosNC = [];
      
      levantamentos.forEach((lev, idx) => {
        if (lev.bordo_esquerdo?.deflexao > def_admissivel ||
            lev.eixo?.deflexao > def_admissivel ||
            lev.bordo_direito?.deflexao > def_admissivel) {
          if (lev.estaca_km) {
            pontosNC.push(`Estaca ${lev.estaca_km}`);
          }
        }
      });
      
      if (pontosNC.length > 0) {
        naoConformidades.push(`Deflexão acima do limite em ${pontosNC.length} ponto(s)`);
      }
    }
  }
  
  if (ensaio.entityType === "EnsaioManchaPendulo") {
    if (ensaio.condicao_conformidade === "NÃO CONFORME") {
      naoConformidades.push("Resultado não conforme");
    }
  }
  
  return naoConformidades;
};

export const getStatusInfo = (ensaio) => {
  if (ensaio.client_signature?.signed_by) {
    return { text: "Assinado", icon: "CheckCircle", className: "bg-[#00233B]/10 text-[#00233B] border border-[#00233B]/30 hover:bg-[#00233B]/20 hover:border-[#00233B]/40 transition-colors" };
  }
  if (ensaio.approved === true) {
    return { text: "Aprovado", icon: "CheckCircle", className: "bg-[#566E3D]/10 text-[#566E3D] border border-[#566E3D]/30 hover:bg-[#566E3D]/20 hover:border-[#566E3D]/40 transition-colors" };
  }
  if (ensaio.approved === false) {
    return { text: "Reprovado", icon: "XCircle", className: "bg-[#800020]/10 text-[#800020] border border-[#800020]/30 hover:bg-[#800020]/20 hover:border-[#800020]/40 transition-colors" };
  }
  if (ensaio.was_rejected === true) {
    return { text: "Pendente", icon: "Clock", className: "bg-orange-100/80 text-orange-800 border border-orange-300/50 hover:bg-orange-200/80 hover:border-orange-400/50 transition-colors", wasRejected: true };
  }
  return { text: "Pendente", icon: "Clock", className: "bg-[#FBBF24]/10 text-[#854d0e] border border-[#FBBF24]/30 hover:bg-[#FBBF24]/20 hover:border-[#FBBF24]/40 transition-colors" };
};