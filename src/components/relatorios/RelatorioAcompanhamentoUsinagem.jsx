import React from 'react';

import SignatureFooter from './SignatureFooter';

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
            type="button"
            onClick={() => window.print()}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Gerar PDF
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div id="report-content" className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-0.5 px-3 pb-0.5 print:pt-0 print:px-0.5 print:pb-0">
          {/* Cabeçalho com Logo e Data */}
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-1 print:pb-1 print:mb-1">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-14 print:h-12 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-800 leading-tight print:text-xs print:leading-tight">
                ACOMPANHAMENTO DE USINAGEM
              </h1>
            </div>
            <div className="flex justify-end items-start">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(ensaio.data)}</p>
              </div>
            </div>
          </header>

          <main className="text-sm print:text-sm">
            {/* DADOS DA OBRA */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-2 py-1 font-bold text-center mb-1 text-[9px] leading-tight print:px-1 print:py-0.5 print:mb-0.5">
              DADOS DA OBRA
            </div>

            <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mb-1 text-[10px] leading-tight px-1 py-1.5 print:gap-x-1 print:gap-y-1 print:mb-0.5 print:px-0.5 print:py-1">
              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">CLIENTE:</p>
                <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">TRECHO:</p>
                <p className="text-gray-900">{ensaio.trecho || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">PEDREIRA:</p>
                <p className="text-gray-900">{ensaio.pedreira || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">OBRA:</p>
                <p className="text-gray-900">{obra?.name || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">Nº PROJETO:</p>
                <p className="text-gray-900">{ensaio.numero_projeto || project?.name || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">FAIXA ESPECIFICADA:</p>
                <p className="text-gray-900">{ensaio.faixa_especificada || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">RODOVIA:</p>
                <p className="text-gray-900">{ensaio.rodovia || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">USINA:</p>
                <p className="text-gray-900">{ensaio.usina || 'N/A'}</p>
              </div>

              <div className="col-span-1 mb-1 print:mb-0.5">
                <p className="font-bold text-gray-700 mb-0.5 print:mb-0">LABORATORISTA:</p>
                <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
              </div>
            </div>

            {/* DADOS DO ENSAIO */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-2 py-1 font-bold text-center mb-1 mt-1 text-[9px] leading-tight print:px-1 print:py-0.5 print:mb-0.5 print:mt-0.5">
              DADOS DO ENSAIO
            </div>

            <div className="overflow-x-auto mb-1 print:mb-0.5">
              <table className="w-full border-collapse border border-slate-400 text-[9px] leading-tight table-fixed">
                <colgroup>
                  <col style={{width: '30%'}} />
                  <col style={{width: '20%'}} />
                  <col style={{width: '20%'}} />
                  <col style={{width: '15%'}} />
                  <col style={{width: '15%'}} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-200">
                    <th className="border border-slate-400 px-0.5 py-1.5 font-bold leading-tight text-[9px]">AGREGADOS</th>
                    <th className="border border-slate-400 px-0.5 py-1.5 font-bold leading-tight text-[9px]">COMPOSIÇÃO<br/>(%)</th>
                    <th className="border border-slate-400 px-0.5 py-1.5 font-bold leading-tight text-[9px]">UMIDADE<br/>(%)</th>
                    <th colSpan="2" className="border border-slate-400 px-0.5 py-1.5 font-bold text-center leading-tight text-[9px]">TEMPERATURAS</th>
                  </tr>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 px-0.5 py-1.5"></th>
                    <th className="border border-slate-400 px-0.5 py-1.5"></th>
                    <th className="border border-slate-400 px-0.5 py-1.5"></th>
                    <th className="border border-slate-400 px-0.5 py-1.5 font-bold leading-tight text-[9px]">T1 (°C)</th>
                    <th className="border border-slate-400 px-0.5 py-1.5 font-bold leading-tight text-[9px]">T2 (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-slate-400 px-0.5 py-1.5 font-semibold text-[9px]">LIGANTE</td>
                    <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{ensaio.ligante_nome || '-'}</td>
                    <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">-</td>
                    <td className="border border-slate-400 px-0.5 py-1.5 text-center font-semibold text-[9px]">{ensaio.temperatura_ligante || '-'}</td>
                    <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">-</td>
                  </tr>
                  {ensaio.agregados?.map((agregado, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border border-slate-400 px-0.5 py-1.5 font-semibold text-[9px]">{agregado.nome || `Agregado ${idx + 1}`}</td>
                      <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{agregado?.composicao || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{agregado?.umidade || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{agregado?.temperatura_t1 || '-'}</td>
                      <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{agregado?.temperatura_t2 || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABELA DE CARGAS - Sempre 20 linhas por página */}
            {(() => {
              const cargas = ensaio.cargas || [];
              const cargasPorPagina = 20;
              const totalPaginas = cargas.length > cargasPorPagina ? Math.ceil(cargas.length / cargasPorPagina) : 1;

              return Array.from({ length: totalPaginas }, (_, pageIdx) => {
                const startIdx = pageIdx * cargasPorPagina;
                const endIdx = startIdx + cargasPorPagina;
                const cargasPagina = cargas.slice(startIdx, endIdx);
                const linhasVazias = cargasPorPagina - cargasPagina.length;

                return (
                  <div key={pageIdx} className={`overflow-x-auto mb-0 print:mb-0 mt-0 ${pageIdx > 0 ? 'print:break-before-page' : ''}`}>
                    {pageIdx > 0 && (
                      <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-1 print:pb-1 print:mb-1 print:mt-0">
                        <div className="flex justify-start">
                          <img 
                            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                            alt="Logo Regional" 
                            className="h-14 print:h-12 object-contain" 
                          />
                        </div>
                        <div className="text-center">
                          <h1 className="text-sm font-bold text-gray-800 leading-tight print:text-xs print:leading-tight">
                            ACOMPANHAMENTO DE USINAGEM
                          </h1>
                        </div>
                        <div className="flex justify-end items-start">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(ensaio.data)}</p>
                          </div>
                        </div>
                      </header>
                    )}
                    <table className="w-full border-collapse border border-slate-400 text-[9px] leading-tight table-fixed">
                      <colgroup>
                        <col style={{width: '15%'}} />
                        <col style={{width: '12%'}} />
                        <col style={{width: '8%'}} />
                        <col style={{width: '12%'}} />
                        <col style={{width: '12%'}} />
                        <col style={{width: '41%'}} />
                      </colgroup>
                      <thead className="bg-slate-200">
                        <tr>
                          <th className="border border-slate-400 px-0.5 py-1 font-bold leading-tight text-[9px]">PLACA CAMINHÃO</th>
                          <th className="border border-slate-400 px-0.5 py-1 font-bold leading-tight text-[9px]">HORA DE SAÍDA</th>
                          <th className="border border-slate-400 px-0.5 py-1 font-bold leading-tight text-[9px]">PESO<br/>(t)</th>
                          <th className="border border-slate-400 px-0.5 py-1 font-bold leading-tight text-[9px]">TEMPERATURA<br/>(°C)</th>
                          <th className="border border-slate-400 px-0.5 py-1 font-bold leading-tight text-[9px]">TEMPERATURA<br/>(°C)</th>
                          <th className="border border-slate-400 px-0.5 py-1 font-bold leading-tight text-[9px]">OBSERVAÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cargasPagina.map((carga, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{carga.placa_caminhao || '-'}</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{carga.hora_saida || '-'}</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{carga.peso || '-'}</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{carga.temperatura_1 || '-'}</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">{carga.temperatura_2 || '-'}</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-[9px]">{carga.observacao || '-'}</td>
                          </tr>
                        ))}
                        {Array.from({ length: linhasVazias }, (_, idx) => (
                          <tr key={`empty-${idx}`} className={(cargasPagina.length + idx) % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">-</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">-</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">-</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">-</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-center text-[9px]">-</td>
                            <td className="border border-slate-400 px-0.5 py-1.5 text-[9px]">-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              });
            })()}

            </main>

          {/* Assinaturas */}
          <footer className="mt-8 px-1.5 print:break-inside-avoid print:mt-4 print:px-0.5">
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
    </>
  );
}