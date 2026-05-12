import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Save, Eye, Upload, X, Loader2 } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { uploadMultipleFiles } from "@/utils/imageUpload";
import { useFormPersistence } from "@/components/hooks/useFormPersistence";
import AcoesCorretivasNC from "@/components/checklists/AcoesCorretivasNC";

const getInitialFormData = () => {
  const today = new Date().toISOString().split('T')[0];
  return {
  obra_id: "",
  project_id: "",
  data: today,
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
  inspetor_campo: "",
  ensaio_realizado_por: "Afirma Evias",
  periodos_clima: [
    { periodo: "manha", temperatura_ambiente: null, condicoes_climaticas: "bom" },
    { periodo: "tarde", temperatura_ambiente: null, condicoes_climaticas: "bom" },
    { periodo: "noite", temperatura_ambiente: null, condicoes_climaticas: "bom" }
  ],
  fresagem_preparacao: {
    superficie_limpa: false,
    destinacao_material_fresado: false,
    material_solto_removido: false,
    pavimento_pronto_pintura: false,
    observacoes: ""
  },
  pintura_ligacao: {
    pintura_barra_espargidora: { realizado: false, resultado: "" },
    tempo_rompimento_cura: { realizado: false, resultado: "" },
    taxa_pintura: { realizado: false, resultado: null, conforme: null },
    residuo_emulsao: { realizado: false, resultado: null },
    taxa_pintura_residual: { realizado: false, resultado: null, conforme: null },
    observacoes: ""
  },
  controle_aplicacao: {
    km_estaca_inicial: "",
    lado_inicial: "direito",
    km_estaca_final: "",
    lado_final: "direito",
    quantidade_aplicada_cargas: null,
    quantidade_aplicada_toneladas: null,
    temp_aplicacao_cargas: { realizado: false, quantidade: 0, conforme: null },
    espessura_camada: { realizado: false, quantidade: 0, conforme: null },
    observacoes: ""
  },
  observacoes_gerais: "",
  acoes_corretivas_realizado: null,
  acoes_corretivas_descricao: "",
  nao_conformidades: [],
  fotos: [],
  medicoes_geometricas: {
    subtrecho: "",
    servico: "",
    medicoes: []
  },
  status: "rascunho"
  };
};

