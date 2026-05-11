import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export const ExclusaoModal = React.memo(({ ensaio, isOpen, onClose, onDelete }) => {
  const [confirmacao, setConfirmacao] = useState('');
  const textoConfirmacao = 'EXCLUIR REGISTRO';

  const handleDelete = useCallback(async () => {
    if (confirmacao !== textoConfirmacao) {
      alert(`Por favor, digite "${textoConfirmacao}" para confirmar a exclusão.`);
      return;
    }

    await onDelete(ensaio);
    setConfirmacao('');
  }, [ensaio, confirmacao, onDelete]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20 text-[#00233B]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Excluir Registro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Atenção: Esta ação é irreversível!</p>
            <p className="text-sm text-red-700">
              Você está prestes a excluir permanentemente este registro. Todos os dados serão perdidos.
            </p>
          </div>
          <div>
            <Label htmlFor="confirmacao">Digite "{textoConfirmacao}" para confirmar *</Label>
            <Input
              id="confirmacao"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder={textoConfirmacao}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={confirmacao !== textoConfirmacao}
          >
            Excluir Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ExclusaoModal.displayName = 'ExclusaoModal';