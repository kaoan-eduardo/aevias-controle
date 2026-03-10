import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, FileText, ClipboardList, X, Filter, HardHat, MapPin, Building2, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { createPageUrl } from "@/utils";

// ---- Constants ----
const TIPOS_CHECKLIST = [
  { value: "ChecklistUsina", label: "Checklist de Usina", page: "RelatorioChecklist" },
  { value: "ChecklistAplicacao", label: "Checklist de Aplicação", page: "RelatorioChecklistAplicacao" },
  { value: "ChecklistMRAF", label: "Checklist MRAF", page: "RelatorioChecklistMRAF" },
  { value: "ChecklistConcretagem", label: "Checklist de Concretagem", page: "RelatorioChecklistConcretagem" },
  { value: "ChecklistTerraplanagem", label: "Checklist de Terraplanagem", page: "RelatorioChecklistTerraplanagem" }
];

// RNC maps to RelatorioNC page
const RNC_PAGE = "RelatorioNC";

// Outros registros: NC = approved === false
const OUTROS_TIPOS_REGISTRO = [
  { value: "AcompanhamentoCarga", label: "Acomp. de Cargas", page: "RelatorioAcompanhamentoCarga" },
  { value: "AcompanhamentoUsinagem", label: "Acomp. Usinagem", page: "RelatorioAcompanhamentoUsinagem" },
  { value: "EnsaioCAUQ", label: "Ensaio CAUQ", page: "RelatorioCAUQ" },
  { value: "EnsaioDensidade", label: "Ensaio de Densidade", page: "RelatorioEnsaio" },
  { value: "EnsaioDensidadeInSitu", label: "Densidade In Situ", page: "RelatorioDensidadeInSitu" },
  { value: "EnsaioGranAreia", label: "Granulometria + EA", page: "RelatorioEnsaio" },
  { value: "EnsaioGranulometriaIndividual", label: "Gran. Individual", page: "RelatorioGranulometriaIndividual" },
  { value: "EnsaioMRAF", label: "Ensaio MRAF", page: "RelatorioMRAF" },
  { value: "EnsaioManchaPendulo", label: "Mancha + Pêndulo", page: "RelatorioManchaPendulo" },
  { value: "EnsaioSondagem", label: "Sondagem", page: "RelatorioSondagem" },
  { value: "EnsaioTaxaMRAF", label: "Taxa MRAF", page: "RelatorioTaxaMRAF" },
  { value: "EnsaioTaxaPinturaImprimacao", label: "Taxa Pintura/Imprim.", page: "RelatorioTaxaPinturaImprimacao" },
  { value: "EnsaioVigaBenkelman", label: "Viga Benkelman", page: "RelatorioVigaBenkelman" },
  { value: "ChecklistReciclagem", label: "Checklist de Reciclagem", page: "RelatorioChecklistReciclagem" },
];

const STATUS_COLORS = { aberta: "#dc2626", em_tratativa: "#d97706", encerrada: "#16a34a", cancelada: "#6b7280" };
const STATUS_LABELS = { aberta: "Aberta", em_tratativa: "Em Tratativa", encerrada: "Finalizada", cancelada: "Cancelada" };
const PARAM_COLORS = ["#dc2626","#d97706","#2563eb","#7c3aed","#0891b2","#be185d","#065f46","#92400e","#1e3a5f","#6b21a8"];
const CHART_COLORS = ["#00233B","#566E3D","#d97706","#0891b2","#7c3aed","#dc2626","#be185d","#065f46","#92400e","#4ade80","#fb923c","#1e3a5f"];

