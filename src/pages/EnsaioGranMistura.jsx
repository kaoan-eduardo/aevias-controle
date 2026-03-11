import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

const PENEIRAS_MAP = {
  "peneira_75_0mm": { astm: "3\"", mm: "75,0" },
  "peneira_63_0mm": { astm: "2 1/2\"", mm: "63,0" },
  "peneira_50_0mm": { astm: "2\"", mm: "50,0" },
  "peneira_37_5mm": { astm: "1 1/2\"", mm: "37,5" },
  "peneira_25_0mm": { astm: "1\"", mm: "25,0" },
  "peneira_19_0mm": { astm: "3/4\"", mm: "19,0" },
  "peneira_16_0mm": { astm: "5/8\"", mm: "16,0" },
  "peneira_12_5mm": { astm: "1/2\"", mm: "12,5" },
  "peneira_9_5mm": { astm: "3/8\"", mm: "9,5" },
  "peneira_4_75mm": { astm: "#4", mm: "4,75" },
  "peneira_2_36mm": { astm: "#8", mm: "2,36" },
  "peneira_2_0mm": { astm: "#10", mm: "2,0" },
  "peneira_1_18mm": { astm: "#16", mm: "1,18" },
  "peneira_0_6mm": { astm: "#30", mm: "0,6" },
  "peneira_0_42mm": { astm: "#40", mm: "0,42" },
  "peneira_0_3mm": { astm: "#50", mm: "0,3" },
  "peneira_0_18mm": { astm: "#100", mm: "0,18" },
  "peneira_0_15mm": { astm: "#100", mm: "0,15" },
  "peneira_0_075mm": { astm: "#200", mm: "0,075" }
};

const getInitialFormData = () => ({
  obra_id: "",
  project_id: "",
  data_ensaio: new Date().toISOString().split('T')[0],
  cliente: "",
  camada: "",
  faixa: "",
  material: "",
  placa_caminhao: "",
  rodovia: "",
  pedreira: "",
  local_coleta: "",
  trecho: "",
  numero_projeto: "",
  peso_amostra: "",
  granulometria: {},
  umidade_mistura: {
    peso_umido: "",
    peso_seco: "",
    peso_agua: "",
    umidade: ""
  },
  equivalente_areia: {
    topo_argila: "",
    topo_areia: "",
    equivalente: "",
    media: ""
  },
  materiais_pulverulentos: {
    peso_inicial: "",
    peso_apos_lavagem: "",
    teor_pulverulentos: ""
  },
  observacoes: "",
  status: "rascunho"
});

