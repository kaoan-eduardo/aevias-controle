import React from "react";

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatDateBrasilia = (dateString) => {
  if (!dateString) return "N/A";
  let normalizedDate = dateString;
  if (!dateString.endsWith("Z") && !dateString.includes("+") && !dateString.includes("-", 10)) {
    normalizedDate = dateString + "Z";
  }
  return new Date(normalizedDate).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium"
  });
};

export default function RelatorioProctorExpansaoCBR({ ensaio, obra, regional }) {
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
          CARACTERIZAÇÃO MECÂNICA<br/>PROCTOR + EXPANSÃO + CBR (ISC)
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">DNIT 426/2022 | DNIT 427/2022</p>
      </div>
      <div className="flex justify-end"></div>
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
          <p className="text-gray-900">{regional?.cliente || "N/A"}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">MATERIAL:</p>
          <p className="text-gray-900">{ensaio.material || ""}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">OBRA:</p>
          <p className="text-gray-900">{obra?.name || "N/A"}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">DATA:</p>
          <p className="text-gray-900">{formatDate(ensaio.data_ensaio)}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">RODOVIA/LOCAL:</p>
          <p className="text-gray-900">{ensaio.local || ""}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">LABORATORISTA:</p>
          <p className="text-gray-900">{ensaio.laboratorista_name || "N/A"}</p>
        </div>
      </div>
    </div>
  );

  const CompactacaoSection = () => (
    <div className="mb-4">
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-2 py-0.5 font-bold text-center text-xs mb-1">
        COMPACTAÇÃO PROCTOR ({ensaio.golpes})
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="border px-1 py-0.5 bg-slate-100 text-left">Molde</th>
            <th className="border px-1 py-0.5 bg-slate-100">Peso Molde (g)</th>
            <th className="border px-1 py-0.5 bg-slate-100">P. Amostra (g)</th>
            <th className="border px-1 py-0.5 bg-slate-100">Dens. Úmida (g/cm³)</th>
            <th className="border px-1 py-0.5 bg-slate-100">Peso Seco (g)</th>
            <th className="border px-1 py-0.5 bg-slate-100">Dens. Seca (g/cm³)</th>
            <th className="border px-1 py-0.5 bg-slate-100">Umidade (%)</th>
          </tr>
        </thead>
        <tbody>
          {(ensaio.compactacao?.moldes || []).map((molde, idx) => (
            <tr key={idx}>
              <td className="border px-1 py-0.5">{molde.numero}</td>
              <td className="border px-1 py-0.5 text-center">{molde.peso_molde?.toFixed(1) || ""}</td>
              <td className="border px-1 py-0.5 text-center">{molde.peso_amostra?.toFixed(1) || ""}</td>
              <td className="border px-1 py-0.5 text-center bg-blue-50 font-semibold">{molde.densidade_umida?.toFixed(3) || ""}</td>
              <td className="border px-1 py-0.5 text-center">{molde.peso_seco?.toFixed(1) || ""}</td>
              <td className="border px-1 py-0.5 text-center bg-blue-50 font-semibold">{molde.densidade_seca?.toFixed(3) || ""}</td>
              <td className="border px-1 py-0.5 text-center">{molde.umidade?.toFixed(2) || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ExpansaoSection = () => (
    <div className="mb-4">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-2 py-0.5 font-bold text-center text-xs mb-1">
        EXPANSÃO (4 DIAS)
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="border px-1 py-0.5 bg-slate-100 text-left">Cilindro</th>
            <th className="border px-1 py-0.5 bg-slate-100">Altura Inicial (mm)</th>
            <th className="border px-1 py-0.5 bg-slate-100">Diferença Total (mm)</th>
            <th className="border px-1 py-0.5 bg-slate-100">Expansão (%)</th>
            <th className="border px-1 py-0.5 bg-slate-100">Peso Solo Final (g)</th>
          </tr>
        </thead>
        <tbody>
          {(ensaio.expansao?.cilindros || []).map((cilindro, idx) => (
            <tr key={idx}>
              <td className="border px-1 py-0.5">{cilindro.numero}</td>
              <td className="border px-1 py-0.5 text-center">{cilindro.altura_inicial?.toFixed(2) || ""}</td>
              <td className="border px-1 py-0.5 text-center bg-amber-50">{cilindro.diferenca_total?.toFixed(2) || ""}</td>
              <td className="border px-1 py-0.5 text-center bg-amber-50 font-semibold">{cilindro.expansao_percentual?.toFixed(2) || ""}</td>
              <td className="border px-1 py-0.5 text-center">{cilindro.peso_solo_final?.toFixed(1) || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CBRSection = () => (
    <div className="mb-4">
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-0.5 font-bold text-center text-xs mb-1">
        CBR (ISC) - ÍNDICE DE SUPORTE CALIFORNIA
      </div>
      {(ensaio.cbr?.cilindros || []).map((cilindro, cidx) => (
        <div key={cidx} className="mb-2">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th colSpan={4} className="border px-1 py-0.5 bg-slate-200 text-left font-bold">
                  Cilindro {cilindro.numero}
                </th>
              </tr>
              <tr>
                <th className="border px-1 py-0.5 bg-slate-100">Penetração (mm)</th>
                <th className="border px-1 py-0.5 bg-slate-100">Leitura Anel</th>
                <th className="border px-1 py-0.5 bg-slate-100">Pressão (kgf/cm²)</th>
                <th className="border px-1 py-0.5 bg-slate-100">ISC (%)</th>
              </tr>
            </thead>
            <tbody>
              {cilindro.penetracoes.map((pen, pidx) => (
                <tr key={pidx}>
                  <td className="border px-1 py-0.5 text-center">{pen.penetracao_mm}</td>
                  <td className="border px-1 py-0.5 text-center">{pen.leitura_anel?.toFixed(1) || ""}</td>
                  <td className="border px-1 py-0.5 text-center bg-red-50">{pen.pressao_kgf_cm2?.toFixed(3) || ""}</td>
                  <td className="border px-1 py-0.5 text-center bg-red-50 font-semibold">{pen.isc_percentual?.toFixed(1) || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  const ReportFooter = () => (
    <footer className="mt-4 pt-3 print:break-inside-avoid">
      {ensaio.observacoes && (
        <div className="mb-3">
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px]">OBSERVAÇÕES</div>
          <div className="border border-slate-300 p-1 text-[10px] min-h-[20px]">{ensaio.observacoes}</div>
        </div>
      )}

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
  );

  return (
    <div className="bg-white font-sans">
      <div className="w-full max-w-[210mm] mx-auto bg-white p-6 print:p-6 print:min-h-[297mm]" style={{ minHeight: "100vh" }}>
        <ReportHeader />
        <DadosObra />
        <CompactacaoSection />
        <ExpansaoSection />
        <CBRSection />
        <ReportFooter />
      </div>
    </div>
  );
}