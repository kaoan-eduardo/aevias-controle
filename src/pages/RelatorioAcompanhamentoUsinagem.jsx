import React, { useState, useEffect } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RelatorioAcompanhamentoUsinagem from "../components/relatorios/RelatorioAcompanhamentoUsinagem";
import AprovacaoBar from '../components/relatorios/AprovacaoBar';

export default function RelatorioAcompanhamentoUsinagemPage() {
  useReportMode();
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const ensaioId = params.get('id');

        if (!ensaioId) {
          setError("ID do ensaio não fornecido");
          return;
        }

        const ensaioData = await base44.entities.AcompanhamentoUsinagem.get(ensaioId);
        setEnsaio(ensaioData);

        if (ensaioData.obra_id) {
          const obraData = await base44.entities.Obra.get(ensaioData.obra_id);
          setObra(obraData);

          if (obraData.regional_id) {
            const regionalData = await base44.entities.Regional.get(obraData.regional_id);
            setRegional(regionalData);
          }
        }

        if (ensaioData.project_id) {
          const projectData = await base44.entities.Project.get(ensaioData.project_id);
          setProject(projectData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar dados do relatório");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !ensaio) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600">{error || "Erro ao carregar relatório"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-end items-center">
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="AcompanhamentoUsinagem" recordId={ensaio.id} />}
          </div>
        </div>
      </div>
      <RelatorioAcompanhamentoUsinagem ensaio={ensaio} obra={obra} regional={regional} project={project} />
    </div>
  );
}