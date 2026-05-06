import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileText, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getDataEnsaio, getEnsaioTypeInfo, typeOptions } from "@/components/ensaios/ensaioMappers";
import { useNavigate } from "react-router-dom";

const ENTITY_KEYS = [
  "DiarioObra", "EnsaioCAUQ", "EnsaioMRAF", "EnsaioDensidade", "EnsaioDensidadeInSitu",
  "EnsaioTaxaPinturaImprimacao", "ChecklistUsina", "ChecklistAplicacao", "ChecklistMRAF",
  "ChecklistConcretagem", "ChecklistTerraplanagem", "ChecklistReciclagem", "EnsaioSondagem",
  "EnsaioGranulometriaIndividual", "AcompanhamentoUsinagem", "AcompanhamentoCarga",
  "EnsaioManchaPendulo", "EnsaioVigaBenkelman", "EnsaioTaxaMRAF", "BoletimSondagem",
  "BoletimSondagemTrado", "EnsaioProctor", "EnsaioRompimentoConcreto", "GranuMistura"
];

const getEntityInstance = (key) => {
  const map = {
    DiarioObra: base44.entities.DiarioObra,
    EnsaioCAUQ: base44.entities.EnsaioCAUQ,
    EnsaioMRAF: base44.entities.EnsaioMRAF,
    EnsaioDensidade: base44.entities.EnsaioDensidade,
    EnsaioDensidadeInSitu: base44.entities.EnsaioDensidadeInSitu,
    EnsaioTaxaPinturaImprimacao: base44.entities.EnsaioTaxaPinturaImprimacao,
    ChecklistUsina: base44.entities.ChecklistUsina,
    ChecklistAplicacao: base44.entities.ChecklistAplicacao,
    ChecklistMRAF: base44.entities.ChecklistMRAF,
    ChecklistConcretagem: base44.entities.ChecklistConcretagem,
    ChecklistTerraplanagem: base44.entities.ChecklistTerraplanagem,
    ChecklistReciclagem: base44.entities.ChecklistReciclagem,
    EnsaioSondagem: base44.entities.EnsaioSondagem,
    EnsaioGranulometriaIndividual: base44.entities.EnsaioGranulometriaIndividual,
    AcompanhamentoUsinagem: base44.entities.AcompanhamentoUsinagem,
    AcompanhamentoCarga: base44.entities.AcompanhamentoCarga,
    EnsaioManchaPendulo: base44.entities.EnsaioManchaPendulo,
    EnsaioVigaBenkelman: base44.entities.EnsaioVigaBenkelman,
    EnsaioTaxaMRAF: base44.entities.EnsaioTaxaMRAF,
    BoletimSondagem: base44.entities.BoletimSondagem,
    BoletimSondagemTrado: base44.entities.BoletimSondagemTrado,
    EnsaioProctor: base44.entities.EnsaioProctor,
    EnsaioRompimentoConcreto: base44.entities.EnsaioRompimentoConcreto,
    GranuMistura: base44.entities.GranuMistura,
  };
  return map[key];
};

