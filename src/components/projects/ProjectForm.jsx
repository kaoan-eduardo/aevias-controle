import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, AlertCircle, FileUp, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import AgregadosForm from "@/components/projects/AgregadosForm";

// ========================================
// MAPEAMENTO FIXO E FINAL DE PENEIRAS DNIT/ASTM
// ========================================
const PENEIRAS_PADRAO = {
  75.0: { key: 'peneira_75_0mm', nome: '75.0 mm', astm: '3"' },
  63.0: { key: 'peneira_63_0mm', nome: '63.0 mm', astm: '2 1/2"' },
  50.0: { key: 'peneira_50_0mm', nome: '50.0 mm', astm: '2"' },
  37.5: { key: 'peneira_37_5mm', nome: '37.5 mm', astm: '1 1/2"' },
  25.0: { key: 'peneira_25_0mm', nome: '25.0 mm', astm: '1"' },
  19.0: { key: 'peneira_19_0mm', nome: '19.0 mm', astm: '3/4"' },
  16.0: { key: 'peneira_16_0mm', nome: '16.0 mm', astm: '5/8"' },
  12.5: { key: 'peneira_12_5mm', nome: '12.5 mm', astm: '1/2"' },
  9.5: { key: 'peneira_9_5mm', nome: '9.5 mm', astm: '3/8"' },
  6.3: { key: 'peneira_6_3mm', nome: '6.3 mm', astm: '1/4"' },
  4.75: { key: 'peneira_4_75mm', nome: '4.75 mm', astm: 'Nº 4' },
  2.36: { key: 'peneira_2_36mm', nome: '2.36 mm', astm: 'Nº 8' },
  2.0: { key: 'peneira_2_0mm', nome: '2.0 mm', astm: 'Nº 10' }, 
  1.18: { key: 'peneira_1_18mm', nome: '1.18 mm', astm: 'Nº 16' },
  0.6: { key: 'peneira_0_6mm', nome: '0.6 mm', astm: 'Nº 30' },
  0.42: { key: 'peneira_0_42mm', nome: '0.42 mm', astm: 'Nº 40' },
  0.3: { key: 'peneira_0_3mm', nome: '0.3 mm', astm: 'Nº 50' },
  0.18: { key: 'peneira_0_18mm', nome: '0.18 mm', astm: 'Nº 80' },
  0.15: { key: 'peneira_0_15mm', nome: '0.15 mm', astm: 'Nº 100' },
  0.075: { key: 'peneira_0_075mm', nome: '0.075 mm', astm: 'Nº 200' }
};

const extrairAberturaNumero = (aberturaString) => {
  const match = aberturaString.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
};

const obterPeneiraPadrao = (aberturaString) => {
  const aberturaNum = extrairAberturaNumero(aberturaString);
  if (aberturaNum === null) return null;
  return PENEIRAS_PADRAO[aberturaNum];
};

