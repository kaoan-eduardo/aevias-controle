import React, { useState } from 'react';

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

import SignatureFooter from './SignatureFooter';

export default function RelatorioMRAF({ ensaio, obra, project, user, regional, faixaGranulometrica }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

  const calcularGranulometria = () => {
    if (!ensaio?.granulometria?.peso_retido_peneiras) return [];
    
    const pesosRetidos = ensaio.granulometria.peso_retido_peneiras;
    const pesoInicial = ensaio.extracao_ligante?.amostra_sem_ligante || 0;
    
    let peneirasRelevantes = PENEIRAS_CONFIG;
    
    if (faixaGranulometrica?.peneiras && faixaGranulometrica.peneiras.length > 0) {
      peneirasRelevantes = PENEIRAS_CONFIG.filter(peneira => {
        return faixaGranulometrica.peneiras.some(p => {
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
      
      let limiteMin = '', limiteMax = '';
      if (faixaGranulometrica?.peneiras) {
        const peneiraFaixa = faixaGranulometrica.peneiras.find(p => {
          const aberturaFaixa = p.abertura.toString().replace(/mm/gi, '').replace(',', '.').trim();
          const aberturaConfig = peneira.abertura.replace(',', '.').trim();
          return parseFloat(aberturaFaixa) === parseFloat(aberturaConfig);
        });
        
        if (peneiraFaixa) {
          limiteMin = peneiraFaixa.min || '';
          limiteMax = peneiraFaixa.max || '';
        }
      }
      
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

  return (
    <div>
      <div className="w-full max-w-[270mm] mx-auto bg-white shadow-xl print:shadow-none pt-6 px-8 pb-6 print:pt-4 print:px-4 print:pb-4">
        {/* Header */}
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-3 mb-4 print:pb-2 print:mb-3">
          <div className="flex justify-start">
            <picture><source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} /><img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo Regional" className="h-16 print:h-12 object-contain" width="auto" height="64" /></picture>
          </div>
          <div className="text-center">
            <h1 className="text-sm font-bold text-gray-800 leading-tight print:text-xs print:leading-tight">
              ENSAIO DE EXTRAÇÃO E GRANULOMETRIA
            </h1>
          </div>
          <div className="flex justify-end items-start">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-700 print:text-[10px]">DATA:</p>
              <p className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(ensaio?.data_ensaio)}</p>
            </div>
          </div>
        </header>

        <main className="text-sm print:text-sm">
          {/* DADOS DA OBRA */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-3 py-2 font-bold text-center mb-2 text-[10px] leading-tight print:px-2 print:py-1 print:mb-1.5">
            DADOS DA OBRA
          </div>

          <div className="grid grid-cols-4 gap-x-3 gap-y-2 mb-3 text-[10px] leading-tight print:gap-x-2 print:gap-y-1.5 print:mb-2">
            {/* Linha 1 */}
            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">CLIENTE:</p>
              <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">TRECHO:</p>
              <p className="text-gray-900">{ensaio?.trecho || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">Nº PROJETO:</p>
              <p className="text-gray-900">{project?.name || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">PLACA CAMINHÃO:</p>
              <p className="text-gray-900">{ensaio?.placa_caminhao || 'N/A'}</p>
            </div>

            {/* Linha 2 */}
            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">OBRA:</p>
              <p className="text-gray-900">{obra?.name || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">LOCAL DE COLETA:</p>
              <p className="text-gray-900">{ensaio?.local_coleta || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">FAIXA ESPECIFICADA:</p>
              <p className="text-gray-900">{faixaGranulometrica?.nome || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">ENSAIO REALIZADO POR:</p>
              <p className="text-gray-900">{ensaio?.ensaio_realizado_por || 'N/A'}</p>
            </div>

            {/* Linha 3 */}
            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">RODOVIA:</p>
              <p className="text-gray-900">{ensaio?.rodovia || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">PEDREIRA:</p>
              <p className="text-gray-900">{ensaio?.pedreira || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">LABORATORISTA:</p>
              <p className="text-gray-900">{ensaio?.laboratorista_name || 'N/A'}</p>
            </div>

            <div className="col-span-1">
              <p className="font-bold text-gray-700 mb-1">HORÁRIO:</p>
              <p className="text-gray-900">{ensaio?.horario || 'N/A'}</p>
            </div>
          </div>

          {/* DADOS DO ENSAIO */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-3 py-2 font-bold text-center mb-2 mt-2 text-[10px] leading-tight print:px-2 print:py-1 print:mb-1.5 print:mt-1.5">
            DADOS DO ENSAIO
          </div>

          <div className="grid grid-cols-12 gap-2 mb-3 print:gap-1 print:mb-2">
            {/* Coluna Granulometria */}
            <div className="col-span-7 border border-slate-400">
              <div className="bg-slate-200 font-bold text-center border-b border-slate-400 px-2 py-1 text-[10px] print:px-1 print:py-0.5">
                ENSAIO DE GRANULOMETRIA - DNIT 412/2025
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[8px] leading-tight">
                  <thead>
                    <tr className="bg-slate-100">
                      <th rowSpan="2" className="border-r border-slate-300 font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">PENEIRAS<br/>ASTM (mm)</th>
                      <th colSpan="3" className="border-r border-slate-300 font-bold text-center leading-tight px-2 py-1 print:px-1 print:py-0.5">PESO DA AMOSTRA (g)</th>
                      <th colSpan="2" className="border-r border-slate-300 font-bold text-center leading-tight px-2 py-1 print:px-1 print:py-0.5">FAIXA DE TRABALHO</th>
                      <th colSpan="2" className="font-bold text-center leading-tight px-2 py-1 print:px-1 print:py-0.5">FAIXA ESPECIFICADA<br/>{faixaGranulometrica?.especificacao || ''}</th>
                    </tr>
                    <tr className="bg-slate-100">
                      <th className="border-r border-slate-300 font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">RETIDO (g)</th>
                      <th className="border-r border-slate-300 font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">PASS. (g)</th>
                      <th className="border-r border-slate-300 font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">% PASS.</th>
                      <th className="border-r border-slate-300 font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">MÍN. (%)</th>
                      <th className="border-r border-slate-300 font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">MÁX. (%)</th>
                      <th className="border-r border-slate-300 font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">MÍN. (%)</th>
                      <th className="font-bold leading-tight px-2 py-1 print:px-1 print:py-0.5">MÁX. (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosGranulometria.map((dado, idx) => {
                      const numPeneiras = dadosGranulometria.length;
                      const heightClass = numPeneiras <= 5 ? 'h-10' : 
                                          numPeneiras <= 7 ? 'h-8' : 
                                          numPeneiras <= 10 ? 'h-7' : 
                                          numPeneiras <= 13 ? 'h-6' : 'h-5';

                      return (
                        <tr key={dado.astm} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className={`border-r border-slate-300 px-2 py-1 text-center font-semibold ${heightClass} print:px-1 print:py-0.5`}>{dado.astm}</td>
                          <td className={`border-r border-slate-300 px-2 py-1 text-center ${heightClass} print:px-1 print:py-0.5`}>{dado.retido}</td>
                          <td className={`border-r border-slate-300 px-2 py-1 text-center ${heightClass} print:px-1 print:py-0.5`}>{dado.passante}</td>
                          <td className={`border-r border-slate-300 px-2 py-1 text-center font-semibold ${heightClass} print:px-1 print:py-0.5`}>{dado.percentualPassante}</td>
                          <td className={`border-r border-slate-300 px-2 py-1 text-center ${heightClass} print:px-1 print:py-0.5`}>{dado.faixaTrabalhoMin ? parseFloat(dado.faixaTrabalhoMin).toFixed(1) : ''}</td>
                          <td className={`border-r border-slate-300 px-2 py-1 text-center ${heightClass} print:px-1 print:py-0.5`}>{dado.faixaTrabalhoMax ? parseFloat(dado.faixaTrabalhoMax).toFixed(1) : ''}</td>
                          <td className={`border-r border-slate-300 px-2 py-1 text-center ${heightClass} print:px-1 print:py-0.5`}>{dado.limiteMin ? parseFloat(dado.limiteMin).toFixed(1) : ''}</td>
                          <td className={`px-2 py-1 text-center ${heightClass} print:px-1 print:py-0.5`}>{dado.limiteMax ? parseFloat(dado.limiteMax).toFixed(1) : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coluna Extração de Ligante */}
            <div className="col-span-5">
              <div className="border border-slate-400 border-l-0">
                <div className="bg-slate-200 font-bold text-center border-b border-slate-400 leading-tight px-2 py-1 text-[9px] print:px-1 print:py-0.5">
                  EXTRAÇÃO LIGANTE (ROTAREX)<br/>ABNT NBR 16208/2013
                </div>
                <table className="w-full border-collapse table-fixed text-[8px]">
                  <colgroup>
                    <col className="w-[35%]" />
                    <col className="w-[65%]" />
                  </colgroup>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">EMULSÃO:</td>
                      <td className="px-2 py-1.5 print:px-1 print:py-1">{project?.emulsao_utilizada || '-'}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">TIPO LIG.:</td>
                      <td className="px-2 py-1.5 print:px-1 print:py-1">{ensaio?.tipo_ligante || '-'}</td>
                    </tr>

                    {ensaio?.extracao_ligante && (
                      <>
                        <tr className="bg-white">
                          <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">AM. C/ LIG.:</td>
                          <td className="px-2 py-1.5 print:px-1 print:py-1">{ensaio.extracao_ligante.amostra_com_ligante || '-'} g</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">AM. S/ LIG.:</td>
                          <td className="px-2 py-1.5 print:px-1 print:py-1">{ensaio.extracao_ligante.amostra_sem_ligante || '-'} g</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">FAT. CORR.:</td>
                          <td className="px-2 py-1.5 print:px-1 print:py-1">{ensaio.extracao_ligante.fator_correcao || '1.0000'}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">PESO LIG.:</td>
                          <td className="px-2 py-1.5 print:px-1 print:py-1">{ensaio.extracao_ligante.peso_ligante || '-'} g</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">TEOR LIG.:</td>
                          <td className="font-semibold px-2 py-1.5 print:px-1 print:py-1">{ensaio.extracao_ligante.teor_ligante || '-'}%</td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">% DE EMULSÃO:</td>
                          <td className="font-semibold text-blue-700 px-2 py-1.5 print:px-1 print:py-1">
                            {ensaio.extracao_ligante.teor_ligante && ensaio.extracao_ligante.residuo_emulsao 
                              ? ((ensaio.extracao_ligante.teor_ligante / ensaio.extracao_ligante.residuo_emulsao) * 100).toFixed(2)
                              : '-'}%
                          </td>
                        </tr>

                        {ensaio.extracao_ligante.amostra_umida && (
                          <tr className="bg-blue-50">
                            <td className="border-r border-slate-300 font-bold px-2 py-1.5 print:px-1 print:py-1">UMIDADE:</td>
                            <td className="font-semibold text-blue-700 px-2 py-1.5 print:px-1 print:py-1">{ensaio.extracao_ligante.umidade || 0}%</td>
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
          <div className="border border-slate-300 p-3 print:p-2 mb-3 print:mb-2">
            <h3 className="font-bold text-center mb-2 py-1 print:py-0.5 text-[10px] print:text-[9px]">GRANULOMETRIA DA MISTURA</h3>
            <div className="relative h-72 print:h-64">
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
              <svg width="100%" height="100%" viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet" aria-label="Gráfico de Granulometria da Mistura MRAF" role="img">
                {/* Eixos */}
                <line x1="30" y1="5" x2="30" y2="240" stroke="#333" strokeWidth="1" />
                <line x1="30" y1="240" x2="620" y2="240" stroke="#333" strokeWidth="1" />

                {/* Grid horizontal */}
                {[0, 20, 40, 60, 80, 100].map((value) => {
                  const y = 240 - ((value - 0) / 100 * 235);
                  return (
                    <g key={value}>
                      <line x1="30" y1={y} x2="620" y2={y} stroke="#e0e0e0" strokeWidth="0.5" />
                      <text x="25" y={y + 3} fontSize="9" textAnchor="end" fill="#333">{value}%</text>
                    </g>
                  );
                })}

                {/* Gráfico */}
                {(() => {
                  if (dadosGranulometria.length === 0) return null;

                  const aberturas = dadosGranulometria.map(d => parseFloat(d.abertura.replace(',', '.')));
                  const minAbertura = Math.min(...aberturas);
                  const maxAbertura = Math.max(...aberturas);
                  
                  const getX = (aberturaMm) => {
                    const logMin = Math.log10(minAbertura);
                    const logMax = Math.log10(maxAbertura);
                    const logValue = Math.log10(aberturaMm);
                    return 30 + (590 * (logMax - logValue) / (logMax - logMin));
                  };

                  const getY = (percentual) => {
                    return 240 - ((parseFloat(percentual) - 0) / 100 * 235);
                  };

                  return (
                    <>
                      {/* Labels do eixo X */}
                      {dadosGranulometria.map((d, i) => {
                        const aberturaMm = parseFloat(d.abertura.replace(',', '.'));
                        const x = getX(aberturaMm);
                        return (
                          <text key={i} x={x} y="255" fontSize="9" textAnchor="middle" fill="#333">
                            {d.astm}
                          </text>
                        );
                      })}

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

                      {/* Linhas faixa de trabalho */}
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

                      {/* Linha % Pass. */}
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

                      {/* Pontos com hover — interatividade no <g> para não violar "Static Elements should not be interactive" */}
                      {dadosGranulometria.map((d, i) => {
                        const x = getX(parseFloat(d.abertura.replace(',', '.')));
                        const y = getY(d.percentualPassante);
                        const pointData = {
                            astm: d.astm,
                            percentualPassante: d.percentualPassante,
                            faixaEspecMin: d.limiteMin,
                            faixaEspecMax: d.limiteMax,
                            faixaTrabalhoMin: d.faixaTrabalhoMin,
                            faixaTrabalhoMax: d.faixaTrabalhoMax
                          };
                        return (
                          <g
                            key={i}
                            role="button"
                            tabIndex={0}
                            aria-label={`${d.astm}: ${d.percentualPassante}% passante`}
                            style={{ cursor: 'pointer' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setHoveredPoint(pointData);
                                setTooltipPos({ x: x + 30, y });
                              }
                            }}
                            onMouseEnter={(e) => {
                              const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
                              setHoveredPoint(pointData);
                              setTooltipPos({ x: e.clientX - svgRect.left, y: e.clientY - svgRect.top });
                            }}
                            onMouseLeave={() => setHoveredPoint(null)}
                            onFocus={() => {
                              setHoveredPoint(pointData);
                              setTooltipPos({ x: x + 30, y });
                            }}
                            onBlur={() => setHoveredPoint(null)}
                          >
                            <circle cx={x} cy={y} r="2" fill="#3b82f6" />
                            <rect x={x - 8} y={y - 8} width="16" height="16" fill="transparent" />
                          </g>
                        );
                      })}
                    </>
                  );
                })()}

                {/* Legenda */}
                <g transform="translate(230, 270)">
                  <line x1="0" y1="3" x2="15" y2="3" stroke="#3b82f6" strokeWidth="2" />
                  <text x="18" y="6" fontSize="8" fill="#333">% Pass.</text>

                  <line x1="60" y1="3" x2="75" y2="3" stroke="#dc2626" strokeWidth="1" />
                  <text x="78" y="6" fontSize="8" fill="#333">Faixa especificada</text>

                  <line x1="170" y1="3" x2="185" y2="3" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="188" y="6" fontSize="8" fill="#333">Faixa de Trabalho</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Observações */}
          {ensaio?.observacoes && (
            <div className="mt-3 print:mt-2 mb-4 print:mb-3">
              <div className="bg-slate-200 font-bold px-3 py-2 text-[10px] print:text-[9px] print:px-2 print:py-1">OBSERVAÇÕES</div>
              <div className="border border-slate-300 p-3 text-[10px] min-h-[40px] print:text-[9px] print:p-2 print:min-h-[30px]">
                {ensaio.observacoes}
              </div>
            </div>
          )}
        </main>

        {/* Footer com assinaturas */}
        <footer className="px-3 print:break-inside-avoid print:px-2 mt-4 print:mt-3">
          <SignatureFooter
            labName={ensaio?.laboratorista_name}
            labEmail={ensaio?.created_by}
            labCreatedDate={ensaio?.created_date}
            labPosition="Laboratorista"
            approverName={ensaio?.approver_details?.name}
            approverEmail={ensaio?.approved_by}
            approverPosition={ensaio?.approver_details?.position}
            approverCREA={ensaio?.approver_details?.crea_number}
            approverDate={ensaio?.approved_date}
            clientName={ensaio?.client_signature?.engineer_name}
            clientEmail={ensaio?.client_signature?.signed_by}
            clientPosition={ensaio?.client_signature?.position}
            clientCREA={ensaio?.client_signature?.crea_number}
            clientDate={ensaio?.client_signature?.signed_date}
            sizePrint={true}
          />
        </footer>
      </div>

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 8mm 10mm 8mm;
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
          aside, nav, [data-sidebar], [role="navigation"] {
            display: none !important;
          }
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