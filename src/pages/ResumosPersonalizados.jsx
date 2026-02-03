import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";

const TIPOS_ENSAIO = [
  { value: "EnsaioCAUQ", label: "Ensaio CAUQ" },
  { value: "EnsaioSondagem", label: "Sondagem" },
  { value: "EnsaioDensidadeInSitu", label: "Densidade In Situ" },
  { value: "EnsaioTaxaPinturaImprimacao", label: "Taxa de Pintura/Imprimação" },
  { value: "EnsaioDensidade", label: "Densidade (Extração)" },
  { value: "ChecklistUsina", label: "Checklist de Usina" },
  { value: "ChecklistAplicacao", label: "Checklist de Aplicação" },
  { value: "ChecklistMRAF", label: "Checklist MRAF" },
  { value: "ChecklistConcretagem", label: "Checklist de Concretagem" },
  { value: "ChecklistTerraplanagem", label: "Checklist de Terraplanagem" },
  { value: "DiarioObra", label: "Diário de Obra" }
];

const CAMPOS_POR_TIPO = {
  EnsaioCAUQ: [
    { key: "data_ensaio", label: "Data" },
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "usina_fornecedora", label: "Usina" },
    { key: "extracao_ligante.teor_ligante", label: "Teor Ligante (%)" },
    { key: "extracao_ligante.teor_ligante_real", label: "Teor Ligante Real (%)" },
    { key: "granulometria", label: "Granulometria (% passante)", subfields: [
      { key: "peneira_19_0mm", label: "19,0mm" },
      { key: "peneira_12_5mm", label: "12,5mm" },
      { key: "peneira_9_5mm", label: "9,5mm" },
      { key: "peneira_4_75mm", label: "4,75mm" },
      { key: "peneira_2_0mm", label: "2,0mm" },
      { key: "peneira_0_42mm", label: "0,42mm" },
      { key: "peneira_0_18mm", label: "0,18mm" },
      { key: "peneira_0_075mm", label: "0,075mm" }
    ]},
    { key: "corpos_prova_marshall", label: "Parâmetros Marshall", subfields: [
      { key: "densidade_aparente", label: "Densidade Aparente (g/cm³)" },
      { key: "volume_vazios", label: "Volume Vazios (%)" },
      { key: "vam", label: "VAM (%)" },
      { key: "rbv", label: "RBV (%)" },
      { key: "rtcd_valor", label: "RTCD (MPa)" },
      { key: "estabilidade_corrigida", label: "Estabilidade (Kgf/cm²)" },
      { key: "fluencia", label: "Fluência (mm)" }
    ]},
    { key: "densidade_rice.densidade_rice", label: "RICE - Densidade (g/cm³)" },
    { key: "approved", label: "Status Aprovação" }
  ],
  EnsaioSondagem: [
    { key: "data", label: "Data" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "usina_fornecedora", label: "Usina" },
    { key: "corpos_prova", label: "Média - Resultados", subfields: [
      { key: "densidade", label: "Densidade Média (g/cm³)" },
      { key: "gc_dens_projeto", label: "GC Dens. Projeto Médio (%)" },
      { key: "volume_vazios", label: "Volume Vazios Médio (%)" },
      { key: "rtcd_25c", label: "RTCD 25°C Médio (MPa)" }
    ]},
    { key: "approved", label: "Status Aprovação" }
  ],
  EnsaioDensidadeInSitu: [
    { key: "data_ensaio", label: "Data" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "camada", label: "Camada" },
    { key: "material", label: "Material" },
    { key: "furos", label: "Furos - Médias", subfields: [
      { key: "densidade_seca_solo", label: "Densidade Seca Média (g/cm³)" },
      { key: "umidade", label: "Umidade Média (%)" },
      { key: "grau_compactacao", label: "Grau Compactação Médio (%)" }
    ]},
    { key: "approved", label: "Status Aprovação" }
  ],
  EnsaioTaxaPinturaImprimacao: [
    { key: "data_ensaio", label: "Data" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "material", label: "Material" },
    { key: "tipo_servico", label: "Tipo Serviço" },
    { key: "ensaios", label: "Ensaios - Médias", subfields: [
      { key: "taxa_aplicada", label: "Taxa Aplicada Média (l/m²)" },
      { key: "taxa_residual", label: "Taxa Residual Média (l/m²)" },
      { key: "temperatura_aplicacao", label: "Temperatura Média (°C)" }
    ]},
    { key: "approved", label: "Status Aprovação" }
  ],
  EnsaioDensidade: [
    { key: "extraction_date", label: "Data" },
    { key: "location", label: "Local" },
    { key: "pesos.espessura_cp", label: "Espessura CP (mm)" },
    { key: "densidade_aparente", label: "Densidade Aparente (g/cm³)" },
    { key: "volume_vazios", label: "Volume Vazios (%)" },
    { key: "grau_compactacao", label: "Grau Compactação (%)" },
    { key: "approved", label: "Status Aprovação" }
  ],
  ChecklistUsina: [
    { key: "data", label: "Data" },
    { key: "usina", label: "Usina" },
    { key: "projeto_utilizado", label: "Projeto" },
    { key: "controle_agregados", label: "Controle Agregados" },
    { key: "rodadas_producao", label: "Rodadas Produção" },
    { key: "approved", label: "Status Aprovação" }
  ],
  ChecklistAplicacao: [
    { key: "data", label: "Data" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "usina", label: "Usina" },
    { key: "controle_aplicacao", label: "Controle Aplicação" },
    { key: "approved", label: "Status Aprovação" }
  ],
  ChecklistMRAF: [
    { key: "data", label: "Data" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "projeto_utilizado", label: "Projeto" },
    { key: "approved", label: "Status Aprovação" }
  ],
  ChecklistConcretagem: [
    { key: "data", label: "Data" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "concreteira", label: "Concreteira" },
    { key: "fck", label: "FCK (MPa)" },
    { key: "volume", label: "Volume (m³)" },
    { key: "approved", label: "Status Aprovação" }
  ],
  ChecklistTerraplanagem: [
    { key: "data", label: "Data" },
    { key: "rodovia", label: "Rodovia" },
    { key: "empreiteira", label: "Empreiteira" },
    { key: "estaca", label: "Estaca" },
    { key: "camada", label: "Camada" },
    { key: "material", label: "Material" },
    { key: "approved", label: "Status Aprovação" }
  ],
  DiarioObra: [
    { key: "data", label: "Data" },
    { key: "tipo_local", label: "Tipo Local" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "condicoes_climaticas", label: "Condições Climáticas" },
    { key: "temperatura", label: "Temperatura (°C)" },
    { key: "approved", label: "Status Aprovação" }
  ]
};

