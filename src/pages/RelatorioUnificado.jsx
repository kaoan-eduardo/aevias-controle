import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User";
import { Project } from "@/entities/Project";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDataEnsaio, getEnsaioTypeInfo } from "@/components/ensaios/ensaioMappers";
import { useReportMode } from "@/hooks/useReportMode";

// Importar todos os componentes de relatório
import RelatorioChecklist from "@/components/relatorios/RelatorioChecklist";
import RelatorioChecklistAplicacao from "@/components/relatorios/RelatorioChecklistAplicacao";
import RelatorioChecklistMRAF from "@/components/relatorios/RelatorioChecklistMRAF";
import RelatorioChecklistConcretagem from "@/components/relatorios/RelatorioChecklistConcretagem";
import RelatorioChecklistTerraplanagem from "@/components/relatorios/RelatorioChecklistTerraplanagem";
import RelatorioChecklistReciclagem from "@/components/relatorios/RelatorioChecklistReciclagem";
import RelatorioDiario from "@/components/relatorios/RelatorioDiario";
import RelatorioDensidade from "@/components/relatorios/RelatorioDensidade";
import RelatorioDensidadeInSitu from "@/components/relatorios/RelatorioDensidadeInSitu";
import RelatorioTaxaPinturaImprimacao from "@/components/relatorios/RelatorioTaxaPinturaImprimacao";
import RelatorioAcompanhamentoUsinagem from "@/components/relatorios/RelatorioAcompanhamentoUsinagem";
import RelatorioAcompanhamentoCarga from "@/components/relatorios/RelatorioAcompanhamentoCarga";
import RelatorioManchaPendulo from "@/components/relatorios/RelatorioManchaPendulo";
import RelatorioGranulometriaIndividual from "@/components/relatorios/RelatorioGranulometriaIndividual";
import RelatorioGranuMistura from "@/components/relatorios/RelatorioGranuMistura";

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

// Renderizador de um único registro
function RecordRenderer({ record, obra, regional, project, user, allUsers }) {
  const entityType = record.entityType;
  const commonProps = { ensaio: record, obra, regional, project, user };

  switch (entityType) {
    case "DiarioObra":
      return <RelatorioDiario diario={record} obra={obra} regional={regional} creator={user} />;
    case "ChecklistUsina":
      return <RelatorioChecklist checklist={record} obra={obra} regional={regional} project={project} user={user} />;
    case "ChecklistAplicacao":
      return <RelatorioChecklistAplicacao checklist={record} obra={obra} regional={regional} project={project} user={user} />;
    case "ChecklistMRAF":
      return <RelatorioChecklistMRAF checklist={record} obra={obra} regional={regional} project={project} user={user} />;
    case "ChecklistConcretagem":
      return <RelatorioChecklistConcretagem checklist={record} obra={obra} regional={regional} project={project} user={user} />;
    case "ChecklistTerraplanagem":
      return <RelatorioChecklistTerraplanagem checklist={record} obra={obra} regional={regional} project={project} user={user} />;
    case "ChecklistReciclagem":
      return <RelatorioChecklistReciclagem checklist={record} obra={obra} regional={regional} project={project} user={user} />;
    case "EnsaioDensidade":
      return <RelatorioDensidade ensaio={record} obra={obra} regional={regional} project={project} user={user} />;
    case "EnsaioDensidadeInSitu":
      return <RelatorioDensidadeInSitu ensaio={record} obra={obra} regional={regional} project={project} user={user} />;
    case "EnsaioTaxaPinturaImprimacao":
      return <RelatorioTaxaPinturaImprimacao ensaio={record} obra={obra} regional={regional} user={user} />;
    case "AcompanhamentoUsinagem":
      return <RelatorioAcompanhamentoUsinagem ensaio={record} obra={obra} regional={regional} project={project} user={user} />;
    case "AcompanhamentoCarga":
      return <RelatorioAcompanhamentoCarga ensaio={record} obra={obra} regional={regional} user={user} />;
    case "EnsaioManchaPendulo":
      return <RelatorioManchaPendulo ensaio={record} obra={obra} regional={regional} user={user} />;
    case "EnsaioGranulometriaIndividual":
      return <RelatorioGranulometriaIndividual ensaio={record} obra={obra} regional={regional} project={project} user={user} />;
    case "GranuMistura":
      return <RelatorioGranuMistura ensaio={record} obra={obra} regional={regional} project={project} user={user} />;
    case "EnsaioCAUQ":
      // Renderizar a página nativa de relatório
      return (
        <div className="bg-white min-h-screen">
          <iframe
            src={`/RelatorioCAUQ?id=${record.id}`}
            className="w-full h-screen border-0"
            title="Relatório de Ensaio CAUQ"
          />
        </div>
      );
    default: {
      // Para tipos sem componente embutido, mostrar card simples
      const typeInfo = getEnsaioTypeInfo(record);
      const dataFormatted = getDataEnsaio(record)
        ? new Date(getDataEnsaio(record)).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : '-';
      return (
        <div className="border-2 border-slate-300 rounded-lg p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg font-bold text-slate-700">{typeInfo.name}</span>
            <span className="text-sm text-slate-500">— {dataFormatted}</span>
          </div>
          <p className="text-sm text-slate-500">
            Laboratorista: {record.laboratorista_name || record.created_by || 'N/A'}
          </p>
          {record.observacoes && (
            <p className="text-sm text-slate-600 mt-2">{record.observacoes}</p>
          )}
        </div>
      );
    }
  }
}

