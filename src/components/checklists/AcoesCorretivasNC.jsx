import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import NaoConformidadesForm from "@/components/nc/NaoConformidadesForm";

export default function AcoesCorretivasNC({ 
  acoesRealizadas,
  acoesDescricao,
  naoConformidades = [],
  onAcoesRealizadasChange,
  onAcoesDescricaoChange,
  onNaoConformidadesChange,
  disabled = false,
  locaisPermitidos = ["CAMPO"]
}) {
  return (
    <Card className="bg-orange-50 border-orange-200">
      <CardHeader>
        <CardTitle className="text-base">Ações Corretivas / Não Conformidades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ações Corretivas */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold">Foram realizadas ações corretivas? *</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="acoes_sim"
                  name="acoes_corretivas"
                  checked={acoesRealizadas === true}
                  onChange={() => onAcoesRealizadasChange(true)}
                  disabled={disabled}
                  className="w-4 h-4"
                />
                <Label htmlFor="acoes_sim" className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="acoes_nao"
                  name="acoes_corretivas"
                  checked={acoesRealizadas === false}
                  onChange={() => {
                    onAcoesRealizadasChange(false);
                    onAcoesDescricaoChange('');
                  }}
                  disabled={disabled}
                  className="w-4 h-4"
                />
                <Label htmlFor="acoes_nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </div>
          </div>

          {acoesRealizadas === true && (
            <div className="space-y-2 p-4 border-2 border-orange-300 rounded-lg bg-white">
              <Label htmlFor="acoes_descricao">Descrição das Ações Corretivas *</Label>
              <Textarea
                id="acoes_descricao"
                value={acoesDescricao || ""}
                onChange={(e) => onAcoesDescricaoChange(e.target.value)}
                disabled={disabled}
                rows={3}
                placeholder="Descreva as ações corretivas..."
                maxLength="500"
              />
              <p className="text-xs text-right text-slate-500 mt-1">
                {acoesDescricao?.length || 0} / 500
              </p>
            </div>
          )}
        </div>

        {/* Não Conformidades */}
        <div className="border-t pt-4">
          <NaoConformidadesForm
            naoConformidades={naoConformidades}
            onChange={onNaoConformidadesChange}
            disabled={disabled}
            locaisPermitidos={locaisPermitidos}
          />
        </div>
      </CardContent>
    </Card>
  );
}