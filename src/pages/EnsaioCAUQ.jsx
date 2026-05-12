import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, AlertTriangle, Loader2, CheckCircle, Plus, Trash2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User";
import { Project } from "@/entities/Project";
import { FaixaGranulometrica } from "@/entities/FaixaGranulometrica";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFormPersistence } from "@/components/hooks/useFormPersistence";

const peneirasConfig = [
  { key: "peneira_75_0mm", label: '3"', abertura: "75,0" },
  { key: "peneira_63_0mm", label: '2.1/2"', abertura: "63,0" },
  { key: "peneira_50_0mm", label: '2"', abertura: "50,0" },
  { key: "peneira_37_5mm", label: '1.1/2"', abertura: "37,5" },
  { key: "peneira_25_0mm", label: '1"', abertura: "25,0" },
  { key: "peneira_19_0mm", label: '3/4"', abertura: "19,0" },
  { key: "peneira_16_0mm", label: '5/8"', abertura: "16,0" },
  { key: "peneira_12_5mm", label: '1/2"', abertura: "12,5" },
  { key: "peneira_9_5mm", label: '3/8"', abertura: "9,5" },
  { key: "peneira_4_75mm", label: 'Nº 4', abertura: "4,75" },
  { key: "peneira_2_36mm", label: 'Nº 8', abertura: "2,36" },
  { key: "peneira_2_0mm", label: 'Nº 10', abertura: "2,0" },
  { key: "peneira_1_18mm", label: 'Nº 16', abertura: "1,18" },
  { key: "peneira_0_6mm", label: 'Nº 30', abertura: "0,6" },
  { key: "peneira_0_42mm", label: 'Nº 40', abertura: "0,42" },
  { key: "peneira_0_3mm", label: 'Nº 50', abertura: "0,3" },
  { key: "peneira_0_18mm", label: 'Nº 80', abertura: "0,18" },
  { key: "peneira_0_15mm", label: 'Nº 100', abertura: "0,15" },
  { key: "peneira_0_075mm", label: 'Nº 200', abertura: "0,075" }
];

const getInitialFormData = () => ({
  obra_id: "",
  project_id: "",
  data_ensaio: new Date().toISOString().split('T')[0],
  horario: "",
  placa_caminhao: "",
  local_coleta: "",
  usina_fornecedora: "",
  pedreira: "",
  rodovia: "",
  trecho: "",
  tipo_ligante: "",
  temperatura_cap: null,
  faixa_especificada: "",
  ensaio_realizado_por: "Afirma Evias",
  realizar_ensaio_umidade: false,
  extracao_ligante: {
    amostra_umida: null,
    amostra_seca: null,
    umidade: null,
    amostra_com_ligante: null,
    amostra_sem_ligante: null,
    fator_correcao: 1.0,
    peso_ligante: null,
    teor_ligante: null,
    filler_betume: null,
    teor_ligante_real: null
  },
  granulometria: {
    peso_retido_peneiras: {}
  },
  realizar_densidade_rice: false,
  densidade_rice: {
    frasco_agua: null,
    amostra: null,
    frasco_agua_amostra: null,
    temperatura_agua: null,
    densidade_agua: 0.9971,
    densidade_rice: null
  },
  realizar_marshall: false,
  corpos_prova_marshall: [],
  observacoes: "",
  status: "rascunho",
  approved: null,
  rejection_reason: null
});