export default function RelatoriosUnificados() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);

  // Filtros
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [obraSelecionada, setObraSelecionada] = useState("");
  const [laboratoristasDisponiveis, setLaboratoristasDisponiveis] = useState([]);
  const [laboratoristasChecked, setLaboratoristasChecked] = useState([]);
  const [tipoRegistro, setTipoRegistro] = useState("");
  const [loadingLaboratoristas, setLoadingLaboratoristas] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (obraSelecionada && dataInicio && dataFim) {
      loadLaboratoristas();
    } else {
      setLaboratoristasDisponiveis([]);
      setLaboratoristasChecked([]);
    }
  }, [obraSelecionada, dataInicio, dataFim]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [obrasData, regionaisData] = await Promise.all([
        Obra.list(),
        Regional.list()
      ]);

      setRegionais(regionaisData);

      const userAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');

      let availableObras = obrasData;
      if (userAccessLevel === 'gestor_contrato' || userAccessLevel === 'sala_tecnica_afirmaevias') {
        const regionaisDoUsuario = regionaisData.filter(r =>
          r.gestor_contrato_responsavel?.toLowerCase() === currentUser.email?.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(e => e.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (r.salas_tecnicas_responsaveis || []).some(e => e.toLowerCase() === currentUser.email?.toLowerCase())
        );
        const regionaisIds = regionaisDoUsuario.map(r => r.id);
        availableObras = obrasData.filter(o => regionaisIds.includes(o.regional_id));
      }

      setObras(availableObras);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLaboratoristas = async () => {
    setLoadingLaboratoristas(true);
    try {
      // Carregar todos os registros de todos os tipos da obra no período
      const allRecords = [];
      await Promise.all(
        ENTITY_KEYS.map(async (key) => {
          try {
            const entity = getEntityInstance(key);
            const records = await entity.filter({ obra_id: obraSelecionada }, "-created_date", 2000);
            records.forEach(r => allRecords.push({ ...r, entityType: key }));
          } catch (e) { /* ignore */ }
        })
      );

      // Filtrar por período
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59);

      const filtered = allRecords.filter(r => {
        const d = getDataEnsaio(r);
        if (!d) return false;
        const date = new Date(d);
        return date >= inicio && date <= fim;
      });

      // Extrair laboratoristas únicos
      const labSet = new Set();
      filtered.forEach(r => {
        const name = r.laboratorista_name || r.created_by;
        if (name) labSet.add(name);
      });

      const labs = Array.from(labSet).sort();
      setLaboratoristasDisponiveis(labs);
      setLaboratoristasChecked(labs); // Todos selecionados por padrão
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLaboratoristas(false);
    }
  };

  const toggleLaboratorista = (lab) => {
    setLaboratoristasChecked(prev =>
      prev.includes(lab) ? prev.filter(l => l !== lab) : [...prev, lab]
    );
  };

  const handleLimparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setObraSelecionada("");
    setLaboratoristasDisponiveis([]);
    setLaboratoristasChecked([]);
    setTipoRegistro("");
  };

  const isFormValid = dataInicio && dataFim && obraSelecionada && laboratoristasChecked.length > 0 && tipoRegistro;

  const handleGerarRelatorio = () => {
    const params = new URLSearchParams({
      obra_id: obraSelecionada,
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo: tipoRegistro,
      laboratoristas: laboratoristasChecked.join(","),
    });
    navigate(`/RelatorioUnificado?${params.toString()}`);
  };

  const obraSelecionadaObj = obras.find(o => o.id === obraSelecionada);
  const regionalSelecionada = obraSelecionadaObj ? regionais.find(r => r.id === obraSelecionadaObj.regional_id) : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00233B]">Relatórios Unificados</h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecione os filtros para gerar um relatório consolidado de registros.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Todos os campos são obrigatórios para gerar o relatório.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início *</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim *</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Obra */}
          <div className="space-y-2">
            <Label>Obra *</Label>
            <Select value={obraSelecionada} onValueChange={setObraSelecionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma obra" />
              </SelectTrigger>
              <SelectContent>
                {obras.map(obra => {
                  const regional = regionais.find(r => r.id === obra.regional_id);
                  return (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name} - {obra.code}{regional ? ` (${regional.nome})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {regionalSelecionada && (
              <p className="text-xs text-slate-500">Regional: {regionalSelecionada.nome}</p>
            )}
          </div>

          {/* Tipo de Registro */}
          <div className="space-y-2">
            <Label>Tipo de Registro *</Label>
            <Select value={tipoRegistro} onValueChange={setTipoRegistro}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.filter(o => o.value !== 'all').map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Laboratoristas */}
          <div className="space-y-2">
            <Label>Laboratoristas *</Label>
            {!obraSelecionada || !dataInicio || !dataFim ? (
              <p className="text-sm text-slate-400 italic">Selecione obra e período para carregar os laboratoristas.</p>
            ) : loadingLaboratoristas ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando laboratoristas...
              </div>
            ) : laboratoristasDisponiveis.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Nenhum laboratorista encontrado no período selecionado.</p>
            ) : (
              <div className="border rounded-lg p-3 space-y-2 bg-slate-50">
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setLaboratoristasChecked([...laboratoristasDisponiveis])}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Selecionar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaboratoristasChecked([])}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Desmarcar todos
                  </button>
                </div>
                {laboratoristasDisponiveis.map(lab => (
                  <label key={lab} className="flex items-center gap-2 cursor-pointer hover:bg-white px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={laboratoristasChecked.includes(lab)}
                      onChange={() => toggleLaboratorista(lab)}
                      className="rounded"
                    />
                    <span className="text-sm text-[#00233B]">{lab}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleLimparFiltros}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpar Filtros
            </Button>
            <Button
              onClick={handleGerarRelatorio}
              disabled={!isFormValid || generating}
              className="bg-[#00233B] text-white hover:bg-[#00233B]/90 flex items-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}