// ---- Pure cross-filter functions ----
// Each chart calls these with `skip = 'its_own_dimension'` so it shows distribution of itself
function applyRncFilters(rncs, cncs, f, skip = null) {
  let r = rncs;
  if (skip !== 'obraId' && f.obraId) r = r.filter(x => x.obra_id === f.obraId);
  if (skip !== 'status' && f.status) r = r.filter(x => x.status === f.status);
  if (skip !== 'empreiteira' && f.empreiteira) r = r.filter(x => (x.executora || '') === f.empreiteira);
  if (skip !== 'rodovia' && f.rodovia) r = r.filter(x => (x.rodovia || '') === f.rodovia);
  if (skip !== 'parametro' && f.parametro) {
    const ids = new Set(cncs.filter(nc => nc.parametro === f.parametro).map(nc => nc.obra_id));
    r = r.filter(x => ids.has(x.obra_id));
  }
  // usina not applicable to RNCs
  return r;
}

function applyCncFilters(cncs, rncs, f, skip = null) {
  let r = cncs;
  if (skip !== 'obraId' && f.obraId) r = r.filter(nc => nc.obra_id === f.obraId);
  if (skip !== 'parametro' && f.parametro) r = r.filter(nc => nc.parametro === f.parametro);
  if (skip !== 'empreiteira' && f.empreiteira) r = r.filter(nc => (nc.empreiteira || '') === f.empreiteira);
  if (skip !== 'rodovia' && f.rodovia) r = r.filter(nc => (nc.rodovia || '') === f.rodovia);
  if (skip !== 'usina' && f.usina) r = r.filter(nc => (nc.usina || '') === f.usina);
  if (skip !== 'status' && f.status) {
    const ids = new Set(rncs.filter(x => x.status === f.status).map(x => x.obra_id));
    r = r.filter(nc => ids.has(nc.obra_id));
  }
  return r;
}

// ---- Checklist NC extractor ----
function extrairNaoConformidadesChecklist(checklist, tipo) {
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
}

// ---- Small reusable UI components ----
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
};

