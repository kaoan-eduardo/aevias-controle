import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SignatureFooter from './SignatureFooter';

// ── Helper functions ──────────────────────────────────────────────────────────
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

// ── Sub-components ─────────────────────────────────────────────────────────────
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
    <div className="mb-1">
      <h3 className="font-bold text-xs mb-0.5 bg-slate-50 p-0.5">Identificação da Carga</h3>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <p><strong>Nota Fiscal Nº:</strong> {carga.nota_fiscal || 'N/A'}</p>
        <p><strong>Placa da Betoneira:</strong> {carga.placa_betoneira || 'N/A'}</p>
        <p><strong>Horário Início:</strong> {carga.horario_inicio || 'N/A'}</p>
        <p><strong>Horário Término:</strong> {carga.horario_termino || 'N/A'}</p>
      </div>
    </div>
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
          <td className="border border-slate-300 px-1 py-0.5 text-center"><Checkmark checked={carga.slump_test?.realizado} /></td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">{carga.slump_test?.realizado && carga.slump_test?.resultado !== null ? carga.slump_test.resultado : '-'}</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">{carga.slump_test?.limite || 'N/A'}</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">
            {carga.slump_test?.realizado ? (carga.slump_test.conforme === true ? <span className="text-green-600 font-bold text-lg">✓</span> : carga.slump_test.conforme === false ? <span className="text-red-600 font-bold text-lg">✗</span> : <span className="text-slate-500">-</span>) : <span className="text-slate-500">-</span>}
          </td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-1 py-0.5 font-medium bg-slate-50">Espessura da Camada</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center"><Checkmark checked={carga.espessura_camada?.realizado} /></td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">{carga.espessura_camada?.realizado && carga.espessura_camada?.resultado !== null ? carga.espessura_camada.resultado : '-'}</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center text-xs">{carga.espessura_camada?.limite || 'N/A'}</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">
            {carga.espessura_camada?.realizado ? (carga.espessura_camada.conforme === true ? <span className="text-green-600 font-bold text-lg">✓</span> : carga.espessura_camada.conforme === false ? <span className="text-red-600 font-bold text-lg">✗</span> : <span className="text-slate-500">-</span>) : <span className="text-slate-500">-</span>}
          </td>
        </tr>
      </tbody>
    </table>
    <p className="text-xs mb-1"><strong>Equipamento de Lançamento:</strong> {carga.equipamento_lancamento === 'convencional' ? 'Convencional' : carga.equipamento_lancamento === 'bombeado' ? 'Bombeado' : 'N/A'}</p>
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
          <td className="border border-slate-300 px-1 py-0.5 font-medium bg-slate-50">A superfície foi tratada e limpa?</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">{carga.superficie_tratada_limpa === true && <span className="text-green-600 font-bold text-lg">✓</span>}</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">{carga.superficie_tratada_limpa === false && <span className="text-red-600 font-bold text-lg">✗</span>}</td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-1 py-0.5 font-medium bg-slate-50">Foi realizado adensamento do concreto?</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">{carga.adensamento_realizado === true && <span className="text-green-600 font-bold text-lg">✓</span>}</td>
          <td className="border border-slate-300 px-1 py-0.5 text-center">{carga.adensamento_realizado === false && <span className="text-red-600 font-bold text-lg">✗</span>}</td>
        </tr>
      </tbody>
    </table>
    {carga.observacoes_lancamento && (<div className="text-xs mb-1"><strong>Observações:</strong> {carga.observacoes_lancamento}</div>)}
    <div className="mb-0">
      <h3 className="font-bold text-xs mb-0.5 bg-slate-50 p-0.5">Moldes para Fiscalização</h3>
      {carga.moldado_fiscalizacao ? (
        <>
          {carga.corpos_prova && carga.corpos_prova.length > 0 ? (
            <>
              <table className="w-full border-collapse border border-slate-300 text-xs mt-0.5">
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
                    const tipoTexto = tipoRuptura === 'compressao_axial' ? 'Compressão Axial' : tipoRuptura === 'comp_diametral' ? 'Compressão Diametral' : tipoRuptura === 'tracao_flexao' ? 'Tração na Flexão' : 'N/A';
                    return (
                      <tr key={dias}>
                        <td className="border border-slate-300 px-1 py-0.5 text-center font-medium bg-slate-50">{dias} dias</td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">{cpsDestaDia.length}</td>
                        <td className="border border-slate-300 px-1 py-0.5 text-center">{tipoTexto}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs mt-0.5 text-slate-600 mb-0"><strong>Total de CPs moldados:</strong> {carga.corpos_prova.length}</p>
            </>
          ) : (
            <div className="text-xs"><p><strong>Moldado:</strong> ✓ Sim</p><p className="text-slate-500 italic">Detalhes dos corpos de prova não registrados</p></div>
          )}
        </>
      ) : (
        <div className="text-xs"><p><strong>Moldado para Fiscalização:</strong> ✗ Não</p></div>
      )}
    </div>
  </>
);

