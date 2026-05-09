import React, { useState, useEffect } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import AprovacaoBar from '../components/relatorios/AprovacaoBar';
import SignatureFooter from '../components/relatorios/SignatureFooter';

export default function RelatorioSondagem() {
  useReportMode();
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      const ensaioData = await base44.entities.EnsaioSondagem.get(ensaioId);
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

        // Buscar nome da faixa granulométrica se existir
        if (projectData.faixa_granulometrica_id) {
          const faixaData = await base44.entities.FaixaGranulometrica.get(projectData.faixa_granulometrica_id);
          setProject({...projectData, faixa_especificada: faixaData.nome});
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

  // Calcular médias para os gráficos
  const cpsValidos = ensaio.corpos_prova || [];
  const gcDensProjeto = cpsValidos.filter(cp => cp.gc_dens_projeto).map(cp => parseFloat(cp.gc_dens_projeto));
  const gcDensRice = cpsValidos.filter(cp => cp.gc_dens_rice_dia).map(cp => parseFloat(cp.gc_dens_rice_dia));
  const espessuras = cpsValidos.filter(cp => cp.media_espessura).map(cp => parseFloat(cp.media_espessura));

  // Calcular escala dinâmica do gráfico
  let limiteMin = 0, limiteMax = 0;
  if (ensaio.servico === 'Capa/Reperfilagem') {
    limiteMin = 97;
    limiteMax = 101;
  } else if (ensaio.servico === 'Remendos') {
    limiteMin = 95;
    limiteMax = 101;
  }

  // Incluir todos os valores (Projeto e RICE) no cálculo da escala
  const todosValoresGC = [...gcDensProjeto, ...gcDensRice, limiteMin || 100, limiteMax || 100];
  const minGC = Math.min(...todosValoresGC);
  const maxGC = Math.max(...todosValoresGC);
  const rangeGC = maxGC - minGC;
  // Ajustar escala para mostrar claramente o menor resultado
  const minGCChart = Math.max(0, minGC - rangeGC * 0.3);
  const maxGCChart = maxGC + rangeGC * 0.3;

  const minEsp = Math.min(...espessuras, parseFloat(ensaio.espessura_projeto || 0));
  const maxEsp = Math.max(...espessuras, parseFloat(ensaio.espessura_projeto || 0));

  // Definir limites baseados no serviço
  let limiteMinGC = 0, limiteMaxGC = 0;
  if (ensaio.servico === 'Capa/Reperfilagem') {
    limiteMinGC = 97;
    limiteMaxGC = 101;
  } else if (ensaio.servico === 'Remendos') {
    limiteMinGC = 95;
    limiteMaxGC = 101;
  }

  // Função para verificar se está fora dos limites (G.C. Dens. Projeto)
  const isForaLimites = (valor) => {
    if (!limiteMinGC || !valor) return false;
    const val = parseFloat(valor);
    return val < limiteMinGC || val > limiteMaxGC;
  };

  // Função para verificar se está fora dos limites (G.C. Dens. RICE - apenas mínimo de 92%)
  const isForaLimitesRice = (valor) => {
    if (!valor) return false;
    const val = parseFloat(valor);
    return val < 92;
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[297mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Ensaio de Sondagem
          </h2>
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="EnsaioSondagem" recordId={ensaio.id} />}
            <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="print:pt-0 print:pb-0">
        <div className="w-full max-w-[297mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-4 pb-2 print:pt-0 print:px-1 print:pb-2">
          {/* Header */}
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0.5 mb-1">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-12 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-800 leading-tight">
                DETERMINAÇÃO DO GRAU DE COMPACTAÇÃO<br/>DE CORPOS DE PROVA EXTRAÍDOS DE PISTA
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">MÉTODO DE ENSAIO: {ensaio.metodo_ensaio || 'DNIT 428/2022'}</p>
            </div>
            <div className="flex justify-end">
            </div>
          </header>

          <main className="text-xs print:text-xs">
            {/* DADOS DA OBRA */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-2 py-0.5 font-bold text-center mb-0">
              DADOS DA OBRA
            </div>

            <div className="grid grid-cols-5 gap-x-2 gap-y-0 mb-0 text-[10px]">
              <div className="col-span-1">
                <p className="font-bold text-gray-700">CLIENTE:</p>
                <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">PROJETO:</p>
                <p className="text-gray-900">{project?.name || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">VOLUME VAZIOS PROJETO:</p>
                <p className="text-gray-900">{ensaio.volume_vazios_projeto ? `${ensaio.volume_vazios_projeto}%` : 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">FATOR CORREÇÃO PRENSA:</p>
                <p className="text-gray-900">{ensaio.fator_correcao_prensa || '1.0000'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">DENS. ÁGUA 25°C:</p>
                <p className="text-gray-900">{ensaio.dens_agua_25c || '0.9971'} g/cm³</p>
              </div>

              <div className="col-span-1">
                <p className="font-bold text-gray-700">OBRA:</p>
                <p className="text-gray-900">{obra?.name || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">FAIXA ESPECIFICADA:</p>
                <p className="text-gray-900">{project?.faixa_especificada || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">DENS. APARENTE PROJETO:</p>
                <p className="text-gray-900">{ensaio.dens_aparente_projeto ? `${parseFloat(ensaio.dens_aparente_projeto).toFixed(3)} g/cm³` : 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">DENS. RICE PROJETO:</p>
                <p className="text-gray-900">{ensaio.dens_rice_projeto ? `${parseFloat(ensaio.dens_rice_projeto).toFixed(3)} g/cm³` : 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">DATA:</p>
                <p className="text-gray-900">{formatDate(ensaio.data)}</p>
              </div>

              <div className="col-span-1">
                <p className="font-bold text-gray-700">RODOVIA:</p>
                <p className="text-gray-900">{ensaio.rodovia}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">USINA FORNECEDORA:</p>
                <p className="text-gray-900">{ensaio.usina_fornecedora || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">TRECHO:</p>
                <p className="text-gray-900">{ensaio.trecho}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">SERVIÇO:</p>
                <p className="text-gray-900">{ensaio.servico || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">ESPESSURA PROJETO:</p>
                <p className="text-gray-900">{ensaio.espessura_projeto ? `${ensaio.espessura_projeto} cm` : 'N/A'}</p>
              </div>

              <div className="col-span-1">
                <p className="font-bold text-gray-700">ENSAIO REALIZADO POR:</p>
                <p className="text-gray-900">{ensaio.ensaio_realizado_por || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="font-bold text-gray-700">LABORATORISTA:</p>
                <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
              </div>
            </div>

            {/* DADOS DO ENSAIO */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-2 py-0.5 font-bold text-center mb-0 mt-0">
              DADOS DO ENSAIO
            </div>

            <div className="overflow-x-auto mb-0">
              <table className="w-full border-collapse border border-slate-400 text-[8px]">
                <thead>
                  <tr className="bg-slate-200">
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">Nº</th>
                    <th colSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">LOCALIZAÇÃO</th>
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">DATA<br/>EXEC.</th>
                    <th colSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">ESPESSURA</th>
                    <th colSpan="3" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">DETERM. DENS. APARENTE C.P.</th>
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">VOL.<br/>(cm³)</th>
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">DENS.<br/>(g/cm³)</th>
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">G.C<br/>PROJ.<br/>(%)</th>
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">RICE<br/>DIA<br/>(g/cm³)</th>
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">G.C<br/>RICE<br/>(%)</th>
                    <th rowSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">VOL.<br/>VAZ.<br/>(%)</th>
                    <th colSpan="2" className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">ROMPIMENTO</th>
                  </tr>
                  <tr className="bg-slate-200">
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">EST.</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">L.</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">MED.</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">MÉD.<br/>(cm)</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">P.AR<br/>(g)</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">P.IM.<br/>(g)</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">P.SAT.<br/>(g)</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">LEIT.<br/>(Kgf)</th>
                    <th className="border border-slate-400 px-0.5 py-0.5 font-bold text-[7px]">RTCD<br/>(MPa)</th>
                  </tr>
                </thead>
                <tbody>
                  {cpsValidos.filter(cp => cp.peso_ao_ar || cp.densidade || cp.leitura).slice(0, 10).map((cp, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center font-semibold">{cp.numero}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.estaca || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.lado === 'direito' ? 'D' : 'E'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{formatDate(cp.data_execucao)}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center text-[7px]">
                        {cp.medidas_espessura && cp.medidas_espessura.filter(m => m).length > 0 
                          ? cp.medidas_espessura.filter(m => m).join('/') 
                          : '-'}
                      </td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center font-semibold">{cp.media_espessura || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.peso_ao_ar || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.peso_imerso || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.peso_saturado || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center font-semibold">{cp.volume || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center font-semibold">{cp.densidade ? parseFloat(cp.densidade).toFixed(3) : '-'}</td>
                      <td className={`border border-slate-400 px-0.5 py-0.5 text-center font-bold ${isForaLimites(cp.gc_dens_projeto) ? 'text-red-600' : 'text-blue-700'}`}>
                        {cp.gc_dens_projeto ? parseFloat(cp.gc_dens_projeto).toFixed(1) : '-'}
                      </td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.dens_rice_do_dia ? parseFloat(cp.dens_rice_do_dia).toFixed(3) : '-'}</td>
                      <td className={`border border-slate-400 px-0.5 py-0.5 text-center font-bold ${isForaLimitesRice(cp.gc_dens_rice_dia) ? 'text-red-600' : 'text-blue-700'}`}>
                        {cp.gc_dens_rice_dia ? parseFloat(cp.gc_dens_rice_dia).toFixed(1) : '-'}
                      </td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.volume_vazios ? parseFloat(cp.volume_vazios).toFixed(1) : '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center">{cp.leitura || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0.5 text-center font-semibold">{cp.rtcd_25c || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gráfico */}
            {gcDensProjeto.length > 0 && (
              <div className="mb-1 mt-1">
                <div className="border border-slate-300 p-0.5">
                  <h3 className="text-[10px] font-bold text-center mb-0.5">G.C. (%)</h3>
                  <div className="relative h-20">
                    <svg width="100%" height="100%" viewBox="0 0 600 100" aria-label="Gráfico de Grau de Compactação" role="img">
                      {/* Eixos */}
                      <line x1="30" y1="5" x2="30" y2="75" stroke="#333" strokeWidth="1" />
                      <line x1="30" y1="75" x2="580" y2="75" stroke="#333" strokeWidth="1" />

                      {/* Valores do eixo Y */}
                      {[0, 25, 50, 75, 100].map((percent) => {
                        const value = minGCChart + (maxGCChart - minGCChart) * (percent / 100);
                        const y = 75 - (percent * 0.7);
                        return (
                          <g key={percent}>
                            <line x1="27" y1={y} x2="30" y2={y} stroke="#666" strokeWidth="0.5" />
                            <text x="24" y={y + 2} fontSize="6" textAnchor="end" fill="#333">{value.toFixed(0)}%</text>
                          </g>
                        );
                      })}

                      {/* Limites baseados no serviço */}
                      {(() => {
                        let limiteMin = 0, limiteMax = 0;
                        if (ensaio.servico === 'Capa/Reperfilagem') {
                          limiteMin = 97;
                          limiteMax = 101;
                        } else if (ensaio.servico === 'Remendos') {
                          limiteMin = 95;
                          limiteMax = 101;
                        }

                        if (limiteMin > 0) {
                          const yMin = 75 - (((limiteMin - minGCChart) / (maxGCChart - minGCChart)) * 70);
                          const yMax = 75 - (((limiteMax - minGCChart) / (maxGCChart - minGCChart)) * 70);
                          return (
                            <>
                              <line x1="30" y1={yMin} x2="580" y2={yMin} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4,2" />
                              <line x1="30" y1={yMax} x2="580" y2={yMax} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4,2" />
                            </>
                          );
                        }
                        return null;
                        })()}

                        {/* Barras G.C. Dens. Projeto */}
                        {gcDensProjeto.map((gc, idx) => {
                        const x = 50 + (idx * 50);
                        const barHeight = ((gc - minGCChart) / (maxGCChart - minGCChart)) * 70;
                        const y = 75 - barHeight;
                        return (
                          <g key={idx}>
                            <rect x={x} y={y} width="18" height={barHeight} fill="#3498db" opacity="0.7" />
                            <text x={x + 20} y="83" fontSize="8" textAnchor="middle" fill="#333">{idx + 1}</text>
                          </g>
                        );
                        })}

                        {/* Barras G.C. Dens. RICE */}
                        {gcDensRice.map((gc, idx) => {
                        const x = 50 + (idx * 50) + 20;
                        const barHeight = ((gc - minGCChart) / (maxGCChart - minGCChart)) * 70;
                        const y = 75 - barHeight;
                        return (
                          <rect key={idx} x={x} y={y} width="18" height={barHeight} fill="#e74c3c" opacity="0.7" />
                        );
                        })}

                        {/* Legenda */}
                        <g transform="translate(170, 88)">
                        <rect x="0" y="0" width="10" height="3" fill="#3498db" opacity="0.7" />
                        <text x="13" y="3" fontSize="7" fill="#333">G.C. Dens. Projeto</text>

                        <rect x="100" y="0" width="10" height="3" fill="#e74c3c" opacity="0.7" />
                        <text x="113" y="3" fontSize="7" fill="#333">G.C. Dens. RICE</text>

                        <line x1="200" y1="1.5" x2="210" y2="1.5" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4,2" />
                        <text x="213" y="3" fontSize="7" fill="#333">Limites</text>
                        </g>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {ensaio.observacoes && (
              <div className="mb-2">
                <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px]">OBSERVAÇÕES</div>
                <div className="border border-slate-300 p-0.5 text-[10px] min-h-[20px]">
                  {ensaio.observacoes}
                </div>
              </div>
            )}
            </main>

            {/* Footer com assinaturas */}
            <footer className="mt-3 px-4 print:break-inside-avoid">
              <SignatureFooter
                labName={ensaio.laboratorista_name}
                labEmail={ensaio.created_by}
                labCreatedDate={ensaio.created_date}
                labPosition="Laboratorista"
                approverName={ensaio.approver_details?.name}
                approverEmail={ensaio.approved_by}
                approverPosition={ensaio.approver_details?.position}
                approverCREA={ensaio.approver_details?.crea_number}
                approverDate={ensaio.approved_date}
                clientName={ensaio.client_signature?.engineer_name}
                clientEmail={ensaio.client_signature?.signed_by}
                clientPosition={ensaio.client_signature?.position}
                clientCREA={ensaio.client_signature?.crea_number}
                clientDate={ensaio.client_signature?.signed_date}
                sizePrint={true}
              />
            </footer>
        </div>
      </div>

      {/* Páginas adicionais para mais de 10 CPs */}
      {cpsValidos.filter(cp => cp.peso_ao_ar || cp.densidade || cp.leitura).length > 10 && (
        <div className="break-before-page print:pt-2 print:pb-3">
          <div className="w-full max-w-[297mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-3 pb-3">
            <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-2">
              <div className="flex justify-start">
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo Regional" 
                  className="h-12 object-contain" 
                />
              </div>
              <div className="text-center">
                <h1 className="text-base font-bold text-gray-800">Ensaio de Sondagem - Continuação</h1>
              </div>
              <div className="flex justify-end">
                <div className="border border-gray-400 p-1 rounded-md text-sm print:text-xs bg-white">
                  <p className="font-semibold text-gray-800">{formatDate(ensaio.data)}</p>
                </div>
              </div>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-[10px]">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="border border-slate-400 px-1 py-1 font-bold">Nº</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">ESTACA</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">LADO</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">DATA EXEC.</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">MÉDIA ESP.<br/>(cm)</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">DENSIDADE<br/>(g/cm³)</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">G.C DENS.<br/>PROJETO (%)</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">G.C DENS.<br/>RICE (%)</th>
                    <th className="border border-slate-400 px-1 py-1 font-bold">RTCD 25°C<br/>(MPa)</th>
                  </tr>
                </thead>
                <tbody>
                  {cpsValidos.filter(cp => cp.peso_ao_ar || cp.densidade || cp.leitura).slice(10).map((cp, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-400 px-1 py-1 text-center font-semibold">{cp.numero}</td>
                      <td className="border border-slate-400 px-1 py-1 text-center">{cp.estaca || '-'}</td>
                      <td className="border border-slate-400 px-1 py-1 text-center">{cp.lado === 'direito' ? 'D' : 'E'}</td>
                      <td className="border border-slate-400 px-1 py-1 text-center">{formatDate(cp.data_execucao)}</td>
                      <td className="border border-slate-400 px-1 py-1 text-center font-semibold">{cp.media_espessura || '-'}</td>
                      <td className="border border-slate-400 px-1 py-1 text-center font-semibold">{cp.densidade ? parseFloat(cp.densidade).toFixed(3) : '-'}</td>
                      <td className={`border border-slate-400 px-1 py-1 text-center font-bold ${isForaLimites(cp.gc_dens_projeto) ? 'text-red-600' : 'text-blue-700'}`}>
                        {cp.gc_dens_projeto ? parseFloat(cp.gc_dens_projeto).toFixed(1) : '-'}
                      </td>
                      <td className={`border border-slate-400 px-1 py-1 text-center font-bold ${isForaLimitesRice(cp.gc_dens_rice_dia) ? 'text-red-600' : 'text-blue-700'}`}>
                        {cp.gc_dens_rice_dia ? parseFloat(cp.gc_dens_rice_dia).toFixed(1) : '-'}
                      </td>
                      <td className="border border-slate-400 px-1 py-1 text-center font-semibold">{cp.rtcd_25c || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm 8mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .break-before-page {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}