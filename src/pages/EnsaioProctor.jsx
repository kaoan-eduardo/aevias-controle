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
      // Amostra 1
      capsula_numero_1: "",
      capsula_solo_umido_1: "",
      capsula_solo_seco_1: "",
      peso_capsula_1: "",
      peso_agua_1: 0,
      peso_solo_seco_1: 0,
      teor_umidade_1: 0,
      // Amostra 2
      capsula_numero_2: "",
      capsula_solo_umido_2: "",
      capsula_solo_seco_2: "",
      peso_capsula_2: "",
      peso_agua_2: 0,
      peso_solo_seco_2: 0,
      teor_umidade_2: 0,
      // Média
      teor_umidade_media: 0,
    })),
    densidades: Array(5).fill(null).map(() => ({
      numero: 1,
      cilindro_numero: "",
      cilindro_solo_umido: "",
      peso_cilindro: "",
      peso_solo_umido: 0,
      volume_cilindro: "",
      agua_adicionada_ml: "",
      peso_seco: 0,
      umidade_calculada: 0,
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
    setForm(prev => {
      const updated = [...prev.umidades];
      const u = updated[index];

      // Amostra 1
      const p4_1 = parseFloat(u.capsula_solo_umido_1);
      const p5_1 = parseFloat(u.capsula_solo_seco_1);
      const p6_1 = parseFloat(u.peso_capsula_1);
      let teor1 = 0;
      if (!isNaN(p4_1) && !isNaN(p5_1) && !isNaN(p6_1)) {
        const pw1 = p4_1 - p5_1;
        const pss1 = p5_1 - p6_1;
        teor1 = pss1 > 0 ? (pw1 / pss1) * 100 : 0;
      }

      // Amostra 2
      const p4_2 = parseFloat(u.capsula_solo_umido_2);
      const p5_2 = parseFloat(u.capsula_solo_seco_2);
      const p6_2 = parseFloat(u.peso_capsula_2);
      let teor2 = 0;
      if (!isNaN(p4_2) && !isNaN(p5_2) && !isNaN(p6_2)) {
        const pw2 = p4_2 - p5_2;
        const pss2 = p5_2 - p6_2;
        teor2 = pss2 > 0 ? (pw2 / pss2) * 100 : 0;
      }

      const count = (teor1 > 0 ? 1 : 0) + (teor2 > 0 ? 1 : 0);
      const media = count > 0 ? (teor1 + teor2) / count : 0;

      updated[index] = {
        ...u,
        teor_umidade_1: parseFloat(teor1.toFixed(2)),
        teor_umidade_2: parseFloat(teor2.toFixed(2)),
        teor_umidade_media: parseFloat(media.toFixed(2)),
      };

      // Umidade média geral (ponto a ponto)
      const valid = updated.filter(p => p.teor_umidade_media > 0);
      const umidade_media = valid.length > 0
        ? parseFloat((valid.reduce((s, p) => s + p.teor_umidade_media, 0) / valid.length).toFixed(2))
        : 0;

      return { ...prev, umidades: updated, umidade_media };
    });
  };

  const calculateDensidade = (index) => {
    setForm(prev => {
      const updated = [...prev.densidades];
      const d = updated[index];
      const p1 = parseFloat(d.cilindro_solo_umido);
      const p2 = parseFloat(d.peso_cilindro);
      const v = parseFloat(d.volume_cilindro);

      if (!isNaN(p1) && !isNaN(p2) && !isNaN(v) && v > 0) {
        const p3 = p1 - p2;
        const gammaW = p3 / v;

        let tW;
        let pesoSeco = 0;
        let umidadeCalc = 0;

        if (prev.correcao_densidade === "higroscopica") {
          const uhigro = parseFloat(prev.umidade_higroscopica);
          if (!isNaN(uhigro) && p3 > 0) {
            pesoSeco = (p3 / (100 + uhigro)) * 100;
            const aguaAdd = parseFloat(d.agua_adicionada_ml);
            if (!isNaN(aguaAdd) && pesoSeco > 0) {
              umidadeCalc = (aguaAdd / pesoSeco * 100) + uhigro;
            }
          }
          tW = umidadeCalc > 0 ? umidadeCalc : (prev.umidade_higroscopica ? parseFloat(prev.umidade_higroscopica) : prev.umidade_media);
        } else {
          tW = prev.umidades[index]?.teor_umidade_media || prev.umidade_media;
        }

        const gammaS = tW != null && !isNaN(tW) && tW > 0 ? (gammaW / (tW + 100)) * 100 : 0;

        updated[index] = {
          ...d,
          peso_solo_umido: parseFloat(p3.toFixed(3)),
          peso_seco: parseFloat(pesoSeco.toFixed(3)),
          umidade_calculada: parseFloat(umidadeCalc.toFixed(2)),
          dens_ap_umida: parseFloat(gammaW.toFixed(4)),
          dens_ap_seca: parseFloat(gammaS.toFixed(4)),
        };
      }

      return { ...prev, densidades: updated };
    });
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

          {(() => {
            const isHigro = form.correcao_densidade === 'higroscopica';
            const umidadePoints = isHigro ? form.umidades.slice(0, 1) : form.umidades;
            return (
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#00233B]/10">
                  <th className="border border-[#00233B]/20 px-3 py-2 text-left font-medium text-[#00233B] w-40">Campo</th>
                  {umidadePoints.map((_, idx) => (
                    <th key={idx} className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">
                      {isHigro ? 'Umidade Higroscópica' : `Ponto ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!isHigro && (
                  <tr className="bg-white/20">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Água (ml)</td>
                    {umidadePoints.map((u, idx) => (
                      <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                        <Input type="number" value={u.agua_adicionada_ml} onChange={(e) => { const updated = [...form.umidades]; updated[idx].agua_adicionada_ml = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); }} className="h-8 text-xs" />
                      </td>
                    ))}
                  </tr>
                )}
                <tr className="bg-[#00233B]/10">
                  <td colSpan={umidadePoints.length + 1} className="border border-[#00233B]/20 px-3 py-1 font-semibold text-[#00233B] text-xs">Amostra 1</td>
                </tr>
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cáps. Nº</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input value={u.capsula_numero_1 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_numero_1 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cap+Solo Úm. (g)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={u.capsula_solo_umido_1 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_solo_umido_1 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cap+Solo Sec. (g)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={u.capsula_solo_seco_1 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_solo_seco_1 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Peso Cap (g)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={u.peso_capsula_1 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].peso_capsula_1 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-100/30">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">t (%)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">{(u.teor_umidade_1 || 0).toFixed(2)}</td>
                  ))}
                </tr>
                <tr className="bg-[#00233B]/10">
                  <td colSpan={umidadePoints.length + 1} className="border border-[#00233B]/20 px-3 py-1 font-semibold text-[#00233B] text-xs">Amostra 2</td>
                </tr>
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cáps. Nº</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input value={u.capsula_numero_2 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_numero_2 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cap+Solo Úm. (g)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={u.capsula_solo_umido_2 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_solo_umido_2 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cap+Solo Sec. (g)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={u.capsula_solo_seco_2 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].capsula_solo_seco_2 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Peso Cap (g)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={u.peso_capsula_2 || ''} onChange={(e) => { const updated = [...form.umidades]; updated[idx].peso_capsula_2 = e.target.value; setForm(prev => ({ ...prev, umidades: updated })); setTimeout(() => calculateUmidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-100/30">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">t (%)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">{(u.teor_umidade_2 || 0).toFixed(2)}</td>
                  ))}
                </tr>
                <tr className="bg-gray-100/50">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-bold text-gray-400 text-xs">Média (%)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-sm font-bold text-gray-500 bg-gray-100/50">{(u.teor_umidade_media || 0).toFixed(2)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            </div>
            );
          })()}

          <div className="bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded-lg p-3 mt-4">
            <p className="text-sm text-[#00233B]">
              <span className="font-semibold">Umidade Média: </span>
              <span className="text-[#BFCF99] font-bold">{form.umidade_media != null ? Number(form.umidade_media).toFixed(2) : '-'}%</span>
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
                  <th className="border border-[#00233B]/20 px-3 py-2 text-left font-medium text-[#00233B] w-40">Campo</th>
                  {form.densidades.map((_, idx) => (
                    <th key={idx} className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Ponto {idx + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cilindro Nº</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input value={d.cilindro_numero} onChange={(e) => { const updated = [...form.densidades]; updated[idx].cilindro_numero = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cilindro+Solo Úmido (g)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={d.cilindro_solo_umido} onChange={(e) => { const updated = [...form.densidades]; updated[idx].cilindro_solo_umido = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); setTimeout(() => calculateDensidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Peso Cilindro (g)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={d.peso_cilindro} onChange={(e) => { const updated = [...form.densidades]; updated[idx].peso_cilindro = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); setTimeout(() => calculateDensidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Vol Cilindro (cm³)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={d.volume_cilindro} onChange={(e) => { const updated = [...form.densidades]; updated[idx].volume_cilindro = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); setTimeout(() => calculateDensidade(idx), 0); }} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                {form.correcao_densidade === "higroscopica" && (
                  <tr className="bg-white/20">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Água Adicionada (ml)</td>
                    {form.densidades.map((d, idx) => (
                      <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                        <Input type="number" step="0.01" value={d.agua_adicionada_ml || ''} onChange={(e) => { const updated = [...form.densidades]; updated[idx].agua_adicionada_ml = e.target.value; setForm(prev => ({ ...prev, densidades: updated })); setTimeout(() => calculateDensidade(idx), 0); }} className="h-8 text-xs" />
                      </td>
                    ))}
                  </tr>
                )}
                <tr className="bg-gray-100/30">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Peso Solo Úmido (g)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">{d.peso_solo_umido != null ? Number(d.peso_solo_umido).toFixed(3) : '-'}</td>
                  ))}
                </tr>
                {form.correcao_densidade === "higroscopica" && (
                  <>
                    <tr className="bg-gray-100/30">
                      <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Peso Seco (g)</td>
                      {form.densidades.map((d, idx) => (
                        <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">{d.peso_seco != null && d.peso_seco > 0 ? Number(d.peso_seco).toFixed(3) : '-'}</td>
                      ))}
                    </tr>
                    <tr className="bg-gray-100/30">
                      <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Umidade Calc. (%)</td>
                      {form.densidades.map((d, idx) => (
                        <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">{d.umidade_calculada != null && d.umidade_calculada > 0 ? Number(d.umidade_calculada).toFixed(2) : '-'}</td>
                      ))}
                    </tr>
                  </>
                )}
                <tr className="bg-gray-100/30">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Dens. Ap. Úmida (g/cm³)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">{d.dens_ap_umida != null ? Number(d.dens_ap_umida).toFixed(4) : '-'}</td>
                  ))}
                </tr>
                <tr className="bg-gray-100/50">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-bold text-gray-400 text-xs">Dens. Ap. Seca (g/cm³)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/50">{d.dens_ap_seca != null ? Number(d.dens_ap_seca).toFixed(4) : '-'}</td>
                  ))}
                </tr>
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