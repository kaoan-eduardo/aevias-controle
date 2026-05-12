import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Save, Copy, Check, ImagePlus, FileUp, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { LOCAIS, getCategoriasByLocal, getParametrosByLocalCategoria } from "@/components/nc/ncData";

function CopyIdButton({ id }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar ID"
      className="inline-flex items-center gap-1 text-[10px] font-mono bg-black/10 hover:bg-[#BFCF99]/40 px-1.5 py-0.5 rounded transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      <span className="truncate max-w-[80px]">{id}</span>
    </button>
  );
}

const TIPOS_CHECKLIST = [
  { value: "DiarioObra", label: "Diário de Obra" },
  { value: "ChecklistUsina", label: "Checklist de Usina" },
  { value: "ChecklistAplicacao", label: "Checklist de Aplicação" },
  { value: "ChecklistMRAF", label: "Checklist MRAF" },
  { value: "ChecklistConcretagem", label: "Checklist de Concretagem" },
  { value: "ChecklistTerraplanagem", label: "Checklist de Terraplanagem" },
  { value: "ChecklistReciclagem", label: "Checklist de Reciclagem" }
];

export default function NovaNcPage() {
  const navigate = useNavigate();
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
    acoes: "",
    local_nc: "",
    categoria_nc: "",
    parametro_nc: ""
  });

  const [fotos, setFotos] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [uploadingPdfs, setUploadingPdfs] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error("[NovaNC] Erro ao carregar dados iniciais:", error?.message || error);
    } finally {
      setLoading(false);
    }
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
      // fiscal removed
    }));
  };

  const handleUploadFotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingFotos(true);
    const urls = await Promise.all(files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }));
    setFotos(prev => [...prev, ...urls]);
    setUploadingFotos(false);
  };

  const handleUploadPdfs = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPdfs(true);
    const results = await Promise.all(files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return { url: file_url, nome: file.name };
    }));
    setPdfs(prev => [...prev, ...results]);
    setUploadingPdfs(false);
  };

  const handleSave = async () => {
    if (!obraId || !form.descricao_nc || !form.data_nc) {
      alert("Preencha os campos obrigatórios: Obra, Data da NC e Descrição.");
      return;
    }
    setSaving(true);
    try {
      const managerName = user?.laboratorista_name || user?.full_name || "";
      await base44.entities.RelatorioNC.create({
        ...form,
        obra_id: obraId,
        obra_nome: obras.find(o => o.id === obraId)?.name || "",
        relatorio_criador: managerName,
        checklist_ref_tipo: tipoChecklist,
        checklist_ref_id: checklistId,
        fotos,
        pdfs,
        status: "aberta",
        pendente_aprovacao_cliente: true,
        manager_signature: {
          signed_by: user?.email || "",
          signed_date: new Date().toISOString(),
          manager_name: managerName,
          crea_number: user?.crea_number || ""
        }
      });
      navigate(createPageUrl("GestaoNC"));
    } catch (error) {
      console.error("[NovaNC] Erro ao salvar NC:", error?.message || error);
      alert("Erro ao salvar a NC. Tente novamente.");
    } finally {
      setSaving(false);
    }
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
                <Label className="text-[#00233B]">Data da NC *</Label>
                <Input type="date" value={form.data_nc} onChange={e => setForm(f => ({ ...f, data_nc: e.target.value }))} className="bg-white/50 border-white/20 text-[#00233B]" />
              </div>
            </div>

            {/* Checklist de referência */}
            <div className="border-t border-white/20 pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#00233B]">Tipo de Registro (referência)</Label>
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
                    <Label className="text-[#00233B]">Selecionar Checklist pelo ID</Label>
                    <Input
                      value={checklistId}
                      onChange={e => handleChecklistChange(e.target.value)}
                      placeholder="Cole o ID do checklist aqui..."
                      className="bg-white/50 border-white/20 text-[#00233B] font-mono text-sm"
                    />
                    {checklistId && checklists.find(c => c.id === checklistId) && (
                      <p className="text-xs text-green-700 mt-1">
                        ✓ Checklist encontrado: {checklists.find(c => c.id === checklistId)?.data} {checklists.find(c => c.id === checklistId)?.rodovia ? `– ${checklists.find(c => c.id === checklistId).rodovia}` : ""}
                      </p>
                    )}
                    {checklistId && !checklists.find(c => c.id === checklistId) && (
                      <p className="text-xs text-orange-600 mt-1">ID não encontrado nos checklists carregados.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de checklists disponíveis com botão copiar ID */}
              {tipoChecklist && (
                <div>
                  <Label className="text-[#00233B] text-xs mb-1 block">Checklists disponíveis (clique no ID para copiar):</Label>
                  {loadingChecklists ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Carregando...</span></div>
                  ) : checklists.length === 0 ? (
                    <p className="text-xs text-[#00233B]/60 italic">Nenhum checklist encontrado para esta obra.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-white/20 rounded-md divide-y divide-white/10">
                      {checklists.map(c => (
                        <div key={c.id} className={`flex items-center justify-between px-3 py-2 text-xs hover:bg-white/20 transition-colors ${checklistId === c.id ? 'bg-[#BFCF99]/20' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-[#00233B]">{c.data}</span>
                            {c.rodovia && <span className="text-[#00233B]/70"> – {c.rodovia}</span>}
                            {c.trecho && <span className="text-[#00233B]/60"> / {c.trecho}</span>}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <CopyIdButton id={c.id} />
                            <button
                              type="button"
                              onClick={() => handleChecklistChange(c.id)}
                              className="text-[10px] bg-[#00233B]/10 hover:bg-[#00233B]/20 text-[#00233B] px-2 py-0.5 rounded transition-colors"
                            >
                              Usar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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

        {/* Local / Categoria / Parâmetro */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">CLASSIFICAÇÃO DA NÃO CONFORMIDADE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* LOCAL */}
              <div>
                <Label className="text-[#00233B]">Local</Label>
                <select
                  value={form.local_nc}
                  onChange={e => setForm(f => ({ ...f, local_nc: e.target.value, categoria_nc: "", parametro_nc: "" }))}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Selecione o local</option>
                  {LOCAIS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* CATEGORIA */}
              <div>
                <Label className="text-[#00233B]">Categoria</Label>
                <select
                  value={form.categoria_nc}
                  onChange={e => setForm(f => ({ ...f, categoria_nc: e.target.value, parametro_nc: "" }))}
                  disabled={!form.local_nc}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B] disabled:opacity-50"
                >
                  <option value="">Selecione a categoria</option>
                  {getCategoriasByLocal(form.local_nc).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* PARÂMETRO */}
              <div>
                <Label className="text-[#00233B]">Parâmetro</Label>
                {getParametrosByLocalCategoria(form.local_nc, form.categoria_nc).length > 0 ? (
                  <select
                    value={form.parametro_nc}
                    onChange={e => setForm(f => ({ ...f, parametro_nc: e.target.value }))}
                    disabled={!form.categoria_nc}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B] disabled:opacity-50"
                  >
                    <option value="">Selecione o parâmetro</option>
                    {getParametrosByLocalCategoria(form.local_nc, form.categoria_nc).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <Input
                    value={form.parametro_nc}
                    onChange={e => setForm(f => ({ ...f, parametro_nc: e.target.value }))}
                    disabled={!form.categoria_nc}
                    placeholder={form.categoria_nc === "Usina - Diversos" ? "Descreva o parâmetro..." : "Sem parâmetros específicos"}
                    className="bg-white/50 border-white/20 text-[#00233B] disabled:opacity-50"
                  />
                )}
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

        {/* Fotos e PDFs */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">ANEXOS DO GESTOR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fotos */}
            <div>
              <Label className="text-[#00233B] mb-2 block">Fotos</Label>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <Button asChild variant="outline" size="sm" className="border-white/20 text-[#00233B]" disabled={uploadingFotos}>
                  <span>
                    {uploadingFotos ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImagePlus className="w-4 h-4 mr-2" />}
                    Adicionar Fotos
                  </span>
                </Button>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadFotos} />
              </label>
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {fotos.map((url, i) => (
                    <div key={`foto-nc-${i}`} className="relative group">
                      <picture><source srcSet={url} /><img src={url} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover rounded-md border border-white/20" width="auto" height="112" /></picture>
                      <button
                        type="button"
                        onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDFs */}
            <div>
              <Label className="text-[#00233B] mb-2 block">PDFs</Label>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <Button asChild variant="outline" size="sm" className="border-white/20 text-[#00233B]" disabled={uploadingPdfs}>
                  <span>
                    {uploadingPdfs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileUp className="w-4 h-4 mr-2" />}
                    Adicionar PDFs
                  </span>
                </Button>
                <input type="file" accept="application/pdf" multiple className="hidden" onChange={handleUploadPdfs} />
              </label>
              {pdfs.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {pdfs.map((pdf, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#00233B] bg-white/30 rounded px-3 py-2">
                      <FileUp className="w-4 h-4 text-[#BFCF99] shrink-0" />
                      <span className="flex-1 truncate">{pdf.nome}</span>
                      <button type="button" onClick={() => setPdfs(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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