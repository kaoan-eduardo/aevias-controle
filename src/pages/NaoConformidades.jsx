import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, FileText, ClipboardList, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const TIPOS_CHECKLIST = [
  { value: "ChecklistUsina", label: "Checklist de Usina" },
  { value: "ChecklistAplicacao", label: "Checklist de Aplicação" },
  { value: "ChecklistMRAF", label: "Checklist MRAF" },
  { value: "ChecklistConcretagem", label: "Checklist de Concretagem" },
  { value: "ChecklistTerraplanagem", label: "Checklist de Terraplanagem" }
];

const STATUS_COLORS = { aberta: "#dc2626", em_tratativa: "#d97706", encerrada: "#16a34a", cancelada: "#6b7280" };
const STATUS_LABELS = { aberta: "Aberta", em_tratativa: "Em Tratativa", encerrada: "Finalizada", cancelada: "Cancelada" };
const PARAM_COLORS = ["#dc2626","#d97706","#2563eb","#7c3aed","#0891b2","#be185d","#065f46","#92400e","#1e3a5f","#6b21a8"];
const OBRA_COLORS = ["#00233B","#566E3D","#BFCF99","#d97706","#0891b2","#7c3aed","#dc2626","#be185d","#065f46","#92400e"];

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const extrairNaoConformidadesChecklist = (checklist, tipo) => {
  const ncs = [];
  if (tipo === 'ChecklistUsina' && checklist.controle_cauq) {
    ['extracao_ligante_rotarex','extracao_ligante_soxhlet','granulometria','volume_vazios','rbv','rtcd_25c','estabilidade','fluencia'].forEach(key => {
      const e = checklist.controle_cauq[key];
      if (e?.realizado && e.conforme === false) ncs.push(key.replace(/_/g,' '));
    });
    if (checklist.equivalente_areia_status === 'realizado') {
      const limite = checklist.projeto_equivalente_areia_minimo || 55;
      (checklist.equivalente_areia_resultados || []).forEach(r => { if (r < limite) ncs.push('Equivalente de Areia'); });
    }
  }
  if (tipo === 'ChecklistAplicacao') {
    if (checklist.pintura_ligacao?.taxa_pintura?.realizado && checklist.pintura_ligacao.taxa_pintura.conforme === false) ncs.push('Taxa de Pintura');
    if (checklist.pintura_ligacao?.taxa_pintura_residual?.realizado && checklist.pintura_ligacao.taxa_pintura_residual.conforme === false) ncs.push('Taxa de Pintura Residual');
    if (checklist.controle_aplicacao?.temp_aplicacao_cargas?.realizado && checklist.controle_aplicacao.temp_aplicacao_cargas.conforme === false) ncs.push('Temperatura de Aplicação');
    if (checklist.controle_aplicacao?.espessura_camada?.realizado && checklist.controle_aplicacao.espessura_camada.conforme === false) ncs.push('Espessura da Camada');
  }
  if (tipo === 'ChecklistConcretagem') {
    (checklist.cargas_concreto || []).forEach(carga => {
      if (carga.slump_test?.realizado && carga.slump_test.conforme === false) ncs.push('Slump Test');
      if (carga.espessura_camada?.realizado && carga.espessura_camada.conforme === false) ncs.push('Espessura (Concretagem)');
    });
  }
  if (tipo === 'ChecklistTerraplanagem' && checklist.ensaios_empreiteira) {
    ['compactacao_proctor','isc','umidade_frigideira','massa_especifica_in_situ','granulometria'].forEach(key => {
      const d = checklist.ensaios_empreiteira[key];
      if (d?.realizado && d.conforme === false) ncs.push(key.replace(/_/g,' '));
    });
  }
  if (tipo === 'ChecklistMRAF' && checklist.acompanhamento_aplicacao) {
    ['taxa_aplicacao','residuo_emulsao','espessura_camada'].forEach(key => {
      const d = checklist.acompanhamento_aplicacao[key];
      if (d?.realizado && d.conforme === false) ncs.push(key.replace(/_/g,' ') + ' (MRAF)');
    });
  }
  return ncs;
};