export default function EnsaioGranMisturaPage() {
  const [formData, setFormData] = useState(getInitialFormData());
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [faixasGranulometricas, setFaixasGranulometricas] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingEnsaio, setEditingEnsaio] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [location.search]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [obrasData, regionaisData, projectsData, faixasData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Regional.list(),
        base44.entities.Project.list(),
        base44.entities.FaixaGranulometrica.list()
      ]);

      const userAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');
      let availableObras = obrasData;

      if (userAccessLevel === 'user') {
        const regionalDoLaboratorista = regionaisData.find(regional => {
          const laboratoristas = regional.laboratoristas_responsaveis || [];
          return laboratoristas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
        });

        if (regionalDoLaboratorista) {
          availableObras = obrasData.filter(obra => 
            obra.regional_id === regionalDoLaboratorista.id &&
            obra.status === 'em_andamento' &&
            (obra.tipo_obra === 'conservacao' || obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'supervisao')
          );
        } else {
          availableObras = [];
        }
      } else {
        availableObras = obrasData.filter(obra => 
          obra.tipo_obra === 'conservacao' || obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'supervisao'
        );
      }

      setObras(availableObras);
      setRegionais(regionaisData);
      setProjects(projectsData);
      setFaixasGranulometricas(faixasData);

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const ensaioToEdit = await base44.entities.EnsaioGranMistura.get(editId);
        setEditingEnsaio(ensaioToEdit);

        if (currentUser.role === 'admin' || (ensaioToEdit.created_by === currentUser.email && (ensaioToEdit.status === 'rascunho' || ensaioToEdit.approved === false))) {
          setFormData({
            ...ensaioToEdit,
            data_ensaio: ensaioToEdit.data_ensaio ? new Date(ensaioToEdit.data_ensaio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          });

          if (ensaioToEdit.project_id) {
            const proj = projectsData.find(p => p.id === ensaioToEdit.project_id);
            setSelectedProject(proj);
          }
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
          return;
        }
      } else {
        const initialData = getInitialFormData();
        if (availableObras.length > 0) {
          initialData.obra_id = availableObras[0].id;
        }
        setFormData(initialData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.obra_id) {
      const obraSelecionada = obras.find(o => o.id === formData.obra_id);
      if (obraSelecionada) {
        const regionalSelecionada = regionais.find(r => r.id === obraSelecionada.regional_id);
        
        // Preencher cliente automaticamente
        if (regionalSelecionada?.cliente && !formData.project_id) {
          handleChange('cliente', regionalSelecionada.cliente);
        }
        
        if (regionalSelecionada?.project_ids) {
          let projsFiltered = projects.filter(p => regionalSelecionada.project_ids.includes(p.id));
          
          if (formData.material) {
            projsFiltered = projsFiltered.filter(p => p.tipo_projeto === formData.material);
          }
          
          setFilteredProjects(projsFiltered);
        } else {
          setFilteredProjects([]);
        }
      } else {
        setFilteredProjects([]);
      }
    } else {
      setFilteredProjects([]);
    }
  }, [formData.material, formData.obra_id, obras, regionais, projects]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (formData.project_id) {
        const proj = projects.find(p => p.id === formData.project_id);
        setSelectedProject(proj);

        if (proj) {
          const obraSelecionada = obras.find(o => o.id === formData.obra_id);
          const regionalSelecionada = regionais.find(r => r.id === obraSelecionada?.regional_id);

          handleChange('cliente', regionalSelecionada?.cliente || "");

          if (proj.faixa_granulometrica_id) {
            try {
              const faixa = await base44.entities.FaixaGranulometrica.get(proj.faixa_granulometrica_id);
              handleChange('faixa', faixa.nome);
            } catch (error) {
              console.error("Erro ao carregar faixa:", error);
            }
          }

          if (proj.agregados && proj.agregados.length > 0) {
            const pedreiras = [...new Set(proj.agregados.map(a => a.pedreira).filter(Boolean))];
            handleChange('pedreira', pedreiras.join(' + '));
          }
        }
      } else {
        setSelectedProject(null);
      }
    };

    loadProjectData();
  }, [formData.project_id, projects, obras, regionais]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPeneirasVisiveis = () => {
    // Se houver projeto selecionado, usar a faixa do projeto
    if (selectedProject?.faixa_granulometrica_id && faixasGranulometricas.length > 0) {
      const faixa = faixasGranulometricas.find(f => f.id === selectedProject.faixa_granulometrica_id);
      if (faixa?.peneiras) {
        return faixa.peneiras.map(p => {
          const mmValue = p.abertura.replace(',', '_').replace('.', '_');
          return `peneira_${mmValue}mm`;
        });
      }
    }
    
    // Se não houver projeto, mas houver faixa selecionada manualmente
    if (!formData.project_id && formData.faixa && faixasGranulometricas.length > 0) {
      const faixa = faixasGranulometricas.find(f => f.nome === formData.faixa);
      if (faixa?.peneiras) {
        return faixa.peneiras.map(p => {
          const mmValue = p.abertura.replace(',', '_').replace('.', '_');
          return `peneira_${mmValue}mm`;
        });
      }
    }
    
    return Object.keys(PENEIRAS_MAP);
  };

  const handleGranulometriaChange = (peneira, field, value) => {
    const newGranulometria = { ...formData.granulometria };
    if (!newGranulometria[peneira]) {
      newGranulometria[peneira] = {};
    }
    newGranulometria[peneira][field] = value;

    if (field === 'retido' && formData.peso_amostra) {
      const pesoAmostra = parseFloat(formData.peso_amostra) || 0;
      const peneirasVisiveis = getPeneirasVisiveis();

      let retidoAcumulado = 0;
      peneirasVisiveis.forEach(pKey => {
        const retido = parseFloat(newGranulometria[pKey]?.retido) || 0;
        retidoAcumulado += retido;
        const passante = pesoAmostra - retidoAcumulado;
        const percentualPassante = pesoAmostra > 0 ? ((passante / pesoAmostra) * 100).toFixed(2) : "0.00";
        
        if (!newGranulometria[pKey]) {
          newGranulometria[pKey] = {};
        }
        newGranulometria[pKey].passante = passante.toFixed(2);
        newGranulometria[pKey].percentual_passante = percentualPassante;
      });
    }

    setFormData(prev => ({ ...prev, granulometria: newGranulometria }));
  };

  const handleUmidadeChange = (field, value) => {
    const newUmidade = { ...formData.umidade_mistura, [field]: value };

    if (field === 'peso_umido' || field === 'peso_seco') {
      const pesoUmido = parseFloat(newUmidade.peso_umido) || 0;
      const pesoSeco = parseFloat(newUmidade.peso_seco) || 0;
      if (pesoUmido && pesoSeco) {
        newUmidade.peso_agua = (pesoUmido - pesoSeco).toFixed(2);
        newUmidade.umidade = pesoSeco > 0 ? (((pesoUmido - pesoSeco) / pesoSeco) * 100).toFixed(2) : "";
      }
    }

    setFormData(prev => ({ ...prev, umidade_mistura: newUmidade }));
  };

  const handleEquivalenteChange = (field, value) => {
    const newEquivalente = { ...formData.equivalente_areia, [field]: value };

    if (field === 'topo_argila' || field === 'topo_areia') {
      const h1 = parseFloat(newEquivalente.topo_argila) || 0;
      const h2 = parseFloat(newEquivalente.topo_areia) || 0;
      if (h1 && h2) {
        newEquivalente.equivalente = ((h2 / h1) * 100).toFixed(2);
        newEquivalente.media = newEquivalente.equivalente;
      }
    }

    setFormData(prev => ({ ...prev, equivalente_areia: newEquivalente }));
  };

  const handlePulverulentosChange = (field, value) => {
    const newPulverulentos = { ...formData.materiais_pulverulentos, [field]: value };

    if (field === 'peso_inicial' || field === 'peso_apos_lavagem') {
      const pesoInicial = parseFloat(newPulverulentos.peso_inicial) || 0;
      const pesoApos = parseFloat(newPulverulentos.peso_apos_lavagem) || 0;
      if (pesoInicial && pesoApos) {
        newPulverulentos.teor_pulverulentos = pesoInicial > 0 ? (((pesoInicial - pesoApos) / pesoInicial) * 100).toFixed(2) : "";
      }
    }

    setFormData(prev => ({ ...prev, materiais_pulverulentos: newPulverulentos }));
  };

  const handleSubmit = async (e, saveStatus = 'finalizado') => {
    e.preventDefault();

    if (saveStatus === 'finalizado') {
      if (!formData.obra_id || !formData.material || !formData.data_ensaio) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
    }

    const dataToSave = { ...formData, status: saveStatus };

    try {
      if (editingEnsaio?.id) {
        const updateData = { ...dataToSave };
        let successMessage = saveStatus === 'rascunho' ? "Progresso salvo!" : "Ensaio finalizado!";

        if (editingEnsaio.approved === false && saveStatus === 'finalizado') {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
          updateData.was_rejected = true;
          successMessage = "Ensaio atualizado! Voltará para análise.";
        }

        await base44.entities.EnsaioGranMistura.update(editingEnsaio.id, updateData);
        alert(successMessage);
      } else {
        await base44.entities.EnsaioGranMistura.create({ 
          ...dataToSave, 
          created_by: user.email, 
          laboratorista_name: user.laboratorista_name || user.full_name 
        });
        alert(saveStatus === 'rascunho' ? "Progresso salvo!" : "Ensaio criado!");
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar o ensaio.");
    }
  };

  const isApproved = formData.approved === true;
  const userCanEdit = user?.role === 'admin' || (formData.created_by === user?.email && formData.approved !== true);
  const isEditable = !editingEnsaio?.id || userCanEdit;

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const peneirasVisiveis = getPeneirasVisiveis();

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingEnsaio?.id ? "Editar Granulometria da Mistura" : "Nova Granulometria da Mistura"}</CardTitle>
            <CardDescription>
              {editingEnsaio?.id ? `Editando ensaio de ${new Date(editingEnsaio.data_ensaio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : "Análise Granulométrica da Mistura - Método DNIT 412/25-ME"}
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
            {formData.rejection_reason && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{formData.rejection_reason}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* DADOS DA OBRA */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dados da Obra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Cliente</Label>
                      <Input
                        value={formData.cliente}
                        onChange={(e) => handleChange('cliente', e.target.value)}
                        disabled={!isEditable || isApproved || !!formData.project_id}
                        placeholder="Automático se selecionar projeto"
                      />
                    </div>
                    <div>
                      <Label>Camada</Label>
                      <Input
                        value={formData.camada}
                        onChange={(e) => handleChange('camada', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                    <div>
                      <Label>Faixa</Label>
                      {formData.project_id ? (
                        <Input
                          value={formData.faixa}
                          disabled
                          placeholder="Automático com projeto"
                        />
                      ) : (
                        <Select
                          value={formData.faixa}
                          onValueChange={(value) => handleChange('faixa', value)}
                          disabled={!isEditable || isApproved}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar faixa" />
                          </SelectTrigger>
                          <SelectContent>
                            {faixasGranulometricas
                              .filter(f => formData.material && f.tipo === formData.material)
                              .map(faixa => (
                                <SelectItem key={faixa.id} value={faixa.nome}>
                                  {faixa.nome}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Obra *</Label>
                      <Select
                        value={formData.obra_id}
                        onValueChange={(value) => handleChange('obra_id', value)}
                        disabled={!isEditable || isApproved || !!editingEnsaio?.id}
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
                      <Label>Material *</Label>
                      <Select
                        value={formData.material}
                        onValueChange={(value) => {
                          handleChange('material', value);
                          handleChange('project_id', '');
                        }}
                        disabled={!isEditable || isApproved || !!editingEnsaio?.id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MRAF">MRAF</SelectItem>
                          <SelectItem value="BGS">BGS</SelectItem>
                          <SelectItem value="CAMADAS_GRANULARES">Camadas Granulares</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Placa Caminhão</Label>
                      <Input
                        value={formData.placa_caminhao}
                        onChange={(e) => handleChange('placa_caminhao', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                  </div>

                  {formData.material && (
                    <div>
                      <Label>Projeto</Label>
                      <Select
                        value={formData.project_id}
                        onValueChange={(value) => handleChange('project_id', value)}
                        disabled={!isEditable || isApproved}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o projeto (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredProjects.map(proj => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Rodovia</Label>
                      <Select
                        value={formData.rodovia}
                        onValueChange={(value) => handleChange('rodovia', value)}
                        disabled={!isEditable || isApproved}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a rodovia" />
                        </SelectTrigger>
                        <SelectContent>
                          {obras.find(o => o.id === formData.obra_id)?.rodovias?.map(rodovia => (
                            <SelectItem key={rodovia} value={rodovia}>
                              {rodovia}
                            </SelectItem>
                          )) || <SelectItem value={null} disabled>Nenhuma rodovia cadastrada</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Pedreira</Label>
                      <Input
                        value={formData.pedreira}
                        onChange={(e) => handleChange('pedreira', e.target.value)}
                        disabled={!isEditable || isApproved || !!formData.project_id}
                        placeholder="Automático se projeto"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Local de Coleta</Label>
                      <Input
                        value={formData.local_coleta}
                        onChange={(e) => handleChange('local_coleta', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label>Trecho</Label>
                      <Input
                        value={formData.trecho}
                        onChange={(e) => handleChange('trecho', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>

                    <div>
                      <Label>Nº Projeto</Label>
                      <Input
                        value={formData.numero_projeto}
                        onChange={(e) => handleChange('numero_projeto', e.target.value)}
                        disabled={!isEditable || isApproved}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Data do Ensaio *</Label>
                    <Input
                      type="date"
                      value={formData.data_ensaio}
                      onChange={(e) => handleChange('data_ensaio', e.target.value)}
                      disabled={!isEditable || isApproved}
                    />
                  </div>

                  <div>
                    <Label>Laboratorista</Label>
                    <Input
                      value={formData.laboratorista_name || user?.laboratorista_name || user?.full_name || ""}
                      disabled
                      placeholder="Automático"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* GRANULOMETRIA DA MISTURA */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Granulometria da Mistura</CardTitle>
                  <CardDescription>Método de Ensaio DNIT 412/25 - ME</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Peso da Amostra (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.peso_amostra}
                      onChange={(e) => {
                        handleChange('peso_amostra', e.target.value);
                        if (formData.granulometria && Object.keys(formData.granulometria).length > 0) {
                          const pesoAmostra = parseFloat(e.target.value) || 0;
                          const newGran = { ...formData.granulometria };
                          const peneiras = getPeneirasVisiveis();
                          let retidoAcumulado = 0;
                          peneiras.forEach(pKey => {
                            const retido = parseFloat(newGran[pKey]?.retido) || 0;
                            retidoAcumulado += retido;
                            const passante = pesoAmostra - retidoAcumulado;
                            const percentualPassante = pesoAmostra > 0 ? ((passante / pesoAmostra) * 100).toFixed(2) : "0.00";
                            if (!newGran[pKey]) newGran[pKey] = {};
                            newGran[pKey].passante = passante.toFixed(2);
                            newGran[pKey].percentual_passante = percentualPassante;
                          });
                          setFormData(prev => ({ ...prev, granulometria: newGran }));
                        }
                      }}
                      disabled={!isEditable || isApproved}
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border text-sm">
                      <thead className="bg-slate-200">
                        <tr>
                          <th className="border p-2">PENEIRA</th>
                          <th className="border p-2">ASTM</th>
                          <th className="border p-2">(mm)</th>
                          <th className="border p-2">RETIDO (g)</th>
                          <th className="border p-2">PASS. (g)</th>
                          <th className="border p-2">% PASS.</th>
                          <th className="border p-2 bg-blue-100">FX. TRAB. MÍN. (%)</th>
                          <th className="border p-2 bg-blue-100">FX. TRAB. MÁX. (%)</th>
                          <th className="border p-2 bg-green-100">ESP. MÍN. (%)</th>
                          <th className="border p-2 bg-green-100">ESP. MÁX. (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {peneirasVisiveis.map((peneiraKey, index) => {
                          const peneiraInfo = PENEIRAS_MAP[peneiraKey];
                          const fxTrabalhoMin = selectedProject?.faixa_trabalho_min?.[peneiraKey];
                          const fxTrabalhoMax = selectedProject?.faixa_trabalho_max?.[peneiraKey];
                          
                          let espMin = null;
                          let espMax = null;
                          if (selectedProject?.faixa_granulometrica_id) {
                            const faixa = faixasGranulometricas.find(f => f.id === selectedProject.faixa_granulometrica_id);
                            if (faixa?.peneiras) {
                              const peneira = faixa.peneiras.find(p => p.abertura === peneiraInfo.mm);
                              if (peneira) {
                                espMin = peneira.min;
                                espMax = peneira.max;
                              }
                            }
                          }

                          return (
                            <tr key={peneiraKey} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border p-2 font-medium">{index + 1}</td>
                              <td className="border p-2">{peneiraInfo.astm}</td>
                              <td className="border p-2">{peneiraInfo.mm}</td>
                              <td className="border p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formData.granulometria?.[peneiraKey]?.retido || ""}
                                  onChange={(e) => handleGranulometriaChange(peneiraKey, 'retido', e.target.value)}
                                  disabled={!isEditable || isApproved}
                                  className="h-8"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formData.granulometria?.[peneiraKey]?.passante || ""}
                                  disabled
                                  className="h-8 bg-gray-50"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formData.granulometria?.[peneiraKey]?.percentual_passante || ""}
                                  disabled
                                  className="h-8 bg-gray-50"
                                />
                              </td>
                              <td className="border p-2 bg-blue-50 text-center">{fxTrabalhoMin || "—"}</td>
                              <td className="border p-2 bg-blue-50 text-center">{fxTrabalhoMax || "—"}</td>
                              <td className="border p-2 bg-green-50 text-center">{espMin || "—"}</td>
                              <td className="border p-2 bg-green-50 text-center">{espMax || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* DETERMINAÇÕES COMPLEMENTARES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* UMIDADE DA MISTURA */}
                <Card className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Determinação de Umidade da Mistura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Peso Úmido (g)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.umidade_mistura.peso_umido}
                        onChange={(e) => handleUmidadeChange('peso_umido', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                    <div>
                      <Label>Peso Seco (g)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.umidade_mistura.peso_seco}
                        onChange={(e) => handleUmidadeChange('peso_seco', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                    <div>
                      <Label>Peso Água (g)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.umidade_mistura.peso_agua}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>Umidade (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.umidade_mistura.umidade}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* EQUIVALENTE DE AREIA */}
                <Card className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Determinação de Equivalente de Areia</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Topo de Argila</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.equivalente_areia.topo_argila}
                        onChange={(e) => handleEquivalenteChange('topo_argila', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                    <div>
                      <Label>Topo de Areia</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.equivalente_areia.topo_areia}
                        onChange={(e) => handleEquivalenteChange('topo_areia', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                    <div>
                      <Label>Equivalente de Areia</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.equivalente_areia.equivalente}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>Média</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.equivalente_areia.media}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* MATERIAIS PULVERULENTOS */}
                <Card className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Determinação de Materiais Pulverulentos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Peso Inicial (g)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.materiais_pulverulentos.peso_inicial}
                        onChange={(e) => handlePulverulentosChange('peso_inicial', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                    <div>
                      <Label>Peso Após Lavagem (g)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.materiais_pulverulentos.peso_apos_lavagem}
                        onChange={(e) => handlePulverulentosChange('peso_apos_lavagem', e.target.value)}
                        disabled={!isEditable || isApproved}
                      />
                    </div>
                    <div>
                      <Label>Teor de Materiais Pulverulentos (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.materiais_pulverulentos.teor_pulverulentos}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* OBSERVAÇÕES */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  disabled={!isEditable || isApproved}
                  rows={3}
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))}>
                  Cancelar
                </Button>
                {isEditable && !isApproved && (
                  <>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={(e) => handleSubmit(e, 'rascunho')}
                      className="border-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/10"
                    >
                      <Save className="mr-2 h-4 w-4" /> Salvar Progresso
                    </Button>
                    <Button 
                      type="button" 
                      onClick={(e) => handleSubmit(e, 'finalizado')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Registro
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