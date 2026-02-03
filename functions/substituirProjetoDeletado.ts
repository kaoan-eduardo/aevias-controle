import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { projetoDeleteId, novoProjetoNome } = await req.json();

    // Buscar o novo projeto pelo nome
    const Project = base44.asServiceRole.entities.Project;
    const projetos = await Project.list();
    const novoProjeto = projetos.find(p => p.name === novoProjetoNome);

    if (!novoProjeto) {
      return Response.json({ error: `Projeto "${novoProjetoNome}" não encontrado` }, { status: 404 });
    }

    console.log(`Substituindo projeto ${projetoDeleteId} por ${novoProjeto.id} (${novoProjeto.name})`);

    const entidadesComProjeto = [
      'EnsaioCAUQ',
      'EnsaioMRAF',
      'EnsaioSondagem',
      'EnsaioDensidadeInSitu',
      'ChecklistUsina',
      'ChecklistAplicacao',
      'ChecklistMRAF',
      'ChecklistConcretagem',
      'ChecklistTerraplanagem'
    ];

    let totalAtualizados = 0;

    for (const entidade of entidadesComProjeto) {
      try {
        const registros = await base44.asServiceRole.entities[entidade].list();
        const registrosParaAtualizar = registros.filter(r => r.project_id === projetoDeleteId);

        console.log(`${entidade}: encontrados ${registrosParaAtualizar.length} registros`);

        for (const registro of registrosParaAtualizar) {
          await base44.asServiceRole.entities[entidade].update(registro.id, {
            project_id: novoProjeto.id
          });
          totalAtualizados++;
        }
      } catch (err) {
        console.log(`Erro ao processar ${entidade}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      totalAtualizados,
      novoProjeto: novoProjeto.name
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});