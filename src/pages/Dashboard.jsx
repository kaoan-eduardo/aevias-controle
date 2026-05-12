import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2, 
  FolderOpen, 
  FlaskConical, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Calendar, 
  Loader2, 
  FileSignature, 
  UserPlus, 
  Filter, 
  X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, formatDistanceToNow, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

      // Dashboard exibe dados dos últimos 6 meses — 200 registros por entidade é suficiente
      const loadPromises = [
        base44.entities.Obra.list("-created_date", 200),
        base44.entities.Project.list("-created_date", 200),
        base44.entities.EnsaioCAUQ.list("-created_date", 200),
        base44.entities.EnsaioDensidade.list("-created_date", 200),
        base44.entities.DiarioObra.list("-created_date", 200),
        base44.entities.ChecklistUsina.list("-created_date", 200),
        base44.entities.ChecklistAplicacao.list("-created_date", 200),
        base44.entities.ChecklistMRAF.list("-created_date", 200),
        base44.entities.ChecklistConcretagem.list("-created_date", 200),
        base44.entities.ChecklistTerraplanagem.list("-created_date", 200),
        base44.entities.ChecklistReciclagem.list("-created_date", 200),
        base44.entities.EnsaioMRAF.list("-created_date", 200),
        base44.entities.EnsaioDensidadeInSitu.list("-created_date", 200),
        base44.entities.EnsaioTaxaPinturaImprimacao.list("-created_date", 200),
        base44.entities.EnsaioSondagem.list("-created_date", 200),
        base44.entities.EnsaioGranulometriaIndividual.list("-created_date", 200),
        base44.entities.AcompanhamentoUsinagem.list("-created_date", 200),
        base44.entities.AcompanhamentoCarga.list("-created_date", 200),
        base44.entities.EnsaioManchaPendulo.list("-created_date", 200),
        base44.entities.EnsaioVigaBenkelman.list("-created_date", 200),
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

      const [obras, projects, ensaiosCAUQ, ensaiosDensidade, diariosObra, checklistsUsina, checklistsAplicacao, checklistsMRAF, checklistsConcretagem, checklistsTerraplanagem, checklistsReciclagem, ensaiosMRAF, densidadeInSitu, taxaPintura, sondagem, granulometriaIndividual, acompanhamentoUsinagem, acompanhamentoCarga, manchaPendulo, vigaBenkelman, regionais, transferencias] = await Promise.all(loadPromises);

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
        ...checklistsReciclagem.map(e => ({...e, entityType: 'ChecklistReciclagem'})),
        ...ensaiosMRAF.map(e => ({...e, entityType: 'EnsaioMRAF'})),
        ...densidadeInSitu.map(e => ({...e, entityType: 'EnsaioDensidadeInSitu'})),
        ...taxaPintura.map(e => ({...e, entityType: 'EnsaioTaxaPinturaImprimacao'})),
        ...sondagem.map(e => ({...e, entityType: 'EnsaioSondagem'})),
        ...granulometriaIndividual.map(e => ({...e, entityType: 'EnsaioGranulometriaIndividual'})),
        ...acompanhamentoUsinagem.map(e => ({...e, entityType: 'AcompanhamentoUsinagem'})),
        ...acompanhamentoCarga.map(e => ({...e, entityType: 'AcompanhamentoCarga'})),
        ...manchaPendulo.map(e => ({...e, entityType: 'EnsaioManchaPendulo'})),
        ...vigaBenkelman.map(e => ({...e, entityType: 'EnsaioVigaBenkelman'})),
      ];

      let regionalDoUsuario = null;

      // Filtrar para laboratoristas - mostrar apenas seus próprios registros
      if (userAccessLevel === 'user') {
        allEnsaios = allEnsaios.filter(e => e.created_by === userData.email);
      }

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
            const gestores = regional.gestores_contrato_responsaveis || [];
            return regional.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase() ||
                   gestores.some(email => email.toLowerCase() === userData.email.toLowerCase());
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

      // Salvar dados originais para filtros
      setAllData({
        obras: obrasFiltradas,
        projects: projectsFiltrados,
        ensaios: allEnsaios,
        regionais: regionais
      });

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
      console.error("[Dashboard] Erro ao carregar dados:", error?.message || error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aplicar filtros e recalcular dados
  const filteredData = useMemo(() => {
    if (!allData.ensaios.length) return { ensaios: [], obras: allData.obras };

    let filtered = [...allData.ensaios];

    // Filtro por obra
    if (filters.obraId) {
      filtered = filtered.filter(e => e.obra_id === filters.obraId);
    }

    // Filtro por status
    if (filters.status) {
      if (filters.status === 'approved') {
        filtered = filtered.filter(e => e.approved === true);
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(e => e.approved === null);
      } else if (filters.status === 'rejected') {
        filtered = filtered.filter(e => e.approved === false);
      }
    }

    // Filtro por tipo de registro
    if (filters.tipoRegistro) {
      filtered = filtered.filter(e => e.entityType === filters.tipoRegistro);
    }

    // Filtro por período
    const now = new Date();
    let startDate;
    if (filters.periodo === '1mes') {
      startDate = subMonths(now, 1);
    } else if (filters.periodo === '3meses') {
      startDate = subMonths(now, 3);
    } else {
      startDate = subMonths(now, 6);
    }
    filtered = filtered.filter(e => new Date(e.created_date) >= startDate);

    return { ensaios: filtered, obras: allData.obras };
  }, [allData, filters]);

  const calculateCharts = useCallback((ensaios, userAccessLevel, isCliente) => {
    const now = new Date();
    const monthsToShow = filters.periodo === '1mes' ? 1 : filters.periodo === '3meses' ? 3 : 6;
    const months = Array.from({ length: monthsToShow }, (_, i) => subMonths(now, monthsToShow - 1 - i));
    
    const monthlyData = months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthEnsaios = ensaios.filter(e => 
        isWithinInterval(new Date(e.created_date), { start, end })
      );
      
      return {
        name: format(month, 'MMM', { locale: ptBR }),
        ensaios: monthEnsaios.length,
        aprovados: isCliente ? 
          monthEnsaios.filter(e => e.client_signature?.signed_by).length :
          monthEnsaios.filter(e => e.approved === true).length,
        assinados: isCliente ? monthEnsaios.filter(e => e.client_signature?.signed_by).length : 0
      };
    });
    setMonthlyChartData(monthlyData);

    // Status Chart
    if (isCliente) {
      const assinados = ensaios.filter(e => e.client_signature?.signed_by).length;
      const aguardando = ensaios.filter(e => e.approved === true && !e.client_signature?.signed_by).length;
      setStatusChartData([
        { name: 'Assinados', value: assinados, color: '#566E3D' },
        { name: 'Aguardando', value: aguardando, color: '#FBBF24' }
      ].filter(item => item.value > 0));
    } else {
      const approved = ensaios.filter(e => e.approved === true).length;
      const pending = ensaios.filter(e => e.approved === null).length;
      const rejected = ensaios.filter(e => e.approved === false).length;
      setStatusChartData([
        { name: 'Aprovados', value: approved, color: '#566E3D' },
        { name: 'Pendentes', value: pending, color: '#FBBF24' },
        { name: 'Reprovados', value: rejected, color: '#800020' }
      ].filter(item => item.value > 0));
    }

    // Records by Obra (admin and cliente)
    if (userAccessLevel === 'admin' || userAccessLevel === 'cliente') {
      const obraRecordCount = {};
      ensaios.forEach(ensaio => {
        const obraId = ensaio.obra_id;
        if (obraId) {
          obraRecordCount[obraId] = (obraRecordCount[obraId] || 0) + 1;
        }
      });

      const obraChartData = Object.entries(obraRecordCount)
        .map(([obraId, count]) => {
          const obra = allData.obras.find(o => o.id === obraId);
          return {
            name: obra?.name || 'Desconhecida',
            value: count,
            obraId: obraId
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setRecordsByObraChartData(obraChartData);
    }

    // Records by Type
    const typeColors = {
      'EnsaioCAUQ': '#00233B',
      'EnsaioDensidade': '#566E3D',
      'DiarioObra': '#BFCF99',
      'ChecklistUsina': '#FBBF24',
      'ChecklistAplicacao': '#800020',
      'ChecklistMRAF': '#4A90E2',
      'ChecklistConcretagem': '#8B4513',
      'ChecklistTerraplanagem': '#228B22',
    };

    const typeRecordCount = {};
    ensaios.forEach(ensaio => {
      const type = ensaio.entityType;
      if (type) {
        typeRecordCount[type] = (typeRecordCount[type] || 0) + 1;
      }
    });

    const typeLabels = {
      'EnsaioCAUQ': 'Ensaio CAUQ',
      'EnsaioDensidade': 'Densidade',
      'DiarioObra': 'Diário',
      'ChecklistUsina': 'Checklist Usina',
      'ChecklistAplicacao': 'Checklist Aplicação',
      'ChecklistMRAF': 'Checklist MRAF',
      'ChecklistConcretagem': 'Checklist Concretagem',
      'ChecklistTerraplanagem': 'Checklist Terraplanagem',
    };

    const typeChartData = Object.entries(typeRecordCount)
      .map(([type, count]) => ({
        name: typeLabels[type] || type,
        value: count,
        color: typeColors[type] || '#00233B',
        entityType: type
      }))
      .sort((a, b) => b.value - a.value);

    setRecordsByTypeChartData(typeChartData);
  }, [filters.periodo, allData.obras]);

  // Recalcular stats e gráficos baseado nos dados filtrados
  useEffect(() => {
    if (!filteredData.ensaios.length && allData.ensaios.length) return;

    const currentAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
    const currentIsCliente = currentAccessLevel === 'cliente';
    const currentIsEngenheiro = currentIsCliente && user?.position?.toLowerCase().includes('engenheiro');

    let approvedCount, pendingCount, rejectedCount, assinadosCount, aguardandoAssinaturaCount;

    if (currentIsCliente) {
      assinadosCount = filteredData.ensaios.filter(e => e.client_signature?.signed_by).length;
      aguardandoAssinaturaCount = currentIsEngenheiro
        ? filteredData.ensaios.filter(e => e.approved === true && !e.client_signature?.signed_by).length
        : 0;
      approvedCount = filteredData.ensaios.filter(e => e.approved === true).length;
      pendingCount = 0;
      rejectedCount = 0;
    } else {
      approvedCount = filteredData.ensaios.filter(e => e.approved === true).length;
      pendingCount = filteredData.ensaios.filter(e => e.approved === null).length;
      rejectedCount = filteredData.ensaios.filter(e => e.approved === false).length;
      assinadosCount = 0;
      aguardandoAssinaturaCount = 0;
    }

    setStats({
      obras: filteredData.obras.length,
      projects: allData.projects.length,
      ensaios: filteredData.ensaios.length,
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
      assinados: assinadosCount,
      aguardando_assinatura: aguardandoAssinaturaCount,
    });

    calculateCharts(filteredData.ensaios, currentAccessLevel, currentIsCliente);
  }, [filteredData, allData.projects.length, user, calculateCharts]);

  const handlePieClick = useCallback((data, chartType) => {
    if (chartType === 'status') {
      const statusMap = {
        'Aprovados': 'approved',
        'Pendentes': 'pending',
        'Reprovados': 'rejected',
        'Assinados': 'approved',
        'Aguardando': 'pending'
      };
      setFilters(prev => ({
        ...prev,
        status: prev.status === statusMap[data.name] ? null : statusMap[data.name]
      }));
    } else if (chartType === 'obra') {
      setFilters(prev => ({
        ...prev,
        obraId: prev.obraId === data.obraId ? null : data.obraId
      }));
    } else if (chartType === 'type') {
      setFilters(prev => ({
        ...prev,
        tipoRegistro: prev.tipoRegistro === data.entityType ? null : data.entityType
      }));
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      obraId: null,
      status: null,
      tipoRegistro: null,
      periodo: '6meses'
    });
  }, []);

  const hasActiveFilters = filters.obraId || filters.status || filters.tipoRegistro;

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

        {/* Filtros - ocultar para laboratoristas */}
        {userAccessLevel !== 'user' && (
          <Card className="mb-6 bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#BFCF99]" />
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-[#00233B] hover:bg-black/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm font-medium text-[#00233B]/80 mb-2 block">Obra</span>
                  <Select value={filters.obraId || 'todas'} onValueChange={(value) => setFilters(prev => ({ ...prev, obraId: value === 'todas' ? null : value }))}>
                    <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-lg border-white/30">
                      <SelectItem value="todas">Todas as Obras</SelectItem>
                      {allData.obras.map(obra => (
                        <SelectItem key={obra.id} value={obra.id}>{obra.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-sm font-medium text-[#00233B]/80 mb-2 block">Status</span>
                  <Select value={filters.status || 'todos'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'todos' ? null : value }))}>
                    <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-lg border-white/30">
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="rejected">Reprovados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-sm font-medium text-[#00233B]/80 mb-2 block">Tipo de Registro</span>
                  <Select value={filters.tipoRegistro || 'todos'} onValueChange={(value) => setFilters(prev => ({ ...prev, tipoRegistro: value === 'todos' ? null : value }))}>
                    <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-lg border-white/30">
                      <SelectItem value="todos">Todos os Tipos</SelectItem>
                      <SelectItem value="DiarioObra">Diário de Obra</SelectItem>
                      <SelectItem value="EnsaioCAUQ">Ensaio CAUQ</SelectItem>
                      <SelectItem value="EnsaioDensidade">Densidade</SelectItem>
                      <SelectItem value="ChecklistUsina">Checklist Usina</SelectItem>
                      <SelectItem value="ChecklistAplicacao">Checklist Aplicação</SelectItem>
                      <SelectItem value="ChecklistMRAF">Checklist MRAF</SelectItem>
                      <SelectItem value="ChecklistConcretagem">Checklist Concretagem</SelectItem>
                      <SelectItem value="ChecklistTerraplanagem">Checklist Terraplanagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-sm font-medium text-[#00233B]/80 mb-2 block">Período</span>
                  <Select value={filters.periodo} onValueChange={(value) => setFilters(prev => ({ ...prev, periodo: value }))}>
                    <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-lg border-white/30">
                      <SelectItem value="1mes">Último Mês</SelectItem>
                      <SelectItem value="3meses">Últimos 3 Meses</SelectItem>
                      <SelectItem value="6meses">Últimos 6 Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {filters.obraId && (
                    <Badge variant="secondary" className="bg-[#BFCF99]/30 text-[#00233B]">
                      Obra: {allData.obras.find(o => o.id === filters.obraId)?.name}
                      <X 
                        className="w-3 h-3 ml-2 cursor-pointer" 
                        onClick={() => setFilters(prev => ({ ...prev, obraId: null }))}
                      />
                    </Badge>
                  )}
                  {filters.status && (
                    <Badge variant="secondary" className="bg-[#BFCF99]/30 text-[#00233B]">
                      Status: {filters.status === 'approved' ? 'Aprovados' : filters.status === 'pending' ? 'Pendentes' : 'Reprovados'}
                      <X 
                        className="w-3 h-3 ml-2 cursor-pointer" 
                        onClick={() => setFilters(prev => ({ ...prev, status: null }))}
                      />
                    </Badge>
                  )}
                  {filters.tipoRegistro && (
                    <Badge variant="secondary" className="bg-[#BFCF99]/30 text-[#00233B]">
                      Tipo: {filters.tipoRegistro.replace('Checklist', 'Checklist ')}
                      <X 
                        className="w-3 h-3 ml-2 cursor-pointer" 
                        onClick={() => setFilters(prev => ({ ...prev, tipoRegistro: null }))}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                onClick={() => navigate(createPageUrl('MeusEnsaios'))}
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
                <span className="text-xs font-normal text-[#00233B]/60 ml-2">(clique para filtrar)</span>
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
                    onClick={(data) => handlePieClick(data, 'status')}
                    style={{ cursor: 'pointer' }}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        opacity={filters.status && entry.name !== (filters.status === 'approved' ? 'Aprovados' : filters.status === 'pending' ? 'Pendentes' : 'Reprovados') ? 0.3 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(242, 241, 239, 0.8)', border: '1px solid rgba(0, 35, 59, 0.2)', borderRadius: '8px', color: '#00233B' }}/>
                  <Legend wrapperStyle={{ color: '#00233B' }}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts for Admins and Clientes */}
        {(userAccessLevel === 'admin' || userAccessLevel === 'cliente') && recordsByObraChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#00233B]">
                  Registros por Obra
                  <span className="text-xs font-normal text-[#00233B]/60 ml-2">(clique para filtrar)</span>
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
                      onClick={(data) => handlePieClick(data, 'obra')}
                      style={{ cursor: 'pointer' }}
                    >
                      {recordsByObraChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#00233B', '#566E3D', '#BFCF99', '#FBBF24', '#800020'][index % 5]}
                          opacity={filters.obraId && entry.obraId !== filters.obraId ? 0.3 : 1}
                        />
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
                  <span className="text-xs font-normal text-[#00233B]/60 ml-2">(clique para filtrar)</span>
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
                      onClick={(data) => handlePieClick(data, 'type')}
                      style={{ cursor: 'pointer' }}
                    >
                      {recordsByTypeChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          opacity={filters.tipoRegistro && entry.entityType !== filters.tipoRegistro ? 0.3 : 1}
                        />
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
                  <span className="text-xs font-normal text-[#00233B]/60 ml-2">(clique para filtrar)</span>
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
                      onClick={(data) => handlePieClick(data, 'type')}
                      style={{ cursor: 'pointer' }}
                    >
                      {recordsByTypeChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          opacity={filters.tipoRegistro && entry.entityType !== filters.tipoRegistro ? 0.3 : 1}
                        />
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