import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SignatureFooter from './SignatureFooter';

export default function RelatorioChecklistTerraplanagem({ checklist, creatorUser, obra: obraProp, regional: regionalProp }) {
  const [obra, setObra] = useState(obraProp || null);
  const [regional, setRegional] = useState(regionalProp || null);
  const [compressedPhotos, setCompressedPhotos] = useState([]);
  const [isCompressing, setIsCompressing] = useState(true);

  useEffect(() => {
    if (!obraProp) loadRelatedData();
  }, [checklist]);

  useEffect(() => {
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
  const temAcoesCorretivas = checklist.acoes_corretivas_realizado === true && checklist.acoes_corretivas_descricao;

  const ReportHeader = () => (
    <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1">
      <div className="flex justify-start">
        <picture>
          <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
          <img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo Regional" className="h-12 object-contain" width="auto" height="48" />
        </picture>
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

  const DadosObra = () => (
    <>
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
    </>
  );

  const ReportFooter = () => (
    <SignatureFooter
      labName={checklist.inspetor_fiscal || checklist.laboratorista_name}
      labEmail={checklist.created_by}
      labCreatedDate={checklist.created_date}
      labPosition={creatorUser?.position || 'Laboratorista'}
      approverName={checklist.approver_details?.name}
      approverEmail={checklist.approved_by}
      approverPosition={checklist.approver_details?.position}
      approverCREA={checklist.approver_details?.crea_number}
      approverDate={checklist.approved_date}
      clientName={checklist.client_signature?.engineer_name}
      clientEmail={checklist.client_signature?.signed_by}
      clientPosition={checklist.client_signature?.position}
      clientCREA={checklist.client_signature?.crea_number}
      clientDate={checklist.client_signature?.signed_date}
    />
  );

  return (
    <div className="bg-white font-sans min-h-screen print:bg-white">
      {/* PÁGINA PRINCIPAL */}
      <div className="print:pt-2 print:pb-3">
        <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-3 pb-3 print:pt-2 print:px-3 print:pb-3">
          <ReportHeader />
          
          <main className="text-xs print:text-xs mt-0.5 mb-3">
            <DadosObra />

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
                <tr style={{ height: '19.6px' }}>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-left">Controle</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-14">Sim</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-14">Não</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-14">N/A</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white">Foi realizado remoção de material existente?</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.remocao_material_existente} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.remocao_material_existente} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.remocao_material_existente} column="na" />
                  </td>
                </tr>
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white">Foi espalhado material novo para construção da camada?</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.espalhamento_material_novo} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.espalhamento_material_novo} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.espalhamento_material_novo} column="na" />
                  </td>
                </tr>
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white">
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
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.compactacao_conforme_projeto} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.compactacao_conforme_projeto} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.compactacao_conforme_projeto} column="na" />
                  </td>
                </tr>
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white">Foi realizado ensaio de viga Benkelman para liberação da camada?</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.ensaio_viga_benkelman} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.ensaio_viga_benkelman} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.ensaio_viga_benkelman} column="na" />
                  </td>
                </tr>
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white">Foi realizado teste de carga para liberação da camada?</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.teste_carga} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.teste_carga} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.teste_carga} column="na" />
                  </td>
                </tr>
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white">Há algum ponto de falha de compactação (borrachudo)?</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.falha_compactacao} column="sim" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.falha_compactacao} column="nao" />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    <CheckboxDisplay value={checklist.acompanhamento_execucao?.falha_compactacao} column="na" />
                  </td>
                </tr>
              </tbody>
            </table>

            {checklist.acompanhamento_execucao?.observacoes && (
              <>
                <SectionTitle>Observações do Acompanhamento</SectionTitle>
                <div className="text-xs mb-0.5 p-1 bg-white rounded border border-slate-300">
                  {checklist.acompanhamento_execucao.observacoes}
                </div>
              </>
            )}

            <SectionTitle>Ensaios da Camada Realizados pela Empreiteira</SectionTitle>
            <table className="w-full border-collapse border border-slate-300 mb-0.5">
              <thead className="bg-white">
                <tr style={{ height: '19.6px' }}>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-left text-xs">Ensaios</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-14 text-xs">Realizado</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-10 text-xs">Qtde</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center text-xs">Resultados</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-16 text-xs">Conforme</th>
                  <th className="border border-slate-300 px-1 py-0.5 font-medium text-center w-20 text-xs">Não Conforme</th>
                </tr>
              </thead>
              <tbody>
                {/* Compactação - Proctor */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.compactacao_proctor;
                  return (
                    <tr style={{ height: '19.6px' }}>
                      <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">Compactação - Proctor (g/cm³)</td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                        {ensaio?.resultados ? ensaio.resultados.split(' | ').join(' | ') : '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">-</td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">-</td>
                    </tr>
                  );
                })()}
                
                {/* Umidade Ótima */}
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">Umidade Ótima (%)</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    {checklist.umidade_otima_quantidade ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                    {checklist.umidade_otima_quantidade || '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                    {checklist.umidade_otima_resultados ? checklist.umidade_otima_resultados.split(' | ').join(' | ') : '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">-</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">-</td>
                </tr>
                
                {/* ISC */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.isc;
                  return (
                    <tr style={{ height: '19.6px' }}>
                      <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">ISC - Índice de Suporte Califórnia (%)</td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                        {ensaio?.resultados ? ensaio.resultados.split(' | ').join(' | ') : '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                      </td>
                      </tr>
                      );
                      })()}

                      {/* Massa Específica In Situ */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.massa_especifica_in_situ;
                  return (
                    <tr style={{ height: '19.6px' }}>
                      <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">Massa Específica In Situ (g/cm³)</td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                        {ensaio?.resultados ? ensaio.resultados.split(' | ').join(' | ') : '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                      </td>
                      </tr>
                      );
                      })()}

                      {/* Umidade In Situ */}
                      <tr style={{ height: '19.6px' }}>
                        <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">Umidade In Situ (%)</td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">
                          {checklist.umidade_in_situ_quantidade ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                          {checklist.umidade_in_situ_quantidade || '-'}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                          {checklist.umidade_in_situ_resultados ? checklist.umidade_in_situ_resultados.split(' | ').join(' | ') : '-'}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">-</td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">-</td>
                      </tr>
                
                {/* Análise Granulométrica */}
                {(() => {
                  const ensaio = checklist.ensaios_empreiteira?.granulometria;
                  return (
                    <tr style={{ height: '19.6px' }}>
                      <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">Análise Granulométrica por Peneiramento</td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.realizado ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                        {ensaio?.quantidade || '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                        {ensaio?.resultados ? ensaio.resultados.split(' | ').join(' | ') : '-'}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                      </td>
                      <td className="border border-slate-300 px-1 py-0.5 text-center">
                        {ensaio?.conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                      </td>
                      </tr>
                      );
                      })()}

                      {/* Variação de Umidade - Calculado */}
                      <tr style={{ height: '19.6px' }}>
                        <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">Variação de Umidade (%)</td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">
                          {checklist.ensaios_empreiteira?.variacao_umidade_quantidade ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                          {checklist.ensaios_empreiteira?.variacao_umidade_quantidade || '-'}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                          {checklist.ensaios_empreiteira?.variacao_umidade_resultados ? checklist.ensaios_empreiteira.variacao_umidade_resultados.split(' | ').join(' | ') : '-'}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">
                          {checklist.ensaios_empreiteira?.variacao_umidade_conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                        </td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">
                          {checklist.ensaios_empreiteira?.variacao_umidade_conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                        </td>
                      </tr>
                
                {/* Grau de Compactação - Calculado */}
                <tr style={{ height: '19.6px' }}>
                  <td className="border border-slate-300 px-1 py-0.5 bg-white text-xs">Grau de Compactação (%)</td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    {checklist.ensaios_empreiteira?.grau_compactacao_quantidade ? <span className="text-green-600 font-bold text-base">✓</span> : <span className="text-slate-500">-</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">
                    {checklist.ensaios_empreiteira?.grau_compactacao_quantidade || '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-xs font-medium text-center">
                    {checklist.ensaios_empreiteira?.grau_compactacao_resultados ? checklist.ensaios_empreiteira.grau_compactacao_resultados.split(' | ').join(' | ') : '-'}
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    {checklist.ensaios_empreiteira?.grau_compactacao_conforme === true && <span className="text-green-600 font-bold text-base">✓</span>}
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5 text-center">
                    {checklist.ensaios_empreiteira?.grau_compactacao_conforme === false && <span className="text-red-600 font-bold text-base">✗</span>}
                  </td>
                </tr>
              </tbody>
            </table>

            {checklist.observacoes_gerais && (
              <>
                <SectionTitle>Observações Gerais</SectionTitle>
                <div className="text-xs mb-0.5 p-1 bg-white rounded border border-slate-300 h-16 overflow-hidden">
                  {checklist.observacoes_gerais}
                </div>
              </>
            )}
          </main>
          
          <ReportFooter />
        </div>
      </div>

      {/* PÁGINA DE AÇÕES CORRETIVAS E/OU NÃO CONFORMIDADES */}
      {(temAcoesCorretivas || (checklist.nao_conformidades && checklist.nao_conformidades.length > 0)) && (
        <div className="break-before-page">
          <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none py-2 px-3 print:py-2 print:px-3">
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '270mm' }}>
              <ReportHeader />
              <DadosObra />

              <main className="mt-2" style={{ flex: '1' }}>
               {temAcoesCorretivas && (
                 <>
                   <SectionTitle>Ações Corretivas</SectionTitle>
                   <div className="border-2 border-slate-400 rounded p-6 bg-white" style={{ minHeight: '450px' }}>
                     <p className="font-bold text-base mb-4 text-slate-800">AÇÕES CORRETIVAS APONTADAS:</p>
                     <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                       {checklist.acoes_corretivas_descricao}
                     </p>
                   </div>
                 </>
               )}

               {checklist.nao_conformidades && checklist.nao_conformidades.length > 0 && (
                 <div className="mt-4">
                   <SectionTitle>Não Conformidades</SectionTitle>
                   <table className="w-full border-collapse border border-slate-300 text-sm">
                     <thead>
                       <tr className="bg-slate-100">
                         <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">LOCAL</th>
                         <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">CATEGORIA</th>
                         <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">PARÂMETRO</th>
                       </tr>
                     </thead>
                     <tbody>
                       {checklist.nao_conformidades.map((nc, ncIdx) => (
                                         <tr key={ncIdx} className="bg-white">
                           <td className="border border-slate-300 px-3 py-2 text-slate-800">{nc.local_nc || 'N/A'}</td>
                           <td className="border border-slate-300 px-3 py-2 text-slate-800">{nc.categoria_nc || 'N/A'}</td>
                           <td className="border border-slate-300 px-3 py-2 text-slate-800">{nc.parametro_nc || 'N/A'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
              </main>

              <div style={{ marginTop: 'auto' }}>
                <ReportFooter />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={`page-${pageIndex}`} className="print:pt-2 print:pb-3 break-before-page">
          <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-3 pb-3 print:pt-2 print:px-3 print:pb-3 flex flex-col">
            <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-2">
              <div className="flex justify-start">
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo Regional" 
                  className="h-12 object-contain" 
                  width="auto" height="48"
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
                <div key={`foto-${fotoIndex}`} className="border p-2 rounded-lg break-inside-avoid flex flex-col">
                  <div className="bg-gray-100 flex items-center justify-center rounded overflow-hidden" style={{ height: '280px' }}>
                    <picture><source srcSet={fotoUrl} /><img src={fotoUrl} alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" width="auto" height="auto" /></picture>
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