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
  classificacao_1: "",
  classificacao_2: null // null = coluna 2 não existe ainda
});

const CAMADAS_PADRAO = [1, 2, 3, 4, 5].map(getCamadaInicial);

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
  camadas: CAMADAS_PADRAO.map(c => ({ ...c, classificacao_2: null })),
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
  densidade_in_situ: {
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
  },
  observacoes: "",
  fotos: []
});

// Calcular campos de umidade natural
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

// Calcular densidade in situ
const calcularDensidade = (d) => {
  const areiaDeslocada = d.peso_areia_funil_placa !== null && d.peso_frasco_antes !== null && d.peso_frasco_depois !== null
    ? parseFloat((d.peso_frasco_antes - d.peso_frasco_depois).toFixed(2))
    : null;
  const areiaCavidade = areiaDeslocada !== null && d.peso_areia_funil_placa !== null
    ? parseFloat((areiaDeslocada - d.peso_areia_funil_placa).toFixed(2))
    : null;
  const volumeBuraco = areiaCavidade !== null && d.massa_esp_aparente_areia
    ? parseFloat((areiaCavidade / d.massa_esp_aparente_areia).toFixed(3))
    : null;
  const pesoSolo = d.peso_solo_recipiente !== null && d.peso_recipiente !== null
    ? parseFloat((d.peso_solo_recipiente - d.peso_recipiente).toFixed(2))
    : null;
  const densidadeUmida = pesoSolo !== null && volumeBuraco
    ? parseFloat((pesoSolo / volumeBuraco).toFixed(3))
    : null;
  const pesoAgua = d.peso_solo_umido !== null && d.peso_solo_seco !== null
    ? parseFloat((d.peso_solo_umido - d.peso_solo_seco).toFixed(2))
    : null;
  const teorUmidade = pesoAgua !== null && d.peso_solo_seco
    ? parseFloat(((pesoAgua / d.peso_solo_seco) * 100).toFixed(2))
    : null;
  const densidadeSeca = densidadeUmida !== null && teorUmidade !== null
    ? parseFloat((densidadeUmida / (1 + teorUmidade / 100)).toFixed(3))
    : null;

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

export default function BoletimSondagemPage() {
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

  useEffect(() => { loadInitialData(); }, []);

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
        const boletimToEdit = await base44.entities.BoletimSondagem.get(editId);
        if (currentUser.role === 'admin' || (boletimToEdit.created_by === currentUser.email && boletimToEdit.approved !== true)) {
          setEditingBoletim(boletimToEdit);
          const initial = getInitialFormData();
          setFormData({
            ...initial,
            ...boletimToEdit,
            data: boletimToEdit.data ? new Date(boletimToEdit.data).toISOString().split('T')[0] : initial.data,
            camadas: boletimToEdit.camadas?.length > 0 ? boletimToEdit.camadas : initial.camadas,
            umidade_natural: { ...initial.umidade_natural, ...(boletimToEdit.umidade_natural || {}) },
            densidade_in_situ: { ...initial.densidade_in_situ, ...(boletimToEdit.densidade_in_situ || {}) },
            fotos: Array.isArray(boletimToEdit.fotos) ? boletimToEdit.fotos : []
          });
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          operador: currentUser.laboratorista_name || currentUser.full_name,
          obra_id: availableObras.length > 0 ? availableObras[0].id : ""
        }));

        // Preencher cliente da regional
        if (availableObras.length > 0) {
          const obraId = availableObras[0].id;
          const obra = availableObras.find(o => o.id === obraId);
          const regional = obra ? regionaisData.find(r => r.id === obra.regional_id) : null;
          if (regional?.cliente) {
            setFormData(prev => ({ ...prev, cliente: regional.cliente }));
          }
        }
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
    setFormData(prev => ({
      ...prev,
      obra_id: obraId,
      rodovia: "",
      cliente: regional?.cliente || prev.cliente
    }));
  }, [obras, regionais]);

  const handleCamadaChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newCamadas = prev.camadas.map(c => ({ ...c }));
      newCamadas[index] = { ...newCamadas[index], [field]: value };

      // Recalcular espessura quando DE da primeira linha é editado
      if (field === 'prof_de' && index === 0) {
        const { prof_de, prof_ate } = newCamadas[0];
        if (prof_de !== null && prof_ate !== null) {
          newCamadas[0].espessura = parseFloat((prof_ate - prof_de).toFixed(2));
        } else {
          newCamadas[0].espessura = null;
        }
      }

      // Recalcular espessura da camada atual (classificação 1)
      if (field === 'prof_ate') {
        const { prof_de, prof_ate } = newCamadas[index];
        if (prof_de !== null && prof_ate !== null) {
          newCamadas[index].espessura = parseFloat((prof_ate - prof_de).toFixed(2));
        } else {
          newCamadas[index].espessura = null;
        }
        // Propagar: o "DE" da próxima linha = "ATÉ" da atual
        if (index + 1 < newCamadas.length) {
          newCamadas[index + 1].prof_de = prof_ate;
          // Recalcular espessura da próxima se tiver ATÉ
          const nextAte = newCamadas[index + 1].prof_ate;
          if (prof_ate !== null && nextAte !== null) {
            newCamadas[index + 1].espessura = parseFloat((nextAte - prof_ate).toFixed(2));
          } else {
            newCamadas[index + 1].espessura = null;
          }
        }
      }

      // Recalcular espessura para classificação 2
      if (field === 'prof_ate_2') {
        const { prof_de_2, prof_ate_2 } = newCamadas[index];
        if (prof_de_2 !== null && prof_ate_2 !== null) {
          newCamadas[index].espessura_2 = parseFloat((prof_ate_2 - prof_de_2).toFixed(2));
        } else {
          newCamadas[index].espessura_2 = null;
        }
        // Propagar: o "DE_2" da próxima linha = "ATÉ_2" da atual
        if (index + 1 < newCamadas.length) {
          newCamadas[index + 1].prof_de_2 = prof_ate_2;
          // Recalcular espessura da próxima se tiver ATÉ_2
          const nextAte2 = newCamadas[index + 1].prof_ate_2;
          if (prof_ate_2 !== null && nextAte2 !== null) {
            newCamadas[index + 1].espessura_2 = parseFloat((nextAte2 - prof_ate_2).toFixed(2));
          } else {
            newCamadas[index + 1].espessura_2 = null;
          }
        }
      }

      if (field === 'prof_de_2') {
        const { prof_de_2, prof_ate_2 } = newCamadas[index];
        if (prof_de_2 !== null && prof_ate_2 !== null) {
          newCamadas[index].espessura_2 = parseFloat((prof_ate_2 - prof_de_2).toFixed(2));
        } else {
          newCamadas[index].espessura_2 = null;
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
      // Recalcular propagação a partir do index removido
      for (let i = index; i < newCamadas.length; i++) {
        if (i === 0) {
          newCamadas[0].prof_de = 0;
        } else {
          newCamadas[i].prof_de = newCamadas[i - 1].prof_ate ?? null;
        }
        const { prof_de, prof_ate } = newCamadas[i];
        newCamadas[i].espessura = prof_de !== null && prof_ate !== null ? parseFloat((prof_ate - prof_de).toFixed(2)) : null;
      }
      return { ...prev, camadas: newCamadas };
    });
  }, []);

  const adicionarCamada2 = useCallback(() => {
    setFormData(prev => {
      if (!prev.camadas_2) prev.camadas_2 = [];
      if (prev.camadas_2.length >= 15) return prev;
      const ultima = prev.camadas_2[prev.camadas_2.length - 1];
      const novaDe = ultima?.prof_ate ?? null;
      const novaCamada = { numero: prev.camadas_2.length + 1, prof_de: novaDe, prof_ate: null, espessura: null, na: null, classificacao_2: "" };
      return { ...prev, camadas_2: [...(prev.camadas_2 || []), novaCamada] };
    });
  }, []);

  const removerCamada2 = useCallback((index) => {
    setFormData(prev => {
      if (!prev.camadas_2 || prev.camadas_2.length <= 1) return prev;
      const newCamadas = prev.camadas_2.filter((_, i) => i !== index).map((c, i) => ({ ...c, numero: i + 1 }));
      // Recalcular propagação
      for (let i = index; i < newCamadas.length; i++) {
        if (i === 0) {
          newCamadas[0].prof_de = 0;
        } else {
          newCamadas[i].prof_de = newCamadas[i - 1].prof_ate ?? null;
        }
        const { prof_de, prof_ate } = newCamadas[i];
        newCamadas[i].espessura = prof_de !== null && prof_ate !== null ? parseFloat((prof_ate - prof_de).toFixed(2)) : null;
      }
      return { ...prev, camadas_2: newCamadas };
    });
  }, []);

  const handleUmidadeChange = useCallback((field, value) => {
    setFormData(prev => {
      const un = { ...prev.umidade_natural, [field]: value };
      // Recalcular para ambos os lados
      for (const lado of [1, 2]) {
        const { agua, soloSeco, umidade } = calcularUmidade(un, lado);
        un[`massa_agua_${lado}`] = agua;
        un[`massa_solo_seco_${lado}`] = soloSeco;
        un[`umidade_${lado}`] = umidade;
      }
      return { ...prev, umidade_natural: un };
    });
  }, []);

  const handleDensidadeChange = useCallback((field, value) => {
    setFormData(prev => {
      const d = { ...prev.densidade_in_situ, [field]: value };
      const calc = calcularDensidade(d);
      return { ...prev, densidade_in_situ: { ...d, ...calc } };
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
      const dataToSave = {
        ...formData,
        laboratorista_name: user?.laboratorista_name || user?.full_name
      };
      if (editingBoletim) {
        const updateData = { ...dataToSave };
        if (editingBoletim.approved === false) {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
        }
        await base44.entities.BoletimSondagem.update(editingBoletim.id, updateData);
        alert("Boletim atualizado com sucesso!");
      } else {
        await base44.entities.BoletimSondagem.create(dataToSave);
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

  const numInput = (val, onChange, disabled, placeholder = "", step = "0.01") => (
    <Input
      type="number"
      step={step}
      value={val ?? ''}
      onChange={(e) => onChange(e.target.value !== '' ? parseFloat(e.target.value) : null)}
      disabled={disabled}
      placeholder={placeholder}
      className="h-9 text-sm"
    />
  );

  const resultField = (label, value, unit = "") => (
    <div className="p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded">
      <p className="text-xs text-[#00233B]/70 font-medium">{label}</p>
      <p className="text-base font-bold text-[#00233B]">
        {value !== null && value !== undefined ? `${value}${unit}` : '-'}
      </p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-2xl">
              {editingBoletim ? 'Editar Boletim de Sondagem' : 'Novo Boletim de Sondagem (PI)'}
            </CardTitle>
            <CardDescription className="text-[#00233B]/80">
              Umidade Natural | Densidade In Situ — DNER-ME 213/94 e DNER-ME 092/94
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
                      <Input value={formData.cliente} onChange={e => setFormData(p => ({ ...p, cliente: e.target.value }))} disabled={!isEditable} placeholder="Do cadastro da obra" className="h-10" />
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
                      <Input value={formData.pista} onChange={e => setFormData(p => ({ ...p, pista: e.target.value }))} disabled={!isEditable} placeholder="Ex: Norte" className="h-10" />
                    </div>
                    <div>
                      <Label>Bordo</Label>
                      <Input value={formData.bordo} onChange={e => setFormData(p => ({ ...p, bordo: e.target.value }))} disabled={!isEditable} placeholder="Ex: Direito" className="h-10" />
                    </div>
                    <div>
                      <Label>Furo</Label>
                      <Input value={formData.furo} onChange={e => setFormData(p => ({ ...p, furo: e.target.value }))} disabled={!isEditable} placeholder="Ex: F-01" className="h-10" />
                    </div>
                    <div>
                      <Label>Operador</Label>
                      <Input value={formData.operador} readOnly className="h-10 bg-slate-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SONDAGEM - CAMADAS */}
              {(() => {
                const temColuna2 = formData.camadas.some(c => c.classificacao_2 !== null);
                const addColuna2 = () => setFormData(prev => ({
                  ...prev,
                  camadas: prev.camadas.map(c => ({ ...c, classificacao_2: c.classificacao_2 ?? "" })),
                }));
                const removeColuna2 = () => setFormData(prev => ({
                  ...prev,
                  camadas: prev.camadas.map(c => ({ ...c, classificacao_2: null })),
                }));
                return (
                  <Card className="bg-black/5 border-[#00233B]/10">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle className="text-base text-[#00233B]">Sondagem — Camadas</CardTitle>
                        {isEditable && (
                          <div className="flex gap-2">
                            {!temColuna2 && (
                            <Button type="button" onClick={() => {
                            addColuna2();
                            setFormData(prev => ({ ...prev, camadas_2: [] }));
                            }} size="sm" variant="outline" className="border-[#00233B]/30 text-[#00233B] hover:bg-[#00233B]/10 text-xs">
                            <Plus className="w-3.5 h-3.5 mr-1" /> 2ª Classificação
                            </Button>
                            )}
                            {temColuna2 && (
                              <Button type="button" onClick={removeColuna2} size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 text-xs">
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover 2ª Classificação
                              </Button>
                            )}
                            <Button type="button" onClick={adicionarCamada} size="sm" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 text-xs" disabled={formData.camadas.length >= 15}>
                              <Plus className="w-4 h-4 mr-1" /> Adicionar Camada
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* TABELA 1 - Classificação 1 */}
                        <div className="overflow-x-auto">
                          <div className="mb-2 flex items-end gap-3">
                            <div className="flex-1">
                              <Label className="text-xs">Face da Sondagem - Classificação 1</Label>
                              <Input value={formData.face_classificacao_1 || ''} onChange={e => setFormData(p => ({ ...p, face_classificacao_1: e.target.value }))} disabled={!isEditable} placeholder="Ex.: Pista, Acostamento, etc." className="h-9 text-sm" />
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-[#00233B]/70 mb-2">Classificação 1</div>
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

                        {/* TABELA 2 - Classificação 2 (quando houver) */}
                        {temColuna2 && (
                          <div className="overflow-x-auto">
                            <div className="mb-2 flex items-end gap-3">
                              <div className="flex-1">
                                <Label className="text-xs">Face da Sondagem - Classificação 2</Label>
                                <Input value={formData.face_classificacao_2 || ''} onChange={e => setFormData(p => ({ ...p, face_classificacao_2: e.target.value }))} disabled={!isEditable} placeholder="Ex.: Pista, Acostamento, etc." className="h-9 text-sm" />
                              </div>
                              <Button type="button" onClick={adicionarCamada2} size="sm" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 text-xs h-9" disabled={!isEditable || (formData.camadas_2?.length || 0) >= 15}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                              </Button>
                            </div>
                            <div className="text-xs font-semibold text-[#00233B]/70 mb-2">Classificação 2</div>
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
                                {(formData.camadas_2 || []).map((camada, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white/30' : 'bg-white/10'}>
                                    <td className="border border-[#00233B]/20 px-2 py-1 text-center font-medium text-[#00233B]/70">{camada.numero}</td>
                                    <td className="border border-[#00233B]/20 px-1 py-1">
                                      <Input type="number" step="0.01" value={camada.prof_de ?? ''} onChange={e => {
                                        const newVal = e.target.value !== '' ? parseFloat(e.target.value) : null;
                                        setFormData(prev => {
                                          const newCamadas2 = [...(prev.camadas_2 || [])];
                                          newCamadas2[index].prof_de = newVal;
                                          if (newVal !== null && newCamadas2[index].prof_ate !== null) {
                                            newCamadas2[index].espessura = parseFloat((newCamadas2[index].prof_ate - newVal).toFixed(2));
                                          }
                                          return { ...prev, camadas_2: newCamadas2 };
                                        });
                                      }} disabled={!isEditable} className="h-8 text-xs text-center bg-white/50" placeholder="0,00" />
                                    </td>
                                    <td className="border border-[#00233B]/20 px-1 py-1">
                                      <Input type="number" step="0.01" value={camada.prof_ate ?? ''} onChange={e => {
                                        const newVal = e.target.value !== '' ? parseFloat(e.target.value) : null;
                                        setFormData(prev => {
                                          const newCamadas2 = [...(prev.camadas_2 || [])];
                                          newCamadas2[index].prof_ate = newVal;
                                          if (newVal !== null && newCamadas2[index].prof_de !== null) {
                                            newCamadas2[index].espessura = parseFloat((newVal - newCamadas2[index].prof_de).toFixed(2));
                                          }
                                          if (index + 1 < newCamadas2.length && newVal !== null) {
                                            newCamadas2[index + 1].prof_de = newVal;
                                          }
                                          return { ...prev, camadas_2: newCamadas2 };
                                        });
                                      }} disabled={!isEditable} className="h-8 text-xs text-center bg-white/50" placeholder="0,00" />
                                    </td>
                                    <td className="border border-[#00233B]/20 px-2 py-1 text-center text-xs font-medium text-[#00233B]/70 bg-black/10">
                                      {camada.espessura !== null && camada.espessura !== undefined ? camada.espessura.toFixed(2) : ''}
                                    </td>
                                    <td className="border border-[#00233B]/20 px-1 py-1">
                                      <Input type="number" step="0.01" value={camada.na ?? ''} onChange={e => {
                                        const newVal = e.target.value !== '' ? parseFloat(e.target.value) : null;
                                        setFormData(prev => {
                                          const newCamadas2 = [...(prev.camadas_2 || [])];
                                          newCamadas2[index].na = newVal;
                                          return { ...prev, camadas_2: newCamadas2 };
                                        });
                                      }} disabled={!isEditable} className="h-8 text-xs text-center bg-white/50" />
                                    </td>
                                    <td className="border border-[#00233B]/20 px-1 py-1">
                                      <Input value={camada.classificacao_2 ?? ''} onChange={e => {
                                        setFormData(prev => {
                                          const newCamadas2 = [...(prev.camadas_2 || [])];
                                          newCamadas2[index].classificacao_2 = e.target.value;
                                          return { ...prev, camadas_2: newCamadas2 };
                                        });
                                      }} disabled={!isEditable} className="h-8 text-xs bg-white/50" placeholder="Escrever" />
                                    </td>
                                    {isEditable && (
                                      <td className="border border-[#00233B]/20 px-1 py-1 text-center">
                                        <button type="button" onClick={() => removerCamada2(index)} className="text-red-400 hover:text-red-600">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* UMIDADE NATURAL 1 - DNER-ME 213/94 */}
              <Card className="bg-black/5 border-[#00233B]/10">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base text-[#00233B]">Umidade Natural 1 — DNER-ME 213/94</CardTitle>
                    {isEditable && !formData.umidade_natural_2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-[#00233B]/30 text-[#00233B] hover:bg-[#00233B]/10 text-xs"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          umidade_natural_2: {
                            camada_ensaiada_1: "",
                            no_capsula_1: "", no_capsula_2: "",
                            massa_capsula_1: null, massa_capsula_2: null,
                            massa_cap_solo_umido_1: null, massa_cap_solo_umido_2: null,
                            massa_cap_solo_seco_1: null, massa_cap_solo_seco_2: null,
                            massa_agua_1: null, massa_agua_2: null,
                            massa_solo_seco_1: null, massa_solo_seco_2: null,
                            umidade_1: null, umidade_2: null
                          }
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
                        {/* Camada ensaiada - campo único (colspan 2) */}
                        <tr className="bg-white/30">
                          <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80">Camada ensaiada</td>
                          <td className="border border-[#00233B]/20 px-2 py-1" colSpan={2}>
                            <Input value={formData.umidade_natural.camada_ensaiada_1 || ''} onChange={e => handleUmidadeChange('camada_ensaiada_1', e.target.value)} disabled={!isEditable} className="h-8 text-sm" placeholder="Ex.: 0,00 - 0,60m" />
                          </td>
                        </tr>
                        {/* Nº cápsula e demais campos individuais */}
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
                                  : numInput(formData.umidade_natural[f], v => handleUmidadeChange(f, v), !isEditable)
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                        {/* Campos calculados */}
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
                        {/* Umidade média (colspan 2) */}
                        <tr className="bg-[#BFCF99]/30">
                          <td className="border border-[#00233B]/20 px-3 py-2 font-bold text-[#00233B]">Umidade (%)</td>
                          <td className="border border-[#00233B]/20 px-3 py-2 text-center font-bold text-[#00233B] text-base" colSpan={2}>
                            {(() => {
                              const u1 = formData.umidade_natural.umidade_1;
                              const u2 = formData.umidade_natural.umidade_2;
                              if (u1 !== null && u1 !== undefined && u2 !== null && u2 !== undefined) {
                                return `${((u1 + u2) / 2).toFixed(2)} %`;
                              } else if (u1 !== null && u1 !== undefined) {
                                return `${u1.toFixed(2)} %`;
                              }
                              return '—';
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* UMIDADE NATURAL 2 - DNER-ME 213/94 (quando há 2ª classificação) */}
              {formData.umidade_natural_2 && (
                <Card className="bg-black/5 border-[#00233B]/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-[#00233B]">Umidade Natural 2 — DNER-ME 213/94</CardTitle>
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
                          {/* Camada ensaiada - campo único (colspan 2) */}
                          <tr className="bg-white/30">
                            <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80">Camada ensaiada</td>
                            <td className="border border-[#00233B]/20 px-2 py-1" colSpan={2}>
                              <Input value={formData.umidade_natural_2.camada_ensaiada_1 || ''} onChange={e => setFormData(prev => ({ ...prev, umidade_natural_2: { ...prev.umidade_natural_2, camada_ensaiada_1: e.target.value } }))} disabled={!isEditable} className="h-8 text-sm" placeholder="Ex.: 0,00 - 0,60m" />
                            </td>
                          </tr>
                          {/* Nº cápsula e demais campos individuais */}
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
                          {/* Campos calculados */}
                          {[
                            { label: "Massa da água (g)", keys: ['massa_agua_1', 'massa_agua_2'] },
                            { label: "Massa do solo seco (g)", keys: ['massa_solo_seco_1', 'massa_solo_seco_2'] },
                          ].map(({ label, keys }, ri) => (
                            <tr key={`calc-${ri}`} className="bg-[#BFCF99]/10">
                              <td className="border border-[#00233B]/20 px-3 py-1.5 font-medium text-[#00233B]/80 italic">{label}</td>
                              {keys.map((k, ki) => {
                                const { agua, soloSeco } = (() => {
                                  const un2 = formData.umidade_natural_2;
                                  const capSoloUmido = un2[`massa_cap_solo_umido_${ki + 1}`];
                                  const capSoloSeco = un2[`massa_cap_solo_seco_${ki + 1}`];
                                  const capsula = un2[`massa_capsula_${ki + 1}`];
                                  if (capSoloUmido && capSoloSeco && capsula !== null) {
                                    const agua = capSoloUmido - capSoloSeco;
                                    const soloSeco = capSoloSeco - capsula;
                                    return { agua: parseFloat(agua.toFixed(2)), soloSeco: parseFloat(soloSeco.toFixed(2)) };
                                  }
                                  return { agua: null, soloSeco: null };
                                })();
                                return (
                                  <td key={ki} className="border border-[#00233B]/20 px-3 py-1.5 text-center font-semibold text-[#00233B]">
                                    {k.includes('agua') ? (agua !== null ? agua.toFixed(2) : '—') : (soloSeco !== null ? soloSeco.toFixed(2) : '—')}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          {/* Umidade média (colspan 2) */}
                          <tr className="bg-[#BFCF99]/30">
                            <td className="border border-[#00233B]/20 px-3 py-2 font-bold text-[#00233B]">Umidade (%)</td>
                            <td className="border border-[#00233B]/20 px-3 py-2 text-center font-bold text-[#00233B] text-base" colSpan={2}>
                              {(() => {
                                const un2 = formData.umidade_natural_2;
                                const calcU = (idx) => {
                                  const csu = un2[`massa_cap_solo_umido_${idx}`];
                                  const css = un2[`massa_cap_solo_seco_${idx}`];
                                  const cap = un2[`massa_capsula_${idx}`];
                                  if (csu && css && cap !== null) {
                                    const ss = css - cap;
                                    return ss > 0 ? parseFloat((((csu - css) / ss) * 100).toFixed(2)) : null;
                                  }
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

              {/* DENSIDADE IN SITU */}
              <Card className="bg-black/5 border-[#00233B]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#00233B]">Massa Específica Aparente In Situ — DNER-ME 092/94</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna esquerda - entradas */}
                    <div className="space-y-3">
                      <div>
                        <Label>Camada ensaiada em campo</Label>
                        <Input value={formData.densidade_in_situ.camada_ensaiada || ''} onChange={e => handleDensidadeChange('camada_ensaiada', e.target.value)} disabled={!isEditable} className="h-9" />
                      </div>
                      <h4 className="font-semibold text-sm text-[#00233B]/70 uppercase tracking-wide pt-2">VOLUME</h4>
                      {[
                        { label: "Peso do frasco antes (gf)", field: "peso_frasco_antes" },
                        { label: "Peso do frasco depois (gf)", field: "peso_frasco_depois" },
                        { label: "Peso da areia no funil e placa (gf)", field: "peso_areia_funil_placa" },
                        { label: "Massa esp. aparente da areia (g/dm³)", field: "massa_esp_aparente_areia" },
                      ].map(({ label, field }) => (
                        <div key={field}>
                          <Label>{label}</Label>
                          {numInput(formData.densidade_in_situ[field], v => handleDensidadeChange(field, v), !isEditable, "", "0.001")}
                        </div>
                      ))}
                      <div className="p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded">
                        <p className="text-xs text-[#00233B]/70 font-medium">Peso da areia deslocada (gf)</p>
                        <p className="font-bold text-[#00233B]">{formData.densidade_in_situ.peso_areia_deslocada?.toFixed(2) ?? '—'}</p>
                      </div>
                      <div className="p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded">
                        <p className="text-xs text-[#00233B]/70 font-medium">Peso da areia na cavidade (gf)</p>
                        <p className="font-bold text-[#00233B]">{formData.densidade_in_situ.peso_areia_cavidade?.toFixed(2) ?? '—'}</p>
                      </div>
                      <div className="p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded">
                        <p className="text-xs text-[#00233B]/70 font-medium">Volume do buraco (dm³)</p>
                        <p className="font-bold text-[#00233B]">{formData.densidade_in_situ.volume_buraco?.toFixed(3) ?? '—'}</p>
                      </div>
                      <h4 className="font-semibold text-sm text-[#00233B]/70 uppercase tracking-wide pt-2">MASSA</h4>
                      {[
                        { label: "Peso do solo e recipiente (gf)", field: "peso_solo_recipiente" },
                        { label: "Peso do recipiente (gf)", field: "peso_recipiente" },
                      ].map(({ label, field }) => (
                        <div key={field}>
                          <Label>{label}</Label>
                          {numInput(formData.densidade_in_situ[field], v => handleDensidadeChange(field, v), !isEditable)}
                        </div>
                      ))}
                      <div className="p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded">
                        <p className="text-xs text-[#00233B]/70 font-medium">Peso do solo (gf)</p>
                        <p className="font-bold text-[#00233B]">{formData.densidade_in_situ.peso_solo?.toFixed(2) ?? '—'}</p>
                      </div>
                    </div>

                    {/* Coluna direita */}
                    <div className="space-y-3">
                      <div className="p-4 bg-[#BFCF99]/30 border border-[#BFCF99]/60 rounded-lg">
                        <p className="text-xs font-semibold text-[#00233B]/70 uppercase tracking-wide mb-1">Densidade aparente do solo úmido (g/dm³)</p>
                        <p className="text-2xl font-bold text-[#00233B]">{formData.densidade_in_situ.densidade_aparente_solo_umido?.toFixed(3) ?? '—'}</p>
                      </div>

                      <h4 className="font-semibold text-sm text-[#00233B]/70 uppercase tracking-wide pt-2">UMIDADE</h4>
                      {[
                        { label: "Peso do solo úmido (gf)", field: "peso_solo_umido" },
                        { label: "Peso do solo seco (gf)", field: "peso_solo_seco" },
                      ].map(({ label, field }) => (
                        <div key={field}>
                          <Label>{label}</Label>
                          {numInput(formData.densidade_in_situ[field], v => handleDensidadeChange(field, v), !isEditable)}
                        </div>
                      ))}
                      <div className="p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded">
                        <p className="text-xs text-[#00233B]/70 font-medium">Peso da água (gf)</p>
                        <p className="font-bold text-[#00233B]">{formData.densidade_in_situ.peso_agua?.toFixed(2) ?? '—'}</p>
                      </div>
                      <div className="p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded">
                        <p className="text-xs text-[#00233B]/70 font-medium">Teor de umidade (%)</p>
                        <p className="font-bold text-[#00233B]">{formData.densidade_in_situ.teor_umidade?.toFixed(2) ?? '—'}</p>
                      </div>
                      <div className="p-4 bg-[#BFCF99]/30 border border-[#BFCF99]/60 rounded-lg mt-4">
                        <p className="text-xs font-semibold text-[#00233B]/70 uppercase tracking-wide mb-1">Densidade aparente do solo seco (g/dm³)</p>
                        <p className="text-2xl font-bold text-[#00233B]">{formData.densidade_in_situ.densidade_aparente_solo_seco?.toFixed(3) ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
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
                    <input
                      id="fotos-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                    <label
                      htmlFor="fotos-upload"
                      className={`flex items-center justify-between w-full h-10 px-3 py-2 border border-[#00233B]/20 bg-white/30 rounded-md text-sm cursor-pointer hover:bg-white/50 ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
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
                        <img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-md border border-[#00233B]/20" />
                        {isEditable && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemovePhoto(index)}
                          >
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('MeusEnsaios'))}
                  className="hover:bg-black/10"
                >
                  Cancelar
                </Button>
                {isEditable && (
                  <Button type="submit" disabled={saving} className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                    {saving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Salvar Boletim</>
                    )}
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