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
        
        // Buscar nome da faixa granulométrica se houver faixa_granulometrica_id
        if (projetoData.faixa_granulometrica_id) {
          try {
            const faixa = await base44.entities.FaixaGranulometrica.get(projetoData.faixa_granulometrica_id);
            projetoData.faixa_especificada_nome = faixa.nome;
          } catch (error) {
            console.warn("Erro ao buscar faixa granulométrica:", error);
            projetoData.faixa_especificada_nome = 'N/A';
          }
        }
        
        setProjeto(projetoData);
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
    <div className="bg-white">
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
      />

      <style>{`
        @media screen {
          [data-sidebar] {
            display: block;
          }
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          [data-sidebar] {
            display: none !important;
          }
          header nav, header button, .sidebar, aside {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}