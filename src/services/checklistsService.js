import { base44 } from '@/api/base44Client';

/**
 * Service centralizado para operações com Checklists
 */

const CHECKLIST_ENTITIES = {
  'ChecklistUsina': 'ChecklistUsina',
  'ChecklistAplicacao': 'ChecklistAplicacao',
  'ChecklistMRAF': 'ChecklistMRAF',
  'ChecklistConcretagem': 'ChecklistConcretagem',
  'ChecklistTerraplanagem': 'ChecklistTerraplanagem',
  'ChecklistReciclagem': 'ChecklistReciclagem',
};

export async function listarChecklists(entityName, limit = 500) {
  if (!CHECKLIST_ENTITIES[entityName]) {
    throw new Error(`Entidade checklist desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].list('-created_date', limit);
}

export async function listarChecklistsPorObra(entityName, obraId) {
  if (!CHECKLIST_ENTITIES[entityName]) {
    throw new Error(`Entidade checklist desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].filter({ obra_id: obraId }, '-created_date', 500);
}

export async function obterChecklistById(entityName, id) {
  if (!CHECKLIST_ENTITIES[entityName]) {
    throw new Error(`Entidade checklist desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].read(id);
}

export async function criarChecklist(entityName, data) {
  if (!CHECKLIST_ENTITIES[entityName]) {
    throw new Error(`Entidade checklist desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].create(data);
}

export async function atualizarChecklist(entityName, id, data) {
  if (!CHECKLIST_ENTITIES[entityName]) {
    throw new Error(`Entidade checklist desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].update(id, data);
}

export async function deletarChecklist(entityName, id) {
  if (!CHECKLIST_ENTITIES[entityName]) {
    throw new Error(`Entidade checklist desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].delete(id);
}

export async function obterSchemaChecklist(entityName) {
  if (!CHECKLIST_ENTITIES[entityName]) {
    throw new Error(`Entidade checklist desconhecida: ${entityName}`);
  }
  return base44.entities[entityName].schema();
}