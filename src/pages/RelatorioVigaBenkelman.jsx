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

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 no-print">
          <Button onClick={() => navigate(-1)} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <Button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-800">
            Imprimir
          </Button>
        </div>

        {/* Cabeçalho do Relatório */}
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-2 mb-4">
          <div className="flex justify-start">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" 
              alt="Logo Afirmaevias" 
              className="h-12 object-contain" 
            />
          </div>
          <div className="text-center">
            <h1 className="text-sm font-bold text-gray-800 leading-tight">
              LEVANTAMENTO DEFLECTOMÉTRICO POR VIGA BENKELMAN
            </h1>
            <p className="text-xs text-gray-600">MÉTODO DE ENSAIO DNER-ME-024/94</p>
          </div>
          <div className="flex justify-end">
            <div className="text-xs text-gray-600 border border-slate-300 rounded px-2 py-1">
              {ensaio.data_ensaio ? new Date(ensaio.data_ensaio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}
            </div>
          </div>
        </header>

        {/* Dados da Obra */}
        <div className="mb-3">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-1 font-bold text-center mb-0 text-xs">
            DADOS DA OBRA
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 p-2 text-xs leading-tight">
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
              <p className="text-gray-900">{ensaio.data_ensaio ? new Date(ensaio.data_ensaio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</p>
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
        <div className="border-2 border-slate-300 mb-4">
          <div className="bg-slate-50 border-b border-slate-300 p-3">
            <h2 className="text-sm font-semibold text-slate-700">DADOS DO ENSAIO</h2>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-600 mb-3">MÉTODO DE ENSAIO DNER-ME-024/94</p>
          </div>
        </div>

        {/* Tabela de Levantamentos */}
        <div className="border-2 border-slate-300 mb-4 overflow-x-auto">
          <div className="bg-slate-50 border-b border-slate-300 p-3">
            <h2 className="text-sm font-semibold text-slate-700">LEVANTAMENTO DEFLECTOMÉTRICO POR VIGA BENKELMAN</h2>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold">BORDO ESQUERDO</th>
                <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold">EIXO</th>
                <th colSpan="4" className="border border-slate-300 p-2 text-center font-semibold">BORDO DIREITO</th>
              </tr>
              <tr className="bg-slate-100">
                <th colSpan="13" className="border border-slate-300 p-2">Estaca / km</th>
              </tr>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2">Leitura Inicial (A)</th>
                <th className="border border-slate-300 p-2">Leitura Final (B)</th>
                <th className="border border-slate-300 p-2">Diferença (C = A - B)</th>
                <th className="border border-slate-300 p-2">Deflexão (x10⁻²mm)</th>
                <th className="border border-slate-300 p-2">Leitura Inicial (A)</th>
                <th className="border border-slate-300 p-2">Leitura Final (B)</th>
                <th className="border border-slate-300 p-2">Diferença (C = A - B)</th>
                <th className="border border-slate-300 p-2">Deflexão (x10⁻²mm)</th>
                <th className="border border-slate-300 p-2">Leitura Inicial (A)</th>
                <th className="border border-slate-300 p-2">Leitura Final (B)</th>
                <th className="border border-slate-300 p-2">Diferença (C = A - B)</th>
                <th className="border border-slate-300 p-2">Deflexão (x10⁻²mm)</th>
              </tr>
            </thead>
            <tbody>
              {ensaio.levantamentos.map((lev, idx) => (
                <tr key={idx}>
                  <td colSpan="13" className="border border-slate-300 p-2 font-semibold bg-slate-50">
                    {lev.estaca_km}
                  </td>
                </tr>
              ))}
              {ensaio.levantamentos.map((lev, idx) => (
                <tr key={`row-${idx}`}>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_esquerdo?.leitura_inicial.toFixed(0)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_esquerdo?.leitura_final.toFixed(0)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_esquerdo?.diferenca.toFixed(2)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_esquerdo?.deflexao.toFixed(1)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.eixo?.leitura_inicial.toFixed(0)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.eixo?.leitura_final.toFixed(0)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.eixo?.diferenca.toFixed(2)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.eixo?.deflexao.toFixed(1)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_direito?.leitura_inicial.toFixed(0)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_direito?.leitura_final.toFixed(0)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_direito?.diferenca.toFixed(2)}</td>
                  <td className="border border-slate-300 p-2 text-center">{lev.bordo_direito?.deflexao.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Representação Gráfica */}
        <div className="border-2 border-slate-300 mb-4">
          <div className="bg-slate-50 border-b border-slate-300 p-3">
            <h2 className="text-sm font-semibold text-slate-700">REPRESENTAÇÃO GRÁFICA</h2>
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
        <div className="border-2 border-slate-300 mb-4">
          <div className="bg-slate-50 border-b border-slate-300 p-3">
            <h2 className="text-sm font-semibold text-slate-700">CONTROLE ESTATÍSTICO</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-semibold">QT. LEITURAS</p>
                <p className="text-lg font-bold text-slate-700">{qtLeituras}</p>
              </div>
              <div>
                <p className="font-semibold">MÉDIA</p>
                <p className="text-lg font-bold text-slate-700">{media.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-semibold">DESV. PAD.</p>
                <p className="text-lg font-bold text-slate-700">{desvPad.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        {ensaio.observacoes && (
          <div className="border-2 border-slate-300 mb-4">
            <div className="bg-slate-50 border-b border-slate-300 p-3">
              <h2 className="text-sm font-semibold text-slate-700">OBSERVAÇÕES</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-700">{ensaio.observacoes}</p>
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