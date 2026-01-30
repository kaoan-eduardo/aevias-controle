import React from 'react';

const Checkmark = ({ checked }) => {
  if (checked === true) {
    return <span className="font-bold text-sm text-green-600">✓</span>;
  }
  return <span className="text-slate-500 text-sm">-</span>;
};

const XMark = ({ checked }) => {
  if (checked === false) {
    return <span className="font-bold text-sm text-red-600">✗</span>;
  }
  return <span className="text-slate-500 text-sm">-</span>;
};


const SectionTitle = ({ children }) => (
  <h2 className="text-[10px] font-bold text-center bg-slate-100 p-1 my-1 uppercase tracking-wider">{children}</h2>
);

const ReportPrintHeader = ({ checklist, obra, regional, project }) => (
  <div>
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-0.5 mb-1">
      <div className="flex justify-start">
        <img 
          src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
          alt="Logo Regional" 
          className="h-8 object-contain" 
        />
      </div>
      <div className="text-center">
        <h1 className="text-xs font-bold text-gray-800">Controle Tecnológico - Aplicação de Microrrevestimento</h1>
      </div>
      <div className="flex justify-end">
        <div className="border border-gray-400 p-0.5 rounded-md text-[10px]">
          <p className="font-semibold text-gray-800">
            {new Date(checklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </p>
        </div>
      </div>
    </header>
    <main className="text-sm mt-0.5">
      <SectionTitle>Dados da Obra</SectionTitle>
      <div className="grid grid-cols-4 gap-x-2 gap-y-1" style={{ fontSize: '9px' }}>
        <div>
          <p className="font-bold">CLIENTE:</p>
          <p>{regional?.cliente || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">PROJETO UTILIZADO:</p>
          <p>{project?.name || checklist.projeto_utilizado || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">FAIXA ESPECIFICADA:</p>
          <p>{checklist.faixa_especificada || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">ENSAIO REALIZADO POR:</p>
          <p>{checklist.ensaio_realizado_por || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">RODOVIA:</p>
          <p>{checklist.rodovia}</p>
        </div>
        <div>
          <p className="font-bold">LIGANTE:</p>
          <p>{checklist.ligante || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">TRECHO:</p>
          <p>{checklist.trecho}</p>
        </div>
        <div>
          <p className="font-bold">PEDREIRA:</p>
          <p>{checklist.pedreira || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">OBRA:</p>
          <p>{obra?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">EMPREITEIRA:</p>
          <p>{checklist.empreiteira || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">FISCAL DE CAMPO:</p>
          <p>{checklist.inspetor_campo || checklist.laboratorista_name || 'N/A'}</p>
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

const ReportFooter = ({ checklist, formatDateBrasilia }) => (
  <footer className="mt-2 pt-1 break-inside-avoid">
    <div className="grid grid-cols-3 gap-2 items-end">
      <div className="text-center">
        <div className="text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
          <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
          <p>{checklist.created_by}</p>
          <p>em {formatDateBrasilia(checklist.created_date)}</p>
        </div>
        <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Laboratorista Responsável</p></div>
      </div>
      
      <div className="text-center">
        {checklist.approved === true && checklist.approver_details ? (
          <>
            <div className="text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
              <p>Assinado digitalmente por</p>
              <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
              <p>{checklist.approved_by}</p>
              {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
              <p>em {formatDateBrasilia(checklist.approved_date)}</p>
            </div>
            <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Aprovação</p></div>
          </>
        ) : (
          <>
            <div className="h-10 mb-0.5"></div>
            <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Aprovação</p></div>
          </>
        )}
      </div>

      <div className="text-center">
        {checklist.client_signature?.signed_by ? (
          <>
            <div className="text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
              <p>Assinado digitalmente por</p>
              <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
              <p>{checklist.client_signature.signed_by}</p>
              {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
              <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
            </div>
            <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Engenheiro Cliente</p></div>
          </>
        ) : (
          <>
            <div className="h-10 mb-0.5"></div>
            <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Engenheiro Cliente</p></div>
          </>
        )}
      </div>
    </div>
  </footer>
);

export default function RelatorioChecklistMRAF({ checklist, obra, regional, project }) {
  const [compressedPhotos, setCompressedPhotos] = React.useState([]);
  const [isCompressing, setIsCompressing] = React.useState(true);

  React.useEffect(() => {
    const compressImages = async () => {
      if (!checklist?.fotos || checklist.fotos.length === 0) {
        setIsCompressing(false);
        return;
      }

      const compressed = await Promise.all(
        checklist.fotos.map(async (photoUrl) => {
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
            
            // Reduzir dimensões para 50% do original
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = width * ratio;
              height = height * ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Comprimir com qualidade de 50%
            return canvas.toDataURL('image/jpeg', 0.5);
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

  const formatDateBrasilia = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  // Agrupar fotos em páginas de 6 fotos cada
  const photosPerPage = 6;
  const photoPages = compressedPhotos.length > 0 
    ? Array.from({ length: Math.ceil(compressedPhotos.length / photosPerPage) }, (_, i) =>
        compressedPhotos.slice(i * photosPerPage, (i + 1) * photosPerPage)
      )
    : [];

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white print:bg-white" style={{ fontSize: '9px' }}>
      <div className="relative min-h-[297mm] p-4 print:p-4 flex flex-col">
        <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />

        <div className="flex-1 space-y-0.5">
          {/* CONDIÇÕES CLIMÁTICAS */}
          <div className="break-inside-avoid mt-0">
            <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '9px' }}>
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-0.5 text-center font-medium">MANHÃ</th>
                  <th className="border border-slate-300 p-0.5 text-center font-medium">TARDE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {checklist.periodos_clima?.map((periodo, index) => (
                    <td key={index} className="border border-slate-300 p-0.5 text-center">
                      <p className="font-medium">Temp. Ambiente (°C): {periodo.temperatura_ambiente || '-'}</p>
                      <div className="mt-0.5">
                        {periodo.condicoes_climaticas === 'bom' && <p className="font-bold text-slate-800 text-sm">☀️ Bom</p>}
                        {periodo.condicoes_climaticas === 'nublado' && <p className="font-bold text-slate-800 text-sm">⛅ Nublado</p>}
                        {periodo.condicoes_climaticas === 'chuva' && <p className="font-bold text-slate-800 text-sm">🌧️ Chuva</p>}
                        {!periodo.condicoes_climaticas && <p className="text-slate-500">-</p>}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* CONDICIONAMENTO DOS INSUMOS */}
          <div className="break-inside-avoid">
            <SectionTitle>Condicionamento dos Insumos</SectionTitle>
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-0.5 py-0.5 text-left">Serviço</th>
                  <th className="border border-slate-300 px-0.5 py-0.5 text-center" style={{ width: '35px' }}>Sim</th>
                  <th className="border border-slate-300 px-0.5 py-0.5 text-center" style={{ width: '35px' }}>Não</th>
                  <th className="border border-slate-300 px-0.5 py-0.5 text-left">Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Agregados separados no canteiro?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.condicionamento_insumos?.agregados_separados} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.condicionamento_insumos?.agregados_separados} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5" rowSpan="5">
                    {checklist.condicionamento_insumos?.observacoes || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Agregados devidamente cobertos?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.condicionamento_insumos?.agregados_cobertos} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.condicionamento_insumos?.agregados_cobertos} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Filler utilizado:</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center bg-slate-50" colSpan="2">
                    {checklist.condicionamento_insumos?.filler_utilizado || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Utilização de aditivos?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.condicionamento_insumos?.utilizacao_aditivos} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.condicionamento_insumos?.utilizacao_aditivos} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Água contaminada?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.condicionamento_insumos?.agua_contaminada} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.condicionamento_insumos?.agua_contaminada} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PREPARAÇÃO DA SUPERFÍCIE */}
          <div className="break-inside-avoid">
            <SectionTitle>Acompanhamento da Condição e Preparação da Superfície</SectionTitle>
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-0.5 py-0.5 text-left">Serviço</th>
                  <th className="border border-slate-300 px-0.5 py-0.5 text-center" style={{ width: '35px' }}>Sim</th>
                  <th className="border border-slate-300 px-0.5 py-0.5 text-center" style={{ width: '35px' }}>Não</th>
                  <th className="border border-slate-300 px-0.5 py-0.5 text-left">Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Superfície úmida?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.preparacao_superficie?.superficie_umida} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.preparacao_superficie?.superficie_umida} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5" rowSpan="5">
                    {checklist.preparacao_superficie?.observacoes || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Temperatura do pavimento:</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center bg-slate-50" colSpan="2">
                    {checklist.preparacao_superficie?.temperatura_pavimento ? `${checklist.preparacao_superficie.temperatura_pavimento} °C` : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Pavimento apresenta patologias?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.preparacao_superficie?.pavimento_patologias} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.preparacao_superficie?.pavimento_patologias} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">Superfície fresada? (Se sim acima)</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.preparacao_superficie?.superficie_fresada} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.preparacao_superficie?.superficie_fresada} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5">A superfície foi limpa antes da aplicação?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <Checkmark checked={checklist.preparacao_superficie?.superficie_limpa} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-center">
                    <XMark checked={checklist.preparacao_superficie?.superficie_limpa} />
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-[7px] italic text-slate-600 mt-0.5">*Preferencialmente por vassouras mecânicas, podendo ser usados, também, processos manuais.</p>
          </div>

          {/* ACOMPANHAMENTO DA APLICAÇÃO */}
          <div className="break-inside-avoid">
            <SectionTitle>Acompanhamento da Aplicação</SectionTitle>
            <table className="w-full border-collapse text-center" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-0.5 py-0.5">Serviço</th>
                  <th className="border border-slate-300 px-0.5 py-0.5" style={{ width: '35px' }}>Sim</th>
                  <th className="border border-slate-300 px-0.5 py-0.5" style={{ width: '35px' }}>Não</th>
                  <th className="border border-slate-300 px-0.5 py-0.5">Resultado</th>
                  <th className="border border-slate-300 px-0.5 py-0.5">Limites DNIT 035/2018</th>
                  <th className="border border-slate-300 px-0.5 py-0.5">Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-left">Aguardado tempo necessário para rompimento/cura?</td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <Checkmark checked={checklist.acompanhamento_aplicacao?.tempo_rompimento_cura?.realizado} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <XMark checked={checklist.acompanhamento_aplicacao?.tempo_rompimento_cura?.realizado} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5 bg-slate-50">N/A</td>
                  <td className="border border-slate-300 px-0.5 py-0.5 bg-slate-50">N/A</td>
                  <td className="border border-slate-300 px-0.5 py-0.5" rowSpan="4">
                    {checklist.acompanhamento_aplicacao?.observacoes || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-left">Taxa de Aplicação</td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <Checkmark checked={checklist.acompanhamento_aplicacao?.taxa_aplicacao?.realizado} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <XMark checked={checklist.acompanhamento_aplicacao?.taxa_aplicacao?.realizado} />
                  </td>
                  <td className={`border border-slate-300 px-0.5 py-0.5 ${
                    checklist.acompanhamento_aplicacao?.taxa_aplicacao?.conforme === false ? 'text-red-600 font-bold' : ''
                  }`}>
                    {checklist.acompanhamento_aplicacao?.taxa_aplicacao?.resultado || '-'}
                    {checklist.acompanhamento_aplicacao?.taxa_aplicacao?.conforme === false && ' ⚠️'}
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5">8 kg/m² a 16 kg/m²</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-left">Resíduo da Emulsão</td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <Checkmark checked={checklist.acompanhamento_aplicacao?.residuo_emulsao?.realizado} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <XMark checked={checklist.acompanhamento_aplicacao?.residuo_emulsao?.realizado} />
                  </td>
                  <td className={`border border-slate-300 px-0.5 py-0.5 ${
                    checklist.acompanhamento_aplicacao?.residuo_emulsao?.conforme === false ? 'text-red-600 font-bold' : ''
                  }`}>
                    {checklist.acompanhamento_aplicacao?.residuo_emulsao?.resultado || '-'}
                    {checklist.acompanhamento_aplicacao?.residuo_emulsao?.conforme === false && ' ⚠️'}
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5">6,5% a 12,0%</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-0.5 py-0.5 text-left">Espessura da Camada</td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <Checkmark checked={checklist.acompanhamento_aplicacao?.espessura_camada?.realizado} />
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5">
                    <XMark checked={checklist.acompanhamento_aplicacao?.espessura_camada?.realizado} />
                  </td>
                  <td className={`border border-slate-300 px-0.5 py-0.5 ${
                    checklist.acompanhamento_aplicacao?.espessura_camada?.conforme === false ? 'text-red-600 font-bold' : ''
                  }`}>
                    {checklist.acompanhamento_aplicacao?.espessura_camada?.resultado || '-'}
                    {checklist.acompanhamento_aplicacao?.espessura_camada?.conforme === false && ' ⚠️'}
                  </td>
                  <td className="border border-slate-300 px-0.5 py-0.5">6 mm a 20 mm</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CONTROLE DE APLICAÇÃO */}
          <div className="break-inside-avoid">
            <SectionTitle>Controle de Aplicação</SectionTitle>
            <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '9px' }}>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-0.5 font-medium bg-slate-50 w-1/4">km/estaca inicial:</td>
                  <td className="border border-slate-300 p-0.5">{checklist.controle_aplicacao?.km_estaca_inicial || '-'}</td>
                  <td className="border border-slate-300 p-0.5 font-medium bg-slate-50 w-1/4">km/estaca final:</td>
                  <td className="border border-slate-300 p-0.5">{checklist.controle_aplicacao?.km_estaca_final || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5 font-medium bg-slate-50">Lado:</td>
                  <td className="border border-slate-300 p-0.5">{checklist.controle_aplicacao?.lado_inicial || '-'}</td>
                  <td className="border border-slate-300 p-0.5 font-medium bg-slate-50">Lado:</td>
                  <td className="border border-slate-300 p-0.5">{checklist.controle_aplicacao?.lado_final || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-0.5 font-medium bg-slate-50" colSpan="2">Quantidade aplicada (m²):</td>
                  <td className="border border-slate-300 p-0.5" colSpan="2">{checklist.controle_aplicacao?.quantidade_aplicada_m2 || '-'}</td>
                </tr>
                {checklist.controle_aplicacao?.observacoes && (
                  <tr>
                    <td className="border border-slate-300 p-0.5 font-medium bg-slate-50">Observações:</td>
                    <td className="border border-slate-300 p-0.5" colSpan="3">{checklist.controle_aplicacao.observacoes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* OBSERVAÇÕES GERAIS */}
          {checklist.observacoes_gerais && (
            <div className="break-inside-avoid">
              <SectionTitle>Observações Gerais</SectionTitle>
              <div className="p-0.5 bg-white border border-slate-300 rounded text-[9px]">
                <p>{checklist.observacoes_gerais}</p>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-2 pt-1 break-inside-avoid">
          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="text-center">
              <div className="text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
                <p>{checklist.created_by}</p>
                <p>em {formatDateBrasilia(checklist.created_date)}</p>
              </div>
              <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Laboratorista Responsável</p></div>
            </div>
            
            <div className="text-center">
              {checklist.approved === true && checklist.approver_details ? (
                <>
                  <div className="text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                    <p>Assinado digitalmente por</p>
                    <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
                    <p>{checklist.approved_by}</p>
                    {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
                    <p>em {formatDateBrasilia(checklist.approved_date)}</p>
                  </div>
                  <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Aprovação</p></div>
                </>
              ) : (
                <>
                  <div className="h-10 mb-0.5"></div>
                  <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Aprovação</p></div>
                </>
              )}
            </div>

            <div className="text-center">
              {checklist.client_signature?.signed_by ? (
                <>
                  <div className="text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center" style={{ fontSize: '8px' }}>
                    <p>Assinado digitalmente por</p>
                    <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
                    <p>{checklist.client_signature.signed_by}</p>
                    {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
                    <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
                  </div>
                  <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Engenheiro Cliente</p></div>
                </>
              ) : (
                <>
                  <div className="h-10 mb-0.5"></div>
                  <div className="border-t border-gray-500 pt-0.5"><p style={{ fontSize: '9px' }}>Engenheiro Cliente</p></div>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* PÁGINA DE AÇÕES CORRETIVAS - Inserida ANTES das fotos */}
      {checklist.acoes_corretivas_realizado === true && checklist.acoes_corretivas_descricao && (
        <div className="break-before-page relative p-3 print:p-3 flex flex-col" style={{ minHeight: '297mm', maxHeight: '297mm' }}>
          <div className="w-full max-w-[190mm] mx-auto flex flex-col" style={{ height: '100%' }}>
            <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />

            <main className="flex-1 mt-2">
              <SectionTitle>Ações Corretivas</SectionTitle>
              <div className="border-2 border-slate-400 rounded p-6 bg-white" style={{ minHeight: '500px' }}>
                <p className="font-bold text-base mb-4 text-slate-800">AÇÕES CORRETIVAS APONTADAS:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {checklist.acoes_corretivas_descricao}
                </p>
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
            </div>
          </div>
        </div>
      )}

      {/* PÁGINAS DE FOTOS - CADA UMA COM HEADER */}
      {photoPages.map((photos, pageIndex) => (
        <div key={pageIndex} className="break-before-page relative min-h-[297mm] p-4 print:p-4 flex flex-col">
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-2 mb-4">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-10 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-800">Relatório Fotográfico - Checklist MRAF</h1>
              <p className="text-xs text-gray-600">Obra: {obra?.name || 'N/A'}</p>
            </div>
            <div className="flex justify-end">
              {/* Espaço reservado para alinhamento */}
            </div>
          </header>

          <div className="flex-1 flex items-stretch">
            <div className="grid grid-cols-2 gap-4 w-full auto-rows-fr">
              {photos.map((foto, index) => (
                <div key={index} className="break-inside-avoid flex flex-col">
                  <div className="flex-1 border-2 border-slate-300 rounded overflow-hidden bg-slate-50 flex items-center justify-center" style={{ minHeight: '240px', maxHeight: '240px' }}>
                    <img 
                      src={foto} 
                      alt={`Foto ${pageIndex * photosPerPage + index + 1}`} 
                      className="w-full h-full object-cover"
                      style={{ maxHeight: '240px' }}
                    />
                  </div>
                  <p className="text-center text-sm text-slate-600 mt-2 font-medium">
                    Foto {pageIndex * photosPerPage + index + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <footer className="mt-4 pt-2 break-inside-avoid">
          </footer>
        </div>
      ))}
    </div>
  );
}