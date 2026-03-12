import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ImpressionEtiquetas() {
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErro('');
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Mapear colunas da planilha
        const processadas = data.map((row) => ({
          furo: row.FURO || '',
          rodovia: row.RODOVIA || '',
          km: row.KM || '',
          pista: row.PISTA || '',
          amostra: row.AMOSTRA || '',
          profundidade: row['PROFUNDIDADE(M)'] || '',
          material: row.MATERIAL || '',
        }));

        setEtiquetas(processadas);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      setErro('Erro ao processar arquivo. Verifique o formato.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (etiquetas.length === 0) {
    return (
      <div className="min-h-screen bg-[#F2F1EF] p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#00233B] mb-8">Impressão de Etiquetas - Sondagem</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="border-2 border-dashed border-[#BFCF99] rounded-lg p-12 text-center">
              <Upload className="w-16 h-16 text-[#BFCF99] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#00233B] mb-2">Carregue a Planilha de Etiquetas</h2>
              <p className="text-[#00233B]/70 mb-6">
                Selecione um arquivo Excel com as colunas: FURO, RODOVIA, KM, PISTA, AMOSTRA, PROFUNDIDADE(M), MATERIAL
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
                id="file-input"
              />
              
              <label htmlFor="file-input">
                <Button
                  as="span"
                  className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {loading ? 'Processando...' : 'Selecionar Arquivo'}
                </Button>
              </label>

              {erro && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                  {erro}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4 print:p-2">
      <div className="mb-4 print:hidden flex gap-2">
        <Button 
          onClick={handlePrint}
          className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90"
        >
          🖨️ Imprimir
        </Button>
        <Button 
          onClick={() => setEtiquetas([])}
          variant="outline"
          className="border-[#BFCF99] text-[#00233B]"
        >
          ← Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 print:gap-2">
        {etiquetas.map((etiqueta, idx) => (
          <div key={idx} className="page-break border-2 border-[#00233B] p-4 print:p-3 bg-white">
            {/* Header */}
            <div className="grid grid-cols-3 items-center mb-3 print:mb-2">
              <div className="flex items-center gap-1">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a7599ee3fb9205cfb852ec/b2878d2bd_image.png"
                  alt="Afirmaevias"
                  className="h-10 print:h-8 object-contain"
                />
              </div>
              <div className="text-center">
                <h2 className="text-sm print:text-xs font-bold text-[#00233B] border-b-2 border-[#00233B] pb-1 print:pb-0.5">
                  ETIQUETA PARA COLETA DE AMOSTRA SOLO
                </h2>
              </div>
              <div></div>
            </div>

            {/* Dados Principais */}
            <table className="w-full mb-3 print:mb-2 text-sm print:text-xs border-collapse">
              <tbody>
                <tr className="border border-[#00233B]">
                  <td className="border border-[#00233B] p-1 print:p-0.5 font-bold bg-[#F2F1EF]">RODOVIA:</td>
                  <td className="border border-[#00233B] p-1 print:p-0.5">{etiqueta.rodovia}</td>
                </tr>
                <tr className="border border-[#00233B]">
                  <td className="border border-[#00233B] p-1 print:p-0.5 font-bold bg-[#F2F1EF]">KM:</td>
                  <td className="border border-[#00233B] p-1 print:p-0.5">{etiqueta.km}</td>
                </tr>
                <tr className="border border-[#00233B]">
                  <td className="border border-[#00233B] p-1 print:p-0.5 font-bold bg-[#BFCF99]">FURO:</td>
                  <td className="border border-[#00233B] p-1 print:p-0.5 bg-[#BFCF99]">{etiqueta.furo}</td>
                </tr>
                <tr className="border border-[#00233B]">
                  <td className="border border-[#00233B] p-1 print:p-0.5 font-bold bg-[#F2F1EF]">PISTA:</td>
                  <td className="border border-[#00233B] p-1 print:p-0.5">{etiqueta.pista}</td>
                </tr>
                <tr className="border border-[#00233B]">
                  <td className="border border-[#00233B] p-1 print:p-0.5 font-bold bg-[#F2F1EF]">AMOSTRA:</td>
                  <td className="border border-[#00233B] p-1 print:p-0.5">{etiqueta.amostra}</td>
                </tr>
                <tr className="border border-[#00233B]">
                  <td className="border border-[#00233B] p-1 print:p-0.5 font-bold bg-[#F2F1EF]">PROFUNDIDADE(M):</td>
                  <td className="border border-[#00233B] p-1 print:p-0.5">{etiqueta.profundidade}</td>
                </tr>
                <tr className="border border-[#00233B]">
                  <td className="border border-[#00233B] p-1 print:p-0.5 font-bold bg-[#F2F1EF]">MATERIAL:</td>
                  <td className="border border-[#00233B] p-1 print:p-0.5">{etiqueta.material}</td>
                </tr>
              </tbody>
            </table>

            {/* Ensaios Solicitados */}
            <div className="border border-[#00233B] mb-2 print:mb-1">
              <div className="bg-[#BFCF99] p-1 print:p-0.5 font-bold text-[#00233B] text-sm print:text-xs border-b border-[#00233B]">
                ENSAIOS SOLICITADOS
              </div>
              <div className="p-2 print:p-1 space-y-1 print:space-y-0.5">
                <div className="text-sm print:text-xs"><span className="font-bold">X</span> COMPACTAÇÃO + CBR EXPANSÃO</div>
                <div className="text-sm print:text-xs"><span className="font-bold">X</span> CARACTERIZAÇÃO COMPLETA (TRB)</div>
                <div className="text-sm print:text-xs"><span className="font-bold">X</span> CLASSIFICAÇÃO MCT</div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="border border-[#00233B] p-1 print:p-0.5 space-y-0.5 print:space-y-0 text-sm print:text-xs">
              <div><span className="font-bold">Resp. Coleta:</span> _________________________</div>
              <div><span className="font-bold">Data da coleta:</span> _________________________</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>
    </div>
  );
}