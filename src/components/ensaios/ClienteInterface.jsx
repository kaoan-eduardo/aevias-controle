// Interface de tabela para usuários cliente
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { getEnsaioTypeInfo, getReportLink, getDataFormatted, getDataEnsaio, typeOptions } from "@/components/ensaios/ensaioMappers";
import { getLocalInfo, getLaboratoristaInfo, getEmpireiteiraInfo, getNaoConformidades, getStatusInfo } from "@/components/ensaios/utils";
import { Pagination } from "@/components/ensaios/Pagination";
import { CopyIdButton, DateRangePicker, TextColumnFilter, SelectColumnFilter } from "@/components/ensaios/TableFilters";
import { assinarEnsaio } from "@/services/ensaiosService";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => prev === 'desc' ? 'asc' : prev === 'asc' ? null : 'desc');
  }, []);

  const filteredEnsaios = useMemo(() => {
    let filtered = ensaios;
    if (nomeFilter) filtered = filtered.filter((e) => getLaboratoristaInfo(e, allUsers).toLowerCase().includes(nomeFilter.toLowerCase()));
    if (obraFilter) filtered = filtered.filter((e) => { const o = obras.find((ob) => ob.id === e.obra_id); return o?.name?.toLowerCase().includes(obraFilter.toLowerCase()) || o?.code?.toLowerCase().includes(obraFilter.toLowerCase()); });
    if (projetoFilter) filtered = filtered.filter((e) => { if (!e.project_id) return false; const p = projects.find((pr) => pr.id === e.project_id); return p?.name?.toLowerCase().includes(projetoFilter.toLowerCase()); });
    if (localFilter) filtered = filtered.filter((e) => { const li = getLocalInfo(e); return li.tipo?.toLowerCase().includes(localFilter.toLowerCase()) || li.detalhes?.toLowerCase().includes(localFilter.toLowerCase()); });
    if (empreiteiraFilter) filtered = filtered.filter((e) => getEmpireiteiraInfo(e)?.toLowerCase().includes(empreiteiraFilter.toLowerCase()) ?? false);
    if (dataInicioFilter) { const d = new Date(dataInicioFilter); d.setHours(0,0,0,0); filtered = filtered.filter((e) => { const de = getDataEnsaio(e); if (!de) return false; const ed = new Date(de); ed.setHours(0,0,0,0); return ed >= d; }); }
    if (dataFimFilter) { const d = new Date(dataFimFilter); d.setHours(23,59,59,999); filtered = filtered.filter((e) => { const de = getDataEnsaio(e); if (!de) return false; const ed = new Date(de); ed.setHours(0,0,0,0); return ed <= d; }); }
    if (statusFilter !== 'all') filtered = filtered.filter((e) => {
      if (statusFilter === 'approved') return e.approved === true && !e.client_signature?.signed_by;
      if (statusFilter === 'signed') return e.client_signature?.signed_by;
      return true;
    });
    if (typeFilter && typeFilter !== 'all') filtered = filtered.filter((e) => e.entityType === typeFilter);
    if (sortOrder) filtered = [...filtered].sort((a, b) => {
      const dA = new Date(getDataEnsaio(a)), dB = new Date(getDataEnsaio(b));
      if (isNaN(dA) || isNaN(dB)) return 0;
      return sortOrder === 'asc' ? dA - dB : dB - dA;
    });
    return filtered;
  }, [ensaios, nomeFilter, obraFilter, projetoFilter, localFilter, empreiteiraFilter, dataInicioFilter, dataFimFilter, statusFilter, typeFilter, obras, projects, sortOrder, allUsers]);

  const clearFilters = useCallback(() => {
    setNomeFilter(''); setObraFilter(''); setProjetoFilter(''); setLocalFilter(''); setEmpreiteiraFilter('');
    setDataInicioFilter(''); setDataFimFilter(''); setStatusFilter('all'); setTypeFilter('all');
    setSortOrder('desc'); setCurrentPage(1);
  }, []);

  const isAnyFilterActive = nomeFilter || obraFilter || projetoFilter || localFilter || empreiteiraFilter ||
    dataInicioFilter || dataFimFilter || statusFilter !== 'all' || typeFilter !== 'all';

  const totalPages = Math.ceil(filteredEnsaios.length / itemsPerPage);
  const paginatedEnsaios = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnsaios.slice(start, start + itemsPerPage);
  }, [filteredEnsaios, currentPage]);

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
                  const naoConformidades = getNaoConformidades(ensaio);
                  const temAcoesCorretivas = ensaio.acoes_corretivas_realizado === true;

                  return (
                    <tr key={ensaio.id} className={`border-b border-white/10 hover:bg-black/5 ${index % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02]'}`}>
                      <td className="px-2 py-2">
                        <div className="font-medium text-[#00233B] flex items-center gap-1 text-xs">
                          <TypeIcon className="w-3 h-3 text-[#BFCF99]" />
                          <span className="truncate max-w-[120px]" title={name}>{name}</span>
                          <CopyIdButton id={ensaio.id} />
                          {naoConformidades.length > 0 && <span className="text-red-600 cursor-help" title={`Não conformidades:\n${naoConformidades.join('\n')}`}>⚠️</span>}
                          {!naoConformidades.length && temAcoesCorretivas && <span className="text-orange-500 cursor-help" title="Ações corretivas realizadas">⚠️</span>}
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
                      <td className="px-2 py-2">{getEmpireiteiraInfo(ensaio) ? <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]">{getEmpireiteiraInfo(ensaio)}</div> : <div className="text-[#00233B]/50 text-center text-xs">-</div>}</td>
                      <td className="px-2 py-2">{projeto ? <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={projeto.name}>{projeto.name}</div> : <div className="text-[#00233B]/50 text-center text-xs">-</div>}</td>
                      <td className="px-2 py-2 text-center">
                        <Badge className={`${status.className} gap-1 text-[10px] px-2 py-0.5`}><status.icon className="w-3 h-3" />{status.text}</Badge>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <Button asChild variant="outline" size="sm" className="text-[#00233B] hover:bg-[#00233B]/10 border-white/20 h-7 px-2">
                            <Link to={reportUrl} target="_blank"><FileText className="w-3 h-3" /></Link>
                          </Button>
                          {podeAssinar && (
                            <Button size="sm" style={{ backgroundColor: '#566E3D' }} className="text-white hover:opacity-90 h-7 px-2" onClick={() => handleAssinar(ensaio)} title="Assinar">
                              <MessageSquare className="w-3 h-3" />
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