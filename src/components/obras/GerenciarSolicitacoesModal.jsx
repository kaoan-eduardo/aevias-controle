
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRightLeft, 
  User as UserIcon,
  MapPin,
  Loader2,
  AlertCircle
} from "lucide-react";
import { SolicitacaoTransferenciaRegional } from "@/entities/SolicitacaoTransferenciaRegional";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User"; // Added User entity import

const statusConfig = {
  pendente: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pendente" },
  aprovada: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Aprovada" },
  rejeitada: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Rejeitada" }
};

const SolicitacaoCard = ({ solicitacao, onAprovar, onRejeitar, user }) => {
  const [rejeitando, setRejeitando] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [processando, setProcessando] = useState(false);
  
  const status = statusConfig[solicitacao.status];

  const handleAprovar = async () => {
    if (!window.confirm(`Confirma a aprovação da transferência de ${solicitacao.laboratorista_name} para ${solicitacao.regional_destino_nome}?`)) {
      return;
    }

    setProcessando(true);
    try {
      // VALIDAÇÃO ADICIONAL: Verificar se o usuário tem o access_level correto
      const allUsers = await User.list();
      const usuario = allUsers.find(u => u.email.toLowerCase() === solicitacao.laboratorista_email.toLowerCase());
      
      if (usuario && usuario.access_level !== 'user' && usuario.access_level !== 'admin') {
        alert(`❌ Erro: O usuário ${solicitacao.laboratorista_email} não é um laboratorista (access_level: ${usuario.access_level}). Não pode ser transferido como laboratorista.`);
        setProcessando(false);
        return;
      }

      await onAprovar(solicitacao);
    } finally {
      setProcessando(false);
    }
  };

  const handleRejeitar = async () => {
    if (!motivoRejeicao.trim()) {
      alert("Por favor, informe o motivo da rejeição.");
      return;
    }

    setProcessando(true);
    try {
      await onRejeitar(solicitacao, motivoRejeicao);
      setRejeitando(false);
      setMotivoRejeicao("");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">{solicitacao.laboratorista_name}</p>
              <p className="text-xs sm:text-sm text-slate-500 break-all">{solicitacao.laboratorista_email}</p>
            </div>
          </div>
          <Badge className={`${status.color} shrink-0 self-start sm:self-auto`}>
            <status.icon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-700">De:</span>
              <span className="text-slate-900 ml-1 break-words">{solicitacao.regional_atual_nome}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pl-6">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slate-700">Para:</span>
              <span className="text-blue-900 font-semibold ml-1 break-words">{solicitacao.regional_destino_nome}</span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs sm:text-sm font-medium text-slate-700 mb-1">Motivo:</p>
            <p className="text-xs sm:text-sm text-slate-600 break-words">{solicitacao.motivo}</p>
          </div>

          {solicitacao.status !== 'pendente' && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs sm:text-sm font-medium text-slate-700 break-words">
                {solicitacao.status === 'aprovada' ? 'Aprovado' : 'Rejeitado'} por: {solicitacao.aprovado_por}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(solicitacao.aprovado_em).toLocaleString('pt-BR')}
              </p>
              {solicitacao.motivo_rejeicao && (
                <p className="text-xs sm:text-sm text-red-700 mt-2 break-words">
                  Motivo da rejeição: {solicitacao.motivo_rejeicao}
                </p>
              )}
            </div>
          )}
        </div>

        {solicitacao.status === 'pendente' && !rejeitando && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleAprovar}
              disabled={processando}
            >
              {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => setRejeitando(true)}
              disabled={processando}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rejeitar
            </Button>
          </div>
        )}

        {rejeitando && (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`motivo-${solicitacao.id}`} className="text-sm">Motivo da Rejeição *</Label>
              <Textarea
                id={`motivo-${solicitacao.id}`}
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRejeitando(false);
                  setMotivoRejeicao("");
                }}
                disabled={processando}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={handleRejeitar}
                disabled={processando}
              >
                {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Rejeição"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function GerenciarSolicitacoesModal({ isOpen, onClose, user, onUpdate }) {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendente");

  useEffect(() => {
    if (isOpen) {
      loadSolicitacoes();
    }
  }, [isOpen]);

  const loadSolicitacoes = async () => {
    setLoading(true);
    try {
      const todasSolicitacoes = await SolicitacaoTransferenciaRegional.list("-created_date");
      setSolicitacoes(todasSolicitacoes);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (solicitacao) => {
    try {
      // 1. Atualizar status da solicitação
      await SolicitacaoTransferenciaRegional.update(solicitacao.id, {
        status: "aprovada",
        aprovado_por: user.email,
        aprovado_em: new Date().toISOString()
      });

      // 2. Remover laboratorista da regional atual
      const regionalAtual = await Regional.get(solicitacao.regional_atual_id);
      const laboratoristasAtuais = regionalAtual.laboratoristas_responsaveis || [];
      const novosLaboratoristasAtual = laboratoristasAtuais.filter(
        email => email.toLowerCase() !== solicitacao.laboratorista_email.toLowerCase()
      );
      await Regional.update(solicitacao.regional_atual_id, {
        laboratoristas_responsaveis: novosLaboratoristasAtual
      });

      // 3. Adicionar laboratorista na regional destino
      const regionalDestino = await Regional.get(solicitacao.regional_destino_id);
      const laboratoristasDestino = regionalDestino.laboratoristas_responsaveis || [];
      // Ensure the laboratorista is not duplicated if they somehow already exist
      if (!laboratoristasDestino.some(email => email.toLowerCase() === solicitacao.laboratorista_email.toLowerCase())) {
        await Regional.update(solicitacao.regional_destino_id, {
          laboratoristas_responsaveis: [...laboratoristasDestino, solicitacao.laboratorista_email]
        });
      }

      alert(`Transferência aprovada! ${solicitacao.laboratorista_name} foi movido para ${solicitacao.regional_destino_nome}.`);
      await loadSolicitacoes();
      onUpdate();
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
      alert("Erro ao aprovar solicitação. Tente novamente.");
    }
  };

  const handleRejeitar = async (solicitacao, motivoRejeicao) => {
    try {
      await SolicitacaoTransferenciaRegional.update(solicitacao.id, {
        status: "rejeitada",
        aprovado_por: user.email,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: motivoRejeicao
      });

      alert("Solicitação rejeitada.");
      await loadSolicitacoes();
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      alert("Erro ao rejeitar solicitação. Tente novamente.");
    }
  };

  const solicitacoesFiltradas = solicitacoes.filter(s => 
    filtro === "todas" ? true : s.status === filtro
  );

  const countPendentes = solicitacoes.filter(s => s.status === "pendente").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-base sm:text-lg">Gerenciar Solicitações de Transferência</span>
            </div>
            {countPendentes > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 self-start sm:self-auto">
                {countPendentes} pendente{countPendentes > 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant={filtro === "pendente" ? "default" : "outline"}
            onClick={() => setFiltro("pendente")}
            className="text-xs sm:text-sm"
          >
            Pendentes ({solicitacoes.filter(s => s.status === "pendente").length})
          </Button>
          <Button
            size="sm"
            variant={filtro === "aprovada" ? "default" : "outline"}
            onClick={() => setFiltro("aprovada")}
            className="text-xs sm:text-sm"
          >
            Aprovadas ({solicitacoes.filter(s => s.status === "aprovada").length})
          </Button>
          <Button
            size="sm"
            variant={filtro === "rejeitada" ? "default" : "outline"}
            onClick={() => setFiltro("rejeitada")}
            className="text-xs sm:text-sm"
          >
            Rejeitadas ({solicitacoes.filter(s => s.status === "rejeitada").length})
          </Button>
          <Button
            size="sm"
            variant={filtro === "todas" ? "default" : "outline"}
            onClick={() => setFiltro("todas")}
            className="text-xs sm:text-sm"
          >
            Todas ({solicitacoes.length})
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : solicitacoesFiltradas.length > 0 ? (
          <div className="space-y-4">
            {solicitacoesFiltradas.map(solicitacao => (
              <SolicitacaoCard
                key={solicitacao.id}
                solicitacao={solicitacao}
                onAprovar={handleAprovar}
                onRejeitar={handleRejeitar}
                user={user}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-700 mb-2">
              Nenhuma solicitação {filtro !== "todas" ? filtro : ""}
            </h3>
            <p className="text-sm text-slate-500">
              {filtro === "pendente" 
                ? "Não há solicitações pendentes de aprovação no momento."
                : "Não há solicitações nesta categoria."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
