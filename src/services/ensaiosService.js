import { base44 } from '@/api/base44Client';

/**
 * Service centralizado para operações com Ensaios
 */

const ENSAIO_ENTITIES = {
  'EnsaioCAUQ': 'EnsaioCAUQ',
  'EnsaioMRAF': 'EnsaioMRAF',
  'EnsaioDensidade': 'EnsaioDensidade',
  'EnsaioDensidadeInSitu': 'EnsaioDensidadeInSitu',
  'EnsaioGranulometriaIndividual': 'EnsaioGranulometriaIndividual',
  'EnsaioGranMistura': 'EnsaioGranMistura',
  'EnsaioManchaPendulo': 'EnsaioManchaPendulo',
  'EnsaioProctor': 'EnsaioProctor',
  'EnsaioRompimentoConcreto': 'EnsaioRompimentoConcreto',
  'EnsaioSondagem': 'EnsaioSondagem',
  'EnsaioTaxaMRAF': 'EnsaioTaxaMRAF',
  'EnsaioTaxaPinturaImprimacao': 'EnsaioTaxaPinturaImprimacao',
  'EnsaioVigaBenkelman': 'EnsaioVigaBenkelman',
  'AcompanhamentoCarga': 'AcompanhamentoCarga',
  'AcompanhamentoUsinagem': 'AcompanhamentoUsinagem',
};

export async function listarEnsaios(entityName, limit = 500) {
  if (!ENSAIO_ENTITIES[entityName]) {
    throw new Error(`Entidade ensaio desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].list('-created_date', limit);
}

export async function listarEnsaiosPorObra(entityName, obraId) {
  if (!ENSAIO_ENTITIES[entityName]) {
    throw new Error(`Entidade ensaio desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].filter({ obra_id: obraId }, '-created_date', 500);
}

export async function obterEnsaioById(entityName, id) {
  if (!ENSAIO_ENTITIES[entityName]) {
    throw new Error(`Entidade ensaio desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].read(id);
}

export async function criarEnsaio(entityName, data) {
  if (!ENSAIO_ENTITIES[entityName]) {
    throw new Error(`Entidade ensaio desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].create(data);
}

export async function atualizarEnsaio(entityName, id, data) {
  if (!ENSAIO_ENTITIES[entityName]) {
    throw new Error(`Entidade ensaio desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].update(id, data);
}

export async function deletarEnsaio(entityName, id) {
  if (!ENSAIO_ENTITIES[entityName]) {
    throw new Error(`Entidade ensaio desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].delete(id);
}

export async function obterSchemaEnsaio(entityName) {
  if (!ENSAIO_ENTITIES[entityName]) {
    throw new Error(`Entidade ensaio desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].schema();
}

export async function aprovarEnsaio(ensaio, user, obras) {
  const obra = obras?.find(o => o.id === ensaio.obra_id);
  
  await atualizarEnsaio(
    ensaio.constructor?.name || Object.keys(ENSAIO_ENTITIES)[0],
    ensaio.id,
    {
      approved: true,
      approved_by: user.email,
      approved_date: new Date().toISOString(),
      approver_details: {
        name: user.full_name || user.laboratorista_name,
        position: user.position || '',
        crea_number: user.crea_number || '',
      },
    }
  );
}

export async function reprovarEnsaio(ensaio, user, motivo) {
  const entityName = Object.keys(ENSAIO_ENTITIES).find(
    key => ENSAIO_ENTITIES[key] === ensaio.constructor?.name
  ) || 'EnsaioCAUQ';

  await atualizarEnsaio(entityName, ensaio.id, {
    approved: false,
    approved_by: user.email,
    approved_date: new Date().toISOString(),
    rejection_reason: motivo,
    was_rejected: true,
  });
}

export async function excluirEnsaio(ensaio) {
  const entityName = Object.keys(ENSAIO_ENTITIES).find(
    key => ENSAIO_ENTITIES[key] === ensaio.constructor?.name
  ) || 'EnsaioCAUQ';

  return deletarEnsaio(entityName, ensaio.id);
}