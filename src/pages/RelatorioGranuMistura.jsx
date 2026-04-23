import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function RelatorioGranuMistura() {
  const location = useLocation();
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [faixaGran, setFaixaGran] = useState(null);
  const [projeto, setProjeto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadData(id);
  }, [location.search]);

  const loadData = async (id) => {
    try {
      const rec = await base44.entities.GranuMistura.get(id);
      setEnsaio(rec);
      const obraData = await base44.entities.Obra.get(rec.obra_id);
      setObra(obraData);
      if (obraData.regional_id) {
        const reg = await base44.entities.Regional.get(obraData.regional_id);
        setRegional(reg);
      }
      if (rec.project_id) {
        const proj = await base44.entities.Project.get(rec.project_id);
        setProjeto(proj);
        if (proj.faixa_granulometrica_id) {
          const fg = await base44.entities.FaixaGranulometrica.get(proj.faixa_granulometrica_id);
          setFaixaGran(fg);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-";
  const formatDateBrasilia = (d) => {
    if (!d) return "-";
    const norm = d.endsWith("Z") || d.includes("+") ? d : d + "Z";
    return new Date(norm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" });
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!ensaio) return <div className="text-center p-8">Ensaio não encontrado.</div>;

  const faixaNome = faixaGran ? `${faixaGran.nome} - ${faixaGran.especificacao}` : (ensaio.faixa || "-");

  const getEspecificacao = (abertura_mm) => {
    if (!faixaGran?.peneiras) return { min: null, max: null };
    const p = faixaGran.peneiras.find(p => Math.abs(parseFloat(p.abertura) - abertura_mm) < 0.01);
    return p ? { min: p.min, max: p.max } : { min: null, max: null };
  };

  const getFaixaTrabalho = (abertura_mm) => {
    if (!projeto?.faixa_trabalho) return { min: null, max: null };
    const keyMap = {
      19.0: "peneira_19_0mm", 12.5: "peneira_12_5mm", 9.5: "peneira_9_5mm", 4.75: "peneira_4_75mm",
      2.36: "peneira_2_36mm", 2.0: "peneira_2_0mm", 1.18: "peneira_1_18mm", 0.6: "peneira_0_6mm",
      0.42: "peneira_0_42mm", 0.3: "peneira_0_3mm", 0.15: "peneira_0_15mm", 0.075: "peneira_0_075mm"
    };
    const key = keyMap[abertura_mm];
    if (!key) return { min: null, max: null };
    return {
      min: projeto.faixa_trabalho_min?.[key] ?? null,
      max: projeto.faixa_trabalho_max?.[key] ?? null
    };
  };

  // Painel lateral: umidade (4 linhas), EA (3 medições + média = 8 linhas), pulverulentos (3 linhas) = 15 linhas
  // Tabela principal tem 12 peneiras
  const sidePanel = [
    // Umidade
    { label: "Peso Úmido", calc: "P₁", unit: "g", value: ensaio.umidade?.peso_umido },
    { label: "Peso Seco", calc: "P₂", unit: "g", value: ensaio.umidade?.peso_seco },
    { label: "Peso Água", calc: "Pω = P₁ - P₂", unit: "g", value: ensaio.umidade?.peso_agua },
    { label: "Umidade", calc: "U = (Pω/P₂)×100", unit: "%", value: ensaio.umidade?.umidade_pct, bold: true },
    { label: "DETERMINAÇÃO DE EQUIVALENTE DE AREIA", isSection: true },
    ...(ensaio.equivalente_areia?.medicoes || []).flatMap((m, i) => [
      { label: `Topo de Argila (${i+1})`, calc: "", unit: "", value: m.topo_argila },
      { label: `Topo de Areia (${i+1})`, calc: "", unit: "", value: m.topo_areia },
      { label: `Equiv. Areia (${i+1})`, calc: "EA=(TA/TArgila)×100", unit: "%", value: m.equivalente, bold: true },
    ]),
    { label: "Média:", calc: "", unit: "%", value: ensaio.equivalente_areia?.media, bold: true },
    { label: "DETERMINAÇÃO DE MATERIAIS PULVERULENTOS", isSection: true },
    { label: "Peso Inicial", calc: "Pᵢ", unit: "g", value: ensaio.materiais_pulverulentos?.peso_inicial },
    { label: "Peso Após Lavagem", calc: "Pf", unit: "g", value: ensaio.materiais_pulverulentos?.peso_apos_lavagem },
    { label: "Teor Pulverulentos", calc: "% = ((Pi-Pf)/Pi)×100", unit: "%", value: ensaio.materiais_pulverulentos?.teor_pct, bold: true },
  ];

  return (
    <div className="bg-white font-sans min-h-screen print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="w-full max-w-[297mm] mx-auto bg-white shadow-xl print:shadow-none p-4 print:p-2">

        {/* Botão imprimir */}
        <div className="print:hidden flex justify-end mb-4">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            Imprimir / Exportar PDF
          </button>
        </div>

        {/* HEADER */}
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-2">
          <div>
            <img
              src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"}
              alt="Logo" className="h-12 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-sm font-bold text-gray-800">ANÁLISE GRANULOMÉTRICA</h1>
            <p className="text-[10px] text-gray-600">Ensaio DNIT 412/25 - ME</p>
          </div>
          <div className="flex justify-end">
            <div className="border border-gray-400 p-1 rounded text-xs bg-white text-center">
              <p className="font-semibold">{formatDate(ensaio.data_ensaio)}</p>
            </div>
          </div>
        </header>

        {/* DADOS DA OBRA */}
        <div className="border border-slate-300 rounded mb-2">
          <div className="bg-green-100 text-center py-0.5 text-xs font-bold uppercase border-b border-slate-300">DADOS DA OBRA</div>
          <div className="grid grid-cols-3 gap-x-4 p-1.5 text-[10px]">
            <div><span className="font-bold">CLIENTE:</span> {regional?.cliente || "-"}</div>
            <div><span className="font-bold">CAMADA:</span> {ensaio.camada || "-"}</div>
            <div><span className="font-bold">Nº PROJETO:</span> {ensaio.numero_projeto || "-"}</div>
            <div><span className="font-bold">OBRA:</span> {obra?.name || "-"}</div>
            <div><span className="font-bold">MATERIAL:</span> {ensaio.material || "-"}</div>
            <div><span className="font-bold">LOCAL DE COLETA:</span> {ensaio.local_coleta || "-"}</div>
            <div><span className="font-bold">RODOVIA:</span> {ensaio.rodovia || "-"}</div>
            <div><span className="font-bold">PEDREIRA:</span> {ensaio.pedreira || "-"}</div>
            <div><span className="font-bold">HORÁRIO:</span> {ensaio.horario || "-"}</div>
            <div><span className="font-bold">TRECHO:</span> {ensaio.trecho || "-"}</div>
            <div><span className="font-bold">FAIXA:</span> {ensaio.faixa || "-"}</div>
            <div><span className="font-bold">LABORATORISTA:</span> {ensaio.laboratorista_name || "-"}</div>
          </div>
        </div>

        {/* DADOS DO ENSAIO */}
        <div className="border border-slate-300 rounded mb-2">
          <div className="bg-green-100 text-center py-0.5 text-[10px] font-bold uppercase border-b border-slate-300">DADOS DO ENSAIO</div>
          <div className="text-center text-[10px] py-0.5 font-medium border-b border-slate-200">
            ENSAIO DE GRANULOMETRIA - MÉTODO DE ENSAIO DNIT 412/25 - ME
          </div>

          <div className="flex">
            {/* Tabela de peneiras */}
            <div className="flex-1 border-r border-slate-300">
              {/* Sub-cabeçalho: peso da amostra + faixas */}
              <div className="grid border-b border-slate-200 text-[9px] font-bold bg-slate-50" style={{ gridTemplateColumns: "3fr 3fr 3fr 3fr 3fr 2fr 2fr 2fr 2fr" }}>
                <div className="border-r border-slate-200 p-0.5 text-center" colSpan="2">PENEIRA</div>
                <div className="border-r border-slate-200 p-0.5 text-center">PESO AMOSTRA (g): {ensaio.peso_amostra || "-"}</div>
                <div className="border-r border-slate-200 p-0.5"></div>
                <div className="border-r border-slate-200 p-0.5"></div>
                <div className="border-r border-slate-200 p-0.5 text-center" style={{ gridColumn: "span 2" }}>FAIXA DE TRABALHO</div>
                <div className="p-0.5 text-center" style={{ gridColumn: "span 2" }}>ESPECIFICAÇÃO — {faixaNome}</div>
              </div>
              <div className="grid border-b border-slate-200 text-[9px] font-bold bg-slate-100" style={{ gridTemplateColumns: "3fr 3fr 3fr 3fr 3fr 2fr 2fr 2fr 2fr" }}>
                <div className="border-r border-slate-200 p-0.5 text-center">ASTM</div>
                <div className="border-r border-slate-200 p-0.5 text-center">(mm)</div>
                <div className="border-r border-slate-200 p-0.5 text-center">RETIDO (g)</div>
                <div className="border-r border-slate-200 p-0.5 text-center">PASS. (g)</div>
                <div className="border-r border-slate-200 p-0.5 text-center">% PASS.</div>
                <div className="border-r border-slate-200 p-0.5 text-center">MÍN. (%)</div>
                <div className="border-r border-slate-200 p-0.5 text-center">MÁX. (%)</div>
                <div className="border-r border-slate-200 p-0.5 text-center">MÍN. (%)</div>
                <div className="p-0.5 text-center">MÁX. (%)</div>
              </div>
              {(ensaio.peneiras || []).map((p, idx) => {
                const ft = getFaixaTrabalho(p.abertura_mm);
                const esp = getEspecificacao(p.abertura_mm);
                return (
                  <div key={idx} className="grid border-b border-slate-100 text-[9px]" style={{ gridTemplateColumns: "3fr 3fr 3fr 3fr 3fr 2fr 2fr 2fr 2fr" }}>
                    <div className="border-r border-slate-200 p-0.5 text-center font-medium">{p.astm}</div>
                    <div className="border-r border-slate-200 p-0.5 text-center">{p.abertura_mm}</div>
                    <div className="border-r border-slate-200 p-0.5 text-center">{p.retido_g || "0"}</div>
                    <div className="border-r border-slate-200 p-0.5 text-center bg-gray-50">{p.passante_g || "100"}</div>
                    <div className="border-r border-slate-200 p-0.5 text-center font-bold">{p.passante_pct || "100"}</div>
                    <div className="border-r border-slate-200 p-0.5 text-center text-blue-700">{ft.min ?? "-"}</div>
                    <div className="border-r border-slate-200 p-0.5 text-center text-blue-700">{ft.max ?? "-"}</div>
                    <div className="border-r border-slate-200 p-0.5 text-center text-green-700">{esp.min ?? "-"}</div>
                    <div className="p-0.5 text-center text-green-700">{esp.max ?? "-"}</div>
                  </div>
                );
              })}
            </div>

            {/* Painel lateral */}
            <div className="w-56 text-[9px]">
              <div className="bg-slate-100 text-center font-bold py-0.5 border-b border-slate-200">DETERMINAÇÃO DE UMIDADE DA MISTURA</div>
              {[
                { label: "Peso Úmido", calc: "P₁", unit: "g", value: ensaio.umidade?.peso_umido },
                { label: "Peso Seco", calc: "P₂", unit: "g", value: ensaio.umidade?.peso_seco },
                { label: "Peso Água", calc: "Pω = P₁ − P₂", unit: "g", value: ensaio.umidade?.peso_agua },
                { label: "Umidade", calc: "U = (Pω/P₂)×100", unit: "%", value: ensaio.umidade?.umidade_pct, bold: true },
              ].map((r, i) => (
                <div key={i} className="grid border-b border-slate-100" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
                  <div className="p-0.5">{r.label}</div>
                  <div className="p-0.5 border-l border-slate-200 text-gray-400 text-[8px] italic">{r.calc}</div>
                  <div className="p-0.5 border-l border-slate-200 text-gray-500">{r.unit}</div>
                  <div className={`p-0.5 border-l border-slate-200 w-12 text-right ${r.bold ? "font-bold" : ""}`}>{r.value || "-"}</div>
                </div>
              ))}

              <div className="bg-slate-100 text-center font-bold py-0.5 border-b border-slate-200 border-t border-t-slate-300">DETERMINAÇÃO DE EQUIVALENTE DE AREIA</div>
              {(ensaio.equivalente_areia?.medicoes || []).map((m, i) => (
                <div key={i}>
                  <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "1fr auto auto" }}>
                    <div className="p-0.5">Topo de Argila</div>
                    <div className="p-0.5 border-l border-slate-200">-</div>
                    <div className="p-0.5 border-l border-slate-200 w-12 text-right">{m.topo_argila || "-"}</div>
                  </div>
                  <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "1fr auto auto" }}>
                    <div className="p-0.5">Topo de Areia</div>
                    <div className="p-0.5 border-l border-slate-200">-</div>
                    <div className="p-0.5 border-l border-slate-200 w-12 text-right">{m.topo_areia || "-"}</div>
                  </div>
                  <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "1fr auto auto" }}>
                    <div className="p-0.5 font-bold">Equiv. Areia ({i+1})</div>
                    <div className="p-0.5 border-l border-slate-200">%</div>
                    <div className="p-0.5 border-l border-slate-200 w-12 text-right font-bold">{m.equivalente || "-"}</div>
                  </div>
                </div>
              ))}
              <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "1fr auto auto" }}>
                <div className="p-0.5 font-bold">Média:</div>
                <div className="p-0.5 border-l border-slate-200">%</div>
                <div className="p-0.5 border-l border-slate-200 w-12 text-right font-bold">{ensaio.equivalente_areia?.media || "-"}</div>
              </div>

              <div className="bg-slate-100 text-center font-bold py-0.5 border-b border-slate-200 border-t border-t-slate-300">DETERMINAÇÃO DE MATERIAIS PULVERULENTOS</div>
              {[
                { label: "Peso Inicial", calc: "Pᵢ", unit: "g", value: ensaio.materiais_pulverulentos?.peso_inicial },
                { label: "Peso Após Lavagem", calc: "Pf", unit: "g", value: ensaio.materiais_pulverulentos?.peso_apos_lavagem },
                { label: "Teor Pulverulentos", calc: "% = ((Pi−Pf)/Pi)×100", unit: "%", value: ensaio.materiais_pulverulentos?.teor_pct, bold: true },
              ].map((r, i) => (
                <div key={i} className="grid border-b border-slate-100" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
                  <div className="p-0.5">{r.label}</div>
                  <div className="p-0.5 border-l border-slate-200 text-gray-400 text-[8px] italic">{r.calc}</div>
                  <div className="p-0.5 border-l border-slate-200 text-gray-500">{r.unit}</div>
                  <div className={`p-0.5 border-l border-slate-200 w-12 text-right ${r.bold ? "font-bold" : ""}`}>{r.value || "-"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Observações */}
        {ensaio.observacoes && (
          <div className="border border-slate-300 rounded mb-2 p-1.5 text-[10px]">
            <span className="font-bold">Observações: </span>{ensaio.observacoes}
          </div>
        )}

        {/* RODAPÉ */}
        <footer className="mt-4 pt-1">
          <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
            <div>
              {ensaio.laboratorista_name && (
                <div className="text-[9px] text-slate-500 mb-1">
                  <p className="font-bold text-slate-700">{ensaio.laboratorista_name}</p>
                </div>
              )}
              <div className="border-t border-gray-500 pt-0.5 italic">LABORATORISTA RESPONSÁVEL</div>
            </div>
            <div>
              {ensaio.approver_details ? (
                <div className="text-[9px] text-slate-500 mb-1">
                  <p className="font-bold text-slate-700">{ensaio.approver_details.name}</p>
                  {ensaio.approver_details.crea_number && <p>CREA: {ensaio.approver_details.crea_number}</p>}
                  <p>em {formatDateBrasilia(ensaio.approved_date)}</p>
                </div>
              ) : <div className="h-6"></div>}
              <div className="border-t border-gray-500 pt-0.5 italic">ENGENHEIRO RESPONSÁVEL</div>
            </div>
            <div>
              {ensaio.client_signature?.engineer_name ? (
                <div className="text-[9px] text-slate-500 mb-1">
                  <p className="font-bold text-slate-700">{ensaio.client_signature.engineer_name}</p>
                  {ensaio.client_signature.crea_number && <p>CREA: {ensaio.client_signature.crea_number}</p>}
                </div>
              ) : <div className="h-6"></div>}
              <div className="border-t border-gray-500 pt-0.5 italic">ENGENHEIRO CLIENTE</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}