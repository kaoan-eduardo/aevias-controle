import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Remove usuários de listas de regionais que não correspondem ao seu access_level.
 * Regras:
 *   "user"                   → laboratoristas_responsaveis
 *   "sala_tecnica_afirmaevias" → salas_tecnicas_responsaveis
 *   "gestor_contrato"        → gestores_contrato_responsaveis
 *   "cliente"                → clientes_responsaveis
 *   "admin"                  → ignorado na limpeza
 */

// ─── Helper ───────────────────────────────────────────────────────────────────

const filtrarEmailsPorAccessLevel = (emails, userAccessMap, accessLevelsPermitidos, removedFrom, corrections) => {
  const validos = [];
  let modificado = false;

  for (const email of emails) {
    const accessLevel = userAccessMap.get(email.toLowerCase());

    if (!accessLevel) {
      validos.push(email); // convite pendente — manter
    } else if (accessLevelsPermitidos.includes(accessLevel)) {
      validos.push(email);
    } else {
      console.log(`  ❌ Removendo ${email} de ${removedFrom} (access_level: ${accessLevel})`);
      corrections.push({
        email,
        removed_from: removedFrom,
        reason: `access_level é "${accessLevel}", esperado: ${accessLevelsPermitidos.filter(l => l !== 'admin').join(' ou ')}`
      });
      modificado = true;
    }
  }

  return { validos, modificado };
};

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userAccessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
    if (userAccessLevel !== 'admin') {
      return Response.json({ error: 'Forbidden - apenas administradores podem executar esta migração' }, { status: 403 });
    }

    console.log("🔧 === INICIANDO MIGRAÇÃO DE LIMPEZA ===");
    console.log("👤 Executado por:", user.email);

    const [allUsers, allRegionais] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Regional.list()
    ]);

    console.log("📊 Total de usuários:", allUsers.length);
    console.log("📊 Total de regionais:", allRegionais.length);

    const userAccessMap = new Map(
      allUsers.map(u => [u.email.toLowerCase(), u.access_level || 'user'])
    );

    const corrections = [];
    let totalCorrections = 0;

    for (const regional of allRegionais) {
      console.log(`\n🔍 Analisando regional: ${regional.nome} (${regional.codigo})`);

      let regionalModified = false;
      const regionalCorrections = { regional_nome: regional.nome, regional_codigo: regional.codigo, corrections: [] };

      // 1. Gestor de Contrato (campo único — verificação pontual)
      if (regional.gestor_contrato_responsavel) {
        const email = regional.gestor_contrato_responsavel.toLowerCase();
        const accessLevel = userAccessMap.get(email);
        if (accessLevel && accessLevel !== 'gestor_contrato' && accessLevel !== 'admin') {
          console.log(`  ❌ Removendo ${email} de gestor_contrato_responsavel (access_level: ${accessLevel})`);
          regional.gestor_contrato_responsavel = null;
          regionalModified = true;
          regionalCorrections.corrections.push({ email, removed_from: 'gestor_contrato_responsavel', reason: `access_level é "${accessLevel}", não "gestor_contrato"` });
          totalCorrections++;
        }
      }

      // 2-4. Listas de emails — usar helper para evitar repetição
      const listasParaValidar = [
        { campo: 'salas_tecnicas_responsaveis',  permitidos: ['sala_tecnica_afirmaevias', 'admin'] },
        { campo: 'laboratoristas_responsaveis',   permitidos: ['user', 'admin'] },
        { campo: 'clientes_responsaveis',         permitidos: ['cliente', 'admin'] },
      ];

      for (const { campo, permitidos } of listasParaValidar) {
        const lista = regional[campo];
        if (!lista || lista.length === 0) continue;

        const { validos, modificado } = filtrarEmailsPorAccessLevel(
          lista, userAccessMap, permitidos, campo, regionalCorrections.corrections
        );

        if (modificado) {
          regional[campo] = validos;
          regionalModified = true;
          totalCorrections += lista.length - validos.length;
        }
      }

      if (regionalModified) {
        console.log(`  💾 Salvando correções na regional ${regional.nome}`);
        await base44.asServiceRole.entities.Regional.update(regional.id, {
          gestor_contrato_responsavel: regional.gestor_contrato_responsavel,
          salas_tecnicas_responsaveis: regional.salas_tecnicas_responsaveis,
          laboratoristas_responsaveis: regional.laboratoristas_responsaveis,
          clientes_responsaveis: regional.clientes_responsaveis
        });
        corrections.push(regionalCorrections);
      } else {
        console.log(`  ✅ Regional OK - nenhuma inconsistência encontrada`);
      }
    }

    console.log("\n🏁 === MIGRAÇÃO CONCLUÍDA ===");
    console.log(`Total de correções: ${totalCorrections}`);

    return Response.json({
      success: true,
      message: 'Migração concluída com sucesso',
      summary: { total_corrections: totalCorrections, regionais_affected: corrections.length, total_regionais: allRegionais.length },
      corrections,
      executed_by: user.email,
      executed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erro na migração:", error);
    return Response.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
});