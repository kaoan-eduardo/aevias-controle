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
          ensaios: row.ENSAIOS ? row.ENSAIOS.split(';').map(e => e.trim()).filter(e => e) : [],
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
                Selecione um arquivo Excel com as colunas: FURO, RODOVIA, KM, PISTA, AMOSTRA, PROFUNDIDADE(M), MATERIAL, ENSAIOS (separados por ponto e vírgula)
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
          <div key={pageIdx} className="print:page-break-after page-break p-2 print:p-4 print:pt-8 min-h-screen print:min-h-[297mm]">
            <div className="grid grid-cols-2 gap-3 print:gap-4">
              {etiquetas.slice(pageIdx * 6, (pageIdx + 1) * 6).map((etiqueta, idx) => (
                <div key={pageIdx * 6 + idx} className="border border-[#00233B] p-3 print:p-4 bg-white">
                  {/* Header */}
                  <div className="grid grid-cols-[120px_1fr] gap-0 mb-3 print:mb-2 border-b border-[#00233B] pb-2 print:pb-1.5">
                    <div className="flex items-center justify-center border-r border-[#00233B] pr-2">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a7599ee3fb9205cfb852ec/47ee9630a_AE-LogoVerPrincipal_1.png"
                        alt="AfirmaEvias"
                        className="h-10 print:h-9 w-auto object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-center px-2">
                      <h2 className="text-sm print:text-xs font-bold text-[#00233B] text-center leading-tight">
                        ETIQUETA PARA COLETA DE AMOSTRA SOLO
                      </h2>
                    </div>
                  </div>

                  {/* Dados Principais */}
                  <table className="w-full mb-3 print:mb-2 text-xs print:text-[10px] border-collapse">
                    <colgroup>
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '65%' }} />
                    </colgroup>
                    <tbody>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 font-bold bg-white">RODOVIA:</td>
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 bg-white">{etiqueta.rodovia}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 font-bold bg-white">KM:</td>
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 bg-white">{etiqueta.km}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 font-bold bg-white">FURO:</td>
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 bg-white">{etiqueta.furo}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 font-bold bg-white">PISTA:</td>
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 bg-white">{etiqueta.pista}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 font-bold bg-white">AMOSTRA:</td>
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 bg-white">{etiqueta.amostra}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 font-bold bg-white">PROFUNDIDADE:</td>
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 bg-white">{etiqueta.profundidade}</td>
                      </tr>
                      <tr className="border border-[#00233B]">
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 font-bold bg-white">MATERIAL:</td>
                        <td className="border border-[#00233B] px-2 py-3 print:py-3 bg-white">{etiqueta.material}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Ensaios Solicitados */}
                  <div className="border border-[#00233B] mb-2 print:mb-1.5">
                    <div className="bg-[#BFCF99] px-2 py-1.5 print:py-1 font-bold text-[#00233B] text-xs print:text-[10px] border-b border-[#00233B] text-center">
                      ENSAIOS SOLICITADOS
                    </div>
                    <div className="bg-white px-2 py-3 print:py-3 space-y-2 text-xs print:text-[9px] min-h-[90px] print:min-h-[110px]">
                      {etiqueta.ensaios && etiqueta.ensaios.length > 0 ? (
                        etiqueta.ensaios.map((ensaio, ensaioIdx) => (
                          <div key={ensaioIdx} className="flex items-start gap-2 py-1">
                            <span className="font-bold text-base">✓</span>
                            <span className="flex-1">{ensaio}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full">{/* Espaço em branco para preenchimento manual */}</div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="border border-[#00233B] bg-white px-2 py-3 print:py-3 space-y-2 text-xs print:text-[9px]">
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
        }
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: 100% !important;
          }
          .print\\:page-break-after {
            page-break-after: always;
            break-after: page;
          }
          .print\\:hidden {
            display: none !important;
          }
          header, nav, .no-print {
            display: none !important;
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