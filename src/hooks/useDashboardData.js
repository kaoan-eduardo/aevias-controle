// Hook customizado que encapsula toda a lógica do Dashboard

import { useState, useEffect, useMemo, useCallback } from 'react';
import { subMonths } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { loadDashboardData } from '@/services/dashboardService';
import { isCliente, isEngenheiroCliente } from '@/utils/accessControl';
import {
  calcularStats,
  calcularGraficoMensal,
  calcularGraficoStatus,
  calcularGraficoPorObra,
  calcularGraficoPorTipo,
  calcularApprovalPercentage,
} from '@/utils/dashboardCalculations';

const DEFAULT_FILTERS = {
  obraId: null,
  status: null,
  tipoRegistro: null,
  periodo: '6meses',
};

export function useDashboardData() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState({ obras: [], projects: [], ensaios: [], regionais: [] });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Carregar dados na montagem
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const userData = await base44.auth.me();
        if (cancelled) return;
        setUser(userData);
        const data = await loadDashboardData(userData);
        if (cancelled) return;
        setRawData(data);
      } catch (err) {
        console.error('[useDashboardData] Erro:', err?.message || err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filtrar ensaios de acordo com os filtros ativos
  const filteredEnsaios = useMemo(() => {
    let filtered = rawData.ensaios;
    const now = new Date();
    const startDate = filters.periodo === '1mes'
      ? subMonths(now, 1)
      : filters.periodo === '3meses'
        ? subMonths(now, 3)
        : subMonths(now, 6);

    filtered = filtered.filter(e => new Date(e.created_date) >= startDate);
    if (filters.obraId) filtered = filtered.filter(e => e.obra_id === filters.obraId);
    if (filters.status === 'approved') filtered = filtered.filter(e => e.approved === true);
    else if (filters.status === 'pending') filtered = filtered.filter(e => e.approved === null);
    else if (filters.status === 'rejected') filtered = filtered.filter(e => e.approved === false);
    if (filters.tipoRegistro) filtered = filtered.filter(e => e.entityType === filters.tipoRegistro);

    return filtered;
  }, [rawData.ensaios, filters]);

  // Dados derivados como useMemo — sem useState desnecessário
  const isClienteUser = useMemo(() => isCliente(user), [user]);
  const isEngenheiroUser = useMemo(() => isEngenheiroCliente(user), [user]);

  const stats = useMemo(
    () => calcularStats(filteredEnsaios, rawData.obras, rawData.projects, isClienteUser, isEngenheiroUser),
    [filteredEnsaios, rawData.obras, rawData.projects, isClienteUser, isEngenheiroUser]
  );

  const charts = useMemo(() => ({
    monthly: calcularGraficoMensal(filteredEnsaios, filters.periodo, isClienteUser),
    status: calcularGraficoStatus(filteredEnsaios, isClienteUser, isEngenheiroUser),
    porObra: calcularGraficoPorObra(filteredEnsaios, rawData.obras, filters.periodo),
    porTipo: calcularGraficoPorTipo(filteredEnsaios),
  }), [filteredEnsaios, filters.periodo, rawData.obras, isClienteUser, isEngenheiroUser]);

  const approvalPercentage = useMemo(
    () => calcularApprovalPercentage(stats, isClienteUser),
    [stats, isClienteUser]
  );

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const handlePieClick = useCallback((data, chartType) => {
    setFilters(prev => {
      if (chartType === 'status') {
        const statusMap = {
          'Aprovados': 'approved', 'Pendentes': 'pending', 'Reprovados': 'rejected',
          'Assinados': 'approved', 'Aguardando': 'pending',
        };
        const next = statusMap[data.name];
        return { ...prev, status: prev.status === next ? null : next };
      }
      if (chartType === 'obra') {
        return { ...prev, obraId: prev.obraId === data.obraId ? null : data.obraId };
      }
      if (chartType === 'type') {
        return { ...prev, tipoRegistro: prev.tipoRegistro === data.entityType ? null : data.entityType };
      }
      return prev;
    });
  }, []);

  return {
    loading,
    user,
    filters,
    setFilters,
    clearFilters,
    handlePieClick,
    stats,
    charts,
    approvalPercentage,
    obras: rawData.obras,
    isClienteUser,
    isEngenheiroUser,
    hasActiveFilters: Boolean(filters.obraId || filters.status || filters.tipoRegistro),
  };
}