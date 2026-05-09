import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Edit, Clock, CheckCircle, XCircle, MessageSquare, Loader2, MapPin, User as UserIconSmall, Building, Filter, PlusCircle, FlaskConical, Gauge, ClipboardList, Book, ArrowUpDown, ArrowUp, ArrowDown, Download, Trash2, Copy, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { DiarioObra } from "@/entities/DiarioObra";
import { EnsaioDensidade } from "@/entities/EnsaioDensidade";
import { ChecklistUsina } from "@/entities/ChecklistUsina";
import { ChecklistAplicacao } from "@/entities/ChecklistAplicacao";
import { ChecklistMRAF } from "@/entities/ChecklistMRAF";
import { ChecklistConcretagem } from "@/entities/ChecklistConcretagem";
import { base44 } from "@/api/base44Client";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Project } from "@/entities/Project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { getEnsaioTypeInfo, getReportLink, getDataFormatted, getDataEnsaio, typeOptions } from "@/components/ensaios/ensaioMappers";
import { getEntityMap } from "@/components/ensaios/entityMaps";
import { getLocalInfo, getLaboratoristaInfo, getResponsavelInfo, getEmpireiteiraInfo, getRodoviaInfo, getTrechoInfo, getNaoConformidades, getStatusInfo } from "@/components/ensaios/utils";
import { loadAllData } from "@/components/ensaios/dataLoader";
import { Pagination } from "@/components/ensaios/Pagination";
import { ReprovacaoModal } from "@/components/ensaios/ReprovacaoModal";
import { ExclusaoModal } from "@/components/ensaios/ExclusaoModal";

// Botão copiar ID
const CopyIdButton = React.memo(({ id }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copiar ID: ${id}`}
      className="inline-flex items-center gap-1 text-[9px] font-mono bg-black/10 hover:bg-[#BFCF99]/40 px-1.5 py-0.5 rounded transition-colors text-[#00233B]/70 hover:text-[#00233B]">
      
      {copied ? <Check className="w-2.5 h-2.5 text-green-600" /> : <Copy className="w-2.5 h-2.5" />}
      <span className="truncate max-w-[60px]">{id.slice(0, 8)}…</span>
    </button>);

});
CopyIdButton.displayName = 'CopyIdButton';

// Componente de Date Range Picker compacto
const DateRangePicker = React.memo(({ startDate, endDate, onStartChange, onEndChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDateRange = () => {
    if (!startDate && !endDate) return "Filtrar período";
    if (startDate && !endDate) return `≥ ${new Date(startDate).toLocaleDateString('pt-BR')}`;
    if (!startDate && endDate) return `≤ ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    return `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-normal hover:bg-black/10">
          
          <Filter className={`w-3 h-3 mr-1 ${startDate || endDate ? 'text-[#BFCF99]' : ''}`} />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-[#00233B]/80">Data Início</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
            
          </div>
          <div>
            <Label className="text-xs text-[#00233B]/80">Data Fim</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndChange(e.target.value)}
              className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
            
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            onClick={() => {
              onStartChange('');
              onEndChange('');
              setIsOpen(false);
            }}>
            
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>);

});

DateRangePicker.displayName = 'DateRangePicker';

// Componente de filtro inline para texto
const TextColumnFilter = React.memo(({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-normal hover:bg-black/10">
          
          <Filter className={`w-3 h-3 ${value ? 'text-[#BFCF99]' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-2">
          <Label className="text-xs text-[#00233B]/80">{placeholder}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}>
            
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>);

});

TextColumnFilter.displayName = 'TextColumnFilter';

