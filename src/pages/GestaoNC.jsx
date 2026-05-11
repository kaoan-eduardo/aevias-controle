import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Search, Plus, Eye, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";

async function updateNCStatus(id, status, setNcs, requestApproval = false) {
  const updateData = { status };
  if (requestApproval) {
    updateData.pendente_aprovacao_cliente = true;
  }
  await base44.entities.RelatorioNC.update(id, updateData);
  setNcs(prev => prev.map(n => n.id === id ? { ...n, ...updateData } : n));
}

const STATUS_COLORS = {
  aberta: "bg-red-100 text-red-700",
  em_tratativa: "bg-yellow-100 text-yellow-700",
  encerrada: "bg-green-100 text-green-700",
  cancelada: "bg-gray-100 text-gray-600"
};

const STATUS_LABELS = {
  aberta: "Aberta",
  em_tratativa: "Em Tratativa",
  encerrada: "Finalizada",
  cancelada: "Cancelada"
};

export default function GestaoNCPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [ncs, setNcs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroObra, setFiltroObra] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");
  
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedNC, setSelectedNC] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadData();
  }, [loadData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadData = useCallback(async () => {
    setLoading(true);
    const userData = await User.me();
    setUser(userData);

    const [obrasData, regionaisData, ncsData] = await Promise.all([
      Obra.list(),
      Regional.list(),
      base44.entities.RelatorioNC.list("-created_date", 200)
    ]);

    setRegionais(regionaisData);
    setObras(obrasData);
    setNcs(ncsData);
    setLoading(false);
  }, []);

  const filtradas = useMemo(() => {
    return ncs.filter(nc => {
      if (filtroObra && nc.obra_id !== filtroObra) return false;
      if (filtroStatus && nc.status !== filtroStatus) return false;
      if (filtroTexto) {
        const termo = filtroTexto.toLowerCase();
        if (
          !nc.numero_rnc?.toLowerCase().includes(termo) &&
          !nc.rodovia?.toLowerCase().includes(termo) &&
          !nc.trecho?.toLowerCase().includes(termo) &&
          !nc.descricao_nc?.toLowerCase().includes(termo) &&
          !nc.executora?.toLowerCase().includes(termo)
        ) return false;
      }
      return true;
    });
  }, [ncs, filtroObra, filtroStatus, filtroTexto]);

  const userAccessLevel = user?.access_level || (user?.role === "admin" ? "admin" : "user");
  const isGestor = userAccessLevel === "gestor_contrato";
  const isAdmin = userAccessLevel === "admin";
  const isCliente = userAccessLevel === "cliente";
  const canChangeStatus = isGestor || isAdmin || isCliente;

  const handleApproval = async (approve) => {
    if (!selectedNC) return;

    try {
      if (approve) {
        const clientSignature = {
          signed_by: user.email,
          signed_date: new Date().toISOString(),
          engineer_name: user.full_name || user.email,
          crea_number: user.crea_number || ''
        };

        await base44.entities.RelatorioNC.update(selectedNC.id, {
          pendente_aprovacao_cliente: false,
          cliente_aprovacao: "aprovada",
          cliente_aprovacao_data: new Date().toISOString(),
          cliente_aprovacao_responsavel: user.email,
          client_signature: clientSignature
        });
        setNcs(prev => prev.map(n => n.id === selectedNC.id ? {
          ...n,
          pendente_aprovacao_cliente: false,
          cliente_aprovacao: "aprovada",
          cliente_aprovacao_data: new Date().toISOString(),
          cliente_aprovacao_responsavel: user.email,
          client_signature: clientSignature
        } : n));
      } else {
        if (!rejectionReason.trim()) {
          alert("Por favor, informe o motivo da reprovação");
          return;
        }
        await base44.entities.RelatorioNC.update(selectedNC.id, {
          status: "aberta",
          pendente_aprovacao_cliente: false,
          cliente_aprovacao: "reprovada",
          cliente_aprovacao_data: new Date().toISOString(),
          cliente_aprovacao_responsavel: user.email,
          cliente_reprovacao_motivo: rejectionReason
        });
        setNcs(prev => prev.map(n => n.id === selectedNC.id ? {
          ...n,
          status: "aberta",
          pendente_aprovacao_cliente: false,
          cliente_aprovacao: "reprovada",
          cliente_aprovacao_data: new Date().toISOString(),
          cliente_aprovacao_responsavel: user.email,
          cliente_reprovacao_motivo: rejectionReason
        } : n));
      }
      setShowApprovalModal(false);
      setSelectedNC(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Erro ao processar aprovação:", error);
      alert("Erro ao processar aprovação");
    }
  };

  const openApprovalModal = (nc, action) => {
    setSelectedNC(nc);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleSolicitarAprovacao = async (nc) => {
    try {
      await base44.entities.RelatorioNC.update(nc.id, { 
        pendente_aprovacao_cliente: true,
        cliente_aprovacao: null,
        cliente_reprovacao_motivo: null
      });
      setNcs(prev => prev.map(n => n.id === nc.id ? { 
        ...n, 
        pendente_aprovacao_cliente: true,
        cliente_aprovacao: null,
        cliente_reprovacao_motivo: null
      } : n));
    } catch (error) {
      console.error("Erro ao solicitar aprovação:", error);
      alert("Erro ao solicitar aprovação do cliente");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-[#00233B]">Gestão de NCs</h1>
              <p className="text-[#00233B]/70 text-sm mt-1">Relatórios de Não Conformidade</p>
            </div>
          </div>
          {(isGestor || isAdmin) && (
            <Button
              onClick={() => navigate(createPageUrl("NovaNC"))}
              className="bg-[#00233B] text-white hover:bg-[#00233B]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova NC
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00233B]/50" />
                <Input
                  placeholder="Buscar por RNC, rodovia, trecho..."
                  value={filtroTexto}
                  onChange={e => setFiltroTexto(e.target.value)}
                  className="pl-9 bg-white/50 border-white/20 text-[#00233B]"
                />
              </div>
              <select
                value={filtroObra}
                onChange={e => setFiltroObra(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
              >
                <option value="">Todas as Obras</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
              >
                <option value="">Todos os Status</option>
                <option value="aberta">Aberta</option>
                <option value="em_tratativa">Em Tratativa</option>
                <option value="encerrada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-4">
          {["aberta", "em_tratativa", "encerrada", "cancelada"].map(s => (
            <Card key={s} className="bg-white/20 backdrop-blur-lg border border-white/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-[#00233B]/70 font-medium uppercase tracking-wide">{STATUS_LABELS[s]}</p>
                <p className={`text-3xl font-bold mt-1 ${s === "aberta" ? "text-red-600" : s === "em_tratativa" ? "text-yellow-600" : s === "encerrada" ? "text-green-600" : "text-gray-500"}`}>
                  {ncs.filter(n => n.status === s).length}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtradas.length === 0 ? (
            <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertTriangle className="w-14 h-14 text-[#00233B]/30 mb-4" />
                <p className="text-[#00233B]/60 text-center">Nenhuma não conformidade encontrada.</p>
              </CardContent>
            </Card>
          ) : (
            filtradas.map(nc => {
              const obra = obras.find(o => o.id === nc.obra_id);
              return (
                <Card key={nc.id} className="bg-white/20 backdrop-blur-lg border border-white/20 hover:bg-white/30 transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          {nc.numero_rnc && (
                            <span className="text-sm font-bold text-[#00233B] bg-[#BFCF99]/30 px-2 py-0.5 rounded">
                              {nc.numero_rnc}
                            </span>
                          )}
                          <Badge className={STATUS_COLORS[nc.status] || "bg-gray-100 text-gray-700"}>
                            {STATUS_LABELS[nc.status] || nc.status}
                          </Badge>
                          <span className="text-sm text-[#00233B]/60">
                            {nc.data_nc ? new Date(nc.data_nc).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—"}
                          </span>
                        </div>
                        <p className="font-semibold text-[#00233B]">{obra?.name || nc.obra_nome || "—"}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#00233B]/70">
                          {nc.rodovia && <span>Rodovia: <span className="font-medium text-[#00233B]">{nc.rodovia}</span></span>}
                          {nc.trecho && <span>Trecho: <span className="font-medium text-[#00233B]">{nc.trecho}</span></span>}
                          {nc.executora && <span>Executora: <span className="font-medium text-[#00233B]">{nc.executora}</span></span>}
                          {nc.relatorio_criador && <span>Criado por: <span className="font-medium text-[#00233B]">{nc.relatorio_criador}</span></span>}
                        </div>
                        {nc.descricao_nc && (
                          <p className="text-sm text-[#00233B]/80 mt-1 line-clamp-2">{nc.descricao_nc}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {nc.pendente_aprovacao_cliente ? (
                          <div className="flex flex-col gap-2">
                            <Badge className="bg-orange-100 text-orange-700 text-center">
                              Aguardando Aprovação do Cliente
                            </Badge>
                            {isCliente && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => openApprovalModal(nc, 'approve')}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-7 px-2"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openApprovalModal(nc, 'reject')}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-7 px-2"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reprovar
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : nc.cliente_aprovacao === 'aprovada' ? (
                          <div className="flex flex-col gap-1">
                            {canChangeStatus ? (
                              <>
                                <select
                                  value={nc.status || "aberta"}
                                  onChange={e => updateNCStatus(nc.id, e.target.value, setNcs, false)}
                                  className="h-8 rounded-md border border-white/20 bg-white/50 px-2 text-xs text-[#00233B] cursor-pointer"
                                >
                                  <option value="aberta">Aberta</option>
                                  <option value="em_tratativa">Em Tratativa</option>
                                  <option value="encerrada">Finalizada</option>
                                  <option value="cancelada">Cancelada</option>
                                </select>
                                <Badge className="bg-green-100 text-green-700 text-center text-xs">
                                  ✓ Aprovada pelo Cliente
                                </Badge>
                              </>
                            ) : (
                              <>
                                <Badge className={STATUS_COLORS[nc.status] || "bg-gray-100 text-gray-700"}>
                                  {STATUS_LABELS[nc.status] || nc.status}
                                </Badge>
                                <Badge className="bg-green-100 text-green-700 text-center text-xs">
                                  ✓ Aprovada pelo Cliente
                                </Badge>
                              </>
                            )}
                          </div>
                        ) : nc.cliente_aprovacao === 'reprovada' ? (
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-red-100 text-red-700 text-center">
                              Reprovada - Editar e Reenviar
                            </Badge>
                            {(isGestor || isAdmin) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(createPageUrl(`EditarNC?id=${nc.id}`))}
                                className="h-7 text-xs border-white/30 text-[#00233B] hover:bg-white/20"
                              >
                                Editar NC
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Badge className={STATUS_COLORS[nc.status] || "bg-gray-100 text-gray-700"}>
                              {STATUS_LABELS[nc.status] || nc.status}
                            </Badge>
                            {(isGestor || isAdmin) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSolicitarAprovacao(nc)}
                                className="h-7 text-xs border-white/30 text-[#00233B] hover:bg-white/20"
                              >
                                Solicitar Aprovação
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {nc.cliente_aprovacao === "reprovada" && nc.cliente_reprovacao_motivo && (
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs">
                            <p className="font-semibold text-red-800 mb-1">Motivo da Reprovação:</p>
                            <p className="text-red-700">{nc.cliente_reprovacao_motivo}</p>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(createPageUrl(`RelatorioNC?id=${nc.id}`), "_blank")}
                          className="border-white/20 text-[#00233B] hover:bg-white/20"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Relatório
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal de Aprovação */}
        <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border-white/20">
            <DialogHeader>
              <DialogTitle className="text-[#00233B]">
                {approvalAction === 'approve' ? 'Aprovar NC' : 'Reprovar NC'}
              </DialogTitle>
              <DialogDescription>
                {approvalAction === 'approve' 
                  ? 'Ao aprovar, o gestor poderá alterar o status da NC.'
                  : 'Ao reprovar, a NC retornará para status "Aberta" e o gestor será notificado do motivo.'}
              </DialogDescription>
            </DialogHeader>

            {approvalAction === 'reject' && (
              <div className="space-y-2">
                <label htmlFor="rejection_reason" className="text-sm font-medium text-[#00233B]">
                  Motivo da reprovação *
                </label>
                <Textarea
                  id="rejection_reason"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da reprovação..."
                  className="min-h-[100px] bg-white/50 border-white/30 text-[#00233B]"
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedNC(null);
                  setRejectionReason("");
                }}
                className="border-white/30 text-[#00233B]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleApproval(approvalAction === 'approve')}
                className={approvalAction === 'approve' 
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"}
              >
                {approvalAction === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Reprovação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}