import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { createPageUrl } from '@/utils';

// ─── Constants ────────────────────────────────────────────────────────────────
const DIMENSOES_CP = ['5x10', '15x30', '10x20'];
const IDADES_CP = [3, 7, 28, 63];

// ─── Pure calculation helpers (SRP) ──────────────────────────────────────────

/** Soma `dias` à data de moldagem e retorna string YYYY-MM-DD */
const calcularDataRuptura = (dataMoldagem, dias) => {
  if (!dataMoldagem || !dias) return '';
  const d = new Date(dataMoldagem + 'T00:00:00');
  d.setDate(d.getDate() + parseInt(dias));
  return d.toISOString().split('T')[0];
};

/** Calcula área do CP em cm² baseado na dimensão (A = π·r²) */
const calcularAreaCP = (dimensao) => {
  const diametroPorDimensao = { '5x10': 5, '15x30': 15, '10x20': 10 };
  const diametro = diametroPorDimensao[dimensao];
  if (!diametro) return '';
  return (Math.PI * (diametro / 2) ** 2).toFixed(2);
};

/** Calcula resistência em MPa: R = (carga / área) × 980,665 */
const calcularResistencia = (cargaRuptura, area) => {
  const carga = parseFloat(cargaRuptura);
  const areaCM2 = parseFloat(area);
  if (!carga || !areaCM2 || carga <= 0 || areaCM2 <= 0) return '';
  return ((carga / areaCM2) * 980.665).toFixed(2);
};

/** Calcula resistência à tração na flexão em MPa */
const calcularResistenciaFlexaoCp = (cp, serie) => {
  const carga = parseFloat(cp.carga_ruptura);
  const vao = parseFloat(serie.vao_central);
  const altura = parseFloat(serie.altura_cp);
  const largura = parseFloat(serie.largura_cp);
  if (!carga || !vao || !altura || !largura || largura <= 0 || altura <= 0) return '';
  if (cp.ponto_ruptura === 'No terço médio') {
    return ((carga * 9.80665 * vao) / (altura * largura ** 2)).toFixed(2);
  }
  if (cp.ponto_ruptura === 'Fora do terço médio') {
    return ((3 * carga * 9.80665 * vao) / (altura * largura ** 2)).toFixed(2);
  }
  return '';
};

// ─── Shared UI component (SRP + DRY) ─────────────────────────────────────────

/**
 * LabeledField — garante que todo label tenha htmlFor associado ao id do input.
 * Resolve o erro: "A form label must be associated with an input."
 */
