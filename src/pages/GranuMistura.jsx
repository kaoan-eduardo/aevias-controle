import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const PENEIRAS_PADRAO = [
  { astm: "3/4\"", abertura_mm: 19.0 },
  { astm: "1/2\"", abertura_mm: 12.5 },
  { astm: "3/8\"", abertura_mm: 9.5 },
  { astm: "#4", abertura_mm: 4.75 },
  { astm: "#8", abertura_mm: 2.36 },
  { astm: "#10", abertura_mm: 2.0 },
  { astm: "#16", abertura_mm: 1.18 },
  { astm: "#30", abertura_mm: 0.6 },
  { astm: "#40", abertura_mm: 0.42 },
  { astm: "#50", abertura_mm: 0.3 },
  { astm: "#100", abertura_mm: 0.15 },
  { astm: "#200", abertura_mm: 0.075 }
];

const getInitialPeneiras = () => PENEIRAS_PADRAO.map(p => ({
  ...p, retido_g: "", passante_g: "", passante_pct: ""
}));

const getInitialForm = () => ({
  obra_id: "",
  project_id: "",
  data_ensaio: new Date().toISOString().split("T")[0],
  horario: "",
  laboratorista_name: "",
  rodovia: "",
  trecho: "",
  camada: "",
  numero_projeto: "",
  material: "",
  local_coleta: "",
  pedreira: "",
  faixa: "",
  peso_amostra: "",
  peneiras: getInitialPeneiras(),
  umidade: { peso_umido: "", peso_seco: "", peso_agua: "", umidade_pct: "" },
  equivalente_areia: {
    medicoes: [
      { topo_argila: "", topo_areia: "", equivalente: "" },
      { topo_argila: "", topo_areia: "", equivalente: "" },
      { topo_argila: "", topo_areia: "", equivalente: "" }
    ],
    media: ""
  },
  materiais_pulverulentos: { peso_inicial: "", peso_apos_lavagem: "", teor_pct: "" },
  observacoes: "",
  status: "rascunho"
});

