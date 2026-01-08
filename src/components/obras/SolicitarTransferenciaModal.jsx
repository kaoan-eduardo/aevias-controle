import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

export default function SolicitarTransferenciaModal({ 
  isOpen, 
  onClose, 
  user, 
  regionalAtual, 
  todasRegionais,
  onSubmit 
}) {
  const [formData, setFormData] = useState({
    regional_destino_id: "",
    motivo: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.regional_destino_id || !formData.motivo) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ regional_destino_id: "", motivo: "" });
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const regionaisDisponiveis = todasRegionais.filter(r => 
    r.id !== regionalAtual?.id && r.status === 'ativa'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Solicitar Transferência de Regional</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Regional Atual:</strong> {regionalAtual?.nome} - {regionalAtual?.codigo}
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Você está solicitando transferência para outra regional. Esta solicitação será analisada por um administrador.
            </p>
          </div>

          {regionaisDisponiveis.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Nenhuma regional disponível</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Não há outras regionais ativas disponíveis para transferência no momento.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="regional_destino">Regional de Destino *</Label>
                <Select 
                  value={formData.regional_destino_id}
                  onValueChange={(value) => setFormData({ ...formData, regional_destino_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a regional de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionaisDisponiveis.map(regional => (
                      <SelectItem key={regional.id} value={regional.id}>
                        {regional.nome} - {regional.codigo} ({regional.estado})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="motivo">Motivo da Solicitação *</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Explique o motivo da transferência..."
                  rows={4}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Seja claro e objetivo ao explicar o motivo da transferência
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || regionaisDisponiveis.length === 0}>
                  {submitting ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}