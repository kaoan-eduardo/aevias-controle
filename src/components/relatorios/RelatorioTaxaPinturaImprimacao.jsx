import React from "react";
import SignatureFooter from './SignatureFooter';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default function RelatorioTaxaPinturaImprimacao({ ensaio, obra, regional }) {
  const ensaios = ensaio.ensaios || [];
  const dimensoes = ensaio.dimensoes_bandeja || {};

  return (
    <div className="bg-white font-sans">
      <div className="w-full max-w-[210mm] mx-auto bg-white p-6 print:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-slate-900">
          <div className="w-16">
            <picture>
              <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo" 
                className="h-12 object-contain"
                width="auto" height="48"
              />
            </picture>
          </div>
          
          <div className="text-center flex-1">
            <h1 className="text-sm font-bold text-gray-800 leading-tight">
              ENSAIO DE TAXA DE PINTURAS ASFÁLTICAS<br/>E RESÍDUO DA EMULSÃO
            </h1>
            <p className="text-[9px] text-gray-500 mt-0.5">(DNIT 145/2012 - ES)</p>
          </div>
          
          <div className="text-right w-16">
            <div className="border border-gray-400 p-1 rounded inline-block">
              <p className="text-[9px] font-semibold text-gray-800">{formatDate(ensaio.data_ensaio)}</p>
            </div>
          </div>
        </div>

        {/* DADOS DA OBRA Section */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1">DADOS DA OBRA</div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[9px]">
            <div>
              <p className="font-bold text-gray-700">CLIENTE:</p>
              <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">MATERIAL:</p>
              <p className="text-gray-900">{ensaio.material || ''}</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">PLACA CAMINHÃO:</p>
              <p className="text-gray-900">{ensaio.placa_caminhao || ''}</p>
            </div>

            <div>
              <p className="font-bold text-gray-700">OBRA:</p>
              <p className="text-gray-900">{obra?.name || 'N/A'}</p>
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
              <p className="font-bold text-gray-700">ENSAIO REALIZADO POR:</p>
              <p className="text-gray-900">{ensaio.ensaio_realizado_por || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">LABORATORISTA:</p>
              <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* DADOS DO ENSAIO Section */}
        <div className="mb-2">
          <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1">DADOS DO ENSAIO</div>
          
          {/* Serviço */}
          <table className="w-full border-collapse text-[9px] mb-2">
            <tbody>
              <tr>
                <td className="border border-slate-300 px-2 py-1 font-semibold w-1/3">SERVIÇO</td>
                <td className="border border-slate-300 px-2 py-1 text-center">
                  <input type="checkbox" checked={ensaio.tipo_servico === 'imprimacao'} readOnly className="mr-1" />
                  IMPRIMAÇÃO
                </td>
                <td className="border border-slate-300 px-2 py-1 text-center">
                  <input type="checkbox" checked={ensaio.tipo_servico === 'ligacao'} readOnly className="mr-1" />
                  LIGAÇÃO
                </td>
              </tr>
            </tbody>
          </table>

          {/* ÁREA DA BANDEJA */}
          <div className="mb-2">
            <div className="bg-slate-100 px-1 py-0.5 font-bold text-[8px] text-center">ÁREA DA BANDEJA</div>
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 px-1 py-1 text-left font-semibold">Nº DA BANDEJA</th>
                  <th className="border border-slate-300 px-1 py-1 text-left font-semibold">CÁLCULOS</th>
                  <th className="border border-slate-300 px-1 py-1 text-left font-semibold">UNIDADE</th>
                  {ensaios.map((_, i) => (
                    <th key={i} className="border border-slate-300 px-1 py-1 text-center font-semibold">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-1 py-1">LADO 1</td>
                  <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">L₁</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">cm</td>
                  {ensaios.map((_, i) => (
                    <td key={i} className="border border-slate-300 px-1 py-1 text-center">{dimensoes.lado_1 || ''}</td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1 py-1">LADO 2</td>
                  <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">L₂</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">cm</td>
                  {ensaios.map((_, i) => (
                    <td key={i} className="border border-slate-300 px-1 py-1 text-center">{dimensoes.lado_2 || ''}</td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1 py-1 font-bold">ÁREA</td>
                  <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">A = L₁ × L₂ / 10000</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">m²</td>
                  {ensaios.map((_, i) => (
                    <td key={i} className="border border-slate-300 px-1 py-1 text-center font-bold">{dimensoes.area?.toFixed(4) || ''}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* EXECUÇÃO DO ENSAIO */}
          <div className="bg-slate-100 px-1 py-0.5 font-bold text-[8px] text-center">EXECUÇÃO DO ENSAIO</div>
          <table className="w-full border-collapse text-[9px]">
            <tbody>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-semibold w-1/4">CAMADA</td>
                <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center">{e.camada || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-semibold">MATERIAL DA CAMADA</td>
                <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center">{e.material_camada || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-semibold">ESTACA DO ENSAIO</td>
                <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center">{e.estaca || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-semibold">TEMP. DE APLICAÇÃO DO LIGANTE</td>
                <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                <td className="border border-slate-300 px-1 py-1 text-center">°C</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center">{e.temperatura_aplicacao || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-semibold">PESO DA BANDEJA+AMOSTRA</td>
                <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">P₁</td>
                <td className="border border-slate-300 px-1 py-1 text-center">g</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center">{e.peso_bandeja_amostra || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-semibold">PESO DA BANDEJA</td>
                <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">P₂</td>
                <td className="border border-slate-300 px-1 py-1 text-center">g</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center">{e.peso_bandeja || ''}</td>
                ))}
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 px-1 py-1 font-bold">PESO DA EMULSÃO</td>
                <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">E = P₁ - P₂</td>
                <td className="border border-slate-300 px-1 py-1 text-center">g</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center font-bold">{e.peso_emulsao?.toFixed(2) || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-semibold">ÁREA DA BANDEJA</td>
                <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">A</td>
                <td className="border border-slate-300 px-1 py-1 text-center">m²</td>
                {ensaios.map((_, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center">{dimensoes.area?.toFixed(4) || ''}</td>
                ))}
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 px-1 py-1 font-bold">TAXA APLICADA</td>
                <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">Tₐ = E / (1000 × A)</td>
                <td className="border border-slate-300 px-1 py-1 text-center">l/m²</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center font-bold">{e.taxa_aplicada?.toFixed(2) || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-bold">TAXA DE EMULSÃO APLICADA</td>
                <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">Tᵉ = Tₐ × R%</td>
                <td className="border border-slate-300 px-1 py-1 text-center">l/m²</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center font-bold">{e.taxa_emulsao_aplicada?.toFixed(2) || ''}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 font-bold">TAXA RESIDUAL</td>
                <td className="border border-slate-300 px-1 py-1 text-center italic text-[8px]">Tᵣ = Tₐ × R</td>
                <td className="border border-slate-300 px-1 py-1 text-center">l/m²</td>
                {ensaios.map((e, i) => (
                  <td key={i} className="border border-slate-300 px-1 py-1 text-center font-bold">{e.taxa_residual?.toFixed(2) || ''}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* OBSERVAÇÕES */}
        {ensaio.observacoes && (
          <div className="mt-3">
            <div className="bg-slate-100 px-2 py-1 font-bold text-[9px]">OBSERVAÇÕES</div>
            <div className="border border-slate-300 p-2 text-[9px] min-h-[30px] bg-slate-50">
              {ensaio.observacoes}
            </div>
          </div>
        )}

        {/* Signature Footer */}
        <div className="mt-6">
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
      </div>
    </div>
  );
}