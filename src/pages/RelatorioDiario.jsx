import React, { useState, useEffect } from 'react';
import { useReportMode } from "@/hooks/useReportMode";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import AprovacaoBar from '../components/relatorios/AprovacaoBar';
import { DiarioObra } from '@/entities/DiarioObra';
import { Obra } from '@/entities/Obra';
import { Project } from '@/entities/Project';
import { User } from '@/entities/User';
import { base44 } from '@/api/base44Client';
import RelatorioDiarioComponent from '../components/relatorios/RelatorioDiario';

export default function RelatorioDiarioPage() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null
  });

  useReportMode();

  const loadReportData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (!id) throw new Error('ID do diário é obrigatório na URL');

      // Verificar autenticação
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        throw new Error('Você precisa estar autenticado para visualizar este relatório');
      }

      const user = await User.me();
      const diario = await DiarioObra.get(id);

      // Buscar o usuário que criou o diário para obter o cargo
      let creatorUser = null;
      if (diario.created_by) {
        try {
          const allUsers = await base44.entities.User.list();
          creatorUser = allUsers.find(u => u.email?.toLowerCase() === diario.created_by?.toLowerCase()) || null;
        } catch (err) {
          console.warn("Não foi possível buscar dados do criador:", err);
        }
      }

      if (!diario) throw new Error(`Diário com ID ${id} não encontrado`);

      let obra = null;
      let project = null;
      let regional = null;
      if (diario.obra_id) {
        try {
          obra = await Obra.get(diario.obra_id);
        } catch (err) {
          console.warn("Obra não encontrada:", diario.obra_id);
        }
        
        if (obra && obra.project_id) {
          try {
            project = await Project.get(obra.project_id);
          } catch (err) {
            console.warn("Projeto não encontrado:", obra.project_id);
          }
        }
        
        if (obra && obra.regional_id) {
          try {
            regional = await base44.entities.Regional.get(obra.regional_id);
          } catch (err) {
            console.warn("Regional não encontrada:", obra.regional_id);
          }
        }
      }

      setState({
        loading: false,
        error: null,
        data: { diario, obra, project, user, regional, creatorUser }
      });
    } catch (error) {
      console.error('Erro ao carregar relatório do diário:', error);
      setState({ loading: false, error: error.message, data: null });
    }
  };

  useEffect(() => {
    loadReportData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = () => {
    window.print();
  };

  if (state.loading) {
    return <div className="p-8 text-center">Carregando relatório...</div>;
  }

  if (state.error) {
    return <div className="p-8 text-center text-red-600">Erro: {state.error}</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Diário de Obra
          </h2>
          <div className="flex items-center gap-2">
            {state.data && <AprovacaoBar entityName="DiarioObra" recordId={state.data.diario?.id} />}
            <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </div>
      
      <div className="report-content-container w-full bg-white print:bg-white">
        {state.data && (
          <RelatorioDiarioComponent 
            diario={state.data.diario} 
            obra={state.data.obra} 
            project={state.data.project} 
            user={state.data.user}
            regional={state.data.regional}
            creatorUser={state.data.creatorUser}
          />
        )}
      </div>

      <style>{`
        @media screen {
          .report-content-container {
            max-width: 210mm;
            margin: 0 auto;
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
          .break-before-page { page-break-before: always; break-before: page; }
          .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          @page {
            size: A4;
            margin: 0;
            padding: 0;
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