import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User";
import { ChevronLeft, Loader2, Plus, Trash2 } from "lucide-react";

const PRESSAO_PADRAO = 1.369; // kgf/cm² por unidade de leitura (padrão)

function calcularISC(leitura) {
  const pressao = leitura * PRESSAO_PADRAO;
  const referencia_2_54mm = 13.79; // kgf/cm² (padrão)
  return (pressao / referencia_2_54mm) * 100;
}

export default function EnsaioProctorExpansaoCBR() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    obra_id: searchParams.get("obra_id") || "",
    project_id: searchParams.get("project_id") || "",
    data_ensaio: new Date().toISOString().split("T")[0],
    laboratorista_name: "",
    engenheiro_responsavel: "",
    local: "",
    km: "",
    pista: "",
    furo: "",
    horizonte: "",
    material: "",
    golpes: "Intermediário",
    amostra: "",
    auxiliar: "",
    compactacao: { moldes: [] },
    expansao: { cilindros: [] },
    cbr: { cilindros: [] },
    umidade_higroscopica: [],
    observacoes: "",
    status: "rascunho"
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [userData, obrasData, regionaisData] = await Promise.all([
        User.me(),
        Obra.list(),
        Regional.list()
      ]);
      
      setUser(userData);
      setObras(obrasData);
      setRegionais(regionaisData);
      
      setFormData(prev => ({
        ...prev,
        laboratorista_name: userData.laboratorista_name || userData.full_name || ""
      }));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMolde = () => {
    setFormData(prev => ({
      ...prev,
      compactacao: {
        ...prev.compactacao,
        moldes: [...prev.compactacao.moldes, {
          numero: prev.compactacao.moldes.length + 1,
          peso_molde: null,
          peso_molde_amostra: null,
          volume_molde: 2100,
          peso_amostra: null,
          densidade_umida: null,
          peso_seco: null,
          densidade_seca: null,
          umidade: null
        }]
      }
    }));
  };

  const updateMolde = (index, field, value) => {
    const newMoldes = [...formData.compactacao.moldes];
    newMoldes[index][field] = value ? parseFloat(value) : null;
    
    // Cálculos automáticos
    if (newMoldes[index].peso_molde && newMoldes[index].peso_molde_amostra) {
      newMoldes[index].peso_amostra = newMoldes[index].peso_molde_amostra - newMoldes[index].peso_molde;
    }
    if (newMoldes[index].peso_amostra && newMoldes[index].volume_molde) {
      newMoldes[index].densidade_umida = newMoldes[index].peso_amostra / newMoldes[index].volume_molde;
    }
    if (newMoldes[index].peso_seco && newMoldes[index].volume_molde) {
      newMoldes[index].densidade_seca = newMoldes[index].peso_seco / newMoldes[index].volume_molde;
    }
    if (newMoldes[index].peso_amostra && newMoldes[index].peso_seco) {
      const agua = newMoldes[index].peso_amostra - newMoldes[index].peso_seco;
      newMoldes[index].umidade = (agua / newMoldes[index].peso_seco) * 100;
    }
    
    setFormData(prev => ({
      ...prev,
      compactacao: { ...prev.compactacao, moldes: newMoldes }
    }));
  };

  const removeMolde = (index) => {
    setFormData(prev => ({
      ...prev,
      compactacao: {
        ...prev.compactacao,
        moldes: prev.compactacao.moldes.filter((_, i) => i !== index)
      }
    }));
  };

  const addCilindroExpansao = () => {
    setFormData(prev => ({
      ...prev,
      expansao: {
        ...prev.expansao,
        cilindros: [...prev.expansao.cilindros, {
          numero: prev.expansao.cilindros.length + 1,
          data: new Date().toISOString().split("T")[0],
          hora: "",
          altura_inicial: null,
          leituras: Array(9).fill(null),
          diferenca_total: null,
          expansao_percentual: null,
          peso_solo_final: null
        }]
      }
    }));
  };

  const updateCilindroExpansao = (index, field, value) => {
    const newCilindros = [...formData.expansao.cilindros];
    if (field.startsWith("leitura_")) {
      const leituraIndex = parseInt(field.split("_")[1]);
      newCilindros[index].leituras[leituraIndex] = value ? parseFloat(value) : null;
    } else {
      newCilindros[index][field] = field === "numero" ? parseInt(value) : value;
    }
    
    setFormData(prev => ({
      ...prev,
      expansao: { ...prev.expansao, cilindros: newCilindros }
    }));
  };

  const removeCilindroExpansao = (index) => {
    setFormData(prev => ({
      ...prev,
      expansao: {
        ...prev.expansao,
        cilindros: prev.expansao.cilindros.filter((_, i) => i !== index)
      }
    }));
  };

  const addCilindroCBR = () => {
    setFormData(prev => ({
      ...prev,
      cbr: {
        ...prev.cbr,
        cilindros: [...prev.cbr.cilindros, {
          numero: prev.cbr.cilindros.length + 1,
          penetracoes: [
            { penetracao_mm: 2.54, leitura_anel: null, pressao_kgf_cm2: null, isc_percentual: null },
            { penetracao_mm: 5.08, leitura_anel: null, pressao_kgf_cm2: null, isc_percentual: null },
            { penetracao_mm: 7.62, leitura_anel: null, pressao_kgf_cm2: null, isc_percentual: null }
          ]
        }]
      }
    }));
  };

  const updatePenetracao = (cilindroIndex, penetracaoIndex, field, value) => {
    const newCilindros = [...formData.cbr.cilindros];
    const pen = newCilindros[cilindroIndex].penetracoes[penetracaoIndex];
    
    if (field === "leitura_anel") {
      pen.leitura_anel = value ? parseFloat(value) : null;
      if (pen.leitura_anel !== null) {
        pen.pressao_kgf_cm2 = pen.leitura_anel * PRESSAO_PADRAO;
        pen.isc_percentual = calcularISC(pen.leitura_anel);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      cbr: { ...prev.cbr, cilindros: newCilindros }
    }));
  };

  const removeCilindroCBR = (index) => {
    setFormData(prev => ({
      ...prev,
      cbr: {
        ...prev.cbr,
        cilindros: prev.cbr.cilindros.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (asSalvo = true) => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: asSalvo ? "rascunho" : "finalizado"
      };

      if (searchParams.get("id")) {
        await base44.entities.EnsaioProctorExpansaoCBR.update(
          searchParams.get("id"),
          dataToSave
        );
      } else {
        await base44.entities.EnsaioProctorExpansaoCBR.create(dataToSave);
      }

      alert(`Registro ${asSalvo ? "salvo em rascunho" : "finalizado"} com sucesso!`);
      navigate(`/MeusEnsaios`);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar registro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 min-h-screen bg-transparent">
      <div className="flex items-center gap-2 mb-8">
        <button onClick={() => navigate(-1)} className="text-[#00233B]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-[#00233B]">Ensaio Proctor + Expansão + CBR (ISC)</h1>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="compactacao">Compactação</TabsTrigger>
          <TabsTrigger value="expansao">Expansão</TabsTrigger>
          <TabsTrigger value="cbr">CBR (ISC)</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle>Dados Gerais do Ensaio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Ensaio *</Label>
                  <Input type="date" value={formData.data_ensaio} onChange={(e) => handleInputChange("data_ensaio", e.target.value)} />
                </div>
                <div>
                  <Label>Obra *</Label>
                  <select value={formData.obra_id} onChange={(e) => handleInputChange("obra_id", e.target.value)} className="w-full rounded-md border px-3 py-2">
                    <option value="">Selecione uma obra</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Local</Label>
                  <Input value={formData.local} onChange={(e) => handleInputChange("local", e.target.value)} />
                </div>
                <div>
                  <Label>KM</Label>
                  <Input value={formData.km} onChange={(e) => handleInputChange("km", e.target.value)} />
                </div>
                <div>
                  <Label>Pista</Label>
                  <Input value={formData.pista} onChange={(e) => handleInputChange("pista", e.target.value)} />
                </div>
                <div>
                  <Label>Furo</Label>
                  <Input value={formData.furo} onChange={(e) => handleInputChange("furo", e.target.value)} />
                </div>
                <div>
                  <Label>Material</Label>
                  <Input value={formData.material} onChange={(e) => handleInputChange("material", e.target.value)} />
                </div>
                <div>
                  <Label>Golpes (Proctor)</Label>
                  <select value={formData.golpes} onChange={(e) => handleInputChange("golpes", e.target.value)} className="w-full rounded-md border px-3 py-2">
                    <option>Intermediário</option>
                    <option>Modificado</option>
                  </select>
                </div>
                <div>
                  <Label>Laboratorista</Label>
                  <Input value={formData.laboratorista_name} onChange={(e) => handleInputChange("laboratorista_name", e.target.value)} />
                </div>
                <div>
                  <Label>Engenheiro Responsável</Label>
                  <Input value={formData.engenheiro_responsavel} onChange={(e) => handleInputChange("engenheiro_responsavel", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Observações</Label>
                  <textarea value={formData.observacoes} onChange={(e) => handleInputChange("observacoes", e.target.value)} className="w-full rounded-md border px-3 py-2" rows="3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compactacao">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Compactação Proctor</CardTitle>
              <Button onClick={addMolde} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar Molde
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.compactacao.moldes.map((molde, idx) => (
                <div key={idx} className="p-4 border border-white/30 rounded-lg bg-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[#00233B]">Molde {molde.numero}</h4>
                    <Button onClick={() => removeMolde(idx)} size="sm" variant="destructive" className="gap-1">
                      <Trash2 className="w-4 h-4" /> Remover
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Peso Molde (g)</Label>
                      <Input type="number" step="0.1" value={molde.peso_molde || ""} onChange={(e) => updateMolde(idx, "peso_molde", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Peso Molde + Amostra (g)</Label>
                      <Input type="number" step="0.1" value={molde.peso_molde_amostra || ""} onChange={(e) => updateMolde(idx, "peso_molde_amostra", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Peso Seco (g)</Label>
                      <Input type="number" step="0.1" value={molde.peso_seco || ""} onChange={(e) => updateMolde(idx, "peso_seco", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Peso Amostra (g) - Auto</Label>
                      <Input type="number" disabled value={molde.peso_amostra?.toFixed(1) || ""} />
                    </div>
                    <div>
                      <Label className="text-xs">Densidade Úmida (g/cm³)</Label>
                      <Input type="number" disabled value={molde.densidade_umida?.toFixed(3) || ""} />
                    </div>
                    <div>
                      <Label className="text-xs">Densidade Seca (g/cm³)</Label>
                      <Input type="number" disabled value={molde.densidade_seca?.toFixed(3) || ""} />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Umidade (%)</Label>
                      <Input type="number" step="0.1" value={molde.umidade || ""} onChange={(e) => updateMolde(idx, "umidade", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expansao">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expansão</CardTitle>
              <Button onClick={addCilindroExpansao} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar Cilindro
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.expansao.cilindros.map((cilindro, idx) => (
                <div key={idx} className="p-4 border border-white/30 rounded-lg bg-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[#00233B]">Cilindro {cilindro.numero}</h4>
                    <Button onClick={() => removeCilindroExpansao(idx)} size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Data</Label>
                      <Input type="date" value={cilindro.data} onChange={(e) => updateCilindroExpansao(idx, "data", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Hora</Label>
                      <Input type="time" value={cilindro.hora} onChange={(e) => updateCilindroExpansao(idx, "hora", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Altura Inicial (mm)</Label>
                      <Input type="number" step="0.1" value={cilindro.altura_inicial || ""} onChange={(e) => updateCilindroExpansao(idx, "altura_inicial", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cbr">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>CBR (ISC)</CardTitle>
              <Button onClick={addCilindroCBR} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar Cilindro
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.cbr.cilindros.map((cilindro, cidx) => (
                <div key={cidx} className="p-4 border border-white/30 rounded-lg bg-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[#00233B]">Cilindro {cilindro.numero}</h4>
                    <Button onClick={() => removeCilindroCBR(cidx)} size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {cilindro.penetracoes.map((pen, pidx) => (
                    <div key={pidx} className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Penetração {pen.penetracao_mm}mm</Label>
                        <Input type="number" disabled value={pen.penetracao_mm} />
                      </div>
                      <div>
                        <Label className="text-xs">Leitura Anel</Label>
                        <Input type="number" step="0.1" value={pen.leitura_anel || ""} onChange={(e) => updatePenetracao(cidx, pidx, "leitura_anel", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Pressão (kgf/cm²)</Label>
                        <Input type="number" disabled value={pen.pressao_kgf_cm2?.toFixed(2) || ""} />
                      </div>
                      <div>
                        <Label className="text-xs">ISC (%)</Label>
                        <Input type="number" disabled value={pen.isc_percentual?.toFixed(1) || ""} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 justify-end">
        <Button onClick={() => handleSubmit(true)} disabled={saving} variant="outline">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvar Rascunho
        </Button>
        <Button onClick={() => handleSubmit(false)} disabled={saving} className="bg-[#00233B]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Finalizar
        </Button>
      </div>
    </div>
  );
}