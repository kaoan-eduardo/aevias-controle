import React, { useState, useEffect, useRef } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import RelatorioTaxaPinturaImprimacao from "@/components/relatorios/RelatorioTaxaPinturaImprimacao";
import AprovacaoBar from '../components/relatorios/AprovacaoBar';

export default function RelatorioTaxaPinturaImprimacaoPage() {
  useReportMode();
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const location = useLocation();
  const reportRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const ensaioId = params.get('id');

        if (!ensaioId) {
          alert("ID do ensaio não fornecido.");
          return;
        }

        const ensaioData = await base44.entities.EnsaioTaxaPinturaImprimacao.get(ensaioId);
        setEnsaio(ensaioData);

        if (ensaioData.obra_id) {
          const obraData = await base44.entities.Obra.get(ensaioData.obra_id);
          setObra(obraData);

          if (obraData.regional_id) {
            const regionalData = await base44.entities.Regional.get(obraData.regional_id);
            setRegional(regionalData);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do relatório:", error);
        alert("Erro ao carregar dados do relatório.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.search]);

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    
    setGeneratingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft >= 0) {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
        position -= 297;
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      pdf.save(`taxa-pintura-${ensaio.id}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!ensaio) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <p className="text-slate-700">Ensaio não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Taxa de Pintura/Imprimação
          </h2>
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="EnsaioTaxaPinturaImprimacao" recordId={ensaio.id} />}
            <Button 
              onClick={handleGeneratePDF} 
              disabled={generatingPDF}
              className="bg-slate-800 text-white hover:bg-slate-700"
            >
              {generatingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {generatingPDF ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="bg-white">
        <RelatorioTaxaPinturaImprimacao ensaio={ensaio} obra={obra} regional={regional} />
      </div>
    </div>
  );
}