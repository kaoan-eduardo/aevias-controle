import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertTriangle, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const getCamadaInicial = (numero) => ({
  numero,
  prof_de: numero === 1 ? 0 : null,
  prof_ate: null,
  espessura: null,
  na: null,
  classificacao_1: ""
});

const CAMADAS_PADRAO = [1, 2, 3, 4, 5].map(getCamadaInicial);

const getDensidadeInicial = () => ({
  camada_ensaiada: "",
  peso_frasco_antes: null, peso_frasco_depois: null,
  peso_areia_deslocada: null, peso_areia_funil_placa: null,
  peso_areia_cavidade: null,
  massa_esp_aparente_areia: 1.2,
  volume_buraco: null,
  peso_solo_recipiente: null, peso_recipiente: null, peso_solo: null,
  densidade_aparente_solo_umido: null,
  peso_solo_umido: null, peso_solo_seco: null, peso_agua: null,
  teor_umidade: null, densidade_aparente_solo_seco: null
});

const getInitialFormData = () => ({
  obra_id: "",
  data: new Date().toISOString().split('T')[0],
  cliente: "",
  pista: "",
  bordo: "",
  rodovia: "",
  km: "",
  furo: "",
  operador: "",
  face_classificacao_1: "",
  camadas: CAMADAS_PADRAO,
  umidade_natural: {
    camada_ensaiada_1: "", camada_ensaiada_2: "",
    no_capsula_1: "", no_capsula_2: "",
    massa_capsula_1: null, massa_capsula_2: null,
    massa_cap_solo_umido_1: null, massa_cap_solo_umido_2: null,
    massa_cap_solo_seco_1: null, massa_cap_solo_seco_2: null,
    massa_agua_1: null, massa_agua_2: null,
    massa_solo_seco_1: null, massa_solo_seco_2: null,
    umidade_1: null, umidade_2: null
  },
  umidade_natural_2: null,
  ensaio_insitu_realizado: false,
  densidades_in_situ: [getDensidadeInicial()],
  observacoes: "",
  fotos: []
});

const calcularUmidade = (un, lado) => {
  const capSoloUmido = un[`massa_cap_solo_umido_${lado}`];
  const capSoloSeco = un[`massa_cap_solo_seco_${lado}`];
  const capsula = un[`massa_capsula_${lado}`];
  if (capSoloUmido && capSoloSeco && capsula !== null) {
    const agua = parseFloat((capSoloUmido - capSoloSeco).toFixed(2));
    const soloSeco = parseFloat((capSoloSeco - capsula).toFixed(2));
    const umidade = soloSeco > 0 ? parseFloat(((agua / soloSeco) * 100).toFixed(2)) : null;
    return { agua, soloSeco, umidade };
  }
  return { agua: null, soloSeco: null, umidade: null };
};

const calcularDensidade = (d) => {
  const areiaDeslocada = d.peso_areia_funil_placa !== null && d.peso_frasco_antes !== null && d.peso_frasco_depois !== null
    ? parseFloat((d.peso_frasco_antes - d.peso_frasco_depois).toFixed(2)) : null;
  const areiaCavidade = areiaDeslocada !== null && d.peso_areia_funil_placa !== null
    ? parseFloat((areiaDeslocada - d.peso_areia_funil_placa).toFixed(2)) : null;
  const volumeBuraco = areiaCavidade !== null && d.massa_esp_aparente_areia
    ? parseFloat((areiaCavidade / d.massa_esp_aparente_areia).toFixed(3)) : null;
  const pesoSolo = d.peso_solo_recipiente !== null && d.peso_recipiente !== null
    ? parseFloat((d.peso_solo_recipiente - d.peso_recipiente).toFixed(2)) : null;
  const densidadeUmida = pesoSolo !== null && volumeBuraco
    ? parseFloat((pesoSolo / volumeBuraco).toFixed(3)) : null;
  const pesoAgua = d.peso_solo_umido !== null && d.peso_solo_seco !== null
    ? parseFloat((d.peso_solo_umido - d.peso_solo_seco).toFixed(2)) : null;
  const teorUmidade = pesoAgua !== null && d.peso_solo_seco
    ? parseFloat(((pesoAgua / d.peso_solo_seco) * 100).toFixed(2)) : null;
  const densidadeSeca = densidadeUmida !== null && teorUmidade !== null
    ? parseFloat((densidadeUmida / (1 + teorUmidade / 100)).toFixed(3)) : null;
  return {
    peso_areia_deslocada: areiaDeslocada,
    peso_areia_cavidade: areiaCavidade,
    volume_buraco: volumeBuraco,
    peso_solo: pesoSolo,
    densidade_aparente_solo_umido: densidadeUmida,
    peso_agua: pesoAgua,
    teor_umidade: teorUmidade,
    densidade_aparente_solo_seco: densidadeSeca
  };
};

