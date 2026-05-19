// Configuração centralizada de entidades: labels, cores e descrições

export const ENTITY_CONFIG = {
  EnsaioCAUQ: {
    label: 'Ensaio CAUQ',
    color: '#00233B',
    description: 'Novo ensaio de CAUQ',
  },
  EnsaioDensidade: {
    label: 'Ensaio Densidade',
    color: '#566E3D',
    description: 'Novo ensaio de densidade',
  },
  DiarioObra: {
    label: 'Diário de Obra',
    color: '#BFCF99',
    description: 'Novo diário de obra',
  },
  ChecklistUsina: {
    label: 'Checklist Usina',
    color: '#FBBF24',
    description: 'Novo checklist de usina',
  },
  ChecklistAplicacao: {
    label: 'Checklist Aplicação',
    color: '#800020',
    description: 'Novo checklist de aplicação',
  },
  ChecklistMRAF: {
    label: 'Checklist MRAF',
    color: '#4A90E2',
    description: 'Novo checklist MRAF',
  },
  ChecklistConcretagem: {
    label: 'Checklist Concretagem',
    color: '#8B4513',
    description: 'Novo checklist de concretagem',
  },
  ChecklistTerraplanagem: {
    label: 'Checklist Terraplanagem',
    color: '#228B22',
    description: 'Novo checklist de terraplanagem',
  },
  ChecklistReciclagem: {
    label: 'Checklist Reciclagem',
    color: '#854d0e',
    description: 'Novo checklist de reciclagem',
  },
  EnsaioMRAF: {
    label: 'Ensaio MRAF',
    color: '#4B5563',
    description: 'Novo ensaio MRAF',
  },
  EnsaioDensidadeInSitu: {
    label: 'Densidade In Situ',
    color: '#6B8E23',
    description: 'Novo ensaio de densidade in situ',
  },
  EnsaioTaxaPinturaImprimacao: {
    label: 'Taxa Pintura/Imprimação',
    color: '#4682B4',
    description: 'Novo ensaio de taxa de pintura',
  },
  EnsaioSondagem: {
    label: 'Ensaio Sondagem',
    color: '#4682B4',
    description: 'Novo ensaio de sondagem',
  },
  EnsaioGranulometriaIndividual: {
    label: 'Granulometria Individual',
    color: '#9B59B6',
    description: 'Novo ensaio de granulometria individual',
  },
  AcompanhamentoUsinagem: {
    label: 'Acomp. Usinagem',
    color: '#1ABC9C',
    description: 'Novo acompanhamento de usinagem',
  },
  AcompanhamentoCarga: {
    label: 'Acomp. Carga',
    color: '#E67E22',
    description: 'Novo acompanhamento de carga',
  },
  EnsaioManchaPendulo: {
    label: 'Mancha + Pêndulo',
    color: '#E74C3C',
    description: 'Novo ensaio mancha + pêndulo',
  },
  EnsaioVigaBenkelman: {
    label: 'Viga Benkelman',
    color: '#3498DB',
    description: 'Novo ensaio viga Benkelman',
  },
  Obra: {
    label: 'Obra',
    color: '#00233B',
    description: 'Nova obra cadastrada',
  },
  Project: {
    label: 'Projeto',
    color: '#566E3D',
    description: 'Novo projeto cadastrado',
  },
};

export const PIE_COLORS = ['#00233B', '#566E3D', '#BFCF99', '#FBBF24', '#800020'];

export function getEntityLabel(type) {
  return ENTITY_CONFIG[type]?.label ?? type;
}

export function getEntityColor(type) {
  return ENTITY_CONFIG[type]?.color ?? '#999999';
}

export function getEntityDescription(type) {
  return ENTITY_CONFIG[type]?.description ?? 'Nova atividade';
}