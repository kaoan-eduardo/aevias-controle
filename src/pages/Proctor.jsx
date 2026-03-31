import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { base44 } from "@/api/base44Client";
import { Loader2, Trash2, Plus } from "lucide-react";

const CONSTANTS = {
  // Constantes para cálculos DNIT 172/2016
  FATOR_CONVERSAO_ISC: 0.07,
  PENETRACAO_254: 2.54,
  PENETRACAO_508: 5.08
};

export default function ProctorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [obrasDoUsuario, setObrasDoUsuario] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [umidadeMode, setUmidadeMode] = useState('higroscopica'); // 'higroscopica' ou 'ponto_a_ponto'

  const [formData, setFormData] = useState({
    obra_id: '',
    project_id: '',
    data_ensaio: new Date().toISOString().split('T')[0],
    laboratorista_name: '',
    local: '',
    furo: '',
    km: '',
    pista: '',
    horizonte: '',
    material: '',
    golpes: 12,
    amostra: '',
    auxiliar: '',
    umidade_higroscopica: {
      capsula_numero: '',
      peso_capsula: '',
      peso_solo_umido: '',
      peso_capsula_solo_umido: '',
      peso_agua: '',
      peso_capsula_solo_seco: '',
      umidade_calculada: ''
    },
    cilindros: Array(5).fill(null).map(() => ({
      numero_cilindro: '',
      umidade: {
        numero_capsula: '',
        peso_capsula: '',
        peso_solo_umido: '',
        peso_capsula_solo_umido: '',
        peso_agua: '',
        peso_capsula_solo_seco: '',
        umidade_calculada: ''
      },
      densidade: {
        peso_material: '',
        peso_seco: '',
        volume: '',
        densidade_umida: '',
        densidade_seca: ''
      }
    })),
    densidade_maxima: '',
    umidade_otima: '',
    expansoes: Array(5).fill(null).map(() => ({
      numero_cilindro: '',
      data: new Date().toISOString().split('T')[0],
      hora: '',
      altura_inicial: '',
      leituras: ['', '', '', ''],
      diferenca: '',
      expansao_percentual: '',
      peso_solo_final: ''
    })),
    cbrs: Array(5).fill(null).map(() => ({
      numero_cilindro: '',
      penetracoes: Array(10).fill(null).map(() => ({
        penetracao_mm: '',
        tempo_minutos: '',
        leitura_anel: '',
        pressao_kgf_cm2: '',
        isc_percentual: ''
      })),
      cbr_em_2_54: '',
      cbr_em_5_08: '',
      cbr_final: ''
    })),
    observacoes: '',
    status: 'rascunho'
  });
                    setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                  }} className="mt-2 w-full">
                    Calcular Pressões e ISC
                  </Button>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Input type="number" step="0.01" placeholder="CBR 2,54mm (%)" value={cbr.cbr_em_2_54} onChange={(e) => {
                      const newCbrs = [...formData.cbrs];
                      newCbrs[cbrIdx].cbr_em_2_54 = Number(e.target.value);
                      setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                    }} />
                    <Input type="number" step="0.01" placeholder="CBR 5,08mm (%)" value={cbr.cbr_em_5_08} onChange={(e) => {
                      const newCbrs = [...formData.cbrs];
                      newCbrs[cbrIdx].cbr_em_5_08 = Number(e.target.value);
                      setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                    }} />
                    <Input type="number" step="0.01" placeholder="CBR Final (%)" value={cbr.cbr_final} onChange={(e) => {
                      const newCbrs = [...formData.cbrs];
                      newCbrs[cbrIdx].cbr_final = Number(e.target.value);
                      setFormData(prev => ({ ...prev, cbrs: newCbrs }));
                    }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: OBSERVAÇÕES */}
        <TabsContent value="observacoes" className="space-y-4">
          <Card className="bg-white/20 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle>Observações e Conclusões</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações gerais do ensaio..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={6}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSubmit('rascunho')}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Salvar Rascunho
        </Button>
        <Button
          className="bg-[#00233B] hover:bg-[#00233B]/90"
          onClick={() => handleSubmit('finalizado')}
          disabled={saving || !formData.obra_id || !formData.data_ensaio}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Finalizar Ensaio
        </Button>
      </div>
    </div>
  );
}