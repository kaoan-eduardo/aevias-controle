import React, { useMemo } from "react";
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const fmtN = (v, d = 2) => (v !== null && v !== undefined && !isNaN(parseFloat(v))) ? parseFloat(v).toFixed(d) : '-';

/* ─── Calc helpers (same logic as EnsaioLimites component) ─── */
function calcUmidade(umido, seco, tara) {
  const agua = parseFloat(umido) - parseFloat(seco);
  const solo = parseFloat(seco) - parseFloat(tara);
  if (isNaN(agua) || isNaN(solo) || solo <= 0) return null;
  return parseFloat(((agua / solo) * 100).toFixed(2));
}

function calcLLRow(row) {
  const agua = parseFloat(row.solo_umido_capsula) - parseFloat(row.solo_seco_capsula);
  const solo = parseFloat(row.solo_seco_capsula) - parseFloat(row.peso_capsula);
  if (isNaN(agua) || isNaN(solo) || solo <= 0) return { teor: null };
  return { teor: parseFloat(((agua / solo) * 100).toFixed(2)) };
}

function fitLogLine(points) {
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
  return { a, b, ll: parseFloat((a * 25 + b).toFixed(1)) };
}

function calcIG(F200, ll, ip) {
  if (F200 == null || ll == null || ip == null) return null;
  const ll200 = F200 < 35 ? 0 : Math.min(F200, 75) - 35;
  const ip200 = F200 < 15 ? 0 : Math.min(F200, 55) - 15;
  const llAt = ll < 40 ? 0 : Math.min(ll, 60) - 40;
  const ipAt = ip < 10 ? 0 : Math.min(ip, 30) - 10;
  return Math.max(0, parseFloat((0.2 * ll200 + 0.005 * ll200 * llAt + 0.01 * ip200 * ipAt).toFixed(0)));
}

function classificarHRB(F10, F40, F200, ll, ip, ig) {
  const f200 = F200 ?? 0, f40 = F40 ?? 0, f10 = F10 ?? 0;
  const llv = ll ?? 0, ipv = ip ?? 0, igv = ig ?? 0;
  if (f200 <= 35) {
    if (f10 <= 50 && f40 <= 30 && ipv <= 6 && igv === 0) return "A1-a";
    if (f40 <= 50 && ipv <= 6 && igv === 0) return "A1-b";
    if (f40 >= 51 && ipv === 0 && f200 <= 10 && igv === 0) return "A3";
    if (llv <= 40 && ipv <= 10 && igv === 0) return "A2-4";
    if (llv >= 41 && ipv <= 10 && igv === 0) return "A2-5";
    if (llv <= 40 && ipv >= 11 && igv <= 4) return "A2-6";
    if (llv >= 41 && ipv >= 11 && igv <= 4) return "A2-7";
  }
  if (f200 >= 36 && llv <= 40 && ipv <= 10 && igv <= 8) return "A4";
  if (f200 >= 36 && llv >= 41 && ipv <= 10 && igv <= 12) return "A5";
  if (f200 >= 36 && llv <= 40 && ipv >= 11 && igv <= 16) return "A6";
  if (f200 >= 36 && llv >= 41 && ipv >= 11 && ipv <= (llv - 30) && igv <= 20) return "A7-5";
  if (f200 >= 36 && llv >= 41 && ipv >= 11 && ipv > (llv - 30) && igv <= 20) return "A7-6";
  return "-";
}

const PENEIRAS_GROSSAS = [
  { label: '3"', mm: 76.2 }, { label: '2"', mm: 50.8 }, { label: '1"', mm: 25.4 },
  { label: '3/8"', mm: 9.52 }, { label: '4°', mm: 4.76 }, { label: '10°', mm: 2.0 },
];
const PENEIRAS_FINAS = [{ label: '40', mm: 0.42 }, { label: '200', mm: 0.075 }];

