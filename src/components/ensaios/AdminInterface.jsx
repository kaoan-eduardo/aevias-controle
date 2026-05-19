// Interface de tabela para admin/gestor/sala técnica
import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, FlaskConical, Gauge, ClipboardList, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { typeOptions } from "@/components/ensaios/ensaioMappers";
import { Pagination } from "@/components/ensaios/Pagination";
import { ReprovacaoModal } from "@/components/ensaios/ReprovacaoModal";
import { ExclusaoModal } from "@/components/ensaios/ExclusaoModal";
import { DateRangePicker, TextColumnFilter, SelectColumnFilter } from "@/components/ensaios/TableFilters";
import { useTableFilters } from "@/hooks/useTableFilters";
import TableRowAdmin from "@/components/ensaios/TableRowAdmin";

const AdminInterface = React.memo(({ ensaios, obras, projects, onApprove, onReject, onDelete, user, canApprove, canCreate, allUsers }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusObraFilter, setStatusObraFilter] = useState('all');
  const [reprovingEnsaio, setReprovingEnsaio] = useState(null);
  const [deletingEnsaio, setDeletingEnsaio] = useState(null);

  const applyCustomFilters = useCallback((filtered) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') filtered = filtered.filter((e) => e.approved === true && !e.client_signature?.signed_by);
      else if (statusFilter === 'pending') filtered = filtered.filter((e) => e.approved === null);
      else if (statusFilter === 'rejected') filtered = filtered.filter((e) => e.approved === false);
      else if (statusFilter === 'signed') filtered = filtered.filter((e) => e.client_signature?.signed_by);
    }
    if (statusObraFilter !== 'all') filtered = filtered.filter((e) => obras.find((o) => o.id === e.obra_id)?.status === statusObraFilter);
    return filtered;
  }, [statusFilter, statusObraFilter, obras]);

  const {
    nomeFilter, setNomeFilter,
    obraFilter, setObraFilter,
    projetoFilter, setProjetoFilter,
    localFilter, setLocalFilter,
    empreiteiraFilter, setEmpreiteiraFilter,
    dataInicioFilter, setDataInicioFilter,
    dataFimFilter, setDataFimFilter,
    typeFilter, setTypeFilter,
    sortOrder,
    currentPage, setCurrentPage,
    filteredEnsaios,
    paginatedEnsaios,
    totalPages,
    isAnyFilterActive,
    toggleSortOrder,
    clearFilters,
  } = useTableFilters(ensaios, obras, projects, allUsers, applyCustomFilters);

  const handleReject = useCallback(async (ensaio, motivo) => {
    await onReject(ensaio, motivo);
    setReprovingEnsaio(null);
  }, [onReject]);

  const handleDelete = useCallback(async (ensaio) => {
    await onDelete(ensaio);
    setDeletingEnsaio(null);
  }, [onDelete]);

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'approved', label: 'Aprovados' },
    { value: 'rejected', label: 'Reprovados' },
    { value: 'signed', label: 'Assinados' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 text-sm text-[#00233B]/70">
          <span>{filteredEnsaios.length} registro(s) encontrado(s)</span>
          {isAnyFilterActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-[#00233B]/80 hover:bg-black/10">
              Limpar todos os filtros
            </Button>
          )}
        </div>
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

      <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs">
                    <div className="flex items-center gap-1"><span>Tipo</span><SelectColumnFilter value={typeFilter} onChange={setTypeFilter} options={typeOptions} placeholder="Filtrar por tipo" /></div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={toggleSortOrder} className="flex items-center gap-1 hover:text-[#BFCF99] transition-colors">
                        <span>Data</span>
                        {sortOrder === 'desc' && <ArrowDown className="w-3 h-3" />}
                        {sortOrder === 'asc' && <ArrowUp className="w-3 h-3" />}
                        {!sortOrder && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <DateRangePicker startDate={dataInicioFilter} endDate={dataFimFilter} onStartChange={setDataInicioFilter} onEndChange={setDataFimFilter} />
                    </div>
                  </th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs"><div className="flex items-center gap-1"><span>Obra</span><TextColumnFilter value={obraFilter} onChange={setObraFilter} placeholder="Filtrar por obra..." /></div></th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs"><div className="flex items-center gap-1"><span>Lab.</span><TextColumnFilter value={nomeFilter} onChange={setNomeFilter} placeholder="Filtrar por nome..." /></div></th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs"><div className="flex items-center gap-1"><span>Local</span><TextColumnFilter value={localFilter} onChange={setLocalFilter} placeholder="Filtrar por local..." /></div></th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs"><div className="flex items-center gap-1"><span>Empreiteira</span><TextColumnFilter value={empreiteiraFilter} onChange={setEmpreiteiraFilter} placeholder="Filtrar por empreiteira..." /></div></th>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs"><div className="flex items-center gap-1"><span>Projeto</span><TextColumnFilter value={projetoFilter} onChange={setProjetoFilter} placeholder="Filtrar por projeto..." /></div></th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}>
                    <div className="flex items-center justify-center gap-1"><span>Status</span><SelectColumnFilter value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="Filtrar por status" /></div>
                  </th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '140px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnsaios.map((ensaio, index) => (
                  <TableRowAdmin
                    key={ensaio.id}
                    ensaio={ensaio}
                    obra={obras.find((o) => o.id === ensaio.obra_id)}
                    projeto={ensaio.project_id ? projects.find((p) => p.id === ensaio.project_id) : null}
                    index={index}
                    canApprove={canApprove}
                    allUsers={allUsers}
                    obras={obras}
                    onApprove={onApprove}
                    onReject={() => setReprovingEnsaio(ensaio)}
                    onDelete={() => setDeletingEnsaio(ensaio)}
                  />
                ))}
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

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ReprovacaoModal ensaio={reprovingEnsaio} isOpen={!!reprovingEnsaio} onClose={() => setReprovingEnsaio(null)} onReprove={handleReject} />
      <ExclusaoModal ensaio={deletingEnsaio} isOpen={!!deletingEnsaio} onClose={() => setDeletingEnsaio(null)} onDelete={handleDelete} />
    </div>
  );
});

AdminInterface.displayName = 'AdminInterface';
export default AdminInterface;