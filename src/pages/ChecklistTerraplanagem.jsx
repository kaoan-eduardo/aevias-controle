import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, XCircle, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Project } from "@/entities/Project";
import { useFormPersistence } from "@/components/hooks/useFormPersistence";

// Helper component for section titles
const SectionTitle = ({ children }) => (
  <CardHeader>
    <CardTitle className="text-lg">{children}</CardTitle>
  </CardHeader>
);

export default function ChecklistTerraplanagem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const [formData, setFormData] = useState({
    obra_id: "",
    project_id: "",
    data: new Date().toISOString().split('T')[0],
    rodovia: "",
    empreiteira: "",
    estaca: "",
    camada: "",
    inspetor_fiscal: "",
    material: "",
    engenheiro_responsavel: "",
    umidade_otima_proctor: "",
    umidade_in_situ: "",
    status: "rascunho",
    periodos_clima: [
      { periodo: "manha", temperatura_ambiente: "", condicoes_climaticas: "bom" },
      { periodo: "tarde", temperatura_ambiente: "", condicoes_climaticas: "bom" }
    ],
    acompanhamento_execucao: {
      remocao_material_existente: { sim: false, nao: false, na: false },
      espalhamento_material_novo: { sim: false, nao: false, na: false },
      compactacao_conforme_projeto: {
        sim: false,
        nao: false,
        na: false,
        rolo_liso: false,
        rolo_pneu: false,
        rolo_pe_carneiro: false
      },
      ensaio_viga_benkelman: { sim: false, nao: false, na: false },
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
      isc: {
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
      variacao_umidade_conforme: null,
      grau_compactacao_conforme: null
    },
    observacoes_gerais: "",
    fotos: [],
    status: "rascunho"
  });

  const { clearSavedData } = useFormPersistence('checklist_terraplanagem', formData, setFormData, !!editingChecklist);

  const [gestoresDisponiveis, setGestoresDisponiveis] = useState([]);

  // Carregar gestores quando obra mudar
  useEffect(() => {
    const loadGestores = async () => {
      const obra = obras.find(o => o.id === formData.obra_id);
      const regional = obra ? regionais.find(r => r.id === obra.regional_id) : null;

      if (!regional?.id) {
        setGestoresDisponiveis([]);
        return;
      }

      try {
        const allUsersData = await base44.entities.User.list();
        const gestores = [];
        
        if (regional.gestores_contrato_responsaveis && Array.isArray(regional.gestores_contrato_responsaveis)) {
          regional.gestores_contrato_responsaveis.forEach(email => {
            const gestor = allUsersData.find(u => u.email?.toLowerCase() === email?.toLowerCase());
            if (gestor && !gestores.find(g => g.email === gestor.email)) {
              gestores.push({
                email: gestor.email,
                nome: gestor.laboratorista_name || gestor.full_name || gestor.email
              });
            }
          });
        }
        
        if (regional.gestor_contrato_responsavel) {
          const gestor = allUsersData.find(u => u.email?.toLowerCase() === regional.gestor_contrato_responsavel?.toLowerCase());
          if (gestor && !gestores.find(g => g.email === gestor.email)) {
            gestores.push({
              email: gestor.email,
              nome: gestor.laboratorista_name || gestor.full_name || gestor.email
            });
          }
        }
        
        setGestoresDisponiveis(gestores);
      } catch (error) {
        console.log("Usando função backend para buscar gestores...");
        try {
          const response = await base44.functions.invoke('getGestoresRegional', { regional_id: regional.id });
          setGestoresDisponiveis(response.data.gestores || []);
        } catch (backendError) {
          console.error("Erro ao buscar gestores:", backendError);
          setGestoresDisponiveis([]);
        }
      }
    };

    if (formData.obra_id && obras.length > 0 && regionais.length > 0) {
      loadGestores();
    }
  }, [formData.obra_id, obras, regionais]);

  // Cálculos automáticos
  const variacaoUmidade = (() => {
    const uOtima = parseFloat(formData.umidade_otima_proctor);
    const uInSitu = parseFloat(formData.umidade_in_situ);
    if (isNaN(uOtima) || isNaN(uInSitu)) return null;
    return (uInSitu - uOtima).toFixed(2);
  })();

  const grauCompactacao = (() => {
    const densInSituResult = formData.ensaios_empreiteira.massa_especifica_in_situ?.resultados;
    const densProctorResult = formData.ensaios_empreiteira.compactacao_proctor?.resultados;

    // Check if the results are valid numbers
    const densInSitu = parseFloat(densInSituResult);
    const densProctor = parseFloat(densProctorResult);

    if (isNaN(densInSitu) || isNaN(densProctor) || densProctor === 0) return null;
    return ((densInSitu / densProctor) * 100).toFixed(2);
  })();

  useEffect(() => {
    loadInitialData();
  }, []);



  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [userData, obrasData, projectsData, regionaisData, allUsersData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Obra.list(),
        Project.list(),
        base44.entities.Regional.list(),
        base44.entities.User.list().catch(() => [])
      ]);

      setUser(userData);
      setRegionais(regionaisData);
      setAllProjects(projectsData);
      setAllUsers(allUsersData.length > 0 ? allUsersData : [userData]);

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

      setProjects([]);

      // Verificar se está editando
      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const checklistToEdit = await base44.entities.ChecklistTerraplanagem.get(editId);
        
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
        ...prev.ensaios_empreiteira, // Keep existing ensaios_empreiteira properties
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
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );

      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map(result => result.file_url);

      setFormData(prev => ({
        ...prev,
        fotos: [...prev.fotos, ...newPhotoUrls]
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

    console.log("🟢 [CHECKLIST TERRAPLANAGEM] Iniciando salvamento...");
    console.log("🟢 [CHECKLIST TERRAPLANAGEM] Status solicitado:", saveStatus);
    console.log("🟢 [CHECKLIST TERRAPLANAGEM] É edição?", !!editingChecklist?.id);

    try {
      // Validações obrigatórias apenas quando finalizando
      if (saveStatus === 'finalizado') {
        if (!formData.engenheiro_responsavel?.trim()) {
          alert("Por favor, selecione o Engenheiro Responsável.");
          setSaving(false);
          return;
        }

        for (let i = 0; i < formData.periodos_clima.length; i++) {
          const periodo = formData.periodos_clima[i];
          if (!periodo.temperatura_ambiente || periodo.temperatura_ambiente === '') {
            alert(`Por favor, preencha a temperatura do período ${periodo.periodo === 'manha' ? 'Manhã' : 'Tarde'}.`);
            setSaving(false);
            return;
          }
        }
      } else {
        // Para salvar progresso, apenas obra é obrigatória
        if (!formData.obra_id) {
          alert("Por favor, selecione uma obra.");
          setSaving(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        status: saveStatus,
        umidade_otima_proctor: formData.umidade_otima_proctor ? parseFloat(formData.umidade_otima_proctor) : null,
        umidade_in_situ: formData.umidade_in_situ ? parseFloat(formData.umidade_in_situ) : null,
        periodos_clima: formData.periodos_clima.map(p => ({
          ...p,
          temperatura_ambiente: p.temperatura_ambiente ? parseFloat(p.temperatura_ambiente) : null
        })),
        ensaios_empreiteira: Object.fromEntries(
          Object.entries(formData.ensaios_empreiteira).map(([key, value]) => {
            // Se o valor é null, undefined ou não é um objeto, retorna como está
            if (!value || typeof value !== 'object') {
              return [key, value];
            }
            
            // Se é um objeto, processa a quantidade
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

      console.log("🟢 [CHECKLIST TERRAPLANAGEM] Dados que serão salvos:", {
        id: editingChecklist?.id,
        status: dataToSave.status,
        obra_id: dataToSave.obra_id,
        data: dataToSave.data
      });

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

        const result = await base44.entities.ChecklistTerraplanagem.update(editingChecklist.id, updateData);
        console.log("🟢 [CHECKLIST TERRAPLANAGEM] Atualizado com sucesso!", result);
        alert(successMessage);
      } else {
        const result = await base44.entities.ChecklistTerraplanagem.create(dataToSave);
        console.log("🟢 [CHECKLIST TERRAPLANAGEM] Criado com sucesso!", result);
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
            <CardTitle>{editingChecklist ? 'Editar Checklist de Terraplanagem' : 'Novo Checklist de Terraplanagem'}</CardTitle>
            <CardDescription>
              {editingChecklist ? `Editando checklist de ${new Date(editingChecklist.data).toLocaleDateString('pt-BR')}` : 'Controle Tecnológico de Terraplanagem'}
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
                        onChange={(e) => setFormData({ ...formData, obra_id: e.target.value })}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="rodovia">Rodovia *</Label>
                      <Input
                        id="rodovia"
                        value={formData.rodovia}
                        onChange={(e) => setFormData({ ...formData, rodovia: e.target.value })}
                        required
                        placeholder="Nome da rodovia"
                      />
                    </div>

                    <div>
                      <Label htmlFor="empreiteira">Empreiteira *</Label>
                      <Input
                        id="empreiteira"
                        value={formData.empreiteira}
                        onChange={(e) => setFormData({ ...formData, empreiteira: e.target.value })}
                        required
                        placeholder="Nome da empreiteira"
                      />
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
                      <Label htmlFor="camada">Camada *</Label>
                      <Input
                        id="camada"
                        value={formData.camada}
                        onChange={(e) => setFormData({ ...formData, camada: e.target.value })}
                        required
                        placeholder="Ex: Subleito, Sub-base, Base"
                      />
                    </div>

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

                    <div>
                      <Label htmlFor="inspetor_fiscal">Inspetor Fiscal</Label>
                      <Input
                        id="inspetor_fiscal"
                        value={formData.inspetor_fiscal}
                        onChange={(e) => setFormData({ ...formData, inspetor_fiscal: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="engenheiro_responsavel">Engenheiro Responsável *</Label>
                      <select
                        id="engenheiro_responsavel"
                        value={formData.engenheiro_responsavel}
                        onChange={(e) => setFormData({ ...formData, engenheiro_responsavel: e.target.value })}
                        disabled={gestoresDisponiveis.length === 0}
                        required
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione o engenheiro</option>
                        {gestoresDisponiveis.map((gestor) => (
                          <option key={gestor.email} value={gestor.nome}>
                            {gestor.nome}
                          </option>
                        ))}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">
                            A compactação da camada foi realizada em conformidade à energia de projeto?
                            <div className="flex gap-4 mt-2 ml-4">
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
                                <span className="text-xs">ROLO DE PNEU</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={formData.acompanhamento_execucao.compactacao_conforme_projeto.rolo_pe_carneiro}
                                  onChange={() => handleRoloChange('rolo_pe_carneiro')}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs">ROLO PÉ DE CARNEIRO</span>
                              </label>
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <CheckboxGroup
                              value={formData.acompanhamento_execucao.compactacao_conforme_projeto}
                              onChange={(opt) => handleCheckboxChange('acompanhamento_execucao', 'compactacao_conforme_projeto', opt)}
                            />
                          </td>
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
                  <CardTitle className="text-lg">Ensaios da Camada Realizados pela Empreiteira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2 py-2 text-left font-medium">Ensaios</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-24">Realizado</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-20">Qtde</th>
                          <th className="border border-slate-300 px-2 py-2 text-left font-medium">Resultados</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-32">Conformidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Compactação - Proctor */}
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">Compactação - Proctor (g/cm³)</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData.ensaios_empreiteira.compactacao_proctor.realizado}
                              onChange={(e) => handleEnsaioChange('compactacao_proctor', 'realizado', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={formData.ensaios_empreiteira.compactacao_proctor.quantidade || ''}
                              onChange={(e) => handleEnsaioChange('compactacao_proctor', 'quantidade', e.target.value)}
                              disabled={!formData.ensaios_empreiteira.compactacao_proctor.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              step="0.001"
                              value={formData.ensaios_empreiteira.compactacao_proctor.resultados}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
                                  handleEnsaioChange('compactacao_proctor', 'resultados', value);
                                }
                              }}
                              disabled={!formData.ensaios_empreiteira.compactacao_proctor.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="Ex: 2.510"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                        </tr>

                        {/* Umidade Ótima */}
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">Umidade Ótima (%)</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                          <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.umidade_otima_proctor}
                              onChange={(e) => setFormData({ ...formData, umidade_otima_proctor: e.target.value })}
                              className="h-8 text-sm text-center"
                              placeholder="Ex: 12.5"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                        </tr>

                        {/* ISC */}
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">ISC - Índice de Suporte Califórnia (%)</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData.ensaios_empreiteira.isc.realizado}
                              onChange={(e) => handleEnsaioChange('isc', 'realizado', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={formData.ensaios_empreiteira.isc.quantidade || ''}
                              onChange={(e) => handleEnsaioChange('isc', 'quantidade', e.target.value)}
                              disabled={!formData.ensaios_empreiteira.isc.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              value={formData.ensaios_empreiteira.isc.resultados}
                              onChange={(e) => handleEnsaioChange('isc', 'resultados', e.target.value)}
                              disabled={!formData.ensaios_empreiteira.isc.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="Ex: 10"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                        </tr>

                        {/* Massa Específica In Situ */}
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">Massa Específica In Situ (g/cm³)</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData.ensaios_empreiteira.massa_especifica_in_situ.realizado}
                              onChange={(e) => handleEnsaioChange('massa_especifica_in_situ', 'realizado', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={formData.ensaios_empreiteira.massa_especifica_in_situ.quantidade || ''}
                              onChange={(e) => handleEnsaioChange('massa_especifica_in_situ', 'quantidade', e.target.value)}
                              disabled={!formData.ensaios_empreiteira.massa_especifica_in_situ.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              step="0.001"
                              value={formData.ensaios_empreiteira.massa_especifica_in_situ.resultados}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
                                  handleEnsaioChange('massa_especifica_in_situ', 'resultados', value);
                                }
                              }}
                              disabled={!formData.ensaios_empreiteira.massa_especifica_in_situ.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="Ex: 2.450"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                        </tr>

                        {/* Umidade In Situ */}
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">Umidade In Situ (%)</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                          <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.umidade_in_situ}
                              onChange={(e) => setFormData({ ...formData, umidade_in_situ: e.target.value })}
                              className="h-8 text-sm text-center"
                              placeholder="Ex: 13.2"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                        </tr>

                        {/* Análise Granulométrica */}
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">Análise Granulométrica por Peneiramento</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={formData.ensaios_empreiteira.granulometria.realizado}
                              onChange={(e) => handleEnsaioChange('granulometria', 'realizado', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={formData.ensaios_empreiteira.granulometria.quantidade || ''}
                              onChange={(e) => handleEnsaioChange('granulometria', 'quantidade', e.target.value)}
                              disabled={!formData.ensaios_empreiteira.granulometria.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Input
                              value={formData.ensaios_empreiteira.granulometria.resultados}
                              onChange={(e) => handleEnsaioChange('granulometria', 'resultados', e.target.value)}
                              disabled={!formData.ensaios_empreiteira.granulometria.realizado}
                              className="h-8 text-sm text-center"
                              placeholder="Resultados"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                        </tr>

                        {/* Campos calculados - somente leitura */}
                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">Variação de Umidade (%)</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">
                            {variacaoUmidade !== null ? <span className="text-blue-600 text-lg">📊</span> : '-'}
                          </td>
                          <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                          <td className="border border-slate-300 px-2 py-1">
                            <div className="h-8 flex items-center justify-center text-sm">
                              {variacaoUmidade !== null ? variacaoUmidade : '-'}
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-1">
                            <div className="flex gap-2 justify-center">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.ensaios_empreiteira.variacao_umidade_conforme === true}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    ensaios_empreiteira: {
                                      ...prev.ensaios_empreiteira,
                                      variacao_umidade_conforme: e.target.checked ? true : null
                                    }
                                  }))}
                                  disabled={variacaoUmidade === null}
                                  className="w-4 h-4 accent-green-500"
                                />
                                <span className="text-xs text-green-600">✓</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.ensaios_empreiteira.variacao_umidade_conforme === false}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    ensaios_empreiteira: {
                                      ...prev.ensaios_empreiteira,
                                      variacao_umidade_conforme: e.target.checked ? false : null
                                    }
                                  }))}
                                  disabled={variacaoUmidade === null}
                                  className="w-4 h-4 accent-red-500"
                                />
                                <span className="text-xs text-red-600">✗</span>
                              </label>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className="border border-slate-300 px-2 py-2 bg-slate-50">Grau de Compactação (%)</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">
                            {grauCompactacao !== null ? <span className="text-green-600 text-lg">📊</span> : '-'}
                          </td>
                          <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                          <td className="border border-slate-300 px-2 py-1">
                            <div className="h-8 flex items-center justify-center text-sm">
                              {grauCompactacao !== null ? grauCompactacao : '-'}
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-1">
                            <div className="flex gap-2 justify-center">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.ensaios_empreiteira.grau_compactacao_conforme === true}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    ensaios_empreiteira: {
                                      ...prev.ensaios_empreiteira,
                                      grau_compactacao_conforme: e.target.checked ? true : null
                                    }
                                  }))}
                                  disabled={grauCompactacao === null}
                                  className="w-4 h-4 accent-green-500"
                                />
                                <span className="text-xs text-green-600">✓</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.ensaios_empreiteira.grau_compactacao_conforme === false}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    ensaios_empreiteira: {
                                      ...prev.ensaios_empreiteira,
                                      grau_compactacao_conforme: e.target.checked ? false : null
                                    }
                                  }))}
                                  disabled={grauCompactacao === null}
                                  className="w-4 h-4 accent-red-500"
                                />
                                <span className="text-xs text-red-600">✗</span>
                              </label>
                            </div>
                          </td>
                        </tr>
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
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
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