/* ─── LL curve data ─── */
function LLChart({ llPoints, llFit }) {
  if (llPoints.length < 2) return <div className="text-[7px] text-gray-400 flex items-center justify-center h-full">Insuficiente</div>;
  const xs = llPoints.map(p => p.x);
  const minX = Math.max(1, Math.min(...xs) - 2), maxX = Math.max(...xs) + 2;
  const curveData = [
    { x: minX, y: parseFloat((llFit.a * minX + llFit.b).toFixed(2)) },
    { x: maxX, y: parseFloat((llFit.a * maxX + llFit.b).toFixed(2)) },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart margin={{ top: 6, right: 6, left: 6, bottom: 16 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#ccc" />
        <XAxis dataKey="x" type="number"
          label={{ value: 'Nº Golpes', position: 'insideBottom', offset: -10, fontSize: 7 }}
          tick={{ fontSize: 7 }} />
        <YAxis dataKey="y" type="number" domain={['dataMin - 1', 'dataMax + 5']}
          label={{ value: '% Água', angle: -90, position: 'insideLeft', offset: 10, fontSize: 7 }}
          tick={{ fontSize: 7 }} width={36} tickCount={6} />
        <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
        <Line data={curveData} dataKey="y" type="monotone" stroke="#1e3a5f" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line data={[
          { x: 25, y: 0 },
          { x: 25, y: llFit.ll }
        ]} dataKey="y" type="monotone" stroke="red" strokeDasharray="3 2" strokeWidth={1} dot={false} name="LL ref" />
        <Line data={[
          { x: 0, y: llFit.ll },
          { x: 25, y: llFit.ll }
        ]} dataKey="y" type="monotone" stroke="red" strokeDasharray="3 2" strokeWidth={1} dot={false} isAnimationActive={false} label={{ value: `LL=${llFit.ll}%`, fill: 'red', fontSize: 7, position: 'top' }} />
        <Scatter data={llPoints} dataKey="y" fill="#6b8f3e" stroke="#1e3a5f" r={4} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ─── MAIN EXPORT ─── */
export default function RelatorioLimites({ limites, ensaio, obra, regional }) {
  const lim = limites || {};

  /* Umidade higroscópica */
  const higroT1 = calcUmidade(lim.higro_solo_umido_capsula_1, lim.higro_solo_seco_capsula_1, lim.higro_peso_capsula_1);
  const higroT2 = calcUmidade(lim.higro_solo_umido_capsula_2, lim.higro_solo_seco_capsula_2, lim.higro_peso_capsula_2);
  const higroMedia = useMemo(() => {
    const valid = [higroT1, higroT2].filter(v => v != null);
    return valid.length > 0 ? parseFloat((valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(2)) : null;
  }, [higroT1, higroT2]);

  /* Peneiramento grosso */
  const penGrossas = lim.peneiras_grossas || PENEIRAS_GROSSAS.map(p => ({ ...p, retido: "" }));
  const retidosGrossos = penGrossas.map(p => parseFloat(p.retido) || 0);
  const totalSeca = parseFloat(lim.amostra_total_seca) || null;
  const granGrossaCalc = useMemo(() => {
    if (!totalSeca || totalSeca <= 0) return [];
    let acum = totalSeca;
    return retidosGrossos.map(ret => {
      const passando = parseFloat((acum - ret).toFixed(3));
      const pct = parseFloat((passando / totalSeca * 100).toFixed(1));
      acum = passando;
      return { retido: ret, passando, passPct: pct };
    });
  }, [retidosGrossos, totalSeca]);

  /* SP10 */
  const soloSecoRetido10 = useMemo(() => {
    const t = retidosGrossos.reduce((s, r) => s + r, 0);
    return t > 0 ? parseFloat(t.toFixed(3)) : null;
  }, [retidosGrossos]);

  const soloUmPassando10 = useMemo(() => {
    const ut = parseFloat(lim.amostra_total_umida);
    if (isNaN(ut) || !retidosGrossos.length) return null;
    const r = parseFloat((ut - retidosGrossos.reduce((s, x) => s + x, 0)).toFixed(3));
    return r > 0 ? r : null;
  }, [lim.amostra_total_umida, retidosGrossos]);

  const sp10 = useMemo(() => {
    if (soloUmPassando10 == null || higroMedia == null) return null;
    return parseFloat((soloUmPassando10 / (higroMedia / 100 + 1)).toFixed(3));
  }, [soloUmPassando10, higroMedia]);

  const amostraTotalSecaCalc = useMemo(() => {
    if (soloSecoRetido10 == null || sp10 == null) return null;
    return parseFloat((soloSecoRetido10 + sp10).toFixed(3));
  }, [soloSecoRetido10, sp10]);

  /* Peneiramento fino */
  const penFinas = lim.peneiras_finas || PENEIRAS_FINAS.map(p => ({ ...p, retido: "" }));
  const amostParcSeca = parseFloat(lim.amostra_parcial_seca) || null;
  const granFinaCalc = useMemo(() => {
    if (!amostParcSeca || amostParcSeca <= 0) return [];
    let acum = amostParcSeca;
    return penFinas.map(pen => {
      const ret = parseFloat(pen.retido) || 0;
      const passando = parseFloat((acum - ret).toFixed(3));
      const pct = parseFloat((passando / amostParcSeca * 100).toFixed(1));
      acum = passando;
      return { retido: ret, passando, passPct: pct };
    });
  }, [penFinas, amostParcSeca]);

  /* LL */
  const llRows = lim.ll_rows || [];
  const llCalc = useMemo(() => llRows.map(calcLLRow), [llRows]);
  const llPoints = useMemo(() =>
    llRows.map((r, i) => ({ x: parseFloat(r.num_golpes), y: llCalc[i].teor }))
      .filter(p => p.x > 0 && p.y != null),
    [llRows, llCalc]);
  const llFit = useMemo(() => fitLogLine(llPoints), [llPoints]);

  /* LP */
  const lpRows = lim.lp_rows || [];
  const lpTeors = useMemo(() => lpRows.map(r => calcUmidade(r.solo_umido_capsula, r.solo_seco_capsula, r.peso_capsula)), [lpRows]);
  const lpMedia = useMemo(() => {
    const valid = lpTeors.filter(v => v != null);
    return valid.length > 0 ? parseFloat((valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(1)) : null;
  }, [lpTeors]);

  /* IP, IG, HRB */
  const IP = llFit?.ll != null && lpMedia != null ? parseFloat((llFit.ll - lpMedia).toFixed(1)) : null;

  const pct200 = useMemo(() => {
    if (!granFinaCalc.length || !totalSeca || sp10 == null || !amostParcSeca) return null;
    const passando200 = granFinaCalc[granFinaCalc.length - 1]?.passando || 0;
    return parseFloat(((passando200 / amostParcSeca) * (sp10 / totalSeca) * 100).toFixed(1));
  }, [granFinaCalc, totalSeca, sp10, amostParcSeca]);

  const pct10 = granGrossaCalc[5]?.passando != null && totalSeca
    ? parseFloat((granGrossaCalc[5].passando / totalSeca * 100).toFixed(1)) : null;
  const pct40 = granFinaCalc[0]?.passando != null && totalSeca && sp10 && amostParcSeca
    ? parseFloat(((granFinaCalc[0].passando / amostParcSeca) * (sp10 / totalSeca) * 100).toFixed(1)) : null;

  const igCalc = calcIG(pct200, llFit?.ll, IP);
  const hrb = classificarHRB(pct10, pct40, pct200, llFit?.ll ?? null, IP, igCalc);

  if (!limites) return null;

  const fmtDate = (d) => d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR') : '-';
  const fmtDateTime = (d) => {
    if (!d) return '-';
    const n = (!d.endsWith('Z') && !d.includes('+')) ? d + 'Z' : d;
    return new Date(n).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
  };

  const th = "border border-slate-400 px-1 py-0.5 text-left font-semibold bg-slate-100 text-[8px]";
  const td = "border border-slate-400 px-1 py-0.5 text-[8px]";
  const tdC = "border border-slate-400 px-1 py-0.5 text-center text-[8px]";
  const tdCalc = "border border-slate-400 px-1 py-0.5 text-center text-[8px] bg-gray-50 text-gray-600 font-semibold";

  const infoFields = ensaio ? [
    ["OBRA", obra?.name || '-'],
    ["LOCAL", ensaio.local_coleta || '-'],
    ["MATERIAL", ensaio.material || '-'],
    ["RODOVIA", ensaio.rodovia || '-'],
    ["ENERGIA", ensaio.energia_compactacao || '-'],
    ["LABORATORISTA", ensaio.laboratorista_name || '-'],
    ["TRECHO", ensaio.trecho || '-'],
    ["CAMADA", ensaio.camada || '-'],
    ["DATA", fmtDate(ensaio.data_ensaio)],
  ] : [];

  return (
    <section className="space-y-2" style={{ pageBreakBefore: 'always' }}>

      {/* Cabeçalho repetido */}
      <header className="grid items-center py-1 mb-1" style={{ gridTemplateColumns: '60px 1fr 60px' }}>
        <div>
          <img
            src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"}
            alt="Logo" className="h-8 object-contain"
          />
        </div>
        <h1 className="text-xs font-bold text-gray-800 text-center">CARACTERIZAÇÃO MECÂNICA</h1>
      </header>

      {infoFields.length > 0 && (
        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[9px] border border-slate-300 p-1 rounded mb-1">
          {infoFields.map(([label, val]) => (
            <div key={label}>
              <span className="font-bold text-gray-700">{label}: </span>
              <span className="text-gray-900">{val}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px]">
        ENSAIOS FÍSICOS DE CARACTERIZAÇÃO (ABNT NBR 7181 | 6459 | 7180)
      </div>

      {/* Umidade Higroscópica */}
      <div>
        <div className="bg-slate-200 px-1 py-0.5 font-bold text-[9px] mb-0.5">Umidade Higroscópica</div>
        <table className="w-full border-collapse border border-slate-400">
          <thead>
            <tr><th className={th}>Campo</th><th className={th + " text-center"}>Am. 1</th><th className={th + " text-center"}>Am. 2</th><th className={th + " text-center"}>Média</th></tr>
          </thead>
          <tbody>
            {[
              ["Solo Úmido+Cápsula (g)", lim.higro_solo_umido_capsula_1, lim.higro_solo_umido_capsula_2],
              ["Solo Seco+Cápsula (g)", lim.higro_solo_seco_capsula_1, lim.higro_solo_seco_capsula_2],
              ["Peso da Cápsula (g)", lim.higro_peso_capsula_1, lim.higro_peso_capsula_2],
            ].map(([label, v1, v2]) => (
              <tr key={label}>
                <td className={td}>{label}</td>
                <td className={tdC}>{fmtN(v1)}</td>
                <td className={tdC}>{fmtN(v2)}</td>
                <td className={tdCalc}>-</td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td className={td}>Teor de Umidade (%)</td>
              <td className={tdCalc}>{fmtN(higroT1)}</td>
              <td className={tdCalc}>{fmtN(higroT2)}</td>
              <td className={tdCalc + " font-bold text-blue-800"}>{fmtN(higroMedia)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Granulometria */}
      <div className="grid grid-cols-2 gap-2">
        {/* Peneiramento Grosso */}
        <div>
          <div className="bg-slate-200 px-1 py-0.5 font-bold text-[9px] mb-0.5">Peneiramento Grosso</div>
          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr><th className={th}>Peneira</th><th className={th}>mm</th><th className={th}>Ret.(g)</th><th className={th}>Pass.(g)</th><th className={th}>Pass.(%)</th></tr>
            </thead>
            <tbody>
              {penGrossas.map((pen, i) => (
                <tr key={i}>
                  <td className={td}>{pen.label}</td>
                  <td className={tdC}>{pen.mm}</td>
                  <td className={tdC}>{fmtN(pen.retido, 2)}</td>
                  <td className={tdCalc}>{granGrossaCalc[i]?.passando != null ? granGrossaCalc[i].passando.toFixed(2) : '-'}</td>
                  <td className={tdCalc}>{granGrossaCalc[i]?.passPct != null ? granGrossaCalc[i].passPct.toFixed(1) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-1 text-[8px] space-y-0.5">
            {[
              ["Amostra Total Úmida (g)", fmtN(lim.amostra_total_umida, 3)],
              ["Amostra Total Seca (g)", fmtN(lim.amostra_total_seca, 3)],
              ["Solo Seco Retido #10 (g)", fmtN(soloSecoRetido10, 3)],
              ["Solo Úmido Passando #10 (g)", fmtN(soloUmPassando10, 3)],
              ["Solo Seco Passando #10 — SP₁₀ (g)", fmtN(sp10, 3)],
              ["Total Seca Calc. SR₁₀+SP₁₀ (g)", fmtN(amostraTotalSecaCalc, 3)],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="text-gray-700">{label}</span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peneiramento Fino */}
        <div>
          <div className="bg-slate-200 px-1 py-0.5 font-bold text-[9px] mb-0.5">Peneiramento Fino</div>
          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr><th className={th}>Pen.</th><th className={th}>mm</th><th className={th}>Ret.(g)</th><th className={th}>Pass.(g)</th><th className={th}>Pass.(%)</th><th className={th}>%Total</th></tr>
            </thead>
            <tbody>
              {penFinas.map((pen, i) => {
                const totalPasePct = granFinaCalc[i]?.passPct != null && sp10 != null && totalSeca
                  ? parseFloat((granFinaCalc[i].passPct * (sp10 / totalSeca)).toFixed(1)) : null;
                return (
                  <tr key={i}>
                    <td className={td}>{pen.label}</td>
                    <td className={tdC}>{pen.mm}</td>
                    <td className={tdC}>{fmtN(pen.retido, 2)}</td>
                    <td className={tdCalc}>{granFinaCalc[i]?.passando != null ? granFinaCalc[i].passando.toFixed(2) : '-'}</td>
                    <td className={tdCalc}>{granFinaCalc[i]?.passPct != null ? granFinaCalc[i].passPct.toFixed(1) : '-'}</td>
                    <td className={tdCalc}>{totalPasePct != null ? totalPasePct.toFixed(1) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-1 text-[8px] space-y-0.5">
            {[
              ["Amostra Parcial Úmida (g)", fmtN(lim.amostra_parcial_umida, 3)],
              ["Amostra Parcial Seca (g)", fmtN(lim.amostra_parcial_seca, 3)],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="text-gray-700">{label}</span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LL e LP */}
      <div className="grid grid-cols-2 gap-2">
        {/* Limite de Liquidez */}
        <div>
          <div className="bg-slate-200 px-1 py-0.5 font-bold text-[9px] mb-0.5">Limite de Liquidez</div>
          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr>
                <th className={th}>Campo</th>
                {llRows.map((_, i) => <th key={i} className={th + " text-center"}>#{i+1}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Nº Cápsula", field: "numero_capsula" },
                { label: "S+Ú+C (g)", field: "solo_umido_capsula" },
                { label: "S+S+C (g)", field: "solo_seco_capsula" },
                { label: "Peso C (g)", field: "peso_capsula" },
              ].map(row => (
                <tr key={row.field}>
                  <td className={td}>{row.label}</td>
                  {llRows.map((r, i) => <td key={i} className={tdC}>{r[row.field] || '-'}</td>)}
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className={td}>Teor (%)</td>
                {llCalc.map((c, i) => <td key={i} className={tdCalc + " text-blue-800 font-bold"}>{c.teor != null ? fmtN(c.teor) : '-'}</td>)}
              </tr>
              <tr>
                <td className={td}>Nº Golpes</td>
                {llRows.map((r, i) => <td key={i} className={tdC}>{r.num_golpes || '-'}</td>)}
              </tr>
            </tbody>
          </table>
          {llFit && (
            <div className="mt-0.5 text-center text-[8px] font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">
              LL (25 golpes) = {llFit.ll}%
            </div>
          )}
        </div>

        {/* Limite de Plasticidade */}
        <div>
          <div className="bg-slate-200 px-1 py-0.5 font-bold text-[9px] mb-0.5">Limite de Plasticidade</div>
          <table className="w-full border-collapse border border-slate-400">
            <thead>
              <tr>
                <th className={th}>Campo</th>
                {lpRows.map((_, i) => <th key={i} className={th + " text-center"}>#{i+1}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Nº Cápsula", field: "numero_capsula" },
                { label: "S+Ú+C (g)", field: "solo_umido_capsula" },
                { label: "S+S+C (g)", field: "solo_seco_capsula" },
                { label: "Peso C (g)", field: "peso_capsula" },
              ].map(row => (
                <tr key={row.field}>
                  <td className={td}>{row.label}</td>
                  {lpRows.map((r, i) => <td key={i} className={tdC}>{r[row.field] || '-'}</td>)}
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className={td}>Teor (%)</td>
                {lpTeors.map((t, i) => <td key={i} className={tdCalc + " text-blue-800 font-bold"}>{t != null ? fmtN(t) : '-'}</td>)}
              </tr>
            </tbody>
          </table>
          {lpMedia != null && (
            <div className="mt-0.5 text-center text-[8px] font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">
              LP (média) = {lpMedia}%
            </div>
          )}
        </div>
      </div>

      {/* Gráfico LL */}
      {llPoints.length >= 2 && llFit && (
        <div>
          <div className="bg-slate-200 px-1 py-0.5 font-bold text-[9px] mb-0.5">Gráfico — Limite de Liquidez</div>
          <div style={{ height: 208 }}>
            <LLChart llPoints={llPoints} llFit={llFit} />
          </div>
        </div>
      )}

      {/* Resumo */}
      <div>
        <div className="bg-slate-200 px-1 py-0.5 font-bold text-[9px] mb-0.5">Resumo de Caracterização</div>
        <table className="w-full border-collapse border border-slate-400">
          <tbody>
            {[
              ["% Passante #10 (2mm)", pct10 != null ? `${pct10}%` : '-'],
              ["% Passante #40 (0,42mm)", pct40 != null ? `${pct40}%` : '-'],
              ["% Passante #200 (0,075mm)", pct200 != null ? `${pct200}%` : '-'],
              ["Limite de Liquidez (LL)", llFit?.ll != null ? `${llFit.ll}%` : '-'],
              ["Limite de Plasticidade (LP)", lpMedia != null ? `${lpMedia}%` : '-'],
              ["Índice de Plasticidade (IP)", IP != null ? `${IP}%` : '-'],
              ["Índice de Grupo (IG)", igCalc != null ? `${igCalc}` : '-'],
              ["Classificação HRB (AASHTO)", hrb],
            ].map(([label, val]) => (
              <tr key={label} className="odd:bg-white even:bg-slate-50">
                <td className={td + " w-3/4"}>{label}</td>
                <td className={tdC + " font-bold text-blue-800"}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assinaturas */}
      {ensaio && (
        <footer className="mt-4 pt-2">
          <div className="grid grid-cols-3 gap-8 items-end">
            {/* Laboratorista */}
            <div className="text-center">
              <div className="text-[8px] text-slate-500 mb-2 h-16 flex flex-col justify-end items-center">
                {ensaio.laboratorista_name && (
                  <>
                    <p className="font-bold text-slate-700">{ensaio.laboratorista_name}</p>
                    <p>{ensaio.created_by}</p>
                    {ensaio.created_date && <p>em {fmtDateTime(ensaio.created_date)}</p>}
                  </>
                )}
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="font-semibold text-[8px]">LABORATORISTA RESPONSÁVEL</p>
              </div>
            </div>
            {/* Engenheiro */}
            <div className="text-center">
              <div className="text-[8px] text-slate-500 mb-2 h-16 flex flex-col justify-end items-center">
                {ensaio.approver_details?.name && (
                  <>
                    <p className="font-bold text-slate-700">{ensaio.approver_details.name}</p>
                    <p>{ensaio.approved_by}</p>
                    {ensaio.approver_details.crea_number && <p>CREA: {ensaio.approver_details.crea_number}</p>}
                    {ensaio.approved_date && <p>em {fmtDateTime(ensaio.approved_date)}</p>}
                  </>
                )}
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="font-semibold text-[8px]">ENGENHEIRO RESPONSÁVEL</p>
              </div>
            </div>
            {/* Cliente */}
            <div className="text-center">
              <div className="text-[8px] text-slate-500 mb-2 h-16 flex flex-col justify-end items-center">
                {ensaio.client_signature?.signed_by && (
                  <>
                    <p className="font-bold text-slate-700">{ensaio.client_signature.engineer_name}</p>
                    <p>{ensaio.client_signature.signed_by}</p>
                    {ensaio.client_signature.crea_number && <p>CREA: {ensaio.client_signature.crea_number}</p>}
                    {ensaio.client_signature.signed_date && <p>em {fmtDateTime(ensaio.client_signature.signed_date)}</p>}
                  </>
                )}
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="font-semibold text-[8px]">ENGENHEIRO CLIENTE</p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
}