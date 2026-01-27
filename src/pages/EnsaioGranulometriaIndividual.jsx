import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PENEIRAS_MAP = {
  "peneira_75_0mm": { astm: "3\"", mm: "75,0" },
  "peneira_63_0mm": { astm: "2 1/2\"", mm: "63,0" },
  "peneira_50_0mm": { astm: "2\"", mm: "50,0" },
  "peneira_38_1mm": { astm: "1 1/2\"", mm: "38,1" },
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
  tipo_material: "",
  data_ensaio: new Date().toISOString().split('T')[0],
  horario: "",
  rodovia: "",
  pedreira: "",
  faixa: "",
  local_coleta: "",
  agregados: [
    { nome: "", peso_umido: "", peso_seco: "", agua: "", umidade: "", granulometria: {} }
  ],
  equivalente_areia: {
    medicoes: [
      { topo_argila: "", topo_areia: "", equivalente: "" },
      { topo_argila: "", topo_areia: "", equivalente: "" },
      { topo_argila: "", topo_areia: "", equivalente: "" }
    ],
    media: ""
  },
  observacoes: "",
  status: "rascunho"
});

export default function EnsaioGranulometriaIndividualPage() {
  const [formData, setFormData] = useState(getInitialFormData());
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
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

      const [obrasData, regionaisData, projectsData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Regional.list(),
        base44.entities.Project.list()
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
            (obra.tipo_obra === 'conservacao' || obra.tipo_obra === 'implantacao')
          );
        } else {
          availableObras = [];
        }
      } else {
        availableObras = obrasData.filter(obra => 
          obra.tipo_obra === 'conservacao' || obra.tipo_obra === 'implantacao'
        );
      }

      setObras(availableObras);
      setRegionais(regionaisData);
      setProjects(projectsData);

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const ensaioToEdit = await base44.entities.EnsaioGranulometriaIndividual.get(editId);
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
        if (regionalSelecionada?.project_ids) {
          let projsFiltered = projects.filter(p => regionalSelecionada.project_ids.includes(p.id));
          
          if (formData.tipo_material) {
            projsFiltered = projsFiltered.filter(p => p.tipo_projeto === formData.tipo_material);
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
  }, [formData.tipo_material, formData.obra_id, obras, regionais, projects]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (formData.project_id) {
        const proj = projects.find(p => p.id === formData.project_id);
        setSelectedProject(proj);

        if (proj) {
          // Preencher faixa granulométrica
          if (proj.faixa_granulometrica_id) {
            try {
              const faixa = await base44.entities.FaixaGranulometrica.get(proj.faixa_granulometrica_id);
              handleChange('faixa', faixa.nome);
            } catch (error) {
              console.error("Erro ao carregar faixa:", error);
            }
          }

          // Preencher pedreira(s)
          if (proj.agregados && proj.agregados.length > 0) {
            const pedreiras = [...new Set(proj.agregados.map(a => a.pedreira).filter(Boolean))];
            handleChange('pedreira', pedreiras.join(' + '));

            // Preencher agregados
            const novosAgregados = proj.agregados.map(agg => ({
              nome: agg.nome || "",
              peso_umido: "",
              peso_seco: "",
              agua: "",
              umidade: "",
              granulometria: {}
            }));

            // Adicionar agregado extra vazio se houver menos de 4
            if (novosAgregados.length < 4) {
              novosAgregados.push({
                nome: "",
                peso_umido: "",
                peso_seco: "",
                agua: "",
                umidade: "",
                granulometria: {}
              });
            }

            setFormData(prev => ({ ...prev, agregados: novosAgregados }));
          }
        }
      } else {
        setSelectedProject(null);
      }
    };

    loadProjectData();
  }, [formData.project_id, projects]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAgregadoChange = (index, field, value) => {
    const newAgregados = [...formData.agregados];
    newAgregados[index] = { ...newAgregados[index], [field]: value };

    if (field === 'peso_umido' || field === 'peso_seco') {
      const pesoUmido = parseFloat(newAgregados[index].peso_umido) || 0;
      const pesoSeco = parseFloat(newAgregados[index].peso_seco) || 0;
      if (pesoUmido && pesoSeco) {
        newAgregados[index].agua = (pesoUmido - pesoSeco).toFixed(2);
        newAgregados[index].umidade = pesoSeco > 0 ? (((pesoUmido - pesoSeco) / pesoSeco) * 100).toFixed(2) : "";
      }
    }

    setFormData(prev => ({ ...prev, agregados: newAgregados }));
  };

  const handleGranulometriaChange = (agregadoIndex, peneira, field, value) => {
    const newAgregados = [...formData.agregados];
    if (!newAgregados[agregadoIndex].granulometria) {
      newAgregados[agregadoIndex].granulometria = {};
    }
    if (!newAgregados[agregadoIndex].granulometria[peneira]) {
      newAgregados[agregadoIndex].granulometria[peneira] = {};
    }
    newAgregados[agregadoIndex].granulometria[peneira][field] = value;
    setFormData(prev => ({ ...prev, agregados: newAgregados }));
  };

  const addAgregado = () => {
    if (formData.agregados.length < 4) {
      setFormData(prev => ({
        ...prev,
        agregados: [...prev.agregados, { nome: "", peso_umido: "", peso_seco: "", agua: "", umidade: "", granulometria: {} }]
      }));
    }
  };

  const removeAgregado = (index) => {
    if (formData.agregados.length > 1) {
      setFormData(prev => ({
        ...prev,
        agregados: prev.agregados.filter((_, i) => i !== index)
      }));
    }
  };

  const handleEquivalenteChange = (index, field, value) => {
    const newMedicoes = [...formData.equivalente_areia.medicoes];
    newMedicoes[index] = { ...newMedicoes[index], [field]: value };

    if (field === 'topo_argila' || field === 'topo_areia') {
      const h1 = parseFloat(newMedicoes[index].topo_argila) || 0;
      const h2 = parseFloat(newMedicoes[index].topo_areia) || 0;
      if (h1 && h2) {
        newMedicoes[index].equivalente = ((h2 / h1) * 100).toFixed(2);
      }
    }

    const validos = newMedicoes.filter(m => m.equivalente && !isNaN(parseFloat(m.equivalente)));
    const media = validos.length > 0 
      ? (validos.reduce((sum, m) => sum + parseFloat(m.equivalente), 0) / validos.length).toFixed(2)
      : "";

    setFormData(prev => ({
      ...prev,
      equivalente_areia: {
        medicoes: newMedicoes,
        media
      }
    }));
  };



  const handleSubmit = async (e, saveStatus = 'finalizado') => {
    e.preventDefault();

    if (saveStatus === 'finalizado') {
      if (!formData.obra_id || !formData.tipo_material || !formData.data_ensaio) {
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

        await base44.entities.EnsaioGranulometriaIndividual.update(editingEnsaio.id, updateData);
        alert(successMessage);
      } else {
        await base44.entities.EnsaioGranulometriaIndividual.create({ 
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

  const peneirasVisiveis = selectedProject?.faixa_trabalho 
    ? Object.keys(selectedProject.faixa_trabalho).filter(key => selectedProject.faixa_trabalho[key] !== null && selectedProject.faixa_trabalho[key] !== undefined)
    : Object.keys(PENEIRAS_MAP);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingEnsaio?.id ? "Editar Granulometria Individual" : "Nova Granulometria Individual"}</CardTitle>
          </CardHeader>
          <CardContent>
            {formData.status === 'rascunho' && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800">Em Rascunho</p>
                  <p className="text-sm text-blue-700">Este registro ainda está em edição.</p>
                </div>
              </div>
            )}

            {formData.rejection_reason && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{formData.rejection_reason}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção Tipo de Material */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Material *</Label>
                  <Select
                    value={formData.tipo_material}
                    onValueChange={(value) => {
                      handleChange('tipo_material', value);
                      handleChange('project_id', '');
                    }}
                    disabled={!isEditable || isApproved || !!editingEnsaio?.id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAUQ">CAUQ</SelectItem>
                      <SelectItem value="MRAF">MRAF</SelectItem>
                      <SelectItem value="BGS">BGS</SelectItem>
                      <SelectItem value="CAMADAS_GRANULARES">Camadas Granulares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>

              {/* Projeto */}
              {formData.tipo_material && (
                <div>
                  <Label>Projeto</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => handleChange('project_id', value)}
                    disabled={!isEditable || isApproved}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o projeto" />
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

              {/* Dados Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.horario}
                    onChange={(e) => handleChange('horario', e.target.value)}
                    disabled={!isEditable || isApproved}
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Pedreira</Label>
                  <Input
                    value={formData.pedreira}
                    onChange={(e) => handleChange('pedreira', e.target.value)}
                    disabled={!isEditable || isApproved}
                  />
                </div>
                <div>
                  <Label>Faixa</Label>
                  <Input
                    value={formData.faixa}
                    onChange={(e) => handleChange('faixa', e.target.value)}
                    disabled={!isEditable || isApproved}
                  />
                </div>
                <div>
                  <Label>Local de Coleta</Label>
                  <Input
                    value={formData.local_coleta}
                    onChange={(e) => handleChange('local_coleta', e.target.value)}
                    disabled={!isEditable || isApproved}
                  />
                </div>
              </div>

              {/* Agregados */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Agregados (até 4)</Label>
                  {isEditable && !isApproved && formData.agregados.length < 4 && (
                    <Button type="button" onClick={addAgregado} size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Agregado
                    </Button>
                  )}
                </div>

                {formData.agregados.map((agregado, index) => (
                  <Card key={index} className="bg-slate-50">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Agregado {index + 1}</CardTitle>
                        {isEditable && !isApproved && formData.agregados.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeAgregado(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={agregado.nome}
                            onChange={(e) => handleAgregadoChange(index, 'nome', e.target.value)}
                            disabled={!isEditable || isApproved || (selectedProject?.agregados && index < selectedProject.agregados.length)}
                            placeholder="Ex: Brita 1"
                          />
                        </div>
                        <div>
                          <Label>Peso Úmido (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={agregado.peso_umido}
                            onChange={(e) => handleAgregadoChange(index, 'peso_umido', e.target.value)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>
                        <div>
                          <Label>Peso Seco (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={agregado.peso_seco}
                            onChange={(e) => handleAgregadoChange(index, 'peso_seco', e.target.value)}
                            disabled={!isEditable || isApproved}
                          />
                        </div>
                        <div>
                          <Label>Água (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={agregado.agua}
                            disabled
                          />
                        </div>
                        <div>
                          <Label>Umidade (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={agregado.umidade}
                            disabled
                          />
                        </div>
                      </div>

                      {/* Granulometria */}
                      <div>
                        <Label className="font-semibold">Granulometria</Label>
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full border-collapse border text-sm">
                            <thead className="bg-slate-200">
                              <tr>
                                <th className="border p-2">ASTM</th>
                                <th className="border p-2">mm</th>
                                <th className="border p-2">Retido (g)</th>
                                <th className="border p-2">% Passante</th>
                              </tr>
                            </thead>
                            <tbody>
                              {peneirasVisiveis.map(peneiraKey => {
                                const peneiraInfo = PENEIRAS_MAP[peneiraKey];
                                return (
                                  <tr key={peneiraKey}>
                                    <td className="border p-2">{peneiraInfo.astm}</td>
                                    <td className="border p-2">{peneiraInfo.mm}</td>
                                    <td className="border p-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={agregado.granulometria?.[peneiraKey]?.retido || ""}
                                        onChange={(e) => handleGranulometriaChange(index, peneiraKey, 'retido', e.target.value)}
                                        disabled={!isEditable || isApproved}
                                        className="h-8"
                                      />
                                    </td>
                                    <td className="border p-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={agregado.granulometria?.[peneiraKey]?.passante || ""}
                                        onChange={(e) => handleGranulometriaChange(index, peneiraKey, 'passante', e.target.value)}
                                        disabled={!isEditable || isApproved}
                                        className="h-8"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Equivalente de Areia */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-base">Equivalente de Areia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.equivalente_areia.medicoes.map((medicao, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border rounded">
                      <div>
                        <Label>H₁ - Topo Argila (cm)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={medicao.topo_argila}
                          onChange={(e) => handleEquivalenteChange(index, 'topo_argila', e.target.value)}
                          disabled={!isEditable || isApproved}
                        />
                      </div>
                      <div>
                        <Label>H₂ - Topo Areia (cm)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={medicao.topo_areia}
                          onChange={(e) => handleEquivalenteChange(index, 'topo_areia', e.target.value)}
                          disabled={!isEditable || isApproved}
                        />
                      </div>
                      <div>
                        <Label>EA (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={medicao.equivalente}
                          disabled
                        />
                      </div>
                    </div>
                  ))}
                  <div>
                    <Label>Média EA (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.equivalente_areia.media}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
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
                    <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, 'rascunho')}>
                      <Save className="mr-2 h-4 w-4" /> Salvar Progresso
                    </Button>
                    <Button type="button" onClick={(e) => handleSubmit(e, 'finalizado')}>
                      <Save className="mr-2 h-4 w-4" /> Finalizar
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