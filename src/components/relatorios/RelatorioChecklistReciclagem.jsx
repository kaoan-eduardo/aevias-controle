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
  <h2 className="text-xs font-bold text-center bg-slate-100 py-0.5 px-0.5 my-1 uppercase tracking-wide">{children}</h2>
);

const ReportPrintHeader = ({ checklist, obra, regional, project }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div>
      <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0.5 mb-0.5">
        <div className="flex justify-start">
          <img 
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
            alt="Logo Regional" 
            className="h-12 object-contain" 
          />
        </div>
        <div className="text-center">
          <h1 className="text-sm font-bold text-gray-800">CHECKLIST DE RECICLAGEM</h1>
        </div>
        <div className="flex justify-end">
          <div className="border border-gray-400 p-0.5 rounded-md text-xs bg-white">
            <p className="font-semibold text-gray-800">{formatDate(checklist.data)}</p>
          </div>
        </div>
      </header>

      <SectionTitle>DADOS DA OBRA</SectionTitle>
      <div className="grid grid-cols-4 gap-x-2 gap-y-1.5 mb-2 text-[11px] p-1">
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

const ReportFooterWithSignatures = ({ checklist }) => {
  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    return new Date(normalizedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };

  return (
    <footer className="mt-2 px-0.5 print:break-inside-avoid">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="text-center">
          <div className="text-xs print:text-xs text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center">
            {checklist.laboratorista_name && (
              <>
                <p>Assinado digitalmente por</p>
                <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
                <p>{checklist.created_by}</p>
                <p>em {formatDateBrasilia(checklist.created_date)}</p>
              </>
            )}
          </div>
          <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">Fiscal</p></div>
        </div>
        <div className="text-center">
          {checklist.approver_details ? (
            <>
              <div className="text-xs print:text-xs text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center">
                <p>Aprovado digitalmente por</p>
                <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
                <p>{checklist.approved_by}</p>
                {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
                <p>em {formatDateBrasilia(checklist.approved_date)}</p>
              </div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">{checklist.approver_details.position || 'Engenheiro Responsável'}</p></div>
            </>
          ) : (
            <>
              <div className="h-10 mb-0.5"></div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">Engenheiro Responsável</p></div>
            </>
          )}
        </div>
        <div className="text-center">
          {checklist.client_signature?.signed_by ? (
            <>
              <div className="text-xs print:text-xs text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center">
                <p>Assinado digitalmente por</p>
                <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
                <p>{checklist.client_signature.signed_by}</p>
                {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
                <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
              </div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">Engenheiro Cliente</p></div>
            </>
          ) : (
            <>
              <div className="h-10 mb-0.5"></div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">Engenheiro Cliente</p></div>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default function RelatorioChecklistReciclagem({ checklist, obra, regional, project, creatorUser }) {
  const [compressedPhotos, setCompressedPhotos] = React.useState([]);
  const [isCompressing, setIsCompressing] = React.useState(true);

  React.useEffect(() => {
    const compressImages = async () => {
      if (!checklist?.fotos || checklist.fotos.length === 0) {
        setIsCompressing(false);
        return;
      }

      const compressed = await Promise.all(
        checklist.fotos.filter(photo => photo && photo.trim() !== '').map(async (photoUrl) => {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = photoUrl;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Reduzir dimensões mais agressivamente
            const maxWidth = 600;
            const maxHeight = 450;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = width * ratio;
              height = height * ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Desenhar com fundo branco para evitar problemas com transparência
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Comprimir com qualidade de 60% (melhor compatibilidade)
            return canvas.toDataURL('image/jpeg', 0.6);
          } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            return photoUrl; // Usar original se falhar
          }
        })
      );

      setCompressedPhotos(compressed);
      setIsCompressing(false);
    };

    compressImages();
  }, [checklist?.fotos]);

  if (isCompressing) {
    return <div className="p-8 text-center">Otimizando imagens para impressão...</div>;
  }

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

  const photoChunks = compressedPhotos.length > 0 ? chunkArray(compressedPhotos, 6) : [];
  const temAcoesCorretivas = checklist.acoes_corretivas_realizado === true && checklist.acoes_corretivas_descricao;
  const totalPages = 1 + photoChunks.length + (temAcoesCorretivas ? 1 : 0);

  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    return new Date(normalizedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };

  const ReportFooterWithSignatures = () => (
    <footer className="mt-4 px-0.5 print:break-inside-avoid">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="text-center">
          <div className="text-[8px] print:text-[8px] text-slate-500 mb-0.5 min-h-[35px] flex flex-col justify-end items-center">
            {checklist.laboratorista_name && (
              <>
                <p className="leading-tight">Assinado digitalmente por</p>
                <p className="font-bold text-slate-600 leading-tight">{checklist.laboratorista_name}</p>
                <p className="leading-tight text-[7px]">{checklist.created_by}</p>
                <p className="leading-tight text-[7px]">em {formatDateBrasilia(checklist.created_date)}</p>
              </>
            )}
          </div>
          <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px] print:text-[9px]">{creatorUser?.position || 'Laboratorista Responsável'}</p></div>
        </div>
        <div className="text-center">
          {checklist.approver_details ? (
            <>
              <div className="text-[8px] print:text-[8px] text-slate-500 mb-0.5 min-h-[35px] flex flex-col justify-end items-center">
                <p className="leading-tight">Aprovado digitalmente por</p>
                <p className="font-bold text-slate-600 leading-tight">{checklist.approver_details.name}</p>
                <p className="leading-tight text-[7px]">{checklist.approved_by}</p>
                {checklist.approver_details.crea_number && <p className="leading-tight text-[7px]">CREA: {checklist.approver_details.crea_number}</p>}
                <p className="leading-tight text-[7px]">em {formatDateBrasilia(checklist.approved_date)}</p>
              </div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px] print:text-[9px]">{checklist.approver_details.position || 'Engenheiro Responsável'}</p></div>
            </>
          ) : (
            <>
              <div className="min-h-[35px] mb-0.5"></div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px] print:text-[9px]">Engenheiro Responsável</p></div>
            </>
          )}
        </div>
        <div className="text-center">
          {checklist.client_signature?.signed_by ? (
            <>
              <div className="text-[8px] print:text-[8px] text-slate-500 mb-0.5 min-h-[35px] flex flex-col justify-end items-center">
                <p className="leading-tight">Assinado digitalmente por</p>
                <p className="font-bold text-slate-600 leading-tight">{checklist.client_signature.engineer_name}</p>
                <p className="leading-tight text-[7px]">{checklist.client_signature.signed_by}</p>
                {checklist.client_signature.crea_number && <p className="leading-tight text-[7px]">CREA: {checklist.client_signature.crea_number}</p>}
                <p className="leading-tight text-[7px]">em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
              </div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px] print:text-[9px]">Engenheiro Cliente</p></div>
            </>
          ) : (
            <>
              <div className="min-h-[35px] mb-0.5"></div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px] print:text-[9px]">Engenheiro Cliente</p></div>
            </>
          )}
        </div>
      </div>
    </footer>
  );

  return (
    <>
      {/* Página Principal */}
      <div className={(photoChunks.length > 0 || temAcoesCorretivas) ? "break-after-page" : ""}>
        <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />

        {/* CONDIÇÕES CLIMÁTICAS */}
        <SectionTitle>Condições Climáticas</SectionTitle>
        <div className="mb-2">
          <table className="w-full border-collapse border border-slate-300">
            <thead className="bg-white">
              <tr>
                {checklist.periodos_clima?.map((periodo, idx) => (
                  <th key={idx} className="border border-slate-300 px-1 py-1.5 text-center font-bold uppercase text-[10px]">
                    {periodo.periodo === 'manha' ? 'MANHÃ' : periodo.periodo === 'tarde' ? 'TARDE' : 'NOITE'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {checklist.periodos_clima?.map((periodo, idx) => (
                  <td key={idx} className="border border-slate-300 px-1 py-1.5 text-center">
                    <p className="font-medium mb-0.5 text-[9px]">
                      Temp: {periodo.temperatura_ambiente || 'N/A'}°C
                    </p>
                    <p className="font-bold text-[10px]">
                      {getClimaEmoji(periodo.condicoes_climaticas)} {getClimaText(periodo.condicoes_climaticas)}
                    </p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ACOMPANHAMENTO EXECUÇÃO DA CAMADA */}
        <SectionTitle>ACOMPANHAMENTO EXECUÇÃO DA CAMADA</SectionTitle>
        <div className="overflow-x-auto mb-1.5">
          <table className="w-full border-collapse border border-slate-300 text-[9px]">
            <thead>
              <tr className="bg-white">
                <th className="border border-slate-300 px-1 py-1 text-left font-medium">Controle</th>
                <th className="border border-slate-300 px-1 py-1 text-center font-medium w-9">Sim</th>
                <th className="border border-slate-300 px-1 py-1 text-center font-medium w-9">Não</th>
                <th className="border border-slate-300 px-1 py-1 text-center font-medium w-9">N/A</th>
                <th className="border border-slate-300 px-1 py-1 text-left font-medium">Observações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-1 py-1 bg-white">Foi realizado remoção de material existente?</td>
                <td className="border border-slate-300 px-1 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.remocao_material_existente?.sim} /></td>
                <td className="border border-slate-300 px-1 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.remocao_material_existente?.nao} /></td>
                <td className="border border-slate-300 px-1 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.remocao_material_existente?.na} /></td>
                <td className="border border-slate-300 px-1 py-1">
                  KM DO BOTA FORA: {checklist.acompanhamento_execucao?.remocao_material_existente?.km_bota_fora || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1 bg-white">Foi espalhado material novo para construção da camada?</td>
                <td className="border border-slate-300 px-1 py-1 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.espalhamento_material_novo?.sim} /></td>
                <td className="border border-slate-300 px-1 py-1 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.espalhamento_material_novo?.nao} /></td>
                <td className="border border-slate-300 px-1 py-1 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.espalhamento_material_novo?.na} /></td>
                <td className="border border-slate-300 px-1 py-1">
                  TIPO DE MATERIAL: Pó de pedra
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1.5 bg-white">
                  A compactação da camada foi realizada em conformidade à energia de projeto?
                  <div className="flex gap-0.5 mt-0" style={{ fontSize: '6px' }}>
...
                  </div>
                </td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.sim} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.nao} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.compactacao_conforme_projeto?.na} /></td>
                <td className="border border-slate-300 px-1 py-1.5"></td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1.5 bg-white">Foi realizado ensaio de viga Benkelman para liberação da camada?</td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.ensaio_viga_benkelman?.sim} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.ensaio_viga_benkelman?.nao} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.ensaio_viga_benkelman?.na} /></td>
                <td className="border border-slate-300 px-1 py-1.5">25 cm</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1.5 bg-white">Espessura Reciclada?</td>
                <td className="border border-slate-300 px-1 py-1.5 text-center" colSpan="4">
                  {checklist.acompanhamento_execucao?.espessura_reciclada || '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1.5 bg-white">Foi realizado teste de carga para liberação da camada?</td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.teste_carga?.sim} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.teste_carga?.nao} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.teste_carga?.na} /></td>
                <td className="border border-slate-300 px-1 py-1.5"></td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-1 py-1.5 bg-white">Há algum ponto de falha de compactação (borrachudo)?</td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isYes={checklist.acompanhamento_execucao?.falha_compactacao?.sim} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNo={checklist.acompanhamento_execucao?.falha_compactacao?.nao} /></td>
                <td className="border border-slate-300 px-1 py-1.5 text-center"><CheckmarkColumn isNA={checklist.acompanhamento_execucao?.falha_compactacao?.na} /></td>
                <td className="border border-slate-300 px-1 py-1.5"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ENSAIOS DA EMPREITEIRA */}
        <SectionTitle>ACOMPANHAMENTO DOS ENSAIOS REALIZADOS PELA EMPREITEIRA</SectionTitle>
        <div className="overflow-x-auto mb-2">
          <table className="w-full border-collapse border border-slate-300 text-[9px]">
            <thead>
              <tr className="bg-white">
                <th className="border border-slate-300 px-1 py-1.5 text-left font-medium">ENSAIOS</th>
                <th className="border border-slate-300 px-1 py-1.5 text-center font-medium w-10">Sim</th>
                <th className="border border-slate-300 px-1 py-1.5 text-center font-medium w-10">Não</th>
                <th className="border border-slate-300 px-1 py-1.5 text-center font-medium w-10">Qtde</th>
                <th className="border border-slate-300 px-1 py-1.5 text-center font-medium w-12">Conforme</th>
                <th className="border border-slate-300 px-1 py-1.5 text-center font-medium w-14">Não Conforme</th>
                <th className="border border-slate-300 px-1 py-1.5 text-left font-medium">Resultado</th>
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
                    <td className="border border-slate-300 px-1 py-1.5 bg-white">{ensaio.label}</td>
                    <td className="border border-slate-300 px-1 py-1.5 text-center">
                      {dados.realizado ? <span className="text-green-600 font-bold text-sm">✓</span> : <span className="text-slate-500">-</span>}
                    </td>
                    <td className="border border-slate-300 px-1 py-1.5 text-center">-</td>
                    <td className="border border-slate-300 px-1 py-1.5 text-center">{dados.quantidade || '-'}</td>
                    <td className="border border-slate-300 px-1 py-1.5 text-center">
                      {dados.conforme === true && <span className="text-green-600 font-bold text-sm">✓</span>}
                    </td>
                    <td className="border border-slate-300 px-1 py-1.5 text-center">
                      {dados.conforme === false && <span className="text-red-600 font-bold text-sm">✗</span>}
                    </td>
                    <td className="border border-slate-300 px-1 py-1.5 font-medium text-center">{dados.resultados || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* OBSERVAÇÕES GERAIS */}
        {checklist.observacoes_gerais && (
          <>
            <SectionTitle>OBSERVAÇÕES GERAIS</SectionTitle>
            <div className="border border-slate-300 p-2 min-h-[25px] text-[9px] mb-1">
              {checklist.observacoes_gerais}
            </div>
          </>
        )}

        <ReportFooterWithSignatures />
      </div>

      {/* PÁGINA DE AÇÕES CORRETIVAS */}
      {temAcoesCorretivas && (
        <div className="break-before-page">
          <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none py-2 px-3 print:py-2 print:px-3">
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '270mm' }}>
              <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />

              <main className="mt-2" style={{ flex: '1' }}>
                <SectionTitle>Ações Corretivas</SectionTitle>
                <div className="border-2 border-slate-400 rounded p-6 bg-white" style={{ minHeight: '450px' }}>
                  <p className="font-bold text-base mb-4 text-slate-800">AÇÕES CORRETIVAS APONTADAS:</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {checklist.acoes_corretivas_descricao}
                  </p>
                </div>
              </main>

              <div style={{ marginTop: 'auto' }}>
                <ReportFooterWithSignatures />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className={pageIndex < photoChunks.length - 1 ? "break-after-page" : ""}>
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-4 mt-2">
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
          
          <main className="grid grid-cols-2 gap-3 my-4">
            {chunk.map((fotoUrl, fotoIndex) => (
              <div key={fotoIndex} className="border border-slate-300 p-1.5 rounded break-inside-avoid flex flex-col">
                <div className="bg-gray-100 flex items-center justify-center rounded overflow-hidden" style={{ height: '220px' }}>
                  <img src={fotoUrl} alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="text-center text-sm mt-1 font-semibold">
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