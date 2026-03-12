import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, XCircle, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Project } from "@/entities/Project";
import { useFormPersistence } from "@/components/hooks/useFormPersistence";
import AcoesCorretivasNC from "@/components/checklists/AcoesCorretivasNC";

const SectionTitle = ({ children }) => (
  <CardHeader>
    <CardTitle className="text-lg">{children}</CardTitle>
  </CardHeader>
);

export default function ChecklistReciclagem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [faixasGranulometricas, setFaixasGranulometricas] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");
  const [editingChecklist, setEditingChecklist] = useState(null);

  const [formData, setFormData] = useState({
    obra_id: "",
    project_id: "",
    data: new Date().toISOString().split('T')[0],
    jornada: {
      horario_inicio: "",
      horario_fim: ""
    },
    rodovia: "",
    empreiteira: "",
    estaca: "",
    trecho: "",
    faixa: "",
    material: "",
    inspetor_fiscal: "",
    ensaio_realizado_por: "Afirma Evias",
    status: "rascunho",
    periodos_clima: [
      { periodo: "manha", temperatura_ambiente: "", condicoes_climaticas: "bom" },
      { periodo: "tarde", temperatura_ambiente: "", condicoes_climaticas: "bom" },
      { periodo: "noite", temperatura_ambiente: "", condicoes_climaticas: "bom" }
    ],
    acompanhamento_execucao: {
      remocao_material_existente: { sim: false, nao: false, na: false, km_bota_fora: "" },
      espalhamento_material_novo: { sim: false, nao: false, na: false, tipo_material: "" },
      compactacao_conforme_projeto: {
        sim: false,
        nao: false,
        na: false,
        rolo_liso: false,
        rolo_pneu: false,
        rolo_pe_carneiro: false
      },
      ensaio_viga_benkelman: { sim: false, nao: false, na: false },
      espessura_reciclada: "",
      teste_carga: { sim: false, nao: false, na: false },
      falha_compactacao: { sim: false, nao: false, na: false },
      observacoes: ""
    },
    ensaios_empreiteira: {
      compactacao_proctor: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      taxa_agregado: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      taxa_cimento: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      umidade_frigideira: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      massa_especifica_in_situ: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      granulometria: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      moldagem_resistencia: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      viga_benkelman: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      taxa_pintura_ligacao: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      },
      finura_cimento: {
        realizado: false,
        quantidade: null,
        conforme: null,
        resultados: "",
        observacoes: ""
      }
    },
    observacoes_gerais: "",
    acoes_corretivas_realizado: null,
    acoes_corretivas_descricao: "",
    nao_conformidades: [],
    fotos: [],
    status: "rascunho"
  });

  const { clearSavedData } = useFormPersistence('checklist_reciclagem', formData, setFormData, !!editingChecklist);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [userData, obrasData, projectsData, regionaisData, faixasData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Obra.list(),
        Project.list(),
        base44.entities.Regional.list(),
        base44.entities.FaixaGranulometrica.list()
      ]);

      setUser(userData);
      setRegionais(regionaisData);
      setAllProjects(projectsData);
      setFaixasGranulometricas(faixasData);

      const userAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

      if (userAccessLevel === 'user') {
        const regionalDoLaboratorista = regionaisData.find(regional => {
          const laboratoristas = regional.laboratoristas_responsaveis || [];
          return laboratoristas.some(email => email.toLowerCase() === userData.email.toLowerCase());
        });

        if (regionalDoLaboratorista) {
          const obrasRegional = obrasData.filter(obra =>
            obra.regional_id === regionalDoLaboratorista.id &&
            obra.status === 'em_andamento' &&
            obra.tipo_obra === 'supervisao'
          );
          setObras(obrasRegional);
        } else {
          setObras([]);
        }
      } else {
        const obrasSupervisao = obrasData.filter(obra =>
          obra.status === 'em_andamento' && obra.tipo_obra === 'supervisao'
        );
        setObras(obrasSupervisao);
      }

      // Projetos serão filtrados quando uma obra for selecionada
      setProjects([]);

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const checklistToEdit = await base44.entities.ChecklistReciclagem.get(editId);
        
        if (userAccessLevel === 'admin' || (checklistToEdit.created_by === userData.email && (checklistToEdit.status === 'rascunho' || checklistToEdit.approved === false))) {
          setEditingChecklist(checklistToEdit);
          setFormData(checklistToEdit);
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
          return;
        }
      } else {
        setFormData(prev => ({
          ...prev,
          inspetor_fiscal: userData.laboratorista_name || userData.full_name,
          laboratorista_name: userData.laboratorista_name || userData.full_name
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados iniciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (section, field, option) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          sim: option === 'sim',
          nao: option === 'nao',
          na: option === 'na'
        }
      }
    }));
  };

  const handleRoloChange = (rolo) => {
    setFormData(prev => ({
      ...prev,
      acompanhamento_execucao: {
        ...prev.acompanhamento_execucao,
        compactacao_conforme_projeto: {
          ...prev.acompanhamento_execucao.compactacao_conforme_projeto,
          [rolo]: !prev.acompanhamento_execucao.compactacao_conforme_projeto[rolo]
        }
      }
    }));
  };

  const handleEnsaioChange = (ensaio, field, value) => {
    setFormData(prev => ({
      ...prev,
      ensaios_empreiteira: {
        ...prev.ensaios_empreiteira,
        [ensaio]: {
          ...prev.ensaios_empreiteira[ensaio],
          [field]: value
        }
      }
    }));
  };

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }
    return true;
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      setSelectedFileNames("Nenhum ficheiro selecionado");
      return;
    }

    try {
      files.forEach(file => validateFile(file));
    } catch (error) {
      alert(error.message);
      e.target.value = '';
      return;
    }

    setUploadingPhotos(true);
    setSelectedFileNames(files.length === 1 ? files[0].name : `${files.length} ficheiros selecionados`);

    try {
      const uploadedUrls = [];
      
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(result.file_url);
      }

      setFormData(prev => ({
        ...prev,
        fotos: [...(prev.fotos || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error("Erro ao fazer upload das fotos:", error);
      alert("Erro ao fazer upload das fotos.");
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e, saveStatus = 'finalizado') => {
    e.preventDefault();
    setSaving(true);

    try {
      // Para salvar progresso, apenas obra é obrigatória
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        setSaving(false);
        return;
      }

      // Validações obrigatórias apenas quando finalizando
      if (saveStatus === 'finalizado') {
        if (!formData.rodovia?.trim()) {
          alert("Por favor, selecione a Rodovia.");
          setSaving(false);
          return;
        }

        if (!formData.empreiteira?.trim()) {
          alert("Por favor, selecione a Empreiteira.");
          setSaving(false);
          return;
        }

        if (!formData.estaca?.trim()) {
          alert("Por favor, preencha o campo Estaca.");
          setSaving(false);
          return;
        }

        if (!formData.project_id?.trim()) {
          alert("Por favor, selecione o Projeto.");
          setSaving(false);
          return;
        }

        if (!formData.trecho?.trim()) {
          alert("Por favor, preencha o campo Trecho.");
          setSaving(false);
          return;
        }

        if (!formData.faixa?.trim()) {
          alert("Por favor, preencha o campo Faixa.");
          setSaving(false);
          return;
        }

        if (!formData.material?.trim()) {
          alert("Por favor, preencha o campo Material.");
          setSaving(false);
          return;
        }

        if (!formData.inspetor_fiscal?.trim()) {
          alert("Por favor, preencha o campo Inspetor de Campo.");
          setSaving(false);
          return;
        }

        if (!formData.jornada?.horario_inicio?.trim()) {
          alert("Por favor, preencha o Horário de Início.");
          setSaving(false);
          return;
        }

        if (!formData.jornada?.horario_fim?.trim()) {
          alert("Por favor, preencha o Horário Fim.");
          setSaving(false);
          return;
        }

        for (let i = 0; i < formData.periodos_clima.length; i++) {
          const periodo = formData.periodos_clima[i];
          if (!periodo.temperatura_ambiente || periodo.temperatura_ambiente === '') {
            alert(`Por favor, preencha a temperatura do período ${periodo.periodo === 'manha' ? 'Manhã' : periodo.periodo === 'tarde' ? 'Tarde' : 'Noite'}.`);
            setSaving(false);
            return;
          }
        }

        // Validar ações corretivas
        if (formData.acoes_corretivas_realizado === true && !formData.acoes_corretivas_descricao?.trim()) {
          alert("Por favor, descreva as ações corretivas realizadas.");
          setSaving(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        status: saveStatus,
        periodos_clima: formData.periodos_clima.map(p => ({
          ...p,
          temperatura_ambiente: p.temperatura_ambiente ? parseFloat(p.temperatura_ambiente) : null
        })),
        ensaios_empreiteira: Object.fromEntries(
          Object.entries(formData.ensaios_empreiteira).map(([key, value]) => {
            if (!value || typeof value !== 'object') {
              return [key, value];
            }
            
            return [
              key,
              {
                ...value,
                quantidade: value.quantidade ? parseInt(value.quantidade) : null
              }
            ];
          })
        )
      };

      if (editingChecklist?.id) {
        const updateData = { ...dataToSave };
        let successMessage = saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Checklist atualizado com sucesso!";

        if (editingChecklist.approved === false && saveStatus === 'finalizado') {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
          updateData.was_rejected = true;
          successMessage = "Checklist atualizado com sucesso! O registro voltará para análise do administrador.";
        }

        await base44.entities.ChecklistReciclagem.update(editingChecklist.id, updateData);
        alert(successMessage);
      } else {
        await base44.entities.ChecklistReciclagem.create(dataToSave);
        alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Checklist criado com sucesso!");
      }
      clearSavedData();
      navigate(createPageUrl("MeusEnsaios"));
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      alert(`Erro ao salvar checklist: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const CheckboxGroup = ({ value, onChange }) => (
    <div className="flex gap-4 justify-center">
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={value?.sim || false}
          onChange={() => onChange('sim')}
          className="w-4 h-4 accent-green-500"
        />
        <span className="text-xs">Sim</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={value?.nao || false}
          onChange={() => onChange('nao')}
          className="w-4 h-4 accent-red-500"
        />
        <span className="text-xs">Não</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={value?.na || false}
          onChange={() => onChange('na')}
          className="w-4 h-4 accent-gray-500"
        />
        <span className="text-xs">N/A</span>
      </label>
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingChecklist ? 'Editar Checklist de Reciclagem' : 'Novo Checklist de Reciclagem'}</CardTitle>
            <CardDescription>
              {editingChecklist ? `Editando checklist de ${new Date(editingChecklist.data).toLocaleDateString('pt-BR')}` : 'Controle Tecnológico de Reciclagem'}
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
            {formData.approved === false && formData.rejection_reason && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Registro Reprovado</p>
                  <p className="text-sm text-red-700">{formData.rejection_reason}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="overflow-hidden">
            <form onSubmit={(e) => handleSubmit(e, 'finalizado')} className="space-y-6">

              {/* DADOS DA OBRA */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Dados da Obra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                     <Label htmlFor="obra_id">Obra *</Label>
                     <select
                       id="obra_id"
                       value={formData.obra_id}
                       onChange={(e) => {
                         const obraId = e.target.value;
                         const obraSelecionada = obras.find(o => o.id === obraId);

                         // Filtrar projetos de CAMADAS_GRANULARES da regional da obra
                         if (obraSelecionada?.regional_id) {
                           const projetosFiltrados = allProjects.filter(p => 
                             p.regional_id === obraSelecionada.regional_id && 
                             p.tipo_projeto === 'CAMADAS_GRANULARES'
                           );
                           setProjects(projetosFiltrados);
                         } else {
                           setProjects([]);
                         }

                         setFormData({ ...formData, obra_id: obraId, project_id: "", faixa: "" });
                       }}
                       required
                       disabled={!!editingChecklist?.id}
                       className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                     >
                       <option value="">Selecione a obra</option>
                       {obras.map(obra => (
                         <option key={obra.id} value={obra.id}>
                           {obra.name} - {obra.code}
                         </option>
                       ))}
                     </select>
                    </div>

                    <div>
                      <Label htmlFor="data">Data *</Label>
                      <Input
                        type="date"
                        id="data"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="horario_inicio">Horário Início *</Label>
                      <Input
                        id="horario_inicio"
                        type="time"
                        value={formData.jornada?.horario_inicio || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          jornada: { ...formData.jornada, horario_inicio: e.target.value } 
                        })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="horario_fim">Horário Fim *</Label>
                      <Input
                        id="horario_fim"
                        type="time"
                        value={formData.jornada?.horario_fim || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          jornada: { ...formData.jornada, horario_fim: e.target.value } 
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="rodovia">Rodovia *</Label>
                      <Select 
                        value={formData.rodovia} 
                        onValueChange={(value) => setFormData({ ...formData, rodovia: value })} 
                        disabled={!formData.obra_id}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a rodovia" />
                        </SelectTrigger>
                        <SelectContent>
                          {(obras.find(o => o.id === formData.obra_id)?.rodovias || []).map((rodovia, idx) => (
                            <SelectItem key={idx} value={rodovia}>
                              {rodovia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="empreiteira">Empreiteira *</Label>
                      <Select 
                        value={formData.empreiteira} 
                        onValueChange={(value) => setFormData({ ...formData, empreiteira: value })} 
                        disabled={!formData.obra_id}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empreiteira" />
                        </SelectTrigger>
                        <SelectContent>
                          {(obras.find(o => o.id === formData.obra_id)?.empreiteiras || []).map((empreiteira, idx) => (
                            <SelectItem key={idx} value={empreiteira}>
                              {empreiteira}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="estaca">Estaca *</Label>
                      <Input
                        id="estaca"
                        value={formData.estaca}
                        onChange={(e) => setFormData({ ...formData, estaca: e.target.value })}
                        required
                        placeholder="Ex: km 10+500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="project_id">Projeto</Label>
                      <select
                        id="project_id"
                        value={formData.project_id}
                        onChange={(e) => {
                          const projectId = e.target.value;
                          const projetoSelecionado = projects.find(p => p.id === projectId);
                          
                          // Preencher automaticamente a faixa com base no projeto
                          let nomeFaixa = "";
                          if (projetoSelecionado?.faixa_granulometrica_id) {
                            const faixa = faixasGranulometricas.find(f => f.id === projetoSelecionado.faixa_granulometrica_id);
                            if (faixa) {
                              nomeFaixa = faixa.nome;
                            }
                          }
                          
                          setFormData({ ...formData, project_id: projectId, faixa: nomeFaixa });
                        }}
                        disabled={!formData.obra_id || projects.length === 0}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione o projeto</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="trecho">Trecho</Label>
                      <Input
                        id="trecho"
                        value={formData.trecho}
                        onChange={(e) => setFormData({ ...formData, trecho: e.target.value })}
                        placeholder="Descrição do trecho"
                      />
                    </div>

                    <div>
                      <Label htmlFor="faixa">Faixa</Label>
                      <Input
                        id="faixa"
                        value={formData.faixa}
                        onChange={(e) => setFormData({ ...formData, faixa: e.target.value })}
                        placeholder="Faixa especificada"
                        readOnly
                        className="bg-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="material">Material *</Label>
                      <Input
                        id="material"
                        value={formData.material}
                        onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                        required
                        placeholder="Material utilizado"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inspetor_fiscal">Inspetor de Campo</Label>
                      <Input
                        id="inspetor_fiscal"
                        value={formData.inspetor_fiscal}
                        onChange={(e) => setFormData({ ...formData, inspetor_fiscal: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ensaio_realizado_por">Ensaio realizado por:</Label>
                      <select
                        id="ensaio_realizado_por"
                        value={formData.ensaio_realizado_por}
                        onChange={(e) => setFormData({ ...formData, ensaio_realizado_por: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="Afirma Evias">Afirma Evias</option>
                        <option value="Empreiteira">Empreiteira</option>
                      </select>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* CONDIÇÕES CLIMÁTICAS */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Condições Climáticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.periodos_clima.map((periodo, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base capitalize">{periodo.periodo}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-sm">Temperatura (°C) *</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={periodo.temperatura_ambiente}
                              onChange={(e) => {
                                const newPeriodos = [...formData.periodos_clima];
                                newPeriodos[index].temperatura_ambiente = e.target.value;
                                setFormData({ ...formData, periodos_clima: newPeriodos });
                              }}
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Condições *</Label>
                            <select
                              value={periodo.condicoes_climaticas}
                              onChange={(e) => {
                                const newPeriodos = [...formData.periodos_clima];
                                newPeriodos[index].condicoes_climaticas = e.target.value;
                                setFormData({ ...formData, periodos_clima: newPeriodos });
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              required
                            >
                              <option value="bom">Bom</option>
                              <option value="instavel">Instável</option>
                              <option value="chuva">Chuva</option>
                            </select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ACOMPANHAMENTO EXECUÇÃO */}
              <Card className="bg-slate-50">
                <SectionTitle>Acompanhamento Execução da Camada</SectionTitle>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2 py-2 text-left font-medium">Controle</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-32">Resposta</th>
                          <th className="border border-slate-300 px-2 py-2 text-left font-medium">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            Foi realizado remoção de material existente?
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <CheckboxGroup
                              value={formData.acompanhamento_execucao.remocao_material_existente}
                              onChange={(opt) => handleCheckboxChange('acompanhamento_execucao', 'remocao_material_existente', opt)}
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <Input
                              placeholder="KM DO BOTA FORA"
                              value={formData.acompanhamento_execucao.remocao_material_existente.km_bota_fora || ""}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                acompanhamento_execucao: {
                                  ...prev.acompanhamento_execucao,
                                  remocao_material_existente: {
                                    ...prev.acompanhamento_execucao.remocao_material_existente,
                                    km_bota_fora: e.target.value
                                  }
                                }
                              }))}
                              className="h-8 text-sm"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            Foi espalhado material novo para construção da camada?
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <CheckboxGroup
                              value={formData.acompanhamento_execucao.espalhamento_material_novo}
                              onChange={(opt) => handleCheckboxChange('acompanhamento_execucao', 'espalhamento_material_novo', opt)}
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <Input
                              placeholder="TIPO DE MATERIAL"
                              value={formData.acompanhamento_execucao.espalhamento_material_novo.tipo_material || ""}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                acompanhamento_execucao: {
                                  ...prev.acompanhamento_execucao,
                                  espalhamento_material_novo: {
                                    ...prev.acompanhamento_execucao.espalhamento_material_novo,
                                    tipo_material: e.target.value
                                  }
                                }
                              }))}
                              className="h-8 text-sm"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            A compactação da camada foi realizada em conformidade à energia de projeto?
                            <div className="flex gap-4 mt-2 ml-4">
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={formData.acompanhamento_execucao.compactacao_conforme_projeto.rolo_pe_carneiro}
                                  onChange={() => handleRoloChange('rolo_pe_carneiro')}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs">ROLO PÉ DE CARNEIRO</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={formData.acompanhamento_execucao.compactacao_conforme_projeto.rolo_liso}
                                  onChange={() => handleRoloChange('rolo_liso')}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs">ROLO LISO</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={formData.acompanhamento_execucao.compactacao_conforme_projeto.rolo_pneu}
                                  onChange={() => handleRoloChange('rolo_pneu')}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs">ROLO PNEU</span>
                              </label>
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <CheckboxGroup
                              value={formData.acompanhamento_execucao.compactacao_conforme_projeto}
                              onChange={(opt) => handleCheckboxChange('acompanhamento_execucao', 'compactacao_conforme_projeto', opt)}
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2"></td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            Foi realizado ensaio de viga Benkelman para liberação da camada?
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <CheckboxGroup
                              value={formData.acompanhamento_execucao.ensaio_viga_benkelman}
                              onChange={(opt) => handleCheckboxChange('acompanhamento_execucao', 'ensaio_viga_benkelman', opt)}
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2"></td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            Espessura Reciclada?
                          </td>
                          <td className="border border-slate-300 px-2 py-2" colSpan="2">
                            <Input
                              placeholder="Informe a espessura"
                              value={formData.acompanhamento_execucao.espessura_reciclada || ""}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                acompanhamento_execucao: {
                                  ...prev.acompanhamento_execucao,
                                  espessura_reciclada: e.target.value
                                }
                              }))}
                              className="h-8 text-sm"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            Foi realizado teste de carga para liberação da camada?
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <CheckboxGroup
                              value={formData.acompanhamento_execucao.teste_carga}
                              onChange={(opt) => handleCheckboxChange('acompanhamento_execucao', 'teste_carga', opt)}
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2"></td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            Há algum ponto de falha de compactação (borrachudo)?
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <CheckboxGroup
                              value={formData.acompanhamento_execucao.falha_compactacao}
                              onChange={(opt) => handleCheckboxChange('acompanhamento_execucao', 'falha_compactacao', opt)}
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="observacoes_acompanhamento">Observações do Acompanhamento</Label>
                    <Textarea
                      id="observacoes_acompanhamento"
                      value={formData.acompanhamento_execucao.observacoes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        acompanhamento_execucao: {
                          ...prev.acompanhamento_execucao,
                          observacoes: e.target.value
                        }
                      }))}
                      rows={2}
                      placeholder="Observações sobre o acompanhamento..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ENSAIOS DA EMPREITEIRA */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Acompanhamento dos Ensaios Realizados pela Empreiteira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2 py-2 text-left font-medium">Ensaios</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-24">Realizado</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-20">Qtde</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-32">Conformidade</th>
                          <th className="border border-slate-300 px-2 py-2 text-left font-medium">Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: 'compactacao_proctor', label: 'Compactação - Proctor' },
                          { key: 'taxa_agregado', label: 'Taxa de agregado' },
                          { key: 'taxa_cimento', label: 'Taxa de cimento' },
                          { key: 'umidade_frigideira', label: 'Umidade pelo método expedito da "frigideira"' },
                          { key: 'massa_especifica_in_situ', label: 'Determinação da massa específica aparente seca "in situ"' },
                          { key: 'granulometria', label: 'Análise granulométrica por peneiramento' },
                          { key: 'moldagem_resistencia', label: 'Moldagem para resistência' },
                          { key: 'viga_benkelman', label: 'Viga Benkelman' },
                          { key: 'taxa_pintura_ligacao', label: 'Taxa de pintura de ligação' },
                          { key: 'finura_cimento', label: 'Determinação da finura do cimento' }
                        ].map(ensaio => (
                          <tr key={ensaio.key}>
                            <td className="border border-slate-300 px-2 py-2 bg-slate-50">{ensaio.label}</td>
                            <td className="border border-slate-300 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={formData.ensaios_empreiteira[ensaio.key].realizado}
                                onChange={(e) => handleEnsaioChange(ensaio.key, 'realizado', e.target.checked)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="border border-slate-300 px-1 py-1">
                              <Input
                                type="number"
                                min="0"
                                value={formData.ensaios_empreiteira[ensaio.key].quantidade || ''}
                                onChange={(e) => handleEnsaioChange(ensaio.key, 'quantidade', e.target.value)}
                                disabled={!formData.ensaios_empreiteira[ensaio.key].realizado}
                                className="h-8 text-sm text-center"
                                placeholder="0"
                              />
                            </td>
                            <td className="border border-slate-300 px-2 py-1">
                              <div className="flex gap-2 justify-center">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.ensaios_empreiteira[ensaio.key].conforme === true}
                                    onChange={(e) => handleEnsaioChange(ensaio.key, 'conforme', e.target.checked ? true : null)}
                                    disabled={!formData.ensaios_empreiteira[ensaio.key].realizado}
                                    className="w-4 h-4 accent-green-500"
                                  />
                                  <span className="text-xs text-green-600">✓</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.ensaios_empreiteira[ensaio.key].conforme === false}
                                    onChange={(e) => handleEnsaioChange(ensaio.key, 'conforme', e.target.checked ? false : null)}
                                    disabled={!formData.ensaios_empreiteira[ensaio.key].realizado}
                                    className="w-4 h-4 accent-red-500"
                                  />
                                  <span className="text-xs text-red-600">✗</span>
                                </label>
                              </div>
                            </td>
                            <td className="border border-slate-300 px-1 py-1">
                               <Input
                                 value={formData.ensaios_empreiteira[ensaio.key].resultados}
                                 onChange={(e) => handleEnsaioChange(ensaio.key, 'resultados', e.target.value)}
                                 disabled={!formData.ensaios_empreiteira[ensaio.key].realizado}
                                 className="h-8 text-sm"
                                 placeholder="Resultado"
                               />
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* OBSERVAÇÕES GERAIS */}
              <div>
                <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
                <Textarea
                  id="observacoes_gerais"
                  value={formData.observacoes_gerais}
                  onChange={(e) => setFormData({ ...formData, observacoes_gerais: e.target.value })}
                  rows={3}
                  placeholder="Observações gerais sobre o checklist..."
                  maxLength="500"
                />
                <p className="text-xs text-right text-slate-500 mt-1">
                  {formData.observacoes_gerais?.length || 0} / 500
                </p>
              </div>

              {/* AÇÕES CORRETIVAS / NÃO CONFORMIDADES */}
              <AcoesCorretivasNC
                acoesRealizadas={formData.acoes_corretivas_realizado}
                acoesDescricao={formData.acoes_corretivas_descricao}
                naoConformidades={formData.nao_conformidades || []}
                onAcoesRealizadasChange={(value) => setFormData({ ...formData, acoes_corretivas_realizado: value, acoes_corretivas_descricao: value === false ? "" : formData.acoes_corretivas_descricao })}
                onAcoesDescricaoChange={(value) => setFormData({ ...formData, acoes_corretivas_descricao: value })}
                onNaoConformidadesChange={(ncs) => setFormData({ ...formData, nao_conformidades: ncs })}
                disabled={false}
                locaisPermitidos={["CAMPO"]}
              />

              {/* FOTOS */}
              <div>
                <Label>Registro Fotográfico</Label>
                <div>
                  <Input
                    id="fotos"
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    disabled={uploadingPhotos}
                    className="hidden"
                  />
                  <Label
                    htmlFor="fotos"
                    className={`flex items-center justify-between w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm cursor-pointer hover:bg-slate-50 ${uploadingPhotos ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="truncate text-slate-500">{selectedFileNames}</span>
                    <span className="flex-shrink-0 ml-4 px-3 py-1 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {uploadingPhotos ? 'Enviando...' : 'Escolher Ficheiros'}
                    </span>
                  </Label>
                </div>

                {uploadingPhotos && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fazendo upload das fotos...</span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {formData.fotos && formData.fotos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-md border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTÕES */}
              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  clearSavedData();
                  navigate(createPageUrl('MeusEnsaios'));
                }}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || uploadingPhotos}
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleSubmit(e, 'rascunho');
                  }}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Save className="mr-2 h-4 w-4" /> Salvar Progresso
                </Button>
                <Button
                  type="submit"
                  disabled={saving || uploadingPhotos}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Finalizar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}