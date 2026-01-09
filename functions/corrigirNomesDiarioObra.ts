import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verificar se é admin
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todos os diários de obra
    const diarios = await base44.asServiceRole.entities.DiarioObra.list();
    
    // Buscar todos os usuários
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    let atualizados = 0;
    let erros = 0;

    for (const diario of diarios) {
      try {
        // Verificar se o laboratorista_name é apenas o username do email (antes do @)
        const emailUsername = diario.created_by?.split('@')[0];
        
        if (!diario.laboratorista_name || diario.laboratorista_name === emailUsername) {
          // Buscar o usuário pelo created_by
          const creator = allUsers.find(u => 
            u.email?.toLowerCase() === diario.created_by?.toLowerCase()
          );
          
          if (creator && (creator.laboratorista_name || creator.full_name)) {
            const nomeCorreto = creator.laboratorista_name || creator.full_name;
            
            // Atualizar apenas se o nome for diferente
            if (diario.laboratorista_name !== nomeCorreto) {
              await base44.asServiceRole.entities.DiarioObra.update(diario.id, {
                laboratorista_name: nomeCorreto
              });
              atualizados++;
              console.log(`✅ Atualizado diário ${diario.id}: "${diario.laboratorista_name}" → "${nomeCorreto}"`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar diário ${diario.id}:`, error.message);
        erros++;
      }
    }

    return Response.json({
      success: true,
      message: `Processamento concluído: ${atualizados} diários atualizados, ${erros} erros`,
      atualizados,
      erros,
      total: diarios.length
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});