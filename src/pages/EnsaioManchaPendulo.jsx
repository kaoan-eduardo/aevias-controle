import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

const SectionTitle = ({ children }) => (
  <CardHeader className="bg-slate-50 border-b">
    <CardTitle className="text-sm font-semibold text-slate-700">{children}</CardTitle>
  </CardHeader>
);

export default function EnsaioManchaPendulo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);

  const initialFormData = {
    obra_id: '',
    data_ensaio: new Date().toISOString().split('T')[0],
    laboratorista_name: '',
    rodovia: '',
    trecho: '',
    camada: '',
    pista: '',
    orgao: 'DNIT',
    ensaios_mancha: [],
    ensaios_pendulo: [],
    limites_mancha: '0,6mm ≤ HS ≤ 1,2mm',
    limites_pendulo: 'VRD ≥ 47',
    condicao_conformidade: '',
    observacoes: '',
    status: 'rascunho'
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [userData, obrasData, regionaisData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Obra.list(),
        base44.entities.Regional.list()
      ]);

      setUser(userData);
      setObras(obrasData);
      setRegionais(regionaisData);

      if (isEditMode) {
        const ensaio = await base44.entities.EnsaioManchaPendulo.get(editId);
        setFormData(ensaio);
      } else {
        setFormData(prev => ({
          ...prev,
          laboratorista_name: userData.laboratorista_name || userData.full_name
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleObraChange = (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    if (obra) {
      setFormData(prev => ({
        ...prev,
        obra_id: obraId,
        rodovia: '',
        trecho: '',
        pista: ''
      }));
    }
  };

  const obrasConservacao = obras.filter(o => o.tipo_obra === 'conservacao');
  
  const obraSelecionada = obras.find(o => o.id === formData.obra_id);
  const rodoviasDaObra = obraSelecionada?.rodovias || [];

  const calcularManchaValores = (ensaio) => {
    const { d1, d2, d3, d4, volume_areia = 25000 } = ensaio;
    
    if (!d1 || !d2 || !d3 || !d4) return ensaio;

    const d_media = (d1 + d2 + d3 + d4) / 4;
    const area = (Math.PI * Math.pow(d_media / 10, 2)) / 4;
    const hs_mm = (4 * volume_areia) / (Math.PI * Math.pow(d_media, 2));
    const hs_cm = hs_mm / 10;

    let tipo_superficie = '';
    if (hs_mm < 0.2) tipo_superficie = 'Muito Fina';
    else if (hs_mm < 0.4) tipo_superficie = 'Fina';
    else if (hs_mm < 0.8) tipo_superficie = 'Média';
    else if (hs_mm < 1.2) tipo_superficie = 'Grossa';
    else tipo_superficie = 'Muito Grossa';

    return {
      ...ensaio,
      d_media: parseFloat(d_media.toFixed(1)),
      area: parseFloat(area.toFixed(2)),
      hs_cm: parseFloat(hs_cm.toFixed(2)),
      hs_mm: parseFloat(hs_mm.toFixed(2)),
      tipo_superficie
    };
  };

  const calcularPenduloValores = (ensaio) => {
    const { leitura_1, leitura_2, leitura_3, leitura_4, leitura_5, temp_pavimento } = ensaio;
    let leituras = [leitura_1, leitura_2, leitura_3, leitura_4, leitura_5].filter(l => l != null && l !== '');

    if (leituras.length === 0) return ensaio;

    // Aplicar correção de temperatura se temp < 20°C
    if (temp_pavimento != null && temp_pavimento < 20) {
      const a = -0.005;
      const b = 0.45;
      const c = -7;
      const correcao = (a * Math.pow(temp_pavimento, 2)) + (b * temp_pavimento) + c;
      leituras = leituras.map(l => l + correcao);
    }

    const maxima = Math.max(...leituras);
    const minima = Math.min(...leituras);
    const soma = leituras.reduce((sum, l) => sum + l, 0);
    const vrd = (soma - maxima - minima) / 3;

    let classe = '';
    if (vrd >= 47) classe = 'I';
    else classe = 'II';

    return {
      ...ensaio,
      maxima: parseFloat(maxima.toFixed(1)),
      minima: parseFloat(minima.toFixed(1)),
      vrd: parseFloat(vrd.toFixed(1)),
      classe
    };
  };

  const handleManchaChange = (index, field, value) => {
    const newEnsaios = [...formData.ensaios_mancha];
    if (!newEnsaios[index]) {
      newEnsaios[index] = { numero: index + 1, volume_areia: 25000 };
    }
    newEnsaios[index][field] = value;
    newEnsaios[index] = calcularManchaValores(newEnsaios[index]);
    setFormData(prev => ({ ...prev, ensaios_mancha: newEnsaios }));
  };

  const handlePenduloChange = (index, field, value) => {
    const newEnsaios = [...formData.ensaios_pendulo];
    if (!newEnsaios[index]) {
      newEnsaios[index] = { numero: index + 1 };
    }
    newEnsaios[index][field] = value;
    newEnsaios[index] = calcularPenduloValores(newEnsaios[index]);
    setFormData(prev => ({ ...prev, ensaios_pendulo: newEnsaios }));
  };

  const handleSave = async (finalizar = false) => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: finalizar ? 'finalizado' : 'rascunho'
      };

      if (isEditMode) {
        await base44.entities.EnsaioManchaPendulo.update(editId, dataToSave);
      } else {
        await base44.entities.EnsaioManchaPendulo.create(dataToSave);
      }

      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar o ensaio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('MeusEnsaios'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditMode ? 'Editar' : 'Novo'} Ensaio de Macrotextura e Microtextura
        </h1>
      </div>

      <Card className="mb-6">
        <SectionTitle>Dados do Cliente</SectionTitle>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Obra *</Label>
              <Select value={formData.obra_id} onValueChange={handleObraChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  {obrasConservacao.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>{obra.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rodovia</Label>
              <Select value={formData.rodovia} onValueChange={(value) => handleInputChange('rodovia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a rodovia" />
                </SelectTrigger>
                <SelectContent>
                  {rodoviasDaObra.map((rodovia, idx) => (
                    <SelectItem key={idx} value={rodovia}>{rodovia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trecho</Label>
              <Input value={formData.trecho} onChange={(e) => handleInputChange('trecho', e.target.value)} />
            </div>

            <div>
              <Label>Camada</Label>
              <Input value={formData.camada} onChange={(e) => handleInputChange('camada', e.target.value)} />
            </div>

            <div>
              <Label>Pista</Label>
              <Input value={formData.pista} onChange={(e) => handleInputChange('pista', e.target.value)} />
            </div>

            <div>
              <Label>Órgão</Label>
              <Select value={formData.orgao} onValueChange={(value) => handleInputChange('orgao', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNIT">DNIT</SelectItem>
                  <SelectItem value="Ecovias">Ecovias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data do Ensaio *</Label>
              <Input type="date" value={formData.data_ensaio} onChange={(e) => handleInputChange('data_ensaio', e.target.value)} />
            </div>

            <div>
              <Label>Laboratorista</Label>
              <Input value={formData.laboratorista_name} readOnly className="bg-slate-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <SectionTitle>Mancha de Areia - Método ABNT NBR 16504:2016</SectionTitle>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-2">#</th>
                  <th className="border border-slate-300 p-2">Data Aplicação</th>
                  <th className="border border-slate-300 p-2">Estaca</th>
                  <th className="border border-slate-300 p-2">Faixa/Pista</th>
                  <th className="border border-slate-300 p-2">Bordo</th>
                  <th className="border border-slate-300 p-2">D1 (Ø) mm</th>
                  <th className="border border-slate-300 p-2">D2 (Ø) mm</th>
                  <th className="border border-slate-300 p-2">D3 (Ø) mm</th>
                  <th className="border border-slate-300 p-2">D4 (Ø) mm</th>
                  <th className="border border-slate-300 p-2">D(Ø) Média mm</th>
                  <th className="border border-slate-300 p-2">Área cm²</th>
                  <th className="border border-slate-300 p-2">HS cm</th>
                  <th className="border border-slate-300 p-2">HS mm</th>
                  <th className="border border-slate-300 p-2">Tipo Superfície</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 15 }).map((_, index) => {
                  const ensaio = formData.ensaios_mancha[index] || {};
                  return (
                    <tr key={index}>
                      <td className="border border-slate-300 p-1 text-center">{index + 1}</td>
                      <td className="border border-slate-300 p-1">
                        <Input type="date" value={ensaio.data_aplicacao || ''} onChange={(e) => handleManchaChange(index, 'data_aplicacao', e.target.value)} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input value={ensaio.estaca || ''} onChange={(e) => handleManchaChange(index, 'estaca', e.target.value)} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input value={ensaio.faixa_pista || ''} onChange={(e) => handleManchaChange(index, 'faixa_pista', e.target.value)} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Select value={ensaio.bordo || ''} onValueChange={(value) => handleManchaChange(index, 'bordo', value)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B.I.">B.I.</SelectItem>
                            <SelectItem value="B.E.">B.E.</SelectItem>
                            <SelectItem value="E.X.">E.X.</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" step="0.1" value={ensaio.d1 || ''} onChange={(e) => handleManchaChange(index, 'd1', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" step="0.1" value={ensaio.d2 || ''} onChange={(e) => handleManchaChange(index, 'd2', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" step="0.1" value={ensaio.d3 || ''} onChange={(e) => handleManchaChange(index, 'd3', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" step="0.1" value={ensaio.d4 || ''} onChange={(e) => handleManchaChange(index, 'd4', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.d_media?.toFixed(1) || ''}</td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.area?.toFixed(2) || ''}</td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.hs_cm?.toFixed(2) || ''}</td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.hs_mm?.toFixed(2) || ''}</td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50 text-xs">{ensaio.tipo_superficie || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <SectionTitle>Pêndulo Britânico - Método ABNT NBR 16780:2019</SectionTitle>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-2">#</th>
                  <th className="border border-slate-300 p-2">Data Aplicação</th>
                  <th className="border border-slate-300 p-2">Estaca</th>
                  <th className="border border-slate-300 p-2">Faixa/Pista</th>
                  <th className="border border-slate-300 p-2">Bordo</th>
                  <th className="border border-slate-300 p-2">Temp. Pavimento (°C)</th>
                  <th className="border border-slate-300 p-2">1º</th>
                  <th className="border border-slate-300 p-2">2º</th>
                  <th className="border border-slate-300 p-2">3º</th>
                  <th className="border border-slate-300 p-2">4º</th>
                  <th className="border border-slate-300 p-2">5º</th>
                  <th className="border border-slate-300 p-2">Máxima</th>
                  <th className="border border-slate-300 p-2">Mínima</th>
                  <th className="border border-slate-300 p-2">VRD</th>
                  <th className="border border-slate-300 p-2">Classe</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 15 }).map((_, index) => {
                  const ensaio = formData.ensaios_pendulo[index] || {};
                  return (
                    <tr key={index}>
                      <td className="border border-slate-300 p-1 text-center">{index + 1}</td>
                      <td className="border border-slate-300 p-1">
                        <Input type="date" value={ensaio.data_aplicacao || ''} onChange={(e) => handlePenduloChange(index, 'data_aplicacao', e.target.value)} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input value={ensaio.estaca || ''} onChange={(e) => handlePenduloChange(index, 'estaca', e.target.value)} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input value={ensaio.faixa_pista || ''} onChange={(e) => handlePenduloChange(index, 'faixa_pista', e.target.value)} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Select value={ensaio.bordo || ''} onValueChange={(value) => handlePenduloChange(index, 'bordo', value)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B.I.">B.I.</SelectItem>
                            <SelectItem value="B.E.">B.E.</SelectItem>
                            <SelectItem value="E.X.">E.X.</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" value={ensaio.temp_pavimento || ''} onChange={(e) => handlePenduloChange(index, 'temp_pavimento', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" value={ensaio.leitura_1 || ''} onChange={(e) => handlePenduloChange(index, 'leitura_1', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" value={ensaio.leitura_2 || ''} onChange={(e) => handlePenduloChange(index, 'leitura_2', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" value={ensaio.leitura_3 || ''} onChange={(e) => handlePenduloChange(index, 'leitura_3', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" value={ensaio.leitura_4 || ''} onChange={(e) => handlePenduloChange(index, 'leitura_4', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <Input type="number" value={ensaio.leitura_5 || ''} onChange={(e) => handlePenduloChange(index, 'leitura_5', parseFloat(e.target.value))} className="h-8 text-xs" />
                      </td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.maxima || ''}</td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.minima || ''}</td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.vrd || ''}</td>
                      <td className="border border-slate-300 p-1 text-center bg-slate-50">{ensaio.classe || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <SectionTitle>Resultados</SectionTitle>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Limites Estabelecidos - Mancha de Areia</Label>
              <Input value={formData.limites_mancha} onChange={(e) => handleInputChange('limites_mancha', e.target.value)} />
            </div>

            <div>
              <Label>Limites Estabelecidos - Pêndulo Britânico</Label>
              <Input value={formData.limites_pendulo} onChange={(e) => handleInputChange('limites_pendulo', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Condição de Conformidade</Label>
            <Select value={formData.condicao_conformidade} onValueChange={(value) => handleInputChange('condicao_conformidade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFORME">CONFORME</SelectItem>
                <SelectItem value="NÃO CONFORME">NÃO CONFORME</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={formData.observacoes} onChange={(e) => handleInputChange('observacoes', e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(createPageUrl('MeusEnsaios'))} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={() => handleSave(false)} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Progresso
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Finalizar Ensaio
        </Button>
      </div>
    </div>
  );
}