export default function NaoConformidadesPage() {
  const [loading, setLoading] = useState(true);
  const [obras, setObras] = useState([]);
  const [rncs, setRncs] = useState([]);
  // checklistNCs: lista completa de { obra_id, parametro } para cross-filtering
  const [checklistNCs, setChecklistNCs] = useState([]);

  // Filtros simultâneos e independentes
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroParametro, setFiltroParametro] = useState(null);
  const [filtroObraId, setFiltroObraId] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      const userAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

      const [obrasData, regionaisData, rncsData] = await Promise.all([
        Obra.list(),
        Regional.list(),
        base44.entities.RelatorioNC.list("-created_date", 500)
      ]);

      let availableObras = obrasData;
      if (userAccessLevel === 'cliente') {
        const regionaisDoCliente = regionaisData.filter(r => (r.clientes_responsaveis || []).some(e => e.toLowerCase() === userData.email.toLowerCase()));
        const ids = new Set(regionaisDoCliente.flatMap(r => obrasData.filter(o => o.regional_id === r.id).map(o => o.id)));
        availableObras = obrasData.filter(o => ids.has(o.id));
      } else if (userAccessLevel === 'sala_tecnica_afirmaevias') {
        const regionaisDaSala = regionaisData.filter(r => (r.salas_tecnicas_responsaveis || []).some(e => e.toLowerCase() === userData.email.toLowerCase()));
        const ids = new Set(regionaisDaSala.flatMap(r => obrasData.filter(o => o.regional_id === r.id).map(o => o.id)));
        availableObras = obrasData.filter(o => ids.has(o.id));
      } else if (userAccessLevel === 'gestor_contrato') {
        const regionaisDoGestor = regionaisData.filter(r =>
          r.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(e => e.toLowerCase() === userData.email.toLowerCase())
        );
        const ids = new Set(regionaisDoGestor.flatMap(r => obrasData.filter(o => o.regional_id === r.id).map(o => o.id)));
        availableObras = obrasData.filter(o => ids.has(o.id));
      }

      setObras(availableObras);

      const availableObraIds = new Set(availableObras.map(o => o.id));
      setRncs(rncsData.filter(r => availableObraIds.has(r.obra_id)));

      const obraIds = availableObras.map(o => o.id);
      const allCNCs = [];

      const allChecklistData = await Promise.all(
        TIPOS_CHECKLIST.map(t =>
          Promise.all(obraIds.map(oId => base44.entities[t.value].filter({ obra_id: oId }).catch(() => [])))
            .then(results => results.flat().map(c => ({ ...c, _tipo: t.value })))
        )
      );

      allChecklistData.flat().forEach(checklist => {
        const ncs = extrairNaoConformidadesChecklist(checklist, checklist._tipo);
        ncs.forEach(param => {
          const label = param.charAt(0).toUpperCase() + param.slice(1);
          allCNCs.push({ obra_id: checklist.obra_id, parametro: label });
        });
      });

      setChecklistNCs(allCNCs);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // CROSS-FILTERING: cada gráfico é filtrado pelos outros 2
  // -------------------------------------------------------

  // Gráfico 1: Status dos RNCs — filtrado por filtroObraId + filtroParametro
  // (filtroParametro filtra por obras que têm esse param → filtra os RNCs por essas obras)
  const dadosStatusRNC = useMemo(() => {
    let filteredRncs = rncs;
    if (filtroObraId) {
      filteredRncs = filteredRncs.filter(r => r.obra_id === filtroObraId);
    }
    if (filtroParametro) {
      const obrasComParam = new Set(checklistNCs.filter(nc => nc.parametro === filtroParametro).map(nc => nc.obra_id));
      filteredRncs = filteredRncs.filter(r => obrasComParam.has(r.obra_id));
    }
    const counts = { aberta: 0, em_tratativa: 0, encerrada: 0, cancelada: 0 };
    filteredRncs.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({ name: STATUS_LABELS[status], statusKey: status, value, color: STATUS_COLORS[status] }));
  }, [rncs, checklistNCs, filtroObraId, filtroParametro]);

  // Gráfico 2: Parâmetros não conformes — filtrado por filtroObraId + filtroStatus
  // (filtroStatus filtra por obras que têm RNCs com esse status → filtra os checklistNCs por essas obras)
  const dadosParametros = useMemo(() => {
    let filteredCNCs = checklistNCs;
    if (filtroObraId) {
      filteredCNCs = filteredCNCs.filter(nc => nc.obra_id === filtroObraId);
    }
    if (filtroStatus) {
      const obrasComStatus = new Set(rncs.filter(r => r.status === filtroStatus).map(r => r.obra_id));
      filteredCNCs = filteredCNCs.filter(nc => obrasComStatus.has(nc.obra_id));
    }
    const paramCount = {};
    filteredCNCs.forEach(nc => { paramCount[nc.parametro] = (paramCount[nc.parametro] || 0) + 1; });
    return Object.entries(paramCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value], i) => ({ name, value, color: PARAM_COLORS[i % PARAM_COLORS.length] }));
  }, [checklistNCs, rncs, filtroObraId, filtroStatus]);

  // Gráfico 3: NCs por Obra — filtrado por filtroStatus + filtroParametro
  const dadosPorObra = useMemo(() => {
    const obraCount = {};
    // Contar RNCs filtrados por status
    let filteredRncs = filtroStatus ? rncs.filter(r => r.status === filtroStatus) : rncs;
    filteredRncs.forEach(r => { obraCount[r.obra_id] = (obraCount[r.obra_id] || 0) + 1; });
    // Contar checklist NCs filtrados por parametro
    let filteredCNCs = filtroParametro ? checklistNCs.filter(nc => nc.parametro === filtroParametro) : checklistNCs;
    filteredCNCs.forEach(nc => { obraCount[nc.obra_id] = (obraCount[nc.obra_id] || 0) + 1; });

    return Object.entries(obraCount)
      .map(([obraId, value], i) => {
        const obra = obras.find(o => o.id === obraId);
        return { name: obra?.name || obraId, obraId, value, color: OBRA_COLORS[i % OBRA_COLORS.length] };
      })
      .sort((a, b) => b.value - a.value);
  }, [rncs, checklistNCs, obras, filtroStatus, filtroParametro]);

  // -------------------------------------------------------
  // Handlers — toggleam sem limpar os outros filtros
  // -------------------------------------------------------
  const handleStatusClick = useCallback((data) => {
    setFiltroStatus(prev => prev === data.statusKey ? null : data.statusKey);
  }, []);

  const handleParametroClick = useCallback((data) => {
    setFiltroParametro(prev => prev === data.name ? null : data.name);
  }, []);

  const handleObraClick = useCallback((data) => {
    setFiltroObraId(prev => prev === data.obraId ? null : data.obraId);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltroStatus(null);
    setFiltroParametro(null);
    setFiltroObraId(null);
  }, []);

  const hasActiveFilter = !!(filtroStatus || filtroParametro || filtroObraId);

  // -------------------------------------------------------
  // Tabela resumo — todos os filtros ativos simultaneamente
  // -------------------------------------------------------
  const tabelaResumo = useMemo(() => {
    return obras.map(obra => {
      // RNCs da obra filtrados por status
      let rncsObra = rncs.filter(r => r.obra_id === obra.id);
      if (filtroStatus) rncsObra = rncsObra.filter(r => r.status === filtroStatus);
      // Checklist NCs da obra filtrados por parametro
      let cncsObra = checklistNCs.filter(nc => nc.obra_id === obra.id);
      if (filtroParametro) cncsObra = cncsObra.filter(nc => nc.parametro === filtroParametro);
      // Filtro de obra
      if (filtroObraId && obra.id !== filtroObraId) return null;

      const totalRnc = rncsObra.length;
      const paramChecklist = cncsObra.length;
      if (totalRnc === 0 && paramChecklist === 0) return null;

      const abertas = rncsObra.filter(r => r.status === 'aberta').length;
      const emTratativa = rncsObra.filter(r => r.status === 'em_tratativa').length;
      const finalizadas = rncsObra.filter(r => r.status === 'encerrada').length;
      const canceladas = rncsObra.filter(r => r.status === 'cancelada').length;
      return { obra, totalRnc, abertas, emTratativa, finalizadas, canceladas, paramChecklist };
    }).filter(Boolean);
  }, [obras, rncs, checklistNCs, filtroStatus, filtroParametro, filtroObraId]);

  // KPIs baseados nos filtros ativos
  const rncsVisiveis = useMemo(() => {
    let f = rncs;
    if (filtroStatus) f = f.filter(r => r.status === filtroStatus);
    if (filtroObraId) f = f.filter(r => r.obra_id === filtroObraId);
    if (filtroParametro) {
      const obrasComParam = new Set(checklistNCs.filter(nc => nc.parametro === filtroParametro).map(nc => nc.obra_id));
      f = f.filter(r => obrasComParam.has(r.obra_id));
    }
    return f;
  }, [rncs, checklistNCs, filtroStatus, filtroObraId, filtroParametro]);

  const checklistNCsVisiveis = useMemo(() => {
    let f = checklistNCs;
    if (filtroParametro) f = f.filter(nc => nc.parametro === filtroParametro);
    if (filtroObraId) f = f.filter(nc => nc.obra_id === filtroObraId);
    if (filtroStatus) {
      const obrasComStatus = new Set(rncs.filter(r => r.status === filtroStatus).map(r => r.obra_id));
      f = f.filter(nc => obrasComStatus.has(nc.obra_id));
    }
    return f;
  }, [checklistNCs, rncs, filtroParametro, filtroObraId, filtroStatus]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const tooltipStyle = { backgroundColor: 'rgba(242,241,239,0.97)', borderRadius: '8px', border: '1px solid rgba(0,35,59,0.15)' };

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-[#00233B]">Dashboard de Não Conformidades</h1>
              <p className="text-[#00233B]/70 text-sm mt-1">Visão geral de todas as obras</p>
            </div>
          </div>
          {hasActiveFilter && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-[#00233B] border-white/30 hover:bg-white/20 gap-2">
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Filtros ativos */}
        {hasActiveFilter && (
          <div className="flex flex-wrap gap-2">
            {filtroStatus && (
              <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroStatus(null)}>
                Status: {STATUS_LABELS[filtroStatus]} <X className="w-3 h-3" />
              </Badge>
            )}
            {filtroParametro && (
              <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroParametro(null)}>
                Parâmetro: {filtroParametro} <X className="w-3 h-3" />
              </Badge>
            )}
            {filtroObraId && (
              <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroObraId(null)}>
                Obra: {obras.find(o => o.id === filtroObraId)?.name} <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de RNCs", value: rncsVisiveis.length, color: "text-[#00233B]" },
            { label: "RNCs Abertas", value: rncsVisiveis.filter(r => r.status === 'aberta').length, color: "text-red-600" },
            { label: "Em Tratativa", value: rncsVisiveis.filter(r => r.status === 'em_tratativa').length, color: "text-amber-600" },
            { label: "NCs em Checklists", value: checklistNCsVisiveis.length, color: "text-blue-600" },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-white/20 backdrop-blur-lg border border-white/20">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-[#00233B]/70 font-medium uppercase tracking-wide">{kpi.label}</p>
                <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráficos de Pizza - linha 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pizza 1: Status dos RNCs */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-[#00233B] text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#BFCF99]" />
                Status dos RNCs
                <span className="text-xs font-normal text-[#00233B]/50 ml-1">(clique para filtrar)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosStatusRNC.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={dadosStatusRNC}
                      cx="50%" cy="50%" outerRadius={100}
                      dataKey="value" labelLine={false} label={<CustomLabel />}
                      onClick={handleStatusClick} style={{ cursor: 'pointer' }}
                    >
                      {dadosStatusRNC.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={filtroStatus && filtroStatus !== entry.statusKey ? 0.3 : 1} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={tooltipStyle} />
                    <Legend formatter={(v) => <span style={{ color: '#00233B', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-[#00233B]/50">
                  <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum RNC para os filtros selecionados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pizza 2: Parâmetros não conformes */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-[#00233B] text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#BFCF99]" />
                Parâmetros Não Conformes (checklists)
                <span className="text-xs font-normal text-[#00233B]/50 ml-1">(clique para filtrar)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosParametros.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={dadosParametros}
                      cx="50%" cy="50%" outerRadius={100}
                      dataKey="value" labelLine={false} label={<CustomLabel />}
                      onClick={handleParametroClick} style={{ cursor: 'pointer' }}
                    >
                      {dadosParametros.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={filtroParametro && filtroParametro !== entry.name ? 0.3 : 1} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + ' ocorrência(s)', n]} contentStyle={tooltipStyle} />
                    <Legend formatter={(v) => <span style={{ color: '#00233B', fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-[#00233B]/50">
                  <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma NC de checklist para os filtros selecionados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pizza 3: NCs por Obra */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#BFCF99]" />
              Total de NCs por Obra (RNCs + Checklists)
              <span className="text-xs font-normal text-[#00233B]/50 ml-1">(clique para filtrar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPorObra.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={dadosPorObra}
                    cx="50%" cy="50%" outerRadius={120}
                    dataKey="value" labelLine={false} label={<CustomLabel />}
                    onClick={handleObraClick} style={{ cursor: 'pointer' }}
                  >
                    {dadosPorObra.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={filtroObraId && filtroObraId !== entry.obraId ? 0.3 : 1} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' NC(s)', n]} contentStyle={tooltipStyle} />
                  <Legend formatter={(v) => <span style={{ color: '#00233B', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-[#00233B]/50">
                <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma NC para os filtros selecionados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela Resumo */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#BFCF99]" />
              Tabela Resumo de NCs por Obra
              {hasActiveFilter && <Badge className="bg-[#BFCF99]/40 text-[#00233B] text-xs ml-2">{tabelaResumo.length} obra(s)</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tabelaResumo.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 px-3 text-[#00233B] font-semibold text-xs uppercase tracking-wide">Obra</th>
                      <th className="text-center py-2 px-3 text-[#00233B] font-semibold text-xs uppercase tracking-wide">Total RNC</th>
                      <th className="text-center py-2 px-3 text-red-600 font-semibold text-xs uppercase tracking-wide">Abertas</th>
                      <th className="text-center py-2 px-3 text-amber-600 font-semibold text-xs uppercase tracking-wide">Em Tratativa</th>
                      <th className="text-center py-2 px-3 text-green-600 font-semibold text-xs uppercase tracking-wide">Finalizadas</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wide">Canceladas</th>
                      <th className="text-center py-2 px-3 text-blue-600 font-semibold text-xs uppercase tracking-wide">NCs Checklist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabelaResumo.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-white/10 transition-colors cursor-pointer ${filtroObraId === row.obra.id ? 'bg-[#BFCF99]/20' : 'hover:bg-white/10'}`}
                        onClick={() => handleObraClick({ obraId: row.obra.id })}
                      >
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-[#00233B]">{row.obra.name}</p>
                          <p className="text-xs text-[#00233B]/60">{row.obra.code}</p>
                        </td>
                        <td className="text-center py-2.5 px-3 font-bold text-[#00233B]">{row.totalRnc}</td>
                        <td className="text-center py-2.5 px-3">{row.abertas > 0 ? <Badge className="bg-red-100 text-red-700">{row.abertas}</Badge> : <span className="text-[#00233B]/30">—</span>}</td>
                        <td className="text-center py-2.5 px-3">{row.emTratativa > 0 ? <Badge className="bg-amber-100 text-amber-700">{row.emTratativa}</Badge> : <span className="text-[#00233B]/30">—</span>}</td>
                        <td className="text-center py-2.5 px-3">{row.finalizadas > 0 ? <Badge className="bg-green-100 text-green-700">{row.finalizadas}</Badge> : <span className="text-[#00233B]/30">—</span>}</td>
                        <td className="text-center py-2.5 px-3">{row.canceladas > 0 ? <Badge className="bg-gray-100 text-gray-600">{row.canceladas}</Badge> : <span className="text-[#00233B]/30">—</span>}</td>
                        <td className="text-center py-2.5 px-3">{row.paramChecklist > 0 ? <Badge className="bg-blue-100 text-blue-700">{row.paramChecklist}</Badge> : <span className="text-[#00233B]/30">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#00233B]/50">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{hasActiveFilter ? 'Nenhuma obra corresponde aos filtros selecionados' : 'Nenhuma não conformidade registrada'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}