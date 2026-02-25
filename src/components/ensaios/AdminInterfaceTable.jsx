import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, CheckCircle, XCircle, PlusCircle, FlaskConical, Gauge, ClipboardList, Book, ArrowUpDown, ArrowUp, ArrowDown, Download, Trash2, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getEnsaioTypeInfo, getReportLink, getDataFormatted, getDataEnsaio } from "@/components/ensaios/ensaioMappers";
import { getLocalInfo, getLaboratoristaInfo, getEmpireiteiraInfo, getNaoConformidades, getStatusInfo } from "@/components/ensaios/utils";
import { Regional, User } from "@/entities/User";
import PaginationControls from "@/components/ensaios/PaginationControls";

const DateRangePicker = React.memo(({ startDate, endDate, onStartChange, onEndChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { Popover, PopoverContent, PopoverTrigger } = require("@/components/ui/popover");
  const { Label } = require("@/components/ui/label");
  const { Input } = require("@/components/ui/input");

  const formatDateRange = () => {
    if (!startDate && !endDate) return "Filtrar período";
    if (startDate && !endDate) return `≥ ${new Date(startDate).toLocaleDateString('pt-BR')}`;
    if (!startDate && endDate) return `≤ ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    return `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-normal hover:bg-black/10">
          <Filter className={`w-3 h-3 mr-1 ${startDate || endDate ? 'text-[#BFCF99]' : ''}`} />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-[#00233B]/80">Data Início</Label>
            <Input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          </div>
          <div>
            <Label className="text-xs text-[#00233B]/80">Data Fim</Label>
            <Input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          </div>
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => { onStartChange(''); onEndChange(''); setIsOpen(false); }}>Limpar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

const TextColumnFilter = React.memo(({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { Popover, PopoverContent, PopoverTrigger } = require("@/components/ui/popover");
  const { Label } = require("@/components/ui/label");
  const { Input } = require("@/components/ui/input");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-normal hover:bg-black/10">
          <Filter className={`w-3 h-3 ${value ? 'text-[#BFCF99]' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-2">
          <Label className="text-xs text-[#00233B]/80">{placeholder}</Label>
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => { onChange(''); setIsOpen(false); }}>Limpar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

const SelectColumnFilter = React.memo(({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { Popover, PopoverContent, PopoverTrigger } = require("@/components/ui/popover");
  const { Label } = require("@/components/ui/label");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-normal hover:bg-black/10">
          <Filter className={`w-3 h-3 ${value !== 'all' ? 'text-[#BFCF99]' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-1">
          <Label className="text-xs text-[#00233B]/80 px-2">{placeholder}</Label>
          {options.map((option) => (
            <Button key={option.value} variant="ghost" size="sm" className={`w-full justify-start text-xs h-8 ${value === option.value ? 'bg-black/10' : ''}`} onClick={() => { onChange(option.value); setIsOpen(false); }}>
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default function AdminInterfaceTable({ ensaios, obras, projects, onApprove, onReject, onDelete, user, canApprove, canCreate, allUsers, ReprovacaoModal, ExclusaoModal }) {
  const [nomeFilter, setNomeFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');
  const [projetoFilter, setProjetoFilter] = useState('');
  const [localFilter, setLocalFilter] = useState('');
  const [empreiteiraFilter, setEmpreiteiraFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusObraFilter, setStatusObraFilter] = useState('all');
  const [reprovingEnsaio, setReprovingEnsaio] = useState(null);
  const [deletingEnsaio, setDeletingEnsaio] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedEnsaios, setSelectedEnsaios] = useState([]);
  const [filteredEnsaios, setFilteredEnsaios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => {
      if (prev === 'desc') return 'asc';
      if (prev === 'asc') return null;
      return 'desc';
    });
  }, []);

  useEffect(() => {
    let filtered = ensaios;

    if (nomeFilter) {
      filtered = filtered.filter((ensaio) => {
        const laboratorista = getLaboratoristaInfo(ensaio, allUsers);
        return laboratorista.toLowerCase().includes(nomeFilter.toLowerCase());
      });
    }

    if (obraFilter) {
      filtered = filtered.filter((ensaio) => {
        const obra = obras.find((o) => o.id === ensaio.obra_id);
        return obra?.name?.toLowerCase().includes(obraFilter.toLowerCase()) || obra?.code?.toLowerCase().includes(obraFilter.toLowerCase());
      });
    }

    if (projetoFilter) {
      filtered = filtered.filter((ensaio) => {
        if (!ensaio.project_id) return false;
        const projeto = projects.find((p) => p.id === ensaio.project_id);
        return projeto?.name?.toLowerCase().includes(projetoFilter.toLowerCase());
      });
    }

    if (localFilter) {
      filtered = filtered.filter((ensaio) => {
        const localInfo = getLocalInfo(ensaio);
        return localInfo.tipo?.toLowerCase().includes(localFilter.toLowerCase()) || localInfo.detalhes?.toLowerCase().includes(localFilter.toLowerCase());
      });
    }

    if (empreiteiraFilter) {
      filtered = filtered.filter((ensaio) => {
        const empreiteira = getEmpireiteiraInfo(ensaio);
        if (!empreiteira) return false;
        return empreiteira.toLowerCase().includes(empreiteiraFilter.toLowerCase());
      });
    }

    if (dataInicioFilter) {
      filtered = filtered.filter((ensaio) => {
        const dataEnsaio = getDataEnsaio(ensaio);
        if (!dataEnsaio) return false;
        const ensaioDate = new Date(dataEnsaio);
        ensaioDate.setHours(0, 0, 0, 0);
        const startFilterDate = new Date(dataInicioFilter);
        startFilterDate.setHours(0, 0, 0, 0);
        return ensaioDate >= startFilterDate;
      });
    }

    if (dataFimFilter) {
      filtered = filtered.filter((ensaio) => {
        const dataEnsaio = getDataEnsaio(ensaio);
        if (!dataEnsaio) return false;
        const ensaioDate = new Date(dataEnsaio);
        ensaioDate.setHours(0, 0, 0, 0);
        const endFilterDate = new Date(dataFimFilter);
        endFilterDate.setHours(23, 59, 59, 999);
        return ensaioDate <= endFilterDate;
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((ensaio) => {
        if (statusFilter === 'approved') return ensaio.approved === true && !ensaio.client_signature?.signed_by;
        if (statusFilter === 'pending') return ensaio.approved === null;
        if (statusFilter === 'rejected') return ensaio.approved === false;
        if (statusFilter === 'signed') return ensaio.client_signature?.signed_by;
        return true;
      });
    }

    if (typeFilter) {
      filtered = filtered.filter((ensaio) => {
        const { name } = getEnsaioTypeInfo(ensaio);
        return name.toLowerCase().includes(typeFilter.toLowerCase());
      });
    }

    if (statusObraFilter !== 'all') {
      filtered = filtered.filter((ensaio) => {
        const obra = obras.find((o) => o.id === ensaio.obra_id);
        return obra?.status === statusObraFilter;
      });
    }

    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(getDataEnsaio(a));
        const dateB = new Date(getDataEnsaio(b));
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    }

    setFilteredEnsaios(filtered);
    setCurrentPage(1);
  }, [ensaios, nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, statusFilter, typeFilter, statusObraFilter, obras, projects, sortOrder, allUsers]);

  const paginatedEnsaios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEnsaios.slice(startIndex, endIndex);
  }, [filteredEnsaios, currentPage]);

  const totalPages = Math.ceil(filteredEnsaios.length / itemsPerPage);

  const handleApprove = useCallback(async (ensaio) => {
    if (!window.confirm(`Confirma a aprovação do registro "${ensaio.sample_id || ensaio.id}"?`)) return;

    try {
      let approverDetails = {
        name: user.laboratorista_name || user.full_name,
        position: user.position || 'Não informado',
        crea_number: user.crea_number || 'Não informado'
      };

      if (user.access_level === 'sala_tecnica_afirmaevias') {
        try {
          const regionaisData = await Regional.list();
          const obraDoEnsaio = obras.find(o => o.id === ensaio.obra_id);
          
          if (obraDoEnsaio) {
            const regionalDaObra = regionaisData.find(r => r.id === obraDoEnsaio.regional_id);
            
            if (regionalDaObra && regionalDaObra.gestor_contrato_responsavel) {
              const allUsersData = await User.list();
              const gestorUser = allUsersData.find(u => u.email.toLowerCase() === regionalDaObra.gestor_contrato_responsavel.toLowerCase());
              
              if (gestorUser) {
                approverDetails = {
                  name: gestorUser.laboratorista_name || gestorUser.full_name || regionalDaObra.gestor_contrato_responsavel,
                  position: gestorUser.position || 'Gestor de Contrato',
                  crea_number: gestorUser.crea_number || 'Não informado'
                };
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar dados do gestor para assinatura:', error);
        }
      }

      await onApprove(ensaio, approverDetails);
    } catch (error) {
      console.error("Erro ao aprovar ensaio:", error);
      alert('Erro ao aprovar ensaio. Tente novamente.');
    }
  }, [user, obras, onApprove]);

  const handleReject = useCallback(async (ensaio, motivo) => {
    if (!canApprove) {
      alert('Você não tem permissão para reprovar registros.');
      return;
    }
    await onReject(ensaio, motivo);
    setReprovingEnsaio(null);
  }, [canApprove, onReject]);

  const handleDelete = useCallback(async (ensaio) => {
    await onDelete(ensaio);
    setDeletingEnsaio(null);
  }, [onDelete]);

  const clearFilters = useCallback(() => {
    setNomeFilter('');
    setObraFilter('');
    setProjetoFilter('');
    setLocalFilter('');
    setEmpreiteiraFilter('');
    setDataInicioFilter('');
    setDataFimFilter('');
    setStatusFilter('all');
    setTypeFilter('');
    setStatusObraFilter('all');
    setSortOrder('desc');
    setCurrentPage(1);
  }, []);

  const toggleSelectEnsaio = useCallback((ensaioId) => {
    setSelectedEnsaios(prev => prev.includes(ensaioId) ? prev.filter(id => id !== ensaioId) : [...prev, ensaioId]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedEnsaios.length === filteredEnsaios.length) {
      setSelectedEnsaios([]);
    } else {
      setSelectedEnsaios(filteredEnsaios.map(e => e.id));
    }
  }, [selectedEnsaios, filteredEnsaios]);

  const handleGerarPDFConsolidado = useCallback(() => {
    if (selectedEnsaios.length === 0) {
      alert('Selecione pelo menos um ensaio para gerar o PDF consolidado.');
      return;
    }
    const idsParam = selectedEnsaios.join(',');
    window.open(createPageUrl(`RelatorioConsolidado?ids=${idsParam}`), '_blank');
  }, [selectedEnsaios]);

  const isAnyFilterActive = useMemo(() => {
    return nomeFilter !== '' || obraFilter !== '' || projetoFilter !== '' || localFilter !== '' || empreiteiraFilter !== '' || dataInicioFilter !== '' || dataFimFilter !== '' || statusFilter !== 'all' || typeFilter !== '' || statusObraFilter !== 'all';
  }, [nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, statusFilter, typeFilter, statusObraFilter]);

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'approved', label: 'Aprovados' },
    { value: 'rejected', label: 'Reprovados' },
    { value: 'signed', label: 'Assinados' },
  ];

  const statusObraOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'planejamento', label: 'Planejamento' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'pausada', label: 'Pausada' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#00233B]/70">
            <span>{filteredEnsaios.length} registro(s) encontrado(s)</span>
            {selectedEnsaios.length > 0 && (
              <Badge className="bg-[#BFCF99] text-[#00233B]">{selectedEnsaios.length} selecionado(s)</Badge>
            )}
            {isAnyFilterActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-[#00233B]/80 hover:bg-black/10">
                Limpar todos os filtros
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {selectedEnsaios.length > 0 && (
            <Button onClick={handleGerarPDFConsolidado} className="bg-[#566E3D] text-white hover:bg-[#566E3D]/90">
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF Consolidado ({selectedEnsaios.length})
            </Button>
          )}
          {canCreate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Novo Registro
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild><Link to={createPageUrl("DiarioObra")}><FileText className="mr-2 h-4 w-4" /> Diário de Obra</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={createPageUrl("EnsaioCAUQ")}><FlaskConical className="mr-2 h-4 w-4" /> Ensaio de CAUQ</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={createPageUrl("EnsaioDensidade")}><Gauge className="mr-2 h-4 w-4" /> Densidade CP</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={createPageUrl("ChecklistUsina")}><ClipboardList className="mr-2 h-4 w-4" /> Checklist de Usina</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={createPageUrl("ChecklistAplicacao")}><ClipboardList className="mr-2 h-4 w-4" /> Checklist de Aplicação</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={createPageUrl("ChecklistMRAF")}><ClipboardList className="mr-2 h-4 w-4" /> Checklist de MRAF</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={createPageUrl("ChecklistConcretagem")}><ClipboardList className="mr-2 h-4 w-4" /> Checklist de Concretagem</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={createPageUrl("ChecklistTerraplanagem")}><ClipboardList className="mr-2 h-4 w-4" /> Checklist de Terraplanagem</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 border-b border-white/10">
                <tr>
                  <th className="text-center px-1 py-2 font-medium text-[#00233B]" style={{ width: '30px' }}>
                    <input type="checkbox" checked={selectedEnsaios.length === filteredEnsaios.length && filteredEnsaios.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Tipo</span>
                      <TextColumnFilter value={typeFilter} onChange={setTypeFilter} placeholder="Filtrar por tipo..." />
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center gap-1">
                      <button onClick={toggleSortOrder} className="flex items-center gap-1 hover:text-[#BFCF99] transition-colors">
                        <span>Data</span>
                        {sortOrder === 'desc' && <ArrowDown className="w-3 h-3" />}
                        {sortOrder === 'asc' && <ArrowUp className="w-3 h-3" />}
                        {!sortOrder && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <DateRangePicker startDate={dataInicioFilter} endDate={dataFimFilter} onStartChange={setDataInicioFilter} onEndChange={setDataFimFilter} />
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Obra</span>
                      <TextColumnFilter value={obraFilter} onChange={setObraFilter} placeholder="Filtrar por obra..." />
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Lab.</span>
                      <TextColumnFilter value={nomeFilter} onChange={setNomeFilter} placeholder="Filtrar por nome..." />
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Local</span>
                      <TextColumnFilter value={localFilter} onChange={setLocalFilter} placeholder="Filtrar por local..." />
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Empreiteira</span>
                      <TextColumnFilter value={empreiteiraFilter} onChange={setEmpreiteiraFilter} placeholder="Filtrar por empreiteira..." />
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Projeto</span>
                      <TextColumnFilter value={projetoFilter} onChange={setProjetoFilter} placeholder="Filtrar por projeto..." />
                    </div>
                  </th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      <SelectColumnFilter value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="Filtrar por status" />
                    </div>
                  </th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '140px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnsaios.map((ensaio, index) => {
                  const obra = obras.find((o) => o.id === ensaio.obra_id);
                  const status = getStatusInfo(ensaio);
                  const { name, icon: TypeIcon } = getEnsaioTypeInfo(ensaio);
                  const reportUrl = getReportLink(ensaio);
                  const localInfo = getLocalInfo(ensaio);
                  const laboratorista = getLaboratoristaInfo(ensaio, allUsers);
                  const dataFormatted = getDataFormatted(ensaio);
                  const projeto = ensaio.project_id ? projects.find(p => p.id === ensaio.project_id) : null;

                  return (
                    <tr key={ensaio.id} className={`border-b border-white/10 hover:bg-black/5 ${index % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02]'}`}>
                      <td className="px-1 py-2 text-center">
                        <input type="checkbox" checked={selectedEnsaios.includes(ensaio.id)} onChange={() => toggleSelectEnsaio(ensaio.id)} className="cursor-pointer" />
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-[#00233B] flex items-center gap-1 text-xs">
                          <TypeIcon className="w-3 h-3 text-[#BFCF99]" /> 
                          <span className="truncate max-w-[120px]" title={name}>{name}</span>
                          {(() => {
                            const naoConformidades = getNaoConformidades(ensaio);
                            const temAcoesCorretivas = ensaio.acoes_corretivas_realizado === true;
                            
                            if (naoConformidades.length > 0) {
                              const mensagem = temAcoesCorretivas ? `Não conformidades:\n${naoConformidades.join('\n')}\n\n✓ Ações corretivas foram realizadas` : `Não conformidades:\n${naoConformidades.join('\n')}`;
                              return <span className="text-red-600 cursor-help" title={mensagem}>⚠️</span>;
                            }
                            if (temAcoesCorretivas) {
                              return <span className="text-orange-500 cursor-help" title="Ações corretivas realizadas">⚠️</span>;
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-[#00233B]/90 text-xs whitespace-nowrap">{dataFormatted}</td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-[#00233B] text-xs truncate max-w-[140px]" title={obra?.name}>{obra?.name || 'N/A'}</div>
                        <div className="text-[10px] text-[#00233B]/70">{obra?.code}</div>
                      </td>
                      <td className="px-2 py-2 text-[#00233B]/90 text-xs truncate max-w-[100px]" title={laboratorista}>{laboratorista}</td>
                      <td className="px-2 py-2">
                        <div className="text-[#00233B]/90 text-xs">{localInfo.tipo}</div>
                        <div className="text-[10px] text-[#00233B]/70 truncate max-w-[120px]" title={localInfo.detalhes}>{localInfo.detalhes}</div>
                      </td>
                      <td className="px-2 py-2">
                        {getEmpireiteiraInfo(ensaio) ? (
                          <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={getEmpireiteiraInfo(ensaio)}>{getEmpireiteiraInfo(ensaio)}</div>
                        ) : (
                          <div className="text-[#00233B]/50 text-center text-xs">-</div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {projeto ? (
                          <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={projeto.name}>{projeto.name}</div>
                        ) : (
                          <div className="text-[#00233B]/50 text-center text-xs">-</div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                       <Badge className={`${status.className} gap-1 text-[10px] px-2 py-0.5`}>
                         <status.icon className="w-3 h-3" />
                         {status.text}
                       </Badge>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <Button asChild variant="outline" size="sm" className="text-[#00233B] hover:bg-[#00233B]/10 hover:text-[#00233B] hover:border-[#00233B]/30 border-white/20 transition-colors h-7 px-2 text-xs">
                            <Link to={reportUrl} target="_blank"><FileText className="w-3 h-3" /></Link>
                          </Button>
                          {canApprove && ensaio.status !== 'rascunho' && (
                            <div className="flex gap-1">
                              {(ensaio.approved === null || ensaio.approved === false) && (
                                <Button size="sm" style={{ backgroundColor: '#566E3D' }} className="text-white hover:opacity-90 transition-opacity h-7 px-2" onClick={() => handleApprove(ensaio)} title="Aprovar">
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              )}
                              {ensaio.approved === null && (
                                <Button size="sm" style={{ backgroundColor: '#800020' }} className="text-white hover:opacity-90 transition-opacity h-7 px-2" onClick={() => setReprovingEnsaio(ensaio)} title="Reprovar">
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          {canApprove && ensaio.status === 'rascunho' && (
                            <span className="text-xs italic text-[#00233B]/60 ml-2">Em execução</span>
                          )}
                          {canApprove && (
                            <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setDeletingEnsaio(ensaio)} title="Excluir">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredEnsaios.length === 0 && (
              <div className="text-center py-12 text-[#00233B]/70">
                <FileText className="w-12 h-12 text-[#00233B]/30 mx-auto mb-4" />
                <h3 className="font-medium text-[#00233B] mb-2">Nenhum registro encontrado</h3>
                <p>Ajuste os filtros ou aguarde novos registros.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ReprovacaoModal ensaio={reprovingEnsaio} isOpen={!!reprovingEnsaio} onClose={() => setReprovingEnsaio(null)} onReprove={handleReject} />
      <ExclusaoModal ensaio={deletingEnsaio} isOpen={!!deletingEnsaio} onClose={() => setDeletingEnsaio(null)} onDelete={handleDelete} />
    </div>
  );
}