import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, AlertTriangle, Loader2, XCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { ChecklistUsina as ChecklistUsinaEntity } from "@/entities/ChecklistUsina";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User";
import { Project } from "@/entities/Project";
import { FaixaGranulometrica } from "@/entities/FaixaGranulometrica";
import { UploadFile } from "@/integrations/Core";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFormPersistence } from "@/components/hooks/useFormPersistence";
import { useGestoresRegional } from "@/components/hooks/useGestoresRegional";

const getInitialFormData = () => ({
  obra_id: "",
  project_id: "",
  data: new Date().toISOString().split('T')[0],
  usina: "",
  projeto_utilizado: "",
  faixa_especificada: "",
  ligante: "",
  pedreira: "",
  inspetor_campo: "",
  engenheiro_responsavel: "",
  controle_agregados: [],
  equivalente_areia_status: null,
  equivalente_areia_quantidade: 0,
  equivalente_areia_resultados: [],
  observacoes_agregados: "",
  rodadas_producao: [
    {
      numero_rodada: 1,
      horario_inicio: "",
      horario_termino: "",
      temperatura_ambiente: null,
      condicoes_climaticas: "bom",
      quantidade_produzida: null,
      controle_cargas_sim: false,
      controle_cargas_qtde: 0,
      caminhoes_enlonados: false,
      temperatura_massa_t1: null,
      temperatura_massa_t2: null
    }
  ],
  controle_cauq: {
    extracao_ligante_rotarex: { realizado: false, quantidade: 0, resultados: [], conforme: null },
    extracao_ligante_soxhlet: { realizado: false, quantidade: 0, resultados: [], conforme: null },
    granulometria: { realizado: false, quantidade: 0, resultados: [], conforme: null },
    densidade_rice: { realizado: false, quantidade: 0, resultados: [] },
    densidade_aparente: { realizado: false, quantidade: 0, resultados: [] },
    volume_vazios: { realizado: false, quantidade: 0, resultados: [], conforme: null },
    rbv: { realizado: false, quantidade: 0, resultados: [], conforme: null },
    rtcd_25c: { realizado: false, quantidade: 0, resultados: [], conforme: null },
    estabilidade: { realizado: false, quantidade: 0, resultados: [], conforme: null },
    fluencia: { realizado: false, quantidade: 0, resultados: [], conforme: null }
  },
  observacoes: "",
  fotos: [],
  status: "rascunho",
  approved: null,
  rejection_reason: null
});

