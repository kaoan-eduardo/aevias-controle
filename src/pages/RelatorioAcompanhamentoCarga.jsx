import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Project } from "@/entities/Project";
import RelatorioAcompanhamentoCarga from "@/components/relatorios/RelatorioAcompanhamentoCarga";

export default function RelatorioAcompanhamentoCargaPage() {
  const [acompanhamento, setAcompanhamento] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [projeto, setProjeto] = useState(null);
  const [faixaGranulometrica, setFaixaGranulometrica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (!id) {
        setError("ID do acompanhamento não fornecido");
        setLoading(false);
        return;
      }

      const acompanhamentoData = await base44.entities.AcompanhamentoCarga.get(id);
      setAcompanhamento(acompanhamentoData);

      if (acompanhamentoData.obra_id) {
        const obraData = await Obra.get(acompanhamentoData.obra_id);
        setObra(obraData);

        if (obraData.regional_id) {
          const regionalData = await Regional.get(obraData.regional_id);
          setRegional(regionalData);
        }
      }

      if (acompanhamentoData.project_id) {
        const projetoData = await Project.get(acompanhamentoData.project_id);
        setProjeto(projetoData);

        // Buscar faixa granulométrica pelo ID se existir
        if (projetoData.faixa_granulometrica_id) {
          try {
            const faixaData = await base44.entities.FaixaGranulometrica.get(projetoData.faixa_granulometrica_id);
            setFaixaGranulometrica(faixaData);
          } catch (err) {
            console.warn("Faixa granulométrica não encontrada:", err);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados do acompanhamento");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#00233B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg my-4 print:my-0 print:shadow-none">
        <div className="fixed top-4 right-4 z-50 print:hidden">
          <Button
            onClick={handlePrint}
            className="bg-[#00233B] text-white hover:bg-[#00233B]/90 shadow-lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>

        <RelatorioAcompanhamentoCarga
          acompanhamento={acompanhamento}
          obra={obra}
          regional={regional}
          projeto={projeto}
          faixaGranulometrica={faixaGranulometrica}
        />
      </div>

      <style>{`
        @media print {
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .max-w-\\[210mm\\], .max-w-\\[210mm\\] * {
            visibility: visible;
          }
          
          .max-w-\\[210mm\\] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}