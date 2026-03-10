import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, FileText, ClipboardList } from "lucide-react";
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

const STATUS_COLORS = {
  aberta: "#dc2626",
  em_tratativa: "#d97706",
  encerrada: "#16a34a",
  cancelada: "#6b7280"
};

const STATUS_LABELS = {
  aberta: "Aberta",
  em_tratativa: "Em Tratativa",
  encerrada: "Finalizada",
  cancelada: "Cancelada"
};

const PARAM_COLORS = ["#dc2626","#d97706","#2563eb","#7c3aed","#0891b2","#be185d","#065f46","#92400e","#1e3a5f","#6b21a8"];

const OBRA_COLORS = ["#00233B","#566E3D","#BFCF99","#d97706","#0891b2","#7c3aed","#dc2626","#be185d","#065f46","#92400e"];

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
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
  const [regionais, setRegionais] = useState([]);
  const [rncs, setRncs] = useState([]);
  const [parametrosNC, setParametrosNC] = useState({}); // { parametro: count }
  const [ncPorObra, setNcPorObra] = useState({}); // { obra_id: count (checklist NCs) }

  useEffect(() => {
    loadAll();
  }, []);

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

      setRegionais(regionaisData);

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
      setRncs(rncsData);

      // Processar NCs de checklists para todas as obras disponíveis
      const obraIds = availableObras.map(o => o.id);
      const paramCount = {};
      const obraCount = {};

      // Carregar todos os checklists de todas as obras disponíveis em paralelo
      const allChecklistData = await Promise.all(
        TIPOS_CHECKLIST.map(t =>
          Promise.all(obraIds.map(oId => base44.entities[t.value].filter({ obra_id: oId }).catch(() => [])))
            .then(results => results.flat().map(c => ({ ...c, _tipo: t.value })))
        )
      );

      allChecklistData.flat().forEach(checklist => {
        const ncs = extrairNaoConformidadesChecklist(checklist, checklist._tipo);
        if (ncs.length > 0) {
          obraCount[checklist.obra_id] = (obraCount[checklist.obra_id] || 0) + ncs.length;
          ncs.forEach(param => {
            const label = param.charAt(0).toUpperCase() + param.slice(1);
            paramCount[label] = (paramCount[label] || 0) + 1;
          });
        }
      });

      // Também contabilizar RNCs por obra
      rncsData.forEach(rnc => {
        if (obraIds.includes(rnc.obra_id)) {
          obraCount[rnc.obra_id] = (obraCount[rnc.obra_id] || 0) + 1;
        }
      });

      setParametrosNC(paramCount);
      setNcPorObra(obraCount);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gráfico 1: Status dos RNCs
  const dadosStatusRNC = useMemo(() => {
    const counts = { aberta: 0, em_tratativa: 0, encerrada: 0, cancelada: 0 };
    rncs.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({ name: STATUS_LABELS[status], value, color: STATUS_COLORS[status] }));
  }, [rncs]);

  // Gráfico 2: Parâmetros não conformes (checklists)
  const dadosParametros = useMemo(() => {
    return Object.entries(parametrosNC)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value], i) => ({ name, value, color: PARAM_COLORS[i % PARAM_COLORS.length] }));
  }, [parametrosNC]);

  // Gráfico 3: Total de NC por obra
  const dadosPorObra = useMemo(() => {
    return Object.entries(ncPorObra)
      .map(([obraId, value], i) => {
        const obra = obras.find(o => o.id === obraId);
        return { name: obra?.name || obraId, value, color: OBRA_COLORS[i % OBRA_COLORS.length] };
      })
      .sort((a, b) => b.value - a.value);
  }, [ncPorObra, obras]);

  // Tabela resumo: RNCs por obra
  const tabelaResumo = useMemo(() => {
    return obras.map(obra => {
      const rncsObra = rncs.filter(r => r.obra_id === obra.id);
      const abertas = rncsObra.filter(r => r.status === 'aberta').length;
      const emTratativa = rncsObra.filter(r => r.status === 'em_tratativa').length;
      const finalizadas = rncsObra.filter(r => r.status === 'encerrada').length;
      const canceladas = rncsObra.filter(r => r.status === 'cancelada').length;
      const paramChecklist = ncPorObra[obra.id] || 0;
      const totalRnc = rncsObra.length;
      if (totalRnc === 0 && paramChecklist === 0) return null;
      return { obra, totalRnc, abertas, emTratativa, finalizadas, canceladas, paramChecklist };
    }).filter(Boolean);
  }, [obras, rncs, ncPorObra]);

  const totalRncs = rncs.length;
  const totalAbertos = rncs.filter(r => r.status === 'aberta').length;
  const totalParametros = Object.values(parametrosNC).reduce((a, b) => a + b, 0);

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
        {/* Header */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-[#00233B]">Dashboard de Não Conformidades</h1>
            <p className="text-[#00233B]/70 text-sm mt-1">Visão geral de todas as obras</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de RNCs", value: totalRncs, color: "text-[#00233B]" },
            { label: "RNCs Abertas", value: totalAbertos, color: "text-red-600" },
            { label: "Em Tratativa", value: rncs.filter(r => r.status === 'em_tratativa').length, color: "text-amber-600" },
            { label: "NCs em Checklists", value: totalParametros, color: "text-blue-600" },
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
                Status dos RNCs (todas as obras)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosStatusRNC.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={dadosStatusRNC} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={<CustomLabel />}>
                      {dadosStatusRNC.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ backgroundColor: 'rgba(242,241,239,0.97)', borderRadius: '8px' }} />
                    <Legend formatter={(value) => <span style={{ color: '#00233B', fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-[#00233B]/50">
                  <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum RNC cadastrado</p>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosParametros.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={dadosParametros} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={<CustomLabel />}>
                      {dadosParametros.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value + ' ocorrência(s)', name]} contentStyle={{ backgroundColor: 'rgba(242,241,239,0.97)', borderRadius: '8px' }} />
                    <Legend formatter={(value) => <span style={{ color: '#00233B', fontSize: 11 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-[#00233B]/50">
                  <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma NC de checklist encontrada</p>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPorObra.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={dadosPorObra} cx="50%" cy="50%" outerRadius={120} dataKey="value" labelLine={false} label={<CustomLabel />}>
                    {dadosPorObra.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value + ' NC(s)', name]} contentStyle={{ backgroundColor: 'rgba(242,241,239,0.97)', borderRadius: '8px' }} />
                  <Legend formatter={(value) => <span style={{ color: '#00233B', fontSize: 12 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-[#00233B]/50">
                <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma NC encontrada nas obras</p>
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
                      <tr key={i} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                        <td className="py-2.5 px-3">
                          <div>
                            <p className="font-medium text-[#00233B]">{row.obra.name}</p>
                            <p className="text-xs text-[#00233B]/60">{row.obra.code}</p>
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-3">
                          <span className="font-bold text-[#00233B]">{row.totalRnc}</span>
                        </td>
                        <td className="text-center py-2.5 px-3">
                          {row.abertas > 0 ? <Badge className="bg-red-100 text-red-700">{row.abertas}</Badge> : <span className="text-[#00233B]/30">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-3">
                          {row.emTratativa > 0 ? <Badge className="bg-amber-100 text-amber-700">{row.emTratativa}</Badge> : <span className="text-[#00233B]/30">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-3">
                          {row.finalizadas > 0 ? <Badge className="bg-green-100 text-green-700">{row.finalizadas}</Badge> : <span className="text-[#00233B]/30">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-3">
                          {row.canceladas > 0 ? <Badge className="bg-gray-100 text-gray-600">{row.canceladas}</Badge> : <span className="text-[#00233B]/30">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-3">
                          {row.paramChecklist > 0 ? <Badge className="bg-blue-100 text-blue-700">{row.paramChecklist}</Badge> : <span className="text-[#00233B]/30">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#00233B]/50">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Nenhuma não conformidade registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}