export default function ChecklistUsinaPage() {
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(getInitialFormData());
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");
  const [uploadProgress, setUploadProgress] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const { clearSavedData } = useFormPersistence('checklist_usina', formData, setFormData, !!editingChecklist);

  const selectedProject = useMemo(() =>
    projects.find(p => p.id === formData.project_id),
    [projects, formData.project_id]
  );
  
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const { gestores } = useGestoresRegional(formData.obra_id, obras, allUsers);

  const handleObraChange = useCallback((obraId) => {
    setFormData(prev => ({
      ...prev,
      obra_id: obraId,
      project_id: "", // Reset project on obra change
      engenheiro_responsavel: "", // Reset engineer on obra change
    }));
  }, []);

  const checkConformidadeAutomatica = useCallback((testKey, resultado, project) => {
    if (!project || resultado === null || resultado === undefined || resultado === '') return null;

    // Granulometria sempre manual
    if (testKey === 'granulometria') return null;

    const num = parseFloat(resultado);
    if (isNaN(num)) return null;

    // Verificar conformidade baseada nos limites do projeto
    switch (testKey) {
      case 'extracao_ligante_rotarex':
      case 'extracao_ligante_soxhlet':
        if (project.teor_ligante && project.teor_ligante.min !== null && project.teor_ligante.max !== null) {
          return num >= project.teor_ligante.min && num <= project.teor_ligante.max;
        }
        break;
      
      case 'volume_vazios':
        if (project.volume_vazios && project.volume_vazios.min !== null && project.volume_vazios.max !== null) {
          return num >= project.volume_vazios.min && num <= project.volume_vazios.max;
        }
        break;
      
      case 'rbv':
        if (project.rbv && project.rbv.min !== null && project.rbv.max !== null) {
          return num >= project.rbv.min && num <= project.rbv.max;
        }
        break;
      
      case 'rtcd_25c':
        if (project.rtcd && project.rtcd.min !== null) {
          return num > project.rtcd.min;
        }
        break;
      
      case 'estabilidade':
        if (project.estabilidade && project.estabilidade.min !== null) {
          return num > project.estabilidade.min;
        }
        break;
      
      case 'fluencia':
        if (project.fluencia && project.fluencia.min !== null && project.fluencia.max !== null) {
          return num >= project.fluencia.min && num <= project.fluencia.max;
        }
        break;
    }

    return null;
  }, []);

  const validateDecimalInput = useCallback((value, maxDecimals) => {
    // Permitir vazio
    if (value === '') return true;
    
    // Regex para validar número com casas decimais específicas
    let regex;
    switch (maxDecimals) {
      case 0:
        regex = /^\d+$/; // Apenas números inteiros
        break;
      case 1:
        regex = /^\d*\.?\d{0,1}$/; // até 1 casa decimal
        break;
      case 2:
        regex = /^\d*\.?\d{0,2}$/; // até 2 casas decimais
        break;
      case 3:
        regex = /^\d*\.?\d{0,3}$/; // até 3 casas decimais
        break;
      default:
        regex = /^\d*\.?\d*$/; // qualquer número de casas decimais
    }
    
    return regex.test(value);
  }, []);

  const handleNestedChange = useCallback((path, value, maxDecimals = null) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');

      if (keys[0] === 'controle_cauq') {
        const testKey = keys[1];
        const testObject = newData.controle_cauq[testKey];

        if (!Array.isArray(testObject.resultados)) {
          testObject.resultados = [];
        }

        if (keys[2] === 'resultados' && keys.length === 4) {
          const resultIndex = parseInt(keys[3]);
          
          while (testObject.resultados.length <= resultIndex) {
            testObject.resultados.push(null);
          }
          
          const novosResultados = [...testObject.resultados];
          
          // Fluência deve ser string, outros são números
          let parsedValue;
          if (testKey === 'fluencia') {
            // Para fluência, validar 1 casa decimal se o valor não for vazio
            if (value !== '' && !validateDecimalInput(value, 1)) {
              return prev; // Não atualizar se inválido
            }
            parsedValue = value !== '' ? String(value) : null;
          } else {
            // Para outros campos numéricos, validar casas decimais
            if (value !== '' && maxDecimals !== null && !validateDecimalInput(value, maxDecimals)) {
              return prev; // Não atualizar se inválido
            }
            parsedValue = value !== '' ? parseFloat(value) : null;
            if (parsedValue !== null && parsedValue < 0) {
              return prev;
            }
          }
          
          novosResultados[resultIndex] = parsedValue;
          testObject.resultados = novosResultados;

          // Conformidade automática apenas se quantidade = 1 e não é granulometria
          if (testObject.quantidade === 1 && testObject.hasOwnProperty('conforme') && testKey !== 'granulometria') {
            const conformidade = checkConformidadeAutomatica(testKey, parsedValue, selectedProject);
            if (conformidade !== null) {
              testObject.conforme = conformidade;
            } else {
              testObject.conforme = null;
            }
          }

        } else if (keys[2] === 'realizado') {
          testObject.realizado = value;
          if (!value) {
            testObject.quantidade = 0;
            testObject.resultados = [];
            if (testObject.hasOwnProperty('conforme')) {
              testObject.conforme = null;
            }
          }
        } else if (keys[2] === 'quantidade') {
          const newQuantity = Math.min(parseInt(value) || 0, 3);
          const oldQuantity = testObject.quantidade || 0;
          testObject.quantidade = newQuantity;
          
          const currentLength = testObject.resultados.length;
          
          if (newQuantity > currentLength) {
            testObject.resultados = [
              ...testObject.resultados,
              ...Array(newQuantity - currentLength).fill(null)
            ];
          } else if (newQuantity < currentLength) {
            testObject.resultados = testObject.resultados.slice(0, newQuantity);
          }

          // Se mudar de 1 para mais de 1, resetar conformidade para manual
          if (oldQuantity === 1 && newQuantity > 1 && testObject.hasOwnProperty('conforme')) {
            testObject.conforme = null;
          }

          if (newQuantity === 0 && testObject.hasOwnProperty('conforme')) {
            testObject.conforme = null;
          }

          // Se quantidade é 1 e já existe resultado, re-avaliar conformidade
          if (newQuantity === 1 && testObject.hasOwnProperty('conforme') && testObject.resultados.length > 0 && testKey !== 'granulometria') {
            const conformidade = checkConformidadeAutomatica(testKey, testObject.resultados[0], selectedProject);
            if (conformidade !== null) {
              testObject.conforme = conformidade;
            } else {
              testObject.conforme = null;
            }
          }

        } else if (keys[2] === 'conforme') {
          // Permitir alteração manual apenas se quantidade != 1 ou se for granulometria
          if (testObject.quantidade !== 1 || testKey === 'granulometria') {
            testObject.conforme = value;
          }
        }
      } else {
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      }

      return newData;
    });
  }, [checkConformidadeAutomatica, selectedProject, validateDecimalInput]);
  
  const handleAgregadoChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newAgregados = [...prev.controle_agregados];
      newAgregados[index] = { ...newAgregados[index], [field]: value };
      return { ...prev, controle_agregados: newAgregados };
    });
  }, []);

  const handleProjectChange = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      setFormData(prev => ({...prev, project_id: ""}));
      return;
    }

    // Find the FaixaGranulometrica by its ID
    const faixa = faixas.find(f => f.id === project.faixa_granulometrica_id);

    const pedreiras = project.agregados && Array.isArray(project.agregados)
      ? [...new Set(project.agregados.map(ag => ag.pedreira).filter(Boolean))].join(' + ')
      : "";

    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      // Use the name of the found FaixaGranulometrica, or "Não definida"
      faixa_especificada: faixa ? faixa.nome : "Não definida",
      ligante: project.ligante?.tipo || "",
      pedreira: pedreiras,
      controle_agregados: (project.agregados || []).map(ag => ({
        nome: ag.nome,
        estoque_coberto: false,
        estoque_coberto_qtde: 0,
        material_homogeneizado: false,
        material_homogeneizado_qtde: 0,
        granulometria_individual: false,
        granulometria_individual_qtde: 0
      }))
    }));
  }, [projects, faixas]);

  const handleRodadaChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newRodadas = [...prev.rodadas_producao];
      newRodadas[index] = { ...newRodadas[index], [field]: value };
      return { ...prev, rodadas_producao: newRodadas };
    });
  }, []);

  const adicionarRodada = useCallback(() => {
    if (formData.rodadas_producao.length < 4) {
      setFormData(prev => ({
        ...prev,
        rodadas_producao: [...prev.rodadas_producao, {
          numero_rodada: prev.rodadas_producao.length + 1,
          horario_inicio: "",
          horario_termino: "",
          temperatura_ambiente: null,
          condicoes_climaticas: "bom",
          quantidade_produzida: null,
          controle_cargas_sim: false,
          controle_cargas_qtde: 0,
          caminhoes_enlonados: false,
          temperatura_massa_t1: null,
          temperatura_massa_t2: null
        }]
      }));
    }
  }, [formData.rodadas_producao.length]);

  const removerRodada = useCallback((index) => {
    if (formData.rodadas_producao.length > 1) {
      setFormData(prev => ({
        ...prev,
        rodadas_producao: prev.rodadas_producao.filter((_, i) => i !== index)
      }));
    }
  }, [formData.rodadas_producao.length]);

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

    setLoadingUpload(true);
    setSelectedFileNames(files.length === 1 ? files[0].name : `${files.length} ficheiros selecionados`);
    setUploadProgress(files.map((file, index) => ({ id: `${file.name}-${index}`, fileName: file.name, status: 'pending', error: null })));

    try {
      const uploadedUrls = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentFileId = `${file.name}-${i}`;

        try {
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'uploading' } : p)
          );

          const result = await UploadFile({ file });
          uploadedUrls.push(result.file_url);
          
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'success' } : p)
          );
        } catch (error) {
          errors.push({ fileName: file.name, error: error.message });
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'error', error: error.message } : p)
          );
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          fotos: [...(prev.fotos || []), ...uploadedUrls],
        }));
      }

      if (errors.length > 0) {
        alert(`${uploadedUrls.length} de ${files.length} arquivos enviados.\n\nErros:\n` +
          errors.map(e => `• ${e.fileName}: ${e.error}`).join('\n'));
      }
    } catch (error) {
      alert(`Erro geral no upload: ${error.message}`);
    } finally {
      setLoadingUpload(false);
      setUploadProgress([]);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = useCallback((indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const handleEquivalenteAreiaAddResultado = useCallback(() => {
    if ((formData.equivalente_areia_resultados?.length || 0) < 3) {
      setFormData(prev => ({
        ...prev,
        equivalente_areia_resultados: [...(prev.equivalente_areia_resultados || []), null],
        equivalente_areia_quantidade: (prev.equivalente_areia_resultados?.length || 0) + 1
      }));
    }
  }, [formData.equivalente_areia_resultados]);

  const handleEquivalenteAreiaRemoveResultado = useCallback((index) => {
    setFormData(prev => {
      const novosResultados = prev.equivalente_areia_resultados.filter((_, i) => i !== index);
      return {
        ...prev,
        equivalente_areia_resultados: novosResultados,
        equivalente_areia_quantidade: novosResultados.length
      };
    });
  }, []);

  const handleEquivalenteAreiaResultadoChange = useCallback((index, valor) => {
    setFormData(prev => {
      const novosResultados = [...(prev.equivalente_areia_resultados || [])];
      let parsedValue = valor ? parseFloat(valor) : null;
      if (parsedValue !== null && parsedValue < 0) {
        return prev; // Do not update if negative
      }
      novosResultados[index] = parsedValue;
      return {
        ...prev,
        equivalente_areia_resultados: novosResultados
      };
    });
  }, []);

  const handleSubmit = async (e, saveStatus = 'finalizado') => {
    e.preventDefault();
    
    // Validações obrigatórias apenas quando finalizando
    if (saveStatus === 'finalizado') {
      if (!formData.obra_id || !formData.usina || !formData.engenheiro_responsavel) {
        alert("Por favor, preencha a obra, a usina e selecione o engenheiro responsável.");
        return;
      }
    } else {
      // Para salvar progresso, apenas obra é obrigatória
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        return;
      }
    }

    const dataToSave = {
      ...formData,
      status: saveStatus
    };

    try {
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
        
        await ChecklistUsinaEntity.update(editingChecklist.id, updateData);
        alert(successMessage);
      } else {
        await ChecklistUsinaEntity.create({ ...dataToSave, laboratorista_name: user?.laboratorista_name || user?.full_name });
        alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Checklist criado com sucesso!");
      }
      clearSavedData();
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      alert("Erro ao salvar checklist.");
    }
  };

  const obraSelecionada = useMemo(() => obras.find(o => o.id === formData.obra_id), [obras, formData.obra_id]);
  const regionalSelecionada = useMemo(() => obraSelecionada ? regionais.find(r => r.id === obraSelecionada.regional_id) : null, [obraSelecionada, regionais]);
  const projetosDisponiveis = useMemo(() => {
    if (!regionalSelecionada || !projects) return [];
    const regionalProjectIds = regionalSelecionada.project_ids || [];
    return projects.filter(p => 
      regionalProjectIds.includes(p.id) && 
      p.status === 'ativo' &&
      p.tipo_projeto === 'CAUQ'
    );
  }, [regionalSelecionada, projects]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const currentUserAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');
        const isAdmin = currentUserAccessLevel === 'admin';

        // Carregar dados em paralelo - Obra, Regional, Project são essenciais
        const dataPromises = [
          Obra.list(),
          Regional.list(),
          Project.list()
        ];

        // Tentar carregar FaixaGranulometrica separadamente com tratamento de erro
        let faixasData = [];
        try {
          faixasData = await FaixaGranulometrica.list();
        } catch (faixasError) {
          console.warn("Erro ao carregar faixas granulométricas, continuando sem elas:", faixasError);
          // Continuar sem as faixas - não é crítico para o funcionamento
        }

        // Tentar carregar usuários - se falhar por permissões, continuar sem eles
        let allUsersData = [];
        try {
          allUsersData = await User.list();
        } catch (usersError) {
          console.warn("⚠️ Sem permissão para listar usuários, continuando sem eles:", usersError.message);
          // Laboratoristas não têm permissão, mas o hook useGestoresRegional carregará os gestores quando necessário
          allUsersData = [];
        }

        const [obrasData, regionaisData, projectsData] = await Promise.all(dataPromises);
        
        setRegionais(regionaisData);
        setProjects(projectsData);
        setFaixas(faixasData);
        setAllUsers(allUsersData);

        let availableObras = obrasData;
        
        if (currentUserAccessLevel === 'user') {
          const regionalDoLaboratorista = regionaisData.find(regional => {
            const laboratoristas = regional.laboratoristas_responsaveis || [];
            return laboratoristas.some(email => email.toLowerCase() === userData.email.toLowerCase());
          });
          
          if (regionalDoLaboratorista) {
            availableObras = obrasData.filter(obra => 
              obra.regional_id === regionalDoLaboratorista.id &&
              obra.status === 'em_andamento'
            );
          } else {
            availableObras = [];
          }
        }
        setObras(availableObras);

        const params = new URLSearchParams(location.search);
        const editId = params.get('editId');
        
        if (editId) {
          const checklistToEdit = await ChecklistUsinaEntity.get(editId); // Corrected entity name
          setEditingChecklist(checklistToEdit);

          if (userData.role === 'admin' || (checklistToEdit.created_by === userData.email && (checklistToEdit.status === 'rascunho' || checklistToEdit.approved === false))) {
            const initialForm = getInitialFormData();
            let loadedFormData = {
              ...initialForm,
              ...checklistToEdit,
              data: checklistToEdit.data ? new Date(checklistToEdit.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              fotos: Array.isArray(checklistToEdit.fotos) ? checklistToEdit.fotos : [],
              controle_agregados: Array.isArray(checklistToEdit.controle_agregados) ? checklistToEdit.controle_agregados : [],
              controle_cauq: { // Initialize with initial form's cauq structure
                ...initialForm.controle_cauq
              }
            };

            // Processar controle_cauq com segurança
            if (checklistToEdit.controle_cauq && typeof checklistToEdit.controle_cauq === 'object') {
              Object.keys(initialForm.controle_cauq).forEach(testKey => {
                const existingTest = checklistToEdit.controle_cauq[testKey];
                const initialTest = initialForm.controle_cauq[testKey];

                // Ensure the test object in loadedFormData starts with initial structure
                loadedFormData.controle_cauq[testKey] = { ...initialTest };

                if (existingTest && typeof existingTest === 'object') {
                  // Copy basic properties from existing, overwriting initial ones
                  // This will correctly load existing 'conforme: false' or 'conforme: true' or 'conforme: null'
                  Object.assign(loadedFormData.controle_cauq[testKey], existingTest);

                  // CRÍTICO: Garantir que resultados seja SEMPRE um array
                  if (existingTest.hasOwnProperty('resultado') && !Array.isArray(existingTest.resultados)) {
                    // Converter resultado único legado para array
                    const resultadoLegado = existingTest.resultado;
                    if (resultadoLegado !== null && resultadoLegado !== undefined && resultadoLegado !== '') {
                      loadedFormData.controle_cauq[testKey].resultados = [resultadoLegado];
                      loadedFormData.controle_cauq[testKey].quantidade = 1;
                    } else {
                      loadedFormData.controle_cauq[testKey].resultados = [];
                      loadedFormData.controle_cauq[testKey].quantidade = 0;
                    }
                  } else if (Array.isArray(existingTest.resultados)) {
                    // Já é array, usar como está (create a new array to prevent direct mutation)
                    loadedFormData.controle_cauq[testKey].resultados = [...existingTest.resultados];
                    loadedFormData.controle_cauq[testKey].quantidade = existingTest.resultados.length;
                  } else if (existingTest.resultados !== null && existingTest.resultados !== undefined && existingTest.resultados !== '') {
                    // resultados existe mas não é array, converter
                    loadedFormData.controle_cauq[testKey].resultados = [existingTest.resultados];
                    loadedFormData.controle_cauq[testKey].quantidade = 1;
                  } else {
                    // Sem resultados, inicializar array vazio, but respect existing quantity if available
                    loadedFormData.controle_cauq[testKey].resultados = [];
                    loadedFormData.controle_cauq[testKey].quantidade = existingTest.quantidade || 0;
                  }
                  
                  // Limpar campo legado
                  delete loadedFormData.controle_cauq[testKey].resultado;
                } else {
                    // If existingTest is not an object or null/undefined, ensure default empty array for results and quantity 0
                    // This is largely covered by { ...initialTest } but explicitly setting it again for clarity if initialTest itself was problematic
                    if (!loadedFormData.controle_cauq[testKey].resultados) {
                        loadedFormData.controle_cauq[testKey].resultados = [];
                    }
                    if (!loadedFormData.controle_cauq[testKey].quantidade) {
                        loadedFormData.controle_cauq[testKey].quantidade = 0;
                    }
                }
              });
            }

            // Modernizar equivalente_areia
            let equivalenteAreiaStatus = checklistToEdit.equivalente_areia_status || null;
            let equivalenteAreiaResultados = Array.isArray(checklistToEdit.equivalente_areia_resultados) ? checklistToEdit.equivalente_areia_resultados : [];

            if (checklistToEdit.hasOwnProperty('equivalente_areia_realizado') && equivalenteAreiaStatus === null) {
                equivalenteAreiaStatus = checklistToEdit.equivalente_areia_realizado ? 'realizado' : 'nao_realizado';
                if (equivalenteAreiaStatus === 'realizado' && equivalenteAreiaResultados.length === 0) {
                    if (checklistToEdit.hasOwnProperty('equivalente_areia_quantidade') && checklistToEdit.equivalente_areia_quantidade > 0) {
                        equivalenteAreiaResultados = Array(checklistToEdit.equivalente_areia_quantidade).fill(null);
                    }
                }
            }

            if (equivalenteAreiaStatus !== 'realizado') {
                equivalenteAreiaResultados = [];
            }

            loadedFormData.equivalente_areia_status = equivalenteAreiaStatus;
            loadedFormData.equivalente_areia_resultados = equivalenteAreiaResultados;
            loadedFormData.equivalente_areia_quantidade = equivalenteAreiaResultados.length;

            setFormData(loadedFormData);
          } else {
            alert("Você não tem permissão para editar este registro.");
            navigate(createPageUrl('MeusEnsaios'));
            return;
          }
        } else {
          const initialNewFormData = getInitialFormData();
          initialNewFormData.inspetor_campo = userData.laboratorista_name || userData.full_name;
          if (availableObras.length > 0) {
            initialNewFormData.obra_id = availableObras[0].id;
          }
          setFormData(initialNewFormData);
          setEditingChecklist(null);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Não foi possível carregar os dados. Erro: " + (error.message || error));
        navigate(createPageUrl('MeusEnsaios'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.search, navigate]);
  


  const isApproved = formData.approved === true;
  const userCanEdit = user?.role === 'admin' || (formData.created_by === user?.email && (formData.status === 'rascunho' || formData.approved === false));
  const isEditable = !editingChecklist?.id || userCanEdit;

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingChecklist?.id ? "Editar Checklist de Usina" : "Novo Checklist de Usina"}</CardTitle>
            <CardDescription>
              {editingChecklist?.id ? `Editando checklist de ${new Date(editingChecklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : "Controle tecnológico de usinagem - DNIT 031/2024"}
            </CardDescription>
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
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
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
            }} className="space-y-6">
              {/* DADOS DA OBRA */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Dados da Obra e Projeto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="obra_id">Obra *</Label>
                      <select
                        id="obra_id"
                        value={formData.obra_id}
                        onChange={(e) => handleObraChange(e.target.value)}
                        required
                        disabled={!isEditable || isApproved || editingChecklist?.id}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione a obra</option>
                        {obras.map(obra => {
                          const regional = regionais.find(r => r.id === obra.regional_id);
                          return (
                            <option key={obra.id} value={obra.id}>
                              {obra.name} - {obra.code} {regional && `(${regional.nome})`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="project_id">Projeto Vinculado</Label>
                      <select
                        id="project_id"
                        value={formData.project_id}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        disabled={!isEditable || isApproved || !formData.obra_id}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione um projeto</option>
                        {projetosDisponiveis.map(proj => (
                          <option key={proj.id} value={proj.id}>
                            {proj.name}
                          </option>
                        ))}
                      </select>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="data">Data *</Label>
                      <Input
                        id="data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => handleChange('data', e.target.value)}
                        required
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label htmlFor="usina">Usina *</Label>
                      <Input
                        id="usina"
                        value={formData.usina}
                        onChange={(e) => handleChange('usina', e.target.value)}
                        required
                        disabled={!isEditable || isApproved}
                        placeholder="Nome da usina"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pedreira">Pedreira</Label>
                      <Input
                        id="pedreira"
                        value={formData.pedreira}
                        onChange={(e) => handleChange('pedreira', e.target.value)}
                        disabled={!isEditable || isApproved}
                        readOnly={!!selectedProject}
                        className={selectedProject ? "bg-slate-100" : ""}
                        placeholder="Nome da pedreira"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="faixa_especificada">Faixa Especificada</Label>
                      <Input
                        id="faixa_especificada"
                        value={formData.faixa_especificada}
                        onChange={(e) => handleChange('faixa_especificada', e.target.value)}
                        disabled={!isEditable || isApproved}
                        readOnly={true}
                        className="bg-slate-100"
                      />
                    </div>
                     <div>
                      <Label htmlFor="ligante">Ligante Asfáltico</Label>
                      <Input
                        id="ligante"
                        value={formData.ligante}
                        onChange={(e) => handleChange('ligante', e.target.value)}
                        disabled={!isEditable || isApproved}
                        readOnly={!!selectedProject}
                        className={selectedProject ? "bg-slate-100" : ""}
                        placeholder="Ex: CAP 50/70"
                      />
                    </div>
                    <div>
                      <Label htmlFor="engenheiro_responsavel">Engenheiro Responsável *</Label>
                      <select
                        id="engenheiro_responsavel"
                        value={formData.engenheiro_responsavel}
                        onChange={(e) => handleChange('engenheiro_responsavel', e.target.value)}
                        required
                        disabled={!isEditable || isApproved || !formData.obra_id}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione um gestor</option>
                        {gestores.map(gestor => (
                          <option key={gestor.email} value={gestor.laboratorista_name || gestor.full_name}>
                            {gestor.laboratorista_name || gestor.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CONTROLE DE AGREGADOS */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Controle de Agregados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2 py-2 text-sm font-medium text-left">Agregado</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm font-medium text-center">Estoque Coberto?</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm font-medium text-center">Material Homogeneizado?</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm font-medium text-center">Granulometria Individual?</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm font-medium text-center">Qtde Granulometria</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.controle_agregados.length > 0 ? formData.controle_agregados.map((agregado, index) => (
                          <tr key={index}>
                            <td className="border border-slate-300 px-2 py-2 font-medium bg-slate-50">
                              {agregado.nome}
                            </td>
                            <td className="border border-slate-300 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={agregado.estoque_coberto}
                                onChange={(e) => handleAgregadoChange(index, 'estoque_coberto', e.target.checked)}
                                disabled={!isEditable || isApproved}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="border border-slate-300 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={agregado.material_homogeneizado}
                                onChange={(e) => handleAgregadoChange(index, 'material_homogeneizado', e.target.checked)}
                                disabled={!isEditable || isApproved}
                                className="w-4 h-4"
                              />
                            </td>
                             <td className="border border-slate-300 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={agregado.granulometria_individual}
                                onChange={(e) => handleAgregadoChange(index, 'granulometria_individual', e.target.checked)}
                                disabled={!isEditable || isApproved}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="border border-slate-300 px-1 py-1 w-28">
                                <Input
                                  type="number"
                                  min="0" // Added min="0"
                                  value={agregado.granulometria_individual_qtde || ''}
                                  onChange={(e) => handleAgregadoChange(index, 'granulometria_individual_qtde', e.target.value ? parseInt(e.target.value) : 0)}
                                  disabled={!isEditable || isApproved}
                                  className="h-8 text-sm"
                                  placeholder="Qtde"
                                />
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-slate-500 italic">
                              {formData.project_id ? 'Nenhum agregado cadastrado neste projeto.' : 'Selecione um projeto para carregar os agregados.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Equivalent Sand Section with Dynamic Add */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Equivalente de Areia Realizado?</Label>
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="equivalente_areia_sim"
                            checked={formData.equivalente_areia_status === 'realizado'}
                            onChange={() => {
                              if (formData.equivalente_areia_status === 'realizado') {
                                handleChange('equivalente_areia_status', null);
                                setFormData(prev => ({
                                  ...prev,
                                  equivalente_areia_quantidade: 0,
                                  equivalente_areia_resultados: []
                                }));
                              } else {
                                handleChange('equivalente_areia_status', 'realizado');
                              }
                            }}
                            disabled={!isEditable || isApproved}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="equivalente_areia_sim" className="text-sm font-normal">Sim</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="equivalente_areia_nao"
                            checked={formData.equivalente_areia_status === 'nao_realizado'}
                            onChange={() => {
                              if (formData.equivalente_areia_status === 'nao_realizado') {
                                handleChange('equivalente_areia_status', null);
                              } else {
                                handleChange('equivalente_areia_status', 'nao_realizado');
                                setFormData(prev => ({
                                  ...prev,
                                  equivalente_areia_quantidade: 0,
                                  equivalente_areia_resultados: []
                                }));
                              }
                            }}
                            disabled={!isEditable || isApproved}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="equivalente_areia_nao" className="text-sm font-normal">Não</Label>
                        </div>
                      </div>

                      {formData.equivalente_areia_status === 'realizado' && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Resultados dos Ensaios (%)</Label>
                            {(formData.equivalente_areia_resultados?.length || 0) < 3 && isEditable && !isApproved && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleEquivalenteAreiaAddResultado}
                                className="h-8"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar Ensaio
                              </Button>
                            )}
                          </div>

                          {formData.equivalente_areia_resultados && formData.equivalente_areia_resultados.length > 0 ? (
                            <div className="space-y-2">
                              {formData.equivalente_areia_resultados.map((resultado, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Label className="text-xs text-slate-600 w-20 shrink-0">
                                    Ensaio {index + 1}:
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0" // Added min="0"
                                    max="100"
                                    value={resultado ?? ''}
                                    onChange={(e) => handleEquivalenteAreiaResultadoChange(index, e.target.value)}
                                    disabled={!isEditable || isApproved}
                                    placeholder={`Resultado ${index + 1}`}
                                    className="flex-1"
                                  />
                                  {isEditable && !isApproved && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEquivalenteAreiaRemoveResultado(index)}
                                      className="h-9 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">
                              Clique em "Adicionar Ensaio" para registrar os resultados (máximo 3)
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="obs_agregados">Observações dos Agregados</Label>
                      <Textarea
                        id="obs_agregados"
                        value={formData.observacoes_agregados}
                        onChange={(e) => handleChange('observacoes_agregados', e.target.value)}
                        disabled={!isEditable || isApproved}
                        rows={2}
                        maxLength="500"
                      />
                      <p className="text-xs text-right text-slate-500 mt-1">
                        {formData.observacoes_agregados?.length || 0} / 500
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* RODADAS DE PRODUÇÃO */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Acompanhamento da Produção</CardTitle>
                    {isEditable && !isApproved && formData.rodadas_producao.length < 4 && (
                      <Button type="button" onClick={adicionarRodada} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Rodada
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.rodadas_producao.map((rodada, index) => (
                    <Card key={index} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Rodada {rodada.numero_rodada}</CardTitle>
                          {isEditable && !isApproved && formData.rodadas_producao.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerRodada(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Horário Início</Label>
                          <Input
                            type="time"
                            value={rodada.horario_inicio}
                            onChange={(e) => handleRodadaChange(index, 'horario_inicio', e.target.value)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Horário Término</Label>
                          <Input
                            type="time"
                            value={rodada.horario_termino}
                            onChange={(e) => handleRodadaChange(index, 'horario_termino', e.target.value)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Temperatura Ambiente (°C)</Label>
                          <Input
                            type="number"
                            value={rodada.temperatura_ambiente || ''}
                            onChange={(e) => handleRodadaChange(index, 'temperatura_ambiente', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Condições Climáticas</Label>
                          <select
                            value={rodada.condicoes_climaticas}
                            onChange={(e) => handleRodadaChange(index, 'condicoes_climaticas', e.target.value)}
                            disabled={!isEditable || isApproved}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="bom">Bom</option>
                            <option value="instavel">Instável</option>
                            <option value="chuva">Chuva</option>
                          </select>
                        </div>

                        <div>
                          <Label>Quantidade Produzida (t)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rodada.quantidade_produzida || ''}
                            onChange={(e) => handleRodadaChange(index, 'quantidade_produzida', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Controle de Cargas (Qtde)</Label>
                          <Input
                            type="number"
                            min="0" // Added min="0"
                            value={rodada.controle_cargas_qtde || ''}
                            onChange={(e) => handleRodadaChange(index, 'controle_cargas_qtde', e.target.value ? parseInt(e.target.value) : 0)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Temperatura Massa T1 (°C)</Label>
                          <Input
                            type="number"
                            value={rodada.temperatura_massa_t1 || ''}
                            onChange={(e) => handleRodadaChange(index, 'temperatura_massa_t1', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Temperatura Massa T2 (°C)</Label>
                          <Input
                            type="number"
                            value={rodada.temperatura_massa_t2 || ''}
                            onChange={(e) => handleRodadaChange(index, 'temperatura_massa_t2', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id={`enlonados-${index}`}
                            checked={rodada.caminhoes_enlonados}
                            onChange={(e) => handleRodadaChange(index, 'caminhoes_enlonados', e.target.checked)}
                            disabled={!isEditable || isApproved}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`enlonados-${index}`} className="text-sm">Caminhões Enlonados</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* CONTROLE DE CAUQ */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Controle de CAUQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2 py-2 text-sm text-left">Ensaio</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm">Realizado</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm">Qtde</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm">Resultado(s)</th>
                          <th className="border border-slate-300 px-2 py-2 text-sm">Padrão do Projeto</th>
                          <th className="border border-slate-300 px-2 py-1 text-xs text-center" colSpan="2">Conformidade</th>
                        </tr>
                        <tr className="bg-slate-100">
                          <th colSpan="5"></th>
                          <th className="border border-slate-300 px-2 py-1 text-xs text-center">✓</th>
                          <th className="border border-slate-300 px-2 py-1 text-xs text-center">✗</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {[
                          { key: 'extracao_ligante_rotarex', label: 'Ext. Ligante (Rotarex)', padrao: selectedProject?.teor_ligante ? `${selectedProject.teor_ligante.min} a ${selectedProject.teor_ligante.max} %` : 'N/A', decimals: 2 },
                          { key: 'extracao_ligante_soxhlet', label: 'Ext. Ligante (Soxhlet)', padrao: selectedProject?.teor_ligante ? `${selectedProject.teor_ligante.min} a ${selectedProject.teor_ligante.max} %` : 'N/A', decimals: 2 },
                          { key: 'granulometria', label: 'Granulometria', padrao: 'Faixa de trabalho', noResult: true },
                          { key: 'densidade_rice', label: 'Densidade RICE', padrao: selectedProject?.densidade_maxima_medida ? `${selectedProject.densidade_maxima_medida} g/cm³` : 'N/A', noConformity: true, decimals: 3 },
                          { key: 'densidade_aparente', label: 'Densidade Aparente', padrao: selectedProject?.massa_especifica_aparente ? `${selectedProject.massa_especifica_aparente} g/cm³` : 'N/A', noConformity: true, decimals: 3 },
                          { key: 'volume_vazios', label: 'Volume de Vazios', padrao: selectedProject?.volume_vazios ? `${selectedProject.volume_vazios.min} a ${selectedProject.volume_vazios.max} %` : 'N/A', decimals: 1 },
                          { key: 'rbv', label: 'RBV', padrao: selectedProject?.rbv ? `${selectedProject.rbv.min} a ${selectedProject.rbv.max} %` : 'N/A', decimals: 1 },
                          { key: 'rtcd_25c', label: 'RTCD 25°C', padrao: selectedProject?.rtcd ? `> ${selectedProject.rtcd.min} MPa` : 'N/A', decimals: 2 },
                          { key: 'estabilidade', label: 'Estabilidade', padrao: selectedProject?.estabilidade ? `> ${selectedProject.estabilidade.min} N` : 'N/A', decimals: 0 },
                          { key: 'fluencia', label: 'Fluência', padrao: selectedProject?.fluencia ? `${selectedProject.fluencia.min} a ${selectedProject.fluencia.max} mm` : 'Indicativo', decimals: 1 },
                        ].map(ensaio => {
                          const quantidade = formData.controle_cauq[ensaio.key]?.quantidade || 0;
                          const resultados = formData.controle_cauq[ensaio.key]?.resultados || [];
                          const conforme = formData.controle_cauq[ensaio.key]?.conforme;
                          const isAutoConformity = quantidade === 1 && formData.controle_cauq[ensaio.key]?.hasOwnProperty('conforme') && ensaio.key !== 'granulometria' && !ensaio.noConformity;
                          
                          // Definir step baseado em decimals
                          let stepValue;
                          switch (ensaio.decimals) {
                            case 0: stepValue = '1'; break;
                            case 1: stepValue = '0.1'; break;
                            case 2: stepValue = '0.01'; break;
                            case 3: stepValue = '0.001'; break;
                            default: stepValue = 'any';
                          }
                          
                          return (
                            <tr key={ensaio.key}>
                              <td className="border border-slate-300 px-2 py-2 font-medium">{ensaio.label}</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                {formData.controle_cauq[ensaio.key]?.hasOwnProperty('realizado') && (
                                  <input
                                    type="checkbox"
                                    checked={formData.controle_cauq[ensaio.key]?.realizado || false}
                                    onChange={(e) => handleNestedChange(`controle_cauq.${ensaio.key}.realizado`, e.target.checked)}
                                    disabled={!isEditable || isApproved || !selectedProject}
                                    className="w-4 h-4"
                                  />
                                )}
                              </td>
                              <td className="border border-slate-300 px-1 py-1">
                                {formData.controle_cauq[ensaio.key]?.hasOwnProperty('quantidade') && (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.controle_cauq[ensaio.key]?.quantidade || ''}
                                    onChange={(e) => handleNestedChange(`controle_cauq.${ensaio.key}.quantidade`, e.target.value ? parseInt(e.target.value) : 0)}
                                    disabled={!isEditable || isApproved || !selectedProject}
                                    className="h-8 text-sm"
                                    placeholder="Qtde"
                                  />
                                )}
                              </td>
                              <td className="border border-slate-300 px-1 py-1">
                                {!ensaio.noResult && formData.controle_cauq[ensaio.key]?.hasOwnProperty('resultados') && quantidade > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Array.from({ length: quantidade }).map((_, resultIndex) => (
                                      <Input
                                        key={resultIndex}
                                        type={ensaio.key === 'fluencia' ? 'text' : 'number'}
                                        min={ensaio.key === 'fluencia' ? undefined : "0"}
                                        step={ensaio.key === 'fluencia' ? undefined : stepValue}
                                        value={resultados[resultIndex] ?? ''}
                                        onChange={(e) => handleNestedChange(
                                          `controle_cauq.${ensaio.key}.resultados.${resultIndex}`,
                                          e.target.value,
                                          ensaio.decimals
                                        )}
                                        disabled={!isEditable || isApproved || !selectedProject}
                                        className="h-8 text-sm"
                                        style={{ width: quantidade > 1 ? '80px' : '100%' }}
                                        placeholder={quantidade > 1 ? `R${resultIndex + 1}` : 'Resultado'}
                                      />
                                    ))}
                                  </div>
                                ) : null}
                              </td>
                              <td className={`border border-slate-300 px-2 py-1 text-center text-xs ${selectedProject ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                                {ensaio.padrao}
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                {formData.controle_cauq[ensaio.key]?.hasOwnProperty('conforme') && !ensaio.noConformity ? (
                                  <input
                                    type="checkbox"
                                    checked={conforme === true}
                                    onChange={(e) => {
                                      const newValue = e.target.checked ? true : null;
                                      handleNestedChange(`controle_cauq.${ensaio.key}.conforme`, newValue);
                                    }}
                                    disabled={!isEditable || isApproved || !selectedProject || isAutoConformity}
                                    className="w-4 h-4 accent-green-500"
                                    title={isAutoConformity ? "Conformidade automática" : ensaio.key === 'granulometria' ? "Sempre manual" : ""}
                                  />
                                ) : null}
                              </td>
                              <td className="border border-slate-300 px-2 py-1 text-center">
                                {formData.controle_cauq[ensaio.key]?.hasOwnProperty('conforme') && !ensaio.noConformity ? (
                                  <input
                                    type="checkbox"
                                    checked={conforme === false}
                                    onChange={(e) => {
                                      const newValue = e.target.checked ? false : null;
                                      handleNestedChange(`controle_cauq.${ensaio.key}.conforme`, newValue);
                                    }}
                                    disabled={!isEditable || isApproved || !selectedProject || isAutoConformity}
                                    className="w-4 h-4 accent-red-500"
                                    title={isAutoConformity ? "Conformidade automática" : ensaio.key === 'granulometria' ? "Sempre manual" : ""}
                                  />
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* OBSERVAÇÕES E FOTOS */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="observacoes">Observações Gerais</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    disabled={!isEditable || isApproved}
                    rows={3}
                    placeholder="Observações sobre o checklist..."
                    maxLength="500"
                  />
                  <p className="text-xs text-right text-slate-500 mt-1">
                    {formData.observacoes?.length || 0} / 500
                  </p>
                </div>

                <div>
                  <Label>Relatório Fotográfico</Label>
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
                        className={`flex items-center justify-between w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm cursor-pointer hover:bg-slate-50 ${loadingUpload ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="truncate text-slate-500">{selectedFileNames}</span>
                        <span className="flex-shrink-0 ml-4 px-3 py-1 rounded-md text-sm font-semibold bg-blue-50  text-blue-700 hover:bg-blue-100">
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
                          <span className={progress.status === 'error' ? 'text-red-600' : 'text-gray-600'}>
                            {progress.fileName} - {progress.status === 'pending' && 'Aguardando'}
                            {progress.status === 'uploading' && 'Enviando...'}
                            {progress.status === 'success' && 'Sucesso'}
                            {progress.status === 'error' && `Erro: ${progress.error}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {formData.fotos && formData.fotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-md border" />
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
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  clearSavedData();
                  navigate(createPageUrl('MeusEnsaios'));
                }}>
                  Cancelar
                </Button>
                {isEditable && !isApproved && (
                  <>
                    <Button 
                      type="button" 
                      variant="outline"
                      disabled={loadingUpload}
                      onClick={async (e) => {
                        e.preventDefault();
                        await handleSubmit(e, 'rascunho');
                      }}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <Save className="mr-2 h-4 w-4" /> Salvar Progresso
                    </Button>
                    <Button type="submit" disabled={loadingUpload} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                  </>
                )}
                {isApproved && (
                  <Badge className="bg-green-500 hover:bg-green-500 px-4 py-2 text-md">
                    <CheckCircle className="mr-2 h-4 w-4" /> Aprovado
                  </Badge>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}