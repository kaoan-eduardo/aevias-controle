import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function EnsaioGranAreia() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);

  const [formData, setFormData] = useState({
    obra_id: "",
    sample_id: "",
    collection_date: new Date().toISOString().split('T')[0],
    collection_point: "",
    material_type: "",
    granulometria: {
      peneira_25mm: null,
      peneira_19mm: null,
      peneira_12_5mm: null,
      peneira_9_5mm: null,
      peneira_4_8mm: null,
      peneira_2_4mm: null,
      peneira_1_2mm: null,
      peneira_0_6mm: null,
      peneira_0_3mm: null,
      peneira_0_15mm: null,
      peneira_0_075mm: null
    },
    equivalente_areia: null,
    limite_plasticidade: null,
    limite_liquidez: null,
    indice_plasticidade: null,
    observations: ""
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [userData, obrasData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Obra.list()
      ]);

      setUser(userData);
      setObras(obrasData.filter(o => o.status === 'em_andamento'));

      const params = new URLSearchParams(location.search);
      const editId = params.get('editId');

      if (editId) {
        const record = await base44.entities.EnsaioGranAreia.get(editId);
        if (userData.email === record.created_by || userData.role === 'admin') {
          setEditingRecord(record);
          setFormData(record);
        } else {
          alert("Você não tem permissão para editar este registro.");
          navigate(createPageUrl('MeusEnsaios'));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        setSaving(false);
        return;
      }

      if (!formData.sample_id?.trim()) {
        alert("Por favor, preencha o ID da amostra.");
        setSaving(false);
        return;
      }

      const dataToSave = {
        ...formData,
        granulometria: {
          peneira_25mm: formData.granulometria.peneira_25mm ? parseFloat(formData.granulometria.peneira_25mm) : null,
          peneira_19mm: formData.granulometria.peneira_19mm ? parseFloat(formData.granulometria.peneira_19mm) : null,
          peneira_12_5mm: formData.granulometria.peneira_12_5mm ? parseFloat(formData.granulometria.peneira_12_5mm) : null,
          peneira_9_5mm: formData.granulometria.peneira_9_5mm ? parseFloat(formData.granulometria.peneira_9_5mm) : null,
          peneira_4_8mm: formData.granulometria.peneira_4_8mm ? parseFloat(formData.granulometria.peneira_4_8mm) : null,
          peneira_2_4mm: formData.granulometria.peneira_2_4mm ? parseFloat(formData.granulometria.peneira_2_4mm) : null,
          peneira_1_2mm: formData.granulometria.peneira_1_2mm ? parseFloat(formData.granulometria.peneira_1_2mm) : null,
          peneira_0_6mm: formData.granulometria.peneira_0_6mm ? parseFloat(formData.granulometria.peneira_0_6mm) : null,
          peneira_0_3mm: formData.granulometria.peneira_0_3mm ? parseFloat(formData.granulometria.peneira_0_3mm) : null,
          peneira_0_15mm: formData.granulometria.peneira_0_15mm ? parseFloat(formData.granulometria.peneira_0_15mm) : null,
          peneira_0_075mm: formData.granulometria.peneira_0_075mm ? parseFloat(formData.granulometria.peneira_0_075mm) : null
        },
        equivalente_areia: formData.equivalente_areia ? parseFloat(formData.equivalente_areia) : null,
        limite_plasticidade: formData.limite_plasticidade ? parseFloat(formData.limite_plasticidade) : null,
        limite_liquidez: formData.limite_liquidez ? parseFloat(formData.limite_liquidez) : null,
        indice_plasticidade: formData.indice_plasticidade ? parseFloat(formData.indice_plasticidade) : null
      };

      if (editingRecord?.id) {
        await base44.entities.EnsaioGranAreia.update(editingRecord.id, dataToSave);
        alert("Ensaio atualizado com sucesso!");
      } else {
        await base44.entities.EnsaioGranAreia.create(dataToSave);
        alert("Ensaio criado com sucesso!");
      }

      navigate(createPageUrl("MeusEnsaios"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const sieves = [
    { key: "peneira_25mm", label: "25mm" },
    { key: "peneira_19mm", label: "19mm" },
    { key: "peneira_12_5mm", label: "12.5mm" },
    { key: "peneira_9_5mm", label: "9.5mm" },
    { key: "peneira_4_8mm", label: "4.8mm" },
    { key: "peneira_2_4mm", label: "2.4mm" },
    { key: "peneira_1_2mm", label: "1.2mm" },
    { key: "peneira_0_6mm", label: "0.6mm" },
    { key: "peneira_0_3mm", label: "0.3mm" },
    { key: "peneira_0_15mm", label: "0.15mm" },
    { key: "peneira_0_075mm", label: "0.075mm" }
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingRecord ? "Editar Ensaio de Granulometria + Equivalente de Areia" : "Novo Ensaio de Granulometria + Equivalente de Areia"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Dados Gerais */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-4">Dados Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="obra_id">Obra *</Label>
                    <Select
                      value={formData.obra_id || ""}
                      onValueChange={(value) => setFormData({ ...formData, obra_id: value })}
                      disabled={!!editingRecord?.id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a obra" />
                      </SelectTrigger>
                      <SelectContent>
                        {obras.map(obra => (
                          <SelectItem key={obra.id} value={obra.id}>
                            {obra.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sample_id">ID da Amostra *</Label>
                    <Input
                      id="sample_id"
                      value={formData.sample_id}
                      onChange={(e) => setFormData({ ...formData, sample_id: e.target.value })}
                      required
                      placeholder="Ex: AM-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="collection_date">Data da Coleta *</Label>
                    <Input
                      type="date"
                      id="collection_date"
                      value={formData.collection_date}
                      onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="collection_point">Local da Coleta</Label>
                    <Input
                      id="collection_point"
                      value={formData.collection_point}
                      onChange={(e) => setFormData({ ...formData, collection_point: e.target.value })}
                      placeholder="Local de coleta"
                    />
                  </div>

                  <div>
                    <Label htmlFor="material_type">Tipo de Material</Label>
                    <Input
                      id="material_type"
                      value={formData.material_type}
                      onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                      placeholder="Tipo de material"
                    />
                  </div>
                </div>
              </div>

              {/* Granulometria */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-4">Análise Granulométrica (%)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sieves.map(sieve => (
                    <div key={sieve.key}>
                      <Label htmlFor={sieve.key} className="text-sm">{sieve.label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        id={sieve.key}
                        value={formData.granulometria[sieve.key] || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          granulometria: {
                            ...formData.granulometria,
                            [sieve.key]: e.target.value
                          }
                        })}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ensaios de Classificação */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-4">Ensaios de Classificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equivalente_areia">Equivalente de Areia (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="equivalente_areia"
                      value={formData.equivalente_areia || ""}
                      onChange={(e) => setFormData({ ...formData, equivalente_areia: e.target.value })}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="limite_liquidez">Limite de Liquidez (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="limite_liquidez"
                      value={formData.limite_liquidez || ""}
                      onChange={(e) => setFormData({ ...formData, limite_liquidez: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="limite_plasticidade">Limite de Plasticidade (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="limite_plasticidade"
                      value={formData.limite_plasticidade || ""}
                      onChange={(e) => setFormData({ ...formData, limite_plasticidade: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="indice_plasticidade">Índice de Plasticidade (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="indice_plasticidade"
                      value={formData.indice_plasticidade || ""}
                      onChange={(e) => setFormData({ ...formData, indice_plasticidade: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}