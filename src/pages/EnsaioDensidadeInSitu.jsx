import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const getFuroInicial = (numero) => ({
  numero,
  estaca: "",
  pista: "",
  profundidade_furo: null,
  peso_areia_garrafa_antes: null,
  peso_areia_garrafa_apos: null,
  peso_material_umido_furo: null,
  peso_solo_retido_3_4_umido: null,
  tara_frigideira: null,
  material_umido_frigideira: null,
  material_seco_frigideira: null,
  densidade_umida_furo: null,
  densidade_seca_solo: null,
  umidade: null,
  desvio_umidade: null,
  grau_compactacao: null
});

export default function EnsaioDensidadeInSituPage() {
  const [formData, setFormData] = useState({
    obra_id: "",
    project_id: "",
    data_ensaio: new Date().toISOString().split('T')[0],
    horario: "",
    rodovia: "",
    trecho: "",
    sub_trecho: "",
    camada: "",
    material: "",
    procedencia: "",
    substituicao_retido_3_4: false,
    densidade_real_retida_3_4: null,
    densidade_areia: null,
    peso_areia_funil: null,
    dados_proctor: {
      densidade_seca_max: null,
      umidade_otima: null
    },
    furos: [getFuroInicial(1)],
    observacoes: "",
    fotos: []
  });

  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingEnsaio, setEditingEnsaio] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const isApproved = editingEnsaio?.approved === true;
  const isEditable = !isApproved;

  const gestoresDisponiveis = useMemo(() => {
    const obra = obras.find(o => o.id === formData.obra_id);
    const regional = obra ? regionais.find(r => r.id === obra.regional_id) : null;
    
    if (!regional || !allUsers || allUsers.length === 0) return [];
    
    const gestores = [];
    
    if (regional.gestores_contrato_responsaveis && Array.isArray(regional.gestores_contrato_responsaveis)) {
      regional.gestores_contrato_responsaveis.forEach(email => {
        const gestor = allUsers.find(u => u.email?.toLowerCase() === email?.toLowerCase());
        if (gestor && !gestores.find(g => g.email === gestor.email)) {
          gestores.push({
            email: gestor.email,
            nome: gestor.laboratorista_name || gestor.full_name || gestor.email
          });
        }
      });
    }
    
    if (regional.gestor_contrato_responsavel) {
      const gestor = allUsers.find(u => u.email?.toLowerCase() === regional.gestor_contrato_responsavel?.toLowerCase());
      if (gestor && !gestores.find(g => g.email === gestor.email)) {
        gestores.push({
          email: gestor.email,
          nome: gestor.laboratorista_name || gestor.full_name || gestor.email
        });
      }
    }
    
    return gestores;
  }, [formData.obra_id, obras, regionais, allUsers]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [obrasData, regionaisData, allUsersData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Regional.list(),
        base44.entities.User.list().catch(() => [])
      ]);
      
      // Carregar projetos com fallback para service role
      let projectsData = [];
      try {
        projectsData = await base44.entities.Project.list();
      } catch (error) {
        console.warn("Sem permissão para listar projetos - tentando service role");
        try {
          projectsData = await base44.asServiceRole.entities.Project.list();
        } catch (serviceRoleError) {
          console.error("Falha ao carregar projetos:", serviceRoleError);
          projectsData = [];
        }
      }

      if (allUsersData.length > 0) {
        setAllUsers(allUsersData);
      } else {
        try {
          const usersData = await base44.entities.User.list();
          setAllUsers(usersData);
        } catch (error) {
          console.warn("Sem permissão para listar usuários - tentando service role");
          try {
            const usersViaServiceRole = await base44.asServiceRole.entities.User.list();
            setAllUsers(usersViaServiceRole);
          } catch (serviceRoleError) {
            console.error("Falha ao carregar usuários:", serviceRoleError);
            setAllUsers([currentUser]);
          }
        }
      }

      const currentUserAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');
      
      let availableObras = obrasData;
      if (currentUserAccessLevel === 'user') {
        const regionalDoLaboratorista = regionaisData.find(regional => {
          const laboratoristas = regional.laboratoristas_responsaveis || [];
          return laboratoristas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
        });
        
        if (regionalDoLaboratorista) {
          availableObras = obrasData.filter(obra => 
            obra.regional_id === regionalDoLaboratorista.id &&
            obra.status === 'em_andamento' &&
            (obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'conservacao')
          );
        } else {
          availableObras = [];
        }
      } else {
        availableObras = obrasData.filter(obra => 
          obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'conservacao'
        );
      }

      setObras(availableObras);
      setProjects(projectsData);
      setRegionais(regionaisData);

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const ensaioToEdit = await base44.entities.EnsaioDensidadeInSitu.get(editId);
        if (currentUser.role === 'admin' || (ensaioToEdit.created_by === currentUser.email && ensaioToEdit.approved !== true)) {
          setEditingEnsaio(ensaioToEdit);
          setFormData({
            ...ensaioToEdit,
            data_ensaio: ensaioToEdit.data_ensaio ? new Date(ensaioToEdit.data_ensaio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            furos: ensaioToEdit.furos && ensaioToEdit.furos.length > 0 ? ensaioToEdit.furos : [getFuroInicial(1)],
            fotos: Array.isArray(ensaioToEdit.fotos) ? ensaioToEdit.fotos : []
          });
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
        }
      } else {
        if (availableObras.length > 0) {
          setFormData(prev => ({
            ...prev,
            obra_id: availableObras[0].id
          }));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados.");
      navigate(createPageUrl('MeusEnsaios'));
    } finally {
      setLoading(false);
    }
  };

  const calcularFuro = useCallback((furo, densidadeAreia, pesoAreiaFunil, substituicao_retido_3_4, densidade_real_retida_3_4) => {
    const novoFuro = { ...furo };

    // Volume TOTAL do furo (cm³) = (Peso areia antes - Peso areia após - Peso areia funil) / Densidade areia
    const pesoAreiaNofuro = (furo.peso_areia_garrafa_antes || 0) - (furo.peso_areia_garrafa_apos || 0) - (pesoAreiaFunil || 0);
    const volumeTotal = densidadeAreia ? pesoAreiaNofuro / densidadeAreia : null;

    // Se há substituição na 3/4", calcular volume do material retido e subtrair do volume total
    let volumeFuro = volumeTotal;
    let pesoMaterialUmidoCorrigido = furo.peso_material_umido_furo || 0;
    
    if (substituicao_retido_3_4 && densidade_real_retida_3_4 && furo.peso_solo_retido_3_4_umido) {
      const volumeRetido3_4 = furo.peso_solo_retido_3_4_umido / densidade_real_retida_3_4;
      volumeFuro = volumeTotal - volumeRetido3_4;
      // Corrigir o peso do material úmido subtraindo o peso retido na 3/4"
      pesoMaterialUmidoCorrigido = (furo.peso_material_umido_furo || 0) - (furo.peso_solo_retido_3_4_umido || 0);
    }

    // Densidade úmida = Peso material úmido corrigido / Volume furo efetivo
    if (volumeFuro && pesoMaterialUmidoCorrigido) {
      novoFuro.densidade_umida_furo = parseFloat((pesoMaterialUmidoCorrigido / volumeFuro).toFixed(3));
    }

    // Umidade (%) = ((Material úmido - Material seco) / Material seco) × 100
    const materialUmido = (furo.material_umido_frigideira || 0) - (furo.tara_frigideira || 0);
    const materialSeco = (furo.material_seco_frigideira || 0) - (furo.tara_frigideira || 0);
    
    if (materialSeco > 0) {
      novoFuro.umidade = parseFloat((((materialUmido - materialSeco) / materialSeco) * 100).toFixed(2));
    }

    // Densidade seca = Densidade úmida / (1 + (Umidade / 100))
    if (novoFuro.densidade_umida_furo && novoFuro.umidade !== null) {
      novoFuro.densidade_seca_solo = parseFloat((novoFuro.densidade_umida_furo / (1 + (novoFuro.umidade / 100))).toFixed(3));
    }

    return novoFuro;
  }, []);

  const calcularFuroComProctor = useCallback((furo, dadosProctor, densidadeAreia, pesoAreiaFunil, substituicao_retido_3_4, densidade_real_retida_3_4) => {
    let novoFuro = calcularFuro(furo, densidadeAreia, pesoAreiaFunil, substituicao_retido_3_4, densidade_real_retida_3_4);

    // Desvio de umidade = Umidade - Umidade ótima
    if (novoFuro.umidade !== null && dadosProctor.umidade_otima) {
      novoFuro.desvio_umidade = parseFloat((novoFuro.umidade - dadosProctor.umidade_otima).toFixed(2));
    }

    // Grau de compactação = (Densidade seca / Densidade seca máx Proctor) × 100
    if (novoFuro.densidade_seca_solo && dadosProctor.densidade_seca_max) {
      novoFuro.grau_compactacao = parseFloat(((novoFuro.densidade_seca_solo / dadosProctor.densidade_seca_max) * 100).toFixed(2));
    }

    return novoFuro;
  }, [calcularFuro]);

  const handleFuroChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const novosFuros = [...prev.furos];
      novosFuros[index] = { ...novosFuros[index], [field]: value };
      
      // Recalcular o furo usando os valores globais
      novosFuros[index] = calcularFuroComProctor(novosFuros[index], prev.dados_proctor, prev.densidade_areia, prev.peso_areia_funil, prev.substituicao_retido_3_4, prev.densidade_real_retida_3_4);
      
      return { ...prev, furos: novosFuros };
    });
  }, [calcularFuroComProctor]);

  const handleProctorChange = useCallback((field, value) => {
    setFormData(prev => {
      const novosDadosProctor = { ...prev.dados_proctor, [field]: value };
      
      // Recalcular todos os furos com os novos dados do Proctor
      const novosFuros = prev.furos.map(furo => calcularFuroComProctor(furo, novosDadosProctor, prev.densidade_areia, prev.peso_areia_funil, prev.substituicao_retido_3_4, prev.densidade_real_retida_3_4));
      
      return { ...prev, dados_proctor: novosDadosProctor, furos: novosFuros };
    });
  }, [calcularFuroComProctor]);

  const handleGlobalDataChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Recalcular todos os furos quando os dados globais mudarem
      const novosFuros = prev.furos.map(furo => 
        calcularFuroComProctor(
          furo, 
          prev.dados_proctor, 
          field === 'densidade_areia' ? value : prev.densidade_areia,
          field === 'peso_areia_funil' ? value : prev.peso_areia_funil,
          field === 'substituicao_retido_3_4' ? value : prev.substituicao_retido_3_4,
          field === 'densidade_real_retida_3_4' ? value : prev.densidade_real_retida_3_4
        )
      );
      
      return { ...newData, furos: novosFuros };
    });
  }, [calcularFuroComProctor]);

  const adicionarFuro = useCallback(() => {
    setFormData(prev => {
      if (prev.furos.length >= 5) {
        alert("Máximo de 5 furos permitidos.");
        return prev;
      }
      return {
        ...prev,
        furos: [...prev.furos, getFuroInicial(prev.furos.length + 1)]
      };
    });
  }, []);

  const removerFuro = useCallback((index) => {
    if (formData.furos.length > 1) {
      setFormData(prev => ({
        ...prev,
        furos: prev.furos.filter((_, i) => i !== index).map((f, i) => ({ ...f, numero: i + 1 }))
      }));
    }
  }, [formData.furos.length]);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      
      setFormData(prev => ({
        ...prev,
        fotos: [...(prev.fotos || []), ...uploadedUrls]
      }));
      e.target.value = '';
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao fazer upload da foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.obra_id || !formData.data_ensaio || !formData.engenheiro_responsavel) {
      alert("Preencha todos os campos obrigatórios (Obra, Data, Engenheiro Responsável).");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        laboratorista_name: user?.laboratorista_name || user?.full_name
      };

      console.log("📊 ========== DEBUG SALVAMENTO ==========");
      console.log("📊 densidade_areia:", dataToSave.densidade_areia);
      console.log("📊 peso_areia_funil:", dataToSave.peso_areia_funil);
      console.log("📊 Tipo densidade_areia:", typeof dataToSave.densidade_areia);
      console.log("📊 Tipo peso_areia_funil:", typeof dataToSave.peso_areia_funil);
      console.log("📊 Tentando salvar ensaio:", dataToSave);
      console.log("📊 Número de furos:", dataToSave.furos?.length);
      console.log("📊 ========================================");

      if (editingEnsaio) {
        const updateData = { ...dataToSave };
        let successMessage = "Ensaio atualizado com sucesso!";

        if (editingEnsaio.approved === false) {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
          successMessage = "Ensaio atualizado com sucesso! O registro voltará para análise do administrador.";
        }
        
        console.log("📊 Atualizando ensaio ID:", editingEnsaio.id);
        await base44.entities.EnsaioDensidadeInSitu.update(editingEnsaio.id, updateData);
        alert(successMessage);
      } else {
        console.log("📊 Criando novo ensaio...");
        const resultado = await base44.entities.EnsaioDensidadeInSitu.create(dataToSave);
        console.log("✅ Ensaio criado com sucesso! ID:", resultado.id);
        alert("Ensaio criado com sucesso!");
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("❌ Erro detalhado ao salvar ensaio:", error);
      console.error("❌ Stack trace:", error.stack);
      console.error("❌ Detalhes do erro:", {
        message: error.message,
        name: error.name,
        response: error.response?.data
      });
      alert(`Erro ao salvar ensaio: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-[#00233B]/50" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
          <CardHeader>
            <CardTitle className="text-[#00233B] text-2xl">
              {editingEnsaio ? 'Editar Ensaio de Densidade In Situ' : 'Novo Ensaio de Densidade In Situ'}
            </CardTitle>
            <CardDescription className="text-[#00233B]/80">
              Método Frasco de Areia - DNIT 458/25
            </CardDescription>
            {editingEnsaio?.rejection_reason && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50/50 border border-red-200/50 rounded-lg">
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
              {/* Dados da Obra */}
              <div>
                <h3 className="text-lg font-semibold text-[#00233B] mb-4">Dados da Obra</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="obra_id">Obra *</Label>
                    <select
                      id="obra_id"
                      value={formData.obra_id}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          obra_id: e.target.value,
                          engenheiro_responsavel: ""
                        }));
                      }}
                      disabled={!isEditable}
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
                    <Label htmlFor="data_ensaio">Data do Ensaio *</Label>
                    <Input
                      id="data_ensaio"
                      type="date"
                      value={formData.data_ensaio}
                      onChange={(e) => setFormData({ ...formData, data_ensaio: e.target.value })}
                      disabled={!isEditable}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="horario">Horário</Label>
                    <Input
                      id="horario"
                      type="time"
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rodovia">Rodovia</Label>
                    <Input
                      id="rodovia"
                      value={formData.rodovia}
                      onChange={(e) => setFormData({ ...formData, rodovia: e.target.value })}
                      disabled={!isEditable}
                      placeholder="Ex: BR-116"
                    />
                  </div>

                  <div>
                    <Label htmlFor="trecho">Trecho</Label>
                    <Input
                      id="trecho"
                      value={formData.trecho}
                      onChange={(e) => setFormData({ ...formData, trecho: e.target.value })}
                      disabled={!isEditable}
                      placeholder="Ex: km 10 ao km 25"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sub_trecho">Sub-Trecho</Label>
                    <Input
                      id="sub_trecho"
                      value={formData.sub_trecho}
                      onChange={(e) => setFormData({ ...formData, sub_trecho: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>

                  <div>
                    <Label htmlFor="camada">Camada</Label>
                    <Input
                      id="camada"
                      value={formData.camada}
                      onChange={(e) => setFormData({ ...formData, camada: e.target.value })}
                      disabled={!isEditable}
                      placeholder="Ex: Base, Subleito"
                    />
                  </div>

                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      disabled={!isEditable}
                      placeholder="Ex: Solo argiloso"
                    />
                  </div>

                  <div>
                    <Label htmlFor="procedencia">Procedência</Label>
                    <Input
                      id="procedencia"
                      value={formData.procedencia}
                      onChange={(e) => setFormData({ ...formData, procedencia: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>

                  <div>
                    <Label htmlFor="engenheiro_responsavel">Engenheiro Responsável *</Label>
                    <select
                      id="engenheiro_responsavel"
                      value={formData.engenheiro_responsavel}
                      onChange={(e) => setFormData({ ...formData, engenheiro_responsavel: e.target.value })}
                      disabled={!isEditable || gestoresDisponiveis.length === 0}
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

                <div className="mt-4 flex items-center gap-2">
                  <Switch
                    id="substituicao"
                    checked={formData.substituicao_retido_3_4}
                    onCheckedChange={(checked) => handleGlobalDataChange('substituicao_retido_3_4', checked)}
                    disabled={!isEditable}
                  />
                  <Label htmlFor="substituicao" className="cursor-pointer">
                    Ensaio com substituição do material retido na 3/4"
                  </Label>
                </div>

                {formData.substituicao_retido_3_4 && (
                  <div className="mt-4">
                    <Label htmlFor="densidade_real_retida">Densidade Real Retida 3/4" (g/cm³)</Label>
                    <Input
                      id="densidade_real_retida"
                      type="number"
                      step="0.001"
                      value={formData.densidade_real_retida_3_4 || ''}
                      onChange={(e) => handleGlobalDataChange('densidade_real_retida_3_4', e.target.value ? parseFloat(e.target.value) : null)}
                      disabled={!isEditable}
                      placeholder="Ex: 2.650"
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>

              {/* Dados Globais do Ensaio */}
              <Card className="bg-black/5">
                <CardHeader>
                  <CardTitle className="text-base">Dados da Areia (Calibração)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="densidade_areia">Densidade da Areia (g/cm³) *</Label>
                      <Input
                        id="densidade_areia"
                        type="number"
                        step="0.001"
                        value={formData.densidade_areia || ''}
                        onChange={(e) => handleGlobalDataChange('densidade_areia', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 1.450"
                      />
                    </div>

                    <div>
                      <Label htmlFor="peso_areia_funil">Peso da Areia no Funil (g) *</Label>
                      <Input
                        id="peso_areia_funil"
                        type="number"
                        step="0.1"
                        value={formData.peso_areia_funil || ''}
                        onChange={(e) => handleGlobalDataChange('peso_areia_funil', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 1200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados do Proctor */}
              <Card className="bg-black/5">
                <CardHeader>
                  <CardTitle className="text-base">Dados do Proctor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="densidade_seca_max">Densidade Seca Máx. (g/cm³)</Label>
                      <Input
                        id="densidade_seca_max"
                        type="number"
                        step="0.001"
                        value={formData.dados_proctor.densidade_seca_max || ''}
                        onChange={(e) => handleProctorChange('densidade_seca_max', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 2.150"
                      />
                    </div>

                    <div>
                      <Label htmlFor="umidade_otima">Umidade Ótima (%)</Label>
                      <Input
                        id="umidade_otima"
                        type="number"
                        step="0.01"
                        value={formData.dados_proctor.umidade_otima || ''}
                        onChange={(e) => handleProctorChange('umidade_otima', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 12.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Furos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#00233B]">Furos (máximo 5)</h3>
                  {isEditable && (
                    <Button 
                      type="button" 
                      onClick={adicionarFuro} 
                      className="bg-[#00233B] text-[#F2F1EF]"
                      disabled={formData.furos.length >= 5}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Furo
                    </Button>
                  )}
                </div>

                {formData.furos.map((furo, index) => (
                  <Card key={index} className="mb-4 bg-black/5">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Furo {furo.numero}</CardTitle>
                        {isEditable && formData.furos.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerFuro(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Identificação */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Estaca</Label>
                          <Input
                            value={furo.estaca}
                            onChange={(e) => handleFuroChange(index, 'estaca', e.target.value)}
                            disabled={!isEditable}
                            placeholder="Ex: E-245"
                          />
                        </div>
                        <div>
                          <Label>Pista</Label>
                          <Input
                            value={furo.pista}
                            onChange={(e) => handleFuroChange(index, 'pista', e.target.value)}
                            disabled={!isEditable}
                            placeholder="Ex: Direita"
                          />
                        </div>
                      </div>

                      {/* Dados do Ensaio */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Dados do Ensaio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Profundidade do Furo (cm)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.profundidade_furo || ''}
                              onChange={(e) => handleFuroChange(index, 'profundidade_furo', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                              placeholder="Ex: 15"
                            />
                          </div>
                          <div>
                            <Label>Peso Areia+Garrafa Antes (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.peso_areia_garrafa_antes || ''}
                              onChange={(e) => handleFuroChange(index, 'peso_areia_garrafa_antes', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Peso Areia+Garrafa Após (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.peso_areia_garrafa_apos || ''}
                              onChange={(e) => handleFuroChange(index, 'peso_areia_garrafa_apos', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Peso Material Úmido no Furo (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.peso_material_umido_furo || ''}
                              onChange={(e) => handleFuroChange(index, 'peso_material_umido_furo', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                        </div>

                        {formData.substituicao_retido_3_4 && (
                          <div>
                            <Label>Peso Solo Retido 3/4" Úmido (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.peso_solo_retido_3_4_umido || ''}
                              onChange={(e) => handleFuroChange(index, 'peso_solo_retido_3_4_umido', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                              className="max-w-xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Ensaio de Umidade */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Ensaio de Umidade In Situ</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Tara da Frigideira (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.tara_frigideira || ''}
                              onChange={(e) => handleFuroChange(index, 'tara_frigideira', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Material Úmido+Frigideira (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.material_umido_frigideira || ''}
                              onChange={(e) => handleFuroChange(index, 'material_umido_frigideira', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Material Seco+Frigideira (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={furo.material_seco_frigideira || ''}
                              onChange={(e) => handleFuroChange(index, 'material_seco_frigideira', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Resultados Calculados */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="p-3 bg-blue-50 rounded">
                          <Label className="text-xs text-blue-800">Densidade Úmida (g/cm³)</Label>
                          <p className="text-lg font-bold text-blue-900">{furo.densidade_umida_furo?.toFixed(3) || '-'}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded">
                          <Label className="text-xs text-blue-800">Densidade Seca (g/cm³)</Label>
                          <p className="text-lg font-bold text-blue-900">{furo.densidade_seca_solo?.toFixed(3) || '-'}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded">
                          <Label className="text-xs text-blue-800">Umidade (%)</Label>
                          <p className="text-lg font-bold text-blue-900">{furo.umidade?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <Label className="text-xs text-green-800">Desvio Umidade (%)</Label>
                          <p className="text-lg font-bold text-green-900">{furo.desvio_umidade?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <Label className="text-xs text-green-800">Grau Compactação (%)</Label>
                          <p className="text-lg font-bold text-green-900">{furo.grau_compactacao?.toFixed(2) || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    disabled={!isEditable}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('MeusEnsaios'))}
                  className="hover:bg-black/10"
                >
                  Cancelar
                </Button>
                {isEditable && (
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
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Ensaio
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}