const LabeledField = ({ id, label, children, className = '' }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-medium text-[#00233B] mb-2">
      {label}
    </label>
    {React.cloneElement(children, { id })}
  </div>
);

const LabeledFieldSm = ({ id, label, children }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-[#00233B] mb-1">
      {label}
    </label>
    {React.cloneElement(children, { id })}
  </div>
);

// ─── Data access helpers (SRP) ────────────────────────────────────────────────

const loadUser = () => base44.auth.me();

const loadObrasProjetosRegionais = () =>
  Promise.all([
    base44.entities.Obra.list(),
    base44.entities.Project.list(),
    base44.entities.Regional.list(),
  ]);

const filtrarObras = (obras, user, regionais) => {
  const nivel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const tiposPermitidos = ['implantacao', 'conservacao', 'supervisao'];
  if (nivel === 'user') {
    const regional = regionais.find(r =>
      (r.laboratoristas_responsaveis || []).some(
        e => e.toLowerCase() === user.email.toLowerCase()
      )
    );
    if (!regional) return [];
    return obras.filter(
      o => o.regional_id === regional.id && tiposPermitidos.includes(o.tipo_obra)
    );
  }
  return obras.filter(o => tiposPermitidos.includes(o.tipo_obra));
};

// ─── Serie factory helpers ────────────────────────────────────────────────────

function novaCpAxial() { return { numero_cp: '', carga_ruptura: '', resistencia: '' }; }
function novaSerie() {
  return {
    idade: '',
    dimensao: '5x10',
    data_ruptura: '',
    area_cp: calcularAreaCP('5x10'),
    cps: [novaCpAxial(), novaCpAxial()],
  };
}

function novaCpFlexao() { return { numero_cp: '', ponto_ruptura: '', carga_ruptura: '', resistencia: '' }; }
function novaSerieFlexao() {
  return {
    idade: '',
    data_ruptura: '',
    vao_central: '',
    altura_cp: '',
    largura_cp: '',
    cps: [novaCpFlexao(), novaCpFlexao()],
  };
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

const seriesToCompressaoAxial = (series) =>
  series.flatMap(s =>
    s.cps.map(cp => ({
      numero_cp: cp.numero_cp,
      idade: s.idade,
      dimensao: s.dimensao,
      data_ruptura: s.data_ruptura,
      carga_ruptura: cp.carga_ruptura,
      area_cp: s.area_cp,
      resistencia: cp.resistencia,
    }))
  );

const compressaoAxialToSeries = (compressaoAxial) => {
  const result = [];
  for (let i = 0; i < compressaoAxial.length; i += 2) {
    const cp1 = compressaoAxial[i] || {};
    const cp2 = compressaoAxial[i + 1] || {};
    result.push({
      idade: cp1.idade || '',
      dimensao: cp1.dimensao || '5x10',
      data_ruptura: cp1.data_ruptura || '',
      area_cp: cp1.area_cp || calcularAreaCP('5x10'),
      cps: [
        { numero_cp: cp1.numero_cp || '', carga_ruptura: cp1.carga_ruptura || '', resistencia: cp1.resistencia || '' },
        { numero_cp: cp2.numero_cp || '', carga_ruptura: cp2.carga_ruptura || '', resistencia: cp2.resistencia || '' },
      ],
    });
  }
  return result;
};

const seriesToTracaoFlexao = (series) =>
  series.flatMap(s =>
    s.cps.map(cp => ({
      numero_cp: cp.numero_cp,
      ponto_ruptura: cp.ponto_ruptura,
      idade: s.idade,
      data_ruptura: s.data_ruptura,
      vao_central: s.vao_central,
      altura_cp: s.altura_cp,
      largura_cp: s.largura_cp,
      carga_ruptura: cp.carga_ruptura,
      resistencia: cp.resistencia,
    }))
  );

const tracaoFlexaoToSeries = (tracaoFlexao) => {
  const result = [];
  for (let i = 0; i < tracaoFlexao.length; i += 2) {
    const cp1 = tracaoFlexao[i] || {};
    const cp2 = tracaoFlexao[i + 1] || {};
    result.push({
      idade: cp1.idade || '',
      data_ruptura: cp1.data_ruptura || '',
      vao_central: cp1.vao_central || '',
      altura_cp: cp1.altura_cp || '',
      largura_cp: cp1.largura_cp || '',
      cps: [
        { numero_cp: cp1.numero_cp || '', ponto_ruptura: cp1.ponto_ruptura || '', carga_ruptura: cp1.carga_ruptura || '', resistencia: cp1.resistencia || '' },
        { numero_cp: cp2.numero_cp || '', ponto_ruptura: cp2.ponto_ruptura || '', carga_ruptura: cp2.carga_ruptura || '', resistencia: cp2.resistencia || '' },
      ],
    });
  }
  return result;
};

// ─── Main component ───────────────────────────────────────────────────────────

const FORM_INITIAL = {
  obra_id: '', project_id: '',
  data_ensaio: new Date().toISOString().split('T')[0],
  laboratorista_name: '', cliente: '', rodovia: '',
  volume_betonado: '', fornecedor: '', hora_moldagem: '',
  trecho: '', projeto_trac: '', numero_moldagem: '',
  estrutura: '', construtora: '', nota_fiscal: '',
  estaca_moldagem: '', slump_test: '', temperatura_ambiente: '',
  hora_saida_usina: '', hora_chegada_campo: '',
  compressao_axial: [], tracao_flexao: [], observacoes: '',
};

export default function EnsaioRompimentoConcretoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState(FORM_INITIAL);
  const [series, setSeries] = useState([]);
  const [seriesFlexao, setSeriesFlexao] = useState([]);

  // ── Initial data load ──
  useEffect(() => {
    const init = async () => {
      try {
        const user = await loadUser();
        const [obrasData, projectsData, regionaisData] = await loadObrasProjetosRegionais();

        const obrasFiltradas = filtrarObras(obrasData, user, regionaisData);
        const projetosConcreto = projectsData.filter(p => p.tipo_projeto === 'CARTA_TRACO_CONCRETO');

        setObras(obrasFiltradas);
        setProjects(projetosConcreto);

        if (editId) {
          const ensaio = await base44.entities.EnsaioRompimentoConcreto.get(editId);
          setFormData({ ...ensaio, compressao_axial: ensaio.compressao_axial || [], tracao_flexao: ensaio.tracao_flexao || [] });
        } else {
          setFormData(prev => ({ ...prev, laboratorista_name: user.laboratorista_name || user.full_name }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [editId]);

  // ── Reconstruct series from formData when editing ──
  useEffect(() => {
    if (formData.compressao_axial?.length > 0 && series.length === 0) {
      setSeries(compressaoAxialToSeries(formData.compressao_axial));
    }
  }, [formData.compressao_axial]);

  useEffect(() => {
    if (formData.tracao_flexao?.length > 0 && seriesFlexao.length === 0) {
      setSeriesFlexao(tracaoFlexaoToSeries(formData.tracao_flexao));
    }
  }, [formData.tracao_flexao]);

  // ── Sync series → formData ──
  useEffect(() => {
    setFormData(prev => ({ ...prev, compressao_axial: seriesToCompressaoAxial(series) }));
  }, [series]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, tracao_flexao: seriesToTracaoFlexao(seriesFlexao) }));
  }, [seriesFlexao]);

  // ── Derived state ──
  const obraAtual = obras.find(o => o.id === formData.obra_id);
  const rodoviasDaObra = obraAtual?.rodovias || [];
  const empreiteirasObra = obraAtual?.empreiteiras || [];
  const isSupervisao = obraAtual?.tipo_obra === 'supervisao';
  const projectsDaObra = obraAtual
    ? projects.filter(p => p.regional_id === obraAtual.regional_id)
    : [];

  // ── Handlers ──
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleObraChange = useCallback(async (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    let clienteNome = '';
    if (obra?.regional_id) {
      try {
        const reg = await base44.entities.Regional.get(obra.regional_id);
        clienteNome = reg?.cliente || '';
      } catch (_) {}
    }
    setFormData(prev => ({
      ...prev,
      obra_id: obraId,
      rodovia: '',
      fornecedor: '',
      project_id: '',
      cliente: clienteNome,
      construtora: obra?.tipo_obra !== 'supervisao' ? clienteNome : '',
    }));
  }, [obras]);

  // ── Compressão Axial handlers ──
  const addSerie = () => { if (series.length < 4) setSeries(prev => [...prev, novaSerie()]); };
  const removeSerie = (idx) => setSeries(prev => prev.filter((_, i) => i !== idx));

  const updateSerie = (serieIdx, field, value) => {
    setSeries(prev => prev.map((s, i) => {
      if (i !== serieIdx) return s;
      const updated = { ...s, [field]: value };
      if (field === 'dimensao') {
        updated.area_cp = calcularAreaCP(value);
        updated.cps = updated.cps.map(cp => ({
          ...cp,
          resistencia: cp.carga_ruptura ? calcularResistencia(cp.carga_ruptura, updated.area_cp) : '',
        }));
      }
      if (field === 'idade') {
        updated.data_ruptura = calcularDataRuptura(formData.data_ensaio, value);
      }
      return updated;
    }));
  };

  const updateSerieCP = (serieIdx, cpIdx, field, value) => {
    setSeries(prev => prev.map((s, i) => {
      if (i !== serieIdx) return s;
      const novasCps = s.cps.map((cp, j) => {
        if (j !== cpIdx) return cp;
        const updated = { ...cp, [field]: value };
        if (field === 'carga_ruptura') updated.resistencia = calcularResistencia(value, s.area_cp);
        return updated;
      });
      return { ...s, cps: novasCps };
    }));
  };

  // ── Tração na Flexão handlers ──
  const addSerieFlexao = () => { if (seriesFlexao.length < 2) setSeriesFlexao(prev => [...prev, novaSerieFlexao()]); };
  const removeSerieFlexao = (idx) => setSeriesFlexao(prev => prev.filter((_, i) => i !== idx));

  const updateSerieFlexao = (serieIdx, field, value) => {
    setSeriesFlexao(prev => prev.map((s, i) => {
      if (i !== serieIdx) return s;
      const updated = { ...s, [field]: value };
      if (field === 'idade') updated.data_ruptura = calcularDataRuptura(formData.data_ensaio, value);
      updated.cps = updated.cps.map(cp => ({ ...cp, resistencia: calcularResistenciaFlexaoCp(cp, updated) }));
      return updated;
    }));
  };

  const updateSerieFlexaoCP = (serieIdx, cpIdx, field, value) => {
    setSeriesFlexao(prev => prev.map((s, i) => {
      if (i !== serieIdx) return s;
      const novasCps = s.cps.map((cp, j) => {
        if (j !== cpIdx) return cp;
        const updated = { ...cp, [field]: value };
        updated.resistencia = calcularResistenciaFlexaoCp(updated, s);
        return updated;
      });
      return { ...s, cps: novasCps };
    }));
  };

  // ── Save ──
  const handleSave = async (asFinal = false) => {
    if (!formData.obra_id) { alert('Selecione uma obra'); return; }
    setSaving(true);
    try {
      const dataToSave = { ...formData, status: asFinal ? 'finalizado' : 'rascunho' };
      if (editId) {
        await base44.entities.EnsaioRompimentoConcreto.update(editId, dataToSave);
        alert('Ensaio atualizado com sucesso!');
      } else {
        await base44.entities.EnsaioRompimentoConcreto.create(dataToSave);
        alert('Ensaio criado com sucesso!');
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar ensaio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Carregando...</div>;

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('MeusEnsaios'))} className="mb-6 text-[#00233B] hover:bg-black/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold text-[#00233B] mb-6">
          {editId ? 'Editar Ensaio Rompimento Concreto' : 'Novo Ensaio Rompimento Concreto'}
        </h1>

        <div className="space-y-6">
          {/* Dados do Cliente */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <CardTitle className="text-[#00233B]">Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <LabeledField id="obra_id" label="Obra*">
                  <select
                    value={formData.obra_id}
                    onChange={(e) => handleObraChange(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B]"
                  >
                    <option value="">Selecionar obra...</option>
                    {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.name}</option>)}
                  </select>
                </LabeledField>

                <LabeledField id="rodovia" label="Rodovia">
                  <select
                    value={formData.rodovia}
                    onChange={(e) => handleInputChange('rodovia', e.target.value)}
                    disabled={!formData.obra_id}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B] disabled:opacity-50"
                  >
                    <option value="">Selecionar...</option>
                    {rodoviasDaObra.map((rod) => <option key={rod} value={rod}>{rod}</option>)}
                  </select>
                </LabeledField>

                <LabeledField id="fornecedor" label="Fornecedor">
                  <Input
                    value={formData.fornecedor}
                    onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                    placeholder="Nome do fornecedor"
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </LabeledField>

                <LabeledField id="project_id" label="Carta Traço*">
                  <select
                    value={formData.project_id}
                    onChange={(e) => handleInputChange('project_id', e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B]"
                  >
                    <option value="">Selecionar...</option>
                    {projectsDaObra.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                  </select>
                </LabeledField>

                <LabeledField id="cliente" label="Cliente">
                  <Input value={formData.cliente} readOnly className="bg-white/10 border-white/20 text-[#00233B] opacity-70 cursor-not-allowed" />
                </LabeledField>

                <LabeledField id="volume_betonado" label="Volume Betonado (m³)">
                  <Input
                    type="number"
                    value={formData.volume_betonado}
                    onChange={(e) => handleInputChange('volume_betonado', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </LabeledField>

                <LabeledField id="hora_moldagem" label="Hora Moldagem">
                  <Input
                    type="time"
                    value={formData.hora_moldagem}
                    onChange={(e) => handleInputChange('hora_moldagem', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </LabeledField>

                <LabeledField id="laboratorista_name" label="Laboratorista">
                  <Input value={formData.laboratorista_name} disabled className="bg-white/10 border-white/20 text-[#00233B]/70" />
                </LabeledField>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Ensaio */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <CardTitle className="text-[#00233B]">Dados do Ensaio</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LabeledField id="trecho" label="Trecho">
                  <Input value={formData.trecho} onChange={(e) => handleInputChange('trecho', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="numero_moldagem" label="Número Moldagem">
                  <Input value={formData.numero_moldagem} onChange={(e) => handleInputChange('numero_moldagem', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="estrutura" label="Estrutura">
                  <Input value={formData.estrutura} onChange={(e) => handleInputChange('estrutura', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="construtora" label="Construtora">
                  {isSupervisao ? (
                    <select
                      value={formData.construtora}
                      onChange={(e) => handleInputChange('construtora', e.target.value)}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B]"
                    >
                      <option value="">Selecionar empreiteira...</option>
                      {empreiteirasObra.map((emp, idx) => <option key={idx} value={emp}>{emp}</option>)}
                    </select>
                  ) : (
                    <Input value={formData.construtora} readOnly className="bg-white/10 border-white/20 text-[#00233B] opacity-70 cursor-not-allowed" />
                  )}
                </LabeledField>

                <LabeledField id="nota_fiscal" label="Nota Fiscal">
                  <Input value={formData.nota_fiscal} onChange={(e) => handleInputChange('nota_fiscal', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="estaca_moldagem" label="Estaca Moldagem">
                  <Input value={formData.estaca_moldagem} onChange={(e) => handleInputChange('estaca_moldagem', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="slump_test" label="Slump Test (mm)">
                  <Input type="number" value={formData.slump_test} onChange={(e) => handleInputChange('slump_test', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="temperatura_ambiente" label="Temperatura Ambiente (°C)">
                  <Input type="number" value={formData.temperatura_ambiente} onChange={(e) => handleInputChange('temperatura_ambiente', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="hora_saida_usina" label="Hora Saída Usina">
                  <Input type="time" value={formData.hora_saida_usina} onChange={(e) => handleInputChange('hora_saida_usina', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="hora_chegada_campo" label="Hora Chegada Campo">
                  <Input type="time" value={formData.hora_chegada_campo} onChange={(e) => handleInputChange('hora_chegada_campo', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>

                <LabeledField id="data_ensaio" label="Data do Ensaio">
                  <Input type="date" value={formData.data_ensaio} onChange={(e) => handleInputChange('data_ensaio', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B]" />
                </LabeledField>
              </div>
            </CardContent>
          </Card>

          {/* Compressão Axial */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#00233B]">Resistência à Compressão Axial</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#00233B]/70">{series.length}/4 séries</span>
                  <Button onClick={addSerie} size="sm" disabled={series.length >= 4} className="bg-[#00233B] text-white disabled:opacity-50">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Série
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {series.map((serie, serieIdx) => (
                  <div key={serieIdx} className="border border-[#BFCF99]/40 rounded-lg p-4 bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-[#00233B]">Série {serieIdx + 1}</h4>
                      <Button onClick={() => removeSerie(serieIdx)} variant="destructive" size="sm" className="h-7 px-2">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-[#BFCF99]/10 rounded-lg border border-[#BFCF99]/20">
                      <LabeledFieldSm id={`serie-${serieIdx}-idade`} label="Idade (dias)">
                        <select
                          value={serie.idade}
                          onChange={(e) => updateSerie(serieIdx, 'idade', e.target.value)}
                          className="w-full px-2 py-1 border border-white/20 rounded bg-white/20 text-[#00233B] text-sm h-8"
                        >
                          <option value="">Selecionar...</option>
                          {IDADES_CP.map(d => <option key={d} value={d}>{d} dias</option>)}
                        </select>
                      </LabeledFieldSm>
                      <LabeledFieldSm id={`serie-${serieIdx}-dimensao`} label="Dimensão">
                        <select
                          value={serie.dimensao}
                          onChange={(e) => updateSerie(serieIdx, 'dimensao', e.target.value)}
                          className="w-full px-2 py-1 border border-white/20 rounded bg-white/20 text-[#00233B] text-sm h-8"
                        >
                          {DIMENSOES_CP.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </LabeledFieldSm>
                      <LabeledFieldSm id={`serie-${serieIdx}-data_ruptura`} label="Data Ruptura">
                        <Input value={serie.data_ruptura} readOnly className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm opacity-70 cursor-not-allowed" title="Calculada automaticamente pela idade + data do ensaio" />
                      </LabeledFieldSm>
                      <LabeledFieldSm id={`serie-${serieIdx}-area_cp`} label="Área CP (cm²)">
                        <Input value={serie.area_cp} readOnly className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm opacity-70 cursor-not-allowed" title="Calculada automaticamente pela dimensão" />
                      </LabeledFieldSm>
                    </div>

                    <div className="space-y-3">
                      {serie.cps.map((cp, cpIdx) => (
                        <div key={cpIdx} className="border border-white/10 rounded p-3 bg-white/5">
                          <p className="text-xs font-semibold text-[#00233B]/70 mb-2">CP {cpIdx + 1}</p>
                          <div className="grid grid-cols-3 gap-3">
                            <LabeledFieldSm id={`s${serieIdx}-cp${cpIdx}-numero_cp`} label="Número CP">
                              <Input value={cp.numero_cp} onChange={(e) => updateSerieCP(serieIdx, cpIdx, 'numero_cp', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm" />
                            </LabeledFieldSm>
                            <LabeledFieldSm id={`s${serieIdx}-cp${cpIdx}-carga_ruptura`} label="Carga Ruptura (tf)">
                              <Input type="number" step="0.01" value={cp.carga_ruptura} onChange={(e) => updateSerieCP(serieIdx, cpIdx, 'carga_ruptura', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm" />
                            </LabeledFieldSm>
                            <LabeledFieldSm id={`s${serieIdx}-cp${cpIdx}-resistencia`} label="Resistência (MPa)">
                              <Input value={cp.resistencia} readOnly className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm opacity-70 cursor-not-allowed" title="Calculada automaticamente" />
                            </LabeledFieldSm>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {series.length === 0 && (
                  <p className="text-center text-[#00233B]/60 py-4">Nenhuma série adicionada. Clique em "Adicionar Série" para começar.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tração na Flexão */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#00233B]">Resistência à Tração na Flexão</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#00233B]/70">{seriesFlexao.length}/2 séries</span>
                  <Button onClick={addSerieFlexao} size="sm" disabled={seriesFlexao.length >= 2} className="bg-[#00233B] text-white disabled:opacity-50">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Série
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {seriesFlexao.map((serie, serieIdx) => (
                  <div key={serieIdx} className="border border-[#BFCF99]/40 rounded-lg p-4 bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-[#00233B]">Série {serieIdx + 1}</h4>
                      <Button onClick={() => removeSerieFlexao(serieIdx)} variant="destructive" size="sm" className="h-7 px-2">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-3 bg-[#BFCF99]/10 rounded-lg border border-[#BFCF99]/20">
                      <LabeledFieldSm id={`fx-${serieIdx}-idade`} label="Idade (dias)">
                        <select
                          value={serie.idade}
                          onChange={(e) => updateSerieFlexao(serieIdx, 'idade', e.target.value)}
                          className="w-full px-2 py-1 border border-white/20 rounded bg-white/20 text-[#00233B] text-sm h-8"
                        >
                          <option value="">Selecionar...</option>
                          {IDADES_CP.map(d => <option key={d} value={d}>{d} dias</option>)}
                        </select>
                      </LabeledFieldSm>
                      <LabeledFieldSm id={`fx-${serieIdx}-data_ruptura`} label="Data Ruptura">
                        <Input value={serie.data_ruptura} readOnly className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm opacity-70 cursor-not-allowed" title="Calculada automaticamente" />
                      </LabeledFieldSm>
                      <LabeledFieldSm id={`fx-${serieIdx}-vao_central`} label="Vão Central (mm)">
                        <Input type="number" step="0.01" value={serie.vao_central} onChange={(e) => updateSerieFlexao(serieIdx, 'vao_central', e.target.value)} className="bg-white/20 border-white/20 text-[#00233B] h-8 text-sm" />
                      </LabeledFieldSm>
                      <LabeledFieldSm id={`fx-${serieIdx}-altura_cp`} label="Altura CP (mm)">
                        <Input type="number" step="0.01" value={serie.altura_cp} onChange={(e) => updateSerieFlexao(serieIdx, 'altura_cp', e.target.value)} className="bg-white/20 border-white/20 text-[#00233B] h-8 text-sm" />
                      </LabeledFieldSm>
                      <LabeledFieldSm id={`fx-${serieIdx}-largura_cp`} label="Largura CP (mm)">
                        <Input type="number" step="0.01" value={serie.largura_cp} onChange={(e) => updateSerieFlexao(serieIdx, 'largura_cp', e.target.value)} className="bg-white/20 border-white/20 text-[#00233B] h-8 text-sm" />
                      </LabeledFieldSm>
                    </div>

                    <div className="space-y-3">
                      {serie.cps.map((cp, cpIdx) => (
                        <div key={cpIdx} className="border border-white/10 rounded p-3 bg-white/5">
                          <p className="text-xs font-semibold text-[#00233B]/70 mb-2">CP {cpIdx + 1}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <LabeledFieldSm id={`fx-s${serieIdx}-cp${cpIdx}-numero_cp`} label="Número CP">
                              <Input value={cp.numero_cp} onChange={(e) => updateSerieFlexaoCP(serieIdx, cpIdx, 'numero_cp', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm" />
                            </LabeledFieldSm>
                            <LabeledFieldSm id={`fx-s${serieIdx}-cp${cpIdx}-ponto_ruptura`} label="Ponto de Ruptura">
                              <select
                                value={cp.ponto_ruptura || ''}
                                onChange={(e) => updateSerieFlexaoCP(serieIdx, cpIdx, 'ponto_ruptura', e.target.value)}
                                className="w-full px-2 py-1 border border-white/20 rounded bg-white/10 text-[#00233B] text-sm h-8"
                              >
                                <option value="">Selecionar...</option>
                                <option value="No terço médio">No terço médio</option>
                                <option value="Fora do terço médio">Fora do terço médio</option>
                              </select>
                            </LabeledFieldSm>
                            <LabeledFieldSm id={`fx-s${serieIdx}-cp${cpIdx}-carga_ruptura`} label="Carga Ruptura (kgf)">
                              <Input type="number" step="0.01" value={cp.carga_ruptura} onChange={(e) => updateSerieFlexaoCP(serieIdx, cpIdx, 'carga_ruptura', e.target.value)} className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm" />
                            </LabeledFieldSm>
                            <LabeledFieldSm id={`fx-s${serieIdx}-cp${cpIdx}-resistencia`} label="Resistência (MPa)">
                              <Input value={cp.resistencia || ''} readOnly className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm opacity-70 cursor-not-allowed" title="Calculada automaticamente" />
                            </LabeledFieldSm>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {seriesFlexao.length === 0 && (
                  <p className="text-center text-[#00233B]/60 py-4">Nenhuma série adicionada. Clique em "Adicionar Série" para começar.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <CardTitle className="text-[#00233B]">Observações</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <label htmlFor="observacoes" className="sr-only">Observações gerais</label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações gerais"
                className="bg-white/10 border-white/20 text-[#00233B] h-24"
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))} className="border-white/20 text-[#00233B]">
              Cancelar
            </Button>
            <Button onClick={() => handleSave(false)} disabled={saving} className="bg-[#00233B] text-white hover:bg-[#00233B]/90">
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-[#566E3D] text-white hover:bg-[#566E3D]/90">
              {saving ? 'Salvando...' : 'Finalizar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}