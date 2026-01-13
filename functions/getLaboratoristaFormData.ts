import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { obra_id } = await req.json();

    // Usar service role para buscar dados necessários
    const [projects, users, regionais] = await Promise.all([
      base44.asServiceRole.entities.Project.list(),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Regional.list()
    ]);

    let result = {
      projects: projects,
      users: users,
      gestores: []
    };

    // Se obra_id foi fornecida, filtrar gestores dessa regional
    if (obra_id) {
      const obras = await base44.asServiceRole.entities.Obra.list();
      const obra = obras.find(o => o.id === obra_id);
      
      if (obra) {
        const regional = regionais.find(r => r.id === obra.regional_id);
        
        if (regional) {
          const gestores = [];
          
          // Gestores do array novo
          if (regional.gestores_contrato_responsaveis && Array.isArray(regional.gestores_contrato_responsaveis)) {
            regional.gestores_contrato_responsaveis.forEach(email => {
              const gestor = users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
              if (gestor && !gestores.find(g => g.email === gestor.email)) {
                gestores.push({
                  email: gestor.email,
                  nome: gestor.laboratorista_name || gestor.full_name || gestor.email
                });
              }
            });
          }
          
          // Gestor legado
          if (regional.gestor_contrato_responsavel) {
            const gestor = users.find(u => u.email?.toLowerCase() === regional.gestor_contrato_responsavel?.toLowerCase());
            if (gestor && !gestores.find(g => g.email === gestor.email)) {
              gestores.push({
                email: gestor.email,
                nome: gestor.laboratorista_name || gestor.full_name || gestor.email
              });
            }
          }
          
          result.gestores = gestores;
        }
      }
    }

    return Response.json(result);
  } catch (error) {
    console.error('Erro em getLaboratoristaFormData:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});