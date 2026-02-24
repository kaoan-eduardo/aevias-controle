import React from 'react';

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

const getClassificacaoVRD = (vrd) => {
  if (!vrd && vrd !== 0) return '';
  const valor = parseFloat(vrd);
  if (valor < 25) return 'PERIGOSA';
  if (valor >= 25 && valor <= 31) return 'MUITO LISA';
  if (valor >= 32 && valor <= 39) return 'LISA';
  if (valor >= 40 && valor <= 46) return 'INSUF. RUGOSA';
  if (valor >= 47 && valor <= 54) return 'MEDIAN. RUGOSA';
  if (valor >= 55 && valor <= 75) return 'RUGOSA';
  if (valor > 75) return 'MUITO RUGOSA';
  return '';
};

export default function RelatorioManchaPendulo({ ensaio, obra, regional }) {
  if (!ensaio) {
    return <div className="p-8 text-center">Carregando dados do ensaio...</div>;
  }

  const ReportHeader = () => (
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-2">
      <div className="flex justify-start">
        <img 
          src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
          alt="Logo Regional" 
          className="h-12 object-contain" 
        />
      </div>
      <div className="text-center">
        <h1 className="text-sm font-bold text-gray-800 leading-tight">
          ENSAIO DE MACROTEXTURA E MICROTEXTURA
        </h1>
      </div>
      <div className="flex justify-end">
        <div className="text-xs text-gray-600 border border-slate-300 rounded px-2 py-0.5">
          {formatDate(ensaio.data_ensaio)}
        </div>
      </div>
    </header>
  );

  const DadosCliente = () => (
    <div className="mb-2">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-0.5 font-bold text-center mb-0 text-xs">
        DADOS DO CLIENTE
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-0 mb-0 text-[10px]">
        <div>
          <p className="font-bold text-gray-700">CLIENTE:</p>
          <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">RODOVIA:</p>
          <p className="text-gray-900">{ensaio.rodovia || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">PISTA:</p>
          <p className="text-gray-900">{ensaio.pista || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">OBRA:</p>
          <p className="text-gray-900">{obra?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">TRECHO:</p>
          <p className="text-gray-900">{ensaio.trecho || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">LABORATORISTA:</p>
          <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">ÓRGÃO:</p>
          <p className="text-gray-900">{ensaio.orgao || 'N/A'}</p>
        </div>
        <div className="col-span-2">
          <p className="font-bold text-gray-700">CAMADA:</p>
          <p className="text-gray-900">{ensaio.camada || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white font-sans">
      <div className="w-full max-w-[210mm] mx-auto bg-white p-3 print:p-3 print:min-h-[297mm]" style={{ minHeight: '100vh' }}>
        <ReportHeader />
        <DadosCliente />

        {/* Dados do Ensaio - Mancha de Areia */}
        <div className="mb-1">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-0.5 font-bold text-center mb-0 text-xs">
            DADOS DO ENSAIO
          </div>
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-center text-[9px]">
            MANCHA DE AREIA - MÉTODO ABNT NBR 16504:2016
          </div>
          
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>DATA<br/>APLICAÇÃO</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>ESTACA</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>FAIXA /<br/>PISTA</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>BORDO</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>VOLUME<br/>DE AREIA<br/>(mm³)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>D1 (Ø)<br/>(mm)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>D2 (Ø)<br/>(mm)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>D3 (Ø)<br/>(mm)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>D4 (Ø)<br/>(mm)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>D(Ø) MÉDIA<br/>(mm)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>ÁREA<br/>(cm²)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>HS<br/>(cm)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>HS<br/>(mm)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>TIPO DE<br/>SUPERFÍCIE</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }, (_, idx) => {
                const e = ensaio.ensaios_mancha?.[idx];
                return (
                  <tr key={idx} style={{ height: '24px' }}>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e ? formatDate(e.data_aplicacao) : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.estaca || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.faixa_pista || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.bordo || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e ? '25000' : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.d1 ? e.d1.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.d2 ? e.d2.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.d3 ? e.d3.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.d4 ? e.d4.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.d_media ? e.d_media.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.area ? e.area.toFixed(2) : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.hs_cm ? e.hs_cm.toFixed(2) : ''}</td>
                    <td className="border px-1 py-1 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.hs_mm ? e.hs_mm.toFixed(2) : ''}</td>
                    <td className="border px-1 py-1 text-center text-[7px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.tipo_superficie || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pêndulo Britânico */}
        <div className="mb-1">
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-center text-[9px]">
            PÊNDULO BRITÂNICO - MÉTODO ABNT NBR 16780:2019
          </div>
          
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>DATA<br/>APLICAÇÃO</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>ESTACA</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>FAIXA /<br/>PISTA</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>BORDO</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>TEMP. DO<br/>PAVIMENTO<br/>(°C)</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>1º</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>2º</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>3º</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>4º</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>5º</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>MÁXIMA</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>MÍNIMA</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>VRD</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>CLASSE</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }, (_, idx) => {
                const e = ensaio.ensaios_pendulo?.[idx];
                return (
                  <tr key={idx} style={{ height: '24px' }}>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e ? formatDate(e.data_aplicacao) : ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.estaca || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.faixa_pista || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.bordo || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.temp_pavimento || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.leitura_1 || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.leitura_2 || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.leitura_3 || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.leitura_4 || ''}</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.leitura_5 || ''}</td>
                    <td className="border px-1 py-1 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.maxima ? e.maxima.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.minima ? e.minima.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.vrd ? e.vrd.toFixed(1) : ''}</td>
                    <td className="border px-1 py-1 text-center text-[8px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e?.vrd ? getClassificacaoVRD(e.vrd) : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resultados */}
        <div className="mb-2">
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-center text-[9px]">
            RESULTADOS
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] p-2">
            <div>
              <p className="font-bold text-gray-700">MANCHA DE AREIA:</p>
              <p className="text-gray-600 text-[9px] mt-1">LIMITES ESTABELECIDOS</p>
              <p className="text-gray-900">{ensaio.limites_mancha || '0,6mm ≤ HS ≤ 1,2mm'}</p>
              {ensaio.ensaios_mancha && ensaio.ensaios_mancha.length > 0 && (() => {
                const validHs = ensaio.ensaios_mancha.filter(e => e.hs_mm != null).map(e => e.hs_mm);
                const mediaHs = validHs.length > 0 ? (validHs.reduce((sum, val) => sum + val, 0) / validHs.length).toFixed(2) : null;
                return mediaHs && (
                  <p className="text-gray-900 mt-2">
                    <span className="font-semibold">MÉDIA:</span> {mediaHs} mm
                  </p>
                );
              })()}
            </div>
            <div>
              <p className="font-bold text-gray-700">PÊNDULO BRITÂNICO:</p>
              <p className="text-gray-600 text-[9px] mt-1">LIMITES ESTABELECIDOS</p>
              <p className="text-gray-900">{ensaio.limites_pendulo || 'VRD ≥ 47'}</p>
              {ensaio.ensaios_pendulo && ensaio.ensaios_pendulo.length > 0 && (() => {
                const validVrd = ensaio.ensaios_pendulo.filter(e => e.vrd != null).map(e => e.vrd);
                const mediaVrd = validVrd.length > 0 ? (validVrd.reduce((sum, val) => sum + val, 0) / validVrd.length).toFixed(1) : null;
                return mediaVrd && (
                  <p className="text-gray-900 mt-2">
                    <span className="font-semibold">MÉDIA:</span> {mediaVrd}
                  </p>
                );
              })()}
            </div>
          </div>
          <div className="border-t px-2 py-2" style={{ borderColor: 'rgb(148, 163, 184)' }}>
            <p className="text-[9px] font-bold text-center mb-1">CONDIÇÃO DE CONFORMIDADE</p>
            <p className={`text-center font-bold text-sm ${ensaio.condicao_conformidade === 'CONFORME' ? 'text-green-700' : 'text-red-700'}`}>
              {ensaio.condicao_conformidade || 'NÃO INFORMADO'}
            </p>
          </div>
        </div>

        {/* Observações */}
        {ensaio.observacoes && (
          <div className="mb-3">
            <div className="bg-slate-200 px-2 py-0.5 font-bold text-[9px]">OBSERVAÇÕES</div>
            <div className="border p-2 text-[10px] min-h-[40px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>
              <div className="whitespace-pre-wrap">{ensaio.observacoes}</div>
            </div>
          </div>
        )}

        {/* Assinaturas */}
        <footer className="mt-4 pt-3 print:break-inside-avoid">
          <div className="grid grid-cols-3 gap-4 items-end px-4">
            <div className="text-center">
              <div className="text-[9px] text-slate-500 mb-1 min-h-[48px] flex flex-col justify-end items-center">
                {ensaio.laboratorista_name && (
                  <>
                    <p className="font-bold text-slate-600">{ensaio.laboratorista_name}</p>
                    <p className="text-[8px]">{ensaio.created_by}</p>
                    <p className="text-[8px]">em {formatDateBrasilia(ensaio.created_date)}</p>
                  </>
                )}
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-[9px] font-semibold">LABORATORISTA RESPONSÁVEL</p>
              </div>
            </div>

            <div className="text-center">
              {ensaio.approver_details ? (
                <>
                  <div className="text-[9px] text-slate-500 mb-1 min-h-[48px] flex flex-col justify-end items-center">
                    <p className="font-bold text-slate-600">{ensaio.approver_details.name}</p>
                    <p className="text-[8px]">{ensaio.approved_by}</p>
                    {ensaio.approver_details.crea_number && <p className="text-[8px]">CREA: {ensaio.approver_details.crea_number}</p>}
                    <p className="text-[8px]">em {formatDateBrasilia(ensaio.approved_date)}</p>
                  </div>
                  <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                    <p className="text-[9px] font-semibold">ENGENHEIRO RESPONSÁVEL</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[48px] mb-1"></div>
                  <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                    <p className="text-[9px] font-semibold">ENGENHEIRO RESPONSÁVEL</p>
                  </div>
                </>
              )}
            </div>

            <div className="text-center">
              {ensaio.client_signature?.signed_by ? (
                <>
                  <div className="text-[9px] text-slate-500 mb-1 min-h-[48px] flex flex-col justify-end items-center">
                    <p className="font-bold text-slate-600">{ensaio.client_signature.engineer_name}</p>
                    <p className="text-[8px]">{ensaio.client_signature.signed_by}</p>
                    {ensaio.client_signature.crea_number && <p className="text-[8px]">CREA: {ensaio.client_signature.crea_number}</p>}
                    <p className="text-[8px]">em {formatDateBrasilia(ensaio.client_signature.signed_date)}</p>
                  </div>
                  <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                    <p className="text-[9px] font-semibold">ENGENHEIRO CLIENTE</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[48px] mb-1"></div>
                  <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                    <p className="text-[9px] font-semibold">ENGENHEIRO CLIENTE</p>
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