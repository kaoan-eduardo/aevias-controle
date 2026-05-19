import { base44 } from '@/api/base44Client';

/**
 * Service centralizado para operações com Regionais
 */

export async function listarRegionais() {
  return base44.entities.Regional.list();
}

export async function listarRegionaisAtivas() {
  return base44.entities.Regional.filter({ status: 'ativa' });
}

export async function obterRegionalById(id) {
  return base44.entities.Regional.read(id);
}

export async function criarRegional(data) {
  return base44.entities.Regional.create(data);
}

export async function atualizarRegional(id, data) {
  return base44.entities.Regional.update(id, data);
}

export async function deletarRegional(id) {
  return base44.entities.Regional.delete(id);
}

export async function obterRegionaisPorGestor(gestorEmail) {
  const regionais = await listarRegionais();
  return regionais.filter(r => 
    r.gestor_contrato_responsavel?.toLowerCase() === gestorEmail?.toLowerCase() ||
    (r.gestores_contrato_responsaveis || []).some(email => email.toLowerCase() === gestorEmail?.toLowerCase()) ||
    (r.salas_tecnicas_responsaveis || []).some(email => email.toLowerCase() === gestorEmail?.toLowerCase())
  );
}