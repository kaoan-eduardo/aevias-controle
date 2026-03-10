import React from 'react';

const Checkmark = ({ checked }) => {
  if (checked === null || typeof checked === 'undefined') {
    return <span className="text-slate-500">-</span>;
  }
  return (
    <span className={`font-bold ${checked ? 'text-green-600' : 'text-red-600'}`}>
      {checked ? '✓' : '✗'}
    </span>
  );
};

const CheckmarkColumn = ({ value, isYesColumn }) => {
  if (value === null || typeof value === 'undefined') {
    return <span className="text-slate-500">-</span>;
  }
  
  if (isYesColumn && value === true) {
    return <span className="font-bold text-green-600 text-lg">✓</span>;
  }
  
  if (!isYesColumn && value === false) {
    return <span className="font-bold text-red-600 text-lg">✗</span>;
  }
  
  return null;
};

const SectionTitle = ({ children }) => (
  <h2 className="text-sm print:text-xs font-bold text-center bg-slate-100 p-0.5 my-0.5 uppercase tracking-wider">{children}</h2>
);

const ReportPrintHeader = ({ checklist, obra, regional }) => (
  <div>
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1">
      <div className="flex justify-start">
        <img 
          src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
          alt="Logo Regional" 
          className="h-10 object-contain" 
        />
      </div>
      <div className="text-center">
        <h1 className="text-sm font-bold text-gray-800 whitespace-nowrap">Controle Tecnológico de Aplicação</h1>
      </div>
      <div className="flex justify-end">
        <div className="border border-gray-400 p-1 rounded-md text-xs">
          <p className="font-semibold text-gray-800">
            {new Date(checklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </p>
        </div>
      </div>
    </header>
    <main className="text-xs mt-0.5">
      <SectionTitle>Dados da Obra</SectionTitle>
      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5" style={{ fontSize: '9px' }}>
        <div>
          <p className="font-bold">CLIENTE:</p>
          <p>{regional?.cliente || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">PROJETO UTILIZADO:</p>
          <p>{checklist.projeto_utilizado || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">USINA:</p>
          <p>{checklist.usina || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">RODOVIA:</p>
          <p>{checklist.rodovia}</p>
        </div>
        <div>
          <p className="font-bold">FAIXA ESPECIFICADA:</p>
          <p>{checklist.faixa_especificada || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">LABORATORISTA DE CAMPO:</p>
          <p>{checklist.laboratorista_name || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">TRECHO:</p>
          <p>{checklist.trecho}</p>
        </div>
        <div>
          <p className="font-bold">LIGANTE:</p>
          <p>{checklist.ligante || 'N/A'}</p>
        </div>


        <div>
          <p className="font-bold">OBRA:</p>
          <p>{obra?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">PEDREIRA:</p>
          <p>{checklist.pedreira || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">ENSAIO REALIZADO POR:</p>
          <p>{checklist.ensaio_realizado_por || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">EMPREITEIRA:</p>
          <p>{checklist.empreiteira || 'N/A'}</p>
        </div>

        {checklist.jornada?.horario_inicio && checklist.jornada?.horario_fim && (
          <div>
            <p className="font-bold">JORNADA:</p>
            <p>{checklist.jornada.horario_inicio} - {checklist.jornada.horario_fim}</p>
          </div>
        )}
      </div>
    </main>
  </div>
);

const ReportFooter = ({ checklist, formatDateBrasilia, pageNumber, totalPages }) => (
  <footer className="mt-1 pt-1 break-inside-avoid">
    <div className="grid grid-cols-3 gap-4 items-end">
      <div className="text-center">
        <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
          <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
          <p>{checklist.created_by}</p>
          <p>em {formatDateBrasilia(checklist.created_date)}</p>
        </div>
        <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Laboratorista Responsável</p></div>
      </div>
      
      <div className="text-center">
        {checklist.approved === true && checklist.approver_details ? (
          <>
            <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
              <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
              <p>{checklist.approved_by}</p>
              {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
              <p>em {formatDateBrasilia(checklist.approved_date)}</p>
            </div>
            <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Aprovação</p></div>
          </>
        ) : (
          <>
            <div className="h-10 mb-1"></div>
            <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Aprovação</p></div>
          </>
        )}
      </div>

      <div className="text-center">
        {checklist.client_signature?.signed_by ? (
          <>
            <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
              <p>Assinado digitalmente por</p>
              <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
              <p>{checklist.client_signature.signed_by}</p>
              {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
              <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
            </div>
            <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Engenheiro Cliente</p></div>
          </>
        ) : (
          <>
            <div className="h-10 mb-1"></div>
            <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Engenheiro Cliente</p></div>
          </>
        )}
      </div>
    </div>
    
    <div className="pt-1 text-center text-gray-400" style={{ fontSize: '8px' }}>
      Página {pageNumber} de {totalPages}
    </div>
  </footer>
);

export default function RelatorioChecklistAplicacao({ checklist, obra, regional, user, creatorUser }) {
  const [compressedPhotos, setCompressedPhotos] = React.useState([]);
  const [compressedMedicoes, setCompressedMedicoes] = React.useState([]);
  const [isCompressing, setIsCompressing] = React.useState(true);

  React.useEffect(() => {
    const compressImages = async () => {
      const hasFotos = checklist?.fotos && checklist.fotos.length > 0;
      const hasMedicoes = checklist?.medicoes_geometricas && checklist.medicoes_geometricas.length > 0;

      if (!hasFotos && !hasMedicoes) {
        setIsCompressing(false);
        return;
      }

      const compressImage = async (photoUrl, isHighQuality = false) => {
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
          
          // Dimensões diferentes para medições geométricas (maior qualidade)
          const maxWidth = isHighQuality ? 1200 : 800;
          const maxHeight = isHighQuality ? 900 : 600;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Desenhar com fundo branco
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Qualidade maior para medições geométricas
          const quality = isHighQuality ? 0.85 : 0.6;
          return canvas.toDataURL('image/jpeg', quality);
        } catch (error) {
          console.error('Erro ao comprimir imagem:', error);
          return photoUrl; // Usar original se falhar
        }
      };

      // Comprimir fotos
      if (hasFotos) {
        const compressedFotos = await Promise.all(
          checklist.fotos.filter(photo => photo && photo.trim() !== '').map(url => compressImage(url, false))
        );
        setCompressedPhotos(compressedFotos);
      }

      // Comprimir medições geométricas com maior qualidade
      if (hasMedicoes) {
        const compressedMed = await Promise.all(
          checklist.medicoes_geometricas.filter(med => med && med.trim() !== '').map(url => compressImage(url, true))
        );
        setCompressedMedicoes(compressedMed);
      }

      setIsCompressing(false);
    };

    compressImages();
  }, [checklist?.fotos, checklist?.medicoes_geometricas]);

  if (!checklist) {
    return <div className="p-8">Dados do checklist não encontrados.</div>;
  }

  if (isCompressing) {
    return <div className="p-8 text-center">Otimizando imagens para impressão...</div>;
  }

  const chunkArray = (array, chunkSize) => {
    const chunks = [];
    if (!array) return chunks;
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const photoChunks = chunkArray(compressedPhotos, 6);

  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    return new Date(normalizedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };

  const temAcoesCorretivas = checklist.acoes_corretivas_realizado === true && checklist.acoes_corretivas_descricao;
  const totalPages = 1 + (temAcoesCorretivas ? 1 : 0) + photoChunks.length + compressedMedicoes.length;

  return (
    <div className="bg-white font-sans">
      <div className="p-3 print:p-3 flex flex-col" style={{ minHeight: '297mm', maxHeight: '297mm' }}>
        <div className="w-full max-w-[190mm] mx-auto flex flex-col" style={{ height: '100%' }}>
          <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} />
          <main className="flex-shrink">
            <div className="mt-0.5">
              <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '10px' }}>
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-0.5 text-center font-medium">MANHÃ</th>
                    <th className="border border-slate-300 p-0.5 text-center font-medium">TARDE</th>
                    <th className="border border-slate-300 p-0.5 text-center font-medium">NOITE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {checklist.periodos_clima?.map((periodo, index) => (
                      <td key={index} className="border border-slate-300 p-0.5 text-center">
                        <p className="font-medium">Temp. Ambiente (°C): {periodo.temperatura_ambiente || '-'}</p>
                        <div className="mt-0.5">
                          {periodo.condicoes_climaticas === 'bom' && <p className="font-bold text-slate-800">☀️ Bom</p>}
                          {periodo.condicoes_climaticas === 'instavel' && <p className="font-bold text-slate-800">⛅ Instável</p>}
                          {periodo.condicoes_climaticas === 'chuva' && <p className="font-bold text-slate-800">🌧️ Chuva</p>}
                          {!periodo.condicoes_climaticas && <p className="text-slate-500">-</p>}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <SectionTitle>Acompanhamento da Fresagem e Preparação da Superfície</SectionTitle>
            <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '10px' }}>
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 px-1 py-0.5 text-left font-medium">Serviço</th>
                  <th className="border border-slate-300 px-1 py-0.5 text-center font-medium w-10">Sim</th>
                  <th className="border border-slate-300 px-1 py-0.5 text-center font-medium w-10">Não</th>
                  <th className="border border-slate-300 px-1 py-0.5 text-left font-medium">Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-0.5">
                    <strong>A superfície foi limpa após a fresagem?</strong>
                    <p className="text-slate-600 italic" style={{ fontSize: '8px' }}>Preferencialmente por vassouras mecânicas, podendo ser usados, também, processos manuais.</p>
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.superficie_limpa} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.superficie_limpa} isYesColumn={false} />
                  </td>
                  <td className="border border-slate-300 p-0.5" rowSpan="4" style={{ fontSize: '8px' }}>
                    {checklist.fresagem_preparacao?.observacoes || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5">
                    <strong>Foi realizada a destinação do material fresado?</strong>
                    <p className="text-slate-600 italic" style={{ fontSize: '8px' }}>(Informar local no campo de observações) Local definido pela concessionária para seu reaproveitamento ou bota-fora</p>
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.destinacao_material_fresado} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.destinacao_material_fresado} isYesColumn={false} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5">
                    <strong>O material solto foi removido por fresagem ou qualquer outro processo apropriado?</strong>
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.material_solto_removido} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.material_solto_removido} isYesColumn={false} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5">
                    <strong>Pavimento fresado está em condições para pintura?</strong>
                    <p className="text-slate-600 italic" style={{ fontSize: '8px' }}>(Limpo e sem excesso de umidade)</p>
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.pavimento_pronto_pintura} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.fresagem_preparacao?.pavimento_pronto_pintura} isYesColumn={false} />
                  </td>
                </tr>
              </tbody>
            </table>

            <SectionTitle>Acompanhamento da Pintura de Ligação</SectionTitle>
            <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '10px' }}>
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-0.5 text-left font-medium">Serviço</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-10">Sim</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-10">Não</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-16">Resultado</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-20">Conformidade</th>
                  <th className="border border-slate-300 p-0.5 text-left font-medium">Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                   <td className="border border-slate-300 p-0.5">Pintura realizada na barra espargidora?</td>
                   <td className="border border-slate-300 p-0.5 text-center">
                     <CheckmarkColumn value={checklist.pintura_ligacao?.pintura_barra_espargidora?.realizado} isYesColumn={true} />
                   </td>
                   <td className="border border-slate-300 p-0.5 text-center">
                     <CheckmarkColumn value={checklist.pintura_ligacao?.pintura_barra_espargidora?.realizado} isYesColumn={false} />
                   </td>
                   <td className="border border-slate-300 p-0.5 text-center">-</td>
                   <td className="border border-slate-300 p-0.5 text-center">NA</td>
                   <td className="border border-slate-300 p-0.5" rowSpan="5" style={{ fontSize: '8px' }}>
                     {checklist.pintura_ligacao?.observacoes || '-'}
                   </td>
                 </tr>
                 <tr>
                   <td className="border border-slate-300 p-0.5">Aguardado tempo necessário para rompimento/cura?</td>
                   <td className="border border-slate-300 p-0.5 text-center">
                     <CheckmarkColumn value={checklist.pintura_ligacao?.tempo_rompimento_cura?.realizado} isYesColumn={true} />
                   </td>
                   <td className="border border-slate-300 p-0.5 text-center">
                     <CheckmarkColumn value={checklist.pintura_ligacao?.tempo_rompimento_cura?.realizado} isYesColumn={false} />
                   </td>
                   <td className="border border-slate-300 p-0.5 text-center">-</td>
                   <td className="border border-slate-300 p-0.5 text-center">NA</td>
                 </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5">Taxa de Pintura:</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.pintura_ligacao?.taxa_pintura?.realizado} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.pintura_ligacao?.taxa_pintura?.realizado} isYesColumn={false} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {checklist.pintura_ligacao?.taxa_pintura?.resultado || '-'}
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {checklist.pintura_ligacao?.taxa_pintura?.conforme === true ? 'Sim' : checklist.pintura_ligacao?.taxa_pintura?.conforme === false ? 'Não' : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5">Resíduo da Emulsão:</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.pintura_ligacao?.residuo_emulsao?.realizado} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.pintura_ligacao?.residuo_emulsao?.realizado} isYesColumn={false} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {checklist.pintura_ligacao?.residuo_emulsao?.resultado || '-'}
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5">Taxa de Pintura Residual:</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.pintura_ligacao?.taxa_pintura_residual?.realizado} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.pintura_ligacao?.taxa_pintura_residual?.realizado} isYesColumn={false} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {checklist.pintura_ligacao?.taxa_pintura_residual?.resultado || '-'}
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {checklist.pintura_ligacao?.taxa_pintura_residual?.conforme === true ? 'Sim' : checklist.pintura_ligacao?.taxa_pintura_residual?.conforme === false ? 'Não' : '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            <SectionTitle>Controle de Aplicação</SectionTitle>
            <div className="grid grid-cols-2 gap-1 mb-0.5" style={{ fontSize: '10px' }}>
              <div>
                <p><strong>km/estaca inicial:</strong> {checklist.controle_aplicacao?.km_estaca_inicial || '-'}</p>
                <p><strong>Lado:</strong> {checklist.controle_aplicacao?.lado_inicial || '-'}</p>
              </div>
              <div>
                <p><strong>Quantidade aplicada (cargas):</strong> {checklist.controle_aplicacao?.quantidade_aplicada_cargas || '-'}</p>
              </div>
              <div>
                <p><strong>km/estaca final:</strong> {checklist.controle_aplicacao?.km_estaca_final || '-'}</p>
                <p><strong>Lado:</strong> {checklist.controle_aplicacao?.lado_final || '-'}</p>
              </div>
              <div>
                <p><strong>Quantidade aplicada (t):</strong> {checklist.controle_aplicacao?.quantidade_aplicada_toneladas || '-'}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '10px' }}>
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-0.5 text-left font-medium">Ensaio</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-10">Sim</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-10">Não</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-10">Qtde</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-20">Frequência</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-24">Limite</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-10">Sim</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium w-10">Não</th>
                  <th className="border border-slate-300 p-0.5 text-left font-medium">Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-0.5">Temp. de aplicação das cargas:</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.temp_aplicacao_cargas?.realizado} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.temp_aplicacao_cargas?.realizado} isYesColumn={false} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {checklist.controle_aplicacao?.temp_aplicacao_cargas?.quantidade || '-'}
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center" style={{ fontSize: '8px' }}>2 por carga</td>
                  <td className="border border-slate-300 p-0.5 text-center" style={{ fontSize: '8px' }}>Estabelecida em projeto</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.temp_aplicacao_cargas?.conforme} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.temp_aplicacao_cargas?.conforme} isYesColumn={false} />
                  </td>
                  <td className="border border-slate-300 p-0.5" rowSpan="2" style={{ fontSize: '8px' }}>
                    {checklist.controle_aplicacao?.observacoes || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5">Espessura da camada:</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.espessura_camada?.realizado} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.espessura_camada?.realizado} isYesColumn={false} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {checklist.controle_aplicacao?.espessura_camada?.quantidade || '-'}
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center" style={{ fontSize: '8px' }}>Para cada carga aplicada</td>
                  <td className="border border-slate-300 p-0.5 text-center" style={{ fontSize: '8px' }}>Estabelecida em projeto</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.espessura_camada?.conforme} isYesColumn={true} />
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    <CheckmarkColumn value={checklist.controle_aplicacao?.espessura_camada?.conforme} isYesColumn={false} />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-0.5 mb-0.5">
              <strong className="font-medium" style={{ fontSize: '10px' }}>Observações Gerais:</strong>
              <p style={{ fontSize: '8px' }}>{checklist.observacoes_gerais || 'Nenhuma observação adicional.'}</p>
            </div>
          </main>
          <div className="mt-auto pt-1 break-inside-avoid">
            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="text-center">
                <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                  <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
                  <p>{checklist.created_by}</p>
                  <p>em {formatDateBrasilia(checklist.created_date)}</p>
                </div>
                <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>{creatorUser?.position || 'Laboratorista Responsável'}</p></div>
              </div>
              
              <div className="text-center">
                {checklist.approved === true && checklist.approver_details ? (
                  <>
                    <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                      <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
                      <p>{checklist.approved_by}</p>
                      {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
                      <p>em {formatDateBrasilia(checklist.approved_date)}</p>
                    </div>
                    <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Aprovação</p></div>
                  </>
                ) : (
                  <>
                    <div className="h-10 mb-1"></div>
                    <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Aprovação</p></div>
                  </>
                )}
              </div>

              <div className="text-center">
                {checklist.client_signature?.signed_by ? (
                  <>
                    <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                      <p>Assinado digitalmente por</p>
                      <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
                      <p>{checklist.client_signature.signed_by}</p>
                      {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
                      <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
                    </div>
                    <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Engenheiro Cliente</p></div>
                  </>
                ) : (
                  <>
                    <div className="h-10 mb-1"></div>
                    <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Engenheiro Cliente</p></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Página 2: Ações Corretivas (se houver) --- */}
      {temAcoesCorretivas && (
        <div className="p-3 print:p-3 break-before-page relative" style={{ minHeight: '297mm', height: '297mm' }}>
          <div className="w-full max-w-[190mm] mx-auto relative" style={{ height: '100%' }}>
            <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} />
            <main className="mt-2">
              <SectionTitle>Ações Corretivas</SectionTitle>
              <div className="border-2 border-slate-400 rounded p-6 bg-white" style={{ minHeight: '500px' }}>
                <p className="font-bold text-base mb-4 text-slate-800">AÇÕES CORRETIVAS APONTADAS:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {checklist.acoes_corretivas_descricao}
                </p>
              </div>
            </main>
            <div className="absolute bottom-0 left-0 right-0 pt-1 break-inside-avoid">
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="text-center">
                  <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                    <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
                    <p>{checklist.created_by}</p>
                    <p>em {formatDateBrasilia(checklist.created_date)}</p>
                  </div>
                  <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>{creatorUser?.position || 'Laboratorista Responsável'}</p></div>
                </div>
                
                <div className="text-center">
                  {checklist.approved === true && checklist.approver_details ? (
                    <>
                      <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                        <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
                        <p>{checklist.approved_by}</p>
                        {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
                        <p>em {formatDateBrasilia(checklist.approved_date)}</p>
                      </div>
                      <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Aprovação</p></div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 mb-1"></div>
                      <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Aprovação</p></div>
                    </>
                  )}
                </div>

                <div className="text-center">
                  {checklist.client_signature?.signed_by ? (
                    <>
                      <div className="text-slate-500 mb-1 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                        <p>Assinado digitalmente por</p>
                        <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
                        <p>{checklist.client_signature.signed_by}</p>
                        {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
                        <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
                      </div>
                      <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Engenheiro Cliente</p></div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 mb-1"></div>
                      <div className="border-t border-gray-500 pt-1"><p style={{ fontSize: '8px' }}>Engenheiro Cliente</p></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="p-8 print:p-8 flex flex-col page-container min-h-screen break-before-page">
          <div className="w-full max-w-[190mm] mx-auto flex-grow flex flex-col">
            <header className="grid grid-cols-3 items-center border-b-2 border-gray-800 pb-2">
              <div className="flex justify-start">
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo Regional" 
                  className="h-16 object-contain" 
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl print:text-xl font-bold text-gray-800">Relatório Fotográfico Aplicação</h1>
                <p className="text-base print:text-sm text-gray-600">Obra: {obra?.name || 'N/A'}</p>
              </div>
              <div className="flex justify-end text-sm print:text-xs">
                <div className="border border-gray-400 p-2 rounded-md">
                  <p>{new Date(checklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                </div>
              </div>
            </header>
            <main className="flex-grow grid grid-cols-2 gap-4 mt-4">
              {chunk.map((fotoUrl, fotoIndex) => (
                <div key={fotoIndex} className="border p-2 rounded-lg break-inside-avoid flex flex-col" style={{ height: 'calc((100vh - 300px) / 3)' }}>
                  <div className="bg-gray-100 flex-grow flex items-center justify-center rounded overflow-hidden">
                    <img src={fotoUrl} alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <p className="text-center text-base print:text-sm mt-2 font-medium">
                    Foto {(pageIndex * 6) + fotoIndex + 1}
                  </p>
                </div>
              ))}
            </main>
            <footer className="mt-auto pt-2 break-inside-avoid">
            </footer>
          </div>
        </div>
      ))}

      {checklist.medicoes_geometricas?.medicoes?.length > 0 && (
        <div className="break-before-page p-3 print:p-3 min-h-screen flex flex-col">
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-10 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-800 whitespace-nowrap">Medição Geométrica de Campo</h1>
            </div>
            <div className="flex justify-end">
              <div className="border border-gray-400 p-1 rounded-md text-xs">
                <p className="font-semibold text-gray-800">
                  {new Date(checklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
              </div>
            </div>
          </header>

          <SectionTitle>Dados da Medição</SectionTitle>
          <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mb-0.5" style={{ fontSize: '9px' }}>
            <div>
              <p className="font-bold">EMPREITEIRA:</p>
              <p>{checklist.empreiteira || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold">TRECHO:</p>
              <p>{checklist.trecho || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold">SERVIÇO:</p>
              <p>{checklist.medicoes_geometricas?.servico || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold">RODOVIA:</p>
              <p>{checklist.rodovia || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold">SUBTRECHO:</p>
              <p>{checklist.medicoes_geometricas?.subtrecho || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold">FISCAL DE CAMPO:</p>
              <p>{checklist.inspetor_campo || 'N/A'}</p>
            </div>
          </div>

          <div className="flex-grow overflow-auto">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-400 p-1" colSpan="2">ESTACAS</th>
                  <th className="border border-slate-400 p-1" rowSpan="2">LADO</th>
                  <th className="border border-slate-400 p-1" rowSpan="2">FAIXA</th>
                  <th className="border border-slate-400 p-1" colSpan="3">GEOMÉTRICO</th>
                  <th className="border border-slate-400 p-1" rowSpan="2">PLACA</th>
                  <th className="border border-slate-400 p-1" rowSpan="2">QUANT.</th>
                  <th className="border border-slate-400 p-1" rowSpan="2">TEMPERATURA</th>
                  <th className="border border-slate-400 p-1" rowSpan="2">OBSERVAÇÕES</th>
                </tr>
                <tr>
                  <th className="border border-slate-400 p-1">INICIAL</th>
                  <th className="border border-slate-400 p-1">FINAL</th>
                  <th className="border border-slate-400 p-1">COMP.</th>
                  <th className="border border-slate-400 p-1">LARG.</th>
                  <th className="border border-slate-400 p-1">ALTURA</th>
                </tr>
              </thead>
              <tbody>
                {checklist.medicoes_geometricas.medicoes.map((medicao, index) => (
                  <tr key={index} className="even:bg-slate-50">
                    <td className="border border-slate-400 p-1 text-center">{medicao.estaca_inicial || '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.estaca_final || '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.lado || '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.faixa || '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.comprimento !== null ? medicao.comprimento.toFixed(2) : '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.largura !== null ? medicao.largura.toFixed(2) : '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.altura !== null ? medicao.altura.toFixed(2) : '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.placa || '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.quantidade !== null ? medicao.quantidade.toFixed(2) : '-'}</td>
                    <td className="border border-slate-400 p-1 text-center">{medicao.temperatura !== null ? `${medicao.temperatura.toFixed(1)}°C` : '-'}</td>
                    <td className="border border-slate-400 p-1 text-xs">{medicao.observacoes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="mt-6">
            <div className="grid grid-cols-3 gap-8 text-center text-xs">
              <div>
                {checklist.laboratorista_name && (
                  <>
                    <div className="mb-2 text-slate-500 h-24 flex flex-col justify-end">
                      <p>Assinado digitalmente por</p>
                      <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
                      <p>{checklist.created_by}</p>
                      <p>em {formatDateBrasilia(checklist.created_date)}</p>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-semibold">{creatorUser?.position || 'Laboratorista Responsável'}</p>
                    </div>
                  </>
                )}
              </div>
              <div>
                {checklist.approver_details ? (
                  <>
                    <div className="mb-2 text-slate-500 h-24 flex flex-col justify-end">
                      <p>Aprovado digitalmente por</p>
                      <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
                      <p>{checklist.approved_by}</p>
                      {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
                      <p>em {formatDateBrasilia(checklist.approved_date)}</p>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-semibold">Aprovação</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2 h-24"></div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-semibold">Aprovação</p>
                    </div>
                  </>
                )}
              </div>
              <div>
                {checklist.client_signature?.signed_by ? (
                  <>
                    <div className="mb-2 text-slate-500 h-24 flex flex-col justify-end">
                      <p>Assinado digitalmente por</p>
                      <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
                      <p>{checklist.client_signature.signed_by}</p>
                      {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
                      <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-semibold">Engenheiro Cliente</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2 h-24"></div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-semibold">Engenheiro Cliente</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}