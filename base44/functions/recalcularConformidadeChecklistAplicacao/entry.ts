import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todos os ChecklistAplicacao
    const checklists = await base44.asServiceRole.entities.ChecklistAplicacao.list();
    
    console.log(`📊 Processando ${checklists.length} checklists de aplicação...`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const checklist of checklists) {
      try {
        const pinturaAtualizada = { ...checklist.pintura_ligacao };
        let needsUpdate = false;

        // Taxa de Pintura: 0.8 a 1.0 l/m²
        if (pinturaAtualizada.taxa_pintura?.realizado && pinturaAtualizada.taxa_pintura?.resultado !== null && pinturaAtualizada.taxa_pintura?.resultado !== undefined) {
          const resultado = pinturaAtualizada.taxa_pintura.resultado;
          const conforme = resultado >= 0.8 && resultado <= 1.0;
          if (pinturaAtualizada.taxa_pintura.conforme !== conforme) {
            pinturaAtualizada.taxa_pintura.conforme = conforme;
            needsUpdate = true;
          }
        }

        // Taxa de Pintura Residual: 0.3 a 0.4 l/m²
        if (pinturaAtualizada.taxa_pintura_residual?.realizado && pinturaAtualizada.taxa_pintura_residual?.resultado !== null && pinturaAtualizada.taxa_pintura_residual?.resultado !== undefined) {
          const resultado = pinturaAtualizada.taxa_pintura_residual.resultado;
          const conforme = resultado >= 0.3 && resultado <= 0.4;
          if (pinturaAtualizada.taxa_pintura_residual.conforme !== conforme) {
            pinturaAtualizada.taxa_pintura_residual.conforme = conforme;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await base44.asServiceRole.entities.ChecklistAplicacao.update(checklist.id, {
            pintura_ligacao: pinturaAtualizada
          });
          updated++;
          console.log(`✅ Atualizado checklist ${checklist.id}`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar checklist ${checklist.id}:`, error);
      }
    }

    console.log(`✅ Concluído: ${updated} atualizados, ${skipped} ignorados`);

    return Response.json({ 
      success: true, 
      total: checklists.length,
      updated,
      skipped,
      message: `Processados ${checklists.length} checklists: ${updated} atualizados, ${skipped} sem necessidade de atualização.`
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});