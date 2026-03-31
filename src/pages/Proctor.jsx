import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { base44 } from "@/api/base44Client";
import { Loader2, Trash2, Plus } from "lucide-react";

const CONSTANTS = {
  // Constantes para cálculos DNIT 172/2016
  FATOR_CONVERSAO_ISC: 0.07,
  PENETRACAO_254: 2.54,
  PENETRACAO_508: 5.08
};

export default function ProctorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [obrasDoUsuario, setObrasDoUsuario] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [umidadeMode, setUmidadeMode] = useState('higroscopica'); // 'higroscopica' ou 'ponto_a_ponto'

  const [formData, setFormData] = useState({
    obra_id: '',
    project_id: '',
    data_ensaio: new Date().toISOString().split('T')[0],
    laboratorista_name: '',
    local: '',
    furo: '',
    km: '',
    pista: '',
    horizonte: '',
    material: '',
    golpes: 12,
    amostra: '',
    auxiliar: '',
    umidade_higroscopica: {
      capsula_numero: '',
      peso_capsula: 0,
      peso_solo_umido: 0,
      peso_capsula_solo_umido: 0,
      peso_agua: 0,
      peso_capsula_solo_seco: 0,
      umidade_calculada: 0
    },
    cilindros: Array(5).fill(null).map(() => ({
      numero_cilindro: '',
      umidade: {
        numero_capsula: '',
        peso_capsula: 0,
        peso_solo_umido: 0,
        peso_capsula_solo_umido: 0,
        peso_agua: 0,
        peso_capsula_solo_seco: 0,
        umidade_calculada: 0
      },
      densidade: {
        peso_material: 0,
        peso_seco: 0,
        volume: 0,
        densidade_umida: 0,
        densidade_seca: 0
      }
    })),
    densidade_maxima: 0,
    umidade_otima: 0,
    expansoes: Array(5).fill(null).map(() => ({
      numero_cilindro: '',
      data: new Date().toISOString().split('T')[0],
      hora: '',
      altura_inicial: 0,
      leituras: [0, 0, 0, 0],
      diferenca: 0,
      expansao_percentual: 0,
      peso_solo_final: 0
    })),
    cbrs: Array(5).fill(null).map(() => ({
      numero_cilindro: '',
      penetracoes: Array(10).fill(null).map(() => ({
        penetracao_mm: 0,
        tempo_minutos: 0,
        leitura_anel: 0,
        pressao_kgf_cm2: 0,
        isc_percentual: 0
      })),
      cbr_em_2_54: 0,
      cbr_em_5_08: 0,
      cbr_final: 0
    })),
    observacoes: '',
    status: 'rascunho'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-calcular umidade quando valores mudarem
  useEffect(() => {
    const newCil = formData.cilindros.map(cilindro => {
      const { peso_capsula, peso_solo_umido, peso_capsula_solo_seco } = cilindro.umidade;
      if (peso_capsula > 0 && peso_solo_umido > 0 && peso_capsula_solo_seco > 0) {
        const umid = calcularUmidade(peso_capsula, peso_solo_umido, peso_capsula_solo_seco);
        return {
          ...cilindro,
          umidade: { ...cilindro.umidade, umidade_calculada: parseFloat(umid) }
        };
      }
      return cilindro;
    });
    setFormData(prev => ({ ...prev, cilindros: newCil }));
  }, [formData.cilindros.map(c => `${c.umidade.peso_capsula}${c.umidade.peso_solo_umido}${c.umidade.peso_capsula_solo_seco}`).join()]);

  // Auto-calcular densidade quando valores mudarem
  useEffect(() => {
    const newCil = formData.cilindros.map(cilindro => {
      const { peso_material, volume } = cilindro.densidade;
      const umidad = cilindro.umidade.umidade_calculada || 0;
      if (peso_material > 0 && volume > 0) {
        const densUmida = parseFloat((peso_material / volume).toFixed(4));
        const densSeca = parseFloat(calcularDensidadeSeca(densUmida, umidad));
        return {
          ...cilindro,
          densidade: { ...cilindro.densidade, densidade_umida: densUmida, densidade_seca: densSeca }
        };
      }
      return cilindro;
    });
    setFormData(prev => ({ ...prev, cilindros: newCil }));
  }, [formData.cilindros.map(c => `${c.densidade.peso_material}${c.densidade.volume}${c.umidade.umidade_calculada}`).join()]);

  const loadInitialData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData(prev => ({ ...prev, laboratorista_name: userData.laboratorista_name || userData.full_name }));

      const obrasList = await base44.entities.Obra.list();
      setObrasDoUsuario(obrasList);

      const queryParams = new URLSearchParams(location.search);
      const id = queryParams.get('id');
      
      if (id) {
        const record = await base44.entities.Proctor.get(id);
        setFormData(record);
        setRecordId(id);
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleObraChange = async (obraId) => {
    setFormData(prev => ({ ...prev, obra_id: obraId }));
    const obra = obrasDoUsuario.find(o => o.id === obraId);
    if (obra) {
      const projetosList = await base44.entities.Project.filter({ regional_id: obra.regional_id });
      setProjetos(projetosList);
    }
  };

  // Cálculos ABNT NBR 7182:2016
  const calcularUmidade = (pesoCapsula, pesoSoloUmido, pesoCapsula_Solo_Seco) => {
    // h(%) = (pa / ps) * 100
    // pa = peso da água = (C+S+A) - (C+S)
    // ps = peso solo seco = (C+S+A) - C - pa
    const pesoAgua = pesoCapsula_Solo_Seco - pesoSoloUmido - pesoCapsula;
    const pesoSoloSeco = pesoCapsula_Solo_Seco - pesoCapsula - pesoAgua;
    return pesoSoloSeco > 0 ? ((pesoAgua / pesoSoloSeco) * 100).toFixed(2) : 0;
  };

  const calcularDensidadeSeca = (densidadeUmida, umidade) => {
    return umidade > 0 ? (densidadeUmida / (1 + umidade / 100)).toFixed(4) : densidadeUmida.toFixed(4);
  };

  // Cálculo de expansão DNIT 172/2016
  const calcularExpansao = (alturaInicial, diferenca) => {
    return alturaInicial > 0 ? ((diferenca / alturaInicial) * 100).toFixed(2) : 0;
  };

  // Cálculo de CBR DNIT 172/2016
  const calcularISC = (leituraAnel, fatorAnel = 0.07) => {
    return (leituraAnel * fatorAnel).toFixed(2);
  };

  const handleSubmit = async (status) => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status
      };

      if (isEditing && recordId) {
        await base44.entities.Proctor.update(recordId, dataToSave);
        alert('Registro atualizado com sucesso!');
      } else {
        await base44.entities.Proctor.create(dataToSave);
        alert('Registro criado com sucesso!');
      }
      navigate('/MeusEnsaios');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar o registro.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#BFCF99]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-transparent">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#00233B]">Ensaio Proctor</h1>
        <p className="text-[#00233B]/80 mt-1">ABNT NBR 7182:2016 - Ensaio de Compactação</p>
      </div>

      <Tabs defaultValue="metadata" className="space-y-4">
        <TabsList className="grid grid-cols-6 lg:grid-cols-6 bg-white/20">
          <TabsTrigger value="metadata">Identificação</TabsTrigger>
          <TabsTrigger value="umidade_modo">Umidade</TabsTrigger>
          <TabsTrigger value="compactacao">Compactação</TabsTrigger>
          <TabsTrigger value="expansao">Expansão</TabsTrigger>
          <TabsTrigger value="cbr">CBR</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
        </TabsList>

        {/* TAB: IDENTIFICAÇÃO */}
        <TabsContent value="metadata" className="space-y-4">
          <Card className="bg-white/20 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle>Dados Gerais do Ensaio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data do Ensaio *</Label>
                  <Input
                    type="date"
                    value={formData.data_ensaio}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_ensaio: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Obra *</Label>
                  <Select value={formData.obra_id} onValueChange={handleObraChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {obrasDoUsuario.map(obra => (
                        <SelectItem key={obra.id} value={obra.id}>{obra.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Projeto</Label>
                  <Select value={formData.project_id} onValueChange={(val) => setFormData(prev => ({ ...prev, project_id: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projetos.map(proj => (
                        <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Laboratorista</Label>
                  <Input value={formData.laboratorista_name} disabled />
                </div>
                <div>
                  <Label>Local</Label>
                  <Input
                    value={formData.local}
                    onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Furo</Label>
                  <Input
                    value={formData.furo}
                    onChange={(e) => setFormData(prev => ({ ...prev, furo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>KM</Label>
                  <Input
                    value={formData.km}
                    onChange={(e) => setFormData(prev => ({ ...prev, km: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Pista</Label>
                  <Input
                    value={formData.pista}
                    onChange={(e) => setFormData(prev => ({ ...prev, pista: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Horizonte</Label>
                  <Input
                    value={formData.horizonte}
                    onChange={(e) => setFormData(prev => ({ ...prev, horizonte: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Material</Label>
                  <Input
                    value={formData.material}
                    onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Golpes</Label>
                  <Input
                    type="number"
                    value={formData.golpes}
                    onChange={(e) => setFormData(prev => ({ ...prev, golpes: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Amostra</Label>
                  <Input
                    value={formData.amostra}
                    onChange={(e) => setFormData(prev => ({ ...prev, amostra: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Auxiliar</Label>
                  <Input
                    value={formData.auxiliar}
                    onChange={(e) => setFormData(prev => ({ ...prev, auxiliar: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {umidadeMode === 'ponto_a_ponto' && (
            <Card className="bg-white/20 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle>Umidade Higroscópica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cápsula Nº</Label>
                    <Input
                      value={formData.umidade_higroscopica.capsula_numero}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        umidade_higroscopica: { ...prev.umidade_higroscopica, capsula_numero: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>C (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.umidade_higroscopica.peso_capsula}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        umidade_higroscopica: { ...prev.umidade_higroscopica, peso_capsula: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>S (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.umidade_higroscopica.peso_solo_umido}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        umidade_higroscopica: { ...prev.umidade_higroscopica, peso_solo_umido: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>C + S (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.umidade_higroscopica.peso_capsula_solo_umido}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        umidade_higroscopica: { ...prev.umidade_higroscopica, peso_capsula_solo_umido: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>A (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.umidade_higroscopica.peso_agua}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        umidade_higroscopica: { ...prev.umidade_higroscopica, peso_agua: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>C + S + A (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.umidade_higroscopica.peso_capsula_solo_seco}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        umidade_higroscopica: { ...prev.umidade_higroscopica, peso_capsula_solo_seco: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Umidade (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.umidade_higroscopica.umidade_calculada}
                      disabled
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const umid = calcularUmidade(
                      formData.umidade_higroscopica.peso_capsula,
                      formData.umidade_higroscopica.peso_solo_umido,
                      formData.umidade_higroscopica.peso_capsula_solo_seco
                    );
                    setFormData(prev => ({
                      ...prev,
                      umidade_higroscopica: { ...prev.umidade_higroscopica, umidade_calculada: parseFloat(umid) }
                    }));
                  }}
                  className="w-full"
                >
                  Calcular Umidade (ABNT NBR 7182:2016)
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: UMIDADE */}
        <TabsContent value="umidade_modo" className="space-y-4">
          <Card className="bg-white/20 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle>Método de Cálculo de Umidade</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={umidadeMode} onValueChange={setUmidadeMode}>
                <div className="flex items-center space-x-2 p-3 border border-white/20 rounded mb-2">
                  <RadioGroupItem value="higroscopica" id="hig" />
                  <Label htmlFor="hig" className="cursor-pointer flex-1 m-0">
                    <strong>Umidade Higroscópica</strong> - Usar uma única medição de umidade para todo o molde
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-white/20 rounded">
                  <RadioGroupItem value="ponto_a_ponto" id="ponto" />
                  <Label htmlFor="ponto" className="cursor-pointer flex-1 m-0">
                    <strong>Umidade Ponto a Ponto</strong> - Medir umidade em cada cilindro/molde individualmente
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: COMPACTAÇÃO */}
        <TabsContent value="compactacao" className="space-y-4">
          <Card className="bg-white/20 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle>Cilindros - Umidade e Densidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.cilindros.map((cilindro, cilIndex) => (
                <div key={cilIndex} className="border-t pt-6">
                  <h4 className="font-bold text-[#00233B] mb-4">Cilindro {cilIndex + 1}</h4>

                  <Input 
                    placeholder="Cilindro Nº" 
                    value={cilindro.numero_cilindro} 
                    onChange={(e) => {
                      const newCil = [...formData.cilindros];
                      newCil[cilIndex].numero_cilindro = e.target.value;
                      setFormData(prev => ({ ...prev, cilindros: newCil }));
                    }} 
                    className="mb-4"
                  />

                  {/* UMIDADE */}
                  <div className="space-y-4 mb-6">
                    <h5 className="font-semibold text-sm">Umidade</h5>
                    <div className="bg-white/10 p-3 rounded border border-white/20 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Cápsula Nº</Label>
                          <Input value={cilindro.umidade.numero_capsula} onChange={(e) => {
                            const newCil = [...formData.cilindros];
                            newCil[cilIndex].umidade.numero_capsula = e.target.value;
                            setFormData(prev => ({ ...prev, cilindros: newCil }));
                          }} size="sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Peso Cápsula (g)</Label>
                          <Input type="number" step="0.01" value={cilindro.umidade.peso_capsula} onChange={(e) => {
                            const newCil = [...formData.cilindros];
                            newCil[cilIndex].umidade.peso_capsula = Number(e.target.value);
                            setFormData(prev => ({ ...prev, cilindros: newCil }));
                          }} size="sm" />
                        </div>
                        <div>
                           <Label className="text-xs">Peso Solo Úmido (g)</Label>
                           <Input type="number" step="0.01" value={cilindro.umidade.peso_solo_umido} onChange={(e) => {
                             const newCil = [...formData.cilindros];
                             newCil[cilIndex].umidade.peso_solo_umido = Number(e.target.value);
                             setFormData(prev => ({ ...prev, cilindros: newCil }));
                           }} size="sm" />
                         </div>
                         <div>
                           <Label className="text-xs">Cápsula + Solo Úmido (g)</Label>
                           <Input type="number" step="0.01" value={cilindro.umidade.peso_capsula_solo_umido} onChange={(e) => {
                             const newCil = [...formData.cilindros];
                             newCil[cilIndex].umidade.peso_capsula_solo_umido = Number(e.target.value);
                             setFormData(prev => ({ ...prev, cilindros: newCil }));
                           }} size="sm" />
                         </div>
                         <div>
                           <Label className="text-xs">Peso Água (g)</Label>
                           <Input type="number" step="0.01" value={cilindro.umidade.peso_agua} onChange={(e) => {
                             const newCil = [...formData.cilindros];
                             newCil[cilIndex].umidade.peso_agua = Number(e.target.value);
                             setFormData(prev => ({ ...prev, cilindros: newCil }));
                           }} size="sm" />
                         </div>
                         <div>
                           <Label className="text-xs">Cápsula + Solo Seco (g)</Label>
                           <Input type="number" step="0.01" value={cilindro.umidade.peso_capsula_solo_seco} onChange={(e) => {
                             const newCil = [...formData.cilindros];
                             newCil[cilIndex].umidade.peso_capsula_solo_seco = Number(e.target.value);
                             setFormData(prev => ({ ...prev, cilindros: newCil }));
                           }} size="sm" />
                         </div>
                         <div>
                           <Label className="text-xs">Umidade (%)</Label>
                           <Input type="number" step="0.01" value={cilindro.umidade.umidade_calculada} disabled size="sm" />
                         </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          const newCil = [...formData.cilindros];
                          const umid = calcularUmidade(
                            newCil[cilIndex].umidade.peso_capsula,
                            newCil[cilIndex].umidade.peso_solo_umido,
                            newCil[cilIndex].umidade.peso_capsula_solo_seco
                          );
                          newCil[cilIndex].umidade.umidade_calculada = parseFloat(umid);
                          setFormData(prev => ({ ...prev, cilindros: newCil }));
                        }}
                        className="w-full mt-2"
                      >
                        Calcular Umidade
                      </Button>
                    </div>
                  </div>

                  {/* DENSIDADE */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-sm">Densidade</h5>
                    <div className="bg-white/10 p-3 rounded border border-white/20">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Peso Mat. (g)" 
                          value={cilindro.densidade.peso_material} 
                          onChange={(e) => {
                            const newCil = [...formData.cilindros];
                            newCil[cilIndex].densidade.peso_material = Number(e.target.value);
                            setFormData(prev => ({ ...prev, cilindros: newCil }));
                          }} 
                          size="sm" 
                        />
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Peso Seco (g)" 
                          value={cilindro.densidade.peso_seco} 
                          onChange={(e) => {
                            const newCil = [...formData.cilindros];
                            newCil[cilIndex].densidade.peso_seco = Number(e.target.value);
                            setFormData(prev => ({ ...prev, cilindros: newCil }));
                          }} 
                          size="sm" 
                        />
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Volume (cm³)" 
                          value={cilindro.densidade.volume} 
                          onChange={(e) => {
                            const newCil = [...formData.cilindros];
                            newCil[cilIndex].densidade.volume = Number(e.target.value);
                            setFormData(prev => ({ ...prev, cilindros: newCil }));
                          }} 
                          size="sm" 
                        />
                        <Input 
                          type="number" 
                          step="0.0001" 
                          placeholder="Dens. Úmida" 
                          value={cilindro.densidade.densidade_umida} 
                          disabled 
                          size="sm" 
                        />
                        <Input 
                          type="number" 
                          step="0.0001" 
                          placeholder="Dens. Seca" 
                          value={cilindro.densidade.densidade_seca} 
                          disabled 
                          size="sm" 
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          const newCil = [...formData.cilindros];
                          const umidad = newCil[cilIndex].umidade.umidade_calculada || 0;
                          newCil[cilIndex].densidade.densidade_umida = parseFloat((newCil[cilIndex].densidade.peso_material / newCil[cilIndex].densidade.volume).toFixed(4));
                          newCil[cilIndex].densidade.densidade_seca = parseFloat(calcularDensidadeSeca(newCil[cilIndex].densidade.densidade_umida, umidad));
                          setFormData(prev => ({ ...prev, cilindros: newCil }));
                        }}
                        className="w-full mt-2"
                      >
                        Calcular Densidade
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: EXPANSÃO */}
        <TabsContent value="expansao" className="space-y-4">
          <Card className="bg-white/20 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle>Expansão (DNIT 172/2016)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.expansoes.map((exp, idx) => (
                <div key={idx} className="border-t pt-4">
                  <h5 className="font-semibold mb-2">Cilindro {idx + 1}</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Input placeholder="Cilindro Nº" value={exp.numero_cilindro} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].numero_cilindro = e.target.value;
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="date" value={exp.data} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].data = e.target.value;
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="time" value={exp.hora} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].hora = e.target.value;
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="number" step="0.01" placeholder="Altura Inicial (mm)" value={exp.altura_inicial} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].altura_inicial = Number(e.target.value);
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="number" step="0.01" placeholder="1º dia (mm)" value={exp.leituras[0]} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].leituras[0] = Number(e.target.value);
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="number" step="0.01" placeholder="2º dia (mm)" value={exp.leituras[1]} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].leituras[1] = Number(e.target.value);
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="number" step="0.01" placeholder="3º dia (mm)" value={exp.leituras[2]} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].leituras[2] = Number(e.target.value);
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="number" step="0.01" placeholder="4º dia (mm)" value={exp.leituras[3]} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].leituras[3] = Number(e.target.value);
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                    <Input type="number" step="0.01" placeholder="Diferença (mm)" value={exp.diferenca} disabled />
                    <Input type="number" step="0.01" placeholder="Expansão (%)" value={exp.expansao_percentual} disabled />
                    <Input type="number" step="0.01" placeholder="Peso Solo Final (g)" value={exp.peso_solo_final} onChange={(e) => {
                      const newExp = [...formData.expansoes];
                      newExp[idx].peso_solo_final = Number(e.target.value);
                      setFormData(prev => ({ ...prev, expansoes: newExp }));
                    }} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const newExp = [...formData.expansoes];
                    const diff = newExp[idx].leituras[3] - newExp[idx].leituras[0];
                    newExp[idx].diferenca = parseFloat(diff.toFixed(2));
                    newExp[idx].expansao_percentual = parseFloat(calcularExpansao(newExp[idx].altura_inicial, diff));
                    setFormData(prev => ({ ...prev, expansoes: newExp }));
                  }} className="mt-2">
                    Calcular Expansão (DNIT 172/2016)
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CBR */}
        <TabsContent value="cbr" className="space-y-4">
          <Card className="bg-white/20 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle>CBR - Índice de Suporte Califórnia (DNIT 172/2016)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.cbrs.map((cbr, cbrIdx) => (
                <div key={cbrIdx} className="border-t pt-4">
                  <h5 className="font-semibold mb-4">Cilindro {cbrIdx + 1}</h5>
                  <div className="mb-4">
                    <Input placeholder="Cilindro Nº" value={cbr.numero_cilindro} onChange={(e) => {
                      const newCbrs = [...formData.cbrs];
                      newCbrs[cbrIdx].numero_cilindro = e.target.value;
                      setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                    }} />
                  </div>
                  <div className="space-y-2">
                    <h6 className="text-sm font-semibold">Penetrações</h6>
                    {cbr.penetracoes.map((penet, pentIdx) => (
                      <div key={pentIdx} className="bg-white/10 p-2 rounded border border-white/20">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <Input type="number" step="0.01" placeholder="Penetração (mm)" value={penet.penetracao_mm} onChange={(e) => {
                            const newCbrs = [...formData.cbrs];
                            newCbrs[cbrIdx].penetracoes[pentIdx].penetracao_mm = Number(e.target.value);
                            setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                          }} size="sm" />
                          <Input type="number" placeholder="Tempo (m)" value={penet.tempo_minutos} onChange={(e) => {
                            const newCbrs = [...formData.cbrs];
                            newCbrs[cbrIdx].penetracoes[pentIdx].tempo_minutos = Number(e.target.value);
                            setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                          }} size="sm" />
                          <Input type="number" step="0.01" placeholder="Leitura Anel" value={penet.leitura_anel} onChange={(e) => {
                            const newCbrs = [...formData.cbrs];
                            newCbrs[cbrIdx].penetracoes[pentIdx].leitura_anel = Number(e.target.value);
                            setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                          }} size="sm" />
                          <Input type="number" step="0.01" placeholder="Pressão (kgf/cm²)" value={penet.pressao_kgf_cm2} disabled size="sm" />
                          <Input type="number" step="0.01" placeholder="ISC (%)" value={penet.isc_percentual} disabled size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const newCbrs = [...formData.cbrs];
                    newCbrs[cbrIdx].penetracoes.forEach((p, idx) => {
                      p.pressao_kgf_cm2 = parseFloat((p.leitura_anel * CONSTANTS.FATOR_CONVERSAO_ISC).toFixed(4));
                      p.isc_percentual = parseFloat((p.pressao_kgf_cm2 / 0.07).toFixed(2));
                    });
                    setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                  }} className="mt-2 w-full">
                    Calcular Pressões e ISC
                  </Button>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Input type="number" step="0.01" placeholder="CBR 2,54mm (%)" value={cbr.cbr_em_2_54} onChange={(e) => {
                      const newCbrs = [...formData.cbrs];
                      newCbrs[cbrIdx].cbr_em_2_54 = Number(e.target.value);
                      setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                    }} />
                    <Input type="number" step="0.01" placeholder="CBR 5,08mm (%)" value={cbr.cbr_em_5_08} onChange={(e) => {
                      const newCbrs = [...formData.cbrs];
                      newCbrs[cbrIdx].cbr_em_5_08 = Number(e.target.value);
                      setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                    }} />
                    <Input type="number" step="0.01" placeholder="CBR Final (%)" value={cbr.cbr_final} onChange={(e) => {
                      const newCbrs = [...formData.cbrs];
                      newCbrs[cbrIdx].cbr_final = Number(e.target.value);
                      setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                    }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: OBSERVAÇÕES */}
        <TabsContent value="observacoes" className="space-y-4">
          <Card className="bg-white/20 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle>Observações e Conclusões</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações gerais do ensaio..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={6}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSubmit('rascunho')}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Salvar Rascunho
        </Button>
        <Button
          className="bg-[#00233B] hover:bg-[#00233B]/90"
          onClick={() => handleSubmit('finalizado')}
          disabled={saving || !formData.obra_id || !formData.data_ensaio}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Finalizar Ensaio
        </Button>
      </div>
    </div>
  );
}