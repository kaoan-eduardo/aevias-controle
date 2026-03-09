import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Search, Plus, Eye } from "lucide-react";

async function updateNCStatus(id, status, setNcs) {
  await base44.entities.RelatorioNC.update(id, { status });
  setNcs(prev => prev.map(n => n.id === id ? { ...n, status } : n));
}
import { createPageUrl } from "@/utils";

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
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [ncs, setNcs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroObra, setFiltroObra] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };

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
              onClick={() => window.location.href = createPageUrl("NovaNC")}
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
        <div className="grid grid-cols-3 gap-4">
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
                        <select
                          value={nc.status || "aberta"}
                          onChange={e => updateNCStatus(nc.id, e.target.value, setNcs)}
                          className="h-8 rounded-md border border-white/20 bg-white/50 px-2 text-xs text-[#00233B] cursor-pointer"
                        >
                          <option value="aberta">Aberta</option>
                          <option value="em_tratativa">Em Tratativa</option>
                          <option value="encerrada">Finalizada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
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
      </div>
    </div>
  );
}