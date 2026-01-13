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
      gestoresEmails.push(...regional.gestores_contrato_responsaveis.filter(e => e && !gestoresEmails.includes(e)));
    }

    if (regional.gestor_contrato_responsavel && !gestoresEmails.includes(regional.gestor_contrato_responsavel)) {
      gestoresEmails.push(regional.gestor_contrato_responsavel);
    }

    // Buscar full_name de cada gestor
    const gestores = [];
    for (const email of gestoresEmails) {
      try {
        const usuarios = await base44.asServiceRole.entities.User.filter({ email });
        if (usuarios && usuarios.length > 0) {
          const gestor = usuarios[0];
          gestores.push({
            email,
            nome: gestor.full_name || gestor.laboratorista_name || email
          });
        } else {
          // Se não encontrar, usar apenas o email
          gestores.push({
            email,
            nome: email
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar gestor ${email}:`, error);
        gestores.push({
          email,
          nome: email
        });
      }
    }

    return Response.json({ gestores });
  } catch (error) {
    console.error('Erro em getGestoresRegional:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});