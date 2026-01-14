import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const getEnsaioInicial = (numero) => ({
  numero,
  hora: "",
  camada: "",
  material_camada: "",
  estaca: "",
  temperatura_aplicacao: null,
  peso_bandeja_amostra: null,
  peso_bandeja: null,
  peso_emulsao: null,
  taxa_aplicada: null,
  taxa_emulsao_aplicada: null,
  taxa_residual: null,
  ensaio_residuo: {
    data: "",
    tara: null,
    peso_inicial: null,
    peso_final: null,
    residuo: null
  }
});

export default function EnsaioTaxaPinturaImprimacaoPage() {
  const [formData, setFormData] = useState({
    obra_id: "",
    data_ensaio: new Date().toISOString().split('T')[0],
    rodovia: "",
    trecho: "",
    material: "",
    placa_caminhao: "",
    tipo_servico: "imprimacao",
    dimensoes_bandeja: {
      lado_1: null,
      lado_2: null,
      area: null
    },
    ensaios: [getEnsaioInicial(1)],
    observacoes: ""
  });

  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEnsaio, setEditingEnsaio] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isApproved = editingEnsaio?.approved === true;
  const isEditable = !isApproved;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [obrasData, regionaisData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Regional.list()
      ]);

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
            (obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'conservacao' || obra.tipo_obra === 'supervisao')
          );
        } else {
          availableObras = [];
        }
      } else {
        availableObras = obrasData.filter(obra => 
          obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'conservacao' || obra.tipo_obra === 'supervisao'
        );
      }

      setObras(availableObras);
      setRegionais(regionaisData);

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const ensaioToEdit = await base44.entities.EnsaioTaxaPinturaImprimacao.get(editId);
        if (currentUser.role === 'admin' || (ensaioToEdit.created_by === currentUser.email && ensaioToEdit.approved !== true)) {
          setEditingEnsaio(ensaioToEdit);
          setFormData({
            ...ensaioToEdit,
            data_ensaio: ensaioToEdit.data_ensaio ? new Date(ensaioToEdit.data_ensaio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            ensaios: ensaioToEdit.ensaios && ensaioToEdit.ensaios.length > 0 ? ensaioToEdit.ensaios : [getEnsaioInicial(1)]
          });
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
        }
      } else {
        if (availableObras.length > 0) {
          const primeiraObra = availableObras[0];
          const regional = regionaisData.find(r => r.id === primeiraObra.regional_id);
          
          let gestorName = "";
          if (regional?.gestor_contrato_responsavel) {
            try {
              const allUsers = await base44.entities.User.list();
              const gestor = allUsers.find(u => u.email.toLowerCase() === regional.gestor_contrato_responsavel.toLowerCase());
              gestorName = gestor ? (gestor.laboratorista_name || gestor.full_name) : "";
            } catch (error) {
              console.warn("Sem permissão para listar usuários");
            }
          }
          
          setFormData(prev => ({
            ...prev,
            obra_id: primeiraObra.id,
            engenheiro_responsavel: gestorName
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

  const calcularDimensoesBandeja = useCallback((lado1, lado2) => {
    if (lado1 && lado2) {
      const area = (lado1 * lado2) / 10000;
      return parseFloat(area.toFixed(4));
    }
    return null;
  }, []);

  const calcularEnsaio = useCallback((ensaio, areaBandeja) => {
    const novoEnsaio = { ...ensaio };

    // Peso da emulsão = Peso bandeja+amostra - Peso bandeja
    if (ensaio.peso_bandeja_amostra && ensaio.peso_bandeja) {
      novoEnsaio.peso_emulsao = parseFloat((ensaio.peso_bandeja_amostra - ensaio.peso_bandeja).toFixed(2));
    }

    // Taxa aplicada = Peso emulsão / (1000 × Área)
    if (novoEnsaio.peso_emulsao && areaBandeja) {
      novoEnsaio.taxa_aplicada = parseFloat((novoEnsaio.peso_emulsao / (1000 * areaBandeja)).toFixed(2));
    }

    // Resíduo (%) = ((Peso final - Tara) / Peso inicial) × 100
    if (ensaio.ensaio_residuo?.peso_inicial && ensaio.ensaio_residuo?.peso_final && ensaio.ensaio_residuo?.tara) {
      novoEnsaio.ensaio_residuo.residuo = parseFloat((((ensaio.ensaio_residuo.peso_final - ensaio.ensaio_residuo.tara) / ensaio.ensaio_residuo.peso_inicial) * 100).toFixed(2));
    }

    // Taxa de emulsão aplicada = Taxa aplicada × (Resíduo / 62)
    if (novoEnsaio.taxa_aplicada && novoEnsaio.ensaio_residuo?.residuo) {
      novoEnsaio.taxa_emulsao_aplicada = parseFloat((novoEnsaio.taxa_aplicada * (novoEnsaio.ensaio_residuo.residuo / 62)).toFixed(2));
    }

    // Taxa residual = Taxa aplicada × Resíduo
    if (novoEnsaio.taxa_aplicada && novoEnsaio.ensaio_residuo?.residuo) {
      novoEnsaio.taxa_residual = parseFloat((novoEnsaio.taxa_aplicada * novoEnsaio.ensaio_residuo.residuo).toFixed(2));
    }

    return novoEnsaio;
  }, []);

  const handleDimensoesChange = useCallback((field, value) => {
    setFormData(prev => {
      const novasDimensoes = { ...prev.dimensoes_bandeja, [field]: value };
      
      if (field === 'lado_1' || field === 'lado_2') {
        novasDimensoes.area = calcularDimensoesBandeja(novasDimensoes.lado_1, novasDimensoes.lado_2);
      }

      // Recalcular todos os ensaios com a nova área
      const novosEnsaios = prev.ensaios.map(ensaio => calcularEnsaio(ensaio, novasDimensoes.area));

      return { ...prev, dimensoes_bandeja: novasDimensoes, ensaios: novosEnsaios };
    });
  }, [calcularDimensoesBandeja, calcularEnsaio]);

  const handleEnsaioChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const novosEnsaios = [...prev.ensaios];
      
      // Atualizar campo específico
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        novosEnsaios[index] = {
          ...novosEnsaios[index],
          [parent]: {
            ...novosEnsaios[index][parent],
            [child]: value
          }
        };
      } else {
        novosEnsaios[index] = { ...novosEnsaios[index], [field]: value };
      }
      
      // Recalcular o ensaio
      novosEnsaios[index] = calcularEnsaio(novosEnsaios[index], prev.dimensoes_bandeja.area);
      
      return { ...prev, ensaios: novosEnsaios };
    });
  }, [calcularEnsaio]);

  const adicionarEnsaio = useCallback(() => {
    setFormData(prev => {
      if (prev.ensaios.length >= 4) {
        alert("Máximo de 4 ensaios permitidos.");
        return prev;
      }
      return {
        ...prev,
        ensaios: [...prev.ensaios, getEnsaioInicial(prev.ensaios.length + 1)]
      };
    });
  }, []);

  const removerEnsaio = useCallback((index) => {
    if (formData.ensaios.length > 1) {
      setFormData(prev => ({
        ...prev,
        ensaios: prev.ensaios.filter((_, i) => i !== index).map((e, i) => ({ ...e, numero: i + 1 }))
      }));
    }
  }, [formData.ensaios.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.obra_id || !formData.data_ensaio) {
      alert("Preencha todos os campos obrigatórios (Obra, Data).");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        laboratorista_name: user?.laboratorista_name || user?.full_name
      };

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
        
        await base44.entities.EnsaioTaxaPinturaImprimacao.update(editingEnsaio.id, updateData);
        alert(successMessage);
      } else {
        await base44.entities.EnsaioTaxaPinturaImprimacao.create(dataToSave);
        alert("Ensaio criado com sucesso!");
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("Erro ao salvar ensaio:", error);
      alert(`Erro ao salvar ensaio: ${error.message || 'Erro desconhecido'}.`);
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
              {editingEnsaio ? 'Editar Ensaio de Taxa de Pintura/Imprimação' : 'Novo Ensaio de Taxa de Pintura/Imprimação'}
            </CardTitle>
            <CardDescription className="text-[#00233B]/80">
              DNIT 145/2012 - ES
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
                        const obraId = e.target.value;
                        const obra = obras.find(o => o.id === obraId);
                        const regional = obra ? regionais.find(r => r.id === obra.regional_id) : null;
                        
                        setFormData(prev => ({ ...prev, obra_id: obraId }));
                        
                        if (regional?.gestor_contrato_responsavel) {
                          base44.entities.User.list().then(allUsers => {
                            const gestor = allUsers.find(u => u.email.toLowerCase() === regional.gestor_contrato_responsavel.toLowerCase());
                            if (gestor) {
                              setFormData(prev => ({
                                ...prev,
                                engenheiro_responsavel: gestor.laboratorista_name || gestor.full_name
                              }));
                            }
                          }).catch(() => {});
                        }
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
                    <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
                    <select
                      id="tipo_servico"
                      value={formData.tipo_servico}
                      onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })}
                      disabled={!isEditable}
                      required
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="imprimacao">Imprimação</option>
                      <option value="ligacao">Ligação</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="rodovia">Rodovia</Label>
                    <select
                      id="rodovia"
                      value={formData.rodovia}
                      onChange={(e) => setFormData({ ...formData, rodovia: e.target.value })}
                      disabled={!isEditable || !formData.obra_id}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Selecione a rodovia</option>
                      {obras.find(o => o.id === formData.obra_id)?.rodovias?.map((rodovia, idx) => (
                        <option key={idx} value={rodovia}>
                          {rodovia}
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
                      disabled={!isEditable}
                      placeholder="Ex: km 10 ao km 25"
                    />
                  </div>

                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      disabled={!isEditable}
                      placeholder="Ex: Emulsão RL-1C"
                    />
                  </div>

                  <div>
                    <Label htmlFor="placa_caminhao">Placa do Caminhão</Label>
                    <Input
                      id="placa_caminhao"
                      value={formData.placa_caminhao}
                      onChange={(e) => setFormData({ ...formData, placa_caminhao: e.target.value })}
                      disabled={!isEditable}
                      placeholder="Ex: ABC-1234"
                    />
                  </div>

                  <div>
                    <Label htmlFor="engenheiro_responsavel">Engenheiro Responsável</Label>
                    <Input
                      id="engenheiro_responsavel"
                      value={formData.engenheiro_responsavel}
                      onChange={(e) => setFormData({ ...formData, engenheiro_responsavel: e.target.value })}
                      disabled={!isEditable}
                      readOnly
                      className="bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensões da Bandeja */}
              <Card className="bg-black/5">
                <CardHeader>
                  <CardTitle className="text-base">Dimensões da Bandeja (aplicadas a todos os ensaios)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="lado_1">Lado 1 (cm)</Label>
                      <Input
                        id="lado_1"
                        type="number"
                        step="0.1"
                        value={formData.dimensoes_bandeja.lado_1 || ''}
                        onChange={(e) => handleDimensoesChange('lado_1', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lado_2">Lado 2 (cm)</Label>
                      <Input
                        id="lado_2"
                        type="number"
                        step="0.1"
                        value={formData.dimensoes_bandeja.lado_2 || ''}
                        onChange={(e) => handleDimensoesChange('lado_2', e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                        placeholder="Ex: 50"
                      />
                    </div>

                    <div>
                      <Label>Área (m²)</Label>
                      <Input
                        value={formData.dimensoes_bandeja.area?.toFixed(4) || ''}
                        disabled
                        className="bg-slate-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ensaios */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#00233B]">Ensaios (máximo 4)</h3>
                  {isEditable && (
                    <Button 
                      type="button" 
                      onClick={adicionarEnsaio} 
                      className="bg-[#00233B] text-[#F2F1EF]"
                      disabled={formData.ensaios.length >= 4}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Ensaio
                    </Button>
                  )}
                </div>

                {formData.ensaios.map((ensaio, index) => (
                  <Card key={index} className="mb-4 bg-black/5">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Ensaio {ensaio.numero}</CardTitle>
                        {isEditable && formData.ensaios.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerEnsaio(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Identificação */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Hora</Label>
                          <Input
                            type="time"
                            value={ensaio.hora}
                            onChange={(e) => handleEnsaioChange(index, 'hora', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div>
                          <Label>Camada</Label>
                          <Input
                            value={ensaio.camada}
                            onChange={(e) => handleEnsaioChange(index, 'camada', e.target.value)}
                            disabled={!isEditable}
                            placeholder="Ex: Imprimação"
                          />
                        </div>
                        <div>
                          <Label>Material da Camada</Label>
                          <Input
                            value={ensaio.material_camada}
                            onChange={(e) => handleEnsaioChange(index, 'material_camada', e.target.value)}
                            disabled={!isEditable}
                            placeholder="Ex: CM-30"
                          />
                        </div>
                        <div>
                          <Label>Estaca</Label>
                          <Input
                            value={ensaio.estaca}
                            onChange={(e) => handleEnsaioChange(index, 'estaca', e.target.value)}
                            disabled={!isEditable}
                            placeholder="Ex: E-245"
                          />
                        </div>
                      </div>

                      {/* Dados do Ensaio */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Execução do Ensaio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Temp. Aplicação (°C)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ensaio.temperatura_aplicacao || ''}
                              onChange={(e) => handleEnsaioChange(index, 'temperatura_aplicacao', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Peso Bandeja+Amostra (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ensaio.peso_bandeja_amostra || ''}
                              onChange={(e) => handleEnsaioChange(index, 'peso_bandeja_amostra', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Peso da Bandeja (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ensaio.peso_bandeja || ''}
                              onChange={(e) => handleEnsaioChange(index, 'peso_bandeja', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ensaio de Resíduo */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Ensaio de Resíduo</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Data</Label>
                            <Input
                              type="date"
                              value={ensaio.ensaio_residuo?.data || ''}
                              onChange={(e) => handleEnsaioChange(index, 'ensaio_residuo.data', e.target.value)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Tara (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ensaio.ensaio_residuo?.tara || ''}
                              onChange={(e) => handleEnsaioChange(index, 'ensaio_residuo.tara', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Peso Inicial (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ensaio.ensaio_residuo?.peso_inicial || ''}
                              onChange={(e) => handleEnsaioChange(index, 'ensaio_residuo.peso_inicial', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                          <div>
                            <Label>Peso Final (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={ensaio.ensaio_residuo?.peso_final || ''}
                              onChange={(e) => handleEnsaioChange(index, 'ensaio_residuo.peso_final', e.target.value ? parseFloat(e.target.value) : null)}
                              disabled={!isEditable}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Resultados Calculados */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="p-3 bg-blue-50 rounded">
                          <Label className="text-xs text-blue-800">Peso da Emulsão (g)</Label>
                          <p className="text-lg font-bold text-blue-900">{ensaio.peso_emulsao?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded">
                          <Label className="text-xs text-blue-800">Taxa Aplicada (l/m²)</Label>
                          <p className="text-lg font-bold text-blue-900">{ensaio.taxa_aplicada?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <Label className="text-xs text-green-800">Resíduo (%)</Label>
                          <p className="text-lg font-bold text-green-900">{ensaio.ensaio_residuo?.residuo?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <Label className="text-xs text-green-800">Taxa Emulsão Aplicada (l/m²)</Label>
                          <p className="text-lg font-bold text-green-900">{ensaio.taxa_emulsao_aplicada?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <Label className="text-xs text-green-800">Taxa Residual (l/m²)</Label>
                          <p className="text-lg font-bold text-green-900">{ensaio.taxa_residual?.toFixed(2) || '-'}</p>
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