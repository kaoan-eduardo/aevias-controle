// Serviço responsável por carregar e normalizar os dados do Dashboard

import { base44 } from '@/api/base44Client';
import { getUserAccessLevel, filterRegionaisByUser, isCliente } from '@/utils/accessControl';

const ENTITY_LISTS = [
  ['EnsaioCAUQ', 'EnsaioCAUQ'],
  ['EnsaioDensidade', 'EnsaioDensidade'],
  ['DiarioObra', 'DiarioObra'],
  ['ChecklistUsina', 'ChecklistUsina'],
  ['ChecklistAplicacao', 'ChecklistAplicacao'],
  ['ChecklistMRAF', 'ChecklistMRAF'],
  ['ChecklistConcretagem', 'ChecklistConcretagem'],
  ['ChecklistTerraplanagem', 'ChecklistTerraplanagem'],
  ['ChecklistReciclagem', 'ChecklistReciclagem'],
  ['EnsaioMRAF', 'EnsaioMRAF'],
  ['EnsaioDensidadeInSitu', 'EnsaioDensidadeInSitu'],
  ['EnsaioTaxaPinturaImprimacao', 'EnsaioTaxaPinturaImprimacao'],
  ['EnsaioSondagem', 'EnsaioSondagem'],
  ['EnsaioGranulometriaIndividual', 'EnsaioGranulometriaIndividual'],
  ['AcompanhamentoUsinagem', 'AcompanhamentoUsinagem'],
  ['AcompanhamentoCarga', 'AcompanhamentoCarga'],
  ['EnsaioManchaPendulo', 'EnsaioManchaPendulo'],
  ['EnsaioVigaBenkelman', 'EnsaioVigaBenkelman'],
];

function normalizeEnsaios(results) {
  return ENTITY_LISTS.flatMap(([entityType], i) =>
    (results[i] || []).map(e => ({ ...e, entityType }))
  );
}

export async function loadDashboardData(user) {
  const userAccessLevel = getUserAccessLevel(user);
  const isClienteUser = isCliente(user);

  // Carregar entidades em paralelo
  const entityPromises = ENTITY_LISTS.map(([entityType]) =>
    base44.entities[entityType].list('-created_date', 5000)
  );

  const needsRegionais = ['cliente', 'sala_tecnica_afirmaevias', 'gestor_contrato'].includes(userAccessLevel);

  const [obrasRaw, projectsRaw, ...entityResults] = await Promise.all([
    base44.entities.Obra.list('-created_date', 500),
    base44.entities.Project.list('-created_date', 500),
    ...entityPromises,
    needsRegionais
      ? base44.entities.Regional.list()
      : Promise.resolve([]),
  ]);

  // O último resultado é regionais
  const regionais = entityResults.pop() || [];
  let allEnsaios = normalizeEnsaios(entityResults);

  let obras = obrasRaw;
  let projects = projectsRaw;

  // Aplicar filtros por nível de acesso
  if (userAccessLevel === 'user') {
    allEnsaios = allEnsaios.filter(e => e.created_by === user.email);
  } else if (needsRegionais) {
    const regionaisDoUsuario = filterRegionaisByUser(regionais, user);
    const regionaisIds = new Set(regionaisDoUsuario.map(r => r.id));

    obras = obrasRaw.filter(o => regionaisIds.has(o.regional_id));

    const projectIdsPermitidos = new Set(
      regionaisDoUsuario.flatMap(r => r.project_ids || [])
    );
    projects = projectsRaw.filter(p => projectIdsPermitidos.has(p.id));

    const obrasIds = new Set(obras.map(o => o.id));
    if (isClienteUser) {
      allEnsaios = allEnsaios.filter(
        e => obrasIds.has(e.obra_id) && (e.approved === true || e.client_signature?.signed_by)
      );
    } else {
      allEnsaios = allEnsaios.filter(e => obrasIds.has(e.obra_id));
    }
  }

  return { obras, projects, ensaios: allEnsaios, regionais };
}