import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, AlertTriangle, Loader2, XCircle, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useChecklistForm } from "@/hooks/useChecklistForm";
import AcoesCorretivasNC from "@/components/checklists/AcoesCorretivasNC";
import ChecklistFooter from "@/components/checklists/ChecklistFooter";

const getInitialFormData = () => ({
  obra_id: "",
  project_id: "",
  data: new Date().toISOString().split('T')[0],
  jornada: {
    horario_inicio: "",
    horario_fim: ""
  },
  rodovia: "",
  trecho: "",
  empreiteira: "",
  usina: "",
  projeto_utilizado: "",
  faixa_especificada: "",
  ligante: "",
  pedreira: "",
  inspetor_campo: "", // Mantém no formData mas não será exibido
  ensaio_realizado_por: "Afirma Evias",
  periodos_clima: [
    { periodo: "manha", temperatura_ambiente: null, condicoes_climaticas: "bom" },
    { periodo: "tarde", temperatura_ambiente: null, condicoes_climaticas: "bom" }
  ],
  condicionamento_insumos: {
    agregados_separados: null, // Changed from false to null for better checkbox behavior
    agregados_cobertos: null,  // Changed from false to null
    filler_utilizado: "",
    utilizacao_aditivos: null, // Changed from false to null
    agua_contaminada: null,    // Changed from false to null
    observacoes: ""
  },
  preparacao_superficie: {
    superficie_umida: null,     // Changed from false to null
    temperatura_pavimento: null,
    pavimento_patologias: null, // Changed from false to null
    superficie_fresada: null,   // Changed from false to null
    superficie_limpa: null,     // Changed from false to null
    observacoes: ""
  },
  acompanhamento_aplicacao: {
    tempo_rompimento_cura: { realizado: null, resultado: "" },
    taxa_aplicacao: { realizado: null, resultado: null, conforme: null },
    residuo_emulsao: { realizado: null, resultado: null, conforme: null },
    espessura_camada: { realizado: null, resultado: null, conforme: null },
    observacoes: ""
  },
  controle_aplicacao: {
    km_estaca_inicial: "",
    lado_inicial: "direito",
    km_estaca_final: "",
    lado_final: "direito",
    quantidade_aplicada_m2: null,
    observacoes: ""
  },
  observacoes_gerais: "",
  acoes_corretivas_realizado: null,
  acoes_corretivas_descricao: "",
  nao_conformidades: [],
  fotos: [],
  status: "rascunho",
  approved: null,
  rejection_reason: null
});

