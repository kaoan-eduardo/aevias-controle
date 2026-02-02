import React from 'react';
import GraficoGranulometria from './GraficoGranulometria';

const peneiras = [
  { label: "3\"", abertura: "75,0mm", key: "peneira_75_0mm" },
  { label: "2 1/2\"", abertura: "63,0mm", key: "peneira_63_0mm" },
  { label: "2\"", abertura: "50,0mm", key: "peneira_50_0mm" },
  { label: "1 1/2\"", abertura: "37,5mm", key: "peneira_37_5mm" },
  { label: "1\"", abertura: "25,0mm", key: "peneira_25_0mm" },
  { label: "3/4\"", abertura: "19,0mm", key: "peneira_19_0mm" },
  { label: "5/8\"", abertura: "16,0mm", key: "peneira_16_0mm" },
  { label: "1/2\"", abertura: "12,5mm", key: "peneira_12_5mm" },
  { label: "3/8\"", abertura: "9,5mm", key: "peneira_9_5mm" },
  { label: "N° 4", abertura: "4,75mm", key: "peneira_4_75mm" },
  { label: "N° 8", abertura: "2,36mm", key: "peneira_2_36mm" },
  { label: "N° 10", abertura: "2,0mm", key: "peneira_2_0mm" },
  { label: "N° 16", abertura: "1,18mm", key: "peneira_1_18mm" },
  { label: "N° 30", abertura: "0,6mm", key: "peneira_0_6mm" },
  { label: "N° 40", abertura: "0,42mm", key: "peneira_0_42mm" },
  { label: "N° 50", abertura: "0,3mm", key: "peneira_0_3mm" },
  { label: "N° 80", abertura: "0,18mm", key: "peneira_0_18mm" },
  { label: "N° 100", abertura: "0,15mm", key: "peneira_0_15mm" },
  { label: "N° 200", abertura: "0,075mm", key: "peneira_0_075mm" }
];

