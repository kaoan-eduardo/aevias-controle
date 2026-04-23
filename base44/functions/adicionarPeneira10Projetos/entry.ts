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
    const defaultLimits = {
      peneira_2_0mm: { min: 5, max: 15 }
    };
    
    for (const proj of cauqProjects) {
      let changed = false;
      
      if (!proj.faixa_trabalho_min) proj.faixa_trabalho_min = {};
      if (!proj.faixa_trabalho_max) proj.faixa_trabalho_max = {};
      if (!proj.faixa_trabalho) proj.faixa_trabalho = {};
      
      // Adicionar peneira #10 (2.0 mm) se não existir
      if (proj.faixa_trabalho_min.peneira_2_0mm === undefined) {
        proj.faixa_trabalho_min.peneira_2_0mm = defaultLimits.peneira_2_0mm.min;
        changed = true;
      }
      
      if (proj.faixa_trabalho_max.peneira_2_0mm === undefined) {
        proj.faixa_trabalho_max.peneira_2_0mm = defaultLimits.peneira_2_0mm.max;
        changed = true;
      }
      
      if (proj.faixa_trabalho.peneira_2_0mm === undefined) {
        proj.faixa_trabalho.peneira_2_0mm = 10; // média
        changed = true;
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
      message: `Adicionada peneira #10 (2.0mm) a ${updated} projetos CAUQ/MRAF/BGS`,
      projectsUpdated: updated,
      defaultValues: defaultLimits
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});