import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import RelatorioChecklistTerraplanagem from "../components/relatorios/RelatorioChecklistTerraplanagem";
import AprovacaoBar from '../components/relatorios/AprovacaoBar';

export default function RelatorioChecklistTerraplanamemPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const checklistId = urlParams.get('id');

      if (!checklistId) {
        setError("ID do checklist não fornecido");
        setLoading(false);
        return;
      }

      const checklist = await base44.entities.ChecklistTerraplanagem.get(checklistId);

      let creatorUser = null;
      if (checklist.created_by) {
        try {
          const allUsers = await base44.entities.User.list();
          creatorUser = allUsers.find(u => u.email?.toLowerCase() === checklist.created_by?.toLowerCase()) || null;
        } catch (err) {
          console.warn("Não foi possível buscar dados do criador:", err);
        }
      }

      setReportData({ checklist, creatorUser });
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Checklist de Terraplanagem
          </h2>
          <div className="flex items-center gap-2">
            {reportData && <AprovacaoBar entityName="ChecklistTerraplanagem" recordId={reportData.checklist?.id} />}
            <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @media screen {
          body { margin: 0; padding: 0; }
        }
        
        @media print {
          @page { 
            size: A4 portrait;
            margin: 0;
          }
          body { 
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .page-container {
            page-break-after: always;
            page-break-inside: avoid;
          }
        }
      `}</style>
      
      <RelatorioChecklistTerraplanagem checklist={reportData.checklist} creatorUser={reportData.creatorUser} />
    </div>
  );
}