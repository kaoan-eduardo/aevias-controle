import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import RelatorioDiario from "@/components/relatorios/RelatorioDiario";
import RelatorioDensidade from "@/components/relatorios/RelatorioDensidade";
import RelatorioDensidadeInSitu from "@/components/relatorios/RelatorioDensidadeInSitu";
import RelatorioTaxaPinturaImprimacao from "@/components/relatorios/RelatorioTaxaPinturaImprimacao";
import RelatorioChecklist from "@/components/relatorios/RelatorioChecklist";
import RelatorioChecklistAplicacao from "@/components/relatorios/RelatorioChecklistAplicacao";
import RelatorioChecklistMRAF from "@/components/relatorios/RelatorioChecklistMRAF";
import RelatorioChecklistConcretagem from "@/components/relatorios/RelatorioChecklistConcretagem";
import RelatorioChecklistTerraplanagem from "@/components/relatorios/RelatorioChecklistTerraplanagem";

export default function RelatorioConsolidadoPage() {
  const [ensaiosData, setEnsaiosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const idsString = params.get('ids');

      if (!idsString) {
        alert("IDs dos ensaios não fornecidos.");
        return;
      }

      const ids = idsString.split(',');
      const loadedEnsaios = [];

      for (const id of ids) {
        try {
          let ensaio = null;
          let entityType = null;
          let obra = null;
          let regional = null;
          let project = null;

          const entityLoaders = [
            { type: 'DiarioObra', loader: () => base44.entities.DiarioObra.get(id) },
            { type: 'EnsaioCAUQ', loader: () => base44.entities.EnsaioCAUQ.get(id) },
            { type: 'EnsaioDensidade', loader: () => base44.entities.EnsaioDensidade.get(id) },
            { type: 'EnsaioDensidadeInSitu', loader: () => base44.entities.EnsaioDensidadeInSitu.get(id) },
            { type: 'EnsaioTaxaPinturaImprimacao', loader: () => base44.entities.EnsaioTaxaPinturaImprimacao.get(id) },
            { type: 'ChecklistUsina', loader: () => base44.entities.ChecklistUsina.get(id) },
            { type: 'ChecklistAplicacao', loader: () => base44.entities.ChecklistAplicacao.get(id) },
            { type: 'ChecklistMRAF', loader: () => base44.entities.ChecklistMRAF.get(id) },
            { type: 'ChecklistConcretagem', loader: () => base44.entities.ChecklistConcretagem.get(id) },
            { type: 'ChecklistTerraplanagem', loader: () => base44.entities.ChecklistTerraplanagem.get(id) },
            { type: 'EnsaioSondagem', loader: () => base44.entities.EnsaioSondagem.get(id) }
          ];

          for (const { type, loader } of entityLoaders) {
            try {
              ensaio = await loader();
              entityType = type;
              break;
            } catch (e) {
              continue;
            }
          }

          if (ensaio && ensaio.obra_id) {
            obra = await base44.entities.Obra.get(ensaio.obra_id);
            if (obra.regional_id) {
              regional = await base44.entities.Regional.get(obra.regional_id);
            }
          }

          if (ensaio && ensaio.project_id) {
            project = await base44.entities.Project.get(ensaio.project_id);
          }

          if (ensaio) {
            loadedEnsaios.push({ ensaio, entityType, obra, regional, project });
          }
        } catch (error) {
          console.error(`Erro ao carregar ensaio ${id}:`, error);
        }
      }

      setEnsaiosData(loadedEnsaios);
    } catch (error) {
      console.error("Erro ao carregar dados dos relatórios:", error);
      alert("Erro ao carregar dados dos relatórios.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderRelatorio = (data) => {
    const { ensaio, entityType, obra, regional, project } = data;

    switch (entityType) {
      case 'DiarioObra':
        return <RelatorioDiario diario={ensaio} obra={obra} regional={regional} />;
      case 'EnsaioDensidade':
        return <RelatorioDensidade ensaio={ensaio} obra={obra} regional={regional} project={project} />;
      case 'EnsaioDensidadeInSitu':
        return <RelatorioDensidadeInSitu ensaio={ensaio} obra={obra} regional={regional} />;
      case 'EnsaioTaxaPinturaImprimacao':
        return <RelatorioTaxaPinturaImprimacao ensaio={ensaio} obra={obra} regional={regional} />;
      case 'ChecklistUsina':
        return <RelatorioChecklist checklist={ensaio} obra={obra} regional={regional} project={project} />;
      case 'ChecklistAplicacao':
        return <RelatorioChecklistAplicacao checklist={ensaio} obra={obra} regional={regional} project={project} />;
      case 'ChecklistMRAF':
        return <RelatorioChecklistMRAF checklist={ensaio} obra={obra} regional={regional} project={project} />;
      case 'ChecklistConcretagem':
        return <RelatorioChecklistConcretagem checklist={ensaio} obra={obra} regional={regional} project={project} />;
      case 'ChecklistTerraplanagem':
        return <RelatorioChecklistTerraplanagem checklist={ensaio} obra={obra} regional={regional} project={project} />;
      default:
        return <div className="p-6 text-center">Tipo de relatório não suportado</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (ensaiosData.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <p className="text-slate-700">Nenhum ensaio encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório Consolidado ({ensaiosData.length} ensaio{ensaiosData.length > 1 ? 's' : ''})
          </h2>
          <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      {ensaiosData.map((data, index) => (
        <div key={data.ensaio.id} className={index < ensaiosData.length - 1 ? 'print:page-break-after' : ''}>
          {renderRelatorio(data)}
        </div>
      ))}
    </div>
  );
}