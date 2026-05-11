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
import { Loader2, AlertTriangle, Save, ImagePlus, FileUp, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { LOCAIS, getCategoriasByLocal, getParametrosByLocalCategoria } from "@/components/nc/ncData";

export default function EditarNCPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [nc, setNc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    numero_rnc: "",
    cliente: "",
    rodovia: "",
    trecho: "",
    fiscal: "",
    data_nc: "",
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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams(window.location.search);
    const ncId = params.get("id");

    if (!ncId) {
      alert("ID da NC não encontrado");
      navigate(createPageUrl("GestaoNC"));
      return;
    }

    const userData = await User.me();
    setUser(userData);

    const [obrasData, regionaisData, ncData] = await Promise.all([
      Obra.list(),
      Regional.list(),
      base44.entities.RelatorioNC.filter({ id: ncId })
    ]);

    if (!ncData || ncData.length === 0) {
      alert("NC não encontrada");
      navigate(createPageUrl("GestaoNC"));
      return;
    }

    const ncItem = ncData[0];
    setNc(ncItem);
    setRegionais(regionaisData);
    setObras(obrasData);

    setForm({
      numero_rnc: ncItem.numero_rnc || "",
      cliente: ncItem.cliente || "",
      rodovia: ncItem.rodovia || "",
      trecho: ncItem.trecho || "",
      fiscal: ncItem.fiscal || "",
      data_nc: ncItem.data_nc || "",
      campo: ncItem.campo || "",
      executora: ncItem.executora || "",
      contrato: ncItem.contrato || "",
      descricao_nc: ncItem.descricao_nc || "",
      acoes: ncItem.acoes || "",
      local_nc: ncItem.local_nc || "",
      categoria_nc: ncItem.categoria_nc || "",
      parametro_nc: ncItem.parametro_nc || ""
    });

    setFotos(ncItem.fotos || []);
    setPdfs(ncItem.pdfs || []);
    setLoading(false);
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
    if (!form.descricao_nc || !form.data_nc) {
      alert("Preencha os campos obrigatórios: Data da NC e Descrição.");
      return;
    }
    setSaving(true);
    await base44.entities.RelatorioNC.update(nc.id, {
      ...form,
      fotos,
      pdfs,
      pendente_aprovacao_cliente: true,
      cliente_aprovacao: null,
      cliente_reprovacao_motivo: null
    });
    setSaving(false);
    navigate(createPageUrl("GestaoNC"));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const obra = obras.find(o => o.id === nc.obra_id);

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-[#00233B]">Editar Não Conformidade</h1>
            <p className="text-[#00233B]/70 text-sm mt-1">RNC: {nc.numero_rnc || "—"}</p>
          </div>
        </div>

        {nc.cliente_reprovacao_motivo && (
          <Card className="bg-red-50/50 backdrop-blur-lg border-2 border-red-300">
            <CardContent className="pt-4">
              <p className="font-semibold text-red-800 mb-2">Motivo da Reprovação pelo Cliente:</p>
              <p className="text-red-700">{nc.cliente_reprovacao_motivo}</p>
            </CardContent>
          </Card>
        )}

        {/* Dados da Obra */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">DADOS DA OBRA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#00233B]">Obra</Label>
                <Input value={obra?.name || nc.obra_nome || "—"} readOnly className="bg-white/30 border-white/20 text-[#00233B] opacity-70" />
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
                  <Input value={nc.relatorio_criador || "—"} readOnly className="bg-white/30 border-white/20 text-[#00233B] opacity-70" />
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

        {/* Classificação */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">CLASSIFICAÇÃO DA NÃO CONFORMIDADE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="Descreva o parâmetro..."
                    className="bg-white/50 border-white/20 text-[#00233B] disabled:opacity-50"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descrição */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">DESCRIÇÃO DA NÃO CONFORMIDADE</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.descricao_nc}
              onChange={e => setForm(f => ({ ...f, descricao_nc: e.target.value }))}
              rows={6}
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
              className="bg-white/50 border-white/20 text-[#00233B]"
            />
          </CardContent>
        </Card>

        {/* Anexos */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-base bg-[#BFCF99]/30 px-3 py-1 rounded">ANEXOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    <div key={i} className="relative group">
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
            Salvar e Reenviar para Aprovação
          </Button>
        </div>
      </div>
    </div>
  );
}