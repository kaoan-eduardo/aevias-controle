import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, XCircle, AlertTriangle, CheckCircle } from "lucide-react";
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
    empreiteira: "",
    estaca: "",
    camada: "",
    inspetor_fiscal: "",
    material: "",
    umidade_otima_proctor: "",
    umidade_in_situ: "",
    ensaio_realizado_por: "Afirma Evias",
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
    acoes_corretivas_realizado: null,
    acoes_corretivas_descricao: "",
    nao_conformidades: [],
    fotos: [],
    status: "rascunho"
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  const { clearSavedData } = useFormPersistence('checklist_terraplanagem', formData, setFormData, !!editingChecklist);

  // Cálculos automáticos
  const variacaoUmidade = (() => {
    const uOtima = parseFloat(formData.umidade_otima_proctor);
    const uInSitu = parseFloat(formData.umidade_in_situ);
    if (isNaN(uOtima) || isNaN(uInSitu)) return null;
    return (uInSitu - uOtima).toFixed(2);
  })();

  const grauCompactacao = (() => {
    const inSituArr = formData.ensaios_empreiteira.massa_especifica_in_situ?.resultados;
    const proctorArr = formData.ensaios_empreiteira.compactacao_proctor?.resultados;
    const densInSitu = parseFloat(Array.isArray(inSituArr) ? inSituArr[0] : inSituArr);
    const densProctor = parseFloat(Array.isArray(proctorArr) ? proctorArr[0] : proctorArr);
    if (isNaN(densInSitu) || isNaN(densProctor) || densProctor === 0) return null;
    return ((densInSitu / densProctor) * 100).toFixed(2);
  })();

  useEffect(() => {
    loadInitialData();
  }, []);



  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [userData, obrasData, projectsData, regionaisData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Obra.list(),
        Project.list(),
        base44.entities.Regional.list()
      ]);

      setUser(userData);
      setRegionais(regionaisData);
      setAllProjects(projectsData);

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
          // Normalizar resultados: string "a, b" → array para uso no form
          const ensaiosNorm = {};
          Object.entries(checklistToEdit.ensaios_empreiteira || {}).forEach(([key, val]) => {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              const r = val.resultados;
              const arr = Array.isArray(r) ? r
                : (typeof r === 'string' && r.trim() !== '') ? r.split('|').map(s => s.trim())
                : (r !== null && r !== undefined && r !== '') ? [String(r)]
                : [];
              ensaiosNorm[key] = { ...val, resultados: arr, quantidade: arr.length || (val.quantidade || 0) };
            } else {
              ensaiosNorm[key] = val;
            }
          });
          setFormData({ ...checklistToEdit, ensaios_empreiteira: { ...checklistToEdit.ensaios_empreiteira, ...ensaiosNorm } });
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

  const handleEnsaioChange = (ensaioKey, field, value) => {
    setFormData(prev => {
      const ensaio = { ...(prev.ensaios_empreiteira[ensaioKey] || {}) };
      const ensaios = { ...prev.ensaios_empreiteira };

      if (field === 'realizado') {
        ensaio.realizado = value;
        if (!value) {
          ensaio.quantidade = 0;
          ensaio.resultados = [];
          ensaio.conforme = null;
        }
      } else if (field === 'quantidade') {
        const newQty = Math.max(0, Math.min(parseInt(value) || 0, 3));
        ensaio.quantidade = newQty;
        const current = Array.isArray(ensaio.resultados)
          ? ensaio.resultados
          : (typeof ensaio.resultados === 'string' && ensaio.resultados.trim() !== '')
            ? ensaio.resultados.split('|').map(s => s.trim())
            : [];
        if (newQty > current.length) {
          ensaio.resultados = [...current, ...Array(newQty - current.length).fill(null)];
        } else {
          ensaio.resultados = current.slice(0, newQty);
        }
        if (newQty === 0) ensaio.conforme = null;
      } else if (field === 'conforme') {
        ensaio.conforme = value;
      } else if (field.startsWith('resultado_')) {
        const idx = parseInt(field.replace('resultado_', ''));
        const novos = Array.isArray(ensaio.resultados)
          ? [...ensaio.resultados]
          : (typeof ensaio.resultados === 'string' && ensaio.resultados.trim() !== '')
            ? ensaio.resultados.split('|').map(s => s.trim())
            : [];
        novos[idx] = value !== '' ? value : null;
        ensaio.resultados = novos;
      } else {
        ensaio[field] = value;
      }

      ensaios[ensaioKey] = ensaio;
      return { ...prev, ensaios_empreiteira: ensaios };
    });
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

    console.log("🟢 [CHECKLIST TERRAPLANAGEM] Iniciando salvamento...");
    console.log("🟢 [CHECKLIST TERRAPLANAGEM] Status solicitado:", saveStatus);
    console.log("🟢 [CHECKLIST TERRAPLANAGEM] É edição?", !!editingChecklist?.id);

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

        if (!formData.camada?.trim()) {
          alert("Por favor, preencha o campo Camada.");
          setSaving(false);
          return;
        }

        if (!formData.material?.trim()) {
          alert("Por favor, preencha o campo Material.");
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
            alert(`Por favor, preencha a temperatura do período ${periodo.periodo === 'manha' ? 'Manhã' : 'Tarde'}.`);
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
        ensaio_realizado_por: formData.ensaio_realizado_por,
        umidade_otima_proctor: formData.umidade_otima_proctor ? parseFloat(formData.umidade_otima_proctor) : null,
        umidade_otima_quantidade: parseInt(formData.umidade_otima_quantidade) || 0,
        umidade_otima_resultados: Array.isArray(formData.umidade_otima_resultados)
          ? formData.umidade_otima_resultados.filter(r => r !== null && r !== '').join(' | ')
          : (formData.umidade_otima_resultados ?? ''),
        umidade_in_situ: formData.umidade_in_situ ? parseFloat(formData.umidade_in_situ) : null,
        umidade_in_situ_quantidade: parseInt(formData.umidade_in_situ_quantidade) || 0,
        umidade_in_situ_resultados: Array.isArray(formData.umidade_in_situ_resultados)
          ? formData.umidade_in_situ_resultados.filter(r => r !== null && r !== '').join(' | ')
          : (formData.umidade_in_situ_resultados ?? ''),
        periodos_clima: formData.periodos_clima.map(p => ({
          ...p,
          temperatura_ambiente: p.temperatura_ambiente ? parseFloat(p.temperatura_ambiente) : null
        })),
        ensaios_empreiteira: {
          ...formData.ensaios_empreiteira,
          compactacao_proctor: {
            ...formData.ensaios_empreiteira.compactacao_proctor,
            quantidade: parseInt(formData.ensaios_empreiteira.compactacao_proctor.quantidade) || 0,
            resultados: Array.isArray(formData.ensaios_empreiteira.compactacao_proctor.resultados)
              ? formData.ensaios_empreiteira.compactacao_proctor.resultados.filter(r => r !== null && r !== '').join(' | ')
              : (formData.ensaios_empreiteira.compactacao_proctor.resultados ?? '')
          },
          isc: {
            ...formData.ensaios_empreiteira.isc,
            quantidade: parseInt(formData.ensaios_empreiteira.isc.quantidade) || 0,
            resultados: Array.isArray(formData.ensaios_empreiteira.isc.resultados)
              ? formData.ensaios_empreiteira.isc.resultados.filter(r => r !== null && r !== '').join(' | ')
              : (formData.ensaios_empreiteira.isc.resultados ?? '')
          },
          umidade_frigideira: {
            ...formData.ensaios_empreiteira.umidade_frigideira,
            quantidade: parseInt(formData.ensaios_empreiteira.umidade_frigideira.quantidade) || 0,
            resultados: Array.isArray(formData.ensaios_empreiteira.umidade_frigideira.resultados)
              ? formData.ensaios_empreiteira.umidade_frigideira.resultados.filter(r => r !== null && r !== '').join(' | ')
              : (formData.ensaios_empreiteira.umidade_frigideira.resultados ?? '')
          },
          massa_especifica_in_situ: {
            ...formData.ensaios_empreiteira.massa_especifica_in_situ,
            quantidade: parseInt(formData.ensaios_empreiteira.massa_especifica_in_situ.quantidade) || 0,
            resultados: Array.isArray(formData.ensaios_empreiteira.massa_especifica_in_situ.resultados)
              ? formData.ensaios_empreiteira.massa_especifica_in_situ.resultados.filter(r => r !== null && r !== '').join(' | ')
              : (formData.ensaios_empreiteira.massa_especifica_in_situ.resultados ?? '')
          },
          granulometria: {
            ...formData.ensaios_empreiteira.granulometria,
            quantidade: parseInt(formData.ensaios_empreiteira.granulometria.quantidade) || 0,
            resultados: Array.isArray(formData.ensaios_empreiteira.granulometria.resultados)
              ? formData.ensaios_empreiteira.granulometria.resultados.filter(r => r !== null && r !== '').join(' | ')
              : (formData.ensaios_empreiteira.granulometria.resultados ?? '')
          },
          variacao_umidade_quantidade: parseInt(formData.ensaios_empreiteira.variacao_umidade_quantidade) || 0,
          variacao_umidade_resultados: (() => {
            const vuQtde = parseInt(formData.ensaios_empreiteira.variacao_umidade_quantidade) || 0;
            const uOtimaResultados = Array.isArray(formData.umidade_otima_resultados)
              ? formData.umidade_otima_resultados
              : (typeof formData.umidade_otima_resultados === 'string' && formData.umidade_otima_resultados.trim() !== '')
                ? formData.umidade_otima_resultados.split('|').map(s => s.trim())
                : [];
            const uisResultados = Array.isArray(formData.umidade_in_situ_resultados)
              ? formData.umidade_in_situ_resultados
              : (typeof formData.umidade_in_situ_resultados === 'string' && formData.umidade_in_situ_resultados.trim() !== '')
                ? formData.umidade_in_situ_resultados.split('|').map(s => s.trim())
                : [];
            return Array.from({ length: vuQtde }).map((_, idx) => {
              const uOtima = parseFloat(uOtimaResultados[idx]);
              const uInSitu = parseFloat(uisResultados[idx]);
              if (isNaN(uOtima) || isNaN(uInSitu)) return null;
              return (uInSitu - uOtima).toFixed(2);
            }).filter(r => r !== null).join(' | ');
          })(),
          grau_compactacao_quantidade: parseInt(formData.ensaios_empreiteira.grau_compactacao_quantidade) || 0,
          grau_compactacao_resultados: (() => {
            const gcQtde = parseInt(formData.ensaios_empreiteira.grau_compactacao_quantidade) || 0;
            const proctorResultados = Array.isArray(formData.ensaios_empreiteira.compactacao_proctor?.resultados)
              ? formData.ensaios_empreiteira.compactacao_proctor.resultados
              : (typeof formData.ensaios_empreiteira.compactacao_proctor?.resultados === 'string' && formData.ensaios_empreiteira.compactacao_proctor.resultados.trim() !== '')
                ? formData.ensaios_empreiteira.compactacao_proctor.resultados.split('|').map(s => s.trim())
                : [];
            const inSituResultados = Array.isArray(formData.ensaios_empreiteira.massa_especifica_in_situ?.resultados)
              ? formData.ensaios_empreiteira.massa_especifica_in_situ.resultados
              : (typeof formData.ensaios_empreiteira.massa_especifica_in_situ?.resultados === 'string' && formData.ensaios_empreiteira.massa_especifica_in_situ.resultados.trim() !== '')
                ? formData.ensaios_empreiteira.massa_especifica_in_situ.resultados.split('|').map(s => s.trim())
                : [];
            return Array.from({ length: gcQtde }).map((_, idx) => {
              const proctor = parseFloat(proctorResultados[idx]);
              const inSitu = parseFloat(inSituResultados[idx]);
              if (isNaN(proctor) || isNaN(inSitu) || proctor === 0) return null;
              return ((inSitu / proctor) * 100).toFixed(2);
            }).filter(r => r !== null).join(' | ');
          })()
        }
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
                      <Select
                      value={formData.obra_id || ""}
                      onValueChange={(value) => setFormData({ ...formData, obra_id: value })}
                      disabled={!!editingChecklist?.id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a obra" />
                      </SelectTrigger>
                      <SelectContent>
                        {obras.map(obra => (
                          <SelectItem key={obra.id} value={obra.id}>
                            {obra.name} - {obra.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                    <div>
                      <Label htmlFor="ensaio_realizado_por">Ensaio realizado por:</Label>
                      <Select
                        value={formData.ensaio_realizado_por}
                        onValueChange={(value) => setFormData({ ...formData, ensaio_realizado_por: value })}
                      >
                        <SelectTrigger>
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
                            <Select
                              value={periodo.condicoes_climaticas}
                              onValueChange={(value) => {
                                const newPeriodos = [...formData.periodos_clima];
                                newPeriodos[index].condicoes_climaticas = value;
                                setFormData({ ...formData, periodos_clima: newPeriodos });
                              }}
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
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-20">Realizado</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-16">Qtde</th>
                          <th className="border border-slate-300 px-2 py-2 text-left font-medium">Resultado(s)</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-10">✓</th>
                          <th className="border border-slate-300 px-2 py-2 text-center font-medium w-10">✗</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: 'compactacao_proctor', label: 'Compactação - Proctor (g/cm³)', step: '0.001' },
                          { key: 'isc', label: 'ISC - Índice de Suporte Califórnia (%)', step: '0.1' },
                          { key: 'umidade_frigideira', label: 'Umidade (Frigideira) (%)', step: '0.01' },
                          { key: 'massa_especifica_in_situ', label: 'Massa Específica In Situ (g/cm³)', step: '0.001', syncQtde: true },
                          { key: 'granulometria', label: 'Análise Granulométrica por Peneiramento', step: null },
                        ].map(({ key, label, step, syncQtde }) => {
                          const e = formData.ensaios_empreiteira[key] || {};
                          const qtde = e.quantidade;
                          const resultados = Array.isArray(e.resultados)
                            ? e.resultados
                            : (typeof e.resultados === 'string' && e.resultados.trim() !== '')
                              ? e.resultados.split('|').map(s => s.trim())
                              : [];
                          const isGranulometria = key === 'granulometria';
                          return (
                            <tr key={key}>
                              <td className="border border-slate-300 px-2 py-2 bg-slate-50">{label}</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                <input type="checkbox" checked={e.realizado || false}
                                  onChange={(ev) => handleEnsaioChange(key, 'realizado', ev.target.checked)}
                                  className="w-4 h-4" />
                              </td>
                              <td className="border border-slate-300 px-1 py-1">
                                {isGranulometria ? <span className="text-slate-400 text-xs px-2">-</span> : (
                                  <Input type="number" min="0" max="3"
                                    value={qtde ?? ''}
                                    onChange={(ev) => {
                                      handleEnsaioChange(key, 'quantidade', ev.target.value);
                                      if (syncQtde) {
                                        const n = Math.max(0, Math.min(3, parseInt(ev.target.value) || 0));
                                        setFormData(prev => ({
                                          ...prev,
                                          ensaios_empreiteira: {
                                            ...prev.ensaios_empreiteira,
                                            variacao_umidade_quantidade: n,
                                            variacao_umidade_resultados: [],
                                            grau_compactacao_quantidade: n,
                                            grau_compactacao_resultados: []
                                          }
                                        }));
                                      }
                                    }}
                                    disabled={!e.realizado}
                                    className="h-8 text-sm text-center" placeholder="" />
                                )}
                              </td>
                              <td className="border border-slate-300 px-1 py-2">
                                {isGranulometria ? <span className="text-slate-400 text-xs px-2">-</span> : (
                                  e.realizado && qtde > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {Array.from({ length: qtde }).map((_, idx) => (
                                        <Input key={idx}
                                          type={step ? 'number' : 'text'}
                                          step={step || undefined}
                                          value={resultados[idx] ?? ''}
                                          onChange={(ev) => handleEnsaioChange(key, `resultado_${idx}`, ev.target.value)}
                                          className="h-8 text-sm text-center"
                                          style={{ width: qtde > 1 ? '90px' : '100%' }}
                                          placeholder={qtde > 1 ? `R${idx + 1}` : 'Resultado'} />
                                      ))}
                                    </div>
                                  ) : <span className="text-slate-400 text-xs px-2">-</span>
                                )}
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                <input type="checkbox" checked={e.conforme === true}
                                  onChange={(ev) => handleEnsaioChange(key, 'conforme', ev.target.checked ? true : null)}
                                  disabled={!e.realizado}
                                  className="w-4 h-4 accent-green-500" />
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                <input type="checkbox" checked={e.conforme === false}
                                  onChange={(ev) => handleEnsaioChange(key, 'conforme', ev.target.checked ? false : null)}
                                  disabled={!e.realizado}
                                  className="w-4 h-4 accent-red-500" />
                              </td>
                            </tr>
                          );
                        })}

                        {/* Umidade Ótima — Qtde + campos manuais */}
                        {(() => {
                          const uoQtde = formData.umidade_otima_quantidade;
                          const uoResultados = Array.isArray(formData.umidade_otima_resultados)
                            ? formData.umidade_otima_resultados
                            : (typeof formData.umidade_otima_resultados === 'string' && formData.umidade_otima_resultados.trim() !== '')
                              ? formData.umidade_otima_resultados.split('|').map(s => s.trim())
                              : [];
                          const setUO = (patch) => setFormData(prev => ({ ...prev, ...patch }));
                          return (
                            <tr>
                              <td className="border border-slate-300 px-2 py-2 bg-slate-50">Umidade Ótima (%)</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                              <td className="border border-slate-300 px-1 py-1">
                                <Input type="number" min="0" max="3" value={uoQtde}
                                  onChange={(e) => {
                                    const n = Math.max(0, Math.min(3, parseInt(e.target.value) || 0));
                                    const cur = Array.isArray(formData.umidade_otima_resultados) ? formData.umidade_otima_resultados : [];
                                    const newArr = n > cur.length ? [...cur, ...Array(n - cur.length).fill(null)] : cur.slice(0, n);
                                    setUO({ umidade_otima_quantidade: n, umidade_otima_resultados: newArr });
                                  }}
                                  className="h-8 text-sm text-center" placeholder="" />
                              </td>
                              <td className="border border-slate-300 px-1 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {Array.from({ length: uoQtde }).map((_, idx) => (
                                    <Input key={idx} type="number" step="0.01"
                                      value={uoResultados[idx] ?? ''}
                                      onChange={(e) => {
                                        const arr = Array.isArray(formData.umidade_otima_resultados) ? [...formData.umidade_otima_resultados] : Array(uoQtde).fill(null);
                                        arr[idx] = e.target.value !== '' ? e.target.value : null;
                                        setUO({ umidade_otima_resultados: arr });
                                      }}
                                      className="h-8 text-sm text-center"
                                      style={{ width: uoQtde > 1 ? '90px' : '100%' }}
                                      placeholder={uoQtde > 1 ? `R${idx + 1}` : 'Resultado'} />
                                  ))}
                                </div>
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                            </tr>
                          );
                        })()}

                        {/* Umidade In Situ — Qtde + campos manuais */}
                        {(() => {
                          const uisQtde = formData.umidade_in_situ_quantidade;
                          const uisResultados = Array.isArray(formData.umidade_in_situ_resultados)
                            ? formData.umidade_in_situ_resultados
                            : (typeof formData.umidade_in_situ_resultados === 'string' && formData.umidade_in_situ_resultados.trim() !== '')
                              ? formData.umidade_in_situ_resultados.split('|').map(s => s.trim())
                              : [];
                          const setUIS = (patch) => setFormData(prev => ({ ...prev, ...patch }));
                          return (
                            <tr>
                              <td className="border border-slate-300 px-2 py-2 bg-slate-50">Umidade In Situ (%)</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                              <td className="border border-slate-300 px-1 py-1">
                                <Input type="number" min="0" max="3" value={uisQtde}
                                  onChange={(e) => {
                                    const n = Math.max(0, Math.min(3, parseInt(e.target.value) || 0));
                                    const cur = Array.isArray(formData.umidade_in_situ_resultados) ? formData.umidade_in_situ_resultados : [];
                                    const newArr = n > cur.length ? [...cur, ...Array(n - cur.length).fill(null)] : cur.slice(0, n);
                                    setUIS({ umidade_in_situ_quantidade: n, umidade_in_situ_resultados: newArr });
                                  }}
                                  className="h-8 text-sm text-center" placeholder="" />
                              </td>
                              <td className="border border-slate-300 px-1 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {Array.from({ length: uisQtde }).map((_, idx) => (
                                    <Input key={idx} type="number" step="0.01"
                                      value={uisResultados[idx] ?? ''}
                                      onChange={(e) => {
                                        const arr = Array.isArray(formData.umidade_in_situ_resultados) ? [...formData.umidade_in_situ_resultados] : Array(uisQtde).fill(null);
                                        arr[idx] = e.target.value !== '' ? e.target.value : null;
                                        setUIS({ umidade_in_situ_resultados: arr });
                                      }}
                                      className="h-8 text-sm text-center"
                                      style={{ width: uisQtde > 1 ? '90px' : '100%' }}
                                      placeholder={uisQtde > 1 ? `R${idx + 1}` : 'Resultado'} />
                                  ))}
                                </div>
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                            </tr>
                          );
                        })()}

                        {/* Variação de Umidade — Calculada automaticamente por R */}
                        {(() => {
                          const vuQtde = formData.ensaios_empreiteira.variacao_umidade_quantidade;
                          const uOtimaResultados = Array.isArray(formData.umidade_otima_resultados)
                            ? formData.umidade_otima_resultados
                            : (typeof formData.umidade_otima_resultados === 'string' && formData.umidade_otima_resultados.trim() !== '')
                              ? formData.umidade_otima_resultados.split('|').map(s => s.trim())
                              : [];
                          const uisResultados = Array.isArray(formData.umidade_in_situ_resultados)
                            ? formData.umidade_in_situ_resultados
                            : (typeof formData.umidade_in_situ_resultados === 'string' && formData.umidade_in_situ_resultados.trim() !== '')
                              ? formData.umidade_in_situ_resultados.split('|').map(s => s.trim())
                              : [];

                          const calculateVU = (idx) => {
                            const uOtima = parseFloat(uOtimaResultados[idx]);
                            const uInSitu = parseFloat(uisResultados[idx]);
                            if (isNaN(uOtima) || isNaN(uInSitu)) return null;
                            return (uInSitu - uOtima).toFixed(2);
                          };

                          const vuResultados = Array.from({ length: vuQtde }).map((_, idx) => calculateVU(idx));
                          const setVU = (patch) => setFormData(prev => ({ ...prev, ensaios_empreiteira: { ...prev.ensaios_empreiteira, ...patch } }));
                          return (
                            <tr>
                              <td className="border border-slate-300 px-2 py-2 bg-slate-50">Variação de Umidade (%)</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                              <td className="border border-slate-300 px-1 py-1">
                                <Input type="number" min="0" max="3" value={vuQtde}
                                  onChange={(e) => {
                                    const n = Math.max(0, Math.min(3, parseInt(e.target.value) || 0));
                                    setVU({ variacao_umidade_quantidade: n, variacao_umidade_resultados: [] });
                                  }}
                                  className="h-8 text-sm text-center" placeholder="" />
                              </td>
                              <td className="border border-slate-300 px-1 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {Array.from({ length: vuQtde }).map((_, idx) => (
                                    <div key={idx} className="h-8 flex items-center px-2 bg-slate-100 rounded border border-slate-300 text-sm text-center font-medium"
                                      style={{ width: vuQtde > 1 ? '90px' : '100%' }}>
                                      {vuResultados[idx] ?? '-'}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                <input type="checkbox" checked={formData.ensaios_empreiteira.variacao_umidade_conforme === true}
                                  onChange={(e) => setVU({ variacao_umidade_conforme: e.target.checked ? true : null })}
                                  className="w-4 h-4 accent-green-500" />
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                <input type="checkbox" checked={formData.ensaios_empreiteira.variacao_umidade_conforme === false}
                                  onChange={(e) => setVU({ variacao_umidade_conforme: e.target.checked ? false : null })}
                                  className="w-4 h-4 accent-red-500" />
                              </td>
                            </tr>
                          );
                        })()}

                        {/* Grau de Compactação — Calculado automaticamente por R */}
                        {(() => {
                           const gcQtde = formData.ensaios_empreiteira.grau_compactacao_quantidade;
                           const proctorResultados = Array.isArray(formData.ensaios_empreiteira.compactacao_proctor?.resultados)
                             ? formData.ensaios_empreiteira.compactacao_proctor.resultados
                             : (typeof formData.ensaios_empreiteira.compactacao_proctor?.resultados === 'string' && formData.ensaios_empreiteira.compactacao_proctor.resultados.trim() !== '')
                               ? formData.ensaios_empreiteira.compactacao_proctor.resultados.split('|').map(s => s.trim())
                               : [];
                           const inSituResultados = Array.isArray(formData.ensaios_empreiteira.massa_especifica_in_situ?.resultados)
                             ? formData.ensaios_empreiteira.massa_especifica_in_situ.resultados
                             : (typeof formData.ensaios_empreiteira.massa_especifica_in_situ?.resultados === 'string' && formData.ensaios_empreiteira.massa_especifica_in_situ.resultados.trim() !== '')
                               ? formData.ensaios_empreiteira.massa_especifica_in_situ.resultados.split('|').map(s => s.trim())
                               : [];

                           const calculateGC = (idx) => {
                             const proctor = parseFloat(proctorResultados[idx]);
                             const inSitu = parseFloat(inSituResultados[idx]);
                             if (isNaN(proctor) || isNaN(inSitu) || proctor === 0) return null;
                             return ((inSitu / proctor) * 100).toFixed(2);
                           };

                           const gcResultados = Array.from({ length: gcQtde }).map((_, idx) => calculateGC(idx));
                           const setGC = (patch) => setFormData(prev => ({ ...prev, ensaios_empreiteira: { ...prev.ensaios_empreiteira, ...patch } }));
                           return (
                             <tr>
                               <td className="border border-slate-300 px-2 py-2 bg-slate-50">Grau de Compactação (%)</td>
                               <td className="border border-slate-300 px-2 py-1 text-center">-</td>
                               <td className="border border-slate-300 px-1 py-1">
                                 <Input type="number" min="0" max="3" value={gcQtde}
                                   onChange={(e) => {
                                     const n = Math.max(0, Math.min(3, parseInt(e.target.value) || 0));
                                     setGC({ grau_compactacao_quantidade: n, grau_compactacao_resultados: [] });
                                   }}
                                   className="h-8 text-sm text-center" placeholder="" />
                               </td>
                               <td className="border border-slate-300 px-1 py-2">
                                 <div className="flex flex-wrap gap-1">
                                   {Array.from({ length: gcQtde }).map((_, idx) => (
                                     <div key={idx} className="h-8 flex items-center px-2 bg-slate-100 rounded border border-slate-300 text-sm text-center font-medium"
                                       style={{ width: gcQtde > 1 ? '90px' : '100%' }}>
                                       {gcResultados[idx] ?? '-'}
                                     </div>
                                   ))}
                                 </div>
                               </td>
                               <td className="border border-slate-300 px-2 py-1 text-center">
                                 <input type="checkbox" checked={formData.ensaios_empreiteira.grau_compactacao_conforme === true}
                                   onChange={(e) => setGC({ grau_compactacao_conforme: e.target.checked ? true : null })}
                                   className="w-4 h-4 accent-green-500" />
                               </td>
                               <td className="border border-slate-300 px-2 py-1 text-center">
                                 <input type="checkbox" checked={formData.ensaios_empreiteira.grau_compactacao_conforme === false}
                                   onChange={(e) => setGC({ grau_compactacao_conforme: e.target.checked ? false : null })}
                                   className="w-4 h-4 accent-red-500" />
                               </td>
                             </tr>
                           );
                        })()}
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
                onAcoesRealizadasChange={(value) => setFormData(prev => ({ ...prev, acoes_corretivas_realizado: value, acoes_corretivas_descricao: value === false ? "" : prev.acoes_corretivas_descricao }))}
                onAcoesDescricaoChange={(value) => setFormData(prev => ({ ...prev, acoes_corretivas_descricao: value }))}
                onNaoConformidadesChange={(ncs) => setFormData(prev => ({ ...prev, nao_conformidades: ncs }))}
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