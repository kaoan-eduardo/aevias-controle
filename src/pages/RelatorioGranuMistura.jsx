import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Printer } from "lucide-react";
import RelatorioGranuMistura from "@/components/relatorios/RelatorioGranuMistura";
import { createPageUrl } from "@/utils";

export default function RelatorioGranuMisturaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recordId = searchParams.get("id");
  const [loading, setLoading] = useState(!recordId);

  useEffect(() => {
    if (recordId) setLoading(false);
  }, [recordId]);

  if (!recordId) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">ID do registro não fornecido</p>
          <Button onClick={() => navigate(createPageUrl("MeusEnsaios"))}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 !light" style={{ colorScheme: 'light' }}>
      <div className="flex justify-between items-center p-4 bg-white border-b fixed top-0 left-0 right-0 z-50 print:relative">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-lg font-bold">Relatório - Granulometria da Mistura</h1>
        <Button onClick={() => window.print()} className="gap-2 print:hidden">
          <Printer className="w-4 h-4" /> Imprimir
        </Button>
      </div>

      <div className="p-4 pt-24 print:pt-4">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg print:shadow-none">
            <RelatorioGranuMistura recordId={recordId} />
          </div>
        )}
      </div>
    </div>
  );
}