export default function GranuMistura() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(getInitialForm());
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [faixaGran, setFaixaGran] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadData(); }, [location.search]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const [obrasData, regionaisData, projectsData] = await Promise.all([
        base44.entities.Obra.list(),
        base44.entities.Regional.list(),
        base44.entities.Project.list()
      ]);
      const userAccessLevel = currentUser.access_level || (currentUser.role === "admin" ? "admin" : "user");
      let availableObras = obrasData;
      if (userAccessLevel === "user") {
        const reg = regionaisData.find(r => (r.laboratoristas_responsaveis || []).some(e => e.toLowerCase() === currentUser.email.toLowerCase()));
        availableObras = reg ? obrasData.filter(o => o.regional_id === reg.id && o.status === "em_andamento") : [];
      }
      setObras(availableObras);
      setRegionais(regionaisData);
      setProjects(projectsData);

      const params = new URLSearchParams(location.search);
      const editId = params.get("editId");
      if (editId) {
        const rec = await base44.entities.GranuMistura.get(editId);
        if (currentUser.role === "admin" || (rec.created_by === currentUser.email && (rec.status === "rascunho" || rec.approved === false))) {
          setEditingId(editId);
          setFormData({ ...getInitialForm(), ...rec, peneiras: rec.peneiras || getInitialPeneiras() });
          if (rec.project_id) {
            const proj = projectsData.find(p => p.id === rec.project_id);
            setSelectedProject(proj || null);
          }
        } else {
          alert("Sem permissão para editar.");
          navigate(createPageUrl("MeusEnsaios"));
        }
      } else {
        const init = getInitialForm();
        init.laboratorista_name = currentUser.laboratorista_name || currentUser.full_name || "";
        if (availableObras.length > 0) init.obra_id = availableObras[0].id;
        setFormData(init);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!formData.obra_id) { setFilteredProjects([]); return; }
    const obra = obras.find(o => o.id === formData.obra_id);
    const regional = obra ? regionais.find(r => r.id === obra.regional_id) : null;
    if (!regional?.project_ids) { setFilteredProjects([]); return; }
    let projs = projects.filter(p => regional.project_ids.includes(p.id));
    if (formData.material && formData.material !== "OUTRO") {
      projs = projs.filter(p => p.tipo_projeto === formData.material);
    }
    setFilteredProjects(projs);
  }, [formData.obra_id, formData.material, obras, regionais, projects]);

  useEffect(() => {
    if (!formData.project_id) { setSelectedProject(null); setFaixaGran(null); return; }
    const proj = projects.find(p => p.id === formData.project_id);
    setSelectedProject(proj || null);
    if (proj?.faixa_granulometrica_id) {
      base44.entities.FaixaGranulometrica.get(proj.faixa_granulometrica_id).then(f => setFaixaGran(f)).catch(() => setFaixaGran(null));
    } else {
      setFaixaGran(null);
    }
    if (proj?.pedreira) {
      setFormData(prev => ({ ...prev, pedreira: proj.pedreira }));
    }
  }, [formData.project_id, projects]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handlePeneiraChange = (idx, field, value) => {
    const newPeneiras = [...formData.peneiras];
    newPeneiras[idx] = { ...newPeneiras[idx], [field]: value };

    if (field === "retido_g") {
      const pesoAmostra = parseFloat(formData.peso_amostra) || 0;
      if (pesoAmostra > 0) {
        let retidoAcum = 0;
        newPeneiras.forEach((p, i) => {
          retidoAcum += parseFloat(newPeneiras[i].retido_g) || 0;
          const passG = Math.max(0, pesoAmostra - retidoAcum);
          newPeneiras[i].passante_g = passG.toFixed(2);
          newPeneiras[i].passante_pct = (passG / pesoAmostra * 100).toFixed(2);
        });
      }
    }
    setFormData(prev => ({ ...prev, peneiras: newPeneiras }));
  };

  const handlePesoAmostraChange = (value) => {
    const pesoAmostra = parseFloat(value) || 0;
    const newPeneiras = [...formData.peneiras];
    if (pesoAmostra > 0) {
      let retidoAcum = 0;
      newPeneiras.forEach((p, i) => {
        retidoAcum += parseFloat(newPeneiras[i].retido_g) || 0;
        const passG = Math.max(0, pesoAmostra - retidoAcum);
        newPeneiras[i].passante_g = passG.toFixed(2);
        newPeneiras[i].passante_pct = (passG / pesoAmostra * 100).toFixed(2);
      });
    }
    setFormData(prev => ({ ...prev, peso_amostra: value, peneiras: newPeneiras }));
  };

  const handleUmidadeChange = (field, value) => {
    setFormData(prev => {
      const u = { ...prev.umidade, [field]: value };
      const p1 = parseFloat(u.peso_umido) || 0;
      const p2 = parseFloat(u.peso_seco) || 0;
      u.peso_agua = p1 && p2 ? (p1 - p2).toFixed(2) : "";
      u.umidade_pct = p1 && p2 && p2 > 0 ? ((p1 - p2) / p2 * 100).toFixed(2) : "";
      return { ...prev, umidade: u };
    });
  };

  const handleEAChange = (idx, field, value) => {
    setFormData(prev => {
      const medicoes = [...prev.equivalente_areia.medicoes];
      medicoes[idx] = { ...medicoes[idx], [field]: value };
      const h1 = parseFloat(medicoes[idx].topo_argila) || 0;
      const h2 = parseFloat(medicoes[idx].topo_areia) || 0;
      medicoes[idx].equivalente = h1 && h2 && h1 > 0 ? ((h2 / h1) * 100).toFixed(2) : "";
      const validos = medicoes.filter(m => m.equivalente !== "");
      const media = validos.length > 0 ? (validos.reduce((s, m) => s + parseFloat(m.equivalente), 0) / validos.length).toFixed(2) : "";
      return { ...prev, equivalente_areia: { medicoes, media } };
    });
  };

  const handlePulvChange = (field, value) => {
    setFormData(prev => {
      const mp = { ...prev.materiais_pulverulentos, [field]: value };
      const pi = parseFloat(mp.peso_inicial) || 0;
      const pf = parseFloat(mp.peso_apos_lavagem) || 0;
      mp.teor_pct = pi && pf && pi > 0 ? ((pi - pf) / pi * 100).toFixed(2) : "";
      return { ...prev, materiais_pulverulentos: mp };
    });
  };

  const handleSubmit = async (e, saveStatus = "finalizado") => {
    e?.preventDefault();
    if (saveStatus === "finalizado" && !formData.obra_id) {
      alert("Selecione uma obra.");
      return;
    }
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: saveStatus,
        laboratorista_name: formData.laboratorista_name || user?.laboratorista_name || user?.full_name
      };
      if (editingId) {
        if (formData.approved === false && saveStatus === "finalizado") {
          dataToSave.approved = null;
          dataToSave.rejection_reason = null;
          dataToSave.was_rejected = true;
        }
        await base44.entities.GranuMistura.update(editingId, dataToSave);
      } else {
        await base44.entities.GranuMistura.create(dataToSave);
      }
      alert(saveStatus === "rascunho" ? "Progresso salvo!" : "Ensaio finalizado com sucesso!");
      navigate(createPageUrl("MeusEnsaios"));
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const obraSelecionada = obras.find(o => o.id === formData.obra_id);
  const regionalSelecionada = obraSelecionada ? regionais.find(r => r.id === obraSelecionada.regional_id) : null;
  const isApproved = formData.approved === true;
  const isEditable = !isApproved;

  const getFaixaTrabalho = (peneiraKey) => {
    if (!selectedProject?.faixa_trabalho) return { min: null, max: null };
    return { min: selectedProject.faixa_trabalho_min?.[peneiraKey], max: selectedProject.faixa_trabalho_max?.[peneiraKey] };
  };
  const getEspecificacao = (peneiraKey) => {
    if (!faixaGran) return { min: null, max: null };
    const peneira = faixaGran.peneiras?.find(p => {
      const ab = parseFloat(p.abertura);
      const penMap = {
        peneira_19_0mm: 19.0, peneira_12_5mm: 12.5, peneira_9_5mm: 9.5, peneira_4_75mm: 4.75,
        peneira_2_36mm: 2.36, peneira_2_0mm: 2.0, peneira_1_18mm: 1.18, peneira_0_6mm: 0.6,
        peneira_0_42mm: 0.42, peneira_0_3mm: 0.3, peneira_0_15mm: 0.15, peneira_0_075mm: 0.075
      };
      return Math.abs(ab - (penMap[peneiraKey] || 0)) < 0.01;
    });
    return peneira ? { min: peneira.min, max: peneira.max } : { min: null, max: null };
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Granulometria da Mistura" : "Nova Granulometria da Mistura"}</CardTitle>
            <CardDescription>Ensaio DNIT 412/25 - ME</CardDescription>
            {formData.rejection_reason && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{formData.rejection_reason}</p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* DADOS DA OBRA - 3 colunas */}
        <Card className="bg-slate-50">
          <CardHeader><CardTitle className="text-base">Dados da Obra</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* Coluna 1 */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold">CLIENTE</Label>
                  <Input value={regionalSelecionada?.cliente || ""} disabled className="bg-gray-50 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-bold">OBRA *</Label>
                  <Select value={formData.obra_id} onValueChange={v => handleChange("obra_id", v)} disabled={!!editingId || isApproved}>
                    <SelectTrigger><SelectValue placeholder="SELECT" /></SelectTrigger>
                    <SelectContent>{obras.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">RODOVIA</Label>
                  <Select value={formData.rodovia} onValueChange={v => handleChange("rodovia", v)} disabled={isApproved}>
                    <SelectTrigger><SelectValue placeholder="SELECT" /></SelectTrigger>
                    <SelectContent>{(obraSelecionada?.rodovias || []).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">TRECHO</Label>
                  <Input value={formData.trecho} onChange={e => handleChange("trecho", e.target.value)} disabled={isApproved} className="text-xs" placeholder="INPUT" />
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold">CAMADA</Label>
                  <Input value={formData.camada} onChange={e => handleChange("camada", e.target.value)} disabled={isApproved} className="text-xs" placeholder="DIGITAR" />
                </div>
                <div>
                  <Label className="text-xs font-bold">MATERIAL</Label>
                  <Select value={formData.material} onValueChange={v => { handleChange("material", v); handleChange("project_id", ""); }} disabled={isApproved}>
                    <SelectTrigger><SelectValue placeholder="SELECT" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAUQ">CAUQ</SelectItem>
                      <SelectItem value="MRAF">MRAF</SelectItem>
                      <SelectItem value="OUTRO">OUTRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">PEDREIRA</Label>
                  <Input value={formData.pedreira} onChange={e => handleChange("pedreira", e.target.value)} disabled={isApproved} className="text-xs" placeholder="DEPENDE PROJETO" />
                </div>
                <div>
                  <Label className="text-xs font-bold">FAIXA</Label>
                  <Input value={formData.faixa} onChange={e => handleChange("faixa", e.target.value)} disabled={isApproved} className="text-xs" placeholder={faixaGran?.nome || ""} />
                </div>
              </div>

              {/* Coluna 3 */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold">Nº PROJETO</Label>
                  <Input value={formData.numero_projeto} onChange={e => handleChange("numero_projeto", e.target.value)} disabled={isApproved} className="text-xs" placeholder="DIGITAR" />
                </div>
                <div>
                  <Label className="text-xs font-bold">LOCAL DE COLETA</Label>
                  <Input value={formData.local_coleta} onChange={e => handleChange("local_coleta", e.target.value)} disabled={isApproved} className="text-xs" placeholder="INPUT" />
                </div>
                <div>
                  <Label className="text-xs font-bold">HORÁRIO</Label>
                  <Input type="time" value={formData.horario} onChange={e => handleChange("horario", e.target.value)} disabled={isApproved} className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-bold">LABORATORISTA</Label>
                  <Input value={formData.laboratorista_name} onChange={e => handleChange("laboratorista_name", e.target.value)} disabled={isApproved} className="text-xs bg-gray-50" placeholder="AUTOMÁTICO" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ANÁLISE GRANULOMÉTRICA */}
        <Card className="bg-slate-50">
          <CardHeader><CardTitle className="text-base">Análise Granulométrica</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold">Peso da Amostra (g)</Label>
              <Input type="number" step="0.01" value={formData.peso_amostra} onChange={e => handlePesoAmostraChange(e.target.value)} disabled={isApproved} className="text-xs mt-1" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="border border-slate-300 px-2 py-1">ASTM</th>
                    <th className="border border-slate-300 px-2 py-1">(mm)</th>
                    <th className="border border-slate-300 px-2 py-1">RETIDO (g)</th>
                    <th className="border border-slate-300 px-2 py-1">PASS. (g)</th>
                    <th className="border border-slate-300 px-2 py-1">% PASS</th>
                    <th className="border border-slate-300 px-2 py-1" colSpan="2">FAIXA DE TRABALHO</th>
                    <th className="border border-slate-300 px-2 py-1" colSpan="2">ESPECIFICAÇÃO</th>
                  </tr>
                  <tr>
                    <th colSpan="5" className="border border-slate-300 bg-slate-50"></th>
                    <th className="border border-slate-300 px-2 py-1">MÍN. (%)</th>
                    <th className="border border-slate-300 px-2 py-1">MÁX. (%)</th>
                    <th className="border border-slate-300 px-2 py-1">MÍN. (%)</th>
                    <th className="border border-slate-300 px-2 py-1">MÁX. (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.peneiras.map((peneira, idx) => {
                    const pKey = `peneira_${String(peneira.abertura_mm).replace(".", "_")}mm`;
                    const ft = getFaixaTrabalho(pKey);
                    const esp = getEspecificacao(pKey);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-2 py-1 text-center font-medium">{peneira.astm}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center">{peneira.abertura_mm}</td>
                        <td className="border border-slate-300 px-1 py-1">
                          <Input type="number" step="0.01" value={peneira.retido_g}
                            onChange={e => handlePeneiraChange(idx, "retido_g", e.target.value)}
                            disabled={isApproved} className="h-6 text-[9px] text-center p-1" />
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-center bg-gray-50 text-[9px]">{peneira.passante_g || "-"}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center bg-gray-50 font-bold text-[9px]">{peneira.passante_pct || "-"}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center text-blue-700 text-[9px]">{ft.min ?? "-"}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center text-blue-700 text-[9px]">{ft.max ?? "-"}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center text-green-700 text-[9px]">{esp.min ?? "-"}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center text-green-700 text-[9px]">{esp.max ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CÁLCULOS - 3 painéis lado a lado */}
        <div className="grid grid-cols-3 gap-6">
          {/* Umidade */}
          <Card className="bg-slate-50">
            <CardHeader><CardTitle className="text-sm">Determinação de Umidade da Mistura</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold">Peso Úmido</span>
                <span>P₁</span>
                <span>g</span>
              </div>
              <Input type="number" step="0.01" value={formData.umidade.peso_umido} onChange={e => handleUmidadeChange("peso_umido", e.target.value)} disabled={isApproved} className="text-xs h-7" />
              <div className="flex justify-between">
                <span className="font-bold">Peso Seco</span>
                <span>P₂</span>
                <span>g</span>
              </div>
              <Input type="number" step="0.01" value={formData.umidade.peso_seco} onChange={e => handleUmidadeChange("peso_seco", e.target.value)} disabled={isApproved} className="text-xs h-7" />
              <div className="flex justify-between">
                <span className="font-bold">Peso Água</span>
                <span>Pω = P₁ - P₂</span>
                <span>g</span>
              </div>
              <Input value={formData.umidade.peso_agua || ""} disabled className="bg-gray-50 text-xs h-7" />
              <div className="flex justify-between">
                <span className="font-bold">Umidade</span>
                <span className="text-[10px]">U = (Pω/P₂)×100</span>
                <span>%</span>
              </div>
              <Input value={formData.umidade.umidade_pct || ""} disabled className="bg-gray-50 text-xs h-7 font-bold" />
            </CardContent>
          </Card>

          {/* Equivalente de Areia */}
          <Card className="bg-slate-50">
            <CardHeader><CardTitle className="text-sm">Determinação de Equivalente de Areia</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              {formData.equivalente_areia.medicoes.map((m, idx) => (
                <div key={idx} className="border rounded p-2 space-y-1">
                  <p className="font-bold text-[9px]">Medição {idx + 1}</p>
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <Label className="text-[9px]">Topo Argila</Label>
                      <Input type="number" step="0.01" value={m.topo_argila} onChange={e => handleEAChange(idx, "topo_argila", e.target.value)} disabled={isApproved} className="h-6 text-[9px] p-1" />
                    </div>
                    <div>
                      <Label className="text-[9px]">Topo Areia</Label>
                      <Input type="number" step="0.01" value={m.topo_areia} onChange={e => handleEAChange(idx, "topo_areia", e.target.value)} disabled={isApproved} className="h-6 text-[9px] p-1" />
                    </div>
                    <div>
                      <Label className="text-[9px]">EA (%)</Label>
                      <Input value={m.equivalente || ""} disabled className="h-6 bg-gray-50 text-[9px] p-1" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-bold">Média:</span>
                  <span className="text-[10px]">EA = (T.Areia/T.Argila)×100</span>
                </div>
                <Input value={formData.equivalente_areia.media || ""} disabled className="bg-gray-50 text-xs h-7 font-bold mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Materiais Pulverulentos */}
          <Card className="bg-slate-50">
            <CardHeader><CardTitle className="text-sm">Determinação de Materiais Pulverulentos</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold">Peso Inicial</span>
                <span>Pᵢ</span>
                <span>g</span>
              </div>
              <Input type="number" step="0.01" value={formData.materiais_pulverulentos.peso_inicial} onChange={e => handlePulvChange("peso_inicial", e.target.value)} disabled={isApproved} className="text-xs h-7" />
              <div className="flex justify-between">
                <span className="font-bold">Peso Após Lavagem</span>
                <span>Pf</span>
                <span>g</span>
              </div>
              <Input type="number" step="0.01" value={formData.materiais_pulverulentos.peso_apos_lavagem} onChange={e => handlePulvChange("peso_apos_lavagem", e.target.value)} disabled={isApproved} className="text-xs h-7" />
              <div className="flex justify-between">
                <span className="font-bold">Teor de Pulverulentos</span>
                <span className="text-[10px]">% = ((Pi-Pf)/Pi)×100</span>
                <span>%</span>
              </div>
              <Input value={formData.materiais_pulverulentos.teor_pct || ""} disabled className="bg-gray-50 text-xs h-7 font-bold" />
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        <div>
          <Label>Observações</Label>
          <Textarea value={formData.observacoes} onChange={e => handleChange("observacoes", e.target.value)} rows={3} disabled={isApproved} className="text-xs mt-1" />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("MeusEnsaios"))}>Cancelar</Button>
          {isEditable && (
            <>
              <Button type="button" variant="outline" onClick={e => handleSubmit(e, "rascunho")} disabled={saving} className="border-blue-400 text-blue-600 hover:bg-blue-50">
                <Save className="mr-2 h-4 w-4" /> Salvar Progresso
              </Button>
              <Button type="button" onClick={e => handleSubmit(e, "finalizado")} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Finalizar Registro
              </Button>
            </>
          )}
          {isApproved && <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-md font-medium"><CheckCircle className="w-4 h-4" /> Aprovado</span>}
        </div>
      </div>
    </div>
  );
}