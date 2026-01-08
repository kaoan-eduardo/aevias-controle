import React from 'react';

export default function RelatorioDiario({ diario, obra, project, user }) {
  // Hooks devem ser chamados sempre no início, antes de qualquer condicional
  const [regional, setRegional] = React.useState(null);

  React.useEffect(() => {
    const loadRegional = async () => {
      if (obra?.regional_id) {
        try {
          const { Regional } = await import('@/entities/Regional');
          const regionalData = await Regional.get(obra.regional_id);
          setRegional(regionalData);
        } catch (error) {
          console.error("Erro ao carregar regional:", error);
        }
      }
    };
    loadRegional();
  }, [obra?.regional_id]);

  // Agora sim podemos fazer verificações condicionais
  if (!diario) {
    return (
      <div className="bg-white p-8 font-sans">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-4">Erro</h2>
          <p>Dados do diário não foram fornecidos.</p>
        </div>
      </div>
    );
  }

  console.log("Diário completo:", diario);
  console.log("created_date (string original):", diario.created_date);
  if (diario.approved_date) {
    console.log("approved_date (string original):", diario.approved_date);
  }
  if (diario.client_signature?.signed_date) {
    console.log("signed_date (string original):", diario.client_signature.signed_date);
  }

  const CondicoesClimaticas = {
    ensolarado: "☀️ Ensolarado",
    nublado: "☁️ Nublado", 
    chuvoso: "🌧️ Chuvoso",
    garoa: "🌦️ Garoa",
    vento_forte: "💨 Vento Forte",
    neblina: "🌫️ Neblina"
  };

  const formatDateBrasilia = (dateString) => {
    if (!dateString) return 'N/A';
    
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = dateString + 'Z';
    }
    
    return new Date(normalizedDate).toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium'
    });
  };

  const tipoLocal = diario.tipo_local || "campo";
  const rodovia = tipoLocal === "usina" ? (diario.usina_selecionada || "N/A") : (diario.rodovia || "N/A");
  const trecho = diario.trecho || "N/A";

  const renderTextArea = (label, value) => (
    <div className="col-span-1 md:col-span-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="p-2 border rounded-md bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap min-h-[60px]">
        {value || 'Não informado.'}
      </div>
    </div>
  );

  const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const photoChunks = diario.fotos && diario.fotos.length > 0 ? chunkArray(diario.fotos, 6) : [];

  return (
    <div className="bg-white font-sans">
      {/* Primeira Página - Dados do Diário */}
      <div className="p-8 print:p-8 min-h-[29.7cm] relative flex flex-col">
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4">
          <div className="flex justify-start">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" 
              alt="Logo Afirmaevias" 
              className="h-16" 
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Diário de Obra</h1>
            <p className="text-md text-slate-700">{obra?.name}</p> 
          </div>
          <div className="flex justify-end">
             <div className="border border-gray-400 p-2 rounded-md">
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(diario.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
             </div>
          </div>
        </header>

        <main className="flex-grow">
          {/* Informações Gerais - Layout em 2 colunas */}
          <section className="mt-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Informações Gerais</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {/* Coluna 1 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Cliente</p>
                <p className="text-gray-800">{regional?.cliente || 'N/A'}</p>
              </div>
              
              {/* Coluna 2 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Obra</p>
                <p className="text-gray-800">{obra?.name || 'N/A'}</p>
              </div>

              {/* Coluna 1 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Temperatura</p>
                <p className="text-gray-800">{diario.temperatura ? `${diario.temperatura}°C` : 'N/A'}</p>
              </div>

              {/* Coluna 2 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Condições Climáticas</p>
                <p className="text-gray-800">{CondicoesClimaticas[diario.condicoes_climaticas] || 'N/A'}</p>
              </div>

              {/* Coluna 1 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{tipoLocal === "usina" ? "Usina" : "Rodovia"}</p>
                <p className="text-gray-800">{rodovia}</p>
              </div>

              {/* Coluna 2 - só mostra trecho se for campo */}
              {tipoLocal === "campo" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Trecho</p>
                  <p className="text-gray-800">{trecho}</p>
                </div>
              )}

              {/* Laboratorista - sempre na coluna 1 da próxima linha */}
              <div className={tipoLocal === "usina" ? "col-start-1" : ""}>
                <p className="text-xs font-semibold text-gray-500 uppercase">Laboratorista</p>
                <p className="text-gray-800">{diario.laboratorista_name || diario.created_by?.split('@')[0] || 'Não Identificado'}</p>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Atividades e Observações</h2>
            {renderTextArea("Atividades Realizadas", diario.atividades_realizadas)}
            {diario.observacoes && renderTextArea("Observações", diario.observacoes)}
          </section>
        </main>

        <footer className="mt-12 pt-8">
          <div className="grid grid-cols-3 gap-8 items-end">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                <p>Assinado digitalmente por</p>
                <p className="font-bold text-slate-600 truncate max-w-full">{diario.laboratorista_name}</p>
                <p className="truncate max-w-full">{diario.created_by}</p>
                <p>em {formatDateBrasilia(diario.created_date)}</p>
              </div>
              <div className="border-t border-gray-500 pt-2">
                <p className="text-xs text-gray-600">Laboratorista Responsável</p>
              </div>
            </div>

            <div className="text-center">
               {diario.approver_details ? (
                <>
                  <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                    <p>Aprovado digitalmente por</p>
                    <p className="font-bold text-slate-600 truncate max-w-full">{diario.approver_details.name}</p>
                    <p className="truncate max-w-full">{diario.approved_by}</p>
                    {diario.approver_details.crea_number && <p>CREA: {diario.approver_details.crea_number}</p>}
                    <p>em {formatDateBrasilia(diario.approved_date)}</p>
                  </div>
                  <div className="border-t border-gray-500 pt-2">
                    <p className="text-xs text-gray-600">{diario.approver_details.position}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-24 mb-2"></div>
                  <div className="border-t border-gray-500 pt-2">
                    <p className="text-xs text-gray-600">Aprovação</p>
                  </div>
                </>
              )}
            </div>

            <div className="text-center">
              {diario.client_signature?.signed_by ? (
                 <>
                    <div className="text-xs text-slate-500 mb-2 h-24 flex flex-col justify-end items-center">
                      <p>Assinado digitalmente por</p>
                      <p className="font-bold text-slate-600 truncate max-w-full">{diario.client_signature.engineer_name}</p>
                      <p className="truncate max-w-full">{diario.client_signature.signed_by}</p>
                      {diario.client_signature.crea_number && <p>CREA: {diario.client_signature.crea_number}</p>}
                      <p>em {formatDateBrasilia(diario.client_signature.signed_date)}</p>
                    </div>
                    <div className="border-t border-gray-500 pt-2">
                      <p className="text-xs text-gray-600">Engenheiro Cliente</p>
                    </div>
                 </>
              ) : (
                <>
                  <div className="h-24 mb-2"></div>
                  <div className="border-t border-gray-500 pt-2">
                    <p className="text-xs text-gray-600">Engenheiro Cliente</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </footer>

        <p className="text-center text-xs text-gray-400 mt-8">
          Página 1 de {1 + photoChunks.length}
        </p>
      </div>

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="break-before-page p-8 print:p-8 min-h-[29.7cm] flex flex-col">
          <header className="grid grid-cols-3 items-center border-b-2 border-gray-800 pb-4">
             <div className="flex justify-start">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png" 
                  alt="Logo Afirmaevias" 
                  className="h-16" 
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">Relatório Fotográfico</h1>
                <p className="text-sm text-gray-600">Obra: {obra?.name || 'N/A'}</p>
              </div>
              <div className="flex justify-end">
                 <div className="border border-gray-400 p-2 rounded-md">
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(diario.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                 </div>
              </div>
          </header>

          <main className="flex-grow grid grid-cols-2 gap-4 mt-6" style={{ minHeight: 'calc(29.7cm - 16rem)' }}>
            {chunk.map((fotoUrl, fotoIndex) => (
              <div key={fotoIndex} className="border p-2 rounded-lg break-inside-avoid flex flex-col" style={{ height: 'calc((29.7cm - 16rem) / 3 - 1rem)' }}>
                <div className="bg-gray-100 flex-grow flex items-center justify-center rounded overflow-hidden" style={{ height: 'calc(100% - 2rem)' }}>
                  <img 
                    src={fotoUrl} 
                    alt={`Foto ${pageIndex * 6 + fotoIndex + 1}`} 
                    className="max-h-full max-w-full object-contain" 
                  />
                </div>
                <p className="text-center text-sm mt-2 font-medium" style={{ height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Foto {pageIndex * 6 + fotoIndex + 1}
                </p>
              </div>
            ))}
          </main>

          <footer className="text-center pt-4 text-xs text-gray-500 break-inside-avoid">
            Página {pageIndex + 2} de {1 + photoChunks.length}
          </footer>
        </div>
      ))}
    </div>
  );
}