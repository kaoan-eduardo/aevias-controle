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
        {Array.from({ length: Math.ceil(etiquetas.length / 4) }).map((_, pageIdx) => (
          <div key={pageIdx} className="print:page-break-after page-break p-2 print:p-1 min-h-screen print:min-h-[297mm]">
            <div className="grid grid-cols-2 gap-2 print:gap-1.5">
              {etiquetas.slice(pageIdx * 4, (pageIdx + 1) * 4).map((etiqueta, idx) => (
                <div key={pageIdx * 4 + idx} className="p-4 print:p-5 bg-white" style={{ border: '0.5mm solid #000' }}>
                  {/* Header */}
                  <div className="grid grid-cols-[140px_1fr] gap-0 mb-4 print:mb-3 pb-3 print:pb-2" style={{ borderBottom: '0.5mm solid #000', alignItems: 'stretch' }}>
                    <div className="flex items-center justify-center pr-2" style={{ borderRight: '0.5mm solid #000' }}>
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a7599ee3fb9205cfb852ec/47ee9630a_AE-LogoVerPrincipal_1.png"
                        alt="AfirmaEvias"
                        className="h-12 print:h-11 w-auto object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-center px-2">
                      <h2 className="text-base print:text-sm font-bold text-[#00233B] text-center leading-tight">
                        ETIQUETA PARA COLETA DE AMOSTRA SOLO
                      </h2>
                    </div>
                  </div>

                  {/* Dados Principais */}
                  <table className="w-full mb-4 print:mb-3 text-sm print:text-xs" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                    <colgroup>
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '65%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>RODOVIA:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>{etiqueta.rodovia}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>KM:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>{etiqueta.km}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '40px', backgroundColor: '#f4f4f5', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>FURO:</td>
                        <td className="bg-white font-bold" style={{ border: '0.5mm solid #000', height: '40px', backgroundColor: '#f4f4f5', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>{etiqueta.furo}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>PISTA:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>{etiqueta.pista}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>AMOSTRA:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>{etiqueta.amostra}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>PROFUNDIDADE:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>{etiqueta.profundidade}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>MATERIAL:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '40px', paddingLeft: '12px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px' }}>{etiqueta.material}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Ensaios Solicitados */}
                  <div className="mb-3 print:mb-2" style={{ border: '0.5mm solid #000' }}>
                    <div className="bg-[#BFCF99] font-bold text-[#00233B] text-sm print:text-xs text-center" style={{ borderBottom: '0.5mm solid #000', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}>
                      ENSAIOS SOLICITADOS
                    </div>
                    <div className="bg-white space-y-2 text-sm print:text-xs min-h-[80px] print:min-h-[90px]" style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '16px', paddingBottom: '16px' }}>
                      {etiqueta.ensaios && etiqueta.ensaios.length > 0 ? (
                        etiqueta.ensaios.map((ensaio, ensaioIdx) => (
                          <div key={ensaioIdx} className="flex items-start gap-2 py-1">
                            <span className="font-bold text-lg">✓</span>
                            <span className="flex-1">{ensaio}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full">{/* Espaço em branco para preenchimento manual */}</div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="bg-white text-sm print:text-xs" style={{ border: '0.5mm solid #000' }}>
                    <div className="font-bold" style={{ height: '50px', display: 'flex', alignItems: 'center', paddingLeft: '12px', paddingRight: '12px' }}>RESPONSÁVEL COLETA:</div>
                    <div className="font-bold" style={{ height: '50px', display: 'flex', alignItems: 'center', paddingLeft: '12px', paddingRight: '12px' }}>DATA:</div>
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
          margin: 6mm 3mm;
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