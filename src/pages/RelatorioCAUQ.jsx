import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

const PENEIRAS_CONFIG = [
  { label: 'Nº 3"', abertura: '75,0', key: 'peneira_75_0mm' },
  { label: 'Nº 2½"', abertura: '63,0', key: 'peneira_63_0mm' },
  { label: 'Nº 2"', abertura: '50,0', key: 'peneira_50_0mm' },
  { label: 'Nº 1½"', abertura: '37,5', key: 'peneira_37_5mm' },
  { label: 'Nº 1"', abertura: '25,0', key: 'peneira_25_0mm' },
  { label: 'Nº ¾"', abertura: '19,0', key: 'peneira_19_0mm' },
  { label: 'Nº ⅝"', abertura: '16,0', key: 'peneira_16_0mm' },
  { label: 'Nº ½"', abertura: '12,5', key: 'peneira_12_5mm' },
  { label: 'Nº ⅜"', abertura: '9,5', key: 'peneira_9_5mm' },
  { label: 'Nº 4', abertura: '4,75', key: 'peneira_4_75mm' },
  { label: 'Nº 8', abertura: '2,36', key: 'peneira_2_36mm' },
  { label: 'Nº 10', abertura: '2,0', key: 'peneira_2_0mm' },
  { label: 'Nº 16', abertura: '1,18', key: 'peneira_1_18mm' },
  { label: 'Nº 30', abertura: '0,6', key: 'peneira_0_6mm' },
  { label: 'Nº 40', abertura: '0,42', key: 'peneira_0_42mm' },
  { label: 'Nº 50', abertura: '0,3', key: 'peneira_0_3mm' },
  { label: 'Nº 80', abertura: '0,18', key: 'peneira_0_18mm' },
  { label: 'Nº 100', abertura: '0,15', key: 'peneira_0_15mm' },
  { label: 'Nº 200', abertura: '0,075', key: 'peneira_0_075mm' }
];

