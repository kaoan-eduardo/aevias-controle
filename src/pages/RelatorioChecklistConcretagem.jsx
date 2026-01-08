import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import RelatorioChecklistConcretagemComponent from "../components/relatorios/RelatorioChecklistConcretagem";

export default function RelatorioChecklistConcretagemPage() {
  const location = useLocation();
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
  }, [location]);

  const loadChecklist = async () => {
    try {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");

      if (!id) {
        alert("ID do checklist não encontrado");
        return;
      }

      const checklistData = await base44.entities.ChecklistConcretagem.get(id);
      setChecklist(checklistData);
    } catch (error) {
      console.error("Erro ao carregar checklist:", error);
      alert("Erro ao carregar checklist");
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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Checklist não encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Checklist de Concretagem
          </h2>
          <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      <RelatorioChecklistConcretagemComponent checklist={checklist} />
    </div>
  );
}