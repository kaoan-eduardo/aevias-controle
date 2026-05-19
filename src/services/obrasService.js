import { base44 } from '@/api/base44Client';

/**
 * Service centralizado para operações com Obras
 */

export async function listarObrasRecentes(limit = 500) {
  return base44.entities.Obra.list('-created_date', limit);
}

export async function listarObrasPorRegional(regionalId) {
  return base44.entities.Obra.filter({ regional_id: regionalId }, '-created_date', 500);
}

export async function listarObrasAtivas() {
  return base44.entities.Obra.filter({ status: 'em_andamento' }, '-created_date', 500);
}

export async function obterObraById(id) {
  return base44.entities.Obra.read(id);
}

export async function criarObra(data) {
  return base44.entities.Obra.create(data);
}

export async function atualizarObra(id, data) {
  return base44.entities.Obra.update(id, data);
}

export async function deletarObra(id) {
  return base44.entities.Obra.delete(id);
}