import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Obra } from "@/entities/Obra";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const STATUS_LABELS = {
  aberta: "Aberta",
  em_tratativa: "Em Tratativa",
  encerrada: "Finalizada",
  cancelada: "Cancelada"
};

const STATUS_COLORS = {
  aberta: "#ef4444",
  em_tratativa: "#eab308",
  encerrada: "#22c55e",
  cancelada: "#9ca3af"
};

const CHART_COLORS = [
  "#00233B", "#BFCF99", "#ef4444", "#eab308", "#3b82f6",
  "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#6366f1"
];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function NaoConformidadesPage() {
  const [ncs, setNcs] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.RelatorioNC.list("-created_date", 500),
      Obra.list()
    ]).then(([ncsData, obrasData]) => {
      setNcs(ncsData);
      setObras(obrasData);
      setLoading(false);
    });
  }, []);

  // 1. Gráfico de pizza por status
  const statusData = useMemo(() => {
    const counts = {};
    ncs.forEach(nc => {
      const s = nc.status || "aberta";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || "#9ca3af"
    }));
  }, [ncs]);

  // 2. Gráfico de pizza por parâmetro NC
  const parametroData = useMemo(() => {
    const counts = {};
    ncs.forEach(nc => {
      const p = nc.parametro_nc || nc.categoria_nc || "Não especificado";
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [ncs]);

  // 3. Gráfico de pizza por obra
  const obraData = useMemo(() => {
    const counts = {};
    const names = {};
    ncs.forEach(nc => {
      counts[nc.obra_id] = (counts[nc.obra_id] || 0) + 1;
      names[nc.obra_id] = nc.obra_nome || obras.find(o => o.id === nc.obra_id)?.name || nc.obra_id;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, value], i) => ({ name: names[id], value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [ncs, obras]);

  // 4. Tabela resumo por obra
  const tabelaResumo = useMemo(() => {
    const map = {};
    ncs.forEach(nc => {
      const obraId = nc.obra_id;
      const obraNome = nc.obra_nome || obras.find(o => o.id === obraId)?.name || "—";
      if (!map[obraId]) {
        map[obraId] = {
          obraNome,
          total: 0,
          abertas: 0,
          em_tratativa: 0,
          encerradas: 0,
          canceladas: 0,
          porGestor: 0,
          porParametro: 0
        };
      }
      map[obraId].total++;
      const s = nc.status || "aberta";
      if (s === "aberta") map[obraId].abertas++;
      else if (s === "em_tratativa") map[obraId].em_tratativa++;
      else if (s === "encerrada") map[obraId].encerradas++;
      else if (s === "cancelada") map[obraId].canceladas++;

      if (nc.checklist_ref_id) map[obraId].porParametro++;
      else map[obraId].porGestor++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [ncs, obras]);

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
            <p className="text-[#00233B]/70 text-sm mt-1">{ncs.length} registros no total</p>
          </div>
        </div>

        {/* Gráficos – linha 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#00233B]">NCs por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <p className="text-center text-sm text-[#00233B]/50 py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomLabel}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Parâmetros */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#00233B]">NCs por Parâmetro</CardTitle>
            </CardHeader>
            <CardContent>
              {parametroData.length === 0 ? (
                <p className="text-center text-sm text-[#00233B]/50 py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={parametroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomLabel}>
                      {parametroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Por Obra */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#00233B]">NCs por Obra</CardTitle>
            </CardHeader>
            <CardContent>
              {obraData.length === 0 ? (
                <p className="text-center text-sm text-[#00233B]/50 py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={obraData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomLabel}>
                      {obraData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela Resumo */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#00233B]">Resumo por Obra</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {tabelaResumo.length === 0 ? (
              <p className="text-center text-sm text-[#00233B]/50 py-8">Nenhuma NC registrada</p>
            ) : (
              <table className="w-full text-sm text-[#00233B]">
                <thead>
                  <tr className="border-b border-white/20 text-xs uppercase text-[#00233B]/60">
                    <th className="text-left py-2 pr-4 font-semibold">Obra</th>
                    <th className="text-center py-2 px-2 font-semibold">Total</th>
                    <th className="text-center py-2 px-2 font-semibold text-red-600">Abertas</th>
                    <th className="text-center py-2 px-2 font-semibold text-yellow-600">Em Tratativa</th>
                    <th className="text-center py-2 px-2 font-semibold text-green-600">Finalizadas</th>
                    <th className="text-center py-2 px-2 font-semibold text-gray-500">Canceladas</th>
                    <th className="text-center py-2 px-2 font-semibold">Por Gestor</th>
                    <th className="text-center py-2 px-2 font-semibold">Por Parâmetro</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelaResumo.map((row, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                      <td className="py-2 pr-4 font-medium">{row.obraNome}</td>
                      <td className="text-center py-2 px-2 font-bold">{row.total}</td>
                      <td className="text-center py-2 px-2 text-red-600 font-semibold">{row.abertas || "—"}</td>
                      <td className="text-center py-2 px-2 text-yellow-600 font-semibold">{row.em_tratativa || "—"}</td>
                      <td className="text-center py-2 px-2 text-green-600 font-semibold">{row.encerradas || "—"}</td>
                      <td className="text-center py-2 px-2 text-gray-500 font-semibold">{row.canceladas || "—"}</td>
                      <td className="text-center py-2 px-2">{row.porGestor || "—"}</td>
                      <td className="text-center py-2 px-2">{row.porParametro || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/30 font-bold text-[#00233B]">
                    <td className="py-2 pr-4">TOTAL</td>
                    <td className="text-center py-2 px-2">{ncs.length}</td>
                    <td className="text-center py-2 px-2 text-red-600">{tabelaResumo.reduce((s, r) => s + r.abertas, 0) || "—"}</td>
                    <td className="text-center py-2 px-2 text-yellow-600">{tabelaResumo.reduce((s, r) => s + r.em_tratativa, 0) || "—"}</td>
                    <td className="text-center py-2 px-2 text-green-600">{tabelaResumo.reduce((s, r) => s + r.encerradas, 0) || "—"}</td>
                    <td className="text-center py-2 px-2 text-gray-500">{tabelaResumo.reduce((s, r) => s + r.canceladas, 0) || "—"}</td>
                    <td className="text-center py-2 px-2">{tabelaResumo.reduce((s, r) => s + r.porGestor, 0) || "—"}</td>
                    <td className="text-center py-2 px-2">{tabelaResumo.reduce((s, r) => s + r.porParametro, 0) || "—"}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}