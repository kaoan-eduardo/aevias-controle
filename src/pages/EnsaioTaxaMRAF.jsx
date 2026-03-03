import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertTriangle, Loader2, Plus, Trash2, CheckCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const getEnsaioInicial = (numero) => ({
  numero,
  estaca: "",
  posicao: "",
  peso_bandeja_amostra: null,
  peso_bandeja: null,
  peso_amostra: null,
  taxa_mraf_aplicada: null,
  teor_ligante: null,
  taxa_ligante: null,
  residuo_emulsao: null,
  taxa_emulsao: null,
  taxa_agregado: null,
});

const calcularEnsaio = (ensaio, areaBandeja) => {
  const e = { ...ensaio };

  // PA = P1 - P2
  if (e.peso_bandeja_amostra != null && e.peso_bandeja != null) {
    e.peso_amostra = parseFloat((e.peso_bandeja_amostra - e.peso_bandeja).toFixed(2));
  }

  // Tx = PA / (1000 * A)
  if (e.peso_amostra != null && areaBandeja) {
    e.taxa_mraf_aplicada = parseFloat((e.peso_amostra / (1000 * areaBandeja)).toFixed(3));
  }

  // TL = (Tx * L) / (100 + L)
  if (e.taxa_mraf_aplicada != null && e.teor_ligante != null) {
    e.taxa_ligante = parseFloat(((e.taxa_mraf_aplicada * e.teor_ligante) / (100 + e.teor_ligante)).toFixed(3));
  }

  // TE = TL / R
  if (e.taxa_ligante != null && e.residuo_emulsao != null && e.residuo_emulsao !== 0) {
    e.taxa_emulsao = parseFloat((e.taxa_ligante / (e.residuo_emulsao / 100)).toFixed(3));
  }

  // TA = Tx - TL
  if (e.taxa_mraf_aplicada != null && e.taxa_ligante != null) {
    e.taxa_agregado = parseFloat((e.taxa_mraf_aplicada - e.taxa_ligante).toFixed(3));
  }

  return e;
};

const calcularMedias = (ensaios) => {
  const validos = ensaios.filter(e => e.taxa_mraf_aplicada != null);
  if (validos.length === 0) return { media_taxa_emulsao: null, media_taxa_agregado: null, media_taxa_mraf: null };
  const media_taxa_emulsao = parseFloat((validos.filter(e => e.taxa_emulsao != null).reduce((s, e) => s + e.taxa_emulsao, 0) / (validos.filter(e => e.taxa_emulsao != null).length || 1)).toFixed(3));
  const media_taxa_agregado = parseFloat((validos.filter(e => e.taxa_agregado != null).reduce((s, e) => s + e.taxa_agregado, 0) / (validos.filter(e => e.taxa_agregado != null).length || 1)).toFixed(3));
  const media_taxa_mraf = parseFloat((validos.reduce((s, e) => s + e.taxa_mraf_aplicada, 0) / validos.length).toFixed(3));
  return { media_taxa_emulsao, media_taxa_agregado, media_taxa_mraf };
};

