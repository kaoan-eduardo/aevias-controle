import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RelatorioVigaBenkelman() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [ensaio, setEnsaio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnsaio();
  }, [id]);

  const loadEnsaio = async () => {
    try {
      if (id) {
        const data = await base44.entities.EnsaioVigaBenkelman.get(id);
        setEnsaio(data);
      }
    } catch (error) {
      console.error('Erro ao carregar ensaio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!ensaio) {
    return (
      <div className="p-8">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <p>Ensaio não encontrado.</p>
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

  // Calcular controle estatístico
  const todasAsDeflexoes = ensaio.levantamentos.flatMap(lev => [
    lev.bordo_esquerdo?.deflexao || 0,
    lev.eixo?.deflexao || 0,
    lev.bordo_direito?.deflexao || 0
  ]).filter(v => v > 0);

  const qtLeituras = todasAsDeflexoes.length;
  const media = qtLeituras > 0 ? todasAsDeflexoes.reduce((a, b) => a + b) / qtLeituras : 0;
  const desvPad = qtLeituras > 0 
    ? Math.sqrt(todasAsDeflexoes.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / qtLeituras)
    : 0;

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
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(-1)} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
          <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
            Imprimir
          </Button>
        </div>
      </div>

      <div className="w-full max-w-[210mm] mx-auto bg-white p-1 print:p-1 print:min-h-[297mm]">
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
              <p className="text-gray-900">Automático</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">OBRA</p>
              <p className="text-gray-900">Selecionar</p>
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
              <p className="text-gray-900">{ensaio.cte_viga || '-'}</p>
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
          <div className="p-2">
            <p className="text-[8px] text-slate-600">MÉTODO DE ENSAIO DNER-ME-024/94</p>
          </div>
        </div>

        {/* Tabela de Levantamentos */}
        <div className="mb-0 overflow-x-auto">
          <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[8px] border" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px' }}>
            LEVANTAMENTO DEFLECTOMÉTRICO POR VIGA BENKELMAN
          </div>
          <table className="w-full border-collapse text-[7px]" style={{ borderWidth: '0.05px' }}>
            <thead>
              <tr className="bg-slate-100">
                <th colSpan="4" className="px-1 py-0.5 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>BORDO ESQUERDO</th>
                <th colSpan="4" className="px-1 py-0.5 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>EIXO</th>
                <th colSpan="4" className="px-1 py-0.5 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>BORDO DIREITO</th>
              </tr>
              <tr className="bg-slate-100">
                <th colSpan="13" className="px-1 py-0.5" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>Estaca / km</th>
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
              {ensaio.levantamentos.map((lev, idx) => {
                const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50';
                return (
                  <React.Fragment key={idx}>
                    <tr className={bgColor}>
                      <td colSpan="13" className="px-0.5 py-0 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>
                        {lev.estaca_km}
                      </td>
                    </tr>
                    <tr className={bgColor} style={{ height: '18px' }}>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_esquerdo?.leitura_inicial?.toFixed(0) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_esquerdo?.leitura_final?.toFixed(0) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_esquerdo?.diferenca?.toFixed(2) || ''}</td>
                      <td className="px-0.5 py-0 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_esquerdo?.deflexao?.toFixed(1) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.eixo?.leitura_inicial?.toFixed(0) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.eixo?.leitura_final?.toFixed(0) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.eixo?.diferenca?.toFixed(2) || ''}</td>
                      <td className="px-0.5 py-0 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.eixo?.deflexao?.toFixed(1) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_direito?.leitura_inicial?.toFixed(0) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_direito?.leitura_final?.toFixed(0) || ''}</td>
                      <td className="px-0.5 py-0 text-center" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_direito?.diferenca?.toFixed(2) || ''}</td>
                      <td className="px-0.5 py-0 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px', borderStyle: 'solid' }}>{lev.bordo_direito?.deflexao?.toFixed(1) || ''}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Representação Gráfica */}
        <div className="mb-0 print:break-inside-avoid">
          <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[8px] border" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px' }}>
            REPRESENTAÇÃO GRÁFICA
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estaca" angle={-45} textAnchor="end" height={80} />
                <YAxis label={{ value: 'Deflexão (x10⁻²mm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Bordo Esquerdo" fill="#8b5cf6" />
                <Bar dataKey="Eixo" fill="#3b82f6" />
                <Bar dataKey="Bordo Direito" fill="#06b6d4" />
                <Line dataKey="Def. Admissível" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Controle Estatístico */}
        <div className="mb-0 print:break-inside-avoid">
          <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[8px] border" style={{ borderColor: 'rgb(148, 163, 184)', borderWidth: '0.05px' }}>
            CONTROLE ESTATÍSTICO
          </div>
          <div className="p-2">
            <div className="grid grid-cols-3 gap-3 text-[9px]">
              <div>
                <p className="font-bold text-gray-700">QT. LEITURAS</p>
                <p className="text-[11px] font-bold text-slate-700">{qtLeituras}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">MÉDIA</p>
                <p className="text-[11px] font-bold text-slate-700">{media.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">DESV. PAD.</p>
                <p className="text-[11px] font-bold text-slate-700">{desvPad.toFixed(2)}</p>
              </div>
            </div>
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
        <div className="border-2 border-slate-300 p-6 mt-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="border-t-2 border-slate-300 pt-2 h-16"></div>
              <p className="text-sm font-semibold text-slate-700">LABORATORISTA</p>
            </div>
            <div>
              <div className="border-t-2 border-slate-300 pt-2 h-16"></div>
              <p className="text-sm font-semibold text-slate-700">ENGENHEIRO RESPONSÁVEL</p>
            </div>
            <div>
              <div className="border-t-2 border-slate-300 pt-2 h-16"></div>
              <p className="text-sm font-semibold text-slate-700">CLIENTE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}