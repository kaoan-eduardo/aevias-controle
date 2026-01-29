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
          .no-print { 
            display: none !important; 
          }
          #report-content {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white;
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
        <div id="report-content" className="w-full max-w-[270mm] mx-auto bg-white shadow-xl print:shadow-none pt-0.5 px-3 pb-0.5 print:pt-0 print:px-0.5 print:pb-0">
          {/* Cabeçalho com Logo e Data */}
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
                ACOMPANHAMENTO DE USINAGEM
              </h1>
            </div>
            <div className="flex justify-end items-start">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-700 print:text-[9px]">DATA:</p>
                <p className="text-xs font-semibold text-gray-900 print:text-[10px]">{formatDate(ensaio.data)}</p>
              </div>
            </div>
          </header>

          <main className="text-sm print:text-sm">
            {/* DADOS DA OBRA */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-1 py-0 font-bold text-center mb-0 text-[8px] leading-tight">
              DADOS DA OBRA
            </div>

            <div className="grid grid-cols-3 gap-x-1 gap-y-0 mb-0 text-[9px] leading-tight">
              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">CLIENTE:</p>
                <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">TRECHO:</p>
                <p className="text-gray-900">{ensaio.trecho || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">PEDREIRA:</p>
                <p className="text-gray-900">{ensaio.pedreira || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">OBRA:</p>
                <p className="text-gray-900">{obra?.name || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">Nº PROJETO:</p>
                <p className="text-gray-900">{ensaio.numero_projeto || project?.name || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">FAIXA ESPECIFICADA:</p>
                <p className="text-gray-900">{ensaio.faixa_especificada || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">RODOVIA:</p>
                <p className="text-gray-900">{ensaio.rodovia || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">USINA:</p>
                <p className="text-gray-900">{ensaio.usina || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-0.5">
                <p className="font-bold text-gray-700 mb-0">LABORATORISTA:</p>
                <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
              </div>
            </div>

            {/* DADOS DO ENSAIO */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-1 py-0 font-bold text-center mb-0 mt-0 text-[8px] leading-tight">
              DADOS DO ENSAIO
            </div>

            <div className="overflow-x-auto mb-0 print:mb-0">
              <table className="w-full border-collapse border border-slate-400 text-[7px] leading-tight table-fixed">
                <colgroup>
                  <col style={{width: '34%'}} />
                  <col style={{width: '16%'}} />
                  <col style={{width: '16%'}} />
                  <col style={{width: '17%'}} />
                  <col style={{width: '17%'}} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-200">
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">AGREGADOS</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">COMPOSIÇÃO<br/>(%)</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">UMIDADE<br/>(%)</th>
                    <th colSpan="2" className="border border-slate-400 px-0.5 py-0 font-bold text-center leading-tight">TEMPERATURAS</th>
                  </tr>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 px-0.5 py-0"></th>
                    <th className="border border-slate-400 px-0.5 py-0"></th>
                    <th className="border border-slate-400 px-0.5 py-0"></th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">T1 (°C)</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">T2 (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-slate-400 px-0.5 py-0 font-semibold">LIGANTE</td>
                    <td className="border border-slate-400 px-0.5 py-0 text-center">{ensaio.ligante_nome || '-'}</td>
                    <td className="border border-slate-400 px-0.5 py-0 text-center">-</td>
                    <td className="border border-slate-400 px-0.5 py-0 text-center font-semibold">{ensaio.temperatura_ligante || '-'}</td>
                    <td className="border border-slate-400 px-0.5 py-0 text-center">-</td>
                  </tr>
                  {ensaio.agregados?.map((agregado, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border border-slate-400 px-0.5 py-0 font-semibold">{agregado.nome || `Agregado ${idx + 1}`}</td>
                      <td className="border border-slate-400 px-0.5 py-0 text-center">{agregado?.composicao || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0 text-center">{agregado?.umidade || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0 text-center">{agregado?.temperatura_t1 || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-0 text-center">{agregado?.temperatura_t2 || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABELA DE CARGAS */}
            <div className="overflow-x-auto mb-0 print:mb-0 mt-0">
              <table className="w-full border-collapse border border-slate-400 text-[7px] leading-tight table-fixed">
                <colgroup>
                  <col style={{width: '13%'}} />
                  <col style={{width: '11%'}} />
                  <col style={{width: '8%'}} />
                  <col style={{width: '14%'}} />
                  <col style={{width: '14%'}} />
                  <col style={{width: '40%'}} />
                </colgroup>
                <thead className="bg-slate-200">
                  <tr>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">PLACA CAMINHÃO</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">HORA DE SAÍDA</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">PESO<br/>(t)</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">TEMPERATURA<br/>(°C)</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">TEMPERATURA<br/>(°C)</th>
                    <th className="border border-slate-400 px-0.5 py-0 font-bold leading-tight">O/M</th>
                  </tr>
                </thead>
                <tbody>
                  {ensaio.cargas && ensaio.cargas.length > 0 ? (
                    ensaio.cargas.map((carga, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">{carga.placa_caminhao || '-'}</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">{carga.hora_saida || '-'}</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">{carga.peso || '-'}</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">{carga.temperatura_1 || '-'}</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">{carga.temperatura_2 || '-'}</td>
                        <td className="border border-slate-400 px-0.5 py-0">{carga.observacao || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    [...Array(20)].map((_, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">-</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">-</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">-</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">-</td>
                        <td className="border border-slate-400 px-0.5 py-0 text-center">-</td>
                        <td className="border border-slate-400 px-0.5 py-0">-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            </main>

          {/* Assinaturas */}
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
    </>
  );
}