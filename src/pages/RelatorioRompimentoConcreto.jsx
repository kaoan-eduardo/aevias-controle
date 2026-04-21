import React, { useState, useEffect } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import AprovacaoBar from "@/components/relatorios/AprovacaoBar";

const fmtDate = (d) => d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR') : '-';
const fmtN = (v, d = 2) => (v !== null && v !== undefined && !isNaN(parseFloat(v))) ? parseFloat(v).toFixed(d) : '-';
const fmtDateTime = (d) => {
  if (!d) return '-';
  const n = (!d.endsWith('Z') && !d.includes('+')) ? d + 'Z' : d;
  return new Date(n).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
};

// Cabeçalho da tabela: label, fórmula, unidade
const COMPRESSAO_ROWS = [
  { label: "DATA DA RUPTURA", formula: "-", unit: "-" },
  { label: "CARGA DE RUPTURA", formula: "C", unit: "tf" },
  { label: "ÁREA DO CORPO DE PROVA", formula: "A", unit: "cm²" },
  { label: "RESISTÊNCIA", formula: "Rfck = C/A × 1000/10,197", unit: "MPa" },
  { label: "RESIST. DO EXEMPLAR", formula: "Rfck", unit: "MPa" },
];

const FLEXAO_ROWS = [
  { label: "DATA DA RUPTURA", formula: "-", unit: "-" },
  { label: "CARGA DE RUPTURA", formula: "C", unit: "tf" },
  { label: "VÃO CENTRAL DO CP", formula: "V", unit: "cm²" },
  { label: "RESISTÊNCIA", formula: "Rfctm = (C×g×V)/(l×h²)", unit: "MPa" },
  { label: "RESIST. DO EXEMPLAR", formula: "Rfctm", unit: "MPa" },
];

// Agrupa array de CPs em séries de 2 (por compartilharem idade/dimensão/data_ruptura)
function agruparEmSeries(cps) {
  if (!cps || cps.length === 0) return [];
  const series = [];
  for (let i = 0; i < cps.length; i += 2) {
    series.push([cps[i], cps[i + 1]].filter(Boolean));
  }
  return series;
}

