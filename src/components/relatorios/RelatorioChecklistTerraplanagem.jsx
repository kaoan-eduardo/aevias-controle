import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function RelatorioChecklistTerraplanagem({ checklist }) {
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);

  useEffect(() => {
    loadRelatedData();
  }, [checklist]);

  const loadRelatedData = async () => {
    try {
      if (checklist.obra_id) {
        const obraData = await base44.entities.Obra.get(checklist.obra_id);
        setObra(obraData);
        
        if (obraData.regional_id) {
          const regionalData = await base44.entities.Regional.get(obraData.regional_id);
          setRegional(regionalData);
        }
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
      case 'instável': return 'Instável';
      case 'chuva': return 'Chuva';
      default: return '-';
    }
  };

  const SectionTitle = ({ children }) => (
    <h2 className="text-sm print:text-xs font-bold text-center bg-slate-100 p-0.5 my-0.5 uppercase tracking-wider">{children}</h2>
  );

  const CheckboxDisplay = ({ value, column }) => {
    if (!value) return <span className="text-slate-500">-</span>;
    
    if (column === 'sim' && value.sim === true) {
      return <span className="text-green-600 font-bold text-base">✓</span>;
    }
    
    if (column === 'nao' && value.nao === true) {
      return <span className="text-red-600 font-bold text-base">✗</span>;
    }
    
    if (column === 'na' && value.na === true) {
      return <span className="text-slate-500">N/A</span>;
    }
    
    return null;
  };

  // Cálculos automáticos
  const variacaoUmidade = (() => {
    const uOtima = parseFloat(checklist.umidade_otima_proctor);
    const uInSitu = parseFloat(checklist.umidade_in_situ);
    if (isNaN(uOtima) || isNaN(uInSitu)) return null;
    return (uInSitu - uOtima).toFixed(2);
  })();

  const grauCompactacao = (() => {
    const ensaioMassaEspecifica = checklist.ensaios_empreiteira?.massa_especifica_in_situ;
    const ensaioCompactacaoProctor = checklist.ensaios_empreiteira?.compactacao_proctor;

    const densInSitu = parseFloat(ensaioMassaEspecifica?.resultados);
    const densProctor = parseFloat(ensaioCompactacaoProctor?.resultados);

    if (isNaN(densInSitu) || isNaN(densProctor) || densProctor === 0) return null;
    return ((densInSitu / densProctor) * 100).toFixed(2);
  })();


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

  const ReportHeader = () => (
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1">
      <div className="flex justify-start">
        <img 
          src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
          alt="Logo Regional" 
          className="h-12 object-contain" 
        />
      </div>
      <div className="text-center">
        <h1 className="text-base font-bold text-gray-800">Controle Tecnológico de Terraplanagem</h1>
      </div>
      <div className="flex justify-end">
        <div className="border border-gray-400 p-1 rounded-md text-sm print:text-xs bg-white">
          <p className="font-semibold text-gray-800">
            {formatDate(checklist.data)}
          </p>
        </div>
      </div>
    </header>
  );

  const ReportFooter = () => (
    <footer className="mt-12 pt-0.5">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="text-center">
          <div className="text-xs print:text-xs text-slate-500 mb-0.5 h-10 flex flex-col justify-end items-center">
            {checklist.inspetor_fiscal && (
              <>
                <p>Assinado digitalmente por</p>
                <p className="font-bold text-slate-600">{checklist.inspetor_fiscal}</p>
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

  return (
    <div className="bg-white font-sans min-h-screen print:bg-white">
      {/* PÁGINA PRINCIPAL */}
      <div className="print:pt-2 print:pb-3">
        <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-3 pb-3 print:pt-2 print:px-3 print:pb-3">
          <ReportHeader />
          
          <main className="text-xs print:text-xs mt-0.5 mb-3">
            <SectionTitle>Dados da Obra</SectionTitle>
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mb-0.5 p-1 rounded text-xs">
              <div>
                <p className="font-bold">CLIENTE:</p>
                <p>{regional?.cliente || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">RODOVIA:</p>
                <p>{checklist.rodovia}</p>
              </div>
              <div>
                <p className="font-bold">MATERIAL:</p>
                <p>{checklist.material}</p>
              </div>

              <div>
                <p className="font-bold">EMPREITEIRA:</p>
                <p>{checklist.empreiteira}</p>
              </div>
              <div>
                <p className="font-bold">ESTACA:</p>
                <p>{checklist.estaca}</p>
              </div>
              <div>
                <p className="font-bold">INSPETOR FISC:</p>
                <p>{checklist.inspetor_fiscal || 'N/A'}</p>
              </div>

              <div>
                <p className="font-bold">OBRA:</p>
                <p>{obra?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">CAMADA:</p>
                <p>{checklist.camada}</p>
              </div>
              <div>
                <p className="font-bold">JORNADA:</p>
                <p>{checklist.jornada?.horario_inicio && checklist.jornada?.horario_fim ? `${checklist.jornada.horario_inicio} - ${checklist.jornada.horario_fim}` : 'N/A'}</p>
              </div>

              <div>
                <p className="font-bold">ENSAIO REALIZADO POR:</p>
                <p>{checklist.ensaio_realizado_por || 'N/A'}</p>
              </div>
            </div>

            <SectionTitle>Condições Climáticas</SectionTitle>
            <div className="mb-0.5">
              <table className="w-full border-collapse border border-slate-300">
                <thead className="bg-white">
                  <tr>
                    {checklist.periodos_clima?.map((periodo, index) => (
                      <th key={index} className="border border-slate-300 px-1 py-1 text-center font-bold uppercase text-xs">
                        {periodo.periodo === 'manha' ? 'MANHÃ' : 'TARDE'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {checklist.periodos_clima?.map((periodo, index) => (
                      <td key={index} className="border border-slate-300 px-1 py-1 text-center">
                        <p className="font-medium mb-0.5 text-xs">
                          Temp. Ambiente (°C): {periodo.temperatura_ambiente || 'N/A'}
                        </p>
                        <p className="font-bold text-sm">
                          {getClimaEmoji(periodo.condicoes_climaticas)} {getClimaTexto(periodo.condicoes_climaticas)}
                        </p>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <SectionTitle>Acompanhamento Execução da Camada</SectionTitle>
            <table className="w-full border-collapse border border-slate-300 text-xs mb-0.5">
              <thead className="bg-white">
                <tr>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-left">Controle</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center w-14">Sim</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center w-14">Não</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center w-14">N/A</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white">Foi realizado remoção de material existente?</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.remocao_material_existente} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.remocao_material_existente} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.remocao_material_existente} column="na" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white">Foi espalhado material novo para construção da camada?</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.espalhamento_material_novo} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.espalhamento_material_novo} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.espalhamento_material_novo} column="na" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white">
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
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.compactacao_conforme_projeto} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.compactacao_conforme_projeto} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.compactacao_conforme_projeto} column="na" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white">Foi realizado ensaio de viga Benkelman para liberação da camada?</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.ensaio_viga_benkelman} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.ensaio_viga_benkelman} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.ensaio_viga_benkelman} column="na" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white">Foi realizado teste de carga para liberação da camada?</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.teste_carga} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.teste_carga} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.teste_carga} column="na" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white">Há algum ponto de falha de compactação (borrachudo)?</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.falha_compactacao} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.falha_compactacao} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.falha_compactacao} column="na" />
                  </td>
                </tr>
              </tbody>
            </table>

            <SectionTitle>Ensaios da Camada Realizados pela Empreiteira</SectionTitle>
            <table className="w-full border-collapse border border-slate-300 mb-0.5">
              <thead className="bg-white">
                <tr>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-left text-xs">Ensaios</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center w-14 text-xs">Realizado</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center w-10 text-xs">Qtde</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center text-xs">Resultados</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center w-16 text-xs">Conforme</th>
                  <th className="border border-slate-300 px-1 py-1 font-medium text-center w-20 text-xs">Não Conforme</th>
                </tr>
              </thead>
              <tbody>
                {/* Compactação - Proctor */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.compactacao_proctor;
                  return (
                    <tr>
                      <td className="border border-slate-300 px-1 py-1 bg-white text-xs">Compactação - Proctor (g/cm³)</td>
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                        {ensaio?.resultados ? `${ensaio.resultados} g/cm³` : '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                      <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                    </tr>
                  );
                })()}
                
                {/* Umidade Ótima */}
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white text-xs">Umidade Ótima (%)</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {checklist.umidade_otima_proctor ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center text-xs">-</td>
                  <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                    {checklist.umidade_otima_proctor ? `${checklist.umidade_otima_proctor}%` : '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                </tr>
                
                {/* ISC */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.isc;
                  return (
                    <tr>
                      <td className="border border-slate-300 px-1 py-1 bg-white text-xs">ISC - Índice de Suporte Califórnia (%)</td>
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                        {ensaio?.resultados ? `${ensaio.resultados}%` : '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                      <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                    </tr>
                  );
                })()}
                
                {/* Massa Específica In Situ */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.massa_especifica_in_situ;
                  return (
                    <tr>
                      <td className="border border-slate-300 px-1 py-1 bg-white text-xs">Massa Específica In Situ (g/cm³)</td>
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                        {ensaio?.resultados ? `${ensaio.resultados} g/cm³` : '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                      <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                    </tr>
                  );
                })()}
                
                {/* Umidade In Situ */}
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white text-xs">Umidade In Situ (%)</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {checklist.umidade_in_situ ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center text-xs">-</td>
                  <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                    {checklist.umidade_in_situ ? `${checklist.umidade_in_situ}%` : '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">-</td>
                </tr>
                
                {/* Análise Granulométrica */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.granulometria;
                  return (
                    <tr>
                      <td className="border border-slate-300 px-1 py-1 bg-white text-xs">Análise Granulométrica por Peneiramento</td>
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                        {ensaio?.resultados || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        {ensaio?.conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        {ensaio?.conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                      </td>
                    </tr>
                  );
                })()}
                
                {/* Variação de Umidade - Calculado */}
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white text-xs">Variação de Umidade (%)</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {variacaoUmidade !== null ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center text-xs">-</td>
                  <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                    {variacaoUmidade !== null ? `${variacaoUmidade}%` : '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {checklist.ensaios_empreiteira?.variacao_umidade_conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {checklist.ensaios_empreiteira?.variacao_umidade_conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                  </td>
                </tr>
                
                {/* Grau de Compactação - Calculado */}
                <tr>
                  <td className="border border-slate-300 px-1 py-1 bg-white text-xs">Grau de Compactação (%)</td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {grauCompactacao !== null ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center text-xs">-</td>
                  <td className="border border-slate-300 px-1 py-1 text-xs font-medium text-center">
                    {grauCompactacao !== null ? `${grauCompactacao}%` : '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {checklist.ensaios_empreiteira?.grau_compactacao_conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">
                    {checklist.ensaios_empreiteira?.grau_compactacao_conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                  </td>
                </tr>
              </tbody>
            </table>

            <SectionTitle>Observações Gerais</SectionTitle>
            <div className="text-xs mb-0.5 p-1 bg-white rounded border border-slate-300 h-16 overflow-hidden">
              {checklist.observacoes_gerais || 'Sem observações'}
            </div>
          </main>
          
          <ReportFooter />
        </div>
      </div>

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="print:pt-2 print:pb-3 break-before-page">
          <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-3 pb-3 print:pt-2 print:px-3 print:pb-3 flex flex-col">
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
                <p className="text-xs text-gray-600">Terraplanagem</p>
                <p className="text-xs text-gray-600">Obra: {obra?.name || 'N/A'}</p>
              </div>
              <div className="flex justify-end">
                <div className="border border-gray-400 p-1 rounded-md text-sm print:text-xs bg-white">
                  <p className="font-semibold text-gray-800">
                    {formatDate(checklist.data)}
                  </p>
                </div>
              </div>
            </header>
            <main className="grid grid-cols-2 gap-3">
              {chunk.map((fotoUrl, fotoIndex) => (
                <div key={fotoIndex} className="border p-2 rounded-lg break-inside-avoid flex flex-col">
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
        </div>
      ))}
    </div>
  );
}