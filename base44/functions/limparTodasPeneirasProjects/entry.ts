import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação e permissão de admin
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userAccessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
    if (userAccessLevel !== 'admin') {
      return Response.json({ 
        error: 'Forbidden - Admin only' 
      }, { status: 403 });
    }

    console.log("🧹 Iniciando LIMPEZA COMPLETA de todas as peneiras em Projects...");
    
    // Buscar todos os projetos usando service role
    const projects = await base44.asServiceRole.entities.Project.list();
    console.log(`📋 Total de projetos encontrados: ${projects.length}`);
    
    const projetosLimpos = [];
    
    for (const project of projects) {
      console.log(`\n🔍 Limpando projeto: ${project.name} (ID: ${project.id})`);
      
      const updates = {};
      let temDadosParaLimpar = false;
      
      // Limpar granulometria de todos os agregados
      if (project.agregados && Array.isArray(project.agregados) && project.agregados.length > 0) {
        const agregadosLimpos = project.agregados.map(agregado => ({
          nome: agregado.nome || "",
          pedreira: agregado.pedreira || "",
          percentual_mistura: agregado.percentual_mistura || "",
          granulometria: {} // LIMPAR COMPLETAMENTE
        }));
        
        updates.agregados = agregadosLimpos;
        temDadosParaLimpar = true;
        console.log(`  ✓ Limpou granulometria de ${project.agregados.length} agregado(s)`);
      }
      
      // Limpar faixa_trabalho
      if (project.faixa_trabalho && Object.keys(project.faixa_trabalho).length > 0) {
        updates.faixa_trabalho = {};
        temDadosParaLimpar = true;
        console.log(`  ✓ Limpou faixa_trabalho (tinha ${Object.keys(project.faixa_trabalho).length} peneiras)`);
      }
      
      // Limpar faixa_trabalho_min
      if (project.faixa_trabalho_min && Object.keys(project.faixa_trabalho_min).length > 0) {
        updates.faixa_trabalho_min = {};
        temDadosParaLimpar = true;
        console.log(`  ✓ Limpou faixa_trabalho_min (tinha ${Object.keys(project.faixa_trabalho_min).length} peneiras)`);
      }
      
      // Limpar faixa_trabalho_max
      if (project.faixa_trabalho_max && Object.keys(project.faixa_trabalho_max).length > 0) {
        updates.faixa_trabalho_max = {};
        temDadosParaLimpar = true;
        console.log(`  ✓ Limpou faixa_trabalho_max (tinha ${Object.keys(project.faixa_trabalho_max).length} peneiras)`);
      }
      
      // Se houve dados para limpar, atualizar o projeto
      if (temDadosParaLimpar) {
        console.log(`  🧹 Atualizando projeto ${project.id} com dados limpos...`);
        await base44.asServiceRole.entities.Project.update(project.id, updates);
        projetosLimpos.push({
          id: project.id,
          name: project.name,
          campos_limpos: Object.keys(updates)
        });
      } else {
        console.log(`  ✓ Projeto já estava sem dados de peneiras`);
      }
    }
    
    const resultado = {
      success: true,
      summary: {
        total_projetos: projects.length,
        projetos_limpos: projetosLimpos.length,
        projetos_sem_alteracao: projects.length - projetosLimpos.length
      },
      projetos_limpos: projetosLimpos
    };
    
    console.log("\n✅ Limpeza concluída:");
    console.log(JSON.stringify(resultado, null, 2));
    
    return Response.json(resultado);
    
  } catch (error) {
    console.error("❌ Erro na limpeza:", error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});