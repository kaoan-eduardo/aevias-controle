import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, LineChart, Line, ComposedChart
} from "recharts";

/* ─── helpers ─── */
const n = (v, d = 2) => {
  const f = parseFloat(v);
  return isNaN(f) ? null : parseFloat(f.toFixed(d));
};

function calcUmidade(umido, seco, tara) {
  const agua = n(umido) - n(seco);
  const solo = n(seco) - n(tara);
  if (!agua || !solo || solo <= 0) return null;
  return parseFloat(((agua / solo) * 100).toFixed(2));
}

/* ─── LL row calculation ─── */
function calcLLRow(row) {
  const agua = n(row.solo_umido_capsula) != null && n(row.solo_seco_capsula) != null
    ? parseFloat((n(row.solo_umido_capsula) - n(row.solo_seco_capsula)).toFixed(3))
    : null;
  const solo = n(row.solo_seco_capsula) != null && n(row.peso_capsula) != null
    ? parseFloat((n(row.solo_seco_capsula) - n(row.peso_capsula)).toFixed(3))
    : null;
  const teor = agua != null && solo != null && solo > 0
    ? parseFloat(((agua / solo) * 100).toFixed(2))
    : null;
  return { agua, solo, teor };
}

/* ─── LP row calculation ─── */
function calcLPRow(row) {
  return calcUmidade(row.solo_umido_capsula, row.solo_seco_capsula, row.peso_capsula);
}

/* ─── Granulometria fine calc ─── */
function calcGranFina(row, amostaParcialSeca) {
  const retido = n(row.retido);
  const passando = amostaParcialSeca != null && retido != null ? parseFloat((amostaParcialSeca - retido).toFixed(3)) : null;
  // pass% in relation to total (to be computed outside with total seca)
  return { retido, passando };
}

const PENEIRAS_GROSSAS = [
  { label: '3"', mm: 76.2 },
  { label: '2"', mm: 50.8 },
  { label: '1"', mm: 25.4 },
  { label: '3/8"', mm: 9.52 },
  { label: '4°', mm: 4.76 },
  { label: '10°', mm: 2.0 },
];

const PENEIRAS_FINAS = [
  { label: '40', mm: 0.42 },
  { label: '200', mm: 0.075 },
];

const defaultLLRow = () => ({
  numero_capsula: "",
  solo_umido_capsula: "",
  solo_seco_capsula: "",
  peso_capsula: "",
  num_golpes: "",
});

const defaultLPRow = () => ({
  numero_capsula: "",
  solo_umido_capsula: "",
  solo_seco_capsula: "",
  peso_capsula: "",
});

export function defaultLimites() {
  return {
    // Umidade Higroscópica
    higro_solo_umido_capsula_1: "",
    higro_solo_umido_capsula_2: "",
    higro_solo_seco_capsula_1: "",
    higro_solo_seco_capsula_2: "",
    higro_peso_capsula_1: "",
    higro_peso_capsula_2: "",
    // Peneiramento Grosso
    peneiras_grossas: PENEIRAS_GROSSAS.map(p => ({ ...p, retido: "" })),
    amostra_total_umida: "",
    amostra_total_seca: "",
    // Peneiramento Fino
    amostra_parcial_umida: "",
    amostra_parcial_seca: "",
    peneiras_finas: PENEIRAS_FINAS.map(p => ({ ...p, retido: "" })),
    // LL - 5 pontos
    ll_rows: Array(5).fill(null).map(defaultLLRow),
    // LP - 5 pontos
    lp_rows: Array(5).fill(null).map(defaultLPRow),
  };
}

