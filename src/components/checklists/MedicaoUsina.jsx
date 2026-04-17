import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const novaCarga = () => ({
  numero_ticket: '',
  placa: '',
  quantidade_toneladas: null,
  volume_m3: null,
  temperatura: null,
  rodovia_destino: '',
  equipe: '',
  observacoes: ''
});

export default function MedicaoUsina({ medicoes_usina, onChange, disabled, empreiteiras }) {
  const data = medicoes_usina || { sub_trecho: '', servico: '', cargas: [] };

  const update = (patch) => onChange({ ...data, ...patch });

  const updateCarga = (index, field, value) => {
    const cargas = [...(data.cargas || [])];
    cargas[index] = { ...cargas[index], [field]: value };
    update({ cargas });
  };

  const addCarga = () => {
    if ((data.cargas || []).length >= 30) return;
    update({ cargas: [...(data.cargas || []), novaCarga()] });
  };

  const removeCarga = (index) => {
    const cargas = (data.cargas || []).filter((_, i) => i !== index);
    update({ cargas });
  };

  return (
    <Card className="bg-slate-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Medição de Cargas da Usina</CardTitle>
          {!disabled && (
            <Button type="button" variant="outline" onClick={addCarga} disabled={(data.cargas || []).length >= 30}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Carga {(data.cargas || []).length > 0 && `(${(data.cargas || []).length}/30)`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Sub-Trecho</Label>
            <Input
              value={data.sub_trecho || ''}
              onChange={(e) => update({ sub_trecho: e.target.value })}
              disabled={disabled}
              placeholder="Ex: km 100 ao km 105"
            />
          </div>
          <div>
            <Label>Serviço</Label>
            <Select
              value={data.servico || ''}
              onValueChange={(v) => update({ servico: v })}
              disabled={disabled}
            >
              <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="capa">Capa</SelectItem>
                <SelectItem value="reperfilagem">Reperfilagem</SelectItem>
                <SelectItem value="remendo">Remendo</SelectItem>
                <SelectItem value="capa_reperfilagem">Capa/Reperfilagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {empreiteiras && empreiteiras.length > 0 && (
          <div>
            <Label>Empreiteira</Label>
            <Select
              value={data.empreiteira || ''}
              onValueChange={(v) => update({ empreiteira: v })}
              disabled={disabled}
            >
              <SelectTrigger><SelectValue placeholder="Selecione a empreiteira" /></SelectTrigger>
              <SelectContent>
                {empreiteiras.map((emp) => (
                  <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(data.cargas?.length || 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[800px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-2 text-left font-medium">Nº Ticket (NF)</th>
                  <th className="border border-slate-300 px-2 py-2 text-left font-medium">Placa</th>
                  <th className="border border-slate-300 px-2 py-2 text-center font-medium">Qtde (t)</th>
                  <th className="border border-slate-300 px-2 py-2 text-center font-medium">Volume (m³)</th>
                  <th className="border border-slate-300 px-2 py-2 text-center font-medium">Temp. (°C)</th>
                  <th className="border border-slate-300 px-2 py-2 text-left font-medium">Rodovia Destino</th>
                  <th className="border border-slate-300 px-2 py-2 text-left font-medium">Equipe</th>
                  <th className="border border-slate-300 px-2 py-2 text-left font-medium">Observações</th>
                  {!disabled && <th className="border border-slate-300 px-2 py-2 w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {data.cargas.map((carga, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input value={carga.numero_ticket || ''} onChange={(e) => updateCarga(index, 'numero_ticket', e.target.value)} disabled={disabled} className="h-8 text-sm" placeholder="Ex: 32352" />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input value={carga.placa || ''} onChange={(e) => updateCarga(index, 'placa', e.target.value)} disabled={disabled} className="h-8 text-sm" placeholder="Ex: HBN7I73" />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input type="number" step="0.01" min="0" value={carga.quantidade_toneladas ?? ''} onChange={(e) => updateCarga(index, 'quantidade_toneladas', e.target.value ? parseFloat(e.target.value) : null)} disabled={disabled} className="h-8 text-sm text-center" placeholder="0.00" />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input type="number" step="0.01" min="0" value={carga.volume_m3 ?? ''} onChange={(e) => updateCarga(index, 'volume_m3', e.target.value ? parseFloat(e.target.value) : null)} disabled={disabled} className="h-8 text-sm text-center" placeholder="0.00" />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input type="number" step="0.1" value={carga.temperatura ?? ''} onChange={(e) => updateCarga(index, 'temperatura', e.target.value ? parseFloat(e.target.value) : null)} disabled={disabled} className="h-8 text-sm text-center" placeholder="180" />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input value={carga.rodovia_destino || ''} onChange={(e) => updateCarga(index, 'rodovia_destino', e.target.value)} disabled={disabled} className="h-8 text-sm" placeholder="Ex: PR-092" />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input value={carga.equipe || ''} onChange={(e) => updateCarga(index, 'equipe', e.target.value)} disabled={disabled} className="h-8 text-sm" placeholder="Ex: J. Malucelli" />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <Input value={carga.observacoes || ''} onChange={(e) => updateCarga(index, 'observacoes', e.target.value)} disabled={disabled} className="h-8 text-sm" placeholder="Observações..." />
                    </td>
                    {!disabled && (
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCarga(index)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-4">
            Clique em "Adicionar Carga" para registrar as cargas da usina.
          </p>
        )}
      </CardContent>
    </Card>
  );
}