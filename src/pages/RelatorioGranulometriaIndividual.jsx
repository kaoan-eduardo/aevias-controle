import React, { useEffect, useState } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RelatorioGranulometriaIndividual from "../components/relatorios/RelatorioGranulometriaIndividual";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import AprovacaoBar from '../components/relatorios/AprovacaoBar';

export default function RelatorioGranulometriaIndividualPage() {
  useReportMode();
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const ensaioId = params.get("id");

        if (!ensaioId) {
          alert("ID do ensaio não fornecido.");
          return;
        }

        const [ensaioData, currentUser] = await Promise.all([
          base44.entities.EnsaioGranulometriaIndividual.get(ensaioId),
          base44.auth.me()
        ]);

        setEnsaio(ensaioData);
        setUser(currentUser);

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
        alert("Erro ao carregar o relatório.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.search]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Relatório de Granulometria Individual</h2>
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="EnsaioGranulometriaIndividual" recordId={ensaio.id} />}
            <Button onClick={() => window.print()} className="bg-slate-800 text-white hover:bg-slate-700">
              <Printer className="w-4 h-4 mr-2" /> Gerar PDF
            </Button>
          </div>
        </div>
      </div>
      <RelatorioGranulometriaIndividual
        ensaio={ensaio}
        obra={obra}
        project={project}
        user={user}
        regional={regional}
      />
    </div>
  );
}