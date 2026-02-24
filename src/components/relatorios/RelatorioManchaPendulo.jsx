import React from 'react';

const SectionTitle = ({ children }) => (
  <div className="bg-slate-100 px-4 py-2 font-bold text-sm text-slate-700 border-b-2 border-slate-300 uppercase text-center">
    {children}
  </div>
);

const ReportPrintHeader = ({ regional, reportTitle, date }) => (
  <>
    <div className="flex justify-between items-start mb-6 print:mb-4">
      <div className="flex-1 text-center">
        {regional?.logo_url && (
          <img
            src={regional.logo_url}
            alt="Logo Regional"
            className="h-16 mx-auto mb-2 print:h-12"
          />
        )}
      </div>
    </div>
    <div className="text-center mb-6 print:mb-4">
      <h1 className="text-xl font-bold text-slate-800 mb-1 print:text-lg">{reportTitle}</h1>
      <p className="text-sm text-slate-600 print:text-xs">Data: {date}</p>
    </div>
  </>
);

export default function RelatorioManchaPendulo({ ensaio, obra, regional }) {
  if (!ensaio) {
    return <div className="p-8 text-center">Carregando dados do ensaio...</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto print:p-4 print:max-w-full">
      <ReportPrintHeader
        regional={regional}
        reportTitle="CONTROLE TECNOLÓGICO DE PAVIMENTOS - MACROTEXTURA E MICROTEXTURA"
        date={formatDate(ensaio.data_ensaio)}
      />

      {/* Dados do Cliente */}
      <div className="mb-6 border border-slate-300">
        <SectionTitle>DADOS DO CLIENTE</SectionTitle>
        <div className="p-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">Obra/Contrato:</span>
            <p>{obra?.name || 'N/A'} - {obra?.code || 'N/A'}</p>
          </div>
          <div>
            <span className="font-semibold">Cliente:</span>
            <p>{regional?.cliente || 'N/A'}</p>
          </div>
          <div>
            <span className="font-semibold">Data do Ensaio:</span>
            <p>{formatDate(ensaio.data_ensaio)}</p>
          </div>
          <div>
            <span className="font-semibold">Rodovia:</span>
            <p>{ensaio.rodovia || 'N/A'}</p>
          </div>
          <div>
            <span className="font-semibold">Trecho:</span>
            <p>{ensaio.trecho || 'N/A'}</p>
          </div>
          <div>
            <span className="font-semibold">Camada:</span>
            <p>{ensaio.camada || 'N/A'}</p>
          </div>
          <div>
            <span className="font-semibold">Pista:</span>
            <p>{ensaio.pista || 'N/A'}</p>
          </div>
          <div>
            <span className="font-semibold">Órgão:</span>
            <p>{ensaio.orgao || 'N/A'}</p>
          </div>
          <div>
            <span className="font-semibold">Laboratorista:</span>
            <p>{ensaio.laboratorista_name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Ensaio Mancha de Areia */}
      {ensaio.ensaios_mancha && ensaio.ensaios_mancha.length > 0 && (
        <div className="mb-6 border border-slate-300">
          <SectionTitle>MANCHA DE AREIA - MÉTODO ABNT NBR 16504:2016</SectionTitle>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-2">#</th>
                    <th className="border border-slate-300 p-2">Data Aplicação</th>
                    <th className="border border-slate-300 p-2">Estaca</th>
                    <th className="border border-slate-300 p-2">Faixa/Pista</th>
                    <th className="border border-slate-300 p-2">Bordo</th>
                    <th className="border border-slate-300 p-2">D1 (Ø) mm</th>
                    <th className="border border-slate-300 p-2">D2 (Ø) mm</th>
                    <th className="border border-slate-300 p-2">D3 (Ø) mm</th>
                    <th className="border border-slate-300 p-2">D4 (Ø) mm</th>
                    <th className="border border-slate-300 p-2">D(Ø) Média mm</th>
                    <th className="border border-slate-300 p-2">Área cm²</th>
                    <th className="border border-slate-300 p-2">HS cm</th>
                    <th className="border border-slate-300 p-2">HS mm</th>
                    <th className="border border-slate-300 p-2">Tipo Superfície</th>
                  </tr>
                </thead>
                <tbody>
                  {ensaio.ensaios_mancha.map((e, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-2 text-center">{e.numero || idx + 1}</td>
                      <td className="border border-slate-300 p-2">{formatDate(e.data_aplicacao)}</td>
                      <td className="border border-slate-300 p-2">{e.estaca || ''}</td>
                      <td className="border border-slate-300 p-2">{e.faixa_pista || ''}</td>
                      <td className="border border-slate-300 p-2">{e.bordo || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.d1?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.d2?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.d3?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.d4?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.d_media?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.area?.toFixed(2) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.hs_cm?.toFixed(2) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.hs_mm?.toFixed(2) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50">{e.tipo_superficie || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ensaio Pêndulo Britânico */}
      {ensaio.ensaios_pendulo && ensaio.ensaios_pendulo.length > 0 && (
        <div className="mb-6 border border-slate-300">
          <SectionTitle>PÊNDULO BRITÂNICO - MÉTODO ABNT NBR 16780:2019</SectionTitle>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-2">#</th>
                    <th className="border border-slate-300 p-2">Data Aplicação</th>
                    <th className="border border-slate-300 p-2">Estaca</th>
                    <th className="border border-slate-300 p-2">Faixa/Pista</th>
                    <th className="border border-slate-300 p-2">Bordo</th>
                    <th className="border border-slate-300 p-2">Temp. Pavimento (°C)</th>
                    <th className="border border-slate-300 p-2">1º</th>
                    <th className="border border-slate-300 p-2">2º</th>
                    <th className="border border-slate-300 p-2">3º</th>
                    <th className="border border-slate-300 p-2">4º</th>
                    <th className="border border-slate-300 p-2">5º</th>
                    <th className="border border-slate-300 p-2">Máxima</th>
                    <th className="border border-slate-300 p-2">Mínima</th>
                    <th className="border border-slate-300 p-2">VRD</th>
                    <th className="border border-slate-300 p-2">Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {ensaio.ensaios_pendulo.map((e, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-2 text-center">{e.numero || idx + 1}</td>
                      <td className="border border-slate-300 p-2">{formatDate(e.data_aplicacao)}</td>
                      <td className="border border-slate-300 p-2">{e.estaca || ''}</td>
                      <td className="border border-slate-300 p-2">{e.faixa_pista || ''}</td>
                      <td className="border border-slate-300 p-2">{e.bordo || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.temp_pavimento || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.leitura_1 || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.leitura_2 || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.leitura_3 || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.leitura_4 || ''}</td>
                      <td className="border border-slate-300 p-2 text-center">{e.leitura_5 || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.maxima?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.minima?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.vrd?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-2 text-center bg-slate-50 font-semibold">{e.classe || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Resultados e Conformidade */}
      <div className="mb-6 border border-slate-300">
        <SectionTitle>RESULTADOS E CONFORMIDADE</SectionTitle>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-sm">Limites Estabelecidos - Mancha de Areia:</span>
              <p className="text-sm">{ensaio.limites_mancha || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold text-sm">Limites Estabelecidos - Pêndulo Britânico:</span>
              <p className="text-sm">{ensaio.limites_pendulo || 'N/A'}</p>
            </div>
          </div>

          <div>
            <span className="font-semibold text-sm">Condição de Conformidade:</span>
            <p className={`text-lg font-bold ${ensaio.condicao_conformidade === 'CONFORME' ? 'text-green-600' : 'text-red-600'}`}>
              {ensaio.condicao_conformidade || 'NÃO INFORMADO'}
            </p>
          </div>

          {ensaio.observacoes && (
            <div>
              <span className="font-semibold text-sm">Observações:</span>
              <p className="text-sm whitespace-pre-wrap">{ensaio.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Assinaturas */}
      <div className="mt-8 grid grid-cols-3 gap-8 print:mt-6">
        <div className="text-center">
          <div className="border-t-2 border-slate-800 pt-2">
            <p className="font-semibold text-sm">{ensaio.laboratorista_name || 'Laboratorista'}</p>
            <p className="text-xs text-slate-600">Laboratorista</p>
          </div>
        </div>

        {ensaio.approver_details && (
          <div className="text-center">
            <div className="border-t-2 border-slate-800 pt-2">
              <p className="font-semibold text-sm">{ensaio.approver_details.name}</p>
              <p className="text-xs text-slate-600">{ensaio.approver_details.position || 'Engenheiro Responsável'}</p>
              {ensaio.approver_details.crea_number && (
                <p className="text-xs text-slate-600">CREA: {ensaio.approver_details.crea_number}</p>
              )}
            </div>
          </div>
        )}

        {ensaio.client_signature?.signed_by && (
          <div className="text-center">
            <div className="border-t-2 border-slate-800 pt-2">
              <p className="font-semibold text-sm">{ensaio.client_signature.engineer_name}</p>
              <p className="text-xs text-slate-600">Cliente/Fiscalização</p>
              {ensaio.client_signature.crea_number && (
                <p className="text-xs text-slate-600">CREA: {ensaio.client_signature.crea_number}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Assinado em: {new Date(ensaio.client_signature.signed_date).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status de Aprovação */}
      {ensaio.approved !== null && (
        <div className="mt-6 p-4 bg-slate-50 border border-slate-300 rounded">
          <p className="text-sm">
            <span className="font-semibold">Status:</span>{' '}
            <span className={ensaio.approved ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {ensaio.approved ? 'APROVADO' : 'REPROVADO'}
            </span>
          </p>
          {ensaio.approved_by && (
            <p className="text-sm mt-1">
              <span className="font-semibold">Por:</span> {ensaio.approved_by}
            </p>
          )}
          {ensaio.approved_date && (
            <p className="text-sm">
              <span className="font-semibold">Em:</span> {new Date(ensaio.approved_date).toLocaleString('pt-BR')}
            </p>
          )}
          {ensaio.rejection_reason && (
            <p className="text-sm mt-2">
              <span className="font-semibold">Motivo da Reprovação:</span> {ensaio.rejection_reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}