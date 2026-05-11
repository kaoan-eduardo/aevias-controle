import React, { useEffect, useState } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import AprovacaoBar from "@/components/relatorios/AprovacaoBar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function fmtDate(d) {
  return d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR') : '-';
}
function fmtDateTime(d) {
  if (!d) return '-';
  const n = (!d.endsWith('Z') && !d.includes('+')) ? d + 'Z' : d;
  return new Date(n).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
}

function SectionHeader({ label }) {
  return (
    <div style={{ backgroundColor: '#1e293b' }} className="text-white text-[10px] font-bold text-center py-0.5 mt-2">
      {label}
    </div>
  );
}

function AssinaturaCol({ cargoFixo, nome, email, data, crea, label }) {
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
        <p className="font-semibold text-[8px]">{cargoFixo}</p>
      </div>
    </div>
  );
}

export default function RelatorioGranuMistura() {
  const [record, setRecord] = useState(null);
  const [faixa, setFaixa] = useState(null);
  const [project, setProject] = useState(null);
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

      const rec = await base44.entities.GranuMistura.get(id);
      setRecord(rec);

      if (rec.numero_projeto) {
        const proj = await base44.entities.Project.get(rec.numero_projeto);
        setProject(proj);
        if (proj.faixa_granulometrica_id) {
          const fxGran = await base44.entities.FaixaGranulometrica.get(proj.faixa_granulometrica_id);
          setFaixa(fxGran);
        }
      } else if (rec.faixa) {
        try {
          const fxGran = await base44.entities.FaixaGranulometrica.get(rec.faixa);
          setFaixa(fxGran);
        } catch (_) {}
      }

      if (rec.obra_id) {
        const obraData = await base44.entities.Obra.get(rec.obra_id);
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
  if (error || !record) return <div className="flex justify-center items-center h-screen text-red-600">{error || "Erro ao carregar"}</div>;

  // Peneiras da faixa para exibição
  const peneirasExibir = faixa?.peneiras || [];
  const peneirasDoRegistro = record.peneiras || [];

  const peneirasParaMostrar = peneirasExibir.length > 0
    ? peneirasExibir.map(fp => {
        const ab = parseFloat(fp.abertura);
        const peneiraDados = peneirasDoRegistro.find(p => Math.abs(p.abertura_mm - ab) < 0.01);
        return peneiraDados ? { ...peneiraDados, especMin: fp.min, especMax: fp.max } : null;
      }).filter(Boolean)
    : peneirasDoRegistro;

  const chartData = peneirasParaMostrar.map(p => ({
    abertura: p.abertura_mm,
    passante: parseFloat(p.passante_pct) || 0,
    min: p.especMin ?? undefined,
    max: p.especMax ?? undefined
  }));

  return (
    <div className="relatorio-page bg-white min-h-screen">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-3 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-800">Relatório — Análise Granulométrica da Mistura</h2>
          <div className="flex items-center gap-2">
            {record && <AprovacaoBar entityName="GranuMistura" recordId={record.id} />}
            <Button onClick={() => window.print()} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" /> Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-2 print:p-1 flex flex-col">

        {/* CABEÇALHO */}
        <header className="grid items-center py-2 border-b-2 border-slate-800" style={{ gridTemplateColumns: '90px 1fr 90px' }}>
          <div>
            <picture><source srcSet={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} /><img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo" className="h-14 object-contain" width="auto" height="56" /></picture>
          </div>
          <h1 className="text-base font-bold text-gray-800 text-center">ANÁLISE GRANULOMÉTRICA DA MISTURA</h1>
          <div className="text-sm font-semibold text-gray-800 text-right border border-slate-400 rounded px-2 py-1 h-fit flex items-center justify-center">
            {fmtDate(record.data_ensaio)}
          </div>
        </header>

        {/* DADOS DA OBRA */}
        <SectionHeader label="DADOS DA OBRA" />
        <div className="border border-slate-400 text-[10px]">
          <div className="grid grid-cols-4 gap-0">
            <div className="px-2 py-0.5 font-semibold bg-white">CLIENTE:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">OBRA:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">RODOVIA:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">TRECHO:</div>
            <div className="px-2 py-1 bg-white">{regional?.cliente || '—'}</div>
            <div className="px-2 py-1 bg-white">{obra?.name || '—'}</div>
            <div className="px-2 py-1 bg-white">{record.rodovia || '—'}</div>
            <div className="px-2 py-1 bg-white">{record.trecho || '—'}</div>

            <div className="px-2 py-0.5 font-semibold bg-white">CAMADA:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">MATERIAL:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">PEDREIRA:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">LOCAL DE COLETA:</div>
            <div className="px-2 py-1 bg-white">{record.camada || '—'}</div>
            <div className="px-2 py-1 bg-white">{record.material === 'OUTRO' ? record.material_outro : record.material}</div>
            <div className="px-2 py-1 bg-white">{record.pedreira || '—'}</div>
            <div className="px-2 py-1 bg-white">{record.local_coleta || '—'}</div>

            <div className="px-2 py-0.5 font-semibold bg-white">Nº PROJETO:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">FAIXA:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">HORÁRIO:</div>
            <div className="px-2 py-0.5 font-semibold bg-white">LABORATORISTA:</div>
            <div className="px-2 py-1 bg-white">{record.material === 'OUTRO' ? 'N/A' : (project?.name || '—')}</div>
            <div className="px-2 py-1 bg-white">{faixa?.nome || record.faixa || '—'}</div>
            <div className="px-2 py-1 bg-white">{record.horario || '—'}</div>
            <div className="px-2 py-1 bg-white">{record.laboratorista_name || '—'}</div>
          </div>
        </div>

        {/* GRANULOMETRIA */}
        <SectionHeader label="ENSAIO DE GRANULOMETRIA — DNIT 412/25 - ME" />
        <div className="grid grid-cols-2 gap-2 text-[10px] mt-1">
          {/* Tabela principal */}
          <div className="col-span-1">
            <div className="text-[9px] mb-1"><strong>PESO DA AMOSTRA (g):</strong> {record.peso_amostra || '—'}</div>
            <table className="w-full border-collapse border border-slate-400 text-[9px]" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-400 px-1 py-0.5">ASTM</th>
                  <th className="border border-slate-400 px-1 py-0.5">(mm)</th>
                  <th className="border border-slate-400 px-1 py-0.5">RETIDO (g)</th>
                  <th className="border border-slate-400 px-1 py-0.5">PASS. (g)</th>
                  <th className="border border-slate-400 px-1 py-0.5">% PASS.</th>
                  {peneirasParaMostrar.some(p => p.especMin != null) && (
                    <>
                      <th className="border border-slate-400 px-1 py-0.5">MÍN.</th>
                      <th className="border border-slate-400 px-1 py-0.5">MÁX.</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {peneirasParaMostrar.map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-400 px-1 py-0.5 font-semibold text-center">{p.astm}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center">{p.abertura_mm}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center">{p.retido_g ?? '—'}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center">{p.passante_g ?? '—'}</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-blue-800">{p.passante_pct ?? '—'}</td>
                    {peneirasParaMostrar.some(p2 => p2.especMin != null) && (
                      <>
                        <td className="border border-slate-400 px-1 py-0.5 text-center text-green-700">{p.especMin ?? '—'}</td>
                        <td className="border border-slate-400 px-1 py-0.5 text-center text-green-700">{p.especMax ?? '—'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Coluna direita: Umidade + EA + Pulverulentos */}
          <div className="col-span-1 space-y-2">
            {/* Umidade */}
            <div className="border border-slate-400">
              <div className="bg-slate-100 px-2 py-0.5 font-bold text-[9px] text-center">DETERMINAÇÃO DE UMIDADE</div>
              <table className="w-full text-[9px]">
                <tbody>
                  {[
                    ["Peso Úmido (P₁)", record.umidade?.peso_umido, "g"],
                    ["Peso Seco (P₂)", record.umidade?.peso_seco, "g"],
                    ["Peso Água (P₁−P₂)", record.umidade?.peso_agua, "g"],
                    ["Umidade U=(Pω/P₂)×100", record.umidade?.umidade_pct, "%"],
                  ].map(([label, val, unit]) => (
                    <tr key={label}>
                      <td className="px-2 py-0.5 text-gray-700">{label}</td>
                      <td className="px-2 py-0.5 font-semibold text-center">{val || '—'}</td>
                      <td className="px-2 py-0.5 text-gray-500 text-right">{unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Equivalente de Areia */}
            <div className="border border-slate-400">
              <div className="bg-slate-100 px-2 py-0.5 font-bold text-[9px] text-center">EQUIVALENTE DE AREIA</div>
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-slate-300 px-2 py-0.5"></th>
                    {(record.equivalente_areia?.medicoes || []).map((m, idx) => (
                      <th key={idx} className="border-b border-slate-300 px-2 py-0.5 text-center">M{idx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-0.5 font-semibold text-gray-700">T. Argila</td>
                    {(record.equivalente_areia?.medicoes || []).map((m, idx) => (
                      <td key={idx} className="px-2 py-0.5 text-center">{m.topo_argila || '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-2 py-0.5 font-semibold text-gray-700">T. Areia</td>
                    {(record.equivalente_areia?.medicoes || []).map((m, idx) => (
                      <td key={idx} className="px-2 py-0.5 text-center">{m.topo_areia || '—'}</td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-2 py-0.5 font-semibold text-gray-700">EA (%)</td>
                    {(record.equivalente_areia?.medicoes || []).map((m, idx) => (
                      <td key={idx} className="px-2 py-0.5 text-center font-bold text-blue-800">{m.equivalente || '—'}</td>
                    ))}
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="px-2 py-0.5">MÉDIA</td>
                    <td colSpan={record.equivalente_areia?.medicoes?.length || 1} className="px-2 py-0.5 text-center text-blue-900">{record.equivalente_areia?.media || '—'}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Materiais Pulverulentos */}
            <div className="border border-slate-400">
              <div className="bg-slate-100 px-2 py-0.5 font-bold text-[9px] text-center">MATERIAIS PULVERULENTOS</div>
              <table className="w-full text-[9px]">
                <tbody>
                  {[
                    ["Peso Inicial (Pᵢ)", record.materiais_pulverulentos?.peso_inicial, "g"],
                    ["Peso Após Lavagem (Pf)", record.materiais_pulverulentos?.peso_apos_lavagem, "g"],
                    ["Teor ((Pi−Pf)/Pi×100)", record.materiais_pulverulentos?.teor_pct, "%"],
                  ].map(([label, val, unit]) => (
                    <tr key={label}>
                      <td className="px-2 py-0.5 text-gray-700">{label}</td>
                      <td className="px-2 py-0.5 font-semibold text-center">{val || '—'}</td>
                      <td className="px-2 py-0.5 text-gray-500 text-right">{unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* GRÁFICO */}
        {chartData.length > 0 && (
          <div className="mt-2 border border-slate-400 p-2 print:break-inside-avoid">
            <div className="bg-slate-100 px-2 py-0.5 font-bold text-[9px] mb-1">CURVA GRANULOMÉTRICA</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="abertura" tick={{ fontSize: 8 }} label={{ value: "Abertura (mm)", position: "insideBottomRight", offset: -5, fontSize: 8 }} />
                <YAxis tick={{ fontSize: 8 }} label={{ value: "% Passando", angle: -90, position: "insideLeft", fontSize: 8 }} />
                <Tooltip wrapperStyle={{ fontSize: 9 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Line type="monotone" dataKey="passante" stroke="#1e3a5f" strokeWidth={2} name="% Passante" dot={{ r: 2 }} />
                {chartData.some(d => d.min !== undefined) && (
                  <Line type="monotone" dataKey="min" stroke="#16a34a" strokeDasharray="4 4" name="Mín. Especificação" dot={false} />
                )}
                {chartData.some(d => d.max !== undefined) && (
                  <Line type="monotone" dataKey="max" stroke="#dc2626" strokeDasharray="4 4" name="Máx. Especificação" dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* OBSERVAÇÕES */}
        {record.observacoes && (
          <div className="mt-2 border border-slate-400 p-2 text-[9px] min-h-[40px]">
            <span className="font-semibold">OBS.:</span>
            <div className="mt-1 whitespace-pre-wrap">{record.observacoes}</div>
          </div>
        )}

        {/* ASSINATURAS */}
        <footer className="mt-auto pt-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <AssinaturaCol
              cargoFixo="Laboratorista"
              nome={record.laboratorista_name}
              email={record.created_by}
              data={record.created_date}
              label="Assinado digitalmente por"
            />
            <AssinaturaCol
              cargoFixo="Engenheiro Responsável"
              nome={record.approver_details?.name}
              email={record.approved_by}
              data={record.approved_date}
              crea={record.approver_details?.crea_number}
              label="Aprovado digitalmente por"
            />
            <AssinaturaCol
              cargoFixo="Engenheiro Cliente"
              nome={record.client_signature?.engineer_name}
              email={record.client_signature?.signed_by}
              data={record.client_signature?.signed_date}
              crea={record.client_signature?.crea_number}
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