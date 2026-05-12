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

export default function RelatorioTaxaPinturaImprimacao({ ensaio, obra, regional }) {
  const ensaios = ensaio.ensaios || [];
  const dimensoes = ensaio.dimensoes_bandeja || {};

  const ReportHeader = () => (
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0 mb-0">
      <div className="flex justify-start">
        <picture>
          <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
          <img 
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
            alt="Logo Regional" 
            className="h-10 print:h-7 object-contain"
            width="auto" height="40"
            loading="lazy"
          />
        </picture>
      </div>
      <div className="text-center">
        <h1 className="text-xs font-bold text-gray-800 leading-tight print:text-[9px] print:leading-tight">
          ENSAIO DE TAXA DE PINTURAS ASFÁLTICAS<br/>E RESÍDUO DA EMULSÃO
        </h1>
        <p className="text-[10px] text-gray-500 mt-0.5 print:text-[7px] print:mt-0">(DNIT 145/2012 - ES)</p>
      </div>
      <div className="flex justify-end items-start">
        <div className="text-right">
        </div>
      </div>
    </header>
  );

  const DadosObra = () => (
    <div className="mb-0 print:mb-0">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-1 py-0 font-bold text-center mb-0 text-[8px] leading-tight print:text-[8px]">
        DADOS DA OBRA
      </div>
      <div className="grid grid-cols-3 gap-x-1 gap-y-0 mb-0 text-[9px] leading-tight print:text-[9px]">
        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">CLIENTE:</p>
          <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
        </div>
        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">MATERIAL:</p>
          <p className="text-gray-900">{ensaio.material || ''}</p>
        </div>
        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">PLACA CAMINHÃO:</p>
          <p className="text-gray-900">{ensaio.placa_caminhao || ''}</p>
        </div>

        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">OBRA:</p>
          <p className="text-gray-900">{obra?.name || 'N/A'}</p>
        </div>
        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">RODOVIA:</p>
          <p className="text-gray-900">{ensaio.rodovia || ''}</p>
        </div>
        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">DATA:</p>
          <p className="text-gray-900">{formatDate(ensaio.data_ensaio)}</p>
        </div>

        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">TRECHO:</p>
          <p className="text-gray-900">{ensaio.trecho || ''}</p>
        </div>
        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">ENSAIO REALIZADO POR:</p>
          <p className="text-gray-900">{ensaio.ensaio_realizado_por || 'N/A'}</p>
        </div>
        <div className="mb-0.5">
          <p className="font-bold text-gray-700 mb-0">LABORATORISTA:</p>
          <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const ReportFooter = () => (
    <footer className="print:break-inside-avoid print:absolute print:bottom-0 print:left-0 print:right-0 print:mx-auto print:max-w-[210mm] print:px-6">
      {ensaio.observacoes && (
        <div className="mb-3">
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px]">OBSERVAÇÕES</div>
          <div className="border border-slate-300 p-1 text-[10px] min-h-[20px]">
            {ensaio.observacoes}
          </div>
        </div>
      )}

      <div className="px-4 print:px-0">
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
    <div className="bg-white font-sans print:relative">
      <div className="w-full max-w-[210mm] mx-auto bg-white p-8 print:p-8 print:min-h-[297mm] print:pb-16" style={{ minHeight: '100vh' }}>
        <ReportHeader />
        <DadosObra />
        
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-1 py-0 font-bold text-center mb-0 text-[8px] leading-tight print:text-[8px]">
          DADOS DO ENSAIO
        </div>

        {/* Serviço */}
        <div className="mb-0 print:mb-0">
          <table className="w-full border-collapse text-[9px] print:text-[9px]">
            <tbody>
              <tr>
                <td className="border px-2 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', width: '40%' }}>SERVIÇO</td>
                <td className="border px-2 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>
                  <input type="checkbox" checked={ensaio.tipo_servico === 'imprimacao'} readOnly className="mr-1" />
                  IMPRIMAÇÃO
                </td>
                <td className="border px-2 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>
                  <input type="checkbox" checked={ensaio.tipo_servico === 'ligacao'} readOnly className="mr-1" />
                  LIGAÇÃO
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Área da Bandeja */}
        <div className="mb-0 print:mb-0">
          <div className="bg-slate-200 px-1 py-0 font-bold text-center text-[8px] leading-tight print:text-[8px]">ÁREA DA BANDEJA</div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', width: '30%' }}>Nº DA BANDEJA</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', width: '20%' }}>CÁLCULOS</th>
                <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', width: '12.5%' }}>UNIDADE</th>
                {ensaios.map((_, i) => (
                  <th key={i} className="border px-1 py-1 font-semibold text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>LADO 1</td>
                <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>L₁</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>cm</td>
                {ensaios.map((_, i) => (
                  <td key={`lado1-${i}`} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{dimensoes.lado_1 || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>LADO 2</td>
                <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>L₂</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>cm</td>
                {ensaios.map((_, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{dimensoes.lado_2 || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>ÁREA</td>
                <td className="border px-1 py-1 text-center italic text-[8px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>A = L₁ × L₂ / 10000</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>m²</td>
                {ensaios.map((_, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{dimensoes.area?.toFixed(4) || ''}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Execução do Ensaio */}
        <div className="mb-0 print:mb-0">
          <div className="bg-slate-200 px-1 py-0 font-bold text-center text-[8px] leading-tight print:text-[8px]">EXECUÇÃO DO ENSAIO</div>
          <table className="w-full border-collapse text-[9px]">
            <tbody>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)', width: '30%' }}>CAMADA</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)', width: '20%' }}>-</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)', width: '12.5%' }}>-</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.camada || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>MATERIAL DA CAMADA</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>-</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>-</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.material_camada || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>ESTACA DO ENSAIO</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>-</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>-</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.estaca || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>TEMP. DE APLICAÇÃO DO LIGANTE</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>-</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>°C</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.temperatura_aplicacao || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO DA BANDEJA+AMOSTRA</td>
                <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>P₁</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>g</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.peso_bandeja_amostra || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO DA BANDEJA</td>
                <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>P₂</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>g</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.peso_bandeja || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO DA EMULSÃO</td>
                <td className="border px-1 py-1 text-center italic text-[8px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>E = P₁ - P₂</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>g</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.peso_emulsao?.toFixed(2) || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>ÁREA DA BANDEJA</td>
                <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>A</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>m²</td>
                {ensaios.map((_, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{dimensoes.area?.toFixed(4) || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>TAXA APLICADA</td>
                <td className="border px-1 py-1 text-center italic text-[8px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>Tₐ = E / (1000 × A)</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>l/m²</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.taxa_aplicada?.toFixed(2) || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>TAXA DE EMULSÃO APLICADA</td>
                <td className="border px-1 py-1 text-center italic text-[8px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>Tᵉ = Tₐ × R%</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>l/m²</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.taxa_emulsao_aplicada?.toFixed(2) || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>TAXA RESIDUAL</td>
                <td className="border px-1 py-1 text-center italic text-[8px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>Tᵣ = Tₐ × R</td>
                <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>l/m²</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.taxa_residual?.toFixed(2) || ''}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ensaio de Resíduo */}
        {(() => {
          // Filtrar apenas ensaios que têm dados de resíduo
          const ensaiosComResiduo = ensaios.filter(e => e.ensaio_residuo?.data || e.ensaio_residuo?.tara || e.ensaio_residuo?.peso_inicial || e.ensaio_residuo?.peso_final);
          
          if (ensaiosComResiduo.length === 0) return null;
          
          return (
            <div className="mb-0 print:mb-0">
              <div className="bg-slate-200 px-1 py-0 font-bold text-center text-[8px] leading-tight print:text-[8px]">ENSAIO DE RESÍDUO</div>
              <table className="w-full border-collapse text-[9px]">
                <thead>
                  <tr>
                    <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', width: '30%' }}>ENSAIO DE RESÍDUO</th>
                    <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', width: '20%' }}>CÁLCULOS</th>
                    <th className="border px-1 py-1 font-semibold" style={{ borderColor: 'rgb(148, 163, 184)', width: '12.5%' }}>UNIDADE</th>
                    {ensaiosComResiduo.map((e, i) => (
                      <th key={`ensaio-num-${i}`} className="border px-1 py-1 font-semibold text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.numero || i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>DATA</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>-</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>-</td>
                    {ensaiosComResiduo.map((e, i) => (
                      <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.ensaio_residuo?.data ? formatDate(e.ensaio_residuo.data) : ''}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>TARA</td>
                    <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>T</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>g</td>
                    {ensaiosComResiduo.map((e, i) => (
                      <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.ensaio_residuo?.tara || ''}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO INICIAL</td>
                    <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>Pᵢ</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>g</td>
                    {ensaiosComResiduo.map((e, i) => (
                      <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.ensaio_residuo?.peso_inicial || ''}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border px-1 py-1" style={{ borderColor: 'rgb(148, 163, 184)' }}>PESO FINAL</td>
                    <td className="border px-1 py-1 text-center italic" style={{ borderColor: 'rgb(148, 163, 184)' }}>Pf</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>g</td>
                    {ensaiosComResiduo.map((e, i) => (
                      <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.ensaio_residuo?.peso_final || ''}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border px-1 py-1 font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>RESÍDUO</td>
                    <td className="border px-1 py-1 text-center italic text-[8px]" style={{ borderColor: 'rgb(148, 163, 184)' }}>R = (Pf - T) / (Pᵢ - T) × 100</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: 'rgb(148, 163, 184)' }}>%</td>
                    {ensaiosComResiduo.map((e, i) => (
                      <td key={i} className="border px-1 py-1 text-center font-bold" style={{ borderColor: 'rgb(148, 163, 184)' }}>{e.ensaio_residuo?.residuo?.toFixed(2) || ''}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        <ReportFooter />
      </div>
    </div>
  );
}