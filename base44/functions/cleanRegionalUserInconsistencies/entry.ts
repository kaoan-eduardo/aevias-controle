import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Remove usuários de listas de regionais que não correspondem ao seu access_level.
 * Regras:
 *   "user"                     → laboratoristas_responsaveis
 *   "sala_tecnica_afirmaevias" → salas_tecnicas_responsaveis
 *   "gestor_contrato"          → gestores_contrato_responsaveis
 *   "cliente"                  → clientes_responsaveis
 *   "admin"                    → ignorado na limpeza
 */

// ─── Configuration (OCP: adicionar regras sem alterar o handler) ─────────────

const LISTA_VALIDACOES = [
  { campo: 'salas_tecnicas_responsaveis',  permitidos: ['sala_tecnica_afirmaevias', 'admin'] },
  { campo: 'laboratoristas_responsaveis',  permitidos: ['user', 'admin'] },
  { campo: 'clientes_responsaveis',        permitidos: ['cliente', 'admin'] },
];

// ─── Pure helpers (SRP: sem efeitos colaterais) ──────────────────────────────

/**
 * Constrói um mapa email.toLowerCase() → access_level a partir da lista de usuários.
 */
function buildUserAccessMap(users) {
  return new Map(users.map(u => [u.email.toLowerCase(), u.access_level || 'user']));
}

/**
 * Filtra uma lista de emails mantendo apenas os com access_level permitido.
 * Usuários não encontrados no mapa (convites pendentes) são mantidos.
 * Retorna { validos, removidos }.
 */
function filtrarEmails(emails, userAccessMap, permitidos) {
  const validos = [];
  const removidos = [];

  for (const email of emails) {
    const accessLevel = userAccessMap.get(email.toLowerCase());
    if (!accessLevel || permitidos.includes(accessLevel)) {
      validos.push(email);
    } else {
      removidos.push({ email, accessLevel });
    }
  }

  return { validos, removidos };
}

/**
 * Verifica o campo singular gestor_contrato_responsavel.
 * Retorna null se deve ser removido, ou o valor original se deve ser mantido.
 */
function validarGestorSingular(email, userAccessMap) {
  if (!email) return email;
  const accessLevel = userAccessMap.get(email.toLowerCase());
  const invalido = accessLevel && accessLevel !== 'gestor_contrato' && accessLevel !== 'admin';
  return invalido ? { remover: true, accessLevel: String(accessLevel) } : { remover: false };
}

// ─── Regional processor (SRP: lógica de uma regional isolada) ────────────────

function processarRegional(regional, userAccessMap) {
  const corrections = [];
  const updates = {};
  let modificado = false;

  // 1. Campo singular — gestor_contrato_responsavel
  const gestorResult = validarGestorSingular(regional.gestor_contrato_responsavel, userAccessMap);
  if (gestorResult?.remover) {
    const email = String(regional.gestor_contrato_responsavel ?? '');
    const levelStr = String(gestorResult.accessLevel ?? 'desconhecido');
    console.log(`  ❌ Removendo ${email} de gestor_contrato_responsavel (access_level: ${levelStr})`);
    corrections.push({
      email,
      removed_from: 'gestor_contrato_responsavel',
      reason: `access_level é "${levelStr}", esperado: "gestor_contrato"`,
    });
    updates.gestor_contrato_responsavel = null;
    modificado = true;
  }

  // 2. Campos de lista
  for (const { campo, permitidos } of LISTA_VALIDACOES) {
    const lista = (regional[campo] ?? []);
    if (!Array.isArray(lista) || lista.length === 0) continue;

    const { validos, removidos } = filtrarEmails(lista, userAccessMap, permitidos);

    if (removidos.length > 0) {
      const campoStr = String(campo);
      const esperado = permitidos.filter(p => p !== 'admin').join(' ou ');
      for (const { email, accessLevel } of removidos) {
        const levelStr = String(accessLevel ?? 'desconhecido');
        console.log(`  ❌ Removendo ${String(email)} de ${campoStr} (access_level: ${levelStr})`);
        corrections.push({
          email,
          removed_from: campoStr,
          reason: `access_level é "${levelStr}", esperado: ${esperado}`,
        });
      }
      updates[campo] = validos;
      modificado = true;
    }
  }

  return { modificado, updates, corrections };
}

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
      base44.asServiceRole.entities.Regional.list(),
    ]);

    console.log("📊 Total de usuários:", allUsers.length);
    console.log("📊 Total de regionais:", allRegionais.length);

    const userAccessMap = buildUserAccessMap(allUsers);

    const correctionsReport = [];
    let totalCorrections = 0;

    for (const regional of allRegionais) {
      console.log(`\n🔍 Analisando regional: ${regional.nome} (${regional.codigo})`);

      const { modificado, updates, corrections } = processarRegional(regional, userAccessMap);

      if (modificado) {
        console.log(`  💾 Salvando correções na regional ${regional.nome}`);
        await base44.asServiceRole.entities.Regional.update(regional.id, updates);
        correctionsReport.push({
          regional_nome: regional.nome,
          regional_codigo: regional.codigo,
          corrections,
        });
        totalCorrections += corrections.length;
      } else {
        console.log(`  ✅ Regional OK - nenhuma inconsistência encontrada`);
      }
    }

    console.log("\n🏁 === MIGRAÇÃO CONCLUÍDA ===");
    console.log(`Total de correções: ${totalCorrections}`);

    return Response.json({
      success: true,
      message: 'Migração concluída com sucesso',
      summary: {
        total_corrections: totalCorrections,
        regionais_affected: correctionsReport.length,
        total_regionais: allRegionais.length,
      },
      corrections: correctionsReport,
      executed_by: user.email,
      executed_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Erro na migração:", error);
    return Response.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
});