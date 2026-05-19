import { useCallback } from "react";
import { aprovarEnsaio, reprovarEnsaio, excluirEnsaio } from "@/services/ensaiosService";

/**
 * Hook que encapsula as ações de aprovação, reprovação e exclusão de ensaios.
 * Fornece manipuladores de erro padronizados e confirmações.
 */
export function useEnsaiosActions(user, obras, onSuccess) {
  const handleApprove = useCallback(async (ensaio) => {
    if (!window.confirm(`Confirma a aprovação do registro "${ensaio.sample_id || ensaio.id}"?`)) return;
    try {
      await aprovarEnsaio(ensaio, user, obras);
      alert('Registro aprovado com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('[useEnsaiosActions] Erro ao aprovar ensaio:', error?.message || error);
      alert('Erro ao aprovar ensaio. Tente novamente.');
    }
  }, [user, obras, onSuccess]);

  const handleReject = useCallback(async (ensaio, motivo) => {
    try {
      await reprovarEnsaio(ensaio, user, motivo);
      alert('Registro reprovado com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('[useEnsaiosActions] Erro ao reprovar registro:', error?.message || error);
      alert('Erro ao reprovar registro. Tente novamente.');
    }
  }, [user, onSuccess]);

  const handleDelete = useCallback(async (ensaio) => {
    try {
      await excluirEnsaio(ensaio);
      alert('Registro excluído com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('[useEnsaiosActions] Erro ao excluir registro:', error?.message || error);
      alert('Erro ao excluir registro. Tente novamente.');
    }
  }, [onSuccess]);

  return {
    handleApprove,
    handleReject,
    handleDelete,
  };
}