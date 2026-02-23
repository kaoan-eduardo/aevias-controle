import React from 'react';

const SectionTitle = ({ children }) => (
  <h2 className="text-sm print:text-xs font-bold text-center bg-slate-100 p-0.5 my-0.5 uppercase tracking-wider">{children}</h2>
);

const ReportPrintHeader = ({ acompanhamento, obra, regional }) => (
  <>
    <div className="print:hidden">
      <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-2">
        <div className="flex justify-start">
          <img 
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
            alt="Logo Regional" 
            className="h-10 object-contain" 
          />
        </div>
        <div className="text-center">
          <h1 className="text-sm font-bold text-gray-800 whitespace-nowrap">Acompanhamento de Aplicação de CAUQ</h1>
        </div>
        <div className="flex justify-end">
          <div className="border border-gray-400 p-1 rounded-md text-xs">
            <p className="font-semibold text-gray-800">
              {new Date(acompanhamento.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </p>
          </div>
        </div>
      </header>
    </div>

    <div className="hidden print:block mb-4">
      <div className="grid grid-cols-3 items-start border-b-2 border-slate-900 pb-2">
        <div className="flex justify-start">
          <img 
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
            alt="Logo Regional" 
            className="h-12 object-contain" 
          />
        </div>
        <div className="text-center">
          <h1 className="text-base font-bold text-gray-800">Acompanhamento de Aplicação de CAUQ</h1>
        </div>
        <div className="flex justify-end">
          <div className="border border-gray-400 px-2 py-1 rounded text-sm">
            <p className="font-semibold text-gray-800">
              {new Date(acompanhamento.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default function RelatorioAcompanhamentoCarga({ acompanhamento, obra, regional, projeto, faixaGranulometrica }) {
  if (!acompanhamento) {
    return <div className="p-8">Dados do acompanhamento não encontrados.</div>;
  }

  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    return new Date(normalizedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };

  const servicoLabel = acompanhamento.servico === 'remendos' ? 'Remendos' : 'Capa/Reperfilagem';

  return (
    <div className="bg-white font-sans">
      <div className="p-4 print:p-6 flex flex-col" style={{ minHeight: '100vh' }}>
        <div className="w-full mx-auto flex flex-col">
          <ReportPrintHeader acompanhamento={acompanhamento} obra={obra} regional={regional} />
          
          <main className="text-xs mt-1 print:mt-3">
            <SectionTitle>Dados da Obra</SectionTitle>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 print:gap-y-1.5 mt-1" style={{ fontSize: '10px' }}>
              <div>
                <p className="font-bold">CLIENTE:</p>
                <p>{regional?.cliente || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">TRECHO:</p>
                <p>{acompanhamento.trecho || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">N° DO PROJETO:</p>
                <p>{projeto?.name || 'N/A'}</p>
              </div>

              <div>
                <p className="font-bold">RODOVIA:</p>
                <p>{acompanhamento.rodovia || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">SUB-TRECHO:</p>
                <p>{acompanhamento.sub_trecho || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">LABORATORISTA:</p>
                <p>{acompanhamento.laboratorista_name || 'N/A'}</p>
              </div>

              <div>
                <p className="font-bold">OBRA:</p>
                <p>{obra?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">USINA FORNECEDORA:</p>
                <p>{acompanhamento.usina_fornecedora || 'N/A'}</p>
              </div>

              <div>
                <p className="font-bold">SERVIÇO:</p>
                <p>{servicoLabel}</p>
              </div>
              <div>
                <p className="font-bold">FAIXA ESPECIFICADA:</p>
                <p>{faixaGranulometrica?.nome || 'N/A'}</p>
              </div>
            </div>
          </main>

          <div className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '9px' }}>
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-1 text-center font-bold" colSpan="4">DADOS DA USINA</th>
                    <th className="border border-slate-300 p-1 text-center font-bold" colSpan="10">DADOS DA PISTA</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-1">N°<br/>CARGA</th>
                    <th className="border border-slate-300 p-1">PLACA</th>
                    <th className="border border-slate-300 p-1">HORA<br/>SAÍDA</th>
                    <th className="border border-slate-300 p-1">PESO<br/>(t)</th>
                    <th className="border border-slate-300 p-1">HORA DE<br/>CHEGADA</th>
                    <th className="border border-slate-300 p-1">TEMP. DE<br/>CHEGADA<br/>(°C)</th>
                    <th className="border border-slate-300 p-1">HORA DE<br/>APLICAÇÃO</th>
                    <th className="border border-slate-300 p-1">TEMP. DE<br/>ESPALHAM.<br/>(°C)</th>
                    <th className="border border-slate-300 p-1">TEMP. DE<br/>COMPACT.<br/>(°C)</th>
                    <th className="border border-slate-300 p-1">PISTA</th>
                    <th className="border border-slate-300 p-1">ESPESSURA<br/>(cm)</th>
                    <th className="border border-slate-300 p-1 text-center" colSpan="2">ESTACAS</th>
                    <th className="border border-slate-300 p-1">OBSERVAÇÕES</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-0" colSpan="4"></th>
                    <th className="border border-slate-300 p-0" colSpan="7"></th>
                    <th className="border border-slate-300 p-1 text-xs">INICIAL</th>
                    <th className="border border-slate-300 p-1 text-xs">FINAL</th>
                    <th className="border border-slate-300 p-0"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }).map((_, index) => {
                    const carga = acompanhamento.cargas?.[index];
                    return (
                      <tr key={index} className="even:bg-slate-50">
                        <td className="border border-slate-300 p-1 text-center">{index + 1}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.placa || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.hora_saida || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.peso_toneladas || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.hora_chegada || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.temp_chegada || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.hora_aplicacao || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.temp_espalhamento || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.temp_compactacao || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.pista || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.espessura_cm || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.estaca_inicial || ''}</td>
                        <td className="border border-slate-300 p-1 text-center">{carga?.estaca_final || ''}</td>
                        <td className="border border-slate-300 p-1" style={{ fontSize: '8px' }}>{carga?.observacoes || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {acompanhamento.observacoes_gerais && (
              <div className="mt-3 print:mt-4">
                <p className="font-bold text-xs">OBSERVAÇÕES GERAIS:</p>
                <p className="text-xs mt-1">{acompanhamento.observacoes_gerais}</p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 print:pt-6 break-inside-avoid">
            <div className="grid grid-cols-3 gap-8 items-end print:gap-12">
              <div className="text-center">
                <div className="text-slate-500 mb-2 h-12 flex flex-col justify-end items-center" style={{ fontSize: '9px' }}>
                  <p className="font-bold text-slate-600">{acompanhamento.laboratorista_name}</p>
                  <p>{acompanhamento.created_by}</p>
                  <p className="text-xs">em {formatDateBrasilia(acompanhamento.created_date)}</p>
                </div>
                <div className="border-t border-gray-600 pt-1"><p style={{ fontSize: '9px' }}>Laboratorista Responsável</p></div>
              </div>
              
              <div className="text-center">
                {acompanhamento.approved === true && acompanhamento.approver_details ? (
                  <>
                    <div className="text-slate-500 mb-2 h-12 flex flex-col justify-end items-center" style={{ fontSize: '9px' }}>
                      <p className="font-bold text-slate-600">{acompanhamento.approver_details.name}</p>
                      <p>{acompanhamento.approved_by}</p>
                      {acompanhamento.approver_details.crea_number && <p>CREA: {acompanhamento.approver_details.crea_number}</p>}
                      <p className="text-xs">em {formatDateBrasilia(acompanhamento.approved_date)}</p>
                    </div>
                    <div className="border-t border-gray-600 pt-1"><p style={{ fontSize: '9px' }}>Engenheiro Responsável</p></div>
                  </>
                ) : (
                  <>
                    <div className="h-12 mb-2"></div>
                    <div className="border-t border-gray-600 pt-1"><p style={{ fontSize: '9px' }}>Engenheiro Responsável</p></div>
                  </>
                )}
              </div>

              <div className="text-center">
                {acompanhamento.client_signature?.signed_by ? (
                  <>
                    <div className="text-slate-500 mb-2 h-12 flex flex-col justify-end items-center" style={{ fontSize: '9px' }}>
                      <p>Assinado digitalmente por</p>
                      <p className="font-bold text-slate-600">{acompanhamento.client_signature.engineer_name}</p>
                      <p>{acompanhamento.client_signature.signed_by}</p>
                      {acompanhamento.client_signature.crea_number && <p>CREA: {acompanhamento.client_signature.crea_number}</p>}
                      <p className="text-xs">em {formatDateBrasilia(acompanhamento.client_signature.signed_date)}</p>
                    </div>
                    <div className="border-t border-gray-600 pt-1"><p style={{ fontSize: '9px' }}>Cliente</p></div>
                  </>
                ) : (
                  <>
                    <div className="h-12 mb-2"></div>
                    <div className="border-t border-gray-600 pt-1"><p style={{ fontSize: '9px' }}>Cliente</p></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}