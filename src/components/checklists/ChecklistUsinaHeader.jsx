import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export default function ChecklistUsinaHeader({
  formData,
  setFormData,
  obras,
  regionais,
  projects,
  projetosDisponiveis,
  obraSelecionada,
  regionalSelecionada,
  isEditable,
  isApproved,
  editingChecklist,
}) {
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleObraChange = (obraId) => {
    setFormData(prev => ({ ...prev, obra_id: obraId, project_id: "" }));
  };

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      setFormData(prev => ({ ...prev, project_id: "" }));
      return;
    }

    const pedreiras = project.agregados && Array.isArray(project.agregados)
      ? [...new Set(project.agregados.map(ag => ag.pedreira).filter(Boolean))].join(' + ')
      : "";

    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      faixa_especificada: "Não definida",
      ligante: project.ligante?.tipo || "",
      pedreira: pedreiras,
      controle_agregados: (project.agregados || []).map(ag => ({
        nome: ag.nome,
        estoque_coberto: false,
        estoque_coberto_qtde: 0,
        material_homogeneizado: false,
        material_homogeneizado_qtde: 0,
        granulometria_individual: false,
        granulometria_individual_qtde: 0
      })),
      controle_ligante: {
        ...prev.controle_ligante,
        fornecedor: project.ligante?.fornecedor || ""
      }
    }));
  };

  return (
    <Card className="bg-slate-50">
      <CardHeader>
        <CardTitle className="text-lg">Dados da Obra e Projeto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="obra_id">Obra *</Label>
            <Select value={formData.obra_id || ""} onValueChange={handleObraChange} disabled={!isEditable || isApproved || editingChecklist?.id}>
              <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
              <SelectContent>
                {obras.map(obra => {
                  const regional = regionais.find(r => r.id === obra.regional_id);
                  return (<SelectItem key={obra.id} value={obra.id}>{obra.name} - {obra.code} {regional && `(${regional.nome})`}</SelectItem>);
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="project_id">Projeto Vinculado</Label>
            <Select value={formData.project_id || ""} onValueChange={handleProjectChange} disabled={!isEditable || isApproved || !formData.obra_id}>
              <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
              <SelectContent>
                {projetosDisponiveis.map(proj => (<SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {regionalSelecionada && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="space-y-1 text-sm">
              <p className="text-blue-800"><strong>📍 Regional:</strong> {regionalSelecionada.nome}</p>
              {regionalSelecionada.cliente && (
                <p className="text-blue-800"><strong>👤 Cliente:</strong> {regionalSelecionada.cliente}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => handleChange('data', e.target.value)}
              required
              disabled={!isEditable || isApproved}
            />
          </div>

          <div>
            <Label htmlFor="horario_inicio">Horário Início *</Label>
            <Input
              id="horario_inicio"
              type="time"
              value={formData.jornada?.horario_inicio || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                jornada: { ...prev.jornada, horario_inicio: e.target.value } 
              }))}
              disabled={!isEditable || isApproved}
              required
            />
          </div>

          <div>
            <Label htmlFor="horario_fim">Horário Fim *</Label>
            <Input
              id="horario_fim"
              type="time"
              value={formData.jornada?.horario_fim || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                jornada: { ...prev.jornada, horario_fim: e.target.value } 
              }))}
              disabled={!isEditable || isApproved}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="usina">Usina *</Label>
            <Select value={formData.usina || ""} onValueChange={(v) => handleChange('usina', v)} disabled={!isEditable || isApproved || !obraSelecionada}>
              <SelectTrigger><SelectValue placeholder="Selecione a usina" /></SelectTrigger>
              <SelectContent>
                {(obraSelecionada?.usinas || []).map((usina) => (<SelectItem key={usina} value={usina}>{usina}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pedreira">Pedreira</Label>
            <Input
              id="pedreira"
              value={formData.pedreira}
              onChange={(e) => handleChange('pedreira', e.target.value)}
              disabled={!isEditable || isApproved}
              readOnly={!!formData.project_id}
              className={formData.project_id ? "bg-slate-100" : ""}
              placeholder="Nome da pedreira"
            />
          </div>

          <div>
            <Label htmlFor="ensaio_realizado_por">Ensaio realizado por:</Label>
            <Select value={formData.ensaio_realizado_por || "Afirma Evias"} onValueChange={(v) => handleChange('ensaio_realizado_por', v)} disabled={!isEditable || isApproved}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Afirma Evias">Afirma Evias</SelectItem>
                <SelectItem value="Empreiteira">Empreiteira</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="faixa_especificada">Faixa Especificada</Label>
            <Input
              id="faixa_especificada"
              value={formData.faixa_especificada}
              onChange={(e) => handleChange('faixa_especificada', e.target.value)}
              disabled={!isEditable || isApproved}
              readOnly={true}
              className="bg-slate-100"
            />
          </div>
          <div>
            <Label htmlFor="ligante">Ligante Asfáltico</Label>
            <Input
              id="ligante"
              value={formData.ligante}
              onChange={(e) => handleChange('ligante', e.target.value)}
              disabled={!isEditable || isApproved}
              readOnly={!!formData.project_id}
              className={formData.project_id ? "bg-slate-100" : ""}
              placeholder="Ex: CAP 50/70"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}