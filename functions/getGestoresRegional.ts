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
    const gestores = [];

    if (regional.gestores_contrato_responsaveis && Array.isArray(regional.gestores_contrato_responsaveis)) {
      regional.gestores_contrato_responsaveis.forEach(email => {
        if (email && !gestores.find(g => g.email === email)) {
          gestores.push({
            email: email,
            nome: email.split('@')[0] // Usar parte antes do @ como nome
          });
        }
      });
    }

    if (regional.gestor_contrato_responsavel && !gestores.find(g => g.email === regional.gestor_contrato_responsavel)) {
      gestores.push({
        email: regional.gestor_contrato_responsavel,
        nome: regional.gestor_contrato_responsavel.split('@')[0]
      });
    }

    return Response.json({ gestores });
  } catch (error) {
    console.error('Erro em getGestoresRegional:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});