export default function RelatorioUnificado() {
  useReportMode();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const obra_id = params.get('obra_id');
      const data_inicio = params.get('data_inicio');
      const data_fim = params.get('data_fim');
      const tipo = params.get('tipo');
      const laboratoristas = (params.get('laboratoristas') || '').split(',').filter(Boolean);
      const rodovia = params.get('rodovia');
      const empreiteira = params.get('empreiteira');
      const usina = params.get('usina');

      setFilters({ obra_id, data_inicio, data_fim, tipo, laboratoristas, rodovia, empreiteira, usina });

      if (!obra_id || !data_inicio || !data_fim || !tipo) {
        setError("Parâmetros insuficientes.");
        return;
      }

      const [obraData, regionaisData, projectsData, currentUser] = await Promise.all([
        base44.entities.Obra.get(obra_id),
        Regional.list(),
        Project.list(),
        User.me()
      ]);

      setObra(obraData);
      setUser(currentUser);
      setProjects(projectsData);

      const regionalData = regionaisData.find(r => r.id === obraData.regional_id);
      setRegional(regionalData);

      // Buscar registros do tipo selecionado
      const entity = getEntityInstance(tipo);
      if (!entity) {
        setError(`Tipo de registro "${tipo}" não suportado.`);
        return;
      }

      const allRecords = await entity.filter({ obra_id }, "-created_date", 2000);

      // Filtrar por período
      const inicio = new Date(data_inicio);
      const fim = new Date(data_fim);
      fim.setHours(23, 59, 59);

      const filtered = allRecords
        .map(r => ({ ...r, entityType: tipo }))
        .filter(r => {
          const d = getDataEnsaio(r);
          if (!d) return false;
          const date = new Date(d);
          return date >= inicio && date <= fim;
        })
        .filter(r => {
          if (!laboratoristas.length) return true;
          const lab = r.laboratorista_name || r.created_by;
          return laboratoristas.includes(lab);
        })
        .filter(r => {
          if (!rodovia) return true;
          const rodoviaRecord = r.rodovia || r.rodovia_selecionada;
          return rodoviaRecord === rodovia;
        })
        .filter(r => {
          if (!empreiteira) return true;
          const empreiteiraRecord = r.empreiteira || r.empreiteira_selecionada;
          return empreiteiraRecord === empreiteira;
        })
        .filter(r => {
          if (!usina) return true;
          const usinaRecord = r.usina || r.usina_selecionada || r.usina_fornecedora;
          return usinaRecord === usina;
        })
        .sort((a, b) => {
          const da = new Date(getDataEnsaio(a) || 0);
          const db = new Date(getDataEnsaio(b) || 0);
          return da - db;
        });

      setRecords(filtered);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
        <p className="text-slate-500">Carregando registros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const tipoNome = getEnsaioTypeInfo({ entityType: filters.tipo })?.name || filters.tipo;

  return (
    <div className="bg-white min-h-screen">
      {/* Toolbar — oculta na impressão */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Relatório Unificado</h2>
            <p className="text-sm text-slate-500">
              {obra?.name} · {tipoNome} · {formatDate(filters.data_inicio)} a {formatDate(filters.data_fim)} · {records.length} registro(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/RelatoriosUnificados')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => window.print()} className="bg-slate-800 text-white hover:bg-slate-700">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Capa do relatório — apenas na tela, nunca impressa */}
      <div className="print:hidden max-w-5xl mx-auto px-6 pt-8 pb-4">
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            {regional?.logo_url && (
              <img src={regional.logo_url} alt="Logo" className="h-14 object-contain" />
            )}
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-800">RELATÓRIO UNIFICADO</h1>
              <p className="text-base font-semibold text-slate-600">{tipoNome}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <p className="text-slate-500 font-medium">Obra</p>
              <p className="text-slate-800 font-semibold">{obra?.name}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Regional</p>
              <p className="text-slate-800 font-semibold">{regional?.nome || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Período</p>
              <p className="text-slate-800 font-semibold">{formatDate(filters.data_inicio)} a {formatDate(filters.data_fim)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Total de Registros</p>
              <p className="text-slate-800 font-semibold">{records.length}</p>
            </div>
          </div>
          {filters.laboratoristas?.length > 0 && (
            <div className="mt-3 text-sm">
              <p className="text-slate-500 font-medium">Laboratoristas</p>
              <p className="text-slate-700">{filters.laboratoristas.join(', ')}</p>
            </div>
          )}
          {filters.rodovia && (
            <div className="mt-3 text-sm">
              <p className="text-slate-500 font-medium">Rodovia</p>
              <p className="text-slate-700">{filters.rodovia}</p>
            </div>
          )}
          {filters.empreiteira && (
            <div className="mt-3 text-sm">
              <p className="text-slate-500 font-medium">Empreiteira</p>
              <p className="text-slate-700">{filters.empreiteira}</p>
            </div>
          )}
          {filters.usina && (
            <div className="mt-3 text-sm">
              <p className="text-slate-500 font-medium">Usina</p>
              <p className="text-slate-700">{filters.usina}</p>
            </div>
          )}
        </div>
      </div>

      {/* Registros — visíveis na tela e na impressão */}
      <div className="max-w-5xl mx-auto px-6 print:px-0">
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">Nenhum registro encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {records.map((record, index) => {
              const project = projects.find(p => p.id === record.project_id);
              return (
                <div
                  key={record.id}
                  className="print:break-before-page"
                  style={{ breakBefore: index > 0 ? 'page' : 'auto' }}
                >
                  {/* Separador visual na tela */}
                  {index > 0 && (
                    <div className="print:hidden my-8 flex items-center gap-4">
                      <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-white px-3">
                        Registro {index + 1} de {records.length}
                      </span>
                      <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                    </div>
                  )}
                  <RecordRenderer
                    record={record}
                    obra={obra}
                    regional={regional}
                    project={project}
                    user={user}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          aside, nav, [data-sidebar] { display: none !important; }
        }
      `}</style>
    </div>
  );
}