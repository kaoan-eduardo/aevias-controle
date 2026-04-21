import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { createPageUrl } from '@/utils';

const DIMENSOES_CP = ['5x10', '15x30', '10x20'];

// Calcula área do corpo de prova baseado na dimensão (diâmetro em cm)
// Fórmula: A = π * (d/2)²
const calcularAreaCP = (dimensao) => {
  const diametroDiametros = {
    '5x10': 5,
    '15x30': 15,
    '10x20': 10
  };
  
  const diametro = diametroDiametros[dimensao];
  if (!diametro) return '';
  
  const raio = diametro / 2;
  const area = Math.PI * (raio * raio);
  return area.toFixed(2);
};

// Calcula resistência em MPa
// Fórmula: R = (CARGA_RUPTURA / ÁREA) / (10,197 * 1000)
const calcularResistencia = (cargaRuptura, area) => {
  const carga = parseFloat(cargaRuptura);
  const areaCM2 = parseFloat(area);
  
  if (!carga || !areaCM2 || carga <= 0 || areaCM2 <= 0) return '';
  
  const resistencia = (carga / areaCM2) / (10.197 * 1000);
  return resistencia.toFixed(2);
};

export default function EnsaioRompimentoConcretoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [empreiteiras, setEmpreiteiras] = useState([]);

  const [formData, setFormData] = useState({
    obra_id: '',
    project_id: '',
    data_ensaio: new Date().toISOString().split('T')[0],
    laboratorista_name: '',
    cliente: '',
    rodovia: '',
    volume_betonado: '',
    fornecedor: '',
    hora_moldagem: '',
    trecho: '',
    projeto_trac: '',
    numero_moldagem: '',
    estrutura: '',
    construtora: '',
    nota_fiscal: '',
    estaca_moldagem: '',
    slump_test: '',
    temperatura_ambiente: '',
    hora_saida_usina: '',
    hora_chegada_campo: '',
    compressao_axial: [],
    tracao_flexao: [],
    observacoes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [obrasData, projectsData, regionaisData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Project.list(),
        base44.entities.Regional.list()
      ]);

      const userAccessLevel = currentUser?.access_level || (currentUser?.role === 'admin' ? 'admin' : 'user');
      let obrasFiltradas = obrasData;

      if (userAccessLevel === 'user') {
        const regionalDoLaboratorista = regionaisData.find(regional => {
          const laboratoristas = regional.laboratoristas_responsaveis || [];
          return laboratoristas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
        });
        if (regionalDoLaboratorista) {
          obrasFiltradas = obrasData.filter(obra => 
            obra.regional_id === regionalDoLaboratorista.id &&
            (obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'conservacao')
          );
        } else {
          obrasFiltradas = [];
        }
      } else {
        obrasFiltradas = obrasData.filter(obra => 
          obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'conservacao'
        );
      }

      // Filtrar apenas projetos CARTA_TRACO_CONCRETO
      const projetosConcreto = projectsData.filter(p => p.tipo_projeto === 'CARTA_TRACO_CONCRETO');

      setObras(obrasFiltradas);
      setProjects(projetosConcreto);

      // Extrair empreiteiras únicas de todas as obras filtradas
      const empreiteirasSet = new Set();
      obrasFiltradas.forEach(obra => {
        if (obra.empreiteiras && Array.isArray(obra.empreiteiras)) {
          obra.empreiteiras.forEach(emp => empreiteirasSet.add(emp));
        }
      });
      setEmpreiteiras(Array.from(empreiteirasSet).sort());

      if (editId) {
        const ensaio = await base44.entities.EnsaioRompimentoConcreto.get(editId);
        setFormData({
          ...ensaio,
          compressao_axial: ensaio.compressao_axial || [],
          tracao_flexao: ensaio.tracao_flexao || []
        });
      } else {
        setFormData(prev => ({
          ...prev,
          laboratorista_name: currentUser.laboratorista_name || currentUser.full_name
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleObraChange = (obraId) => {
    handleInputChange('obra_id', obraId);
    const obra = obras.find(o => o.id === obraId);
    if (obra) {
      handleInputChange('rodovia', '');
      handleInputChange('fornecedor', '');
    }
  };

  const obraAtual = obras.find(o => o.id === formData.obra_id);
  const rodoviasDaObra = obraAtual?.rodovias || [];
  const empreiteirasObra = obraAtual?.empreiteiras || [];
  const projectsDaObra = projects.filter(p => formData.obra_id ? true : false);

  // Séries: cada série tem campos compartilhados + 2 CPs com número e carga individuais
  const [series, setSeries] = useState(() => {
    // inicializar séries a partir de compressao_axial existente ao editar
    return [];
  });

  // Sincronizar series com compressao_axial ao carregar editId
  useEffect(() => {
    if (formData.compressao_axial && formData.compressao_axial.length > 0 && series.length === 0) {
      const seriesReconstruidas = [];
      for (let i = 0; i < formData.compressao_axial.length; i += 2) {
        const cp1 = formData.compressao_axial[i] || {};
        const cp2 = formData.compressao_axial[i + 1] || {};
        seriesReconstruidas.push({
          idade: cp1.idade || '',
          dimensao: cp1.dimensao || '5x10',
          data_ruptura: cp1.data_ruptura || '',
          area_cp: cp1.area_cp || calcularAreaCP('5x10'),
          cps: [
            { numero_cp: cp1.numero_cp || '', carga_ruptura: cp1.carga_ruptura || '', resistencia: cp1.resistencia || '' },
            { numero_cp: cp2.numero_cp || '', carga_ruptura: cp2.carga_ruptura || '', resistencia: cp2.resistencia || '' }
          ]
        });
      }
      if (seriesReconstruidas.length > 0) setSeries(seriesReconstruidas);
    }
  }, [formData.compressao_axial]);

  // Sempre que series mudar, sincronizar de volta para formData.compressao_axial
  useEffect(() => {
    const cps = [];
    series.forEach(s => {
      s.cps.forEach(cp => {
        cps.push({
          numero_cp: cp.numero_cp,
          idade: s.idade,
          dimensao: s.dimensao,
          data_ruptura: s.data_ruptura,
          carga_ruptura: cp.carga_ruptura,
          area_cp: s.area_cp,
          resistencia: cp.resistencia
        });
      });
    });
    setFormData(prev => ({ ...prev, compressao_axial: cps }));
  }, [series]);

  const novaSerie = () => ({
    idade: '',
    dimensao: '5x10',
    data_ruptura: '',
    area_cp: calcularAreaCP('5x10'),
    cps: [
      { numero_cp: '', carga_ruptura: '', resistencia: '' },
      { numero_cp: '', carga_ruptura: '', resistencia: '' }
    ]
  });

  const addSerie = () => {
    if (series.length >= 4) return;
    setSeries(prev => [...prev, novaSerie()]);
  };

  const removeSerie = (serieIdx) => {
    setSeries(prev => prev.filter((_, i) => i !== serieIdx));
  };

  const updateSerie = (serieIdx, field, value) => {
    setSeries(prev => {
      const novo = prev.map((s, i) => i === serieIdx ? { ...s, [field]: value } : s);
      if (field === 'dimensao') {
        const area = calcularAreaCP(value);
        novo[serieIdx].area_cp = area;
        // Recalcular resistência dos 2 CPs
        novo[serieIdx].cps = novo[serieIdx].cps.map(cp => ({
          ...cp,
          resistencia: cp.carga_ruptura ? calcularResistencia(cp.carga_ruptura, area) : ''
        }));
      }
      return novo;
    });
  };

  const updateSerieCP = (serieIdx, cpIdx, field, value) => {
    setSeries(prev => {
      const novo = prev.map((s, i) => {
        if (i !== serieIdx) return s;
        const novasCps = s.cps.map((cp, j) => j === cpIdx ? { ...cp, [field]: value } : cp);
        if (field === 'carga_ruptura') {
          novasCps[cpIdx].resistencia = calcularResistencia(value, s.area_cp);
        }
        return { ...s, cps: novasCps };
      });
      return novo;
    });
  };



  const addTracaoFlexao = () => {
    setFormData(prev => ({
      ...prev,
      tracao_flexao: [...prev.tracao_flexao, {
        numero_cp: '',
        idade: '',
        data_ruptura: '',
        carga_ruptura: '',
        vao_central: '',
        resistencia: ''
      }]
    }));
  };

  const removeTracaoFlexao = (idx) => {
    setFormData(prev => ({
      ...prev,
      tracao_flexao: prev.tracao_flexao.filter((_, i) => i !== idx)
    }));
  };

  const updateTracaoFlexao = (idx, field, value) => {
    setFormData(prev => {
      const novo = { ...prev };
      novo.tracao_flexao[idx] = { ...novo.tracao_flexao[idx], [field]: value };
      return novo;
    });
  };

  const handleSave = async (asFinal = false) => {
    if (!formData.obra_id) {
      alert('Selecione uma obra');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: asFinal ? 'finalizado' : 'rascunho'
      };

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

  if (loading) {
    return <div className="p-6 text-center">Carregando...</div>;
  }

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('MeusEnsaios'))}
          className="mb-6 text-[#00233B] hover:bg-black/5"
        >
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
                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Obra*</label>
                  <select
                    value={formData.obra_id}
                    onChange={(e) => handleObraChange(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B]"
                  >
                    <option value="">Selecionar obra...</option>
                    {obras.map(obra => (
                      <option key={obra.id} value={obra.id}>{obra.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Rodovia</label>
                  <select
                    value={formData.rodovia}
                    onChange={(e) => handleInputChange('rodovia', e.target.value)}
                    disabled={!formData.obra_id}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B] disabled:opacity-50"
                  >
                    <option value="">Selecionar...</option>
                    {rodoviasDaObra.map((rod, idx) => (
                      <option key={idx} value={rod}>{rod}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Fornecedor</label>
                  <select
                    value={formData.fornecedor}
                    onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B]"
                  >
                    <option value="">Selecionar...</option>
                    {empreiteirasObra.map((emp, idx) => (
                      <option key={idx} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Carta Traço*</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => handleInputChange('project_id', e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B]"
                  >
                    <option value="">Selecionar...</option>
                    {projectsDaObra.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Cliente</label>
                  <Input
                    value={formData.cliente}
                    onChange={(e) => handleInputChange('cliente', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Volume Betonado (m³)</label>
                  <Input
                    type="number"
                    value={formData.volume_betonado}
                    onChange={(e) => handleInputChange('volume_betonado', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Hora Moldagem</label>
                  <Input
                    type="time"
                    value={formData.hora_moldagem}
                    onChange={(e) => handleInputChange('hora_moldagem', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Laboratorista</label>
                  <Input
                    value={formData.laboratorista_name}
                    disabled
                    className="bg-white/10 border-white/20 text-[#00233B]/70"
                  />
                </div>
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
                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Trecho</label>
                  <Input
                    value={formData.trecho}
                    onChange={(e) => handleInputChange('trecho', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Projeto/Traço</label>
                  <Input
                    value={formData.projeto_trac}
                    onChange={(e) => handleInputChange('projeto_trac', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Número Moldagem</label>
                  <Input
                    value={formData.numero_moldagem}
                    onChange={(e) => handleInputChange('numero_moldagem', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Estrutura</label>
                  <Input
                    value={formData.estrutura}
                    onChange={(e) => handleInputChange('estrutura', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Construtora</label>
                  <Input
                    value={formData.construtora}
                    onChange={(e) => handleInputChange('construtora', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Nota Fiscal</label>
                  <Input
                    value={formData.nota_fiscal}
                    onChange={(e) => handleInputChange('nota_fiscal', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Estaca Moldagem</label>
                  <Input
                    value={formData.estaca_moldagem}
                    onChange={(e) => handleInputChange('estaca_moldagem', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Slump Test (mm)</label>
                  <Input
                    type="number"
                    value={formData.slump_test}
                    onChange={(e) => handleInputChange('slump_test', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Temperatura Ambiente (°C)</label>
                  <Input
                    type="number"
                    value={formData.temperatura_ambiente}
                    onChange={(e) => handleInputChange('temperatura_ambiente', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Hora Saída Usina</label>
                  <Input
                    type="time"
                    value={formData.hora_saida_usina}
                    onChange={(e) => handleInputChange('hora_saida_usina', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Hora Chegada Campo</label>
                  <Input
                    type="time"
                    value={formData.hora_chegada_campo}
                    onChange={(e) => handleInputChange('hora_chegada_campo', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Data do Ensaio</label>
                  <Input
                    type="date"
                    value={formData.data_ensaio}
                    onChange={(e) => handleInputChange('data_ensaio', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>
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

                    {/* Campos compartilhados da série */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-[#BFCF99]/10 rounded-lg border border-[#BFCF99]/20">
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Idade (dias)</label>
                        <Input
                          type="number"
                          value={serie.idade}
                          onChange={(e) => updateSerie(serieIdx, 'idade', e.target.value)}
                          className="bg-white/20 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Dimensão</label>
                        <select
                          value={serie.dimensao}
                          onChange={(e) => updateSerie(serieIdx, 'dimensao', e.target.value)}
                          className="w-full px-2 py-1 border border-white/20 rounded bg-white/20 text-[#00233B] text-sm h-8"
                        >
                          {DIMENSOES_CP.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Data Ruptura</label>
                        <Input
                          type="date"
                          value={serie.data_ruptura}
                          onChange={(e) => updateSerie(serieIdx, 'data_ruptura', e.target.value)}
                          className="bg-white/20 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Área CP (cm²)</label>
                        <Input
                          value={serie.area_cp}
                          readOnly
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm opacity-70 cursor-not-allowed"
                          title="Calculada automaticamente pela dimensão"
                        />
                      </div>
                    </div>

                    {/* CPs individuais */}
                    <div className="space-y-3">
                      {serie.cps.map((cp, cpIdx) => (
                        <div key={cpIdx} className="border border-white/10 rounded p-3 bg-white/5">
                          <p className="text-xs font-semibold text-[#00233B]/70 mb-2">CP {cpIdx + 1}</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#00233B] mb-1">Número CP</label>
                              <Input
                                value={cp.numero_cp}
                                onChange={(e) => updateSerieCP(serieIdx, cpIdx, 'numero_cp', e.target.value)}
                                className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#00233B] mb-1">Carga Ruptura (tf)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={cp.carga_ruptura}
                                onChange={(e) => updateSerieCP(serieIdx, cpIdx, 'carga_ruptura', e.target.value)}
                                className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#00233B] mb-1">Resistência (MPa)</label>
                              <Input
                                value={cp.resistencia}
                                readOnly
                                className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm opacity-70 cursor-not-allowed"
                                title="Calculada automaticamente"
                              />
                            </div>
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
                <Button onClick={addTracaoFlexao} size="sm" className="bg-[#00233B] text-white">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {formData.tracao_flexao.map((cp, idx) => (
                  <div key={idx} className="border border-white/20 rounded-lg p-4 bg-white/5 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-[#00233B]">CP #{idx + 1}</h4>
                      <Button
                        onClick={() => removeTracaoFlexao(idx)}
                        variant="destructive"
                        size="sm"
                        className="h-8 px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Número CP</label>
                        <Input
                          value={cp.numero_cp}
                          onChange={(e) => updateTracaoFlexao(idx, 'numero_cp', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Idade (dias)</label>
                        <Input
                          type="number"
                          value={cp.idade}
                          onChange={(e) => updateTracaoFlexao(idx, 'idade', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Data Ruptura</label>
                        <Input
                          type="date"
                          value={cp.data_ruptura}
                          onChange={(e) => updateTracaoFlexao(idx, 'data_ruptura', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Carga Ruptura (tf)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cp.carga_ruptura}
                          onChange={(e) => updateTracaoFlexao(idx, 'carga_ruptura', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Vão Central (cm²)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cp.vao_central}
                          onChange={(e) => updateTracaoFlexao(idx, 'vao_central', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Resistência (MPa)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cp.resistencia}
                          onChange={(e) => updateTracaoFlexao(idx, 'resistencia', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.tracao_flexao.length === 0 && (
                  <p className="text-center text-[#00233B]/60 py-4">Nenhum CP adicionado</p>
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
              <Textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações gerais"
                className="bg-white/10 border-white/20 text-[#00233B] h-24"
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('MeusEnsaios'))}
              className="border-white/20 text-[#00233B]"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="bg-[#00233B] text-white hover:bg-[#00233B]/90"
            >
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-[#566E3D] text-white hover:bg-[#566E3D]/90"
            >
              {saving ? 'Salvando...' : 'Finalizar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}