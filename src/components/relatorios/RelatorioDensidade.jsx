
import React from 'react';
import { Separator } from "@/components/ui/separator";

export default function RelatorioDensidade({ ensaio, obra, project, laboratorista }) {
  
  const calcularResultados = () => {
    const { peso_cp_seco_ar, peso_cp_imerso_agua, peso_cp_sss, densidade_maxima_teorica, fator_correcao_prensa = 1.0 } = ensaio.pesos;
    const densidadeAgua25C = 0.9971;
    
    const densidadeAparente = (peso_cp_seco_ar * fator_correcao_prensa * densidadeAgua25C) / (peso_cp_sss - peso_cp_imerso_agua);
    const volumeVazios = densidade_maxima_teorica > 0 ? ((densidade_maxima_teorica - densidadeAparente) / densidade_maxima_teorica) * 100 : 0;
    const grauCompactacao = densidade_maxima_teorica > 0 ? (densidadeAparente / densidade_maxima_teorica) * 100 : 0;

    let conformidadeVV = null;
    if (project?.volume_vazios?.min != null && project?.volume_vazios?.max != null) {
      conformidadeVV = volumeVazios >= project.volume_vazios.min && volumeVazios <= project.volume_vazios.max;
    }

    return { densidadeAparente, volumeVazios, grauCompactacao, conformidadeVV };
  };

  const resultados = calcularResultados();

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto printable-area">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center pb-4 border-b-2 border-slate-900">
        <div className="w-1/3">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328c_AE-LogoVerPrincipal_1.png" alt="Afirmaevias Logo" className="h-16"/>
        </div>
        <div className="w-2/3 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Relatório de Ensaio</h1>
          <p className="text-md text-slate-700">Densidade de Corpo de Prova Extraído</p>
        </div>
      </header>

      {/* Informações da Obra e Amostra */}
      <section className="mt-6 grid grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <p className="font-semibold">Obra:</p>
          <p>{obra?.name} - {obra?.code}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Projeto:</p>
          <p>{project?.name}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">ID da Amostra:</p>
          <p>{ensaio.sample_id}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Data da Extração:</p>
          <p>{new Date(ensaio.extraction_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Local da Extração:</p>
          <p>{ensaio.location || 'Não informado'}</p>
        </div>
      </section>
      
      <Separator className="my-6" />

      {/* Dados e Resultados */}
      <section className="grid grid-cols-2 gap-x-12">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Dados do Ensaio</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-2 font-medium text-slate-600">Espessura Média (mm)</td><td className="text-right">{ensaio.pesos?.espessura_cp}</td></tr>
              <tr className="border-b"><td className="py-2 font-medium text-slate-600">Fator de Correção da Prensa</td><td className="text-right">{ensaio.pesos?.fator_correcao_prensa}</td></tr>
              <tr className="border-b"><td className="py-2 font-medium text-slate-600">Peso CP Seco ao Ar (g)</td><td className="text-right">{ensaio.pesos?.peso_cp_seco_ar}</td></tr>
              <tr className="border-b"><td className="py-2 font-medium text-slate-600">Peso CP Imerso (g)</td><td className="text-right">{ensaio.pesos?.peso_cp_imerso_agua}</td></tr>
              <tr className="border-b"><td className="py-2 font-medium text-slate-600">Peso CP SSS (g)</td><td className="text-right">{ensaio.pesos?.peso_cp_sss}</td></tr>
              <tr className="border-b"><td className="py-2 font-medium text-slate-600">Densidade Máx. Teórica (g/cm³)</td><td className="text-right">{ensaio.pesos?.densidade_maxima_teorica}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Resultados</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-sm text-blue-800 font-semibold">Densidade Aparente</div>
              <div className="text-3xl font-bold text-blue-900">{resultados.densidadeAparente?.toFixed(3)} <span className="text-lg">g/cm³</span></div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-sm text-green-800 font-semibold">Volume de Vazios</div>
              <div className="text-3xl font-bold text-green-900">{resultados.volumeVazios?.toFixed(2)} <span className="text-lg">%</span></div>
               {resultados.conformidadeVV !== null && (
                  <div className={`text-sm mt-2 font-semibold ${resultados.conformidadeVV ? 'text-green-600' : 'text-red-600'}`}>
                    {resultados.conformidadeVV ? 'Conforme' : 'Não Conforme'}
                  </div>
                )}
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-sm text-purple-800 font-semibold">Grau de Compactação</div>
              <div className="text-3xl font-bold text-purple-900">{resultados.grauCompactacao?.toFixed(1)} <span className="text-lg">%</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Observações */}
      {ensaio.observations && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Observações</h2>
          <p className="text-sm text-slate-700 italic bg-slate-50 p-3 rounded-md">{ensaio.observations}</p>
        </section>
      )}

      {/* Assinatura */}
      <footer className="mt-24 pt-6">
        <div className="grid grid-cols-3 gap-8 items-end">
          {/* Coluna 1: Laboratorista */}
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
              <p>Assinado digitalmente por</p>
              <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.laboratorista_name}</p>
              <p className="truncate max-w-full">{ensaio.created_by}</p>
              <p>em {ensaio.created_date ? new Date(ensaio.created_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A'}</p>
            </div>
            <div className="border-t border-slate-500 pt-2">
              <p className="text-xs text-slate-600">Laboratorista Responsável</p>
            </div>
          </div>

          {/* Coluna 2: Aprovação */}
          <div className="text-center">
            {ensaio.approver_details ? (
              <>
                <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                  <p>Aprovado digitalmente por</p>
                  <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.approver_details.name}</p>
                  <p className="truncate max-w-full">{ensaio.approved_by}</p>
                  {ensaio.approver_details.crea_number && <p>CREA: {ensaio.approver_details.crea_number}</p>}
                  <p>em {ensaio.approved_date ? new Date(ensaio.approved_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A'}</p>
                </div>
                <div className="border-t border-slate-500 pt-2">
                  <p className="text-xs text-slate-600">{ensaio.approver_details.position}</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-24 mb-2"></div>
                <div className="border-t border-slate-500 pt-2">
                  <p className="text-xs text-slate-600">Aprovação</p>
                </div>
              </>
            )}
          </div>

          {/* Coluna 3: Cliente */}
          <div className="text-center">
            {ensaio.client_signature?.signed_by ? (
              <>
                <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                  <p>Assinado digitalmente por</p>
                  <p className="font-bold text-slate-600 truncate max-w-full">{ensaio.client_signature.engineer_name}</p>
                  <p className="truncate max-w-full">{ensaio.client_signature.signed_by}</p>
                  {ensaio.client_signature.crea_number && <p>CREA: {ensaio.client_signature.crea_number}</p>}
                  <p>em {ensaio.client_signature.signed_date ? new Date(ensaio.client_signature.signed_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A'}</p>
                </div>
                <div className="border-t border-slate-500 pt-2">
                  <p className="text-xs text-slate-600">Engenheiro Cliente</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-24 mb-2"></div>
                <div className="border-t border-slate-500 pt-2">
                  <p className="text-xs text-slate-600">Engenheiro Cliente</p>
                </div>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-8">
          Relatório gerado em {new Date().toLocaleDateString('pt-BR')} via QualityPav.
        </p>
      </footer>
    </div>
  );
}