export default function BoletimSondagemTradoPage() {
  const [formData, setFormData] = useState(getInitialFormData());
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingBoletim, setEditingBoletim] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isApproved = editingBoletim?.approved === true;
  const isEditable = !isApproved;

  useEffect(() => { loadInitialData(); }, [location.search]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [obrasData, regionaisData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Regional.list()
      ]);

      const accessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');
      let availableObras = obrasData;

      if (accessLevel === 'user') {
        const regional = regionaisData.find(r =>
          (r.laboratoristas_responsaveis || []).some(e => e.toLowerCase() === currentUser.email.toLowerCase())
        );
        availableObras = regional
          ? obrasData.filter(o => o.regional_id === regional.id && o.status === 'em_andamento' && o.tipo_obra === 'sondagem')
          : [];
      } else {
        availableObras = obrasData.filter(o => o.tipo_obra === 'sondagem');
      }

      setObras(availableObras);
      setRegionais(regionaisData);

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const boletimToEdit = await base44.entities.BoletimSondagemTrado.get(editId);
        if (currentUser.role === 'admin' || (boletimToEdit.created_by === currentUser.email && boletimToEdit.approved !== true)) {
          setEditingBoletim(boletimToEdit);
          const initial = getInitialFormData();
          let densidades = boletimToEdit.densidades_in_situ?.length > 0
            ? boletimToEdit.densidades_in_situ
            : [getDensidadeInicial()];
          setFormData({
            ...initial,
            ...boletimToEdit,
            data: boletimToEdit.data ? new Date(boletimToEdit.data).toISOString().split('T')[0] : initial.data,
            camadas: boletimToEdit.camadas?.length > 0 ? boletimToEdit.camadas : initial.camadas,
            umidade_natural: { ...initial.umidade_natural, ...(boletimToEdit.umidade_natural || {}) },
            densidades_in_situ: densidades,
            ensaio_insitu_realizado: boletimToEdit.ensaio_insitu_realizado ?? false,
            fotos: Array.isArray(boletimToEdit.fotos) ? boletimToEdit.fotos : []
          });
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
        }
      } else {
        const firstObra = availableObras.length > 0 ? availableObras[0] : null;
        const regional = firstObra ? regionaisData.find(r => r.id === firstObra.regional_id) : null;
        setFormData(prev => ({
          ...prev,
          operador: currentUser.laboratorista_name || currentUser.full_name,
          obra_id: firstObra?.id || "",
          cliente: regional?.cliente || ""
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados.");
      navigate(createPageUrl('MeusEnsaios'));
    } finally {
      setLoading(false);
    }
  };

  const handleObraChange = useCallback((obraId) => {
    const obra = obras.find(o => o.id === obraId);
    const regional = obra ? regionais.find(r => r.id === obra.regional_id) : null;
    setFormData(prev => ({ ...prev, obra_id: obraId, rodovia: "", cliente: regional?.cliente || prev.cliente }));
  }, [obras, regionais]);

  const handleCamadaChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newCamadas = prev.camadas.map(c => ({ ...c }));
      newCamadas[index] = { ...newCamadas[index], [field]: value };
      if (field === 'prof_de' && index === 0) {
        const { prof_de, prof_ate } = newCamadas[0];
        if (prof_de !== null && prof_ate !== null) newCamadas[0].espessura = parseFloat((prof_ate - prof_de).toFixed(2));
        else newCamadas[0].espessura = null;
      }
      if (field === 'prof_ate') {
        const { prof_de, prof_ate } = newCamadas[index];
        if (prof_de !== null && prof_ate !== null) newCamadas[index].espessura = parseFloat((prof_ate - prof_de).toFixed(2));
        else newCamadas[index].espessura = null;
        if (index + 1 < newCamadas.length) {
          newCamadas[index + 1].prof_de = prof_ate;
          const nextAte = newCamadas[index + 1].prof_ate;
          if (prof_ate !== null && nextAte !== null) newCamadas[index + 1].espessura = parseFloat((nextAte - prof_ate).toFixed(2));
          else newCamadas[index + 1].espessura = null;
        }
      }
      return { ...prev, camadas: newCamadas };
    });
  }, []);

  const adicionarCamada = useCallback(() => {
    setFormData(prev => {
      if (prev.camadas.length >= 15) return prev;
      const ultima = prev.camadas[prev.camadas.length - 1];
      const novaDe = ultima?.prof_ate ?? null;
      const novaCamada = { ...getCamadaInicial(prev.camadas.length + 1), prof_de: novaDe };
      return { ...prev, camadas: [...prev.camadas, novaCamada] };
    });
  }, []);

  const removerCamada = useCallback((index) => {
    setFormData(prev => {
      if (prev.camadas.length <= 1) return prev;
      const newCamadas = prev.camadas.filter((_, i) => i !== index).map((c, i) => ({ ...c, numero: i + 1 }));
      for (let i = index; i < newCamadas.length; i++) {
        if (i === 0) newCamadas[0].prof_de = 0;
        else newCamadas[i].prof_de = newCamadas[i - 1].prof_ate ?? null;
        const { prof_de, prof_ate } = newCamadas[i];
        newCamadas[i].espessura = prof_de !== null && prof_ate !== null ? parseFloat((prof_ate - prof_de).toFixed(2)) : null;
      }
      return { ...prev, camadas: newCamadas };
    });
  }, []);

  const handleUmidadeChange = useCallback((field, value) => {
    setFormData(prev => {
      const un = { ...prev.umidade_natural, [field]: value };
      for (const lado of [1, 2]) {
        const { agua, soloSeco, umidade } = calcularUmidade(un, lado);
        un[`massa_agua_${lado}`] = agua;
        un[`massa_solo_seco_${lado}`] = soloSeco;
        un[`umidade_${lado}`] = umidade;
      }
      return { ...prev, umidade_natural: un };
    });
  }, []);

  const handleDensidadeChange = useCallback((idx, field, value) => {
    setFormData(prev => {
      const arr = [...(prev.densidades_in_situ || [getDensidadeInicial()])];
      const d = { ...arr[idx], [field]: value };
      const calc = calcularDensidade(d);
      arr[idx] = { ...d, ...calc };
      return { ...prev, densidades_in_situ: arr };
    });
  }, []);

  const adicionarDensidade = useCallback(() => {
    setFormData(prev => {
      if ((prev.densidades_in_situ || []).length >= 3) return prev;
      return { ...prev, densidades_in_situ: [...(prev.densidades_in_situ || []), getDensidadeInicial()] };
    });
  }, []);

  const removerDensidade = useCallback((idx) => {
    setFormData(prev => {
      const arr = (prev.densidades_in_situ || []).filter((_, i) => i !== idx);
      return { ...prev, densidades_in_situ: arr.length > 0 ? arr : [getDensidadeInicial()] };
    });
  }, []);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), ...urls] }));
      e.target.value = '';
    } catch (error) {
      alert("Erro ao fazer upload da foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = useCallback((index) => {
    setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.obra_id || !formData.data) {
      alert("Preencha todos os campos obrigatórios (Obra, Data).");
      return;
    }
    setSaving(true);
    try {
      const dataToSave = { ...formData, laboratorista_name: user?.laboratorista_name || user?.full_name };
      if (editingBoletim) {
        const updateData = { ...dataToSave };
        if (editingBoletim.approved === false) {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
        }
        await base44.entities.BoletimSondagemTrado.update(editingBoletim.id, updateData);
        alert("Boletim atualizado com sucesso!");
      } else {
        await base44.entities.BoletimSondagemTrado.create(dataToSave);
        alert("Boletim criado com sucesso!");
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("Erro ao salvar boletim:", error);
      alert("Erro ao salvar boletim: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-[#00233B]/50" />
      </div>
    );
  }

  const numInput = (val, onChange, disabled, step = "0.01") => (
    <Input
      type="number"
      step={step}
      value={val ?? ''}
      onChange={(e) => onChange(e.target.value !== '' ? parseFloat(e.target.value) : null)}
      disabled={disabled}
      className="h-9 text-sm"
    />
  );

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-2xl">
              {editingBoletim ? 'Editar Boletim de Sondagem a Trado' : 'Novo Boletim de Sondagem a Trado'}
            </CardTitle>
            <CardDescription className="text-[#00233B]/80">
              Umidade Natural | Densidade In Situ (opcional) — DNER-ME 213/94 e DNER-ME 092/94
            </CardDescription>
            {editingBoletim?.rejection_reason && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50/50 border border-red-200/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{editingBoletim.rejection_reason}</p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') e.preventDefault();
            }} className="space-y-6">

              {/* DADOS DA OBRA */}
              <Card className="bg-black/5 border-[#00233B]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#00233B]">Dados da Obra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Obra *</Label>
                      <select
                        value={formData.obra_id}
                        onChange={(e) => handleObraChange(e.target.value)}
                        disabled={!isEditable || !!editingBoletim}
                        required
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione a obra</option>
                        {obras.map(obra => (
                          <option key={obra.id} value={obra.id}>{obra.name} — {obra.code}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Cliente</Label>
                      <Input value={formData.cliente} onChange={e => setFormData(p => ({ ...p, cliente: e.target.value }))} disabled={!isEditable} className="h-10" />
                    </div>
                    <div>
                      <Label>Data *</Label>
                      <Input type="date" value={formData.data} onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} disabled={!isEditable} required className="h-10" />
                    </div>
                    <div>
                      <Label>Rodovia</Label>
                      <select
                        value={formData.rodovia}
                        onChange={e => setFormData(p => ({ ...p, rodovia: e.target.value }))}
                        disabled={!isEditable || !formData.obra_id}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione a rodovia</option>
                        {(obras.find(o => o.id === formData.obra_id)?.rodovias || []).map((r, i) => (
                          <option key={i} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>KM</Label>
                      <Input value={formData.km} onChange={e => setFormData(p => ({ ...p, km: e.target.value }))} disabled={!isEditable} placeholder="Ex: 125+300" className="h-10" />
                    </div>
                    <div>
                      <Label>Pista</Label>
                      <Input value={formData.pista} onChange={e => setFormData(p => ({ ...p, pista: e.target.value }))} disabled={!isEditable} className="h-10" />
                    </div>
                    <div>
                      <Label>Bordo</Label>
                      <Input value={formData.bordo} onChange={e => setFormData(p => ({ ...p, bordo: e.target.value }))} disabled={!isEditable} className="h-10" />
                    </div>
                    <div>
                      <Label>Furo</Label>
                      <Input value={formData.furo} onChange={e => setFormData(p => ({ ...p, furo: e.target.value }))} disabled={!isEditable} placeholder="Ex: T-01" className="h-10" />
                    </div>
                    <div>
                      <Label>Operador</Label>
                      <Input value={formData.operador} readOnly className="h-10 bg-slate-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SONDAGEM - CAMADAS (apenas 1 face) */}
              <Card className="bg-black/5 border-[#00233B]/10">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <CardTitle className="text-base text-[#00233B]">Sondagem — Camadas</CardTitle>
                    {isEditable && (
                      <Button type="button" onClick={adicionarCamada} size="sm" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 text-xs" disabled={formData.camadas.length >= 15}>
                        <Plus className="w-4 h-4 mr-1" /> Adicionar Camada
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <Label className="text-xs">Face da Sondagem</Label>
                    <Input
                      value={formData.face_classificacao_1 || ''}
                      onChange={e => setFormData(p => ({ ...p, face_classificacao_1: e.target.value }))}
                      disabled={!isEditable}
                      placeholder="Ex.: Pista, Acostamento, etc."
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <colgroup>
                        <col className="w-12" />
                        <col className="w-[130px]" />
                        <col className="w-[130px]" />
                        <col className="w-[90px]" />
                        <col className="w-[110px]" />
                        <col />
                        {isEditable && <col className="w-10" />}
                      </colgroup>
                      <thead>
                        <tr className="bg-[#00233B]/10">
                          <th className="border border-[#00233B]/20 px-2 py-2 text-center font-medium">Nº</th>
                          <th className="border border-[#00233B]/20 px-2 py-2 text-center font-medium" colSpan={2}>PROF. (m)</th>
                          <th className="border border-[#00233B]/20 px-2 py-2 text-center font-medium">ESP. (m)</th>
                          <th className="border border-[#00233B]/20 px-2 py-2 text-center font-medium">N.A (m)</th>
                          <th className="border border-[#00233B]/20 px-2 py-2 text-center font-medium">CLASSIFICAÇÃO</th>
                          {isEditable && <th className="border border-[#00233B]/20 px-2 py-2"></th>}
                        </tr>
                        <tr className="bg-[#00233B]/5">
                          <th className="border border-[#00233B]/20 px-2 py-1"></th>
                          <th className="border border-[#00233B]/20 px-2 py-1 text-center text-xs font-medium">DE</th>
                          <th className="border border-[#00233B]/20 px-2 py-1 text-center text-xs font-medium">ATÉ</th>
                          <th className="border border-[#00233B]/20 px-2 py-1"></th>
                          <th className="border border-[#00233B]/20 px-2 py-1"></th>
                          <th className="border border-[#00233B]/20 px-2 py-1"></th>
                          {isEditable && <th className="border border-[#00233B]/20 px-2 py-1"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.camadas.map((camada, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white/30' : 'bg-white/10'}>
                            <td className="border border-[#00233B]/20 px-2 py-1 text-center font-medium text-[#00233B]/70">{camada.numero}</td>
                            {index === 0 ? (
                              <td className="border border-[#00233B]/20 px-1 py-1">
                                <Input type="number" step="0.01" value={camada.prof_de ?? ''} onChange={e => handleCamadaChange(0, 'prof_de', e.target.value !== '' ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="h-8 text-xs text-center bg-white/50" placeholder="0,00" />
                              </td>
                            ) : (
                              <td className="border border-[#00233B]/20 px-1 py-1 bg-black/10 text-center text-xs font-medium text-[#00233B]/70">
                                {camada.prof_de !== null && camada.prof_de !== undefined ? camada.prof_de.toFixed(2) : '—'}
                              </td>
                            )}
                            <td className="border border-[#00233B]/20 px-1 py-1">
                              <Input type="number" step="0.01" value={camada.prof_ate ?? ''} onChange={e => handleCamadaChange(index, 'prof_ate', e.target.value !== '' ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="h-8 text-xs text-center bg-white/50" placeholder="0,00" />
                            </td>
                            <td className="border border-[#00233B]/20 px-1 py-1 bg-black/10 text-center text-xs font-medium text-[#00233B]/70">
                              {camada.espessura !== null && camada.espessura !== undefined ? camada.espessura.toFixed(2) : ''}
                            </td>
                            <td className="border border-[#00233B]/20 px-1 py-1">
                              <Input type="number" step="0.01" value={camada.na ?? ''} onChange={e => handleCamadaChange(index, 'na', e.target.value !== '' ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="h-8 text-xs text-center bg-white/50" />
                            </td>
                            <td className="border border-[#00233B]/20 px-1 py-1">
                              <Input value={camada.classificacao_1} onChange={e => handleCamadaChange(index, 'classificacao_1', e.target.value)} disabled={!isEditable} className="h-8 text-xs bg-white/50" placeholder="Escrever" />
                            </td>
                            {isEditable && (
                              <td className="border border-[#00233B]/20 px-1 py-1 text-center">
                                {formData.camadas.length > 1 && (
                                  <button type="button" onClick={() => removerCamada(index)} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* UMIDADE NATURAL 1 */}
              <Card className="bg-black/5 border-[#00233B]/10">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base text-[#00233B]">Umidade Natural 1 — DNER-ME 213/94</CardTitle>
                    {isEditable && !formData.umidade_natural_2 && (
                      <Button
                        type="button" size="sm" variant="outline"
                        className="border-[#00233B]/30 text-[#00233B] hover:bg-[#00233B]/10 text-xs"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          umidade_natural_2: { camada_ensaiada_1: "", no_capsula_1: "", no_capsula_2: "", massa_capsula_1: null, massa_capsula_2: null, massa_cap_solo_umido_1: null, massa_cap_solo_umido_2: null, massa_cap_solo_seco_1: null, massa_cap_solo_seco_2: null, massa_agua_1: null, massa_agua_2: null, massa_solo_seco_1: null, massa_solo_seco_2: null, umidade_1: null, umidade_2: null }
                        }))}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar 2ª Umidade
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#00233B]/10">
                          <th className="border border-[#00233B]/20 px-3 py-2 text-left font-medium text-[#00233B]">Campo</th>
                          <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Amostra 1</th>
                          <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Amostra 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white/30">
                          <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80">Camada ensaiada</td>
                          <td className="border border-[#00233B]/20 px-2 py-1" colSpan={2}>
                            <Input value={formData.umidade_natural.camada_ensaiada_1 || ''} onChange={e => handleUmidadeChange('camada_ensaiada_1', e.target.value)} disabled={!isEditable} className="h-8 text-sm" placeholder="Ex.: 0,00 - 0,60m" />
                          </td>
                        </tr>
                        {[
                          { label: "Nº cápsula", fields: ['no_capsula_1', 'no_capsula_2'], type: 'text' },
                          { label: "Massa cápsula (g)", fields: ['massa_capsula_1', 'massa_capsula_2'], type: 'number' },
                          { label: "Massa cap + solo úmido (g)", fields: ['massa_cap_solo_umido_1', 'massa_cap_solo_umido_2'], type: 'number' },
                          { label: "Massa cap + solo seco (g)", fields: ['massa_cap_solo_seco_1', 'massa_cap_solo_seco_2'], type: 'number' },
                        ].map(({ label, fields, type }, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white/10' : 'bg-white/30'}>
                            <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80">{label}</td>
                            {fields.map((f, fi) => (
                              <td key={fi} className="border border-[#00233B]/20 px-2 py-1">
                                {type === 'text'
                                  ? <Input value={formData.umidade_natural[f] || ''} onChange={e => handleUmidadeChange(f, e.target.value)} disabled={!isEditable} className="h-8 text-sm" />
                                  : <Input type="number" step="0.01" value={formData.umidade_natural[f] ?? ''} onChange={e => handleUmidadeChange(f, e.target.value !== '' ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="h-8 text-sm" />
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                        {[
                          { label: "Massa da água (g)", keys: ['massa_agua_1', 'massa_agua_2'] },
                          { label: "Massa do solo seco (g)", keys: ['massa_solo_seco_1', 'massa_solo_seco_2'] },
                        ].map(({ label, keys }, ri) => (
                          <tr key={`calc-${ri}`} className="bg-[#BFCF99]/10">
                            <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80 italic">{label}</td>
                            {keys.map((k, ki) => (
                              <td key={ki} className="border border-[#00233B]/20 px-3 py-1.5 text-center font-semibold text-[#00233B]">
                                {formData.umidade_natural[k] !== null && formData.umidade_natural[k] !== undefined ? formData.umidade_natural[k].toFixed(2) : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="bg-[#BFCF99]/30">
                          <td className="border border-[#00233B]/20 px-3 py-2 font-bold text-[#00233B]">Umidade (%)</td>
                          <td className="border border-[#00233B]/20 px-3 py-2 text-center font-bold text-[#00233B] text-base" colSpan={2}>
                            {(() => {
                              const u1 = formData.umidade_natural.umidade_1, u2 = formData.umidade_natural.umidade_2;
                              if (u1 != null && u2 != null) return `${((u1 + u2) / 2).toFixed(2)} %`;
                              if (u1 != null) return `${u1.toFixed(2)} %`;
                              return '—';
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* UMIDADE NATURAL 2 */}
              {formData.umidade_natural_2 && (
                <Card className="bg-black/5 border-[#00233B]/10">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base text-[#00233B]">Umidade Natural 2 — DNER-ME 213/94</CardTitle>
                      {isEditable && (
                        <Button type="button" size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 text-xs" onClick={() => setFormData(prev => ({ ...prev, umidade_natural_2: null }))}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#00233B]/10">
                            <th className="border border-[#00233B]/20 px-3 py-2 text-left font-medium text-[#00233B]">Campo</th>
                            <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Amostra 1</th>
                            <th className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B]">Amostra 2</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white/30">
                            <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80">Camada ensaiada</td>
                            <td className="border border-[#00233B]/20 px-2 py-1" colSpan={2}>
                              <Input value={formData.umidade_natural_2.camada_ensaiada_1 || ''} onChange={e => setFormData(prev => ({ ...prev, umidade_natural_2: { ...prev.umidade_natural_2, camada_ensaiada_1: e.target.value } }))} disabled={!isEditable} className="h-8 text-sm" placeholder="Ex.: 0,00 - 0,60m" />
                            </td>
                          </tr>
                          {[
                            { label: "Nº cápsula", fields: ['no_capsula_1', 'no_capsula_2'], type: 'text' },
                            { label: "Massa cápsula (g)", fields: ['massa_capsula_1', 'massa_capsula_2'], type: 'number' },
                            { label: "Massa cap + solo úmido (g)", fields: ['massa_cap_solo_umido_1', 'massa_cap_solo_umido_2'], type: 'number' },
                            { label: "Massa cap + solo seco (g)", fields: ['massa_cap_solo_seco_1', 'massa_cap_solo_seco_2'], type: 'number' },
                          ].map(({ label, fields, type }, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-white/10' : 'bg-white/30'}>
                              <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80">{label}</td>
                              {fields.map((f, fi) => (
                                <td key={fi} className="border border-[#00233B]/20 px-2 py-1">
                                  {type === 'text'
                                    ? <Input value={formData.umidade_natural_2[f] || ''} onChange={e => setFormData(prev => ({ ...prev, umidade_natural_2: { ...prev.umidade_natural_2, [f]: e.target.value } }))} disabled={!isEditable} className="h-8 text-sm" />
                                    : <Input type="number" step="0.01" value={formData.umidade_natural_2[f] ?? ''} onChange={e => setFormData(prev => ({ ...prev, umidade_natural_2: { ...prev.umidade_natural_2, [f]: e.target.value !== '' ? parseFloat(e.target.value) : null } }))} disabled={!isEditable} className="h-8 text-sm" />
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr className="bg-[#BFCF99]/30">
                            <td className="border border-[#00233B]/20 px-3 py-2 font-bold text-[#00233B]">Umidade (%)</td>
                            <td className="border border-[#00233B]/20 px-3 py-2 text-center font-bold text-[#00233B] text-base" colSpan={2}>
                              {(() => {
                                const un2 = formData.umidade_natural_2;
                                const calcU = (idx) => {
                                  const csu = un2[`massa_cap_solo_umido_${idx}`], css = un2[`massa_cap_solo_seco_${idx}`], cap = un2[`massa_capsula_${idx}`];
                                  if (csu && css && cap !== null) { const ss = css - cap; return ss > 0 ? parseFloat((((csu - css) / ss) * 100).toFixed(2)) : null; }
                                  return null;
                                };
                                const u1 = calcU(1), u2 = calcU(2);
                                if (u1 !== null && u2 !== null) return `${((u1 + u2) / 2).toFixed(2)} %`;
                                if (u1 !== null) return `${u1.toFixed(2)} %`;
                                return '—';
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ENSAIO IN SITU - TOGGLE */}
              <Card className="bg-black/5 border-[#00233B]/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base text-[#00233B]">Massa Específica Aparente In Situ — DNER-ME 092/94</CardTitle>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.ensaio_insitu_realizado}
                          onChange={e => setFormData(prev => ({ ...prev, ensaio_insitu_realizado: e.target.checked }))}
                          disabled={!isEditable}
                          className="w-4 h-4 accent-[#00233B]"
                        />
                        <span className="text-sm font-medium text-[#00233B]">Ensaio realizado</span>
                      </label>
                      {isEditable && formData.ensaio_insitu_realizado && (formData.densidades_in_situ || []).length < 3 && (
                        <Button type="button" onClick={adicionarDensidade} size="sm" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 text-xs">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Ensaio
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {formData.ensaio_insitu_realizado && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      {(() => {
                        const densidades = formData.densidades_in_situ || [getDensidadeInicial()];
                        const nEnsaios = densidades.length;
                        const numInput2 = (val, onChange, step = "0.01") => (
                          <Input type="number" step={step} value={val ?? ''} onChange={(e) => onChange(e.target.value !== '' ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="h-8 text-xs text-center bg-white/50 min-w-[90px]" />
                        );
                        const calc = (val, dec = 2) => val !== null && val !== undefined ? val.toFixed(dec) : '—';
                        const rows = [
                          { label: "Camada ensaiada em campo", field: "camada_ensaiada", type: "text" },
                          { label: "— VOLUME —", section: true },
                          { label: "Peso do frasco antes (gf)", field: "peso_frasco_antes", type: "number", step: "0.001" },
                          { label: "Peso do frasco depois (gf)", field: "peso_frasco_depois", type: "number", step: "0.001" },
                          { label: "Peso da areia no funil e placa (gf)", field: "peso_areia_funil_placa", type: "number", step: "0.001" },
                          { label: "Massa esp. aparente da areia (g/dm³)", field: "massa_esp_aparente_areia", type: "number", step: "0.001" },
                          { label: "Peso da areia deslocada (gf)", field: "peso_areia_deslocada", type: "calc", dec: 2 },
                          { label: "Peso da areia na cavidade (gf)", field: "peso_areia_cavidade", type: "calc", dec: 2 },
                          { label: "Volume do buraco (dm³)", field: "volume_buraco", type: "calc", dec: 3 },
                          { label: "— MASSA —", section: true },
                          { label: "Peso do solo e recipiente (gf)", field: "peso_solo_recipiente", type: "number" },
                          { label: "Peso do recipiente (gf)", field: "peso_recipiente", type: "number" },
                          { label: "Peso do solo (gf)", field: "peso_solo", type: "calc", dec: 2 },
                          { label: "— UMIDADE —", section: true },
                          { label: "Peso do solo úmido (gf)", field: "peso_solo_umido", type: "number" },
                          { label: "Peso do solo seco (gf)", field: "peso_solo_seco", type: "number" },
                          { label: "Teor de umidade (%)", field: "teor_umidade", type: "calc", dec: 2 },
                          { label: "— RESULTADOS —", section: true },
                          { label: "Dens. Aparente Solo Úmido (g/dm³)", field: "densidade_aparente_solo_umido", type: "result", dec: 3 },
                          { label: "Dens. Aparente Solo Seco (g/dm³)", field: "densidade_aparente_solo_seco", type: "result", dec: 3 },
                        ];
                        return (
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-[#00233B]/10">
                                <th className="border border-[#00233B]/20 px-3 py-2 text-left font-medium text-[#00233B] min-w-[220px]">Campo</th>
                                {densidades.map((_, i) => (
                                  <th key={i} className="border border-[#00233B]/20 px-3 py-2 text-center font-medium text-[#00233B] min-w-[120px]">
                                    <div className="flex items-center justify-center gap-2">
                                      <span>Ensaio {i + 1}</span>
                                      {isEditable && nEnsaios > 1 && (
                                        <button type="button" onClick={() => removerDensidade(i)} className="text-red-400 hover:text-red-600">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row, ri) => {
                                if (row.section) {
                                  return (
                                    <tr key={ri} className="bg-[#00233B]/10">
                                      <td colSpan={nEnsaios + 1} className="border border-[#00233B]/20 px-3 py-1 text-xs font-bold text-[#00233B]/60 uppercase tracking-wider">
                                        {row.label.replace(/—/g, '').trim()}
                                      </td>
                                    </tr>
                                  );
                                }
                                const isCalc = row.type === 'calc' || row.type === 'result';
                                const isResult = row.type === 'result';
                                return (
                                  <tr key={ri} className={isResult ? 'bg-[#BFCF99]/30' : isCalc ? 'bg-[#BFCF99]/10' : (ri % 2 === 0 ? 'bg-white/20' : 'bg-white/5')}>
                                    <td className={`border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80 text-xs ${isCalc ? 'italic' : ''} ${isResult ? 'font-bold text-[#00233B]' : ''}`}>{row.label}</td>
                                    {densidades.map((d, di) => (
                                      <td key={di} className={`border border-[#00233B]/20 px-2 py-1 text-center ${isCalc ? 'font-semibold text-[#00233B]' : ''}`}>
                                        {isCalc ? (
                                          <span className={isResult ? 'text-base font-bold text-[#00233B]' : ''}>{calc(d[row.field], row.dec ?? 2)}</span>
                                        ) : row.type === 'text' ? (
                                          <Input value={d[row.field] || ''} onChange={e => handleDensidadeChange(di, row.field, e.target.value)} disabled={!isEditable} className="h-8 text-xs bg-white/50 min-w-[90px]" />
                                        ) : (
                                          numInput2(d[row.field], v => handleDensidadeChange(di, row.field, v), row.step || "0.01")
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </CardContent>
                )}
                {!formData.ensaio_insitu_realizado && (
                  <CardContent>
                    <p className="text-sm text-[#00233B]/60 italic text-center py-4">Ensaio in situ não realizado neste boletim.</p>
                  </CardContent>
                )}
              </Card>

              {/* OBSERVAÇÕES */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))}
                  disabled={!isEditable}
                  rows={3}
                  maxLength={500}
                  placeholder="Observações gerais sobre o boletim..."
                />
              </div>

              {/* REGISTRO FOTOGRÁFICO */}
              <div>
                <Label>Registro Fotográfico</Label>
                {isEditable && (
                  <div className="mt-2">
                    <input id="fotos-upload" type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="hidden" />
                    <label htmlFor="fotos-upload" className={`flex items-center justify-between w-full h-10 px-3 py-2 border border-[#00233B]/20 bg-white/30 rounded-md text-sm cursor-pointer hover:bg-white/50 ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span className="text-[#00233B]/60">{uploadingPhoto ? 'Enviando...' : 'Selecionar fotos'}</span>
                      <span className="px-3 py-1 rounded-md text-sm font-semibold bg-[#00233B]/10 text-[#00233B] hover:bg-[#00233B]/20">
                        {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Escolher Ficheiros'}
                      </span>
                    </label>
                  </div>
                )}
                {formData.fotos && formData.fotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {formData.fotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <picture><source srcSet={url} /><img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-md border border-[#00233B]/20" width="auto" height="128" /></picture>
                        {isEditable && (
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemovePhoto(index)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BOTÕES */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))} className="hover:bg-black/10">Cancelar</Button>
                {isEditable && (
                  <Button type="submit" disabled={saving} className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Save className="w-4 h-4 mr-2" />Salvar Boletim</>}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}