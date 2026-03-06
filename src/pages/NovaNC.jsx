import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Save } from "lucide-react";
import { createPageUrl } from "@/utils";

const TIPOS_CHECKLIST = [
  { value: "ChecklistUsina", label: "Checklist de Usina" },
  { value: "ChecklistAplicacao", label: "Checklist de Aplicação" },
  { value: "ChecklistMRAF", label: "Checklist MRAF" },
  { value: "ChecklistConcretagem", label: "Checklist de Concretagem" },
  { value: "ChecklistTerraplanagem", label: "Checklist de Terraplanagem" },
  { value: "ChecklistReciclagem", label: "Checklist de Reciclagem" }
];

export default function NovaNcPage() {
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [obraId, setObraId] = useState("");
  const [tipoChecklist, setTipoChecklist] = useState("");
  const [checklists, setChecklists] = useState([]);
  const [checklistId, setChecklistId] = useState("");
  const [loadingChecklists, setLoadingChecklists] = useState(false);

  const [form, setForm] = useState({
    numero_rnc: "",
    cliente: "",
    rodovia: "",
    trecho: "",
    fiscal: "",
    data_nc: new Date().toISOString().split("T")[0],
    campo: "",
    executora: "",
    contrato: "",
    descricao_nc: "",
    acoes: ""
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const userData = await User.me();
    setUser(userData);

    const [obrasData, regionaisData] = await Promise.all([Obra.list(), Regional.list()]);
    setRegionais(regionaisData);

    const userAccessLevel = userData?.access_level || (userData?.role === "admin" ? "admin" : "user");

    let availableObras = obrasData;
    if (userAccessLevel === "gestor_contrato") {
      const regionaisDoGestor = regionaisData.filter(r =>
        r.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase() ||
        (r.gestores_contrato_responsaveis || []).some(e => e.toLowerCase() === userData.email.toLowerCase())
      );
      const ids = new Set(regionaisDoGestor.flatMap(r => obrasData.filter(o => o.regional_id === r.id).map(o => o.id)));
      availableObras = obrasData.filter(o => ids.has(o.id));
    }

    setObras(availableObras);
    setForm(f => ({ ...f, relatorio_criador: userData.laboratorista_name || userData.full_name }));
    setLoading(false);
  };

  const handleObraChange = async (id) => {
    setObraId(id);
    const obra = obras.find(o => o.id === id);
    const regional = regionais.find(r => r.id === obra?.regional_id);
    setForm(f => ({
      ...f,
      cliente: regional?.cliente || "",
      contrato: obra?.code || "",
      executora: (obra?.empreiteiras || [])[0] || "",
      rodovia: (obra?.rodovias || [])[0] || ""
    }));
    setChecklists([]);
    setChecklistId("");
    setTipoChecklist("");
  };

  const handleTipoChecklistChange = async (tipo) => {
    setTipoChecklist(tipo);
    setChecklistId("");
    if (!obraId || !tipo) return;
    setLoadingChecklists(true);
    const data = await base44.entities[tipo].filter({ obra_id: obraId });
    setChecklists(data.sort((a, b) => new Date(b.data) - new Date(a.data)));
    setLoadingChecklists(false);
  };

  const handleChecklistChange = (id) => {
    setChecklistId(id);
    const cl = checklists.find(c => c.id === id);
    if (!cl) return;
    setForm(f => ({
      ...f,
      rodovia: cl.rodovia || f.rodovia,
      trecho: cl.trecho || f.trecho,
      campo: cl.laboratorista_name || f.campo,
      data_nc: cl.data || f.data_nc,
      executora: cl.empreiteira || cl.usina || f.executora,
      fiscal: cl.engenheiro_responsavel || cl.inspetor_campo || f.fiscal
    }));
  };

  const handleSave = async () => {
    if (!obraId || !form.descricao_nc || !form.data_nc) {
      alert("Preencha os campos obrigatórios: Obra, Data da NC e Descrição.");
      return;
    }
    setSaving(true);
    await base44.entities.RelatorioNC.create({
      ...form,
      obra_id: obraId,
      obra_nome: obras.find(o => o.id === obraId)?.name || "",
      relatorio_criador: user?.laboratorista_name || user?.full_name || "",
      checklist_ref_tipo: tipoChecklist,
      checklist_ref_id: checklistId,
      status: "aberta"
    });
    setSaving(false);
    window.location.href = createPageUrl("GestaoNC");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-[#00233B]">Nova Não Conformidade</h1>
            <p className="text-[#00233B]/70 text-sm mt-1">Relatório de Não Conformidade (RNC)</p>
          </div>
        </div>

        {/* Dados da Obra */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">DADOS DA OBRA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#00233B]">Obra *</Label>
                <select
                  value={obraId}
                  onChange={e => handleObraChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Selecione a obra</option>
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[#00233B]">Cliente</Label>
                <Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
              </div>
              <div>
                <Label className="text-[#00233B]">Rodovia</Label>
                <Input value={form.rodovia} onChange={e => setForm(f => ({ ...f, rodovia: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
              </div>
              <div>
                <Label className="text-[#00233B]">Trecho</Label>
                <Input value={form.trecho} onChange={e => setForm(f => ({ ...f, trecho: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
              </div>
              <div>
                <Label className="text-[#00233B]">Fiscal</Label>
                <Input value={form.fiscal} onChange={e => setForm(f => ({ ...f, fiscal: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
              </div>
              <div>
                <Label className="text-[#00233B]">Data da NC *</Label>
                <Input type="date" value={form.data_nc} onChange={e => setForm(f => ({ ...f, data_nc: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
              </div>
            </div>

            {/* Checklist de referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/20 pt-4">
              <div>
                <Label className="text-[#00233B]">Tipo de Checklist (referência)</Label>
                <select
                  value={tipoChecklist}
                  onChange={e => handleTipoChecklistChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Nenhum</option>
                  {TIPOS_CHECKLIST.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {tipoChecklist && (
                <div>
                  <Label className="text-[#00233B]">Checklist</Label>
                  {loadingChecklists ? (
                    <div className="flex items-center gap-2 mt-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Carregando...</span></div>
                  ) : (
                    <select
                      value={checklistId}
                      onChange={e => handleChecklistChange(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                    >
                      <option value="">Selecione</option>
                      {checklists.map(c => (
                        <option key={c.id} value={c.id}>{c.data} {c.rodovia ? `- ${c.rodovia}` : ""} {c.trecho ? `- ${c.trecho}` : ""}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipe / RNC */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#00233B] uppercase tracking-wider text-center border-b border-white/20 pb-1">Equipe Afirma Evias</p>
                <div>
                  <Label className="text-[#00233B]">Campo</Label>
                  <Input value={form.campo} onChange={e => setForm(f => ({ ...f, campo: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
                </div>
                <div>
                  <Label className="text-[#00233B]">Relatório (criador)</Label>
                  <Input value={form.relatorio_criador || user?.laboratorista_name || user?.full_name || ""} readOnly className="bg-white/30 border-white/20 text-[#00233B] opacity-70" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#00233B] uppercase tracking-wider text-center border-b border-white/20 pb-1">ID Executora</p>
                <div>
                  <Label className="text-[#00233B]">Executora</Label>
                  <Input value={form.executora} onChange={e => setForm(f => ({ ...f, executora: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
                </div>
                <div>
                  <Label className="text-[#00233B]">Contrato</Label>
                  <Input value={form.contrato} onChange={e => setForm(f => ({ ...f, contrato: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
                </div>
                <div>
                  <Label className="text-[#00233B]">N° RNC</Label>
                  <Input value={form.numero_rnc} onChange={e => setForm(f => ({ ...f, numero_rnc: e.target.value }))} placeholder="Ex: RNC-001" className="bg-white/50 border-white/20 text-[#00233B]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descrição NC */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">DESCRIÇÃO DA NÃO CONFORMIDADE</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.descricao_nc}
              onChange={e => setForm(f => ({ ...f, descricao_nc: e.target.value }))}
              rows={6}
              placeholder="Descreva a não conformidade identificada..."
              className="bg-white/50 border-white/20 text-[#00233B]"
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">AÇÕES</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.acoes}
              onChange={e => setForm(f => ({ ...f, acoes: e.target.value }))}
              rows={4}
              placeholder="Descreva as ações a serem tomadas..."
              className="bg-white/50 border-white/20 text-[#00233B]"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="border-white/20 text-[#00233B]">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#00233B] text-white hover:bg-[#00233B]/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar NC
          </Button>
        </div>
      </div>
    </div>
  );
}