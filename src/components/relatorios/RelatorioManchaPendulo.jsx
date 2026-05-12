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
  if (valor < 25) return 'Perigosa';
  if (valor >= 25 && valor <= 31) return 'Muito Lisa';
  if (valor >= 32 && valor <= 39) return 'Lisa';
  if (valor >= 40 && valor <= 46) return 'Insuf. Rugosa';
  if (valor >= 47 && valor <= 54) return 'Median. Rugosa';
  if (valor >= 55 && valor <= 75) return 'Rugosa';
  if (valor > 75) return 'Muito Rugosa';
  return '';
};

import SignatureFooter from './SignatureFooter';

export default function RelatorioManchaPendulo({ ensaio, obra, regional }) {
  if (!ensaio) {
    return <div className="p-8 text-center">Carregando dados do ensaio...</div>;
  }

  const ReportHeader = () => (
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0 mb-0">
      <div className="flex justify-start">
        <picture><source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} /><img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo Regional" className="h-9 object-contain" width="auto" height="36" /></picture>
      </div>
      <div className="text-center">
        <h1 className="text-sm font-bold text-gray-800 leading-tight">
          ENSAIO DE MACROTEXTURA E MICROTEXTURA
        </h1>
      </div>
      <div className="flex justify-end">
        <div className="text-[11px] text-gray-600 border border-slate-300 rounded px-1 py-0">
          {formatDate(ensaio.data_ensaio)}
        </div>
      </div>
    </header>
  );

  const DadosCliente = () => (
    <div className="mt-1.5">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-1.5 py-0 font-bold text-center mb-0 text-[11px]">
        DADOS DO CLIENTE
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-0 mb-0 text-[10px] leading-tight">
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
          <p className="font-bold text-gray-700">ORGAO:</p>
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
      <div className="w-full max-w-[210mm] mx-auto bg-white p-1 print:p-1 print:min-h-[297mm]" style={{ minHeight: '100vh' }}>
        <ReportHeader />
        <DadosCliente />

        {/* Dados do Ensaio - Mancha de Areia */}
         <div className="mb-0 print:break-inside-avoid">
           <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-1.5 py-0 font-bold text-center mb-0 text-[11px]">
             DADOS DO ENSAIO
           </div>
           <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[9px] border">
             MANCHA DE AREIA - MÉTODO ABNT NBR 16504:2016
           </div>

           <table className="w-full border-collapse text-[8px]">
            <thead>
              <tr>
                <th className="px-1 py-0.5 font-semibold">DATA<br/>APLICAÇÃO</th>
                <th className="px-1 py-0.5 font-semibold">ESTACA</th>
                <th className="px-1 py-0.5 font-semibold">FAIXA /<br/>PISTA</th>
                <th className="px-1 py-0.5 font-semibold">BORDO</th>
                <th className="px-1 py-0.5 font-semibold">VOLUME<br/>DE AREIA<br/>(mm³)</th>
                <th className="px-1 py-0.5 font-semibold">D1 (Ø)<br/>(mm)</th>
                <th className="px-1 py-0.5 font-semibold">D2 (Ø)<br/>(mm)</th>
                <th className="px-1 py-0.5 font-semibold">D3 (Ø)<br/>(mm)</th>
                <th className="px-1 py-0.5 font-semibold">D4 (Ø)<br/>(mm)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ width: '10%' }}>D(Ø) MÉDIA<br/>(mm)</th>
                <th className="px-1 py-0.5 font-semibold" style={{ width: '10%' }}>HS<br/>(mm)</th>
                <th className="px-1 py-0.5 font-semibold">TIPO DE<br/>SUPERFÍCIE</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }, (_, idx) => {
                const e = ensaio.ensaios_mancha?.[idx];
                const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50';
                return (
                  <tr key={idx} className={bgColor} style={{ height: '18px' }}>
                    <td className="px-0.5 py-0 text-center">{e ? formatDate(e.data_aplicacao) : ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.estaca || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.faixa_pista || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.bordo || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e ? '25000' : ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.d1 ? e.d1.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.d2 ? e.d2.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.d3 ? e.d3.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.d4 ? e.d4.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold">{e?.d_media ? e.d_media.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold">{e?.hs_mm ? e.hs_mm.toFixed(2) : ''}</td>
                    <td className="px-0.5 py-0 text-center text-[6px]">{e?.tipo_superficie || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pêndulo Britânico */}
         <div className="mb-0 print:break-inside-avoid">
           <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[9px] border">
             PÊNDULO BRITÂNICO - MÉTODO ABNT NBR 16780:2019
           </div>

           <table className="w-full border-collapse text-[8px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="px-0.5 py-0.5 font-semibold text-center">DATA<br/>APLICAÇÃO</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">ESTACA</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">FAIXA /<br/>PISTA</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">BORDO</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">TEMP. DO<br/>PAVIMENTO<br/>(°C)</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">1º</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">2º</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">3º</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">4º</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">5º</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">MÁXIMA</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">MÍNIMA</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">VRD</th>
                <th className="px-0.5 py-0.5 font-semibold text-center">CLASSE</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }, (_, idx) => {
                const e = ensaio.ensaios_pendulo?.[idx];
                const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50';
                return (
                  <tr key={idx} className={bgColor} style={{ height: '18px' }}>
                    <td className="px-0.5 py-0 text-center">{e ? formatDate(e.data_aplicacao) : ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.estaca || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.faixa_pista || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.bordo || ''}</td>
                    <td className="px-0.5 py-0 text-center" style={{ width: '48px' }}>{e?.temp_pavimento || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.leitura_1 || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.leitura_2 || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.leitura_3 || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.leitura_4 || ''}</td>
                    <td className="px-0.5 py-0 text-center">{e?.leitura_5 || ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold">{e?.maxima ? e.maxima.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold">{e?.minima ? e.minima.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center font-semibold">{e?.vrd ? e.vrd.toFixed(1) : ''}</td>
                    <td className="px-0.5 py-0 text-center text-[6px]">{e?.vrd ? getClassificacaoVRD(e.vrd) : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resultados */}
         <div className="mb-0 print:break-inside-avoid">
           <div className="bg-slate-200 px-1.5 py-0 font-bold text-center text-[9px]">
             RESULTADOS
           </div>
           <div className="grid grid-cols-2 gap-1 text-[9px] p-0.5">
             <div>
               <p className="font-bold text-gray-700">MANCHA DE AREIA:</p>
               <p className="text-gray-600 text-[9px] mt-0">LIMITES ESTABELECIDOS</p>
               <p className="text-gray-900">{ensaio.limites_mancha || '0,6mm ≤ HS ≤ 1,2mm'}</p>
               {ensaio.ensaios_mancha && ensaio.ensaios_mancha.length > 0 && (() => {
                 const validHs = ensaio.ensaios_mancha.filter(e => e.hs_mm != null).map(e => e.hs_mm);
                 const mediaHs = validHs.length > 0 ? (validHs.reduce((sum, val) => sum + val, 0) / validHs.length).toFixed(2) : null;
                 return mediaHs && (
                   <p className="text-gray-900 mt-0">
                     <span className="font-semibold">MÉDIA:</span> {mediaHs} mm
                   </p>
                 );
               })()}
             </div>
             <div>
               <p className="font-bold text-gray-700">PÊNDULO BRITÂNICO:</p>
               <p className="text-gray-600 text-[9px] mt-0">LIMITES ESTABELECIDOS</p>
               <p className="text-gray-900">{ensaio.limites_pendulo || 'VRD ≥ 47'}</p>
               {ensaio.ensaios_pendulo && ensaio.ensaios_pendulo.length > 0 && (() => {
                 const validVrd = ensaio.ensaios_pendulo.filter(e => e.vrd != null).map(e => e.vrd);
                 const mediaVrd = validVrd.length > 0 ? (validVrd.reduce((sum, val) => sum + val, 0) / validVrd.length).toFixed(1) : null;
                 return mediaVrd && (
                   <p className="text-gray-900 mt-0">
                     <span className="font-semibold">MÉDIA:</span> {mediaVrd}
                   </p>
                 );
               })()}
             </div>
           </div>
           <div className="px-1.5 py-0.5 border-t">
             <p className="text-[9px] font-bold text-center mb-0">CONDIÇÃO DE CONFORMIDADE</p>
             <p className={`text-center font-bold text-[11px] ${ensaio.condicao_conformidade === 'CONFORME' ? 'text-green-700' : 'text-red-700'}`}>
               {ensaio.condicao_conformidade || 'NÃO INFORMADO'}
             </p>
           </div>
         </div>

        {/* Observações */}
         {ensaio.observacoes && (
           <div className="mb-0 print:break-inside-avoid">
             <div className="bg-slate-200 px-1.5 py-0 font-bold text-[9px]">OBSERVAÇÕES</div>
             <div className="p-0.5 text-[9px] min-h-[15px] border">
               <div className="whitespace-pre-wrap">{ensaio.observacoes}</div>
             </div>
           </div>
         )}

        {/* Assinaturas */}
         <footer className="mt-4 pt-2 print:break-inside-avoid">
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
  );
}