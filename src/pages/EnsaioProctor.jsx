import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProctorChart, { fitParabola } from "@/components/ensaios/ProctorChart";
import ProctorCBRExpansao from "@/components/ensaios/ProctorCBRExpansao";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, FileText } from "lucide-react";
import EnsaioLimites, { defaultLimites } from "@/components/ensaios/EnsaioLimites";

// Pure function — recalculates all 5 density points without any async/stale state issues
function recalcDensidades(densidades, umidade_higroscopica, correcao, umidades, umidade_media) {
  console.log('[recalcDensidades] correcao:', correcao);
  console.log('[recalcDensidades] umidades[0]:', umidades[0]);
  console.log('[recalcDensidades] umidade_higroscopica:', umidade_higroscopica);
  return densidades.map((d, index) => {
    const p1 = parseFloat(d.cilindro_solo_umido);
    const p2 = parseFloat(d.peso_cilindro);
    const v  = parseFloat(d.volume_cilindro);
    console.log(`[recalcDensidades] ponto ${index}: p1=${p1} p2=${p2} v=${v} peso_amostra_umida=${d.peso_amostra_umida} agua_adicionada=${d.agua_adicionada_ml}`);

    if (isNaN(p1) || isNaN(p2) || isNaN(v) || v <= 0) { console.log(`[recalcDensidades] ponto ${index}: retornando sem calcular (valores inválidos)`); return d; }

    const pesoSoloUmido = p1 - p2;
    const gammaW = pesoSoloUmido / v;

    let pesoSeco = 0;
    let umidadeCalc = 0;
    let tW = 0;

    if (correcao === "higroscopica") {
      const uhigro = umidades[0]?.teor_umidade_media || parseFloat(umidade_higroscopica) || 0;
      const pesoAmUmida = parseFloat(d.peso_amostra_umida);
      console.log(`[higroscopica] ponto ${index}: uhigro=${uhigro} pesoAmUmida=${pesoAmUmida}`);
      if (!isNaN(uhigro) && uhigro > 0 && !isNaN(pesoAmUmida) && pesoAmUmida > 0) {
        pesoSeco = (pesoAmUmida / (100 + uhigro)) * 100;
        console.log(`[higroscopica] ponto ${index}: pesoSeco=${pesoSeco}`);
        const aguaAdd = parseFloat(d.agua_adicionada_ml);
        if (!isNaN(aguaAdd) && pesoSeco > 0) {
          // Umidade Calc = (Água Adicionada / Peso Seco) * 100 + Uhigro
          umidadeCalc = (aguaAdd / pesoSeco) * 100 + uhigro;
        }
      }
      // tW = média da umidade higroscópica calculada na tabela de umidade
      tW = umidades[0]?.teor_umidade_media || 0;
    } else {
      tW = umidades[index]?.teor_umidade_media || umidade_media || 0;
    }

    // Dens. Ap. Seca = γw / (1 + w/100)
    // Para modo higroscópico, usa a umidade calculada; para ponto a ponto, usa tW
    const wParaSeca = correcao === "higroscopica" ? umidadeCalc : tW;
    const gammaS = wParaSeca > 0 ? gammaW / (1 + wParaSeca / 100) : 0;

    return {
      ...d,
      peso_solo_umido: parseFloat(pesoSoloUmido.toFixed(2)),
      peso_seco: parseFloat(pesoSeco.toFixed(2)),
      umidade_calculada: parseFloat(umidadeCalc.toFixed(2)),
      dens_ap_umida: parseFloat(gammaW.toFixed(3)),
      dens_ap_seca: parseFloat(gammaS.toFixed(3)),
    };
  });
}

