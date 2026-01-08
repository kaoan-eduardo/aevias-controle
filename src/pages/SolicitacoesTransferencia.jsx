import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, CheckCircle, XCircle, Clock, Loader2, AlertTriangle, MapPin, User as UserIcon } from "lucide-react";
import { SolicitacaoTransferenciaRegional } from "@/entities/SolicitacaoTransferenciaRegional";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const getStatusInfo = (status) => {
  switch (status) {
    case "aprovada":
      return { text: "Aprovada", icon: CheckCircle, className: "bg-[#566E3D]/10 text-[#566E3D] border border-[#566E3D]/30" };
    case "rejeitada":
      return { text: "Rejeitada", icon: XCircle, className: "bg-[#800020]/10 text-[#800020] border border-[#800020]/30" };
    default:
      return { text: "Pendente", icon: Clock, className: "bg-[#FBBF24]/10 text-[#854d0e] border border-[#FBBF24]/30" };
  }
};

const SolicitacaoCard = React.memo(({ solicitacao, onApprove, onReject, canManage, regionais }) => {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const status = getStatusInfo(solicitacao.status);

  const regionalAtual = useMemo(() => 
    regionais.find(r => r.id === solicitacao.regional_atual_id),
    [regionais, solicitacao.regional_atual_id]
  );

  const regionalDestino = useMemo(() => 
    regionais.find(r => r.id === solicitacao.regional_destino_id),
    [regionais, solicitacao.regional_destino_id]
  );

  const handleReject = useCallback(() => {
    if (!motivoRejeicao.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    onReject(solicitacao, motivoRejeicao);
    setIsRejectDialogOpen(false);
    setMotivoRejeicao('');
  }, [solicitacao, motivoRejeicao, onReject]);

  return (
    <Card className="hover:shadow-md transition-shadow bg-white/20 backdrop-blur-lg border border-white/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4 text-[#BFCF99]" />
                <span className="font-semibold text-[#00233B]">{solicitacao.laboratorista_name}</span>
              </div>
              <p className="text-sm text-[#00233B]/70">{solicitacao.laboratorista_email}</p>
            </div>
            <Badge className={`${status.className} gap-1`}>
              <status.icon className="w-3 h-3" />
              {status.text}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-black/5 rounded-lg">
            <div>
              <p className="text-xs font-medium text-[#00233B]/70 mb-1">Regional Atual</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#800020]" />
                <span className="font-medium text-[#00233B]">{regionalAtual?.nome || solicitacao.regional_atual_nome}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#00233B]/70 mb-1">Regional Destino</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#566E3D]" />
                <span className="font-medium text-[#00233B]">{regionalDestino?.nome || solicitacao.regional_destino_nome}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[#00233B]/70 mb-1">Motivo da Solicitação</p>
            <p className="text-sm text-[#00233B] bg-white/30 p-2 rounded">{solicitacao.motivo}</p>
          </div>

          <div className="text-xs text-[#00233B]/60">
            Solicitado em {format(new Date(solicitacao.created_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </div>

          {solicitacao.status === 'aprovada' && solicitacao.aprovado_em && (
            <div className="bg-[#566E3D]/10 border border-[#566E3D]/30 rounded p-2">
              <p className="text-sm text-[#566E3D]">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Aprovada por {solicitacao.aprovado_por} em {format(new Date(solicitacao.aprovado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}

          {solicitacao.status === 'rejeitada' && (
            <div className="bg-[#800020]/10 border border-[#800020]/30 rounded p-2">
              <p className="text-sm font-medium text-[#800020] mb-1">
                <XCircle className="w-4 h-4 inline mr-1" />
                Rejeitada em {format(new Date(solicitacao.aprovado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {solicitacao.motivo_rejeicao && (
                <p className="text-sm text-[#800020]">Motivo: {solicitacao.motivo_rejeicao}</p>
              )}
            </div>
          )}

          {canManage && solicitacao.status === 'pendente' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                style={{ backgroundColor: '#566E3D' }}
                className="text-white hover:opacity-90 flex-1"
                onClick={() => onApprove(solicitacao)}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Aprovar
              </Button>
              <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    style={{ backgroundColor: '#800020' }}
                    className="text-white hover:opacity-90 flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20">
                  <DialogHeader>
                    <DialogTitle>Rejeitar Solicitação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="motivo_rejeicao">Motivo da Rejeição *</Label>
                      <Textarea
                        id="motivo_rejeicao"
                        value={motivoRejeicao}
                        onChange={(e) => setMotivoRejeicao(e.target.value)}
                        placeholder="Descreva o motivo da rejeição..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleReject}>Confirmar Rejeição</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SolicitacaoCard.displayName = 'SolicitacaoCard';

const NovaSolicitacaoDialog = React.memo(({ isOpen, onClose, onSubmit, regionais, regionalAtual }) => {
  const [formData, setFormData] = useState({
    regional_destino_id: '',
    motivo: ''
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!formData.regional_destino_id || !formData.motivo.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    onSubmit(formData);
    setFormData({ regional_destino_id: '', motivo: '' });
  }, [formData, onSubmit]);

  const regionaisDisponiveis = useMemo(() => 
    regionais.filter(r => r.id !== regionalAtual?.id && r.status === 'ativa'),
    [regionais, regionalAtual]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Transferência</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {regionalAtual && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Regional Atual:</strong> {regionalAtual.nome}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="regional_destino">Regional de Destino *</Label>
            <select
              id="regional_destino"
              value={formData.regional_destino_id}
              onChange={(e) => setFormData(prev => ({ ...prev, regional_destino_id: e.target.value }))}
              required
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione a regional de destino</option>
              {regionaisDisponiveis.map(regional => (
                <option key={regional.id} value={regional.id}>
                  {regional.nome} {regional.estado && `(${regional.estado})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="motivo">Motivo da Solicitação *</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Explique o motivo da sua solicitação de transferência..."
              rows={4}
              required
              maxLength="500"
            />
            <p className="text-xs text-right text-slate-500 mt-1">
              {formData.motivo.length} / 500
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

NovaSolicitacaoDialog.displayName = 'NovaSolicitacaoDialog';

export default function SolicitacoesTransferenciaPage() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const userAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const canManage = userAccessLevel === 'admin' || userAccessLevel === 'sala_tecnica_afirmaevias' || userAccessLevel === 'gestor_contrato';
  const isLaboratorista = userAccessLevel === 'user';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, solicitacoesData, regionaisData] = await Promise.all([
        User.me(),
        SolicitacaoTransferenciaRegional.list('-created_date'),
        Regional.list()
      ]);

      setUser(userData);
      setRegionais(regionaisData);

      const currentUserAccessLevel = userData.access_level || (userData.role === 'admin' ? 'admin' : 'user');
      
      // Admin vê todas as solicitações
      if (currentUserAccessLevel === 'admin') {
        setSolicitacoes(solicitacoesData);
      } 
      // Gestor de Contrato vê apenas solicitações para suas regionais
      else if (currentUserAccessLevel === 'gestor_contrato') {
        const regionaisDoGestor = regionaisData.filter(regional => 
          regional.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase()
        );
        
        const regionaisIds = regionaisDoGestor.map(r => r.id);
        
        // Filtra solicitações onde a regional de DESTINO é uma das regionais do gestor
        const solicitacoesFiltradas = solicitacoesData.filter(s => 
          regionaisIds.includes(s.regional_destino_id)
        );
        
        setSolicitacoes(solicitacoesFiltradas);
      }
      // Sala Técnica vê apenas solicitações para suas regionais
      else if (currentUserAccessLevel === 'sala_tecnica_afirmaevias') {
        const regionaisDaSalaTecnica = regionaisData.filter(regional => {
          const salas = regional.salas_tecnicas_responsaveis || [];
          return salas.some(email => email.toLowerCase() === userData.email.toLowerCase());
        });
        
        const regionaisIds = regionaisDaSalaTecnica.map(r => r.id);
        
        // Filtra solicitações onde a regional de DESTINO é uma das regionais da sala técnica
        const solicitacoesFiltradas = solicitacoesData.filter(s => 
          regionaisIds.includes(s.regional_destino_id)
        );
        
        setSolicitacoes(solicitacoesFiltradas);
      }
      // Laboratorista vê apenas suas próprias solicitações
      else if (currentUserAccessLevel === 'user') {
        const minhasSolicitacoes = solicitacoesData.filter(s => 
          s.laboratorista_email.toLowerCase() === userData.email.toLowerCase()
        );
        setSolicitacoes(minhasSolicitacoes);
      }
      // Cliente não vê nada (segurança adicional)
      else {
        setSolicitacoes([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const regionalAtual = useMemo(() => {
    if (!user || !regionais) return null;
    return regionais.find(regional => {
      const laboratoristas = regional.laboratoristas_responsaveis || [];
      return laboratoristas.some(email => email.toLowerCase() === user.email.toLowerCase());
    });
  }, [user, regionais]);

  const handleNovaSolicitacao = useCallback(async (formData) => {
    if (!user || !regionalAtual) {
      alert('Você precisa estar alocado em uma regional para solicitar transferência.');
      return;
    }

    const regionalDestino = regionais.find(r => r.id === formData.regional_destino_id);

    try {
      await SolicitacaoTransferenciaRegional.create({
        laboratorista_email: user.email,
        laboratorista_name: user.laboratorista_name || user.full_name,
        regional_atual_id: regionalAtual.id,
        regional_atual_nome: regionalAtual.nome,
        regional_destino_id: formData.regional_destino_id,
        regional_destino_nome: regionalDestino.nome,
        motivo: formData.motivo,
        status: 'pendente'
      });

      alert('Solicitação enviada com sucesso!');
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      alert('Erro ao enviar solicitação.');
    }
  }, [user, regionalAtual, regionais, loadData]);

  const handleApprove = useCallback(async (solicitacao) => {
    if (!window.confirm('Deseja aprovar esta solicitação de transferência?')) return;

    try {
      // Atualizar a solicitação
      await SolicitacaoTransferenciaRegional.update(solicitacao.id, {
        status: 'aprovada',
        aprovado_por: user.email,
        aprovado_em: new Date().toISOString()
      });

      // Remover laboratorista da regional atual
      const regionalAtualData = regionais.find(r => r.id === solicitacao.regional_atual_id);
      if (regionalAtualData) {
        const novosLaboratoristas = (regionalAtualData.laboratoristas_responsaveis || [])
          .filter(email => email.toLowerCase() !== solicitacao.laboratorista_email.toLowerCase());
        await Regional.update(solicitacao.regional_atual_id, {
          laboratoristas_responsaveis: novosLaboratoristas
        });
      }

      // Adicionar laboratorista na regional de destino
      const regionalDestinoData = regionais.find(r => r.id === solicitacao.regional_destino_id);
      if (regionalDestinoData) {
        const novosLaboratoristas = [
          ...(regionalDestinoData.laboratoristas_responsaveis || []),
          solicitacao.laboratorista_email
        ];
        await Regional.update(solicitacao.regional_destino_id, {
          laboratoristas_responsaveis: novosLaboratoristas
        });
      }

      alert('Solicitação aprovada com sucesso! O laboratorista foi transferido de regional.');
      loadData();
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
      alert('Erro ao aprovar solicitação.');
    }
  }, [user, regionais, loadData]);

  const handleReject = useCallback(async (solicitacao, motivoRejeicao) => {
    try {
      await SolicitacaoTransferenciaRegional.update(solicitacao.id, {
        status: 'rejeitada',
        aprovado_por: user.email,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: motivoRejeicao
      });

      alert('Solicitação rejeitada.');
      loadData();
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      alert('Erro ao rejeitar solicitação.');
    }
  }, [user, loadData]);

  const solicitacoesPendentes = useMemo(() => 
    solicitacoes.filter(s => s.status === 'pendente'),
    [solicitacoes]
  );

  const solicitacoesAprovadas = useMemo(() => 
    solicitacoes.filter(s => s.status === 'aprovada'),
    [solicitacoes]
  );

  const solicitacoesRejeitadas = useMemo(() => 
    solicitacoes.filter(s => s.status === 'rejeitada'),
    [solicitacoes]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-slate-600 mt-2">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00233B] mb-2">
              Transferências de Regional
            </h1>
            <p className="text-[#00233B]/80">
              {canManage 
                ? userAccessLevel === 'admin'
                  ? "Gerencie as solicitações de transferência entre regionais"
                  : "Gerencie as solicitações de transferência para suas regionais"
                : `Solicite transferência de regional ou acompanhe suas solicitações`}
            </p>
            {isLaboratorista && regionalAtual && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Sua Regional Atual:</strong> {regionalAtual.nome}
                </p>
              </div>
            )}
            {isLaboratorista && !regionalAtual && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 inline text-amber-600 mr-2" />
                <span className="text-sm text-amber-800">
                  Você não está alocado em nenhuma regional no momento.
                </span>
              </div>
            )}
          </div>
          {isLaboratorista && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90"
              disabled={!regionalAtual}
              title={!regionalAtual ? "Você precisa estar alocado em uma regional para solicitar transferência" : ""}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          )}
        </div>

        <Tabs defaultValue="pendentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-lg border border-white/20">
            <TabsTrigger value="pendentes">
              Pendentes <Badge className="ml-2">{solicitacoesPendentes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="aprovadas">
              Aprovadas <Badge className="ml-2">{solicitacoesAprovadas.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejeitadas">
              Rejeitadas <Badge className="ml-2">{solicitacoesRejeitadas.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="mt-6 space-y-4">
            {solicitacoesPendentes.length > 0 ? (
              solicitacoesPendentes.map(solicitacao => (
                <SolicitacaoCard
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  canManage={canManage}
                  regionais={regionais}
                />
              ))
            ) : (
              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-16 h-16 text-[#00233B]/30 mb-4" />
                  <h3 className="text-lg font-semibold text-[#00233B] mb-2">
                    Nenhuma solicitação pendente
                  </h3>
                  <p className="text-[#00233B]/70 text-center">
                    {isLaboratorista 
                      ? "Você não possui solicitações pendentes no momento."
                      : "Não há solicitações aguardando aprovação para suas regionais."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="aprovadas" className="mt-6 space-y-4">
            {solicitacoesAprovadas.length > 0 ? (
              solicitacoesAprovadas.map(solicitacao => (
                <SolicitacaoCard
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  canManage={false}
                  regionais={regionais}
                />
              ))
            ) : (
              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-16 h-16 text-[#566E3D]/30 mb-4" />
                  <h3 className="text-lg font-semibold text-[#00233B] mb-2">
                    Nenhuma solicitação aprovada
                  </h3>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejeitadas" className="mt-6 space-y-4">
            {solicitacoesRejeitadas.length > 0 ? (
              solicitacoesRejeitadas.map(solicitacao => (
                <SolicitacaoCard
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  canManage={false}
                  regionais={regionais}
                />
              ))
            ) : (
              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <XCircle className="w-16 h-16 text-[#800020]/30 mb-4" />
                  <h3 className="text-lg font-semibold text-[#00233B] mb-2">
                    Nenhuma solicitação rejeitada
                  </h3>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <NovaSolicitacaoDialog
          isOpen={isDialogOpen}
          onClose={setIsDialogOpen}
          onSubmit={handleNovaSolicitacao}
          regionais={regionais}
          regionalAtual={regionalAtual}
        />
      </div>
    </div>
  );
}