// Calcula resistência do exemplar (média dos CPs da série)
function resistenciaExemplar(serieCps) {
  const vals = serieCps.map(cp => parseFloat(cp.resistencia)).filter(v => !isNaN(v) && v > 0);
  if (vals.length === 0) return '-';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

function getValorLinha(row, cp, serie) {
  if (!cp) return '';
  switch (row.label) {
    case "DATA DA RUPTURA": return cp.data_ruptura ? fmtDate(cp.data_ruptura) : '-';
    case "CARGA DE RUPTURA": return fmtN(cp.carga_ruptura, 2);
    case "ÁREA DO CORPO DE PROVA": return fmtN(cp.area_cp, 2);
    case "VÃO CENTRAL DO CP": return fmtN(cp.vao_central, 2);
    case "RESISTÊNCIA": return fmtN(cp.resistencia, 2);
    case "RESIST. DO EXEMPLAR": return null; // handled separately (rowspan)
    default: return '';
  }
}

export default function RelatorioRompimentoConcreto() {
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useReportMode();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const id = new URLSearchParams(window.location.search).get('id');
      if (!id) { setError("ID não fornecido"); setLoading(false); return; }
      const data = await base44.entities.EnsaioRompimentoConcreto.get(id);
      setEnsaio(data);
      if (data.obra_id) {
        const obraData = await base44.entities.Obra.get(data.obra_id);
        setObra(obraData);
        if (obraData.regional_id) {
          const reg = await base44.entities.Regional.get(obraData.regional_id);
          setRegional(reg);
        }
      }
    } catch (err) {
      setError("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  if (error || !ensaio) return <div className="flex justify-center items-center h-screen text-red-600">{error || "Erro ao carregar"}</div>;

  const seriesCompressao = agruparEmSeries(ensaio.compressao_axial || []);
  const seriesFlexao = agruparEmSeries(ensaio.tracao_flexao || []);

  // Total de CPs = total de colunas de dados (cada série tem 2 CPs)
  const totalColunas = Math.max(seriesCompressao.length * 2, 4); // mínimo 4 colunas

  // Dimensão da primeira série (se existir)
  const dimensao = seriesCompressao[0]?.[0]?.dimensao || '';
  const idadesSerie = seriesCompressao.map(s => s[0]?.idade || '');

  return (
    <div className="relatorio-page bg-white min-h-screen">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-3 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-800">Ficha de Moldagem — Rompimento de Concreto</h2>
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="EnsaioRompimentoConcreto" recordId={ensaio.id} />}
            <Button onClick={() => window.print()} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" /> Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-2 print:p-1 flex flex-col">

        {/* CABEÇALHO */}
         <header className="grid items-center py-1" style={{ gridTemplateColumns: '60px 1fr 60px' }}>
           <div>
             <img
               src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"}
               alt="Logo" className="h-8 object-contain"
             />
           </div>
           <h1 className="text-xs font-bold text-white text-center">FICHA DE MOLDAGEM</h1>
           <div className="text-xs font-semibold text-gray-800 text-right">{fmtDate(ensaio.data_ensaio)}</div>
         </header>

         <div style={{ backgroundColor: '#1e293b' }} className="p-1 text-center mt-1">
           <span className="text-[10px] font-bold text-slate-800">DADOS DO CLIENTE</span>
         </div>

         <table className="w-full border-collapse text-[10px] mt-0">
           <tbody>
             <tr>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold w-[16%] bg-white">CLIENTE:</td>
               <td className="border border-slate-400 px-2 py-0.5 w-[12%] min-h-[30px] bg-white">{obra?.client || ''}</td>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold w-[12%] bg-white">RODOVIA:</td>
               <td className="border border-slate-400 px-2 py-0.5 w-[12%] bg-white">{ensaio.rodovia || ''}</td>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold w-[18%] bg-white">VOLUME BETONADO:</td>
               <td className="border border-slate-400 px-2 py-0.5 w-[8%] bg-white">{ensaio.volume || ''}</td>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold w-[12%] bg-white">FORNECEDOR:</td>
               <td className="border border-slate-400 px-2 py-0.5 w-[10%] bg-white">{ensaio.concreteira || ''}</td>
             </tr>
             <tr>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold bg-white">OBRA:</td>
               <td className="border border-slate-400 px-2 py-0.5 min-h-[30px] bg-white">{obra?.name || ''}</td>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold bg-white">TRECHO:</td>
               <td className="border border-slate-400 px-2 py-0.5 bg-white">{ensaio.trecho || ''}</td>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold bg-white">PROJETO / TRAÇO:</td>
               <td className="border border-slate-400 px-2 py-0.5 bg-white">{ensaio.projeto_trac || ''}</td>
               <td className="border border-slate-400 px-2 py-0.5 font-semibold bg-white">N° DE MOLDAGEM:</td>
               <td className="border border-slate-400 px-2 py-0.5 bg-white">{ensaio.numero_moldagem || ''}</td>
             </tr>
             <tr>
               <td colSpan={4} className="border border-slate-400 px-2 py-0.5 bg-white">
                 <span className="font-semibold">LABORATORISTA:</span> <span className="text-gray-700">{ensaio.laboratorista_name || ''}</span>
               </td>
               <td colSpan={4} className="border border-slate-400 px-2 py-0.5 bg-white text-right">
                 <span className="font-semibold">HORA MOLDAGEM:</span> <span className="text-gray-700 ml-1">{ensaio.hora_moldagem || ''}</span>
               </td>
             </tr>
           </tbody>
         </table>

         {/* DADOS DO ENSAIO */}
         <div style={{ backgroundColor: '#1e293b' }} className="text-white px-2 py-0.5 text-center mt-1">
           <span className="text-[10px] font-bold">DADOS DO ENSAIO</span>
         </div>
         <div style={{ backgroundColor: '#f0f0f0' }} className="px-2 py-0.5 text-center">
           <span className="text-[9px] font-semibold text-gray-700">LOCAL DE APLICAÇÃO</span>
         </div>
         <table className="w-full border-collapse border border-slate-400 text-[10px] mb-0">
          <tbody>
            <tr>
              <td className="border border-slate-400 px-2 py-1 font-semibold w-[14%]">ESTRUTURA:</td>
              <td className="border border-slate-400 px-2 py-1 w-[35%]">{ensaio.estrutura || ''}</td>
              <td className="border border-slate-400 px-2 py-1 font-semibold w-[15%]">CONSTRUTORA:</td>
              <td className="border border-slate-400 px-2 py-1">{ensaio.construtora || ''}</td>
            </tr>
            <tr>
              <td className="border border-slate-400 px-2 py-1 font-semibold">NOTA FISCAL</td>
              <td className="border border-slate-400 px-2 py-1">{ensaio.nota_fiscal || ''}</td>
              <td className="border border-slate-400 px-2 py-1 font-semibold">ESTACA DE MOLDAGEM:</td>
              <td className="border border-slate-400 px-2 py-1">{ensaio.estaca_moldagem || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* ENSAIOS CONCRETO FRESCO */}
        <div style={{ backgroundColor: '#f0f0f0' }} className="px-2 py-0.5 text-center">
          <span className="text-[9px] font-semibold text-gray-700">ENSAIOS CONCRETO FRESCO</span>
        </div>
        <table className="w-full border-collapse border border-slate-400 text-[10px] mb-0">
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-1.5 w-[50%]">
                <span className="font-semibold">SLUMP TEST (mm):</span>
                <span className="ml-2">{ensaio.slump_test ?? ''}</span>
              </td>
              <td className="border border-gray-400 px-2 py-1.5">
                <span className="font-semibold">Hora de saída da usina:</span>
                <span className="ml-2">{ensaio.hora_saida_usina || ''}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1.5">
                <span className="font-semibold">TEMPERATURA AMBIENTE (°C):</span>
                <span className="ml-2">{ensaio.temperatura_ambiente ?? ''}</span>
              </td>
              <td className="border border-gray-400 px-2 py-1.5">
                <span className="font-semibold">Hora de chegada campo:</span>
                <span className="ml-2">{ensaio.hora_chegada_campo || ''}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ENSAIO DE COMPRESSÃO AXIAL */}
         <SectionHeader label="ENSAIO DE RESISTÊNCIA À COMPRESSÃO AXIAL" />
         <CompressaoAxialTable series={seriesCompressao} ensaio={ensaio} />

         {/* ENSAIO DE TRAÇÃO NA FLEXÃO */}
         <SectionHeader label="ENSAIO DE RESISTÊNCIA À TRAÇÃO NA FLEXÃO - ABNT NBR 12142:2010" />
         <TracaoFlexaoTable series={seriesFlexao} ensaio={ensaio} />

         {/* OBSERVAÇÕES */}
         <div className="border border-slate-400 p-2 text-[9px] min-h-[60px]">
          <span className="font-semibold">OBS.:</span>
          <div className="mt-1 whitespace-pre-wrap">{ensaio.observacoes || ''}</div>
        </div>

        {/* ASSINATURAS */}
        <footer className="mt-4 pt-2">
          <div className="grid grid-cols-3 gap-6 text-center">
            <AssinaturaCol
              titulo="Técnico de Campo"
              nome={ensaio.laboratorista_name}
              email={ensaio.created_by}
              data={ensaio.created_date}
              label="Assinado digitalmente por"
            />
            <AssinaturaCol
              titulo="Analista de Engenharia"
              nome={ensaio.approver_details?.name}
              email={ensaio.approved_by}
              data={ensaio.approved_date}
              crea={ensaio.approver_details?.crea_number}
              label="Aprovado digitalmente por"
            />
            <AssinaturaCol
              titulo="Engenheiro Cliente"
              nome={ensaio.client_signature?.engineer_name}
              email={ensaio.client_signature?.signed_by}
              data={ensaio.client_signature?.signed_date}
              crea={ensaio.client_signature?.crea_number}
              label="Assinado digitalmente por"
            />
          </div>
        </footer>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 10mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .relatorio-page > div:first-child { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ label }) {
   return (
     <div style={{ backgroundColor: '#1e293b' }} className="text-white text-[10px] font-bold text-center py-0.5 mt-1">
       {label}
     </div>
   );
}

function AssinaturaCol({ titulo, nome, email, data, crea, label }) {
  return (
    <div className="text-center">
      <div className="text-[8px] text-slate-500 mb-2 h-14 flex flex-col justify-end items-center">
        {nome && (
          <>
            {label && <p className="text-[7px] text-gray-400 italic">{label}</p>}
            <p className="font-bold text-slate-700">{nome}</p>
            {email && <p className="text-[7px]">{email}</p>}
            {crea && <p className="text-[7px]">CREA: {crea}</p>}
            {data && <p className="text-[7px]">em {fmtDateTime(data)}</p>}
          </>
        )}
      </div>
      <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
        <p className="font-semibold text-[8px]">{titulo}</p>
      </div>
    </div>
  );
}

function CompressaoAxialTable({ series, ensaio }) {
   // Conta total de CPs = soma dos CPs de todas as séries
   const totalCPs = series.reduce((acc, s) => acc + s.length, 0);
   const dimensao = series[0]?.[0]?.dimensao || '';

   return (
     <table className="w-full border-collapse border border-slate-400 text-[10px]" style={{ transform: 'scale(0.97)', transformOrigin: 'top left', width: '103.09%' }}>
      <tbody>
        {/* Linha: N° CPs e dimensões */}
        <tr>
          <td className="border border-slate-400 px-2 py-1 font-semibold w-[28%]">N° DE CP'S:</td>
          <td className="border border-slate-400 px-2 py-1 text-center font-bold" colSpan={2}>{totalCPs || ''}</td>
          <td className="border border-slate-400 px-2 py-1 font-semibold text-center">DIMENSÕES:</td>
          <td className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-800" colSpan={series.length * 2 || 1}>
            {dimensao ? `(${dimensao}) cm` : <span className="text-gray-400 italic text-[7px]">SELECIONAR (5X10); (15X30); (10X20)</span>}
          </td>
        </tr>
        {/* Linha de IDADE — uma por série (colspan 2 = 2 CPs) */}
        <tr className="bg-slate-100">
          <td className="border border-slate-400 px-2 py-1 font-semibold">IDADE</td>
          <td className="border border-slate-400 px-2 py-1 font-semibold text-center">CÁLCULO</td>
          <td className="border border-slate-400 px-2 py-1 font-semibold text-center">UNIDADE</td>
          {series.map((s, si) => (
            <td key={si} className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-800" colSpan={2}>
              {s[0]?.idade ? `${s[0].idade} dias` : ''}
            </td>
          ))}
          {series.length === 0 && <td className="border border-slate-400 px-2 py-1" colSpan={4}></td>}
          </tr>
          {/* Linha: N° CP */}
          <tr>
          <td className="border border-slate-400 px-2 py-1 font-semibold">N° CP</td>
          <td className="border border-slate-400 px-2 py-1 text-center text-gray-500 italic"></td>
          <td className="border border-slate-400 px-2 py-1 text-center"></td>
          {series.map((s, si) =>
            s.map((cp, ci) => (
              <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center font-semibold">{cp.numero_cp || ''}</td>
            ))
          )}
          {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
          </tr>
          {/* DATA DA RUPTURA */}
          <tr>
          <td className="border border-slate-400 px-2 py-1 font-semibold">DATA DA RUPTURA</td>
          <td className="border border-slate-400 px-2 py-1 text-center text-gray-400">-</td>
          <td className="border border-slate-400 px-2 py-1 text-center text-gray-400">-</td>
          {series.map((s, si) =>
            s.map((cp, ci) => (
              <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center">{cp.data_ruptura ? fmtDate(cp.data_ruptura) : ''}</td>
            ))
          )}
          {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
          </tr>
          {/* CARGA DE RUPTURA */}
          <tr>
          <td className="border border-slate-400 px-2 py-1 font-semibold">CARGA DE RUPTURA</td>
          <td className="border border-slate-400 px-2 py-1 text-center text-gray-600 italic">C</td>
          <td className="border border-slate-400 px-2 py-1 text-center">tf</td>
          {series.map((s, si) =>
            s.map((cp, ci) => (
              <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center">{fmtN(cp.carga_ruptura, 2)}</td>
            ))
          )}
          {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
          </tr>
          {/* ÁREA DO CP */}
          <tr>
          <td className="border border-slate-400 px-2 py-1 font-semibold">ÁREA DO CORPO DE PROVA</td>
          <td className="border border-slate-400 px-2 py-1 text-center text-gray-600 italic">A</td>
          <td className="border border-slate-400 px-2 py-1 text-center">cm²</td>
          {series.map((s, si) =>
            s.map((cp, ci) => (
              <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center">{fmtN(cp.area_cp, 2)}</td>
            ))
          )}
          {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
          </tr>
          {/* RESISTÊNCIA */}
          <tr className="bg-slate-50">
          <td className="border border-slate-400 px-2 py-1 font-semibold">RESISTÊNCIA</td>
          <td className="border border-slate-400 px-2 py-1 text-center text-[8px] text-gray-600 italic">
            Rfck = C/A × 1000/10,197
          </td>
          <td className="border border-slate-400 px-2 py-1 text-center">MPa</td>
          {series.map((s, si) =>
            s.map((cp, ci) => (
              <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center text-blue-800 font-semibold">{fmtN(cp.resistencia, 2)}</td>
            ))
          )}
          {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
          </tr>
          {/* RESIST. DO EXEMPLAR — média por série (colspan 2) */}
          <tr className="bg-slate-100">
          <td className="border border-slate-400 px-2 py-1 font-semibold">RESIST. DO EXEMPLAR</td>
          <td className="border border-slate-400 px-2 py-1 text-center text-gray-600 italic">Rfck</td>
          <td className="border border-slate-400 px-2 py-1 text-center">MPa</td>
          {series.map((s, si) => (
            <td key={si} className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-900" colSpan={2}>
              {resistenciaExemplar(s)}
            </td>
          ))}
          {series.length === 0 && <td className="border border-slate-400 px-1 py-0.5" colSpan={4}></td>}
        </tr>
      </tbody>
    </table>
  );
}

function TracaoFlexaoTable({ series, ensaio }) {
   const totalCPs = series.reduce((acc, s) => acc + s.length, 0);

   return (
     <table className="w-full border-collapse border border-slate-400 text-[10px]" style={{ transform: 'scale(0.97)', transformOrigin: 'top left', width: '103.09%' }}>
       <tbody>
         {/* N° CPs e DIMENSÕES */}
         <tr>
           <td className="border border-slate-400 px-2 py-1 font-semibold w-[28%]">N° CORPOS DE PROVA EXTRAÍDOS:</td>
           <td className="border border-slate-400 px-2 py-1 text-center font-bold" colSpan={2}>{totalCPs || ''}</td>
           <td className="border border-slate-400 px-2 py-1 font-semibold text-center">DIMENSÕES:</td>
           <td className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-800" colSpan={series.length * 2 || 1}>
             CP PRISMÁTICO
           </td>
         </tr>
         {/* IDADE */}
         <tr className="bg-slate-100">
           <td className="border border-slate-400 px-2 py-1 font-semibold">IDADE</td>
           <td className="border border-slate-400 px-2 py-1 font-semibold text-center">CÁLCULO</td>
           <td className="border border-slate-400 px-2 py-1 font-semibold text-center">UNIDADE</td>
           {series.map((s, si) => (
             <td key={si} className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-800" colSpan={2}>
               {s[0]?.idade ? `${s[0].idade} dias` : ''}
             </td>
           ))}
           {series.length === 0 && <td className="border border-slate-400 px-2 py-1" colSpan={4}></td>}
         </tr>
         {/* N° CP */}
         <tr>
           <td className="border border-slate-400 px-2 py-1 font-semibold">N° CP</td>
           <td className="border border-slate-400 px-2 py-1 text-center text-gray-500 italic"></td>
           <td className="border border-slate-400 px-2 py-1 text-center"></td>
           {series.map((s, si) =>
             s.map((cp, ci) => (
               <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center font-semibold">{cp.numero_cp || ''}</td>
             ))
           )}
           {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
         </tr>
         {/* DATA DA RUPTURA */}
         <tr>
           <td className="border border-slate-400 px-2 py-1 font-semibold">DATA DA RUPTURA</td>
           <td className="border border-slate-400 px-2 py-1 text-center text-gray-400">-</td>
           <td className="border border-slate-400 px-2 py-1 text-center text-gray-400">-</td>
           {series.map((s, si) =>
             s.map((cp, ci) => (
               <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center">{cp.data_ruptura ? fmtDate(cp.data_ruptura) : ''}</td>
             ))
           )}
           {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
         </tr>
         {/* CARGA DE RUPTURA */}
         <tr>
           <td className="border border-slate-400 px-2 py-1 font-semibold">CARGA DE RUPTURA</td>
           <td className="border border-slate-400 px-2 py-1 text-center text-gray-600 italic">C</td>
           <td className="border border-slate-400 px-2 py-1 text-center">tf</td>
           {series.map((s, si) =>
             s.map((cp, ci) => (
               <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center">{fmtN(cp.carga_ruptura, 2)}</td>
             ))
           )}
           {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
         </tr>
         {/* VÃO CENTRAL */}
         <tr>
           <td className="border border-slate-400 px-2 py-1 font-semibold">VÃO CENTRAL DO CP</td>
           <td className="border border-slate-400 px-2 py-1 text-center text-gray-600 italic">V</td>
           <td className="border border-slate-400 px-2 py-1 text-center">cm²</td>
           {series.map((s, si) =>
             s.map((cp, ci) => (
               <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center">{fmtN(cp.vao_central, 2)}</td>
             ))
           )}
           {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
         </tr>
         {/* RESISTÊNCIA */}
         <tr className="bg-slate-50">
           <td className="border border-slate-400 px-2 py-1 font-semibold">RESISTÊNCIA</td>
           <td className="border border-slate-400 px-2 py-1 text-center text-[8px] text-gray-600 italic">
             Rfctm=(C×g×V)/(l×h²)
           </td>
           <td className="border border-slate-400 px-2 py-1 text-center">MPa</td>
           {series.map((s, si) =>
             s.map((cp, ci) => (
               <td key={`${si}-${ci}`} className="border border-slate-400 px-2 py-1 text-center text-blue-800 font-semibold">{fmtN(cp.resistencia, 2)}</td>
             ))
           )}
           {series.length === 0 && [0,1,2,3].map(i => <td key={i} className="border border-slate-400 px-2 py-1"></td>)}
         </tr>
         {/* RESIST. DO EXEMPLAR */}
         <tr className="bg-slate-100">
           <td className="border border-slate-400 px-2 py-1 font-semibold">RESIST. DO EXEMPLAR</td>
           <td className="border border-slate-400 px-2 py-1 text-center text-gray-600 italic">Rfctm</td>
           <td className="border border-slate-400 px-2 py-1 text-center">MPa</td>
           {series.map((s, si) => (
             <td key={si} className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-900" colSpan={2}>
               {resistenciaExemplar(s)}
             </td>
           ))}
           {series.length === 0 && <td className="border border-slate-400 px-2 py-1" colSpan={4}></td>}
         </tr>
       </tbody>
     </table>
   );
}