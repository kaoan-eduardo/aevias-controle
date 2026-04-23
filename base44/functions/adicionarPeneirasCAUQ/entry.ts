import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const projects = await base44.asServiceRole.entities.Project.list();
    const cauqProjects = projects.filter(p => ['CAUQ', 'MRAF', 'BGS'].includes(p.tipo_projeto));
    
    let updated = 0;
    
    for (const proj of cauqProjects) {
      let changed = false;
      
      // Verificar e adicionar peneiras nas faixas de trabalho
      if (proj.faixa_trabalho_min && typeof proj.faixa_trabalho_min === 'object') {
        if (proj.faixa_trabalho_min.peneira_19_0mm === undefined) {
          proj.faixa_trabalho_min.peneira_19_0mm = 100;
          changed = true;
        }
        if (proj.faixa_trabalho_min.peneira_2_0mm === undefined) {
          proj.faixa_trabalho_min.peneira_2_0mm = 5;
          changed = true;
        }
      }
      
      if (proj.faixa_trabalho_max && typeof proj.faixa_trabalho_max === 'object') {
        if (proj.faixa_trabalho_max.peneira_19_0mm === undefined) {
          proj.faixa_trabalho_max.peneira_19_0mm = 100;
          changed = true;
        }
        if (proj.faixa_trabalho_max.peneira_2_0mm === undefined) {
          proj.faixa_trabalho_max.peneira_2_0mm = 15;
          changed = true;
        }
      }
      
      if (proj.faixa_trabalho && typeof proj.faixa_trabalho === 'object') {
        if (proj.faixa_trabalho.peneira_19_0mm === undefined) {
          proj.faixa_trabalho.peneira_19_0mm = 100;
          changed = true;
        }
        if (proj.faixa_trabalho.peneira_2_0mm === undefined) {
          proj.faixa_trabalho.peneira_2_0mm = 10;
          changed = true;
        }
      }
      
      if (changed) {
        await base44.asServiceRole.entities.Project.update(proj.id, {
          faixa_trabalho_min: proj.faixa_trabalho_min,
          faixa_trabalho_max: proj.faixa_trabalho_max,
          faixa_trabalho: proj.faixa_trabalho
        });
        updated++;
      }
    }
    
    return Response.json({ 
      message: `Adicionadas peneiras 3/4" e #10 a ${updated} projetos CAUQ/MRAF/BGS`,
      projectsUpdated: updated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});