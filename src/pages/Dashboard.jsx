import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, FolderOpen, FlaskConical, CheckCircle, AlertTriangle, Clock, XCircle, Calendar, Loader2, FileSignature, UserPlus
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, formatDistanceToNow, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const StatCard = React.memo(({ title, value, icon: Icon, note, onClick, className }) => (
  <Card 
    className={`relative overflow-hidden bg-white/20 backdrop-blur-lg border border-white/20 shadow-sm text-[#00233B] ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className || ''}`}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-[#00233B]/80">{title}</CardTitle>
      <div className={`p-2 rounded-lg bg-[#BFCF99]/20`}>
        <Icon className={`w-4 h-4 text-[#00233B]`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-[#00233B]">{value}</div>
      {note && (
        <p className="text-xs text-[#00233B]/70 mt-1">
          {note}
        </p>
      )}
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

const getEntityTypeDescription = (type) => {
    switch (type) {
        case 'Obra': return 'Nova obra cadastrada';
        case 'Project': return 'Novo projeto cadastrado';
        case 'DiarioObra': return 'Novo diário de obra';
        case 'EnsaioCAUQ': return 'Novo ensaio de CAUQ';
        case 'EnsaioDensidade': return 'Novo ensaio de densidade';
        case 'ChecklistUsina': return 'Novo checklist de usina';
        case 'ChecklistAplicacao': return 'Novo checklist de aplicação';
        case 'ChecklistMRAF': return 'Novo checklist MRAF';
        case 'ChecklistConcretagem': return 'Novo checklist de concretagem';
        case 'ChecklistTerraplanagem': return 'Novo checklist de terraplanagem';
        case 'SolicitacaoTransferencia': return 'Transferência aprovada';
        default: return 'Nova atividade';
    }
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    obras: 0,
    projects: 0,
    ensaios: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    assinados: 0,
    aguardando_assinatura: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [statusChartData, setStatusChartData] = useState([]);
  const [alerts, setAlerts] = useState({ pending: 0, rejected: 0, aguardando_assinatura: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const userAccessLevel = userData.access_level || (userData.role === 'admin' ? 'admin' : 'user');
      const isCliente = userAccessLevel === 'cliente';
      const isEngenheiro = isCliente && userData?.position?.toLowerCase().includes('engenheiro');

      // Carregar dados em paralelo para maior velocidade
      const loadPromises = [
        base44.entities.Obra.list("-created_date"),
        base44.entities.Project.list("-created_date"),
        base44.entities.EnsaioCAUQ.list("-created_date"),
        base44.entities.EnsaioDensidade.list("-created_date"),
        base44.entities.DiarioObra.list("-created_date"),
        base44.entities.ChecklistUsina.list("-created_date"),
        base44.entities.ChecklistAplicacao.list("-created_date"),
        base44.entities.ChecklistMRAF.list("-created_date"),
        base44.entities.ChecklistConcretagem.list("-created_date"),
        base44.entities.ChecklistTerraplanagem.list("-created_date"),
      ];

      // Adicionar regionais e transferências apenas para clientes, gestores e salas técnicas
      if (userAccessLevel === 'cliente' || userAccessLevel === 'sala_tecnica_afirmaevias' || userAccessLevel === 'gestor_contrato') {
        loadPromises.push(base44.entities.Regional.list());
        if (isCliente) {
          loadPromises.push(base44.entities.SolicitacaoTransferenciaRegional.list('-created_date', 50));
        }
      } else {
        loadPromises.push(Promise.resolve([]));
        loadPromises.push(Promise.resolve([]));
      }

      const [obras, projects, ensaiosCAUQ, ensaiosDensidade, diariosObra, checklistsUsina, checklistsAplicacao, checklistsMRAF, checklistsConcretagem, checklistsTerraplanagem, regionais, transferencias] = await Promise.all(loadPromises);

      let obrasFiltradas = obras;
      let projectsFiltrados = projects;
      let allEnsaios = [
        ...ensaiosCAUQ.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'EnsaioCAUQ'})),
        ...ensaiosDensidade.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'EnsaioDensidade'})),
        ...diariosObra.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'DiarioObra'})),
        ...checklistsUsina.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'ChecklistUsina'})),
        ...checklistsAplicacao.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'ChecklistAplicacao'})),
        ...checklistsMRAF.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'ChecklistMRAF'})),
        ...checklistsConcretagem.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'ChecklistConcretagem'})),
        ...checklistsTerraplanagem.filter(e => e.status === 'finalizado').map(e => ({...e, entityType: 'ChecklistTerraplanagem'})),
      ];

      let regionalDoUsuario = null;

      // Filtrar dados baseado no nível de acesso
      if (userAccessLevel === 'cliente' || userAccessLevel === 'sala_tecnica_afirmaevias' || userAccessLevel === 'gestor_contrato') {
        const regionaisDoUsuario = regionais.filter(regional => {
          if (userAccessLevel === 'cliente') {
            const clientes = regional.clientes_responsaveis || [];
            return clientes.some(email => email.toLowerCase() === userData.email.toLowerCase());
          } else if (userAccessLevel === 'sala_tecnica_afirmaevias') {
            const salas = regional.salas_tecnicas_responsaveis || [];
            return salas.some(email => email.toLowerCase() === userData.email.toLowerCase());
          } else if (userAccessLevel === 'gestor_contrato') {
            return regional.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase();
          }
          return false;
        });

        regionalDoUsuario = regionaisDoUsuario[0]; // Para clientes, pegar a primeira regional

        // IDs das regionais
        const regionaisIds = regionaisDoUsuario.map(r => r.id);

        // Filtrar obras das regionais
        obrasFiltradas = obras.filter(obra => regionaisIds.includes(obra.regional_id));
        
        // Filtrar projetos vinculados às regionais
        const projectIdsPermitidos = new Set();
        regionaisDoUsuario.forEach(regional => {
          if (regional.project_ids) {
            regional.project_ids.forEach(id => projectIdsPermitidos.add(id));
          }
        });
        projectsFiltrados = projects.filter(p => projectIdsPermitidos.has(p.id));

        // Filtrar ensaios das obras das regionais
        const obrasIds = obrasFiltradas.map(o => o.id);
        
        if (userAccessLevel === 'cliente') {
          // Cliente vê apenas aprovados ou assinados
          allEnsaios = allEnsaios.filter(e => 
            obrasIds.includes(e.obra_id) && 
            (e.approved === true || e.client_signature?.signed_by)
          );
        } else {
          // Gestor e Sala Técnica veem todos os ensaios das suas regionais
          allEnsaios = allEnsaios.filter(e => obrasIds.includes(e.obra_id));
        }
      }

      // Calcular estatísticas específicas para cliente
      let approvedCount, pendingCount, rejectedCount, assinadosCount, aguardandoAssinaturaCount;

      if (isCliente) {
        // Para cliente: mostrar apenas ensaios assinados e aguardando assinatura
        assinadosCount = allEnsaios.filter(e => e.client_signature?.signed_by).length;
        aguardandoAssinaturaCount = isEngenheiro ? 
          allEnsaios.filter(e => e.approved === true && !e.client_signature?.signed_by).length : 
          0;
        approvedCount = allEnsaios.filter(e => e.approved === true).length;
        pendingCount = 0;
        rejectedCount = 0;
      } else {
        approvedCount = allEnsaios.filter(e => e.approved === true).length;
        pendingCount = allEnsaios.filter(e => e.approved === null).length;
        rejectedCount = allEnsaios.filter(e => e.approved === false).length;
        assinadosCount = allEnsaios.filter(e => e.client_signature?.signed_by).length;
        aguardandoAssinaturaCount = 0;
      }

      setStats({
        obras: obrasFiltradas.length,
        projects: projectsFiltrados.length,
        ensaios: allEnsaios.length,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        assinados: assinadosCount,
        aguardando_assinatura: aguardandoAssinaturaCount,
      });

      setAlerts({ 
        pending: pendingCount, 
        rejected: rejectedCount,
        aguardando_assinatura: aguardandoAssinaturaCount 
      });

      // Process monthly chart data
      const now = new Date();
      const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(now, 5 - i);
        return {
          name: format(date, 'MMM', { locale: ptBR }),
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
      });

      const processedMonthlyData = last6Months.map(month => {
        const ensaiosInMonth = allEnsaios.filter(e => isWithinInterval(new Date(e.created_date), { start: month.start, end: month.end }));
        
        if (isCliente) {
          return {
            name: month.name,
            ensaios: ensaiosInMonth.length,
            assinados: ensaiosInMonth.filter(e => e.client_signature?.signed_by).length,
          };
        } else {
          return {
            name: month.name,
            ensaios: ensaiosInMonth.length,
            aprovados: ensaiosInMonth.filter(e => e.approved === true).length,
          };
        }
      });
      setMonthlyChartData(processedMonthlyData);

      // Process status chart data - customizado para cliente
      if (isCliente) {
        setStatusChartData([
          { name: 'Assinados', value: assinadosCount, color: '#00233B' },
          { name: 'Aguardando Assinatura', value: aguardandoAssinaturaCount, color: '#FBBF24' },
        ]);
      } else {
        setStatusChartData([
          { name: 'Aprovados', value: approvedCount, color: '#566E3D' },
          { name: 'Pendentes', value: pendingCount, color: '#FBBF24' },
          { name: 'Reprovados', value: rejectedCount, color: '#800020' },
        ]);
      }

      // Process recent activity - customizado para cliente
      if (isCliente) {
        const recentActivitiesFormatted = [];

        // 1. Ensaios aguardando assinatura (se for engenheiro)
        if (isEngenheiro) {
          const ensaiosAguardandoAssinatura = allEnsaios
            .filter(e => e.approved === true && !e.client_signature?.signed_by)
            .sort((a, b) => new Date(b.approved_date || b.created_date) - new Date(a.approved_date || a.created_date))
            .slice(0, 3);

          ensaiosAguardandoAssinatura.forEach(ensaio => {
            const obra = obrasFiltradas.find(o => o.id === ensaio.obra_id);
            const description = getEntityTypeDescription(ensaio.entityType);
            recentActivitiesFormatted.push({
              description: `${description} aguardando assinatura`,
              obra: obra ? `Obra ${obra.name}` : '',
              time: formatDistanceToNow(new Date(ensaio.approved_date || ensaio.created_date), { addSuffix: true, locale: ptBR }),
              icon: FileSignature,
              color: 'text-[#FBBF24]',
              action: 'assinar'
            });
          });
        }

        // 2. Projetos recentemente adicionados à regional (últimos 30 dias)
        const dataLimite = subDays(now, 30);
        const projetosRecentes = projectsFiltrados
          .filter(p => new Date(p.created_date) >= dataLimite)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 2);

        projetosRecentes.forEach(projeto => {
          recentActivitiesFormatted.push({
            description: `Projeto "${projeto.name}" vinculado à sua regional`,
            obra: regionalDoUsuario ? `Regional ${regionalDoUsuario.nome}` : '',
            time: formatDistanceToNow(new Date(projeto.created_date), { addSuffix: true, locale: ptBR }),
            icon: FolderOpen,
            color: 'text-[#566E3D]',
            action: 'info'
          });
        });

        // 3. Transferências aprovadas para a regional (últimos 30 dias)
        if (regionalDoUsuario && transferencias) {
          const transferenciasRecentes = transferencias
            .filter(t => 
              t.regional_destino_id === regionalDoUsuario.id && 
              t.status === 'aprovada' &&
              new Date(t.aprovado_em) >= dataLimite
            )
            .sort((a, b) => new Date(b.aprovado_em) - new Date(a.aprovado_em))
            .slice(0, 2);

          transferenciasRecentes.forEach(trans => {
            recentActivitiesFormatted.push({
              description: `${trans.laboratorista_name} transferido para sua regional`,
              obra: `De ${trans.regional_atual_nome}`,
              time: formatDistanceToNow(new Date(trans.aprovado_em), { addSuffix: true, locale: ptBR }),
              icon: UserPlus,
              color: 'text-[#00233B]',
              action: 'info'
            });
          });
        }

        setRecentActivity(recentActivitiesFormatted.slice(0, 5));
      } else {
        // Atividade recente padrão para outros perfis
        const allActivities = [
          ...obrasFiltradas.slice(0, 10).map(o => ({...o, entityType: 'Obra'})),
          ...projectsFiltrados.slice(0, 10).map(p => ({...p, entityType: 'Project'})),
          ...allEnsaios.slice(0, 20)
        ];

        const sortedActivities = allActivities.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        const recentActivitiesFormatted = sortedActivities.slice(0, 5).map(activity => {
          const obra = obrasFiltradas.find(o => o.id === activity.obra_id);
          const description = getEntityTypeDescription(activity.entityType);

          let details;
          if (activity.entityType === 'DiarioObra' && activity.laboratorista_name && activity.data) {
            const laboratoristaFirstName = activity.laboratorista_name.split(' ')[0];
            const diarioDate = format(new Date(activity.data), 'dd/MM', { locale: ptBR });
            details = ` por ${laboratoristaFirstName} em ${diarioDate}`;
          } else {
            details = `: ${activity.name || activity.sample_id || activity.id}`;
          }

          return {
            description: `${description}${details}`,
            obra: obra ? `Obra ${obra.name}` : '',
            time: formatDistanceToNow(new Date(activity.created_date), { addSuffix: true, locale: ptBR }),
          };
        });
        setRecentActivity(recentActivitiesFormatted);
      }

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const isCliente = userAccessLevel === 'cliente';
  const isEngenheiro = isCliente && user?.position?.toLowerCase().includes('engenheiro');

  const approvalPercentage = useMemo(() => {
    if (isCliente) {
      return stats.assinados > 0 || stats.aguardando_assinatura > 0 ? 
        ((stats.assinados / (stats.assinados + stats.aguardando_assinatura)) * 100).toFixed(0) : 
        100;
    }
    return ((stats.approved / stats.ensaios) * 100 || 0).toFixed(0);
  }, [stats, isCliente]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/50" />
          <p className="text-[#00233B]/80 mt-2">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#00233B] mb-2">Dashboard</h1>
          <p className="text-[#00233B]/80">
            Bem-vindo(a), {user?.full_name}. {isCliente ? 'Acompanhe os registros das suas obras.' : 'Aqui está o resumo das suas atividades.'}
          </p>
        </div>

        {/* Stats Cards - Customizado para Cliente */}
        {isCliente ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Obras" value={stats.obras} icon={Building2} />
            <StatCard title="Projetos" value={stats.projects} icon={FolderOpen} />
            <StatCard 
              title="Registros Assinados" 
              value={stats.assinados} 
              icon={CheckCircle}
              note={isEngenheiro ? `${approvalPercentage}% assinados` : undefined}
            />
            {isEngenheiro && (
              <StatCard 
                title="Aguardando Assinatura" 
                value={stats.aguardando_assinatura} 
                icon={FileSignature}
                note="Clique para visualizar"
                onClick={() => window.location.href = createPageUrl('MeusEnsaios')}
                className="cursor-pointer hover:shadow-md transition-shadow"
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <StatCard title="Obras Ativas" value={stats.obras} icon={Building2} />
            <StatCard title="Projetos" value={stats.projects} icon={FolderOpen} />
            <StatCard title="Total de Registros" value={stats.ensaios} icon={FlaskConical} />
            <StatCard title="Aprovados" value={stats.approved} icon={CheckCircle} note={`${approvalPercentage}% de aprovação`} />
            <StatCard title="Pendentes" value={stats.pending} icon={Clock} />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#00233B]">
                {isCliente ? 'Registros nos Últimos 6 Meses' : 'Registros nos Últimos 6 Meses'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 35, 59, 0.1)" />
                  <XAxis dataKey="name" stroke="#00233B" />
                  <YAxis stroke="#00233B" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(242, 241, 239, 0.8)', border: '1px solid rgba(0, 35, 59, 0.2)', borderRadius: '8px', color: '#00233B' }} />
                  <Legend wrapperStyle={{ color: '#00233B' }}/>
                  <Bar dataKey="ensaios" fill="#00233B" name="Total de Registros" />
                  {isCliente ? (
                    <Bar dataKey="assinados" fill="#BFCF99" name="Assinados" />
                  ) : (
                    <Bar dataKey="aprovados" fill="#BFCF99" name="Aprovados" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#00233B]">
                {isCliente ? 'Status das Assinaturas' : 'Status dos Registros'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(242, 241, 239, 0.8)', border: '1px solid rgba(0, 35, 59, 0.2)', borderRadius: '8px', color: '#00233B' }}/>
                  <Legend wrapperStyle={{ color: '#00233B' }}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#00233B] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#BFCF99]" />
                {isCliente ? 'Notificações Recentes' : 'Atividade Recente'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity, index) => {
                  const ActivityIcon = activity.icon || null;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-black/5">
                      {ActivityIcon ? (
                        <ActivityIcon className={`w-5 h-5 mt-1 ${activity.color || 'text-[#00233B]'}`} />
                      ) : (
                        <div className="w-2 h-2 bg-[#00233B] rounded-full mt-2"></div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#00233B]">
                          {activity.description}
                        </p>
                        <p className="text-xs text-[#00233B]/70">{activity.obra} {activity.obra && '•'} {activity.time}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-[#00233B]/70 py-8">
                    {isCliente ? 'Nenhuma notificação recente.' : 'Nenhuma atividade recente.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#00233B]">
                {isCliente ? 'Ações Pendentes' : 'Alertas e Lembretes'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isCliente ? (
                  <>
                    {isEngenheiro && alerts.aguardando_assinatura > 0 ? (
                      <Link to={createPageUrl('MeusEnsaios')}>
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-[#FBBF24]/10 border-[#FBBF24]/30 cursor-pointer hover:bg-[#FBBF24]/20 transition-colors">
                          <FileSignature className="w-5 h-5 text-[#854d0e] mt-0.5" />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#854d0e' }}>
                              {alerts.aguardando_assinatura} registro(s) aguardando sua assinatura
                            </p>
                            <p className="text-xs" style={{ color: '#854d0e', opacity: 0.8 }}>Clique para visualizar e assinar.</p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-green-400/30 bg-green-400/20">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {isEngenheiro ? 'Todos os registros foram assinados' : 'Nenhuma ação pendente'}
                          </p>
                          <p className="text-xs text-green-700">
                            {isEngenheiro ? 'Não há registros aguardando assinatura.' : 'Continue acompanhando os registros das obras.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {alerts.pending > 0 ? (
                      <div className="flex items-start gap-3 p-3 rounded-lg border bg-[#FBBF24]/10 border-[#FBBF24]/30">
                        <AlertTriangle className="w-5 h-5 text-[#854d0e] mt-0.5" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#854d0e' }}>
                            {alerts.pending} registro(s) aguardando aprovação
                          </p>
                          <p className="text-xs" style={{ color: '#854d0e', opacity: 0.8 }}>Acesse "Ensaios Realizados" para analisar.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-green-400/30 bg-green-400/20">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Nenhum registro pendente
                          </p>
                          <p className="text-xs text-green-700">Todos os registros foram analisados.</p>
                        </div>
                      </div>
                    )}
                    {alerts.rejected > 0 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-[#800020]/30 bg-[#800020]/10">
                        <XCircle className="w-5 h-5 text-[#800020] mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-[#800020]">
                            {alerts.rejected} registro(s) reprovados
                          </p>
                          <p className="text-xs text-[#800020] opacity: 0.80">Verifique os motivos e solicite a correção.</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}