// Interface de tabela para usuários cliente
import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { typeOptions } from "@/components/ensaios/ensaioMappers";
import { Pagination } from "@/components/ensaios/Pagination";
import { DateRangePicker, TextColumnFilter, SelectColumnFilter } from "@/components/ensaios/TableFilters";
import { useTableFilters } from "@/hooks/useTableFilters";
import TableRowCliente from "@/components/ensaios/TableRowCliente";
import { assinarEnsaio } from "@/services/ensaiosService";

const ClienteInterface = React.memo(({ ensaios, obras, projects, user, allUsers }) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const applyCustomFilters = useCallback((filtered) => {
    if (statusFilter === 'approved') return filtered.filter((e) => e.approved === true && !e.client_signature?.signed_by);
    if (statusFilter === 'signed') return filtered.filter((e) => e.client_signature?.signed_by);
    return filtered;
  }, [statusFilter]);

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

  const handleAssinar = useCallback(async (ensaio) => {
    if (!window.confirm(`Confirma a assinatura digital do registro "${ensaio.sample_id || ensaio.id}"?`)) return;
    try {
      await assinarEnsaio(ensaio, user);
      alert('Registro assinado com sucesso!');
      window.location.reload();
    } catch (error) {
      alert(`Erro ao assinar: ${error?.message || 'Erro desconhecido'}.`);
    }
  }, [user]);

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'approved', label: 'Aprovados (não assinados)' },
    { value: 'signed', label: 'Assinados' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-[#00233B]/70">
        <span>{filteredEnsaios.length} registro(s) encontrado(s)</span>
        {isAnyFilterActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-[#00233B]/80 hover:bg-black/10">
            Limpar todos os filtros
          </Button>
        )}
      </div>

      <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-2 py-2 font-medium text-[#00233B] text-xs"><div className="flex items-center gap-1"><span>Tipo</span><SelectColumnFilter value={typeFilter} onChange={setTypeFilter} options={typeOptions} placeholder="Filtrar por tipo" /></div></th>
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
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '100px' }}><div className="flex items-center justify-center gap-1"><span>Status</span><SelectColumnFilter value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="Filtrar por status" /></div></th>
                  <th className="text-center px-2 py-2 font-medium text-[#00233B] text-xs" style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnsaios.map((ensaio, index) => (
                  <TableRowCliente
                    key={ensaio.id}
                    ensaio={ensaio}
                    obra={obras.find((o) => o.id === ensaio.obra_id)}
                    projeto={ensaio.project_id ? projects.find((p) => p.id === ensaio.project_id) : null}
                    index={index}
                    allUsers={allUsers}
                    onAssinar={handleAssinar}
                  />
                ))}
              </tbody>
            </table>
            {filteredEnsaios.length === 0 && (
              <div className="text-center py-12 text-[#00233B]/70">
                <FileText className="w-12 h-12 text-[#00233B]/30 mx-auto mb-4" />
                <h3 className="font-medium text-[#00233B] mb-2">Nenhum registro encontrado</h3>
                <p>Ajuste os filtros ou aguarde novos registros aprovados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
});

ClienteInterface.displayName = 'ClienteInterface';
export default ClienteInterface;