// Componente de filtro por select
const SelectColumnFilter = React.memo(({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-normal hover:bg-black/10">
          
          <Filter className={`w-3 h-3 ${value !== 'all' ? 'text-[#BFCF99]' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-1">
          <Label className="text-xs text-[#00233B]/80 px-2">{placeholder}</Label>
          {options.map((option) =>
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            className={`w-full justify-start text-xs h-8 ${value === option.value ? 'bg-black/10' : ''}`}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}>
            
              {option.label}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>);

});

SelectColumnFilter.displayName = 'SelectColumnFilter';

// Componente para interface de administrador (tabela) - Memoizado
const AdminInterface = React.memo(({ ensaios, obras, projects, onApprove, onReject, onDelete, user, canApprove, canCreate, canEdit, allUsers }) => {
  const [nomeFilter, setNomeFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');
  const [projetoFilter, setProjetoFilter] = useState(''); // New filter state
  const [localFilter, setLocalFilter] = useState('');
  const [empreiteiraFilter, setEmpreiteiraFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusObraFilter, setStatusObraFilter] = useState('all');
  const [reprovingEnsaio, setReprovingEnsaio] = useState(null);
  const [deletingEnsaio, setDeletingEnsaio] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc', or null
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [filteredEnsaios, setFilteredEnsaios] = useState([]);
  const [selectedEnsaio, setSelectedEnsaio] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(null);


  const isAdminView = user?.access_level === 'admin' || user?.access_level === 'sala_tecnica_afirmaevias' || user?.access_level === 'gestor_contrato';
  const isSalaTecnica = user?.access_level === 'sala_tecnica_afirmaevias';
  const isGestorContrato = user?.access_level === 'gestor_contrato';
  const isCliente = user?.access_level === 'cliente';



  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => {
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
        return obra?.name?.toLowerCase().includes(obraFilter.toLowerCase()) ||
        obra?.code?.toLowerCase().includes(obraFilter.toLowerCase());
      });
    }

    if (projetoFilter) {// New filter logic for project
      filtered = filtered.filter((ensaio) => {
        if (!ensaio.project_id) return false;
        const projeto = projects.find((p) => p.id === ensaio.project_id);
        return projeto?.name?.toLowerCase().includes(projetoFilter.toLowerCase());
      });
    }

    if (localFilter) {
      filtered = filtered.filter((ensaio) => {
        const localInfo = getLocalInfo(ensaio);
        return localInfo.tipo?.toLowerCase().includes(localFilter.toLowerCase()) ||
        localInfo.detalhes?.toLowerCase().includes(localFilter.toLowerCase());
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

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((ensaio) => {
        return ensaio.entityType === typeFilter;
      });
    }

    if (statusObraFilter !== 'all') {
      filtered = filtered.filter((ensaio) => {
        const obra = obras.find((o) => o.id === ensaio.obra_id);
        return obra?.status === statusObraFilter;
      });
    }

    // Aplicar ordenação por data
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(getDataEnsaio(a));
        const dateB = new Date(getDataEnsaio(b));
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0; // Handle invalid dates
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    }

    setFilteredEnsaios(filtered);
    setCurrentPage(1);
  }, [ensaios, nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, statusFilter, typeFilter, statusObraFilter, obras, projects, sortOrder, allUsers]);

  const handleApprove = useCallback(async (ensaio) => {
    if (!window.confirm(`Confirma a aprovação do registro "${ensaio.sample_id || ensaio.id}"?`)) return;

    try {
      // Determinar quem será o assinante
      let approverDetails = {
        name: user.laboratorista_name || user.full_name,
        position: user.position || 'Não informado',
        crea_number: user.crea_number || 'Não informado'
      };

      // Se quem está aprovando é Sala Técnica, buscar o Gestor da regional para assinatura
      if (user.access_level === 'sala_tecnica_afirmaevias') {
        try {
          const regionaisData = await Regional.list();

          // Encontrar a obra do ensaio
          const obraDoEnsaio = obras.find((o) => o.id === ensaio.obra_id);

          if (obraDoEnsaio) {
            // Encontrar a regional da obra
            const regionalDaObra = regionaisData.find((r) => r.id === obraDoEnsaio.regional_id);

            if (regionalDaObra && regionalDaObra.gestor_contrato_responsavel) {
              // Buscar os dados do gestor
              const allUsers = await User.list();
              const gestorUser = allUsers.find((u) =>
              u.email.toLowerCase() === regionalDaObra.gestor_contrato_responsavel.toLowerCase()
              );

              if (gestorUser) {
                approverDetails = {
                  name: gestorUser.laboratorista_name || gestorUser.full_name || regionalDaObra.gestor_contrato_responsavel,
                  position: gestorUser.position || 'Gestor de Contrato',
                  crea_number: gestorUser.crea_number || 'Não informado'
                };

                console.log('✅ Sala Técnica aprovando - Assinatura será do Gestor:', approverDetails);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar dados do gestor para assinatura:', error);
          // Se falhar, usar os dados do aprovador mesmo
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
    setTypeFilter('all');
    setStatusObraFilter('all');
    setSortOrder('desc');
    setCurrentPage(1);
  }, []);

  const isAnyFilterActive = useMemo(() => {
    return (
      nomeFilter !== '' ||
      obraFilter !== '' ||
      projetoFilter !== '' || // Include project filter
      localFilter !== '' ||
      empreiteiraFilter !== '' ||
      dataInicioFilter !== '' ||
      dataFimFilter !== '' ||
      statusFilter !== 'all' ||
      typeFilter !== '' ||
      statusObraFilter !== 'all');

  }, [nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, statusFilter, typeFilter, statusObraFilter]);

  const totalPages = Math.ceil(filteredEnsaios.length / itemsPerPage);
  const paginatedEnsaios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEnsaios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEnsaios, currentPage]);

  const statusColors = useMemo(() => ({
    planejamento: "bg-blue-100 text-blue-800",
    em_andamento: "bg-green-100 text-green-800",
    concluida: "bg-slate-100 text-slate-800",
    pausada: "bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30"
  }), []);



  const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Reprovados' },
  { value: 'signed', label: 'Assinados' }];


  const statusObraOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'pausada', label: 'Pausada' }];


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <div className="flex items-center gap-4 mt-2 text-sm text-[#00233B]/70">
             <span>{filteredEnsaios.length} registro(s) encontrado(s)</span>
             {isAnyFilterActive &&
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-[#00233B]/80 hover:bg-black/10">
              
                Limpar todos os filtros
              </Button>
            }
          </div>
        </div>
        <div className="flex gap-2">
          {canCreate &&
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#00233B] text-[#F2F1EF] px-4 py-2 text-sm font-medium rounded-md #BFCF99] justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 flex items-center hover:bg-[#BFCF99]/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Registro
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("DiarioObra")}>
                  <FileText className="mr-2 h-4 w-4" /> Diário de Obra
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("EnsaioCAUQ")}>
                  <FlaskConical className="mr-2 h-4 w-4" /> Ensaio de CAUQ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("EnsaioDensidade")}>
                  <Gauge className="mr-2 h-4 w-4" /> Densidade CP
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("ChecklistUsina")}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Checklist de Usina
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("ChecklistAplicacao")}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Checklist de Aplicação
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("ChecklistMRAF")}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Checklist de MRAF
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("ChecklistConcretagem")}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Checklist de Concretagem
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("ChecklistTerraplanagem")}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Checklist de Terraplanagem
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          }
        </div>
      </div>

      {/* Tabela */}
      <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 border-b border-white/10">
                <tr>
                   <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                     <div className="flex items-center gap-1">
                       <span>Tipo</span>
                       <SelectColumnFilter
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={typeOptions}
                        placeholder="Filtrar por tipo" />
                      
                     </div>
                   </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleSortOrder}
                        className="flex items-center gap-1 hover:text-[#BFCF99] transition-colors">
                        
                        <span>Data</span>
                        {sortOrder === 'desc' && <ArrowDown className="w-3 h-3" />}
                        {sortOrder === 'asc' && <ArrowUp className="w-3 h-3" />}
                        {!sortOrder && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <DateRangePicker
                        startDate={dataInicioFilter}
                        endDate={dataFimFilter}
                        onStartChange={setDataInicioFilter}
                        onEndChange={setDataFimFilter} />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Obra</span>
                      <TextColumnFilter
                        value={obraFilter}
                        onChange={setObraFilter}
                        placeholder="Filtrar por obra..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Lab.</span>
                      <TextColumnFilter
                        value={nomeFilter}
                        onChange={setNomeFilter}
                        placeholder="Filtrar por nome..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Local</span>
                      <TextColumnFilter
                        value={localFilter}
                        onChange={setLocalFilter}
                        placeholder="Filtrar por local..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Empreiteira</span>
                      <TextColumnFilter
                        value={empreiteiraFilter}
                        onChange={setEmpreiteiraFilter}
                        placeholder="Filtrar por empreiteira..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Projeto</span>
                      <TextColumnFilter
                        value={projetoFilter}
                        onChange={setProjetoFilter}
                        placeholder="Filtrar por projeto..." />
                      
                    </div>
                  </th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      <SelectColumnFilter
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={statusOptions}
                        placeholder="Filtrar por status" />
                      
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

                  // Buscar projeto se existir project_id
                  const projeto = ensaio.project_id ? projects.find((p) => p.id === ensaio.project_id) : null;

                  return (
                    <tr key={ensaio.id} className={`border-b border-white/10 hover:bg-black/5 ${index % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02]'}`}>
                       <td className="px-2 py-2">
                        <div className="font-medium text-[#00233B] flex items-center gap-1 text-xs">
                          <TypeIcon className="w-3 h-3 text-[#BFCF99]" /> 
                          <span className="truncate max-w-[120px]" title={name}>{name}</span>
                          <CopyIdButton id={ensaio.id} />
                          {(() => {
                            const naoConformidades = getNaoConformidades(ensaio);
                            const temAcoesCorretivas = ensaio.acoes_corretivas_realizado === true;
                            const temDeflexaoExcessiva = ensaio.tem_deflexao_excessiva === true;

                            if (naoConformidades.length > 0) {
                              const mensagem = temAcoesCorretivas ?
                              `Não conformidades:\n${naoConformidades.join('\n')}\n\n✓ Ações corretivas foram realizadas` :
                              `Não conformidades:\n${naoConformidades.join('\n')}`;
                              return (
                                <span
                                  className="text-red-600 cursor-help"
                                  title={mensagem}>
                                  
                                    ⚠️
                                  </span>);

                            }
                            if (temDeflexaoExcessiva) {
                              return (
                                <span
                                  className="cursor-help"
                                  title="Pontos com deflexão acima do limite admissível">
                                  
                                    🟡
                                  </span>);

                            }
                            if (temAcoesCorretivas) {
                              return (
                                <span
                                  className="text-orange-500 cursor-help"
                                  title="Ações corretivas realizadas">
                                  
                                    ⚠️
                                  </span>);

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
                          {getEmpireiteiraInfo(ensaio) ?
                        <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={getEmpireiteiraInfo(ensaio)}>{getEmpireiteiraInfo(ensaio)}</div> :

                        <div className="text-[#00233B]/50 text-center text-xs">-</div>
                        }
                          </td>
                          <td className="px-2 py-2">
                          {projeto ?
                        <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={projeto.name}>{projeto.name}</div> :

                        <div className="text-[#00233B]/50 text-center text-xs">-</div>
                        }
                          </td>
                          <td className="px-2 py-2 text-center">
                          <Badge className={`${status.className} text-[10px] px-2 py-0.5 gap-1`}>
                           <status.icon className="w-3 h-3" />
                           {status.text}
                          </Badge>
                          </td>
                          <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <Button asChild variant="outline" size="sm" className="text-[#00233B] hover:bg-[#00233B]/10 hover:text-[#00233B] hover:border-[#00233B]/30 border-white/20 transition-colors h-7 px-2 text-xs">
                              <Link to={reportUrl} target="_blank">
                                <FileText className="w-3 h-3" />
                              </Link>
                            </Button>

                            {canApprove && ensaio.status !== 'rascunho' &&
                          <div className="flex gap-1">
                                {(ensaio.approved === null || ensaio.approved === false) &&
                            <Button
                              size="sm"
                              style={{ backgroundColor: '#566E3D' }}
                              className="text-white hover:opacity-90 transition-opacity h-7 px-2"
                              onClick={() => handleApprove(ensaio)}
                              title="Aprovar">
                              
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                            }
                                {ensaio.approved === null &&
                            <Button
                              size="sm"
                              style={{ backgroundColor: '#800020' }}
                              className="text-white hover:opacity-90 transition-opacity h-7 px-2"
                              onClick={() => setReprovingEnsaio(ensaio)}
                              title="Reprovar">
                              
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                            }
                                </div>
                          }
                                {canApprove && ensaio.status === 'rascunho' &&
                          <span className="text-xs italic text-[#00233B]/60 ml-2">Em execução</span>
                          }
                                {canApprove &&
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2"
                            onClick={() => setDeletingEnsaio(ensaio)}
                            title="Excluir">
                            
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                          }
                        </div>
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>

            {filteredEnsaios.length === 0 &&
            <div className="text-center py-12 text-[#00233B]/70">
                <FileText className="w-12 h-12 text-[#00233B]/30 mx-auto mb-4" />
                <h3 className="font-medium text-[#00233B] mb-2">Nenhum registro encontrado</h3>
                <p>Ajuste os filtros ou aguarde novos registros.</p>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage} />
      

      <ReprovacaoModal
        ensaio={reprovingEnsaio}
        isOpen={!!reprovingEnsaio}
        onClose={() => setReprovingEnsaio(null)}
        onReprove={handleReject} />
      

      <ExclusaoModal
        ensaio={deletingEnsaio}
        isOpen={!!deletingEnsaio}
        onClose={() => setDeletingEnsaio(null)}
        onDelete={handleDelete} />
      
      </div>);

});

AdminInterface.displayName = 'AdminInterface';

// Componente EnsaioCard memoizado
const EnsaioCard = React.memo(({ ensaio, obra, user, allUsers }) => {
  const status = getStatusInfo(ensaio);
  const { name, icon: TypeIcon } = getEnsaioTypeInfo(ensaio);
  const reportUrl = getReportLink(ensaio);
  const localInfo = getLocalInfo(ensaio);
  const laboratorista = getLaboratoristaInfo(ensaio, allUsers);
  const dataFormatted = getDataFormatted(ensaio);

  const editLink = createPageUrl(`${ensaio.entityType}?editId=${ensaio.id}`);

  const isCliente = user?.access_level === 'cliente';
  // Cliente pode assinar registros aprovados
  const podeAssinarCliente = isCliente && ensaio.approved === true && !ensaio.client_signature?.signed_by;

  const podeVerPDF = ensaio.approved === true || ensaio.client_signature?.signed_by;
  // Pode editar se: está em rascunho OU foi reprovado
  const podeEditar = ensaio.created_by === user?.email && !isCliente && (ensaio.status === 'rascunho' || ensaio.approved === false) && !ensaio.client_signature?.signed_by;
  const podeAssinar = podeAssinarCliente;
  const jaAssinado = ensaio.client_signature?.signed_by === user?.email;

  const handleAssinar = useCallback(async () => {
    try {
      if (window.confirm(`Confirma a assinatura digital do registro "${ensaio.sample_id || ensaio.id}"? Esta ação registrará que você teve ciência do conteúdo.`)) {
        const entityMap = getEntityMap();
        const Entity = entityMap[ensaio.entityType];

        const signatureData = {
          client_signature: {
            signed_by: user.email,
            signed_date: new Date().toISOString(),
            engineer_name: user.laboratorista_name || user.full_name,
            crea_number: user.crea_number || ''
          }
        };

        console.log('Tentando assinar registro:', ensaio.id, 'com dados:', signatureData);

        await Entity.update(ensaio.id, signatureData);

        alert('Registro assinado com sucesso! Sua assinatura digital foi registrada.');
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao assinar registro:", error);
      alert(`Erro ao assinar registro: ${error.message || 'Erro desconhecido'}. Por favor, tente novamente ou contate o administrador.`);
    }
  }, [user, ensaio]);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-[#00233B] text-lg flex items-center gap-2">
                <TypeIcon className="w-5 h-5 text-[#BFCF99]" /> {name}
                {(() => {
                  const naoConformidades = getNaoConformidades(ensaio);
                  const temAcoesCorretivas = ensaio.acoes_corretivas_realizado === true;
                  const temDeflexaoExcessiva = ensaio.tem_deflexao_excessiva === true;

                  if (naoConformidades.length > 0) {
                    const mensagem = temAcoesCorretivas ?
                    `Não conformidades:\n${naoConformidades.join('\n')}\n\n✓ Ações corretivas foram realizadas` :
                    `Não conformidades:\n${naoConformidades.join('\n')}`;
                    return (
                      <span
                        className="text-red-600 cursor-help text-xl"
                        title={mensagem}>
                        
                        ⚠️
                      </span>);

                  }
                  if (temDeflexaoExcessiva) {
                    return (
                      <span
                        className="cursor-help text-xl"
                        title="Pontos com deflexão acima do limite admissível">
                        
                        🟡
                      </span>);

                  }
                  if (temAcoesCorretivas) {
                    return (
                      <span
                        className="text-orange-500 cursor-help text-xl"
                        title="Ações corretivas realizadas">
                        
                        ⚠️
                      </span>);

                  }
                  return null;
                })()}
              </h3>
              <p className="text-sm text-[#00233B]/70">{dataFormatted}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${status.className} gap-1.5`}>
                <status.icon className="w-3 h-3" />
                {status.text}
              </Badge>
              {status.wasRejected &&
              <Badge className="bg-orange-100/80 text-orange-800 border border-orange-300/50 text-xs">
                  🔄 Editado após reprovação
                </Badge>
              }
              {jaAssinado &&
              <Badge className="bg-[#00233B]/10 text-[#00233B] border border-[#00233B]/30 text-xs">
                  ✍️ Assinado por você
                </Badge>
              }
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 pb-2 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#00233B]/80">
              <div className="flex items-center gap-1.5" title="Obra">
                <Building className="w-4 h-4 text-[#BFCF99] shrink-0" />
                <span className="font-medium text-[#00233B]">{obra?.name || 'N/A'}</span>
                <span className="text-xs">({obra?.code || 'N/A'})</span>
              </div>
              <div className="flex items-center gap-1.5" title="Laboratorista">
                <UserIconSmall className="w-4 h-4 text-[#BFCF99] shrink-0" />
                <span>{laboratorista}</span>
              </div>
              {getRodoviaInfo(ensaio) &&
              <div className="flex items-center gap-1.5" title="Rodovia">
                  <MapPin className="w-4 h-4 text-[#BFCF99] shrink-0" />
                  <span className="font-medium">{getRodoviaInfo(ensaio)}</span>
                </div>
              }
              {getTrechoInfo(ensaio) &&
              <div className="flex items-center gap-1.5" title="Trecho">
                  <MapPin className="w-4 h-4 text-[#BFCF99] shrink-0" />
                  <span className="text-xs">Trecho: {getTrechoInfo(ensaio)}</span>
                </div>
              }
              {getResponsavelInfo(ensaio) &&
              <div className="flex items-center gap-1.5" title="Responsável">
                  <Building className="w-4 h-4 text-[#BFCF99] shrink-0" />
                  <span className="font-medium">{getResponsavelInfo(ensaio)}</span>
                </div>
              }
            </div>

            {ensaio.sample_id &&
            <div className="text-sm">
                <span className="font-medium text-[#00233B]">Amostra/ID: </span>
                <span className="text-[#00233B]/90">{ensaio.sample_id}</span>
              </div>
            }

            {ensaio.client_signature?.signed_by &&
            <div className="text-sm bg-[#00233B]/5 p-2 rounded border border-[#00233B]/20">
                <span className="font-medium text-[#00233B]">Assinado por: </span>
                <span className="text-[#00233B]/80">{ensaio.client_signature.engineer_name}</span>
                {ensaio.client_signature.crea_number &&
              <>
                    <br />
                    <span className="font-medium text-[#00233B]">CREA: </span>
                    <span className="text-[#00233B]/80">{ensaio.client_signature.crea_number}</span>
                  </>
              }
                <br />
                <span className="text-xs text-[#00233B]/70">
                  {new Date(ensaio.client_signature.signed_date).toLocaleString('pt-BR')}
                </span>
              </div>
            }

            {ensaio.rejection_reason &&
            <div className="text-sm bg-[#800020]/5 p-2 rounded border border-[#800020]/20">
                <span className="font-medium text-[#800020]">Motivo da Reprovação: </span>
                <span className="text-[#800020]/80">{ensaio.rejection_reason}</span>
              </div>
            }
          </div>

          <div className="border-t border-white/20 pt-3 flex items-center gap-2 flex-wrap min-h-[38px]">
            {podeVerPDF &&
            <Button asChild variant="outline" size="sm" className="text-[#00233B] hover:bg-black/10 border-white/20">
                <Link to={reportUrl} target="_blank">
                  <FileText className="w-4 h-4 mr-1 text-[#BFCF99]" /> Ver PDF
                </Link>
              </Button>
            }
            
            {podeAssinar &&
            <Button
              size="sm"
              style={{ backgroundColor: '#566E3D' }}
              className="text-white hover:opacity-90 transition-opacity"
              onClick={handleAssinar}>
              
                <MessageSquare className="w-4 h-4 mr-1" /> Assinar Registro
              </Button>
            }
            
            {podeEditar &&
            <Button asChild size="sm" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                <Link to={editLink}>
                  <Edit className="w-4 h-4 mr-1 text-[#BFCF99]" /> Editar
                </Link>
              </Button>
            }
            {ensaio.status === 'finalizado' && ensaio.approved === null && !isCliente &&
            <p className="text-sm text-[#00233B]/70 italic">
                Aguardando aprovação do administrador.
              </p>
            }
          </div>
        </div>
      </CardContent>
    </Card>);

});

EnsaioCard.displayName = 'EnsaioCard';

// Componente para laboratoristas (cards) - Memoizado
const LaboratoristaInterface = React.memo(({ ensaios, obras, user, allUsers }) => {

  const emExecucao = useMemo(() => {
    const filtered = ensaios.filter((e) => {
      // Rascunhos OU reprovados (approved === false) vão para Em Execução
      // status === 'rascunho' tem prioridade independente do approved
      return (e.status === 'rascunho' || e.approved === false) && !e.client_signature?.signed_by;
    });
    return filtered;
  }, [ensaios]);

  const pendentes = useMemo(() => {
    const filtered = ensaios.filter((e) => {
      // Finalizados aguardando aprovação (não reprovados)
      // Também inclui registros sem campo status (legados) que ainda não foram aprovados/reprovados
      const isFinalizadoOuSemStatus = e.status === 'finalizado' || (!e.status && e.status !== 'rascunho');
      return isFinalizadoOuSemStatus && e.approved === null && !e.client_signature?.signed_by && e.approved !== false;
    });
    return filtered;
  }, [ensaios]);

  const aprovados = useMemo(() => {
    const filtered = ensaios.filter((e) => e.approved === true || e.client_signature?.signed_by);
    return filtered;
  }, [ensaios]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="emExecucao" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-lg border border-white/20 h-auto">
        <TabsTrigger value="emExecucao" className="data-[state=active]:bg-white/40 data-[state=active]:text-[#00233B] data-[state=active]:border-b-2 data-[state=active]:border-[#BFCF99] text-[#00233B]/80 hover:bg-black/5 flex flex-col items-center gap-0.5 py-2 px-1">
          <span className="text-xs leading-tight text-center">Em Execução</span>
          <Badge className="text-xs">{emExecucao.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="pendentes" className="data-[state=active]:bg-white/40 data-[state=active]:text-[#00233B] data-[state=active]:border-b-2 data-[state=active]:border-[#BFCF99] text-[#00233B]/80 hover:bg-black/5 flex flex-col items-center gap-0.5 py-2 px-1">
          <span className="text-xs leading-tight text-center">Pendentes</span>
          <Badge className="text-xs">{pendentes.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="aprovados" className="data-[state=active]:bg-white/40 data-[state=active]:text-[#00233B] data-[state=active]:border-b-2 data-[state=active]:border-[#BFCF99] text-[#00233B]/80 hover:bg-black/5 flex flex-col items-center gap-0.5 py-2 px-1">
          <span className="text-xs leading-tight text-center">Aprovados</span>
          <Badge className="text-xs">{aprovados.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="emExecucao" className="mt-4 space-y-4">
        {emExecucao.length > 0 ?
          emExecucao.map((ensaio) =>
          <EnsaioCard
            key={ensaio.id}
            ensaio={ensaio}
            obra={obras.find((o) => o.id === ensaio.obra_id)}
            user={user}
            allUsers={allUsers} />
          ) :
          <div className="text-center py-12 text-[#00233B]/70">
            <FileText className="w-16 h-16 text-[#00233B]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#00233B] mb-2">
              Nenhum registro em execução
            </h3>
            <p>Comece criando um novo registro ou finalize os em rascunho.</p>
          </div>
          }
      </TabsContent>

      <TabsContent value="pendentes" className="mt-4 space-y-4">
        {pendentes.length > 0 ?
          pendentes.map((ensaio) =>
          <EnsaioCard
            key={ensaio.id}
            ensaio={ensaio}
            obra={obras.find((o) => o.id === ensaio.obra_id)}
            user={user}
            allUsers={allUsers} />
          ) :
          <div className="text-center py-12 text-[#00233B]/70">
            <FileText className="w-16 h-16 text-[#00233B]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#00233B] mb-2">
              Nenhum registro pendente ou reprovado
            </h3>
            <p>Todos os ensaios e diários estão aprovados ou não há registros.</p>
          </div>
          }
      </TabsContent>

      <TabsContent value="aprovados" className="mt-4 space-y-4">
        {aprovados.length > 0 ?
          aprovados.map((ensaio) =>
          <EnsaioCard
            key={ensaio.id}
            ensaio={ensaio}
            obra={obras.find((o) => o.id === ensaio.obra_id)}
            user={user}
            allUsers={allUsers} />
          ) :
          <div className="text-center py-12 text-[#00233B]/70">
            <CheckCircle className="w-16 h-16 text-[#00233B]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#00233B] mb-2">
              Nenhum registro aprovado ainda
            </h3>
            <p>Aguarde a aprovação dos ensaios pelo administrador.</p>
          </div>
          }
      </TabsContent>
      </Tabs>
    </div>);

});

LaboratoristaInterface.displayName = 'LaboratoristaInterface';

// Componente para clientes - tabela com filtros similar ao gestor
const ClienteInterface = React.memo(({ ensaios, obras, projects, user, allUsers }) => {
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
  const [filteredEnsaios, setFilteredEnsaios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => {
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
        return obra?.name?.toLowerCase().includes(obraFilter.toLowerCase()) ||
        obra?.code?.toLowerCase().includes(obraFilter.toLowerCase());
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
        return localInfo.tipo?.toLowerCase().includes(localFilter.toLowerCase()) ||
        localInfo.detalhes?.toLowerCase().includes(localFilter.toLowerCase());
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
        if (statusFilter === 'signed') return ensaio.client_signature?.signed_by;
        return true;
      });
    }

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((ensaio) => {
        return ensaio.entityType === typeFilter;
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
  }, [ensaios, nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, statusFilter, typeFilter, obras, projects, sortOrder, allUsers]);

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

  const isAnyFilterActive = useMemo(() => {
    return (
      nomeFilter !== '' ||
      obraFilter !== '' ||
      projetoFilter !== '' ||
      localFilter !== '' ||
      empreiteiraFilter !== '' ||
      dataInicioFilter !== '' ||
      dataFimFilter !== '' ||
      statusFilter !== 'all' ||
      typeFilter !== 'all');

  }, [nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredEnsaios.length / itemsPerPage);
  const paginatedEnsaios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEnsaios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEnsaios, currentPage]);

  const handleAssinar = useCallback(async (ensaio) => {
    try {
      if (window.confirm(`Confirma a assinatura digital do registro "${ensaio.sample_id || ensaio.id}"? Esta ação registrará que você teve ciência do conteúdo.`)) {
        const entityMap = getEntityMap();
        const Entity = entityMap[ensaio.entityType];

        const signatureData = {
          client_signature: {
            signed_by: user.email,
            signed_date: new Date().toISOString(),
            engineer_name: user.laboratorista_name || user.full_name,
            crea_number: user.crea_number || ''
          }
        };

        await Entity.update(ensaio.id, signatureData);

        alert('Registro assinado com sucesso! Sua assinatura digital foi registrada.');
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao assinar registro:", error);
      alert(`Erro ao assinar registro: ${error.message || 'Erro desconhecido'}. Por favor, tente novamente ou contate o administrador.`);
    }
  }, [user]);



  const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'approved', label: 'Aprovados (não assinados)' },
  { value: 'signed', label: 'Assinados' }];


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#00233B]/70">
            <span>{filteredEnsaios.length} registro(s) encontrado(s)</span>
            {isAnyFilterActive &&
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-[#00233B]/80 hover:bg-black/10">
              
                Limpar todos os filtros
              </Button>
            }
          </div>
        </div>
      </div>

      <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Tipo</span>
                      <SelectColumnFilter
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={typeOptions}
                        placeholder="Filtrar por tipo" />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleSortOrder}
                        className="flex items-center gap-1 hover:text-[#BFCF99] transition-colors">
                        
                        <span>Data</span>
                        {sortOrder === 'desc' && <ArrowDown className="w-3 h-3" />}
                        {sortOrder === 'asc' && <ArrowUp className="w-3 h-3" />}
                        {!sortOrder && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <DateRangePicker
                        startDate={dataInicioFilter}
                        endDate={dataFimFilter}
                        onStartChange={setDataInicioFilter}
                        onEndChange={setDataFimFilter} />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Obra</span>
                      <TextColumnFilter
                        value={obraFilter}
                        onChange={setObraFilter}
                        placeholder="Filtrar por obra..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Lab.</span>
                      <TextColumnFilter
                        value={nomeFilter}
                        onChange={setNomeFilter}
                        placeholder="Filtrar por nome..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Local</span>
                      <TextColumnFilter
                        value={localFilter}
                        onChange={setLocalFilter}
                        placeholder="Filtrar por local..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Empreiteira</span>
                      <TextColumnFilter
                        value={empreiteiraFilter}
                        onChange={setEmpreiteiraFilter}
                        placeholder="Filtrar por empreiteira..." />
                      
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1">
                      <span>Projeto</span>
                      <TextColumnFilter
                        value={projetoFilter}
                        onChange={setProjetoFilter}
                        placeholder="Filtrar por projeto..." />
                      
                    </div>
                  </th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      <SelectColumnFilter
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={statusOptions}
                        placeholder="Filtrar por status" />
                      
                    </div>
                  </th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '120px' }}>Ações</th>
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
                  const projeto = ensaio.project_id ? projects.find((p) => p.id === ensaio.project_id) : null;
                  const podeAssinar = ensaio.approved === true && !ensaio.client_signature?.signed_by;

                  return (
                    <tr key={ensaio.id} className={`border-b border-white/10 hover:bg-black/5 ${index % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02]'}`}>
                      <td className="px-2 py-2">
                        <div className="font-medium text-[#00233B] flex items-center gap-1 text-xs">
                          <TypeIcon className="w-3 h-3 text-[#BFCF99]" /> 
                          <span className="truncate max-w-[120px]" title={name}>{name}</span>
                          <CopyIdButton id={ensaio.id} />
                          {(() => {
                            const naoConformidades = getNaoConformidades(ensaio);
                            const temAcoesCorretivas = ensaio.acoes_corretivas_realizado === true;

                            if (naoConformidades.length > 0) {
                              const mensagem = temAcoesCorretivas ?
                              `Não conformidades:\n${naoConformidades.join('\n')}\n\n✓ Ações corretivas foram realizadas` :
                              `Não conformidades:\n${naoConformidades.join('\n')}`;
                              return (
                                <span
                                  className="text-red-600 cursor-help"
                                  title={mensagem}>
                                  
                                  ⚠️
                                </span>);

                            }
                            if (temAcoesCorretivas) {
                              return (
                                <span
                                  className="text-orange-500 cursor-help"
                                  title="Ações corretivas realizadas">
                                  
                                  ⚠️
                                </span>);

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
                        {getEmpireiteiraInfo(ensaio) ?
                        <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={getEmpireiteiraInfo(ensaio)}>{getEmpireiteiraInfo(ensaio)}</div> :

                        <div className="text-[#00233B]/50 text-center text-xs">-</div>
                        }
                      </td>
                      <td className="px-2 py-2">
                        {projeto ?
                        <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={projeto.name}>{projeto.name}</div> :

                        <div className="text-[#00233B]/50 text-center text-xs">-</div>
                        }
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
                            <Link to={reportUrl} target="_blank">
                              <FileText className="w-3 h-3" />
                            </Link>
                          </Button>
                          {podeAssinar &&
                          <Button
                            size="sm"
                            style={{ backgroundColor: '#566E3D' }}
                            className="text-white hover:opacity-90 transition-opacity h-7 px-2"
                            onClick={() => handleAssinar(ensaio)}
                            title="Assinar">
                            
                              <MessageSquare className="w-3 h-3" />
                            </Button>
                          }
                        </div>
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>

            {filteredEnsaios.length === 0 &&
            <div className="text-center py-12 text-[#00233B]/70">
                <FileText className="w-12 h-12 text-[#00233B]/30 mx-auto mb-4" />
                <h3 className="font-medium text-[#00233B] mb-2">Nenhum registro encontrado</h3>
                <p>Ajuste os filtros ou aguarde novos registros aprovados.</p>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage} />
      
    </div>);

});

ClienteInterface.displayName = 'ClienteInterface';

export default function MeusEnsaios() {
  const [ensaios, setEnsaios] = useState([]);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const userAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const isAdmin = userAccessLevel === 'admin';
  const isSalaTecnica = userAccessLevel === 'sala_tecnica_afirmaevias';
  const isGestorContrato = userAccessLevel === 'gestor_contrato';
  const isCliente = userAccessLevel === 'cliente';
  const canApprove = isAdmin || isSalaTecnica || isGestorContrato;
  const canCreate = isAdmin || !isSalaTecnica && !isGestorContrato && !isCliente;
  const canEdit = isAdmin || !isSalaTecnica && !isGestorContrato && !isCliente;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { currentUser, allUsers, currentUserAccessLevel, obrasData, regionaisData, projectsData, combinedEnsaios } = await loadAllData();

      setUser(currentUser);
      setAllUsers(allUsers);
      setObras(obrasData);
      setRegionais(regionaisData);
      setProjects(projectsData);

      let ensaiosForUser = combinedEnsaios;

      // Apply access level filtering logic
      if (currentUserAccessLevel === 'sala_tecnica_afirmaevias') {
        const regionaisDoUsuario = regionaisData.filter((regional) =>
        (regional.salas_tecnicas_responsaveis || []).some((email) => email.toLowerCase() === currentUser.email.toLowerCase())
        );
        const regionaisIds = regionaisDoUsuario.map((r) => r.id);
        const obrasPermitidasIds = obrasData.filter((obra) => regionaisIds.includes(obra.regional_id)).map((o) => o.id);
        ensaiosForUser = combinedEnsaios.filter((ensaio) => obrasPermitidasIds.includes(ensaio.obra_id));
        console.log("📊 [DEBUG] Sala Técnica - Ensaios filtrados:", ensaiosForUser.length);
      } else if (currentUserAccessLevel === 'gestor_contrato') {
        const regionaisDoUsuario = regionaisData.filter((regional) => {
          const gestores = regional.gestores_contrato_responsaveis || [];
          return regional.gestor_contrato_responsavel?.toLowerCase() === currentUser.email.toLowerCase() ||
          gestores.some((email) => email.toLowerCase() === currentUser.email.toLowerCase());
        });
        console.log("📊 [DEBUG] Gestor - Regionais do usuário:", regionaisDoUsuario);
        const regionaisIds = regionaisDoUsuario.map((r) => r.id);
        console.log("📊 [DEBUG] Gestor - IDs das regionais:", regionaisIds);
        const obrasPermitidasIds = obrasData.filter((obra) => regionaisIds.includes(obra.regional_id)).map((o) => o.id);
        console.log("📊 [DEBUG] Gestor - Obras permitidas (IDs):", obrasPermitidasIds);
        ensaiosForUser = combinedEnsaios.filter((ensaio) => obrasPermitidasIds.includes(ensaio.obra_id));
        console.log("📊 [DEBUG] Gestor Contrato - Ensaios filtrados:", ensaiosForUser.length);
        console.log("📊 [DEBUG] Gestor - ChecklistAplicacao na lista:", ensaiosForUser.filter((e) => e.entityType === 'ChecklistAplicacao'));
      } else if (currentUserAccessLevel === 'cliente') {
        const regionaisDoUsuario = regionaisData.filter((regional) =>
        (regional.clientes_responsaveis || []).some((email) => email.toLowerCase() === currentUser.email.toLowerCase())
        );
        const regionaisIds = regionaisDoUsuario.map((r) => r.id);
        const obrasPermitidasIds = obrasData.filter((obra) => regionaisIds.includes(obra.regional_id)).map((o) => o.id);

        // IMPORTANTE: Cliente vê APENAS ensaios APROVADOS (approved === true) OU ASSINADOS
        ensaiosForUser = combinedEnsaios.filter((ensaio) =>
        obrasPermitidasIds.includes(ensaio.obra_id) && (
        ensaio.approved === true || ensaio.client_signature?.signed_by)
        );
        console.log("📊 [DEBUG] Cliente - Ensaios filtrados:", ensaiosForUser.length);
      } else if (currentUserAccessLevel !== 'admin') {
        console.log("📊 [DEBUG] User email:", currentUser.email);
        console.log("📊 [DEBUG] User laboratorista_name:", currentUser.laboratorista_name);
        console.log("📊 [DEBUG] Total combinedEnsaios antes do filtro:", combinedEnsaios.length);

        // Filtrar por created_by OU laboratorista_name
        ensaiosForUser = combinedEnsaios.filter((e) => {
          const emailMatch = e.created_by?.toLowerCase() === currentUser.email?.toLowerCase();
          const nameMatch = currentUser.laboratorista_name &&
          e.laboratorista_name?.toLowerCase() === currentUser.laboratorista_name?.toLowerCase();
          return emailMatch || nameMatch;
        });

        console.log("📊 [DEBUG] User - Ensaios filtrados (email OU nome):", ensaiosForUser.length);
        console.log("📊 [DEBUG] Detalhes dos ensaios filtrados:");
        ensaiosForUser.forEach((e, i) => {
          console.log(`  ${i + 1}. Tipo: ${e.entityType}, Status: ${e.status}, Approved: ${e.approved}, Created by: ${e.created_by}, Lab name: ${e.laboratorista_name}`);
        });
      } else {
        console.log("📊 [DEBUG] Admin - Mostrando todos os ensaios:", ensaiosForUser.length);
      }

      setEnsaios(ensaiosForUser);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = useCallback(async (ensaio, approverDetails) => {
    const entityMap = getEntityMap();
    const Entity = entityMap[ensaio.entityType];

    try {
      const updateData = {
        approved: true,
        approved_by: user.email,
        approved_date: new Date().toISOString(),
        approver_details: approverDetails,
        rejection_reason: null
      };

      // Corrigir medicoes_geometricas se estiver em formato incorreto (ChecklistAplicacao)
      if (ensaio.entityType === 'ChecklistAplicacao') {
        if (!ensaio.medicoes_geometricas || Array.isArray(ensaio.medicoes_geometricas)) {
          updateData.medicoes_geometricas = {
            subtrecho: "",
            servico: "",
            medicoes: []
          };
        }
      }

      await Entity.update(ensaio.id, updateData);

      alert("Registro aprovado com sucesso!");
      loadData();
    } catch (error) {
      console.error("Erro ao aprovar ensaio:", error);
      alert("Erro ao aprovar ensaio.");
    }
  }, [user, loadData]);

  const handleReject = useCallback(async (ensaio, motivo) => {
    if (!canApprove) {
      alert('Você não tem permissão para reprovar registros.');
      return;
    }
    try {
      const entityMap = getEntityMap();
      const Entity = entityMap[ensaio.entityType];
      await Entity.update(ensaio.id, {
        approved: false,
        approved_by: user.email,
        approved_date: new Date().toISOString(),
        rejection_reason: motivo
      });

      loadData();
      alert('Registro reprovado com sucesso!');
    } catch (error) {
      console.error("Erro ao reprovar:", error);
      alert('Erro ao reprovar registro.');
    }
  }, [canApprove, user, loadData]);

  const handleDeleteEnsaio = useCallback(async (ensaio) => {
    if (!canApprove) {
      alert('Você não tem permissão para excluir registros.');
      return;
    }
    try {
      const entityMap = getEntityMap();
      const Entity = entityMap[ensaio.entityType];
      await Entity.delete(ensaio.id);

      loadData();
      alert('Registro excluído com sucesso!');
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert('Erro ao excluir registro.');
    }
  }, [canApprove, loadData]);

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#00233B]">Ensaios Realizados</h1>
          <p className="text-[#00233B]/80 mt-1">
            {isAdmin ?
            "Gerencie e aprove todos os registros de suas obras." :
            isSalaTecnica || isGestorContrato ?
            "Gerencie e aprove todos os registros de suas obras." :
            isCliente ?
            "Visualize os ensaios e diários aprovados das suas obras." :
            "Visualize e gerencie todos os ensaios e diários registrados."}
          </p>
        </div>

        {loading ?
        <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/50" />
            <p className="text-[#00233B]/80 mt-2">Carregando registros...</p>
          </div> :
        canApprove ?
        <AdminInterface
          ensaios={ensaios}
          obras={obras}
          projects={projects}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDeleteEnsaio}
          user={user}
          canApprove={canApprove}
          canCreate={canCreate}
          canEdit={canEdit}
          allUsers={allUsers} /> :

        isCliente ?
        <ClienteInterface
          ensaios={ensaios}
          obras={obras}
          projects={projects}
          user={user}
          allUsers={allUsers} /> :

        <LaboratoristaInterface
          ensaios={ensaios}
          obras={obras}
          user={user}
          allUsers={allUsers} />
        }
      </div>
    </div>);

}