import React, { useState, useEffect } from 'react';
import { useReportMode } from "@/hooks/useReportMode";
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import RelatorioManchaPenduloComponent from '@/components/relatorios/RelatorioManchaPendulo';
import AprovacaoBar from '../components/relatorios/AprovacaoBar';

export default function RelatorioManchaPenduloPage() {
  useReportMode();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const ensaioData = await base44.entities.EnsaioManchaPendulo.get(id);
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
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
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
            Relatório de Macrotextura e Microtextura
          </h2>
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="EnsaioManchaPendulo" recordId={ensaio.id} />}
            <Button onClick={handlePrint} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <RelatorioManchaPenduloComponent ensaio={ensaio} obra={obra} regional={regional} />
    </div>
  );
}