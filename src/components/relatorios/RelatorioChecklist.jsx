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

const TabelaControleAgregados = ({ controle_agregados }) => {
  const data = controle_agregados || [];

  return (
    <table className="w-full print:text-base border-collapse border border-slate-300 text-sm">
      <thead className="bg-slate-100">
        <tr className="text-base print:text-base">
          <th className="border border-slate-300 p-2 print:p-1 font-medium text-left">Agregado</th>
          <th className="border border-slate-300 p-2 print:p-1 font-medium text-center">Estoque Coberto?</th>
          <th className="border border-slate-300 p-2 print:p-1 font-medium text-center">Material Homogeneizado?</th>
          <th className="border border-slate-300 p-2 print:p-1 font-medium text-center">Granulometria Individual?</th>
        </tr>
      </thead>
      <tbody className="text-base print:text-base">
        {data.length > 0 ? data.map((ag, index) => (
          <tr key={index}>
            <td className="border border-slate-300 p-2 print:p-1 font-medium bg-slate-50">{ag.nome}</td>
            <td className="border border-slate-300 p-2 print:p-1 text-center"><Checkmark checked={ag.estoque_coberto} /></td>
            <td className="border border-slate-300 p-2 print:p-1 text-center"><Checkmark checked={ag.material_homogeneizado} /></td>
            <td className="border border-slate-300 p-2 print:p-1 text-center"><Checkmark checked={ag.granulometria_individual} /></td>
          </tr>
        )) : (
          <tr>
            <td colSpan="4" className="text-center p-4 print:p-1 italic text-slate-500">Nenhum agregado registrado.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const TabelaControleCAUQ = ({ controle_cauq, project }) => {
  const data = controle_cauq || {};
  const ensaios = [
    { label: 'Ext. Ligante (Rotarex)', key: 'extracao_ligante_rotarex', padrao: project?.teor_ligante ? `${project.teor_ligante.min} a ${project.teor_ligante.max} %` : 'N/A' },
    { label: 'Ext. Ligante (Soxhlet)', key: 'extracao_ligante_soxhlet', padrao: project?.teor_ligante ? `${project.teor_ligante.min} a ${project.teor_ligante.max} %` : 'N/A' },
    { label: 'Granulometria', key: 'granulometria', padrao: 'Faixa de trabalho' },
    { label: 'Densidade RICE', key: 'densidade_rice', padrao: project?.densidade_maxima_medida ? `${project.densidade_maxima_medida} g/cm³` : 'N/A', noConformity: true },
    { label: 'Densidade Aparente', key: 'densidade_aparente', padrao: project?.massa_especifica_aparente ? `${project.massa_especifica_aparente} g/cm³` : 'N/A', noConformity: true },
    { label: 'Volume de Vazios', key: 'volume_vazios', padrao: project?.volume_vazios ? `${project.volume_vazios.min} a ${project.volume_vazios.max} %` : 'N/A' },
    { label: 'RBV', key: 'rbv', padrao: project?.rbv ? `${project.rbv.min} a ${project.rbv.max} %` : 'N/A' },
    { label: 'RTCD 25°C', key: 'rtcd_25c', padrao: project?.rtcd ? `> ${project.rtcd.min} MPa` : 'N/A' },
    { label: 'Estabilidade', key: 'estabilidade', padrao: project?.estabilidade ? `> ${project.estabilidade.min} N` : 'N/A' },
    { label: 'Fluência', key: 'fluencia', padrao: project?.fluencia ? `${project.fluencia.min} a ${project.fluencia.max} mm` : 'Indicativo' },
  ];

  const formatResultado = (ensaioData) => {
    if (!ensaioData) return '-';
    
    // Se tiver resultados em array
    if (Array.isArray(ensaioData.resultados) && ensaioData.resultados.length > 0) {
      const resultadosValidos = ensaioData.resultados.filter(r => r !== null && r !== undefined);
      if (resultadosValidos.length === 0) return '-';
      
      if (resultadosValidos.length === 1) {
        return resultadosValidos[0];
      }
      
      return resultadosValidos.join(' / ');
    }
    
    // Fallback para formato antigo (resultado único)
    if (ensaioData.resultado !== null && ensaioData.resultado !== undefined) {
      return ensaioData.resultado;
    }
    
    return '-';
  };

  const formatConformidade = (conforme) => {
    if (conforme === null || conforme === undefined) {
      return <span className="text-slate-500 text-xl">-</span>;
    }
    if (conforme === true) {
      return <span className="text-green-600 font-bold text-2xl">✓</span>;
    }
    return <span className="text-red-600 font-bold text-2xl">✗</span>;
  };

  return (
    <div className="w-full">
      <SectionTitle>Controle de CAUQ</SectionTitle>
      <table className="w-full print:text-base border-collapse border border-slate-400">
        <thead>
          <tr className="bg-slate-100 text-base print:text-base">
            <th className="border border-slate-300 p-2 print:p-1 font-medium">Ensaio</th>
            <th className="border border-slate-300 p-2 print:p-1 font-medium">Realizado</th>
            <th className="border border-slate-300 p-2 print:p-1 font-medium">Qtde</th>
            <th className="border border-slate-300 p-2 print:p-1 font-medium">Resultado</th>
            <th className="border border-slate-300 p-2 print:p-1 font-medium">Padrão do Projeto</th>
            <th className="border border-slate-300 p-2 print:p-1 font-medium">Conformidade</th>
          </tr>
        </thead>
        <tbody className="text-base print:text-base">
          {ensaios.map(ensaio => {
            const ensaioData = data[ensaio.key];
            const resultado = formatResultado(ensaioData);
            
            return (
              <tr key={ensaio.key}>
                <td className="border border-slate-300 p-2 print:p-1 font-medium bg-slate-50">{ensaio.label}</td>
                <td className="border border-slate-300 p-2 print:p-1 text-center"><Checkmark checked={ensaioData?.realizado} /></td>
                <td className="border border-slate-300 p-2 print:p-1 text-center">{ensaioData?.quantidade ?? '-'}</td>
                <td className="border border-slate-300 p-2 print:p-1 text-center">{resultado}</td>
                <td className="border border-slate-300 p-2 print:p-1 text-center">{ensaio.padrao}</td>
                <td className="border border-slate-300 p-2 print:p-1 text-center">
                  {ensaio.noConformity ? <span className="text-slate-500 text-xl">-</span> : formatConformidade(ensaioData?.conforme)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <h2 className="text-lg print:text-base font-bold text-center bg-slate-100 p-1 my-2 uppercase tracking-wider">{children}</h2>
);

const ReportPrintHeader = ({ checklist, obra, regional, project }) => (
  <div>
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-2">
      <div className="flex justify-start">
        <img 
          src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
          alt="Logo Regional" 
          className="h-16 object-contain" 
        />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-800">Controle Tecnológico de Usinagem</h1>
      </div>
      <div className="flex justify-end">
         <div className="border border-gray-400 p-2 rounded-md text-base print:text-sm">
            <p className="font-semibold text-gray-800">
              {new Date(checklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </p>
         </div>
      </div>
    </header>
    <main className="text-base print:text-base mt-2">
      <SectionTitle>Dados da Obra e Projeto</SectionTitle>
      <div className="grid grid-cols-4 gap-x-4 gap-y-2">
        <div>
          <p className="font-bold">CLIENTE:</p>
          <p>{regional?.cliente || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">PROJETO:</p>
          <p>{project?.name || checklist.projeto_utilizado || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">PEDREIRA:</p>
          <p>{checklist.pedreira || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">INSPETOR:</p>
          <p>{checklist.inspetor_campo || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">OBRA:</p>
          <p>{obra?.name || 'N/A'}</p>
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
          <p className="font-bold">JORNADA:</p>
          <p>{checklist.jornada?.horario_inicio && checklist.jornada?.horario_fim ? `${checklist.jornada.horario_inicio} - ${checklist.jornada.horario_fim}` : 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">USINA:</p>
          <p>{checklist.usina}</p>
        </div>
        <div>
          <p className="font-bold">LIGANTE:</p>
          <p>{checklist.ligante || 'N/A'}</p>
        </div>
      </div>
    </main>
  </div>
);

const ReportFooter = ({ checklist, formatDateBrasilia }) => (
    <footer className="mt-2">
       <div className="grid grid-cols-3 gap-8 items-end">
        <div className="text-center">
          <div className="text-sm print:text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
            <p>Assinado digitalmente por</p>
            <p className="font-bold text-slate-600">{checklist.laboratorista_name}</p>
            <p>{checklist.created_by}</p>
            <p>em {formatDateBrasilia(checklist.created_date)}</p>
          </div>
          <div className="border-t border-gray-500 pt-2"><p className="text-sm print:text-xs">Laboratorista Responsável</p></div>
        </div>
        <div className="text-center">
           {checklist.approver_details ? (
            <>
              <div className="text-sm print:text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                <p>Aprovado digitalmente por</p>
                <p className="font-bold text-slate-600">{checklist.approver_details.name}</p>
                <p>{checklist.approved_by}</p>
                {checklist.approver_details.crea_number && <p>CREA: {checklist.approver_details.crea_number}</p>}
                <p>em {formatDateBrasilia(checklist.approved_date)}</p>
              </div>
              <div className="border-t border-gray-500 pt-2"><p className="text-sm print:text-xs">{checklist.approver_details.position}</p></div>
            </>
          ) : ( <> <div className="h-24 mb-2"></div> <div className="border-t border-gray-500 pt-2"><p className="text-sm print:text-xs">Aprovação</p></div> </> )}
        </div>
        <div className="text-center">
          {checklist.client_signature?.signed_by ? (
             <>
                <div className="text-sm print:text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                  <p>Assinado digitalmente por</p>
                  <p className="font-bold text-slate-600">{checklist.client_signature.engineer_name}</p>
                  <p>{checklist.client_signature.signed_by}</p>
                  {checklist.client_signature.crea_number && <p>CREA: {checklist.client_signature.crea_number}</p>}
                  <p>em {formatDateBrasilia(checklist.client_signature.signed_date)}</p>
                </div>
                <div className="border-t border-gray-500 pt-2"><p className="text-sm print:text-xs">Engenheiro Cliente</p></div>
             </>
          ) : ( <> <div className="h-24 mb-2"></div> <div className="border-t border-gray-500 pt-2"><p className="text-sm print:text-xs">Engenheiro Cliente</p></div> </> )}
        </div>
      </div>
    </footer>
);


export default function RelatorioChecklist({ checklist, obra, regional, project, user }) {
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
  const temControleLigante = checklist.controle_ligante_ativo === true;
  const totalPages = 1 + 1 + (temControleLigante ? 1 : 0) + (temAcoesCorretivas ? 1 : 0) + photoChunks.length;

  return (
    <div className="bg-white font-sans">
      {/* --- Página 1: Agregados & Produção --- */}
      <div className="p-8 print:p-8 flex flex-col page-container min-h-screen">
        <div className="w-full max-w-[190mm] mx-auto flex-grow flex flex-col">
            <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />
            <main className="flex-grow">
              <SectionTitle>Controle de Agregados</SectionTitle>
              <TabelaControleAgregados controle_agregados={checklist.controle_agregados} />
              
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <strong className="font-medium">Equivalente de Areia Realizado?</strong>
                    <span className="ml-2 font-medium">
                      {checklist.equivalente_areia_status === 'realizado' ? <span className="text-green-600">Sim</span> :
                       checklist.equivalente_areia_status === 'nao_realizado' ? <span className="text-red-600">Não</span> :
                       <span className="text-slate-500">N/A</span>}
                    </span>
                    {checklist.equivalente_areia_status === 'realizado' && checklist.equivalente_areia_quantidade > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-slate-700">Quantidade: {checklist.equivalente_areia_quantidade} ensaio(s)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {checklist.equivalente_areia_resultados?.map((resultado, index) => (
                            <div key={index} className="bg-slate-50 border border-slate-200 rounded p-2">
                              <p className="text-xs text-slate-600">Resultado {index + 1}:</p>
                              <p className="text-base font-semibold text-slate-800">{resultado !== null ? `${resultado}%` : '-'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {checklist.observacoes_agregados && (
                    <div className="flex-1">
                      <strong className="font-medium">Observações:</strong>
                      <p className="text-sm mt-1">{checklist.observacoes_agregados.substring(0, 500)}</p>
                    </div>
                  )}
                </div>
              </div>

              <SectionTitle>Acompanhamento da Produção</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                {(checklist.rodadas_producao || []).map((rodada, index) => (
                  <div key={index} className="border border-slate-200 p-2 rounded-md space-y-1 text-sm">
                    <h3 className="font-bold text-center">Rodada {rodada.numero_rodada}</h3>
                    <p><strong className="font-medium">Horário:</strong> {rodada.horario_inicio} às {rodada.horario_termino}</p>
                    <p><strong className="font-medium">Temp. Ambiente:</strong> {rodada.temperatura_ambiente}°C</p>
                    <p><strong className="font-medium">Clima:</strong> {rodada.condicoes_climaticas}</p>
                    <p><strong className="font-medium">Qtde. Produzida:</strong> {rodada.quantidade_produzida} t</p>
                    <p><strong className="font-medium">Controle de Cargas (Qtde):</strong> {rodada.controle_cargas_qtde}</p>
                    <p><strong className="font-medium">Caminhões Enlonados:</strong> <Checkmark checked={rodada.caminhoes_enlonados} /></p>
                    <p><strong className="font-medium">Temp. Massa:</strong> T1: {rodada.temperatura_massa_t1}°C / T2: {rodada.temperatura_massa_t2}°C</p>
                  </div>
                ))}
              </div>
            </main>
            <footer className="mt-auto pt-2 text-center text-sm print:text-xs text-gray-400">
              Página 1 de {totalPages}
            </footer>
        </div>
      </div>
      
      {/* --- Página 2: Controle de CAUQ --- */}
      <div className="p-8 print:p-8 flex flex-col page-container min-h-screen break-before-page">
        <div className="w-full max-w-[190mm] mx-auto flex-grow flex flex-col">
          <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />
          <main className="flex-grow">
            <TabelaControleCAUQ controle_cauq={checklist.controle_cauq} project={project} />
            <div className="mt-2"><strong className="font-medium">Observações Gerais:</strong> {checklist.observacoes?.substring(0, 500) || 'N/A'}</div>
          </main>
          <ReportFooter checklist={checklist} formatDateBrasilia={formatDateBrasilia} />
          <footer className="mt-auto pt-2 text-center text-sm print:text-xs text-gray-400">
             Página 2 de {totalPages}
          </footer>
        </div>
      </div>

      {/* --- Página 3: Controle de Ligante (se houver) --- */}
      {temControleLigante && (
        <div className="p-8 print:p-8 flex flex-col page-container min-h-screen break-before-page">
          <div className="w-full max-w-[190mm] mx-auto flex-grow flex flex-col">
            <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />
            <main className="flex-grow mt-6">
              <SectionTitle>Controle de Qualidade de Ligantes</SectionTitle>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <strong className="font-medium text-sm">Fornecedor:</strong>
                  <p className="text-base">{checklist.controle_ligante?.fornecedor || 'N/A'}</p>
                </div>
                <div>
                  <strong className="font-medium text-sm">Nota Fiscal:</strong>
                  <p className="text-base">{checklist.controle_ligante?.nota_fiscal || 'N/A'}</p>
                </div>
                <div>
                  <strong className="font-medium text-sm">Placa Carreta:</strong>
                  <p className="text-base">{checklist.controle_ligante?.placa_carreta || 'N/A'}</p>
                </div>
                <div>
                  <strong className="font-medium text-sm">Quantidade:</strong>
                  <p className="text-base">{checklist.controle_ligante?.quantidade_toneladas ? `${checklist.controle_ligante.quantidade_toneladas} t` : 'N/A'}</p>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-sm mt-4">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left font-semibold">Ensaio</th>
                    <th className="border border-slate-300 p-2 text-center font-semibold">Unidade</th>
                    <th className="border border-slate-300 p-2 text-center font-semibold">Resultado</th>
                    <th className="border border-slate-300 p-2 text-center font-semibold">Limite Esp.</th>
                    <th className="border border-slate-300 p-2 text-center font-semibold">Especificação</th>
                    <th className="border border-slate-300 p-2 text-center font-semibold">Conformidade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2">
                      Viscosidade Brookfield a {checklist.controle_ligante?.viscosidade_1_temp || '-'}ºC, SP {checklist.controle_ligante?.viscosidade_1_sp || '-'} [{checklist.controle_ligante?.viscosidade_1_rpm || '-'} rpm]
                    </td>
                    <td className="border border-slate-300 p-2 text-center">cP</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{checklist.controle_ligante?.viscosidade_1_resultado || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center bg-blue-50">{checklist.controle_ligante?.viscosidade_1_limite || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center">ABNT NBR - 15184</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {checklist.controle_ligante?.viscosidade_1_conforme ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                  </tr>
                  <tr className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2">
                      Viscosidade Brookfield a {checklist.controle_ligante?.viscosidade_2_temp || '-'}ºC, SP {checklist.controle_ligante?.viscosidade_2_sp || '-'} [{checklist.controle_ligante?.viscosidade_2_rpm || '-'} rpm]
                    </td>
                    <td className="border border-slate-300 p-2 text-center">cP</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{checklist.controle_ligante?.viscosidade_2_resultado || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center bg-blue-50">{checklist.controle_ligante?.viscosidade_2_limite || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center">ABNT NBR - 15529</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {checklist.controle_ligante?.viscosidade_2_conforme ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                  </tr>
                  <tr className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2">
                      Viscosidade Brookfield a {checklist.controle_ligante?.viscosidade_3_temp || '-'}ºC, SP {checklist.controle_ligante?.viscosidade_3_sp || '-'} [{checklist.controle_ligante?.viscosidade_3_rpm || '-'} rpm]
                    </td>
                    <td className="border border-slate-300 p-2 text-center">cP</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{checklist.controle_ligante?.viscosidade_3_resultado || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center bg-blue-50">{checklist.controle_ligante?.viscosidade_3_limite || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center">ABNT NBR - 15184</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {checklist.controle_ligante?.viscosidade_3_conforme ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                  </tr>
                  <tr className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2">Recuperação Elástica</td>
                    <td className="border border-slate-300 p-2 text-center">%</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{checklist.controle_ligante?.recuperacao_elastica_resultado || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center bg-blue-50">{checklist.controle_ligante?.recuperacao_elastica_limite || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center">ABNT NBR - 15086</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {checklist.controle_ligante?.recuperacao_elastica_conforme ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                  </tr>
                  <tr className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2">Penetração (100g, 5s, 25ºC)</td>
                    <td className="border border-slate-300 p-2 text-center">0,1 mm</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{checklist.controle_ligante?.penetracao_resultado || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center bg-blue-50">{checklist.controle_ligante?.penetracao_limite || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center">ABNT NBR - 6576</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {checklist.controle_ligante?.penetracao_conforme ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                  </tr>
                  <tr className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2">Ponto de Amolecimento</td>
                    <td className="border border-slate-300 p-2 text-center">ºC</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{checklist.controle_ligante?.ponto_amolecimento_resultado || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center bg-blue-50">{checklist.controle_ligante?.ponto_amolecimento_limite || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center">ABNT NBR - 6560</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {checklist.controle_ligante?.ponto_amolecimento_conforme ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                  </tr>
                  <tr className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2">Ponto de Fulgor</td>
                    <td className="border border-slate-300 p-2 text-center">ºC</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{checklist.controle_ligante?.ponto_fulgor_resultado || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center bg-blue-50">{checklist.controle_ligante?.ponto_fulgor_limite || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center">ABNT NBR - 11341</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {checklist.controle_ligante?.ponto_fulgor_conforme ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </main>
            <ReportFooter checklist={checklist} formatDateBrasilia={formatDateBrasilia} />
            <footer className="pt-1 text-center text-sm print:text-xs text-gray-400">
              Página 3 de {totalPages}
            </footer>
          </div>
        </div>
      )}

      {/* --- Página 4 (ou 3 se não houver ligante): Ações Corretivas (se houver) --- */}
      {temAcoesCorretivas && (
        <div className="p-8 print:p-8 flex flex-col page-container min-h-screen break-before-page">
          <div className="w-full max-w-[190mm] mx-auto flex-grow flex flex-col">
            <ReportPrintHeader checklist={checklist} obra={obra} regional={regional} project={project} />
            <main className="flex-grow mt-6">
              <SectionTitle>Ações Corretivas Realizadas</SectionTitle>
              <div className="border-2 border-slate-300 rounded-lg p-6 bg-white min-h-48">
                <p className="text-base leading-relaxed whitespace-pre-wrap text-justify">{checklist.acoes_corretivas_descricao}</p>
              </div>
            </main>
            <ReportFooter checklist={checklist} formatDateBrasilia={formatDateBrasilia} />
            <footer className="mt-auto pt-2 text-center text-sm print:text-xs text-gray-400">
              Página {temControleLigante ? 4 : 3} de {totalPages}
            </footer>
          </div>
        </div>
      )}

      {/* --- Páginas seguintes: Relatório Fotográfico --- */}
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
                  <h1 className="text-2xl print:text-xl font-bold text-gray-800">Relatório Fotográfico  Checklist</h1>
                  <p className="text-base print:text-sm text-gray-600">Obra: {obra?.name || 'N/A'}</p>
                </div>
                <div className="flex justify-end text-sm print:text-xs">
                   <div className="border border-gray-400 p-2 rounded-md">
                      <p>{new Date(checklist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                   </div>
                </div>
            </header>
            <main className="flex-grow grid grid-cols-2 gap-4 mt-4" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
              {chunk.map((fotoUrl, fotoIndex) => (
                <div key={fotoIndex} className="border p-2 rounded-lg break-inside-avoid flex flex-col" style={{ height: 'calc((100vh - 300px) / 3)' }}>
                  <div className="bg-gray-100 flex-grow flex items-center justify-center rounded overflow-hidden">
                    <img 
                      src={fotoUrl} 
                      alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-center text-base print:text-sm mt-2 font-medium">
                    Foto {(pageIndex * 6) + fotoIndex + 1}
                  </p>
                </div>
              ))}
            </main>
            <footer className="mt-auto pt-2 text-center text-sm print:text-xs text-gray-500">
              Página {pageIndex + 3 + (temControleLigante ? 1 : 0) + (temAcoesCorretivas ? 1 : 0)} de {totalPages}
            </footer>
          </div>
        </div>
      ))}
    </div>
  );
}