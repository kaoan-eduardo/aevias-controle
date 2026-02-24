import React from 'react';

export default function RelatorioManchaPendulo({ ensaio, obra, regional }) {
  if (!ensaio) {
    return <div className="p-8 text-center">Carregando dados do ensaio...</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="w-full min-h-screen bg-white p-6">
      {/* Header com Logo e Título */}
      <div className="border border-gray-400 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-400">
          <div className="w-32">
            {regional?.logo_url && (
              <img src={regional.logo_url} alt="Logo" className="w-full h-auto" />
            )}
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-sm font-bold uppercase">ENSAIO DE MACROTEXTURA E MICROTEXTURA</h1>
          </div>
          <div className="w-24 text-right text-xs">
            {formatDate(ensaio.data_ensaio)}
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="border-b border-gray-400">
          <div className="bg-gray-50 px-3 py-2 text-xs font-bold uppercase border-b border-gray-300">
            DADOS DO CLIENTE
          </div>
          <div className="grid grid-cols-3 text-xs">
            <div className="border-r border-gray-300 p-2">
              <span className="font-semibold">CLIENTE:</span> {regional?.cliente || 'N/A'}
            </div>
            <div className="border-r border-gray-300 p-2">
              <span className="font-semibold">RODOVIA:</span> {ensaio.rodovia || 'N/A'}
            </div>
            <div className="p-2">
              <span className="font-semibold">PISTA:</span> {ensaio.pista || 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-3 text-xs border-t border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <span className="font-semibold">OBRA:</span> {obra?.name || 'N/A'}
            </div>
            <div className="border-r border-gray-300 p-2">
              <span className="font-semibold">TRECHO:</span> {ensaio.trecho || 'N/A'}
            </div>
            <div className="p-2">
              <span className="font-semibold">LABORATORISTA:</span> {ensaio.laboratorista_name || 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-3 text-xs border-t border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <span className="font-semibold">ÓRGÃO:</span> {ensaio.orgao || 'N/A'}
            </div>
            <div className="col-span-2 p-2">
              <span className="font-semibold">CAMADA:</span> {ensaio.camada || 'N/A'}
            </div>
          </div>
        </div>

        {/* Dados do Ensaio - Mancha de Areia */}
        <div className="border-b border-gray-400">
          <div className="bg-gray-50 px-3 py-2 text-xs font-bold uppercase border-b border-gray-300">
            DADOS DO ENSAIO
          </div>
          <div className="bg-gray-50 px-3 py-1 text-xs font-bold border-b border-gray-300">
            MANCHA DE AREIA - MÉTODO ABNT NBR 16504:2016
          </div>
          
          <table className="w-full text-[8px] border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black p-1 font-semibold">DATA<br/>APLICAÇÃO</th>
                <th className="border border-gray-400 p-1.5 font-semibold">ESTACA</th>
                <th className="border border-gray-400 p-1.5 font-semibold">FAIXA /<br/>PISTA</th>
                <th className="border border-gray-400 p-1.5 font-semibold">BORDO</th>
                <th className="border border-gray-400 p-1.5 font-semibold">VOLUME<br/>DE AREIA<br/>(mm³)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">D1 (Ø)<br/>(mm)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">D2 (Ø)<br/>(mm)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">D3 (Ø)<br/>(mm)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">D4 (Ø)<br/>(mm)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">D(Ø) MÉDIA<br/>(mm)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">ÁREA<br/>(cm²)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">HS<br/>(cm)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">HS<br/>(mm)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">TIPO DE<br/>SUPERFÍCIE</th>
              </tr>
            </thead>
            <tbody>
              {ensaio.ensaios_mancha && ensaio.ensaios_mancha.map((e, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 p-1.5 text-center">{formatDate(e.data_aplicacao)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.estaca}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.faixa_pista}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.bordo}</td>
                  <td className="border border-gray-400 p-1.5 text-center">25000</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.d1?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.d2?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.d3?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.d4?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center font-semibold bg-gray-50">{e.d_media?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.area?.toFixed(2)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.hs_cm?.toFixed(2)}</td>
                  <td className="border border-gray-400 p-1.5 text-center font-semibold bg-gray-50">{e.hs_mm?.toFixed(2)}</td>
                  <td className="border border-gray-400 p-1.5 text-center text-[8px]">{e.tipo_superficie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pêndulo Britânico */}
        <div className="border-b border-gray-400">
          <div className="bg-gray-50 px-3 py-1 text-xs font-bold border-b border-gray-300">
            PÊNDULO BRITÂNICO - MÉTODO ABNT NBR 16780:2019
          </div>
          
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1.5 font-semibold">DATA<br/>APLICAÇÃO</th>
                <th className="border border-gray-400 p-1.5 font-semibold">ESTACA</th>
                <th className="border border-gray-400 p-1.5 font-semibold">FAIXA /<br/>PISTA</th>
                <th className="border border-gray-400 p-1.5 font-semibold">BORDO</th>
                <th className="border border-gray-400 p-1.5 font-semibold">TEMP. DO<br/>PAVIMENTO<br/>(°C)</th>
                <th className="border border-gray-400 p-1.5 font-semibold">1º</th>
                <th className="border border-gray-400 p-1.5 font-semibold">2º</th>
                <th className="border border-gray-400 p-1.5 font-semibold">3º</th>
                <th className="border border-gray-400 p-1.5 font-semibold">4º</th>
                <th className="border border-gray-400 p-1.5 font-semibold">5º</th>
                <th className="border border-gray-400 p-1.5 font-semibold">MÁXIMA</th>
                <th className="border border-gray-400 p-1.5 font-semibold">MÍNIMA</th>
                <th className="border border-gray-400 p-1.5 font-semibold">VRD</th>
                <th className="border border-gray-400 p-1.5 font-semibold">CLASSE</th>
              </tr>
            </thead>
            <tbody>
              {ensaio.ensaios_pendulo && ensaio.ensaios_pendulo.map((e, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 p-1.5 text-center">{formatDate(e.data_aplicacao)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.estaca}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.faixa_pista}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.bordo}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.temp_pavimento}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.leitura_1}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.leitura_2}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.leitura_3}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.leitura_4}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.leitura_5}</td>
                  <td className="border border-gray-400 p-1.5 text-center font-semibold bg-gray-50">{e.maxima?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center font-semibold bg-gray-50">{e.minima?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center font-semibold bg-gray-50">{e.vrd?.toFixed(1)}</td>
                  <td className="border border-gray-400 p-1.5 text-center">{e.classe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resultados e Observações */}
        <div className="border-b border-gray-400">
          <div className="bg-gray-50 px-3 py-2 text-xs font-bold uppercase border-b border-gray-300">
            RESULTADOS
          </div>
          <div className="grid grid-cols-2 text-xs">
            <div className="border-r border-gray-300 p-3">
              <div className="mb-2">
                <span className="font-semibold">MANCHA DE AREIA:</span>
              </div>
              <div className="border-t border-gray-300 pt-2">
                <span className="font-semibold">LIMITES ESTABELECIDOS</span><br/>
                {ensaio.limites_mancha || '0,6mm ≤ HS ≤ 1,2mm'}
              </div>
            </div>
            <div className="p-3">
              <div className="mb-2">
                <span className="font-semibold">PÊNDULO BRITÂNICO:</span>
              </div>
              <div className="border-t border-gray-300 pt-2">
                <span className="font-semibold">LIMITES ESTABELECIDOS</span><br/>
                {ensaio.limites_pendulo || 'VRD ≥ 47'}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-300 p-3 text-xs">
            <div className="text-center mb-1 font-semibold">CONDIÇÃO DE CONFORMIDADE</div>
            <div className={`text-center font-bold text-sm ${ensaio.condicao_conformidade === 'CONFORME' ? 'text-green-700' : 'text-red-700'}`}>
              {ensaio.condicao_conformidade || 'NÃO INFORMADO'}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="border-b border-gray-400">
          <div className="bg-gray-50 px-3 py-2 text-xs font-bold uppercase border-b border-gray-300">
            OBSERVAÇÕES
          </div>
          <div className="p-3 text-xs min-h-[60px]">
            <div className="mb-2 text-[10px] italic text-gray-600">
              HS &lt; 0,2 mm: Muito Fina | 0,2 &lt; HS &lt; 0,4 mm: Fina | 0,4 &lt; HS &lt; 0,8 mm: Média | 
              0,8 &lt; HS &lt; 1,2 mm: Grossa | HS &gt; 1,2 mm: Muito Grossa
            </div>
            {ensaio.observacoes && (
              <div className="whitespace-pre-wrap">{ensaio.observacoes}</div>
            )}
          </div>
        </div>

        {/* Assinaturas */}
        <div className="grid grid-cols-3 text-xs">
          <div className="border-r border-gray-300 p-4 text-center">
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <div className="font-semibold">{ensaio.laboratorista_name || 'LABORATORISTA'}</div>
            <div className="text-[10px] text-gray-600">LABORATORISTA RESPONSÁVEL</div>
          </div>
          <div className="border-r border-gray-300 p-4 text-center">
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <div className="font-semibold">{ensaio.approver_details?.name || 'ENGENHEIRO'}</div>
            <div className="text-[10px] text-gray-600">ENGENHEIRO RESPONSÁVEL</div>
            {ensaio.approver_details?.crea_number && (
              <div className="text-[9px] text-gray-500 mt-1">CREA: {ensaio.approver_details.crea_number}</div>
            )}
          </div>
          <div className="p-4 text-center">
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <div className="font-semibold">{ensaio.client_signature?.engineer_name || 'ENGENHEIRO'}</div>
            <div className="text-[10px] text-gray-600">ENGENHEIRO RESPONSÁVEL</div>
            {ensaio.client_signature?.crea_number && (
              <div className="text-[9px] text-gray-500 mt-1">CREA: {ensaio.client_signature.crea_number}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}