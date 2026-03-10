import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { DiarioObra as DiarioObraEntity } from "@/entities/DiarioObra";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";



// getInitialFormData should be outside component to avoid re-creation on every render
const getInitialFormData = () => ({
  obra_id: "",
  data: new Date().toISOString().split('T')[0],
  jornada: {
    horario_inicio: "",
    horario_fim: ""
  },
  tipo_local: "campo",
  usina_selecionada: "",
  rodovia: "",
  trecho: "",
  empreiteira: "",
  condicoes_climaticas: "ensolarado",
  temperatura: "",
  atividades_realizadas: "",
  observacoes: "",
  acoes_corretivas_realizado: null,
  acoes_corretivas_descricao: "",
  efetivo_obra_ativo: false,
  efetivo_maquinas: {
    motoniveladora: 0, pa_carregadeira: 0, retroescavadeira: 0, escavadeira_hidraulica: 0,
    mini_carregadeira: 0, extrusora: 0, caminhao_prancha: 0, caminhao_munck: 0,
    caminhao_sinalizacao: 0, caminhao_pipa: 0, caminhao_basculante: 0, caminhao_cimento: 0,
    caminhao_viga: 0, caminhao_espargidor: 0, recicladora: 0, vibro_acabadora: 0,
    rolo_carneiro: 0, rolo_liso: 0, rolo_pneu: 0, tanque_combustivel: 0, comboio: 0,
    onibus: 0, trator_grade: 0, trator_esteira: 0, veiculo_leve: 0, placa_vibratoria: 0
  },
  efetivo_colaboradores: {
    encarregado: 0, greidista: 0, operadores: 0, motorista: 0, pedreiro: 0,
    armador: 0, carpinteiro: 0, ajudante: 0, topografo: 0, aux_topografia: 0,
    laboratorista: 0, aux_laboratorio: 0, spoter: 0, seguranca: 0, apontador: 0,
    pintor: 0, eletricista: 0
  },
  fotos: [],
  cliente: "",
  approved: null,
  rejection_reason: null,
  created_by: "",
  checklist_veiculo_ativo: false,
  checklist_veiculo: {
    nome_condutor: "",
    tipo_veiculo: "passeio",
    veiculo: "",
    placa: "",
    empresa: "",
    hodometro: "",
    areas_afetadas: "",
    condicoes_gerais: {
      limpeza_externa: "bom",
      limpeza_interna: "bom",
      pneus: "bom",
      estepe: "bom",
      cacamba: "bom"
    },
    luzes_traseiras: {
      direita: { da_placa: "sim", luz: "sim", luz_re: "sim", luz_freio: "sim", seta: "sim" },
      esquerda: { luz: "sim", luz_re: "sim", luz_freio: "sim", seta: "sim" }
    },
    luzes_dianteiras: {
      direita: { farol_alto: "sim", farol_baixo: "sim", seta: "sim", neblina: "sim" },
      esquerda: { farol_alto: "sim", farol_baixo: "sim", seta: "sim", neblina: "sim" }
    },
    seguranca: {
      alarme: "sim", buzina: "sim", chave_roda: "sim", cintos: "sim", documentos: "sim",
      extintor: "sim", limpadores: "sim", macaco: "sim", painel: "sim",
      retrovisor_interno: "sim", retrovisor_direito: "sim", retrovisor_esquerdo: "sim",
      travas: "sim", triangulo: "sim"
    },
    motor: {
      acelerador: "sim", agua_limpador: "sim", agua_radiador: "sim", embreagem: "sim",
      freio: "sim", freio_mao: "sim", oleo_freio: "sim", oleo_moto: "sim", tanque_partida: "sim"
    },
    observacoes: ""
  }
});

