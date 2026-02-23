import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Send, ChevronLeft, Trash2, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Project } from "@/entities/Project";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFormPersistence } from "@/components/hooks/useFormPersistence";

const getInitialFormData = () => ({
  obra_id: "",
  project_id: "",
  data: new Date().toISOString().split('T')[0],
  jornada: {
    horario_inicio: "",
    horario_fim: ""
  },
  laboratorista_name: "",
  rodovia: "",
  trecho: "",
  sub_trecho: "",
  usina_fornecedora: "",
  servico: "",
  cargas: [],
  observacoes_gerais: "",
  status: "rascunho"
});

export default function AcompanhamentoCarga() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getInitialFormData());
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const { clearSavedData } = useFormPersistence('acompanhamento_carga_form', formData, setFormData, editMode);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const editIdParam = urlParams.get('editId');

      const [userData, obrasData, regionaisData, projectsData] = await Promise.all([
        User.me(),
        Obra.list(),
        Regional.list(),
        Project.list()
      ]);

      setUser(userData);
      setObras(obrasData.filter(o => 
        o.tipo_obra === 'conservacao' || o.tipo_obra === 'implantacao'
      ));
      setRegionais(regionaisData);
      setProjects(projectsData);

      if (editIdParam) {
        const ensaioData = await base44.entities.AcompanhamentoCarga.get(editIdParam);
        setFormData(ensaioData);
        setEditMode(true);
        setEditId(editIdParam);
        
        const obraRelacionada = obrasData.find(o => o.id === ensaioData.obra_id);
        if (obraRelacionada) {
          const regionalRelacionada = regionaisData.find(r => r.id === obraRelacionada.regional_id);
          if (regionalRelacionada) {
            const projectsFiltered = projectsData.filter(p => 
              regionalRelacionada.project_ids?.includes(p.id)
            );
            setAvailableProjects(projectsFiltered);
          }
        }
      } else {
        setFormData({
          ...getInitialFormData(),
          laboratorista_name: userData.laboratorista_name || userData.full_name || ""
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados iniciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleObraChange = (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    const regional = regionais.find(r => r.id === obra?.regional_id);
    
    const projectsFiltered = projects.filter(p => 
      regional?.project_ids?.includes(p.id) && p.tipo_projeto === 'CAUQ'
    );
    
    setAvailableProjects(projectsFiltered);
    
    setFormData(prev => ({
      ...prev,
      obra_id: obraId,
      project_id: "",
      rodovia: "",
      usina_fornecedora: ""
    }));
  };

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      project_id: projectId
    }));
  };

  const handleAddCarga = () => {
    if (formData.cargas.length >= 20) {
      alert("Limite máximo de 20 cargas atingido.");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      cargas: [...prev.cargas, {
        numero_carga: prev.cargas.length + 1,
        placa: "",
        hora_saida: "",
        peso_toneladas: null,
        hora_chegada: "",
        temp_chegada: null,
        hora_aplicacao: "",
        temp_espalhamento: null,
        temp_compactacao: null,
        pista: "",
        espessura_cm: null,
        estaca_inicial: "",
        estaca_final: "",
        observacoes: ""
      }]
    }));
  };

  const handleRemoveCarga = (index) => {
    setFormData(prev => ({
      ...prev,
      cargas: prev.cargas.filter((_, i) => i !== index)
    }));
  };

  const handleCargaChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cargas: prev.cargas.map((carga, i) => 
        i === index ? { ...carga, [field]: value } : carga
      )
    }));
  };

  const handleSubmit = async (finalizar = false) => {
    if (!formData.obra_id || !formData.data) {
      alert("Preencha os campos obrigatórios: Obra e Data.");
      return;
    }

    if (finalizar && formData.cargas.length === 0) {
      alert("Adicione pelo menos uma carga antes de finalizar.");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: finalizar ? "finalizado" : "rascunho"
      };

      if (editMode) {
        await base44.entities.AcompanhamentoCarga.update(editId, dataToSave);
      } else {
        await base44.entities.AcompanhamentoCarga.create(dataToSave);
      }

      clearSavedData();
      alert(finalizar ? "Acompanhamento finalizado com sucesso!" : "Progresso salvo!");
      navigate(createPageUrl("MeusEnsaios"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar acompanhamento.");
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#00233B]" />
      </div>
    );
  }

  const obraSelecionada = obras.find(o => o.id === formData.obra_id);
  const regionalSelecionada = regionais.find(r => r.id === obraSelecionada?.regional_id);
  const projetoSelecionado = projects.find(p => p.id === formData.project_id);

  const canEdit = !formData.approved && formData.created_by === user?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("MeusEnsaios"))}
              className="border-white/20"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#00233B]">
                {editMode ? "Editar" : "Novo"} Acompanhamento de Aplicação
              </h1>
              <p className="text-[#00233B]/70">CAUQ - Conservação e Implantação</p>
            </div>
          </div>
        </div>

        <Card className="bg-white/40 backdrop-blur-lg border-white/20">
          <CardContent className="p-6 space-y-6">
            {/* Dados da Obra */}
            <div>
              <h2 className="text-lg font-bold text-[#00233B] mb-4 border-b pb-2">DADOS DA OBRA</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Cliente (Automático)</Label>
                  <Input
                    value={regionalSelecionada?.cliente || ""}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
                
                <div>
                  <Label>Trecho *</Label>
                  <Input
                    value={formData.trecho}
                    onChange={(e) => setFormData(prev => ({ ...prev, trecho: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>
                
                <div>
                  <Label>N° do Projeto</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={handleProjectChange}
                    disabled={!canEdit || !formData.obra_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Rodovia *</Label>
                  <Select
                    value={formData.rodovia}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rodovia: value }))}
                    disabled={!canEdit || !formData.obra_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a rodovia" />
                    </SelectTrigger>
                    <SelectContent>
                      {obraSelecionada?.rodovias?.map((rodovia) => (
                        <SelectItem key={rodovia} value={rodovia}>
                          {rodovia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sub-trecho</Label>
                  <Input
                    value={formData.sub_trecho}
                    onChange={(e) => setFormData(prev => ({ ...prev, sub_trecho: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Laboratorista (Automático)</Label>
                  <Input
                    value={formData.laboratorista_name}
                    disabled
                    className="bg-slate-100"
                  />
                </div>

                <div>
                  <Label>Obra *</Label>
                  <Select
                    value={formData.obra_id}
                    onValueChange={handleObraChange}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {obras.map((obra) => (
                        <SelectItem key={obra.id} value={obra.id}>
                          {obra.name} ({obra.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Usina Fornecedora</Label>
                  <Select
                    value={formData.usina_fornecedora}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, usina_fornecedora: value }))}
                    disabled={!canEdit || !formData.obra_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a usina" />
                    </SelectTrigger>
                    <SelectContent>
                      {obraSelecionada?.usinas?.map((usina) => (
                        <SelectItem key={usina} value={usina}>
                          {usina}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Serviço *</Label>
                  <Select
                    value={formData.servico}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, servico: value }))}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remendos">Remendos</SelectItem>
                      <SelectItem value="capa_reperfilagem">Capa/Reperfilagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Faixa Especificada (Automático)</Label>
                  <Input
                    value={projetoSelecionado?.faixa_granulometrica_id || ""}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Jornada */}
            <div>
              <h3 className="text-md font-semibold text-[#00233B] mb-3">Jornada de Trabalho</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={formData.jornada?.horario_inicio || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      jornada: { ...prev.jornada, horario_inicio: e.target.value }
                    }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Horário de Fim</Label>
                  <Input
                    type="time"
                    value={formData.jornada?.horario_fim || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      jornada: { ...prev.jornada, horario_fim: e.target.value }
                    }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            {/* Cargas */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#00233B]">CARGAS</h2>
                {canEdit && (
                  <Button
                    onClick={handleAddCarga}
                    disabled={formData.cargas.length >= 20}
                    className="bg-[#00233B] text-white hover:bg-[#00233B]/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Carga ({formData.cargas.length}/20)
                  </Button>
                )}
              </div>

              {formData.cargas.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>Nenhuma carga adicionada. Clique em "Adicionar Carga" para começar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-300 p-2">N°</th>
                        <th className="border border-slate-300 p-2">Placa</th>
                        <th className="border border-slate-300 p-2">Hora Saída</th>
                        <th className="border border-slate-300 p-2">Peso (t)</th>
                        <th className="border border-slate-300 p-2">Hora Chegada</th>
                        <th className="border border-slate-300 p-2">Temp. Chegada (°C)</th>
                        <th className="border border-slate-300 p-2">Hora Aplicação</th>
                        <th className="border border-slate-300 p-2">Temp. Espalhamento (°C)</th>
                        <th className="border border-slate-300 p-2">Temp. Compactação (°C)</th>
                        <th className="border border-slate-300 p-2">Pista</th>
                        <th className="border border-slate-300 p-2">Espessura (cm)</th>
                        <th className="border border-slate-300 p-2">Estaca Inicial</th>
                        <th className="border border-slate-300 p-2">Estaca Final</th>
                        <th className="border border-slate-300 p-2">Observações</th>
                        {canEdit && <th className="border border-slate-300 p-2">Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.cargas.map((carga, index) => (
                        <tr key={index} className="even:bg-slate-50">
                          <td className="border border-slate-300 p-1 text-center">{carga.numero_carga}</td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              value={carga.placa}
                              onChange={(e) => handleCargaChange(index, 'placa', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="time"
                              value={carga.hora_saida}
                              onChange={(e) => handleCargaChange(index, 'hora_saida', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={carga.peso_toneladas || ""}
                              onChange={(e) => handleCargaChange(index, 'peso_toneladas', parseFloat(e.target.value) || null)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="time"
                              value={carga.hora_chegada}
                              onChange={(e) => handleCargaChange(index, 'hora_chegada', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={carga.temp_chegada || ""}
                              onChange={(e) => handleCargaChange(index, 'temp_chegada', parseFloat(e.target.value) || null)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="time"
                              value={carga.hora_aplicacao}
                              onChange={(e) => handleCargaChange(index, 'hora_aplicacao', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={carga.temp_espalhamento || ""}
                              onChange={(e) => handleCargaChange(index, 'temp_espalhamento', parseFloat(e.target.value) || null)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={carga.temp_compactacao || ""}
                              onChange={(e) => handleCargaChange(index, 'temp_compactacao', parseFloat(e.target.value) || null)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              value={carga.pista}
                              onChange={(e) => handleCargaChange(index, 'pista', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={carga.espessura_cm || ""}
                              onChange={(e) => handleCargaChange(index, 'espessura_cm', parseFloat(e.target.value) || null)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              value={carga.estaca_inicial}
                              onChange={(e) => handleCargaChange(index, 'estaca_inicial', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              value={carga.estaca_final}
                              onChange={(e) => handleCargaChange(index, 'estaca_final', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 p-1">
                            <Input
                              value={carga.observacoes}
                              onChange={(e) => handleCargaChange(index, 'observacoes', e.target.value)}
                              disabled={!canEdit}
                              className="h-8 text-xs"
                            />
                          </td>
                          {canEdit && (
                            <td className="border border-slate-300 p-1 text-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveCarga(index)}
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div>
              <Label>Observações Gerais</Label>
              <Textarea
                value={formData.observacoes_gerais}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_gerais: e.target.value }))}
                disabled={!canEdit}
                rows={4}
              />
            </div>

            {/* Botões de ação */}
            {canEdit && (
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Progresso
                </Button>
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                  className="bg-[#566E3D] text-white hover:bg-[#566E3D]/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Finalizar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}