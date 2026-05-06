import React from "react";

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

import SignatureFooter from './SignatureFooter';

export default function RelatorioDensidadeInSitu({ ensaio, obra, regional }) {
  const furos = ensaio.furos || [];
  
  console.log('📊 DEBUG Relatório - densidade_areia:', ensaio.densidade_areia);
  console.log('📊 DEBUG Relatório - peso_areia_funil:', ensaio.peso_areia_funil);
  console.log('📊 DEBUG Relatório - ensaio completo:', ensaio);

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
          ENSAIO DE DENSIDADE "IN SITU"<br/>MÉTODO FRASCO DE AREIA
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">DNIT 458/25</p>
      </div>
      <div className="flex justify-end">
      </div>
    </header>
  );

  const DadosObra = () => (
    <div className="mb-2">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-0.5 font-bold text-center mb-0 text-xs">
        DADOS DA OBRA
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0 mb-0 text-[10px]">
        <div>
          <p className="font-bold text-gray-700">CLIENTE:</p>
          <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">MATERIAL:</p>
          <p className="text-gray-900">{ensaio.material || ''}</p>
        </div>

        <div>
          <p className="font-bold text-gray-700">OBRA:</p>
          <p className="text-gray-900">{obra?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">PROCEDÊNCIA:</p>
          <p className="text-gray-900">{ensaio.procedencia || ''}</p>
        </div>

        <div>
          <p className="font-bold text-gray-700">RODOVIA:</p>
          <p className="text-gray-900">{ensaio.rodovia || ''}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">DATA:</p>
          <p className="text-gray-900">{formatDate(ensaio.data_ensaio)}</p>
        </div>

        <div>
          <p className="font-bold text-gray-700">TRECHO:</p>
          <p className="text-gray-900">{ensaio.trecho || ''}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">HORÁRIO:</p>
          <p className="text-gray-900">{ensaio.horario || ''}</p>
        </div>

        <div>
          <p className="font-bold text-gray-700">CAMADA:</p>
          <p className="text-gray-900">{ensaio.camada || ''}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">LABORATORISTA:</p>
          <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
        </div>
      </div>
    </div>
  );



  const ReportFooter = () => (
    <footer className="mt-4 pt-3 print:break-inside-avoid">
      {ensaio.observacoes && (
        <div className="mb-3">
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px]">OBSERVAÇÕES</div>
          <div className="border border-slate-300 p-1 text-[10px] min-h-[20px]">
            {ensaio.observacoes}
          </div>
        </div>
      )}

      <div className="px-4">
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
        />
      </div>
    </footer>
  );



  return (
    <div className="bg-white font-sans">
      {/* Página Principal com todos os furos em colunas */}
      <div className="w-full max-w-[210mm] mx-auto bg-white p-6 print:p-6 print:min-h-[297mm]" style={{ minHeight: '100vh' }}>
        <ReportHeader />
        <DadosObra />
        
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-0.5 font-bold text-center mb-1 text-xs">
          DADOS DE ENSAIO
        </div>

        <table className="w-full border-collapse text-[9px]">
          <tbody>
            <tr>
              <td className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>ESTACA</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.estaca || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)' }}>PISTA</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.pista || ''}</td>
              ))}
            </tr>

            <tr>
              <td colSpan={furos.length + 1} className="border px-1 py-1 font-semibold text-center text-[9px]" style={{ backgroundColor: 'hsl(214.29deg 31.82% 91.37%)', borderColor: 'rgb(148, 163, 184)' }}>
                ENSAIO DE DENSIDADE "IN SITU" - DNIT 458/25
              </td>
            </tr>

            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO AREIA NO FUNIL (g)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>
                  {ensaio.peso_areia_funil !== null && ensaio.peso_areia_funil !== undefined ? ensaio.peso_areia_funil.toFixed(1) : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>DENSIDADE DA AREIA (g/cm³)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>
                  {ensaio.densidade_areia !== null && ensaio.densidade_areia !== undefined ? ensaio.densidade_areia.toFixed(3) : ''}
                </td>
              ))}
            </tr>
            {ensaio.substituicao_retido_3_4 && (
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>DENSIDADE REAL RETIDA 3/4" (g/cm³)</td>
                {furos.map((furo, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{ensaio.densidade_real_retida_3_4 || ''}</td>
                ))}
              </tr>
            )}
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PROFUNDIDADE DO FURO (cm)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.profundidade_furo || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO AREIA+GARRAFA, ANTES (g)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.peso_areia_garrafa_antes || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO AREIA+GARRAFA, APÓS (g)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.peso_areia_garrafa_apos || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO MATERIAL ÚMIDO NO FURO (g)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.peso_material_umido_furo || ''}</td>
              ))}
            </tr>
            {ensaio.substituicao_retido_3_4 && (
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO SOLO RETIDO 3/4" ÚMIDO (g)</td>
                {furos.map((furo, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.peso_solo_retido_3_4_umido || ''}</td>
                ))}
              </tr>
            )}
            <tr>
              <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>DENSIDADE ÚMIDA DO FURO (g/cm³)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.densidade_umida_furo?.toFixed(3) || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>DENSIDADE SECA DO SOLO (g/cm³)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.densidade_seca_solo?.toFixed(3) || ''}</td>
              ))}
            </tr>

            <tr>
              <td colSpan={furos.length + 1} className="border px-1 py-1 font-semibold text-center text-[9px]" style={{ backgroundColor: 'hsl(214.29deg 31.82% 91.37%)', borderColor: 'rgb(148, 163, 184)' }}>
                DADOS DO PROCTOR
              </td>
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>DENS. SECA MÁX. (g/cm³)</td>
              {furos.map((_, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{ensaio.dados_proctor?.densidade_seca_max?.toFixed(3) || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>UMIDADE ÓTIMA (%)</td>
              {furos.map((_, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{ensaio.dados_proctor?.umidade_otima || ''}</td>
              ))}
            </tr>

            <tr>
              <td colSpan={furos.length + 1} className="border px-1 py-1 font-semibold text-center text-[9px]" style={{ backgroundColor: 'hsl(214.29deg 31.82% 91.37%)', borderColor: 'rgb(148, 163, 184)' }}>
                RESULTADOS
              </td>
            </tr>

            <tr>
              <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>DESVIO DE UMIDADE (%)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.desvio_umidade?.toFixed(2) || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>GRAU DE COMPACTAÇÃO (%)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.grau_compactacao?.toFixed(2) || ''}</td>
              ))}
            </tr>

            <tr>
              <td colSpan={furos.length + 1} className="border px-1 py-1 font-semibold text-center text-[9px]" style={{ backgroundColor: 'hsl(214.29deg 31.82% 91.37%)', borderColor: 'rgb(148, 163, 184)' }}>
                ENSAIO DE UMIDADE "IN SITU" (hₐ) - NBR 16097/2012
              </td>
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>TARA DA FRIGIDEIRA (g)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.tara_frigideira || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>MATERIAL ÚMIDO+FRIGIDEIRA (g)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.material_umido_frigideira || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>MATERIAL SECO+FRIGIDEIRA (g)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.material_seco_frigideira || ''}</td>
              ))}
            </tr>
            <tr>
              <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>UMIDADE (%)</td>
              {furos.map((furo, i) => (
                <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{furo.umidade?.toFixed(2) || ''}</td>
              ))}
            </tr>
          </tbody>
        </table>

        <ReportFooter />
        </div>
    </div>
  );
}