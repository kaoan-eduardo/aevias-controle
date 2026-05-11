import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader } from 'lucide-react';

export default function ImpressionEtiquetas() {
  const [tipoEtiqueta, setTipoEtiqueta] = useState('coleta');
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
      const xlsxModule = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workbook = xlsxModule.read(event.target?.result, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = xlsxModule.utils.sheet_to_json(worksheet);

          if (tipoEtiqueta === 'umidade') {
            const processadas = data.map((row) => ({
              furo: row.FURO || '',
              rodovia: row.RODOVIA || '',
              km: row.KM || '',
              pista: row.PISTA || '',
              tipo_umidade: row['TIPO UMIDADE'] || row['TIPO_UMIDADE'] || '',
            }));
            setEtiquetas(processadas);
          } else {
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
          }
        } catch (err) {
          setErro('Erro ao processar arquivo. Verifique o formato.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setErro('Erro ao ler o arquivo.');
        setLoading(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      setErro('Erro ao processar arquivo. Verifique o formato.');
      console.error(error);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Upload screen
  if (!showRender) {
    return (
      <div className="min-h-screen bg-[#F2F1EF] p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#00233B] mb-8">Impressão de Etiquetas - Sondagem</h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <span className="block text-sm font-semibold text-[#00233B] mb-2">Tipo de Etiqueta</span>
            <select
              value={tipoEtiqueta}
              onChange={(e) => { setTipoEtiqueta(e.target.value); setEtiquetas([]); setErro(''); setShowRender(false); }}
              className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00233B]/30"
            >
              <option value="coleta">Etiqueta de Coleta</option>
              <option value="umidade">Etiqueta de Umidade</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="border-2 border-dashed border-[#BFCF99] rounded-lg p-12 text-center">
              <Upload className="w-16 h-16 text-[#BFCF99] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#00233B] mb-2">Carregue a Planilha de Etiquetas</h2>
              <p className="text-[#00233B]/70 mb-6">
                {tipoEtiqueta === 'coleta'
                  ? 'Selecione um arquivo Excel com as colunas: FURO, RODOVIA, KM, PISTA, AMOSTRA, PROFUNDIDADE(M), MATERIAL, ENSAIOS (separados por ponto e vírgula)'
                  : 'Selecione um arquivo Excel com as colunas: FURO, RODOVIA, KM, PISTA, TIPO UMIDADE'}
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

  // Umidade render
  if (tipoEtiqueta === 'umidade') {
    return (
      <div className="bg-white min-h-screen p-4 print:p-0">
        <div className="mb-4 print:hidden flex gap-2 sticky top-0 bg-white z-10 py-2">
          <Button onClick={handlePrint} className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">🖨️ Imprimir</Button>
          <Button onClick={() => { setShowRender(false); setEtiquetas([]); }} variant="outline" className="border-[#BFCF99] text-[#00233B]">← Voltar</Button>
        </div>

        <div>
          {Array.from({ length: Math.ceil(etiquetas.length / 32) }).map((_, pageIdx) => (
            <div key={pageIdx} className="page-container">
              <div className="grid grid-cols-4 gap-2">
                {etiquetas.slice(pageIdx * 32, (pageIdx + 1) * 32).map((etiqueta, idx) => (
                  <div key={idx} style={{ border: '0.5mm solid #aaa', fontSize: '11px' }}>
                    <div style={{ background: '#BFCF99', borderBottom: '0.5mm solid #aaa', padding: '6px 8px', textAlign: 'center', fontStyle: 'italic', fontWeight: 'bold', color: '#00233B' }}>
                      {etiqueta.furo}
                    </div>
                    <div style={{ borderBottom: '0.5mm solid #aaa', padding: '6px 8px', textAlign: 'center', fontStyle: 'italic', background: '#fff', color: '#00233B' }}>
                      {etiqueta.rodovia}
                    </div>
                    <div style={{ borderBottom: '0.5mm solid #aaa', padding: '6px 8px', textAlign: 'center', fontStyle: 'italic', background: '#fff', color: '#00233B' }}>
                      {etiqueta.km}
                    </div>
                    <div style={{ borderBottom: '0.5mm solid #aaa', padding: '6px 8px', textAlign: 'center', fontStyle: 'italic', background: '#fff', color: '#00233B' }}>
                      {etiqueta.pista}
                    </div>
                    <div style={{ background: '#BFCF99', padding: '6px 8px', textAlign: 'center', fontStyle: 'italic', fontWeight: 'bold', color: '#00233B' }}>
                      {etiqueta.tipo_umidade}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .page-container { padding: 8px; page-break-after: always !important; break-after: page !important; display: block !important; }
          .page-container:last-child { page-break-after: auto !important; break-after: auto !important; }
          @page { size: A4; margin: 8mm 6mm; }
          @media screen { .page-container { min-height: 100vh; margin-bottom: 20px; border: 1px solid #e5e7eb; } }
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow: visible !important; }
            *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
            html, body, div, section, main { overflow: visible !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
            .page-container { padding: 4px; page-break-after: always !important; overflow: visible !important; }
            .page-container:last-child { page-break-after: auto !important; }
            .print\\:hidden { display: none !important; }
            header, nav, .no-print { display: none !important; }
          }
        `}</style>
      </div>
    );
  }

  // Coleta render
  return (
    <div className="bg-white min-h-screen p-4 print:p-0">
      <div className="mb-4 print:hidden flex gap-2 sticky top-0 bg-white z-10 py-2">
        <Button onClick={handlePrint} className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">🖨️ Imprimir</Button>
        <Button onClick={() => { setShowRender(false); setEtiquetas([]); }} variant="outline" className="border-[#BFCF99] text-[#00233B]">← Voltar</Button>
      </div>

      <div>
        {Array.from({ length: Math.ceil(etiquetas.length / 4) }).map((_, pageIdx) => (
          <div key={pageIdx} className="page-container">
            <div className="grid grid-cols-2 gap-x-2 gap-y-4 print:gap-x-1.5 print:gap-y-3">
              {etiquetas.slice(pageIdx * 4, (pageIdx + 1) * 4).map((etiqueta, idx) => (
                <div key={pageIdx * 4 + idx} className="p-4 print:p-5 bg-white" style={{ border: '0.5mm solid #000' }}>
                  {/* Header */}
                  <div className="grid grid-cols-[120px_1fr] gap-0 mb-2 print:mb-2 pb-2 print:pb-1.5" style={{ borderBottom: '0.5mm solid #000', alignItems: 'stretch' }}>
                    <div className="flex items-center justify-center pr-2" style={{ borderRight: '0.5mm solid #000' }}>
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a7599ee3fb9205cfb852ec/47ee9630a_AE-LogoVerPrincipal_1.png"
                        alt="AfirmaEvias"
                        className="h-9 print:h-8 w-auto object-contain"
                       width="auto" height="36"
                      />
                    </div>
                    <div className="flex items-center justify-center px-2">
                      <h2 className="text-sm print:text-xs font-bold text-[#00233B] text-center leading-tight">
                        ETIQUETA PARA COLETA DE AMOSTRA SOLO
                      </h2>
                    </div>
                  </div>

                  {/* Dados Principais */}
                  <table className="w-full mb-2 print:mb-2 text-xs print:text-[10px]" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                    <colgroup>
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '70%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>RODOVIA:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>{etiqueta.rodovia}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>KM:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>{etiqueta.km}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white text-base print:text-sm" style={{ border: '0.5mm solid #000', height: '28px', backgroundColor: '#f4f4f5', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>FURO:</td>
                        <td className="bg-white font-bold text-base print:text-sm" style={{ border: '0.5mm solid #000', height: '28px', backgroundColor: '#f4f4f5', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>{etiqueta.furo}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>PISTA:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>{etiqueta.pista}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>AMOSTRA:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>{etiqueta.amostra}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>PROFUNDIDADE:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>{etiqueta.profundidade}</td>
                      </tr>
                      <tr>
                        <td className="font-bold bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>MATERIAL:</td>
                        <td className="bg-white" style={{ border: '0.5mm solid #000', height: '28px', paddingLeft: '4mm', paddingRight: '2mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>{etiqueta.material}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Ensaios Solicitados */}
                  <div className="mb-2 print:mb-1.5" style={{ border: '0.5mm solid #000' }}>
                    <div className="bg-[#BFCF99] font-bold text-[#00233B] text-xs print:text-[10px] text-center" style={{ borderBottom: '0.5mm solid #000', paddingLeft: '4mm', paddingRight: '4mm', paddingTop: '1.5mm', paddingBottom: '1.5mm' }}>
                      ENSAIOS SOLICITADOS
                    </div>
                    <div className="bg-white space-y-1 text-xs print:text-[10px] min-h-[60px] print:min-h-[65px]" style={{ paddingLeft: '4mm', paddingRight: '4mm', paddingTop: '3mm', paddingBottom: '3mm' }}>
                      {etiqueta.ensaios && etiqueta.ensaios.length > 0 ? (
                        etiqueta.ensaios.map((ensaio, ensaioIdx) => (
                          <div key={ensaioIdx} className="flex items-start gap-1.5 py-0.5">
                            <span className="font-bold text-sm">✓</span>
                            <span className="flex-1">{ensaio}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full"></div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="bg-white text-xs print:text-[10px]" style={{ border: '0.5mm solid #000' }}>
                    <div className="font-bold" style={{ height: '32px', display: 'flex', alignItems: 'center', paddingLeft: '4mm', paddingRight: '4mm' }}>RESPONSÁVEL COLETA:</div>
                    <div className="font-bold" style={{ height: '32px', display: 'flex', alignItems: 'center', paddingLeft: '4mm', paddingRight: '4mm' }}>DATA:</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .page-container { padding: 8px; page-break-after: always !important; break-after: page !important; display: block !important; }
        .page-container:last-child { page-break-after: auto !important; break-after: auto !important; }
        @page { size: A4; margin: 6mm 3mm; }
        @media screen { .page-container { min-height: 100vh; margin-bottom: 20px; border: 1px solid #e5e7eb; } }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow: visible !important; }
          *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
          html, body, div, section, main { overflow: visible !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
          .page-container { padding: 4px; page-break-after: always !important; overflow: visible !important; }
          .page-container:last-child { page-break-after: auto !important; }
          .print\\:hidden { display: none !important; }
          header, nav, .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}