import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Edit, Trash2, Construction as ConstructionIcon, Users as UsersIcon, ChevronDown, ChevronUp, Search, FileText, HardHat, Construction, Wrench, Loader2, Eye } from "lucide-react";
import { Regional } from "@/entities/Regional";
import { Obra } from "@/entities/Obra";
import { User } from "@/entities/User";
import { Project } from "@/entities/Project";
import RegionalForm from '../components/regionais/RegionalForm';
import RegionalDetails from '../components/regionais/RegionalDetails';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Memoizar componente de formulário de obra (RegionalForm was moved to an external file)
const ObraForm = React.memo(({ obra, regional, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: obra?.name || "",
    code: obra?.code || "",
    tipo_obra: obra?.tipo_obra || "implantacao",
    status: obra?.status || "planejamento",
    empreiteiras: obra?.empreiteiras || [],
    clientes: obra?.clientes || [],
    usinas: obra?.usinas || [],
    rodovias: obra?.rodovias || []
  });

  const [novaEmpreiteira, setNovaEmpreiteira] = useState("");
  const [novoCliente, setNovoCliente] = useState("");
  const [novaUsina, setNovaUsina] = useState("");
  const [novaRodovia, setNovaRodovia] = useState("");

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSave(formData);
  }, [formData, onSave]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da Obra *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="bg-white border-[#00233B]/20 text-[#00233B]"
        />
      </div>

      <div>
        <Label htmlFor="code">Código da Obra *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
          className="bg-white border-[#00233B]/20 text-[#00233B]"
        />
      </div>

      <div>
        <Label htmlFor="tipo_obra">Tipo de Obra *</Label>
        <Select value={formData.tipo_obra} onValueChange={(value) => setFormData({ ...formData, tipo_obra: value })}>
          <SelectTrigger className="bg-white border-[#00233B]/20 text-[#00233B]">
            <SelectValue placeholder="Selecione o tipo de obra" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#00233B]/20 text-[#00233B]">
            <SelectItem value="supervisao">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-blue-600" />
                Supervisão
              </div>
            </SelectItem>
            <SelectItem value="implantacao">
              <div className="flex items-center gap-2">
                <Construction className="w-4 h-4 text-green-600" />
                Implantação
              </div>
            </SelectItem>
            <SelectItem value="conservacao">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                Conservação
              </div>
            </SelectItem>
            <SelectItem value="sondagem">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Sondagem
              </div>
            </SelectItem>
            <SelectItem value="levantamentos">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Levantamentos
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-[#00233B]/60 mt-1">
          Define quais ensaios estarão disponíveis para esta obra
        </p>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger className="bg-white border-[#00233B]/20 text-[#00233B]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#00233B]/20 text-[#00233B]">
            <SelectItem value="planejamento">Planejamento</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="pausada">Pausada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empreiteiras - apenas para Supervisão */}
      {formData.tipo_obra === "supervisao" && (
        <div className="space-y-2">
          <Label>Empreiteiras do Contrato</Label>
          <div className="flex gap-2">
            <Input
              value={novaEmpreiteira}
              onChange={(e) => setNovaEmpreiteira(e.target.value)}
              placeholder="Nome da empreiteira"
              className="bg-white border-[#00233B]/20 text-[#00233B]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (novaEmpreiteira.trim()) {
                    setFormData({ ...formData, empreiteiras: [...formData.empreiteiras, novaEmpreiteira.trim()] });
                    setNovaEmpreiteira("");
                  }
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (novaEmpreiteira.trim()) {
                  setFormData({ ...formData, empreiteiras: [...formData.empreiteiras, novaEmpreiteira.trim()] });
                  setNovaEmpreiteira("");
                }
              }}
              className="bg-[#566E3D] hover:bg-[#566E3D]/90 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.empreiteiras.map((emp, index) => (
              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                {emp}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, empreiteiras: formData.empreiteiras.filter((_, i) => i !== index) })}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Clientes - apenas para Levantamentos e Sondagem */}
      {(formData.tipo_obra === "levantamentos" || formData.tipo_obra === "sondagem") && (
        <div className="space-y-2">
          <Label>Clientes da Obra</Label>
          <div className="flex gap-2">
            <Input
              value={novoCliente}
              onChange={(e) => setNovoCliente(e.target.value)}
              placeholder="Nome do cliente"
              className="bg-white border-[#00233B]/20 text-[#00233B]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (novoCliente.trim()) {
                    setFormData({ ...formData, clientes: [...formData.clientes, novoCliente.trim()] });
                    setNovoCliente("");
                  }
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (novoCliente.trim()) {
                  setFormData({ ...formData, clientes: [...formData.clientes, novoCliente.trim()] });
                  setNovoCliente("");
                }
              }}
              className="bg-[#566E3D] hover:bg-[#566E3D]/90 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.clientes.map((cliente, index) => (
              <Badge key={index} variant="secondary" className="bg-teal-100 text-teal-800 flex items-center gap-1">
                {cliente}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, clientes: formData.clientes.filter((_, i) => i !== index) })}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Usinas - para Supervisão, Implantação e Conservação */}
      {(formData.tipo_obra === "supervisao" || formData.tipo_obra === "implantacao" || formData.tipo_obra === "conservacao") && (
        <div className="space-y-2">
          <Label>Usinas do Contrato</Label>
          <div className="flex gap-2">
            <Input
              value={novaUsina}
              onChange={(e) => setNovaUsina(e.target.value)}
              placeholder="Nome da usina"
              className="bg-white border-[#00233B]/20 text-[#00233B]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (novaUsina.trim()) {
                    setFormData({ ...formData, usinas: [...formData.usinas, novaUsina.trim()] });
                    setNovaUsina("");
                  }
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (novaUsina.trim()) {
                  setFormData({ ...formData, usinas: [...formData.usinas, novaUsina.trim()] });
                  setNovaUsina("");
                }
              }}
              className="bg-[#566E3D] hover:bg-[#566E3D]/90 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.usinas.map((usina, index) => (
              <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
                {usina}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, usinas: formData.usinas.filter((_, i) => i !== index) })}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Rodovias - para todos os tipos de obra */}
      <div className="space-y-2">
        <Label>Rodovias da Obra</Label>
        <div className="flex gap-2">
          <Input
            value={novaRodovia}
            onChange={(e) => setNovaRodovia(e.target.value)}
            placeholder="Nome da rodovia"
            className="bg-white border-[#00233B]/20 text-[#00233B]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (novaRodovia.trim()) {
                  setFormData({ ...formData, rodovias: [...formData.rodovias, novaRodovia.trim()] });
                  setNovaRodovia("");
                }
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              if (novaRodovia.trim()) {
                setFormData({ ...formData, rodovias: [...formData.rodovias, novaRodovia.trim()] });
                setNovaRodovia("");
              }
            }}
            className="bg-[#566E3D] hover:bg-[#566E3D]/90 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.rodovias.map((rodovia, index) => (
            <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1">
              {rodovia}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rodovias: formData.rodovias.filter((_, i) => i !== index) })}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-[#00233B]/20 text-[#00233B] hover:bg-[#00233B]/5">
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#00233B] hover:bg-[#00233B]/90 text-[#F2F1EF]">
          {obra ? "Atualizar Obra" : "Criar Obra"}
        </Button>
      </div>
    </form>
  );
});

