import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SignatureFooter from './SignatureFooter';

function getClimaEmoji(condicao) {
  switch(condicao) {
    case 'bom': return '☀️';
    case 'instavel': return '⛅';
    case 'chuva': return '🌧️';
    default: return '';
  }
}

function getClimaTexto(condicao) {
  switch(condicao) {
    case 'bom': return 'Bom';
    case 'instavel': return 'Instável';
    case 'chuva': return 'Chuva';
    default: return '-';
  }
}

function getPeriodoNome(periodo) {
  switch(periodo) {
    case 'manha': return 'MANHÃ';
    case 'tarde': return 'TARDE';
    case 'noite': return 'NOITE';
    default: return periodo.toUpperCase();
  }
}

function formatDateConcr(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

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

const CargaContent = ({ carga }) => (
  <>
    <div className="mb-2">
      <p className="font-bold text-sm mb-1">Identificação da Carga</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <p><strong>Nota Fiscal Nº:</strong> {carga.nota_fiscal || 'N/A'}</p>
        <p><strong>Placa da Betoneira:</strong> {carga.placa_betoneira || 'N/A'}</p>
        <p><strong>Horário Início:</strong> {carga.horario_inicio || 'N/A'}</p>
        <p><strong>Horário Término:</strong> {carga.horario_termino || 'N/A'}</p>
      </div>
    </div>

    <p className="font-bold text-sm mb-1">Ensaios de Qualidade</p>
    <table className="w-full border-collapse border border-slate-400 text-xs mb-2">
      <thead className="bg-slate-200">
        <tr>
          <th className="border border-slate-400 px-2 py-1 text-left font-bold">Ensaio</th>
          <th className="border border-slate-400 px-2 py-1 text-center font-bold w-12">Realizado</th>
          <th className="border border-slate-400 px-2 py-1 text-center font-bold">Resultado (cm)</th>
          <th className="border border-slate-400 px-2 py-1 text-center font-bold">Padrão do Projeto</th>
          <th className="border border-slate-400 px-2 py-1 text-center font-bold w-16">Conformidade</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-400 px-2 py-1">Slump Test</td>
          <td className="border border-slate-400 px-2 py-1 text-center"><Checkmark checked={carga.slump_test?.realizado} /></td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.slump_test?.realizado && carga.slump_test?.resultado !== null ? carga.slump_test.resultado : '-'}</td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.slump_test?.limite || 'N/A'}</td>
          <td className="border border-slate-400 px-2 py-1 text-center">
            {carga.slump_test?.realizado ? (carga.slump_test.conforme === true ? <span className="text-green-600 font-bold">✓</span> : carga.slump_test.conforme === false ? <span className="text-red-600 font-bold">✗</span> : <span className="text-slate-500">-</span>) : <span className="text-slate-500">-</span>}
          </td>
        </tr>
        <tr>
          <td className="border border-slate-400 px-2 py-1">Espessura da Camada</td>
          <td className="border border-slate-400 px-2 py-1 text-center"><Checkmark checked={carga.espessura_camada?.realizado} /></td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.espessura_camada?.realizado && carga.espessura_camada?.resultado !== null ? carga.espessura_camada.resultado : '-'}</td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.espessura_camada?.limite || 'N/A'}</td>
          <td className="border border-slate-400 px-2 py-1 text-center">
            {carga.espessura_camada?.realizado ? (carga.espessura_camada.conforme === true ? <span className="text-green-600 font-bold">✓</span> : carga.espessura_camada.conforme === false ? <span className="text-red-600 font-bold">✗</span> : <span className="text-slate-500">-</span>) : <span className="text-slate-500">-</span>}
          </td>
        </tr>
      </tbody>
    </table>

    <p className="text-xs mb-2"><strong>Equipamento de Lançamento:</strong> {carga.equipamento_lancamento === 'convencional' ? 'Convencional' : carga.equipamento_lancamento === 'bombeado' ? 'Bombeado' : 'N/A'}</p>

    <p className="font-bold text-sm mb-1">Acompanhamento Lançamento Concreto</p>
    <table className="w-full border-collapse border border-slate-400 text-xs mb-2">
      <thead className="bg-slate-200">
        <tr>
          <th className="border border-slate-400 px-2 py-1 text-left font-bold">Serviço</th>
          <th className="border border-slate-400 px-2 py-1 text-center font-bold w-12">Sim</th>
          <th className="border border-slate-400 px-2 py-1 text-center font-bold w-12">Não</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-400 px-2 py-1">A superfície foi tratada e limpa?</td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.superficie_tratada_limpa === true && <span className="text-green-600 font-bold">✓</span>}</td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.superficie_tratada_limpa === false && <span className="text-red-600 font-bold">✗</span>}</td>
        </tr>
        <tr>
          <td className="border border-slate-400 px-2 py-1">Foi realizado adensamento do concreto?</td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.adensamento_realizado === true && <span className="text-green-600 font-bold">✓</span>}</td>
          <td className="border border-slate-400 px-2 py-1 text-center">{carga.adensamento_realizado === false && <span className="text-red-600 font-bold">✗</span>}</td>
        </tr>
      </tbody>
    </table>

    {carga.observacoes_lancamento && (<p className="text-xs mb-2"><strong>Observações:</strong> {carga.observacoes_lancamento}</p>)}

    <p className="font-bold text-sm mb-1">Moldes para Fiscalização</p>
    {carga.moldado_fiscalizacao ? (
      <>
        {carga.corpos_prova && carga.corpos_prova.length > 0 ? (
          <>
            <table className="w-full border-collapse border border-slate-400 text-xs mb-2">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border border-slate-400 px-2 py-1 font-bold text-center">Dias para Ruptura</th>
                  <th className="border border-slate-400 px-2 py-1 font-bold text-center">Quantidade de CPs</th>
                  <th className="border border-slate-400 px-2 py-1 font-bold text-center">Tipo de Ruptura</th>
                </tr>
              </thead>
              <tbody>
                {[3, 7, 28].map((dias) => {
                  const cpsDestaDia = carga.corpos_prova.filter(cp => cp.dias_ruptura === dias);
                  if (cpsDestaDia.length === 0) return null;
                  const tipoRuptura = cpsDestaDia[0].tipo_ruptura;
                  const tipoTexto = tipoRuptura === 'compressao_axial' ? 'Compressão Axial' : tipoRuptura === 'comp_diametral' ? 'Compressão Diametral' : tipoRuptura === 'tracao_flexao' ? 'Tração na Flexão' : 'N/A';
                  return (
                    <tr key={dias}>
                      <td className="border border-slate-400 px-2 py-1 text-center">{dias} dias</td>
                      <td className="border border-slate-400 px-2 py-1 text-center">{cpsDestaDia.length}</td>
                      <td className="border border-slate-400 px-2 py-1 text-center">{tipoTexto}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs"><strong>Total de CPs moldados:</strong> {carga.corpos_prova.length}</p>
          </>
        ) : (
          <div className="text-xs mb-2"><p><strong>Moldado:</strong> ✓ Sim</p></div>
        )}
      </>
    ) : (
      <div className="text-xs mb-2"><p><strong>Moldado para Fiscalização:</strong> ✗ Não</p></div>
    )}
  </>
);

export default function RelatorioChecklistConcretagem({ checklist, creatorUser, obra: obraProp, regional: regionalProp, project: projectProp }) {
  const [obra, setObra] = useState(obraProp || null);
  const [project, setProject] = useState(projectProp || null);
  const [regional, setRegional] = useState(regionalProp || null);
  const [compressedPhotos, setCompressedPhotos] = useState([]);
  const [isCompressing, setIsCompressing] = useState(true);

  useEffect(() => {
    if (!obraProp) loadRelatedData();
  }, [checklist, obraProp]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const compressImages = async () => {
      if (!checklist?.fotos || checklist.fotos.length === 0) {
        setIsCompressing(false);
        return;
      }

      const validPhotos = checklist.fotos.filter(photo => photo && photo.trim() !== '');
      const compressed = [];
      
      for (let i = 0; i < validPhotos.length; i++) {
        const photoUrl = validPhotos[i];
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 10000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Erro ao carregar imagem'));
              };
              img.src = photoUrl;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
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
            
            compressed.push(canvas.toDataURL('image/jpeg', 0.5));
            break;
          } catch (error) {
            attempts++;
            console.error(`Tentativa ${attempts} falhou para imagem ${i + 1}:`, error);
            
            if (attempts >= maxAttempts) {
              compressed.push(photoUrl);
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
        }
        
        if (i < validPhotos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }

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
      if (checklist.project_id) {
        const projectData = await base44.entities.Project.get(checklist.project_id);
        setProject(projectData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados relacionados:", error);
    }
  };

  if (isCompressing) {
    return <div className="p-8 text-center">Otimizando imagens para impressão...</div>;
  }

  const chunkArray = (arr, size) => { const chunks = []; if (!arr) return chunks; for (let i = 0; i < arr.length; i += size) { chunks.push(arr.slice(i, i + size)); } return chunks; };
  const photoChunks = chunkArray(compressedPhotos, 6);
  const cargas = checklist.cargas_concreto || [];
  const temMultiplasCargas = cargas.length > 1;
  const temAcoesCorretivas = checklist.acoes_corretivas_realizado === true && checklist.acoes_corretivas_descricao;

  const footerProps = {
    labName: checklist.laboratorista_name, labEmail: checklist.created_by, labCreatedDate: checklist.created_date,
    labPosition: creatorUser?.position || 'Laboratorista', approverName: checklist.approver_details?.name,
    approverEmail: checklist.approved_by, approverPosition: checklist.approver_details?.position,
    approverCREA: checklist.approver_details?.crea_number, approverDate: checklist.approved_date,
    clientName: checklist.client_signature?.engineer_name, clientEmail: checklist.client_signature?.signed_by,
    clientPosition: checklist.client_signature?.position, clientCREA: checklist.client_signature?.crea_number,
    clientDate: checklist.client_signature?.signed_date,
  };

  return (
    <div className="bg-white font-sans text-xs">
      <style>{`
        @media print {
          body, html { margin: 0; padding: 0; }
          .print-page { 
            width: 210mm; 
            height: 297mm; 
            margin: 0; 
            padding: 8mm; 
            box-sizing: border-box; 
            page-break-after: always;
          }
        }
      `}</style>

      {/* CASO 1: UMA ÚNICA CARGA - TUDO NA PRIMEIRA PÁGINA */}
      {!temMultiplasCargas && cargas.length === 1 && (
        <div className="print-page">
          {/* Header */}
          <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-black gap-2">
            <div className="w-12">
              <picture>
                <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo" 
                  className="h-10 object-contain"
                  width="auto" height="40"
                />
              </picture>
            </div>
            
            <div className="text-center flex-1">
              <p className="font-bold leading-tight">CONTROLE TECNOLÓGICO<br/>DE CONCRETO</p>
            </div>
            
            <div className="border border-black px-2 py-1">
              <p className="font-semibold">{formatDateConcr(checklist.data)}</p>
            </div>
          </div>

          {/* DADOS DA OBRA */}
          <div className="mb-2 bg-slate-800 text-white">
            <p className="font-bold text-center py-0.5">DADOS DA OBRA</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <p className="font-bold">CLIENTE:</p>
              <p>{regional?.cliente || obra?.name || 'N/A'}</p>
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
          </div>

          {/* Condições Climáticas */}
          <div className="mb-2 bg-slate-800 text-white">
            <p className="font-bold text-center py-0.5">CONDIÇÕES CLIMÁTICAS</p>
          </div>
          <table className="w-full border-collapse border border-slate-400 mb-2">
            <tbody>
              <tr>
                {checklist.periodos_clima?.map((periodo, index) => (
                  <td key={index} className="border border-slate-400 px-1 py-1 text-center">
                    <p className="font-bold">{getPeriodoNome(periodo.periodo)}</p>
                    <p>Temp. Ambiente (°C): {periodo.temperatura_ambiente || 'N/A'}</p>
                    <p className="font-bold">{getClimaEmoji(periodo.condicoes_climaticas)} {getClimaTexto(periodo.condicoes_climaticas)}</p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Observações Gerais */}
          <div className="mb-2 bg-slate-800 text-white">
            <p className="font-bold text-center py-0.5">OBSERVAÇÕES GERAIS</p>
          </div>
          <p className="mb-2 p-1 bg-slate-50 border border-slate-400">{checklist.observacoes_gerais || 'N/A'}</p>

          {/* Carga de Concreto */}
          <div className="mb-2 bg-slate-800 text-white">
            <p className="font-bold text-center py-0.5">CARGA DE CONCRETO 1</p>
          </div>
          <div className="mb-2">
            <CargaContent carga={cargas[0]} />
          </div>

          {/* Signature Footer */}
          <SignatureFooter {...footerProps} />
        </div>
      )}

      {/* CASO 2: MÚLTIPLAS CARGAS - UMA CARGA POR PÁGINA */}
      {temMultiplasCargas && cargas.map((carga, cargaIndex) => {
        const isUltimaCarga = cargaIndex === cargas.length - 1;
        const isPrimeiraCarga = cargaIndex === 0;
        
        return (
          <div key={cargaIndex} className="print-page">
            {/* Header */}
            <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-black gap-2">
              <div className="w-12">
                <picture>
                  <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                  <img 
                    src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                    alt="Logo" 
                    className="h-10 object-contain"
                    width="auto" height="40"
                  />
                </picture>
              </div>
              
              <div className="text-center flex-1">
                <p className="font-bold leading-tight">CONTROLE TECNOLÓGICO<br/>DE CONCRETO</p>
              </div>
              
              <div className="border border-black px-2 py-1">
                <p className="font-semibold">{formatDateConcr(checklist.data)}</p>
              </div>
            </div>

            {isPrimeiraCarga && (
              <>
                {/* DADOS DA OBRA */}
                <div className="mb-2 bg-slate-800 text-white">
                  <p className="font-bold text-center py-0.5">DADOS DA OBRA</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <p className="font-bold">CLIENTE:</p>
                    <p>{regional?.cliente || obra?.name || 'N/A'}</p>
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
                </div>

                {/* Condições Climáticas */}
                <div className="mb-2 bg-slate-800 text-white">
                  <p className="font-bold text-center py-0.5">CONDIÇÕES CLIMÁTICAS</p>
                </div>
                <table className="w-full border-collapse border border-slate-400 mb-2">
                  <tbody>
                    <tr>
                      {checklist.periodos_clima?.map((periodo, index) => (
                        <td key={index} className="border border-slate-400 px-1 py-1 text-center">
                          <p className="font-bold">{getPeriodoNome(periodo.periodo)}</p>
                          <p>Temp. Ambiente (°C): {periodo.temperatura_ambiente || 'N/A'}</p>
                          <p className="font-bold">{getClimaEmoji(periodo.condicoes_climaticas)} {getClimaTexto(periodo.condicoes_climaticas)}</p>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>

                {/* Observações Gerais */}
                <div className="mb-2 bg-slate-800 text-white">
                  <p className="font-bold text-center py-0.5">OBSERVAÇÕES GERAIS</p>
                </div>
                <p className="mb-2 p-1 bg-slate-50 border border-slate-400">{checklist.observacoes_gerais || 'N/A'}</p>
              </>
            )}

            {/* Carga de Concreto */}
            <div className="mb-2 bg-slate-800 text-white">
              <p className="font-bold text-center py-0.5">CARGA DE CONCRETO {carga.numero_carga}</p>
            </div>
            <div className="mb-2">
              <CargaContent carga={carga} />
            </div>

            {isUltimaCarga && !temAcoesCorretivas && (
              <SignatureFooter {...footerProps} />
            )}
          </div>
        );
      })}

      {/* PÁGINA DE AÇÕES CORRETIVAS E/OU NÃO CONFORMIDADES */}
      {(temAcoesCorretivas || (checklist.nao_conformidades && checklist.nao_conformidades.length > 0)) && (
        <div className="print-page">
          {/* Header */}
          <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-black gap-2">
            <div className="w-12">
              <picture>
                <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo" 
                  className="h-10 object-contain"
                  width="auto" height="40"
                />
              </picture>
            </div>
            
            <div className="text-center flex-1">
              <p className="font-bold leading-tight">CONTROLE TECNOLÓGICO<br/>DE CONCRETO</p>
            </div>
            
            <div className="border border-black px-2 py-1">
              <p className="font-semibold">{formatDateConcr(checklist.data)}</p>
            </div>
          </div>

          {/* Ações Corretivas */}
          {temAcoesCorretivas && (
            <>
              <div className="mb-2 bg-slate-800 text-white">
                <p className="font-bold text-center py-0.5">AÇÕES CORRETIVAS</p>
              </div>
              <p className="mb-2 p-2 border border-slate-400">{checklist.acoes_corretivas_descricao}</p>
            </>
          )}

          {/* Não Conformidades */}
          {checklist.nao_conformidades && checklist.nao_conformidades.length > 0 && (
            <>
              <div className="mb-2 bg-slate-800 text-white">
                <p className="font-bold text-center py-0.5">NÃO CONFORMIDADES</p>
              </div>
              <table className="w-full border-collapse border border-slate-400 mb-2">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="border border-slate-400 px-2 py-1 font-bold text-left">LOCAL</th>
                    <th className="border border-slate-400 px-2 py-1 font-bold text-left">CATEGORIA</th>
                    <th className="border border-slate-400 px-2 py-1 font-bold text-left">PARÂMETRO</th>
                  </tr>
                </thead>
                <tbody>
                  {checklist.nao_conformidades.map((nc, index) => (
                    <tr key={index}>
                      <td className="border border-slate-400 px-2 py-1">{nc.local_nc || 'N/A'}</td>
                      <td className="border border-slate-400 px-2 py-1">{nc.categoria_nc || 'N/A'}</td>
                      <td className="border border-slate-400 px-2 py-1">{nc.parametro_nc || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <SignatureFooter {...footerProps} />
        </div>
      )}

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="print-page">
          {/* Header */}
          <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-black gap-2">
            <div className="w-12">
              <picture>
                <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo" 
                  className="h-10 object-contain"
                  width="auto" height="40"
                />
              </picture>
            </div>
            
            <div className="text-center flex-1">
              <p className="font-bold">Relatório Fotográfico</p>
              <p className="text-xs">Checklist de Concretagem</p>
            </div>
            
            <p className="font-semibold">{formatDateConcr(checklist.data)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {chunk.map((fotoUrl, fotoIndex) => (
              <div key={fotoIndex} className="border border-slate-400 p-1 flex flex-col">
                <div className="bg-gray-100 flex items-center justify-center rounded overflow-hidden flex-1">
                  <picture>
                    <source srcSet={fotoUrl} />
                    <img src={fotoUrl} alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" width="auto" height="auto" />
                  </picture>
                </div>
                <p className="text-center text-xs mt-0.5 font-medium">
                  Foto {(pageIndex * 6) + fotoIndex + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}