export default function RelatorioCAUQ() {
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [project, setProject] = useState(null);
  const [faixa, setFaixa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ensaioId = params.get('id');

      if (!ensaioId) {
        setError("ID do ensaio não fornecido");
        return;
      }

      const ensaioData = await base44.entities.EnsaioCAUQ.get(ensaioId);
      setEnsaio(ensaioData);

      if (ensaioData.obra_id) {
        const obraData = await base44.entities.Obra.get(ensaioData.obra_id);
        setObra(obraData);

        if (obraData.regional_id) {
          const regionalData = await base44.entities.Regional.get(obraData.regional_id);
          setRegional(regionalData);
        }
      }

      if (ensaioData.project_id) {
        const projectData = await base44.entities.Project.get(ensaioData.project_id);
        setProject(projectData);

        if (projectData.faixa_granulometrica_id) {
          const faixaData = await base44.entities.FaixaGranulometrica.get(projectData.faixa_granulometrica_id);
          setFaixa(faixaData);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    return new Date(normalizedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };

  // Cálculos de granulometria - apenas peneiras da faixa
  const calcularGranulometria = () => {
    if (!ensaio?.granulometria?.peso_retido_peneiras) return [];
    
    const pesosRetidos = ensaio.granulometria.peso_retido_peneiras;
    const pesoInicial = ensaio.extracao_ligante?.amostra_sem_ligante || 0;
    
    // Filtrar apenas peneiras que estão na faixa do projeto
    let peneirasRelevantes = PENEIRAS_CONFIG;
    
    if (faixa?.peneiras && faixa.peneiras.length > 0) {
      peneirasRelevantes = PENEIRAS_CONFIG.filter(peneira => {
        return faixa.peneiras.some(p => {
          const aberturaFaixa = p.abertura.toString().replace(/mm/gi, '').replace(',', '.').trim();
          const aberturaConfig = peneira.abertura.replace(',', '.').trim();
          return parseFloat(aberturaFaixa) === parseFloat(aberturaConfig);
        });
      });
    }
    
    let acumuladoRetido = 0;
    
    return peneirasRelevantes.map(peneira => {
      const pesoRetido = pesosRetidos[peneira.key] || 0;
      acumuladoRetido += pesoRetido;
      
      const percentualPassante = pesoInicial > 0 
        ? ((pesoInicial - acumuladoRetido) / pesoInicial * 100).toFixed(1)
        : 0;
      
      // Buscar limites da faixa
      let limiteMin = '', limiteMax = '';
      if (faixa?.peneiras) {
        const peneiraFaixa = faixa.peneiras.find(p => {
          const aberturaFaixa = p.abertura.toString().replace(/mm/gi, '').replace(',', '.').trim();
          const aberturaConfig = peneira.abertura.replace(',', '.').trim();
          return parseFloat(aberturaFaixa) === parseFloat(aberturaConfig);
        });
        
        if (peneiraFaixa) {
          limiteMin = peneiraFaixa.min || '';
          limiteMax = peneiraFaixa.max || '';
        }
      }
      
      // Buscar faixa de trabalho do projeto
      let faixaTrabalhoMin = '', faixaTrabalhoMax = '', faixaTrabalho = '';
      if (project) {
        const keyFaixaTrabalho = peneira.key;
        faixaTrabalho = project.faixa_trabalho?.[keyFaixaTrabalho] || '';
        faixaTrabalhoMin = project.faixa_trabalho_min?.[keyFaixaTrabalho] || '';
        faixaTrabalhoMax = project.faixa_trabalho_max?.[keyFaixaTrabalho] || '';
      }
      
      return {
        astm: peneira.label,
        abertura: peneira.abertura,
        retido: pesoRetido,
        passante: ((pesoInicial - acumuladoRetido) || 0).toFixed(1),
        percentualPassante,
        limiteMin,
        limiteMax,
        faixaTrabalhoMin,
        faixaTrabalho,
        faixaTrabalhoMax
      };
    });
  };

  const dadosGranulometria = calcularGranulometria();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !ensaio) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600">{error || "Erro ao carregar relatório"}</p>
      </div>
    );
  }

  const corposProva = ensaio.corpos_prova_marshall || [];
  const cpsValidos = corposProva.slice(0, 6);

  // Calcular médias
  const calcularMedia = (campo) => {
    const valores = cpsValidos.map(cp => parseFloat(cp[campo])).filter(v => !isNaN(v));
    if (valores.length === 0) return '-';
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;

    // Densidade aparente: 3 casas decimais
    if (campo === 'densidade_aparente') return media.toFixed(3);
    // Volume de vazios: 1 casa decimal
    if (campo === 'volume_vazios') return media.toFixed(1);

    return media.toFixed(2);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[297mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Ensaio Marshall
          </h2>
          <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      <div>
        <div className="w-full max-w-[270mm] mx-auto bg-white shadow-xl print:shadow-none pt-0.5 px-3 pb-0.5 print:pt-0 print:px-0.5 print:pb-0">
          {/* Header */}
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0 mb-0">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-10 print:h-7 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-xs font-bold text-gray-800 leading-tight print:text-[9px] print:leading-tight">
                {ensaio.realizar_marshall || ensaio.realizar_densidade_rice ? (
                  <>ENSAIO DE EXTRAÇÃO E GRANULOMETRIA<br/>PARÂMETROS MARSHALL E DENSIDADE RICE</>
                ) : (
                  <>ENSAIO DE EXTRAÇÃO E GRANULOMETRIA</>
                )}
              </h1>
              {(ensaio.realizar_marshall || ensaio.realizar_densidade_rice) && (
                <p className="text-[10px] text-gray-500 mt-0.5 print:text-[7px] print:mt-0">MÉTODO DE ENSAIO: DNIT 428/22 - NBR 15087/12</p>
              )}
            </div>
            <div className="flex justify-end items-start">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-700 print:text-[9px]">DATA:</p>
                <p className="text-xs font-semibold text-gray-900 print:text-[10px]">{formatDate(ensaio.data_ensaio)}</p>
              </div>
            </div>
          </header>

          <main className="text-sm print:text-sm">
            {/* DADOS DA OBRA */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-1 py-0 font-bold text-center mb-0 text-[8px] leading-tight">
              DADOS DA OBRA
            </div>

            <div className="grid grid-cols-4 gap-x-1 gap-y-0 mb-0 text-[9px] leading-tight">
              {/* Coluna 1: Cliente, Obra, Rodovia */}
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">CLIENTE:</p>
                <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
              </div>

              {/* Coluna 2: Trecho, Local de Coleta, Usina Fornecedora */}
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">TRECHO:</p>
                <p className="text-gray-900">{ensaio.trecho || 'N/A'}</p>
              </div>

              {/* Coluna 3: Projeto, Faixa, Pedreira */}
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">Nº PROJETO:</p>
                <p className="text-gray-900">{project?.name || 'N/A'}</p>
              </div>

              {/* Coluna 4: Placa do Caminhão, Laboratorista, Hora */}
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">PLACA CAMINHÃO:</p>
                <p className="text-gray-900">{ensaio.placa_caminhao || 'N/A'}</p>
              </div>

              {/* Linha 2 */}
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">OBRA:</p>
                <p className="text-gray-900">{obra?.name || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">LOCAL DE COLETA:</p>
                <p className="text-gray-900">{ensaio.local_coleta || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">FAIXA ESPECIFICADA:</p>
                <p className="text-gray-900">{faixa?.nome || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">LABORATORISTA:</p>
                <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
              </div>

              {/* Linha 3 */}
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">RODOVIA:</p>
                <p className="text-gray-900">{ensaio.rodovia || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">USINA FORNECEDORA:</p>
                <p className="text-gray-900">{ensaio.usina_fornecedora || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">PEDREIRA:</p>
                <p className="text-gray-900">{ensaio.pedreira || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">HORÁRIO:</p>
                <p className="text-gray-900">{ensaio.horario || 'N/A'}</p>
              </div>

              {/* Linha 4 */}
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">ENSAIO REALIZADO POR:</p>
                <p className="text-gray-900">{ensaio.ensaio_realizado_por || 'N/A'}</p>
              </div>
            </div>

            {/* DADOS DO ENSAIO - Granulometria e Extração */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-1 py-0 font-bold text-center mb-0 mt-0 text-[8px] leading-tight">
              DADOS DO ENSAIO
            </div>

            <div className={`grid ${ensaio.realizar_marshall ? 'grid-cols-12 gap-0' : 'grid-cols-12 gap-2'} mb-0`}>
              {/* Coluna Granulometria */}
              <div className={`${ensaio.realizar_marshall ? 'col-span-7' : 'col-span-7'} border border-slate-400`}>
                <div className={`bg-slate-200 font-bold text-center border-b border-slate-400 ${ensaio.realizar_marshall ? 'px-0.5 py-0 text-[9px]' : 'px-1.5 py-1 text-[11px]'}`}>
                  ENSAIO DE GRANULOMETRIA - DNIT 412/2025
                </div>
                <div className="overflow-x-auto">
                  <table className={`w-full border-collapse ${ensaio.realizar_marshall ? 'text-[7px]' : 'text-[9px]'} leading-tight`}>
                    <thead>
                      <tr className="bg-slate-100">
                        <th rowSpan="2" className={`border-r border-slate-300 font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>PENEIRAS<br/>ASTM (mm)</th>
                        <th colSpan="3" className={`border-r border-slate-300 font-bold text-center leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>PESO DA AMOSTRA (g)</th>
                        <th colSpan="2" className={`border-r border-slate-300 font-bold text-center leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>FAIXA DE TRABALHO</th>
                        <th colSpan="2" className={`font-bold text-center leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>FAIXA ESPECIFICADA<br/>{faixa?.especificacao || ''}</th>
                      </tr>
                      <tr className="bg-slate-100">
                        <th className={`border-r border-slate-300 font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>RETIDO (g)</th>
                        <th className={`border-r border-slate-300 font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>PASS. (g)</th>
                        <th className={`border-r border-slate-300 font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>% PASS.</th>
                        <th className={`border-r border-slate-300 font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>MÍN. (%)</th>
                        <th className={`border-r border-slate-300 font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>MÁX. (%)</th>
                        <th className={`border-r border-slate-300 font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>MÍN. (%)</th>
                        <th className={`font-bold leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1'}`}>MÁX. (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosGranulometria.map((dado, idx) => {
                        const numPeneiras = dadosGranulometria.length;
                        // Altura dinâmica baseada no número de peneiras e se tem marshall
                        const heightClass = ensaio.realizar_marshall ? (
                          numPeneiras <= 5 ? 'h-8' : 
                          numPeneiras <= 7 ? 'h-6' : 
                          numPeneiras <= 10 ? 'h-5' : 
                          numPeneiras <= 13 ? 'h-4' : 'h-3'
                        ) : (
                          numPeneiras <= 5 ? 'h-12' : 
                          numPeneiras <= 7 ? 'h-10' : 
                          numPeneiras <= 10 ? 'h-8' : 
                          numPeneiras <= 13 ? 'h-7' : 'h-6'
                        );

                        const paddingClass = ensaio.realizar_marshall ? 'px-0' : 'px-1.5';

                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className={`border-r border-slate-300 ${paddingClass} text-center font-semibold ${heightClass}`}>{dado.astm}</td>
                            <td className={`border-r border-slate-300 ${paddingClass} text-center ${heightClass}`}>{dado.retido}</td>
                            <td className={`border-r border-slate-300 ${paddingClass} text-center ${heightClass}`}>{dado.passante}</td>
                            <td className={`border-r border-slate-300 ${paddingClass} text-center font-semibold ${heightClass}`}>{dado.percentualPassante}</td>
                            <td className={`border-r border-slate-300 ${paddingClass} text-center ${heightClass}`}>{dado.faixaTrabalhoMin ? parseFloat(dado.faixaTrabalhoMin).toFixed(1) : ''}</td>
                            <td className={`border-r border-slate-300 ${paddingClass} text-center ${heightClass}`}>{dado.faixaTrabalhoMax ? parseFloat(dado.faixaTrabalhoMax).toFixed(1) : ''}</td>
                            <td className={`border-r border-slate-300 ${paddingClass} text-center ${heightClass}`}>{dado.limiteMin ? parseFloat(dado.limiteMin).toFixed(1) : ''}</td>
                            <td className={`${paddingClass} text-center ${heightClass}`}>{dado.limiteMax ? parseFloat(dado.limiteMax).toFixed(1) : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coluna Extração de Ligante */}
              <div className="col-span-5">
                <div className={`border border-slate-400 ${ensaio.realizar_marshall ? 'border-l-0' : ''}`}>
                  <div className={`bg-slate-200 font-bold text-center border-b border-slate-400 leading-tight ${ensaio.realizar_marshall ? 'px-0.5 py-0 text-[8px]' : 'px-1.5 py-1 text-[11px]'}`}>
                    EXTRAÇÃO LIGANTE (ROTAREX)<br/>ABNT NBR 16208/2013
                  </div>
                  <table className={`w-full border-collapse table-fixed ${ensaio.realizar_marshall ? 'text-[7px]' : 'text-[9px]'}`}>
                    <colgroup>
                      <col className="w-[35%]" />
                      <col className="w-[65%]" />
                    </colgroup>
                    <tbody>
                      <tr className="bg-white">
                        <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>TEMP. CAP:</td>
                        <td className={`${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.temperatura_cap || '-'}°C</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>TIPO LIG.:</td>
                        <td className={`${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.tipo_ligante || '-'}</td>
                      </tr>

                      {ensaio.extracao_ligante && (
                        <>
                          <tr className="bg-white">
                            <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>AM. C/ LIG.:</td>
                            <td className={`${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.amostra_com_ligante || '-'} g</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>AM. S/ LIG.:</td>
                            <td className={`${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.amostra_sem_ligante || '-'} g</td>
                          </tr>
                          <tr className="bg-white">
                            <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>FAT. CORR.:</td>
                            <td className={`${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.fator_correcao || '1.0000'}</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>PESO LIG.:</td>
                            <td className={`${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.peso_ligante || '-'} g</td>
                          </tr>
                          <tr className="bg-white">
                            <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>TEOR LIG.:</td>
                            <td className={`font-semibold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.teor_ligante || '-'}%</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>FILLER/BET.:</td>
                            <td className={`font-semibold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.filler_betume || '-'}</td>
                          </tr>

                          {ensaio.extracao_ligante.teor_ligante_real && (
                            <tr className="bg-blue-50">
                              <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>TEOR LIG. REAL:</td>
                              <td className={`font-semibold text-blue-700 ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.teor_ligante_real}%</td>
                            </tr>
                          )}

                          {ensaio.extracao_ligante.amostra_umida && (
                            <tr className="bg-blue-50">
                              <td className={`border-r border-slate-300 font-bold ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>UMIDADE:</td>
                              <td className={`font-semibold text-blue-700 ${ensaio.realizar_marshall ? 'px-0.5 py-0' : 'px-2 py-1.5'}`}>{ensaio.extracao_ligante.umidade || 0}%</td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>

            {/* Gráfico de Granulometria */}
            <div className={`border border-slate-300 p-0 print:p-0 ${ensaio.realizar_marshall ? 'mb-0' : 'mb-2'}`}>
              <h3 className={`font-bold text-center mb-0 print:py-0 ${ensaio.realizar_marshall ? 'text-[7px] print:text-[6px]' : 'text-[10px] print:text-[9px] py-1'}`}>GRANULOMETRIA DA MISTURA</h3>
              <div className={`relative ${ensaio.realizar_marshall ? 'h-48 print:h-48' : 'h-96 print:h-80'}`}>
                {hoveredPoint && (
                  <div 
                    className="absolute bg-white border-2 border-slate-300 rounded-lg shadow-lg p-2 text-[8px] z-50 pointer-events-none"
                    style={{
                      left: `${tooltipPos.x + 10}px`,
                      top: `${tooltipPos.y - 10}px`,
                      transform: 'translateY(-100%)'
                    }}
                  >
                    <div className="font-bold text-slate-800 mb-1">{hoveredPoint.astm}</div>
                    {hoveredPoint.faixaEspecMin && (
                      <div className="text-red-600">Faixa Especificada: {hoveredPoint.faixaEspecMin}%</div>
                    )}
                    {hoveredPoint.faixaEspecMax && (
                      <div className="text-red-600">Faixa Especificada: {hoveredPoint.faixaEspecMax}%</div>
                    )}
                    {hoveredPoint.faixaTrabalhoMin && (
                      <div className="text-amber-600">Faixa de Trabalho Mín: {hoveredPoint.faixaTrabalhoMin}%</div>
                    )}
                    {hoveredPoint.faixaTrabalhoMax && (
                      <div className="text-amber-600">Faixa de Trabalho Máx: {hoveredPoint.faixaTrabalhoMax}%</div>
                    )}
                    <div className="text-blue-600 font-semibold">% Passante (Ensaio): {hoveredPoint.percentualPassante}%</div>
                  </div>
                )}
                <svg width="100%" height="100%" viewBox={ensaio.realizar_marshall ? "0 0 640 250" : "0 0 640 450"} preserveAspectRatio="xMidYMid meet">
                  {/* Eixos */}
                  {(() => {
                    const altura = ensaio.realizar_marshall ? 190 : 390;
                    return (
                      <>
                        <line x1="30" y1="5" x2="30" y2={altura} stroke="#333" strokeWidth="1" />
                        <line x1="30" y1={altura} x2="620" y2={altura} stroke="#333" strokeWidth="1" />
                      </>
                    );
                  })()}

                  {/* Grid horizontal (% passante) */}
                  {(() => {
                    const alturaTotal = ensaio.realizar_marshall ? 190 : 390;
                    const alturaGrafico = ensaio.realizar_marshall ? 185 : 385;
                    return [0, 20, 40, 60, 80, 100].map((value) => {
                      const y = alturaTotal - ((value - 0) / 100 * alturaGrafico);
                      return (
                        <g key={value}>
                          <line x1="30" y1={y} x2="620" y2={y} stroke="#e0e0e0" strokeWidth="0.5" />
                          <text x="25" y={y + 3} fontSize="8" textAnchor="end" fill="#333">{value}%</text>
                        </g>
                      );
                    });
                  })()}

                  {/* Função para converter abertura mm para posição X (escala logarítmica) */}
                  {(() => {
                    if (dadosGranulometria.length === 0) return null;

                    // Obter aberturas em mm
                    const aberturas = dadosGranulometria.map(d => parseFloat(d.abertura.replace(',', '.')));
                    const minAbertura = Math.min(...aberturas);
                    const maxAbertura = Math.max(...aberturas);
                    
                    // Função para converter mm em posição X usando escala log
                    const getX = (aberturaMm) => {
                      const logMin = Math.log10(minAbertura);
                      const logMax = Math.log10(maxAbertura);
                      const logValue = Math.log10(aberturaMm);
                      // Inverter para maior abertura ficar à esquerda
                      return 30 + (590 * (logMax - logValue) / (logMax - logMin));
                    };

                    const alturaTotal = ensaio.realizar_marshall ? 190 : 390;
                    const alturaGrafico = ensaio.realizar_marshall ? 185 : 385;
                    
                    const getY = (percentual) => {
                      return alturaTotal - ((parseFloat(percentual) - 0) / 100 * alturaGrafico);
                    };

                    return (
                      <>
                        {/* Labels do eixo X */}
                        {(() => {
                          const yLabel = ensaio.realizar_marshall ? 205 : 405;
                          return dadosGranulometria.map((d, i) => {
                            const aberturaMm = parseFloat(d.abertura.replace(',', '.'));
                            const x = getX(aberturaMm);
                            return (
                              <text key={i} x={x} y={yLabel} fontSize="8" textAnchor="middle" fill="#333">
                                {d.astm}
                              </text>
                            );
                          });
                        })()}

                        {/* Linhas faixa especificada */}
                        {dadosGranulometria.some(d => d.limiteMin) && (
                          <polyline
                            points={dadosGranulometria.filter(d => d.limiteMin).map(d => {
                              const x = getX(parseFloat(d.abertura.replace(',', '.')));
                              const y = getY(d.limiteMin);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth="1"
                          />
                        )}
                        {dadosGranulometria.some(d => d.limiteMax) && (
                          <polyline
                            points={dadosGranulometria.filter(d => d.limiteMax).map(d => {
                              const x = getX(parseFloat(d.abertura.replace(',', '.')));
                              const y = getY(d.limiteMax);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth="1"
                          />
                        )}



                        {/* Linhas faixa de trabalho (apenas min e max, SEM a mistura do projeto) */}
                        {dadosGranulometria.some(d => d.faixaTrabalhoMin) && (
                          <polyline
                            points={dadosGranulometria.filter(d => d.faixaTrabalhoMin).map(d => {
                              const x = getX(parseFloat(d.abertura.replace(',', '.')));
                              const y = getY(d.faixaTrabalhoMin);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                            strokeDasharray="3,2"
                          />
                        )}
                        {dadosGranulometria.some(d => d.faixaTrabalhoMax) && (
                          <polyline
                            points={dadosGranulometria.filter(d => d.faixaTrabalhoMax).map(d => {
                              const x = getX(parseFloat(d.abertura.replace(',', '.')));
                              const y = getY(d.faixaTrabalhoMax);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                            strokeDasharray="3,2"
                          />
                        )}

                        {/* Linha % Pass. (resultado do ensaio) */}
                        <polyline
                          points={dadosGranulometria.map(d => {
                            const x = getX(parseFloat(d.abertura.replace(',', '.')));
                            const y = getY(d.percentualPassante);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />

                        {/* Pontos com hover */}
                        {dadosGranulometria.map((d, i) => {
                          const x = getX(parseFloat(d.abertura.replace(',', '.')));
                          const y = getY(d.percentualPassante);
                          return (
                            <g key={i}>
                              <circle 
                                cx={x} 
                                cy={y} 
                                r="6" 
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => {
                                  const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
                                  setHoveredPoint({
                                    astm: d.astm,
                                    percentualPassante: d.percentualPassante,
                                    faixaEspecMin: d.limiteMin,
                                    faixaEspecMax: d.limiteMax,
                                    faixaTrabalhoMin: d.faixaTrabalhoMin,
                                    faixaTrabalhoMax: d.faixaTrabalhoMax
                                  });
                                  setTooltipPos({ 
                                    x: e.clientX - svgRect.left, 
                                    y: e.clientY - svgRect.top 
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                              <circle cx={x} cy={y} r="2" fill="#3b82f6" style={{ pointerEvents: 'none' }} />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Legenda */}
                  {(() => {
                    const yLegenda = ensaio.realizar_marshall ? 215 : 415;
                    return (
                      <g transform={`translate(230, ${yLegenda})`}>
                        <line x1="0" y1="3" x2="15" y2="3" stroke="#3b82f6" strokeWidth="2" />
                        <text x="18" y="5" fontSize="7" fill="#333">% Pass.</text>

                        <line x1="60" y1="3" x2="75" y2="3" stroke="#dc2626" strokeWidth="1" />
                        <text x="78" y="5" fontSize="7" fill="#333">Faixa especificada</text>

                        <line x1="170" y1="3" x2="185" y2="3" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x="188" y="5" fontSize="7" fill="#333">Faixa de Trabalho</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Ensaio Marshall - Tabela de Corpos de Prova (apenas se realizar_marshall === true) */}
            {ensaio.realizar_marshall && (
              <>
                <div className="bg-slate-200 px-0.5 py-0 text-[8px] font-bold text-center border-b border-slate-400 mt-0 print:text-[7px] print:py-0">
                  ENSAIO MARSHALL - MÉTODO DE ENSAIO DNIT 447/2024
                </div>

                <div className="overflow-x-auto mb-0 print:mb-0">
              <table className="w-full border-collapse border border-slate-400 text-[8px] table-fixed">
                <colgroup>
                  <col style={{width: '23%'}} />
                  <col style={{width: '5%'}} />
                  <col style={{width: '8%'}} />
                  <col style={{width: '8%'}} />
                  <col style={{width: '8%'}} />
                  <col style={{width: '8%'}} />
                  <col style={{width: '8%'}} />
                  <col style={{width: '8%'}} />
                  <col style={{width: '7%'}} />
                  <col style={{width: '7%'}} />
                  <col style={{width: '5%'}} />
                  <col style={{width: '5%'}} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-200">
                    <th rowSpan="2" className="border border-slate-400 px-0 py-0 font-bold text-[7px]">CORPO DE PROVA</th>
                    <th rowSpan="2" className="border border-slate-400 px-0 py-0 font-bold text-[7px]">UN.</th>
                    <th colSpan="6" className="border border-slate-400 px-0 py-0 font-bold text-center text-[7px]">CORPO DE PROVA</th>
                    <th rowSpan="2" className="border border-slate-400 px-0 py-0 font-bold text-[7px]">MÉDIA</th>
                    <th rowSpan="2" className="border border-slate-400 px-0 py-0 font-bold text-[7px]">PROJ.</th>
                    <th rowSpan="2" className="border border-slate-400 px-0 py-0 font-bold text-[7px]">MÍN.</th>
                    <th rowSpan="2" className="border border-slate-400 px-0 py-0 font-bold text-[7px]">MÁX.</th>
                  </tr>
                  <tr className="bg-slate-200">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <th key={num} className="border border-slate-400 px-0 py-0 font-bold text-[7px]">{num}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">PESO AR</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">g</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                        {cpsValidos[idx]?.peso_ar || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                  </tr>

                  <tr className="bg-slate-50">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">PESO IMERSO</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">g</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                        {cpsValidos[idx]?.peso_imerso || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                  </tr>

                  <tr className="bg-white">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">PESO SSS</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">g</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                        {cpsValidos[idx]?.peso_sss || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                  </tr>

                  <tr className="bg-slate-50">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">VOLUME</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">cm³</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                        {cpsValidos[idx]?.volume || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                  </tr>

                  <tr className="bg-white">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">DENSIDADE APARENTE</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">g/cm³</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">
                        {cpsValidos[idx]?.densidade_aparente || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-bold text-[7px]">{calcularMedia('densidade_aparente')}</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.massa_especifica_aparente || '-'}</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                  </tr>

                  <tr className="bg-slate-50">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">VOLUME DE VAZIOS</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">%</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">
                        {cpsValidos[idx]?.volume_vazios || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-bold text-[7px]">{calcularMedia('volume_vazios')}</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.volume_vazios?.min ? parseFloat(project.volume_vazios.min).toFixed(1) : '-'}</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.volume_vazios?.max ? parseFloat(project.volume_vazios.max).toFixed(1) : '-'}</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.volume_vazios?.otimo ? parseFloat(project.volume_vazios.otimo).toFixed(1) : '-'}</td>
                  </tr>

                  <tr className="bg-white">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">V.C.B.</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">%</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                        {cpsValidos[idx]?.vcb || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    </tr>

                    <tr className="bg-slate-50">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">V.A.M.</td>
                      <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">%</td>
                      {[0, 1, 2, 3, 4, 5].map(idx => (
                        <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                          {cpsValidos[idx]?.vam || '-'}
                        </td>
                      ))}
                      <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                      <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.vam?.projeto ? parseFloat(project.vam.projeto).toFixed(1) : '-'}</td>
                      <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.vam?.min ? parseFloat(project.vam.min).toFixed(1) : '-'}</td>
                      <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    </tr>

                  <tr className="bg-white">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">R.B.V.</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">%</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                        {cpsValidos[idx]?.rbv || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.rbv?.projeto ? parseFloat(project.rbv.projeto).toFixed(1) : '-'}</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.rbv?.min ? parseFloat(project.rbv.min).toFixed(1) : '-'}</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.rbv?.max ? parseFloat(project.rbv.max).toFixed(1) : '-'}</td>
                  </tr>

                  <tr className="bg-slate-50">
                    <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">ALTURA</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">cm</td>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                        {cpsValidos[idx]?.altura || '-'}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                    <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                  </tr>

                  {/* Determinar quais métodos foram usados */}
                  {(() => {
                    const temDiametral = cpsValidos.some(cp => cp?.rtcd_leitura != null && cp?.rtcd_leitura !== '');
                    const temEstabilidade = cpsValidos.some(cp => cp?.estabilidade_leitura != null && cp?.estabilidade_leitura !== '');
                    
                    return (
                      <>
                        {/* RTCD - sempre mostrar se tiver dados */}
                        {temDiametral && (
                          <>
                            <tr className="bg-white">
                              <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">CONST. PRENSA</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td colSpan="6" className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">
                                {cpsValidos[0]?.const_prensa ? parseFloat(cpsValidos[0].const_prensa).toFixed(4) : '1.0000'}
                              </td>
                              <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                            </tr>

                            <tr className="bg-slate-50">
                              <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">LEITURA</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">Kgf/cm²</td>
                              {[0, 1, 2, 3, 4, 5].map(idx => (
                                <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                                  {cpsValidos[idx]?.rtcd_leitura || '-'}
                                </td>
                              ))}
                              <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                            </tr>

                            <tr className="bg-white">
                              <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">RTCD</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">MPa</td>
                              {[0, 1, 2, 3, 4, 5].map(idx => (
                                <td key={idx} className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">
                                  {cpsValidos[idx]?.rtcd_valor || '-'}
                                </td>
                              ))}
                              <td className="border border-slate-400 px-0 py-0 text-center font-bold text-[7px]">{calcularMedia('rtcd_valor')}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.rtcd?.min ? parseFloat(project.rtcd.min).toFixed(1) : '-'}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                            </tr>
                          </>
                        )}

                        {/* Estabilidade e Fluência - sempre mostrar se tiver dados */}
                        {temEstabilidade && (
                          <>
                            {!temDiametral && (
                              <tr className="bg-white">
                                <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">CONST. PRENSA</td>
                                <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                                <td colSpan="6" className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">
                                  {cpsValidos[0]?.const_prensa ? parseFloat(cpsValidos[0].const_prensa).toFixed(4) : '1.0000'}
                                </td>
                                <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                                <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                                <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                                <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              </tr>
                            )}

                            <tr className="bg-slate-50">
                              <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">LEITURA</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">Kgf/cm²</td>
                              {[0, 1, 2, 3, 4, 5].map(idx => (
                                <td key={idx} className="border border-slate-400 px-0 py-0 text-center text-[7px]">
                                  {cpsValidos[idx]?.estabilidade_leitura || '-'}
                                </td>
                              ))}
                              <td className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                            </tr>

                            <tr className="bg-white">
                              <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">ESTABILIDADE CORRIG.</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">Kgf/cm²</td>
                              {[0, 1, 2, 3, 4, 5].map(idx => (
                                <td key={idx} className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">
                                  {cpsValidos[idx]?.estabilidade_corrigida || '-'}
                                </td>
                              ))}
                              <td className="border border-slate-400 px-0 py-0 text-center font-bold text-[7px]">{calcularMedia('estabilidade_corrigida')}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.estabilidade?.projeto ? parseFloat(project.estabilidade.projeto).toFixed(1) : '-'}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.estabilidade?.min ? parseFloat(project.estabilidade.min).toFixed(1) : '-'}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">-</td>
                            </tr>

                            <tr className="bg-slate-50">
                              <td className="border border-slate-400 px-0 py-0 font-semibold text-[7px]">FLUÊNCIA</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">mm</td>
                              {[0, 1, 2, 3, 4, 5].map(idx => (
                                <td key={idx} className="border border-slate-400 px-0 py-0 text-center font-semibold text-[7px]">
                                  {cpsValidos[idx]?.fluencia || '-'}
                                </td>
                              ))}
                              <td className="border border-slate-400 px-0 py-0 text-center font-bold text-[7px]">{calcularMedia('fluencia')}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.fluencia?.projeto ? parseFloat(project.fluencia.projeto).toFixed(1) : '-'}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.fluencia?.min ? parseFloat(project.fluencia.min).toFixed(1) : '-'}</td>
                              <td className="border border-slate-400 px-0 py-0 text-center text-[7px]">{project?.fluencia?.max ? parseFloat(project.fluencia.max).toFixed(1) : '-'}</td>
                            </tr>
                          </>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
                </div>
              </>
            )}

            {/* Densidade RICE - apenas se Marshall foi realizado */}
            {ensaio.realizar_marshall && ensaio.densidade_rice && (
              <div className="mt-0 print:mt-0">
                <div className="bg-slate-200 px-0.5 py-0 text-[8px] font-bold text-center border-b border-slate-400 print:text-[7px] print:py-0">
                  ENSAIO DE DENSIDADE RICE (DMT) - DNIT 427/20 - ABNT NBR 15619/16
                </div>
                <div className="grid grid-cols-6 gap-0.5 text-[8px] p-0.5 border border-slate-400 border-t-0 print:text-[6px] print:p-0 print:gap-0">
                  <div>
                    <p className="font-bold">FR+ÁGUA (g):</p>
                    <p>{ensaio.densidade_rice.frasco_agua || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold">AMOSTRA (g):</p>
                    <p>{ensaio.densidade_rice.amostra || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold">FR+ÁGUA+AMOSTRA (g):</p>
                    <p>{ensaio.densidade_rice.frasco_agua_amostra || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold">TEMP. - ÁGUA (°C):</p>
                    <p>{ensaio.densidade_rice.temperatura_agua || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold">DENS. - ÁGUA (g/cm³):</p>
                    <p>{ensaio.densidade_rice.densidade_agua || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold">DENS. RICE (g/cm³):</p>
                    <p className="font-semibold">{ensaio.densidade_rice.densidade_rice || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {ensaio.observacoes && (
              <div className={`mt-0 print:mt-0 ${ensaio.realizar_marshall ? 'mb-0' : 'mb-2'}`}>
                <div className={`bg-slate-200 font-bold ${ensaio.realizar_marshall ? 'px-1 py-0 text-[8px] print:text-[7px] print:py-0' : 'px-2 py-1 text-[10px] print:text-[8px] print:py-1'}`}>OBSERVAÇÕES</div>
                <div className={`border border-slate-300 ${ensaio.realizar_marshall ? 'p-0.5 text-[8px] min-h-[12px] print:text-[6px] print:p-0 print:px-0.5 print:min-h-[8px]' : 'p-2 text-[10px] min-h-[20px] print:text-[8px] print:p-1 print:min-h-[16px]'}`}>
                  {ensaio.observacoes}
                </div>
              </div>
            )}
          </main>

          {/* Footer com assinaturas */}
          <footer className="mt-0 px-1.5 print:break-inside-avoid print:mt-0 print:px-0.5">
            <div className="grid grid-cols-3 gap-1.5 items-end print:gap-1">
              <div className="text-center">
                <div className="text-[7px] print:text-[6px] text-slate-500 mb-0 min-h-[28px] flex flex-col justify-end items-center print:min-h-[20px] print:mb-0">
                  {ensaio.laboratorista_name && (
                    <>
                      <p className="font-bold text-slate-600">{ensaio.laboratorista_name}</p>
                      <p className="text-[7px]">{ensaio.created_by}</p>
                      <p className="text-[7px]">em {formatDateBrasilia(ensaio.created_date)}</p>
                    </>
                  )}
                </div>
                <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
                  <p className="text-[7px] print:text-[6px] font-semibold">LABORATORISTA RESPONSÁVEL</p>
                </div>
              </div>

              <div className="text-center">
                {ensaio.approver_details ? (
                  <>
                    <div className="text-[7px] print:text-[6px] text-slate-500 mb-0 min-h-[28px] flex flex-col justify-end items-center print:min-h-[20px] print:mb-0">
                      <p className="font-bold text-slate-600">{ensaio.approver_details.name}</p>
                      <p className="text-[7px]">{ensaio.approved_by}</p>
                      {ensaio.approver_details.crea_number && <p className="text-[7px]">CREA: {ensaio.approver_details.crea_number}</p>}
                      <p className="text-[7px]">em {formatDateBrasilia(ensaio.approved_date)}</p>
                    </div>
                    <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
                      <p className="text-[7px] print:text-[6px] font-semibold">ENGENHEIRO RESPONSÁVEL</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-h-[28px] mb-0 print:min-h-[20px] print:mb-0"></div>
                    <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
                      <p className="text-[7px] print:text-[6px] font-semibold">ENGENHEIRO RESPONSÁVEL</p>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center">
                {ensaio.client_signature?.signed_by ? (
                  <>
                    <div className="text-[7px] print:text-[6px] text-slate-500 mb-0 min-h-[28px] flex flex-col justify-end items-center print:min-h-[20px] print:mb-0">
                      <p className="font-bold text-slate-600">{ensaio.client_signature.engineer_name}</p>
                      <p className="text-[7px]">{ensaio.client_signature.signed_by}</p>
                      {ensaio.client_signature.crea_number && <p className="text-[7px]">CREA: {ensaio.client_signature.crea_number}</p>}
                      <p className="text-[7px]">em {formatDateBrasilia(ensaio.client_signature.signed_date)}</p>
                    </div>
                    <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
                      <p className="text-[7px] print:text-[6px] font-semibold">ENGENHEIRO CLIENTE</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-h-[28px] mb-0 print:min-h-[20px] print:mb-0"></div>
                    <div className="border-t-2 border-gray-500 pt-0 w-3/4 mx-auto print:pt-0 print:border-t-1">
                      <p className="text-[7px] print:text-[6px] font-semibold">ENGENHEIRO CLIENTE</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 6mm 4mm 6mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
          }
          header {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: grid !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            margin-top: 0 !important;
          }
          /* Ocultar sidebar e elementos de navegação */
          aside, nav, [data-sidebar], [role="navigation"] {
            display: none !important;
          }
          /* Ocultar scrollbars */
          ::-webkit-scrollbar {
            display: none !important;
          }
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
        }
      `}</style>
    </div>
  );
}