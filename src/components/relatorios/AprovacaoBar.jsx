import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";

// Props:
//   entityName: string (e.g. "ChecklistConcretagem")
//   recordId: string
export default function AprovacaoBar({ entityName, recordId }) {
  const [user, setUser] = useState(null);
  const [record, setRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (err) {
        console.error('AprovacaoBar: erro ao carregar usuário', err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!entityName || !recordId) return;
    const loadRecord = async () => {
      try {
        const data = await base44.entities[entityName].get(recordId);
        setRecord(data);
      } catch (err) {
        console.error('AprovacaoBar: erro ao carregar registro', err);
      }
    };
    loadRecord();
  }, [entityName, recordId]);

  if (!user || !record) return null;

  // Mesma lógica do layout principal:
  // Só laboratoristas comuns (access_level ausente + role='user') NÃO podem aprovar
  const accessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
  const canApprove = accessLevel !== 'user';



  const isPending = (record.approved === null || record.approved === undefined) && record.status !== 'rascunho';
  const isApproved = record.approved === true;
  const isRejected = record.approved === false;

  const handleApprove = async () => {
    setSaving(true);
    try {
      const approverDetails = {
        name: user.laboratorista_name || user.full_name,
        position: user.position || 'Responsável',
        crea_number: user.crea_number || ''
      };
      await base44.entities[entityName].update(recordId, {
        approved: true,
        approved_by: user.email,
        approved_date: new Date().toISOString(),
        approver_details: approverDetails,
        rejection_reason: null
      });
      setRecord(prev => ({ ...prev, approved: true, approver_details: approverDetails }));
      alert('Registro aprovado com sucesso!');
    } catch (err) {
      console.error('[AprovacaoBar] Erro ao aprovar registro:', err?.message || err);
      alert('Erro ao aprovar registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Informe o motivo da reprovação.');
      return;
    }
    setSaving(true);
    try {
      await base44.entities[entityName].update(recordId, {
        approved: false,
        approved_by: user.email,
        approved_date: new Date().toISOString(),
        rejection_reason: rejectionReason
      });
      setRecord(prev => ({ ...prev, approved: false, rejection_reason: rejectionReason }));
      setShowRejectModal(false);
      setRejectionReason('');
      alert('Registro reprovado.');
    } catch (err) {
      console.error('[AprovacaoBar] Erro ao reprovar registro:', err?.message || err);
      alert('Erro ao reprovar registro.');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = () => {
    if (record.status === 'rascunho') return (
      <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
        Em execução
      </span>
    );
    if (isApproved) return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
        <CheckCircle className="w-3.5 h-3.5" /> Aprovado
      </span>
    );
    if (isRejected) return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
        <XCircle className="w-3.5 h-3.5" /> Reprovado
      </span>
    );
    if (isPending) return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
        <Clock className="w-3.5 h-3.5" /> Pendente
      </span>
    );
    return null;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {statusBadge()}

        {canApprove && isPending && (
          <>
            <Button size="sm" onClick={handleApprove} disabled={saving}
              className="bg-green-700 text-white hover:bg-green-800 gap-1 h-8">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Aprovar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowRejectModal(true)} disabled={saving}
              className="gap-1 h-8">
              <XCircle className="w-3.5 h-3.5" />
              Reprovar
            </Button>
          </>
        )}
        {canApprove && isRejected && (
          <Button size="sm" onClick={handleApprove} disabled={saving}
            className="bg-green-700 text-white hover:bg-green-800 gap-1 h-8">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Aprovar mesmo assim
          </Button>
        )}
      </div>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reprovar Registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Motivo da reprovação *</Label>
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Descreva o motivo da reprovação..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Confirmar Reprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}