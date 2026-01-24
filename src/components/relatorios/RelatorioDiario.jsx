import React from 'react';

export default function RelatorioDiario({ diario, obra, project, user, regional }) {
  const [compressedPhotos, setCompressedPhotos] = React.useState([]);
  const [isCompressing, setIsCompressing] = React.useState(true);

  React.useEffect(() => {
    const compressImages = async () => {
      if (!diario?.fotos || diario.fotos.length === 0) {
        setIsCompressing(false);
        return;
      }

      const compressed = await Promise.all(
        diario.fotos.map(async (photoUrl) => {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = photoUrl;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Reduzir dimensões para 50% do original
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
            
            // Comprimir com qualidade de 50%
            return canvas.toDataURL('image/jpeg', 0.5);
          } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            return photoUrl; // Usar original se falhar
          }
        })
      );

      setCompressedPhotos(compressed);
      setIsCompressing(false);
    };

    compressImages();
  }, [diario?.fotos]);

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

  if (isCompressing) {
    return <div className="p-8 text-center">Otimizando imagens para impressão...</div>;
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

  const photoChunks = compressedPhotos.length > 0 ? chunkArray(compressedPhotos, 6) : [];

  return (
    <div className="bg-white font-sans">
      {/* Primeira Página - Dados do Diário */}
      <div className="p-8 print:p-8 min-h-[29.7cm] relative flex flex-col">
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4">
          <div className="flex justify-start">
            <img 
              src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
              alt="Logo Regional" 
              className="h-16 object-contain" 
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
                <p className="text-gray-800">{diario.cliente || regional?.cliente || 'N/A'}</p>
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
                <p className="text-gray-800">{diario.laboratorista_name || user?.laboratorista_name || user?.full_name || diario.created_by?.split('@')[0] || 'Não Identificado'}</p>
              </div>

              {/* Jornada - se preenchida */}
              {diario.jornada?.horario_inicio && diario.jornada?.horario_fim && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Jornada</p>
                  <p className="text-gray-800">{diario.jornada.horario_inicio} - {diario.jornada.horario_fim}</p>
                </div>
              )}
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

      {/* Página do Checklist de Veículo */}
      {hasChecklistVeiculo && (
        <div className="break-before-page p-8 print:p-8">
          <div className="max-w-[190mm] mx-auto">
            <header className="text-center border-b-2 border-gray-800 pb-3 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">CHECKLIST DE VEÍCULO DE PASSEIO</h1>
              <p className="text-sm text-gray-600 mt-1">AFIRMA - ENGENHARIA E PROJETOS LTDA.</p>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="font-bold">Nome: <span className="font-normal">{diario.checklist_veiculo?.nome_condutor || 'N/A'}</span></p>
              </div>
              <div>
                <p className="font-bold">Data: <span className="font-normal">{formatDate(diario.data)}</span></p>
              </div>
              <div>
                <p className="font-bold">Veículo: <span className="font-normal">{diario.checklist_veiculo?.veiculo || 'N/A'}</span></p>
              </div>
              <div>
                <p className="font-bold">Empresa: <span className="font-normal">{diario.checklist_veiculo?.empresa || 'N/A'}</span></p>
              </div>
              <div className="col-span-2">
                <p className="font-bold">Hodômetro: <span className="font-normal">{diario.checklist_veiculo?.hodometro || 'N/A'}</span></p>
              </div>
            </div>

            {diario.checklist_veiculo?.areas_afetadas && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm">
                <p className="font-bold text-yellow-800">Áreas Afetadas do Veículo:</p>
                <p className="text-gray-700">{diario.checklist_veiculo.areas_afetadas}</p>
              </div>
            )}

            <table className="w-full border-collapse border border-gray-800 mb-4 text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="border border-gray-800 p-2" colSpan="4">Condições Gerais</th>
                </tr>
                <tr className="bg-blue-800">
                  <th className="border border-gray-800 p-2">Item</th>
                  <th className="border border-gray-800 p-2">Bom</th>
                  <th className="border border-gray-800 p-2">Médio</th>
                  <th className="border border-gray-800 p-2">Ruim</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'limpeza_externa', label: 'Limpeza Externa' },
                  { key: 'limpeza_interna', label: 'Limpeza Interna' },
                  { key: 'pneus', label: 'Pneus' },
                  { key: 'estepe', label: 'Estepe' }
                ].map(item => (
                  <tr key={item.key} className="even:bg-gray-50">
                    <td className="border border-gray-800 p-2">{item.label}</td>
                    <td className="border border-gray-800 p-2 text-center">
                      {diario.checklist_veiculo?.condicoes_gerais?.[item.key] === 'bom' && '☑'}
                    </td>
                    <td className="border border-gray-800 p-2 text-center">
                      {diario.checklist_veiculo?.condicoes_gerais?.[item.key] === 'medio' && '☑'}
                    </td>
                    <td className="border border-gray-800 p-2 text-center">
                      {diario.checklist_veiculo?.condicoes_gerais?.[item.key] === 'ruim' && '☑'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4">
              {/* Luzes Traseiras */}
              <table className="w-full border-collapse border border-gray-800 text-xs">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="border border-gray-800 p-1" colSpan="4">Luzes Traseiras</th>
                  </tr>
                  <tr className="bg-blue-800">
                    <th className="border border-gray-800 p-1"></th>
                    <th className="border border-gray-800 p-1">Sim</th>
                    <th className="border border-gray-800 p-1">Não</th>
                    <th className="border border-gray-800 p-1">N/A</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-700 text-white font-semibold">
                    <td className="border border-gray-800 p-1" colSpan="4">Direita</td>
                  </tr>
                  {[
                    { key: 'da_placa', label: 'Da placa' },
                    { key: 'luz', label: 'Luz' },
                    { key: 'luz_re', label: 'Luz de ré' },
                    { key: 'luz_freio', label: 'Luz de freio' },
                    { key: 'seta', label: 'Seta' }
                  ].map(item => (
                    <tr key={item.key} className="even:bg-gray-50">
                      <td className="border border-gray-800 p-1">{item.label}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_traseiras?.direita?.[item.key] === 'sim' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_traseiras?.direita?.[item.key] === 'nao' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_traseiras?.direita?.[item.key] === 'na' && '☑'}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-700 text-white font-semibold">
                    <td className="border border-gray-800 p-1" colSpan="4">Esquerda</td>
                  </tr>
                  {[
                    { key: 'luz', label: 'Luz' },
                    { key: 'luz_re', label: 'Luz de ré' },
                    { key: 'luz_freio', label: 'Luz de freio' },
                    { key: 'seta', label: 'Seta' }
                  ].map(item => (
                    <tr key={item.key} className="even:bg-gray-50">
                      <td className="border border-gray-800 p-1">{item.label}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_traseiras?.esquerda?.[item.key] === 'sim' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_traseiras?.esquerda?.[item.key] === 'nao' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_traseiras?.esquerda?.[item.key] === 'na' && '☑'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Luzes Dianteiras */}
              <table className="w-full border-collapse border border-gray-800 text-xs">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="border border-gray-800 p-1" colSpan="4">Luzes Dianteiras</th>
                  </tr>
                  <tr className="bg-blue-800">
                    <th className="border border-gray-800 p-1"></th>
                    <th className="border border-gray-800 p-1">Sim</th>
                    <th className="border border-gray-800 p-1">Não</th>
                    <th className="border border-gray-800 p-1">N/A</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-700 text-white font-semibold">
                    <td className="border border-gray-800 p-1" colSpan="4">Direita</td>
                  </tr>
                  {[
                    { key: 'farol_alto', label: 'Farol alto' },
                    { key: 'farol_baixo', label: 'Farol baixo' },
                    { key: 'seta', label: 'Seta' },
                    { key: 'neblina', label: 'Neblina' }
                  ].map(item => (
                    <tr key={item.key} className="even:bg-gray-50">
                      <td className="border border-gray-800 p-1">{item.label}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.direita?.[item.key] === 'sim' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.direita?.[item.key] === 'nao' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.direita?.[item.key] === 'na' && '☑'}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-700 text-white font-semibold">
                    <td className="border border-gray-800 p-1" colSpan="4">Esquerda</td>
                  </tr>
                  {[
                    { key: 'farol_alto', label: 'Farol alto' },
                    { key: 'farol_baixo', label: 'Farol baixo' },
                    { key: 'seta', label: 'Seta' },
                    { key: 'neblina', label: 'Neblina' }
                  ].map(item => (
                    <tr key={item.key} className="even:bg-gray-50">
                      <td className="border border-gray-800 p-1">{item.label}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.esquerda?.[item.key] === 'sim' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.esquerda?.[item.key] === 'nao' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.esquerda?.[item.key] === 'na' && '☑'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Segurança */}
              <table className="w-full border-collapse border border-gray-800 text-xs">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="border border-gray-800 p-1" colSpan="4">Segurança</th>
                  </tr>
                  <tr className="bg-blue-800">
                    <th className="border border-gray-800 p-1"></th>
                    <th className="border border-gray-800 p-1">Sim</th>
                    <th className="border border-gray-800 p-1">Não</th>
                    <th className="border border-gray-800 p-1">N/A</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'alarme', label: 'Alarme' },
                    { key: 'buzina', label: 'Buzina' },
                    { key: 'chave_roda', label: 'Chave de Roda' },
                    { key: 'cintos', label: 'Cintos' },
                    { key: 'documentos', label: 'Documentos' },
                    { key: 'extintor', label: 'Extintor' },
                    { key: 'limpadores', label: 'Limpadores' },
                    { key: 'macaco', label: 'Macaco' },
                    { key: 'painel', label: 'Painel' },
                    { key: 'retrovisor_interno', label: 'Retrovisor Interno' },
                    { key: 'retrovisor_direito', label: 'Retrovisor Direito' },
                    { key: 'retrovisor_esquerdo', label: 'Retrovisor Esquerdo' },
                    { key: 'travas', label: 'Travas' },
                    { key: 'triangulo', label: 'Triângulo' }
                  ].map(item => (
                    <tr key={item.key} className="even:bg-gray-50">
                      <td className="border border-gray-800 p-1">{item.label}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.seguranca?.[item.key] === 'sim' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.seguranca?.[item.key] === 'nao' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.seguranca?.[item.key] === 'na' && '☑'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Motor */}
              <table className="w-full border-collapse border border-gray-800 text-xs">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="border border-gray-800 p-1" colSpan="4">Motor</th>
                  </tr>
                  <tr className="bg-blue-800">
                    <th className="border border-gray-800 p-1"></th>
                    <th className="border border-gray-800 p-1">Sim</th>
                    <th className="border border-gray-800 p-1">Não</th>
                    <th className="border border-gray-800 p-1">N/A</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'acelerador', label: 'Acelerador' },
                    { key: 'agua_limpador', label: 'Água do limpador' },
                    { key: 'agua_radiador', label: 'Água do radiador' },
                    { key: 'embreagem', label: 'Embreagem' },
                    { key: 'freio', label: 'Freio' },
                    { key: 'freio_mao', label: 'Freio de mão' },
                    { key: 'oleo_freio', label: 'Óleo do freio' },
                    { key: 'oleo_moto', label: 'Óleo do moto' },
                    { key: 'tanque_partida', label: 'Tanque de partida' }
                  ].map(item => (
                    <tr key={item.key} className="even:bg-gray-50">
                      <td className="border border-gray-800 p-1">{item.label}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.motor?.[item.key] === 'sim' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.motor?.[item.key] === 'nao' && '☑'}</td>
                      <td className="border border-gray-800 p-1 text-center">{diario.checklist_veiculo?.motor?.[item.key] === 'na' && '☑'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {diario.checklist_veiculo?.observacoes && (
              <div className="mt-4">
                <p className="font-bold text-sm mb-1">Observações:</p>
                <div className="border border-gray-800 p-2 min-h-[60px] text-sm bg-gray-50">
                  {diario.checklist_veiculo.observacoes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Páginas de Fotos */}
      {photoChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="break-before-page p-8 print:p-8 min-h-[29.7cm] flex flex-col">
          <header className="grid grid-cols-3 items-center border-b-2 border-gray-800 pb-4">
             <div className="flex justify-start">
                <img 
                  src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                  alt="Logo Regional" 
                  className="h-16 object-contain" 
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