export default function EnsaioCAUQPage() {
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [user, setUser] = useState(null);
  const [editingEnsaio, setEditingEnsaio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());

  const location = useLocation();
  const navigate = useNavigate();

  const { clearSavedData } = useFormPersistence('ensaio_cauq', formData, setFormData, !!editingEnsaio);

  const selectedProject = useMemo(() =>
    projects.find(p => p.id === formData.project_id),
    [projects, formData.project_id]
  );

  const selectedFaixa = useMemo(() => {
    if (!selectedProject || !selectedProject.faixa_granulometrica_id) return null;
    return faixas.find(f => f.id === selectedProject.faixa_granulometrica_id);
  }, [selectedProject, faixas]);

  const peneirasDoProjecto = useMemo(() => {
    if (!selectedFaixa || !selectedFaixa.peneiras || selectedFaixa.peneiras.length === 0) {
      return peneirasConfig;
    }

    return peneirasConfig.filter(peneira => {
      const aberturaConfig = parseFloat(peneira.abertura.replace(',', '.'));
      return selectedFaixa.peneiras.some(p => {
        const aberturaFaixa = parseFloat(p.abertura.toString().replace(/mm/gi, '').replace(',', '.'));
        return aberturaConfig === aberturaFaixa;
      });
    });
  }, [selectedFaixa]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Atualiza um campo dentro de uma seção aninhada (ex: extracao_ligante, densidade_rice)
  // Evita path strings dinâmicos que disparam avisos de prototype pollution
  const handleNestedChange = useCallback((section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  }, []);

  // Cálculo automático da extração de ligante
  useEffect(() => {
    const ext = formData.extracao_ligante;
    
    // Calcular umidade apenas se o ensaio de umidade estiver habilitado
    if (formData.realizar_ensaio_umidade && ext.amostra_umida && ext.amostra_seca) {
      const umidade = ((ext.amostra_umida - ext.amostra_seca) / ext.amostra_seca) * 100;
      handleNestedChange('extracao_ligante', 'umidade', parseFloat(umidade.toFixed(2)));
    }

    if (ext.amostra_com_ligante && ext.amostra_sem_ligante && ext.fator_correcao) {
      const pesoLigante = (ext.amostra_com_ligante - ext.amostra_sem_ligante) * ext.fator_correcao;
      const teorLigante = (pesoLigante / ext.amostra_com_ligante) * 100;
      handleNestedChange('extracao_ligante', 'peso_ligante', parseFloat(pesoLigante.toFixed(2)));
      handleNestedChange('extracao_ligante', 'teor_ligante', parseFloat(teorLigante.toFixed(2)));
      
      if (formData.realizar_ensaio_umidade && ext.umidade) {
        const teorReal = teorLigante - ext.umidade;
        handleNestedChange('extracao_ligante', 'teor_ligante_real', parseFloat(teorReal.toFixed(2)));
      } else {
        handleNestedChange('extracao_ligante', 'teor_ligante_real', parseFloat(teorLigante.toFixed(2)));
      }
    }
  }, [
    formData.realizar_ensaio_umidade,
    formData.extracao_ligante.amostra_umida,
    formData.extracao_ligante.amostra_seca,
    formData.extracao_ligante.amostra_com_ligante,
    formData.extracao_ligante.amostra_sem_ligante,
    formData.extracao_ligante.fator_correcao,
    formData.extracao_ligante.umidade,
    handleNestedChange
  ]);

  // Cálculo automático do Rice
  useEffect(() => {
    if (!formData.realizar_densidade_rice) return;
    
    const rice = formData.densidade_rice;
    if (rice.frasco_agua && rice.amostra && rice.frasco_agua_amostra && rice.densidade_agua) {
      const densRice = (rice.amostra * rice.densidade_agua) / (rice.frasco_agua + rice.amostra - rice.frasco_agua_amostra);
      handleNestedChange('densidade_rice', 'densidade_rice', parseFloat(densRice.toFixed(3)));
    }
  }, [
    formData.realizar_densidade_rice,
    formData.densidade_rice.frasco_agua,
    formData.densidade_rice.amostra,
    formData.densidade_rice.frasco_agua_amostra,
    formData.densidade_rice.densidade_agua,
    handleNestedChange
  ]);

  // Cálculo automático do Filler/Betume
  useEffect(() => {
    const teorReal = formData.extracao_ligante.teor_ligante_real;
    const pesoRetido200 = formData.granulometria.peso_retido_peneiras?.peneira_0_075mm;
    
    if (teorReal && pesoRetido200 !== null && pesoRetido200 !== undefined) {
      // Calcular % passante na #200
      const pesoTotal = Object.values(formData.granulometria.peso_retido_peneiras || {})
        .reduce((sum, val) => sum + (val || 0), 0);
      
      if (pesoTotal > 0) {
        const percentualPassante200 = (pesoRetido200 / pesoTotal) * 100;
        const fillerBetume = (percentualPassante200 * (100 - teorReal)) / (100 * teorReal);
        handleNestedChange('extracao_ligante', 'filler_betume', parseFloat(fillerBetume.toFixed(2)));
      }
    }
  }, [
    formData.extracao_ligante.teor_ligante_real,
    formData.granulometria.peso_retido_peneiras,
    handleNestedChange
  ]);

  const handleProjectChange = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      setFormData(prev => ({ ...prev, project_id: "" }));
      return;
    }

    const faixa = faixas.find(f => f.id === project.faixa_granulometrica_id);
    
    // Extrair pedreira(s) dos agregados do projeto
    let pedreira = "";
    if (project.agregados && project.agregados.length > 0) {
      const pedreiras = project.agregados
        .map(ag => ag.pedreira)
        .filter(p => p)
        .filter((p, idx, arr) => arr.indexOf(p) === idx); // Remove duplicatas
      pedreira = pedreiras.join(", ");
    }

    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      faixa_especificada: faixa ? faixa.nome : "Não definida",
      tipo_ligante: project.ligante?.tipo || "",
      pedreira: pedreira
    }));
  }, [projects, faixas]);

  const adicionarCorpoProva = useCallback(() => {
    if (formData.corpos_prova_marshall.length < 6) {
      setFormData(prev => ({
        ...prev,
        corpos_prova_marshall: [...prev.corpos_prova_marshall, {
          numero: prev.corpos_prova_marshall.length + 1,
          metodo_rompimento: "estabilidade_fluencia",
          peso_ar: null,
          peso_imerso: null,
          peso_sss: null,
          volume: null,
          densidade_aparente: null,
          volume_vazios: null,
          vcb: null,
          vam: null,
          rbv: null,
          altura: null,
          const_prensa: 1.0,
          rtcd_leitura: null,
          rtcd_valor: null,
          estabilidade_leitura: null,
          estabilidade_corrigida: null,
          fluencia_leitura_inicial: null,
          fluencia_leitura_final: null,
          fluencia: null
        }]
      }));
    }
  }, [formData.corpos_prova_marshall.length]);

  const removerCorpoProva = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      corpos_prova_marshall: prev.corpos_prova_marshall.filter((_, i) => i !== index)
    }));
  }, []);

  const handleCorpoProvaChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newCPs = [...prev.corpos_prova_marshall];
      newCPs[index] = { ...newCPs[index], [field]: value };
      
      const cp = newCPs[index];
      
      // Cálculos automáticos
      if (cp.peso_ar && cp.peso_imerso && cp.peso_sss) {
        cp.volume = parseFloat((cp.peso_sss - cp.peso_imerso).toFixed(2));
        const densidadeAgua = 0.9971;
        cp.densidade_aparente = parseFloat(((cp.peso_ar * densidadeAgua) / cp.volume).toFixed(3));
        
        if (prev.realizar_densidade_rice && prev.densidade_rice.densidade_rice) {
          cp.volume_vazios = parseFloat((100 * (1 - cp.densidade_aparente / prev.densidade_rice.densidade_rice)).toFixed(1));
        }
        
        if (prev.extracao_ligante.teor_ligante_real && cp.densidade_aparente) {
          const densidadeLigante = 1.030; // Densidade típica do ligante asfáltico
          cp.vcb = parseFloat(((cp.densidade_aparente * prev.extracao_ligante.teor_ligante_real) / densidadeLigante).toFixed(2));

          // Calcular VAM: VCB + volume de vazios
          if (cp.volume_vazios !== null && cp.vcb !== null) {
            cp.vam = parseFloat((cp.vcb + cp.volume_vazios).toFixed(2));

            // Calcular RBV: (VCB/VAM)*100
            if (cp.vam > 0) {
              cp.rbv = parseFloat(((cp.vcb / cp.vam) * 100).toFixed(2));
            }
          }
        }
      }

      // Cálculo RTCD para método diametral
      // Fórmula: ((X*2)/(10*Y*3,1416))*0,098*Z
      // X = LEITURA; Y = ALTURA DO CP EM cm; Z = CONSTANTE DA PRENSA
      if (cp.metodo_rompimento === 'diametral' && cp.rtcd_leitura && cp.altura && cp.const_prensa) {
        const X = cp.rtcd_leitura;
        const Y = cp.altura;
        const Z = cp.const_prensa;
        const rtcd = ((X * 2) / (10 * Y * 3.1416)) * 0.098 * Z;
        cp.rtcd_valor = parseFloat(rtcd.toFixed(2));
      }

      // Cálculo Estabilidade e Fluência
      if (cp.metodo_rompimento === 'estabilidade_fluencia') {
        if (cp.estabilidade_leitura && cp.const_prensa && cp.altura) {
          // Tabela de correção da estabilidade em função da espessura (DNIT)
          const tabelaCorrecao = [
            [50.8, 1.47], [51.0, 1.45], [51.2, 1.44], [51.6, 1.43], [51.8, 1.42],
            [52.0, 1.41], [52.2, 1.40], [52.4, 1.39], [52.6, 1.38], [52.9, 1.37],
            [53.1, 1.36], [53.3, 1.35], [53.5, 1.34], [53.8, 1.33], [54.0, 1.32],
            [54.2, 1.31], [54.5, 1.30], [54.7, 1.29], [54.9, 1.28], [55.1, 1.27],
            [55.4, 1.26], [55.6, 1.25], [55.8, 1.24], [56.1, 1.23], [56.3, 1.22],
            [56.6, 1.21], [56.8, 1.20], [57.2, 1.19], [57.4, 1.18], [57.7, 1.18],
            [58.1, 1.16], [58.4, 1.15], [58.7, 1.14], [59.0, 1.13], [59.3, 1.12],
            [59.7, 1.11], [60.0, 1.10], [60.3, 1.09], [60.6, 1.08], [60.9, 1.07],
            [61.1, 1.06], [61.4, 1.05], [61.9, 1.04], [62.3, 1.03], [62.7, 1.02],
            [63.1, 1.01], [63.5, 1.00], [63.9, 0.99], [64.3, 0.98], [64.7, 0.97],
            [65.1, 0.96], [65.6, 0.95], [66.1, 0.94], [66.7, 0.93], [67.1, 0.92],
            [67.5, 0.91], [67.9, 0.90], [68.3, 0.89], [68.8, 0.88], [69.3, 0.87],
            [69.9, 0.86], [70.3, 0.85], [70.8, 0.84], [71.4, 0.83], [72.2, 0.82],
            [73.0, 0.81], [73.5, 0.80], [74.0, 0.79], [74.6, 0.78], [75.4, 0.77],
            [76.2, 0.76]
          ];
          
          const alturaMm = cp.altura * 10; // Converter cm para mm
          let fatorCorrecao = 1.0;
          
          // Interpolação linear
          if (alturaMm <= tabelaCorrecao[0][0]) {
            fatorCorrecao = tabelaCorrecao[0][1];
          } else if (alturaMm >= tabelaCorrecao[tabelaCorrecao.length - 1][0]) {
            fatorCorrecao = tabelaCorrecao[tabelaCorrecao.length - 1][1];
          } else {
            for (let i = 0; i < tabelaCorrecao.length - 1; i++) {
              if (alturaMm >= tabelaCorrecao[i][0] && alturaMm <= tabelaCorrecao[i + 1][0]) {
                const x0 = tabelaCorrecao[i][0];
                const y0 = tabelaCorrecao[i][1];
                const x1 = tabelaCorrecao[i + 1][0];
                const y1 = tabelaCorrecao[i + 1][1];
                fatorCorrecao = y0 + ((alturaMm - x0) * (y1 - y0)) / (x1 - x0);
                break;
              }
            }
          }
          
          const Y = cp.estabilidade_leitura;
          const Z = cp.const_prensa;
          cp.estabilidade_corrigida = parseFloat((Y * fatorCorrecao * Z).toFixed(1));
        }
        if (cp.fluencia_leitura_inicial !== null && cp.fluencia_leitura_final !== null) {
          cp.fluencia = parseFloat((cp.fluencia_leitura_final - cp.fluencia_leitura_inicial).toFixed(2));
        }
      }

      return { ...prev, corpos_prova_marshall: newCPs };
    });
  }, []);

  const handleSaveProgress = async () => {
    if (!formData.obra_id) {
      alert("Por favor, selecione uma obra para salvar o progresso.");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: "rascunho",
        laboratorista_name: user?.laboratorista_name || user?.full_name
      };

      if (editingEnsaio?.id) {
        await base44.entities.EnsaioCAUQ.update(editingEnsaio.id, dataToSave);
        alert("Progresso salvo com sucesso!");
      } else {
        const newEnsaio = await base44.entities.EnsaioCAUQ.create(dataToSave);
        setEditingEnsaio(newEnsaio);
        alert("Progresso salvo com sucesso!");
      }
      clearSavedData();
    } catch (error) {
      console.error("[EnsaioCAUQ] Erro ao salvar progresso:", error?.message || error);
      alert("Erro ao salvar progresso.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.obra_id) {
      alert("Por favor, selecione uma obra.");
      return;
    }

    if (!formData.data_ensaio) {
      alert("Por favor, informe a data do ensaio.");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: "finalizado",
        laboratorista_name: user?.laboratorista_name || user?.full_name
      };

      if (editingEnsaio?.id) {
        const updateData = { ...dataToSave };
        if (editingEnsaio.approved === false) {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
          await base44.entities.EnsaioCAUQ.update(editingEnsaio.id, updateData);
          alert("Ensaio finalizado com sucesso! O registro voltará para análise.");
        } else {
          await base44.entities.EnsaioCAUQ.update(editingEnsaio.id, updateData);
          alert("Ensaio finalizado com sucesso!");
        }
      } else {
        await base44.entities.EnsaioCAUQ.create(dataToSave);
        alert("Ensaio criado e finalizado com sucesso!");
      }
      clearSavedData();
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("[EnsaioCAUQ] Erro ao finalizar ensaio:", error?.message || error);
      alert("Erro ao finalizar ensaio.");
    } finally {
      setSaving(false);
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

  const usinasDisponiveis = useMemo(() => {
    if (!obraSelecionada) return [];
    return obraSelecionada.usinas || [];
  }, [obraSelecionada]);

  const rodoviasDisponiveis = useMemo(() => {
    if (!obraSelecionada) return [];
    return obraSelecionada.rodovias || [];
  }, [obraSelecionada]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const currentUserAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

        let faixasData = [];
        try {
          faixasData = await FaixaGranulometrica.list();
        } catch (faixasError) {
          console.warn("[EnsaioCAUQ] Faixas granulométricas indisponíveis, continuando sem elas:", faixasError?.message || faixasError);
        }

        const [obrasData, regionaisData, projectsData] = await Promise.all([
          Obra.list(),
          Regional.list(),
          Project.list()
        ]);

        setRegionais(regionaisData);
        setProjects(projectsData);
        setFaixas(faixasData);

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
          const ensaioToEdit = await base44.entities.EnsaioCAUQ.get(editId);
          setEditingEnsaio(ensaioToEdit);

          if (userData.role === 'admin' || (ensaioToEdit.created_by === userData.email && (ensaioToEdit.status === 'rascunho' || ensaioToEdit.approved === false))) {
            setFormData({
              ...getInitialFormData(),
              ...ensaioToEdit,
              data_ensaio: ensaioToEdit.data_ensaio ? new Date(ensaioToEdit.data_ensaio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              realizar_ensaio_umidade: ensaioToEdit.realizar_ensaio_umidade ?? false,
              extracao_ligante: { ...getInitialFormData().extracao_ligante, ...(ensaioToEdit.extracao_ligante || {}) },
              granulometria: { ...getInitialFormData().granulometria, ...(ensaioToEdit.granulometria || {}) },
              realizar_densidade_rice: ensaioToEdit.realizar_densidade_rice ?? false,
              densidade_rice: { ...getInitialFormData().densidade_rice, ...(ensaioToEdit.densidade_rice || {}) },
              realizar_marshall: ensaioToEdit.realizar_marshall ?? false,
              corpos_prova_marshall: ensaioToEdit.corpos_prova_marshall || []
            });
          } else {
            alert("Você não tem permissão para editar este registro.");
            navigate(createPageUrl('MeusEnsaios'));
            return;
          }
        } else {
          const initialNewFormData = getInitialFormData();
          if (availableObras.length > 0) {
            initialNewFormData.obra_id = availableObras[0].id;
          }
          initialNewFormData.realizar_densidade_rice = false;
          initialNewFormData.realizar_ensaio_umidade = false;
          initialNewFormData.realizar_marshall = false;
          setFormData(initialNewFormData);
          setEditingEnsaio(null);
        }
      } catch (error) {
        console.error("[EnsaioCAUQ] Erro ao carregar dados:", error?.message || error);
        alert("Não foi possível carregar os dados.");
        navigate(createPageUrl('MeusEnsaios'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.search, navigate]);

  const isApproved = formData.approved === true;
  const userCanEdit = user?.role === 'admin' || (formData.created_by === user?.email && (formData.status === 'rascunho' || formData.approved === false));
  const isEditable = !editingEnsaio?.id || userCanEdit;

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingEnsaio?.id ? "Editar Ensaio de CAUQ" : "Novo Ensaio de CAUQ"}</CardTitle>
            <CardDescription>
              {editingEnsaio?.id ? `Editando ensaio de ${new Date(editingEnsaio.data_ensaio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : "Extração, Granulometria e Marshall"}
            </CardDescription>
            {formData.status === 'rascunho' && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-[#BFCF99]/20 border border-[#BFCF99]/40 rounded-lg">
                <Clock className="w-5 h-5 text-[#566E3D] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#566E3D]">Registro em Rascunho</p>
                  <p className="text-sm text-[#00233B]/70">Este ensaio está salvo como rascunho. Clique em "Finalizar Registro" quando estiver completo.</p>
                </div>
              </div>
            )}
            {editingEnsaio?.rejection_reason && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{editingEnsaio.rejection_reason}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
              }
            }} className="space-y-6">
              {/* DADOS DA OBRA */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dados da Obra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="obra_id">Obra *</Label>
                      <select
                        id="obra_id"
                        value={formData.obra_id}
                        onChange={(e) => handleChange('obra_id', e.target.value)}
                        required
                        disabled={!isEditable || isApproved || editingEnsaio?.id}
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
                      <Label htmlFor="project_id">Projeto CAUQ</Label>
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="space-y-0.5 text-sm">
                        <p className="text-blue-800"><strong>📍 Regional:</strong> {regionalSelecionada.nome}</p>
                        {regionalSelecionada.cliente && (
                          <p className="text-blue-800"><strong>👤 Cliente:</strong> {regionalSelecionada.cliente}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="data_ensaio">Data *</Label>
                      <Input
                        id="data_ensaio"
                        type="date"
                        value={formData.data_ensaio}
                        onChange={(e) => handleChange('data_ensaio', e.target.value)}
                        required={formData.status === 'finalizado'}
                        disabled={!isEditable || isApproved}
                        />
                    </div>

                    <div>
                      <Label htmlFor="horario">Horário</Label>
                      <Input
                        id="horario"
                        type="time"
                        value={formData.horario}
                        onChange={(e) => handleChange('horario', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label htmlFor="placa_caminhao">Placa Caminhão</Label>
                      <Input
                        id="placa_caminhao"
                        value={formData.placa_caminhao}
                        onChange={(e) => handleChange('placa_caminhao', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="rodovia">Rodovia</Label>
                      {rodoviasDisponiveis.length > 0 ? (
                        <select
                          id="rodovia"
                          value={formData.rodovia}
                          onChange={(e) => handleChange('rodovia', e.target.value)}
                          disabled={!isEditable || isApproved}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Selecione a rodovia</option>
                          {rodoviasDisponiveis.map((rodovia, idx) => (
                            <option key={idx} value={rodovia}>
                              {rodovia}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id="rodovia"
                          value={formData.rodovia}
                          onChange={(e) => handleChange('rodovia', e.target.value)}
                          disabled={!isEditable || isApproved}
                          placeholder={formData.obra_id ? "Nenhuma rodovia cadastrada na obra" : "Selecione a obra primeiro"}
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="trecho">Trecho</Label>
                      <Input
                        id="trecho"
                        value={formData.trecho}
                        onChange={(e) => handleChange('trecho', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="local_coleta">Local de Coleta</Label>
                      <Input
                        id="local_coleta"
                        value={formData.local_coleta}
                        onChange={(e) => handleChange('local_coleta', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label htmlFor="usina_fornecedora">Usina Fornecedora</Label>
                      {usinasDisponiveis.length > 0 ? (
                        <select
                          id="usina_fornecedora"
                          value={formData.usina_fornecedora}
                          onChange={(e) => handleChange('usina_fornecedora', e.target.value)}
                          disabled={!isEditable || isApproved}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Selecione a usina</option>
                          {usinasDisponiveis.map((usina, idx) => (
                            <option key={idx} value={usina}>
                              {usina}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id="usina_fornecedora"
                          value={formData.usina_fornecedora}
                          onChange={(e) => handleChange('usina_fornecedora', e.target.value)}
                          disabled={!isEditable || isApproved}
                          placeholder={formData.obra_id ? "Nenhuma usina cadastrada na obra" : "Selecione a obra primeiro"}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pedreira">Pedreira</Label>
                      <Input
                        id="pedreira"
                        value={formData.pedreira}
                        onChange={(e) => handleChange('pedreira', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label htmlFor="faixa_especificada">Faixa Especificada</Label>
                      <Input
                        id="faixa_especificada"
                        value={formData.faixa_especificada}
                        onChange={(e) => handleChange('faixa_especificada', e.target.value)}
                        disabled={!isEditable || isApproved}
                        readOnly={!!selectedProject}
                        className={selectedProject ? "bg-slate-100" : ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="tipo_ligante">Tipo de Ligante</Label>
                      <Input
                        id="tipo_ligante"
                        value={formData.tipo_ligante}
                        onChange={(e) => handleChange('tipo_ligante', e.target.value)}
                        disabled={!isEditable || isApproved}
                        readOnly={!!selectedProject}
                        className={selectedProject ? "bg-slate-100" : ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor="temperatura_cap">Temperatura CAP (°C)</Label>
                      <Input
                        id="temperatura_cap"
                        type="number"
                        value={formData.temperatura_cap || ''}
                        onChange={(e) => handleChange('temperatura_cap', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ensaio_realizado_por">Ensaio realizado por:</Label>
                      <select
                        id="ensaio_realizado_por"
                        value={formData.ensaio_realizado_por}
                        onChange={(e) => handleChange('ensaio_realizado_por', e.target.value)}
                        disabled={!isEditable || isApproved}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="Afirma Evias">Afirma Evias</option>
                        <option value="Empreiteira">Empreiteira</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* EXTRAÇÃO DE LIGANTE */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Extração de Ligante (Rotarex) *</CardTitle>
                      <CardDescription>DNIT 427/20 - ABNT NBR 15619/16</CardDescription>
                    </div>
                    {isEditable && !isApproved && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-normal">Ensaio de Umidade?</Label>
                        <input
                          type="checkbox"
                          checked={formData.realizar_ensaio_umidade}
                          onChange={(e) => handleChange('realizar_ensaio_umidade', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.realizar_ensaio_umidade && (
                      <>
                        <div>
                          <Label>Amostra Úmida (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.extracao_ligante.amostra_umida || ''}
                            onChange={(e) => handleNestedChange('extracao_ligante', 'amostra_umida', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Amostra Seca (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.extracao_ligante.amostra_seca || ''}
                            onChange={(e) => handleNestedChange('extracao_ligante', 'amostra_seca', e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>

                        <div>
                          <Label>Umidade (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.extracao_ligante.umidade || ''}
                            readOnly
                            className="bg-slate-100"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Amostra com Ligante (g) {formData.status === 'finalizado' && '*'}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.extracao_ligante.amostra_com_ligante || ''}
                        onChange={(e) => handleNestedChange('extracao_ligante', 'amostra_com_ligante', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable || isApproved}
                        required={formData.status === 'finalizado'}
                      />
                    </div>

                    <div>
                      <Label>Amostra sem Ligante (g) {formData.status === 'finalizado' && '*'}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.extracao_ligante.amostra_sem_ligante || ''}
                        onChange={(e) => handleNestedChange('extracao_ligante', 'amostra_sem_ligante', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable || isApproved}
                        required={formData.status === 'finalizado'}
                      />
                    </div>

                    <div>
                      <Label>Fator de Correção</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.extracao_ligante.fator_correcao || 1.0}
                        onChange={(e) => handleNestedChange('extracao_ligante', 'fator_correcao', e.target.value ? parseFloat(e.target.value) : 1.0)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label>Peso do Ligante (g)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.extracao_ligante.peso_ligante || ''}
                        readOnly
                        className="bg-slate-100"
                      />
                    </div>

                    <div>
                      <Label>Teor de Ligante (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.extracao_ligante.teor_ligante || ''}
                        readOnly
                        className="bg-slate-100"
                      />
                    </div>

                    <div>
                      <Label>Teor Ligante Real (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.extracao_ligante.teor_ligante_real || ''}
                        readOnly
                        className="bg-blue-50 font-semibold"
                      />
                    </div>

                    <div>
                      <Label>Filler/Betume</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.extracao_ligante.filler_betume || ''}
                        readOnly
                        className="bg-blue-50 font-semibold"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GRANULOMETRIA */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Granulometria *</CardTitle>
                  <CardDescription>DNIT 412/2025</CardDescription>
                  {formData.extracao_ligante.amostra_sem_ligante && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Peso Inicial da Amostra (sem ligante):</strong> {formData.extracao_ligante.amostra_sem_ligante} g
                      </p>
                    </div>
                  )}
                  {!selectedProject && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ Selecione um projeto para ver apenas as peneiras da faixa especificada
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {peneirasDoProjecto.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>Nenhuma peneira disponível. Selecione um projeto com faixa granulométrica configurada.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-300 px-2 py-2 text-left">Peneira ASTM</th>
                            <th className="border border-slate-300 px-2 py-2 text-left">Abertura (mm)</th>
                            <th className="border border-slate-300 px-2 py-2 text-center">Retido (g)</th>
                            <th className="border border-slate-300 px-2 py-2 text-center">% Passante</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peneirasDoProjecto.map((peneira, index) => {
                            const pesoInicial = formData.extracao_ligante?.amostra_sem_ligante || 0;
                            let acumuladoRetido = 0;
                            
                            // Calcular acumulado retido até esta peneira
                            for (let i = 0; i <= index; i++) {
                              const p = peneirasDoProjecto[i];
                              acumuladoRetido += formData.granulometria.peso_retido_peneiras?.[p.key] || 0;
                            }
                            
                            const percentualPassante = pesoInicial > 0 
                              ? ((pesoInicial - acumuladoRetido) / pesoInicial * 100).toFixed(1)
                              : '-';
                            
                            return (
                              <tr key={peneira.key}>
                                <td className="border border-slate-300 px-2 py-2 font-medium">{peneira.label}</td>
                                <td className="border border-slate-300 px-2 py-2">{peneira.abertura}</td>
                                <td className="border border-slate-300 px-1 py-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.granulometria.peso_retido_peneiras?.[peneira.key] || ''}
                                    onChange={(e) => {
                                      const newPesos = { ...formData.granulometria.peso_retido_peneiras, [peneira.key]: e.target.value ? parseFloat(e.target.value) : null };
                                      handleNestedChange('granulometria', 'peso_retido_peneiras', newPesos);
                                    }}
                                    disabled={!isEditable || isApproved}
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="border border-slate-300 px-2 py-2 text-center font-semibold text-blue-600">
                                  {percentualPassante}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DENSIDADE RICE - apenas se Marshall estiver habilitado */}
              {formData.realizar_marshall && (
                <Card className="bg-slate-50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Densidade Rice (DMT) - Opcional</CardTitle>
                        <CardDescription>DNIT 136/2018</CardDescription>
                      </div>
                      {isEditable && !isApproved && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-normal">Realizar Rice?</Label>
                          <input
                            type="checkbox"
                            checked={formData.realizar_densidade_rice}
                            onChange={(e) => handleChange('realizar_densidade_rice', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {formData.realizar_densidade_rice ? (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label>FR+ÁGUA (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.densidade_rice.frasco_agua || ''}
                          onChange={(e) => handleNestedChange('densidade_rice', 'frasco_agua', e.target.value ? parseFloat(e.target.value) : null)}
                          disabled={!isEditable || isApproved}
                        />
                      </div>

                      <div>
                        <Label>AMOSTRA (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.densidade_rice.amostra || ''}
                          onChange={(e) => handleNestedChange('densidade_rice', 'amostra', e.target.value ? parseFloat(e.target.value) : null)}
                          disabled={!isEditable || isApproved}
                        />
                      </div>

                      <div>
                        <Label>FR+ÁGUA+AMOSTRA (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.densidade_rice.frasco_agua_amostra || ''}
                          onChange={(e) => handleNestedChange('densidade_rice', 'frasco_agua_amostra', e.target.value ? parseFloat(e.target.value) : null)}
                          disabled={!isEditable || isApproved}
                        />
                      </div>

                      <div>
                        <Label>Temperatura Água (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.densidade_rice.temperatura_agua || ''}
                          onChange={(e) => handleNestedChange('densidade_rice', 'temperatura_agua', e.target.value ? parseFloat(e.target.value) : null)}
                          disabled={!isEditable || isApproved}
                        />
                      </div>

                      <div>
                        <Label>Densidade Água (g/cm³)</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={formData.densidade_rice.densidade_agua || 0.9971}
                          onChange={(e) => handleNestedChange('densidade_rice', 'densidade_agua', e.target.value ? parseFloat(e.target.value) : 0.9971)}
                          disabled={!isEditable || isApproved}
                        />
                      </div>

                      <div>
                        <Label>Densidade Rice (g/cm³)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={formData.densidade_rice.densidade_rice || ''}
                          readOnly
                          className="bg-blue-50 font-semibold"
                        />
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <p className="text-center text-slate-500 py-6 italic">
                      Marque a opção "Realizar Rice?" para incluir o ensaio de densidade Rice
                    </p>
                  </CardContent>
                )}
                </Card>
                )}

              {/* CORPOS DE PROVA MARSHALL */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Ensaio Marshall (Opcional)</CardTitle>
                      <CardDescription>DNIT 428/22 - NBR 15087/12</CardDescription>
                    </div>
                    {isEditable && !isApproved && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-normal">Realizar Marshall?</Label>
                        <input
                          type="checkbox"
                          checked={formData.realizar_marshall}
                          onChange={(e) => {
                            handleChange('realizar_marshall', e.target.checked);
                            if (!e.target.checked) {
                              handleChange('corpos_prova_marshall', []);
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!formData.realizar_marshall ? (
                    <p className="text-center text-slate-500 py-8 italic">
                      Marque a opção "Realizar Marshall?" para incluir o ensaio Marshall
                    </p>
                  ) : (
                    <>
                      {isEditable && !isApproved && formData.corpos_prova_marshall.length < 6 && (
                        <div className="flex justify-end">
                          <Button type="button" onClick={adicionarCorpoProva} className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar CP Marshall
                          </Button>
                        </div>
                      )}
                      {formData.corpos_prova_marshall.length === 0 ? (
                        <p className="text-center text-slate-500 py-4 italic">
                          Clique em "Adicionar CP Marshall" para incluir corpos de prova ao ensaio
                        </p>
                      ) : (
                    formData.corpos_prova_marshall.map((cp, index) => (
                      <Card key={index} className="relative border-2 border-slate-200">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Corpo de Prova {cp.numero}</CardTitle>
                            {isEditable && !isApproved && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerCorpoProva(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Método de Rompimento */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <Label className="font-semibold text-blue-900 mb-2 block">Método de Rompimento *</Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`metodo_${index}`}
                                  value="diametral"
                                  checked={cp.metodo_rompimento === 'diametral'}
                                  onChange={(e) => handleCorpoProvaChange(index, 'metodo_rompimento', e.target.value)}
                                  disabled={!isEditable || isApproved}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">RTCD (Diametral)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`metodo_${index}`}
                                  value="estabilidade_fluencia"
                                  checked={cp.metodo_rompimento === 'estabilidade_fluencia'}
                                  onChange={(e) => handleCorpoProvaChange(index, 'metodo_rompimento', e.target.value)}
                                  disabled={!isEditable || isApproved}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">Estabilidade e Fluência</span>
                              </label>
                            </div>
                          </div>

                          {/* Dados do CP */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Peso Ar (g)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={cp.peso_ar || ''}
                                onChange={(e) => handleCorpoProvaChange(index, 'peso_ar', e.target.value ? parseFloat(e.target.value) : null)}
                                disabled={!isEditable || isApproved}
                                className="h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Peso Imerso (g)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={cp.peso_imerso || ''}
                                onChange={(e) => handleCorpoProvaChange(index, 'peso_imerso', e.target.value ? parseFloat(e.target.value) : null)}
                                disabled={!isEditable || isApproved}
                                className="h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Peso SSS (g)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={cp.peso_sss || ''}
                                onChange={(e) => handleCorpoProvaChange(index, 'peso_sss', e.target.value ? parseFloat(e.target.value) : null)}
                                disabled={!isEditable || isApproved}
                                className="h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Volume (cm³)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={cp.volume || ''}
                                readOnly
                                className="bg-slate-100 h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Densidade Aparente (g/cm³)</Label>
                              <Input
                                type="number"
                                step="0.001"
                                value={cp.densidade_aparente || ''}
                                readOnly
                                className="bg-slate-100 h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Volume Vazios (%)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={cp.volume_vazios || ''}
                                readOnly
                                className="bg-slate-100 h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">V.C.B. (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={cp.vcb || ''}
                                readOnly
                                className="bg-slate-100 h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">V.A.M. (%)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={cp.vam || ''}
                                readOnly
                                className="bg-slate-100 h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">R.B.V. (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={cp.rbv || ''}
                                readOnly
                                className="bg-slate-100 h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Altura (cm)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={cp.altura || ''}
                                onChange={(e) => handleCorpoProvaChange(index, 'altura', e.target.value ? parseFloat(e.target.value) : null)}
                                disabled={!isEditable || isApproved}
                                className="h-9"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Const. Prensa</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={cp.const_prensa || 1.0}
                                onChange={(e) => handleCorpoProvaChange(index, 'const_prensa', e.target.value ? parseFloat(e.target.value) : 1.0)}
                                disabled={!isEditable || isApproved}
                                className="h-9"
                              />
                            </div>
                          </div>

                          {/* Campos específicos por método */}
                          {cp.metodo_rompimento === 'diametral' && (
                            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-semibold text-green-900 mb-3">Resistência à Tração por Compressão Diametral (RTCD)</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs">Leitura (Kgf/cm²)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cp.rtcd_leitura || ''}
                                    onChange={(e) => handleCorpoProvaChange(index, 'rtcd_leitura', e.target.value ? parseFloat(e.target.value) : null)}
                                    disabled={!isEditable || isApproved}
                                    className="h-9"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">RTCD (MPa)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cp.rtcd_valor || ''}
                                    readOnly
                                    className="bg-green-100 font-semibold h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {cp.metodo_rompimento === 'estabilidade_fluencia' && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <h4 className="font-semibold text-amber-900 mb-3">Estabilidade e Fluência</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-xs">Leitura (Kgf/cm²)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cp.estabilidade_leitura || ''}
                                    onChange={(e) => handleCorpoProvaChange(index, 'estabilidade_leitura', e.target.value ? parseFloat(e.target.value) : null)}
                                    disabled={!isEditable || isApproved}
                                    className="h-9"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Estabilidade Corrig. (Kgf/cm²)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={cp.estabilidade_corrigida || ''}
                                    readOnly
                                    className="bg-amber-100 font-semibold h-9"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Fluência Inicial (mm)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cp.fluencia_leitura_inicial || ''}
                                    onChange={(e) => handleCorpoProvaChange(index, 'fluencia_leitura_inicial', e.target.value ? parseFloat(e.target.value) : null)}
                                    disabled={!isEditable || isApproved}
                                    className="h-9"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Fluência Final (mm)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cp.fluencia_leitura_final || ''}
                                    onChange={(e) => handleCorpoProvaChange(index, 'fluencia_leitura_final', e.target.value ? parseFloat(e.target.value) : null)}
                                    disabled={!isEditable || isApproved}
                                    className="h-9"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Fluência (mm)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cp.fluencia || ''}
                                    readOnly
                                    className="bg-amber-100 font-semibold h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* OBSERVAÇÕES */}
              <div>
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  disabled={!isEditable || isApproved}
                  rows={3}
                  maxLength="500"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  clearSavedData();
                  navigate(createPageUrl('MeusEnsaios'));
                }} disabled={saving}>
                  Cancelar
                </Button>
                {isEditable && !isApproved && (
                  <>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleSaveProgress}
                      disabled={saving || !formData.obra_id}
                      className="border-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/10"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Progresso
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Finalizar Registro
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