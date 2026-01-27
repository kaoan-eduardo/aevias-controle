import React from 'react';

const PENEIRAS_MAP = {
  "50_80mm": { astm: "2\"", mm: "50,80" },
  "38_10mm": { astm: "1 1/2\"", mm: "38,10" },
  "25_40mm": { astm: "1\"", mm: "25,40" },
  "19_10mm": { astm: "3/4\"", mm: "19,10" },
  "12_70mm": { astm: "1/2\"", mm: "12,70" },
  "9_50mm": { astm: "3/8\"", mm: "9,50" },
  "6_30mm": { astm: "1/4\"", mm: "6,30" },
  "4_75mm": { astm: "#4", mm: "4,75" },
  "2_36mm": { astm: "#8", mm: "2,36" },
  "2_00mm": { astm: "#10", mm: "2,00" },
  "1_18mm": { astm: "#16", mm: "1,18" },
  "0_60mm": { astm: "#30", mm: "0,60" },
  "0_42mm": { astm: "#40", mm: "0,42" },
  "0_30mm": { astm: "#50", mm: "0,30" },
  "0_18mm": { astm: "#80", mm: "0,18" },
  "0_15mm": { astm: "#100", mm: "0,15" },
  "0_08mm": { astm: "#200", mm: "0,08" }
};

