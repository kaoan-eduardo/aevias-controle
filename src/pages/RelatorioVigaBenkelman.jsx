import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RelatorioVigaBenkelman() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnsaio();
  }, [id]);

  const loadEnsaio = async () => {
    try {
      if (id) {
        const data = await base44.entities.EnsaioVigaBenkelman.get(id);
        setEnsaio(data);

        // Carregar obra e regional
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

  // Preparar dados para gráfico
  const chartData = ensaio.levantamentos.map(lev => ({
    estaca: lev.estaca_km || '',
    'Bordo Esquerdo': lev.bordo_esquerdo?.deflexao || 0,
    'Eixo': lev.eixo?.deflexao || 0,
    'Bordo Direito': lev.bordo_direito?.deflexao || 0,
    'Def. Admissível': parseFloat(ensaio.def_admissivel) || 0
  }));

  // Calcular controle estatístico por bordo
  const deflexoesBordoEsquerdo = ensaio.levantamentos
    .map(lev => lev.bordo_esquerdo?.deflexao || 0)
    .filter(v => v > 0);
  
  const deflexoesEixo = ensaio.levantamentos
    .map(lev => lev.eixo?.deflexao || 0)
    .filter(v => v > 0);
  
  const deflexoesBordoDireito = ensaio.levantamentos
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

  const estatBordoEsquerdo = calcularEstatisticas(deflexoesBordoEsquerdo);
  const estatEixo = calcularEstatisticas(deflexoesEixo);
  const estatBordoDireito = calcularEstatisticas(deflexoesBordoDireito);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Levantamento Deflectométrico por Viga Benkelman
          </h2>
          <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      <div id="report-content" className="w-full max-w-[210mm] mx-auto bg-white p-1 print:p-1 print:min-h-[297mm]">
        {/* Cabeçalho do Relatório */}
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0 mb-0">
          <div className="flex justify-start">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" 
              alt="Logo" 
              className="h-9 object-contain" 
            />
          </div>
          <div className="text-center">
            <h1 className="text-xs font-bold text-gray-800 leading-tight">
              LEVANTAMENTO DEFLECTOMÉTRICO POR VIGA BENKELMAN
            </h1>
            <p className="text-[9px] text-slate-600">MÉTODO DE ENSAIO DNER-ME-024/94</p>
          </div>
          <div className="flex justify-end">
            <div className="text-[10px] text-gray-600 border border-slate-300 rounded px-1 py-0">
              {formatDate(ensaio.data_ensaio)}
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
              <p className="text-gray-900">{ensaio.pista_faixa || '-'}</p>
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
        <div className="mb-0 overflow-x-auto">
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
              {Array.from({ length: Math.max(20, ensaio.levantamentos.length) }).map((_, idx) => {
                const lev = ensaio.levantamentos[idx];
                const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50';
                return (
                  <tr key={idx} className={bgColor} style={{ height: '18px' }}>
                    <td className="px-0.5 py-0 font-semibold text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>
                      {lev?.estaca_km || ''}
                    </td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_esquerdo?.leitura_inicial?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_esquerdo?.leitura_final?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_esquerdo?.diferenca?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_esquerdo?.deflexao?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.eixo?.leitura_inicial?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.eixo?.leitura_final?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.eixo?.diferenca?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.eixo?.deflexao?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_direito?.leitura_inicial?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_direito?.leitura_final?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_direito?.diferenca?.toFixed(0) || ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev?.bordo_direito?.deflexao?.toFixed(0) || ''}</td>
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
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatBordoEsquerdo.qt}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>QT. LEITURAS:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatEixo.qt}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>QT. LEITURAS:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatBordoDireito.qt}</td>
              </tr>
              <tr className="bg-white">
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>MÉDIA:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatBordoEsquerdo.media.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>MÉDIA:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatEixo.media.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>MÉDIA:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatBordoDireito.media.toFixed(0)}</td>
              </tr>
              <tr className="bg-white">
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>DESV. PAD.:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatBordoEsquerdo.desvPad.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>DESV. PAD.:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatEixo.desvPad.toFixed(0)}</td>
                <td colSpan="3" className="px-0.5 py-0.5 text-left font-semibold text-[6px]" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>DESV. PAD.:</td>
                <td className="px-0.5 py-0.5 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{estatBordoDireito.desvPad.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Representação Gráfica */}
        <div className="mb-0 print:break-inside-avoid">
          <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[8px] border" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px' }}>
            REPRESENTAÇÃO GRÁFICA
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 50, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="estaca" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  tick={{ fontSize: 8 }}
                />
                <YAxis 
                  label={{ value: 'Deflexão (x10⁻²mm)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                  tick={{ fontSize: 8 }}
                  domain={[0, 'dataMax + 10']}
                />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Bordo Esquerdo" fill="#8b5cf6" />
                <Bar dataKey="Eixo" fill="#3b82f6" />
                <Bar dataKey="Bordo Direito" fill="#06b6d4" />
                <Line type="monotone" dataKey="Def. Admissível" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </BarChart>
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
        <footer className="mt-4 pt-2 print:break-inside-avoid">
          <div className="grid grid-cols-3 gap-1.5 items-end px-1">
            <div className="text-center">
              <div className="text-[8px] text-slate-500 mb-0 min-h-[24px] flex flex-col justify-end items-center">
                {ensaio.laboratorista_name && (
                  <>
                    <p className="font-bold text-slate-600 text-[8px]">{ensaio.laboratorista_name}</p>
                    <p className="text-[6px]">{ensaio.created_by}</p>
                  </>
                )}
              </div>
              <div className="border-t border-gray-500 pt-0 w-3/4 mx-auto">
                <p className="text-[7px] font-semibold">LABORATORISTA RESPONSÁVEL</p>
              </div>
            </div>

            <div className="text-center">
              {ensaio.approver_details ? (
                <>
                  <div className="text-[8px] text-slate-500 mb-0 min-h-[24px] flex flex-col justify-end items-center">
                    <p className="font-bold text-slate-600 text-[8px]">{ensaio.approver_details.name}</p>
                    <p className="text-[6px]">{ensaio.approved_by}</p>
                    {ensaio.approver_details.crea_number && <p className="text-[6px]">CREA: {ensaio.approver_details.crea_number}</p>}
                  </div>
                  <div className="border-t border-gray-500 pt-0 w-3/4 mx-auto">
                    <p className="text-[7px] font-semibold">ENGENHEIRO RESPONSÁVEL</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[24px] mb-0"></div>
                  <div className="border-t border-gray-500 pt-0 w-3/4 mx-auto">
                    <p className="text-[7px] font-semibold">ENGENHEIRO RESPONSÁVEL</p>
                  </div>
                </>
              )}
            </div>

            <div className="text-center">
              {ensaio.client_signature?.signed_by ? (
                <>
                  <div className="text-[8px] text-slate-500 mb-0 min-h-[24px] flex flex-col justify-end items-center">
                    <p className="font-bold text-slate-600 text-[8px]">{ensaio.client_signature.engineer_name}</p>
                    <p className="text-[6px]">{ensaio.client_signature.signed_by}</p>
                    {ensaio.client_signature.crea_number && <p className="text-[6px]">CREA: {ensaio.client_signature.crea_number}</p>}
                  </div>
                  <div className="border-t border-gray-500 pt-0 w-3/4 mx-auto">
                    <p className="text-[7px] font-semibold">ENGENHEIRO CLIENTE</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[24px] mb-0"></div>
                  <div className="border-t border-gray-500 pt-0 w-3/4 mx-auto">
                    <p className="text-[7px] font-semibold">ENGENHEIRO CLIENTE</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}