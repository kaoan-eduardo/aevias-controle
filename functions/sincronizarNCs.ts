import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Entidades que podem ter NCs embutidas
const ENTIDADES_COM_NC = [
  'ChecklistUsina',
  'ChecklistAplicacao',
  'ChecklistMRAF',
  'ChecklistConcretagem',
  'ChecklistTerraplanagem',
  'ChecklistReciclagem',
  'DiarioObra',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Só processar eventos de create ou update
    if (!event || !data) {
      return Response.json({ success: true, message: 'Nenhum dado para processar' });
    }

    const entityName = event.entity_name;

    // Verificar se é uma das entidades monitoradas
    if (!ENTIDADES_COM_NC.includes(entityName)) {
      return Response.json({ success: true, message: 'Entidade não monitorada' });
    }

    // Só processar registros finalizados
    if (data.status !== 'finalizado') {
      return Response.json({ success: true, message: 'Registro não finalizado, ignorando' });
    }

    // Verificar se tem NCs preenchidas
    const naoConformidades = data.nao_conformidades || [];
    if (naoConformidades.length === 0) {
      return Response.json({ success: true, message: 'Sem NCs para sincronizar' });
    }

    // Buscar NCs já criadas para este checklist/diário (para evitar duplicatas)
    const ncsExistentes = await base44.asServiceRole.entities.RelatorioNC.filter({
      checklist_ref_id: event.entity_id,
      checklist_ref_tipo: entityName,
    });

    // Criar apenas NCs que ainda não existem (comparar por parametro_nc + categoria_nc + local_nc)
    const ncsExistentesKeys = new Set(
      ncsExistentes.map(nc => `${nc.local_nc}|${nc.categoria_nc}|${nc.parametro_nc}`)
    );

    const ncsParaCriar = naoConformidades.filter(nc => {
      if (!nc.parametro_nc && !nc.categoria_nc) return false; // NC incompleta
      const key = `${nc.local_nc}|${nc.categoria_nc}|${nc.parametro_nc}`;
      return !ncsExistentesKeys.has(key);
    });

    if (ncsParaCriar.length === 0) {
      return Response.json({ success: true, message: 'Todas as NCs já sincronizadas' });
    }

    // Determinar a data do registro
    const dataRegistro = data.data || new Date().toISOString().split('T')[0];

    // Criar registros RelatorioNC para cada NC nova
    const promises = ncsParaCriar.map(nc =>
      base44.asServiceRole.entities.RelatorioNC.create({
        obra_id: data.obra_id,
        data_nc: dataRegistro,
        local_nc: nc.local_nc || 'CAMPO',
        categoria_nc: nc.categoria_nc || '',
        parametro_nc: nc.parametro_nc || '',
        descricao_nc: nc.descricao || nc.parametro_nc || `NC identificada em ${entityName}`,
        rodovia: data.rodovia || '',
        trecho: data.trecho || '',
        executora: data.empreiteira || '',
        relatorio_criador: data.laboratorista_name || '',
        status: 'aberta',
        checklist_ref_tipo: entityName,
        checklist_ref_id: event.entity_id,
      })
    );

    await Promise.all(promises);

    console.log(`Criadas ${ncsParaCriar.length} NCs para ${entityName} id=${event.entity_id}`);

    return Response.json({ 
      success: true, 
      criadas: ncsParaCriar.length,
      mensagem: `${ncsParaCriar.length} NC(s) sincronizadas com sucesso`
    });

  } catch (error) {
    console.error('Erro ao sincronizar NCs:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});