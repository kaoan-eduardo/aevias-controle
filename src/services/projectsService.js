import { base44 } from '@/api/base44Client';

/**
 * Service centralizado para operações com Projects
 */

export async function listarProjects() {
  return base44.entities.Project.list();
}

export async function listarProjectsPorTipo(tipo) {
  return base44.entities.Project.filter({ tipo_projeto: tipo });
}

export async function listarProjectsAtivos() {
  return base44.entities.Project.filter({ status: 'ativo' });
}

export async function obterProjectById(id) {
  return base44.entities.Project.read(id);
}

export async function criarProject(data) {
  return base44.entities.Project.create(data);
}

export async function atualizarProject(id, data) {
  return base44.entities.Project.update(id, data);
}

export async function deletarProject(id) {
  return base44.entities.Project.delete(id);
}

export async function obterSchemaProject() {
  return base44.entities.Project.schema();
}