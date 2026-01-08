import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { ChecklistUsina } from '@/entities/ChecklistUsina';
import { Obra } from '@/entities/Obra';
import { Regional } from '@/entities/Regional';
import { Project } from '@/entities/Project'; // Import Project
import { User } from '@/entities/User';
import RelatorioChecklistComponent from '../components/relatorios/RelatorioChecklist';

export default function RelatorioChecklistPage() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null
  });

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (!id) throw new Error('ID do checklist é obrigatório na URL');

        const [checklist, user, obras, regionais, projects] = await Promise.all([
          ChecklistUsina.get(id),
          User.me(),
          Obra.list(),
          Regional.list(),
          Project.list()
        ]);

        if (!checklist) throw new Error(`Checklist com ID ${id} não encontrado`);

        let obra = null;
        let regional = null;
        if (checklist.obra_id) {
          obra = obras.find(o => o.id === checklist.obra_id);
          if (obra && obra.regional_id) {
            regional = regionais.find(r => r.id === obra.regional_id);
          }
        }
        
        let project = null;
        if (checklist.project_id) {
          project = projects.find(p => p.id === checklist.project_id);
        }

        setState({
          loading: false,
          error: null,
          data: { checklist, obra, regional, project, user }
        });
      } catch (error) {
        console.error('Erro ao carregar relatório do checklist:', error);
        setState({ loading: false, error: error.message, data: null });
      }
    };
    
    loadReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-slate-700">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return <div className="p-8 text-center text-red-600">Erro: {state.error}</div>;
  }

  return (
    <div className="print:p-0 bg-slate-50 print:bg-white">
      <div className="no-print fixed top-6 right-8 z-50">
        <Button onClick={handlePrint} variant="default" className="shadow-lg bg-blue-600 hover:bg-blue-700">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / Salvar PDF
        </Button>
      </div>
      
      <div className="report-content-container w-full bg-white print:bg-white">
        {state.data && (
          <RelatorioChecklistComponent 
            checklist={state.data.checklist} 
            obra={state.data.obra} 
            regional={state.data.regional} 
            project={state.data.project} 
            user={state.data.user} 
          />
        )}
      </div>

      <style jsx global>{`
        @media screen {
          .report-content-container {
            max-width: 210mm;
            margin: 2rem auto;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        }
        
        @media print {
          * { box-sizing: border-box; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .no-print, .no-print * { display: none !important; visibility: hidden !important; }
          .report-content-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .page-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%; /* Use 100% for flex to work within @page */
          }
          .break-before-page { page-break-before: always; break-before: page; }
          .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          @page {
            size: A4;
            margin: 0;
          }
          body > * {
            max-width: 100vw !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}