ObraForm.displayName = 'ObraForm';

// Memoizar componente de card de regional
const RegionalCard = React.memo(({ regional, obras, users, projects, onEdit, onDelete, onObraAdded, canManage, isAdmin, statusFilter, isLaboratorista, setSelectedRegional }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isObraDialogOpen, setIsObraDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState(null);

  const obrasNaRegional = useMemo(() => {
    const filtered = obras.filter(obra => obra.regional_id === regional.id);
    if (statusFilter === 'all') return filtered;
    return filtered.filter(obra => obra.status === statusFilter);
  }, [obras, regional.id, statusFilter]);

  const projetosNaRegional = useMemo(() => {
    const regionalProjectIds = regional.project_ids || [];
    return projects.filter(p => regionalProjectIds.includes(p.id));
  }, [projects, regional.project_ids]);

  const laboratoristasCount = useMemo(() => 
    (regional.laboratoristas_responsaveis || []).length,
    [regional.laboratoristas_responsaveis]
  );

  const statusColorsRegional = useMemo(() => ({
    ativa: "bg-[#566E3D]/10 text-[#566E3D] border-[#566E3D]/30",
    inativa: "bg-[#800020]/10 text-[#800020] border-[#800020]/30"
  }), []);

  const statusColors = useMemo(() => ({
    planejamento: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    em_andamento: "bg-[#566E3D]/10 text-[#566E3D] border-[#566E3D]/30",
    concluida: "bg-[#00233B]/10 text-[#00233B] border-[#00233B]/30",
    pausada: "bg-amber-500/10 text-amber-700 border-amber-500/30"
  }), []);

  const tipoObraIcons = useMemo(() => ({
    supervisao: <HardHat className="w-3 h-3 text-blue-600" />,
    implantacao: <Construction className="w-3 h-3 text-green-600" />,
    conservacao: <Wrench className="w-3 h-3 text-amber-600" />,
    sondagem: <FileText className="w-3 h-3 text-purple-600" />,
    levantamentos: <FileText className="w-3 h-3 text-teal-600" />
  }), []);

  const tipoObraLabels = useMemo(() => ({
    supervisao: "Supervisão",
    implantacao: "Implantação",
    conservacao: "Conservação",
    sondagem: "Sondagem",
    levantamentos: "Levantamentos"
  }), []);

  const handleSaveObra = useCallback(async (obraData) => {
    try {
      const dataToSave = {
        ...obraData,
        regional_id: editingObra ? editingObra.regional_id : regional.id
      };

      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === "" || dataToSave[key] === null) {
          delete dataToSave[key];
        }
      });

      if (editingObra) {
        await Obra.update(editingObra.id, dataToSave);
        alert("Obra atualizada com sucesso!");
      } else {
        await Obra.create(dataToSave);
        alert("Obra criada com sucesso!");
      }
      
      setIsObraDialogOpen(false);
      setEditingObra(null);
      onObraAdded();
    } catch (error) {
      console.error("Erro ao salvar obra:", error);
      alert(`Erro ao salvar obra: ${error.message}`);
    }
  }, [editingObra, regional.id, onObraAdded]);

  const handleDeleteObra = useCallback(async (obraId) => {
    if (window.confirm("Tem certeza que deseja excluir esta obra?")) {
      try {
        await Obra.delete(obraId);
        onObraAdded();
      } catch (error) {
        console.error("Erro ao excluir obra:", error);
        alert("Erro ao excluir obra.");
      }
    }
  }, [onObraAdded]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-[#00233B]/10 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-[#00233B] line-clamp-1">
              {regional.nome}
            </CardTitle>
            <p className="text-sm text-[#00233B]/70">{regional.codigo}</p>
          </div>
          <Badge className={`${statusColorsRegional[regional.status] || statusColorsRegional.ativa} border`}>
            {regional.status || 'ativa'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {regional.cliente && (
            <div>
              <p className="text-sm font-medium text-[#00233B]/70">Cliente</p>
              <p className="text-sm text-[#00233B]">{regional.cliente}</p>
            </div>
          )}

          {regional.estado && (
            <div>
              <p className="text-sm font-medium text-[#00233B]/70">Estado</p>
              <p className="text-sm text-[#00233B]">{regional.estado}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div 
              className="flex items-center gap-1.5" 
              title={`${obrasNaRegional.length} obras`}
            >
              <ConstructionIcon className="w-4 h-4 text-[#566E3D] flex-shrink-0" />
              <span className="text-[#00233B] leading-none font-medium">{obrasNaRegional.length}</span>
            </div>
            <div 
              className="flex items-center gap-1.5" 
              title={`${projetosNaRegional.length} projetos`}
            >
              <FileText className="w-4 h-4 text-[#566E3D] flex-shrink-0" />
              <span className="text-[#00233B] leading-none font-medium">{projetosNaRegional.length}</span>
            </div>
            <div 
              className="flex items-center gap-1.5" 
              title={`${laboratoristasCount} laboratoristas`}
            >
              <UsersIcon className="w-4 h-4 text-[#566E3D] flex-shrink-0" />
              <span className="text-[#00233B] leading-none font-medium">{laboratoristasCount}</span>
            </div>
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 border-[#00233B]/20 text-[#00233B] hover:bg-[#00233B]/5">
                {isOpen ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {isOpen ? 'Ocultar' : 'Ver'} Obras ({obrasNaRegional.length})
              </Button>
            </CollapsibleTrigger>

            {canManage && !isLaboratorista && (
              <Dialog open={isObraDialogOpen} onOpenChange={setIsObraDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#00233B] hover:bg-[#00233B]/90 text-[#F2F1EF]">
                    <Plus className="w-4 h-4 mr-1 text-[#BFCF99]" />
                    Nova Obra
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F2F1EF]/95 backdrop-blur-lg border border-[#00233B]/20 text-[#00233B]">
                  <DialogHeader>
                    <DialogTitle className="text-[#00233B]">
                      {editingObra ? 'Editar Obra' : `Nova Obra - ${regional.nome}`}
                    </DialogTitle>
                  </DialogHeader>
                  <ObraForm
                    obra={editingObra}
                    regional={regional}
                    onSave={handleSaveObra}
                    onCancel={() => {
                      setIsObraDialogOpen(false);
                      setEditingObra(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <CollapsibleContent className="mt-4">
            {obrasNaRegional.length > 0 ? (
              <div className="space-y-2">
                {obrasNaRegional.map(obra => (
                  <div key={obra.id} className="p-3 bg-[#F2F1EF] rounded-lg border border-[#00233B]/10">
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <h4 className="font-medium text-[#00233B] truncate flex-shrink">{obra.name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`${statusColors[obra.status] || statusColors.planejamento} border flex-shrink-0`}>
                            {obra.status || 'planejamento'}
                          </Badge>
                          {obra.tipo_obra && (
                            <Badge variant="outline" className="flex items-center gap-1 border-[#00233B]/20 text-[#00233B] flex-shrink-0">
                              {tipoObraIcons[obra.tipo_obra]}
                              {tipoObraLabels[obra.tipo_obra] || obra.tipo_obra}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#00233B]/70 truncate">Contrato: {obra.code}</p>
                        {obra.location && (
                          <p className="text-xs text-[#00233B]/60 mt-1 truncate">{obra.location}</p>
                        )}
                        {obra.tipo_obra === "supervisao" && obra.empreiteiras && obra.empreiteiras.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-[#00233B]/60 mb-1">Empreiteiras:</p>
                            <div className="flex flex-wrap gap-1">
                              {obra.empreiteiras.map((emp, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  {emp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {obra.usinas && obra.usinas.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-[#00233B]/60 mb-1">Usinas:</p>
                            <div className="flex flex-wrap gap-1">
                              {obra.usinas.map((usina, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  {usina}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {obra.rodovias && obra.rodovias.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-[#00233B]/60 mb-1">Rodovias:</p>
                            <div className="flex flex-wrap gap-1">
                              {obra.rodovias.map((rodovia, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  {rodovia}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {canManage && !isLaboratorista && (
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingObra(obra);
                              setIsObraDialogOpen(true);
                            }}
                            className="text-[#00233B] hover:bg-[#00233B]/10 h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteObra(obra.id)}
                            className="text-[#800020] hover:text-[#800020] hover:bg-[#800020]/10 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[#00233B]/60">
                <ConstructionIcon className="w-8 h-8 text-[#00233B]/30 mx-auto mb-2" />
                <p className="text-sm">Nenhuma obra {statusFilter !== 'all' ? `com status "${statusFilter}"` : 'cadastrada'}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter className="py-3 border-t border-[#00233B]/10">
        <div className="w-full flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRegional(regional)}
              className="text-[#00233B] hover:bg-[#00233B]/10"
            >
              <Eye className="w-4 h-4 mr-1 text-[#566E3D]" />
              Ver Detalhes
            </Button>
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(regional)}
                  className="text-[#00233B] hover:bg-[#00233B]/10"
                >
                  <Edit className="w-4 h-4 mr-1 text-[#566E3D]" />
                  Editar
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(regional.id)}
                    className="text-[#800020] hover:text-[#800020] hover:bg-[#800020]/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
});

RegionalCard.displayName = 'RegionalCard';

export default function RegionaisPage() {
  const [regionais, setRegionais] = useState([]);
  const [obras, setObras] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRegional, setEditingRegional] = useState(null);
  const [selectedRegional, setSelectedRegional] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const userAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const isAdmin = userAccessLevel === 'admin';
  const isSalaTecnica = userAccessLevel === 'sala_tecnica_afirmaevias';
  const isGestorContrato = userAccessLevel === 'gestor_contrato';
  const isLaboratorista = userAccessLevel === 'user';
  const canManage = isAdmin || isSalaTecnica || isGestorContrato;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const currentUserAccessLevel = userData.access_level || (userData.role === 'admin' ? 'admin' : 'user');
      
      console.log('🔍 [DEBUG] User access level:', currentUserAccessLevel);
      console.log('🔍 [DEBUG] User email:', userData.email);

      // Carregar dados básicos (regionais, obras, projects)
      const [regionaisData, obrasData, projectsData] = await Promise.all([
        Regional.list("-created_date", 100),
        Obra.list(),
        Project.list()
      ]);

      console.log('🔍 [DEBUG] Total regionais carregadas:', regionaisData.length);
      regionaisData.forEach(r => {
        console.log(`🔍 [DEBUG] Regional: ${r.nome}, Laboratoristas:`, r.laboratoristas_responsaveis || []);
      });

      // Carregar users apenas se não for laboratorista (eles não têm permissão)
      let usersData = [];
      if (currentUserAccessLevel !== 'user') {
        try {
          usersData = await User.list();
        } catch (error) {
          console.warn('Sem permissão para listar usuários:', error);
        }
      }

      // Filtrar regionais baseado no nível de acesso
      let regionaisFiltradas = regionaisData;

      if (currentUserAccessLevel === 'gestor_contrato') {
        // Gestor vê apenas as regionais onde é o gestor responsável
        regionaisFiltradas = regionaisData.filter(regional => {
          const gestores = regional.gestores_contrato_responsaveis || [regional.gestor_contrato_responsavel].filter(Boolean);
          return gestores.some(email => email?.toLowerCase() === userData.email.toLowerCase());
        });
      } else if (currentUserAccessLevel === 'sala_tecnica_afirmaevias') {
        // Sala técnica vê apenas as regionais onde está vinculada
        regionaisFiltradas = regionaisData.filter(regional => {
          const salas = regional.salas_tecnicas_responsaveis || [];
          return salas.some(email => email.toLowerCase() === userData.email.toLowerCase());
        });
      } else if (currentUserAccessLevel === 'user') {
        // Laboratorista vê apenas a regional onde está alocado
        console.log('🔍 [DEBUG] Filtrando regionais para laboratorista...');
        regionaisFiltradas = regionaisData.filter(regional => {
          const laboratoristas = regional.laboratoristas_responsaveis || [];
          const match = laboratoristas.some(email => email.toLowerCase() === userData.email.toLowerCase());
          console.log(`🔍 [DEBUG] Regional: ${regional.nome}, Match:`, match);
          return match;
        });
        console.log('🔍 [DEBUG] Regionais filtradas para laboratorista:', regionaisFiltradas.length);
      }
      
      console.log('🔍 [DEBUG] Regionais finais:', regionaisFiltradas.length);
      
      setRegionais(regionaisFiltradas);
      setObras(obrasData);
      setUsers(usersData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveRegional = useCallback(async (regionalData) => {
    try {
      if (editingRegional) {
        await Regional.update(editingRegional.id, regionalData);
      } else {
        await Regional.create(regionalData);
      }
      setIsFormOpen(false);
      setEditingRegional(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar regional:", error);
      alert("Erro ao salvar regional.");
    }
  }, [editingRegional, loadData]);

  const handleEdit = useCallback((regional) => {
    setEditingRegional(regional);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta regional?")) {
      try {
        await Regional.delete(id);
        loadData();
      } catch (error) {
        console.error("Erro ao excluir regional:", error);
        alert("Erro ao excluir regional.");
      }
    }
  }, [loadData]);

  const filteredRegionais = useMemo(() => {
    return regionais.filter(regional =>
      regional.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regional.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [regionais, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F2F1EF]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/40" />
          <p className="text-[#00233B]/60 mt-2">Carregando regionais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#F2F1EF] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00233B] flex items-center gap-3">
              <MapPin className="w-8 h-8 text-[#566E3D]" />
              Regionais
            </h1>
            <p className="text-[#00233B]/80 mt-2">
              {isAdmin ? "Gerencie as regionais e suas obras" : "Visualize as regionais e obras"}
            </p>
          </div>
          {canManage && !isLaboratorista && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#00233B] hover:bg-[#00233B]/90 text-[#F2F1EF]">
                  <Plus className="w-4 h-4 mr-2 text-[#BFCF99]" />
                  Nova Regional
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F2F1EF]/95 backdrop-blur-lg border border-[#00233B]/20 text-[#00233B]">
                <DialogHeader>
                  <DialogTitle className="text-[#00233B]">
                    {editingRegional ? 'Editar Regional' : 'Nova Regional'}
                  </DialogTitle>
                </DialogHeader>
                <RegionalForm
                  regional={editingRegional}
                  users={users}
                  projects={projects}
                  onSave={handleSaveRegional}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingRegional(null);
                  }}
                  isAdmin={isAdmin}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-[#00233B]/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#00233B]/60" />
                <Input
                  placeholder="Pesquisar regionais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-[#00233B]/20 text-[#00233B]"
                />
              </div>
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-[#00233B]/20 rounded-md bg-white text-sm text-[#00233B]"
                >
                  <option value="all">Todas as Obras</option>
                  <option value="planejamento">Planejamento</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="pausada">Pausada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegionais.map((regional) => (
            <RegionalCard
              key={regional.id}
              regional={regional}
              obras={obras}
              users={users}
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onObraAdded={loadData}
              canManage={canManage}
              isAdmin={isAdmin}
              statusFilter={statusFilter}
              isLaboratorista={isLaboratorista}
              setSelectedRegional={setSelectedRegional}
            />
          ))}
        </div>

        {filteredRegionais.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border border-[#00233B]/10 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-[#00233B]/10 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-[#00233B]/30" />
              </div>
              <h3 className="text-lg font-semibold text-[#00233B] mb-2">
                Nenhuma regional encontrada
              </h3>
              <p className="text-[#00233B]/70 text-center">
                {searchTerm ? 'Tente ajustar seus filtros de pesquisa.' : 'Comece criando sua primeira regional.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Regional Details Dialog */}
      <Dialog open={!!selectedRegional} onOpenChange={(open) => !open && setSelectedRegional(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F2F1EF]/95 backdrop-blur-lg border border-[#00233B]/20 text-[#00233B]">
          <DialogHeader>
            <DialogTitle className="text-[#00233B]">Detalhes da Regional</DialogTitle>
          </DialogHeader>
          {selectedRegional && (
            <RegionalDetails regional={selectedRegional} users={users} projects={projects} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}