export default function ProjectForm({ project, faixas, regionais, user, onSave, onCancel }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);

  const [formData, setFormData] = useState({
    tipo_projeto: "CAUQ",
    regional_id: "",
    name: "",
    client: "",
    location: "",
    description: "",
    faixa_granulometrica_id: "",
    equivalente_areia_minimo: "",
    agregados: [],
    ligante: { tipo: "", fornecedor: "", densidade: "" },
    emulsao_utilizada: "",
    temperaturas: {
      mistura: { min: "", max: "" },
      compactacao: { min: "", max: "" },
      espalhamento: { min: "", max: "" }
    },
    faixa_trabalho: {},
    faixa_trabalho_min: {},
    faixa_trabalho_max: {},
    teor_ligante: { min: "", max: "", otimo: "" },
    teor_ligante_residual: { min: "", max: "", otimo: "" },
    percentual_emulsao: "",
    taxa_aplicacao_mraf: { min: "", max: "", otimo: "" },
    densidade_mistura_mraf: "",
    massa_especifica_aparente: "",
    densidade_maxima_medida: "",
    volume_vazios: { min: "", max: "", otimo: "" },
    rtcd: { min: "" },
    estabilidade: { min: "", projeto: "" },
    fluencia: { min: "", max: "", projeto: "" },
    vam: { min: "", projeto: "" },
    rbv: { min: "", max: "", projeto: "" },
    carta_traco_concreto: {
      fck: "",
      slump_projeto: "",
      slump_minimo: "",
      slump_maximo: "",
      consumo_agua: "",
      tipo_aditivo: "",
      tipo_cimento: "",
      concreteira: ""
    },
    camadas_granulares: {
      melhorador_utilizado: "",
      umidade_otima: "",
      densidade_otima: "",
      resistencia_mpa: ""
    },
    status: "ativo",
  });

  const [peneirasDisponiveis, setPeneirasDisponiveis] = useState([]);
  
  const faixasFiltradas = React.useMemo(() => {
    if (!faixas) return [];
    return faixas.filter(f => f.tipo === formData.tipo_projeto && f.status === 'ativo');
  }, [faixas, formData.tipo_projeto]);

  const faixaSelecionada = React.useMemo(() => {
    return faixasFiltradas?.find(f => f.id === formData.faixa_granulometrica_id);
  }, [faixasFiltradas, formData.faixa_granulometrica_id]);

  useEffect(() => {
    if (faixaSelecionada?.peneiras && Array.isArray(faixaSelecionada.peneiras)) {
      const peneiras = faixaSelecionada.peneiras
        .map(p => {
          const peneiraPadrao = obterPeneiraPadrao(p.abertura);
          if (!peneiraPadrao) return null;
          
          return {
            key: peneiraPadrao.key,
            nome: peneiraPadrao.nome,
            astm: peneiraPadrao.astm,
            especificacao_min: p.min,
            especificacao_max: p.max
          };
        })
        .filter(p => p !== null);
      
      setPeneirasDisponiveis(peneiras);
    } else {
      setPeneirasDisponiveis([]);
    }
  }, [faixaSelecionada]);

  // Filtrar regionais baseado no nível de acesso do usuário
  const regionaisFiltradas = React.useMemo(() => {
    if (!regionais || !user) return [];
    
    const userAccessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
    
    if (userAccessLevel === 'admin') {
      return regionais.filter(r => r.status === 'ativa');
    }
    
    if (userAccessLevel === 'gestor_contrato') {
      return regionais.filter(r => 
        r.status === 'ativa' && 
        r.gestor_contrato_responsavel?.toLowerCase() === user.email.toLowerCase()
      );
    }
    
    if (userAccessLevel === 'sala_tecnica_afirmaevias') {
      return regionais.filter(r => {
        if (r.status !== 'ativa') return false;
        const salas = r.salas_tecnicas_responsaveis || [];
        return salas.some(email => email.toLowerCase() === user.email.toLowerCase());
      });
    }
    
    return [];
  }, [regionais, user]);

  useEffect(() => {
    if (project) {
      const isCartaTraco = project.tipo_projeto === 'CARTA_TRACO_CONCRETO' || project._isCartaTraco === true;
      
      const isCamadasGranularesEdit = project.tipo_projeto === "CAMADAS_GRANULARES";
      
      setFormData({
        tipo_projeto: project.tipo_projeto || "CAUQ",
        regional_id: project.regional_id || "",
        name: project.name || "",
        client: project.client || "",
        location: project.location || "",
        description: project.description || "",
        faixa_granulometrica_id: project.faixa_granulometrica_id || "",
        equivalente_areia_minimo: project.equivalente_areia_minimo || "",
        agregados: project.agregados || [],
        ligante: project.ligante || { tipo: "", fornecedor: "", densidade: "" },
        emulsao_utilizada: project.emulsao_utilizada || "",
        temperaturas: project.temperaturas || {
          mistura: { min: "", max: "" },
          compactacao: { min: "", max: "" },
          espalhamento: { min: "", max: "" }
        },
        faixa_trabalho: project.faixa_trabalho || {},
        faixa_trabalho_min: project.faixa_trabalho_min || {},
        faixa_trabalho_max: project.faixa_trabalho_max || {},
        teor_ligante: project.teor_ligante || { min: "", max: "", otimo: "" },
        teor_ligante_residual: project.teor_ligante_residual || { min: "", max: "", otimo: "" },
        percentual_emulsao: project.percentual_emulsao || "",
        taxa_aplicacao_mraf: project.taxa_aplicacao_mraf || { min: "", max: "", otimo: "" },
        densidade_mistura_mraf: project.densidade_mistura_mraf || "",
        massa_especifica_aparente: project.massa_especifica_aparente || "",
        densidade_maxima_medida: project.densidade_maxima_medida || "",
        volume_vazios: project.volume_vazios || { min: "", max: "", otimo: "" },
        rtcd: project.rtcd || { min: "" },
        estabilidade: project.estabilidade || { min: "", projeto: "" },
        fluencia: project.fluencia || { min: "", max: "", projeto: "" },
        vam: project.vam || { min: "", projeto: "" },
        rbv: project.rbv || { min: "", max: "", projeto: "" },
        carta_traco_concreto: isCartaTraco ? {
          fck: project.fck || "",
          slump_projeto: project.slump_projeto || "",
          slump_minimo: project.slump_minimo || "",
          slump_maximo: project.slump_maximo || "",
          consumo_agua: project.consumo_agua || "",
          tipo_aditivo: project.tipo_aditivo || "",
          tipo_cimento: project.tipo_cimento || "",
          concreteira: project.concreteira || ""
        } : {
          fck: "",
          slump_projeto: "",
          slump_minimo: "",
          slump_maximo: "",
          consumo_agua: "",
          tipo_aditivo: "",
          tipo_cimento: "",
          concreteira: ""
        },
        camadas_granulares: isCamadasGranularesEdit ? {
          melhorador_utilizado: project.melhorador_utilizado || "",
          umidade_otima: project.umidade_otima || "",
          densidade_otima: project.densidade_otima || "",
          resistencia_mpa: project.resistencia_mpa || ""
        } : {
          melhorador_utilizado: "",
          umidade_otima: "",
          densidade_otima: "",
          resistencia_mpa: ""
        },
        status: project.status || "ativo",
      });
    }
  }, [project]);

  // Quando o tipo do projeto mudar, limpar a faixa selecionada se ela não for compatível
  useEffect(() => {
    if (formData.faixa_granulometrica_id) {
      // Check if the current faixa_granulometrica_id is still present in the filtered list
      const isCurrentFaixaCompatible = faixasFiltradas.some(f => f.id === formData.faixa_granulometrica_id);
      if (!isCurrentFaixaCompatible) {
        setFormData(prev => ({ ...prev, faixa_granulometrica_id: "" }));
      }
    }
  }, [formData.tipo_projeto, formData.faixa_granulometrica_id, faixasFiltradas]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleNestedInputChange = (group, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value === '' ? '' : parseFloat(value),
      },
    }));
  };

  const handleDeepNestedInputChange = (group, subgroup, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [subgroup]: {
          ...prev[group][subgroup],
          [field]: value === '' ? '' : parseFloat(value),
        },
      },
    }));
  };

  const handleCartaTracoChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      carta_traco_concreto: {
        ...prev.carta_traco_concreto,
        [field]: value === '' ? '' : (field === 'tipo_aditivo' || field === 'tipo_cimento' || field === 'concreteira' ? value : parseFloat(value)),
      },
    }));
  };

  const handleCamadasGranularesChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      camadas_granulares: {
        ...prev.camadas_granulares,
        [field]: value === '' ? '' : (field === 'melhorador_utilizado' ? value : parseFloat(value)),
      },
    }));
  };

  const adicionarAgregado = () => {
    setFormData(prev => ({
      ...prev,
      agregados: [...prev.agregados, {
        nome: "",
        pedreira: "",
        percentual_mistura: "",
        granulometria: {}
      }]
    }));
  };

  const removerAgregado = (index) => {
    setFormData(prev => ({
      ...prev,
      agregados: prev.agregados.filter((_, i) => i !== index)
    }));
  };

  const handleAgregadoChange = (index, field, value) => {
    setFormData(prev => {
      const newAgregados = [...prev.agregados];
      if (field === 'percentual_mistura') {
        newAgregados[index][field] = value === '' ? '' : parseFloat(value);
      } else {
        newAgregados[index][field] = value;
      }
      return { ...prev, agregados: newAgregados };
    });
  };

  const handleAgregadoGranChange = (agregadoIndex, peneiraKey, value) => {
    setFormData(prev => {
      const newAgregados = [...prev.agregados];
      if (!newAgregados[agregadoIndex].granulometria) {
        newAgregados[agregadoIndex].granulometria = {};
      }
      newAgregados[agregadoIndex].granulometria = {
        ...newAgregados[agregadoIndex].granulometria,
        [peneiraKey]: value === '' ? '' : parseFloat(value)
      };
      return { ...prev, agregados: newAgregados };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar se tem tipo de projeto, faixa e regional selecionados
    if (!formData.tipo_projeto || !formData.faixa_granulometrica_id || !formData.regional_id) {
      setExtractionError('Por favor, selecione o tipo de projeto, faixa granulométrica e regional antes de fazer upload.');
      return;
    }

    // Validar tamanho do arquivo (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setExtractionError('O arquivo é muito grande. Tamanho máximo: 50MB');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      // Upload do arquivo
      console.log('📤 Fazendo upload do arquivo...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log('✅ Arquivo enviado:', file_url);

      setUploadedFile(file_url);

      // Chamar função de extração
      console.log('🤖 Extraindo dados do projeto...');
      const response = await base44.functions.invoke('extrairDadosProjeto', {
        file_url,
        tipo_projeto: formData.tipo_projeto,
        faixa_id: formData.faixa_granulometrica_id,
        regional_id: formData.regional_id
      });

      console.log('✅ Dados extraídos:', response);

      if (response.success && response.dados) {
        // Preencher o formulário com os dados extraídos
        setFormData(prev => ({
          ...prev,
          ...response.dados,
          // Manter os campos já selecionados
          tipo_projeto: prev.tipo_projeto,
          regional_id: prev.regional_id,
          faixa_granulometrica_id: prev.faixa_granulometrica_id
        }));

        alert('✅ Dados extraídos com sucesso! Revise os campos antes de salvar.');
      } else {
        throw new Error('Falha ao extrair dados do arquivo');
      }

    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      setExtractionError(error.message || 'Erro ao extrair dados do arquivo');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const sanitizeNumber = (value) => {
      if (value === '' || value === null || value === undefined) return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };
    
    const sanitizeNestedNumbers = (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = sanitizeNestedNumbers(value);
        } else {
          result[key] = sanitizeNumber(value);
        }
      }
      return result;
    };

    const isCartaTraco = formData.tipo_projeto === 'CARTA_TRACO_CONCRETO';
    const isCamadasGranularesSubmit = formData.tipo_projeto === 'CAMADAS_GRANULARES';
    
    if (isCartaTraco) {
      const dataToSave = {
        tipo_projeto: 'CARTA_TRACO_CONCRETO',
        regional_id: formData.regional_id || null,
        name: formData.name,
        client: formData.client,
        location: formData.location || null,
        description: formData.description || null,
        status: formData.status,
        fck: sanitizeNumber(formData.carta_traco_concreto.fck),
        slump_projeto: sanitizeNumber(formData.carta_traco_concreto.slump_projeto),
        slump_minimo: sanitizeNumber(formData.carta_traco_concreto.slump_minimo),
        slump_maximo: sanitizeNumber(formData.carta_traco_concreto.slump_maximo),
        consumo_agua: sanitizeNumber(formData.carta_traco_concreto.consumo_agua),
        tipo_aditivo: formData.carta_traco_concreto.tipo_aditivo || null,
        tipo_cimento: formData.carta_traco_concreto.tipo_cimento || null,
        concreteira: formData.carta_traco_concreto.concreteira || null
      };
      
      console.log('📤 Salvando Carta Traço:', dataToSave);
      onSave(dataToSave);
    } else if (isCamadasGranularesSubmit) {
      const sanitizedAgregados = formData.agregados.map(agregado => ({
        ...agregado,
        percentual_mistura: sanitizeNumber(agregado.percentual_mistura),
        granulometria: sanitizeNestedNumbers(agregado.granulometria)
      }));

      const dataToSave = {
        tipo_projeto: 'CAMADAS_GRANULARES',
        regional_id: formData.regional_id || null,
        name: formData.name,
        client: formData.client,
        location: formData.location || null,
        description: formData.description || null,
        status: formData.status,
        faixa_granulometrica_id: formData.faixa_granulometrica_id || null,
        agregados: sanitizedAgregados,
        melhorador_utilizado: formData.camadas_granulares.melhorador_utilizado || null,
        umidade_otima: sanitizeNumber(formData.camadas_granulares.umidade_otima),
        densidade_otima: sanitizeNumber(formData.camadas_granulares.densidade_otima),
        resistencia_mpa: sanitizeNumber(formData.camadas_granulares.resistencia_mpa)
      };

      console.log('📤 Salvando Camadas Granulares:', dataToSave);
      onSave(dataToSave);
    } else {
      // Para CAUQ/MRAF/BGS, salvar na estrutura original
      const sanitizedAgregados = formData.agregados.map(agregado => ({
        ...agregado,
        percentual_mistura: sanitizeNumber(agregado.percentual_mistura),
        granulometria: sanitizeNestedNumbers(agregado.granulometria)
      }));
      
      const sanitizedLigante = {
        tipo: formData.ligante.tipo || null,
        fornecedor: formData.ligante.fornecedor || null,
        densidade: sanitizeNumber(formData.ligante.densidade)
      };
      
      const dataToSave = {
        tipo_projeto: formData.tipo_projeto,
        regional_id: formData.regional_id || null,
        name: formData.name,
        client: formData.client,
        location: formData.location || null,
        description: formData.description || null,
        status: formData.status,
        faixa_granulometrica_id: formData.faixa_granulometrica_id || null,
        equivalente_areia_minimo: sanitizeNumber(formData.equivalente_areia_minimo),
        agregados: sanitizedAgregados,
        ligante: sanitizedLigante,
        emulsao_utilizada: formData.emulsao_utilizada || null,
        temperaturas: sanitizeNestedNumbers(formData.temperaturas),
        faixa_trabalho: sanitizeNestedNumbers(formData.faixa_trabalho),
        faixa_trabalho_min: sanitizeNestedNumbers(formData.faixa_trabalho_min),
        faixa_trabalho_max: sanitizeNestedNumbers(formData.faixa_trabalho_max),
        teor_ligante: sanitizeNestedNumbers(formData.teor_ligante),
        teor_ligante_residual: sanitizeNestedNumbers(formData.teor_ligante_residual),
        percentual_emulsao: sanitizeNumber(formData.percentual_emulsao),
        taxa_aplicacao_mraf: sanitizeNestedNumbers(formData.taxa_aplicacao_mraf),
        densidade_mistura_mraf: sanitizeNumber(formData.densidade_mistura_mraf),
        massa_especifica_aparente: sanitizeNumber(formData.massa_especifica_aparente),
        densidade_maxima_medida: sanitizeNumber(formData.densidade_maxima_medida),
        volume_vazios: sanitizeNestedNumbers(formData.volume_vazios),
        rtcd: sanitizeNestedNumbers(formData.rtcd),
        estabilidade: sanitizeNestedNumbers(formData.estabilidade),
        fluencia: sanitizeNestedNumbers(formData.fluencia),
        vam: sanitizeNestedNumbers(formData.vam),
        rbv: sanitizeNestedNumbers(formData.rbv)
      };
      
      console.log('📤 Salvando projeto:', dataToSave);
      onSave(dataToSave);
    }
  };

  const peneirasCarregadas = peneirasDisponiveis.length > 0;
  const isCauq = formData.tipo_projeto === "CAUQ";
  const isMraf = formData.tipo_projeto === "MRAF";
  const isBgs = formData.tipo_projeto === "BGS";
  const isCartaTraco = formData.tipo_projeto === "CARTA_TRACO_CONCRETO";
  const isCamadasGranulares = formData.tipo_projeto === "CAMADAS_GRANULARES";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tipo_projeto">Tipo de Projeto *</Label>
            <Select 
              value={formData.tipo_projeto} 
              onValueChange={(value) => handleInputChange('tipo_projeto', value)}
              disabled={!!project}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAUQ">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">CAUQ</Badge>
                    <span>Concreto Asfáltico Usinado a Quente</span>
                  </div>
                </SelectItem>
                <SelectItem value="MRAF">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">MRAF</Badge>
                    <span>Micro Revestimento Asfáltico a Frio</span>
                  </div>
                </SelectItem>
                <SelectItem value="BGS">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500">BGS</Badge>
                    <span>Brita Graduada Simples</span>
                  </div>
                </SelectItem>
                <SelectItem value="CARTA_TRACO_CONCRETO">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500">CARTA TRAÇO</Badge>
                    <span>Carta Traço de Concreto</span>
                  </div>
                </SelectItem>
                <SelectItem value="CAMADAS_GRANULARES">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500">CAMADAS GRANULARES</Badge>
                    <span>Camadas Granulares</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {!!project && (
              <p className="text-xs text-slate-500 mt-1">
                O tipo de projeto não pode ser alterado após a criação
              </p>
            )}
          </div>

          {regionaisFiltradas.length > 0 && (
            <div>
              <Label htmlFor="regional_id">Regional *</Label>
              <Select 
                value={formData.regional_id} 
                onValueChange={(value) => handleInputChange('regional_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a regional" />
                </SelectTrigger>
                <SelectContent>
                  {regionaisFiltradas.map(regional => (
                    <SelectItem key={regional.id} value={regional.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#BFCF99]/30 text-[#00233B]">
                          {regional.codigo}
                        </Badge>
                        <span>{regional.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Selecione a regional à qual este projeto será vinculado
                </p>
                </div>
                )}

                {/* Agente de IA - Upload de Arquivo */}
                {!isCartaTraco && formData.tipo_projeto && formData.faixa_granulometrica_id && formData.regional_id && !project && (
                <div className="p-4 border-2 border-dashed border-[#BFCF99] rounded-lg bg-[#BFCF99]/5">
                <div className="flex items-start gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-[#00233B] mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-[#00233B] mb-1">
                    Agente de IA - Preenchimento Automático
                  </h3>
                  <p className="text-sm text-[#00233B]/80 mb-3">
                    Faça upload de um arquivo do projeto (PDF, imagem, documento) e deixe a IA preencher os parâmetros automaticamente.
                  </p>

                  {isExtracting ? (
                    <div className="flex items-center gap-2 text-[#00233B]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analisando arquivo e extraindo dados...</span>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#00233B] text-[#F2F1EF] rounded-lg cursor-pointer hover:bg-[#00233B]/90 transition-colors">
                      <FileUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Escolher Arquivo do Projeto</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={isExtracting}
                      />
                    </label>
                  )}

                  {uploadedFile && !isExtracting && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Arquivo processado com sucesso
                    </div>
                  )}

                  {extractionError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      {extractionError}
                    </div>
                  )}
                </div>
                </div>
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => handleInputChange("client", e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isCartaTraco && (
        <Card>
          <CardHeader>
            <CardTitle>Dados da Carta Traço de Concreto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fck">FCK (MPa) *</Label>
                <Input
                  id="fck"
                  type="number"
                  step="0.1"
                  value={formData.carta_traco_concreto.fck}
                  onChange={(e) => handleCartaTracoChange('fck', e.target.value)}
                  placeholder="Ex: 25"
                  required
                />
              </div>

              <div>
                <Label htmlFor="concreteira">Concreteira Fornecedora</Label>
                <Input
                  id="concreteira"
                  value={formData.carta_traco_concreto.concreteira}
                  onChange={(e) => handleCartaTracoChange('concreteira', e.target.value)}
                  placeholder="Ex: Concreteira XYZ"
                />
              </div>

              <div>
                <Label htmlFor="consumo_agua">Consumo de Água (L/m³)</Label>
                <Input
                  id="consumo_agua"
                  type="number"
                  step="0.1"
                  value={formData.carta_traco_concreto.consumo_agua}
                  onChange={(e) => handleCartaTracoChange('consumo_agua', e.target.value)}
                  placeholder="Ex: 180"
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50">
              <Label className="font-semibold mb-3 block">Slump (cm)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Mínimo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.carta_traco_concreto.slump_minimo}
                    onChange={(e) => handleCartaTracoChange('slump_minimo', e.target.value)}
                    placeholder="Mín"
                  />
                </div>
                <div>
                  <Label className="text-xs">Projeto</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.carta_traco_concreto.slump_projeto}
                    onChange={(e) => handleCartaTracoChange('slump_projeto', e.target.value)}
                    placeholder="Projeto"
                  />
                </div>
                <div>
                  <Label className="text-xs">Máximo</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.carta_traco_concreto.slump_maximo}
                    onChange={(e) => handleCartaTracoChange('slump_maximo', e.target.value)}
                    placeholder="Máx"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_cimento">Tipo de Cimento</Label>
                <Input
                  id="tipo_cimento"
                  value={formData.carta_traco_concreto.tipo_cimento}
                  onChange={(e) => handleCartaTracoChange('tipo_cimento', e.target.value)}
                  placeholder="Ex: CP II-E-32"
                />
              </div>

              <div>
                <Label htmlFor="tipo_aditivo">Tipo de Aditivo</Label>
                <Input
                  id="tipo_aditivo"
                  value={formData.carta_traco_concreto.tipo_aditivo}
                  onChange={(e) => handleCartaTracoChange('tipo_aditivo', e.target.value)}
                  placeholder="Ex: Plastificante"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCartaTraco && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Especificação Granulométrica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="faixa_granulometrica_id">Faixa de Referência (Especificação) *</Label>
                <Select 
                  value={formData.faixa_granulometrica_id} 
                  onValueChange={(value) => handleInputChange('faixa_granulometrica_id', value)} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a faixa granulométrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {faixasFiltradas?.map(faixa => (
                      <SelectItem key={faixa.id} value={faixa.id}>
                        <div className="flex items-center gap-2">
                          <Badge className={
                           faixa.tipo === 'CAUQ' ? 'bg-blue-500' :
                           faixa.tipo === 'MRAF' ? 'bg-green-500' :
                           faixa.tipo === 'BGS' ? 'bg-purple-500' :
                           'bg-amber-500'
                          }>
                           {faixa.tipo}
                          </Badge>
                          <span>{faixa.nome} ({faixa.orgao} - {faixa.especificacao})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {faixasFiltradas.length === 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">
                      ⚠️ Nenhuma faixa granulométrica do tipo <Badge className={
                        formData.tipo_projeto === 'CAUQ' ? 'bg-blue-500 text-white' :
                        formData.tipo_projeto === 'MRAF' ? 'bg-green-500 text-white' :
                        'bg-purple-500 text-white'
                      }>{formData.tipo_projeto}</Badge> encontrada.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Crie uma faixa compatível na página de Faixas Granulométricas antes de continuar.
                    </p>
                  </div>
                )}
                {faixasFiltradas.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Mostrando apenas faixas do tipo {formData.tipo_projeto} ({faixasFiltradas.length} disponível{faixasFiltradas.length !== 1 ? 'is' : ''})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="equivalente_areia_minimo">Equivalente de Areia Mínimo (%) *</Label>
                <Input
                  id="equivalente_areia_minimo"
                  type="number"
                  step="0.1"
                  value={formData.equivalente_areia_minimo}
                  onChange={(e) => handleInputChange("equivalente_areia_minimo", e.target.value)}
                  placeholder="Ex: 55"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Limite mínimo de equivalente de areia exigido para este projeto
                </p>
              </div>

              {faixaSelecionada && peneirasCarregadas && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Limites de Especificação ({peneirasDisponiveis.length} peneiras PADRONIZADAS):</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-2 py-1 text-left">ASTM</th>
                          <th className="px-2 py-1 text-left">Abertura</th>
                          <th className="px-2 py-1 text-center">Mín (%)</th>
                          <th className="px-2 py-1 text-center">Máx (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {peneirasDisponiveis.map((peneira, idx) => (
                          <tr key={idx} className="border-t border-blue-200">
                            <td className="px-2 py-1 font-semibold">{peneira.astm}</td>
                            <td className="px-2 py-1">{peneira.nome}</td>
                            <td className="px-2 py-1 text-center">{peneira.especificacao_min}</td>
                            <td className="px-2 py-1 text-center">{peneira.especificacao_max}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isCauq && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Ligante Asfáltico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo de Ligante</Label>
                      <Input
                        value={formData.ligante.tipo}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ligante: { ...prev.ligante, tipo: e.target.value }
                        }))}
                        placeholder="Ex: CAP 50/70"
                      />
                    </div>
                    <div>
                      <Label>Fornecedor</Label>
                      <Input
                        value={formData.ligante.fornecedor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ligante: { ...prev.ligante, fornecedor: e.target.value }
                        }))}
                        placeholder="Ex: Petrobras"
                      />
                    </div>
                    <div>
                      <Label>Densidade (g/cm³)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={formData.ligante.densidade}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ligante: { ...prev.ligante, densidade: e.target.value === '' ? '' : parseFloat(e.target.value) }
                        }))}
                        placeholder="Ex: 1.015"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {peneirasCarregadas ? (
                <AgregadosForm
                  agregados={formData.agregados}
                  peneirasDisponiveis={peneirasDisponiveis}
                  onAdd={adicionarAgregado}
                  onRemove={removerAgregado}
                  onChange={handleAgregadoChange}
                  onGranChange={handleAgregadoGranChange}
                />
              ) : (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-amber-800">
                      ⚠️ Selecione uma faixa granulométrica primeiro.
                    </p>
                  </CardContent>
                </Card>
              )}

              {peneirasCarregadas && (
                <Card>
                  <CardHeader>
                    <CardTitle>Faixa de Trabalho (Graduação da Mistura) - PADRONIZADA DNIT/ASTM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Limites mínimo, ótimo e máximo da faixa de trabalho (% passante)
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-slate-300">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="border border-slate-300 px-3 py-2 text-left text-sm font-medium sticky left-0 bg-slate-100 z-10">
                              Peneira
                            </th>
                            {peneirasDisponiveis.map(peneira => (
                              <th key={peneira.key} className="border border-slate-300 px-3 py-2 text-center text-sm font-medium min-w-[100px]">
                                <div className="font-bold">{peneira.astm}</div>
                                <div className="text-xs text-gray-600">{peneira.nome}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 px-3 py-2 font-medium bg-slate-50 sticky left-0 z-10">
                              Mínimo (%)
                            </td>
                            {peneirasDisponiveis.map(peneira => (
                              <td key={peneira.key} className="border border-slate-300 px-2 py-1">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={formData.faixa_trabalho_min[peneira.key] ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      faixa_trabalho_min: {
                                        ...prev.faixa_trabalho_min,
                                        [peneira.key]: value
                                      }
                                    }));
                                  }}
                                  placeholder="Min"
                                  className="text-sm text-center"
                                />
                              </td>
                            ))}
                          </tr>

                          <tr className="bg-blue-50">
                            <td className="border border-slate-300 px-3 py-2 font-medium bg-blue-100 sticky left-0 z-10">
                              Ótimo/Projeto (%)
                            </td>
                            {peneirasDisponiveis.map(peneira => (
                              <td key={peneira.key} className="border border-slate-300 px-2 py-1 bg-blue-50">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={formData.faixa_trabalho[peneira.key] ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      faixa_trabalho: {
                                        ...prev.faixa_trabalho,
                                        [peneira.key]: value
                                      }
                                    }));
                                  }}
                                  placeholder="Ótimo"
                                  className="text-sm text-center font-semibold"
                                />
                              </td>
                            ))}
                          </tr>

                          <tr>
                            <td className="border border-slate-300 px-3 py-2 font-medium bg-slate-50 sticky left-0 z-10">
                              Máximo (%)
                            </td>
                            {peneirasDisponiveis.map(peneira => (
                              <td key={peneira.key} className="border border-slate-300 px-2 py-1">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={formData.faixa_trabalho_max[peneira.key] ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      faixa_trabalho_max: {
                                        ...prev.faixa_trabalho_max,
                                        [peneira.key]: value
                                      }
                                    }));
                                  }}
                                  placeholder="Max"
                                  className="text-sm text-center"
                                />
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Temperaturas de Controle (°C)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="font-semibold">Mistura</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Mín</Label>
                          <Input
                            type="number"
                            value={formData.temperaturas.mistura.min}
                            onChange={(e) => handleDeepNestedInputChange('temperaturas', 'mistura', 'min', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Máx</Label>
                          <Input
                            type="number"
                            value={formData.temperaturas.mistura.max}
                            onChange={(e) => handleDeepNestedInputChange('temperaturas', 'mistura', 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Compactação</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Mín</Label>
                          <Input
                            type="number"
                            value={formData.temperaturas.compactacao.min}
                            onChange={(e) => handleDeepNestedInputChange('temperaturas', 'compactacao', 'min', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Máx</Label>
                          <Input
                            type="number"
                            value={formData.temperaturas.compactacao.max}
                            onChange={(e) => handleDeepNestedInputChange('temperaturas', 'compactacao', 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Espalhamento</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Mín</Label>
                          <Input
                            type="number"
                            value={formData.temperaturas.espalhamento.min}
                            onChange={(e) => handleDeepNestedInputChange('temperaturas', 'espalhamento', 'min', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Máx</Label>
                          <Input
                            type="number"
                            value={formData.temperaturas.espalhamento.max}
                            onChange={(e) => handleDeepNestedInputChange('temperaturas', 'espalhamento', 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parâmetros de Dosagem Marshall</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Teor de Ligante (%)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input type="number" step="0.01" placeholder="Mínimo" value={formData.teor_ligante.min} onChange={(e) => handleNestedInputChange('teor_ligante', 'min', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Máximo</Label>
                        <Input type="number" step="0.01" placeholder="Máximo" value={formData.teor_ligante.max} onChange={(e) => handleNestedInputChange('teor_ligante', 'max', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Ótimo (Projeto)</Label>
                        <Input type="number" step="0.01" placeholder="Ótimo" value={formData.teor_ligante.otimo} onChange={(e) => handleNestedInputChange('teor_ligante', 'otimo', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <Label className="font-semibold">Massa Específica Aparente (g/cm³)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Ex: 2.450"
                        className="mt-2"
                        value={formData.massa_especifica_aparente}
                        onChange={(e) => handleInputChange('massa_especifica_aparente', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="font-semibold">Densidade Máxima Medida - RICE (g/cm³)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Ex: 2.550"
                        className="mt-2"
                        value={formData.densidade_maxima_medida}
                        onChange={(e) => handleInputChange('densidade_maxima_medida', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Volume de Vazios (%)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input type="number" step="0.1" placeholder="Mínimo" value={formData.volume_vazios.min} onChange={(e) => handleNestedInputChange('volume_vazios', 'min', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Máximo</Label>
                        <Input type="number" step="0.1" placeholder="Máximo" value={formData.volume_vazios.max} onChange={(e) => handleNestedInputChange('volume_vazios', 'max', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Ótimo (Projeto)</Label>
                        <Input type="number" step="0.1" placeholder="Ótimo" value={formData.volume_vazios.otimo} onChange={(e) => handleNestedInputChange('volume_vazios', 'otimo', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Estabilidade Marshall (N)</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="Mínimo"
                          value={formData.estabilidade.min}
                          onChange={(e) => handleNestedInputChange('estabilidade', 'min', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Projeto</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="Projeto"
                          value={formData.estabilidade.projeto}
                          onChange={(e) => handleNestedInputChange('estabilidade', 'projeto', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Fluência Marshall (mm)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input type="number" step="0.1" placeholder="Mínimo" value={formData.fluencia.min} onChange={(e) => handleNestedInputChange('fluencia', 'min', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Máximo</Label>
                        <Input type="number" step="0.1" placeholder="Máximo" value={formData.fluencia.max} onChange={(e) => handleNestedInputChange('fluencia', 'max', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Projeto</Label>
                        <Input type="number" step="0.1" placeholder="Projeto" value={formData.fluencia.projeto} onChange={(e) => handleNestedInputChange('fluencia', 'projeto', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">VAM - Vazios do Agregado Mineral (%)</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Mínimo"
                          value={formData.vam.min}
                          onChange={(e) => handleNestedInputChange('vam', 'min', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Projeto</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Projeto"
                          value={formData.vam.projeto}
                          onChange={(e) => handleNestedInputChange('vam', 'projeto', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">RBV - Relação Betume/Vazios (%)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input type="number" step="0.1" placeholder="Mínimo" value={formData.rbv.min} onChange={(e) => handleNestedInputChange('rbv', 'min', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Máximo</Label>
                        <Input type="number" step="0.1" placeholder="Máximo" value={formData.rbv.max} onChange={(e) => handleNestedInputChange('rbv', 'max', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Projeto</Label>
                        <Input type="number" step="0.1" placeholder="Projeto" value={formData.rbv.projeto} onChange={(e) => handleNestedInputChange('rbv', 'projeto', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">RTCD Mínimo (MPa)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Mínimo"
                      className="mt-2"
                      value={formData.rtcd.min}
                      onChange={(e) => handleNestedInputChange('rtcd', 'min', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isMraf && peneirasCarregadas && (
            <>
              {/* Faixa de Trabalho para MRAF */}
              <Card>
                <CardHeader>
                  <CardTitle>Faixa de Trabalho (Graduação da Mistura) - PADRONIZADA DNIT/ASTM</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Limites mínimo, ótimo e máximo da faixa de trabalho (% passante)
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-slate-300">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border border-slate-300 px-3 py-2 text-left text-sm font-medium sticky left-0 bg-slate-100 z-10">
                            Peneira
                          </th>
                          {peneirasDisponiveis.map(peneira => (
                            <th key={peneira.key} className="border border-slate-300 px-3 py-2 text-center text-sm font-medium min-w-[100px]">
                              <div className="font-bold">{peneira.astm}</div>
                              <div className="text-xs text-gray-600">{peneira.nome}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 px-3 py-2 font-medium bg-slate-50 sticky left-0 z-10">
                            Mínimo (%)
                          </td>
                          {peneirasDisponiveis.map(peneira => (
                            <td key={peneira.key} className="border border-slate-300 px-2 py-1">
                              <Input
                                type="number"
                                step="0.1"
                                value={formData.faixa_trabalho_min[peneira.key] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setFormData(prev => ({
                                    ...prev,
                                    faixa_trabalho_min: {
                                      ...prev.faixa_trabalho_min,
                                      [peneira.key]: value
                                    }
                                  }));
                                }}
                                placeholder="Min"
                                className="text-sm text-center"
                              />
                            </td>
                          ))}
                        </tr>

                        <tr className="bg-green-50">
                          <td className="border border-slate-300 px-3 py-2 font-medium bg-green-100 sticky left-0 z-10">
                            Ótimo/Projeto (%)
                          </td>
                          {peneirasDisponiveis.map(peneira => (
                            <td key={peneira.key} className="border border-slate-300 px-2 py-1 bg-green-50">
                              <Input
                                type="number"
                                step="0.1"
                                value={formData.faixa_trabalho[peneira.key] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setFormData(prev => ({
                                    ...prev,
                                    faixa_trabalho: {
                                      ...prev.faixa_trabalho,
                                      [peneira.key]: value
                                    }
                                  }));
                                }}
                                placeholder="Ótimo"
                                className="text-sm text-center font-semibold"
                              />
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <td className="border border-slate-300 px-3 py-2 font-medium bg-slate-50 sticky left-0 z-10">
                            Máximo (%)
                          </td>
                          {peneirasDisponiveis.map(peneira => (
                            <td key={peneira.key} className="border border-slate-300 px-2 py-1">
                              <Input
                                type="number"
                                step="0.1"
                                value={formData.faixa_trabalho_max[peneira.key] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setFormData(prev => ({
                                    ...prev,
                                    faixa_trabalho_max: {
                                      ...prev.faixa_trabalho_max,
                                      [peneira.key]: value
                                    }
                                  }));
                                }}
                                placeholder="Max"
                                className="text-sm text-center"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Parâmetros MRAF */}
              <Card>
                <CardHeader>
                  <CardTitle>Parâmetros de Dosagem MRAF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Emulsão Utilizada</Label>
                    <Input
                      type="text"
                      placeholder="Ex: RL-1C"
                      className="mt-2"
                      value={formData.emulsao_utilizada}
                      onChange={(e) => handleInputChange('emulsao_utilizada', e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Tipo de emulsão asfáltica utilizada no MRAF
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Teor de Ligante Residual (%)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Mínimo" 
                          value={formData.teor_ligante_residual.min}
                          onChange={(e) => handleNestedInputChange('teor_ligante_residual', 'min', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Máximo</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Máximo" 
                          value={formData.teor_ligante_residual.max}
                          onChange={(e) => handleNestedInputChange('teor_ligante_residual', 'max', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Ótimo (Projeto)</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Ótimo" 
                          value={formData.teor_ligante_residual.otimo}
                          onChange={(e) => handleNestedInputChange('teor_ligante_residual', 'otimo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Percentual de Emulsão na Mistura (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 12.5"
                      className="mt-2"
                      value={formData.percentual_emulsao}
                      onChange={(e) => handleInputChange('percentual_emulsao', e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Percentual de emulsão asfáltica presente na mistura do MRAF
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Taxa de Aplicação MRAF (kg/m²)</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Mínimo" 
                          value={formData.taxa_aplicacao_mraf.min} 
                          onChange={(e) => handleNestedInputChange('taxa_aplicacao_mraf', 'min', e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Máximo</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Máximo" 
                          value={formData.taxa_aplicacao_mraf.max} 
                          onChange={(e) => handleNestedInputChange('taxa_aplicacao_mraf', 'max', e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Ótimo (Projeto)</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Ótimo" 
                          value={formData.taxa_aplicacao_mraf.otimo} 
                          onChange={(e) => handleNestedInputChange('taxa_aplicacao_mraf', 'otimo', e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="font-semibold">Densidade da Mistura (g/cm³)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Ex: 2.100"
                      className="mt-2"
                      value={formData.densidade_mistura_mraf}
                      onChange={(e) => handleInputChange('densidade_mistura_mraf', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Agregados para MRAF */}
              {peneirasCarregadas ? (
                <AgregadosForm
                  agregados={formData.agregados}
                  peneirasDisponiveis={peneirasDisponiveis}
                  onAdd={adicionarAgregado}
                  onRemove={removerAgregado}
                  onChange={handleAgregadoChange}
                  onGranChange={handleAgregadoGranChange}
                />
              ) : (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-amber-800">
                      ⚠️ Selecione uma faixa granulométrica primeiro para cadastrar os agregados.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {isBgs && peneirasCarregadas && (
            <Card className="bg-slate-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">
                    Projeto {formData.tipo_projeto} - Configuração Simplificada
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Para projetos do tipo <strong>{formData.tipo_projeto}</strong>, os parâmetros técnicos específicos podem ser configurados conforme necessário. 
                  O sistema já está preparado com a especificação granulométrica e o limite de equivalente de areia.
                </p>
                
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-base">Agregados (Opcional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-slate-600">
                        Adicione agregados se necessário para este projeto.
                      </p>
                      <Button type="button" onClick={adicionarAgregado} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Agregado
                      </Button>
                    </div>

                    {formData.agregados.length > 0 ? (
                      <div className="space-y-4">
                        {formData.agregados.map((agregado, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-slate-50">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="font-semibold text-sm">Agregado {index + 1}</h5>
                              <Button
                                type="button"
                                onClick={() => removerAgregado(index)}
                                size="sm"
                                variant="ghost"
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Nome/Tipo</Label>
                                <Input
                                  value={agregado.nome}
                                  onChange={(e) => handleAgregadoChange(index, 'nome', e.target.value)}
                                  placeholder="Ex: Areia natural"
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Pedreira</Label>
                                <Input
                                  value={agregado.pedreira}
                                  onChange={(e) => handleAgregadoChange(index, 'pedreira', e.target.value)}
                                  placeholder="Ex: Pedreira Central"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-8 italic text-sm">
                        Nenhum agregado adicionado ainda.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {isCamadasGranulares && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Especificação Granulométrica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="faixa_granulometrica_id">Faixa de Referência (Especificação) *</Label>
                    <Select 
                      value={formData.faixa_granulometrica_id} 
                      onValueChange={(value) => handleInputChange('faixa_granulometrica_id', value)} 
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a faixa granulométrica" />
                      </SelectTrigger>
                      <SelectContent>
                        {faixasFiltradas?.map(faixa => (
                          <SelectItem key={faixa.id} value={faixa.id}>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-500">
                                {faixa.tipo}
                              </Badge>
                              <span>{faixa.nome} ({faixa.orgao} - {faixa.especificacao})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {faixasFiltradas.length === 0 && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 font-medium">
                          ⚠️ Nenhuma faixa granulométrica do tipo <Badge className="bg-amber-500 text-white">CAMADAS_GRANULARES</Badge> encontrada.
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Crie uma faixa compatível na página de Faixas Granulométricas antes de continuar.
                        </p>
                      </div>
                    )}
                  </div>

                  {faixaSelecionada && peneirasCarregadas && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-900 mb-2">Limites de Especificação ({peneirasDisponiveis.length} peneiras):</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-amber-100">
                            <tr>
                              <th className="px-2 py-1 text-left">ASTM</th>
                              <th className="px-2 py-1 text-left">Abertura</th>
                              <th className="px-2 py-1 text-center">Mín (%)</th>
                              <th className="px-2 py-1 text-center">Máx (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {peneirasDisponiveis.map((peneira, idx) => (
                              <tr key={idx} className="border-t border-amber-200">
                                <td className="px-2 py-1 font-semibold">{peneira.astm}</td>
                                <td className="px-2 py-1">{peneira.nome}</td>
                                <td className="px-2 py-1 text-center">{peneira.especificacao_min}</td>
                                <td className="px-2 py-1 text-center">{peneira.especificacao_max}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {peneirasCarregadas && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Agregados Utilizados</CardTitle>
                      <Button type="button" onClick={adicionarAgregado} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Agregado
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formData.agregados.map((agregado, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-slate-50 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Agregado {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removerAgregado(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Nome/Tipo</Label>
                            <Input
                              value={agregado.nome}
                              onChange={(e) => handleAgregadoChange(index, 'nome', e.target.value)}
                              placeholder="Ex: Brita 1"
                            />
                          </div>
                          <div>
                            <Label>Pedreira</Label>
                            <Input
                              value={agregado.pedreira}
                              onChange={(e) => handleAgregadoChange(index, 'pedreira', e.target.value)}
                              placeholder="Ex: Pedreira São José"
                            />
                          </div>
                          <div>
                            <Label>% na Mistura</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={agregado.percentual_mistura}
                              onChange={(e) => handleAgregadoChange(index, 'percentual_mistura', e.target.value)}
                              placeholder="Ex: 30"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="font-semibold mb-2 block">Granulometria Individual (% Passante)</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {peneirasDisponiveis.map(peneira => (
                              <div key={peneira.key}>
                                <Label className="text-xs font-semibold">{peneira.astm}</Label>
                                <Label className="text-xs text-gray-500 block">{peneira.nome}</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={agregado.granulometria?.[peneira.key] ?? ""}
                                  onChange={(e) => handleAgregadoGranChange(index, peneira.key, e.target.value)}
                                  placeholder="0-100"
                                  className="text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.agregados.length === 0 && (
                      <p className="text-center text-slate-500 py-4">
                        Nenhum agregado adicionado.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Parâmetros Técnicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="melhorador_utilizado">Melhorador Utilizado *</Label>
                    <Input
                      id="melhorador_utilizado"
                      value={formData.camadas_granulares.melhorador_utilizado}
                      onChange={(e) => handleCamadasGranularesChange('melhorador_utilizado', e.target.value)}
                      placeholder="Ex: Cimento Portland, Cal Hidratada"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="umidade_otima">Umidade Ótima (%) *</Label>
                      <Input
                        id="umidade_otima"
                        type="number"
                        step="0.1"
                        value={formData.camadas_granulares.umidade_otima}
                        onChange={(e) => handleCamadasGranularesChange('umidade_otima', e.target.value)}
                        placeholder="Ex: 5.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="densidade_otima">Densidade Ótima (g/cm³) *</Label>
                      <Input
                        id="densidade_otima"
                        type="number"
                        step="0.001"
                        value={formData.camadas_granulares.densidade_otima}
                        onChange={(e) => handleCamadasGranularesChange('densidade_otima', e.target.value)}
                        placeholder="Ex: 2.150"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="resistencia_mpa">Resistência (MPa) - Opcional</Label>
                    <Input
                      id="resistencia_mpa"
                      type="number"
                      step="0.01"
                      value={formData.camadas_granulares.resistencia_mpa}
                      onChange={(e) => handleCamadasGranularesChange('resistencia_mpa', e.target.value)}
                      placeholder="Ex: 2.5"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Resistência à compressão ou tração (quando aplicável)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t p-4 -mx-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Salvar Projeto
        </Button>
      </div>
    </form>
  );
}