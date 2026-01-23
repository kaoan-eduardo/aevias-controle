import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2 } from "lucide-react";
import RelatorioChecklistReciclagem from "../components/relatorios/RelatorioChecklistReciclagem";

export default function RelatorioChecklistReciclagemPage() {
  const [checklist, setChecklist] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const checklistId = params.get('id');

      if (!checklistId) {
        setError("ID do checklist não fornecido");
        return;
      }

      const checklistData = await base44.entities.ChecklistReciclagem.get(checklistId);
      setChecklist(checklistData);

      if (checklistData.obra_id) {
        const obraData = await base44.entities.Obra.get(checklistData.obra_id);
        setObra(obraData);

        if (obraData.regional_id) {
          const regionalData = await base44.entities.Regional.get(obraData.regional_id);
          setRegional(regionalData);
        }
      }

      if (checklistData.project_id) {
        const projectData = await base44.entities.Project.get(checklistData.project_id);
        setProject(projectData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600">{error || "Erro ao carregar relatório"}</p>
      </div>
    );
  }

  useEffect(() => {
    // Disable Radix UI portal warnings in print context
    const style = document.createElement('style');
    style.textContent = `
      [data-radix-portal] { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório - Checklist de Reciclagem
          </h2>
          <button 
            onClick={handlePrint} 
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-slate-800 text-white hover:bg-slate-700 h-9 px-4 py-2"
          >
            <Download className="w-4 h-4" />
            Gerar PDF
          </button>
        </div>
      </div>

      <div className="print:pt-0 print:pb-0">
        <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-6 print:p-4">
          <RelatorioChecklistReciclagem 
            checklist={checklist} 
            obra={obra} 
            regional={regional}
            project={project}
          />
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .break-after-page {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}