export default function EnsaioProctorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recordId = searchParams.get("id");
  const obraId = searchParams.get("obra_id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    disco_especial: "6.20",
    soquete: "Grande",
    num_golpes: 12,
    energia_compactacao: "Intermediária",
    correcao_densidade: "higroscopica",
    umidade_higroscopica: "",
    umidades: Array(5).fill(null).map(() => ({
      capsula_numero_1: "",
      capsula_solo_umido_1: "",
      capsula_solo_seco_1: "",
      peso_capsula_1: "",
      teor_umidade_1: 0,
      capsula_numero_2: "",
      capsula_solo_umido_2: "",
      capsula_solo_seco_2: "",
      peso_capsula_2: "",
      teor_umidade_2: 0,
      teor_umidade_media: 0,
    })),
    densidades: Array(5).fill(null).map(() => ({
      cilindro_numero: "",
      cilindro_solo_umido: "",
      peso_cilindro: "",
      peso_solo_umido: 0,
      volume_cilindro: "",
      agua_adicionada_ml: "",
      peso_amostra_umida: "",
      peso_seco: 0,
      umidade_calculada: 0,
      dens_ap_umida: 0,
      dens_ap_seca: 0,
    })),
    umidade_media: 0,
    densidade_maxima_seca: "",
    umidade_otima: "",
    isc_cbr: "",
    expansao: "",
    observacoes: "",
    realizar_cbr_expansao: false,
    realizar_limites: false,
    limites: defaultLimites(),
    cbr_fator_anel: "",
    cbr_cilindros: Array(5).fill(null).map((_, i) => ({
      cilindro_numero: "",
      fator_anel: "",
      leituras: Array(9).fill(""),
      isc254: null,
      isc508: null,
      isc: null,
    })),
    expansao_cilindros: Array(5).fill(null).map(() => ({
      cilindro_numero: "",
      data: new Date().toISOString().split("T")[0],
      hora: "",
      altura_inicial: "",
      leitura_1dia: "",
      leitura_2dia: "",
      leitura_3dia: "",
      leitura_4dia: "",
      massa_solo_final: "",
    })),
    status: "rascunho",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await User.me();
      setForm(prev => ({ ...prev, laboratorista_name: userData.laboratorista_name || userData.full_name }));

      const obrasData = await Obra.list();
      const userAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

      if (userAccessLevel === 'user') {
        // Laboratorista: filtrar apenas obras da sua regional
        const regionaisData = await base44.entities.Regional.list();
        const regionaisDoLab = regionaisData.filter(r =>
          (r.laboratoristas_responsaveis || []).some(email => email.toLowerCase() === userData.email.toLowerCase())
        );
        const regionalIds = regionaisDoLab.map(r => r.id);
        setObras(obrasData.filter(o => regionalIds.includes(o.regional_id)));
      } else {
        // Admin, gestor, sala_técnica: mostrar todas as obras
        setObras(obrasData);
      }

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

  const handleObraChange = async (id) => {
    setForm(prev => ({ ...prev, obra_id: id, project_id: "" }));
    if (id) {
      const obra = obras.find(o => o.id === id);
      if (obra?.project_ids?.length > 0) {
        const projs = await Promise.all(obra.project_ids.map(pid => base44.entities.Project.get(pid)));
        setProjetos(projs);
      }
    }
  };

  // Update a single umidade field and recalculate
  const updateUmidade = (index, field, value) => {
    setForm(prev => {
      const updated = prev.umidades.map((u, i) => i === index ? { ...u, [field]: value } : u);
      const u = updated[index];

      // Recalculate teors for this point
      const p4_1 = parseFloat(u.capsula_solo_umido_1), p5_1 = parseFloat(u.capsula_solo_seco_1), p6_1 = parseFloat(u.peso_capsula_1);
      const p4_2 = parseFloat(u.capsula_solo_umido_2), p5_2 = parseFloat(u.capsula_solo_seco_2), p6_2 = parseFloat(u.peso_capsula_2);
      let teor1 = 0, teor2 = 0;
      if (!isNaN(p4_1) && !isNaN(p5_1) && !isNaN(p6_1)) { const pss = p5_1 - p6_1; teor1 = pss > 0 ? (p4_1 - p5_1) / pss * 100 : 0; }
      if (!isNaN(p4_2) && !isNaN(p5_2) && !isNaN(p6_2)) { const pss = p5_2 - p6_2; teor2 = pss > 0 ? (p4_2 - p5_2) / pss * 100 : 0; }
      const count = (teor1 > 0 ? 1 : 0) + (teor2 > 0 ? 1 : 0);
      const media = count > 0 ? (teor1 + teor2) / count : 0;

      updated[index] = { ...updated[index], teor_umidade_1: parseFloat(teor1.toFixed(2)), teor_umidade_2: parseFloat(teor2.toFixed(2)), teor_umidade_media: parseFloat(media.toFixed(2)) };

      const valid = updated.filter(p => p.teor_umidade_media > 0);
      const umidade_media = valid.length > 0 ? parseFloat((valid.reduce((s, p) => s + p.teor_umidade_media, 0) / valid.length).toFixed(2)) : 0;

      // Re-recalculate densidades with the new umidade values
      const densidadesRecalc = recalcDensidades(prev.densidades, prev.umidade_higroscopica, prev.correcao_densidade, updated, umidade_media);

      return { ...prev, umidades: updated, umidade_media, densidades: densidadesRecalc };
    });
  };

  // Update a single densidade field and recalculate all
  const updateDensidade = (index, field, value) => {
    setForm(prev => {
      const updated = prev.densidades.map((d, i) => i === index ? { ...d, [field]: value } : d);
      return { ...prev, densidades: recalcDensidades(updated, prev.umidade_higroscopica, prev.correcao_densidade, prev.umidades, prev.umidade_media) };
    });
  };

  // Update peso_amostra_umida for ALL points at once (shared field)
  const updatePesoAmUmidaAll = (value) => {
    setForm(prev => {
      const updated = prev.densidades.map(d => ({ ...d, peso_amostra_umida: value }));
      return { ...prev, densidades: recalcDensidades(updated, prev.umidade_higroscopica, prev.correcao_densidade, prev.umidades, prev.umidade_media) };
    });
  };

  const handleSave = async (status) => {
    // Validate required fields for "Dados da Obra" and "Dados do Material" sections
    const requiredFields = [
      { field: 'obra_id', label: 'Obra' },
      { field: 'rodovia', label: 'Rodovia' },
      { field: 'trecho', label: 'Trecho' },
      { field: 'local_coleta', label: 'Local de Coleta' },
      { field: 'data_ensaio', label: 'Data do Ensaio' },
      { field: 'camada', label: 'Camada' },
      { field: 'material', label: 'Material' },
      { field: 'procedencia', label: 'Procedência' },
    ];

    const emptyFields = requiredFields.filter(f => !form[f.field]);
    if (emptyFields.length > 0) {
      alert(`Preencha os campos obrigatórios:\n${emptyFields.map(f => f.label).join(', ')}`);
      setSaving(false);
      return;
    }

    setSaving(true);
    try {
      // Sanitize: convert empty strings to null for number fields
      const sanitizeNum = (v) => (v === '' || v === null || v === undefined) ? null : isNaN(Number(v)) ? null : Number(v);
      const numFields1 = ['capsula_solo_umido_1','capsula_solo_seco_1','peso_capsula_1','teor_umidade_1','teor_umidade_2','teor_umidade_media'];
      const numFields2 = ['capsula_solo_umido_2','capsula_solo_seco_2','peso_capsula_2'];
      const cleanUmidades = form.umidades.map(u => ({
        ...u,
        ...Object.fromEntries([...numFields1, ...numFields2].map(f => [f, sanitizeNum(u[f])]))
      }));
      const cleanDensidades = form.densidades.map(d => ({
        ...d,
        cilindro_solo_umido: sanitizeNum(d.cilindro_solo_umido),
        peso_cilindro: sanitizeNum(d.peso_cilindro),
        volume_cilindro: sanitizeNum(d.volume_cilindro),
        agua_adicionada_ml: sanitizeNum(d.agua_adicionada_ml),
        peso_amostra_umida: sanitizeNum(d.peso_amostra_umida),
      }));
      const cleanCBR = (form.cbr_cilindros || []).map(c => ({
        ...c,
        fator_anel: sanitizeNum(c.fator_anel),
        isc254: sanitizeNum(c.isc254),
        isc508: sanitizeNum(c.isc508),
        isc: sanitizeNum(c.isc),
        leituras: (c.leituras || []).map(l => sanitizeNum(l)).map(l => l === null ? 0 : l),
      }));
      const cleanExpansao = (form.expansao_cilindros || []).map(e => ({
        ...e,
        altura_inicial: sanitizeNum(e.altura_inicial),
        leitura_1dia: sanitizeNum(e.leitura_1dia),
        leitura_2dia: sanitizeNum(e.leitura_2dia),
        leitura_3dia: sanitizeNum(e.leitura_3dia),
        leitura_4dia: sanitizeNum(e.leitura_4dia),
        massa_solo_final: sanitizeNum(e.massa_solo_final),
        diferenca: sanitizeNum(e.diferenca),
        expansao_pct: sanitizeNum(e.expansao_pct),
      }));
      const data = {
        ...form,
        status,
        umidades: cleanUmidades,
        densidades: cleanDensidades,
        cbr_cilindros: cleanCBR,
        expansao_cilindros: cleanExpansao,
        cbr_fator_anel: sanitizeNum(form.cbr_fator_anel),
        umidade_higroscopica: sanitizeNum(form.umidade_higroscopica),
        densidade_maxima_seca: sanitizeNum(form.densidade_maxima_seca),
        umidade_otima: sanitizeNum(form.umidade_otima),
        isc_cbr: sanitizeNum(form.isc_cbr),
        expansao: sanitizeNum(form.expansao),
        num_golpes: sanitizeNum(form.num_golpes),
        umidade_media: sanitizeNum(form.umidade_media),
      };
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

  const isHigro = form.correcao_densidade === "higroscopica";
  const umidadePoints = isHigro ? form.umidades.slice(0, 1) : form.umidades;

  // Collect valid (umidade, dens_ap_seca) pairs from the filled density points
  const chartPoints = useMemo(() => {
    return form.densidades
      .map((d, originalIdx) => ({
        x: isHigro ? d.umidade_calculada : (form.umidades[originalIdx]?.teor_umidade_media || 0),
        y: d.dens_ap_seca,
      }))
      .filter(p => p.x > 0 && p.y > 0);
  }, [form.densidades, form.umidades, isHigro]);

  const parabola = useMemo(() => fitParabola(chartPoints), [chartPoints]);

  const densMaxAuto = parabola ? parabola.gamma_max.toFixed(4) : "";
  const umidOtimaAuto = parabola ? parabola.w_otima.toFixed(2) : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#BFCF99]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 min-h-screen bg-transparent">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00233B]">Ensaio Proctor</h1>
          <p className="text-[#00233B]/80 mt-1">ABNT NBR 7182:2016 - Compactação de Solos</p>
        </div>
        {recordId && (
          <Button
            variant="outline"
            onClick={() => window.open(`/RelatorioProctor?id=${recordId}`, '_blank')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Ver Relatório
          </Button>
        )}
      </div>

      {/* Dados da Obra */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader><CardTitle className="text-lg text-[#00233B]">Dados da Obra</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#00233B]">Obra *</Label>
              <Select value={form.obra_id} onValueChange={handleObraChange}>
                <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                <SelectContent>{obras.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#00233B]">Projeto</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm(prev => ({ ...prev, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                <SelectContent>{projetos.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[#00233B]">Cliente</Label><Input value={form.cliente} onChange={(e) => setForm(prev => ({ ...prev, cliente: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Contrato</Label><Input value={form.contrato} onChange={(e) => setForm(prev => ({ ...prev, contrato: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Rodovia *</Label><Input value={form.rodovia} onChange={(e) => setForm(prev => ({ ...prev, rodovia: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Trecho *</Label><Input value={form.trecho} onChange={(e) => setForm(prev => ({ ...prev, trecho: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Local de Coleta *</Label><Input value={form.local_coleta} onChange={(e) => setForm(prev => ({ ...prev, local_coleta: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Data do Ensaio *</Label><Input type="date" value={form.data_ensaio} onChange={(e) => setForm(prev => ({ ...prev, data_ensaio: e.target.value }))} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Material */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader><CardTitle className="text-lg text-[#00233B]">Dados do Material</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-[#00233B]">Camada *</Label><Input value={form.camada} onChange={(e) => setForm(prev => ({ ...prev, camada: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Material *</Label><Input value={form.material} onChange={(e) => setForm(prev => ({ ...prev, material: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Procedência *</Label><Input value={form.procedencia} onChange={(e) => setForm(prev => ({ ...prev, procedencia: e.target.value }))} /></div>
            <div>
              <Label className="text-[#00233B]">Disco Especial</Label>
              <Select value={form.disco_especial} onValueChange={(v) => setForm(prev => ({ ...prev, disco_especial: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="5.20">5.20</SelectItem><SelectItem value="6.20">6.20</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#00233B]">Soquete</Label>
              <Select value={form.soquete} onValueChange={(v) => setForm(prev => ({ ...prev, soquete: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pequeno">Pequeno</SelectItem><SelectItem value="Grande">Grande</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-[#00233B]">Nº de Golpes</Label><Input type="number" value={form.num_golpes} onChange={(e) => setForm(prev => ({ ...prev, num_golpes: parseInt(e.target.value) }))} /></div>
            <div>
              <Label className="text-[#00233B]">Energia de Compactação</Label>
              <Select value={form.energia_compactacao} onValueChange={(v) => setForm(prev => ({ ...prev, energia_compactacao: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Intermediária">Intermediária</SelectItem><SelectItem value="Modificada">Modificada</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Umidades */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader><CardTitle className="text-lg text-[#00233B]">Umidade dos Pontos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <Label className="text-[#00233B]">Tipo de Correção de Densidade</Label>
            <Select value={form.correcao_densidade} onValueChange={(v) => setForm(prev => ({ ...prev, correcao_densidade: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="higroscopica">Umidade Higroscópica</SelectItem>
                <SelectItem value="ponto_a_ponto">Umidade Ponto a Ponto</SelectItem>
              </SelectContent>
            </Select>
          </div>


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
                <tr className="bg-[#00233B]/10">
                  <td colSpan={umidadePoints.length + 1} className="border border-[#00233B]/20 px-3 py-1 font-semibold text-[#00233B] text-xs">Amostra 1</td>
                </tr>
                {[
                  { label: "Cáps. Nº", field: "capsula_numero_1", type: "text" },
                  { label: "Cap+Solo Úm. (g)", field: "capsula_solo_umido_1", type: "number" },
                  { label: "Cap+Solo Sec. (g)", field: "capsula_solo_seco_1", type: "number" },
                  { label: "Peso Cap (g)", field: "peso_capsula_1", type: "number" },
                ].map(({ label, field, type }) => (
                  <tr key={field} className="bg-white/10">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">{label}</td>
                    {umidadePoints.map((u, idx) => (
                      <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                        <Input type={type} step="0.01" value={u[field] || ''} onChange={(e) => updateUmidade(idx, field, e.target.value)} className="h-8 text-xs" />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-100/30">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">t (%)</td>
                  {umidadePoints.map((u, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">{(u.teor_umidade_1 || 0).toFixed(2)}</td>
                  ))}
                </tr>
                {isHigro && (
                  <>
                    <tr className="bg-[#00233B]/10">
                      <td colSpan={umidadePoints.length + 1} className="border border-[#00233B]/20 px-3 py-1 font-semibold text-[#00233B] text-xs">Amostra 2</td>
                    </tr>
                    {[
                      { label: "Cáps. Nº", field: "capsula_numero_2", type: "text" },
                      { label: "Cap+Solo Úm. (g)", field: "capsula_solo_umido_2", type: "number" },
                      { label: "Cap+Solo Sec. (g)", field: "capsula_solo_seco_2", type: "number" },
                      { label: "Peso Cap (g)", field: "peso_capsula_2", type: "number" },
                    ].map(({ label, field, type }) => (
                      <tr key={field} className="bg-white/10">
                        <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">{label}</td>
                        {umidadePoints.map((u, idx) => (
                          <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                            <Input type={type} step="0.01" value={u[field] || ''} onChange={(e) => updateUmidade(idx, field, e.target.value)} className="h-8 text-xs" />
                          </td>
                        ))}
                      </tr>
                    ))}
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
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded-lg p-3 mt-4">
            <p className="text-sm text-[#00233B]">
              <span className="font-semibold">Umidade Média: </span>
              <span className="text-[#BFCF99] font-bold">{form.umidade_media != null ? Number(form.umidade_media).toFixed(2) : '-'}%</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Peso Amostra Úmida — apenas modo higroscópico */}
      {isHigro && (
        <Card className="bg-white/20 backdrop-blur-lg border-white/20">
          <CardHeader><CardTitle className="text-lg text-[#00233B]">Peso Amostra Úmida por Ponto</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#00233B]/10">
                    <th className="border border-[#00233B]/20 px-3 py-2 text-left font-medium text-[#00233B] w-40">Campo</th>
                    <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Massa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white/20">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Peso Amostra Úmida (g)</td>
                    <td className="border border-[#00233B]/20 px-1 py-1">
                      <Input
                        type="number" step="0.01"
                        value={form.densidades[0]?.peso_amostra_umida || ''}
                        onChange={(e) => updatePesoAmUmidaAll(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                  </tr>
                  <tr className="bg-gray-100/30">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Peso Seco (g)</td>
                    <td className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">
                      {form.densidades[0]?.peso_seco > 0 ? Number(form.densidades[0].peso_seco).toFixed(2) : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Densidades */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader><CardTitle className="text-lg text-[#00233B]">Compactação - Densidade</CardTitle></CardHeader>
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
                {/* Cilindro Nº */}
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cilindro Nº</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input value={d.cilindro_numero} onChange={(e) => setForm(prev => { const u = prev.densidades.map((x,i) => i===idx ? {...x, cilindro_numero: e.target.value} : x); return {...prev, densidades: u}; })} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                {/* Cilindro+Solo Úmido */}
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Cilindro+Solo Úmido (g)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={d.cilindro_solo_umido} onChange={(e) => updateDensidade(idx, 'cilindro_solo_umido', e.target.value)} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                {/* Peso Cilindro */}
                <tr className="bg-white/20">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Peso Cilindro (g)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={d.peso_cilindro} onChange={(e) => updateDensidade(idx, 'peso_cilindro', e.target.value)} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                {/* Vol Cilindro */}
                <tr className="bg-white/10">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Vol Cilindro (cm³)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                      <Input type="number" step="0.01" value={d.volume_cilindro} onChange={(e) => updateDensidade(idx, 'volume_cilindro', e.target.value)} className="h-8 text-xs" />
                    </td>
                  ))}
                </tr>
                {/* Peso Amostra Úmida — individual por ponto */}
                {isHigro && (
                  <tr className="bg-white/20">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Peso Amostra Úmida (g)</td>
                    {form.densidades.map((d, idx) => (
                      <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                        <Input type="number" step="0.01" value={d.peso_amostra_umida || ''} onChange={(e) => updateDensidade(idx, 'peso_amostra_umida', e.target.value)} className="h-8 text-xs" />
                      </td>
                    ))}
                  </tr>
                )}
                {/* Água Adicionada */}
                {isHigro && (
                  <tr className="bg-white/20">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-medium text-[#00233B] text-xs">Água Adicionada (ml)</td>
                    {form.densidades.map((d, idx) => (
                      <td key={idx} className="border border-[#00233B]/20 px-1 py-1">
                        <Input type="number" step="0.01" value={d.agua_adicionada_ml || ''} onChange={(e) => updateDensidade(idx, 'agua_adicionada_ml', e.target.value)} className="h-8 text-xs" />
                      </td>
                    ))}
                  </tr>
                )}
                {/* Peso Solo Úmido */}
                <tr className="bg-gray-100/30">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Peso Solo Úmido (g)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">
                      {d.peso_solo_umido > 0 ? Number(d.peso_solo_umido).toFixed(2) : '-'}
                    </td>
                  ))}
                </tr>
                {/* Peso Seco */}
                {isHigro && (
                  <tr className="bg-gray-100/30">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Peso Seco (g)</td>
                    {form.densidades.map((d, idx) => (
                      <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">
                        {d.peso_seco > 0 ? Number(d.peso_seco).toFixed(2) : '-'}
                      </td>
                    ))}
                  </tr>
                )}
                {/* Umidade Calculada */}
                {isHigro && (
                  <tr className="bg-gray-100/30">
                    <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Umidade Calc. (%)</td>
                    {form.densidades.map((d, idx) => (
                      <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">
                        {d.umidade_calculada > 0 ? Number(d.umidade_calculada).toFixed(2) : '-'}
                      </td>
                    ))}
                  </tr>
                )}
                {/* Dens. Ap. Úmida */}
                <tr className="bg-gray-100/30">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-semibold text-gray-400 text-xs">Dens. Ap. Úmida (g/cm³)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/40">
                      {d.dens_ap_umida > 0 ? Number(d.dens_ap_umida).toFixed(3) : '-'}
                    </td>
                  ))}
                </tr>
                {/* Dens. Ap. Seca */}
                <tr className="bg-gray-100/50">
                  <td className="border border-[#00233B]/20 px-3 py-2 font-bold text-gray-400 text-xs">Dens. Ap. Seca (g/cm³)</td>
                  {form.densidades.map((d, idx) => (
                    <td key={idx} className="border border-[#00233B]/20 px-2 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-100/50">
                      {d.dens_ap_seca > 0 ? Number(d.dens_ap_seca).toFixed(3) : '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Proctor */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Gráfico de Compactação (Prévia)</CardTitle>
          <div className="flex flex-wrap gap-4 mt-1 items-center">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              chartPoints.length >= 3 ? 'bg-[#BFCF99]/40 text-[#00233B]' : 'bg-red-100 text-red-600'
            }`}>
              {chartPoints.length} ponto{chartPoints.length !== 1 ? 's' : ''} válido{chartPoints.length !== 1 ? 's' : ''}
              {chartPoints.length < 3 && ` — mínimo 3 para calcular`}
            </span>
            {parabola && (
              <>
                <p className="text-sm text-[#00233B]/80">
                  <span className="font-semibold">γd máx: </span>
                  <span className="text-[#00233B] font-bold">{parabola.gamma_max.toFixed(4)} g/cm³</span>
                </p>
                <p className="text-sm text-[#00233B]/80">
                  <span className="font-semibold">w ótima: </span>
                  <span className="text-[#00233B] font-bold">{parabola.w_otima.toFixed(2)}%</span>
                </p>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProctorChart points={chartPoints} parabola={parabola} />
          {chartPoints.length > 0 && chartPoints.length < 3 && (
            <p className="text-xs text-[#00233B]/50 text-center mt-2">Preencha mais {3 - chartPoints.length} ponto(s) para gerar a curva de regressão</p>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader><CardTitle className="text-lg text-[#00233B]">Resultados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#00233B]">
                Densidade Máxima Seca (g/cm³)
                {densMaxAuto && <span className="ml-2 text-xs text-[#BFCF99] font-normal">(calculado: {densMaxAuto})</span>}
              </Label>
              <Input type="number" step="0.0001"
                value={form.densidade_maxima_seca || densMaxAuto}
                onChange={(e) => setForm(prev => ({ ...prev, densidade_maxima_seca: e.target.value }))}
                placeholder={densMaxAuto || "—"}
              />
            </div>
            <div>
              <Label className="text-[#00233B]">
                Umidade Ótima (%)
                {umidOtimaAuto && <span className="ml-2 text-xs text-[#BFCF99] font-normal">(calculado: {umidOtimaAuto})</span>}
              </Label>
              <Input type="number" step="0.01"
                value={form.umidade_otima || umidOtimaAuto}
                onChange={(e) => setForm(prev => ({ ...prev, umidade_otima: e.target.value }))}
                placeholder={umidOtimaAuto || "—"}
              />
            </div>
            <div><Label className="text-[#00233B]">ISC/CBR (%)</Label><Input type="number" step="0.01" value={form.isc_cbr} onChange={(e) => setForm(prev => ({ ...prev, isc_cbr: e.target.value }))} /></div>
            <div><Label className="text-[#00233B]">Expansão (%)</Label><Input type="number" step="0.01" value={form.expansao} onChange={(e) => setForm(prev => ({ ...prev, expansao: e.target.value }))} /></div>
          </div>
          <div>
            <Label className="text-[#00233B]">Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))} rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Ensaio de Limites — Opcional */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="realizar_limites"
              checked={!!form.realizar_limites}
              onChange={e => setForm(prev => ({ ...prev, realizar_limites: e.target.checked }))}
              className="w-4 h-4 accent-[#00233B]"
            />
            <label htmlFor="realizar_limites" className="text-lg font-semibold text-[#00233B] cursor-pointer select-none">
              Realizar Ensaios Físicos de Caracterização <span className="text-sm font-normal text-[#00233B]/60">(ABNT NBR 7181/2025 | 6459/2017 | 7180/2016)</span>
            </label>
          </div>
        </CardHeader>
        {form.realizar_limites && (
          <CardContent className="pt-0">
            <EnsaioLimites
              data={form.limites || defaultLimites()}
              onChange={limites => setForm(prev => ({ ...prev, limites }))}
            />
          </CardContent>
        )}
      </Card>

      {/* CBR / Expansão — Opcional */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="realizar_cbr"
              checked={!!form.realizar_cbr_expansao}
              onChange={e => setForm(prev => ({ ...prev, realizar_cbr_expansao: e.target.checked }))}
              className="w-4 h-4 accent-[#00233B]"
            />
            <label htmlFor="realizar_cbr" className="text-lg font-semibold text-[#00233B] cursor-pointer select-none">
              Realizar Ensaio de ISC/CBR e Expansão <span className="text-sm font-normal text-[#00233B]/60">(ABNT 9895 / DNIT 172)</span>
            </label>
          </div>
        </CardHeader>
        {form.realizar_cbr_expansao && (
          <CardContent className="pt-0">
            <ProctorCBRExpansao form={form} setForm={setForm} />
          </CardContent>
        )}
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