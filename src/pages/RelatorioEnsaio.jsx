import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { EnsaioExtracaoGranMarshall } from '@/entities/EnsaioExtracaoGranMarshall';
import { EnsaioDensidade } from '@/entities/EnsaioDensidade';
import { Obra } from '@/entities/Obra';
import { Project } from '@/entities/Project';
import { User } from '@/entities/User';
import RelatorioMarshall from '../components/relatorios/RelatorioMarshall';
import RelatorioDensidade from '../components/relatorios/RelatorioDensidade';

export default function RelatorioEnsaio() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      const tipo = urlParams.get('tipo');

      if (!id || !tipo) throw new Error('ID e tipo são obrigatórios na URL');

      const user = await User.me();
      
      const [ensaiosMarshall, ensaiosDensidade, obras, projects] = await Promise.all([
        EnsaioExtracaoGranMarshall.list(),
        EnsaioDensidade.list(),
        Obra.list(),
        Project.list()
      ]);

      let record;
      if (tipo === 'marshall') record = ensaiosMarshall.find(r => r.id === id);
      else if (tipo === 'densidade') record = ensaiosDensidade.find(r => r.id === id);

      // Note: 'diario' type is now handled by a separate dedicated page/component.
      // If 'tipo' is 'diario' here, 'record' will remain undefined, and the
      // subsequent check will correctly report it as not found (or invalid type for this page).

      if (!record) throw new Error(`Registro ${tipo} com ID ${id} não encontrado`);

      let obra = null;
      let project = null;
      if (record.obra_id) {
        obra = obras.find(o => o.id === record.obra_id);
        if (obra && obra.project_id) {
          project = projects.find(p => p.id === obra.project_id);
        }
      }

      setState({
        loading: false,
        error: null,
        data: { tipo, record, obra, project, user }
      });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setState({ loading: false, error: error.message, data: null });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (state.loading) {
    return <div className="p-8 text-center">Carregando relatório...</div>;
  }

  if (state.error) {
    return <div className="p-8 text-center text-red-600">Erro: {state.error}</div>;
  }

  const renderReport = () => {
    if (!state.data) return null;
    const { tipo, record, obra, project, user } = state.data;
    switch (tipo) {
      case 'marshall':
        return <RelatorioMarshall ensaio={record} obra={obra} project={project} user={user} />;
      case 'densidade':
        return <RelatorioDensidade ensaio={record} obra={obra} project={project} user={user} />;
      default:
        return <div>Tipo de relatório inválido</div>;
    }
  };

  const getTipoRelatorioNome = () => {
    if (state.data?.tipo === 'marshall') return 'Extração + Gran + Marshall';
    if (state.data?.tipo === 'densidade') return 'Densidade CP Extraído';
    return 'Relatório de Ensaio';
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de {getTipoRelatorioNome()}
          </h2>
          <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>
      
      <div className="report-content-container w-full bg-white print:bg-white">
        {renderReport()}
      </div>

      <style jsx global>{`
        @media screen {
          .report-content-container {
            max-width: 210mm; /* A4 width */
            margin: 0 auto;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
        }
        
        @media print {
          * {
            box-sizing: border-box;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .no-print, 
          .no-print * { 
            display: none !important; 
            visibility: hidden !important;
          }
          
          .report-content-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          
          .break-before-page { 
            page-break-before: always; 
            break-before: page;
          }
          
          .break-inside-avoid { 
            page-break-inside: avoid; 
            break-inside: avoid;
          }
          
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }
          
          /* Force content to respect page boundaries and prevent overflow in print */
          body > * {
            max-width: 100vw !important;
            overflow: visible !important; /* Changed from 100vw to visible to allow content to flow */
          }
        }
      `}</style>
    </div>
  );
}