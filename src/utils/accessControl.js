// Regras de controle de acesso centralizadas

export function getUserAccessLevel(user) {
  if (!user) return 'user';
  return user.access_level || (user.role === 'admin' ? 'admin' : 'user');
}

export function isAdmin(user) {
  return getUserAccessLevel(user) === 'admin';
}

export function isCliente(user) {
  return getUserAccessLevel(user) === 'cliente';
}

export function isGestorContrato(user) {
  return getUserAccessLevel(user) === 'gestor_contrato';
}

export function isSalaTecnica(user) {
  return getUserAccessLevel(user) === 'sala_tecnica_afirmaevias';
}

export function isLaboratorista(user) {
  return getUserAccessLevel(user) === 'user';
}

export function isEngenheiroCliente(user) {
  return isCliente(user) && Boolean(user?.position?.toLowerCase().includes('engenheiro'));
}

export function canSeeFilters(user) {
  return !isLaboratorista(user);
}

export function canSeeObraChart(user) {
  const level = getUserAccessLevel(user);
  return level === 'admin' || level === 'cliente';
}

export function filterRegionaisByUser(regionais, user) {
  const level = getUserAccessLevel(user);
  return regionais.filter(regional => {
    if (level === 'cliente') {
      return (regional.clientes_responsaveis || []).some(
        email => email.toLowerCase() === user.email.toLowerCase()
      );
    }
    if (level === 'sala_tecnica_afirmaevias') {
      return (regional.salas_tecnicas_responsaveis || []).some(
        email => email.toLowerCase() === user.email.toLowerCase()
      );
    }
    if (level === 'gestor_contrato') {
      return (
        regional.gestor_contrato_responsavel?.toLowerCase() === user.email.toLowerCase() ||
        (regional.gestores_contrato_responsaveis || []).some(
          email => email.toLowerCase() === user.email.toLowerCase()
        )
      );
    }
    return false;
  });
}