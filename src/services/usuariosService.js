import { base44 } from '@/api/base44Client';

/**
 * Service centralizado para operações com Usuários
 */

export async function obterUsuarioAtual() {
  return base44.auth.me();
}

export async function listarUsuarios() {
  return base44.entities.User.list();
}

export async function obterUsuarioById(id) {
  return base44.entities.User.read(id);
}

export async function atualizarUsuarioAtual(data) {
  return base44.auth.updateMe(data);
}

export async function atualizarUsuario(id, data) {
  return base44.entities.User.update(id, data);
}

export async function logout() {
  return base44.auth.logout();
}

export async function redirectToLogin(nextUrl) {
  return base44.auth.redirectToLogin(nextUrl);
}

export async function isAuthenticated() {
  return base44.auth.isAuthenticated();
}

export async function inviteUser(email, role) {
  return base44.users.inviteUser(email, role);
}