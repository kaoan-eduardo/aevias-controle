import React, { useState, useCallback, useEffect } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import RelatorioChecklistConcretagemComponent from "../components/relatorios/RelatorioChecklistConcretagem";
import AprovacaoBar from '../components/relatorios/AprovacaoBar';

export default function RelatorioChecklistConcretagemPage() {
  useReportMode();
  const location = useLocation();
  const [checklist, setChecklist] = useState(null);
  const [creatorUser, setCreatorUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadChecklist = useCallback(async () => {
    try {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");

      if (!id) {
        alert("ID do checklist não encontrado");
        return;
      }

      const checklistData = await base44.entities.ChecklistConcretagem.get(id);
      setChecklist(checklistData);

      if (checklistData.created_by) {
        const users = await base44.entities.User.filter({ email: checklistData.created_by });
        if (users && users.length > 0) setCreatorUser(users[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar checklist:", error);
      alert("Erro ao carregar checklist");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { loadChecklist(); }, [loadChecklist]);

  const handlePrint = () => {
    // Force the body to A4 width before printing so browser scales correctly
    const originalWidth = document.body.style.width;
    const originalOverflow = document.body.style.overflow;
    document.body.style.width = '210mm';
    document.body.style.overflow = 'visible';
    window.print();
    document.body.style.width = originalWidth;
    document.body.style.overflow = originalOverflow;
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
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html {
            width: 210mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          aside, nav, [data-sidebar], [role="navigation"], .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Checklist de Concretagem
          </h2>
          <div className="flex items-center gap-2">
            {checklist && <AprovacaoBar entityName="ChecklistConcretagem" recordId={checklist.id} />}
            <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <div style={{width:'210mm', margin:'0 auto'}}>
        <RelatorioChecklistConcretagemComponent checklist={checklist} creatorUser={creatorUser} />
      </div>
    </div>
  );
}