export default function RelatorioGranulometriaIndividual({ ensaio, obra, project, user, regional }) {
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

  const peneirasVisiveis = project?.faixa_trabalho 
    ? Object.keys(project.faixa_trabalho).filter(key => project.faixa_trabalho[key] !== null && project.faixa_trabalho[key] !== undefined)
    : Object.keys(PENEIRAS_MAP);

  return (
    <div className="bg-white font-sans p-8">
      {/* Cabeçalho */}
      <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-start">
          <img 
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
            alt="Logo Regional" 
            className="h-16 object-contain" 
          />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Granulometria Individual dos Agregados</h1>
          <p className="text-sm text-slate-700">{obra?.name}</p>
        </div>
        <div className="flex justify-end">
          <div className="border border-gray-400 p-2 rounded-md">
            <p className="text-sm font-semibold text-gray-800">{formatDate(ensaio.data_ensaio)}</p>
          </div>
        </div>
      </header>

      {/* Dados da Obra */}
      <section className="mb-6">
        <div className="bg-[#BFCF99] p-2">
          <h2 className="text-sm font-bold text-gray-800 uppercase">Dados da Obra</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 border border-gray-300 p-4 text-sm">
          <div>
            <p className="font-semibold">CLIENTE:</p>
            <p>{regional?.cliente || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">PEDREIRA:</p>
            <p>{ensaio.pedreira || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">HORÁRIO:</p>
            <p>{ensaio.horario || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">OBRA:</p>
            <p>{obra?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">PROJETO:</p>
            <p>{project?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">LAB.:</p>
            <p>{ensaio.laboratorista_name || user?.laboratorista_name || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">RODOVIA:</p>
            <p>{ensaio.rodovia || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">FAIXA:</p>
            <p>{ensaio.faixa || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">COLETA:</p>
            <p>{ensaio.local_coleta || 'N/A'}</p>
          </div>
        </div>
      </section>

      {/* Dados do Ensaio */}
      <section className="mb-6">
        <div className="bg-[#BFCF99] p-2">
          <h2 className="text-sm font-bold text-gray-800 uppercase">Dados do Ensaio</h2>
        </div>
        <p className="text-xs text-center mt-2 mb-2">MÉTODO DE ENSAIO DE GRANULOMETRIA - DNIT 412/2025-ME</p>

        {/* Tabela de Agregados */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1" rowSpan="2">PENEIRAS</th>
                <th className="border border-gray-400 p-1" rowSpan="2"></th>
                {ensaio.agregados?.map((agregado, index) => (
                  <th key={index} className="border border-gray-400 p-1" colSpan="2">
                    {agregado.nome || `Agregado ${index + 1}`}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1">ASTM</th>
                <th className="border border-gray-400 p-1">mm</th>
                {ensaio.agregados?.map((_, index) => (
                  <React.Fragment key={index}>
                    <th className="border border-gray-400 p-1">RETIDO (g)</th>
                    <th className="border border-gray-400 p-1">% PASS.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Info do Agregado */}
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-1 font-semibold" colSpan="2">AGREGADO:</td>
                {ensaio.agregados?.map((agregado, index) => (
                  <td key={index} className="border border-gray-400 p-1 text-center" colSpan="2">
                    {agregado.nome || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-400 p-1 font-semibold" colSpan="2">PESO ÚMIDO (g):</td>
                {ensaio.agregados?.map((agregado, index) => (
                  <td key={index} className="border border-gray-400 p-1 text-center" colSpan="2">
                    {agregado.peso_umido || '-'}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-1 font-semibold" colSpan="2">PESO SECO (g):</td>
                {ensaio.agregados?.map((agregado, index) => (
                  <td key={index} className="border border-gray-400 p-1 text-center" colSpan="2">
                    {agregado.peso_seco || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-400 p-1 font-semibold" colSpan="2">ÁGUA (g):</td>
                {ensaio.agregados?.map((agregado, index) => (
                  <td key={index} className="border border-gray-400 p-1 text-center" colSpan="2">
                    {agregado.agua || '-'}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-400 p-1 font-semibold" colSpan="2">UMIDADE (%):</td>
                {ensaio.agregados?.map((agregado, index) => (
                  <td key={index} className="border border-gray-400 p-1 text-center" colSpan="2">
                    {agregado.umidade || '-'}
                  </td>
                ))}
              </tr>

              {/* Peneiras */}
              {peneirasVisiveis.map(peneiraKey => {
                const peneiraInfo = PENEIRAS_MAP[peneiraKey];
                return (
                  <tr key={peneiraKey}>
                    <td className="border border-gray-400 p-1 text-center">{peneiraInfo.astm}</td>
                    <td className="border border-gray-400 p-1 text-center">{peneiraInfo.mm}</td>
                    {ensaio.agregados?.map((agregado, index) => (
                      <React.Fragment key={index}>
                        <td className="border border-gray-400 p-1 text-center">
                          {agregado.granulometria?.[peneiraKey]?.retido || '-'}
                        </td>
                        <td className="border border-gray-400 p-1 text-center">
                          {agregado.granulometria?.[peneiraKey]?.passante || '-'}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Equivalente de Areia */}
      <section className="mb-6">
        <p className="text-xs text-center mb-2">MÉTODO DE ENSAIO DE EQUIVALENTE DE AREIA - DNIT 450/2024</p>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-400 p-2"></th>
              <th className="border border-gray-400 p-2">Fórmula</th>
              <th className="border border-gray-400 p-2">Unidade</th>
              {ensaio.equivalente_areia?.medicoes?.map((_, index) => (
                <th key={index} className="border border-gray-400 p-2">Medição {index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">TOPO DE ARGILA</td>
              <td className="border border-gray-400 p-2 text-center">H₁</td>
              <td className="border border-gray-400 p-2 text-center">cm</td>
              {ensaio.equivalente_areia?.medicoes?.map((medicao, index) => (
                <td key={index} className="border border-gray-400 p-2 text-center">
                  {medicao.topo_argila || '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 font-semibold">TOPO DE AREIA</td>
              <td className="border border-gray-400 p-2 text-center">H₂</td>
              <td className="border border-gray-400 p-2 text-center">cm</td>
              {ensaio.equivalente_areia?.medicoes?.map((medicao, index) => (
                <td key={index} className="border border-gray-400 p-2 text-center">
                  {medicao.topo_areia || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-semibold">EQUIVALENTE DE AREIA</td>
              <td className="border border-gray-400 p-2 text-center">EA = (H₂/H₁) × 100</td>
              <td className="border border-gray-400 p-2 text-center">%</td>
              {ensaio.equivalente_areia?.medicoes?.map((medicao, index) => (
                <td key={index} className="border border-gray-400 p-2 text-center">
                  {medicao.equivalente || '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-2 font-semibold">MÉDIA</td>
              <td className="border border-gray-400 p-2 text-center">(média)</td>
              <td className="border border-gray-400 p-2 text-center">%</td>
              <td className="border border-gray-400 p-2 text-center font-bold" colSpan={ensaio.equivalente_areia?.medicoes?.length || 1}>
                {ensaio.equivalente_areia?.media || '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Observações */}
      {ensaio.observacoes && (
        <section className="mb-6">
          <div className="border border-gray-400 p-4">
            <p className="font-semibold mb-2">OBS:</p>
            <p className="text-sm whitespace-pre-wrap">{ensaio.observacoes}</p>
          </div>
        </section>
      )}

      {/* Assinaturas */}
      <footer className="mt-12 pt-8">
        <div className="grid grid-cols-3 gap-8 items-end">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
              <p>Assinado digitalmente por</p>
              <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.laboratorista_name}</p>
              <p className="truncate max-w-full">{ensaio.created_by}</p>
              <p>em {formatDateBrasilia(ensaio.created_date)}</p>
            </div>
            <div className="border-t border-gray-500 pt-2">
              <p className="text-xs text-gray-600">Laboratorista Responsável</p>
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
                  <p className="text-xs text-gray-600">{ensaio.approver_details.position}</p>
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
  );
}