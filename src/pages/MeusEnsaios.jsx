import React, { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useEnsaiosList } from "@/hooks/useEnsaiosList";
import { aprovarEnsaio, reprovarEnsaio, excluirEnsaio } from "@/services/ensaiosService";
import { isAdmin, isCliente as isClienteUser, isGestorContrato, isSalaTecnica } from "@/utils/accessControl";
import AdminInterface from "@/components/ensaios/AdminInterface";
import ClienteInterface from "@/components/ensaios/ClienteInterface";
import LaboratoristaInterface from "@/components/ensaios/LaboratoristaInterface";

export default function MeusEnsaios() {
  const { ensaios, obras, projects, allUsers, user, loading, reload } = useEnsaiosList();

  const _isAdmin = isAdmin(user);
  const _isSalaTecnica = isSalaTecnica(user);
  const _isGestorContrato = isGestorContrato(user);
  const _isCliente = isClienteUser(user);
  const canApprove = _isAdmin || _isSalaTecnica || _isGestorContrato;
  const canCreate = _isAdmin || (!_isSalaTecnica && !_isGestorContrato && !_isCliente);

  const handleApprove = useCallback(async (ensaio) => {
    if (!window.confirm(`Confirma a aprovação do registro "${ensaio.sample_id || ensaio.id}"?`)) return;
    try {
      await aprovarEnsaio(ensaio, user, obras);
      alert('Registro aprovado com sucesso!');
      reload();
    } catch (e) {
      console.error('[MeusEnsaios] Erro ao aprovar ensaio:', e?.message || e);
      alert('Erro ao aprovar ensaio. Tente novamente.');
    }
  }, [user, obras, reload]);

  const handleReject = useCallback(async (ensaio, motivo) => {
    try {
      await reprovarEnsaio(ensaio, user, motivo);
      reload();
      alert('Registro reprovado com sucesso!');
    } catch (e) {
      console.error('[MeusEnsaios] Erro ao reprovar registro:', e?.message || e);
      alert('Erro ao reprovar registro. Tente novamente.');
    }
  }, [user, reload]);

  const handleDelete = useCallback(async (ensaio) => {
    try {
      await excluirEnsaio(ensaio);
      reload();
      alert('Registro excluído com sucesso!');
    } catch (e) {
      console.error('[MeusEnsaios] Erro ao excluir registro:', e?.message || e);
      alert('Erro ao excluir registro. Tente novamente.');
    }
  }, [reload]);

  const subtitle = _isAdmin || _isSalaTecnica || _isGestorContrato
    ? "Gerencie e aprove todos os registros de suas obras."
    : _isCliente
    ? "Visualize os ensaios e diários aprovados das suas obras."
    : "Visualize e gerencie todos os ensaios e diários registrados.";

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#00233B]">Ensaios Realizados</h1>
          <p className="text-[#00233B]/80 mt-1">{subtitle}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/50" />
            <p className="text-[#00233B]/80 mt-2">Carregando registros...</p>
          </div>
        ) : canApprove ? (
          <AdminInterface
            ensaios={ensaios}
            obras={obras}
            projects={projects}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            user={user}
            canApprove={canApprove}
            canCreate={canCreate}
            allUsers={allUsers}
          />
        ) : _isCliente ? (
          <ClienteInterface
            ensaios={ensaios}
            obras={obras}
            projects={projects}
            user={user}
            allUsers={allUsers}
          />
        ) : (
          <LaboratoristaInterface
            ensaios={ensaios}
            obras={obras}
            user={user}
            allUsers={allUsers}
          />
        )}
      </div>
    </div>
  );
}