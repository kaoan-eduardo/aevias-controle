import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SignatureFooter from './SignatureFooter';

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
  if (checked === null || typeof checked === 'undefined') return <span>-</span>;
  return <span className={checked ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{checked ? '✓' : '✗'}</span>;
};

export default function RelatorioChecklistConcretagem({ checklist, creatorUser, obra: obraProp, regional: regionalProp, project: projectProp }) {
  const [obra, setObra] = useState(obraProp || null);
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
              const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
              img.onload = () => { clearTimeout(timeout); resolve(); };
              img.onerror = () => { clearTimeout(timeout); reject(new Error('Error')); };
              img.src = photoUrl;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 800, maxHeight = 600;
            let width = img.width, height = img.height;
            
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
    } catch (error) {
      console.error("Erro ao carregar dados relacionados:", error);
    }
  };

  if (isCompressing) {
    return <div className="p-8 text-center">Otimizando imagens para impressão...</div>;
  }

  const chunkArray = (arr, size) => { const chunks = []; if (!arr) return chunks; for (let i = 0; i < arr.length; i += size) { chunks.push(arr.slice(i, i + size)); } return chunks; };
  const photoChunks = chunkArray(compressedPhotos, 5);
  const cargas = checklist.cargas_concreto || [];

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
    <div className="bg-white">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .report-page { 
            page-break-after: always; 
            width: 210mm; 
            padding: 10mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>

      {/* PÁGINA 1 */}
      {cargas.length > 0 && (
        <div className="report-page">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-3">
            <div className="w-16">
              <picture>
                <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                <img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo" className="h-10 object-contain" width="auto" height="40" />
              </picture>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-sm font-bold">CONTROLE TECNOLÓGICO<br/>DE CONCRETO</h1>
            </div>
            <div className="text-right border border-gray-400 px-2 py-1">
              <p className="text-[10px] font-semibold">{formatDateConcr(checklist.data)}</p>
            </div>
          </div>

          {/* DADOS DA OBRA */}
          <div className="mb-2">
            <div className="bg-slate-700 text-white px-2 py-1 text-[10px] font-bold text-center mb-1">DADOS DA OBRA</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[10px]">
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
          </div>

          {/* CONDIÇÕES CLIMÁTICAS */}
          <div className="mb-2">
            <div className="bg-slate-700 text-white px-2 py-1 text-[10px] font-bold text-center mb-1">CONDIÇÕES CLIMÁTICAS</div>
            <table className="w-full border-collapse border border-gray-300 text-[9px]">
              <thead>
                <tr className="bg-gray-100">
                  {checklist.periodos_clima?.map((periodo, index) => (
                    <th key={index} className="border border-gray-300 px-1 py-0.5 font-bold">{getPeriodoNome(periodo.periodo)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {checklist.periodos_clima?.map((periodo, index) => (
                    <td key={index} className="border border-gray-300 px-1 py-0.5 text-center">
                      <p>Temp. Ambiente (°C): {periodo.temperatura_ambiente || 'N/A'}</p>
                      <p className="font-bold">🟡 {getClimaTexto(periodo.condicoes_climaticas)}</p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* OBSERVAÇÕES GERAIS */}
          <div className="mb-2">
            <div className="bg-slate-700 text-white px-2 py-1 text-[10px] font-bold text-center mb-1">OBSERVAÇÕES GERAIS</div>
            <div className="text-[9px] border border-gray-300 p-1 bg-gray-50">
              {checklist.observacoes_gerais}
            </div>
          </div>

          {/* CARGA DE CONCRETO */}
          {cargas.length > 0 && (
            <div className="mb-2">
              <div className="bg-slate-700 text-white px-2 py-1 text-[10px] font-bold text-center mb-1">CARGA DE CONCRETO 1</div>
              
              <div className="text-[9px] mb-1">
                <p className="font-bold">Identificação da Carga</p>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <p><span className="font-bold">Nota Fiscal Nº:</span> {cargas[0]?.nota_fiscal || 'N/A'}</p>
                  <p><span className="font-bold">Placa da Betoneira:</span> {cargas[0]?.placa_betoneira || 'N/A'}</p>
                  <p><span className="font-bold">Horário Início:</span> {cargas[0]?.horario_inicio || 'N/A'}</p>
                  <p><span className="font-bold">Horário Término:</span> {cargas[0]?.horario_termino || 'N/A'}</p>
                </div>

                <p className="font-bold">Ensaios de Qualidade</p>
                <table className="w-full border-collapse border border-gray-300 text-[8px] mb-1">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-0.5 py-0.5 text-left">Ensaio</th>
                      <th className="border border-gray-300 px-0.5 py-0.5">Realizado</th>
                      <th className="border border-gray-300 px-0.5 py-0.5">Resultado (cm)</th>
                      <th className="border border-gray-300 px-0.5 py-0.5">Padrão do Projeto</th>
                      <th className="border border-gray-300 px-0.5 py-0.5">Conformidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-0.5 py-0.5">Slump Test</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center"><Checkmark checked={cargas[0]?.slump_test?.realizado} /></td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.slump_test?.resultado || '-'}</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.slump_test?.limite || 'N/A'}</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center"><Checkmark checked={cargas[0]?.slump_test?.conforme} /></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-0.5 py-0.5">Espessura da Camada</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center"><Checkmark checked={cargas[0]?.espessura_camada?.realizado} /></td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.espessura_camada?.resultado || '-'}</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.espessura_camada?.limite || 'N/A'}</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center"><Checkmark checked={cargas[0]?.espessura_camada?.conforme} /></td>
                    </tr>
                  </tbody>
                </table>

                <p><span className="font-bold">Equipamento de Lançamento:</span> {cargas[0]?.equipamento_lancamento === 'bombeado' ? 'Bombeado' : 'Convencional'}</p>

                <p className="font-bold mt-1">Acompanhamento Lançamento Concreto</p>
                <table className="w-full border-collapse border border-gray-300 text-[8px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-0.5 py-0.5 text-left">Serviço</th>
                      <th className="border border-gray-300 px-0.5 py-0.5">Sim</th>
                      <th className="border border-gray-300 px-0.5 py-0.5">Não</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-0.5 py-0.5">A superfície foi tratada e limpa?</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.superficie_tratada_limpa === true && '✓'}</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.superficie_tratada_limpa === false && '✗'}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-0.5 py-0.5">Foi realizado adensamento do concreto?</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.adensamento_realizado === true && '✓'}</td>
                      <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cargas[0]?.adensamento_realizado === false && '✗'}</td>
                    </tr>
                  </tbody>
                </table>

                {cargas[0]?.corpos_prova && cargas[0]?.corpos_prova.length > 0 && (
                  <>
                    <p className="font-bold mt-1">Moldes para Fiscalização</p>
                    <table className="w-full border-collapse border border-gray-300 text-[8px]">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-0.5 py-0.5">Dias para Ruptura</th>
                          <th className="border border-gray-300 px-0.5 py-0.5">Quantidade de CPs</th>
                          <th className="border border-gray-300 px-0.5 py-0.5">Tipo de Ruptura</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[3, 7, 28].map((dias) => {
                          const cps = cargas[0]?.corpos_prova.filter(cp => cp.dias_ruptura === dias);
                          if (!cps || cps.length === 0) return null;
                          const tipoTexto = cps[0].tipo_ruptura === 'compressao_axial' ? 'Compressão Axial' : cps[0].tipo_ruptura === 'comp_diametral' ? 'Compressão Diametral' : 'Tração na Flexão';
                          return (
                            <tr key={dias}>
                              <td className="border border-gray-300 px-0.5 py-0.5">{dias} dias</td>
                              <td className="border border-gray-300 px-0.5 py-0.5 text-center">{cps.length}</td>
                              <td className="border border-gray-300 px-0.5 py-0.5">{tipoTexto}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="text-[8px] mt-0.5"><span className="font-bold">Total de CPs moldados:</span> {cargas[0]?.corpos_prova.length}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Signature Footer */}
          <div className="mt-auto">
            <SignatureFooter {...footerProps} />
          </div>
        </div>
      )}

      {/* PÁGINA DE FOTOS */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="report-page">
          <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-3">
            <div className="w-16">
              <picture>
                <source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} />
                <img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo" className="h-10 object-contain" width="auto" height="40" />
              </picture>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-sm font-bold">Relatório Fotográfico</h1>
              <p className="text-[9px] text-gray-600">Checklist de Concretagem</p>
            </div>
            <div className="text-right">
              <p className="text-[10px]">{formatDateConcr(checklist.data)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {chunk.map((fotoUrl, fotoIndex) => (
              <div key={fotoIndex} className="border border-gray-300 rounded overflow-hidden">
                <div className="bg-gray-100 h-40 flex items-center justify-center">
                  <picture>
                    <source srcSet={fotoUrl} />
                    <img src={fotoUrl} alt={`Foto ${pageIndex * 5 + fotoIndex + 1}`} className="max-h-full max-w-full object-contain" width="auto" height="auto" />
                  </picture>
                </div>
                <p className="text-center text-[8px] py-0.5 font-medium">Foto {(pageIndex * 5) + fotoIndex + 1}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}