const PizzaCard = ({ title, icon: Icon, subtitle, children }) => (
  <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
    <CardHeader className="pb-2">
      <CardTitle className="text-[#00233B] text-base flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#BFCF99]" />
        {title}
        {subtitle && <span className="text-xs font-normal text-[#00233B]/50 ml-1">({subtitle})</span>}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const EmptyChart = ({ text, height = 280 }) => (
  <div className={`flex flex-col items-center justify-center text-[#00233B]/50`} style={{ height }}>
    <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
    <p className="text-sm text-center px-4">{text}</p>
  </div>
);

const tooltipStyle = { backgroundColor: 'rgba(242,241,239,0.97)', borderRadius: '8px', border: '1px solid rgba(0,35,59,0.15)' };
const legendFmt = (v) => <span style={{ color: '#00233B', fontSize: 12 }}>{v}</span>;
const smallLegendFmt = (v) => <span style={{ color: '#00233B', fontSize: 11 }}>{v}</span>;

// ---- Main Page ----
export default function NaoConformidadesPage() {
  const [loading, setLoading] = useState(true);
  const [obras, setObras] = useState([]);
  const [rncs, setRncs] = useState([]);
  const [checklistNCs, setChecklistNCs] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroParametro, setFiltroParametro] = useState(null);
  const [filtroObraId, setFiltroObraId] = useState(null);
  const [filtroEmpreiteira, setFiltroEmpreiteira] = useState(null);
  const [filtroRodovia, setFiltroRodovia] = useState(null);
  const [filtroUsina, setFiltroUsina] = useState(null);
  const [tabelaBusca, setTabelaBusca] = useState('');
  const [tabelaTipo, setTabelaTipo] = useState('_all');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      const userAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

      const [obrasData, regionaisData, rncsData] = await Promise.all([
        Obra.list(), Regional.list(),
        base44.entities.RelatorioNC.list("-created_date", 500)
      ]);

      let availableObras = obrasData;
      if (userAccessLevel === 'cliente') {
        const regs = regionaisData.filter(r => (r.clientes_responsaveis || []).some(e => e.toLowerCase() === userData.email.toLowerCase()));
        const ids = new Set(regs.flatMap(r => obrasData.filter(o => o.regional_id === r.id).map(o => o.id)));
        availableObras = obrasData.filter(o => ids.has(o.id));
      } else if (userAccessLevel === 'sala_tecnica_afirmaevias') {
        const regs = regionaisData.filter(r => (r.salas_tecnicas_responsaveis || []).some(e => e.toLowerCase() === userData.email.toLowerCase()));
        const ids = new Set(regs.flatMap(r => obrasData.filter(o => o.regional_id === r.id).map(o => o.id)));
        availableObras = obrasData.filter(o => ids.has(o.id));
      } else if (userAccessLevel === 'gestor_contrato') {
        const regs = regionaisData.filter(r =>
          r.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(e => e.toLowerCase() === userData.email.toLowerCase())
        );
        const ids = new Set(regs.flatMap(r => obrasData.filter(o => o.regional_id === r.id).map(o => o.id)));
        availableObras = obrasData.filter(o => ids.has(o.id));
      }

      setObras(availableObras);
      const availableIds = new Set(availableObras.map(o => o.id));
      setRncs(rncsData.filter(r => availableIds.has(r.obra_id)));

      const allCNCs = [];
      // Fetch all records for each checklist type at once (avoids per-obra pagination limits)
      const allData = await Promise.all(
        TIPOS_CHECKLIST.map(t =>
          base44.entities[t.value].list('-created_date', 2000)
            .catch(() => [])
            .then(res => res.filter(c => availableIds.has(c.obra_id)).map(c => ({ ...c, _tipo: t.value })))
        )
      );

      allData.flat().forEach(cl => {
        extrairNaoConformidadesChecklist(cl, cl._tipo).forEach(param => {
          allCNCs.push({
            id: cl.id,
            obra_id: cl.obra_id,
            parametro: param.charAt(0).toUpperCase() + param.slice(1),
            tipo: cl._tipo,
            laboratorista_name: cl.laboratorista_name || '',
            data: cl.data || '',
            empreiteira: cl.empreiteira || '',
            rodovia: cl.rodovia || '',
            usina: cl.usina || cl.usina_selecionada || '',
          });
        });
      });

      // Fetch todos os outros tipos de registro (approved === false = NC)
      const fetchOutro = (entityName, label, page) =>
        base44.entities[entityName].list('-created_date', 2000)
          .catch(() => [])
          .then(res => res
            .filter(c => availableIds.has(c.obra_id) && c.approved === false)
            .map(c => ({
              id: c.id, obra_id: c.obra_id,
              parametro: label, tipo: entityName,
              laboratorista_name: c.laboratorista_name || '',
              data: c.data || c.data_ensaio || c.extraction_date || c.collection_date || '',
              empreiteira: c.empreiteira || '',
              rodovia: c.rodovia || '',
              usina: c.usina || c.usina_fornecedora || c.usina_selecionada || '',
              _page: page,
            }))
          );

      const outrosResults = await Promise.all(
        OUTROS_TIPOS_REGISTRO.map(t => fetchOutro(t.value, t.label, t.page))
      );

      outrosResults.flat().forEach(reg => allCNCs.push(reg));

      setChecklistNCs(allCNCs);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const supervisaoIds = useMemo(() => new Set(obras.filter(o => o.tipo_obra === 'supervisao').map(o => o.id)), [obras]);

  // ---- Dropdown options (from full dataset) ----
  const opcoesEmpreiteira = useMemo(() => {
    const s = new Set([...checklistNCs.map(nc => nc.empreiteira), ...rncs.map(r => r.executora || '')].filter(Boolean));
    return [...s].sort();
  }, [checklistNCs, rncs]);

  const opcoesRodovia = useMemo(() => {
    const s = new Set([...checklistNCs.map(nc => nc.rodovia), ...rncs.map(r => r.rodovia || '')].filter(Boolean));
    return [...s].sort();
  }, [checklistNCs, rncs]);

  const opcoesUsina = useMemo(() => {
    const s = new Set(checklistNCs.map(nc => nc.usina).filter(Boolean));
    return [...s].sort();
  }, [checklistNCs]);

  // ---- Cross-filtered chart data ----
  // Each chart skips its own filter dimension so it shows its own distribution
  const f = useMemo(() => ({
    status: filtroStatus, parametro: filtroParametro, obraId: filtroObraId,
    empreiteira: filtroEmpreiteira, rodovia: filtroRodovia, usina: filtroUsina
  }), [filtroStatus, filtroParametro, filtroObraId, filtroEmpreiteira, filtroRodovia, filtroUsina]);

  const dadosStatusRNC = useMemo(() => {
    const filtered = applyRncFilters(rncs, checklistNCs, f, 'status');
    const counts = { aberta: 0, em_tratativa: 0, encerrada: 0, cancelada: 0 };
    filtered.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return Object.entries(counts).filter(([,v]) => v > 0)
      .map(([status, value]) => ({ name: STATUS_LABELS[status], statusKey: status, value, color: STATUS_COLORS[status] }));
  }, [rncs, checklistNCs, f]);

  const dadosParametros = useMemo(() => {
    const filtered = applyCncFilters(checklistNCs, rncs, f, 'parametro');
    const count = {};
    filtered.forEach(nc => { count[nc.parametro] = (count[nc.parametro] || 0) + 1; });
    return Object.entries(count).sort((a,b) => b[1]-a[1]).slice(0,10)
      .map(([name, value], i) => ({ name, value, color: PARAM_COLORS[i % PARAM_COLORS.length] }));
  }, [checklistNCs, rncs, f]);

  const dadosPorObra = useMemo(() => {
    const filteredR = applyRncFilters(rncs, checklistNCs, f, 'obraId');
    const filteredC = applyCncFilters(checklistNCs, rncs, f, 'obraId');
    const count = {};
    filteredR.forEach(r => { count[r.obra_id] = (count[r.obra_id] || 0) + 1; });
    filteredC.forEach(nc => { count[nc.obra_id] = (count[nc.obra_id] || 0) + 1; });
    return Object.entries(count)
      .map(([obraId, value], i) => ({ name: obras.find(o => o.id === obraId)?.name || obraId, obraId, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a,b) => b.value - a.value);
  }, [rncs, checklistNCs, obras, f]);

  const dadosPorEmpreiteira = useMemo(() => {
    const filteredC = applyCncFilters(checklistNCs, rncs, f, 'empreiteira').filter(nc => supervisaoIds.has(nc.obra_id));
    const filteredR = applyRncFilters(rncs, checklistNCs, f, 'empreiteira').filter(r => supervisaoIds.has(r.obra_id));
    const count = {};
    filteredC.forEach(nc => { if (nc.empreiteira) count[nc.empreiteira] = (count[nc.empreiteira] || 0) + 1; });
    filteredR.forEach(r => { if (r.executora) count[r.executora] = (count[r.executora] || 0) + 1; });
    return Object.entries(count).sort((a,b) => b[1]-a[1])
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [checklistNCs, rncs, supervisaoIds, f]);

  const dadosPorRodovia = useMemo(() => {
    const filteredC = applyCncFilters(checklistNCs, rncs, f, 'rodovia');
    const filteredR = applyRncFilters(rncs, checklistNCs, f, 'rodovia');
    const count = {};
    filteredC.forEach(nc => { if (nc.rodovia) count[nc.rodovia] = (count[nc.rodovia] || 0) + 1; });
    filteredR.forEach(r => { if (r.rodovia) count[r.rodovia] = (count[r.rodovia] || 0) + 1; });
    return Object.entries(count).sort((a,b) => b[1]-a[1])
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [checklistNCs, rncs, f]);

  const dadosPorUsina = useMemo(() => {
    const filtered = applyCncFilters(checklistNCs, rncs, f, 'usina');
    const count = {};
    filtered.forEach(nc => { if (nc.usina) count[nc.usina] = (count[nc.usina] || 0) + 1; });
    return Object.entries(count).sort((a,b) => b[1]-a[1])
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [checklistNCs, rncs, f]);

  // ---- KPIs (all filters applied) ----
  const rncsVisiveis = useMemo(() => applyRncFilters(rncs, checklistNCs, f), [rncs, checklistNCs, f]);
  const cncsVisiveis = useMemo(() => applyCncFilters(checklistNCs, rncs, f), [checklistNCs, rncs, f]);

  // ---- Table ----
  const tabelaResumo = useMemo(() => {
    return obras.map(obra => {
      if (f.obraId && obra.id !== f.obraId) return null;

      let rncsObra = rncs.filter(r => r.obra_id === obra.id);
      if (f.status) rncsObra = rncsObra.filter(r => r.status === f.status);
      if (f.empreiteira) rncsObra = rncsObra.filter(r => (r.executora || '') === f.empreiteira);
      if (f.rodovia) rncsObra = rncsObra.filter(r => (r.rodovia || '') === f.rodovia);
      if (f.parametro) {
        if (!checklistNCs.some(nc => nc.parametro === f.parametro && nc.obra_id === obra.id)) rncsObra = [];
      }

      let cncsObra = checklistNCs.filter(nc => nc.obra_id === obra.id);
      if (f.parametro) cncsObra = cncsObra.filter(nc => nc.parametro === f.parametro);
      if (f.empreiteira) cncsObra = cncsObra.filter(nc => (nc.empreiteira || '') === f.empreiteira);
      if (f.rodovia) cncsObra = cncsObra.filter(nc => (nc.rodovia || '') === f.rodovia);
      if (f.usina) cncsObra = cncsObra.filter(nc => (nc.usina || '') === f.usina);
      if (f.status) {
        if (!rncs.some(r => r.obra_id === obra.id && r.status === f.status)) cncsObra = [];
      }

      const totalRnc = rncsObra.length;
      const paramChecklist = cncsObra.length;
      if (totalRnc === 0 && paramChecklist === 0) return null;

      return {
        obra, totalRnc, paramChecklist,
        abertas: rncsObra.filter(r => r.status === 'aberta').length,
        emTratativa: rncsObra.filter(r => r.status === 'em_tratativa').length,
        finalizadas: rncsObra.filter(r => r.status === 'encerrada').length,
        canceladas: rncsObra.filter(r => r.status === 'cancelada').length,
      };
    }).filter(Boolean);
  }, [obras, rncs, checklistNCs, f]);

  // ---- Handlers ----
  const handleStatusClick = useCallback((d) => setFiltroStatus(p => p === d.statusKey ? null : d.statusKey), []);
  const handleParametroClick = useCallback((d) => setFiltroParametro(p => p === d.name ? null : d.name), []);
  const handleObraClick = useCallback((d) => setFiltroObraId(p => p === d.obraId ? null : d.obraId), []);
  const handleEmpreiteiraClick = useCallback((d) => setFiltroEmpreiteira(p => p === d.name ? null : d.name), []);
  const handleRodoviaClick = useCallback((d) => setFiltroRodovia(p => p === d.name ? null : d.name), []);
  const handleUsinaClick = useCallback((d) => setFiltroUsina(p => p === d.name ? null : d.name), []);

  const clearFilters = useCallback(() => {
    setFiltroStatus(null); setFiltroParametro(null); setFiltroObraId(null);
    setFiltroEmpreiteira(null); setFiltroRodovia(null); setFiltroUsina(null);
  }, []);

  const hasActiveFilter = !!(filtroStatus || filtroParametro || filtroObraId || filtroEmpreiteira || filtroRodovia || filtroUsina);

  const tiposDisponiveis = useMemo(() => {
    const s = new Set([...rncsVisiveis.map(() => 'Relatório NC'), ...cncsVisiveis.map(nc => {
      const t = [...TIPOS_CHECKLIST, ...OUTROS_TIPOS_REGISTRO].find(t => t.value === nc.tipo);
      return t?.label || nc.tipo;
    })]);
    return [...s].sort();
  }, [rncsVisiveis, cncsVisiveis]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

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
              <X className="w-4 h-4" /> Limpar Filtros
            </Button>
          )}
        </div>

        {/* Filter dropdowns */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#00233B] text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#BFCF99]" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#00233B]/70 font-medium mb-1 block flex items-center gap-1"><HardHat className="w-3 h-3" /> Empreiteira</label>
                <Select value={filtroEmpreiteira || '_all'} onValueChange={v => setFiltroEmpreiteira(v === '_all' ? null : v)}>
                  <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B] h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas</SelectItem>
                    {opcoesEmpreiteira.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#00233B]/70 font-medium mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Rodovia</label>
                <Select value={filtroRodovia || '_all'} onValueChange={v => setFiltroRodovia(v === '_all' ? null : v)}>
                  <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B] h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas</SelectItem>
                    {opcoesRodovia.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#00233B]/70 font-medium mb-1 block flex items-center gap-1"><Building2 className="w-3 h-3" /> Usina</label>
                <Select value={filtroUsina || '_all'} onValueChange={v => setFiltroUsina(v === '_all' ? null : v)}>
                  <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B] h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas</SelectItem>
                    {opcoesUsina.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active filter badges */}
        {hasActiveFilter && (
          <div className="flex flex-wrap gap-2">
            {filtroStatus && <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroStatus(null)}>Status: {STATUS_LABELS[filtroStatus]} <X className="w-3 h-3"/></Badge>}
            {filtroParametro && <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroParametro(null)}>Parâmetro: {filtroParametro} <X className="w-3 h-3"/></Badge>}
            {filtroObraId && <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroObraId(null)}>Obra: {obras.find(o => o.id === filtroObraId)?.name} <X className="w-3 h-3"/></Badge>}
            {filtroEmpreiteira && <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroEmpreiteira(null)}>Empreiteira: {filtroEmpreiteira} <X className="w-3 h-3"/></Badge>}
            {filtroRodovia && <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroRodovia(null)}>Rodovia: {filtroRodovia} <X className="w-3 h-3"/></Badge>}
            {filtroUsina && <Badge className="bg-[#BFCF99]/30 text-[#00233B] border border-[#BFCF99]/50 cursor-pointer gap-1" onClick={() => setFiltroUsina(null)}>Usina: {filtroUsina} <X className="w-3 h-3"/></Badge>}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de RNCs", value: rncsVisiveis.length, color: "text-[#00233B]" },
            { label: "RNCs Abertas", value: rncsVisiveis.filter(r => r.status === 'aberta').length, color: "text-red-600" },
            { label: "Em Tratativa", value: rncsVisiveis.filter(r => r.status === 'em_tratativa').length, color: "text-amber-600" },
            { label: "NCs em Registros", value: cncsVisiveis.length, color: "text-blue-600" },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-white/20 backdrop-blur-lg border border-white/20">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-[#00233B]/70 font-medium uppercase tracking-wide">{kpi.label}</p>
                <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 1: Status + Parâmetros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PizzaCard title="Status dos RNCs" icon={FileText} subtitle="clique para filtrar">
            {dadosStatusRNC.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dadosStatusRNC} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={<CustomLabel />} onClick={handleStatusClick} style={{ cursor: 'pointer' }}>
                    {dadosStatusRNC.map((e, i) => <Cell key={i} fill={e.color} opacity={filtroStatus && filtroStatus !== e.statusKey ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={tooltipStyle} />
                  <Legend formatter={legendFmt} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Nenhum RNC para os filtros selecionados" />}
          </PizzaCard>

          <PizzaCard title="Parâmetros Não Conformes" icon={ClipboardList} subtitle="checklists • clique para filtrar">
            {dadosParametros.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dadosParametros} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={<CustomLabel />} onClick={handleParametroClick} style={{ cursor: 'pointer' }}>
                    {dadosParametros.map((e, i) => <Cell key={i} fill={e.color} opacity={filtroParametro && filtroParametro !== e.name ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' ocorrência(s)', n]} contentStyle={tooltipStyle} />
                  <Legend formatter={smallLegendFmt} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Nenhuma NC de checklist para os filtros" />}
          </PizzaCard>
        </div>

        {/* Row 2: Por Obra + Por Empreiteira */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PizzaCard title="NCs por Obra" icon={AlertTriangle} subtitle="RNCs + Checklists • clique para filtrar">
            {dadosPorObra.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={dadosPorObra} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={<CustomLabel />} onClick={handleObraClick} style={{ cursor: 'pointer' }}>
                    {dadosPorObra.map((e, i) => <Cell key={i} fill={e.color} opacity={filtroObraId && filtroObraId !== e.obraId ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' NC(s)', n]} contentStyle={tooltipStyle} />
                  <Legend formatter={legendFmt} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Nenhuma NC para os filtros selecionados" height={300} />}
          </PizzaCard>

          <PizzaCard title="NCs por Empreiteira" icon={HardHat} subtitle="obras de supervisão • clique para filtrar">
            {dadosPorEmpreiteira.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={dadosPorEmpreiteira} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={<CustomLabel />} onClick={handleEmpreiteiraClick} style={{ cursor: 'pointer' }}>
                    {dadosPorEmpreiteira.map((e, i) => <Cell key={i} fill={e.color} opacity={filtroEmpreiteira && filtroEmpreiteira !== e.name ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' NC(s)', n]} contentStyle={tooltipStyle} />
                  <Legend formatter={legendFmt} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Nenhuma NC por empreiteira para os filtros" height={300} />}
          </PizzaCard>
        </div>

        {/* Row 3: Por Rodovia + Por Usina */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PizzaCard title="NCs por Rodovia" icon={MapPin} subtitle="todos os tipos • clique para filtrar">
            {dadosPorRodovia.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={dadosPorRodovia} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={<CustomLabel />} onClick={handleRodoviaClick} style={{ cursor: 'pointer' }}>
                    {dadosPorRodovia.map((e, i) => <Cell key={i} fill={e.color} opacity={filtroRodovia && filtroRodovia !== e.name ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' NC(s)', n]} contentStyle={tooltipStyle} />
                  <Legend formatter={legendFmt} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Nenhuma NC com rodovia para os filtros" height={300} />}
          </PizzaCard>

          <PizzaCard title="NCs por Usina" icon={Building2} subtitle="todos os tipos • clique para filtrar">
            {dadosPorUsina.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={dadosPorUsina} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false} label={<CustomLabel />} onClick={handleUsinaClick} style={{ cursor: 'pointer' }}>
                    {dadosPorUsina.map((e, i) => <Cell key={i} fill={e.color} opacity={filtroUsina && filtroUsina !== e.name ? 0.3 : 1} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' NC(s)', n]} contentStyle={tooltipStyle} />
                  <Legend formatter={legendFmt} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Nenhuma NC com usina para os filtros" height={300} />}
          </PizzaCard>
        </div>

        {/* Tabela unificada de ocorrências */}
        {(() => {
          // Merge RNCs + checklist NCs into unified rows
          const rncRows = rncsVisiveis.map(r => ({
            _kind: 'rnc',
            id: r.id,
            tipo: 'RNC',
            tipoLabel: 'Relatório NC',
            criador: r.relatorio_criador || r.fiscal || '',
            data: r.data_nc || '',
            parametro: r.parametro_nc || r.categoria_nc || '',
            rodovia: r.rodovia || '',
            usina: '',
            empreiteira: r.executora || '',
            page: RNC_PAGE,
          }));
          const checklistRows = cncsVisiveis.map(nc => {
            const t = [...TIPOS_CHECKLIST, ...OUTROS_TIPOS_REGISTRO].find(t => t.value === nc.tipo);
            return {
              _kind: 'checklist',
              id: nc.id,
              tipo: nc.tipo,
              tipoLabel: t?.label || nc.tipo,
              criador: nc.laboratorista_name || '',
              data: nc.data || nc.data_ensaio || nc.extraction_date || nc.collection_date || '',
              parametro: nc.parametro || '',
              rodovia: nc.rodovia || '',
              usina: nc.usina || '',
              empreiteira: nc.empreiteira || '',
              page: nc._page || t?.page || '',
            };
          });

          const busca = tabelaBusca.toLowerCase().trim();
          let allRows = [...rncRows, ...checklistRows];
          if (tabelaTipo !== '_all') allRows = allRows.filter(r => r.tipoLabel === tabelaTipo);
          if (busca) allRows = allRows.filter(r =>
            r.tipoLabel.toLowerCase().includes(busca) ||
            r.criador.toLowerCase().includes(busca) ||
            r.parametro.toLowerCase().includes(busca) ||
            r.rodovia.toLowerCase().includes(busca) ||
            r.usina.toLowerCase().includes(busca) ||
            r.empreiteira.toLowerCase().includes(busca)
          );
          const total = allRows.length;
          const displayRows = allRows.slice(0, 200);

          return (
            <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-[#00233B] text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#BFCF99]" />
                  Ocorrências Detalhadas
                  {total > 0 && <Badge className="bg-[#BFCF99]/40 text-[#00233B] text-xs ml-2">{total}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros locais da tabela */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00233B]/40" />
                    <Input
                      value={tabelaBusca}
                      onChange={e => setTabelaBusca(e.target.value)}
                      placeholder="Buscar por criador, parâmetro, rodovia, usina..."
                      className="pl-8 h-9 text-sm bg-white/50 border-white/30 text-[#00233B] placeholder:text-[#00233B]/40"
                    />
                  </div>
                  <Select value={tabelaTipo} onValueChange={setTabelaTipo}>
                    <SelectTrigger className="bg-white/50 border-white/30 text-[#00233B] h-9 text-sm w-full sm:w-52">
                      <SelectValue placeholder="Tipo de registro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Todos os tipos</SelectItem>
                      {tiposDisponiveis.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {(tabelaBusca || tabelaTipo !== '_all') && (
                    <Button size="sm" variant="ghost" onClick={() => { setTabelaBusca(''); setTabelaTipo('_all'); }} className="h-9 px-3 text-[#00233B]/60 hover:text-[#00233B] gap-1 whitespace-nowrap">
                      <X className="w-3.5 h-3.5" /> Limpar
                    </Button>
                  )}
                </div>
                {displayRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          {["Tipo de Registro","Criado por","Data","Parâmetro / NC","Rodovia","Usina","Empreiteira",""].map(h => (
                            <th key={h} className="text-left py-2 px-3 text-[#00233B] font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map((row, i) => (
                          <tr key={i} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                            <td className="py-2 px-3 whitespace-nowrap">
                              <Badge className={row._kind === 'rnc' ? "bg-red-100 text-red-800 font-normal" : "bg-blue-100 text-blue-800 font-normal"}>
                                {row.tipoLabel}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-[#00233B]/80 whitespace-nowrap">{row.criador || '—'}</td>
                            <td className="py-2 px-3 text-[#00233B]/80 whitespace-nowrap">{row.data ? new Date(row.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                            <td className="py-2 px-3 text-[#00233B] max-w-[180px] truncate">{row.parametro || '—'}</td>
                            <td className="py-2 px-3 text-[#00233B]/70 whitespace-nowrap">{row.rodovia || '—'}</td>
                            <td className="py-2 px-3 text-[#00233B]/70 whitespace-nowrap">{row.usina || '—'}</td>
                            <td className="py-2 px-3 text-[#00233B]/70 whitespace-nowrap">{row.empreiteira || '—'}</td>
                            <td className="py-2 px-3">
                              {row.page && row.id && (
                                <a href={createPageUrl(row.page) + `?id=${row.id}`} target="_blank" rel="noreferrer">
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[#00233B]/70 hover:text-[#00233B] gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="text-xs">Ver</span>
                                  </Button>
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {total > 200 && (
                      <p className="text-xs text-[#00233B]/50 text-center mt-3">Exibindo 200 de {total} ocorrências</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-[#00233B]/50">
                    <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma ocorrência para os filtros selecionados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

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
                      <tr key={i} className={`border-b border-white/10 transition-colors cursor-pointer ${filtroObraId === row.obra.id ? 'bg-[#BFCF99]/20' : 'hover:bg-white/10'}`} onClick={() => handleObraClick({ obraId: row.obra.id })}>
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