import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function RelatorioChecklistConcretagem({ checklist }) {
  const [obra, setObra] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    loadRelatedData();
  }, [checklist]);

  const loadRelatedData = async () => {
    try {
      if (checklist.obra_id) {
        const obraData = await base44.entities.Obra.get(checklist.obra_id);
        setObra(obraData);
      }
      if (checklist.project_id) {
        const projectData = await base44.entities.Project.get(checklist.project_id);
        setProject(projectData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados relacionados:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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

  const getClimaEmoji = (condicao) => {
    switch(condicao) {
      case 'bom': return '☀️';
      case 'instavel': return '⛅';
      case 'chuva': return '🌧️';
      default: return '';
    }
  };

  const getClimaTexto = (condicao) => {
    switch(condicao) {
      case 'bom': return 'Bom';
      case 'instavel': return 'Instável';
      case 'chuva': return 'Chuva';
      default: return '-';
    }
  };

  const getPeriodoNome = (periodo) => {
    switch(periodo) {
      case 'manha': return 'MANHÃ';
      case 'tarde': return 'TARDE';
      case 'noite': return 'NOITE';
      default: return periodo.toUpperCase();
    }
  };

  const SectionTitle = ({ children }) => (
    <h2 className="text-sm print:text-xs font-bold text-center bg-slate-100 p-0.5 my-0.5 uppercase tracking-wider">{children}</h2>
  );

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

  const chunkArray = (array, chunkSize) => {
    const chunks = [];
    if (!array) return chunks;
    const validPhotos = array.filter(photo => photo && photo.trim() !== '');
    for (let i = 0; i < validPhotos.length; i += chunkSize) {
      chunks.push(validPhotos.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const photoChunks = chunkArray(checklist.fotos, 6);
  const cargas = checklist.cargas_concreto || [];
  const temMultiplasCargas = cargas.length > 1;
  const totalPages = (temMultiplasCargas ? cargas.length : 1) + photoChunks.length;

  // Componente do Header para reutilização
  const ReportHeader = ({ showDate = true }) => (
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1">
      <div className="flex justify-start">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" alt="Logo Afirmaevias" className="h-12" />
      </div>
      <div className="text-center">
        <h1 className="text-base font-bold text-gray-800">Controle Tecnológico de Concreto</h1>
      </div>
      <div className="flex justify-end">
        {showDate && (
          <div className="border border-gray-400 p-1 rounded-md text-sm print:text-xs bg-white">
            <p className="font-semibold text-gray-800">
              {formatDate(checklist.data)}
            </p>
          </div>
        )}
      </div>
    </header>
  );

  // Componente do Footer COM assinaturas (apenas última página)
  const ReportFooterWithSignatures = () => (
    <footer className="mt-auto pt-1">
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="text-center">
          <div className="text-xs print:text-xs text-slate-500 mb-0.5 h-14 flex flex-col justify-end items-center">
            {checklist.inspetor_campo && (
              <>
                <p>Assinado digitalmente por</p>
                <p className="font-bold text-slate-600">{checklist.inspetor_campo}</p>
                <p>{checklist.created_by}</p>
                <p>em {formatDateBrasilia(checklist.created_date)}</p>
              </>
            )}
          </div>
          <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">Fiscal de Campo</p></div>
        </div>
        <div className="text-center">
          {checklist.approver_details ? (
            <>
              <div className="text-xs print:text-xs text-slate-500 mb-0.5 h-14 flex flex-col justify-end items-center">
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
              <div className="h-14 mb-0.5"></div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">Engenheiro Responsável</p></div>
            </>
          )}
        </div>
        <div className="text-center">
          {checklist.client_signature?.signed_by ? (
            <>
              <div className="text-xs print:text-xs text-slate-500 mb-0.5 h-14 flex flex-col justify-end items-center">
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
              <div className="h-14 mb-0.5"></div>
              <div className="border-t border-gray-500 pt-0.5"><p className="text-xs print:text-xs">Engenheiro Cliente</p></div>
            </>
          )}
        </div>
      </div>
    </footer>
  );

  // Componente do Footer SEM assinaturas (páginas intermediárias)
  const ReportFooterSimple = () => (
    <footer className="mt-auto pt-0.5">
      {/* Footer sem paginação */}
    </footer>
  );

  // Componente de Dados da Obra (reutilizável)
  const DadosObra = () => (
    <>
      <SectionTitle>Dados da Obra</SectionTitle>
      <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 mb-1 p-1.5 rounded text-xs">
        <div>
          <p className="font-bold">CLIENTE:</p>
          <p>{obra?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">CONCRETEIRA:</p>
          <p>{checklist.concreteira}</p>
        </div>
        <div>
          <p className="font-bold">EMPREITEIRA:</p>
          <p>{checklist.empreiteira || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">OBRA:</p>
          <p>{obra?.code || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">RODOVIA:</p>
          <p>{checklist.rodovia || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">TRECHO:</p>
          <p>{checklist.trecho || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">VOLUME (m³):</p>
          <p>{checklist.volume || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">Fck (MPa):</p>
          <p>{checklist.fck || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">ESTRUTURA:</p>
          <p>{checklist.estrutura || 'N/A'}</p>
        </div>

        <div>
          <p className="font-bold">ENG. RESPONSÁVEL:</p>
          <p>{checklist.engenheiro_responsavel || 'N/A'}</p>
        </div>
        <div>
          <p className="font-bold">INSPETOR CAMPO:</p>
          <p>{checklist.inspetor_campo || 'N/A'}</p>
        </div>
      </div>
    </>
  );

  // Componente de Condições Climáticas (reutilizável)
  const CondicoesClimaticas = () => (
    <>
      <SectionTitle>Condições Climáticas</SectionTitle>
      <div className="mb-1">
        <table className="w-full border-collapse border border-slate-300" style={{ fontSize: '9px' }}>
          <thead className="bg-slate-100">
            <tr>
              {checklist.periodos_clima?.map((periodo, index) => (
                <th key={index} className="border border-slate-300 px-1 py-0.5 text-center font-bold uppercase">
                  {getPeriodoNome(periodo.periodo)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {checklist.periodos_clima?.map((periodo, index) => (
                <td key={index} className="border border-slate-300 px-1 py-0.5 text-center">
                  <p className="font-medium mb-0.5">
                    Temp. Ambiente (°C): {periodo.temperatura_ambiente || 'N/A'}
                  </p>
                  <p className="font-bold">
                    {getClimaEmoji(periodo.condicoes_climaticas)} {getClimaTexto(periodo.condicoes_climaticas)}
                  </p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );

  // Componente de Carga Individual
  const CargaContent = ({ carga }) => (
    <>
      {/* Identificação da Carga */}
      <div className="mb-1">
        <h3 className="font-bold text-xs mb-0.5 bg-slate-50 p-0.5">Identificação da Carga</h3>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <p><strong>Nota Fiscal Nº:</strong> {carga.nota_fiscal || 'N/A'}</p>
          <p><strong>Placa da Betoneira:</strong> {carga.placa_betoneira || 'N/A'}</p>
          <p><strong>Horário Início:</strong> {carga.horario_inicio || 'N/A'}</p>
          <p><strong>Horário Término:</strong> {carga.horario_termino || 'N/A'}</p>
        </div>
      </div>

      {/* Tabela de Ensaios de Qualidade */}
      <h3 className="font-bold text-xs mb-0.5 bg-slate-50 p-0.5">Ensaios de Qualidade</h3>
      <table className="w-full border-collapse border border-slate-300 text-xs mb-1">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-left">Ensaio</th>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-16">Realizado</th>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-center">Resultado (cm)</th>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-center">Padrão do Projeto</th>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-20">Conformidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-1 py-0.5 font-medium bg-slate-50">Slump Test</td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              <Checkmark checked={carga.slump_test?.realizado} />
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.slump_test?.realizado && carga.slump_test?.resultado !== null 
                ? carga.slump_test.resultado 
                : '-'}
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
              {carga.slump_test?.limite || 'N/A'}
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.slump_test?.realizado ? (
                carga.slump_test.conforme === true ? (
                  <span className="text-green-600 font-bold text-lg">✓</span>
                ) : carga.slump_test.conforme === false ? (
                  <span className="text-red-600 font-bold text-lg">✗</span>
                ) : (
                  <span className="text-slate-500">-</span>
                )
              ) : (
                <span className="text-slate-500">-</span>
              )}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-1 py-0.5 font-medium bg-slate-50">Espessura da Camada</td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              <Checkmark checked={carga.espessura_camada?.realizado} />
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.espessura_camada?.realizado && carga.espessura_camada?.resultado !== null 
                ? carga.espessura_camada.resultado 
                : '-'}
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
              {carga.espessura_camada?.limite || 'N/A'}
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.espessura_camada?.realizado ? (
                carga.espessura_camada.conforme === true ? (
                  <span className="text-green-600 font-bold text-lg">✓</span>
                ) : carga.espessura_camada.conforme === false ? (
                  <span className="text-red-600 font-bold text-lg">✗</span>
                ) : (
                  <span className="text-slate-500">-</span>
                )
              ) : (
                <span className="text-slate-500">-</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs mb-1">
        <strong>Equipamento de Lançamento:</strong> {
          carga.equipamento_lancamento === 'convencional' ? 'Convencional' :
          carga.equipamento_lancamento === 'bombeado' ? 'Bombeado' : 'N/A'
        }
      </p>

      {/* Tabela de Acompanhamento de Lançamento */}
      <h3 className="font-bold text-xs mb-0.5 bg-slate-50 p-0.5">Acompanhamento Lançamento Concreto</h3>
      <table className="w-full border-collapse border border-slate-300 text-xs mb-1">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-left">Serviço</th>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-16">Sim</th>
            <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-16">Não</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-1 py-0.5 font-medium bg-slate-50">
              A superfície foi tratada e limpa?
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.superficie_tratada_limpa === true && <span className="text-green-600 font-bold text-lg">✓</span>}
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.superficie_tratada_limpa === false && <span className="text-red-600 font-bold text-lg">✗</span>}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-1 py-0.5 font-medium bg-slate-50">
              Foi realizado adensamento do concreto?
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.adensamento_realizado === true && <span className="text-green-600 font-bold text-lg">✓</span>}
            </td>
            <td className="border border-slate-300 px-1 py-0.5 text-center">
              {carga.adensamento_realizado === false && <span className="text-red-600 font-bold text-lg">✗</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {carga.observacoes_lancamento && (
        <div className="text-xs mb-1">
          <strong>Observações:</strong> {carga.observacoes_lancamento}
        </div>
      )}

      {/* Moldes para Fiscalização */}
      <div className="mb-1">
        <h3 className="font-bold text-xs mb-0.5 bg-slate-50 p-0.5">Moldes para Fiscalização</h3>
        {carga.moldado_fiscalizacao ? (
          <>
            {carga.corpos_prova && carga.corpos_prova.length > 0 ? (
              <>
                <table className="w-full border-collapse border border-slate-300 text-xs mt-1">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 px-1 py-0.5 font-medium text-center">Dias para Ruptura</th>
                      <th className="border border-slate-300 px-1 py-0.5 font-medium text-center">Quantidade de CPs</th>
                      <th className="border border-slate-300 px-1 py-0.5 font-medium text-center">Tipo de Ruptura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[3, 7, 28].map((dias) => {
                      const cpsDestaDia = carga.corpos_prova.filter(cp => cp.dias_ruptura === dias);
                      if (cpsDestaDia.length === 0) return null;
                      
                      const tipoRuptura = cpsDestaDia[0].tipo_ruptura;
                      const tipoTexto = tipoRuptura === 'compressao_axial' ? 'Compressão Axial' :
                                        tipoRuptura === 'comp_diametral' ? 'Compressão Diametral' :
                                        tipoRuptura === 'tracao_flexao' ? 'Tração na Flexão' : 'N/A';
                      
                      return (
                        <tr key={dias}>
                          <td className="border border-slate-300 px-1 py-0.5 text-center font-medium bg-slate-50">
                            {dias} dias
                          </td>
                          <td className="border border-slate-300 px-1 py-0.5 text-center">
                            {cpsDestaDia.length}
                          </td>
                          <td className="border border-slate-300 px-1 py-0.5 text-center">
                            {tipoTexto}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs mt-1 text-slate-600">
                  <strong>Total de CPs moldados:</strong> {carga.corpos_prova.length}
                </p>
              </>
            ) : (
              <div className="text-xs">
                <p><strong>Moldado:</strong> ✓ Sim</p>
                <p className="text-slate-500 italic">Detalhes dos corpos de prova não registrados</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-xs">
            <p><strong>Moldado para Fiscalização:</strong> ✗ Não</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="bg-white font-sans min-h-screen print:bg-white">
      {/* CASO 1: UMA ÚNICA CARGA - TUDO NA PRIMEIRA PÁGINA */}
      {!temMultiplasCargas && cargas.length === 1 && (
        <div className="break-inside-avoid">
          <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-3 pb-3 print:pt-2 print:px-3 print:pb-3 flex flex-col print:min-h-[297mm]" style={{ minHeight: '100vh' }}>
            <ReportHeader />
            <main className="text-sm print:text-xs mt-0.5 flex-grow">
              <DadosObra />
              <CondicoesClimaticas />
              
              {checklist.observacoes_gerais && (
                <>
                  <SectionTitle>Observações Gerais</SectionTitle>
                  <div className="text-xs mb-1 p-1 bg-slate-50 rounded">
                    {checklist.observacoes_gerais}
                  </div>
                </>
              )}

              <SectionTitle>Carga de Concreto 1</SectionTitle>
              <CargaContent carga={cargas[0]} />
            </main>
            <ReportFooterWithSignatures />
          </div>
        </div>
      )}

      {/* CASO 2: MÚLTIPLAS CARGAS - UMA CARGA POR PÁGINA */}
      {temMultiplasCargas && cargas.map((carga, cargaIndex) => {
        const isUltimaCarga = cargaIndex === cargas.length - 1;
        
        return (
          <div key={cargaIndex} className={`${cargaIndex > 0 ? 'break-before-page' : ''}`}>
            <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-3 px-3 pb-3 print:pt-3 print:px-3 print:pb-3 flex flex-col print:min-h-[297mm]" style={{ minHeight: '100vh' }}>
              <ReportHeader />
              <main className="text-sm print:text-xs mt-0.5 flex-grow">
                {cargaIndex === 0 && (
                  <>
                    <DadosObra />
                    <CondicoesClimaticas />
                    
                    {checklist.observacoes_gerais && (
                      <>
                        <SectionTitle>Observações Gerais</SectionTitle>
                        <div className="text-xs mb-1 p-1 bg-slate-50 rounded">
                          {checklist.observacoes_gerais}
                        </div>
                      </>
                    )}
                  </>
                )}
                
                <SectionTitle>Carga de Concreto {carga.numero_carga}</SectionTitle>
                <CargaContent carga={carga} />
              </main>
              
              {isUltimaCarga ? (
                <ReportFooterWithSignatures />
              ) : (
                <ReportFooterSimple />
              )}
            </div>
          </div>
        );
      })}

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="break-before-page">
          <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-8 print:p-8 print:min-h-[297mm]" style={{ minHeight: '100vh' }}>
            <div className="w-full max-w-[190mm] mx-auto">
              <header className="grid grid-cols-3 items-center border-b-2 border-gray-800 pb-2 mb-4">
                <div className="flex justify-start">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" alt="Logo Afirmaevias" className="h-16" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl print:text-xl font-bold text-gray-800">Relatório Fotográfico</h1>
                  <p className="text-base print:text-sm text-gray-600">Checklist</p>
                </div>
                <div className="flex justify-end text-sm print:text-xs">
                  <div className="border border-gray-400 p-2 rounded-md">
                    <p>{formatDate(checklist.data)}</p>
                  </div>
                </div>
              </header>
              <main className="grid grid-cols-2 gap-4 grid-rows-3">
                {chunk.map((fotoUrl, fotoIndex) => (
                  <div key={fotoIndex} className="border p-2 rounded-lg flex flex-col h-60 print:h-56">
                    <div className="bg-gray-100 flex items-center justify-center rounded overflow-hidden flex-1">
                      <img src={fotoUrl} alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" />
                    </div>
                    <p className="text-center text-base print:text-sm mt-2 font-medium">
                      Foto {(pageIndex * 6) + fotoIndex + 1}
                    </p>
                  </div>
                ))}
              </main>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}