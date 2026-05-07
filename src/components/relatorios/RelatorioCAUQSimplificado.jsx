import React from "react";

export default function RelatorioCAUQSimplificado({ ensaio, obra, regional, project, user }) {
  const dataFormatted = ensaio.data_ensaio
    ? new Date(ensaio.data_ensaio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : '-';

  const obterResumoServico = () => {
    if (!ensaio.extracao_ligante) return '-';
    const teor = ensaio.extracao_ligante.teor_ligante || '-';
    const umidade = ensaio.extracao_ligante.umidade || '-';
    return `Teor Ligante: ${teor}% | Umidade: ${umidade}%`;
  };

  const obterResumoDensidade = () => {
    if (!ensaio.corpos_prova_marshall || ensaio.corpos_prova_marshall.length === 0) return '-';
    const cps = ensaio.corpos_prova_marshall;
    const densidades = cps.map(cp => cp.densidade_aparente).filter(Boolean);
    if (densidades.length === 0) return '-';
    const media = (densidades.reduce((a, b) => a + parseFloat(b), 0) / densidades.length).toFixed(3);
    return `Densidade Média: ${media} g/cm³ (${cps.length} CPs)`;
  };

  return (
    <div className="border-2 border-slate-300 rounded-lg p-6 bg-white">
      {/* Cabeçalho */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-baseline gap-3 mb-2">
          <h3 className="text-lg font-bold text-slate-800">Ensaio de CAUQ</h3>
          <span className="text-sm text-slate-500">— {dataFormatted}</span>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="space-y-3 text-sm">
        {/* Laboratorista */}
        <div>
          <p className="text-slate-700">
            <strong>Laboratorista:</strong> {ensaio.laboratorista_name || ensaio.created_by || 'N/A'}
          </p>
        </div>

        {/* Local de Coleta */}
        {ensaio.local_coleta && (
          <div>
            <p className="text-slate-700">
              <strong>Local:</strong> {ensaio.local_coleta}
            </p>
          </div>
        )}

        {/* Placa do Caminhão */}
        {ensaio.placa_caminhao && (
          <div>
            <p className="text-slate-700">
              <strong>Placa:</strong> {ensaio.placa_caminhao}
            </p>
          </div>
        )}

        {/* Rodovia */}
        {ensaio.rodovia && (
          <div>
            <p className="text-slate-700">
              <strong>Rodovia:</strong> {ensaio.rodovia}
            </p>
          </div>
        )}

        {/* Usina */}
        {ensaio.usina_fornecedora && (
          <div>
            <p className="text-slate-700">
              <strong>Usina:</strong> {ensaio.usina_fornecedora}
            </p>
          </div>
        )}

        {/* Resumo da Extração */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-slate-700">
            <strong>Extração de Ligante:</strong> {obterResumoServico()}
          </p>
        </div>

        {/* Resumo da Densidade Marshall */}
        <div>
          <p className="text-slate-700">
            <strong>Corpos de Prova:</strong> {obterResumoDensidade()}
          </p>
        </div>

        {/* Observações */}
        {ensaio.observacoes && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-slate-600 italic">{ensaio.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}