/* ─── Linear fit for LL curve ─── */
function fitLogLine(points) {
  // y = a*x + b  (regressão linear simples)
  const valid = points.filter(p => p.x > 0 && p.y != null);
  if (valid.length < 2) return null;
  const n = valid.length;
  const sx = valid.reduce((s, p) => s + p.x, 0);
  const sy = valid.reduce((s, p) => s + p.y, 0);
  const sxx = valid.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = valid.reduce((s, p) => s + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-10) return null;
  const a = (n * sxy - sx * sy) / denom;
  const b = (sy - a * sx) / n;
  // LL = umidade at 25 golpes
  const ll = parseFloat((a * 25 + b).toFixed(1));
  return { a, b, ll };
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function EnsaioLimites({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  const setNested = (field, index, subfield, value) => {
    const arr = [...(data[field] || [])];
    arr[index] = { ...arr[index], [subfield]: value };
    onChange({ ...data, [field]: arr });
  };

  /* ─── derived: Umidade Higroscópica ─── */
  const higroTeor1 = useMemo(() =>
    calcUmidade(data.higro_solo_umido_capsula_1, data.higro_solo_seco_capsula_1, data.higro_peso_capsula_1),
    [data.higro_solo_umido_capsula_1, data.higro_solo_seco_capsula_1, data.higro_peso_capsula_1]
  );
  const higroTeor2 = useMemo(() =>
    calcUmidade(data.higro_solo_umido_capsula_2, data.higro_solo_seco_capsula_2, data.higro_peso_capsula_2),
    [data.higro_solo_umido_capsula_2, data.higro_solo_seco_capsula_2, data.higro_peso_capsula_2]
  );
  const higroTeorMedia = useMemo(() => {
    const valid = [higroTeor1, higroTeor2].filter(v => v != null);
    return valid.length > 0 ? parseFloat((valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(2)) : null;
  }, [higroTeor1, higroTeor2]);
  const higroTeor = higroTeorMedia;

  /* ─── derived: LL rows ─── */
  const llCalc = useMemo(() => (data.ll_rows || []).map(calcLLRow), [data.ll_rows]);

  /* ─── derived: LP ─── */
  const lpTeors = useMemo(() => (data.lp_rows || []).map(r => calcLPRow(r)), [data.lp_rows]);
  const lpMedia = useMemo(() => {
    const valid = lpTeors.filter(v => v != null);
    return valid.length > 0 ? parseFloat((valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(1)) : null;
  }, [lpTeors]);

  /* ─── derived: LL curve ─── */
  const llPoints = useMemo(() =>
    (data.ll_rows || []).map((r, i) => ({
      x: parseFloat(r.num_golpes),
      y: llCalc[i].teor,
    })).filter(p => p.x > 0 && p.y != null),
    [data.ll_rows, llCalc]
  );
  const llFit = useMemo(() => fitLogLine(llPoints), [llPoints]);
  const llCurve = useMemo(() => {
    if (!llFit) return [];
    const xs = llPoints.map(p => p.x);
    const minX = Math.max(1, Math.min(...xs) - 2);
    const maxX = Math.max(...xs) + 2;
    return [
      { x: minX, y: parseFloat((llFit.a * minX + llFit.b).toFixed(2)) },
      { x: maxX, y: parseFloat((llFit.a * maxX + llFit.b).toFixed(2)) },
    ];
  }, [llFit, llPoints]);

  /* ─── derived: Granulometria Grossa ─── */
  // Amostra total seca = soma de todos os retidos + passando da última peneira (calculado ao final)
  // Para calcular %, usamos a soma dos retidos de todas as peneiras + passando final
  const granGrossaRetidos = useMemo(() => {
    return (data.peneiras_grossas || []).map(pen => n(pen.retido) || 0);
  }, [data.peneiras_grossas]);

  // amostraTotalSeca = soma de todos os retidos das peneiras grossas + SP10 (calculado depois)
  // Para o % passante usamos o passando acumulado direto sem precisar do total
  const granGrossaCalc = useMemo(() => {
    const retidos = granGrossaRetidos;
    const totalRetido = retidos.reduce((s, r) => s + r, 0);
    // Usamos totalRetido + valor do passando da última peneira = amostraTotalSeca
    // Mas amostraTotalSeca depende de SP10 que depende de soloUmPassando10 que depende daqui
    // Então usamos o total manual se disponível, senão null
    const totalSeca = n(data.amostra_total_seca) || null;
    if (!totalSeca || totalSeca <= 0) return [];
    let acumPassando = totalSeca;
    return retidos.map(retido => {
      const passando = parseFloat((acumPassando - retido).toFixed(3));
      const passPct = parseFloat((passando / totalSeca * 100).toFixed(1));
      acumPassando = passando;
      return { retido, passando, passPct };
    });
  }, [granGrossaRetidos, data.amostra_total_seca]);

  const amostraTotalSeca = n(data.amostra_total_seca);

  /* ─── derived: Granulometria Fina ─── */
  const amostParcSeca = n(data.amostra_parcial_seca);
  const granFinaCalc = useMemo(() => {
    if (!amostParcSeca || amostParcSeca <= 0) return [];
    let acum = amostParcSeca;
    return (data.peneiras_finas || []).map(pen => {
      const retido = n(pen.retido) || 0;
      const passando = parseFloat((acum - retido).toFixed(3));
      const passPct = parseFloat((passando / amostParcSeca * 100).toFixed(1));
      acum = passando;
      return { retido, passando, passPct };
    });
  }, [data.peneiras_finas, amostParcSeca]);

  /* ─── derived: SP10 e campos calculados automaticamente ─── */
  const higroH = higroTeor;

  // Solo Seco Retido na #10 = soma dos retidos (secos) de todas as peneiras grossas
  const soloSecoRetido10 = useMemo(() => {
    if (!granGrossaRetidos.length) return null;
    const total = granGrossaRetidos.reduce((s, r) => s + r, 0);
    return total > 0 ? parseFloat(total.toFixed(3)) : null;
  }, [granGrossaRetidos]);

  // Solo Úmido Passando na #10 = Amostra Total Úmida − soma dos retidos úmidos
  // Os retidos nas peneiras grossas são pesados úmidos, então: UmPassando = Uₜ − ΣRetidos
  const soloUmPassando10 = useMemo(() => {
    const ut = n(data.amostra_total_umida);
    if (!ut || !granGrossaRetidos.length) return null;
    const totalRetidoUmido = granGrossaRetidos.reduce((s, r) => s + r, 0);
    const result = parseFloat((ut - totalRetidoUmido).toFixed(3));
    return result > 0 ? result : null;
  }, [data.amostra_total_umida, granGrossaRetidos]);

  // SP10 = Solo Seco Passando na #10 = soloUmPassando10 / (H/100 + 1)
  const sp10 = useMemo(() => {
    if (soloUmPassando10 == null || higroH == null) return null;
    return parseFloat((soloUmPassando10 / (higroH / 100 + 1)).toFixed(3));
  }, [soloUmPassando10, higroH]);

  // Amostra Total Seca = SR10 + SP10
  const amostraTotalSecaCalc = useMemo(() => {
    if (soloSecoRetido10 == null || sp10 == null) return null;
    return parseFloat((soloSecoRetido10 + sp10).toFixed(3));
  }, [soloSecoRetido10, sp10]);

  /* ─── derived: Resumo ─── */
  const IP = useMemo(() => {
    if (llFit?.ll == null || lpMedia == null) return null;
    return parseFloat((llFit.ll - lpMedia).toFixed(1));
  }, [llFit, lpMedia]);

  /* ─── derived: Índice de Grupo (IG) ─── */
  // pct passante na #200 (0,075mm) em relação ao total
  const pct200 = useMemo(() => {
    if (!granFinaCalc.length || !amostraTotalSeca || sp10 == null || amostParcSeca == null || amostParcSeca <= 0) return null;
    const passando200 = granFinaCalc[granFinaCalc.length - 1]?.passando || 0;
    return parseFloat(((passando200 / amostParcSeca) * (sp10 / amostraTotalSeca) * 100).toFixed(1));
  }, [granFinaCalc, amostraTotalSeca, sp10, amostParcSeca]);

  const igCalc = useMemo(() => {
    if (pct200 == null || llFit?.ll == null || IP == null) return null;
    const F = pct200;
    const ll = llFit.ll;
    const ip = IP;

    // LL#200: se F < 35 → 0, senão min(F,75) - 35
    const ll200 = F < 35 ? 0 : Math.min(F, 75) - 35;
    // IP#200: se F < 15 → 0, senão min(F,55) - 15
    const ip200 = F < 15 ? 0 : Math.min(F, 55) - 15;
    // LL@: se LL < 40 → 0, senão min(LL,60) - 40
    const llAt = ll < 40 ? 0 : Math.min(ll, 60) - 40;
    // IP@: se IP < 10 → 0, senão min(IP,30) - 10
    const ipAt = ip < 10 ? 0 : Math.min(ip, 30) - 10;

    const igRaw = 0.2 * ll200 + 0.005 * ll200 * llAt + 0.01 * ip200 * ipAt;
    const ig = parseFloat(igRaw.toFixed(0));

    console.log("=== CÁLCULO DO ÍNDICE DE GRUPO ===");
    console.log(`F (% passante #200): ${F}`);
    console.log(`LL original: ${ll}`);
    console.log(`IP original: ${ip}`);
    console.log("--- Variáveis intermediárias ---");
    console.log(`LL#200 = ${F < 35 ? `F(${F}) < 35 → 0` : `min(F=${F}, 75) - 35 = ${Math.min(F,75)} - 35`} = ${ll200}`);
    console.log(`IP#200 = ${F < 15 ? `F(${F}) < 15 → 0` : `min(F=${F}, 55) - 15 = ${Math.min(F,55)} - 15`} = ${ip200}`);
    console.log(`LL@    = ${ll < 40 ? `LL(${ll}) < 40 → 0` : `min(LL=${ll}, 60) - 40 = ${Math.min(ll,60)} - 40`} = ${llAt}`);
    console.log(`IP@    = ${ip < 10 ? `IP(${ip}) < 10 → 0` : `min(IP=${ip}, 30) - 10 = ${Math.min(ip,30)} - 10`} = ${ipAt}`);
    console.log("--- Fórmula ---");
    console.log(`IG = 0,2×${ll200} + 0,005×${ll200}×${llAt} + 0,01×${ip200}×${ipAt}`);
    console.log(`IG = ${0.2*ll200} + ${0.005*ll200*llAt} + ${0.01*ip200*ipAt}`);
    console.log(`IG (raw) = ${igRaw}`);
    console.log(`IG (arredondado) = ${ig}`);
    console.log("==================================");

    return Math.max(0, ig);
  }, [pct200, llFit, IP]);

  // Granulometria % totais (pedregulho, areias, finos)
  const pctPedregulho = useMemo(() => {
    if (!amostraTotalSeca || !granGrossaCalc.length) return null;
    const retido3_8 = granGrossaCalc.slice(0, 4).reduce((s, r) => s + r.retido, 0);
    return parseFloat((retido3_8 / amostraTotalSeca * 100).toFixed(1));
  }, [granGrossaCalc, amostraTotalSeca]);

  const pctAreiaGrossaMedia = useMemo(() => {
    if (!amostraTotalSeca || !granGrossaCalc.length) return null;
    const retido4e10 = (granGrossaCalc[4]?.retido || 0) + (granGrossaCalc[5]?.retido || 0);
    return parseFloat((retido4e10 / amostraTotalSeca * 100).toFixed(1));
  }, [granGrossaCalc, amostraTotalSeca]);

  const pctAreiaFina = useMemo(() => {
    if (!amostParcSeca || !granFinaCalc.length || !amostraTotalSeca) return null;
    const retido40 = granFinaCalc[0]?.retido || 0;
    // Areia fina = retido entre 10 e 40 (em relação ao total)
    // simplificado: solo seco passando 10 → calculamos fração areia fina
    if (sp10 == null) return null;
    const pctSP10 = sp10 / amostraTotalSeca;
    const retido40pct = (retido40 / amostParcSeca) * pctSP10 * 100;
    return parseFloat(retido40pct.toFixed(1));
  }, [granFinaCalc, amostParcSeca, amostraTotalSeca, sp10]);

  const pctSilteArgila = useMemo(() => {
    if (!granFinaCalc.length || !amostraTotalSeca || sp10 == null || amostParcSeca == null || amostParcSeca <= 0) return null;
    const passando200 = granFinaCalc[granFinaCalc.length - 1]?.passando || 0;
    const pct = (passando200 / amostParcSeca) * (sp10 / amostraTotalSeca) * 100;
    return parseFloat(pct.toFixed(1));
  }, [granFinaCalc, amostraTotalSeca, sp10, amostParcSeca]);

  const fieldCls = "h-8 text-xs border-[#00233B]/30";
  const thCls = "border border-[#00233B]/20 px-2 py-1.5 text-left font-semibold text-[#00233B] text-[10px] bg-[#00233B]/8";
  const tdCls = "border border-[#00233B]/20 px-1 py-0.5";
  const tdCalcCls = "border border-[#00233B]/20 px-2 py-1 text-center text-[10px] font-semibold text-gray-500 bg-gray-100/40";
  const sectionHeader = "bg-[#00233B]/10 text-[#00233B] text-center font-bold text-xs py-1 border border-[#00233B]/20 mb-2 rounded";

  return (
    <div className="space-y-6 text-sm">

      {/* ══════════════════════════════════
          ANÁLISE GRANULOMÉTRICA
      ══════════════════════════════════ */}
      <div>
        <div className={sectionHeader}>ANÁLISE GRANULOMÉTRICA</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Umidade Higroscópica */}
          <div>
            <p className="text-[11px] font-bold text-[#00233B] mb-1 text-center uppercase">Umidade Higroscópica</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#00233B]/8">
                  <th className={thCls}>Campo</th>
                  <th className={thCls + " text-center"}>Am. 1</th>
                  <th className={thCls + " text-center"}>Am. 2</th>
                  <th className={thCls + " text-center"}>Média</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Solo Úmido+Cápsula (g)", f1: "higro_solo_umido_capsula_1", f2: "higro_solo_umido_capsula_2" },
                  { label: "Solo Seco+Cápsula (g)", f1: "higro_solo_seco_capsula_1", f2: "higro_solo_seco_capsula_2" },
                  { label: "Peso da Cápsula (g)", f1: "higro_peso_capsula_1", f2: "higro_peso_capsula_2" },
                ].map(row => (
                  <tr key={row.f1} className="bg-white/10">
                    <td className={tdCls + " text-[10px] text-[#00233B]"}>{row.label}</td>
                    <td className={tdCls}><Input className={fieldCls} type="number" step="0.001" value={data[row.f1] || ""} onChange={e => set(row.f1, e.target.value)} /></td>
                    <td className={tdCls}><Input className={fieldCls} type="number" step="0.001" value={data[row.f2] || ""} onChange={e => set(row.f2, e.target.value)} /></td>
                    <td className={tdCalcCls}>-</td>
                  </tr>
                ))}
                <tr className="bg-gray-100/30">
                  <td className={tdCls + " text-[10px] text-[#00233B]"}>Teor de Umidade (%)</td>
                  <td className={tdCalcCls}>{higroTeor1 != null ? higroTeor1.toFixed(2) : "-"}</td>
                  <td className={tdCalcCls}>{higroTeor2 != null ? higroTeor2.toFixed(2) : "-"}</td>
                  <td className={tdCalcCls}>{higroTeorMedia != null ? higroTeorMedia.toFixed(2) : "-"}</td>
                </tr>
                <tr className="bg-[#BFCF99]/20 font-bold">
                  <td className={tdCls + " text-[10px] text-[#00233B] font-bold"}>Umidade Média — H (%)</td>
                  <td colSpan={3} className={tdCalcCls + " font-bold text-[#00233B]"}>{higroTeorMedia != null ? higroTeorMedia.toFixed(2) : "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Peneiramento Grosso */}
          <div>
            <p className="text-[11px] font-bold text-[#00233B] mb-1 text-center uppercase">Peneiramento Grosso</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#00233B]/8">
                  <th className={thCls}>Peneira</th><th className={thCls}>mm</th><th className={thCls}>Retido (g)</th><th className={thCls}>Passando (g)</th><th className={thCls}>Total Pass.(%)</th>
                </tr>
              </thead>
              <tbody>
                {(data.peneiras_grossas || PENEIRAS_GROSSAS.map(p => ({ ...p, retido: "" }))).map((pen, i) => (
                  <tr key={i} className="bg-white/10">
                    <td className={tdCls + " text-[10px] text-[#00233B] font-medium"}>{pen.label}</td>
                    <td className={tdCls + " text-[10px] text-center text-gray-500"}>{pen.mm}</td>
                    <td className={tdCls}><Input className={fieldCls} type="number" step="0.001" value={pen.retido || ""} onChange={e => setNested("peneiras_grossas", i, "retido", e.target.value)} /></td>
                    <td className={tdCalcCls}>{granGrossaCalc[i]?.passando != null ? granGrossaCalc[i].passando.toFixed(3) : "-"}</td>
                    <td className={tdCalcCls}>{granGrossaCalc[i]?.passPct != null ? granGrossaCalc[i].passPct.toFixed(1) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Amostra Peneiramento Grosso */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-[#00233B] mb-1 text-center uppercase">Dados da Amostra — Peneiramento Grosso</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Apenas Amostra Total Úmida e Total Seca são manuais */}
            <div>
              <Label className="text-[10px] text-[#00233B]">Amostra Total Úmida — Uₜ (g)</Label>
              <Input className={fieldCls} type="number" step="0.001" value={data.amostra_total_umida || ""} onChange={e => set("amostra_total_umida", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] text-[#00233B]">Amostra Total Seca — Sₜ (g)</Label>
              <Input className={fieldCls} type="number" step="0.001" value={data.amostra_total_seca || ""} onChange={e => set("amostra_total_seca", e.target.value)} />
            </div>
            {/* Campos calculados automaticamente */}
            {[
              { label: "Solo Seco Retido na #Nº10 — SR₁₀ (g)", value: soloSecoRetido10 },
              { label: "Solo Úmido Passando na #Nº10 (g)", value: soloUmPassando10 },
              { label: "Solo Seco Passando na #Nº10 — SP₁₀ (g)", value: sp10 },
              { label: "Amostra Total Seca Calculada — SR₁₀+SP₁₀ (g)", value: amostraTotalSecaCalc },
            ].map(f => (
              <div key={f.label}>
                <Label className="text-[10px] text-[#00233B]">{f.label}</Label>
                <div className="h-8 text-xs border border-[#00233B]/20 rounded-md bg-gray-100/40 flex items-center px-2 text-gray-500 font-semibold">
                  {f.value != null ? f.value.toFixed(3) : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peneiramento Fino */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-[#00233B] mb-1 text-center uppercase">Peneiramento Fino</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-[10px] text-[#00233B]">Amostra Parcial Úmida (Up)</Label>
              <Input className={fieldCls} type="number" step="0.001" value={data.amostra_parcial_umida || ""} onChange={e => set("amostra_parcial_umida", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] text-[#00233B]">Amostra Parcial Seca (calculado: Up/(H+100))</Label>
              <Input className={fieldCls} type="number" step="0.001" value={data.amostra_parcial_seca || ""} onChange={e => set("amostra_parcial_seca", e.target.value)} />
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#00233B]/8">
                <th className={thCls}>Peneira Nº</th><th className={thCls}>mm</th><th className={thCls}>Retido (g)</th><th className={thCls}>Pass. (g)</th><th className={thCls}>Pass. (%)</th><th className={thCls}>% Total Pass.</th>
              </tr>
            </thead>
            <tbody>
              {(data.peneiras_finas || PENEIRAS_FINAS.map(p => ({ ...p, retido: "" }))).map((pen, i) => {
                const totalPasePct = granFinaCalc[i]?.passPct != null && sp10 != null && amostraTotalSeca != null && amostraTotalSeca > 0
                  ? parseFloat((granFinaCalc[i].passPct * (sp10 / amostraTotalSeca)).toFixed(1))
                  : null;
                return (
                  <tr key={i} className="bg-white/10">
                    <td className={tdCls + " text-[10px] text-[#00233B] font-medium"}>{pen.label}</td>
                    <td className={tdCls + " text-[10px] text-center text-gray-500"}>{pen.mm}</td>
                    <td className={tdCls}><Input className={fieldCls} type="number" step="0.001" value={pen.retido || ""} onChange={e => setNested("peneiras_finas", i, "retido", e.target.value)} /></td>
                    <td className={tdCalcCls}>{granFinaCalc[i]?.passando != null ? granFinaCalc[i].passando.toFixed(3) : "-"}</td>
                    <td className={tdCalcCls}>{granFinaCalc[i]?.passPct != null ? granFinaCalc[i].passPct.toFixed(1) : "-"}</td>
                    <td className={tdCalcCls}>{totalPasePct != null ? totalPasePct.toFixed(1) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════
          ENSAIOS FÍSICOS
      ══════════════════════════════════ */}
      <div>
        <div className={sectionHeader}>ENSAIOS FÍSICOS (ABNT NBR 6459/2017 | NBR 7180/2016)</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Limite de Liquidez */}
          <div>
            <p className="text-[11px] font-bold text-[#00233B] mb-1 text-center uppercase">Limite de Liquidez</p>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#00233B]/8">
                  <th className={thCls}>Campo</th>
                  {(data.ll_rows || []).map((_, i) => <th key={i} className={thCls + " text-center"}>#{i+1}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Nº Cápsula", field: "numero_capsula", type: "text" },
                  { label: "Solo Úm.+Cáps. (M₁, g)", field: "solo_umido_capsula", type: "number" },
                  { label: "Solo Sec.+Cáps. (M₂, g)", field: "solo_seco_capsula", type: "number" },
                  { label: "Peso Cápsula (Tʟ, g)", field: "peso_capsula", type: "number" },
                ].map(row => (
                  <tr key={row.field} className="bg-white/10">
                    <td className={tdCls + " font-medium text-[#00233B]"}>{row.label}</td>
                    {(data.ll_rows || []).map((r, i) => (
                      <td key={i} className={tdCls}>
                        <Input className={fieldCls} type={row.type} step="0.001"
                          value={r[row.field] || ""}
                          onChange={e => setNested("ll_rows", i, row.field, e.target.value)} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-100/40 font-bold">
                  <td className={tdCls + " font-bold text-[#00233B]"}>Teor de Umidade (%)</td>
                  {(data.ll_rows || []).map((_, i) => <td key={i} className={tdCalcCls + " font-bold text-blue-700"}>{llCalc[i]?.teor != null ? llCalc[i].teor.toFixed(2) : "-"}</td>)}
                </tr>
                <tr className="bg-white/10">
                  <td className={tdCls + " font-medium text-[#00233B]"}>Nº de Golpes</td>
                  {(data.ll_rows || []).map((r, i) => (
                    <td key={i} className={tdCls}>
                      <Input className={fieldCls} type="number"
                        value={r.num_golpes || ""}
                        onChange={e => setNested("ll_rows", i, "num_golpes", e.target.value)} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            {llFit && (
              <div className="mt-1 text-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                LL (25 golpes) = {llFit.ll}%
              </div>
            )}
          </div>

          {/* Limite de Plasticidade */}
          <div>
            <p className="text-[11px] font-bold text-[#00233B] mb-1 text-center uppercase">Limite de Plasticidade</p>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#00233B]/8">
                  <th className={thCls}>Campo</th>
                  {(data.lp_rows || []).map((_, i) => <th key={i} className={thCls + " text-center"}>#{i+1}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Nº Cápsula", field: "numero_capsula", type: "text" },
                  { label: "Solo Úm.+Cáps. (M₁, g)", field: "solo_umido_capsula", type: "number" },
                  { label: "Solo Sec.+Cáps. (M₂, g)", field: "solo_seco_capsula", type: "number" },
                  { label: "Peso Cápsula (g)", field: "peso_capsula", type: "number" },
                ].map(row => (
                  <tr key={row.field} className="bg-white/10">
                    <td className={tdCls + " font-medium text-[#00233B]"}>{row.label}</td>
                    {(data.lp_rows || []).map((r, i) => (
                      <td key={i} className={tdCls}>
                        <Input className={fieldCls} type={row.type} step="0.001"
                          value={r[row.field] || ""}
                          onChange={e => setNested("lp_rows", i, row.field, e.target.value)} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-100/40 font-bold">
                  <td className={tdCls + " font-bold text-[#00233B]"}>Teor de Umidade (%)</td>
                  {(data.lp_rows || []).map((_, i) => <td key={i} className={tdCalcCls + " font-bold text-blue-700"}>{lpTeors[i] != null ? lpTeors[i].toFixed(2) : "-"}</td>)}
                </tr>
              </tbody>
            </table>
            {lpMedia != null && (
              <div className="mt-1 text-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                LP (média) = {lpMedia}%
              </div>
            )}
          </div>
        </div>

        {/* Gráfico LL */}
        {llPoints.length >= 2 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold text-[#00233B] mb-1 text-center uppercase">Gráfico do Limite de Liquidez</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00233B20" />
                  <XAxis dataKey="x" type="number" domain={['auto', 'auto']}
                    label={{ value: 'Nº de Golpes', position: 'insideBottom', offset: -15, fill: '#00233B', fontSize: 11 }}
                    tick={{ fontSize: 10, fill: '#00233B' }} />
                  <YAxis dataKey="y" type="number" domain={['auto', 'auto']}
                    label={{ value: '% de Água', angle: -90, position: 'insideLeft', offset: 10, fill: '#00233B', fontSize: 11 }}
                    tick={{ fontSize: 10, fill: '#00233B' }} width={45} />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                  {llCurve.length > 0 && (
                    <Line data={llCurve} dataKey="y" type="monotone" stroke="#00233B" strokeWidth={2} dot={false} isAnimationActive={false} name="Curva LL" />
                  )}
                  {llFit && <ReferenceLine x={25} stroke="red" strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: `LL=${llFit.ll}%`, fill: 'red', fontSize: 9, position: 'top' }} />}
                  <Scatter data={llPoints} dataKey="y" fill="#BFCF99" stroke="#00233B" strokeWidth={1.5} r={5} name="Pontos" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="mt-4">
          <div className={sectionHeader}>RESUMO</div>
          <table className="w-full border-collapse text-[10px]">
            <tbody>
              {[
                { label: "Pedregulho", value: pctPedregulho != null ? `${pctPedregulho}%` : "-" },
                { label: "Areia Grossa e Média", value: pctAreiaGrossaMedia != null ? `${pctAreiaGrossaMedia}%` : "-" },
                { label: "Areia Fina", value: pctAreiaFina != null ? `${pctAreiaFina}%` : "-" },
                { label: "Silte+Argila (Passante na #200)", value: pctSilteArgila != null ? `${pctSilteArgila}%` : "-" },
                { label: "Limite de Liquidez", value: llFit?.ll != null ? `${llFit.ll}%` : "-", highlight: true },
                { label: "Limite de Plasticidade", value: lpMedia != null ? `${lpMedia}%` : "0,0", highlight: true },
                { label: "Índice de Plasticidade", value: IP != null ? `${IP}%` : "-", highlight: true },
                { label: "Índice de Grupo (IG)", value: igCalc != null ? `${igCalc}` : "-" },
                { label: "Classificação HRB", value: "-" },
              ].map(row => (
                <tr key={row.label} className={row.highlight ? "bg-[#BFCF99]/20" : "bg-white/10"}>
                  <td className="border border-[#00233B]/20 px-2 py-1.5 font-medium text-[#00233B] w-3/4">{row.label}</td>
                  <td className="border border-[#00233B]/20 px-2 py-1.5 text-center font-bold text-[#00233B]">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}