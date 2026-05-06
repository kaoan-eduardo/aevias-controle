import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { User } from "@/entities/User";

const REGISTRO_TYPES = {
  DiarioObra: "Diário de Obra",
  ChecklistUsina: "Checklist de Usina",
  ChecklistAplicacao: "Checklist de Aplicação",
  ChecklistMRAF: "Checklist de MRAF",
  ChecklistConcretagem: "Checklist de Concretagem",
  ChecklistTerraplanagem: "Checklist de Terraplanagem",
  ChecklistReciclagem: "Checklist de Reciclagem",
  EnsaioCAUQ: "Ensaio de CAUQ",
  EnsaioMRAF: "Ensaio MRAF",
  EnsaioSondagem: "Sondagem",
  EnsaioDensidadeInSitu: "Densidade In Situ",
  EnsaioTaxaPinturaImprimacao: "Taxa de Pintura/Imprimação",
  EnsaioVigaBenkelman: "Viga Benkelman",
  EnsaioTaxaMRAF: "Taxa MRAF",
  EnsaioManchaPendulo: "Mancha + Pêndulo",
};

export default function RelatoriosUnificados() {
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [laboratoristas, setLaboratoristas] = useState([]);
  const [registroTypes, setRegistroTypes] = useState([]);
  
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [obraId, setObraId] = useState("");
  const [selectedLaboratoristas, setSelectedLaboratoristas] = useState({});
  const [registroType, setRegistroType] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const accessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');
      
      if (!['gestor_contrato', 'sala_tecnica_afirmaevias', 'admin'].includes(accessLevel)) {
        setLoading(false);
        return;
      }

      const regionaisData = await base44.entities.Regional.list();
      const regionaisDoGestor = regionaisData.filter(r => 
        r.gestores_contrato_responsaveis?.some(email => email.toLowerCase() === userData.email?.toLowerCase()) ||
        r.salas_tecnicas_responsaveis?.some(email => email.toLowerCase() === userData.email?.toLowerCase()) ||
        userData?.role === 'admin'
      );

      const regionaisIds = regionaisDoGestor.map(r => r.id);
      const obrasData = await base44.entities.Obra.list();
      const obrasGestor = obrasData.filter(obra => regionaisIds.includes(obra.regional_id));
      
      setObras(obrasGestor);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLaboratoristas = useCallback(async () => {
    if (!obraId || !dataInicio || !dataFim) return;

    try {
      const registros = [];
      const entityNames = Object.keys(REGISTRO_TYPES);

      // Carregar sequencialmente com delays maiores
      for (let i = 0; i < entityNames.length; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 150));
          const data = await base44.entities[entityNames[i]].filter({
            obra_id: obraId,
            data: { $gte: dataInicio, $lt: dataFim.split('T')[0] }
          });
          registros.push(...(data || []));
        } catch (err) {
          // Continuar se falhar em um tipo de registro
          console.warn(`Erro ao carregar ${entityNames[i]}:`, err);
        }
      }

      const labSet = new Set(registros.map(r => r.laboratorista_name).filter(Boolean));
      const labArray = Array.from(labSet).sort();
      setLaboratoristas(labArray);
      setSelectedLaboratoristas({});
    } catch (error) {
      console.error("Erro ao carregar laboratoristas:", error);
    }
  }, [obraId, dataInicio, dataFim]);

  const loadRegistroTypes = useCallback(async () => {
    if (!obraId || !dataInicio || !dataFim) return;

    try {
      const typesEncontrados = new Set();
      const selectedLabs = Object.keys(selectedLaboratoristas).filter(l => selectedLaboratoristas[l]);
      const entityNames = Object.keys(REGISTRO_TYPES);

      // Carregar sequencialmente com delays maiores
      for (let i = 0; i < entityNames.length; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 150));
          const data = await base44.entities[entityNames[i]].filter({
            obra_id: obraId,
            data: { $gte: dataInicio, $lt: dataFim.split('T')[0] }
          });

          const filtered = (data || []).filter(r => 
            selectedLabs.length === 0 || selectedLabs.includes(r.laboratorista_name)
          );

          if (filtered.length > 0) {
            typesEncontrados.add(entityNames[i]);
          }
        } catch (err) {
          // Continuar se falhar em um tipo de registro
          console.warn(`Erro ao carregar ${entityNames[i]}:`, err);
        }
      }

      setRegistroTypes(Array.from(typesEncontrados).sort());
    } catch (error) {
      console.error("Erro ao carregar tipos de registro:", error);
    }
  }, [obraId, dataInicio, dataFim, selectedLaboratoristas]);

  useEffect(() => {
    loadLaboratoristas();
  }, [loadLaboratoristas]);

  useEffect(() => {
    loadRegistroTypes();
  }, [loadRegistroTypes]);

  const handleLaboratoristaChange = (lab) => {
    setSelectedLaboratoristas(prev => ({
      ...prev,
      [lab]: !prev[lab]
    }));
  };

  const isAllFiltersFilled = dataInicio && dataFim && obraId && Object.values(selectedLaboratoristas).some(v => v) && registroType;

  const handleLimparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setObraId("");
    setSelectedLaboratoristas({});
    setRegistroType("");
    setLaboratoristas([]);
    setRegistroTypes([]);
  };

  const handleGerarRelatorio = async () => {
    setGeneratingReport(true);
    try {
      const selectedLabs = Object.keys(selectedLaboratoristas).filter(l => selectedLaboratoristas[l]);
      
      const registros = await base44.entities[registroType].filter({
        obra_id: obraId,
        data: { $gte: dataInicio, $lt: dataFim.split('T')[0] }
      });

      const filtered = registros.filter(r => selectedLabs.includes(r.laboratorista_name));

      if (filtered.length === 0) {
        alert("Nenhum registro encontrado com os filtros selecionados");
        setGeneratingReport(false);
        return;
      }

      // Abre os relatórios em abas com delays para evitar rate limit
      filtered.slice(0, 10).forEach((registro, index) => {
        const reportUrl = `/Relatorio${registroType}?id=${registro.id}`;
        setTimeout(() => window.open(reportUrl, "_blank"), index * 200);
      });

      if (filtered.length > 10) {
        alert(`Apenas os primeiros 10 registros foram abertos para evitar problemas. Total encontrado: ${filtered.length}`);
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatórios Unificados</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataInicio" className="text-sm font-semibold">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="dataFim" className="text-sm font-semibold">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Obra */}
            <div>
              <Label htmlFor="obra" className="text-sm font-semibold">Obra</Label>
              <Select value={obraId} onValueChange={setObraId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>{obra.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Laboratoristas */}
            {laboratoristas.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 block">Laboratoristas</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {laboratoristas.map(lab => (
                    <div key={lab} className="flex items-center gap-2">
                      <Checkbox
                        id={`lab-${lab}`}
                        checked={selectedLaboratoristas[lab] || false}
                        onCheckedChange={() => handleLaboratoristaChange(lab)}
                      />
                      <label htmlFor={`lab-${lab}`} className="text-sm cursor-pointer">{lab}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tipo de Registro */}
            {registroTypes.length > 0 && (
              <div>
                <Label htmlFor="registroType" className="text-sm font-semibold">Tipo de Registro</Label>
                <Select value={registroType} onValueChange={setRegistroType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione um tipo de registro" />
                  </SelectTrigger>
                  <SelectContent>
                    {registroTypes.map(type => (
                      <SelectItem key={type} value={type}>{REGISTRO_TYPES[type]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleLimparFiltros}
                className="flex-1"
              >
                Limpar Filtros
              </Button>
              <Button
                onClick={handleGerarRelatorio}
                disabled={!isAllFiltersFilled || generatingReport}
                className="flex-1 bg-green-700 hover:bg-green-800"
              >
                {generatingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}