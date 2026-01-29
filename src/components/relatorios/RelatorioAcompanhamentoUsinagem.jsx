import React from 'react';

export default function RelatorioAcompanhamentoUsinagem({ ensaio, obra, project, user, regional }) {
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
            Relatório - Acompanhamento de Usinagem
          </h1>
          <button
            onClick={() => window.print()}
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
              <h1 className="text-lg font-bold text-gray-800 uppercase">Acompanhamento de Usinagem</h1>
            </div>
            <div className="w-1/4 flex justify-end">
              <div className="border border-gray-300 rounded-lg px-3 py-1 bg-white shadow-sm">
                <p className="text-gray-700 text-sm font-semibold">{formatDate(ensaio.data)}</p>
              </div>
            </div>
          </header>

          {/* DADOS DA OBRA */}
          <section className="mb-4">
            <div className="bg-[#2c3e50] text-white font-bold text-center py-2 text-sm uppercase">
              DADOS DA OBRA
            </div>
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white w-1/6">CLIENTE:</td>
                  <td className="border border-gray-400 p-2 w-1/3">{regional?.cliente || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white w-1/6">PROJETO:</td>
                  <td className="border border-gray-400 p-2 w-1/3">{ensaio.numero_projeto || project?.name || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white w-1/6">FATOR CORREÇÃO PRENSA:</td>
                  <td className="border border-gray-400 p-2 w-1/3">N/A</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">OBRA:</td>
                  <td className="border border-gray-400 p-2">{obra?.name || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">FAIXA ESPECIFICADA:</td>
                  <td className="border border-gray-400 p-2">{ensaio.faixa_especificada || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">DENS. ÁGUA 25°C:</td>
                  <td className="border border-gray-400 p-2">0,9971 g/cm³</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">RODOVIA:</td>
                  <td className="border border-gray-400 p-2">{ensaio.rodovia || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">USINA FORNECEDORA:</td>
                  <td className="border border-gray-400 p-2">{ensaio.usina || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">DATA:</td>
                  <td className="border border-gray-400 p-2">{formatDate(ensaio.data)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">TRECHO:</td>
                  <td className="border border-gray-400 p-2">{ensaio.trecho || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">LABORATORISTA:</td>
                  <td className="border border-gray-400 p-2">{ensaio.laboratorista_name || 'N/A'}</td>
                  <td className="border border-gray-400 p-2 font-semibold bg-[#2c3e50] text-white">ESPESSURA PROJETO:</td>
                  <td className="border border-gray-400 p-2">N/A</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* DADOS DO ENSAIO */}
          <section className="mb-4">
            <div className="bg-[#2c3e50] text-white font-bold text-center py-2 text-sm uppercase">
              DADOS DO ENSAIO
            </div>
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-[#2c3e50] text-white">
                  <th rowSpan="2" className="border border-gray-400 p-2">N°</th>
                  <th rowSpan="2" className="border border-gray-400 p-2">EST.</th>
                  <th rowSpan="2" className="border border-gray-400 p-2">L</th>
                  <th rowSpan="2" className="border border-gray-400 p-2">DATA<br/>EXT</th>
                  <th rowSpan="2" className="border border-gray-400 p-2">ESPESSURA<br/>(mm)</th>
                  <th colSpan="3" className="border border-gray-400 p-2">MÉDIA MEDI. APARENTE Á</th>
                  <th colSpan="3" className="border border-gray-400 p-2">VOL</th>
                  <th colSpan="3" className="border border-gray-400 p-2">DENS.<br/>PROJ.<br/>(%)</th>
                  <th colSpan="3" className="border border-gray-400 p-2">D.C<br/>RICE<br/>(%)</th>
                  <th colSpan="3" className="border border-gray-400 p-2">VOZ<br/>MD2<br/>(%)</th>
                  <th rowSpan="2" className="border border-gray-400 p-2">LEIT<br/>(Kgf)<br/>(MPa)</th>
                  <th rowSpan="2" className="border border-gray-400 p-2">RTCD<br/>(MPa)</th>
                </tr>
                <tr className="bg-[#4a5f7f] text-white text-[10px]">
                  <th className="border border-gray-400 p-1">MED<br/>(mm)</th>
                  <th className="border border-gray-400 p-1">FAR<br/>(g)</th>
                  <th className="border border-gray-400 p-1">FIM<br/>(g)</th>
                  <th className="border border-gray-400 p-1">FSAT<br/>(g)</th>
                  <th className="border border-gray-400 p-1">VOL<br/>CP(g)</th>
                  <th className="border border-gray-400 p-1">DENS.<br/>REAL<br/>(%)</th>
                  <th className="border border-gray-400 p-1">G.C<br/>PROJ.<br/>(%)</th>
                  <th className="border border-gray-400 p-1">D/A<br/>(g/cm³)</th>
                  <th className="border border-gray-400 p-1">D.C<br/>RICE<br/>(%)</th>
                  <th className="border border-gray-400 p-1">VOZ<br/>MD2<br/>(%)</th>
                  <th className="border border-gray-400 p-1">LEIT<br/>(Kgf)</th>
                  <th className="border border-gray-400 p-1">RTCD<br/>(MPa)</th>
                </tr>
              </thead>
              <tbody>
                {ensaio.cargas && ensaio.cargas.length > 0 ? (
                  ensaio.cargas.map((carga, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 p-1 text-center">{idx + 1}</td>
                      <td className="border border-gray-400 p-1 text-center">{carga.placa_caminhao || '-'}</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">{carga.hora_saida || '-'}</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">-</td>
                      <td className="border border-gray-400 p-1 text-center">{carga.temperatura_1 || '-'}</td>
                      <td className="border border-gray-400 p-1 text-center">{carga.temperatura_2 || '-'}</td>
                    </tr>
                  ))
                ) : (
                  [...Array(3)].map((_, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 p-1 text-center">{idx + 1}</td>
                      {[...Array(19)].map((_, colIdx) => (
                        <td key={colIdx} className="border border-gray-400 p-1 text-center">-</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>



          {/* Observações */}
          {ensaio.observacoes_gerais && (
            <section className="mb-4">
              <div className="border border-gray-400 p-3 bg-white">
                <p className="font-semibold text-xs mb-2">OBSERVAÇÕES:</p>
                <p className="text-xs whitespace-pre-wrap text-gray-700">{ensaio.observacoes_gerais}</p>
              </div>
            </section>
          )}

          {/* Assinaturas */}
          <footer className="mt-6 pt-6 print:break-inside-avoid">
            <div className="grid grid-cols-3 gap-8 items-end">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                  <p>Assinado digitalmente por</p>
                  <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.laboratorista_name}</p>
                  <p className="truncate max-w-full">{ensaio.created_by}</p>
                  <p>em {formatDateBrasilia(ensaio.created_date)}</p>
                </div>
                <div className="border-t border-gray-500 pt-2">
                  <p className="text-xs text-gray-600">Laboratorista</p>
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
                      <p className="text-xs text-gray-600">Engenheiro Responsável</p>
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