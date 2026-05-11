import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

/**
 * Componente reutilizável para cadastro de agregados com granulometria individual.
 * Usado tanto para CAUQ quanto para MRAF e CAMADAS_GRANULARES.
 */
export default function AgregadosForm({ agregados, peneirasDisponiveis, onAdd, onRemove, onChange, onGranChange }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Agregados Utilizados</CardTitle>
          <Button type="button" onClick={onAdd} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Agregado
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {agregados.length > 0 ? (
          agregados.map((agregado, index) => (
            <div key={`agregado-${index}`} className="p-4 border rounded-lg bg-slate-50 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Agregado {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => onRemove(index)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nome/Tipo</Label>
                  <Input
                    value={agregado.nome}
                    onChange={(e) => onChange(index, 'nome', e.target.value)}
                    placeholder="Ex: Brita 1"
                  />
                </div>
                <div>
                  <Label>Pedreira</Label>
                  <Input
                    value={agregado.pedreira}
                    onChange={(e) => onChange(index, 'pedreira', e.target.value)}
                    placeholder="Ex: Pedreira São José"
                  />
                </div>
                <div>
                  <Label>% na Mistura</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={agregado.percentual_mistura}
                    onChange={(e) => onChange(index, 'percentual_mistura', e.target.value)}
                    placeholder="Ex: 30"
                  />
                </div>
              </div>

              {peneirasDisponiveis.length > 0 && (
                <div>
                  <Label className="font-semibold mb-2 block">Granulometria Individual (% Passante) - PADRONIZADA DNIT/ASTM</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {peneirasDisponiveis.map(peneira => (
                      <div key={peneira.key}>
                        <Label className="text-xs font-semibold">{peneira.astm}</Label>
                        <Label className="text-xs text-gray-500 block">{peneira.nome}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={agregado.granulometria?.[peneira.key] ?? ""}
                          onChange={(e) => onGranChange(index, peneira.key, e.target.value)}
                          placeholder="0-100"
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500 py-4">
            Nenhum agregado adicionado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}