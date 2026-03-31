import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Project } from "@/entities/Project";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Loader2 } from "lucide-react";

const proctorPeneiras = ["5.20", "6.20"];

export default function EnsaioProctorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recordId = searchParams.get("id");
  const obraId = searchParams.get("obra_id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [projetos, setProjetos] = useState([]);

  const [form, setForm] = useState({
    obra_id: obraId || "",
    project_id: "",
    data_ensaio: new Date().toISOString().split("T")[0],
    horario: "",
    laboratorista_name: "",
    cliente: "",
    contrato: "",
    rodovia: "",
    trecho: "",
    local_coleta: "",
    camada: "",
    material: "",
    procedencia: "",
    amostra_umida: "Grande",
    agua_adicionada: "",
    disco_especial: "6.20",
    soquete: "Grande",
    num_golpes: 12,
    energia_compactacao: "Intermediária",
    correcao_densidade: "higroscopica",
    umidade_higroscopica: "",
    umidades: Array(5).fill(null).map(() => ({
      numero: 1,
      agua_adicionada_ml: "",
      capsula_numero: "",
      capsula_solo_umido: "",
      capsula_solo_seco: "",
      peso_capsula: "",
      peso_agua: 0,
      peso_solo_seco: 0,
      teor_umidade: 0,
    })),
    umidade_media: 0,
    densidades: Array(5).fill(null).map(() => ({
      numero: 1,
      cilindro_numero: "",
      cilindro_solo_umido: "",
      peso_cilindro: "",
      peso_solo_umido: 0,
      volume_cilindro: "",
      dens_ap_umida: 0,
      dens_ap_seca: 0,
    })),
    densidade_maxima_seca: "",
    umidade_otima: "",
    isc_cbr: "",
    expansao: "",
    observacoes: "",
    status: "rascunho",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setForm(prev => ({
        ...prev,
        laboratorista_name: userData.laboratorista_name || userData.full_name,
      }));

      const obrasData = await Obra.list();
      setObras(obrasData);

      if (recordId) {
        const record = await base44.entities.EnsaioProctor.get(recordId);
        setForm(record);
        if (record.project_id) {
          const projectData = await base44.entities.Project.get(record.project_id);
          setProjetos([projectData]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleObraChange = async (obraId) => {
    setForm(prev => ({ ...prev, obra_id: obraId, project_id: "" }));
    if (obraId) {
      const obra = obras.find(o => o.id === obraId);
      if (obra && obra.project_ids && obra.project_ids.length > 0) {
        const projs = await Promise.all(
          obra.project_ids.map(pid => base44.entities.Project.get(pid))
        );
        setProjetos(projs);
      }
    }
  };

  const calculateUmidade = (index) => {
    const u = form.umidades[index];
    if (u.capsula_solo_umido && u.capsula_solo_seco && u.peso_capsula) {
      const p4 = parseFloat(u.capsula_solo_umido);
      const p5 = parseFloat(u.capsula_solo_seco);
      const p6 = parseFloat(u.peso_capsula);

      const pw = p4 - p5;
      const pss = p5 - p6;
      const teor = pss > 0 ? (pw / pss) * 100 : 0;

      const updated = [...form.umidades];
      updated[index] = {
        ...updated[index],
        peso_agua: parseFloat(pw.toFixed(3)),
        peso_solo_seco: parseFloat(pss.toFixed(3)),
        teor_umidade: parseFloat(teor.toFixed(2)),
      };

      const media = updated
        .filter((u, i) => i < 5 && u.teor_umidade > 0)
        .reduce((sum, u) => sum + u.teor_umidade, 0) / updated.filter((u, i) => i < 5 && u.teor_umidade > 0).length;

      setForm(prev => ({
        ...prev,
        umidades: updated,
        umidade_media: parseFloat(media.toFixed(2)),
      }));
    }
  };

  const calculateDensidade = (index) => {
    const d = form.densidades[index];
    if (d.cilindro_solo_umido && d.peso_cilindro && d.volume_cilindro) {
      const p1 = parseFloat(d.cilindro_solo_umido);
      const p2 = parseFloat(d.peso_cilindro);
      const p3 = p1 - p2;
      const v = parseFloat(d.volume_cilindro);

      const gammaW = p3 / v;
      let tW;
      if (form.correcao_densidade === "higroscopica") {
        tW = form.umidade_higroscopica ? parseFloat(form.umidade_higroscopica) : form.umidade_media;
      } else {
        tW = form.umidades[index].teor_umidade || form.umidade_media;
      }

      const gammaS = (gammaW / (tW + 100)) * 100;

      const updated = [...form.densidades];
      updated[index] = {
        ...updated[index],
        peso_solo_umido: parseFloat(p3.toFixed(3)),
        dens_ap_umida: parseFloat(gammaW.toFixed(4)),
        dens_ap_seca: parseFloat(gammaS.toFixed(4)),
      };

      setForm(prev => ({ ...prev, densidades: updated }));
    }
  };

  const handleSave = async (status) => {
    setSaving(true);
    try {
      const data = { ...form, status };
      if (recordId) {
        await base44.entities.EnsaioProctor.update(recordId, data);
        alert("Ensaio atualizado com sucesso!");
      } else {
        await base44.entities.EnsaioProctor.create(data);
        alert("Ensaio criado com sucesso!");
        navigate("/MeusEnsaios");
      }
    } catch (err) {
      alert("Erro ao salvar ensaio: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#BFCF99]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 min-h-screen bg-transparent">
      <div>
        <h1 className="text-3xl font-bold text-[#00233B]">Ensaio Proctor</h1>
        <p className="text-[#00233B]/80 mt-1">ABNT NBR 7182:2016 - Compactação de Solos</p>
      </div>

      {/* Dados da Obra */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Dados da Obra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#00233B]">Obra *</Label>
              <Select value={form.obra_id} onValueChange={handleObraChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#00233B]">Projeto</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm(prev => ({ ...prev, project_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#00233B]">Cliente</Label>
              <Input value={form.cliente} onChange={(e) => setForm(prev => ({ ...prev, cliente: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Contrato</Label>
              <Input value={form.contrato} onChange={(e) => setForm(prev => ({ ...prev, contrato: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Rodovia</Label>
              <Input value={form.rodovia} onChange={(e) => setForm(prev => ({ ...prev, rodovia: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Trecho</Label>
              <Input value={form.trecho} onChange={(e) => setForm(prev => ({ ...prev, trecho: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Local de Coleta</Label>
              <Input value={form.local_coleta} onChange={(e) => setForm(prev => ({ ...prev, local_coleta: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Data do Ensaio *</Label>
              <Input type="date" value={form.data_ensaio} onChange={(e) => setForm(prev => ({ ...prev, data_ensaio: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Material */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Dados do Material</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#00233B]">Camada</Label>
              <Input value={form.camada} onChange={(e) => setForm(prev => ({ ...prev, camada: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Material</Label>
              <Input value={form.material} onChange={(e) => setForm(prev => ({ ...prev, material: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Procedência</Label>
              <Input value={form.procedencia} onChange={(e) => setForm(prev => ({ ...prev, procedencia: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Amostra Úmida</Label>
              <Select value={form.amostra_umida} onValueChange={(v) => setForm(prev => ({ ...prev, amostra_umida: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pequena">Pequena</SelectItem>
                  <SelectItem value="Grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#00233B]">Água Adicionada (ml)</Label>
              <Input type="number" value={form.agua_adicionada} onChange={(e) => setForm(prev => ({ ...prev, agua_adicionada: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Disco Especial</Label>
              <Select value={form.disco_especial} onValueChange={(v) => setForm(prev => ({ ...prev, disco_especial: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5.20">5.20</SelectItem>
                  <SelectItem value="6.20">6.20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#00233B]">Soquete</Label>
              <Select value={form.soquete} onValueChange={(v) => setForm(prev => ({ ...prev, soquete: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pequeno">Pequeno</SelectItem>
                  <SelectItem value="Grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#00233B]">Nº de Golpes</Label>
              <Input type="number" value={form.num_golpes} onChange={(e) => setForm(prev => ({ ...prev, num_golpes: parseInt(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Energia de Compactação</Label>
              <Select value={form.energia_compactacao} onValueChange={(v) => setForm(prev => ({ ...prev, energia_compactacao: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Intermediária">Intermediária</SelectItem>
                  <SelectItem value="Modificada">Modificada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Umidades */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Umidade dos Pontos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <Label className="text-[#00233B]">Tipo de Correção de Densidade</Label>
            <Select value={form.correcao_densidade} onValueChange={(v) => setForm(prev => ({ ...prev, correcao_densidade: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="higroscopica">Umidade Higroscópica</SelectItem>
                <SelectItem value="ponto_a_ponto">Umidade Ponto a Ponto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.correcao_densidade === "higroscopica" && (
            <div>
              <Label className="text-[#00233B]">Umidade Higroscópica (%)</Label>
              <Input type="number" step="0.01" value={form.umidade_higroscopica} onChange={(e) => setForm(prev => ({ ...prev, umidade_higroscopica: e.target.value }))} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#00233B]/10">
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">#</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Água (ml)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Cápsula Nº</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Cap+Solo Úmido (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Cap+Solo Seco (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Peso Cap (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#BFCF99]">Peso Água (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#BFCF99]">Peso Solo Seco (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#BFCF99]">Umidade (%)</th>
                </tr>
              </thead>
              <tbody>
                {form.umidades.map((u, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white/20' : 'bg-white/10'}>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center font-medium text-[#00233B]">{idx + 1}</td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input type="number" value={u.agua_adicionada_ml} onChange={(e) => { const updated = [...form.umidades]; updated[idx].agua_adicionada_ml = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input value={u.capsula_numero} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_numero = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input type="number" step="0.01" value={u.capsula_solo_umido} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_solo_umido = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input type="number" step="0.01" value={u.capsula_solo_seco} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_solo_seco = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input type="number" step="0.01" value={u.peso_capsula} onChange={(e) => { const updated = [...form.umidades]; updated[idx].peso_capsula = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-[#00233B] bg-[#BFCF99]/10">{u.peso_agua.toFixed(3)}</td>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-[#00233B] bg-[#BFCF99]/10">{u.peso_solo_seco.toFixed(3)}</td>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-[#BFCF99] bg-[#BFCF99]/20">{u.teor_umidade.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded-lg p-3 mt-4">
            <p className="text-sm text-[#00233B]">
              <span className="font-semibold">Umidade Média: </span>
              <span className="text-[#BFCF99] font-bold">{form.umidade_media.toFixed(2)}%</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Densidades */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Compactação - Densidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#00233B]/10">
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">#</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Cilindro Nº</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Cilindro+Solo Úmido (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Peso Cilindro (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Vol Cilindro (cm³)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#BFCF99]">Peso Solo Úmido (g)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#BFCF99]">Dens. Ap. Úmida (g/cm³)</th>
                  <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#BFCF99]">Dens. Ap. Seca (g/cm³)</th>
                </tr>
              </thead>
              <tbody>
                {form.densidades.map((d, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white/20' : 'bg-white/10'}>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center font-medium text-[#00233B]">{idx + 1}</td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input value={d.cilindro_numero} onChange={(e) => { const updated = [...form.densidades]; updated[idx].cilindro_numero = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input type="number" step="0.01" value={d.cilindro_solo_umido} onChange={(e) => { const updated = [...form.densidades]; updated[idx].cilindro_solo_umido = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); setTimeout(() => calculateDensidade(idx), 0); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input type="number" step="0.01" value={d.peso_cilindro} onChange={(e) => { const updated = [...form.densidades]; updated[idx].peso_cilindro = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); setTimeout(() => calculateDensidade(idx), 0); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-1"><Input type="number" step="0.01" value={d.volume_cilindro} onChange={(e) => { const updated = [...form.densidades]; updated[idx].volume_cilindro = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); }} className="h-8 text-xs" /></td>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-[#00233B] bg-[#BFCF99]/10">{d.peso_solo_umido.toFixed(3)}</td>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-[#00233B] bg-[#BFCF99]/10">{d.dens_ap_umida.toFixed(4)}</td>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-[#BFCF99] bg-[#BFCF99]/20">{d.dens_ap_seca.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#00233B]">Densidade Máxima Seca (g/cm³)</Label>
              <Input type="number" step="0.0001" value={form.densidade_maxima_seca} onChange={(e) => setForm(prev => ({ ...prev, densidade_maxima_seca: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Umidade Ótima (%)</Label>
              <Input type="number" step="0.01" value={form.umidade_otima} onChange={(e) => setForm(prev => ({ ...prev, umidade_otima: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">ISC/CBR (%)</Label>
              <Input type="number" step="0.01" value={form.isc_cbr} onChange={(e) => setForm(prev => ({ ...prev, isc_cbr: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[#00233B]">Expansão (%)</Label>
              <Input type="number" step="0.01" value={form.expansao} onChange={(e) => setForm(prev => ({ ...prev, expansao: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-[#00233B]">Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))} rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave("rascunho")} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Rascunho
        </Button>
        <Button onClick={() => handleSave("finalizado")} disabled={saving} className="bg-[#00233B] text-white hover:bg-[#00233B]/90">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Finalizar
        </Button>
      </div>
    </div>
  );
}