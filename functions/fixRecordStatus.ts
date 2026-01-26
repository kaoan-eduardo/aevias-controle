import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Apenas admins podem executar
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const cutoffDate = new Date('2026-01-12');
    console.log(`Iniciando atualização de status para registros anteriores a ${cutoffDate.toLocaleDateString('pt-BR')}`);

    const entities = [
      'DiarioObra',
      'ChecklistUsina',
      'ChecklistAplicacao',
      'ChecklistMRAF',
      'ChecklistTerraplanagem',
      'ChecklistConcretagem',
      'ChecklistReciclagem',
      'EnsaioCAUQ',
      'EnsaioDensidade',
      'EnsaioDensidadeInSitu',
      'EnsaioGranAreia',
      'EnsaioSondagem',
      'EnsaioTaxaPinturaImprimacao',
      'AcompanhamentoCarga'
    ];

    const results = {};
    let totalUpdated = 0;

    for (const entityName of entities) {
      try {
        const allRecords = await base44.asServiceRole.entities[entityName].list();
        
        let updated = 0;
        for (const record of allRecords) {
          // Determinar qual campo de data usar
          let dateStr = record.data || record.data_ensaio || record.extraction_date || record.date;
          
          if (!dateStr) {
            console.log(`[${entityName}] ID ${record.id}: Sem data (ignorado)`);
            continue;
          }

          // Parsear data
          const recordDate = new Date(dateStr);
          
          // Verificar se está anterior ao cutoff
          if (recordDate < cutoffDate) {
            // Verificar status
            const currentStatus = record.status || record.approved;
            
            if (currentStatus !== 'finalizado' && currentStatus !== true) {
              await base44.asServiceRole.entities[entityName].update(record.id, { status: 'finalizado' });
              updated++;
              console.log(`[${entityName}] ID ${record.id}: Status "${currentStatus}" → "finalizado"`);
            }
          }
        }

        results[entityName] = updated;
        totalUpdated += updated;
        console.log(`[${entityName}] Total atualizado: ${updated}`);
      } catch (error) {
        console.error(`Erro ao processar ${entityName}:`, error.message);
        results[entityName] = { error: error.message };
      }
    }

    return Response.json({
      success: true,
      cutoffDate: cutoffDate.toLocaleDateString('pt-BR'),
      totalUpdated,
      details: results
    });
  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});