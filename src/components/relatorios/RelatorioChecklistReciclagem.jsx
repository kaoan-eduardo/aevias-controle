import React from "react";

const Checkmark = ({ value }) => {
  if (value === true) return <span className="text-green-600 font-bold">✓</span>;
  if (value === false) return <span className="text-red-600 font-bold">✗</span>;
  return <span className="text-gray-400">-</span>;
};

const CheckmarkColumn = ({ isYes, isNo, isNA }) => {
  if (isYes) return <span className="text-green-600 font-bold">X</span>;
  if (isNo) return <span className="text-red-600 font-bold">X</span>;
  if (isNA) return <span className="text-gray-600 font-bold">X</span>;
  return <span className="text-gray-400">-</span>;
};

const SectionTitle = ({ children }) => (
  <h2 className="text-sm print:text-xs font-bold text-center bg-slate-100 p-0.5 my-0.5 uppercase tracking-wider">{children}</h2>
);

const ReportPrintHeader = ({ checklist, obra, regional, project }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div>
      <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-2 mb-2">
        <div className="flex justify-start">
          <img 
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
            alt="Logo Regional" 
            className="h-16 object-contain" 
          />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">CHECKLIST DE RECICLAGEM</h1>
        </div>
        <div className="flex justify-end">
          <div className="border border-gray-400 p-2 rounded-md text-sm bg-white">
            <p className="font-semibold text-gray-800">{formatDate(checklist.data)}</p>
          </div>
        </div>
      </header>

      <SectionTitle>DADOS DA OBRA</SectionTitle>
      <div className="grid grid-cols-4 gap-x-2 gap-y-1 mb-3 text-xs">
        <div>
          <p className="font-bold text-gray-700">CLIENTE:</p>
          <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">PROJETO:</p>
          <p className="text-gray-900">{project?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">MATERIAL:</p>
          <p className="text-gray-900">{checklist.material || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">ENSAIO REALIZADO POR:</p>
          <p className="text-gray-900">{checklist.ensaio_realizado_por || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold text-gray-700">OBRA:</p>
          <p className="text-gray-900">{obra?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">ESTACA:</p>
          <p className="text-gray-900">{checklist.estaca || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">FAIXA:</p>
          <p className="text-gray-900">{checklist.faixa || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">INSPETOR DE CAMPO:</p>
          <p className="text-gray-900">{checklist.inspetor_fiscal || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold text-gray-700">RODOVIA:</p>
          <p className="text-gray-900">{checklist.rodovia || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">TRECHO:</p>
          <p className="text-gray-900">{checklist.trecho || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">EMPREITEIRA:</p>
          <p className="text-gray-900">{checklist.empreiteira || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold text-gray-700">JORNADA:</p>
          <p className="text-gray-900">
            {checklist.jornada?.horario_inicio && checklist.jornada?.horario_fim
              ? `${checklist.jornada.horario_inicio} - ${checklist.jornada.horario_fim}`
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

const ReportFooter = ({ checklist, pageNum, totalPages }) => {
  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    return new Date(normalizedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };

  return (
    <footer className="mt-6 px-4 print:break-inside-avoid">
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1 min-h-[48px] flex flex-col justify-end items-center">
            {checklist.inspetor_fiscal && (
              <>
                <p className="font-bold text-slate-600">{checklist.inspetor_fiscal}</p>
                <p className="text-[10px]">{checklist.created_by}</p>
                <p className="text-[10px]">em {formatDateBrasilia(checklist.created_date)}</p>
              </>
            )}
          </div>
          <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
            <p className="text-xs font-semibold">FISCAL DE CAMPO</p>
          </div>
        </div>

        <div className="text-center">
          {checklist.approver_details ? (
            <>
              <div className="text-xs text-slate-500 mb-1 min-h-[48px] flex flex-col justify-end items-center">
                <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
                <p className="text-[10px]">{checklist.approved_by}</p>
                {checklist.approver_details.crea_number && <p className="text-[10px]">CREA: {checklist.approver_details.crea_number}</p>}
                <p className="text-[10px]">em {formatDateBrasilia(checklist.approved_date)}</p>
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-xs font-semibold">ENGENHEIRO RESPONSÁVEL</p>
              </div>
            </>
          ) : (
            <>
              <div className="min-h-[60px] mb-1"></div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-xs font-semibold">ENGENHEIRO RESPONSÁVEL</p>
              </div>
            </>
          )}
        </div>

        <div className="text-center">
          {checklist.client_signature?.signed_by ? (
            <>
              <div className="text-xs text-slate-500 mb-1 min-h-[48px] flex flex-col justify-end items-center">
                <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
                <p className="text-[10px]">{checklist.client_signature.signed_by}</p>
                {checklist.client_signature.crea_number && <p className="text-[10px]">CREA: {checklist.client_signature.crea_number}</p>}
                <p className="text-[10px]">em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-xs font-semibold">CLIENTE RESPONSÁVEL</p>
              </div>
            </>
          ) : (
            <>
              <div className="min-h-[48px] mb-1"></div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-xs font-semibold">CLIENTE RESPONSÁVEL</p>
              </div>
            </>
          )}
        </div>
      </div>
      {pageNum && totalPages && (
        <p className="text-center text-xs text-slate-500 mt-2">Página {pageNum} de {totalPages}</p>
      )}
    </footer>
  );
};

export default function RelatorioChecklistReciclagem({ checklist, obra, regional, project }) {
  const getClimaEmoji = (clima) => {
    switch (clima) {
      case 'bom': return '☀️';
      case 'instavel': return '⛅';
      case 'chuva': return '🌧️';
      default: return '';
    }
  };

  const getClimaText = (clima) => {
    switch (clima) {
      case 'bom': return 'Bom';
      case 'instavel': return 'Instável';
      case 'chuva': return 'Chuva';
      default: return '';
    }
  };

  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const photoChunks = chunkArray(checklist.fotos || [], 6);
  const totalPages = 1 + photoChunks.length;

  return (
    <>
      {/* Página Principal */}
      <div className="break-after-page">
        <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />

        {/* CONDIÇÕES CLIMÁTICAS */}
        <div className="mb-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {checklist.periodos_clima?.map((periodo, idx) => (
              <div key={idx} className="border border-slate-300 p-2 rounded">
                <p className="font-bold text-center mb-1 uppercase">{periodo.periodo}</p>
                <p className="text-center">Temp. Ambiente (°C): {periodo.temperatura_ambiente || '-'}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-lg">{getClimaEmoji(periodo.condicoes_climaticas)}</span>
                  <span>{getClimaText(periodo.condicoes_climaticas)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACOMPANHAMENTO EXECUÇÃO DA CAMADA */}
        <SectionTitle>ACOMPANHAMENTO EXECUÇÃO DA CAMADA</SectionTitle>
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse border border-slate-400 text-[10px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-300 px-2 py-1 text-left font-medium">Controle</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-16">Sim</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-16">Não</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-16">N/A</th>
                <th className="border border-slate-300 px-2 py-1 text-left font-medium">Observações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Foi realizado remoção de material existente?</td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.remocao_material_existente?.sim} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.remocao_material_existente?.nao} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.remocao_material_existente?.na} /></td>
                <td className="border border-slate-300 px-2 py-1">
                  KM DO BOTA FORA: {checklist.acompanhamento_execucao?.remocao_material_existente?.km_bota_fora || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Foi espalhado material novo para construção da camada?</td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.espalhamento_material_novo?.sim} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.espalhamento_material_novo?.nao} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.espalhamento_material_novo?.na} /></td>
                <td className="border border-slate-300 px-2 py-1">
                  TIPO DE MATERIAL: {checklist.acompanhamento_execucao?.espalhamento_material_novo?.tipo_material || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">
                  A compactação da camada foi realizada em conformidade à energia de projeto?
                  <div className="flex gap-1 mt-0.5 ml-1" style={{ fontSize: '7px' }}>
                    {checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.rolo_liso && (
                      <span className="inline-block bg-blue-300 text-slate-700 px-1.5 py-0.5 rounded font-bold">✓ ROLO LISO</span>
                    )}
                    {checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.rolo_pneu && (
                      <span className="inline-block bg-blue-300 text-slate-700 px-1.5 py-0.5 rounded font-bold">✓ ROLO DE PNEU</span>
                    )}
                    {checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.rolo_pe_carneiro && (
                      <span className="inline-block bg-blue-300 text-slate-700 px-1.5 py-0.5 rounded font-bold">✓ ROLO PÉ DE CARNEIRO</span>
                    )}
                  </div>
                </td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.sim} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.nao} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.na} /></td>
                <td className="border border-slate-300 px-2 py-1"></td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Foi realizado ensaio de viga Benkelman para liberação da camada?</td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.ensaio_viga_benkelman?.sim} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.ensaio_viga_benkelman?.nao} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.ensaio_viga_benkelman?.na} /></td>
                <td className="border border-slate-300 px-2 py-1"></td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Espessura Reciclada?</td>
                <td className="border border-slate-300 px-2 py-1 text-center" colSpan="4">
                  {checklist.acompanhamento_execucao?.espessura_reciclada || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Foi realizado teste de carga para liberação da camada?</td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.teste_carga?.sim} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.teste_carga?.nao} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.teste_carga?.na} /></td>
                <td className="border border-slate-300 px-2 py-1"></td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Há algum ponto de falha de compactação (borrachudo)?</td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.falha_compactacao?.sim} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.falha_compactacao?.nao} /></td>
                <td className="border border-slate-300 px-2 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.falha_compactacao?.na} /></td>
                <td className="border border-slate-300 px-2 py-1"></td>
              </tr>
            </tbody>
          </table>
          {checklist.acompanhamento_execucao?.observacoes && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-300 rounded text-xs">
              <p className="font-bold">Observações:</p>
              <p>{checklist.acompanhamento_execucao.observacoes}</p>
            </div>
          )}
        </div>

        {/* ENSAIOS DA EMPREITEIRA */}
        <SectionTitle>ACOMPANHAMENTO DOS ENSAIOS REALIZADOS PELA EMPREITEIRA</SectionTitle>
        <div className="overflow-x-auto mb-3">
          <table className="w-full border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-white">
                <th className="border border-slate-300 px-2 py-1 text-left font-medium">ENSAIOS</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-16">Sim</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-16">Não</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-16">Qtde</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-20">Conforme</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium w-20">Não Conforme</th>
                <th className="border border-slate-300 px-2 py-1 text-left font-medium">Resultado</th>
                <th className="border border-slate-300 px-2 py-1 text-left font-medium">Observações</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'compactacao_proctor', label: 'Compactação - Proctor' },
                { key: 'taxa_agregado', label: 'Taxa de agregado' },
                { key: 'taxa_cimento', label: 'Taxa de cimento' },
                { key: 'umidade_frigideira', label: 'Umidade pelo método expedito da "frigideira"' },
                { key: 'massa_especifica_in_situ', label: 'Determinação da massa específica aparente seca "in situ"' },
                { key: 'granulometria', label: 'Análise granulométrica por peneiramento' },
                { key: 'moldagem_resistencia', label: 'Moldagem para resistência' },
                { key: 'viga_benkelman', label: 'Viga Benkelman' },
                { key: 'taxa_pintura_ligacao', label: 'Taxa de pintura de ligação' },
                { key: 'finura_cimento', label: 'Determinação da finura do cimento' }
              ].map(ensaio => {
                const dados = checklist.ensaios_empreiteira?.[ensaio.key] || {};
                return (
                  <tr key={ensaio.key}>
                    <td className="border border-slate-300 px-2 py-1 bg-white">{ensaio.label}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      <Checkmark value={dados.realizado === true} />
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      <Checkmark value={dados.realizado === false} />
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center">{dados.quantidade || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      <Checkmark value={dados.conforme === true} />
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      <Checkmark value={dados.conforme === false} />
                    </td>
                    <td className="border border-slate-300 px-2 py-1">{dados.resultados || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1">{dados.observacoes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* OBSERVAÇÕES GERAIS */}
        <SectionTitle>OBSERVAÇÕES GERAIS</SectionTitle>
        <div className="border border-slate-300 p-2 min-h-[60px] text-xs mb-3">
          {checklist.observacoes_gerais || 'Nenhuma observação registrada.'}
        </div>

        <ReportFooter checklist={checklist} pageNum={1} totalPages={totalPages} />
      </div>

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="break-after-page">
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-2">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-12 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-base font-bold text-gray-800">Relatório Fotográfico</h1>
              <p className="text-xs text-gray-600">Reciclagem</p>
              <p className="text-xs text-gray-600">Obra: {obra?.name || 'N/A'}</p>
            </div>
            <div className="flex justify-end">
              <div className="border border-gray-400 p-1 rounded-md text-sm bg-white">
                <p className="font-semibold text-gray-800">
                  {checklist.data ? new Date(checklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}
                </p>
              </div>
            </div>
          </header>
          
          <main className="grid grid-cols-2 gap-3 mb-4">
            {chunk.map((fotoUrl, fotoIndex) => (
              <div key={fotoIndex} className="border border-slate-300 p-2 rounded-lg break-inside-avoid flex flex-col">
                <div className="bg-gray-100 flex items-center justify-center rounded overflow-hidden" style={{ height: '280px' }}>
                  <img src={fotoUrl} alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="text-center text-sm mt-2 font-medium">
                  Foto {(pageIndex * 6) + fotoIndex + 1}
                </p>
              </div>
            ))}
          </main>
        </div>
      ))}
    </>
  );
}