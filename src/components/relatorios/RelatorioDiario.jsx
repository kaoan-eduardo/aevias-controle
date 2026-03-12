import React from 'react';

export default function RelatorioDiario({ diario, obra, project, user, regional, creatorUser }) {
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
            
            return canvas.toDataURL('image/jpeg', 0.5);
          } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            return photoUrl;
          }
        })
      );

      setCompressedPhotos(compressed);
      setIsCompressing(false);
    };

    compressImages();
  }, [diario?.fotos]);

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
  const isObraClienteType = obra?.tipo_obra === 'levantamentos' || obra?.tipo_obra === 'sondagem';
  const clienteDisplay = isObraClienteType ? (diario.empreiteira || 'N/A') : (diario.cliente || regional?.cliente || 'N/A');

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
  const hasChecklistVeiculo = diario?.checklist_veiculo_ativo === true;
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const tipoVeiculo = diario.checklist_veiculo?.tipo_veiculo || 'passeio';
  const tituloVeiculo = tipoVeiculo === 'picape' ? 'Picape' : 'Veículo de Passeio';

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
          <section className="mt-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Informações Gerais</h2>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
              {/* Coluna 1 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Cliente</p>
                 <p className="text-gray-800">{clienteDisplay}</p>
              </div>

              {/* Coluna 2 */}
              {tipoLocal === "campo" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Trecho</p>
                  <p className="text-gray-800">{trecho}</p>
                </div>
              )}
              {tipoLocal === "usina" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Condições Climáticas</p>
                  <p className="text-gray-800">{CondicoesClimaticas[diario.condicoes_climaticas] || 'N/A'}</p>
                </div>
              )}

              {/* Coluna 3 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Empreiteira</p>
                <p className="text-gray-800">{diario.empreiteira || 'N/A'}</p>
              </div>

              {/* Coluna 1 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Obra</p>
                <p className="text-gray-800">{obra?.name || 'N/A'}</p>
              </div>

              {/* Coluna 2 */}
              {tipoLocal === "campo" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Condições Climáticas</p>
                  <p className="text-gray-800">{CondicoesClimaticas[diario.condicoes_climaticas] || 'N/A'}</p>
                </div>
              )}
              {tipoLocal === "usina" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Temperatura</p>
                  <p className="text-gray-800">{diario.temperatura ? `${diario.temperatura}°C` : 'N/A'}</p>
                </div>
              )}

              {/* Coluna 3 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Laboratorista</p>
                <p className="text-gray-800">{diario.laboratorista_name || user?.laboratorista_name || user?.full_name || diario.created_by?.split('@')[0] || 'Não Identificado'}</p>
              </div>

              {/* Coluna 1 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{tipoLocal === "usina" ? "Usina" : "Rodovia"}</p>
                <p className="text-gray-800">{tipoLocal === "usina" ? (diario.usina_selecionada || 'N/A') : (diario.rodovia || 'N/A')}</p>
              </div>

              {/* Coluna 2 */}
              {tipoLocal === "campo" && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Temperatura</p>
                  <p className="text-gray-800">{diario.temperatura ? `${diario.temperatura}°C` : 'N/A'}</p>
                </div>
              )}
              {tipoLocal === "usina" && diario.jornada?.horario_inicio && diario.jornada?.horario_fim && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Jornada</p>
                  <p className="text-gray-800">{diario.jornada.horario_inicio} - {diario.jornada.horario_fim}</p>
                </div>
              )}

              {/* Coluna 3 */}
              {tipoLocal === "campo" && diario.jornada?.horario_inicio && diario.jornada?.horario_fim && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Jornada</p>
                  <p className="text-gray-800">{diario.jornada.horario_inicio} - {diario.jornada.horario_fim}</p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Atividades e Observações</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderTextArea("Atividades Realizadas", diario.atividades_realizadas)}
              {diario.observacoes && renderTextArea("Observações", diario.observacoes)}
              {diario.acoes_corretivas_realizado === true && diario.acoes_corretivas_descricao && renderTextArea("Ações Corretivas", diario.acoes_corretivas_descricao)}
            </div>
          </section>

          {/* Não Conformidades */}
          {diario.nao_conformidades && diario.nao_conformidades.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Não Conformidades</h2>
              <div className="space-y-3">
                {diario.nao_conformidades.map((nc, index) => (
                  <div key={index} className="p-2 border rounded-md bg-gray-50">
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Local</p>
                        <p className="text-sm text-gray-800">{nc.local_nc || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Categoria</p>
                        <p className="text-sm text-gray-800">{nc.categoria_nc || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Parâmetro</p>
                        <p className="text-sm text-gray-800">{nc.parametro_nc || 'N/A'}</p>
                      </div>
                    </div>
                    {nc.descricao && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{nc.descricao}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
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
                <p className="text-xs text-gray-600">{creatorUser?.position || 'Laboratorista Responsável'}</p>
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
      </div>

      {/* Página do Efetivo de Obra */}
      {diario.efetivo_obra_ativo && (
        <div className="break-before-page p-8 print:p-8 min-h-[29.7cm] flex flex-col">
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-16 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">Efetivo de Obra</h1>
              <p className="text-md text-slate-700">{obra?.name || 'N/A'}</p>
            </div>
            <div className="flex justify-end">
              <div className="border border-gray-400 p-2 rounded-md bg-white">
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(diario.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
              </div>
            </div>
          </header>

          {/* Informações Gerais */}
          <div className="mb-3">
            <h2 className="text-xs font-bold text-gray-800 mb-2">INFORMAÇÕES GERAIS</h2>
            <div className="grid grid-cols-3 gap-4 text-xs">
              {/* Coluna 1 */}
              <div className="space-y-2">
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Cliente</p>
                  <p className="text-gray-800 font-medium">{clienteDisplay}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Obra</p>
                  <p className="text-gray-800 font-medium">{obra?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-2">
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Trecho</p>
                  <p className="text-gray-800 font-medium">{diario.trecho || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Rodovia</p>
                  <p className="text-gray-800 font-medium">{diario.rodovia || 'N/A'}</p>
                </div>
              </div>

              {/* Coluna 3 */}
              <div className="space-y-2">
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Empreiteira</p>
                  <p className="text-gray-800 font-medium">{diario.empreiteira || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase">Laboratorista</p>
                  <p className="text-gray-800 font-medium">{diario.laboratorista_name || user?.full_name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Máquinas */}
          <table className="w-full border-collapse mb-6 text-sm" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }} border="1">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-center font-bold" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }} colSpan="4">EFETIVO DE MÁQUINAS OPERANTES</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Motoniveladora', 'motoniveladora', 'Caminhão Espargidor', 'caminhao_espargidor'],
                ['Pá Carregadeira', 'pa_carregadeira', 'Recicladora', 'recicladora'],
                ['Retroescavadeira', 'retroescavadeira', 'Vibro Acabadora', 'vibro_acabadora'],
                ['Escavadeira Hidráulica', 'escavadeira_hidraulica', 'Rolo Carneiro', 'rolo_carneiro'],
                ['Mini Carregadeira', 'mini_carregadeira', 'Rolo Liso', 'rolo_liso'],
                ['Extrusora', 'extrusora', 'Rolo Pneu', 'rolo_pneu'],
                ['Caminhão Prancha', 'caminhao_prancha', 'Tanque Combustível', 'tanque_combustivel'],
                ['Caminhão Munck', 'caminhao_munck', 'Comboio', 'comboio'],
                ['Caminhão Sinalização', 'caminhao_sinalizacao', 'Ônibus', 'onibus'],
                ['Caminhão Pipa', 'caminhao_pipa', 'Trator de Grade', 'trator_grade'],
                ['Caminhão Basculante', 'caminhao_basculante', 'Trator de Esteira', 'trator_esteira'],
                ['Caminhão Cimento', 'caminhao_cimento', 'Veículo Leve', 'veiculo_leve'],
                ['Caminhão Viga', 'caminhao_viga', 'Placa Vibratória', 'placa_vibratoria']
              ].map((row, idx) => (
                <tr key={idx} className="even:bg-gray-50/50">
                  {[0, 2].map(i => (
                    <React.Fragment key={i}>
                      <td className="border p-1.5 px-3 font-semibold w-[35%]" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }}>{row[i]}</td>
                      <td className="border p-1.5 px-3 text-center w-[15%]" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }}>{row[i+1] ? (diario.efetivo_maquinas?.[row[i+1]] || '') : ''}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tabela de Colaboradores */}
          <table className="w-full border-collapse text-sm" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }} border="1">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-center font-bold" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }} colSpan="4">EFETIVO DE COLABORADORES</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Encarregado', 'encarregado', 'Topógrafo', 'topografo'],
                ['Greidista', 'greidista', 'Aux. Topografia', 'aux_topografia'],
                ['Operadores', 'operadores', 'Laboratorista', 'laboratorista'],
                ['Motorista', 'motorista', 'Aux. Laboratório', 'aux_laboratorio'],
                ['Pedreiro', 'pedreiro', 'Spoter', 'spoter'],
                ['Armador', 'armador', 'Segurança', 'seguranca'],
                ['Carpinteiro', 'carpinteiro', 'Apontador', 'apontador'],
                ['Ajudante', 'ajudante', 'Pintor', 'pintor'],
                ['Eletricista', 'eletricista', '', '']
              ].map((row, idx) => (
                <tr key={idx} className="even:bg-gray-50/50">
                  {[0, 2].map(i => (
                    <React.Fragment key={i}>
                      <td className="border p-1.5 px-3 font-semibold w-[35%]" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }}>{row[i]}</td>
                      <td className="border p-1.5 px-3 text-center w-[15%]" style={{ borderColor: 'hsl(212.73deg 26.83% 83.92%)' }}>{row[i+1] ? (diario.efetivo_colaboradores?.[row[i+1]] || '') : ''}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Página do Checklist de Veículo */}
      {hasChecklistVeiculo && (
        <div className="break-before-page p-3 print:p-3">
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1.5 mb-2">
            <div className="flex justify-start">
              <img 
                src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} 
                alt="Logo Regional" 
                className="h-12 object-contain" 
              />
            </div>
            <div className="text-center">
              <h1 className="text-base font-bold text-gray-800">Checklist de {tituloVeiculo}</h1>
              <p className="text-xs text-gray-600">Obra: {obra?.name || 'N/A'}</p>
            </div>
            <div className="flex justify-end">
              <div className="border border-gray-400 p-1.5 rounded-md text-xs bg-white">
                <p className="font-semibold text-gray-800">{formatDate(diario.data)}</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-x-3.5 gap-y-1 mb-3 text-sm">
            <div>
              <span className="font-bold">Nome: </span>
              <span className="font-normal">{diario.checklist_veiculo?.nome_condutor || 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold">Empresa: </span>
              <span className="font-normal">{diario.checklist_veiculo?.empresa || 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold">Veículo: </span>
              <span className="font-normal">{diario.checklist_veiculo?.veiculo || 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold">Placa: </span>
              <span className="font-normal">{diario.checklist_veiculo?.placa || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold">Hodômetro: </span>
              <span className="font-normal">{diario.checklist_veiculo?.hodometro || 'N/A'}</span>
            </div>
          </div>

          {diario.checklist_veiculo?.areas_afetadas && (
            <div className="mb-2 p-1 bg-yellow-50 border border-yellow-300 rounded text-sm">
              <p className="font-bold text-yellow-800">Áreas Afetadas:</p>
              <p className="text-gray-700">{diario.checklist_veiculo.areas_afetadas}</p>
            </div>
          )}

          <table className="w-full border-collapse border border-slate-300 mb-2 text-xs">
            <thead className="bg-[#f9fafb] text-gray-800">
              <tr>
                <th className="border border-slate-300 p-0.5" colSpan="4">Condições Gerais</th>
              </tr>
              <tr className="bg-[#f9fafb]">
                <th className="border border-slate-300 p-0.5">Item</th>
                <th className="border border-slate-300 p-0.5">Bom</th>
                <th className="border border-slate-300 p-0.5">Médio</th>
                <th className="border border-slate-300 p-0.5">Ruim</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'limpeza_externa', label: 'Limpeza Externa' },
                { key: 'limpeza_interna', label: 'Limpeza Interna' },
                { key: 'pneus', label: 'Pneus' },
                { key: 'estepe', label: 'Estepe' },
                ...(tipoVeiculo === 'picape' ? [{ key: 'cacamba', label: 'Caçamba' }] : [])
              ].map(item => (
                <tr key={item.key} className="even:bg-gray-50">
                  <td className="border border-slate-300 p-0.5">{item.label}</td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {diario.checklist_veiculo?.condicoes_gerais?.[item.key] === 'bom' && '☑'}
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {diario.checklist_veiculo?.condicoes_gerais?.[item.key] === 'medio' && '☑'}
                  </td>
                  <td className="border border-slate-300 p-0.5 text-center">
                    {diario.checklist_veiculo?.condicoes_gerais?.[item.key] === 'ruim' && '☑'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Luzes Traseiras */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-[#f9fafb] text-gray-800">
                <tr>
                  <th className="border border-slate-300 p-0.5" colSpan="4">Luzes Traseiras</th>
                </tr>
                <tr className="bg-[#f9fafb]">
                  <th className="border border-slate-300 p-0.5"></th>
                  <th className="border border-slate-300 p-0.5">Sim</th>
                  <th className="border border-slate-300 p-0.5">Não</th>
                  <th className="border border-slate-300 p-0.5">N/A</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#f9fafb] text-gray-800 font-semibold">
                  <td className="border border-slate-300 p-0.5" colSpan="4">Direita</td>
                </tr>
                {[
                  { key: 'da_placa', label: 'Da placa' },
                  { key: 'luz', label: 'Luz' },
                  { key: 'luz_re', label: 'Luz de ré' },
                  { key: 'luz_freio', label: 'Luz de freio' },
                  { key: 'seta', label: 'Seta' }
                ].map(item => (
                  <tr key={item.key} className="even:bg-gray-50">
                    <td className="border border-slate-300 p-0.5">{item.label}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_traseiras?.direita?.[item.key] === 'sim' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_traseiras?.direita?.[item.key] === 'nao' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_traseiras?.direita?.[item.key] === 'na' && '☑'}</td>
                  </tr>
                ))}
                <tr className="bg-[#f9fafb] text-gray-800 font-semibold">
                  <td className="border border-slate-300 p-0.5" colSpan="4">Esquerda</td>
                </tr>
                {[
                  { key: 'luz', label: 'Luz' },
                  { key: 'luz_re', label: 'Luz de ré' },
                  { key: 'luz_freio', label: 'Luz de freio' },
                  { key: 'seta', label: 'Seta' }
                ].map(item => (
                  <tr key={item.key} className="even:bg-gray-50">
                    <td className="border border-slate-300 p-0.5">{item.label}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_traseiras?.esquerda?.[item.key] === 'sim' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_traseiras?.esquerda?.[item.key] === 'nao' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_traseiras?.esquerda?.[item.key] === 'na' && '☑'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Luzes Dianteiras */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-[#f9fafb] text-gray-800">
                <tr>
                  <th className="border border-slate-300 p-0.5" colSpan="4">Luzes Dianteiras</th>
                </tr>
                <tr className="bg-[#f9fafb]">
                  <th className="border border-slate-300 p-0.5"></th>
                  <th className="border border-slate-300 p-0.5">Sim</th>
                  <th className="border border-slate-300 p-0.5">Não</th>
                  <th className="border border-slate-300 p-0.5">N/A</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#f9fafb] text-gray-800 font-semibold">
                  <td className="border border-slate-300 p-0.5" colSpan="4">Direita</td>
                </tr>
                {[
                  { key: 'farol_alto', label: 'Farol alto' },
                  { key: 'farol_baixo', label: 'Farol baixo' },
                  { key: 'seta', label: 'Seta' },
                  { key: 'neblina', label: 'Neblina' }
                ].map(item => (
                  <tr key={item.key} className="even:bg-gray-50">
                    <td className="border border-slate-300 p-0.5">{item.label}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.direita?.[item.key] === 'sim' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.direita?.[item.key] === 'nao' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.direita?.[item.key] === 'na' && '☑'}</td>
                  </tr>
                ))}
                <tr className="bg-[#f9fafb] text-gray-800 font-semibold">
                  <td className="border border-slate-300 p-0.5" colSpan="4">Esquerda</td>
                </tr>
                {[
                  { key: 'farol_alto', label: 'Farol alto' },
                  { key: 'farol_baixo', label: 'Farol baixo' },
                  { key: 'seta', label: 'Seta' },
                  { key: 'neblina', label: 'Neblina' }
                ].map(item => (
                  <tr key={item.key} className="even:bg-gray-50">
                    <td className="border border-slate-300 p-0.5">{item.label}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.esquerda?.[item.key] === 'sim' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.esquerda?.[item.key] === 'nao' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.luzes_dianteiras?.esquerda?.[item.key] === 'na' && '☑'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* Segurança */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-[#f9fafb] text-gray-800">
                <tr>
                  <th className="border border-slate-300 p-0.5" colSpan="4">Segurança</th>
                </tr>
                <tr className="bg-[#f9fafb]">
                  <th className="border border-slate-300 p-0.5"></th>
                  <th className="border border-slate-300 p-0.5">Sim</th>
                  <th className="border border-slate-300 p-0.5">Não</th>
                  <th className="border border-slate-300 p-0.5">N/A</th>
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
                    <td className="border border-slate-300 p-0.5">{item.label}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.seguranca?.[item.key] === 'sim' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.seguranca?.[item.key] === 'nao' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.seguranca?.[item.key] === 'na' && '☑'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Motor */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-[#f9fafb] text-gray-800">
                <tr>
                  <th className="border border-slate-300 p-0.5" colSpan="4">Motor</th>
                </tr>
                <tr className="bg-[#f9fafb]">
                  <th className="border border-slate-300 p-0.5"></th>
                  <th className="border border-slate-300 p-0.5">Sim</th>
                  <th className="border border-slate-300 p-0.5">Não</th>
                  <th className="border border-slate-300 p-0.5">N/A</th>
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
                    <td className="border border-slate-300 p-0.5">{item.label}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.motor?.[item.key] === 'sim' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.motor?.[item.key] === 'nao' && '☑'}</td>
                    <td className="border border-slate-300 p-0.5 text-center">{diario.checklist_veiculo?.motor?.[item.key] === 'na' && '☑'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {diario.checklist_veiculo?.observacoes && (
            <div className="mt-2">
              <p className="font-bold text-sm mb-0.5">Observações:</p>
              <div className="border border-slate-300 p-1 min-h-[35px] text-xs bg-gray-50">
                {diario.checklist_veiculo.observacoes}
              </div>
            </div>
          )}
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
          </footer>
        </div>
      ))}
    </div>
  );
}