// DiarioForm is now a controlled component, receiving all data and handlers as props
const DiarioForm = ({
  formData,
  handleChange,
  handleFileChange,
  handleRemovePhoto,
  handleSubmit,
  onCancel,
  obras,
  regionais,
  user,
  loadingUpload,
  selectedFileNames,
  uploadProgress,
  isEditable,
  isApproved,
  rejectionReason,
  isCreatingNew,
  status
}) => {
  // Calculate selected obra and regional here for display purposes
  const obraSelecionada = obras.find(o => o.id === formData.obra_id);
  const regionalSelecionada = obraSelecionada ? regionais.find(r => r.id === obraSelecionada.regional_id) : null;
  const isObraClienteType = obraSelecionada?.tipo_obra === 'levantamentos' || obraSelecionada?.tipo_obra === 'sondagem';

  // Effect to auto-fill cliente when obra changes
  React.useEffect(() => {
    if (regionalSelecionada && regionalSelecionada.cliente !== formData.cliente) {
      handleChange('cliente', regionalSelecionada.cliente || "");
    }
    // Limpar rodovia ao trocar de obra
    handleChange('rodovia', "");
  }, [obraSelecionada?.id]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'rascunho' && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
                <p className="font-semibold text-blue-800">Em Rascunho</p>
                <p className="text-sm text-blue-700">Este registro ainda está em edição e não será visível aos gestores até que você o finalize.</p>
            </div>
        </div>
      )}

      {rejectionReason && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{rejectionReason}</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seleção de Obra */}
        <div className="space-y-2">
          <Label htmlFor="obra_id">Obra *</Label>
          <Select
            value={formData.obra_id || ""}
            onValueChange={(value) => handleChange('obra_id', value)}
            required
            disabled={!isEditable || isApproved}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a obra" />
            </SelectTrigger>
            <SelectContent>
              {obras.map(obra => {
                const regional = regionais.find(r => r.id === obra.regional_id);
                return (
                  <SelectItem key={obra.id} value={obra.id}>
                    {obra.name} - {obra.code}
                    {regional && ` (${regional.nome})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        {/* Display regional and client info if an obra and regional are selected */}
        {regionalSelecionada && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-1 text-sm">
              <p className="text-blue-800">
                <strong>📍 Regional:</strong> {regionalSelecionada.nome} - {regionalSelecionada.codigo}
              </p>
              {regionalSelecionada.cliente && (
                <p className="text-blue-800">
                  <strong>👤 Cliente:</strong> {regionalSelecionada.cliente}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            name="data"
            type="date"
            value={formData.data}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
            required
            disabled={!isEditable || isApproved}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horario_inicio">Horário Início *</Label>
          <Input
            id="horario_inicio"
            type="time"
            value={formData.jornada?.horario_inicio || ""}
            onChange={(e) => handleChange('jornada', { ...formData.jornada, horario_inicio: e.target.value })}
            required
            disabled={!isEditable || isApproved}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horario_fim">Horário Fim *</Label>
          <Input
            id="horario_fim"
            type="time"
            value={formData.jornada?.horario_fim || ""}
            onChange={(e) => handleChange('jornada', { ...formData.jornada, horario_fim: e.target.value })}
            required
            disabled={!isEditable || isApproved}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Local do Registro *</Label>
        <div className="flex items-center space-x-4">
            <label className="flex items-center">
                <input type="radio" name="tipo_local" value="campo" checked={formData.tipo_local === 'campo'} onChange={(e) => handleChange(e.target.name, e.target.value)} disabled={!isEditable || isApproved} className="mr-2"/>
                Campo
            </label>
            <label className="flex items-center">
                <input type="radio" name="tipo_local" value="usina" checked={formData.tipo_local === 'usina'} onChange={(e) => handleChange(e.target.name, e.target.value)} disabled={!isEditable || isApproved} className="mr-2"/>
                Usina
            </label>
            <label className="flex items-center">
                <input type="radio" name="tipo_local" value="escritorio" checked={formData.tipo_local === 'escritorio'} onChange={(e) => handleChange(e.target.name, e.target.value)} disabled={!isEditable || isApproved} className="mr-2"/>
                Escritório
            </label>
        </div>
      </div>

      {/* Campos ocultados para Escritório */}
      {formData.tipo_local !== 'escritorio' && (
        <>
          {/* Campo Empreiteira - Obrigatório */}
          <div className="space-y-2">
            <Label htmlFor="empreiteira">Empreiteira *</Label>
            <Select
              value={formData.empreiteira || ""}
              onValueChange={(value) => handleChange('empreiteira', value)}
              required
              disabled={!isEditable || isApproved}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empreiteira" />
              </SelectTrigger>
              <SelectContent>
                {obraSelecionada?.empreiteiras && obraSelecionada.empreiteiras.length > 0 ? (
                  obraSelecionada.empreiteiras.map(emp => (
                    <SelectItem key={emp} value={emp}>
                      {emp}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={null} disabled>Nenhuma empreiteira cadastrada</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.tipo_local === 'campo' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rodovia">Rodovia *</Label>
                {obraSelecionada?.rodovias && obraSelecionada.rodovias.length > 0 ? (
                  <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto bg-background">
                    {obraSelecionada.rodovias.map(rodovia => {
                      const selected = (formData.rodovia || '').split(' - ').map(r => r.trim()).filter(Boolean);
                      const isChecked = selected.includes(rodovia);
                      return (
                        <label key={rodovia} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-slate-50 ${!isEditable || isApproved ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newSelected = isChecked
                                ? selected.filter(r => r !== rodovia)
                                : [...selected, rodovia];
                              handleChange('rodovia', newSelected.join(' - '));
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{rodovia}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border rounded-md p-2 text-sm text-gray-500">Nenhuma rodovia cadastrada</div>
                )}
                {formData.rodovia && (
                  <p className="text-xs text-gray-500">Selecionadas: {formData.rodovia}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trecho">Trecho *</Label>
                <Input 
                  id="trecho" 
                  name="trecho" 
                  value={formData.trecho} 
                  onChange={(e) => handleChange(e.target.name, e.target.value)} 
                  placeholder="Ex: km 10 ao km 15" 
                  required
                  disabled={!isEditable || isApproved} 
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="usina_selecionada">Usina *</Label>
              <Select
                value={formData.usina_selecionada || ""}
                onValueChange={(value) => handleChange('usina_selecionada', value)}
                required
                disabled={!isEditable || isApproved}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a usina" />
                </SelectTrigger>
                <SelectContent>
                  {obraSelecionada?.usinas && obraSelecionada.usinas.length > 0 ? (
                    obraSelecionada.usinas.map(usina => (
                      <SelectItem key={usina} value={usina}>
                        {usina}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={null} disabled>Nenhuma usina cadastrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condicoes_climaticas">Condições Climáticas *</Label>
              <select id="condicoes_climaticas" name="condicoes_climaticas" value={formData.condicoes_climaticas} onChange={(e) => handleChange(e.target.name, e.target.value)} required disabled={!isEditable || isApproved} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="ensolarado">Ensolarado</option>
                <option value="nublado">Nublado</option>
                <option value="chuvoso">Chuvoso</option>
                <option value="garoa">Garoa</option>
                <option value="vento_forte">Vento Forte</option>
                <option value="neblina">Neblina</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperatura">Temperatura (°C)</Label>
              <Input id="temperatura" name="temperatura" type="number" value={formData.temperatura} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="Ex: 25" disabled={!isEditable || isApproved} />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="atividades_realizadas">Atividades Realizadas *</Label>
        <Textarea
          id="atividades_realizadas"
          name="atividades_realizadas"
          value={formData.atividades_realizadas}
          onChange={(e) => handleChange(e.target.name, e.target.value)}
          placeholder="Descreva as atividades realizadas no dia."
          rows={4}
          required
          disabled={!isEditable || isApproved}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações Gerais</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleChange(e.target.name, e.target.value)}
          placeholder="Outras observações importantes."
          rows={3}
          disabled={!isEditable || isApproved}
        />
      </div>

      {/* Ações Corretivas, Efetivo, Checklist, Fotos - ocultos para Escritório */}
      {formData.tipo_local !== 'escritorio' && (
      <><Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg">Ações Corretivas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Foram realizadas ações corretivas? *</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  checked={formData.acoes_corretivas_realizado === true}
                  onChange={() => handleChange('acoes_corretivas_realizado', true)}
                  disabled={!isEditable || isApproved}
                  className="mr-2"
                />
                Sim
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  checked={formData.acoes_corretivas_realizado === false}
                  onChange={() => {
                    handleChange('acoes_corretivas_realizado', false);
                    handleChange('acoes_corretivas_descricao', '');
                  }}
                  disabled={!isEditable || isApproved}
                  className="mr-2"
                />
                Não
              </label>
            </div>
          </div>

          {formData.acoes_corretivas_realizado === true && (
            <div className="space-y-2 p-4 border-2 border-orange-300 rounded-lg bg-white">
              <Label htmlFor="acoes_corretivas_descricao">Descrição das Ações Corretivas *</Label>
              <Textarea
                id="acoes_corretivas_descricao"
                name="acoes_corretivas_descricao"
                value={formData.acoes_corretivas_descricao || ""}
                onChange={(e) => handleChange('acoes_corretivas_descricao', e.target.value)}
                placeholder="Descreva detalhadamente as ações corretivas que foram realizadas..."
                rows={4}
                required={formData.acoes_corretivas_realizado === true}
                disabled={!isEditable || isApproved}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Efetivo de Obra */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg">Efetivo de Obra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preencher Efetivo de Obra?</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  checked={formData.efetivo_obra_ativo === true}
                  onChange={() => handleChange('efetivo_obra_ativo', true)}
                  disabled={!isEditable || isApproved}
                  className="mr-2"
                />
                Sim
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  checked={formData.efetivo_obra_ativo === false}
                  onChange={() => handleChange('efetivo_obra_ativo', false)}
                  disabled={!isEditable || isApproved}
                  className="mr-2"
                />
                Não
              </label>
            </div>
          </div>

          {formData.efetivo_obra_ativo && (
            <div className="space-y-6 p-4 border-2 border-green-300 rounded-lg bg-white">
              {/* Máquinas Operantes */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Efetivo de Máquinas Operantes</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'motoniveladora', label: 'Motoniveladora' },
                    { key: 'caminhao_munck', label: 'Caminhão Munck' },
                    { key: 'recicladora', label: 'Recicladora' },
                    { key: 'onibus', label: 'Ônibus' },
                    { key: 'pa_carregadeira', label: 'Pá Carregadeira' },
                    { key: 'caminhao_sinalizacao', label: 'Caminhão Sinalização' },
                    { key: 'vibro_acabadora', label: 'Vibro Acabadora' },
                    { key: 'trator_grade', label: 'Trator de Grade' },
                    { key: 'retroescavadeira', label: 'Retroescavadeira' },
                    { key: 'caminhao_pipa', label: 'Caminhão Pipa' },
                    { key: 'rolo_carneiro', label: 'Rolo Carneiro' },
                    { key: 'trator_esteira', label: 'Trator de Esteira' },
                    { key: 'escavadeira_hidraulica', label: 'Escavadeira Hidráulica' },
                    { key: 'caminhao_basculante', label: 'Caminhão Basculante' },
                    { key: 'rolo_liso', label: 'Rolo Liso' },
                    { key: 'veiculo_leve', label: 'Veículo Leve' },
                    { key: 'mini_carregadeira', label: 'Mini Carregadeira' },
                    { key: 'caminhao_cimento', label: 'Caminhão Cimento' },
                    { key: 'rolo_pneu', label: 'Rolo Pneu' },
                    { key: 'placa_vibratoria', label: 'Placa Vibratória' },
                    { key: 'extrusora', label: 'Extrusora' },
                    { key: 'caminhao_viga', label: 'Caminhão Viga' },
                    { key: 'tanque_combustivel', label: 'Tanque Combustível' },
                    { key: 'caminhao_prancha', label: 'Caminhão Prancha' },
                    { key: 'caminhao_espargidor', label: 'Caminhão Espargidor' },
                    { key: 'comboio', label: 'Comboio' }
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-sm">{item.label}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.efetivo_maquinas?.[item.key] || 0}
                        onChange={(e) => handleChange('efetivo_maquinas', {
                          ...formData.efetivo_maquinas,
                          [item.key]: parseInt(e.target.value) || 0
                        })}
                        disabled={!isEditable || isApproved}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Colaboradores */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Efetivo de Colaboradores</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'encarregado', label: 'Encarregado' },
                    { key: 'pedreiro', label: 'Pedreiro' },
                    { key: 'topografo', label: 'Topógrafo' },
                    { key: 'spoter', label: 'Spoter' },
                    { key: 'greidista', label: 'Greidista' },
                    { key: 'armador', label: 'Armador' },
                    { key: 'aux_topografia', label: 'Aux. Topografia' },
                    { key: 'seguranca', label: 'Segurança' },
                    { key: 'operadores', label: 'Operadores' },
                    { key: 'carpinteiro', label: 'Carpinteiro' },
                    { key: 'laboratorista', label: 'Laboratorista' },
                    { key: 'apontador', label: 'Apontador' },
                    { key: 'motorista', label: 'Motorista' },
                    { key: 'ajudante', label: 'Ajudante' },
                    { key: 'aux_laboratorio', label: 'Aux. Laboratório' },
                    { key: 'pintor', label: 'Pintor' },
                    { key: 'eletricista', label: 'Eletricista' }
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-sm">{item.label}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.efetivo_colaboradores?.[item.key] || 0}
                        onChange={(e) => handleChange('efetivo_colaboradores', {
                          ...formData.efetivo_colaboradores,
                          [item.key]: parseInt(e.target.value) || 0
                        })}
                        disabled={!isEditable || isApproved}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist de Veículo */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Checklist de Veículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preencher Checklist de Veículo? *</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  checked={formData.checklist_veiculo_ativo === true}
                  onChange={() => handleChange('checklist_veiculo_ativo', true)}
                  disabled={!isEditable || isApproved}
                  className="mr-2"
                />
                Sim
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  checked={formData.checklist_veiculo_ativo === false}
                  onChange={() => handleChange('checklist_veiculo_ativo', false)}
                  disabled={!isEditable || isApproved}
                  className="mr-2"
                />
                Não
              </label>
            </div>
          </div>

          {formData.checklist_veiculo_ativo && (
            <div className="space-y-4 mt-4 p-4 border-2 border-blue-200 rounded-lg bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Condutor *</Label>
                  <Input
                    value={formData.checklist_veiculo?.nome_condutor || ""}
                    onChange={(e) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, nome_condutor: e.target.value })}
                    disabled={!isEditable || isApproved}
                    required={formData.checklist_veiculo_ativo}
                  />
                </div>
                <div>
                  <Label>Tipo de Veículo *</Label>
                  <Select
                    value={formData.checklist_veiculo?.tipo_veiculo || "passeio"}
                    onValueChange={(value) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, tipo_veiculo: value })}
                    disabled={!isEditable || isApproved}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passeio">Veículo de Passeio</SelectItem>
                      <SelectItem value="picape">Picape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Veículo (Modelo) *</Label>
                  <Input
                    value={formData.checklist_veiculo?.veiculo || ""}
                    onChange={(e) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, veiculo: e.target.value })}
                    disabled={!isEditable || isApproved}
                    placeholder="Ex: Toyota Corolla"
                    required={formData.checklist_veiculo_ativo}
                  />
                </div>
                <div>
                  <Label>Placa *</Label>
                  <Input
                    value={formData.checklist_veiculo?.placa || ""}
                    onChange={(e) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, placa: e.target.value })}
                    disabled={!isEditable || isApproved}
                    placeholder="Ex: ABC-1234"
                    required={formData.checklist_veiculo_ativo}
                  />
                </div>
                <div>
                  <Label>Empresa *</Label>
                  <Input
                    value={formData.checklist_veiculo?.empresa || ""}
                    onChange={(e) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, empresa: e.target.value })}
                    disabled={!isEditable || isApproved}
                    required={formData.checklist_veiculo_ativo}
                  />
                </div>
                <div>
                  <Label>Hodômetro *</Label>
                  <Input
                    value={formData.checklist_veiculo?.hodometro || ""}
                    onChange={(e) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, hodometro: e.target.value })}
                    disabled={!isEditable || isApproved}
                    placeholder="Ex: 45.230 km"
                    required={formData.checklist_veiculo_ativo}
                  />
                </div>
              </div>

              <div>
                <Label>Áreas Afetadas do Veículo</Label>
                <Textarea
                  value={formData.checklist_veiculo?.areas_afetadas || ""}
                  onChange={(e) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, areas_afetadas: e.target.value })}
                  disabled={!isEditable || isApproved}
                  rows={2}
                  placeholder="Descreva áreas com danos, amassados ou arranhões..."
                />
              </div>

              <div>
                <Label className="font-semibold">Condições Gerais</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                  {[
                    { key: 'limpeza_externa', label: 'Limpeza Externa' },
                    { key: 'limpeza_interna', label: 'Limpeza Interna' },
                    { key: 'pneus', label: 'Pneus' },
                    { key: 'estepe', label: 'Estepe' },
                    ...(formData.checklist_veiculo?.tipo_veiculo === 'picape' ? [{ key: 'cacamba', label: 'Caçamba' }] : [])
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-xs">{item.label}</Label>
                      <select
                        value={formData.checklist_veiculo?.condicoes_gerais?.[item.key] || "bom"}
                        onChange={(e) => handleChange('checklist_veiculo', {
                          ...formData.checklist_veiculo,
                          condicoes_gerais: { ...formData.checklist_veiculo.condicoes_gerais, [item.key]: e.target.value }
                        })}
                        disabled={!isEditable || isApproved}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="bom">Bom</option>
                        <option value="medio">Médio</option>
                        <option value="ruim">Ruim</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Luzes Traseiras */}
              <div className="space-y-3">
                <Label className="font-semibold text-base">Luzes Traseiras</Label>
                
                {/* Direita */}
                <div className="border rounded p-3 bg-blue-50">
                  <Label className="font-semibold text-sm mb-2 block">Direita</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { key: 'da_placa', label: 'Da placa' },
                      { key: 'luz', label: 'Luz' },
                      { key: 'luz_re', label: 'Luz de ré' },
                      { key: 'luz_freio', label: 'Luz de freio' },
                      { key: 'seta', label: 'Seta' }
                    ].map(item => (
                      <div key={item.key}>
                        <Label className="text-xs">{item.label}</Label>
                        <select
                          value={formData.checklist_veiculo?.luzes_traseiras?.direita?.[item.key] || "sim"}
                          onChange={(e) => handleChange('checklist_veiculo', {
                            ...formData.checklist_veiculo,
                            luzes_traseiras: { 
                              ...formData.checklist_veiculo.luzes_traseiras, 
                              direita: { ...formData.checklist_veiculo.luzes_traseiras.direita, [item.key]: e.target.value }
                            }
                          })}
                          disabled={!isEditable || isApproved}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                          <option value="na">N/A</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Esquerda */}
                <div className="border rounded p-3 bg-blue-50">
                  <Label className="font-semibold text-sm mb-2 block">Esquerda</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'luz', label: 'Luz' },
                      { key: 'luz_re', label: 'Luz de ré' },
                      { key: 'luz_freio', label: 'Luz de freio' },
                      { key: 'seta', label: 'Seta' }
                    ].map(item => (
                      <div key={item.key}>
                        <Label className="text-xs">{item.label}</Label>
                        <select
                          value={formData.checklist_veiculo?.luzes_traseiras?.esquerda?.[item.key] || "sim"}
                          onChange={(e) => handleChange('checklist_veiculo', {
                            ...formData.checklist_veiculo,
                            luzes_traseiras: { 
                              ...formData.checklist_veiculo.luzes_traseiras, 
                              esquerda: { ...formData.checklist_veiculo.luzes_traseiras.esquerda, [item.key]: e.target.value }
                            }
                          })}
                          disabled={!isEditable || isApproved}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                          <option value="na">N/A</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Luzes Dianteiras */}
              <div className="space-y-3">
                <Label className="font-semibold text-base">Luzes Dianteiras</Label>
                
                {/* Direita */}
                <div className="border rounded p-3 bg-green-50">
                  <Label className="font-semibold text-sm mb-2 block">Direita</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'farol_alto', label: 'Farol alto' },
                      { key: 'farol_baixo', label: 'Farol baixo' },
                      { key: 'seta', label: 'Seta' },
                      { key: 'neblina', label: 'Neblina' }
                    ].map(item => (
                      <div key={item.key}>
                        <Label className="text-xs">{item.label}</Label>
                        <select
                          value={formData.checklist_veiculo?.luzes_dianteiras?.direita?.[item.key] || "sim"}
                          onChange={(e) => handleChange('checklist_veiculo', {
                            ...formData.checklist_veiculo,
                            luzes_dianteiras: { 
                              ...formData.checklist_veiculo.luzes_dianteiras, 
                              direita: { ...formData.checklist_veiculo.luzes_dianteiras.direita, [item.key]: e.target.value }
                            }
                          })}
                          disabled={!isEditable || isApproved}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                          <option value="na">N/A</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Esquerda */}
                <div className="border rounded p-3 bg-green-50">
                  <Label className="font-semibold text-sm mb-2 block">Esquerda</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'farol_alto', label: 'Farol alto' },
                      { key: 'farol_baixo', label: 'Farol baixo' },
                      { key: 'seta', label: 'Seta' },
                      { key: 'neblina', label: 'Neblina' }
                    ].map(item => (
                      <div key={item.key}>
                        <Label className="text-xs">{item.label}</Label>
                        <select
                          value={formData.checklist_veiculo?.luzes_dianteiras?.esquerda?.[item.key] || "sim"}
                          onChange={(e) => handleChange('checklist_veiculo', {
                            ...formData.checklist_veiculo,
                            luzes_dianteiras: { 
                              ...formData.checklist_veiculo.luzes_dianteiras, 
                              esquerda: { ...formData.checklist_veiculo.luzes_dianteiras.esquerda, [item.key]: e.target.value }
                            }
                          })}
                          disabled={!isEditable || isApproved}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                          <option value="na">N/A</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Segurança */}
              <div>
                <Label className="font-semibold text-base">Segurança</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {[
                    { key: 'alarme', label: 'Alarme' },
                    { key: 'buzina', label: 'Buzina' },
                    { key: 'chave_roda', label: 'Chave de Roda' },
                    { key: 'cintos', label: 'Cintos' },
                    { key: 'documentos', label: 'Documentos' },
                    { key: 'extintor', label: 'Extintor' },
                    { key: 'limpadores', label: 'Limpadores' },
                    { key: 'macaco', label: 'Macaco' },
                    { key: 'painel', label: 'Painel' },
                    { key: 'retrovisor_interno', label: 'Retrovisor Interno' },
                    { key: 'retrovisor_direito', label: 'Retrovisor Direito' },
                    { key: 'retrovisor_esquerdo', label: 'Retrovisor Esquerdo' },
                    { key: 'travas', label: 'Travas' },
                    { key: 'triangulo', label: 'Triângulo' }
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-xs">{item.label}</Label>
                      <select
                        value={formData.checklist_veiculo?.seguranca?.[item.key] || "sim"}
                        onChange={(e) => handleChange('checklist_veiculo', {
                          ...formData.checklist_veiculo,
                          seguranca: { ...formData.checklist_veiculo.seguranca, [item.key]: e.target.value }
                        })}
                        disabled={!isEditable || isApproved}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                        <option value="na">N/A</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motor */}
              <div>
                <Label className="font-semibold text-base">Motor</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {[
                    { key: 'acelerador', label: 'Acelerador' },
                    { key: 'agua_limpador', label: 'Água do limpador' },
                    { key: 'agua_radiador', label: 'Água do radiador' },
                    { key: 'embreagem', label: 'Embreagem' },
                    { key: 'freio', label: 'Freio' },
                    { key: 'freio_mao', label: 'Freio de mão' },
                    { key: 'oleo_freio', label: 'Óleo do freio' },
                    { key: 'oleo_moto', label: 'Óleo do moto' },
                    { key: 'tanque_partida', label: 'Tanque de partida' }
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-xs">{item.label}</Label>
                      <select
                        value={formData.checklist_veiculo?.motor?.[item.key] || "sim"}
                        onChange={(e) => handleChange('checklist_veiculo', {
                          ...formData.checklist_veiculo,
                          motor: { ...formData.checklist_veiculo.motor, [item.key]: e.target.value }
                        })}
                        disabled={!isEditable || isApproved}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                        <option value="na">N/A</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Observações do Veículo</Label>
                <Textarea
                  value={formData.checklist_veiculo?.observacoes || ""}
                  onChange={(e) => handleChange('checklist_veiculo', { ...formData.checklist_veiculo, observacoes: e.target.value })}
                  disabled={!isEditable || isApproved}
                  rows={3}
                  placeholder="Observações adicionais sobre o veículo..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Relatório Fotográfico</Label>
        {isEditable && !isApproved && (
          <div>
            <Input
              id="fotos"
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={loadingUpload}
              className="hidden"
            />
            <Label 
              htmlFor="fotos" 
              className={`flex items-center justify-between w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background cursor-pointer hover:bg-slate-50 ${loadingUpload ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="truncate text-slate-500">{selectedFileNames}</span>
              <span className="flex-shrink-0 ml-4 px-3 py-1 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100">
                {loadingUpload ? 'Enviando...' : 'Escolher Ficheiros'}
              </span>
            </Label>
          </div>
        )}
        {loadingUpload && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando fotos...
            </p>
            {uploadProgress.length > 0 && (
              <div className="text-xs space-y-1 mt-2">
                {uploadProgress.map((progress) => (
                  <div key={progress.id} className="flex items-center gap-2">
                    <span className="w-4">
                      {progress.status === 'pending' && '⚪'}
                      {progress.status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                      {progress.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
                      {progress.status === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                    </span>
                    <span className={`${progress.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                      {progress.fileName} - {progress.status === 'pending' && 'Aguardando'}
                      {progress.status === 'uploading' && 'Enviando...'}
                      {progress.status === 'success' && 'Sucesso'}
                      {progress.status === 'error' && `Erro: ${progress.error}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {formData.fotos && formData.fotos.map((url, index) => (
            <div key={index} className="relative group">
              <img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-md border" />
              {isEditable && !isApproved && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {(!formData.fotos || formData.fotos.length === 0) && !loadingUpload && (
          <p className="text-sm text-gray-500 mt-2">Nenhuma foto adicionada.</p>
        )}
      </div>
      </>)}

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        {isEditable && !isApproved && (
          <>
            <Button 
              type="button" 
              variant="outline"
              disabled={loadingUpload}
              onClick={async (e) => {
                e.preventDefault();
                await handleSubmit(e, 'rascunho');
              }}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Save className="mr-2 h-4 w-4" /> Salvar Progresso
            </Button>
            <Button 
              type="button" 
              disabled={loadingUpload}
              onClick={async (e) => {
                e.preventDefault();
                await handleSubmit(e, 'finalizado');
              }}
            >
              <Save className="mr-2 h-4 w-4" /> Finalizar
            </Button>
          </>
        )}
        {isApproved && (
          <Badge className="bg-green-500 hover:bg-green-500 px-4 py-2 text-md">
            <CheckCircle className="mr-2 h-4 w-4" /> Aprovado
          </Badge>
        )}
      </div>
    </form>
  );
};

export default function DiarioObraPage() {
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [user, setUser] = useState(null);
  const [editingDiarioOriginal, setEditingDiarioOriginal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lifted form state and handlers from DiarioForm
  const [formData, setFormData] = useState(getInitialFormData());
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");
  const [uploadProgress, setUploadProgress] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Unified handleChange for all form fields
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não suportado: ${file.type}. Use apenas JPEG, PNG, GIF ou WebP.`);
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 10MB.`);
    }

    return true;
  };

  const uploadFileWithRetry = async (file, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries} para upload: ${file.name}`);
        const result = await UploadFile({ file });
        console.log(`Upload bem-sucedido: ${file.name}`, result);
        return result;
      } catch (error) {
        console.error(`Tentativa ${attempt} falhou para ${file.name}:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Upload falhou após ${maxRetries} tentativas: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
        setSelectedFileNames("Nenhum ficheiro selecionado");
        return;
    }

    console.log(`Iniciando upload de ${files.length} arquivo(s)`);
    
    try {
      files.forEach(file => validateFile(file));
    } catch (error) {
      alert(error.message);
      e.target.value = '';
      return;
    }

    setLoadingUpload(true);
    if (files.length === 1) {
        setSelectedFileNames(files[0].name);
    } else {
        setSelectedFileNames(`${files.length} ficheiros selecionados`);
    }

    setUploadProgress(files.map((file, index) => ({ id: `${file.name}-${index}`, fileName: file.name, status: 'pending', error: null })));

    try {
      const uploadedUrls = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentFileId = `${file.name}-${i}`;

        try {
          console.log(`Processando arquivo ${i + 1}/${files.length}: ${file.name}`);
          
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'uploading' } : p)
          );

          const result = await uploadFileWithRetry(file);
          uploadedUrls.push(result.file_url);
          
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'success' } : p)
          );
          
        } catch (error) {
          console.error(`Erro no upload do arquivo ${file.name}:`, error);
          errors.push({ fileName: file.name, error: error.message });
          
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'error', error: error.message } : p)
          );
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          fotos: [...(prev.fotos || []), ...uploadedUrls],
        }));
      }

      if (errors.length > 0) {
        const errorMessage = `${uploadedUrls.length} de ${files.length} arquivos enviados com sucesso.\n\nErros:\n` +
          errors.map(e => `• ${e.fileName}: ${e.error}`).join('\n');
        alert(errorMessage);
      } else {
        console.log(`Todos os ${files.length} arquivo(s) enviados com sucesso!`);
      }

    } catch (error) {
      console.error("Erro geral no upload:", error);
      alert(`Erro geral no upload: ${error.message}`);
    } finally {
      setLoadingUpload(false);
      setUploadProgress([]);
      e.target.value = ''; // Clear file input
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e, saveStatus = 'finalizado') => {
    e.preventDefault();
    
    // Validações obrigatórias apenas quando finalizando
    if (saveStatus === 'finalizado') {
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        return;
      }
      if (!formData.data || !formData.jornada?.horario_inicio || !formData.jornada?.horario_fim) {
        alert("Por favor, preencha todos os campos de data e horários.");
        return;
      }
      if (formData.tipo_local !== 'escritorio' && !formData.empreiteira) {
        alert("Por favor, selecione uma empreiteira.");
        return;
      }
      if (formData.tipo_local === 'campo' && (!formData.rodovia || !formData.trecho)) {
        alert("Por favor, preencha rodovia e trecho.");
        return;
      }
      if (formData.tipo_local === 'usina' && !formData.usina_selecionada) {
        alert("Por favor, selecione uma usina.");
        return;
      }
      if (!formData.atividades_realizadas) {
        alert("Por favor, preencha as atividades realizadas.");
        return;
      }
      if (formData.tipo_local !== 'escritorio' && formData.acoes_corretivas_realizado === null) {
        alert("Por favor, indique se foram realizadas ações corretivas.");
        return;
      }
      if (formData.tipo_local !== 'escritorio' && formData.acoes_corretivas_realizado === true && !formData.acoes_corretivas_descricao?.trim()) {
        alert("Por favor, descreva as ações corretivas realizadas.");
        return;
      }
    } else {
      // Para salvar progresso, apenas obra é obrigatória
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        return;
      }
    }
    
    const dataToSave = {
      ...formData,
      status: saveStatus,
      temperatura: formData.temperatura === "" ? null : Number(formData.temperatura)
    };
    
    try {
      if (editingDiarioOriginal?.id) {
        const updateData = { ...dataToSave };
        let successMessage = saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Diário finalizado com sucesso!";

        if (editingDiarioOriginal.approved === false && saveStatus === 'finalizado') {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
          updateData.was_rejected = true;
          successMessage = "Diário atualizado com sucesso! O registro voltará para análise do administrador.";
        }

        await DiarioObraEntity.update(editingDiarioOriginal.id, updateData);
        alert(successMessage);
      } else {
        await DiarioObraEntity.create({ ...dataToSave, created_by: user.email, laboratorista_name: user.laboratorista_name || user.full_name });
        alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Diário criado com sucesso!");
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("Erro ao salvar diário:", error);
      alert("Ocorreu um erro ao salvar o diário.");
    }
  };


  useEffect(() => {
    const loadData = async () => { // Renamed from loadInitialData
      setLoading(true);
      try {
        console.log("🚀 === DIÁRIO OBRA: INÍCIO DO CARREGAMENTO ===");
        const currentUser = await User.me();
        setUser(currentUser);

        console.log("📥 Carregando obras e regionais...");
        const [obrasData, regionaisData] = await Promise.all([
          Obra.list(),
          Regional.list()
        ]);
        console.log("✅ Obras carregadas:", obrasData.length, "Regionais carregadas:", regionaisData.length);
        setRegionais(regionaisData); // Set regionals once

        const currentUserAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');
        let availableObras = obrasData;
        
        if (currentUserAccessLevel === 'user') {
          console.log("🔍 Filtrando obras para laboratorista...");
          const regionalDoLaboratorista = regionaisData.find(regional => {
            const laboratoristas = regional.laboratoristas_responsaveis || [];
            return laboratoristas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
          });
          
          if (regionalDoLaboratorista) {
            console.log("✅ Regional encontrada:", regionalDoLaboratorista.nome);
            // Filtrar apenas obras em andamento
            availableObras = obrasData.filter(obra => 
              obra.regional_id === regionalDoLaboratorista.id &&
              obra.status === 'em_andamento'
            );
            console.log("✅ Obras em andamento da regional:", availableObras.length);
          } else {
            console.log("⚠️ Laboratorista não atribuído a nenhuma regional. Nenhuma obra disponível.");
            availableObras = [];
          }
        } else {
          console.log("✅ Usuário pode ver todas as obras");
        }
        setObras(availableObras); // Set filtered obras

        const params = new URLSearchParams(location.search);
        const editId = params.get('editId');
        
        if (editId) {
          const diarioToEdit = await DiarioObraEntity.get(editId);
          // Store original for permission checks and header display
          setEditingDiarioOriginal(diarioToEdit);

          // Check permissions to edit
          if (currentUser.role === 'admin' || (diarioToEdit.created_by === currentUser.email && diarioToEdit.approved !== true)) {
            setFormData({
              ...getInitialFormData(), // Start with default to ensure all fields are present
              ...diarioToEdit,
              data: diarioToEdit.data ? new Date(diarioToEdit.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              fotos: Array.isArray(diarioToEdit.fotos) ? diarioToEdit.fotos : [],
              temperatura: diarioToEdit.temperatura ?? "",
            });
            console.log("📝 Editando diário:", editId);
          } else {
            alert("Você não tem permissão para editar este registro.");
            navigate(createPageUrl('MeusEnsaios'));
            return; // Stop loading and redirect
          }
        } else {
          // Creating a new Diario: initialize formData, auto-select obra if available
          const initialNewFormData = getInitialFormData();
          if (availableObras.length > 0) {
            initialNewFormData.obra_id = availableObras[0].id;
          }
          setFormData(initialNewFormData);
          setEditingDiarioOriginal(null); // Ensure no original diario is set when creating new
          console.log("➕ Criando novo diário.");
        }
      } catch (error) {
        console.error("❌ DiarioObra - Erro ao carregar dados:", error);
        alert("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.");
        navigate(createPageUrl('MeusEnsaios'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.search, navigate]); // Dependencies for useEffect

  // Permissions and status derived from formData and user
  const isApproved = formData.approved === true;
  // userCanEdit considers role or if user created it and it's not approved yet
  const userCanEdit = user?.role === 'admin' || (formData.created_by === user?.email && formData.approved !== true);
  // isEditable determines if fields should be active: if it's a new entry (no original ID) OR if user has specific permission to edit
  const isEditable = !editingDiarioOriginal?.id || userCanEdit;

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Determine if we are creating a new entry or editing an existing one
  const isCreatingNew = !editingDiarioOriginal?.id;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingDiarioOriginal?.id ? "Editar Diário de Obra" : "Novo Diário de Obra"}</CardTitle>
            <CardDescription>
              {editingDiarioOriginal?.id ? `Editando registro de ${new Date(editingDiarioOriginal.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : "Preencha as informações abaixo para criar um novo registro."}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <form onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
              }
            }}>
            <DiarioForm
              formData={formData}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              handleRemovePhoto={handleRemovePhoto}
              handleSubmit={handleSubmit}
              onCancel={() => {
                navigate(createPageUrl('MeusEnsaios'));
              }}
              obras={obras}
              regionais={regionais}
              user={user}
              loadingUpload={loadingUpload}
              selectedFileNames={selectedFileNames}
              uploadProgress={uploadProgress}
              isEditable={isEditable}
              isApproved={isApproved}
              rejectionReason={formData.rejection_reason}
              isCreatingNew={isCreatingNew}
              status={formData.status}
              />
              </form>
              </CardContent>
        </Card>
      </div>
    </div>
  );
}