export default function RelatorioMRAF({ ensaio, obra, project, user, regional, faixaGranulometrica }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const calcularGranulometria = () => {
    const granulometria = ensaio?.granulometria?.peso_retido_peneiras || {};
    
    const pesoTotal = Object.values(granulometria).reduce((sum, peso) => sum + (parseFloat(peso) || 0), 0);
    
    const resultados = peneiras.map(peneira => {
      const pesoRetido = parseFloat(granulometria[peneira.key]) || 0;
      const pesoPassante = pesoTotal - pesoRetido;
      const percentualPassante = pesoTotal > 0 ? (pesoPassante / pesoTotal) * 100 : 0;
      
      let limiteMin = null;
      let limiteMax = null;
      let trabalho = null;
      
      if (faixaGranulometrica) {
        const peneiraSpec = faixaGranulometrica.peneiras?.find(p => p.abertura === peneira.abertura);
        if (peneiraSpec) {
          limiteMin = peneiraSpec.min;
          limiteMax = peneiraSpec.max;
        }
      }
      
      if (project) {
        trabalho = project.faixa_trabalho?.[peneira.key];
      }
      
      return {
        peneira,
        pesoRetido,
        pesoPassante,
        percentualPassante: percentualPassante.toFixed(1),
        limiteMin,
        limiteMax,
        trabalho
      };
    });
    
    return resultados;
  };

  const granulometriaData = calcularGranulometria();
  const extracao = ensaio?.extracao_ligante || {};

  return (
    <div className="bg-white p-8" style={{ fontSize: '9pt', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-slate-800">
        <div className="flex-1">
          {regional?.logo_url && (
            <img src={regional.logo_url} alt="Logo" className="h-16 mb-2" />
          )}
          <div className="text-xs text-slate-600">
            <p><strong>{regional?.nome || 'Regional'}</strong></p>
            {regional?.endereco && <p>{regional.endereco}</p>}
            {regional?.telefone && <p>Tel: {regional.telefone}</p>}
            {regional?.email && <p>Email: {regional.email}</p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-lg font-bold text-slate-800 mb-1">ENSAIO DE MRAF</h1>
          <p className="text-xs text-slate-600">Mistura Asfáltica Reciclada a Frio</p>
          <p className="text-xs text-slate-600 mt-2">Data: {formatDate(ensaio?.data_ensaio)}</p>
        </div>
      </div>

      {/* Dados da Obra */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 mb-2">DADOS DA OBRA</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div><strong>Obra:</strong> {obra?.name || 'N/A'}</div>
          <div><strong>Código:</strong> {obra?.code || 'N/A'}</div>
          <div><strong>Cliente:</strong> {regional?.cliente || 'N/A'}</div>
          <div><strong>Projeto:</strong> {project?.name || 'N/A'}</div>
          <div><strong>Rodovia:</strong> {ensaio?.rodovia || 'N/A'}</div>
          <div><strong>Trecho:</strong> {ensaio?.trecho || 'N/A'}</div>
          <div><strong>Local de Coleta:</strong> {ensaio?.local_coleta || 'N/A'}</div>
          <div><strong>Usina:</strong> {ensaio?.usina_fornecedora || 'N/A'}</div>
          <div><strong>Pedreira:</strong> {ensaio?.pedreira || 'N/A'}</div>
          <div><strong>Placa Caminhão:</strong> {ensaio?.placa_caminhao || 'N/A'}</div>
          <div><strong>Faixa Especificada:</strong> {ensaio?.faixa_especificada || 'N/A'}</div>
          <div><strong>Emulsão Utilizada:</strong> {project?.emulsao_utilizada || 'N/A'}</div>
        </div>
      </div>

      {/* Extração de Ligante */}
      {extracao && Object.keys(extracao).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold bg-slate-100 p-2 mb-2">EXTRAÇÃO DE LIGANTE (ROTAREX)</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 p-1 text-left">Parâmetro</th>
                <th className="border border-slate-300 p-1 text-center">Valor</th>
                <th className="border border-slate-300 p-1 text-center">Unidade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-1">Peso da Amostra</td>
                <td className="border border-slate-300 p-1 text-center">{extracao.peso_amostra?.toFixed(2) || '-'}</td>
                <td className="border border-slate-300 p-1 text-center">g</td>
              </tr>
              {ensaio?.realizar_ensaio_umidade && (
                <>
                  <tr>
                    <td className="border border-slate-300 p-1">Amostra Úmida</td>
                    <td className="border border-slate-300 p-1 text-center">{extracao.amostra_umida?.toFixed(2) || '-'}</td>
                    <td className="border border-slate-300 p-1 text-center">g</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1">Amostra Seca</td>
                    <td className="border border-slate-300 p-1 text-center">{extracao.amostra_seca?.toFixed(2) || '-'}</td>
                    <td className="border border-slate-300 p-1 text-center">g</td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="border border-slate-300 p-1">Umidade</td>
                    <td className="border border-slate-300 p-1 text-center">{extracao.umidade?.toFixed(2) || '-'}</td>
                    <td className="border border-slate-300 p-1 text-center">%</td>
                  </tr>
                </>
              )}
              <tr>
                <td className="border border-slate-300 p-1">Amostra com Ligante</td>
                <td className="border border-slate-300 p-1 text-center">{extracao.amostra_com_ligante?.toFixed(2) || '-'}</td>
                <td className="border border-slate-300 p-1 text-center">g</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1">Amostra sem Ligante</td>
                <td className="border border-slate-300 p-1 text-center">{extracao.amostra_sem_ligante?.toFixed(2) || '-'}</td>
                <td className="border border-slate-300 p-1 text-center">g</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-1">Fator de Correção</td>
                <td className="border border-slate-300 p-1 text-center">{extracao.fator_correcao?.toFixed(2) || '-'}</td>
                <td className="border border-slate-300 p-1 text-center">-</td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td className="border border-slate-300 p-1">Peso do Ligante</td>
                <td className="border border-slate-300 p-1 text-center">{extracao.peso_ligante?.toFixed(2) || '-'}</td>
                <td className="border border-slate-300 p-1 text-center">g</td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td className="border border-slate-300 p-1">Teor de Ligante</td>
                <td className="border border-slate-300 p-1 text-center">{extracao.teor_ligante?.toFixed(2) || '-'}</td>
                <td className="border border-slate-300 p-1 text-center">%</td>
              </tr>
            </tbody>
          </table>
          
          {project && (
            <div className="mt-2 text-xs">
              <p><strong>Especificação do Projeto:</strong></p>
              <p>Teor de Ligante Residual: {project.teor_ligante_residual?.min || '-'}% - {project.teor_ligante_residual?.max || '-'}% (Ótimo: {project.teor_ligante_residual?.otimo || '-'}%)</p>
              {project.percentual_emulsao && <p>Percentual de Emulsão: {project.percentual_emulsao}%</p>}
            </div>
          )}
        </div>
      )}

      {/* Granulometria */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 mb-2">ANÁLISE GRANULOMÉTRICA</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-300 p-1">Peneira</th>
              <th className="border border-slate-300 p-1">Abertura</th>
              <th className="border border-slate-300 p-1">Peso Retido (g)</th>
              <th className="border border-slate-300 p-1">% Passante</th>
              {faixaGranulometrica && (
                <>
                  <th className="border border-slate-300 p-1">Limite Mín.</th>
                  <th className="border border-slate-300 p-1">Limite Máx.</th>
                </>
              )}
              {project?.faixa_trabalho && <th className="border border-slate-300 p-1">Faixa Trabalho</th>}
            </tr>
          </thead>
          <tbody>
            {granulometriaData.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-slate-300 p-1 text-center">{item.peneira.label}</td>
                <td className="border border-slate-300 p-1 text-center">{item.peneira.abertura}</td>
                <td className="border border-slate-300 p-1 text-center">{item.pesoRetido.toFixed(2)}</td>
                <td className="border border-slate-300 p-1 text-center font-semibold">{item.percentualPassante}</td>
                {faixaGranulometrica && (
                  <>
                    <td className="border border-slate-300 p-1 text-center">{item.limiteMin !== null ? item.limiteMin : '-'}</td>
                    <td className="border border-slate-300 p-1 text-center">{item.limiteMax !== null ? item.limiteMax : '-'}</td>
                  </>
                )}
                {project?.faixa_trabalho && (
                  <td className="border border-slate-300 p-1 text-center">{item.trabalho !== undefined ? item.trabalho : '-'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráfico */}
      {faixaGranulometrica && (
        <div className="mb-6 break-inside-avoid">
          <h2 className="text-sm font-bold bg-slate-100 p-2 mb-2">CURVA GRANULOMÉTRICA</h2>
          <GraficoGranulometria
            granulometriaData={granulometriaData}
            faixaGranulometrica={faixaGranulometrica}
            project={project}
          />
        </div>
      )}

      {/* Observações */}
      {ensaio?.observacoes && (
        <div className="mb-6">
          <h2 className="text-sm font-bold bg-slate-100 p-2 mb-2">OBSERVAÇÕES</h2>
          <p className="text-xs whitespace-pre-wrap">{ensaio.observacoes}</p>
        </div>
      )}

      {/* Assinaturas */}
      <div className="mt-8 pt-6 border-t-2 border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div className="text-center">
            <div className="border-t border-slate-400 pt-2 mt-16">
              <p className="font-semibold">{ensaio?.laboratorista_name || 'Laboratorista'}</p>
              <p className="text-slate-600">Laboratorista Responsável</p>
            </div>
          </div>
          
          {ensaio?.approver_details && (
            <div className="text-center">
              <div className="border-t border-slate-400 pt-2 mt-16">
                <p className="font-semibold">{ensaio.approver_details.name}</p>
                <p className="text-slate-600">{ensaio.approver_details.position}</p>
                {ensaio.approver_details.crea_number && (
                  <p className="text-slate-600">CREA: {ensaio.approver_details.crea_number}</p>
                )}
              </div>
            </div>
          )}
          
          {ensaio?.client_signature?.signed_by && (
            <div className="text-center col-span-2 mt-6">
              <div className="border-t border-slate-400 pt-2 mt-16">
                <p className="font-semibold">{ensaio.client_signature.engineer_name}</p>
                <p className="text-slate-600">Engenheiro Cliente</p>
                {ensaio.client_signature.crea_number && (
                  <p className="text-slate-600">CREA: {ensaio.client_signature.crea_number}</p>
                )}
                <p className="text-slate-600 text-xs mt-1">
                  Assinado em: {formatDate(ensaio.client_signature.signed_date)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}