import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Save, Send, Loader2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Project } from "@/entities/Project";

export default function AcompanhamentoUsinagemPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditable, setIsEditable] = useState(true);

  const [formData, setFormData] = useState({
    obra_id: '',
    project_id: '',
    data: new Date().toISOString().split('T')[0],
    laboratorista_name: '',
    trecho: '',
    pedreira: '',
    numero_projeto: '',
    faixa_especificada: '',
    rodovia: '',
    usina: '',
    ligante_nome: '',
    temperatura_ligante: '',
    agregados: [],
    cargas: [],
    observacoes_gerais: '',
    status: 'rascunho'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.obra_id && projects.length > 0 && obras.length > 0) {
      const obraSelecionada = obras.find(o => o.id === formData.obra_id);
      if (obraSelecionada && obraSelecionada.regional_id) {
        const regional = regionais.find(r => r.id === obraSelecionada.regional_id);
        if (regional && regional.project_ids) {
          const projetosFiltrados = projects.filter(p => regional.project_ids.includes(p.id));
          setFilteredProjects(projetosFiltrados);
        }
      }
    }
  }, [formData.obra_id, projects, obras, regionais]);

  const loadInitialData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const [obrasData, regionaisData, projectsData] = await Promise.all([
        Obra.list(),
        Regional.list(),
        Project.list()
      ]);

      setObras(obrasData);
      setRegionais(regionaisData);
      setProjects(projectsData);

      const params = new URLSearchParams(window.location.search);
      const editId = params.get('editId');

      if (editId) {
        const ensaioData = await base44.entities.AcompanhamentoUsinagem.get(editId);
        
        const canEdit = ensaioData.created_by === userData.email && 
                       (ensaioData.status === 'rascunho' || ensaioData.approved === false);
        
        setIsEditable(canEdit);
        setEditingId(editId);
        
        setFormData({
          ...ensaioData,
          agregados: ensaioData.agregados || [],
          cargas: ensaioData.cargas || []
        });
      } else {
        setFormData(prev => ({
          ...prev,
          laboratorista_name: userData.laboratorista_name || userData.full_name || ''
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados iniciais");
    } finally {
      setLoading(false);
    }
  };

  const handleObraChange = (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    setFormData(prev => ({
      ...prev,
      obra_id: obraId,
      project_id: '',
      rodovia: obra?.rodovias?.[0] || '',
      usina: obra?.usinas?.[0] || ''
    }));
  };

  const handleProjectChange = (projectId) => {
    const project = filteredProjects.find(p => p.id === projectId);
    
    // Buscar a faixa granulométrica do projeto
    let faixaName = '';
    if (project?.faixa_granulometrica_id) {
      base44.entities.FaixaGranulometrica.get(project.faixa_granulometrica_id)
        .then(faixa => {
          if (faixa) {
            setFormData(prev => ({
              ...prev,
              faixa_especificada: faixa.nome || ''
            }));
          }
        })
        .catch(err => console.error("Erro ao buscar faixa:", err));
    }
    
    // Preencher agregados do projeto
    const agregadosDoProjeto = project?.agregados?.map((agg, index) => ({
      nome: agg.nome || `Agregado ${index + 1}`,
      composicao: agg.percentual_mistura || '',
      umidade: '',
      temperatura_t1: '',
      temperatura_t2: ''
    })) || [];
    
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      numero_projeto: project?.name || '',
      ligante_nome: project?.ligante?.tipo || '',
      pedreira: project?.agregados?.[0]?.pedreira || '',
      agregados: agregadosDoProjeto
    }));
  };

  const handleAgregadoChange = (index, field, value) => {
    const newAgregados = [...formData.agregados];
    newAgregados[index] = { ...newAgregados[index], [field]: value };
    setFormData(prev => ({ ...prev, agregados: newAgregados }));
  };

  const adicionarAgregado = () => {
    setFormData(prev => ({
      ...prev,
      agregados: [...prev.agregados, {
        nome: `Agregado ${prev.agregados.length + 1}`,
        composicao: '',
        umidade: '',
        temperatura_t1: '',
        temperatura_t2: ''
      }]
    }));
  };

  const removerAgregado = (index) => {
    setFormData(prev => ({
      ...prev,
      agregados: prev.agregados.filter((_, i) => i !== index)
    }));
  };

  const adicionarCarga = () => {
    setFormData(prev => ({
      ...prev,
      cargas: [...prev.cargas, {
        placa_caminhao: '',
        hora_saida: '',
        peso: '',
        temperatura_1: '',
        temperatura_2: '',
        observacao: ''
      }]
    }));
  };

  const removerCarga = (index) => {
    setFormData(prev => ({
      ...prev,
      cargas: prev.cargas.filter((_, i) => i !== index)
    }));
  };

  const handleCargaChange = (index, field, value) => {
    const newCargas = [...formData.cargas];
    newCargas[index] = { ...newCargas[index], [field]: value };
    setFormData(prev => ({ ...prev, cargas: newCargas }));
  };

  const handleSubmit = async (finalizar = false) => {
    if (!formData.obra_id || !formData.data) {
      alert("Por favor, preencha os campos obrigatórios: Obra e Data");
      return;
    }

    setSaving(true);
    try {
      // Limpar dados antes de salvar - converter strings vazias em null para campos numéricos
      const agregadosLimpos = formData.agregados.map(agg => ({
        nome: agg.nome || '',
        composicao: agg.composicao === '' ? null : parseFloat(agg.composicao),
        umidade: agg.umidade === '' ? null : parseFloat(agg.umidade),
        temperatura_t1: agg.temperatura_t1 === '' ? null : parseFloat(agg.temperatura_t1),
        temperatura_t2: agg.temperatura_t2 === '' ? null : parseFloat(agg.temperatura_t2)
      }));

      const cargasLimpas = formData.cargas.map(carga => ({
        placa_caminhao: carga.placa_caminhao || '',
        hora_saida: carga.hora_saida || '',
        peso: carga.peso === '' ? null : parseFloat(carga.peso),
        temperatura_1: carga.temperatura_1 === '' ? null : parseFloat(carga.temperatura_1),
        temperatura_2: carga.temperatura_2 === '' ? null : parseFloat(carga.temperatura_2),
        observacao: carga.observacao || ''
      }));

      const dataToSave = {
        ...formData,
        temperatura_ligante: formData.temperatura_ligante === '' ? null : parseFloat(formData.temperatura_ligante),
        agregados: agregadosLimpos,
        cargas: cargasLimpas,
        status: finalizar ? 'finalizado' : 'rascunho',
        was_rejected: editingId && formData.approved === false ? true : (formData.was_rejected || false)
      };

      if (editingId) {
        await base44.entities.AcompanhamentoUsinagem.update(editingId, dataToSave);
        alert(finalizar ? 'Acompanhamento finalizado e enviado para aprovação!' : 'Acompanhamento salvo como rascunho!');
      } else {
        await base44.entities.AcompanhamentoUsinagem.create(dataToSave);
        alert(finalizar ? 'Acompanhamento criado e enviado para aprovação!' : 'Acompanhamento salvo como rascunho!');
      }

      navigate(createPageUrl("MeusEnsaios"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar acompanhamento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F1EF] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("MeusEnsaios")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#00233B]">
                {editingId ? 'Editar' : 'Novo'} Acompanhamento de Usinagem
              </h1>
              <p className="text-[#00233B]/70">
                {editingId ? 'Edite os dados do acompanhamento' : 'Preencha os dados do acompanhamento'}
              </p>
            </div>
          </div>
        </div>

        {formData.rejection_reason && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-red-800 mb-1">Motivo da Reprovação:</p>
              <p className="text-sm text-red-700">{formData.rejection_reason}</p>
            </CardContent>
          </Card>
        )}

        {/* Dados da Obra */}
        <Card className="bg-white/40 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B]">Dados da Obra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="obra_id">Obra *</Label>
                <Select value={formData.obra_id} onValueChange={handleObraChange} disabled={!isEditable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map((obra) => (
                      <SelectItem key={obra.id} value={obra.id}>
                        {obra.name} - {obra.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project_id">Projeto</Label>
                <Select value={formData.project_id} onValueChange={handleProjectChange} disabled={!isEditable || !formData.obra_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rodovia">Rodovia</Label>
                <Input
                  id="rodovia"
                  value={formData.rodovia}
                  onChange={(e) => setFormData(prev => ({ ...prev, rodovia: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>

              <div>
                <Label htmlFor="trecho">Trecho</Label>
                <Input
                  id="trecho"
                  value={formData.trecho}
                  onChange={(e) => setFormData(prev => ({ ...prev, trecho: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>

              <div>
                <Label htmlFor="usina">Usina</Label>
                <Input
                  id="usina"
                  value={formData.usina}
                  onChange={(e) => setFormData(prev => ({ ...prev, usina: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pedreira">Pedreira</Label>
                <Input
                  id="pedreira"
                  value={formData.pedreira}
                  onChange={(e) => setFormData(prev => ({ ...prev, pedreira: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>

              <div>
                <Label htmlFor="numero_projeto">N° Projeto</Label>
                <Input
                  id="numero_projeto"
                  value={formData.numero_projeto}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_projeto: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>

              <div>
                <Label htmlFor="faixa_especificada">Faixa Especificada</Label>
                <Input
                  id="faixa_especificada"
                  value={formData.faixa_especificada}
                  onChange={(e) => setFormData(prev => ({ ...prev, faixa_especificada: e.target.value }))}
                  disabled={true}
                  className="bg-gray-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agregados */}
        <Card className="bg-white/40 backdrop-blur-lg border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#00233B]">Dados do Ensaio - Agregados</CardTitle>
              {isEditable && formData.agregados.length > 0 && (
                <Button onClick={adicionarAgregado} size="sm" className="bg-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/90">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Agregado
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ligante_nome">Ligante</Label>
                <Input
                  id="ligante_nome"
                  value={formData.ligante_nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, ligante_nome: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>
              <div>
                <Label htmlFor="temperatura_ligante">Temperatura do Ligante - °C</Label>
                <Input
                  id="temperatura_ligante"
                  type="number"
                  step="0.1"
                  value={formData.temperatura_ligante}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperatura_ligante: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>
            </div>

            {formData.agregados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#00233B]/70 mb-4">Nenhum agregado cadastrado. Selecione um projeto ou adicione agregados manualmente.</p>
                {isEditable && (
                  <Button onClick={adicionarAgregado} className="bg-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/90">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Primeiro Agregado
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead className="bg-slate-700 text-white">
                    <tr>
                      <th className="border border-gray-300 p-2">Agregado</th>
                      <th className="border border-gray-300 p-2">Composição (%)</th>
                      <th className="border border-gray-300 p-2">Umidade (%)</th>
                      <th className="border border-gray-300 p-2">T1 (°C)</th>
                      <th className="border border-gray-300 p-2">T2 (°C)</th>
                      {isEditable && <th className="border border-gray-300 p-2">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.agregados.map((agregado, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2">
                          <Input
                            value={agregado.nome}
                            onChange={(e) => handleAgregadoChange(index, 'nome', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={agregado.composicao}
                            onChange={(e) => handleAgregadoChange(index, 'composicao', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={agregado.umidade}
                            onChange={(e) => handleAgregadoChange(index, 'umidade', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={agregado.temperatura_t1}
                            onChange={(e) => handleAgregadoChange(index, 'temperatura_t1', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={agregado.temperatura_t2}
                            onChange={(e) => handleAgregadoChange(index, 'temperatura_t2', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        {isEditable && (
                          <td className="border border-gray-300 p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerAgregado(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cargas */}
        <Card className="bg-white/40 backdrop-blur-lg border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#00233B]">Cargas Acompanhadas</CardTitle>
              {isEditable && (
                <Button onClick={adicionarCarga} size="sm" className="bg-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/90">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Carga
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.cargas.length === 0 ? (
              <p className="text-center text-[#00233B]/70 py-8">Nenhuma carga adicionada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead className="bg-slate-700 text-white">
                    <tr>
                      <th className="border border-gray-300 p-2">Placa Caminhão</th>
                      <th className="border border-gray-300 p-2">Hora de Saída</th>
                      <th className="border border-gray-300 p-2">Peso (t)</th>
                      <th className="border border-gray-300 p-2">Temperatura (°C)</th>
                      <th className="border border-gray-300 p-2">Temperatura (°C)</th>
                      <th className="border border-gray-300 p-2">Observação</th>
                      {isEditable && <th className="border border-gray-300 p-2">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.cargas.map((carga, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2">
                          <Input
                            value={carga.placa_caminhao}
                            onChange={(e) => handleCargaChange(index, 'placa_caminhao', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="time"
                            value={carga.hora_saida}
                            onChange={(e) => handleCargaChange(index, 'hora_saida', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={carga.peso}
                            onChange={(e) => handleCargaChange(index, 'peso', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={carga.temperatura_1}
                            onChange={(e) => handleCargaChange(index, 'temperatura_1', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={carga.temperatura_2}
                            onChange={(e) => handleCargaChange(index, 'temperatura_2', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Input
                            value={carga.observacao}
                            onChange={(e) => handleCargaChange(index, 'observacao', e.target.value)}
                            disabled={!isEditable}
                            className="text-sm"
                          />
                        </td>
                        {isEditable && (
                          <td className="border border-gray-300 p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerCarga(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="bg-white/40 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B]">Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.observacoes_gerais}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes_gerais: e.target.value }))}
              placeholder="Adicione observações gerais sobre o acompanhamento..."
              rows={4}
              disabled={!isEditable}
            />
          </CardContent>
        </Card>

        {/* Botões */}
        {isEditable && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("MeusEnsaios"))}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="bg-gray-600 text-white hover:bg-gray-700"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="bg-[#566E3D] text-white hover:bg-[#566E3D]/90"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Finalizar e Enviar
            </Button>
          </div>
        )}

        {!isEditable && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800 text-center">
                Este registro não pode mais ser editado. {formData.approved ? 'Já foi aprovado.' : 'Entre em contato com o administrador.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}