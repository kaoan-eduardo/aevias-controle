import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Copy } from 'lucide-react';
import { createPageUrl } from '@/utils';

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
    laboratorista_name: '',
    rodovia: '',
    trecho: '',
    material: '',
    procedencia: '',
    pista_faixa: '',
    camada: '',
    cte_viga: 0.01,
    def_admissivel: '',
    leitura_inicial_global: '',
    levantamentos: [],
    controle_estatistico: {
      qt_leituras: 0,
      media: 0,
      desv_pad: 0
    },
    observacoes: '',
    status: 'rascunho'
  });

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
        setFormData(ensaio);
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

  const addLevantamento = () => {
    setFormData(prev => {
      if (prev.levantamentos.length >= 20) {
        alert('Limite máximo de 20 estacas atingido.');
        return prev;
      }
      return {
        ...prev,
        levantamentos: [
          ...prev.levantamentos,
          {
            estaca_km: '',
            bordo_esquerdo: { leitura_inicial: prev.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 },
            eixo: { leitura_inicial: prev.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 },
            bordo_direito: { leitura_inicial: prev.leitura_inicial_global || '', leitura_final: '', diferenca: 0, deflexao: 0 }
          }
        ]
      };
    });
  };

  const removeLevantamento = (index) => {
    setFormData(prev => ({
      ...prev,
      levantamentos: prev.levantamentos.filter((_, i) => i !== index)
    }));
  };

  const handleLeituraInicialChange = (value) => {
    handleInputChange('leitura_inicial_global', value);
    if (value) {
      setFormData(prev => ({
        ...prev,
        leitura_inicial_global: value,
        levantamentos: prev.levantamentos.map(lev => ({
          ...lev,
          bordo_esquerdo: { ...lev.bordo_esquerdo, leitura_inicial: value },
          eixo: { ...lev.eixo, leitura_inicial: value },
          bordo_direito: { ...lev.bordo_direito, leitura_inicial: value }
        }))
      }));
    }
  };

  const updateLevantamento = (index, lado, field, value) => {
    setFormData(prev => {
      const novo = { ...prev };
      const lev = novo.levantamentos[index];

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

  const handleSave = async (asFinal = false) => {
    if (!formData.obra_id) {
      alert('Selecione uma obra');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        cte_viga: parseFloat(formData.cte_viga) || 0,
        def_admissivel: parseInt(formData.def_admissivel) || 0,
        leitura_inicial_global: parseFloat(formData.leitura_inicial_global) || 0,
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

                <div>
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
                  <label className="block text-sm font-medium text-[#00233B] mb-2">Data da Aplicação</label>
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

          {/* Levantamentos */}
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="bg-[#BFCF99]/20 border-b border-white/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#00233B]">Levantamento Deflectométrico</CardTitle>
                <Button onClick={addLevantamento} size="sm" className="bg-[#00233B] text-white">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Estaca
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {formData.levantamentos.length === 0 ? (
                <p className="text-center text-[#00233B]/70 py-8">Clique em "Adicionar Estaca" para começar</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <colgroup>
                       <col style={{ width: '160px' }} />
                      <col style={{ width: '90px' }} />
                      <col style={{ width: '90px' }} />
                      <col style={{ width: '60px' }} />
                      <col style={{ width: '90px' }} />
                      <col style={{ width: '90px' }} />
                      <col style={{ width: '60px' }} />
                      <col style={{ width: '90px' }} />
                      <col style={{ width: '90px' }} />
                      <col style={{ width: '60px' }} />
                      <col style={{ width: '60px' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-[#00233B]/10 border border-[#00233B]/20">
                        <th rowSpan="2" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold">Estaca / km</th>
                        <th colSpan="3" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold text-center">BORDO ESQUERDO</th>
                        <th colSpan="3" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold text-center">EIXO</th>
                        <th colSpan="3" className="border border-[#00233B]/20 px-3 py-2 text-[#00233B] font-bold text-center">BORDO DIREITO</th>
                        <th rowSpan="2" className="border border-[#00233B]/20 px-3 py-2">Ação</th>
                      </tr>
                      <tr className="bg-[#00233B]/5 border border-[#00233B]/20">
                        {['', '', '', ''].map((_, i) => (
                          <React.Fragment key={`header-${i}`}>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold whitespace-nowrap">L. Inicial (A)</th>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold whitespace-nowrap">L. Final (B)</th>
                            <th className="border border-[#00233B]/20 px-2 py-1 text-[#00233B] font-semibold whitespace-nowrap">Deflexão (D)</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.levantamentos.map((lev, idx) => (
                        <tr key={idx} className={`border border-[#00233B]/20 ${idx % 2 === 0 ? 'bg-white/5' : 'bg-white/10'}`}>
                          <td className="border border-[#00233B]/20 px-3 py-2">
                            <Input
                              value={lev.estaca_km}
                              onChange={(e) => updateLevantamento(idx, null, 'estaca_km', e.target.value)}
                              placeholder="Estaca / km"
                              className="bg-white/20 border-white/30 text-[#00233B] font-semibold h-10 text-base"
                            />
                          </td>

                          {['bordo_esquerdo', 'eixo', 'bordo_direito'].map((lado) => (
                            <React.Fragment key={lado}>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev[lado].leitura_inicial}
                                  onChange={(e) => updateLevantamento(idx, lado, 'leitura_inicial', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-10 text-center text-sm"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev[lado].leitura_final}
                                  onChange={(e) => updateLevantamento(idx, lado, 'leitura_final', e.target.value)}
                                  className="bg-white/20 border-white/30 text-[#00233B] h-10 text-center text-sm"
                                />
                              </td>
                              <td className="border border-[#00233B]/20 px-2 py-2 bg-white/5">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={lev[lado].deflexao.toFixed(1)}
                                  disabled
                                  className="bg-white/10 border-white/30 text-[#00233B]/70 h-10 text-center text-sm"
                                />
                              </td>
                            </React.Fragment>
                          ))}

                          <td className="border border-[#00233B]/20 px-2 py-2">
                            <Button
                              onClick={() => removeLevantamento(idx)}
                              variant="destructive"
                              size="sm"
                              className="h-10 px-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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