export default function ChecklistMRAFPage() {
  const {
    obras, regionais, projects, faixas, user, editingChecklist,
    loading, formData, setFormData, obraSelecionada, regionalSelecionada,
    isApproved, isEditable, clearSavedData, navigate,
  } = useChecklistForm(getInitialFormData, 'ChecklistMRAF', 'checklist_mraf');

  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");
  const [uploadProgress, setUploadProgress] = useState([]);

  const projetosDisponiveis = useMemo(() => {
    if (!regionalSelecionada || !projects) return [];
    return projects.filter(p =>
      (regionalSelecionada.project_ids || []).includes(p.id) &&
      p.status === 'ativo' &&
      p.tipo_projeto === 'MRAF'
    );
  }, [regionalSelecionada, projects]);

  const selectedProject = useMemo(() => projects.find(p => p.id === formData.project_id), [projects, formData.project_id]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const handleObraChange = useCallback((obraId) => {
    setFormData(prev => ({ ...prev, obra_id: obraId, project_id: "" }));
  }, [setFormData]);

  const handleProjectChange = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) { setFormData(prev => ({ ...prev, project_id: "" })); return; }
    const faixa = faixas.find(f => f.id === project.faixa_granulometrica_id);
    const pedreiras = [...new Set((project.agregados || []).map(ag => ag.pedreira).filter(Boolean))].join(' + ');
    setFormData(prev => ({ ...prev, project_id: projectId, faixa_especificada: faixa ? faixa.nome : "Não definida", ligante: project.emulsao_utilizada || "", pedreira: pedreiras }));
  }, [projects, faixas, setFormData]);

  const handleNestedChange = useCallback((section, field, value) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }, [setFormData]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) { setSelectedFileNames("Nenhum ficheiro selecionado"); return; }
    setLoadingUpload(true);
    setSelectedFileNames(files.length === 1 ? files[0].name : `${files.length} ficheiros selecionados`);
    setUploadProgress(files.map((file, i) => ({ id: `${file.name}-${i}`, fileName: file.name, status: 'pending', error: null })));
    const uploadedUrls = [];
    const errors = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${file.name}-${i}`;
      try {
        setUploadProgress(prev => prev.map(p => p.id === id ? { ...p, status: 'uploading' } : p));
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(result.file_url);
        setUploadProgress(prev => prev.map(p => p.id === id ? { ...p, status: 'success' } : p));
      } catch (error) {
        errors.push({ fileName: file.name, error: error.message });
        setUploadProgress(prev => prev.map(p => p.id === id ? { ...p, status: 'error', error: error.message } : p));
      }
    }
    if (uploadedUrls.length > 0) setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), ...uploadedUrls] }));
    if (errors.length > 0) alert(`${uploadedUrls.length} de ${files.length} arquivos enviados.\n\nErros:\n` + errors.map(e => `• ${e.fileName}: ${e.error}`).join('\n'));
    setLoadingUpload(false);
    setUploadProgress([]);
    e.target.value = '';
  };

  const handleRemovePhoto = useCallback((indexToRemove) => {
    setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== indexToRemove) }));
  }, [setFormData]);

  const handleSubmit = async (e, saveStatus = 'finalizado') => {
    e.preventDefault();
    if (saveStatus === 'finalizado') {
      if (!formData.obra_id || !formData.project_id || !formData.rodovia || !formData.trecho || !formData.empreiteira || !formData.pedreira || !formData.ligante || !formData.ensaio_realizado_por) {
        alert("Por favor, preencha todos os campos obrigatórios: Obra, Projeto Vinculado, Rodovia, Trecho, Empreiteira, Pedreira, Ligante e Ensaio realizado por.");
        return;
      }
    } else if (!formData.obra_id) {
      alert("Por favor, selecione uma obra.");
      return;
    }
    const acomp = { ...formData.acompanhamento_aplicacao };
    if (acomp.taxa_aplicacao.realizado && acomp.taxa_aplicacao.resultado !== null)
      acomp.taxa_aplicacao.conforme = acomp.taxa_aplicacao.resultado >= 8 && acomp.taxa_aplicacao.resultado <= 16;
    if (acomp.residuo_emulsao.realizado && acomp.residuo_emulsao.resultado !== null)
      acomp.residuo_emulsao.conforme = acomp.residuo_emulsao.resultado >= 6.5 && acomp.residuo_emulsao.resultado <= 12.0;
    if (acomp.espessura_camada.realizado && acomp.espessura_camada.resultado !== null)
      acomp.espessura_camada.conforme = acomp.espessura_camada.resultado >= 6 && acomp.espessura_camada.resultado <= 20;
    const dataToSave = { ...formData, acompanhamento_aplicacao: acomp, status: saveStatus, laboratorista_name: user?.laboratorista_name || user?.full_name };
    if (editingChecklist?.id) {
      const updateData = { ...dataToSave };
      let msg = saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Checklist atualizado com sucesso!";
      if (editingChecklist.approved === false && saveStatus === 'finalizado') {
        updateData.approved = null; updateData.rejection_reason = null; updateData.approved_by = null; updateData.approved_date = null; updateData.was_rejected = true;
        msg = "Checklist atualizado com sucesso! O registro voltará para análise do administrador.";
      }
      await base44.entities.ChecklistMRAF.update(editingChecklist.id, updateData);
      alert(msg);
    } else {
      await base44.entities.ChecklistMRAF.create(dataToSave);
      alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Checklist criado com sucesso!");
    }
    clearSavedData();
    navigate(createPageUrl('MeusEnsaios'));
  };

  const SectionTitle = ({ children }) => (
    <h3 className="text-lg font-semibold text-slate-700 mb-4">{children}</h3>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">{editingChecklist?.id ? "Editar Checklist de MRAF" : "Novo Checklist de MRAF"}</CardTitle>
            <CardDescription className="text-base">
              {editingChecklist?.id ? `Editando checklist de ${new Date(editingChecklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : "Controle tecnológico de aplicação de MRAF - DNIT 035/2018"}
            </CardDescription>
            {formData.status === 'rascunho' && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800">Em Rascunho</p>
                  <p className="text-sm text-blue-700">Este registro ainda está em edição e não será visível aos gestores até que você o finalize.</p>
                </div>
              </div>
            )}
            {editingChecklist?.rejection_reason && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{editingChecklist.rejection_reason}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="overflow-hidden">
            <form onSubmit={handleSubmit} onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
              }
            }} className="space-y-8">
              {/* DADOS DA OBRA */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Dados da Obra e Projeto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <Label htmlFor="obra_id" className="text-base">Obra *</Label>
                      <Select
                        value={formData.obra_id || ""}
                        onValueChange={(value) => handleObraChange(value)}
                        disabled={!isEditable || isApproved || editingChecklist?.id}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a obra" />
                        </SelectTrigger>
                        <SelectContent>
                          {obras.map(obra => {
                            const regional = regionais.find(r => r.id === obra.regional_id);
                            return (
                              <SelectItem key={obra.id} value={obra.id}>
                                {obra.name} - {obra.code} {regional && `(${regional.nome})`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="project_id" className="text-base">Projeto Vinculado *</Label>
                      <Select
                        value={formData.project_id || ""}
                        onValueChange={(value) => handleProjectChange(value)}
                        disabled={!isEditable || isApproved || !formData.obra_id}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione um projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          {projetosDisponiveis.map(proj => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="data" className="text-base">Data *</Label>
                      <Input
                        id="data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => handleChange('data', e.target.value)}
                        required
                        disabled={!isEditable || isApproved}
                        className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="horario_inicio" className="text-base">Horário Início *</Label>
                      <Input
                        id="horario_inicio"
                        type="time"
                        value={formData.jornada?.horario_inicio || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          jornada: { ...prev.jornada, horario_inicio: e.target.value } 
                        }))}
                        disabled={!isEditable || isApproved}
                        required
                        className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="horario_fim" className="text-base">Horário Fim *</Label>
                      <Input
                        id="horario_fim"
                        type="time"
                        value={formData.jornada?.horario_fim || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          jornada: { ...prev.jornada, horario_fim: e.target.value } 
                        }))}
                        disabled={!isEditable || isApproved}
                        required
                        className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                      />
                    </div>
                  </div>

                  {regionalSelecionada && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-800"><strong>📍 Regional:</strong> {regionalSelecionada.nome}</p>
                        {regionalSelecionada.cliente && (
                          <p className="text-blue-800"><strong>👤 Cliente:</strong> {regionalSelecionada.cliente}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <Label htmlFor="rodovia" className="text-base">Rodovia *</Label>
                      <Select
                        value={formData.rodovia || ""}
                        onValueChange={(value) => handleChange('rodovia', value)}
                        disabled={!isEditable || isApproved || !obraSelecionada}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a rodovia" />
                        </SelectTrigger>
                        <SelectContent>
                          {(obraSelecionada?.rodovias || []).map((rodovia, idx) => (
                            <SelectItem key={idx} value={rodovia}>{rodovia}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="trecho" className="text-base">Trecho *</Label>
                      <Input
                        id="trecho"
                        value={formData.trecho}
                        onChange={(e) => handleChange('trecho', e.target.value)}
                        required
                        disabled={!isEditable || isApproved}
                        placeholder="Descrição do trecho"
                        className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="empreiteira" className="text-base">Empreiteira *</Label>
                      <Select
                        value={formData.empreiteira || ""}
                        onValueChange={(value) => handleChange('empreiteira', value)}
                        disabled={!isEditable || isApproved || !obraSelecionada}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a empreiteira" />
                        </SelectTrigger>
                        <SelectContent>
                          {(obraSelecionada?.empreiteiras || []).map((empreiteira, idx) => (
                            <SelectItem key={idx} value={empreiteira}>{empreiteira}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="pedreira" className="text-base">Pedreira *</Label>
                      <Input
                        id="pedreira"
                        value={formData.pedreira}
                        onChange={(e) => handleChange('pedreira', e.target.value)}
                        disabled={!isEditable || isApproved}
                        required
                        className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                        placeholder="Nome da pedreira"
                      />
                    </div>

                    <div>
                      <Label htmlFor="faixa_especificada" className="text-base">Faixa Especificada</Label>
                      <Input
                        id="faixa_especificada"
                        value={formData.faixa_especificada}
                        onChange={(e) => handleChange('faixa_especificada', e.target.value)}
                        disabled={!isEditable || isApproved}
                        readOnly={true}
                        className="bg-slate-100 border-slate-200 text-slate-700 h-11 text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ligante" className="text-base">Ligante Asfáltico *</Label>
                      <Input
                        id="ligante"
                        value={formData.ligante}
                        onChange={(e) => handleChange('ligante', e.target.value)}
                        disabled={!isEditable || isApproved}
                        readOnly={!!selectedProject}
                        required
                        className={selectedProject ? "bg-slate-100 h-11 text-base" : "bg-white border-slate-200 text-slate-700 h-11 text-base"}
                        placeholder="Ex: Emulsão RL-1C"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ensaio_realizado_por" className="text-base">Ensaio realizado por: *</Label>
                      <Select
                        value={formData.ensaio_realizado_por || ""}
                        onValueChange={(value) => handleChange('ensaio_realizado_por', value)}
                        disabled={!isEditable || isApproved}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Afirma Evias">Afirma Evias</SelectItem>
                          <SelectItem value="Empreiteira">Empreiteira</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CONDIÇÕES CLIMÁTICAS */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Condições Climáticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {formData.periodos_clima.map((periodo, index) => (
                      <div key={index} className="bg-card border border-border rounded-lg p-4">
                        <h4 className="text-base font-semibold text-foreground mb-3 capitalize">
                          {periodo.periodo === 'manha' ? 'Manhã' : 'Tarde'}
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm text-foreground">Temperatura Ambiente (°C)</Label>
                            <Input
                              type="number"
                              value={periodo.temperatura_ambiente || ''}
                              onChange={(e) => {
                                const novosClimas = [...formData.periodos_clima];
                                novosClimas[index] = {
                                  ...novosClimas[index],
                                  temperatura_ambiente: e.target.value ? parseFloat(e.target.value) : null
                                };
                                handleChange('periodos_clima', novosClimas);
                              }}
                              disabled={!isEditable || isApproved}
                              className="h-10 text-base"
                            />
                          </div>

                          <div>
                            <Label className="text-sm text-foreground">Condições Climáticas</Label>
                            <Select
                              value={periodo.condicoes_climaticas}
                              onValueChange={(value) => {
                                const novosClimas = [...formData.periodos_clima];
                                novosClimas[index] = { ...novosClimas[index], condicoes_climaticas: value };
                                handleChange('periodos_clima', novosClimas);
                              }}
                              disabled={!isEditable || isApproved}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bom">☀️ Bom</SelectItem>
                                <SelectItem value="nublado">⛅ Nublado</SelectItem>
                                <SelectItem value="chuva">🌧️ Chuva</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CONDICIONAMENTO DOS INSUMOS - FORMATO TABELA */}
              <div>
                <SectionTitle>Condicionamento dos Insumos</SectionTitle>
                <table className="w-full border-collapse border border-slate-300 text-base">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 px-4 py-3 text-left text-slate-700 font-medium">Serviço</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-20">Sim</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-20">Não</th>
                      <th className="border border-slate-300 px-4 py-3 text-left text-slate-700 font-medium">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Agregados separados no canteiro?</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.agregados_separados === true}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'agregados_separados', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.agregados_separados === false}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'agregados_separados', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3" rowSpan="5">
                        <Textarea
                          value={formData.condicionamento_insumos.observacoes}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'observacoes', e.target.value)}
                          disabled={!isEditable || isApproved}
                          rows={8}
                          maxLength={500}
                          className="bg-white border-slate-200 text-slate-700 w-full text-base"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Agregados devidamente cobertos?</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.agregados_cobertos === true}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'agregados_cobertos', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.agregados_cobertos === false}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'agregados_cobertos', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">
                        Filler utilizado:
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center" colSpan="2">
                        <Input
                          value={formData.condicionamento_insumos.filler_utilizado}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'filler_utilizado', e.target.value)}
                          disabled={!isEditable || isApproved}
                          placeholder="Especificar"
                          className="bg-white border-slate-200 text-slate-700 w-full h-10 text-base"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Utilização de aditivos?</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.utilizacao_aditivos === true}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'utilizacao_aditivos', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.utilizacao_aditivos === false}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'utilizacao_aditivos', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Água contaminada?</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.agua_contaminada === true}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'agua_contaminada', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.condicionamento_insumos.agua_contaminada === false}
                          onChange={(e) => handleNestedChange('condicionamento_insumos', 'agua_contaminada', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PREPARAÇÃO DA SUPERFÍCIE - FORMATO TABELA */}
              <div>
                <SectionTitle>Acompanhamento da Condição e Preparação da Superfície</SectionTitle>
                <table className="w-full border-collapse border border-slate-300 text-base">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 px-4 py-3 text-left text-slate-700 font-medium">Serviço</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-20">Sim</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-20">Não</th>
                      <th className="border border-slate-300 px-4 py-3 text-left text-slate-700 font-medium">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Superfície úmida?</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.superficie_umida === true}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'superficie_umida', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.superficie_umida === false}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'superficie_umida', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3" rowSpan="5">
                        <Textarea
                          value={formData.preparacao_superficie.observacoes}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'observacoes', e.target.value)}
                          disabled={!isEditable || isApproved}
                          rows={8}
                          maxLength={500}
                          className="bg-white border-slate-200 text-slate-700 w-full text-base"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">
                        Temperatura do pavimento:
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center bg-slate-50" colSpan="2">
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            value={formData.preparacao_superficie.temperatura_pavimento || ''}
                            onChange={(e) => handleNestedChange('preparacao_superficie', 'temperatura_pavimento', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable || isApproved}
                            placeholder="°C"
                            className="bg-white border-slate-200 text-slate-700 w-20 text-center h-10 text-base"
                          />
                          <span className="text-slate-700 text-base">°C</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Pavimento apresenta patologias?</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.pavimento_patologias === true}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'pavimento_patologias', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.pavimento_patologias === false}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'pavimento_patologias', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Superfície fresada? (Se sim acima)</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.superficie_fresada === true}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'superficie_fresada', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.superficie_fresada === false}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'superficie_fresada', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">
                        <div>A superfície foi limpa antes da aplicação?</div>
                        <div className="text-sm text-slate-600 italic mt-0.5">
                          *Preferencialmente por vassouras mecânicas, podendo ser usados, também, processos manuais.
                        </div>
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.superficie_limpa === true}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'superficie_limpa', e.target.checked ? true : false)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.preparacao_superficie.superficie_limpa === false}
                          onChange={(e) => handleNestedChange('preparacao_superficie', 'superficie_limpa', e.target.checked ? false : true)}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ACOMPANHAMENTO DA APLICAÇÃO - FORMATO TABELA */}
              <div>
                <SectionTitle>Acompanhamento da Aplicação</SectionTitle>
                <table className="w-full border-collapse border border-slate-300 text-base">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 px-4 py-3 text-left text-slate-700 font-medium">Serviço</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-20">Sim</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-20">Não</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-28">Resultado</th>
                      <th className="border border-slate-300 px-4 py-3 text-center text-slate-700 font-medium w-36">Limites DNIT 035/2018</th>
                      <th className="border border-slate-300 px-4 py-3 text-left text-slate-700 font-medium">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Aguardado tempo necessário para rompimento/cura?</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.tempo_rompimento_cura.realizado === true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              tempo_rompimento_cura: {
                                ...prev.acompanhamento_aplicacao.tempo_rompimento_cura,
                                realizado: e.target.checked ? true : false
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.tempo_rompimento_cura.realizado === false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              tempo_rompimento_cura: {
                                ...prev.acompanhamento_aplicacao.tempo_rompimento_cura,
                                realizado: e.target.checked ? false : true
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center bg-slate-50">
                        <span className="text-slate-500 text-base">N/A</span>
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center bg-slate-50">
                        <span className="text-slate-600 text-base">N/A</span>
                      </td>
                      <td className="border border-slate-300 px-4 py-3" rowSpan="4">
                        <Textarea
                          value={formData.acompanhamento_aplicacao.observacoes}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              observacoes: e.target.value
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          rows={8}
                          maxLength={500}
                          className="bg-white border-slate-200 text-slate-700 w-full text-base"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Taxa de Aplicação</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.taxa_aplicacao.realizado === true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              taxa_aplicacao: {
                                ...prev.acompanhamento_aplicacao.taxa_aplicacao,
                                realizado: e.target.checked ? true : false
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.taxa_aplicacao.realizado === false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              taxa_aplicacao: {
                                ...prev.acompanhamento_aplicacao.taxa_aplicacao,
                                realizado: e.target.checked ? false : true
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.acompanhamento_aplicacao.taxa_aplicacao.resultado || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              acompanhamento_aplicacao: {
                                ...prev.acompanhamento_aplicacao,
                                taxa_aplicacao: {
                                  ...prev.acompanhamento_aplicacao.taxa_aplicacao,
                                  resultado: e.target.value ? parseFloat(e.target.value) : null
                                }
                              }
                            }))}
                            disabled={!isEditable || isApproved || formData.acompanhamento_aplicacao.taxa_aplicacao.realizado === false}
                            placeholder="kg/m²"
                            className={`bg-white border-slate-200 h-10 text-base ${
                              formData.acompanhamento_aplicacao.taxa_aplicacao.realizado && 
                              formData.acompanhamento_aplicacao.taxa_aplicacao.resultado !== null &&
                              (formData.acompanhamento_aplicacao.taxa_aplicacao.resultado < 8 || 
                               formData.acompanhamento_aplicacao.taxa_aplicacao.resultado > 16)
                                ? 'text-red-600 font-bold'
                                : 'text-slate-700'
                            }`}
                          />
                          {formData.acompanhamento_aplicacao.taxa_aplicacao.realizado && 
                           formData.acompanhamento_aplicacao.taxa_aplicacao.resultado !== null &&
                           (formData.acompanhamento_aplicacao.taxa_aplicacao.resultado < 8 || 
                            formData.acompanhamento_aplicacao.taxa_aplicacao.resultado > 16) && (
                            <span className="text-red-600 text-xl" title="Fora dos parâmetros">⚠️</span>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <span className="text-slate-600 text-base">8 kg/m² a 16 kg/m²</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Resíduo da Emulsão</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.residuo_emulsao.realizado === true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              residuo_emulsao: {
                                ...prev.acompanhamento_aplicacao.residuo_emulsao,
                                realizado: e.target.checked ? true : false
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.residuo_emulsao.realizado === false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              residuo_emulsao: {
                                ...prev.acompanhamento_aplicacao.residuo_emulsao,
                                realizado: e.target.checked ? false : true
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.acompanhamento_aplicacao.residuo_emulsao.resultado || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              acompanhamento_aplicacao: {
                                ...prev.acompanhamento_aplicacao,
                                residuo_emulsao: {
                                  ...prev.acompanhamento_aplicacao.residuo_emulsao,
                                  resultado: e.target.value ? parseFloat(e.target.value) : null
                                }
                              }
                            }))}
                            disabled={!isEditable || isApproved || formData.acompanhamento_aplicacao.residuo_emulsao.realizado === false}
                            placeholder="%"
                            className={`bg-white border-slate-200 h-10 text-base ${
                              formData.acompanhamento_aplicacao.residuo_emulsao.realizado && 
                              formData.acompanhamento_aplicacao.residuo_emulsao.resultado !== null &&
                              (formData.acompanhamento_aplicacao.residuo_emulsao.resultado < 6.5 || 
                               formData.acompanhamento_aplicacao.residuo_emulsao.resultado > 12.0)
                                ? 'text-red-600 font-bold'
                                : 'text-slate-700'
                            }`}
                          />
                          {formData.acompanhamento_aplicacao.residuo_emulsao.realizado && 
                           formData.acompanhamento_aplicacao.residuo_emulsao.resultado !== null &&
                           (formData.acompanhamento_aplicacao.residuo_emulsao.resultado < 6.5 || 
                            formData.acompanhamento_aplicacao.residuo_emulsao.resultado > 12.0) && (
                            <span className="text-red-600 text-xl" title="Fora dos parâmetros">⚠️</span>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <span className="text-slate-600 text-base">6,5% a 12,0%</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-3 text-slate-700">Espessura da Camada</td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.espessura_camada.realizado === true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              espessura_camada: {
                                ...prev.acompanhamento_aplicacao.espessura_camada,
                                realizado: e.target.checked ? true : false
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.acompanhamento_aplicacao.espessura_camada.realizado === false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            acompanhamento_aplicacao: {
                              ...prev.acompanhamento_aplicacao,
                              espessura_camada: {
                                ...prev.acompanhamento_aplicacao.espessura_camada,
                                realizado: e.target.checked ? false : true
                              }
                            }
                          }))}
                          disabled={!isEditable || isApproved}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border border-slate-300 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.acompanhamento_aplicacao.espessura_camada.resultado || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              acompanhamento_aplicacao: {
                                ...prev.acompanhamento_aplicacao,
                                espessura_camada: {
                                  ...prev.acompanhamento_aplicacao.espessura_camada,
                                  resultado: e.target.value ? parseFloat(e.target.value) : null
                                }
                              }
                            }))}
                            disabled={!isEditable || isApproved || formData.acompanhamento_aplicacao.espessura_camada.realizado === false}
                            placeholder="mm"
                            className={`bg-white border-slate-200 h-10 text-base ${
                              formData.acompanhamento_aplicacao.espessura_camada.realizado && 
                              formData.acompanhamento_aplicacao.espessura_camada.resultado !== null &&
                              (formData.acompanhamento_aplicacao.espessura_camada.resultado < 6 || 
                               formData.acompanhamento_aplicacao.espessura_camada.resultado > 20)
                                ? 'text-red-600 font-bold'
                                : 'text-slate-700'
                            }`}
                          />
                          {formData.acompanhamento_aplicacao.espessura_camada.realizado && 
                           formData.acompanhamento_aplicacao.espessura_camada.resultado !== null &&
                           (formData.acompanhamento_aplicacao.espessura_camada.resultado < 6 || 
                            formData.acompanhamento_aplicacao.espessura_camada.resultado > 20) && (
                            <span className="text-red-600 text-xl" title="Fora dos parâmetros">⚠️</span>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center">
                        <span className="text-slate-600 text-base">6 mm a 20 mm</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* CONTROLE DE APLICAÇÃO */}
              <div>
                <SectionTitle>Controle de Aplicação</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <Label htmlFor="km_estaca_inicial" className="text-base">km/estaca inicial</Label>
                    <Input
                      id="km_estaca_inicial"
                      value={formData.controle_aplicacao.km_estaca_inicial}
                      onChange={(e) => handleNestedChange('controle_aplicacao', 'km_estaca_inicial', e.target.value)}
                      disabled={!isEditable || isApproved}
                      className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lado_inicial" className="text-base">Lado inicial</Label>
                    <Select
                      value={formData.controle_aplicacao.lado_inicial || "direito"}
                      onValueChange={(value) => handleNestedChange('controle_aplicacao', 'lado_inicial', value)}
                      disabled={!isEditable || isApproved}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direito">Direito</SelectItem>
                        <SelectItem value="esquerdo">Esquerdo</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="km_estaca_final" className="text-base">km/estaca final</Label>
                    <Input
                      id="km_estaca_final"
                      value={formData.controle_aplicacao.km_estaca_final}
                      onChange={(e) => handleNestedChange('controle_aplicacao', 'km_estaca_final', e.target.value)}
                      disabled={!isEditable || isApproved}
                      className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lado_final" className="text-base">Lado final</Label>
                    <Select
                      value={formData.controle_aplicacao.lado_final || "direito"}
                      onValueChange={(value) => handleNestedChange('controle_aplicacao', 'lado_final', value)}
                      disabled={!isEditable || isApproved}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direito">Direito</SelectItem>
                        <SelectItem value="esquerdo">Esquerdo</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantidade_aplicada_m2" className="text-base">Quantidade aplicada (m²)</Label>
                    <Input
                      id="quantidade_aplicada_m2"
                      type="number"
                      value={formData.controle_aplicacao.quantidade_aplicada_m2 || ''}
                      onChange={(e) => handleNestedChange('controle_aplicacao', 'quantidade_aplicada_m2', e.target.value ? parseFloat(e.target.value) : null)}
                      disabled={!isEditable || isApproved}
                      className="bg-white border-slate-200 text-slate-700 h-11 text-base"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label htmlFor="obs_controle" className="text-base">Observações</Label>
                  <Textarea
                    id="obs_controle"
                    value={formData.controle_aplicacao.observacoes}
                    onChange={(e) => handleNestedChange('controle_aplicacao', 'observacoes', e.target.value)}
                    disabled={!isEditable || isApproved}
                    rows={4}
                    maxLength={500}
                    className="bg-white border-slate-200 text-slate-700 text-base"
                  />
                  <p className="text-sm text-right text-slate-600 mt-1">
                    {formData.controle_aplicacao.observacoes?.length || 0} / 500 caracteres
                  </p>
                </div>
              </div>

              {/* OBSERVAÇÕES GERAIS */}
              <div>
                <Label htmlFor="observacoes_gerais" className="text-base">Observações Gerais</Label>
                <Textarea
                  id="observacoes_gerais"
                  value={formData.observacoes_gerais}
                  onChange={(e) => handleChange('observacoes_gerais', e.target.value)}
                  disabled={!isEditable || isApproved}
                  rows={4}
                  maxLength={1000}
                  placeholder="Observações gerais sobre a aplicação..."
                  className="bg-white border-slate-200 text-slate-700 text-base"
                />
                <p className="text-sm text-right text-slate-600 mt-1">
                  {formData.observacoes_gerais?.length || 0} / 1000 caracteres
                </p>
              </div>

              {/* AÇÕES CORRETIVAS / NÃO CONFORMIDADES */}
              <AcoesCorretivasNC
                acoesRealizadas={formData.acoes_corretivas_realizado}
                acoesDescricao={formData.acoes_corretivas_descricao}
                naoConformidades={formData.nao_conformidades || []}
                onAcoesRealizadasChange={(value) => handleChange('acoes_corretivas_realizado', value)}
                onAcoesDescricaoChange={(value) => handleChange('acoes_corretivas_descricao', value)}
                onNaoConformidadesChange={(ncs) => handleChange('nao_conformidades', ncs)}
                disabled={!isEditable || isApproved}
                locaisPermitidos={["CAMPO"]}
              />

              {/* FOTOS */}
              <div>
                <Label className="text-base">Relatório Fotográfico</Label>
                {isEditable && !isApproved && (
                  <div>
                    <Input
                      id="fotos"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      disabled={loadingUpload}
                      className="hidden"
                    />
                    <Label 
                      htmlFor="fotos" 
                      className={`flex items-center justify-between w-full h-12 px-4 py-3 border border-slate-200 bg-white rounded-md text-base cursor-pointer hover:bg-slate-50 ${loadingUpload ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="truncate text-slate-700">{selectedFileNames}</span>
                      <span className="flex-shrink-0 ml-4 px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                        {loadingUpload ? 'Enviando...' : 'Escolher Ficheiros'}
                      </span>
                    </Label>
                  </div>
                )}
                
                {loadingUpload && uploadProgress.length > 0 && (
                  <div className="text-xs space-y-1 mt-2">
                    {uploadProgress.map((progress) => (
                      <div key={progress.id} className="flex items-center gap-2">
                        <span className="w-4">
                          {progress.status === 'pending' && '⚪'}
                          {progress.status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                          {progress.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
                          {progress.status === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                        </span>
                        <span className={progress.status === 'error' ? 'text-red-700' : 'text-slate-700'}>
                          {progress.fileName} - {progress.status === 'pending' && 'Aguardando'}
                          {progress.status === 'uploading' && 'Enviando...'}
                          {progress.status === 'success' && 'Sucesso'}
                          {progress.status === 'error' && `Erro: ${progress.error}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                  {formData.fotos && formData.fotos.map((url, index) => (
                    <div key={index} className="relative group">
                      <picture>
                        <source srcSet={url} />
                        <img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-md border border-slate-200" loading="lazy" width="auto" height="128" />
                      </picture>
                      {isEditable && !isApproved && (
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
              </div>

              <ChecklistFooter
                isEditable={isEditable}
                isApproved={isApproved}
                loadingUpload={loadingUpload}
                onCancel={() => { clearSavedData(); navigate(createPageUrl('MeusEnsaios')); }}
                onSaveProgress={async (e) => { e.preventDefault(); await handleSubmit(e, 'rascunho'); }}
                onFinalize={() => {}}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}