// ── Main component ─────────────────────────────────────────────────────────────
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
    <div className="bg-white font-sans">
      <style>{`
        @media print {
          body, html { margin: 0; padding: 0; }
          .print-page { 
            width: 210mm; 
            height: 297mm; 
            margin: 0; 
            padding: 10mm; 
            box-sizing: border-box; 
            page-break-after: always;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>

      {/* CASO 1: UMA ÚNICA CARGA - TUDO NA PRIMEIRA PÁGINA */}
      {!temMultiplasCargas && cargas.length === 1 && (
        <div className="print-page w-full max-w-[210mm] mx-auto bg-white min-h-[297mm]">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-slate-900">
            <div className="w-16">
              <picture>
                <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo" 
                  className="h-12 object-contain"
                  width="auto" height="48"
                />
              </picture>
            </div>
            
            <div className="text-center flex-1">
              <h1 className="text-sm font-bold text-gray-800 leading-tight">
                CONTROLE TECNOLÓGICO<br/>DE CONCRETO
              </h1>
            </div>
            
            <div className="text-right w-16">
              <div className="border border-gray-400 p-1 rounded inline-block">
                <p className="text-[9px] font-semibold text-gray-800">{formatDateConcr(checklist.data)}</p>
              </div>
            </div>
          </div>

          {/* DADOS DA OBRA */}
          <div className="mb-3">
            <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">DADOS DA OBRA</div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[9px]">
              <div>
                <p className="font-bold text-gray-700">CLIENTE:</p>
                <p className="text-gray-900">{regional?.cliente || obra?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">CONCRETEIRA:</p>
                <p className="text-gray-900">{checklist.concreteira}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">EMPREITEIRA:</p>
                <p className="text-gray-900">{checklist.empreiteira || 'N/A'}</p>
              </div>

              <div>
                <p className="font-bold text-gray-700">OBRA:</p>
                <p className="text-gray-900">{obra?.code || 'N/A'}</p>
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
                <p className="font-bold text-gray-700">VOLUME (m³):</p>
                <p className="text-gray-900">{checklist.volume || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">Fck (MPa):</p>
                <p className="text-gray-900">{checklist.fck || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">ESTRUTURA:</p>
                <p className="text-gray-900">{checklist.estrutura || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Condições Climáticas */}
          <div className="mb-2">
            <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">CONDIÇÕES CLIMÁTICAS</div>
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr className="bg-slate-100">
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
                      <p className="font-medium mb-0.5">Temp. Ambiente (°C): {periodo.temperatura_ambiente || 'N/A'}</p>
                      <p className="font-bold">{getClimaEmoji(periodo.condicoes_climaticas)} {getClimaTexto(periodo.condicoes_climaticas)}</p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Observações Gerais */}
          {checklist.observacoes_gerais && (
            <div className="mb-2">
              <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">OBSERVAÇÕES GERAIS</div>
              <div className="text-[9px] p-1 bg-slate-50 border border-slate-300 rounded">
                {checklist.observacoes_gerais}
              </div>
            </div>
          )}

          {/* Carga de Concreto */}
          <div className="mb-2">
            <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">CARGA DE CONCRETO 1</div>
            <div className="text-[9px]">
              <CargaContent carga={cargas[0]} />
            </div>
          </div>

          {/* Signature Footer */}
          <div className="mt-4">
            <SignatureFooter {...footerProps} />
          </div>
        </div>
      )}

      {/* CASO 2: MÚLTIPLAS CARGAS - UMA CARGA POR PÁGINA */}
      {temMultiplasCargas && cargas.map((carga, cargaIndex) => {
        const isUltimaCarga = cargaIndex === cargas.length - 1;
        const isPrimeiraCarga = cargaIndex === 0;
        
        return (
          <div key={cargaIndex} className="print-page w-full max-w-[210mm] mx-auto bg-white min-h-[297mm]">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-slate-900">
              <div className="w-16">
                <picture>
                  <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                  <img 
                    src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                    alt="Logo" 
                    className="h-12 object-contain"
                    width="auto" height="48"
                  />
                </picture>
              </div>
              
              <div className="text-center flex-1">
                <h1 className="text-sm font-bold text-gray-800 leading-tight">
                  CONTROLE TECNOLÓGICO<br/>DE CONCRETO
                </h1>
              </div>
              
              <div className="text-right w-16">
                <div className="border border-gray-400 p-1 rounded inline-block">
                  <p className="text-[9px] font-semibold text-gray-800">{formatDateConcr(checklist.data)}</p>
                </div>
              </div>
            </div>

            {isPrimeiraCarga && (
              <>
                {/* DADOS DA OBRA */}
                <div className="mb-3">
                  <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">DADOS DA OBRA</div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[9px]">
                    <div>
                      <p className="font-bold text-gray-700">CLIENTE:</p>
                      <p className="text-gray-900">{regional?.cliente || obra?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">CONCRETEIRA:</p>
                      <p className="text-gray-900">{checklist.concreteira}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">EMPREITEIRA:</p>
                      <p className="text-gray-900">{checklist.empreiteira || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="font-bold text-gray-700">OBRA:</p>
                      <p className="text-gray-900">{obra?.code || 'N/A'}</p>
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
                      <p className="font-bold text-gray-700">VOLUME (m³):</p>
                      <p className="text-gray-900">{checklist.volume || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Fck (MPa):</p>
                      <p className="text-gray-900">{checklist.fck || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">ESTRUTURA:</p>
                      <p className="text-gray-900">{checklist.estrutura || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Condições Climáticas */}
                <div className="mb-2">
                  <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">CONDIÇÕES CLIMÁTICAS</div>
                  <table className="w-full border-collapse text-[9px]">
                    <thead>
                      <tr className="bg-slate-100">
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
                            <p className="font-medium mb-0.5">Temp. Ambiente (°C): {periodo.temperatura_ambiente || 'N/A'}</p>
                            <p className="font-bold">{getClimaEmoji(periodo.condicoes_climaticas)} {getClimaTexto(periodo.condicoes_climaticas)}</p>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Observações Gerais */}
                {checklist.observacoes_gerais && (
                  <div className="mb-2">
                    <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">OBSERVAÇÕES GERAIS</div>
                    <div className="text-[9px] p-1 bg-slate-50 border border-slate-300 rounded">
                      {checklist.observacoes_gerais}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Carga de Concreto */}
            <div className="mb-2">
              <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">CARGA DE CONCRETO {carga.numero_carga}</div>
              <div className="text-[9px]">
                <CargaContent carga={carga} />
              </div>
            </div>

            {isUltimaCarga && !temAcoesCorretivas && (
              <div className="mt-4">
                <SignatureFooter {...footerProps} />
              </div>
            )}
          </div>
        );
      })}

      {/* PÁGINA DE AÇÕES CORRETIVAS E/OU NÃO CONFORMIDADES */}
      {(temAcoesCorretivas || (checklist.nao_conformidades && checklist.nao_conformidades.length > 0)) && (
        <div className="print-page w-full max-w-[210mm] mx-auto bg-white min-h-[297mm]">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-slate-900">
            <div className="w-16">
              <picture>
                <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo" 
                  className="h-12 object-contain"
                  width="auto" height="48"
                />
              </picture>
            </div>
            
            <div className="text-center flex-1">
              <h1 className="text-sm font-bold text-gray-800 leading-tight">
                CONTROLE TECNOLÓGICO<br/>DE CONCRETO
              </h1>
            </div>
            
            <div className="text-right w-16">
              <div className="border border-gray-400 p-1 rounded inline-block">
                <p className="text-[9px] font-semibold text-gray-800">{formatDateConcr(checklist.data)}</p>
              </div>
            </div>
          </div>

          {/* DADOS DA OBRA */}
          <div className="mb-2">
            <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">DADOS DA OBRA</div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[9px]">
              <div>
                <p className="font-bold text-gray-700">CLIENTE:</p>
                <p className="text-gray-900">{regional?.cliente || obra?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">CONCRETEIRA:</p>
                <p className="text-gray-900">{checklist.concreteira}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">EMPREITEIRA:</p>
                <p className="text-gray-900">{checklist.empreiteira || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Ações Corretivas */}
          {temAcoesCorretivas && (
            <div className="mb-2">
              <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">AÇÕES CORRETIVAS</div>
              <div className="border border-slate-300 p-2 text-[9px] bg-slate-50 min-h-[60px]">
                {checklist.acoes_corretivas_descricao}
              </div>
            </div>
          )}

          {/* Não Conformidades */}
          {checklist.nao_conformidades && checklist.nao_conformidades.length > 0 && (
            <div className="mb-2">
              <div className="bg-slate-800 text-white px-2 py-1 font-bold text-[9px] mb-1 text-center">NÃO CONFORMIDADES</div>
              <table className="w-full border-collapse border border-slate-300 text-[9px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 px-1 py-0.5 font-bold text-left">LOCAL</th>
                    <th className="border border-slate-300 px-1 py-0.5 font-bold text-left">CATEGORIA</th>
                    <th className="border border-slate-300 px-1 py-0.5 font-bold text-left">PARÂMETRO</th>
                  </tr>
                </thead>
                <tbody>
                  {checklist.nao_conformidades.map((nc, index) => (
                    <tr key={index}>
                      <td className="border border-slate-300 px-1 py-0.5">{nc.local_nc || 'N/A'}</td>
                      <td className="border border-slate-300 px-1 py-0.5">{nc.categoria_nc || 'N/A'}</td>
                      <td className="border border-slate-300 px-1 py-0.5">{nc.parametro_nc || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <SignatureFooter {...footerProps} />
          </div>
        </div>
      )}

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="print-page w-full max-w-[210mm] mx-auto bg-white min-h-[297mm]">
          {/* Header */}
          <div className="flex justify-between items-start mb-2 pb-2 border-b-2 border-slate-900">
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
              <h1 className="text-sm font-bold text-gray-800">Relatório Fotográfico</h1>
              <p className="text-[8px] text-gray-600">Checklist de Concretagem</p>
            </div>
            
            <div className="text-right w-12">
              <p className="text-[8px] font-semibold text-gray-800">{formatDateConcr(checklist.data)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {chunk.map((fotoUrl, fotoIndex) => (
              <div key={fotoIndex} className="border border-slate-300 p-1 rounded flex flex-col h-56">
                <div className="bg-gray-100 flex items-center justify-center rounded overflow-hidden flex-1">
                  <picture>
                    <source srcSet={fotoUrl} />
                    <img src={fotoUrl} alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" width="auto" height="auto" />
                  </picture>
                </div>
                <p className="text-center text-[8px] mt-1 font-medium">
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