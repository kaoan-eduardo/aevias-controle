import React from "react";

export default function RelatorioCAUQ({ ensaio, obra, regional, project, user }) {
  const dataEnsaio = ensaio.data_ensaio
    ? new Date(ensaio.data_ensaio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : '-';

  return (
    <div className="border-2 border-slate-300 rounded-lg p-8 bg-white">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-slate-800">Ensaio de CAUQ</h2>
          <span className="text-sm text-slate-500">— {dataEnsaio}</span>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">Laboratorista:</span> {ensaio.laboratorista_name || ensaio.created_by || 'N/A'}
          </p>
          {ensaio.local_coleta && (
            <p>
              <span className="font-medium text-slate-700">Local de Coleta:</span> {ensaio.local_coleta}
            </p>
          )}
          {ensaio.usina_fornecedora && (
            <p>
              <span className="font-medium text-slate-700">Usina Fornecedora:</span> {ensaio.usina_fornecedora}
            </p>
          )}
          {ensaio.rodovia && (
            <p>
              <span className="font-medium text-slate-700">Rodovia:</span> {ensaio.rodovia}
            </p>
          )}
          {ensaio.trecho && (
            <p>
              <span className="font-medium text-slate-700">Trecho:</span> {ensaio.trecho}
            </p>
          )}
        </div>
      </div>

      {ensaio.extracao_ligante && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3">Extração de Ligante</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {ensaio.extracao_ligante.peso_amostra && (
              <div>
                <p className="text-slate-500">Peso Amostra</p>
                <p className="font-semibold text-slate-800">{ensaio.extracao_ligante.peso_amostra}g</p>
              </div>
            )}
            {ensaio.extracao_ligante.umidade && (
              <div>
                <p className="text-slate-500">Umidade</p>
                <p className="font-semibold text-slate-800">{ensaio.extracao_ligante.umidade}%</p>
              </div>
            )}
            {ensaio.extracao_ligante.teor_ligante && (
              <div>
                <p className="text-slate-500">Teor de Ligante</p>
                <p className="font-semibold text-slate-800">{ensaio.extracao_ligante.teor_ligante}%</p>
              </div>
            )}
            {ensaio.extracao_ligante.teor_ligante_real && (
              <div>
                <p className="text-slate-500">Teor Ligante Real</p>
                <p className="font-semibold text-slate-800">{ensaio.extracao_ligante.teor_ligante_real}%</p>
              </div>
            )}
            {ensaio.extracao_ligante.filler_betume && (
              <div>
                <p className="text-slate-500">Filler/Betume</p>
                <p className="font-semibold text-slate-800">{ensaio.extracao_ligante.filler_betume}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {ensaio.densidade_rice && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3">Densidade Rice (DMT)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {ensaio.densidade_rice.amostra && (
              <div>
                <p className="text-slate-500">Amostra</p>
                <p className="font-semibold text-slate-800">{ensaio.densidade_rice.amostra}g</p>
              </div>
            )}
            {ensaio.densidade_rice.temperatura_agua && (
              <div>
                <p className="text-slate-500">Temperatura</p>
                <p className="font-semibold text-slate-800">{ensaio.densidade_rice.temperatura_agua}°C</p>
              </div>
            )}
            {ensaio.densidade_rice.densidade_rice && (
              <div>
                <p className="text-slate-500">Densidade Rice</p>
                <p className="font-semibold text-slate-800">{ensaio.densidade_rice.densidade_rice} g/cm³</p>
              </div>
            )}
          </div>
        </div>
      )}

      {ensaio.corpos_prova_marshall && ensaio.corpos_prova_marshall.length > 0 && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3">Corpos de Prova Marshall ({ensaio.corpos_prova_marshall.length})</h3>
          <div className="space-y-3">
            {ensaio.corpos_prova_marshall.map((cp, idx) => (
              <div key={idx} className="p-3 bg-white rounded border border-slate-200">
                <p className="font-medium text-slate-700 mb-2">CP {cp.numero}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {cp.densidade_aparente && (
                    <div>
                      <p className="text-slate-500">Densidade</p>
                      <p className="font-semibold text-slate-700">{cp.densidade_aparente} g/cm³</p>
                    </div>
                  )}
                  {cp.volume_vazios && (
                    <div>
                      <p className="text-slate-500">Volume Vazios</p>
                      <p className="font-semibold text-slate-700">{cp.volume_vazios}%</p>
                    </div>
                  )}
                  {cp.vam && (
                    <div>
                      <p className="text-slate-500">VAM</p>
                      <p className="font-semibold text-slate-700">{cp.vam}%</p>
                    </div>
                  )}
                  {cp.rbv && (
                    <div>
                      <p className="text-slate-500">RBV</p>
                      <p className="font-semibold text-slate-700">{cp.rbv}%</p>
                    </div>
                  )}
                  {cp.rtcd_valor && (
                    <div>
                      <p className="text-slate-500">RTCD</p>
                      <p className="font-semibold text-slate-700">{cp.rtcd_valor} MPa</p>
                    </div>
                  )}
                  {cp.estabilidade_corrigida && (
                    <div>
                      <p className="text-slate-500">Estabilidade</p>
                      <p className="font-semibold text-slate-700">{cp.estabilidade_corrigida} Kgf</p>
                    </div>
                  )}
                  {cp.fluencia && (
                    <div>
                      <p className="text-slate-500">Fluência</p>
                      <p className="font-semibold text-slate-700">{cp.fluencia} mm</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ensaio.observacoes && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-1">Observações</p>
          <p className="text-sm text-blue-800">{ensaio.observacoes}</p>
        </div>
      )}
    </div>
  );
}