export default function ResumosPersonalizadosPage() {
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // Filtros
  const [obraId, setObraId] = useState("");
  const [tipoEnsaioSelecionado, setTipoEnsaioSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [empreiteiraFiltro, setEmpreiteiraFiltro] = useState("");
  const [laboratoristaFiltro, setLaboratoristaFiltro] = useState("");
  const [projetoFiltro, setProjetoFiltro] = useState("");
  const [rodoviaFiltro, setRodoviaFiltro] = useState("");
  const [camposSelecionados, setCamposSelecionados] = useState([]);
  
  // Dados
  const [dadosConsolidados, setDadosConsolidados] = useState([]);
  const [laboratoristas, setLaboratoristas] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [rodovias, setRodovias] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const userAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

      const [obrasData, regionaisData] = await Promise.all([
        Obra.list(),
        Regional.list()
      ]);

      setRegionais(regionaisData);

      // Filtrar obras por permissão
      let availableObras = obrasData;

      if (userAccessLevel === 'cliente') {
        const regionaisDoCliente = regionaisData.filter(regional => {
          const clientes = regional.clientes_responsaveis || [];
          return clientes.some(email => email.toLowerCase() === userData.email.toLowerCase());
        });

        const obraIds = new Set();
        regionaisDoCliente.forEach(regional => {
          const obrasRegional = obrasData.filter(obra => obra.regional_id === regional.id);
          obrasRegional.forEach(obra => obraIds.add(obra.id));
        });

        availableObras = obrasData.filter(obra => obraIds.has(obra.id));
      } else if (userAccessLevel === 'sala_tecnica_afirmaevias') {
        const regionaisDaSala = regionaisData.filter(regional => {
          const salas = regional.salas_tecnicas_responsaveis || [];
          return salas.some(email => email.toLowerCase() === userData.email.toLowerCase());
        });

        const obraIds = new Set();
        regionaisDaSala.forEach(regional => {
          const obrasRegional = obrasData.filter(obra => obra.regional_id === regional.id);
          obrasRegional.forEach(obra => obraIds.add(obra.id));
        });

        availableObras = obrasData.filter(obra => obraIds.has(obra.id));
      } else if (userAccessLevel === 'gestor_contrato') {
        const regionaisDoGestor = regionaisData.filter(regional => {
          return regional.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase();
        });

        const obraIds = new Set();
        regionaisDoGestor.forEach(regional => {
          const obrasRegional = obrasData.filter(obra => obra.regional_id === regional.id);
          obrasRegional.forEach(obra => obraIds.add(obra.id));
        });

        availableObras = obrasData.filter(obra => obraIds.has(obra.id));
      }

      setObras(availableObras);

      // Auto-selecionar primeira obra se houver apenas uma
      if (availableObras.length === 1) {
        setObraId(availableObras[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTipoEnsaioChange = (tipo) => {
    setTipoEnsaioSelecionado(tipo);
    setEmpreiteiraFiltro("");
    setLaboratoristaFiltro("");
    setProjetoFiltro("");
    setRodoviaFiltro("");
    if (tipo) {
      const campos = CAMPOS_POR_TIPO[tipo] || [];
      setCamposSelecionados(campos.map(c => c.key));
    } else {
      setCamposSelecionados([]);
    }
  };

  // Verificar se o tipo de ensaio selecionado tem campo de empreiteira
  const tipoTemEmpreiteira = useMemo(() => {
    if (!tipoEnsaioSelecionado) return false;
    const campos = CAMPOS_POR_TIPO[tipoEnsaioSelecionado] || [];
    return campos.some(c => c.key === 'empreiteira');
  }, [tipoEnsaioSelecionado]);

  // Obter empreiteiras da obra selecionada
  const empreiteirasDisponiveis = useMemo(() => {
    if (!obraId) return [];
    const obra = obras.find(o => o.id === obraId);
    return obra?.empreiteiras || [];
  }, [obraId, obras]);

  // Obter rodovias da obra selecionada
  const rodoviasDisponiveis = useMemo(() => {
    if (!obraId) return [];
    const obra = obras.find(o => o.id === obraId);
    return obra?.rodovias || [];
  }, [obraId, obras]);

  const handleCampoToggle = (campoKey) => {
    setCamposSelecionados(prev => {
      const isSelected = prev.includes(campoKey);
      return isSelected
        ? prev.filter(c => c !== campoKey)
        : [...prev, campoKey];
    });
  };

  const getNestedValue = (obj, path) => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  };

  const calcularMediaArray = (array, campo) => {
    if (!array || array.length === 0) return null;
    const valores = array.map(item => parseFloat(getNestedValue(item, campo))).filter(v => !isNaN(v));
    if (valores.length === 0) return null;
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    return media.toFixed(2);
  };

  const calcularGranulometriaPassante = (ensaio, peneira) => {
    if (!ensaio?.granulometria?.peso_retido_peneiras) return null;
    
    const PENEIRAS = [
      'peneira_75_0mm', 'peneira_63_0mm', 'peneira_50_0mm', 'peneira_37_5mm',
      'peneira_25_0mm', 'peneira_19_0mm', 'peneira_16_0mm', 'peneira_12_5mm',
      'peneira_9_5mm', 'peneira_4_75mm', 'peneira_2_36mm', 'peneira_2_0mm',
      'peneira_1_18mm', 'peneira_0_6mm', 'peneira_0_42mm', 'peneira_0_3mm',
      'peneira_0_18mm', 'peneira_0_15mm', 'peneira_0_075mm'
    ];
    
    const pesos = ensaio.granulometria.peso_retido_peneiras;
    const pesoTotal = Object.values(pesos).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    
    if (pesoTotal === 0) return null;
    
    const indice = PENEIRAS.indexOf(peneira);
    if (indice === -1) return null;
    
    let pesoRetidoAcumulado = 0;
    for (let i = 0; i <= indice; i++) {
      pesoRetidoAcumulado += parseFloat(pesos[PENEIRAS[i]]) || 0;
    }
    
    const percentualPassante = ((pesoTotal - pesoRetidoAcumulado) / pesoTotal) * 100;
    return percentualPassante.toFixed(1);
  };

  const formatValue = (value, campo) => {
    if (value === null || value === undefined) return '-';
    
    if (campo.includes('approved')) {
      if (value === true) return '✅ Aprovado';
      if (value === false) return '❌ Reprovado';
      return '⏳ Pendente';
    }
    
    if (campo.includes('data')) {
      try {
        return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      } catch {
        return value;
      }
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return value;
  };

  const carregarDados = async () => {
    if (!obraId || !tipoEnsaioSelecionado) {
      alert("Selecione uma obra e um tipo de ensaio.");
      return;
    }

    if (camposSelecionados.length === 0) {
      alert("Selecione ao menos um campo para exibir.");
      return;
    }

    setLoadingData(true);
    try {
      const resultados = [];
      const tipo = tipoEnsaioSelecionado;
      const campos = camposSelecionados;

      // Mapear entidades específicas
      let ensaios;
      if (tipo === 'DiarioObra') {
        const DiarioObra = await import('@/entities/DiarioObra').then(m => m.DiarioObra);
        ensaios = await DiarioObra.filter({ obra_id: obraId });
      } else if (tipo === 'EnsaioDensidade') {
        const EnsaioDensidade = await import('@/entities/EnsaioDensidade').then(m => m.EnsaioDensidade);
        ensaios = await EnsaioDensidade.filter({ obra_id: obraId });
      } else if (tipo === 'ChecklistUsina') {
        const ChecklistUsina = await import('@/entities/ChecklistUsina').then(m => m.ChecklistUsina);
        ensaios = await ChecklistUsina.filter({ obra_id: obraId });
      } else if (tipo === 'ChecklistAplicacao') {
        const ChecklistAplicacao = await import('@/entities/ChecklistAplicacao').then(m => m.ChecklistAplicacao);
        ensaios = await ChecklistAplicacao.filter({ obra_id: obraId });
      } else if (tipo === 'ChecklistMRAF') {
        const ChecklistMRAF = await import('@/entities/ChecklistMRAF').then(m => m.ChecklistMRAF);
        ensaios = await ChecklistMRAF.filter({ obra_id: obraId });
      } else if (tipo === 'ChecklistConcretagem') {
        const ChecklistConcretagem = await import('@/entities/ChecklistConcretagem').then(m => m.ChecklistConcretagem);
        ensaios = await ChecklistConcretagem.filter({ obra_id: obraId });
      } else {
        // Para outros tipos, usar base44.entities
        ensaios = await base44.entities[tipo].filter({ obra_id: obraId });
      }

      // Filtrar por período
      let ensaiosFiltrados = ensaios;
      if (dataInicio || dataFim || empreiteiraFiltro || laboratoristaFiltro || projetoFiltro || rodoviaFiltro) {
        ensaiosFiltrados = ensaios.filter(e => {
          // Filtro por data
          const dataEnsaio = e.data_ensaio || e.data || e.extraction_date;
          if (dataInicio || dataFim) {
            if (!dataEnsaio) return false;

            const dataEnsaioObj = new Date(dataEnsaio);
            
            if (dataInicio) {
              const dataInicioObj = new Date(dataInicio);
              if (dataEnsaioObj < dataInicioObj) return false;
            }
            
            if (dataFim) {
              const dataFimObj = new Date(dataFim);
              if (dataEnsaioObj > dataFimObj) return false;
            }
          }

          // Filtro por empreiteira
          if (empreiteiraFiltro && e.empreiteira !== empreiteiraFiltro) {
            return false;
          }

          // Filtro por laboratorista
          if (laboratoristaFiltro && e.laboratorista_name !== laboratoristaFiltro) {
            return false;
          }

          // Filtro por projeto
          if (projetoFiltro && e.project_id !== projetoFiltro) {
            return false;
          }

          // Filtro por rodovia
          if (rodoviaFiltro && e.rodovia !== rodoviaFiltro) {
            return false;
          }
          
          return true;
        });
      }

      // Coletar laboratoristas únicos
      const labsUnicos = new Set();
      ensaios.forEach(e => {
        if (e.laboratorista_name) {
          labsUnicos.add(e.laboratorista_name);
        }
      });
      setLaboratoristas(Array.from(labsUnicos).sort());

      // Coletar projetos e rodovias únicos (para CAUQ)
      if (tipo === 'EnsaioCAUQ') {
        const Project = await import('@/entities/Project').then(m => m.Project);
        const projetosData = await Project.list();
        
        const obra = obras.find(o => o.id === obraId);
        const regional = regionais.find(r => r.id === obra?.regional_id);
        const projetosRegional = projetosData.filter(p => 
          p.tipo_projeto === 'CAUQ' && 
          (regional?.project_ids || []).includes(p.id)
        );
        setProjetos(projetosRegional);

        const rodUnicos = new Set();
        ensaios.forEach(e => {
          if (e.rodovia) {
            rodUnicos.add(e.rodovia);
          }
        });
        setRodovias(Array.from(rodUnicos).sort());
      } else {
        setProjetos([]);
        setRodovias([]);
      }

      // Processar cada ensaio
      ensaiosFiltrados.forEach(ensaio => {
        const linha = {
          tipo: TIPOS_ENSAIO.find(t => t.value === tipo)?.label || tipo,
          id: ensaio.id,
          data: ensaio.data_ensaio || ensaio.data || ensaio.extraction_date || '-'
        };

        campos.forEach(campoKey => {
          const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);
          
          if (campo?.subfields) {
            // Tratar granulometria de forma especial
            if (campoKey === 'granulometria') {
              campo.subfields.forEach(subfield => {
                const percentualPassante = calcularGranulometriaPassante(ensaio, subfield.key);
                linha[`${campoKey}.${subfield.key}`] = percentualPassante !== null ? `${percentualPassante}%` : '-';
              });
            } else {
              // Calcular médias para arrays
              const arrayData = getNestedValue(ensaio, campoKey);
              campo.subfields.forEach(subfield => {
                const media = calcularMediaArray(arrayData, subfield.key);
                linha[`${campoKey}.${subfield.key}`] = media !== null ? media : '-';
              });
            }
          } else {
            const value = getNestedValue(ensaio, campoKey);
            linha[campoKey] = formatValue(value, campoKey);
          }
        });

        resultados.push(linha);
      });

      setDadosConsolidados(resultados);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados dos ensaios.");
    } finally {
      setLoadingData(false);
    }
  };

  const exportarParaCSV = () => {
    if (dadosConsolidados.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const headers = Object.keys(dadosConsolidados[0]);
    const csvContent = [
      headers.join(';'),
      ...dadosConsolidados.map(row => 
        headers.map(h => row[h] || '').join(';')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resumo_personalizado_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const obraSelecionada = useMemo(() => obras.find(o => o.id === obraId), [obras, obraId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#00233B]">Resumos</h1>
          <p className="text-[#00233B]/80 mt-1">
            Selecione os ensaios, período e campos para gerar relatórios consolidados
          </p>
        </div>

        {/* Filtros */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#BFCF99]" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Obra */}
            <div>
              <Label htmlFor="obra" className="text-[#00233B]">Obra *</Label>
              <select
                id="obra"
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
              >
                <option value="">Selecione uma obra</option>
                {obras.map(obra => {
                  const regional = regionais.find(r => r.id === obra.regional_id);
                  return (
                    <option key={obra.id} value={obra.id}>
                      {obra.name} - {obra.code} {regional && `(${regional.nome})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataInicio" className="text-[#00233B]">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-white/50 border-white/20 text-[#00233B]"
                />
              </div>
              <div>
                <Label htmlFor="dataFim" className="text-[#00233B]">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-white/50 border-white/20 text-[#00233B]"
                />
              </div>
            </div>

            {/* Filtro por Empreiteira */}
            {tipoTemEmpreiteira && empreiteirasDisponiveis.length > 0 && (
              <div>
                <Label htmlFor="empreiteira" className="text-[#00233B]">Empreiteira</Label>
                <select
                  id="empreiteira"
                  value={empreiteiraFiltro}
                  onChange={(e) => setEmpreiteiraFiltro(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Todas</option>
                  {empreiteirasDisponiveis.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Laboratorista */}
            {laboratoristas.length > 0 && (
              <div>
                <Label htmlFor="laboratorista" className="text-[#00233B]">Laboratorista</Label>
                <select
                  id="laboratorista"
                  value={laboratoristaFiltro}
                  onChange={(e) => setLaboratoristaFiltro(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Todos</option>
                  {laboratoristas.map(lab => (
                    <option key={lab} value={lab}>{lab}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Projeto (CAUQ) */}
            {tipoEnsaioSelecionado === 'EnsaioCAUQ' && projetos.length > 0 && (
              <div>
                <Label htmlFor="projeto" className="text-[#00233B]">Projeto</Label>
                <select
                  id="projeto"
                  value={projetoFiltro}
                  onChange={(e) => setProjetoFiltro(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Todos</option>
                  {projetos.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Rodovia (CAUQ) */}
            {tipoEnsaioSelecionado === 'EnsaioCAUQ' && rodovias.length > 0 && (
              <div>
                <Label htmlFor="rodovia" className="text-[#00233B]">Rodovia</Label>
                <select
                  id="rodovia"
                  value={rodoviaFiltro}
                  onChange={(e) => setRodoviaFiltro(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Todas</option>
                  {rodovias.map(rod => (
                    <option key={rod} value={rod}>{rod}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tipo de Ensaio */}
            <div>
              <Label htmlFor="tipoEnsaio" className="text-[#00233B]">Tipo de Ensaio *</Label>
              <select
                id="tipoEnsaio"
                value={tipoEnsaioSelecionado}
                onChange={(e) => handleTipoEnsaioChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
              >
                <option value="">Selecione um tipo de ensaio</option>
                {TIPOS_ENSAIO.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos do ensaio selecionado */}
            {tipoEnsaioSelecionado && (
              <div className="border border-white/20 rounded-lg p-4 bg-white/10">
                <h4 className="font-semibold text-[#00233B] mb-2">
                  Campos - {TIPOS_ENSAIO.find(t => t.value === tipoEnsaioSelecionado)?.label}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CAMPOS_POR_TIPO[tipoEnsaioSelecionado]?.map(campo => (
                    <div key={campo.key}>
                      <div className="flex items-center gap-2 p-2 bg-white/50 rounded">
                        <Checkbox
                          id={`campo-${campo.key}`}
                          checked={camposSelecionados.includes(campo.key)}
                          onCheckedChange={() => handleCampoToggle(campo.key)}
                        />
                        <label htmlFor={`campo-${campo.key}`} className="text-xs text-[#00233B] cursor-pointer">
                          {campo.label}
                        </label>
                      </div>
                      {campo.subfields && camposSelecionados.includes(campo.key) && (
                        <div className="ml-6 mt-1 text-xs text-[#00233B]/70">
                          {campo.subfields.map(sub => (
                            <div key={sub.key}>• {sub.label}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={carregarDados} 
                disabled={loadingData || !obraId || !tipoEnsaioSelecionado}
                className="bg-[#00233B] text-white hover:bg-[#00233B]/90"
              >
                {loadingData ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Gerar Resumo'
                )}
              </Button>
              {dadosConsolidados.length > 0 && (
                <Button 
                  onClick={exportarParaCSV} 
                  variant="outline"
                  className="border-[#00233B] text-[#00233B] hover:bg-[#00233B]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {dadosConsolidados.length > 0 && (
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#00233B]">
                  Resultados - {dadosConsolidados.length} registro(s)
                </CardTitle>
                {obraSelecionada && (
                  <Badge className="bg-[#566E3D] text-white">
                    {obraSelecionada.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#00233B] text-white">
                      <th className="border border-white/20 px-2 py-2 text-left">Tipo</th>
                      <th className="border border-white/20 px-2 py-2 text-left">Data</th>
                      {Object.keys(dadosConsolidados[0])
                        .filter(key => key !== 'tipo' && key !== 'data' && key !== 'id')
                        .map(key => (
                          <th key={key} className="border border-white/20 px-2 py-2 text-left">
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dadosConsolidados.map((linha, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                        <td className="border border-white/20 px-2 py-2 font-medium text-[#00233B]">
                          {linha.tipo}
                        </td>
                        <td className="border border-white/20 px-2 py-2 text-[#00233B]">
                          {formatValue(linha.data, 'data')}
                        </td>
                        {Object.keys(linha)
                          .filter(key => key !== 'tipo' && key !== 'data' && key !== 'id')
                          .map(key => (
                            <td key={key} className="border border-white/20 px-2 py-2 text-[#00233B]">
                              {linha[key]}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {dadosConsolidados.length === 0 && !loadingData && tipoEnsaioSelecionado && obraId && (
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-[#00233B]/10 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-[#00233B]/50" />
              </div>
              <p className="text-[#00233B]/80 text-center">
                Clique em "Gerar Resumo" para visualizar os dados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}