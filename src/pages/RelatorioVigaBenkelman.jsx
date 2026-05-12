import React, { useEffect, useState } from 'react';
import { useReportMode } from "@/hooks/useReportMode";
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import AprovacaoBar from '../components/relatorios/AprovacaoBar';
import SignatureFooter from '../components/relatorios/SignatureFooter';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RelatorioVigaBenkelman() {
  useReportMode();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnsaio = async () => {
      try {
        if (id) {
          const data = await base44.entities.EnsaioVigaBenkelman.get(id);

          if (!data.levantamentos || !Array.isArray(data.levantamentos)) {
            data.levantamentos = [];
          }

          setEnsaio(data);

          if (data.obra_id) {
            const obraData = await base44.entities.Obra.get(data.obra_id);
            setObra(obraData);

            if (obraData.regional_id) {
              const regionalData = await base44.entities.Regional.get(obraData.regional_id);
              setRegional(regionalData);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar ensaio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEnsaio();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!ensaio) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <p className="text-slate-700">Ensaio não encontrado.</p>
      </div>
    );
  }

  // Agrupar levantamentos por faixa
  // Se todos têm faixa_nome preenchido e distintos, usa o campo
  // Caso contrário (dados antigos sem faixa_nome), agrupa em blocos de 20
  const levs = ensaio.levantamentos || [];
  const todosTemFaixaNome = levs.length > 0 && levs.every(l => l.faixa_nome);
  const todasIguais = todosTemFaixaNome && levs.every(l => l.faixa_nome === levs[0].faixa_nome);

  let faixasArray;
  if (todosTemFaixaNome && !todasIguais) {
    // Agrupar pelo campo faixa_nome
    const faixasMap = {};
    const faixasOrder = [];
    levs.forEach(lev => {
      const nome = lev.faixa_nome;
      if (!faixasMap[nome]) {
        faixasMap[nome] = [];
        faixasOrder.push(nome);
      }
      faixasMap[nome].push(lev);
    });
    faixasArray = faixasOrder.map(nome => ({ nome, levantamentos: faixasMap[nome] })).slice(0, 4);
  } else {
    // Agrupar em blocos de 20 (compatibilidade com dados antigos)
    const blocoSize = 20;
    const numBlocos = Math.ceil(levs.length / blocoSize);
    faixasArray = [];
    for (let i = 0; i < numBlocos && i < 4; i++) {
      const bloco = levs.slice(i * blocoSize, (i + 1) * blocoSize);
      // Descobrir nome da faixa a partir do primeiro item com faixa_nome, ou usar índice
      const nome = bloco.find(l => l.faixa_nome)?.faixa_nome || `Faixa ${i + 1}`;
      faixasArray.push({ nome, levantamentos: bloco });
    }
  }

  // Filtrar faixas que não têm nenhum dado real (sem estaca e sem leitura final)
  faixasArray = faixasArray.filter(faixa =>
    faixa.levantamentos.some(lev => lev.estaca_km || (lev.bordo_esquerdo?.leitura_final && lev.bordo_esquerdo.leitura_final !== 0))
  );

  // Calcular controle estatístico por bordo
  const deflexoesBordoEsquerdo = (ensaio.levantamentos || [])
    .map(lev => lev.bordo_esquerdo?.deflexao || 0)
    .filter(v => v > 0);

  const deflexoesEixo = (ensaio.levantamentos || [])
    .map(lev => lev.eixo?.deflexao || 0)
    .filter(v => v > 0);

  const deflexoesBordoDireito = (ensaio.levantamentos || [])
    .map(lev => lev.bordo_direito?.deflexao || 0)
    .filter(v => v > 0);

  const calcularEstatisticas = (deflexoes) => {
    const qt = deflexoes.length;
    const media = qt > 0 ? deflexoes.reduce((a, b) => a + b) / qt : 0;
    const desvPad = qt > 0 
      ? Math.sqrt(deflexoes.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / qt)
      : 0;
    return { qt, media, desvPad };
  };

  const calcularEstatisticasPorFaixa = (levantamentos) => {
    const bordoEsquerdo = levantamentos.map(lev => lev.bordo_esquerdo?.deflexao || 0).filter(v => v > 0);
    const eixo = levantamentos.map(lev => lev.eixo?.deflexao || 0).filter(v => v > 0);
    const bordoDireito = levantamentos.map(lev => lev.bordo_direito?.deflexao || 0).filter(v => v > 0);
    return {
      bordoEsquerdo: calcularEstatisticas(bordoEsquerdo),
      eixo: calcularEstatisticas(eixo),
      bordoDireito: calcularEstatisticas(bordoDireito)
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        @media print {
          html, body {
            height: auto;
            margin: 0;
            padding: 0;
            background: white !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            .recharts-surface;
            .recharts-wrapper;
          }
          @page { 
            size: A4 portrait;
            margin: 10mm 12mm;
            orphans: 0;
            widows: 0;
          }
          svg {
          display: block !important;
          visibility: visible !important;
          page-break-inside: avoid !important;
          print-color-adjust: exact !important
          -webkit-print-color-adjust: exact !important;
          }

            /* Container do gráfico */
            div[class*="p-3"] svg {
              max-width: 100% !important;
              height: auto !important;
            }
          .max-w-\\[210mm\\] {
            width: 100%;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            page-break-inside: avoid !important;
          }
          table, thead, tbody, tr, td, th {
            border: 0.5px solid #1e293b !important;
            border-collapse: collapse !important;
          }
          tbody tr:last-child td {
            border-bottom: 0.5px solid #1e293b !important;
          }
          .print\\:hidden { display: none !important; visibility: hidden !important; }
        }
      `}</style>

      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Levantamento Deflectométrico por Viga Benkelman
          </h2>
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="EnsaioVigaBenkelman" recordId={ensaio.id} />}
            <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <div id="report-content" className="w-full max-w-[210mm] mx-auto bg-white p-1 print:p-1">
        {/* Renderizar cada faixa em uma página separada */}
        {faixasArray.map((faixa, faixaIdx) => {
          // Filtrar apenas levantamentos com dados reais para o gráfico
          const levantamentosComDados = faixa.levantamentos.filter(lev =>
            lev.estaca_km || lev.bordo_esquerdo?.deflexao || lev.eixo?.deflexao || lev.bordo_direito?.deflexao
          );
          const defAdmissivel = parseFloat(ensaio.def_admissivel) || 0;
          const chartData = levantamentosComDados.map(lev => ({
            estaca: lev.estaca_km || '',
            'Bordo Esquerdo': lev.bordo_esquerdo?.deflexao || 0,
            'Eixo': lev.eixo?.deflexao || 0,
            'Bordo Direito': lev.bordo_direito?.deflexao || 0,
            'Def. Admissível': defAdmissivel
          }));
          const stats = calcularEstatisticasPorFaixa(faixa.levantamentos);

          return (
            <div key={`faixa-${faixaIdx}`} className={faixaIdx > 0 ? "print:break-before-page" : ""}>
              {/* Cabeçalho replicado para cada faixa */}
              <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0 mb-0 mt-4 print:mt-0">
                <div className="flex justify-start">
                  <picture>
                    <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                    <img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo" className="h-9 object-contain" width="auto" height="36" />
                  </picture>
                </div>
                <div className="text-center">
                  <h1 className="text-xs font-bold text-gray-800 leading-tight">
                    LEVANTAMENTO DEFLECTOMÉTRICO POR VIGA BENKELMAN
                  </h1>
                  <p className="text-[9px] text-slate-600">MÉTODO DE ENSAIO DNER-ME-024/94</p>
                </div>
                <div className="flex justify-end">
                  <div className="text-[10px] text-gray-600 border border-slate-300 rounded px-1 py-0">
                    {formatDate(ensaio.data_realizacao) || '-'}
                  </div>
                </div>
              </header>

              {/* Dados da Obra */}
              <div className="mb-0">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-1.5 py-0 font-bold text-center mb-0 text-[10px]">
                  DADOS DA OBRA
                </div>
                <div className="grid grid-cols-4 gap-x-2 gap-y-0 mb-0 text-[9px] leading-tight p-2">
                  <div>
                    <p className="font-bold text-gray-700">CLIENTE</p>
                    <p className="text-gray-900">{regional?.cliente || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">OBRA</p>
                    <p className="text-gray-900">{obra?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">CAMADA</p>
                    <p className="text-gray-900">{ensaio.camada || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">DATA DA APLICAÇÃO</p>
                    <p className="text-gray-900">{formatDate(ensaio.data_ensaio) || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">RODOVIA</p>
                    <p className="text-gray-900">{ensaio.rodovia || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">MATERIAL</p>
                    <p className="text-gray-900">{ensaio.material || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">LABORATORISTA</p>
                    <p className="text-gray-900">{ensaio.laboratorista_name || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">CTE. VIGA</p>
                    <p className="text-gray-900">{ensaio.cte_viga ? parseFloat(ensaio.cte_viga).toFixed(4) : '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">TRECHO</p>
                    <p className="text-gray-900">{ensaio.trecho || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">PROCEDÊNCIA</p>
                    <p className="text-gray-900">{ensaio.procedencia || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">PISTA/FAIXA</p>
                    <p className="text-gray-900">{faixa.nome || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">DEF. ADMISSÍVEL</p>
                    <p className="text-gray-900">{ensaio.def_admissivel || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Dados do Ensaio */}
              <div className="mb-0">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-1.5 py-0 font-bold text-center mb-0 text-[10px]">
                  DADOS DO ENSAIO
                </div>
              </div>

              {/* Tabela de Levantamentos */}
              <div className="mb-0 overflow-x-auto print:break-inside-avoid">
          <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[8px] border" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px' }}>
            LEVANTAMENTO DEFLECTOMÉTRICO POR VIGA BENKELMAN
          </div>
          <table className="w-full border-collapse text-[7px]" style={{ borderWidth: '0.05px', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-100">
                <th rowSpan="2" className="px-1 py-0.5 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Estaca / km</th>
                <th colSpan="4" className="px-1 py-0.5 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>BORDO ESQUERDO</th>
                <th colSpan="4" className="px-1 py-0.5 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>EIXO</th>
                <th colSpan="4" className="px-1 py-0.5 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>BORDO DIREITO</th>
              </tr>
              <tr className="bg-slate-100">
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Leitura Inicial (A)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Leitura Final (B)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Diferença (C = A - B)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Deflexão (x10⁻²mm)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Leitura Inicial (A)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Leitura Final (B)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Diferença (C = A - B)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Deflexão (x10⁻²mm)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Leitura Inicial (A)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Leitura Final (B)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Diferença (C = A - B)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Deflexão (x10⁻²mm)</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }).map((_, idx) => {
                const lev = faixa.levantamentos[idx];
                const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50';
                return (
                  <tr key={`lev-${idx}`} className={bgColor} style={{ height: '22px' }}>
                    <td className="px-0.5 py-0 font-semibold text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>
                      {lev?.estaca_km || ''}
                    </td>
                    {(() => {
                      const temEstaca = !!lev?.estaca_km;
                      const temBE = temEstaca && lev?.bordo_esquerdo?.leitura_final && lev.bordo_esquerdo.leitura_final !== 0;
                      const temEixo = temEstaca && lev?.eixo?.leitura_final && lev.eixo.leitura_final !== 0;
                      const temBD = temEstaca && lev?.bordo_direito?.leitura_final && lev.bordo_direito.leitura_final !== 0;
                      
                      const def_admissivel = parseFloat(ensaio.def_admissivel) || 0;
                      const beExcede = def_admissivel > 0 && lev?.bordo_esquerdo?.deflexao > def_admissivel;
                      const eixoExcede = def_admissivel > 0 && lev?.eixo?.deflexao > def_admissivel;
                      const bdExcede = def_admissivel > 0 && lev?.bordo_direito?.deflexao > def_admissivel;
                      
                      return (
                        <>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBE && lev.bordo_esquerdo.leitura_inicial !== 0 ? lev.bordo_esquerdo.leitura_inicial.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBE ? lev.bordo_esquerdo.leitura_final.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBE && lev.bordo_esquerdo.diferenca !== 0 ? lev.bordo_esquerdo.diferenca.toFixed(0) : ''}</td>
                          <td className={`px-0.5 py-0 text-center font-semibold ${beExcede ? 'text-red-600' : ''}`} style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBE && lev.bordo_esquerdo.deflexao !== 0 ? lev.bordo_esquerdo.deflexao.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temEixo && lev.eixo.leitura_inicial !== 0 ? lev.eixo.leitura_inicial.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temEixo ? lev.eixo.leitura_final.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temEixo && lev.eixo.diferenca !== 0 ? lev.eixo.diferenca.toFixed(0) : ''}</td>
                          <td className={`px-0.5 py-0 text-center font-semibold ${eixoExcede ? 'text-red-600' : ''}`} style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temEixo && lev.eixo.deflexao !== 0 ? lev.eixo.deflexao.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBD && lev.bordo_direito.leitura_inicial !== 0 ? lev.bordo_direito.leitura_inicial.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBD ? lev.bordo_direito.leitura_final.toFixed(0) : ''}</td>
                          <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBD && lev.bordo_direito.diferenca !== 0 ? lev.bordo_direito.diferenca.toFixed(0) : ''}</td>
                          <td className={`px-0.5 py-0 text-center font-semibold ${bdExcede ? 'text-red-600' : ''}`} style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{temBD && lev.bordo_direito.deflexao !== 0 ? lev.bordo_direito.deflexao.toFixed(0) : ''}</td>
                        </>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Controle Estatístico por Bordo - Logo abaixo da tabela */}
          <table className="w-full border-collapse text-[7px]" style={{ borderWidth: '0.05px', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
              <col style={{ width: 'calc(100% / 13)' }} />
            </colgroup>
            <tbody>
              <tr className="bg-white">
                <td rowSpan="3" className="px-0.5 py-0.5 text-center font-semibold align-middle" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>CONTROLE<br/>ESTATÍSTICO</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>QT. LEITURAS:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.bordoEsquerdo.qt}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>QT. LEITURAS:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.eixo.qt}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>QT. LEITURAS:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.bordoDireito.qt}</td>
              </tr>
              <tr className="bg-white">
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>MÉDIA:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.bordoEsquerdo.media.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>MÉDIA:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.eixo.media.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>MÉDIA:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.bordoDireito.media.toFixed(0)}</td>
              </tr>
              <tr className="bg-white">
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>DESV. PAD.:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.bordoEsquerdo.desvPad.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>DESV. PAD.:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.eixo.desvPad.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>DESV. PAD.:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{stats.bordoDireito.desvPad.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

              {/* Representação Gráfica */}
              <div className="mb-1 print:break-inside-avoid">
                <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[8px] border" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px' }}>
                  REPRESENTAÇÃO GRÁFICA
                </div>
                <div className="p-3">
                  <ResponsiveContainer width="100%" height={275}>
                    <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 60, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                  dataKey="estaca" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fontSize: 8 }}
                  />
                  <YAxis 
                  label={{ value: 'Deflexão (x10⁻²mm)', angle: -90, position: 'center', style: { fontSize: 10, textAnchor: 'middle' }, offset: 10 }}
                  tick={{ fontSize: 8 }}
                  domain={[0, 'dataMax + 10']}
                  />
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 9 }} verticalAlign="bottom" height={4} />
                  <Bar dataKey="Bordo Esquerdo" fill="#566e3d" />
                  <Bar dataKey="Eixo" fill="#00233b" />
                  <Bar dataKey="Bordo Direito" fill="#bfcf99" />
                  <Line type="monotone" dataKey="Def. Admissível" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </ComposedChart>
                  </ResponsiveContainer>
          </div>
        </div>

              {/* Observações */}
              {ensaio.observacoes && (
                <div className="mb-0 print:break-inside-avoid">
                  <div className="bg-slate-200 px-1.5 py-0 font-bold text-[8px]">OBSERVAÇÕES</div>
                  <div className="p-0.5 text-[8px] min-h-[15px] border" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px' }}>
                    <div className="whitespace-pre-wrap">{ensaio.observacoes}</div>
                  </div>
                </div>
              )}

              {/* Assinaturas */}
              <footer className="mt-2 pt-2">
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
          );
        })}
      </div>
    </div>
  );
}