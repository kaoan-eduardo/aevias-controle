// Serviço que centraliza operações Base44 sobre ensaios (aprovação, reprovação, exclusão, assinatura)

import { getEntityMap } from '@/components/ensaios/entityMaps';
import { Regional } from '@/entities/Regional';
import { User } from '@/entities/User';

function getEntity(entityType) {
  const map = getEntityMap();
  return map[entityType];
}

export async function aprovarEnsaio(ensaio, user, obras) {
  const Entity = getEntity(ensaio.entityType);

  let approverDetails = {
    name: user.laboratorista_name || user.full_name,
    position: user.position || 'Não informado',
    crea_number: user.crea_number || 'Não informado',
  };

  // Sala técnica: assina com os dados do gestor da regional
  if (user.access_level === 'sala_tecnica_afirmaevias') {
    try {
      const regionaisData = await Regional.list();
      const obraDoEnsaio = obras.find((o) => o.id === ensaio.obra_id);
      if (obraDoEnsaio) {
        const regionalDaObra = regionaisData.find((r) => r.id === obraDoEnsaio.regional_id);
        if (regionalDaObra?.gestor_contrato_responsavel) {
          const allUsers = await User.list();
          const gestorUser = allUsers.find(
            (u) => u.email.toLowerCase() === regionalDaObra.gestor_contrato_responsavel.toLowerCase()
          );
          if (gestorUser) {
            approverDetails = {
              name: gestorUser.laboratorista_name || gestorUser.full_name || regionalDaObra.gestor_contrato_responsavel,
              position: gestorUser.position || 'Gestor de Contrato',
              crea_number: gestorUser.crea_number || 'Não informado',
            };
          }
        }
      }
    } catch (e) {
      console.error('[ensaiosService] Erro ao buscar dados do gestor:', e?.message || e);
    }
  }

  const updateData = {
    approved: true,
    approved_by: user.email,
    approved_date: new Date().toISOString(),
    approver_details: approverDetails,
    rejection_reason: null,
  };

  // Corrigir medicoes_geometricas inválidas no ChecklistAplicacao
  if (ensaio.entityType === 'ChecklistAplicacao') {
    if (!ensaio.medicoes_geometricas || Array.isArray(ensaio.medicoes_geometricas)) {
      updateData.medicoes_geometricas = { subtrecho: '', servico: '', medicoes: [] };
    }
  }

  await Entity.update(ensaio.id, updateData);
  return approverDetails;
}

export async function reprovarEnsaio(ensaio, user, motivo) {
  const Entity = getEntity(ensaio.entityType);
  await Entity.update(ensaio.id, {
    approved: false,
    approved_by: user.email,
    approved_date: new Date().toISOString(),
    rejection_reason: motivo,
  });
}

export async function excluirEnsaio(ensaio) {
  const Entity = getEntity(ensaio.entityType);
  await Entity.delete(ensaio.id);
}

export async function assinarEnsaio(ensaio, user) {
  const Entity = getEntity(ensaio.entityType);
  await Entity.update(ensaio.id, {
    client_signature: {
      signed_by: user.email,
      signed_date: new Date().toISOString(),
      engineer_name: user.laboratorista_name || user.full_name,
      crea_number: user.crea_number || '',
    },
  });
}