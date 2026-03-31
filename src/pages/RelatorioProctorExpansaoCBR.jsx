import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AprovacaoBar from "@/components/relatorios/AprovacaoBar";
import RelatorioProctorExpansaoCBR from "@/components/relatorios/RelatorioProctorExpansaoCBR";
import { useReportMode } from "@/hooks/useReportMode";

export default function RelatorioProctorExpansaoCBRPage() {
  useReportMode();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ensaioId = searchParams.get("id");

  useEffect(() => {
    loadData();
  }, [ensaioId]);

  const loadData = async () => {
    if (!ensaioId) {
      setError("ID do ensaio não fornecido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const ensaioData = await base44.entities.EnsaioProctorExpansaoCBR.get(ensaioId);
      setEnsaio(ensaioData);

      if (ensaioData.obra_id) {
        const obraData = await base44.entities.Obra.get(ensaioData.obra_id);
        setObra(obraData);

        if (obraData.regional_id) {
          const regionalData = await base44.entities.Regional.get(obraData.regional_id);
          setRegional(regionalData);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !ensaio) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error || "Relatório não encontrado"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#00233B]">Relatório Proctor + Expansão + CBR</h1>
        <AprovacaoBar entityName="EnsaioProctorExpansaoCBR" recordId={ensaioId} />
      </div>
      
      <div className="print:p-0 p-6">
        <RelatorioProctorExpansaoCBR ensaio={ensaio} obra={obra} regional={regional} />
      </div>
    </div>
  );
}