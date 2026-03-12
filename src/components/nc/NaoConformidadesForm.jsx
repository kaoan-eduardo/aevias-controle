import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { getCategoriasByLocal, getParametrosByLocalCategoria } from "@/components/nc/ncData";

export default function NaoConformidadesForm({ 
  naoConformidades = [], 
  onChange, 
  disabled = false,
  locaisPermitidos = ["CAMPO", "USINA"] // DIARIO = ["CAMPO", "USINA"], ChecklistUsina = ["USINA"], demais = ["CAMPO"]
}) {
  const handleAddNC = () => {
    onChange([...naoConformidades, {
      local_nc: locaisPermitidos.length === 1 ? locaisPermitidos[0] : "",
      categoria_nc: "",
      parametro_nc: "",
      descricao: ""
    }]);
  };

  const handleRemoveNC = (index) => {
    onChange(naoConformidades.filter((_, i) => i !== index));
  };

  const handleNCChange = (index, field, value) => {
    const updated = [...naoConformidades];
    updated[index] = { ...updated[index], [field]: value };
    
    // Reset categoria e parametro se mudar o local
    if (field === 'local_nc') {
      updated[index].categoria_nc = "";
      updated[index].parametro_nc = "";
    }
    // Reset parametro se mudar a categoria
    if (field === 'categoria_nc') {
      updated[index].parametro_nc = "";
    }
    
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Não Conformidades Identificadas</Label>
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddNC}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar NC
          </Button>
        )}
      </div>

      {naoConformidades.length === 0 ? (
        <p className="text-sm text-slate-500 italic">Nenhuma não conformidade registrada.</p>
      ) : (
        <div className="space-y-4">
          {naoConformidades.map((nc, index) => (
            <div key={index} className="p-4 border-2 border-red-200 rounded-lg bg-red-50/50 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-red-800">NC #{index + 1}</Label>
                {!disabled && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveNC(index)}
                    className="h-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Local */}
                <div>
                  <Label className="text-xs">Local *</Label>
                  <select
                    value={nc.local_nc || ""}
                    onChange={(e) => handleNCChange(index, 'local_nc', e.target.value)}
                    disabled={disabled || locaisPermitidos.length === 1}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-sm disabled:opacity-50"
                  >
                    <option value="">Selecione</option>
                    {locaisPermitidos.map(local => (
                      <option key={local} value={local}>{local}</option>
                    ))}
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <Label className="text-xs">Categoria *</Label>
                  <select
                    value={nc.categoria_nc || ""}
                    onChange={(e) => handleNCChange(index, 'categoria_nc', e.target.value)}
                    disabled={disabled || !nc.local_nc}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-sm disabled:opacity-50"
                  >
                    <option value="">Selecione</option>
                    {getCategoriasByLocal(nc.local_nc).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Parâmetro */}
                <div>
                  <Label className="text-xs">Parâmetro *</Label>
                  {getParametrosByLocalCategoria(nc.local_nc, nc.categoria_nc).length > 0 ? (
                    <select
                      value={nc.parametro_nc || ""}
                      onChange={(e) => handleNCChange(index, 'parametro_nc', e.target.value)}
                      disabled={disabled || !nc.categoria_nc}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="">Selecione</option>
                      {getParametrosByLocalCategoria(nc.local_nc, nc.categoria_nc).map(param => (
                        <option key={param} value={param}>{param}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={nc.parametro_nc || ""}
                      onChange={(e) => handleNCChange(index, 'parametro_nc', e.target.value)}
                      disabled={disabled || !nc.categoria_nc}
                      placeholder="Digite o parâmetro..."
                      className="flex h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-sm disabled:opacity-50"
                    />
                  )}
                </div>
              </div>

              {/* Descrição da NC */}
              <div>
                <Label className="text-xs">Descrição da NC *</Label>
                <Textarea
                  value={nc.descricao || ""}
                  onChange={(e) => handleNCChange(index, 'descricao', e.target.value)}
                  disabled={disabled}
                  rows={3}
                  placeholder="Descreva a não conformidade identificada..."
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}