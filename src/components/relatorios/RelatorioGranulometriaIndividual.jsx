import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PENEIRAS_MAP = {
  "peneira_75_0mm": { astm: "3\"", mm: "75,0" },
  "peneira_63_0mm": { astm: "2 1/2\"", mm: "63,0" },
  "peneira_50_0mm": { astm: "2\"", mm: "50,0" },
  "peneira_38_1mm": { astm: "1 1/2\"", mm: "38,1" },
  "peneira_37_5mm": { astm: "1 1/2\"", mm: "37,5" },
  "peneira_25_0mm": { astm: "1\"", mm: "25,0" },
  "peneira_19_0mm": { astm: "3/4\"", mm: "19,0" },
  "peneira_16_0mm": { astm: "5/8\"", mm: "16,0" },
  "peneira_12_5mm": { astm: "1/2\"", mm: "12,5" },
  "peneira_9_5mm": { astm: "3/8\"", mm: "9,5" },
  "peneira_4_75mm": { astm: "#4", mm: "4,75" },
  "peneira_2_36mm": { astm: "#8", mm: "2,36" },
  "peneira_2_0mm": { astm: "#10", mm: "2,0" },
  "peneira_1_18mm": { astm: "#16", mm: "1,18" },
  "peneira_0_6mm": { astm: "#30", mm: "0,6" },
  "peneira_0_42mm": { astm: "#40", mm: "0,42" },
  "peneira_0_3mm": { astm: "#50", mm: "0,3" },
  "peneira_0_18mm": { astm: "#100", mm: "0,18" },
  "peneira_0_15mm": { astm: "#100", mm: "0,15" },
  "peneira_0_075mm": { astm: "#200", mm: "0,075" }
};

