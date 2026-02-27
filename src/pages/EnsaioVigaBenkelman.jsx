import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Copy, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SectionTitle = ({ children }) => (
  <Card className="bg-[#BFCF99]/20 border border-[#BFCF99]/30 mb-4">
    <CardHeader className="py-3">
      <CardTitle className="text-sm font-semibold text-[#00233B]">{children}</CardTitle>
    </CardHeader>
  </Card>
);

export default function EnsaioVigaBenkelman() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);

  const [formData, setFormData] = useState({
    obra_id: '',
    project_id: '',
    data_ensaio: new Date().toISOString().split('T')[0],
    data_realizacao: new Date().toISOString().split('T')[0],
    laboratorista_name: '',
    rodovia: '',
    trecho: '',
    material: '',
    procedencia: '',
    camada: '',
    cte_viga: 0.01,
    def_admissivel: '',
    leitura_inicial_global: '',
    faixas: [
      {
        id: 1,
        nome: '',
        levantamentos: Array(20).fill(null).map(() => ({
          estaca_km: '',
          bordo_esquerdo: { leitura_inicial: '', leitura_final: '', diferenca: 0, deflexao: 0 },
          eixo: { leitura_inicial: '', leitura_final: '', diferenca: 0, deflexao: 0 },
          bordo_direito: { leitura_inicial: '', leitura_final: '', diferenca: 0, deflexao: 0 }
        }))
      }
    ],
    nextFaixaId: 2,
    controle_estatistico: {
      qt_leituras: 0,
      media: 0,
      desv_pad: 0
    },
    observacoes: '',
    status: 'rascunho'
  });
  const [activeFaixaTab, setActiveFaixaTab] = useState('1');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData(prev => ({ ...prev, laboratorista_name: currentUser.laboratorista_name || currentUser.full_name }));

      const [obrasData, projectsData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Project.list()
      ]);

      setObras(obrasData);
      setProjects(projectsData);

      if (editId) {
        const ensaio = await base44.entities.EnsaioVigaBenkelman.get(editId);

        // Reconstruir a estrutura de faixas a partir do array flat de levantamentos
        const levamentosFlat = ensaio.levantamentos || [];
        const faixasMap = {};
        const faixasOrder = [];
        levamentosFlat.forEach(lev => {
          const nome = lev.faixa_nome || 'Faixa 1';
          if (!faixasMap[nome]) {
            faixasMap[nome] = [];
            faixasOrder.push(nome);
          }
          faixasMap[nome].push(lev);
        });

        let faixasReconstruidas;
        if (faixasOrder.length === 0) {
          faixasReconstruidas = [{
            id: 1,
            nome: '',
            levantamentos: Array(20).fill(null).map(() => ({
              estaca_km: '',
              bordo_esquerdo: { leitura_inicial: '', leitura_final: '', diferenca: 0, deflexao: 0 },
              eixo: { leitura_inicial: '', leitura_final: '', diferenca: 0, deflexao: 0 },
              bordo_direito: { leitura_inicial: '', leitura_final: '', diferenca: 0, deflexao: 0 }
            }))
          }];
        } else {
          faixasReconstruidas = faixasOrder.map((nome, idx) => {
            const levsDaFaixa = faixasMap[nome];
            // Pad to 20 rows
            const levantamentos = [...levsDaFaixa];
            while (levantamentos.length < 20) {
              levantamentos.push({
                estaca_km: '',
                bordo_esquerdo: { leitura_inicial: ensaio.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 },
                eixo: { leitura_inicial: ensaio.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 },
                bordo_direito: { leitura_inicial: ensaio.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 }
              });
            }
            return { id: idx + 1, nome, levantamentos };
          });
        }

        setFormData({
          ...ensaio,
          faixas: faixasReconstruidas,
          nextFaixaId: faixasReconstruidas.length + 1
        });
        if (faixasReconstruidas.length > 0) {
          setActiveFaixaTab(String(faixasReconstruidas[0].id));
        }
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
    }
  };

  const obraAtual = obras.find(o => o.id === formData.obra_id);
  const rodoviasDaObra = obraAtual?.rodovias || [];

  // Verificar se uma faixa tem dados preenchidos
  const faixaTemDados = (faixa) => {
    if (faixa.nome) return true;
    return faixa.levantamentos.some(lev => 
      lev.estaca_km || 
      lev.bordo_esquerdo.leitura_inicial || 
      lev.bordo_esquerdo.leitura_final ||
      lev.eixo.leitura_inicial || 
      lev.eixo.leitura_final ||
      lev.bordo_direito.leitura_inicial || 
      lev.bordo_direito.leitura_final
    );
  };

  // Faixas com dados para exibição
  const faixasComDados = formData.faixas.filter(faixaTemDados);

  const addFaixa = () => {
    setFormData(prev => {
      if (prev.faixas.length >= 4) {
        alert('Limite máximo de 4 faixas atingido.');
        return prev;
      }
      const newFaixaId = prev.nextFaixaId;
      // Schedule tab change after state update
      setTimeout(() => setActiveFaixaTab(String(newFaixaId)), 0);
      return {
        ...prev,
        faixas: [
          ...prev.faixas,
          {
            id: newFaixaId,
            nome: '',
            levantamentos: Array(20).fill(null).map(() => ({
              estaca_km: '',
              bordo_esquerdo: { leitura_inicial: prev.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 },
              eixo: { leitura_inicial: prev.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 },
              bordo_direito: { leitura_inicial: prev.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 }
            }))
          }
        ],
        nextFaixaId: newFaixaId + 1
      };
    });
  };

  const removeFaixa = (faixaId) => {
    setFormData(prev => ({
      ...prev,
      faixas: prev.faixas.filter(f => f.id !== faixaId)
    }));
    if (activeFaixaTab === String(faixaId)) {
      setActiveFaixaTab('1');
    }
  };

  const updateFaixaNome = (faixaId, nome) => {
    setFormData(prev => ({
      ...prev,
      faixas: prev.faixas.map(f => f.id === faixaId ? { ...f, nome } : f)
    }));
  };

  const updateLevantamento = (faixaId, levIndex, lado, field, value) => {
    setFormData(prev => {
      const novo = { ...prev };
      const faixa = novo.faixas.find(f => f.id === faixaId);
      if (!faixa) return prev;

      const lev = faixa.levantamentos[levIndex];

      if (field === 'estaca_km') {
        lev.estaca_km = value;
      } else {
        const numValue = parseFloat(value) || 0;
        lev[lado][field] = numValue;

        if (field === 'leitura_inicial' || field === 'leitura_final') {
          lev[lado].diferenca = (lev[lado].leitura_inicial || 0) - (lev[lado].leitura_final || 0);
          lev[lado].deflexao = (lev[lado].diferenca || 0) * (parseFloat(novo.cte_viga) || 0.01);
        }
      }

      return novo;
    });
  };

  const handleLeituraInicialChange = (value) => {
    handleInputChange('leitura_inicial_global', value);
    if (value) {
      setFormData(prev => ({
        ...prev,
        leitura_inicial_global: value,
        faixas: prev.faixas.map(faixa => ({
          ...faixa,
          levantamentos: faixa.levantamentos.map(lev => ({
            ...lev,
            bordo_esquerdo: { ...lev.bordo_esquerdo, leitura_inicial: value },
            eixo: { ...lev.eixo, leitura_inicial: value },
            bordo_direito: { ...lev.bordo_direito, leitura_inicial: value }
          }))
        }))
      }));
    }
  };

  const handleSave = async (asFinal = false) => {
    console.log('=== INICIANDO SALVAMENTO ===');
    console.log('asFinal:', asFinal);
    console.log('obra_id:', formData.obra_id);

    if (!formData.obra_id) {
      alert('Selecione uma obra');
      return;
    }

    setSaving(true);
    try {
      // Consolidar todos os levantamentos de todas as faixas em um array único, com nome da faixa
      const levantamentos = [];
      formData.faixas.forEach((faixa) => {
        faixa.levantamentos.forEach((lev) => {
          if (lev.estaca_km || Object.values(lev.bordo_esquerdo).some(v => v) || 
              Object.values(lev.eixo).some(v => v) || 
              Object.values(lev.bordo_direito).some(v => v)) {
            levantamentos.push({
              faixa_nome: faixa.nome || `Faixa ${faixa.id}`,
              estaca_km: lev.estaca_km || '',
              bordo_esquerdo: {
                leitura_inicial: parseFloat(lev.bordo_esquerdo.leitura_inicial) || 0,
                leitura_final: parseFloat(lev.bordo_esquerdo.leitura_final) || 0,
                diferenca: parseFloat(lev.bordo_esquerdo.diferenca) || 0,
                deflexao: parseFloat(lev.bordo_esquerdo.deflexao) || 0
              },
              eixo: {
                leitura_inicial: parseFloat(lev.eixo.leitura_inicial) || 0,
                leitura_final: parseFloat(lev.eixo.leitura_final) || 0,
                diferenca: parseFloat(lev.eixo.diferenca) || 0,
                deflexao: parseFloat(lev.eixo.deflexao) || 0
              },
              bordo_direito: {
                leitura_inicial: parseFloat(lev.bordo_direito.leitura_inicial) || 0,
                leitura_final: parseFloat(lev.bordo_direito.leitura_final) || 0,
                diferenca: parseFloat(lev.bordo_direito.diferenca) || 0,
                deflexao: parseFloat(lev.bordo_direito.deflexao) || 0
              }
            });
          }
        });
      });

      const dataToSave = {
        obra_id: formData.obra_id,
        project_id: formData.project_id,
        data_ensaio: formData.data_ensaio,
        data_realizacao: formData.data_realizacao,
        laboratorista_name: formData.laboratorista_name,
        rodovia: formData.rodovia,
        trecho: formData.trecho,
        material: formData.material,
        procedencia: formData.procedencia,
        camada: formData.camada,
        cte_viga: parseFloat(formData.cte_viga) || 0,
        def_admissivel: parseInt(formData.def_admissivel) || 0,
        leitura_inicial_global: parseFloat(formData.leitura_inicial_global) || 0,
        levantamentos: levantamentos,
        observacoes: formData.observacoes,
        status: asFinal ? 'finalizado' : 'rascunho'
      };

      if (editId) {
        await base44.entities.EnsaioVigaBenkelman.update(editId, dataToSave);
        alert('Ensaio atualizado com sucesso!');
      } else {
        await base44.entities.EnsaioVigaBenkelman.create(dataToSave);
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
          {editId ? 'Editar Ensaio Viga Benkelman' : 'Novo Ensaio Viga Benkelman'}
        </h1>

        <div className="space-y-6">
          {/* Dados da Obra */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <CardTitle className="text-[#00233B]">Dados da Obra</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-[#00233B] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecionar rodovia...</option>
                    {rodoviasDaObra.map((rodovia, idx) => (
                      <option key={idx} value={rodovia}>{rodovia}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Trecho</label>
                  <Input
                    value={formData.trecho}
                    onChange={(e) => handleInputChange('trecho', e.target.value)}
                    placeholder="Digitar"
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Material</label>
                  <Input
                    value={formData.material}
                    onChange={(e) => handleInputChange('material', e.target.value)}
                    placeholder="Digitar"
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Procedência</label>
                  <Input
                    value={formData.procedencia}
                    onChange={(e) => handleInputChange('procedencia', e.target.value)}
                    placeholder="Digitar"
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div className="hidden">
                   <label className="block text-sm font-medium text-[#00233B] mb-2">Pista/Faixa</label>
                   <Input
                     value={formData.pista_faixa}
                     onChange={(e) => handleInputChange('pista_faixa', e.target.value)}
                     placeholder="Digitar"
                     className="bg-white/10 border-white/20 text-[#00233B]"
                   />
                 </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Camada</label>
                  <Input
                    value={formData.camada}
                    onChange={(e) => handleInputChange('camada', e.target.value)}
                    placeholder="Digitar"
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Data de Aplicação da Camada</label>
                  <Input
                    type="date"
                    value={formData.data_ensaio}
                    onChange={(e) => handleInputChange('data_ensaio', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Data de Realização do Ensaio</label>
                  <Input
                    type="date"
                    value={formData.data_realizacao}
                    onChange={(e) => handleInputChange('data_realizacao', e.target.value)}
                    className="bg-white/10 border-white/20 text-[#00233B]"
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
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Laboratorista</label>
                  <Input
                    value={formData.laboratorista_name}
                    disabled
                    className="bg-white/10 border-white/20 text-[#00233B]/70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">CTE. VIGA</label>
                  <Input
                    value={formData.cte_viga}
                    onChange={(e) => handleInputChange('cte_viga', e.target.value)}
                    placeholder="Digitar"
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#00233B] mb-2">DEF. ADMISSÍVEL</label>
                  <Input
                    value={formData.def_admissivel}
                    onChange={(e) => handleInputChange('def_admissivel', e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Digitar"
                    className="bg-white/10 border-white/20 text-[#00233B]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leitura Inicial Global */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <CardTitle className="text-[#00233B]">Leitura Inicial (Única)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-[#00233B]/80">
                Informe a leitura inicial uma única vez. Ela será automaticamente preenchida em todos os registros.
              </p>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#00233B] mb-2">Leitura Inicial (A)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.leitura_inicial_global}
                  onChange={(e) => handleLeituraInicialChange(e.target.value)}
                  placeholder="Digitar"
                  className="bg-white/10 border-white/20 text-[#00233B]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Levantamentos com Faixas */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#00233B]">Levantamento Deflectométrico</CardTitle>
                {formData.faixas.length < 4 && (
                  <Button onClick={addFaixa} size="sm" className="bg-[#00233B] text-white">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Faixa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeFaixaTab} onValueChange={setActiveFaixaTab} className="w-full">
                <TabsList className="flex flex-row gap-2 bg-transparent border-b border-white/20">
                  {faixasComDados.map((faixa) => (
                    <div key={faixa.id} className="relative">
                      <TabsTrigger
                        value={String(faixa.id)}
                        className="data-[state=active]:bg-[#00233B]/10 text-[#00233B] border-b-2 border-transparent data-[state=active]:border-[#00233B]"
                      >
                        {faixa.nome || `Faixa ${faixa.id}`}
                      </TabsTrigger>
                    </div>
                  ))}
                </TabsList>

                {faixasComDados.map((faixa) => (
                  <TabsContent key={faixa.id} value={String(faixa.id)} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <label className="text-sm font-medium text-[#00233B] whitespace-nowrap">Faixa:</label>
                      <Input
                        value={faixa.nome}
                        onChange={(e) => updateFaixaNome(faixa.id, e.target.value)}
                        placeholder="Digitar nome da faixa"
                        className="bg-white/20 border-white/30 text-[#00233B] h-8 w-48 text-sm"
                      />
                      {formData.faixas.length > 1 && (
                        <Button
                          onClick={() => removeFaixa(faixa.id)}
                          variant="destructive"
                          size="sm"
                          className="h-8 px-2 ml-auto"
                        >
                          <X className="w-4 h-4" /> Remover Faixa
                        </Button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <colgroup>
                          <col style={{ width: '120px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: '100px' }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-[#00233B]/10 border border-[#00233B]/20">
                            <th rowSpan="2" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold text-center">Estaca / km</th>
                            <th colSpan="2" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold text-center">BORDO ESQUERDO</th>
                            <th colSpan="2" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold text-center">EIXO</th>
                            <th colSpan="2" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold text-center">BORDO DIREITO</th>
                          </tr>
                          <tr className="bg-[#00233B]/5 border border-[#00233B]/20">
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold text-center">L. Inicial (A)</th>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold text-center">L. Final (B)</th>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold text-center">L. Inicial (A)</th>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold text-center">L. Final (B)</th>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold text-center">L. Inicial (A)</th>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold text-center">L. Final (B)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faixa.levantamentos.map((lev, idx) => (
                            <tr key={idx} className={`border border-[#00233B]/20 ${idx % 2 === 0 ? 'bg-white/5' : 'bg-white/10'}`}>
                              <td className="border border-[#00233B]/20 px-3 py-2 text-center font-semibold">
                                <Input
                                  value={lev.estaca_km}
                                  onChange={(e) => updateLevantamento(faixa.id, idx, null, 'estaca_km', e.target.value)}
                                  placeholder="Estaca"
                                  className="bg-white/20 border-white/30 text-[#00233B] h-9 text-sm text-center"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev.bordo_esquerdo.leitura_inicial}
                                  onChange={(e) => updateLevantamento(faixa.id, idx, 'bordo_esquerdo', 'leitura_inicial', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-9 text-center text-sm"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev.bordo_esquerdo.leitura_final}
                                  onChange={(e) => updateLevantamento(faixa.id, idx, 'bordo_esquerdo', 'leitura_final', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-9 text-center text-sm"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev.eixo.leitura_inicial}
                                  onChange={(e) => updateLevantamento(faixa.id, idx, 'eixo', 'leitura_inicial', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-9 text-center text-sm"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev.eixo.leitura_final}
                                  onChange={(e) => updateLevantamento(faixa.id, idx, 'eixo', 'leitura_final', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-9 text-center text-sm"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev.bordo_direito.leitura_inicial}
                                  onChange={(e) => updateLevantamento(faixa.id, idx, 'bordo_direito', 'leitura_inicial', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-9 text-center text-sm"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev.bordo_direito.leitura_final}
                                  onChange={(e) => updateLevantamento(faixa.id, idx, 'bordo_direito', 'leitura_final', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-9 text-center text-sm"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
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
                placeholder="Observações gerais sobre o ensaio"
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