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

  const addCompressaoAxial = () => {
    setFormData(prev => ({
      ...prev,
      compressao_axial: [...prev.compressao_axial, {
        numero_cp: '',
        idade: '',
        dimensao: '5x10',
        data_ruptura: '',
        carga_ruptura: '',
        area_cp: '',
        resistencia: ''
      }]
    }));
  };

  const removeCompressaoAxial = (idx) => {
    setFormData(prev => ({
      ...prev,
      compressao_axial: prev.compressao_axial.filter((_, i) => i !== idx)
    }));
  };

  const updateCompressaoAxial = (idx, field, value) => {
    setFormData(prev => {
      const novo = { ...prev };
      novo.compressao_axial[idx] = { ...novo.compressao_axial[idx], [field]: value };
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
                <Button onClick={addCompressaoAxial} size="sm" className="bg-[#00233B] text-white">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {formData.compressao_axial.map((cp, idx) => (
                  <div key={idx} className="border border-white/20 rounded-lg p-4 bg-white/5 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-[#00233B]">CP #{idx + 1}</h4>
                      <Button
                        onClick={() => removeCompressaoAxial(idx)}
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
                          onChange={(e) => updateCompressaoAxial(idx, 'numero_cp', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Idade (dias)</label>
                        <Input
                          type="number"
                          value={cp.idade}
                          onChange={(e) => updateCompressaoAxial(idx, 'idade', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Dimensão</label>
                        <select
                          value={cp.dimensao}
                          onChange={(e) => updateCompressaoAxial(idx, 'dimensao', e.target.value)}
                          className="w-full px-2 py-1 border border-white/20 rounded bg-white/10 text-[#00233B] text-sm h-8"
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
                          value={cp.data_ruptura}
                          onChange={(e) => updateCompressaoAxial(idx, 'data_ruptura', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Carga Ruptura (tf)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cp.carga_ruptura}
                          onChange={(e) => updateCompressaoAxial(idx, 'carga_ruptura', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Área CP (cm²)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cp.area_cp}
                          onChange={(e) => updateCompressaoAxial(idx, 'area_cp', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#00233B] mb-1">Resistência (MPa)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cp.resistencia}
                          onChange={(e) => updateCompressaoAxial(idx, 'resistencia', e.target.value)}
                          className="bg-white/10 border-white/20 text-[#00233B] h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.compressao_axial.length === 0 && (
                  <p className="text-center text-[#00233B]/60 py-4">Nenhum CP adicionado</p>
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