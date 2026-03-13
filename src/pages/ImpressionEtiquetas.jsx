import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader } from 'lucide-react';

export default function ImpressionEtiquetas() {
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [showRender, setShowRender] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErro('');
    
    try {
      const xlsxModule = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = xlsxModule.read(event.target?.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsxModule.utils.sheet_to_json(worksheet);

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

  if (!showRender) {
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
                accept=".xlsx,.xlsm,.xls,.csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
                id="file-input"
              />
              
              <Button
                onClick={() => document.getElementById('file-input').click()}
                className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 cursor-pointer"
                disabled={loading}
              >
                {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {loading ? 'Processando...' : 'Selecionar Arquivo'}
              </Button>

              {erro && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                  {erro}
                </div>
              )}
            </div>

            {etiquetas.length > 0 && (
              <div className="mt-8 p-6 bg-[#F2F1EF] rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#00233B] font-semibold">Arquivo carregado com sucesso!</p>
                    <p className="text-[#00233B]/70 text-sm">{etiquetas.length} etiquetas prontas para gerar</p>
                  </div>
                  <Button
                    onClick={() => setShowRender(true)}
                    className="bg-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/90 font-semibold"
                  >
                    Gerar Etiquetas →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4 print:p-0">
      <div className="mb-4 print:hidden flex gap-2 sticky top-0 bg-white z-10 py-2">
        <Button 
          onClick={handlePrint}
          className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90"
        >
          🖨️ Imprimir
        </Button>
        <Button 
          onClick={() => {
            setShowRender(false);
            setEtiquetas([]);
          }}
          variant="outline"
          className="border-[#BFCF99] text-[#00233B]"
        >
          ← Voltar
        </Button>
      </div>

      <div>
        {Array.from({ length: Math.ceil(etiquetas.length / 6) }).map((_, pageIdx) => (
          <div key={pageIdx} className="print:page-break-after page-break p-2 print:p-4 min-h-screen print:min-h-[297mm]">
            <div className="grid grid-cols-2 gap-3 print:gap-4">
              {etiquetas.slice(pageIdx * 6, (pageIdx + 1) * 6).map((etiqueta, idx) => (
                <div key={pageIdx * 6 + idx} className="border-2 border-[#00233B] p-3 print:p-4 bg-white">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 print:mb-1.5">
                    <div className="flex-shrink-0">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a7599ee3fb9205cfb852ec/b2878d2bd_image.png"
                        alt="Afirmaevias"
                        className="h-6 print:h-5 object-contain"
                      />
                    </div>
                    <div className="flex-1 border-b border-[#00233B]">
                      <h2 className="text-xs print:text-[10px] font-bold text-[#00233B]">
                        ETIQUETA COLETA AMOSTRA SOLO
                      </h2>
                    </div>
                  </div>

                  {/* Dados Principais */}
                  <table className="w-full mb-2 print:mb-1 text-xs print:text-[10px] border-collapse">
                    <tbody>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 font-bold bg-[#F2F1EF]">RODOVIA:</td>
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5">{etiqueta.rodovia}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 font-bold bg-[#F2F1EF]">KM:</td>
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5">{etiqueta.km}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 font-bold bg-[#BFCF99]">FURO:</td>
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 bg-[#BFCF99]">{etiqueta.furo}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 font-bold bg-[#F2F1EF]">PISTA:</td>
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5">{etiqueta.pista}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 font-bold bg-[#F2F1EF]">AMOSTRA:</td>
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5">{etiqueta.amostra}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 font-bold bg-[#F2F1EF]">PROFUNDIDADE:</td>
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5">{etiqueta.profundidade}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5 font-bold bg-[#F2F1EF]">MATERIAL:</td>
                        <td className="border border-[#00233B] px-2 py-1.5 print:py-1.5">{etiqueta.material}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Ensaios Solicitados */}
                  <div className="border border-[#00233B] mb-1 print:mb-0.5">
                    <div className="bg-[#BFCF99] px-1 py-0.5 print:py-0 font-bold text-[#00233B] text-xs print:text-[9px] border-b border-[#00233B]">
                      ENSAIOS
                    </div>
                    <div className="px-1 py-3 print:py-6 space-y-0 text-xs print:text-[8px] min-h-[60px] print:min-h-[80px]">
                      {/* Espaço em branco para preenchimento manual */}
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="border border-[#00233B] px-1 py-0.5 print:py-0 space-y-0 text-xs print:text-[8px]">
                    <div><span className="font-bold">RESPONSÁVEL COLETA:</span> ___________</div>
                    <div><span className="font-bold">DATA:</span> ___________</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @page {
          size: A4;
          margin: 0;
          padding: 0;
        }
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:page-break-after {
            page-break-after: always;
            break-after: page;
          }
          .print\\:hidden {
            display: none;
          }
          /* Remove cabeçalhos e rodapés padrão da impressão */
          @page {
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}