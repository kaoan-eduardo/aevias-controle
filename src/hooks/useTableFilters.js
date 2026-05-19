// Hook customizado para gerenciar estado de filtros de tabela
import { useState, useCallback, useMemo } from 'react';
import { getDataEnsaio } from '@/components/ensaios/ensaioMappers';
import { getLocalInfo, getLaboratoristaInfo, getEmpireiteiraInfo } from '@/components/ensaios/utils';

export function useTableFilters(ensaios, obras, projects, allUsers, applyCustomFilters = null) {
  const [nomeFilter, setNomeFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');
  const [projetoFilter, setProjetoFilter] = useState('');
  const [localFilter, setLocalFilter] = useState('');
  const [empreiteiraFilter, setEmpreiteiraFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : prev === 'asc' ? null : 'desc'));
  }, []);

  const filteredEnsaios = useMemo(() => {
    let filtered = ensaios;
    
    if (nomeFilter) filtered = filtered.filter((e) => getLaboratoristaInfo(e, allUsers).toLowerCase().includes(nomeFilter.toLowerCase()));
    if (obraFilter) filtered = filtered.filter((e) => {
      const o = obras.find((ob) => ob.id === e.obra_id);
      return o?.name?.toLowerCase().includes(obraFilter.toLowerCase()) || o?.code?.toLowerCase().includes(obraFilter.toLowerCase());
    });
    if (projetoFilter) filtered = filtered.filter((e) => {
      if (!e.project_id) return false;
      const p = projects.find((pr) => pr.id === e.project_id);
      return p?.name?.toLowerCase().includes(projetoFilter.toLowerCase());
    });
    if (localFilter) filtered = filtered.filter((e) => {
      const li = getLocalInfo(e);
      return li.tipo?.toLowerCase().includes(localFilter.toLowerCase()) || li.detalhes?.toLowerCase().includes(localFilter.toLowerCase());
    });
    if (empreiteiraFilter) filtered = filtered.filter((e) => getEmpireiteiraInfo(e)?.toLowerCase().includes(empreiteiraFilter.toLowerCase()) ?? false);
    
    if (dataInicioFilter) {
      const d = new Date(dataInicioFilter);
      d.setHours(0, 0, 0, 0);
      filtered = filtered.filter((e) => {
        const de = getDataEnsaio(e);
        if (!de) return false;
        const ed = new Date(de);
        ed.setHours(0, 0, 0, 0);
        return ed >= d;
      });
    }
    
    if (dataFimFilter) {
      const d = new Date(dataFimFilter);
      d.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => {
        const de = getDataEnsaio(e);
        if (!de) return false;
        const ed = new Date(de);
        ed.setHours(0, 0, 0, 0);
        return ed <= d;
      });
    }

    if (typeFilter && typeFilter !== 'all') filtered = filtered.filter((e) => e.entityType === typeFilter);
    
    if (applyCustomFilters) filtered = applyCustomFilters(filtered);
    
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const dA = new Date(getDataEnsaio(a)), dB = new Date(getDataEnsaio(b));
        if (isNaN(dA) || isNaN(dB)) return 0;
        return sortOrder === 'asc' ? dA - dB : dB - dA;
      });
    }
    
    return filtered;
  }, [ensaios, nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, typeFilter, obras, projects, sortOrder, allUsers, applyCustomFilters]);

  const clearFilters = useCallback(() => {
    setNomeFilter('');
    setObraFilter('');
    setProjetoFilter('');
    setLocalFilter('');
    setEmpreiteiraFilter('');
    setDataInicioFilter('');
    setDataFimFilter('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortOrder('desc');
    setCurrentPage(1);
  }, []);

  const isAnyFilterActive = !!(nomeFilter || obraFilter || projetoFilter || localFilter || empreiteiraFilter || dataInicioFilter || dataFimFilter || typeFilter !== 'all');

  const totalPages = Math.ceil(filteredEnsaios.length / itemsPerPage);
  const paginatedEnsaios = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnsaios.slice(start, start + itemsPerPage);
  }, [filteredEnsaios, currentPage]);

  return {
    // State
    nomeFilter, setNomeFilter,
    obraFilter, setObraFilter,
    projetoFilter, setProjetoFilter,
    localFilter, setLocalFilter,
    empreiteiraFilter, setEmpreiteiraFilter,
    dataInicioFilter, setDataInicioFilter,
    dataFimFilter, setDataFimFilter,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    sortOrder, setSortOrder,
    currentPage, setCurrentPage,
    // Computed
    filteredEnsaios,
    paginatedEnsaios,
    totalPages,
    isAnyFilterActive,
    // Methods
    toggleSortOrder,
    clearFilters,
  };
}