export default function RelatorioGranulometriaIndividual({ ensaio, obra, project, user, regional }) {
  if (!ensaio) {
    return (
      <div className="bg-white p-8 font-sans">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-4">Erro</h2>
          <p>Dados do ensaio não foram fornecidos.</p>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    return new Date(normalizedDate).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium'
    });
  };

  const peneirasVisiveis = project?.faixa_trabalho 
    ? Object.keys(project.faixa_trabalho).filter(key => project.faixa_trabalho[key] !== null && project.faixa_trabalho[key] !== undefined)
    : Object.keys(PENEIRAS_MAP);

  // Prepare data for chart
  const chartData = peneirasVisiveis.map(pKey => {
    const pInfo = PENEIRAS_MAP[pKey];
    const mmValue = parseFloat(pInfo.mm);
    const dataPoint = { mm: mmValue, astm: pInfo.astm };
    ensaio.agregados?.forEach((agg, idx) => {
      dataPoint[`Agregado ${idx + 1}`] = parseFloat(agg.granulometria?.[pKey]?.passante) || 0;
    });
    return dataPoint;
  }).sort((a, b) => b.mm - a.mm);

  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          #report-content {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white;
          }
        }
      `}</style>
      <div className="bg-white min-h-screen p-6 font-sans">
        {/* Header com Título e Botão de Download */}
        <div className="no-print flex justify-between items-center mb-6 px-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Relatório - Granulometria Individual dos Agregados
          </h1>
          <button
            onClick={handleDownloadPDF}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Gerar PDF
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div id="report-content" className="bg-white font-sans p-8 max-w-6xl mx-auto">
      {/* Cabeçalho com Logo e Data */}
      <header className="flex items-center justify-between border-b-4 border-slate-700 pb-4 mb-6">
        <div className="w-1/4">
          <img 
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
            alt="Logo Regional" 
            className="h-16 object-contain" 
          />
        </div>
        <div className="w-1/2 text-center">
          <h1 className="text-lg font-bold text-gray-800 uppercase">Granulometria Individual</h1>
          <h2 className="text-sm text-gray-700">{obra?.name}</h2>
          <p className="text-xs text-slate-600">Ensaio de Granulometria do Agregado</p>
        </div>
        <div className="w-1/4 flex justify-end">
          <div className="border border-gray-300 rounded-lg px-3 py-1 bg-white shadow-sm">
            <p className="text-gray-700 text-sm font-semibold">{formatDate(ensaio.data_ensaio)}</p>
          </div>
        </div>
      </header>

      {/* Informações da Obra e Amostra */}
      <section className="mt-6 grid grid-cols-3 gap-6 text-sm mb-4">
        <div className="space-y-1">
          <p className="font-semibold">Obra:</p>
          <p>{obra?.name} - {obra?.code}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Projeto:</p>
          <p>{project?.name || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Data:</p>
          <p>{formatDate(ensaio.data_ensaio)}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Rodovia:</p>
          <p>{ensaio.rodovia || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Laboratorista:</p>
          <p>{ensaio.laboratorista_name || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Local de Coleta:</p>
          <p>{ensaio.local_coleta || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Faixa:</p>
          <p>{ensaio.faixa || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Pedreira:</p>
          <p>{ensaio.pedreira || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Horário:</p>
          <p>{ensaio.horario || 'N/A'}</p>
        </div>
      </section>
      <hr className="border-t-2 border-slate-300 my-4" />

      {/* Granulometria */}
      <section className="mb-4">
       <p className="text-xs text-center font-bold mb-2">MÉTODO DE ENSAIO DE GRANULOMETRIA - DNIT 412/2025-ME</p>

        {/* Tabela Compacta de Granulometria */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead className="bg-slate-700 text-gray-800">
              <tr>
                <th className="border border-gray-400 p-1 text-white" style={{ backgroundColor: '#334155' }} rowSpan="2">PENEIRA</th>
                <th className="border border-gray-400 p-1 text-white" style={{ backgroundColor: '#334155' }} rowSpan="2">mm</th>
                {ensaio.agregados?.map((agg, idx) => (
                  <th key={idx} className="border border-gray-400 p-1 bg-slate-700 text-white" colSpan="2">{agg.nome || `Agg ${idx + 1}`}</th>
                ))}
              </tr>
              <tr className="bg-gray-200">
                {ensaio.agregados?.map((_, idx) => (
                  <React.Fragment key={idx}>
                    <th className="border border-gray-400 p-1 text-xs text-gray-800">Ret (g)</th>
                    <th className="border border-gray-400 p-1 text-xs text-gray-800">Pass %</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {peneirasVisiveis.map((pKey, rowIdx) => {
                const pInfo = PENEIRAS_MAP[pKey];
                return (
                  <tr key={pKey} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-400 p-1 font-semibold text-center">{pInfo.astm}</td>
                    <td className="border border-gray-400 p-1 text-center">{pInfo.mm}</td>
                    {ensaio.agregados?.map((agg, aggIdx) => (
                      <React.Fragment key={aggIdx}>
                        <td className="border border-gray-400 p-1 text-center">{agg.granulometria?.[pKey]?.retido || '-'}</td>
                        <td className="border border-gray-400 p-1 text-center">{agg.granulometria?.[pKey]?.passante || '-'}</td>
                      </React.Fragment>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Gráfico de Granulometria */}
        <div className="border border-gray-400 p-4 mb-4 bg-white">
          <h3 className="text-xs font-bold text-center mb-2">GRANULOMETRIA DA AMOSTRA</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="astm" 
                tick={{ fontSize: 10 }} 
                label={{ value: 'Peneiras', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                label={{ value: '% Passante', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value) => value.toFixed(2)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {ensaio.agregados?.map((agg, idx) => (
                <Line 
                  key={idx}
                  type="linear" 
                  dataKey={`Agregado ${idx + 1}`}
                  name={agg.nome || `Agregado ${idx + 1}`}
                  stroke={colors[idx % colors.length]}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Equivalente de Areia */}
      <section className="mb-4">
        <p className="text-xs text-center font-bold mb-2">MÉTODO DE ENSAIO DE EQUIVALENTE DE AREIA - DNIT 450/2024</p>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead className="bg-slate-700">
            <tr>
              <th className="border border-gray-400 p-2 text-xs text-white">Parâmetro</th>
              <th className="border border-gray-400 p-2 text-xs text-white">Fórmula</th>
              <th className="border border-gray-400 p-2 text-xs text-white">Unidade</th>
              {ensaio.equivalente_areia?.medicoes?.map((_, index) => (
                <th key={index} className="border border-gray-400 p-2 text-xs text-white">Med. {index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border border-gray-400 p-2 font-semibold text-xs">Topo Argila</td>
              <td className="border border-gray-400 p-2 text-center text-xs">H₁</td>
              <td className="border border-gray-400 p-2 text-center text-xs">cm</td>
              {ensaio.equivalente_areia?.medicoes?.map((medicao, index) => (
                <td key={index} className="border border-gray-400 p-2 text-center text-xs">
                  {medicao.topo_argila || '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 font-semibold text-xs">Topo Areia</td>
              <td className="border border-gray-400 p-2 text-center text-xs">H₂</td>
              <td className="border border-gray-400 p-2 text-center text-xs">cm</td>
              {ensaio.equivalente_areia?.medicoes?.map((medicao, index) => (
                <td key={index} className="border border-gray-400 p-2 text-center text-xs">
                  {medicao.topo_areia || '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-white">
              <td className="border border-gray-400 p-2 font-semibold text-xs">Equivalente Areia</td>
              <td className="border border-gray-400 p-2 text-center text-xs">(H₂/H₁)×100</td>
              <td className="border border-gray-400 p-2 text-center text-xs">%</td>
              {ensaio.equivalente_areia?.medicoes?.map((medicao, index) => (
                <td key={index} className="border border-gray-400 p-2 text-center text-xs">
                  {medicao.equivalente || '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-100">
              <td className="border border-gray-400 p-2 font-bold text-xs">Média</td>
              <td className="border border-gray-400 p-2"></td>
              <td className="border border-gray-400 p-2 text-center text-xs font-bold">%</td>
              <td className="border border-gray-400 p-2 text-center font-bold text-xs" colSpan={ensaio.equivalente_areia?.medicoes?.length || 1}>
                {ensaio.equivalente_areia?.media || '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Observações */}
      {ensaio.observacoes && (
        <section className="mb-4">
          <div className="border border-gray-400 p-3 bg-gray-50">
            <p className="font-semibold text-xs mb-2">OBSERVAÇÕES:</p>
            <p className="text-xs whitespace-pre-wrap text-gray-700">{ensaio.observacoes}</p>
          </div>
        </section>
      )}

      {/* Assinaturas */}
      <footer className="mt-12 pt-8">
        <div className="grid grid-cols-3 gap-8 items-end">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
              <p>Assinado digitalmente por</p>
              <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.laboratorista_name}</p>
              <p className="truncate max-w-full">{ensaio.created_by}</p>
              <p>em {formatDateBrasilia(ensaio.created_date)}</p>
            </div>
            <div className="border-t border-gray-500 pt-2">
              <p className="text-xs text-gray-600">Laboratorista Responsável</p>
            </div>
          </div>

          <div className="text-center">
            {ensaio.approver_details ? (
              <>
                <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                  <p>Aprovado digitalmente por</p>
                  <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.approver_details.name}</p>
                  <p className="truncate max-w-full">{ensaio.approved_by}</p>
                  {ensaio.approver_details.crea_number && <p>CREA: {ensaio.approver_details.crea_number}</p>}
                  <p>em {formatDateBrasilia(ensaio.approved_date)}</p>
                </div>
                <div className="border-t border-gray-500 pt-2">
                  <p className="text-xs text-gray-600">{ensaio.approver_details.position}</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-24 mb-2"></div>
                <div className="border-t border-gray-500 pt-2">
                  <p className="text-xs text-gray-600">Engenheiro Responsável</p>
                </div>
              </>
            )}
          </div>

          <div className="text-center">
            {ensaio.client_signature?.signed_by ? (
              <>
                <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                  <p>Assinado digitalmente por</p>
                  <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.client_signature.engineer_name}</p>
                  <p className="truncate max-w-full">{ensaio.client_signature.signed_by}</p>
                  {ensaio.client_signature.crea_number && <p>CREA: {ensaio.client_signature.crea_number}</p>}
                  <p>em {formatDateBrasilia(ensaio.client_signature.signed_date)}</p>
                </div>
                <div className="border-t border-gray-500 pt-2">
                  <p className="text-xs text-gray-600">Engenheiro Cliente</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-24 mb-2"></div>
                <div className="border-t border-gray-500 pt-2">
                  <p className="text-xs text-gray-600">Engenheiro Cliente</p>
                </div>
              </>
            )}
          </div>
        </div>
        </footer>
        </div>
      </div>
    </>
  );
}