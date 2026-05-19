import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProjectFormBasicInfo({
  formData,
  regionaisFiltradas,
  project,
  onTipoProjetoChange,
  onInputChange
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tipo_projeto">Tipo de Projeto *</Label>
          <Select 
            value={formData.tipo_projeto} 
            onValueChange={onTipoProjetoChange}
            disabled={!!project}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAUQ">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">CAUQ</Badge>
                  <span>Concreto Asfáltico Usinado a Quente</span>
                </div>
              </SelectItem>
              <SelectItem value="MRAF">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">MRAF</Badge>
                  <span>Micro Revestimento Asfáltico a Frio</span>
                </div>
              </SelectItem>
              <SelectItem value="BGS">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500">BGS</Badge>
                  <span>Brita Graduada Simples</span>
                </div>
              </SelectItem>
              <SelectItem value="CARTA_TRACO_CONCRETO">
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-500">CARTA TRAÇO</Badge>
                  <span>Carta Traço de Concreto</span>
                </div>
              </SelectItem>
              <SelectItem value="CAMADAS_GRANULARES">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500">CAMADAS GRANULARES</Badge>
                  <span>Camadas Granulares</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {!!project && (
            <p className="text-xs text-slate-500 mt-1">
              O tipo de projeto não pode ser alterado após a criação
            </p>
          )}
        </div>

        {regionaisFiltradas.length > 0 && (
          <div>
            <Label htmlFor="regional_id">Regional *</Label>
            <Select 
              value={formData.regional_id} 
              onValueChange={(value) => onInputChange('regional_id', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a regional" />
              </SelectTrigger>
              <SelectContent>
                {regionaisFiltradas.map(regional => (
                  <SelectItem key={regional.id} value={regional.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#BFCF99]/30 text-[#00233B]">
                        {regional.codigo}
                      </Badge>
                      <span>{regional.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              Selecione a regional à qual este projeto será vinculado
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="client">Cliente *</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => onInputChange("client", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onInputChange("location", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => onInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}