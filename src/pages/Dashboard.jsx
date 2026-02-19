import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FolderOpen, FlaskConical, CheckCircle, AlertTriangle, Clock, XCircle, Calendar, Loader2, FileSignature, UserPlus, Filter, X
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
  const [allData, setAllData] = useState({
    obras: [],
    projects: [],
    ensaios: [],
    regionais: []
  });
  
  // Filtros ativos
  const [filters, setFilters] = useState({
    obraId: null,
    status: null,
    tipoRegistro: null,
    periodo: '6meses'
  });
  
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
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [statusChartData, setStatusChartData] = useState([]);
  const [recordsByObraChartData, setRecordsByObraChartData] = useState([]);
  const [recordsByTypeChartData, setRecordsByTypeChartData] = useState([]);

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
          loadPromises.push(base44.entities.SolicitacaoTransferenciaRegional.list('-created_date'));
        }
      } else {
        loadPromises.push(Promise.resolve([]));
        loadPromises.push(Promise.resolve([]));
      }

      const [obras, projects, ensaiosCAUQ, ensaiosDensidade, diariosObra, checklistsUsina, checklistsAplicacao, checklistsMRAF, checklistsConcretagem, checklistsTerraplanagem, regionais, transferencias] = await Promise.all(loadPromises);

      let obrasFiltradas = obras;
      let projectsFiltrados = projects;
      let allEnsaios = [
        ...ensaiosCAUQ.map(e => ({...e, entityType: 'EnsaioCAUQ'})),
        ...ensaiosDensidade.map(e => ({...e, entityType: 'EnsaioDensidade'})),
        ...diariosObra.map(e => ({...e, entityType: 'DiarioObra'})),
        ...checklistsUsina.map(e => ({...e, entityType: 'ChecklistUsina'})),
        ...checklistsAplicacao.map(e => ({...e, entityType: 'ChecklistAplicacao'})),
        ...checklistsMRAF.map(e => ({...e, entityType: 'ChecklistMRAF'})),
        ...checklistsConcretagem.map(e => ({...e, entityType: 'ChecklistConcretagem'})),
        ...checklistsTerraplanagem.map(e => ({...e, entityType: 'ChecklistTerraplanagem'})),
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

      // Process records by obra chart data (ONLY FOR DEV/ADMIN)
      if (userAccessLevel === 'admin') {
        const recordsByObra = {};
        allEnsaios.forEach(ensaio => {
          if (!recordsByObra[ensaio.obra_id]) {
            recordsByObra[ensaio.obra_id] = 0;
          }
          recordsByObra[ensaio.obra_id]++;
        });

        const recordsByObraData = Object.entries(recordsByObra).map(([obraId, count]) => {
          const obra = obrasFiltradas.find(o => o.id === obraId);
          return {
            name: obra?.name || 'Obra Desconhecida',
            value: count,
          };
        }).sort((a, b) => b.value - a.value);

        setRecordsByObraChartData(recordsByObraData);
      }

      // Process records by type chart data
      const recordsByType = {};
      const typeColors = {
        'EnsaioCAUQ': '#00233B',
        'EnsaioDensidade': '#566E3D',
        'DiarioObra': '#BFCF99',
        'ChecklistUsina': '#FBBF24',
        'ChecklistAplicacao': '#800020',
        'ChecklistMRAF': '#854d0e',
        'ChecklistConcretagem': '#4B5563',
        'ChecklistTerraplanagem': '#6B8E23',
        'EnsaioSondagem': '#4682B4',
      };

      allEnsaios.forEach(ensaio => {
        if (!recordsByType[ensaio.entityType]) {
          recordsByType[ensaio.entityType] = 0;
        }
        recordsByType[ensaio.entityType]++;
      });

      const recordsByTypeData = Object.entries(recordsByType).map(([type, count]) => ({
        name: type === 'EnsaioCAUQ' ? 'Ensaio CAUQ' : 
              type === 'EnsaioDensidade' ? 'Ensaio Densidade' :
              type === 'DiarioObra' ? 'Diário de Obra' :
              type === 'ChecklistUsina' ? 'Checklist Usina' :
              type === 'ChecklistAplicacao' ? 'Checklist Aplicação' :
              type === 'ChecklistMRAF' ? 'Checklist MRAF' :
              type === 'ChecklistConcretagem' ? 'Checklist Concretagem' :
              type === 'ChecklistTerraplanagem' ? 'Checklist Terraplanagem' :
              type === 'EnsaioSondagem' ? 'Ensaio Sondagem' :
              type,
        value: count,
        color: typeColors[type] || '#999999',
      })).sort((a, b) => b.value - a.value);

      setRecordsByTypeChartData(recordsByTypeData);

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

        {/* Additional Charts for Admins */}
        {userAccessLevel === 'admin' && recordsByObraChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#00233B]">
                  Registros por Obra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={recordsByObraChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {recordsByObraChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#00233B', '#566E3D', '#BFCF99', '#FBBF24', '#800020'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(242, 241, 239, 0.8)', border: '1px solid rgba(0, 35, 59, 0.2)', borderRadius: '8px', color: '#00233B' }}/>
                    <Legend wrapperStyle={{ color: '#00233B' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#00233B]">
                  Tipos de Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={recordsByTypeChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {recordsByTypeChartData.map((entry, index) => (
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
        )}

        {/* Tipos de Registros for gestores, salas técnicas and clientes */}
        {(userAccessLevel === 'gestor_contrato' || userAccessLevel === 'sala_tecnica_afirmaevias' || userAccessLevel === 'cliente') && recordsByTypeChartData.length > 0 && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#00233B]">
                  Tipos de Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={recordsByTypeChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {recordsByTypeChartData.map((entry, index) => (
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
        )}


      </div>
    </div>
  );
}