// Hook que encapsula carregamento de ensaios e filtragem por nível de acesso

import { useState, useEffect, useCallback } from 'react';
import { loadAllData } from '@/components/ensaios/dataLoader';
import { getUserAccessLevel } from '@/utils/accessControl';

function filtrarPorAcesso(combinedEnsaios, currentUser, currentUserAccessLevel, obrasData, regionaisData) {
  if (currentUserAccessLevel === 'admin') {
    return combinedEnsaios;
  }

  if (currentUserAccessLevel === 'sala_tecnica_afirmaevias') {
    const regionaisDoUsuario = regionaisData.filter((r) =>
      (r.salas_tecnicas_responsaveis || []).some((e) => e.toLowerCase() === currentUser.email.toLowerCase())
    );
    const obrasIds = new Set(
      obrasData.filter((o) => regionaisDoUsuario.some((r) => r.id === o.regional_id)).map((o) => o.id)
    );
    return combinedEnsaios.filter((e) => obrasIds.has(e.obra_id));
  }

  if (currentUserAccessLevel === 'gestor_contrato') {
    const regionaisDoUsuario = regionaisData.filter((r) => {
      const gestores = r.gestores_contrato_responsaveis || [];
      return (
        r.gestor_contrato_responsavel?.toLowerCase() === currentUser.email.toLowerCase() ||
        gestores.some((e) => e.toLowerCase() === currentUser.email.toLowerCase())
      );
    });
    const obrasIds = new Set(
      obrasData.filter((o) => regionaisDoUsuario.some((r) => r.id === o.regional_id)).map((o) => o.id)
    );
    return combinedEnsaios.filter((e) => obrasIds.has(e.obra_id));
  }

  if (currentUserAccessLevel === 'cliente') {
    const regionaisDoUsuario = regionaisData.filter((r) =>
      (r.clientes_responsaveis || []).some((e) => e.toLowerCase() === currentUser.email.toLowerCase())
    );
    const obrasIds = new Set(
      obrasData.filter((o) => regionaisDoUsuario.some((r) => r.id === o.regional_id)).map((o) => o.id)
    );
    // Cliente vê apenas aprovados ou assinados
    return combinedEnsaios.filter(
      (e) => obrasIds.has(e.obra_id) && (e.approved === true || e.client_signature?.signed_by)
    );
  }

  // Laboratorista: próprios registros
  return combinedEnsaios.filter((e) => {
    const emailMatch = e.created_by?.toLowerCase() === currentUser.email?.toLowerCase();
    const nameMatch =
      currentUser.laboratorista_name &&
      e.laboratorista_name?.toLowerCase() === currentUser.laboratorista_name?.toLowerCase();
    return emailMatch || nameMatch;
  });
}

export function useEnsaiosList() {
  const [ensaios, setEnsaios] = useState([]);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        currentUser,
        allUsers: loadedUsers,
        currentUserAccessLevel,
        obrasData,
        regionaisData,
        projectsData,
        combinedEnsaios,
      } = await loadAllData();

      setUser(currentUser);
      setAllUsers(loadedUsers);
      setObras(obrasData);
      setProjects(projectsData);

      const ensaiosFiltrados = filtrarPorAcesso(
        combinedEnsaios,
        currentUser,
        currentUserAccessLevel,
        obrasData,
        regionaisData
      );
      setEnsaios(ensaiosFiltrados);
    } catch (error) {
      console.error('[useEnsaiosList] Erro ao carregar dados:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { ensaios, obras, projects, allUsers, user, loading, reload: loadData };
}