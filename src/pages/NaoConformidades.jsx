import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Filter, Loader2, TrendingDown, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const TIPOS_CHECKLIST = [
  { value: "ChecklistUsina", label: "Checklist de Usina" },
  { value: "ChecklistAplicacao", label: "Checklist de Aplicação" },
  { value: "ChecklistMRAF", label: "Checklist MRAF" },
  { value: "ChecklistConcretagem", label: "Checklist de Concretagem" },
  { value: "ChecklistTerraplanagem", label: "Checklist de Terraplanagem" }
];

const COLORS = {
  conforme: '#566E3D',
  nao_conforme: '#dc2626',
  pendente: '#FBBF24'
};

export default function NaoConformidadesPage() {
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Filtros
  const [obraId, setObraId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Dados
  const [naoConformidades, setNaoConformidades] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    conformes: 0,
    naoConformes: 0,
    pendentes: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Executar análise automaticamente quando obra ou período mudar
  useEffect(() => {
    if (obraId) {
      analisarDados();
    }
  }, [obraId, dataInicio, dataFim]);

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

      if (availableObras.length === 1) {
        setObraId(availableObras[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const extrairNaoConformidades = (checklist, tipo) => {
    const naoConformidadesEncontradas = [];

    if (tipo === 'ChecklistUsina') {
      // Controle CAUQ
      if (checklist.controle_cauq) {
        const campos = [
          { key: 'extracao_ligante_rotarex', label: 'Extração Ligante (Rotarex)' },
          { key: 'extracao_ligante_soxhlet', label: 'Extração Ligante (Soxhlet)' },
          { key: 'granulometria', label: 'Granulometria' },
          { key: 'volume_vazios', label: 'Volume de Vazios' },
          { key: 'rbv', label: 'RBV' },
          { key: 'rtcd_25c', label: 'RTCD 25°C' },
          { key: 'estabilidade', label: 'Estabilidade' },
          { key: 'fluencia', label: 'Fluência' }
        ];

        campos.forEach(campo => {
          const ensaio = checklist.controle_cauq[campo.key];
          if (ensaio?.realizado && ensaio.conforme === false) {
            naoConformidadesEncontradas.push({
              tipo: 'Controle CAUQ',
              campo: campo.label,
              valor: ensaio.resultados ? `Resultados: ${JSON.stringify(ensaio.resultados)}` : 'Não conforme'
            });
          }
        });
      }

      // Equivalente de areia
      if (checklist.equivalente_areia_status === 'realizado' && checklist.equivalente_areia_resultados) {
        const limite = checklist.projeto_equivalente_areia_minimo || 55;
        checklist.equivalente_areia_resultados.forEach((resultado, idx) => {
          if (resultado < limite) {
            naoConformidadesEncontradas.push({
              tipo: 'Equivalente de Areia',
              campo: `Ensaio ${idx + 1}`,
              valor: `${resultado}% (Mínimo: ${limite}%)`
            });
          }
        });
      }
    }

    if (tipo === 'ChecklistAplicacao') {
      // Taxa de Pintura
      if (checklist.pintura_ligacao?.taxa_pintura?.realizado && 
          checklist.pintura_ligacao.taxa_pintura.conforme === false) {
        naoConformidadesEncontradas.push({
          tipo: 'Pintura de Ligação',
          campo: 'Taxa de Pintura',
          valor: `${checklist.pintura_ligacao.taxa_pintura.resultado} l/m² (Limite: 0,8 a 1,0 l/m²)`
        });
      }

      // Taxa de Pintura Residual
      if (checklist.pintura_ligacao?.taxa_pintura_residual?.realizado && 
          checklist.pintura_ligacao.taxa_pintura_residual.conforme === false) {
        naoConformidadesEncontradas.push({
          tipo: 'Pintura de Ligação',
          campo: 'Taxa de Pintura Residual',
          valor: `${checklist.pintura_ligacao.taxa_pintura_residual.resultado} l/m² (Limite: 0,3 a 0,4 l/m²)`
        });
      }

      // Temperatura de aplicação
      if (checklist.controle_aplicacao?.temp_aplicacao_cargas?.realizado && 
          checklist.controle_aplicacao.temp_aplicacao_cargas.conforme === false) {
        naoConformidadesEncontradas.push({
          tipo: 'Temperatura de Aplicação',
          campo: 'Temperatura das Cargas',
          valor: checklist.controle_aplicacao.temp_aplicacao_cargas.resultados ? 
            `${checklist.controle_aplicacao.temp_aplicacao_cargas.resultados.join(', ')}°C` : 'Não conforme'
        });
      }

      // Espessura da camada
      if (checklist.controle_aplicacao?.espessura_camada?.realizado && 
          checklist.controle_aplicacao.espessura_camada.conforme === false) {
        naoConformidadesEncontradas.push({
          tipo: 'Espessura da Camada',
          campo: 'Medições de Espessura',
          valor: checklist.controle_aplicacao.espessura_camada.resultados ? 
            `${checklist.controle_aplicacao.espessura_camada.resultados.join(', ')} cm` : 'Não conforme'
        });
      }
    }

    if (tipo === 'ChecklistConcretagem') {
      // Verificar slump e espessura em cada carga
      if (checklist.cargas_concreto) {
        checklist.cargas_concreto.forEach((carga, idx) => {
          if (carga.slump_test?.realizado && carga.slump_test.conforme === false) {
            naoConformidadesEncontradas.push({
              tipo: 'Slump Test',
              campo: `Carga ${carga.numero_carga || idx + 1}`,
              valor: `${carga.slump_test.resultado} cm (Limite: ${carga.slump_test.limite || 'N/A'})`
            });
          }

          if (carga.espessura_camada?.realizado && carga.espessura_camada.conforme === false) {
            naoConformidadesEncontradas.push({
              tipo: 'Espessura da Camada',
              campo: `Carga ${carga.numero_carga || idx + 1}`,
              valor: `${carga.espessura_camada.resultado} cm (Limite: ${carga.espessura_camada.limite || 'N/A'})`
            });
          }
        });
      }
    }

    if (tipo === 'ChecklistTerraplanagem') {
      // Verificar ensaios da empreiteira
      if (checklist.ensaios_empreiteira) {
        const ensaios = [
          { key: 'compactacao_proctor', label: 'Compactação Proctor' },
          { key: 'isc', label: 'ISC' },
          { key: 'umidade_frigideira', label: 'Umidade (Frigideira)' },
          { key: 'massa_especifica_in_situ', label: 'Massa Específica In Situ' },
          { key: 'granulometria', label: 'Granulometria' }
        ];

        ensaios.forEach(ensaio => {
          const dados = checklist.ensaios_empreiteira[ensaio.key];
          if (dados?.realizado && dados.conforme === false) {
            naoConformidadesEncontradas.push({
              tipo: 'Ensaio Empreiteira',
              campo: ensaio.label,
              valor: dados.resultados || dados.observacoes || 'Não conforme'
            });
          }
        });
      }
    }

    if (tipo === 'ChecklistMRAF') {
      // Verificar acompanhamento de aplicação
      if (checklist.acompanhamento_aplicacao) {
        const ensaios = [
          { key: 'taxa_aplicacao', label: 'Taxa de Aplicação', unidade: 'kg/m²', limites: '8 a 16' },
          { key: 'residuo_emulsao', label: 'Resíduo da Emulsão', unidade: '%', limites: '6,5% a 12,0%' },
          { key: 'espessura_camada', label: 'Espessura da Camada', unidade: 'mm', limites: '6 a 20' }
        ];

        ensaios.forEach(ensaio => {
          const dados = checklist.acompanhamento_aplicacao[ensaio.key];
          if (dados?.realizado && dados.conforme === false) {
            naoConformidadesEncontradas.push({
              tipo: 'Acompanhamento Aplicação MRAF',
              campo: ensaio.label,
              valor: `${dados.resultado} ${ensaio.unidade} (Limite: ${ensaio.limites})`
            });
          }
        });
      }
    }

    return naoConformidadesEncontradas;
  };

  const analisarDados = async () => {
    if (!obraId) {
      return;
    }

    setLoadingData(true);
    try {
      const todasNaoConformidades = [];
      let totalConformes = 0;
      let totalNaoConformes = 0;
      let totalPendentes = 0;

      // Analisar todos os tipos de checklist automaticamente
      const todosTipos = TIPOS_CHECKLIST.map(t => t.value);

      for (const tipo of todosTipos) {
        const checklists = await base44.entities[tipo].filter({ obra_id: obraId });

        // Filtrar por período
        let checklistsFiltrados = checklists;
        if (dataInicio || dataFim) {
          checklistsFiltrados = checklists.filter(c => {
            const dataChecklist = c.data;
            if (!dataChecklist) return false;

            const dataChecklistObj = new Date(dataChecklist);
            
            if (dataInicio) {
              const dataInicioObj = new Date(dataInicio);
              if (dataChecklistObj < dataInicioObj) return false;
            }
            
            if (dataFim) {
              const dataFimObj = new Date(dataFim);
              if (dataChecklistObj > dataFimObj) return false;
            }
            
            return true;
          });
        }

        checklistsFiltrados.forEach(checklist => {
          const naoConformidadesItem = extrairNaoConformidades(checklist, tipo);
          
          if (naoConformidadesItem.length > 0) {
            totalNaoConformes += naoConformidadesItem.length;
            
            // Extrair informações de localização e responsável
            let responsavel = '';
            if (tipo === 'ChecklistUsina') {
              responsavel = checklist.usina || '';
            } else if (tipo === 'ChecklistAplicacao') {
              responsavel = checklist.usina || '';
            } else if (tipo === 'ChecklistMRAF') {
              responsavel = checklist.usina || '';
            } else if (tipo === 'ChecklistConcretagem') {
              responsavel = checklist.concreteira || '';
            } else if (tipo === 'ChecklistTerraplanagem') {
              responsavel = checklist.empreiteira || '';
            }
            
            todasNaoConformidades.push({
              id: checklist.id,
              tipo: TIPOS_CHECKLIST.find(t => t.value === tipo)?.label || tipo,
              data: checklist.data,
              obra_id: checklist.obra_id,
              rodovia: checklist.rodovia || '',
              trecho: checklist.trecho || '',
              responsavel: responsavel,
              naoConformidades: naoConformidadesItem
            });
          } else if (checklist.approved === true) {
            totalConformes++;
          } else if (checklist.approved === null) {
            totalPendentes++;
          }
        });
      }

      setNaoConformidades(todasNaoConformidades);
      setEstatisticas({
        total: todasNaoConformidades.length + totalConformes + totalPendentes,
        conformes: totalConformes,
        naoConformes: totalNaoConformes,
        pendentes: totalPendentes
      });
    } catch (error) {
      console.error("Erro ao analisar dados:", error);
      alert("Erro ao carregar dados de não conformidades.");
    } finally {
      setLoadingData(false);
    }
  };



  // Dados para gráficos
  const dadosPorTipo = useMemo(() => {
    const contagem = {};
    naoConformidades.forEach(item => {
      item.naoConformidades.forEach(nc => {
        const tipo = nc.tipo;
        contagem[tipo] = (contagem[tipo] || 0) + 1;
      });
    });

    return Object.entries(contagem)
      .map(([tipo, quantidade]) => ({ tipo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [naoConformidades]);

  const dadosDistribuicao = useMemo(() => [
    { name: 'Conformes', value: estatisticas.conformes, color: COLORS.conforme },
    { name: 'Não Conformes', value: estatisticas.naoConformes, color: COLORS.nao_conforme },
    { name: 'Pendentes', value: estatisticas.pendentes, color: COLORS.pendente }
  ], [estatisticas]);

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
          <h1 className="text-3xl font-bold text-[#00233B]">Análise de Não Conformidades</h1>
          <p className="text-[#00233B]/80 mt-1">
            Identifique e analise não conformidades nos checklists de campo
          </p>
        </div>

        {/* Filtros */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#BFCF99]" />
              Filtros de Análise
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

            {loadingData && (
              <div className="flex items-center gap-2 text-[#00233B]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analisando não conformidades...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {estatisticas.total > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#00233B]/80">Total Analisado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#00233B]">{estatisticas.total}</div>
                  <p className="text-xs text-[#00233B]/70 mt-1">Checklists analisados</p>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#00233B]/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#566E3D]" />
                    Conformes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#566E3D]">{estatisticas.conformes}</div>
                  <p className="text-xs text-[#00233B]/70 mt-1">
                    {estatisticas.total > 0 ? ((estatisticas.conformes / estatisticas.total) * 100).toFixed(1) : 0}% do total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#00233B]/80 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Não Conformes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{estatisticas.naoConformes}</div>
                  <p className="text-xs text-[#00233B]/70 mt-1">Itens com desvio</p>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#00233B]/80 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FBBF24]" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#854d0e]">{estatisticas.pendentes}</div>
                  <p className="text-xs text-[#00233B]/70 mt-1">Aguardando análise</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras - Não Conformidades por Tipo */}
              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-[#00233B]">Não Conformidades por Tipo</CardTitle>
                  <p className="text-sm text-[#00233B]/70">Distribuição dos tipos de desvios encontrados</p>
                </CardHeader>
                <CardContent>
                  {dadosPorTipo.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dadosPorTipo}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 35, 59, 0.1)" />
                        <XAxis dataKey="tipo" stroke="#00233B" angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke="#00233B" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(242, 241, 239, 0.95)', border: '1px solid rgba(0, 35, 59, 0.2)', borderRadius: '8px' }} />
                        <Bar dataKey="quantidade" fill="#dc2626" name="Quantidade" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-[#00233B]/60">
                      Nenhuma não conformidade encontrada
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Pizza - Distribuição Geral */}
              <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-[#00233B]">Distribuição de Status</CardTitle>
                  <p className="text-sm text-[#00233B]/70">Proporção entre conformes, não conformes e pendentes</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosDistribuicao}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {dadosDistribuicao.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(242, 241, 239, 0.95)', border: '1px solid rgba(0, 35, 59, 0.2)', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Não Conformidades */}
            <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[#00233B]">
                    Detalhamento das Não Conformidades
                  </CardTitle>
                  {obraSelecionada && (
                    <Badge className="bg-[#566E3D] text-white">
                      {obraSelecionada.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {naoConformidades.length > 0 ? (
                  <div className="space-y-4">
                    {naoConformidades.map((item, idx) => (
                      <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50/50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-[#00233B]">{item.tipo}</h4>
                              <Badge variant="destructive" className="bg-red-600 shrink-0">
                                {item.naoConformidades.length} desvio(s)
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-[#00233B]/70">
                              <div>
                                <span className="font-bold text-[#00233B]">Data:</span> {new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              </div>
                              {item.responsavel && (
                                <div>
                                  <span className="font-bold text-[#00233B]">Responsável:</span> {item.responsavel}
                                </div>
                              )}
                              {item.rodovia && (
                                <div>
                                  <span className="font-bold text-[#00233B]">Rodovia:</span> {item.rodovia}
                                </div>
                              )}
                              {item.trecho && (
                                <div>
                                  <span className="font-bold text-[#00233B]">Trecho:</span> {item.trecho}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const reportUrl = (() => {
                                if (item.tipo.includes('Usina')) return createPageUrl(`RelatorioChecklist?id=${item.id}`);
                                if (item.tipo.includes('Aplicação')) return createPageUrl(`RelatorioChecklistAplicacao?id=${item.id}`);
                                if (item.tipo.includes('MRAF')) return createPageUrl(`RelatorioChecklistMRAF?id=${item.id}`);
                                if (item.tipo.includes('Concretagem')) return createPageUrl(`RelatorioChecklistConcretagem?id=${item.id}`);
                                if (item.tipo.includes('Terraplanagem')) return createPageUrl(`RelatorioChecklistTerraplanagem?id=${item.id}`);
                                return '#';
                              })();
                              window.open(reportUrl, '_blank');
                            }}
                            className="text-[#00233B] hover:bg-[#00233B]/10 border-white/20"
                          >
                            Ver Registro
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {item.naoConformidades.map((nc, ncIdx) => (
                            <div key={ncIdx} className="bg-white/50 rounded p-3 border border-red-200">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-[#00233B]">
                                    {nc.tipo} - {nc.campo}
                                  </p>
                                  <p className="text-xs text-[#00233B]/80 mt-1">{nc.valor}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-[#566E3D] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#00233B] mb-2">
                      Nenhuma não conformidade encontrada
                    </h3>
                    <p className="text-[#00233B]/70">
                      Todos os checklists analisados estão em conformidade ou pendentes de análise.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {estatisticas.total === 0 && !loadingData && obraId && (
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingDown className="w-16 h-16 text-[#00233B]/30 mb-4" />
              <p className="text-[#00233B]/80 text-center">
                Selecione uma obra para visualizar as não conformidades
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}