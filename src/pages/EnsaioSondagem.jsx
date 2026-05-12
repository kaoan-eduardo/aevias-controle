import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Plus, Trash2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Obra } from "@/entities/Obra";
import { Project } from "@/entities/Project";
import { Regional } from "@/entities/Regional";

export default function EnsaioSondagem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");
  const [editingEnsaio, setEditingEnsaio] = useState(null);

  const [formData, setFormData] = useState({
    metodo_ensaio: "DNIT 428/2022",
    obra_id: "",
    project_id: "",
    data: new Date().toISOString().split('T')[0],
    usina_fornecedora: "",
    servico: "",
    rodovia: "",
    trecho: "",
    ensaio_realizado_por: "Afirma Evias",
    fator_correcao_prensa: 1.0000,
    dens_agua_25c: 0.9971,
    volume_vazios_projeto: "",
    dens_aparente_projeto: "",
    dens_rice_projeto: "",
    espessura_projeto: "",
    corpos_prova: [],
    observacoes: "",
    fotos: [],
    status: "rascunho"
  });

  useEffect(() => {
    loadInitialData(); // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.obra_id && obras.length > 0) {
      const obraSelecionada = obras.find(o => o.id === formData.obra_id);
      if (obraSelecionada && obraSelecionada.regional_id) {
        const regional = regionais.find(r => r.id === obraSelecionada.regional_id);
        if (regional && regional.project_ids) {
          const projectsFiltered = allProjects.filter(p => 
            (regional.project_ids.includes(p.id) || p.regional_id === regional.id) &&
            p.tipo_projeto === 'CAUQ'
          );
          setProjects(projectsFiltered);
        }
      }
    }
  }, [formData.obra_id, obras, regionais, allProjects]);

  useEffect(() => {
    if (formData.project_id && projects.length > 0) {
      const projectSelecionado = projects.find(p => p.id === formData.project_id);
      if (projectSelecionado) {
        setFormData(prev => ({
          ...prev,
          volume_vazios_projeto: projectSelecionado.volume_vazios?.otimo || "",
          dens_aparente_projeto: projectSelecionado.massa_especifica_aparente || "",
          dens_rice_projeto: projectSelecionado.densidade_maxima_medida || ""
        }));
      }
    }
  }, [formData.project_id, projects]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [userData, obrasData, projectsData, regionaisData] = await Promise.all([
        base44.auth.me(),
        Obra.list(),
        Project.list(),
        Regional.list()
      ]);

      setUser(userData);
      setRegionais(regionaisData);
      setAllProjects(projectsData);

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
            (obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'supervisao')
          );
          setObras(obrasRegional);
        } else {
          setObras([]);
        }
      } else {
        const obrasPermitidas = obrasData.filter(obra => 
          obra.tipo_obra === 'implantacao' || obra.tipo_obra === 'conservacao' || obra.tipo_obra === 'supervisao'
        );
        setObras(obrasPermitidas);
      }

      setFormData(prev => ({
        ...prev,
        laboratorista_name: userData.laboratorista_name || userData.full_name
      }));

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const ensaioToEdit = await base44.entities.EnsaioSondagem.get(editId);
        if (userData.role === 'admin' || (ensaioToEdit.created_by === userData.email && (ensaioToEdit.status === 'rascunho' || ensaioToEdit.approved === false))) {
          setEditingEnsaio(ensaioToEdit);
          setFormData(ensaioToEdit);
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
        }
      }
    } catch (error) {
      console.error("[EnsaioSondagem] Erro ao carregar dados:", error?.message || error);
      alert("Erro ao carregar dados iniciais.");
    } finally {
      setLoading(false);
    }
  };

  const addCorpoProva = () => {
    if (formData.corpos_prova.length >= 10) {
      alert("Máximo de 10 corpos de prova permitido.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      corpos_prova: [...prev.corpos_prova, {
        numero: prev.corpos_prova.length + 1,
        data_execucao: new Date().toISOString().split('T')[0],
        estaca: "",
        lado: "direito",
        medidas_espessura: ["", "", "", ""],
        media_espessura: "",
        peso_ao_ar: "",
        peso_imerso: "",
        peso_saturado: "",
        volume: "",
        densidade: "",
        gc_dens_projeto: "",
        dens_rice_do_dia: "",
        gc_dens_rice_dia: "",
        volume_vazios: "",
        leitura: "",
        rtcd_25c: ""
      }]
    }));
  };

  const removeCorpoProva = (index) => {
    setFormData(prev => ({
      ...prev,
      corpos_prova: prev.corpos_prova.filter((_, i) => i !== index).map((cp, idx) => ({
        ...cp,
        numero: idx + 1
      }))
    }));
  };

  const updateCorpoProva = (index, field, value) => {
    setFormData(prev => {
      const newCPs = [...prev.corpos_prova];
      newCPs[index] = { ...newCPs[index], [field]: value };

      // Calcular média de espessura apenas quando todas as 4 medidas estiverem preenchidas
      if (field === 'medidas_espessura') {
        const medidas = value.filter(v => v !== "" && !isNaN(parseFloat(v))).map(v => parseFloat(v));
        if (medidas.length === 4) {
          const media = medidas.reduce((a, b) => a + b, 0) / medidas.length;
          newCPs[index].media_espessura = media.toFixed(2);
        } else {
          newCPs[index].media_espessura = "";
        }
      }

      // Calcular volume baseado no método de ensaio
      if (['peso_ao_ar', 'peso_saturado', 'peso_imerso'].includes(field)) {
        if (prev.metodo_ensaio === "DNER 117/94") {
          // DNER 117/94: volume = peso_ao_ar - peso_imerso
          const pesoAr = parseFloat(newCPs[index].peso_ao_ar) || 0;
          const pesoIm = parseFloat(newCPs[index].peso_imerso) || 0;
          if (pesoAr > 0 && pesoIm > 0) {
            newCPs[index].volume = (pesoAr - pesoIm).toFixed(2);
          }
        } else {
          // DNIT 428/2022: volume = peso_saturado - peso_imerso
          const pesoSat = parseFloat(newCPs[index].peso_saturado) || 0;
          const pesoIm = parseFloat(newCPs[index].peso_imerso) || 0;
          if (pesoSat > 0 && pesoIm > 0) {
            newCPs[index].volume = (pesoSat - pesoIm).toFixed(2);
          }
        }
      }

      // Calcular densidade baseado no método de ensaio
      if (['peso_ao_ar', 'volume', 'peso_saturado', 'peso_imerso'].includes(field)) {
        const pesoAr = parseFloat(newCPs[index].peso_ao_ar) || 0;
        const densAgua = parseFloat(prev.dens_agua_25c) || 0.9971;

        if (prev.metodo_ensaio === "DNER 117/94") {
          // DNER 117/94: densidade = peso_ao_ar / volume (sem densidade da água)
          const vol = parseFloat(newCPs[index].volume) || 0;
          if (pesoAr > 0 && vol > 0) {
            newCPs[index].densidade = (pesoAr / vol).toFixed(3);
          }
        } else {
          // DNIT 428/2022: densidade = (peso_ao_ar / volume) * dens_agua_25c
          const vol = parseFloat(newCPs[index].volume) || 0;
          if (pesoAr > 0 && vol > 0) {
            newCPs[index].densidade = ((pesoAr / vol) * densAgua).toFixed(3);
          }
        }
      }

      // Calcular G.C. Dens. Projeto: (densidade / dens_aparente_projeto) * 100
      if (field === 'densidade' || prev.dens_aparente_projeto) {
        const dens = parseFloat(newCPs[index].densidade) || 0;
        const densProj = parseFloat(prev.dens_aparente_projeto) || 0;
        if (dens > 0 && densProj > 0) {
          newCPs[index].gc_dens_projeto = ((dens / densProj) * 100).toFixed(1);
        }
      }

      // Calcular G.C. Dens. RICE dia: (densidade / dens_rice_do_dia) * 100
      if (['densidade', 'dens_rice_do_dia'].includes(field)) {
        const dens = parseFloat(newCPs[index].densidade) || 0;
        const densRice = parseFloat(newCPs[index].dens_rice_do_dia) || 0;
        if (dens > 0 && densRice > 0) {
          newCPs[index].gc_dens_rice_dia = ((dens / densRice) * 100).toFixed(1);
        }
      }

      // Calcular Volume de Vazios: 100 - gc_dens_rice_dia
      if (field === 'gc_dens_rice_dia' || field === 'dens_rice_do_dia') {
        const gcRice = parseFloat(newCPs[index].gc_dens_rice_dia) || 0;
        if (gcRice > 0) {
          newCPs[index].volume_vazios = (100 - gcRice).toFixed(1);
        }
      }

      // Calcular RTCD: σR = (2 × F) / (π × D × H)
      // F = leitura (kgf) × fator × 9.80665 (conversão para N)
      // D = diâmetro CP (100 mm - padrão Marshall)
      // H = espessura média (convertida de cm para mm)
      if (field === 'leitura' || field === 'media_espessura') {
        const leitura = parseFloat(newCPs[index].leitura) || 0;
        const fator = parseFloat(prev.fator_correcao_prensa) || 1;
        const espessuraCm = parseFloat(newCPs[index].media_espessura) || 0;
        
        if (leitura > 0 && espessuraCm > 0) {
          // σR (MPa) = (2 × F_N) / (π × D × H)
          const F_N = leitura * fator * 9.80665; // Força em Newton
          const D_mm = 100; // Diâmetro padrão do CP Marshall em mm
          const H_mm = espessuraCm * 10; // Converter cm para mm
          
          newCPs[index].rtcd_25c = ((2 * F_N) / (Math.PI * D_mm * H_mm)).toFixed(2);
        }
      }

      return { ...prev, corpos_prova: newCPs };
    });
  };

  const updateMedidaEspessura = (cpIndex, medidaIndex, value) => {
    setFormData(prev => {
      const newCPs = [...prev.corpos_prova];
      const newMedidas = [...newCPs[cpIndex].medidas_espessura];
      newMedidas[medidaIndex] = value;
      
      return updateCorpoProva(cpIndex, 'medidas_espessura', newMedidas);
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
      files.forEach(file => { validateFile(file); });
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
      console.error("[EnsaioSondagem] Erro ao fazer upload das fotos:", error?.message || error);
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
        fator_correcao_prensa: parseFloat(formData.fator_correcao_prensa),
        dens_agua_25c: parseFloat(formData.dens_agua_25c),
        volume_vazios_projeto: formData.volume_vazios_projeto ? parseFloat(formData.volume_vazios_projeto) : null,
        dens_aparente_projeto: formData.dens_aparente_projeto ? parseFloat(formData.dens_aparente_projeto) : null,
        dens_rice_projeto: formData.dens_rice_projeto ? parseFloat(formData.dens_rice_projeto) : null,
        espessura_projeto: formData.espessura_projeto ? parseFloat(formData.espessura_projeto) : null,
        corpos_prova: formData.corpos_prova.map(cp => ({
          ...cp,
          numero: parseInt(cp.numero),
          medidas_espessura: cp.medidas_espessura.map(m => m ? parseFloat(m) : null).filter(m => m !== null),
          media_espessura: cp.media_espessura ? parseFloat(cp.media_espessura) : null,
          peso_ao_ar: cp.peso_ao_ar ? parseFloat(cp.peso_ao_ar) : null,
          peso_imerso: cp.peso_imerso ? parseFloat(cp.peso_imerso) : null,
          peso_saturado: cp.peso_saturado ? parseFloat(cp.peso_saturado) : null,
          volume: cp.volume ? parseFloat(cp.volume) : null,
          densidade: cp.densidade ? parseFloat(cp.densidade) : null,
          gc_dens_projeto: cp.gc_dens_projeto ? parseFloat(cp.gc_dens_projeto) : null,
          dens_rice_do_dia: cp.dens_rice_do_dia ? parseFloat(cp.dens_rice_do_dia) : null,
          gc_dens_rice_dia: cp.gc_dens_rice_dia ? parseFloat(cp.gc_dens_rice_dia) : null,
          volume_vazios: cp.volume_vazios ? parseFloat(cp.volume_vazios) : null,
          leitura: cp.leitura ? parseFloat(cp.leitura) : null,
          rtcd_25c: cp.rtcd_25c ? parseFloat(cp.rtcd_25c) : null
        }))
      };

      if (editingEnsaio) {
        await base44.entities.EnsaioSondagem.update(editingEnsaio.id, dataToSave);
        alert("Progresso salvo com sucesso!");
      } else {
        const newEnsaio = await base44.entities.EnsaioSondagem.create(dataToSave);
        setEditingEnsaio(newEnsaio);
        alert("Progresso salvo com sucesso!");
      }
    } catch (error) {
      console.error("[EnsaioSondagem] Erro ao salvar progresso:", error?.message || error);
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

    if (!formData.data || !formData.rodovia || !formData.trecho) {
      alert("Por favor, preencha todos os campos obrigatórios: Data, Rodovia e Trecho.");
      return;
    }

    // Validar se todos os CPs criados têm os dados essenciais preenchidos
    if (formData.corpos_prova.length > 0) {
      const cpsIncompletos = [];

      formData.corpos_prova.forEach(cp => {
        // Verificar se o CP tem algum dado preenchido (não está vazio)
        const temAlgumDado = cp.medidas_espessura.some(m => m !== "") || 
                             cp.peso_ao_ar || 
                             cp.peso_imerso || 
                             cp.peso_saturado;

        if (temAlgumDado) {
          // Se tem algum dado, precisa ter todos os essenciais
          const medidasPreenchidas = cp.medidas_espessura.filter(m => m !== "").length;
          const faltaMedidas = medidasPreenchidas > 0 && medidasPreenchidas < 4;
          const faltaPesoAr = !cp.peso_ao_ar;
          const faltaPesoImerso = !cp.peso_imerso;
          const faltaPesoSaturado = formData.metodo_ensaio === "DNIT 428/2022" && !cp.peso_saturado;

          if (faltaMedidas || faltaPesoAr || faltaPesoImerso || faltaPesoSaturado) {
            cpsIncompletos.push(cp.numero);
          }
        }
      });

      if (cpsIncompletos.length > 0) {
        alert(`Por favor, complete todos os dados obrigatórios dos corpos de prova: ${cpsIncompletos.join(', ')}\n\nCampos obrigatórios:\n- 4 medidas de espessura\n- Peso ao Ar\n- Peso Imerso${formData.metodo_ensaio === "DNIT 428/2022" ? '\n- Peso Saturado' : ''}`);
        return;
      }
    }

    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        status: "finalizado",
        fator_correcao_prensa: parseFloat(formData.fator_correcao_prensa),
        dens_agua_25c: parseFloat(formData.dens_agua_25c),
        volume_vazios_projeto: formData.volume_vazios_projeto ? parseFloat(formData.volume_vazios_projeto) : null,
        dens_aparente_projeto: formData.dens_aparente_projeto ? parseFloat(formData.dens_aparente_projeto) : null,
        dens_rice_projeto: formData.dens_rice_projeto ? parseFloat(formData.dens_rice_projeto) : null,
        espessura_projeto: formData.espessura_projeto ? parseFloat(formData.espessura_projeto) : null,
        corpos_prova: formData.corpos_prova.map(cp => ({
          ...cp,
          numero: parseInt(cp.numero),
          medidas_espessura: cp.medidas_espessura.map(m => m ? parseFloat(m) : null).filter(m => m !== null),
          media_espessura: cp.media_espessura ? parseFloat(cp.media_espessura) : null,
          peso_ao_ar: cp.peso_ao_ar ? parseFloat(cp.peso_ao_ar) : null,
          peso_imerso: cp.peso_imerso ? parseFloat(cp.peso_imerso) : null,
          peso_saturado: cp.peso_saturado ? parseFloat(cp.peso_saturado) : null,
          volume: cp.volume ? parseFloat(cp.volume) : null,
          densidade: cp.densidade ? parseFloat(cp.densidade) : null,
          gc_dens_projeto: cp.gc_dens_projeto ? parseFloat(cp.gc_dens_projeto) : null,
          dens_rice_do_dia: cp.dens_rice_do_dia ? parseFloat(cp.dens_rice_do_dia) : null,
          gc_dens_rice_dia: cp.gc_dens_rice_dia ? parseFloat(cp.gc_dens_rice_dia) : null,
          volume_vazios: cp.volume_vazios ? parseFloat(cp.volume_vazios) : null,
          leitura: cp.leitura ? parseFloat(cp.leitura) : null,
          rtcd_25c: cp.rtcd_25c ? parseFloat(cp.rtcd_25c) : null
        }))
      };

      if (editingEnsaio) {
        const updateData = { ...dataToSave };
        let successMessage = "Ensaio de Sondagem atualizado com sucesso!";

        if (editingEnsaio.approved === false) {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
          successMessage = "Ensaio atualizado com sucesso! O registro voltará para análise do administrador.";
        }

        await base44.entities.EnsaioSondagem.update(editingEnsaio.id, updateData);
        alert(successMessage);
      } else {
        await base44.entities.EnsaioSondagem.create(dataToSave);
        alert("Ensaio de Sondagem criado com sucesso!");
      }

      navigate(createPageUrl("MeusEnsaios"));
    } catch (error) {
      console.error("[EnsaioSondagem] Erro ao salvar ensaio:", error?.message || error);
      alert(`Erro ao salvar ensaio: ${error.message}`);
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

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingEnsaio ? 'Editar Ensaio de Sondagem' : 'Novo Ensaio de Sondagem'}</CardTitle>
            <CardDescription>
              Determinação da Densidade Relativa Aparente - DNIT 428-ME
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
              {/* Método de Ensaio - PRIMEIRO CAMPO */}
              <Card className="bg-blue-50 border-2 border-blue-300">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Método de Ensaio</CardTitle>
                  <CardDescription>Selecione o método de ensaio antes de preencher os dados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="metodo_ensaio" className="text-base font-semibold">Método de Ensaio *</Label>
                    <select
                      id="metodo_ensaio"
                      value={formData.metodo_ensaio}
                      onChange={(e) => setFormData({ ...formData, metodo_ensaio: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm mt-2"
                    >
                      <option value="DNIT 428/2022">DNIT 428/2022 (usa peso saturado e imerso)</option>
                      <option value="DNER 117/94">DNER 117/94 (usa apenas peso imerso)</option>
                    </select>
                    <p className="text-xs text-slate-600 mt-2">
                      {formData.metodo_ensaio === "DNIT 428/2022" 
                        ? "Volume = Peso Saturado - Peso Imerso | Densidade = (Peso ao Ar / Volume) × Dens. Água" 
                        : "Volume = Peso ao Ar - Peso Imerso | Densidade = Peso ao Ar / Volume"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Dados da Obra */}
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
                        onChange={(e) => setFormData({ ...formData, obra_id: e.target.value, project_id: "" })}
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
                      <Label htmlFor="project_id">Projeto</Label>
                      <select
                        id="project_id"
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        disabled={!formData.obra_id}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                      >
                        <option value="">Selecione o projeto (opcional)</option>
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
                      <Label htmlFor="data">Data {formData.status === 'finalizado' && '*'}</Label>
                      <Input
                        type="date"
                        id="data"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        required={formData.status === 'finalizado'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="rodovia">Rodovia {formData.status === 'finalizado' && '*'}</Label>
                      <select
                        id="rodovia"
                        value={formData.rodovia}
                        onChange={(e) => setFormData({ ...formData, rodovia: e.target.value })}
                        required={formData.status === 'finalizado'}
                        disabled={!formData.obra_id}
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
                      <Label htmlFor="trecho">Trecho {formData.status === 'finalizado' && '*'}</Label>
                      <Input
                        id="trecho"
                        value={formData.trecho}
                        onChange={(e) => setFormData({ ...formData, trecho: e.target.value })}
                        required={formData.status === 'finalizado'}
                        placeholder="Descrição do trecho"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="usina_fornecedora">Usina Fornecedora</Label>
                      <Input
                        id="usina_fornecedora"
                        value={formData.usina_fornecedora}
                        onChange={(e) => setFormData({ ...formData, usina_fornecedora: e.target.value })}
                        placeholder="Nome da usina"
                      />
                    </div>

                    <div>
                      <Label htmlFor="servico">Serviço</Label>
                      <select
                        id="servico"
                        value={formData.servico}
                        onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione o serviço</option>
                        <option value="Capa/Reperfilagem">Capa/Reperfilagem (GC: 97-101%)</option>
                        <option value="Remendos">Remendos (GC: 95-101%)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="ensaio_realizado_por">Ensaio realizado por:</Label>
                      <select
                        id="ensaio_realizado_por"
                        value={formData.ensaio_realizado_por}
                        onChange={(e) => setFormData({ ...formData, ensaio_realizado_por: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="Afirma Evias">Afirma Evias</option>
                        <option value="Empreiteira">Empreiteira</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parâmetros de Projeto */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Parâmetros de Projeto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="volume_vazios_projeto">Volume Vazios Projeto (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        id="volume_vazios_projeto"
                        value={formData.volume_vazios_projeto}
                        onChange={(e) => setFormData({ ...formData, volume_vazios_projeto: e.target.value })}
                        placeholder="Ex: 4.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dens_aparente_projeto">Dens. Aparente Projeto (g/cm³)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        id="dens_aparente_projeto"
                        value={formData.dens_aparente_projeto}
                        onChange={(e) => setFormData({ ...formData, dens_aparente_projeto: e.target.value })}
                        placeholder="Ex: 2.450"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dens_rice_projeto">Dens. RICE Projeto (g/cm³)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        id="dens_rice_projeto"
                        value={formData.dens_rice_projeto}
                        onChange={(e) => setFormData({ ...formData, dens_rice_projeto: e.target.value })}
                        placeholder="Ex: 2.560"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fator_correcao_prensa">Fator Correção Prensa</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        id="fator_correcao_prensa"
                        value={formData.fator_correcao_prensa}
                        onChange={(e) => setFormData({ ...formData, fator_correcao_prensa: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dens_agua_25c">Dens. Água 25°C (g/cm³)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        id="dens_agua_25c"
                        value={0.9971}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Corpos de Prova */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Corpos de Prova</CardTitle>
                  <CardDescription>Adicione até 10 corpos de prova</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.corpos_prova.map((cp, index) => (
                    <Card key={`cp-${index}`} className="border-2 border-slate-200">
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Corpo de Prova #{cp.numero}</CardTitle>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeCorpoProva(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Data Execução</Label>
                            <Input
                              type="date"
                              value={cp.data_execucao}
                              onChange={(e) => updateCorpoProva(index, 'data_execucao', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Estaca</Label>
                            <Input
                              value={cp.estaca}
                              onChange={(e) => updateCorpoProva(index, 'estaca', e.target.value)}
                              placeholder="Ex: km 10+500"
                            />
                          </div>
                          <div>
                            <Label>Lado</Label>
                            <select
                              value={cp.lado}
                              onChange={(e) => updateCorpoProva(index, 'lado', e.target.value)}
                              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="direito">Direito</option>
                              <option value="esquerdo">Esquerdo</option>
                            </select>
                          </div>
                          <div>
                            <Label>Média Espessura (cm)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.media_espessura}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Medidas de Espessura (cm)</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {cp.medidas_espessura.map((medida, mIndex) => (
                              <Input
                                key={mIndex}
                                type="number"
                                step="0.01"
                                value={medida}
                                onChange={(e) => {
                                  const newMedidas = [...cp.medidas_espessura];
                                  newMedidas[mIndex] = e.target.value;
                                  updateCorpoProva(index, 'medidas_espessura', newMedidas);
                                }}
                                placeholder={`M${mIndex + 1}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Peso ao Ar (g)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.peso_ao_ar}
                              onChange={(e) => updateCorpoProva(index, 'peso_ao_ar', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Peso Imerso (g)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.peso_imerso}
                              onChange={(e) => updateCorpoProva(index, 'peso_imerso', e.target.value)}
                            />
                          </div>
                          {formData.metodo_ensaio === "DNIT 428/2022" && (
                            <div>
                              <Label>Peso Saturado (g)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={cp.peso_saturado}
                                onChange={(e) => updateCorpoProva(index, 'peso_saturado', e.target.value)}
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Volume (cm³) - Calculado</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.volume}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                          <div>
                            <Label>Densidade (g/cm³) - Calculado</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              value={cp.densidade}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                          <div>
                            <Label>G.C. Dens. Projeto (%) - Calculado</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.gc_dens_projeto}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Dens. RICE do Dia (g/cm³)</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              value={cp.dens_rice_do_dia}
                              onChange={(e) => updateCorpoProva(index, 'dens_rice_do_dia', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>G.C. Dens. RICE (%) - Calculado</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.gc_dens_rice_dia}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                          <div>
                            <Label>Volume Vazios (%) - Calculado</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.volume_vazios}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Leitura (Kgf/cm²)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.leitura}
                              onChange={(e) => updateCorpoProva(index, 'leitura', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>RTCD 25°C (MPa) - Calculado</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cp.rtcd_25c}
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {formData.corpos_prova.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <p>Nenhum corpo de prova adicionado.</p>
                      <p className="text-sm">Clique em "Adicionar CP" abaixo para começar.</p>
                    </div>
                  )}

                  {/* Botão Adicionar CP na parte inferior */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="button"
                      onClick={addCorpoProva}
                      disabled={formData.corpos_prova.length >= 10}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar CP
                    </Button>
                  </div>
                  </CardContent>
                  </Card>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  placeholder="Observações sobre o ensaio..."
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))} disabled={saving}>
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSaveProgress}
                  disabled={saving || uploadingPhotos || !formData.obra_id}
                  className="border-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/10"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Progresso
                </Button>
                <Button
                  type="submit"
                  disabled={saving || uploadingPhotos}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalizar Registro
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