export default function ChecklistAplicacaoPage() {
  const [formData, setFormData] = useState(getInitialFormData());
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // NEW STATE for all users
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [regional, setRegional] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { clearSavedData } = useFormPersistence('checklist_aplicacao', formData, setFormData, !!editingChecklist);

  const isApproved = editingChecklist?.approved === true;
  const isEditable = !isApproved;

  const obraSelecionada = useMemo(() => obras.find(o => o.id === formData.obra_id), [obras, formData.obra_id]);

  useEffect(() => {
    if (obraSelecionada) {
      base44.entities.Regional.list().then(regionaisData => {
        const reg = regionaisData.find(r => r.id === obraSelecionada.regional_id);
        setRegional(reg);
      }).catch(error => {
        console.error("[ChecklistAplicacao] Erro ao carregar regional:", error?.message || error);
        setRegional(null);
      });
    } else {
      setRegional(null);
    }
  }, [obraSelecionada]);

  const projetosDisponiveis = useMemo(() => {
    if (!regional || !projects) return [];
    const regionalProjectIds = regional.project_ids || [];
    return projects.filter(p => 
      regionalProjectIds.includes(p.id) && 
      p.status === 'ativo' && 
      p.tipo_projeto === 'CAUQ'
    );
  }, [regional, projects]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        let obrasData = await base44.entities.Obra.list();
        const projectsData = await base44.entities.Project.list();
        const regionaisData = await base44.entities.Regional.list();
        
        let allUsersData = [];
        try {
          allUsersData = await base44.entities.User.list();
          setAllUsers(allUsersData);
        } catch (userError) {
          console.warn("[ChecklistAplicacao] Sem permissão para listar usuários:", userError?.message || userError);
          setAllUsers([]);
        }

        let faixasData = [];
        try {
          faixasData = await base44.entities.FaixaGranulometrica.list();
        } catch (faixasError) {
          console.warn("[ChecklistAplicacao] Faixas granulométricas indisponíveis:", faixasError?.message || faixasError);
        }
        
        const currentUserAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');
        if (currentUserAccessLevel === 'user') {
          const regionalDoLaboratorista = regionaisData.find(regional => {
            const laboratoristas = regional.laboratoristas_responsaveis || [];
            return laboratoristas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
          });
          
          if (regionalDoLaboratorista) {
            obrasData = obrasData.filter(obra => 
              obra.regional_id === regionalDoLaboratorista.id &&
              obra.status === 'em_andamento' &&
              (obra.tipo_obra === 'supervisao' || obra.tipo_obra === 'implantacao')
            );
          } else {
            obrasData = [];
          }
        } else {
          obrasData = obrasData.filter(obra => 
            obra.tipo_obra === 'supervisao' || obra.tipo_obra === 'implantacao'
          );
        }
        
        setObras(obrasData);
        setProjects(projectsData);
        setFaixas(faixasData);
        
        const params = new URLSearchParams(location.search);
        const editId = params.get('editId');

        if (editId) {
          const checklistToEdit = await base44.entities.ChecklistAplicacao.get(editId);
          if (currentUser.role === 'admin' || (checklistToEdit.created_by === currentUser.email && (checklistToEdit.status === 'rascunho' || checklistToEdit.approved === false))) {
            setEditingChecklist(checklistToEdit);
            setFormData(checklistToEdit);
            
            if (checklistToEdit.project_id) {
              const proj = projectsData.find(p => p.id === checklistToEdit.project_id);
              setSelectedProject(proj);
            }
          } else {
            alert("Você não tem permissão para editar este registro.");
            navigate(createPageUrl('MeusEnsaios'));
          }
        } else {
          // Se for novo checklist e houver obras disponíveis, pré-selecionar a primeira obra
          // e preencher campos dependentes, incluindo o engenheiro responsável.
          if (obrasData.length > 0) {
            const primeiraObra = obrasData[0];
            const regional = regionaisData.find(r => r.id === primeiraObra.regional_id);
            
            // Lógica para encontrar o projeto vinculado à obra e regional
            const projectsFromCurrentRegional = projectsData.filter(p => regional?.project_ids?.includes(p.id) && p.status === 'ativo');
            let chosenProject = projectsFromCurrentRegional.length > 0 ? projectsFromCurrentRegional[0] : null;

            let faixaName = "";
            let pedreiras = "";
            let liganteTipo = "";

            if (chosenProject) {
              const faixa = faixasData.find(f => f.id === chosenProject.faixa_granulometrica_id);
              faixaName = faixa ? faixa.nome : "Não definida";
              if (chosenProject.agregados && Array.isArray(chosenProject.agregados) && chosenProject.agregados.length > 0) {
                const pedreirasList = chosenProject.agregados
                  .map(ag => ag.pedreira)
                  .filter(p => p && p.trim() !== '');
                pedreiras = [...new Set(pedreirasList)].join(' + ');
              }
              liganteTipo = chosenProject.ligante?.tipo || "";
            }

            // Encontrar o engenheiro responsável
            const gestorEmail = regional?.gestor_contrato_responsavel;
            let gestorName = "";
            if (gestorEmail && allUsersData.length > 0) {
              const gestor = allUsersData.find(u => u.email.toLowerCase() === gestorEmail.toLowerCase());
              gestorName = gestor ? (gestor.laboratorista_name || gestor.full_name) : "";
            }

            setFormData(prev => ({
              ...prev,
              obra_id: primeiraObra.id,
              project_id: chosenProject?.id || "",
              projeto_utilizado: chosenProject?.name || "",
              faixa_especificada: faixaName,
              ligante: liganteTipo,
              pedreira: pedreiras
            }));
            setSelectedProject(chosenProject);
          }
        }
      } catch (error) {
        console.error("[ChecklistAplicacao] Erro ao carregar dados:", error?.message || error);
        const errorMessage = error.message || "Erro desconhecido";
        alert(`Erro ao carregar dados: ${errorMessage}. Verifique sua conexão e tente novamente.`);
        navigate(createPageUrl('MeusEnsaios'));
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [location.search, navigate]); // Removed allUsers from dependency array as it's set here

  const handleInputChange = useCallback((field, value) => {
    if (field === 'obra_id') {
      const obra = obras.find(o => o.id === value);
      
      if (obra) {
        base44.entities.Regional.list().then(regionaisData => {
          const currentRegional = regionaisData.find(r => r.id === obra.regional_id);
            
          if (currentRegional) {
            const projectsFromCurrentRegional = projects.filter(p => currentRegional.project_ids?.includes(p.id));
            
            let chosenProject = null;

            if (formData.project_id) {
              chosenProject = projectsFromCurrentRegional.find(p => p.id === formData.project_id);
            }
            
            if (!chosenProject && editingChecklist?.project_id) {
              chosenProject = projectsFromCurrentRegional.find(p => p.id === editingChecklist.project_id);
            }

            if (!chosenProject && projectsFromCurrentRegional.length > 0) {
              chosenProject = projectsFromCurrentRegional[0];
            }

            let faixaName = "";
            let pedreiras = "";
            let liganteTipo = "";

            if (chosenProject) {
              const faixa = faixas.find(f => f.id === chosenProject.faixa_granulometrica_id);
              faixaName = faixa ? faixa.nome : "Não definida";
              
              if (chosenProject.agregados && Array.isArray(chosenProject.agregados) && chosenProject.agregados.length > 0) {
                const pedreirasList = chosenProject.agregados
                  .map(ag => ag.pedreira)
                  .filter(p => p && p.trim() !== '');
                pedreiras = [...new Set(pedreirasList)].join(' + ');
              }
              
              liganteTipo = chosenProject.ligante?.tipo || "";
            }
              
            setFormData(current => ({
              ...current,
              obra_id: value,
              project_id: chosenProject?.id || "",
              projeto_utilizado: chosenProject?.name || "",
              faixa_especificada: faixaName,
              ligante: liganteTipo,
              pedreira: pedreiras,
            }));
            setSelectedProject(chosenProject);
          } else {
            setFormData(current => ({
              ...current,
              obra_id: value,
              project_id: "",
              projeto_utilizado: "",
              faixa_especificada: "",
              ligante: "",
              pedreira: "",
              engenheiro_responsavel: ""
            }));
            setSelectedProject(null);
          }
        }).catch(error => console.error("[ChecklistAplicacao] Erro ao carregar regional para obra:", error?.message || error));
      } else {
        setFormData(current => ({
          ...current,
          obra_id: value,
          project_id: "",
          projeto_utilizado: "",
          faixa_especificada: "",
          ligante: "",
          pedreira: "",
          engenheiro_responsavel: ""
        }));
        setSelectedProject(null);
      }
      return;
    }
    
    if (field === 'project_id') {
      const proj = projects.find(p => p.id === value);
      
      if (proj) {
        const faixa = faixas.find(f => f.id === proj.faixa_granulometrica_id);
        
        let pedreiras = "";
        if (proj.agregados && Array.isArray(proj.agregados) && proj.agregados.length > 0) {
          const pedreirasList = proj.agregados
            .map(ag => ag.pedreira)
            .filter(p => p && p.trim() !== '');
          pedreiras = [...new Set(pedreirasList)].join(' + ');
        }
        
        const liganteTipo = proj.ligante?.tipo || "";
        
        setSelectedProject(proj);
        setFormData(current => ({
          ...current,
          project_id: value,
          projeto_utilizado: proj.name,
          faixa_especificada: faixa ? faixa.nome : "Não definida",
          ligante: liganteTipo,
          pedreira: pedreiras
        }));
      } else {
        setFormData(current => ({
          ...current,
          project_id: "",
          projeto_utilizado: "",
          faixa_especificada: "",
          ligante: "",
          pedreira: ""
        }));
        setSelectedProject(null);
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [obras, projects, faixas, editingChecklist, formData.project_id, allUsers]);

  // Atualiza campo em objeto aninhado de 2 níveis: formData[s1][field]
  const handleNestedChange = useCallback((s1, field, value) => {
    setFormData(prev => ({
      ...prev,
      [s1]: { ...prev[s1], [field]: value }
    }));
  }, []);

  // Atualiza campo em objeto aninhado de 3 níveis: formData[s1][s2][field]
  const handleDeepChange = useCallback((s1, s2, field, value) => {
    setFormData(prev => ({
      ...prev,
      [s1]: {
        ...prev[s1],
        [s2]: { ...(prev[s1]?.[s2] ?? {}), [field]: value }
      }
    }));
  }, []);

  const handlePhotoUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploadingPhoto(true);
    const { urls, errors } = await uploadMultipleFiles(files);
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), ...urls] }));
    }
    if (errors.length > 0) {
      alert(`${urls.length} de ${files.length} fotos enviadas.\n\nErros:\n` + errors.map(e => `• ${e.fileName}: ${e.error}`).join('\n'));
    }
    setUploadingPhoto(false);
    e.target.value = '';
  }, []);

  const handleRemovePhoto = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  }, []);



  const handleSubmit = useCallback(async (e, saveStatus = 'finalizado') => {
    e.preventDefault();
    
    // Validações obrigatórias apenas quando finalizando
    if (saveStatus === 'finalizado') {
      if (!formData.obra_id || !formData.project_id || !formData.data || !formData.rodovia || !formData.trecho || !formData.empreiteira || !formData.usina || !formData.ligante || !formData.pedreira || !formData.ensaio_realizado_por) {
        alert("Preencha todos os campos obrigatórios (Obra, Projeto Vinculado, Data, Rodovia, Trecho, Empreiteira, Usina, Ligante, Pedreira, Ensaio realizado por).");
        return;
      }
    } else {
      // Para salvar progresso, apenas obra é obrigatória
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        return;
      }
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: saveStatus,
        laboratorista_name: user?.laboratorista_name || user?.full_name,
        inspetor_campo: user?.laboratorista_name || user?.full_name
      };

      if (editingChecklist) {
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
        
        await base44.entities.ChecklistAplicacao.update(editingChecklist.id, updateData);
        alert(successMessage);
      } else {
        await base44.entities.ChecklistAplicacao.create(dataToSave);
        alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Checklist criado com sucesso!");
      }
      clearSavedData();
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("[ChecklistAplicacao] Erro ao salvar checklist:", error?.message || error);
      alert("Erro ao salvar checklist.");
    } finally {
      setSaving(false);
    }
  }, [formData, editingChecklist, user, navigate, clearSavedData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/50" />
          <p className="text-[#00233B]/80 mt-2">Carregando checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-[#00233B] text-2xl">
                  {editingChecklist ? 'Editar Checklist de Aplicação' : 'Novo Checklist de Aplicação'}
                </CardTitle>
                <CardDescription className="text-[#00233B]/80">
                  {editingChecklist ? `Editando checklist de ${new Date(editingChecklist.data).toLocaleDateString('pt-BR')}` : "Preencha as informações do controle tecnológico de aplicação"}
                </CardDescription>
              </div>
              {editingChecklist && (
                <Link to={createPageUrl(`RelatorioChecklistAplicacao?id=${editingChecklist.id}`)} target="_blank">
                  <Button variant="outline" size="sm" className="text-[#00233B] hover:bg-black/10">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver PDF
                  </Button>
                </Link>
              )}
            </div>
            {formData.status === 'rascunho' && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800">Em Rascunho</p>
                  <p className="text-sm text-blue-700">Este registro ainda está em edição e não será visível aos gestores até que você o finalize.</p>
                </div>
              </div>
            )}
            {editingChecklist?.rejection_reason && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50/50 border border-red-200/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{editingChecklist.rejection_reason}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
              }
            }} className="space-y-8">
              {/* Dados da Obra */}
              <div>
                <h3 className="text-lg font-semibold text-[#00233B] mb-4">Dados da Obra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="obra_id">Obra *</Label>
                    <Select value={formData.obra_id} onValueChange={(value) => handleInputChange('obra_id', value)} disabled={!isEditable || obras.length === 0}>
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
                    <Label htmlFor="project_id">Projeto Vinculado *</Label>
                    <Select 
                      value={formData.project_id} 
                      onValueChange={(value) => handleInputChange('project_id', value)} 
                      disabled={!isEditable || !formData.obra_id || projetosDisponiveis.length === 0}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => handleInputChange('data', e.target.value)}
                      disabled={!isEditable}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="horario_inicio">Horário Início *</Label>
                    <Input
                      id="horario_inicio"
                      type="time"
                      value={formData.jornada?.horario_inicio || ""}
                      onChange={(e) => handleNestedChange('jornada', 'horario_inicio', e.target.value)}
                      disabled={!isEditable}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="horario_fim">Horário Fim *</Label>
                    <Input
                      id="horario_fim"
                      type="time"
                      value={formData.jornada?.horario_fim || ""}
                      onChange={(e) => handleNestedChange('jornada', 'horario_fim', e.target.value)}
                      disabled={!isEditable}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rodovia">Rodovia *</Label>
                    <Select 
                      value={formData.rodovia} 
                      onValueChange={(value) => handleInputChange('rodovia', value)} 
                      disabled={!isEditable || !formData.obra_id}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a rodovia" />
                      </SelectTrigger>
                      <SelectContent>
                        {(obraSelecionada?.rodovias || []).map((rodovia, idx) => (
                          <SelectItem key={`rod-${rodovia}`} value={rodovia}>
                            {rodovia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="trecho">Trecho *</Label>
                    <Input
                      id="trecho"
                      value={formData.trecho}
                      onChange={(e) => handleInputChange('trecho', e.target.value)}
                      disabled={!isEditable}
                      placeholder="Ex: km 10 ao km 25"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="empreiteira">Empreiteira *</Label>
                    <Select 
                      value={formData.empreiteira} 
                      onValueChange={(value) => handleInputChange('empreiteira', value)} 
                      disabled={!isEditable || !formData.obra_id}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empreiteira" />
                      </SelectTrigger>
                      <SelectContent>
                        {(obraSelecionada?.empreiteiras || []).map((empreiteira) => (
                          <SelectItem key={empreiteira} value={empreiteira}>
                            {empreiteira}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="usina">Usina *</Label>
                    <Select 
                      value={formData.usina} 
                      onValueChange={(value) => handleInputChange('usina', value)} 
                      disabled={!isEditable || !formData.obra_id}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a usina" />
                      </SelectTrigger>
                      <SelectContent>
                        {(obraSelecionada?.usinas || []).map((usina, idx) => (
                          <SelectItem key={`usina-${usina}`} value={usina}>
                            {usina}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ligante">Ligante *</Label>
                    <Input
                      id="ligante"
                      value={formData.ligante}
                      onChange={(e) => handleInputChange('ligante', e.target.value)}
                      disabled={!isEditable}
                      readOnly={!!selectedProject}
                      className={selectedProject ? "bg-slate-100" : ""}
                      placeholder="Tipo de ligante"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="pedreira">Pedreira *</Label>
                    <Input
                      id="pedreira"
                      value={formData.pedreira}
                      onChange={(e) => handleInputChange('pedreira', e.target.value)}
                      disabled={!isEditable}
                      readOnly={!!selectedProject}
                      className={selectedProject ? "bg-slate-100" : ""}
                      placeholder="Nome da pedreira"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ensaio_realizado_por">Ensaio realizado por: *</Label>
                    <Select 
                      value={formData.ensaio_realizado_por} 
                      onValueChange={(value) => handleInputChange('ensaio_realizado_por', value)} 
                      disabled={!isEditable}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Afirma Evias">Afirma Evias</SelectItem>
                        <SelectItem value="Empreiteira">Empreiteira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Condições Climáticas */}
              <div>
                <h3 className="text-lg font-semibold text-[#00233B] mb-4">Condições Climáticas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.periodos_clima.map((periodo, index) => (
                  <Card key={periodo.periodo} className="bg-black/5 border-white/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[#00233B]">
                          {periodo.periodo === 'manha' ? 'Manhã' : periodo.periodo === 'tarde' ? 'Tarde' : 'Noite'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label>Temperatura (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={periodo.temperatura_ambiente || ''}
                            onChange={(e) => {
                              const newPeriodos = [...formData.periodos_clima];
                              newPeriodos[index].temperatura_ambiente = e.target.value ? parseFloat(e.target.value) : null;
                              handleInputChange('periodos_clima', newPeriodos);
                            }}
                            disabled={!isEditable}
                            placeholder="Ex: 25.5"
                          />
                        </div>
                        <div>
                          <Label>Condições</Label>
                          <Select
                            value={periodo.condicoes_climaticas}
                            onValueChange={(value) => {
                              const newPeriodos = [...formData.periodos_clima];
                              newPeriodos[index].condicoes_climaticas = value;
                              handleInputChange('periodos_clima', newPeriodos);
                            }}
                            disabled={!isEditable}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bom">Bom</SelectItem>
                              <SelectItem value="instavel">Instável</SelectItem>
                              <SelectItem value="chuva">Chuva</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Fresagem e Preparação */}
              <div>
                <h3 className="text-lg font-semibold text-[#00233B] mb-4">Acompanhamento da Fresagem e Preparação da Superfície</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                      <Label htmlFor="superficie_limpa" className="cursor-pointer">
                        A superfície foi limpa após a fresagem?
                      </Label>
                      <Switch
                        id="superficie_limpa"
                        checked={formData.fresagem_preparacao.superficie_limpa}
                        onCheckedChange={(checked) => handleNestedChange('fresagem_preparacao', 'superficie_limpa', checked)}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                      <Label htmlFor="destinacao_material_fresado" className="cursor-pointer">
                        Foi realizada a destinação do material fresado?
                      </Label>
                      <Switch
                        id="destinacao_material_fresado"
                        checked={formData.fresagem_preparacao.destinacao_material_fresado}
                        onCheckedChange={(checked) => handleNestedChange('fresagem_preparacao', 'destinacao_material_fresado', checked)}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                      <Label htmlFor="material_solto_removido" className="cursor-pointer">
                        O material solto foi removido?
                      </Label>
                      <Switch
                        id="material_solto_removido"
                        checked={formData.fresagem_preparacao.material_solto_removido}
                        onCheckedChange={(checked) => handleNestedChange('fresagem_preparacao', 'material_solto_removido', checked)}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/5 rounded-lg">
                      <Label htmlFor="pavimento_pronto_pintura" className="cursor-pointer">
                        Pavimento pronto para pintura?
                      </Label>
                      <Switch
                        id="pavimento_pronto_pintura"
                        checked={formData.fresagem_preparacao.pavimento_pronto_pintura}
                        onCheckedChange={(checked) => handleNestedChange('fresagem_preparacao', 'pavimento_pronto_pintura', checked)}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fresagem_observacoes">Observações</Label>
                    <Textarea
                      id="fresagem_observacoes"
                      value={formData.fresagem_preparacao.observacoes || ''}
                      onChange={(e) => handleNestedChange('fresagem_preparacao', 'observacoes', e.target.value)}
                      disabled={!isEditable}
                      rows={2}
                      maxLength={500}
                      placeholder="Observações sobre a fresagem e preparação..."
                    />
                    <p className="text-xs text-right text-[#00233B]/60 mt-1">
                      {(formData.fresagem_preparacao.observacoes || '').length} / 500 caracteres
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pintura de Ligação */}
              <div>
                <h3 className="text-lg font-semibold text-[#00233B] mb-4">Acompanhamento da Pintura de Ligação</h3>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-sm min-w-[600px]">
                    <thead className="bg-black/5">
                      <tr>
                        <th className="border border-slate-300 px-2 py-2 text-left">Serviço</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Realizado</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Resultado</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Conformidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-2 py-2">Pintura na barra espargidora</td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Select
                            value={formData.pintura_ligacao.pintura_barra_espargidora.realizado === true ? "sim" : formData.pintura_ligacao.pintura_barra_espargidora.realizado === false ? "nao" : ""}
                            onValueChange={(value) => handleDeepChange('pintura_ligacao', 'pintura_barra_espargidora', 'realizado', value === "sim" ? true : value === "nao" ? false : null)}
                            disabled={!isEditable}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <span className="text-xs">-</span>
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center text-xs">N/A</td>
                      </tr>

                      <tr>
                        <td className="border border-slate-300 px-2 py-2">Aguardado tempo para rompimento/cura</td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Select
                            value={formData.pintura_ligacao.tempo_rompimento_cura.realizado === true ? "sim" : formData.pintura_ligacao.tempo_rompimento_cura.realizado === false ? "nao" : ""}
                            onValueChange={(value) => handleDeepChange('pintura_ligacao', 'tempo_rompimento_cura', 'realizado', value === "sim" ? true : value === "nao" ? false : null)}
                            disabled={!isEditable}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <span className="text-xs">-</span>
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center text-xs">N/A</td>
                      </tr>

                      <tr>
                        <td className="border border-slate-300 px-2 py-2">Taxa de Pintura (l/m²)</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData.pintura_ligacao.taxa_pintura.realizado}
                            onChange={(e) => handleDeepChange('pintura_ligacao', 'taxa_pintura', 'realizado', e.target.checked)}
                            disabled={!isEditable}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={formData.pintura_ligacao.taxa_pintura.resultado !== null && formData.pintura_ligacao.taxa_pintura.resultado !== undefined ? formData.pintura_ligacao.taxa_pintura.resultado : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(',', '.');
                              if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                                handleDeepChange('pintura_ligacao', 'taxa_pintura', 'resultado', value === '' ? null : parseFloat(value) || value);
                              }
                            }}
                            disabled={!isEditable || !formData.pintura_ligacao.taxa_pintura.realizado}
                            placeholder="Ex: 0.9"
                            className="h-8"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Select
                            value={formData.pintura_ligacao.taxa_pintura.conforme === true ? "sim" : formData.pintura_ligacao.taxa_pintura.conforme === false ? "nao" : ""}
                            onValueChange={(value) => handleDeepChange('pintura_ligacao', 'taxa_pintura', 'conforme', value === "sim" ? true : value === "nao" ? false : null)}
                            disabled={!isEditable || !formData.pintura_ligacao.taxa_pintura.realizado}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-slate-300 px-2 py-2">Resíduo da Emulsão (%)</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData.pintura_ligacao.residuo_emulsao.realizado}
                            onChange={(e) => handleDeepChange('pintura_ligacao', 'residuo_emulsao', 'realizado', e.target.checked)}
                            disabled={!isEditable}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.pintura_ligacao.residuo_emulsao.resultado || ''}
                            onChange={(e) => handleDeepChange('pintura_ligacao', 'residuo_emulsao', 'resultado', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable}
                            placeholder="Ex: 60"
                            className="h-8"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center text-xs">-</td>
                      </tr>

                      <tr>
                        <td className="border border-slate-300 px-2 py-2">Taxa de Pintura Residual (l/m²)</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData.pintura_ligacao.taxa_pintura_residual.realizado}
                            onChange={(e) => handleDeepChange('pintura_ligacao', 'taxa_pintura_residual', 'realizado', e.target.checked)}
                            disabled={!isEditable}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={formData.pintura_ligacao.taxa_pintura_residual.resultado !== null && formData.pintura_ligacao.taxa_pintura_residual.resultado !== undefined ? formData.pintura_ligacao.taxa_pintura_residual.resultado : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(',', '.');
                              if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                                handleDeepChange('pintura_ligacao', 'taxa_pintura_residual', 'resultado', value === '' ? null : parseFloat(value) || value);
                              }
                            }}
                            disabled={!isEditable || !formData.pintura_ligacao.taxa_pintura_residual.realizado}
                            placeholder="Ex: 0.35"
                            className="h-8"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Select
                            value={formData.pintura_ligacao.taxa_pintura_residual.conforme === true ? "sim" : formData.pintura_ligacao.taxa_pintura_residual.conforme === false ? "nao" : ""}
                            onValueChange={(value) => handleDeepChange('pintura_ligacao', 'taxa_pintura_residual', 'conforme', value === "sim" ? true : value === "nao" ? false : null)}
                            disabled={!isEditable || !formData.pintura_ligacao.taxa_pintura_residual.realizado}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>

                  <div>
                    <Label htmlFor="pintura_observacoes">Observações</Label>
                    <Textarea
                      id="pintura_observacoes"
                      value={formData.pintura_ligacao.observacoes || ''}
                      onChange={(e) => handleNestedChange('pintura_ligacao', 'observacoes', e.target.value)}
                      disabled={!isEditable}
                      rows={2}
                      maxLength={500}
                      placeholder="Observações sobre a pintura de ligação..."
                    />
                    <p className="text-xs text-right text-[#00233B]/60 mt-1">
                      {(formData.pintura_ligacao.observacoes || '').length} / 500 caracteres
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Controle de Aplicação */}
              <div>
                <h3 className="text-lg font-semibold text-[#00233B] mb-4">Controle de Aplicação</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="km_estaca_inicial">Km/Estaca Inicial</Label>
                      <Input
                        id="km_estaca_inicial"
                        value={formData.controle_aplicacao.km_estaca_inicial}
                        onChange={(e) => handleNestedChange('controle_aplicacao', 'km_estaca_inicial', e.target.value)}
                        disabled={!isEditable}
                        placeholder="Ex: km 10+500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lado_inicial">Lado Inicial</Label>
                      <Select
                        value={formData.controle_aplicacao.lado_inicial}
                        onValueChange={(value) => handleNestedChange('controle_aplicacao', 'lado_inicial', value)}
                        disabled={!isEditable}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="km_estaca_final">Km/Estaca Final</Label>
                      <Input
                        id="km_estaca_final"
                        value={formData.controle_aplicacao.km_estaca_final}
                        onChange={(e) => handleNestedChange('controle_aplicacao', 'km_estaca_final', e.target.value)}
                        disabled={!isEditable}
                        placeholder="Ex: km 12+300"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lado_final">Lado Final</Label>
                      <Select
                        value={formData.controle_aplicacao.lado_final}
                        onValueChange={(value) => handleNestedChange('controle_aplicacao', 'lado_final', value)}
                        disabled={!isEditable}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="quantidade_aplicada_cargas">Quantidade Aplicada (cargas)</Label>
                      <Input
                        id="quantidade_aplicada_cargas"
                        type="number"
                        value={formData.controle_aplicacao.quantidade_aplicada_cargas || ''}
                        onChange={(e) => handleNestedChange('controle_aplicacao', 'quantidade_aplicada_cargas', e.target.value ? parseInt(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 15"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quantidade_aplicada_toneladas">Quantidade Aplicada (t)</Label>
                      <Input
                        id="quantidade_aplicada_toneladas"
                        type="number"
                        step="0.01"
                        value={formData.controle_aplicacao.quantidade_aplicada_toneladas || ''}
                        onChange={(e) => handleNestedChange('controle_aplicacao', 'quantidade_aplicada_toneladas', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 150.5"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-sm min-w-[700px]">
                    <thead className="bg-black/5">
                      <tr>
                        <th className="border border-slate-300 px-2 py-2 text-left">Ensaio</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Realizado</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Qtde</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Frequência</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Limite</th>
                        <th className="border border-slate-300 px-2 py-2 text-center">Conforme</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-2 py-2">Temperatura de aplicação das cargas (°C)</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData.controle_aplicacao.temp_aplicacao_cargas.realizado}
                            onChange={(e) => handleDeepChange('controle_aplicacao', 'temp_aplicacao_cargas', 'realizado', e.target.checked)}
                            disabled={!isEditable}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Input
                            type="number"
                            min="0"
                            value={formData.controle_aplicacao.temp_aplicacao_cargas.quantidade || ''}
                            onChange={(e) => {
                              const qtde = e.target.value ? parseInt(e.target.value) : 0;
                              handleDeepChange('controle_aplicacao', 'temp_aplicacao_cargas', 'quantidade', qtde);
                            }}
                            disabled={!isEditable}
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center text-xs">2 por carga</td>
                        <td className="border border-slate-300 px-2 py-2 text-center text-xs">Estabelecida em projeto</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData.controle_aplicacao.temp_aplicacao_cargas.conforme || false}
                            onChange={(e) => handleDeepChange('controle_aplicacao', 'temp_aplicacao_cargas', 'conforme', e.target.checked)}
                            disabled={!isEditable}
                            className="w-4 h-4"
                          />
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-slate-300 px-2 py-2">Espessura da camada (cm)</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData.controle_aplicacao.espessura_camada.realizado}
                            onChange={(e) => handleDeepChange('controle_aplicacao', 'espessura_camada', 'realizado', e.target.checked)}
                            disabled={!isEditable}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1">
                          <Input
                            type="number"
                            min="0"
                            value={formData.controle_aplicacao.espessura_camada.quantidade || ''}
                            onChange={(e) => {
                              const qtde = e.target.value ? parseInt(e.target.value) : 0;
                              handleDeepChange('controle_aplicacao', 'espessura_camada', 'quantidade', qtde);
                            }}
                            disabled={!isEditable}
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center text-xs">Para cada carga aplicada</td>
                        <td className="border border-slate-300 px-2 py-2 text-center text-xs">Estabelecida em projeto</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={formData.controle_aplicacao.espessura_camada.conforme || false}
                            onChange={(e) => handleDeepChange('controle_aplicacao', 'espessura_camada', 'conforme', e.target.checked)}
                            disabled={!isEditable}
                            className="w-4 h-4"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>

                  <div>
                    <Label htmlFor="controle_observacoes">Observações</Label>
                    <Textarea
                      id="controle_observacoes"
                      value={formData.controle_aplicacao.observacoes || ''}
                      onChange={(e) => handleNestedChange('controle_aplicacao', 'observacoes', e.target.value)}
                      disabled={!isEditable}
                      rows={2}
                      maxLength={500}
                      placeholder="Observações sobre o controle de aplicação..."
                    />
                    <p className="text-xs text-right text-[#00233B]/60 mt-1">
                      {(formData.controle_aplicacao.observacoes || '').length} / 500 caracteres
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Observações Gerais e Fotos */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
                  <Textarea
                    id="observacoes_gerais"
                    value={formData.observacoes_gerais || ''}
                    onChange={(e) => handleInputChange('observacoes_gerais', e.target.value)}
                    disabled={!isEditable}
                    rows={3}
                    maxLength={1000}
                    placeholder="Observações gerais sobre o checklist..."
                  />
                  <p className="text-xs text-right text-[#00233B]/60 mt-1">
                    {(formData.observacoes_gerais || '').length} / 1000 caracteres
                  </p>
                </div>

                {/* AÇÕES CORRETIVAS / NÃO CONFORMIDADES */}
                <AcoesCorretivasNC
                  acoesRealizadas={formData.acoes_corretivas_realizado}
                  acoesDescricao={formData.acoes_corretivas_descricao}
                  naoConformidades={formData.nao_conformidades || []}
                  onAcoesRealizadasChange={(value) => handleInputChange('acoes_corretivas_realizado', value)}
                  onAcoesDescricaoChange={(value) => handleInputChange('acoes_corretivas_descricao', value)}
                  onNaoConformidadesChange={(ncs) => handleInputChange('nao_conformidades', ncs)}
                  disabled={!isEditable}
                  locaisPermitidos={["CAMPO"]}
                />

                <div>
                  <Label>Registro Fotográfico</Label>
                  {isEditable && (
                    <div className="mt-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" className="w-full" disabled={uploadingPhoto} onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('photo-upload').click();
                        }}>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingPhoto ? 'Enviando...' : 'Adicionar Fotos'}
                        </Button>
                      </label>
                    </div>
                  )}
                  {formData.fotos && formData.fotos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {formData.fotos.map((foto, index) => (
                        <div key={index} className="relative group">
                          <picture><source srcSet={foto} /><img src={foto} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-lg border-2 border-white/20" width="auto" height="128" /></picture>
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medição Geométrica de Campo */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-[#00233B] mb-4">Medição Geométrica de Campo</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="subtrecho">Subtrecho</Label>
                      <Input
                        id="subtrecho"
                        value={formData.medicoes_geometricas?.subtrecho || ''}
                        onChange={(e) => handleInputChange('medicoes_geometricas', { 
                          ...formData.medicoes_geometricas, 
                          subtrecho: e.target.value 
                        })}
                        disabled={!isEditable}
                        placeholder="Ex: km 100 ao km 105"
                      />
                    </div>
                    <div>
                      <Label htmlFor="servico_medicao">Serviço</Label>
                      <Input
                        id="servico_medicao"
                        value={formData.medicoes_geometricas?.servico || ''}
                        onChange={(e) => handleInputChange('medicoes_geometricas', { 
                          ...formData.medicoes_geometricas, 
                          servico: e.target.value 
                        })}
                        disabled={!isEditable}
                        placeholder="Ex: Pavimentação asfáltica"
                      />
                    </div>
                  </div>

                  {isEditable && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const medicoes = formData.medicoes_geometricas?.medicoes || [];
                        handleInputChange('medicoes_geometricas', {
                          ...formData.medicoes_geometricas,
                          medicoes: [...medicoes, {
                            estaca_inicial: '',
                            estaca_final: '',
                            lado: '',
                            faixa: '',
                            comprimento: null,
                            largura: null,
                            altura: null,
                            placa: '',
                            quantidade: null,
                            temperatura: null,
                            observacoes: ''
                          }]
                        });
                      }}
                      className="w-full mb-4"
                    >
                      + Adicionar Medição
                    </Button>
                  )}

                  {formData.medicoes_geometricas?.medicoes?.length > 0 && (
                  <div className="space-y-4">
                  {formData.medicoes_geometricas.medicoes.map((medicao, index) => (
                   <Card key={`medicao-${index}`} className="border-2 border-[#BFCF99]/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Medição #{index + 1}</CardTitle>
                              {isEditable && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes.splice(index, 1);
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <Label className="text-xs">Estaca Inicial</Label>
                                <Input
                                  value={medicao.estaca_inicial}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].estaca_inicial = e.target.value;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="Ex: 100+5"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Estaca Final</Label>
                                <Input
                                  value={medicao.estaca_final}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].estaca_final = e.target.value;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="Ex: 105+0"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Lado</Label>
                                <Select
                                  value={medicao.lado}
                                  onValueChange={(value) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].lado = value;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="direito">Direito</SelectItem>
                                    <SelectItem value="esquerdo">Esquerdo</SelectItem>
                                    <SelectItem value="ambos">Ambos</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Faixa</Label>
                                <Input
                                  value={medicao.faixa}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].faixa = e.target.value;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="Ex: A, B, C"
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Comprimento (m)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={medicao.comprimento || ''}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].comprimento = e.target.value ? parseFloat(e.target.value) : null;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="0.00"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Largura (m)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={medicao.largura || ''}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].largura = e.target.value ? parseFloat(e.target.value) : null;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="0.00"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Altura (m)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={medicao.altura || ''}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].altura = e.target.value ? parseFloat(e.target.value) : null;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="0.00"
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Placa</Label>
                                <Input
                                  value={medicao.placa}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].placa = e.target.value;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="Ex: ABC-1234"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Quantidade</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={medicao.quantidade || ''}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].quantidade = e.target.value ? parseFloat(e.target.value) : null;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="0.00"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Temperatura (°C)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={medicao.temperatura || ''}
                                  onChange={(e) => {
                                    const medicoes = [...formData.medicoes_geometricas.medicoes];
                                    medicoes[index].temperatura = e.target.value ? parseFloat(e.target.value) : null;
                                    handleInputChange('medicoes_geometricas', {
                                      ...formData.medicoes_geometricas,
                                      medicoes
                                    });
                                  }}
                                  disabled={!isEditable}
                                  placeholder="0.0"
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">Observações</Label>
                              <Textarea
                                value={medicao.observacoes}
                                onChange={(e) => {
                                  const medicoes = [...formData.medicoes_geometricas.medicoes];
                                  medicoes[index].observacoes = e.target.value;
                                  handleInputChange('medicoes_geometricas', {
                                    ...formData.medicoes_geometricas,
                                    medicoes
                                  });
                                }}
                                disabled={!isEditable}
                                placeholder="Observações sobre esta medição..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    clearSavedData();
                    navigate(createPageUrl('MeusEnsaios'));
                  }}
                  className="hover:bg-black/10"
                >
                  Cancelar
                </Button>
                {isEditable && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving}
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
                      disabled={saving}
                      className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2 text-[#BFCF99]" />
                          Finalizar
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}