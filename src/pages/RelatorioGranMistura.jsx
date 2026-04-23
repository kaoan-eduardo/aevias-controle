import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function RelatorioGranMistura() {
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
      const rec = await base44.entities.EnsaioGranMistura.get(id);
      setEnsaio(rec);
      const [obraData] = await Promise.all([base44.entities.Obra.get(rec.obra_id)]);
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

  return (
    <div className="bg-white font-sans min-h-screen print:bg-white">
      <div className="print:pt-2">
        <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-4 pb-4 print:pt-2 print:px-4 print:pb-4">

          {/* Botão imprimir - não imprime */}
          <div className="print:hidden flex justify-end mb-4">
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
              Imprimir / Exportar PDF
            </button>
          </div>

          {/* HEADER */}
          <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-1">
            <div className="flex justify-start">
              <img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"}
                alt="Logo" className="h-12 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-800">ANÁLISE GRANULOMÉTRICA</h1>
              <p className="text-xs text-gray-600">Ensaio DNIT 412/25 - ME</p>
            </div>
            <div className="flex justify-end">
              <div className="border border-gray-400 p-1 rounded text-xs bg-white text-center">
                <p className="font-semibold">{formatDate(ensaio.data_ensaio)}</p>
              </div>
            </div>
          </header>

          {/* DADOS DA OBRA */}
          <div className="border border-slate-300 rounded mb-1">
            <div className="bg-slate-100 text-center py-0.5 text-xs font-bold uppercase tracking-wide border-b border-slate-300">DADOS DA OBRA</div>
            <div className="grid grid-cols-3 gap-x-4 p-1.5 text-xs">
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
          <div className="border border-slate-300 rounded mb-1">
            <div className="bg-slate-100 text-center py-0.5 text-xs font-bold uppercase tracking-wide border-b border-slate-300">DADOS DO ENSAIO</div>
            <div className="text-center text-xs py-0.5 font-medium border-b border-slate-200">
              ENSAIO DE GRANULOMETRIA - MÉTODO DE ENSAIO DNIT 412/25 - ME
            </div>

            <div className="flex text-xs">
              {/* Tabela de granulometria - lado esquerdo */}
              <div className="flex-1 border-r border-slate-300">
                <div className="grid grid-cols-3 text-center bg-slate-50 border-b border-slate-200 text-xs font-bold">
                  <div className="border-r border-slate-200 p-0.5">PENEIRA</div>
                  <div className="border-r border-slate-200 p-0.5">PESO DA AMOSTRA (g): {ensaio.peso_amostra || "-"}</div>
                  <div className="p-0.5">
                    <div className="grid grid-cols-2">
                      <div className="border-r border-slate-200">FAIXA DE TRABALHO</div>
                      <div>ESPECIFICAÇÃO<br /><span className="font-normal text-[9px]">{faixaNome}</span></div>
                    </div>
                  </div>
                </div>
                <div className="grid text-center text-[9px] font-bold bg-slate-50 border-b border-slate-200"
                  style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
                  <div className="border-r border-slate-200 p-0.5">ASTM</div>
                  <div className="border-r border-slate-200 p-0.5">(mm)</div>
                  <div className="border-r border-slate-200 p-0.5">RETIDO (g)</div>
                  <div className="border-r border-slate-200 p-0.5">PASS. (g)</div>
                  <div className="border-r border-slate-200 p-0.5">% PASS.</div>
                  <div className="border-r border-slate-200 p-0.5">MÍN. (%)</div>
                  <div className="border-r border-slate-200 p-0.5">MÁX. (%)</div>
                  <div className="border-r border-slate-200 p-0.5">MÍN. (%)</div>
                  <div className="p-0.5">MÁX. (%)</div>
                </div>
                {(ensaio.peneiras || []).map((p, idx) => {
                  const ft = getFaixaTrabalho(p.abertura_mm);
                  const esp = getEspecificacao(p.abertura_mm);
                  return (
                    <div key={idx} className="grid text-center text-[9px] border-b border-slate-100"
                      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
                      <div className="border-r border-slate-200 p-0.5 font-medium">{p.astm}</div>
                      <div className="border-r border-slate-200 p-0.5">{p.abertura_mm}</div>
                      <div className="border-r border-slate-200 p-0.5">{p.retido_g || "0"}</div>
                      <div className="border-r border-slate-200 p-0.5">{p.passante_g || "100"}</div>
                      <div className="border-r border-slate-200 p-0.5 font-bold">{p.passante_pct || "100"}</div>
                      <div className="border-r border-slate-200 p-0.5 text-blue-700">{ft.min ?? "-"}</div>
                      <div className="border-r border-slate-200 p-0.5 text-blue-700">{ft.max ?? "-"}</div>
                      <div className="border-r border-slate-200 p-0.5 text-green-700">{esp.min ?? "-"}</div>
                      <div className="p-0.5 text-green-700">{esp.max ?? "-"}</div>
                    </div>
                  );
                })}
              </div>

              {/* Painel lateral - umidade, EA, pulverulentos */}
              <div className="w-40 text-[9px]">
                {/* Umidade */}
                <div className="border-b border-slate-300">
                  <div className="bg-slate-100 text-center font-bold py-0.5 border-b border-slate-200 text-[9px]">DETERMINAÇÃO DE UMIDADE</div>
                  {[
                    { label: "Peso Úmido", val: ensaio.umidade?.peso_umido, un: "g", calc: "P₁" },
                    { label: "Peso Seco", val: ensaio.umidade?.peso_seco, un: "g", calc: "P₂" },
                    { label: "Peso Água", val: ensaio.umidade?.peso_agua, un: "g", calc: "Pω" },
                    { label: "Umidade", val: ensaio.umidade?.umidade_pct, un: "%", calc: "U=" }
                  ].map((r, i) => (
                    <div key={i} className="grid border-b border-slate-100" style={{ gridTemplateColumns: "1fr auto auto" }}>
                      <div className="p-0.5">{r.label}</div>
                      <div className="p-0.5 border-l border-slate-200 text-gray-400">{r.un}</div>
                      <div className="p-0.5 border-l border-slate-200 text-right font-medium w-12 text-center">{r.val || "-"}</div>
                    </div>
                  ))}
                </div>

                {/* EA */}
                <div className="border-b border-slate-300">
                  <div className="bg-slate-100 text-center font-bold py-0.5 border-b border-slate-200 text-[9px]">EQUIVALENTE DE AREIA</div>
                  {(ensaio.equivalente_areia?.medicoes || []).map((m, i) => (
                    <div key={i} className="border-b border-slate-100 p-0.5">
                      <div className="flex justify-between"><span>Topo Argila</span><span>{m.topo_argila || "-"}</span></div>
                      <div className="flex justify-between"><span>Topo Areia</span><span>{m.topo_areia || "-"}</span></div>
                      <div className="flex justify-between font-bold"><span>EA ({i + 1})</span><span>{m.equivalente || "-"}</span></div>
                    </div>
                  ))}
                  <div className="flex justify-between p-0.5 font-bold border-t border-slate-200">
                    <span>Média:</span><span>{ensaio.equivalente_areia?.media || "-"}</span>
                  </div>
                </div>

                {/* Pulverulentos */}
                <div>
                  <div className="bg-slate-100 text-center font-bold py-0.5 border-b border-slate-200 text-[9px]">MAT. PULVERULENTOS</div>
                  {[
                    { label: "Peso Inicial", val: ensaio.materiais_pulverulentos?.peso_inicial, un: "g" },
                    { label: "Peso Após Lav.", val: ensaio.materiais_pulverulentos?.peso_apos_lavagem, un: "g" },
                    { label: "Teor Pulv.", val: ensaio.materiais_pulverulentos?.teor_pct, un: "%" }
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-100 p-0.5">
                      <span>{r.label}</span>
                      <span className="font-medium">{r.val || "-"} {r.un}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico simples de barras */}
          <div className="border border-slate-300 rounded mb-2 p-2">
            <div className="text-center text-xs font-bold mb-1">GRANULOMETRIA DA MISTURA</div>
            <div className="flex items-end gap-0.5" style={{ height: "60px" }}>
              {(ensaio.peneiras || []).map((p, idx) => {
                const pct = parseFloat(p.passante_pct) || 0;
                const barH = Math.max(0, ((pct - 98) / 2) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center flex-1" style={{ height: "100%" }}>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${barH}%`, minHeight: pct > 98 ? "2px" : "0" }}></div>
                    <div className="text-[6px] rotate-90 mt-1 text-gray-500">{p.astm}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-4 mt-1 text-[9px]">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-blue-500"></span>% Pass.</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-green-500 border-dashed border-t border-green-500"></span>Faixa de Espec.</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-orange-400 border-dashed border-t border-orange-400"></span>Faixa de Trabalho</span>
            </div>
          </div>

          {/* Observações */}
          {ensaio.observacoes && (
            <div className="border border-slate-300 rounded mb-2 p-1.5 text-xs">
              <span className="font-bold">Observações: </span>{ensaio.observacoes}
            </div>
          )}

          {/* RODAPÉ */}
          <footer className="mt-4 pt-1">
            <div className="grid grid-cols-3 gap-2 items-end text-center text-xs">
              <div>
                {ensaio.laboratorista_name && (
                  <div className="text-[9px] text-slate-500 mb-0.5">
                    <p>Assinado digitalmente por</p>
                    <p className="font-bold text-slate-600">{ensaio.laboratorista_name}</p>
                  </div>
                )}
                <div className="border-t border-gray-500 pt-0.5">LABORATORISTA RESPONSÁVEL</div>
              </div>
              <div>
                {ensaio.approver_details ? (
                  <div className="text-[9px] text-slate-500 mb-0.5">
                    <p>Aprovado por</p>
                    <p className="font-bold">{ensaio.approver_details.name}</p>
                    {ensaio.approver_details.crea_number && <p>CREA: {ensaio.approver_details.crea_number}</p>}
                    <p>em {formatDateBrasilia(ensaio.approved_date)}</p>
                  </div>
                ) : <div className="h-6"></div>}
                <div className="border-t border-gray-500 pt-0.5">ENGENHEIRO RESPONSÁVEL</div>
              </div>
              <div>
                {ensaio.client_signature?.signed_by ? (
                  <div className="text-[9px] text-slate-500 mb-0.5">
                    <p>Assinado por</p>
                    <p className="font-bold">{ensaio.client_signature.engineer_name}</p>
                    {ensaio.client_signature.crea_number && <p>CREA: {ensaio.client_signature.crea_number}</p>}
                  </div>
                ) : <div className="h-6"></div>}
                <div className="border-t border-gray-500 pt-0.5">ENGENHEIRO CLIENTE</div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}