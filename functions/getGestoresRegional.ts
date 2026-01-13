import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter regional_id do payload
    const { regional_id } = await req.json();

    if (!regional_id) {
      return Response.json({ error: 'regional_id é obrigatório' }, { status: 400 });
    }

    // Buscar a regional usando service role
    const regional = await base44.asServiceRole.entities.Regional.get(regional_id);

    if (!regional) {
      return Response.json({ error: 'Regional não encontrada' }, { status: 404 });
    }

    // Coletar emails dos gestores (array novo + campo legado)
    const gestoresEmails = [];

    if (regional.gestores_contrato_responsaveis && Array.isArray(regional.gestores_contrato_responsaveis)) {
      gestoresEmails.push(...regional.gestores_contrato_responsaveis);
    }

    if (regional.gestor_contrato_responsavel && !gestoresEmails.includes(regional.gestor_contrato_responsavel)) {
      gestoresEmails.push(regional.gestor_contrato_responsavel);
    }

    // Buscar detalhes dos gestores usando service role
    const gestores = [];

    for (const email of gestoresEmails) {
      try {
        // Buscar usuários com filtro por email usando service role
        const usuarios = await base44.asServiceRole.entities.User.filter({ email: email });
        
        if (usuarios && usuarios.length > 0) {
          const gestor = usuarios[0];
          gestores.push({
            email: gestor.email,
            nome: gestor.laboratorista_name || gestor.full_name || gestor.email
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar gestor ${email}:`, error);
      }
    }

    return Response.json({ gestores });
  } catch (error) {
    console.error('Erro em getGestoresRegional:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});