import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import RelatorioManchaPenduloComponent from '@/components/relatorios/RelatorioManchaPendulo';

export default function RelatorioManchaPenduloPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando relatório...</p>
      </div>
    );
  }

  if (!ensaio) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Ensaio não encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={handlePrint} className="bg-[#00233B] hover:bg-[#00233B]/90 text-white shadow-lg">
          <FileText className="w-4 h-4 mr-2" />
          Gerar PDF
        </Button>
      </div>

      <RelatorioManchaPenduloComponent ensaio={ensaio} obra={obra} regional={regional} />

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}