export default function EnsaioTaxaMRAFPage() {
  const [formData, setFormData] = useState({
    obra_id: "",
    data_ensaio: new Date().toISOString().split('T')[0],
    laboratorista_name: "",
    rodovia: "",
    trecho: "",
    placa_caminhao: "",
    material: "",
    numero_projeto: "",
    dimensoes_bandeja: { lado_1: null, lado_2: null, area: null },
    ensaios: [getEnsaioInicial(1)],
    observacoes: "",
    status: "rascunho"
  });

  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEnsaio, setEditingEnsaio] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isApproved = editingEnsaio?.approved === true;
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
      let availableObras = obrasData.filter(o =>
        o.tipo_obra === 'implantacao' || o.tipo_obra === 'conservacao' || o.tipo_obra === 'supervisao'
      );

      if (accessLevel === 'user') {
        const regional = regionaisData.find(r =>
          (r.laboratoristas_responsaveis || []).some(e => e.toLowerCase() === currentUser.email.toLowerCase())
        );
        availableObras = regional
          ? availableObras.filter(o => o.regional_id === regional.id && o.status === 'em_andamento')
          : [];
      }

      setObras(availableObras);
      setRegionais(regionaisData);

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const existing = await base44.entities.EnsaioTaxaMRAF.get(editId);
        setEditingEnsaio(existing);
        setFormData({
          ...existing,
          ensaios: existing.ensaios?.length > 0 ? existing.ensaios : [getEnsaioInicial(1)],
          data_ensaio: existing.data_ensaio || new Date().toISOString().split('T')[0]
        });
      } else {
        setFormData(prev => ({
          ...prev,
          laboratorista_name: currentUser.laboratorista_name || currentUser.full_name,
          obra_id: availableObras[0]?.id || ""
        }));
      }
    } catch (err) {
      console.error(err);
      navigate(createPageUrl('MeusEnsaios'));
    } finally {
      setLoading(false);
    }
  };

  const handleDimensoesChange = useCallback((field, value) => {
    setFormData(prev => {
      const novas = { ...prev.dimensoes_bandeja, [field]: value };
      if (novas.lado_1 && novas.lado_2) {
        novas.area = parseFloat(((novas.lado_1 * novas.lado_2) / 10000).toFixed(4));
      }
      const novosEnsaios = prev.ensaios.map(e => calcularEnsaio(e, novas.area));
      const medias = calcularMedias(novosEnsaios);
      return { ...prev, dimensoes_bandeja: novas, ensaios: novosEnsaios, ...medias };
    });
  }, []);

  const handleEnsaioChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const novos = [...prev.ensaios];
      novos[index] = calcularEnsaio({ ...novos[index], [field]: value }, prev.dimensoes_bandeja.area);
      const medias = calcularMedias(novos);
      return { ...prev, ensaios: novos, ...medias };
    });
  }, []);

  const adicionarEnsaio = () => {
    setFormData(prev => {
      if (prev.ensaios.length >= 4) return prev;
      return { ...prev, ensaios: [...prev.ensaios, getEnsaioInicial(prev.ensaios.length + 1)] };
    });
  };

  const removerEnsaio = (index) => {
    setFormData(prev => {
      if (prev.ensaios.length <= 1) return prev;
      const novos = prev.ensaios.filter((_, i) => i !== index).map((e, i) => ({ ...e, numero: i + 1 }));
      return { ...prev, ensaios: novos, ...calcularMedias(novos) };
    });
  };

  const handleSubmit = async (finalizar = false) => {
    if (!formData.obra_id || !formData.data_ensaio) {
      alert("Preencha Obra e Data.");
      return;
    }
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        laboratorista_name: user?.laboratorista_name || user?.full_name,
        status: finalizar ? 'finalizado' : 'rascunho'
      };

      if (editingEnsaio) {
        if (editingEnsaio.approved === false) {
          dataToSave.approved = null;
          dataToSave.rejection_reason = null;
          dataToSave.approved_by = null;
          dataToSave.approved_date = null;
          dataToSave.was_rejected = true;
        }
        await base44.entities.EnsaioTaxaMRAF.update(editingEnsaio.id, dataToSave);
      } else {
        await base44.entities.EnsaioTaxaMRAF.create(dataToSave);
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar ensaio.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#00233B]/50" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#00233B]">
              {editingEnsaio ? 'Editar' : 'Novo'} Ensaio de Taxa de MRAF
            </CardTitle>
            <CardDescription className="text-[#00233B]/80">
              ABNT NBR 14746 / Método da Bandeja
            </CardDescription>
            {editingEnsaio?.rejection_reason && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50/50 border border-red-200/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{editingEnsaio.rejection_reason}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados da Obra */}
            <div>
              <h3 className="text-lg font-semibold text-[#00233B] mb-4">Dados da Obra</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Obra *</Label>
                  <select
                    value={formData.obra_id}
                    onChange={e => setFormData(prev => ({ ...prev, obra_id: e.target.value }))}
                    disabled={!isEditable}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Selecione a obra</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.name} - {o.code}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Data do Ensaio *</Label>
                  <Input type="date" value={formData.data_ensaio} onChange={e => setFormData(prev => ({ ...prev, data_ensaio: e.target.value }))} disabled={!isEditable} />
                </div>
                <div>
                  <Label>Placa Caminhão</Label>
                  <Input value={formData.placa_caminhao} onChange={e => setFormData(prev => ({ ...prev, placa_caminhao: e.target.value }))} disabled={!isEditable} placeholder="Ex: ABC-1234" />
                </div>
                <div>
                  <Label>Rodovia</Label>
                  <select
                    value={formData.rodovia}
                    onChange={e => setFormData(prev => ({ ...prev, rodovia: e.target.value }))}
                    disabled={!isEditable}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Selecione a rodovia</option>
                    {obras.find(o => o.id === formData.obra_id)?.rodovias?.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Trecho</Label>
                  <Input value={formData.trecho} onChange={e => setFormData(prev => ({ ...prev, trecho: e.target.value }))} disabled={!isEditable} />
                </div>
                <div>
                  <Label>Material</Label>
                  <Input value={formData.material} onChange={e => setFormData(prev => ({ ...prev, material: e.target.value }))} disabled={!isEditable} placeholder="Ex: MRAF" />
                </div>
                <div>
                  <Label>Nº do Projeto</Label>
                  <Input value={formData.numero_projeto} onChange={e => setFormData(prev => ({ ...prev, numero_projeto: e.target.value }))} disabled={!isEditable} />
                </div>
                <div>
                  <Label>Laboratorista</Label>
                  <Input value={formData.laboratorista_name} readOnly className="bg-slate-100" />
                </div>
              </div>
            </div>

            {/* Dimensões da Bandeja */}
            <Card className="bg-black/5">
              <CardHeader><CardTitle className="text-base">Área da Bandeja (global para todos os ensaios)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Lado 1 - L₁ (cm)</Label>
                    <Input type="number" step="0.1" value={formData.dimensoes_bandeja.lado_1 || ''} onChange={e => handleDimensoesChange('lado_1', e.target.value ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="bg-white" />
                  </div>
                  <div>
                    <Label>Lado 2 - L₂ (cm)</Label>
                    <Input type="number" step="0.1" value={formData.dimensoes_bandeja.lado_2 || ''} onChange={e => handleDimensoesChange('lado_2', e.target.value ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="bg-white" />
                  </div>
                  <div>
                    <Label>Área A = L₁×L₂/10000 (m²)</Label>
                    <Input value={formData.dimensoes_bandeja.area?.toFixed(4) || ''} readOnly className="bg-slate-200" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ensaios */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#00233B]">Execução dos Ensaios (máx. 4)</h3>
                {isEditable && (
                  <Button type="button" onClick={adicionarEnsaio} className="bg-[#00233B] text-[#F2F1EF]" disabled={formData.ensaios.length >= 4}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Bandeja
                  </Button>
                )}
              </div>

              {formData.ensaios.map((ensaio, index) => (
                <Card key={index} className="mb-4 bg-black/5">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Bandeja {ensaio.numero}</CardTitle>
                      {isEditable && formData.ensaios.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removerEnsaio(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Identificação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Estaca do Ensaio</Label>
                        <Input value={ensaio.estaca} onChange={e => handleEnsaioChange(index, 'estaca', e.target.value)} disabled={!isEditable} placeholder="Ex: E-245" className="bg-white" />
                      </div>
                      <div>
                        <Label>Posição</Label>
                        <Input value={ensaio.posicao} onChange={e => handleEnsaioChange(index, 'posicao', e.target.value)} disabled={!isEditable} placeholder="Ex: Faixa 1" className="bg-white" />
                      </div>
                    </div>

                    {/* Dados de pesagem */}
                    <h4 className="font-semibold text-sm">Pesagem</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>P₁ - Peso Bandeja+Amostra (g)</Label>
                        <Input type="number" step="0.1" value={ensaio.peso_bandeja_amostra ?? ''} onChange={e => handleEnsaioChange(index, 'peso_bandeja_amostra', e.target.value ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="bg-white" />
                      </div>
                      <div>
                        <Label>P₂ - Peso da Bandeja (g)</Label>
                        <Input type="number" step="0.1" value={ensaio.peso_bandeja ?? ''} onChange={e => handleEnsaioChange(index, 'peso_bandeja', e.target.value ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="bg-white" />
                      </div>
                      <div>
                        <Label>Pₐ - Peso da Amostra (g) <span className="text-slate-500 text-xs">(calculado)</span></Label>
                        <Input value={ensaio.peso_amostra?.toFixed(2) ?? ''} readOnly className="bg-slate-200" />
                      </div>
                    </div>

                    {/* Parâmetros de extração */}
                    <h4 className="font-semibold text-sm">Parâmetros de Extração</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>L - Teor de Ligante (%) <span className="text-slate-500 text-xs">(ensaio extração)</span></Label>
                        <Input type="number" step="0.01" value={ensaio.teor_ligante ?? ''} onChange={e => handleEnsaioChange(index, 'teor_ligante', e.target.value ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="bg-white" />
                      </div>
                      <div>
                        <Label>R - Resíduo da Emulsão (%)</Label>
                        <Input type="number" step="0.01" value={ensaio.residuo_emulsao ?? ''} onChange={e => handleEnsaioChange(index, 'residuo_emulsao', e.target.value ? parseFloat(e.target.value) : null)} disabled={!isEditable} className="bg-white" />
                      </div>
                    </div>

                    {/* Resultados calculados */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="p-3 bg-blue-200 rounded">
                        <Label className="text-xs text-blue-800">Tₓ - Taxa MRAF Aplicada (kg/m²)</Label>
                        <p className="text-lg font-bold text-blue-900">{ensaio.taxa_mraf_aplicada?.toFixed(3) || '-'}</p>
                      </div>
                      <div className="p-3 bg-blue-200 rounded">
                        <Label className="text-xs text-blue-800">T_L - Taxa de Ligante (L/m²)</Label>
                        <p className="text-lg font-bold text-blue-900">{ensaio.taxa_ligante?.toFixed(3) || '-'}</p>
                      </div>
                      <div className="p-3 bg-green-200 rounded">
                        <Label className="text-xs text-green-800">T_E - Taxa de Emulsão (L/m²)</Label>
                        <p className="text-lg font-bold text-green-900">{ensaio.taxa_emulsao?.toFixed(3) || '-'}</p>
                      </div>
                      <div className="p-3 bg-green-200 rounded">
                        <Label className="text-xs text-green-800">T_A - Taxa de Agregado (kg/m²)</Label>
                        <p className="text-lg font-bold text-green-900">{ensaio.taxa_agregado?.toFixed(3) || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Médias */}
            <Card className="bg-slate-50">
              <CardHeader><CardTitle className="text-base">Médias Gerais</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-100 rounded text-center">
                    <Label className="text-xs text-blue-800">Taxa de Emulsão Média (L/m²)</Label>
                    <p className="text-xl font-bold text-blue-900">{formData.media_taxa_emulsao?.toFixed(3) || '-'}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded text-center">
                    <Label className="text-xs text-green-800">Taxa de Agregado Média (kg/m²)</Label>
                    <p className="text-xl font-bold text-green-900">{formData.media_taxa_agregado?.toFixed(3) || '-'}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded text-center">
                    <Label className="text-xs text-purple-800">Taxa MRAF Aplicada Média (kg/m²)</Label>
                    <p className="text-xl font-bold text-purple-900">{formData.media_taxa_mraf?.toFixed(3) || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <div>
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} disabled={!isEditable} rows={3} />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))}>Cancelar</Button>
              {isEditable && (
                <>
                  <Button onClick={() => handleSubmit(false)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Rascunho
                  </Button>
                  <Button onClick={() => handleSubmit(true)} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Ensaio
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}