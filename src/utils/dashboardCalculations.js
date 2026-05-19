// Funções puras de cálculo para o Dashboard — sem dependência de React

import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEntityLabel, getEntityColor, PIE_COLORS } from './entityConfig';

export function calcularStats(ensaios, obras, projects, isClienteUser, isEngenheiroUser) {
  if (isClienteUser) {
    const assinados = ensaios.filter(e => e.client_signature?.signed_by).length;
    const aguardando = isEngenheiroUser
      ? ensaios.filter(e => e.approved === true && !e.client_signature?.signed_by).length
      : 0;
    return {
      obras: obras.length,
      projects: projects.length,
      ensaios: ensaios.length,
      approved: ensaios.filter(e => e.approved === true).length,
      pending: 0,
      rejected: 0,
      assinados,
      aguardando_assinatura: aguardando,
    };
  }

  return {
    obras: obras.length,
    projects: projects.length,
    ensaios: ensaios.length,
    approved: ensaios.filter(e => e.approved === true).length,
    pending: ensaios.filter(e => e.approved === null).length,
    rejected: ensaios.filter(e => e.approved === false).length,
    assinados: ensaios.filter(e => e.client_signature?.signed_by).length,
    aguardando_assinatura: 0,
  };
}

export function calcularGraficoMensal(ensaios, periodo, isClienteUser) {
  const now = new Date();
  const monthsToShow = periodo === '1mes' ? 1 : periodo === '3meses' ? 3 : 6;
  const months = Array.from({ length: monthsToShow }, (_, i) =>
    subMonths(now, monthsToShow - 1 - i)
  );

  return months.map(month => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthEnsaios = ensaios.filter(e =>
      isWithinInterval(new Date(e.created_date), { start, end })
    );

    return {
      name: format(month, 'MMM', { locale: ptBR }),
      ensaios: monthEnsaios.length,
      aprovados: isClienteUser
        ? monthEnsaios.filter(e => e.client_signature?.signed_by).length
        : monthEnsaios.filter(e => e.approved === true).length,
      assinados: isClienteUser
        ? monthEnsaios.filter(e => e.client_signature?.signed_by).length
        : 0,
    };
  });
}

export function calcularGraficoStatus(ensaios, isClienteUser, isEngenheiroUser) {
  if (isClienteUser) {
    const assinados = ensaios.filter(e => e.client_signature?.signed_by).length;
    const aguardando = isEngenheiroUser
      ? ensaios.filter(e => e.approved === true && !e.client_signature?.signed_by).length
      : 0;
    return [
      { name: 'Assinados', value: assinados, color: '#566E3D' },
      { name: 'Aguardando', value: aguardando, color: '#FBBF24' },
    ].filter(item => item.value > 0);
  }

  const approved = ensaios.filter(e => e.approved === true).length;
  const pending = ensaios.filter(e => e.approved === null).length;
  const rejected = ensaios.filter(e => e.approved === false).length;
  return [
    { name: 'Aprovados', value: approved, color: '#566E3D' },
    { name: 'Pendentes', value: pending, color: '#FBBF24' },
    { name: 'Reprovados', value: rejected, color: '#800020' },
  ].filter(item => item.value > 0);
}

export function calcularGraficoPorObra(ensaios, obras) {
  const count = {};
  ensaios.forEach(e => {
    if (e.obra_id) count[e.obra_id] = (count[e.obra_id] || 0) + 1;
  });

  return Object.entries(count)
    .map(([obraId, value], index) => ({
      name: obras.find(o => o.id === obraId)?.name ?? 'Desconhecida',
      value,
      obraId,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export function calcularGraficoPorTipo(ensaios) {
  const count = {};
  ensaios.forEach(e => {
    if (e.entityType) count[e.entityType] = (count[e.entityType] || 0) + 1;
  });

  return Object.entries(count)
    .map(([type, value]) => ({
      name: getEntityLabel(type),
      value,
      color: getEntityColor(type),
      entityType: type,
    }))
    .sort((a, b) => b.value - a.value);
}

export function calcularApprovalPercentage(stats, isClienteUser) {
  if (isClienteUser) {
    const total = stats.assinados + stats.aguardando_assinatura;
    return total > 0 ? ((stats.assinados / total) * 100).toFixed(0) : '100';
  }
  return stats.ensaios > 0 ? ((stats.approved / stats.ensaios) * 100).toFixed(0) : '0';
}