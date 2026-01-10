import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, XCircle, Plus, Trash2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Project } from "@/entities/Project";

export default function ChecklistConcretagem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]); // Store all projects
  const [regionais, setRegionais] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");

  const [formData, setFormData] = useState({
    obra_id: "",
    project_id: "",
    data: new Date().toISOString().split('T')[0],
    concreteira: "",
    rodovia: "",
    trecho: "",
    fck: "",
    volume: "",
    inspetor_campo: "",
    laboratorista_name: "",
    empreiteira: "",
    estrutura: "",
    engenheiro_responsavel: "",
    periodos_clima: [
      { periodo: "manha", temperatura_ambiente: "", condicoes_climaticas: "bom" },
      { periodo: "tarde", temperatura_ambiente: "", condicoes_climaticas: "bom" },
      { periodo: "noite", temperatura_ambiente: "", condicoes_climaticas: "bom" }
    ],
    cargas_concreto: [
      {
        numero_carga: 1,
        nota_fiscal: "",
        placa_betoneira: "",
        horario_inicio: "",
        horario_termino: "",
        jornada: "", // Moved from root formData
        slump_test: {
          realizado: false,
          resultado: null,
          limite: "",
          conforme: null
        },
        espessura_camada: {
          realizado: false,
          resultado: null,
          limite: "",
          conforme: null
        },
        equipamento_lancamento: "",
        superficie_tratada_limpa: null,
        adensamento_realizado: null,
        observacoes_lancamento: "",
        moldado_fiscalizacao: false,
        corpos_prova: [] // Nova estrutura: array de {dias_ruptura: number, tipo_ruptura: string}
      }
    ],
    observacoes_gerais: "",
    fotos: [],
    status: "rascunho"
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.project_id && projects.length > 0) {
      const selectedProject = projects.find(p => p.id === formData.project_id);
      if (selectedProject) {
        setFormData(prev => ({
          ...prev,
          concreteira: selectedProject.concreteira || prev.concreteira,
          fck: selectedProject.fck ? selectedProject.fck.toString() : prev.fck,
          // Atualizar limites de slump em todas as cargas
          cargas_concreto: prev.cargas_concreto.map(carga => {
            const newCarga = { ...carga };
            const slumpLimite = selectedProject.slump_minimo && selectedProject.slump_maximo
              ? `${selectedProject.slump_minimo} a ${selectedProject.slump_maximo} cm`
              : "";
            newCarga.slump_test = {
              ...carga.slump_test,
              limite: slumpLimite
            };
            // Re-evaluate conformity if a result is already present
            if (newCarga.slump_test.resultado !== null && newCarga.slump_test.resultado !== '') {
              newCarga.slump_test.conforme = checkSlumpConformidade(newCarga.slump_test.resultado, formData.project_id);
            }
            return newCarga;
          })
        }));
      }
    }
  }, [formData.project_id, projects]);

  // Filtrar projetos quando obra é selecionada
  useEffect(() => {
    if (formData.obra_id && obras.length > 0 && allProjects.length > 0 && regionais.length > 0) {
      const obraSelecionada = obras.find(o => o.id === formData.obra_id);
      
      if (obraSelecionada && obraSelecionada.regional_id) {
        const regional = regionais.find(r => r.id === obraSelecionada.regional_id);
        
        if (regional) {
          // Filtrar projetos do tipo CARTA_TRACO_CONCRETO vinculados à regional
          const projectIdsRegional = regional.project_ids || [];
          
          const projetosFiltrados = allProjects.filter(p => {
            // Deve ser carta traço
            if (p.tipo_projeto !== 'CARTA_TRACO_CONCRETO') return false;
            
            // Deve estar vinculado à regional (por project_ids ou regional_id direto)
            return projectIdsRegional.includes(p.id) || p.regional_id === regional.id;
          });
          
          setProjects(projetosFiltrados);
        } else {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
      
      // Limpar project_id se o projeto selecionado não estiver mais disponível
      if (formData.project_id) {
        const projectStillAvailable = projects.some(p => p.id === formData.project_id);
        if (!projectStillAvailable) {
          setFormData(prev => ({ ...prev, project_id: "" }));
        }
      }
    }
  }, [formData.obra_id, obras, allProjects, regionais, projects]); // Added 'projects' to dependency array for projectStillAvailable check.

  // Carregar engenheiro responsável quando obra é selecionada
  useEffect(() => {
    const loadEngenheiroResponsavel = async () => {
      if (formData.obra_id && obras.length > 0 && regionais.length > 0) {
        const obraSelecionada = obras.find(o => o.id === formData.obra_id);
        if (obraSelecionada && obraSelecionada.regional_id) {
          const regional = regionais.find(r => r.id === obraSelecionada.regional_id);
          if (regional && regional.gestor_contrato_responsavel) {
            try {
              // Buscar todos os usuários e encontrar o gestor
              const allUsersData = await base44.entities.User.list();
              const gestor = allUsersData.find(u => u.email.toLowerCase() === regional.gestor_contrato_responsavel.toLowerCase());

              if (gestor) {
                const gestorName = gestor.laboratorista_name || gestor.full_name;
                console.log("✅ Gestor encontrado:", gestorName);
                setFormData(prev => ({
                  ...prev,
                  engenheiro_responsavel: gestorName
                }));
              } else {
                console.log("⚠️ Gestor não encontrado para o email:", regional.gestor_contrato_responsavel);
                setFormData(prev => ({
                    ...prev,
                    engenheiro_responsavel: ""
                }));
              }
            } catch (error) {
              console.error("Erro ao buscar gestor:", error);
              setFormData(prev => ({
                  ...prev,
                  engenheiro_responsavel: ""
              }));
            }
          } else {
              setFormData(prev => ({
                  ...prev,
                  engenheiro_responsavel: ""
              }));
          }
        } else {
            setFormData(prev => ({
                ...prev,
                engenheiro_responsavel: ""
            }));
        }
      }
    };

    loadEngenheiroResponsavel();
  }, [formData.obra_id, obras, regionais]);

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
      setAllProjects(projectsData); // Store all projects

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

      // Projects will be filtered dynamically when an obra is selected
      setProjects([]);

      setFormData(prev => ({
        ...prev,
        inspetor_campo: userData.laboratorista_name || userData.full_name,
        laboratorista_name: userData.laboratorista_name || userData.full_name
      }));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados iniciais.");
    } finally {
      setLoading(false);
    }
  };

  const checkSlumpConformidade = (resultado, projectId) => {
    if (!projectId || resultado === null || resultado === '' || resultado === undefined) return null;

    const selectedProject = projects.find(p => p.id === projectId);
    if (!selectedProject || selectedProject.slump_minimo === null || selectedProject.slump_maximo === null) return null;

    const resultadoNum = parseFloat(resultado);
    if (isNaN(resultadoNum)) return null;

    return resultadoNum >= selectedProject.slump_minimo && resultadoNum <= selectedProject.slump_maximo;
  };

  const adicionarCarga = () => {
    if (formData.cargas_concreto.length < 10) {
      const selectedProject = projects.find(p => p.id === formData.project_id);
      const slumpLimite = selectedProject?.slump_minimo !== null && selectedProject?.slump_maximo !== null
        ? `${selectedProject.slump_minimo} a ${selectedProject.slump_maximo} cm`
        : "";

      setFormData(prev => ({
        ...prev,
        cargas_concreto: [...prev.cargas_concreto, {
          numero_carga: prev.cargas_concreto.length + 1,
          nota_fiscal: "",
          placa_betoneira: "",
          horario_inicio: "",
          horario_termino: "",
          jornada: "", // Added to new carga
          slump_test: {
            realizado: false,
            resultado: null,
            limite: slumpLimite,
            conforme: null
          },
          espessura_camada: {
            realizado: false,
            resultado: null,
            limite: "",
            conforme: null
          },
          equipamento_lancamento: "",
          superficie_tratada_limpa: null,
          adensamento_realizado: null,
          observacoes_lancamento: "",
          moldado_fiscalizacao: false,
          corpos_prova: []
        }]
      }));
    }
  };

  const removerCarga = (index) => {
    if (formData.cargas_concreto.length > 1) {
      setFormData(prev => ({
        ...prev,
        cargas_concreto: prev.cargas_concreto.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCargaChange = (index, field, value) => {
    setFormData(prev => {
      const newCargas = [...prev.cargas_concreto];

      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newCargas[index] = {
          ...newCargas[index],
          [parent]: {
            ...newCargas[index][parent],
            [child]: value
          }
        };

        // Conformidade automática para slump test quando resultado é alterado
        if (parent === 'slump_test' && child === 'resultado') {
          const conformidade = checkSlumpConformidade(value, prev.project_id);
          newCargas[index].slump_test.conforme = conformidade;
        }
      } else {
        newCargas[index] = { ...newCargas[index], [field]: value };
      }

      return { ...prev, cargas_concreto: newCargas };
    });
  };

  const handleCPConfigChange = (cargaIndex, diasRuptura, field, value) => {
    setFormData(prev => {
      const newCargas = [...prev.cargas_concreto];
      const carga = newCargas[cargaIndex];
      
      if (!carga.corpos_prova) {
        carga.corpos_prova = [];
      }

      // Buscar CPs existentes para esta data de ruptura
      const cpsExistentes = carga.corpos_prova.filter(cp => cp.dias_ruptura === diasRuptura);
      const quantidadeAtual = cpsExistentes.length;

      if (field === 'quantidade') {
        const novaQuantidade = parseInt(value) || 0;
        
        if (novaQuantidade > quantidadeAtual) {
          // Adicionar novos CPs
          const tipoRuptura = cpsExistentes.length > 0 ? cpsExistentes[0].tipo_ruptura : "compressao_axial";
          for (let i = 0; i < novaQuantidade - quantidadeAtual; i++) {
            carga.corpos_prova.push({
              dias_ruptura: diasRuptura,
              tipo_ruptura: tipoRuptura
            });
          }
        } else if (novaQuantidade < quantidadeAtual) {
          // Remover CPs excedentes desta data de ruptura
          let removidos = 0;
          carga.corpos_prova = carga.corpos_prova.filter(cp => {
            if (cp.dias_ruptura === diasRuptura && removidos < quantidadeAtual - novaQuantidade) {
              removidos++;
              return false;
            }
            return true;
          });
        }
      } else if (field === 'tipo_ruptura') {
        // Atualizar tipo de ruptura de todos os CPs desta data
        carga.corpos_prova = carga.corpos_prova.map(cp => {
          if (cp.dias_ruptura === diasRuptura) {
            return { ...cp, tipo_ruptura: value };
          }
          return cp;
        });
      }
      
      return { ...prev, cargas_concreto: newCargas };
    });
  };

  const getQuantidadeCPs = (cargaIndex, diasRuptura) => {
    const carga = formData.cargas_concreto[cargaIndex];
    if (!carga || !carga.corpos_prova) return 0;
    return carga.corpos_prova.filter(cp => cp.dias_ruptura === diasRuptura).length;
  };

  const getTipoRupturaCPs = (cargaIndex, diasRuptura) => {
    const carga = formData.cargas_concreto[cargaIndex];
    if (!carga || !carga.corpos_prova) return "compressao_axial";
    const cp = carga.corpos_prova.find(cp => cp.dias_ruptura === diasRuptura);
    return cp?.tipo_ruptura || "compressao_axial";
  };

  const adicionarCorpoProva = (cargaIndex, diasRuptura) => {
    setFormData(prev => {
      const newCargas = [...prev.cargas_concreto];
      const carga = { ...newCargas[cargaIndex] }; // Create a shallow copy of the carga object
      
      if (!Array.isArray(carga.corpos_prova)) {
        carga.corpos_prova = [];
      }
      
      carga.corpos_prova.push({
        dias_ruptura: diasRuptura,
        tipo_ruptura: "compressao_axial" // Default type
      });
      
      newCargas[cargaIndex] = carga; // Update the carga in the newCargas array
      return { ...prev, cargas_concreto: newCargas };
    });
  };

  const removerCorpoProva = (cargaIndex, cpIndex) => {
    setFormData(prev => {
      const newCargas = [...prev.cargas_concreto];
      const carga = { ...newCargas[cargaIndex] }; // Create a shallow copy of the carga object
      
      if (Array.isArray(carga.corpos_prova)) {
        carga.corpos_prova = carga.corpos_prova.filter((_, i) => i !== cpIndex);
      }
      
      newCargas[cargaIndex] = carga; // Update the carga in the newCargas array
      return { ...prev, cargas_concreto: newCargas };
    });
  };

  const handleCorpoProvaChange = (cargaIndex, cpIndex, field, value) => {
    setFormData(prev => {
      const newCargas = [...prev.cargas_concreto];
      const carga = { ...newCargas[cargaIndex] }; // Create a shallow copy of the carga object
      
      if (Array.isArray(carga.corpos_prova) && carga.corpos_prova[cpIndex]) {
        const updatedCorpoProva = {
          ...carga.corpos_prova[cpIndex],
          [field]: value
        };
        carga.corpos_prova = [...carga.corpos_prova]; // Create a shallow copy of the array itself
        carga.corpos_prova[cpIndex] = updatedCorpoProva;
      }
      
      newCargas[cargaIndex] = carga; // Update the carga in the newCargas array
      return { ...prev, cargas_concreto: newCargas };
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

    try {
      // Calcular conformidades antes de salvar
      const cargasAtualizadas = formData.cargas_concreto.map(carga => {
        const cargaAtualizada = { ...carga };
        
        // Calcular conformidade do slump test se tiver projeto selecionado
        if (carga.slump_test.resultado !== null && formData.project_id) {
          const selectedProject = projects.find(p => p.id === formData.project_id);
          if (selectedProject?.slump_minimo != null && selectedProject?.slump_maximo != null) {
            const val = parseFloat(carga.slump_test.resultado);
            cargaAtualizada.slump_test = {
              ...carga.slump_test,
              conforme: val >= selectedProject.slump_minimo && val <= selectedProject.slump_maximo
            };
          }
        }

        // Espessura - conformidade manual já definida pelo usuário

        return cargaAtualizada;
      });

      // Validações obrigatórias apenas quando finalizando
      if (saveStatus === 'finalizado') {
        if (!formData.empreiteira?.trim()) {
          alert("Por favor, preencha o campo Empreiteira.");
          setSaving(false);
          return;
        }

        if (!formData.rodovia?.trim()) {
          alert("Por favor, preencha o campo Rodovia.");
          setSaving(false);
          return;
        }

        if (!formData.trecho?.trim()) {
          alert("Por favor, preencha o campo Trecho.");
          setSaving(false);
          return;
        }

        if (!formData.estrutura?.trim()) {
          alert("Por favor, preencha o campo Estrutura.");
          setSaving(false);
          return;
        }

        // Validar temperaturas dos períodos climáticos
        for (let i = 0; i < formData.periodos_clima.length; i++) {
          const periodo = formData.periodos_clima[i];
          if (!periodo.temperatura_ambiente || periodo.temperatura_ambiente === '') {
            alert(`Por favor, preencha a temperatura do período ${periodo.periodo === 'manha' ? 'Manhã' : periodo.periodo === 'tarde' ? 'Tarde' : 'Noite'}.`);
            setSaving(false);
            return;
          }
        }

        // Validar moldagem para fiscalização
        for (let i = 0; i < formData.cargas_concreto.length; i++) {
          const carga = formData.cargas_concreto[i];
          if (carga.moldado_fiscalizacao) {
            if (!carga.corpos_prova || carga.corpos_prova.length === 0) {
              alert(`Por favor, configure ao menos 1 corpo de prova para a Carga ${carga.numero_carga}.`);
              setSaving(false);
              return;
            }
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
        fck: formData.fck ? parseFloat(formData.fck) : null,
        volume: formData.volume ? parseFloat(formData.volume) : null,
        periodos_clima: formData.periodos_clima.map(p => ({
          ...p,
          temperatura_ambiente: p.temperatura_ambiente ? parseFloat(p.temperatura_ambiente) : null
        })),
        cargas_concreto: cargasAtualizadas.map(c => ({
          ...c,
          slump_test: {
            ...c.slump_test,
            resultado: c.slump_test.resultado !== null && c.slump_test.resultado !== "" ? parseFloat(c.slump_test.resultado) : null
          },
          espessura_camada: {
            ...c.espessura_camada,
            resultado: c.espessura_camada.resultado !== null && c.espessura_camada.resultado !== "" ? parseFloat(c.espessura_camada.resultado) : null
          },
          corpos_prova: c.corpos_prova.map(cp => ({
            ...cp,
            dias_ruptura: cp.dias_ruptura !== null && cp.dias_ruptura !== "" ? parseInt(cp.dias_ruptura) : null
          }))
        }))
      };

      await base44.entities.ChecklistConcretagem.create(dataToSave);
      alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Checklist de Concretagem salvo com sucesso!");
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

  const selectedProject = projects.find(p => p.id === formData.project_id);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Novo Checklist de Concretagem</CardTitle>
            <CardDescription>Controle Tecnológico de Concreto</CardDescription>
            {formData.status === 'rascunho' && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800">Em Rascunho</p>
                  <p className="text-sm text-blue-700">Este registro ainda está em edição e não será visível aos gestores até que você o finalize.</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6">

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
                      <Label htmlFor="project_id">Carta Traço de Concreto</Label>
                      <select
                        id="project_id"
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione a carta traço</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Label htmlFor="concreteira">Concreteira *</Label>
                      <Input
                        id="concreteira"
                        value={formData.concreteira}
                        onChange={(e) => setFormData({ ...formData, concreteira: e.target.value })}
                        required
                        placeholder="Nome da concreteira"
                      />
                    </div>

                    <div>
                      <Label htmlFor="empreiteira">Empreiteira *</Label>
                      <Input
                        id="empreiteira"
                        value={formData.empreiteira}
                        onChange={(e) => setFormData({ ...formData, empreiteira: e.target.value })}
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
                        placeholder="Nome da rodovia"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="trecho">Trecho *</Label>
                      <Input
                        id="trecho"
                        value={formData.trecho}
                        onChange={(e) => setFormData({ ...formData, trecho: e.target.value })}
                        placeholder="Descrição do trecho"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="volume">Volume (m³)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        id="volume"
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fck">Fck (MPa)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        id="fck"
                        value={formData.fck}
                        onChange={(e) => setFormData({ ...formData, fck: e.target.value })}
                        placeholder="Ex: 25"
                      />
                    </div>

                    <div>
                      <Label htmlFor="estrutura">Estrutura *</Label>
                      <Input
                        id="estrutura"
                        value={formData.estrutura}
                        onChange={(e) => setFormData({ ...formData, estrutura: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="engenheiro_responsavel">Engenheiro Responsável</Label>
                      <Input
                        id="engenheiro_responsavel"
                        value={formData.engenheiro_responsavel}
                        onChange={(e) => setFormData({ ...formData, engenheiro_responsavel: e.target.value })}
                        placeholder="Preenchido automaticamente"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="inspetor_campo">Inspetor Campo</Label>
                    <Input
                      id="inspetor_campo"
                      value={formData.inspetor_campo}
                      onChange={(e) => setFormData({ ...formData, inspetor_campo: e.target.value })}
                    />
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

              {/* CARGAS DE CONCRETO */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Cargas de Concreto</CardTitle>
                    {formData.cargas_concreto.length < 10 && (
                      <Button type="button" onClick={adicionarCarga} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Carga
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.cargas_concreto.map((carga, index) => (
                    <Card key={index} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Carga {carga.numero_carga}</CardTitle>
                          {formData.cargas_concreto.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerCarga(index)}
                              className="text-red-500 hover:text-red-700 p-0 h-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        {/* Recebimento do Concreto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nota Fiscal Nº</Label>
                            <Input
                              value={carga.nota_fiscal}
                              onChange={(e) => handleCargaChange(index, 'nota_fiscal', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Placa da Betoneira</Label>
                            <Input
                              value={carga.placa_betoneira}
                              onChange={(e) => handleCargaChange(index, 'placa_betoneira', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Horário Início</Label>
                            <Input
                              type="time"
                              value={carga.horario_inicio}
                              onChange={(e) => handleCargaChange(index, 'horario_inicio', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Horário Término</Label>
                            <Input
                              type="time"
                              value={carga.horario_termino}
                              onChange={(e) => handleCargaChange(index, 'horario_termino', e.target.value)}
                            />
                          </div>
                          {/* Jornada field for each carga */}
                          <div>
                            <Label>Jornada</Label>
                            <Input
                              value={carga.jornada}
                              onChange={(e) => handleCargaChange(index, 'jornada', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Ensaios em formato de tabela */}
                        <div className="border-t pt-4 mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Ensaios de Qualidade</h4>
                            <p className="text-xs text-slate-600 italic">Determinar a conformidade dos parâmetros</p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-sm">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 px-2 py-2 text-left font-medium">Ensaio</th>
                                  <th className="border border-slate-300 px-2 py-2 text-center font-medium w-24">Realizado</th>
                                  <th className="border border-slate-300 px-2 py-2 text-center font-medium">Resultado (cm)</th>
                                  <th className="border border-slate-300 px-2 py-2 text-center font-medium">Padrão do Projeto</th>
                                  <th className="border border-slate-300 px-2 py-2 text-center font-medium w-24">Conformidade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Slump Test */}
                                <tr>
                                  <td className="border border-slate-300 px-2 py-2 font-medium bg-slate-50">Slump Test</td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={carga.slump_test.realizado}
                                      onChange={(e) => handleCargaChange(index, 'slump_test.realizado', e.target.checked)}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                  <td className="border border-slate-300 px-1 py-1">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={carga.slump_test.resultado || ''}
                                      onChange={(e) => handleCargaChange(index, 'slump_test.resultado', e.target.value)}
                                      disabled={!carga.slump_test.realizado || !selectedProject}
                                      className="h-8 text-sm"
                                      placeholder="Resultado"
                                    />
                                  </td>
                                  <td className={`border border-slate-300 px-2 py-1 text-center text-xs ${selectedProject ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                                    {carga.slump_test.limite || 'N/A'}
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    {carga.slump_test.realizado ? (
                                      carga.slump_test.conforme === true ? (
                                        <span className="text-green-600 font-bold text-xl">✓</span>
                                      ) : carga.slump_test.conforme === false ? (
                                        <span className="text-red-600 font-bold text-xl">✗</span>
                                      ) : (
                                        <span className="text-slate-500">-</span>
                                      )
                                    ) : (
                                      <span className="text-slate-500">-</span>
                                    )}
                                  </td>
                                </tr>

                                {/* Espessura da Camada */}
                                <tr>
                                  <td className="border border-slate-300 px-2 py-2 font-medium bg-slate-50">Espessura da Camada</td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={carga.espessura_camada.realizado}
                                      onChange={(e) => handleCargaChange(index, 'espessura_camada.realizado', e.target.checked)}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                  <td className="border border-slate-300 px-1 py-1">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={carga.espessura_camada.resultado || ''}
                                      onChange={(e) => handleCargaChange(index, 'espessura_camada.resultado', e.target.value)}
                                      disabled={!carga.espessura_camada.realizado}
                                      className="h-8 text-sm"
                                      placeholder="Resultado"
                                    />
                                  </td>
                                  <td className="border border-slate-300 px-1 py-1">
                                    <Input
                                      value={carga.espessura_camada.limite}
                                      onChange={(e) => handleCargaChange(index, 'espessura_camada.limite', e.target.value)}
                                      disabled={!carga.espessura_camada.realizado}
                                      className="h-8 text-sm"
                                      placeholder="Limite manual"
                                    />
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    <div className="flex gap-2 justify-center">
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={carga.espessura_camada.conforme === true}
                                          onChange={(e) => {
                                            const newValue = e.target.checked ? true : null;
                                            handleCargaChange(index, 'espessura_camada.conforme', newValue);
                                          }}
                                          disabled={!carga.espessura_camada.realizado}
                                          className="w-4 h-4 accent-green-500"
                                        />
                                        <span className="text-xs text-green-600">✓</span>
                                      </label>
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={carga.espessura_camada.conforme === false}
                                          onChange={(e) => {
                                            const newValue = e.target.checked ? false : null;
                                            handleCargaChange(index, 'espessura_camada.conforme', newValue);
                                          }}
                                          disabled={!carga.espessura_camada.realizado}
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

                          <div className="mt-3">
                            <Label>Equipamento de Lançamento</Label>
                            <select
                              value={carga.equipamento_lancamento}
                              onChange={(e) => handleCargaChange(index, 'equipamento_lancamento', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione</option>
                              <option value="convencional">Convencional</option>
                              <option value="bombeado">Bombeado</option>
                            </select>
                          </div>
                        </div>

                        {/* Acompanhamento Lançamento */}
                        <div className="border-t pt-4 space-y-3 mt-4">
                          <h4 className="font-semibold">Acompanhamento Lançamento Concreto</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-sm">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 px-2 py-2 text-left font-medium">Serviço</th>
                                  <th className="border border-slate-300 px-2 py-2 text-center font-medium w-20">Sim</th>
                                  <th className="border border-slate-300 px-2 py-2 text-center font-medium w-20">Não</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-slate-300 px-2 py-2 font-medium bg-slate-50">
                                    A superfície foi tratada e limpa?
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={carga.superficie_tratada_limpa === true}
                                      onChange={(e) => handleCargaChange(index, 'superficie_tratada_limpa', e.target.checked ? true : null)}
                                      className="w-4 h-4 accent-green-500"
                                    />
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={carga.superficie_tratada_limpa === false}
                                      onChange={(e) => handleCargaChange(index, 'superficie_tratada_limpa', e.target.checked ? false : null)}
                                      className="w-4 h-4 accent-red-500"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-slate-300 px-2 py-2 font-medium bg-slate-50">
                                    Foi realizado adensamento do concreto?
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={carga.adensamento_realizado === true}
                                      onChange={(e) => handleCargaChange(index, 'adensamento_realizado', e.target.checked ? true : null)}
                                      className="w-4 h-4 accent-green-500"
                                    />
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={carga.adensamento_realizado === false}
                                      onChange={(e) => handleCargaChange(index, 'adensamento_realizado', e.target.checked ? false : null)}
                                      className="w-4 h-4 accent-red-500"
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3">
                            <Label htmlFor={`obs_lancamento_${index}`}>Observações</Label>
                            <Textarea
                              id={`obs_lancamento_${index}`}
                              value={carga.observacoes_lancamento}
                              onChange={(e) => handleCargaChange(index, 'observacoes_lancamento', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* Moldes para Fiscalização - NOVA ESTRUTURA */}
                        <div className="border-t pt-4 space-y-3 mt-4">
                          <h4 className="font-semibold">Moldes para Fiscalização</h4>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`moldado_fiscalizacao_${index}`}
                              checked={carga.moldado_fiscalizacao}
                              onChange={(e) => {
                                const newValue = e.target.checked;
                                handleCargaChange(index, 'moldado_fiscalizacao', newValue);
                                if (!newValue) {
                                  // Limpar corpos de prova se desmarcar
                                  setFormData(prev => {
                                    const newCargas = [...prev.cargas_concreto];
                                    newCargas[index].corpos_prova = [];
                                    return { ...prev, cargas_concreto: newCargas };
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <Label htmlFor={`moldado_fiscalizacao_${index}`} className="text-sm cursor-pointer">Moldado para Fiscalização</Label>
                          </div>

                          {carga.moldado_fiscalizacao && (
                            <div className="mt-3 space-y-3">
                              <Label className="font-semibold">Configuração dos Corpos de Prova</Label>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-slate-300 text-sm">
                                  <thead className="bg-slate-100">
                                    <tr>
                                      <th className="border border-slate-300 p-2 text-center font-medium">Dias para Ruptura</th>
                                      <th className="border border-slate-300 p-2 text-center font-medium">Quantidade de CPs</th>
                                      <th className="border border-slate-300 p-2 text-center font-medium">Tipo de Ruptura</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[3, 7, 28].map((dias) => (
                                      <tr key={dias}>
                                        <td className="border border-slate-300 p-2 text-center font-medium bg-slate-50">
                                          {dias} dias
                                        </td>
                                        <td className="border border-slate-300 p-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={getQuantidadeCPs(index, dias)}
                                            onChange={(e) => handleCPConfigChange(index, dias, 'quantidade', e.target.value)}
                                            className="h-9 text-center"
                                            placeholder="0"
                                          />
                                        </td>
                                        <td className="border border-slate-300 p-2">
                                          <select
                                            value={getTipoRupturaCPs(index, dias)}
                                            onChange={(e) => handleCPConfigChange(index, dias, 'tipo_ruptura', e.target.value)}
                                            disabled={getQuantidadeCPs(index, dias) === 0}
                                            className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm"
                                          >
                                            <option value="compressao_axial">Compressão Axial</option>
                                            <option value="comp_diametral">Compressão Diametral</option>
                                            <option value="tracao_flexao">Tração na Flexão</option>
                                          </select>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {carga.corpos_prova && carga.corpos_prova.length > 0 && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-sm text-blue-800">
                                    <strong>Total de CPs moldados:</strong> {carga.corpos_prova.length}
                                    {carga.corpos_prova.filter(cp => cp.dias_ruptura === 3).length > 0 && 
                                      ` | 3 dias: ${carga.corpos_prova.filter(cp => cp.dias_ruptura === 3).length}`}
                                    {carga.corpos_prova.filter(cp => cp.dias_ruptura === 7).length > 0 && 
                                      ` | 7 dias: ${carga.corpos_prova.filter(cp => cp.dias_ruptura === 7).length}`}
                                    {carga.corpos_prova.filter(cp => cp.dias_ruptura === 28).length > 0 && 
                                      ` | 28 dias: ${carga.corpos_prova.filter(cp => cp.dias_ruptura === 28).length}`}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))}>
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
                  disabled={saving || uploadingPhotos || !formData.obra_id || !formData.data || !formData.concreteira}
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