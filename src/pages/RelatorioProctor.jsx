import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useReportMode } from "@/hooks/useReportMode";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import AprovacaoBar from "@/components/relatorios/AprovacaoBar";
import SignatureFooter from "@/components/relatorios/SignatureFooter";
import { fitParabola } from "@/components/ensaios/ProctorChart";
import RelatorioLimites from "@/components/relatorios/RelatorioLimites";
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";

const PENETRACOES = [0.64, 1.27, 1.91, 2.54, 3.81, 5.08, 6.35, 7.62, 8.89];
const TEMPOS = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0];
const PRESSAO_PADRAO = { 3: 70.31, 5: 105.46 };

const fmtN = (v, d = 2) => (v !== null && v !== undefined && !isNaN(v)) ? parseFloat(v).toFixed(d) : '-';
const fmtDate = (d) => d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR') : '-';
const fmtDateTime = (d) => {
  if (!d) return '-';
  const n = (!d.endsWith('Z') && !d.includes('+')) ? d + 'Z' : d;
  return new Date(n).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
};

function calcISC(cil, fatorAnel) {
  const fator = parseFloat(fatorAnel);
  if (isNaN(fator) || fator <= 0) return { pressoes: Array(9).fill(null), isc254: null, isc508: null, isc: null };
  const pressoes = (cil.leituras || []).map(l => {
    const v = parseFloat(l);
    return !isNaN(v) && v > 0 ? parseFloat((v * fator).toFixed(2)) : null;
  });
  const isc254 = pressoes[3] != null ? parseFloat((pressoes[3] / PRESSAO_PADRAO[3] * 100).toFixed(1)) : null;
  const isc508 = pressoes[5] != null ? parseFloat((pressoes[5] / PRESSAO_PADRAO[5] * 100).toFixed(1)) : null;
  const isc = (isc254 != null && isc508 != null) ? Math.max(isc254, isc508)
    : (isc254 ?? isc508);
  return { pressoes, isc254, isc508, isc };
}

function calcExpansao(exp) {
  const alt = parseFloat(exp.altura_inicial);
  const l1 = parseFloat(exp.leitura_1dia);
  const vals = [exp.leitura_2dia, exp.leitura_3dia, exp.leitura_4dia];
  const lastVal = [...vals].reverse().find(v => v !== '' && v != null && !isNaN(parseFloat(v)));
  const lFinal = lastVal != null ? parseFloat(lastVal) : null;
  const diferenca = !isNaN(l1) && lFinal != null ? parseFloat((lFinal - l1).toFixed(2)) : (exp.diferenca != null ? parseFloat(exp.diferenca) : null);
  const expansao_pct = diferenca != null && !isNaN(alt) && alt > 0
    ? parseFloat((diferenca / alt * 100).toFixed(2))
    : (exp.expansao_pct != null ? parseFloat(exp.expansao_pct) : null);
  return { diferenca, expansao_pct };
}

function fitLinear(points) {
  if (points.length < 2) return null;
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-10) return null;
  const a = (n * sxy - sx * sy) / denom;
  const b = (sy - a * sx) / n;
  return { a, b };
}

/* ─────────── MINI CHART ─────────── */
function MiniChartTooltip({ active, payload, xLabel, yLabel }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #ccc', padding: '4px 8px', fontSize: 8 }}>
      <div><strong>Umidade:</strong> {Number(pt.x).toFixed(2)}%</div>
      <div><strong>{yLabel}:</strong> {Number(pt.y).toFixed(3)}</div>
    </div>
  );
}

function MiniChart({ data, lineData, refX, refY, xLabel, yLabel, refLabel, color = "#1e3a5f", isLinear = false }) {
  if (!data?.length) return <div className="flex items-center justify-center h-full text-[8px] text-gray-400">Sem dados</div>;
  
  const lineDataFinal = isLinear && data.length >= 2 ? (() => {
    const linear = fitLinear(data);
    if (!linear) return [];
    const xs = data.map(p => p.x);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    return Array.from({ length: 30 }, (_, i) => {
      const x = minX + (maxX - minX) * i / 29;
      return { x: parseFloat(x.toFixed(2)), y: parseFloat((linear.a * x + linear.b).toFixed(3)) };
    });
  })() : lineData || [];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#ccc" />
        <XAxis dataKey="x" type="number" domain={['dataMin - 0.3', 'dataMax + 0.3']}
          label={{ value: xLabel, position: 'insideBottom', offset: -12, fontSize: 7 }}
          tick={{ fontSize: 7 }} tickFormatter={v => v.toFixed(1)} tickCount={6} />
        <YAxis dataKey="y" type="number" domain={['dataMin - 0.02', 'dataMax + 0.02']}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 12, fontSize: 7 }}
          tick={{ fontSize: 7 }} tickFormatter={v => v.toFixed(2)} width={40} tickCount={6} />
        <Tooltip content={<MiniChartTooltip xLabel={xLabel} yLabel={yLabel} />} />
        {lineDataFinal?.length > 0 && (
          <Line data={lineDataFinal} dataKey="y" type="monotone" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} name="Curva" />
        )}
        <Scatter data={data} dataKey="y" fill="#6b8f3e" stroke={color} strokeWidth={1} r={4} name="Pontos" isAnimationActive={false} />
        {refX != null && <ReferenceLine x={refX} stroke="red" strokeDasharray="3 2" strokeWidth={1} />}
        {refY != null && <ReferenceLine y={refY} stroke="red" strokeDasharray="3 2" strokeWidth={1}
          label={{ value: refLabel, fill: 'red', fontSize: 7, position: 'insideTopRight' }} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ─────────── ISC TABLE (common) ─────────── */
function ISCSection({ ensaio }) {
  const cbr = ensaio.cbr_cilindros || [];
  const fator = ensaio.cbr_fator_anel;
  const hasData = cbr.some(c => (c.leituras || []).some(l => parseFloat(l) > 0));
  
  if (!hasData) return null;
  
  return (
    <section>
      <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">CÁLCULO DO ISC</div>
      <table className="w-full border-collapse border border-slate-400 text-[8px]">
        <tbody>
          {/* Header com penetrações */}
          <tr className="bg-slate-100">
            <td className="border border-slate-400 px-1 py-0.5 font-bold" rowSpan={2}>Nº Cilindro</td>
            <td className="border border-slate-400 px-1 py-0.5 font-bold">Penetração (mm)</td>
            {PENETRACOES.map((p, i) => (
              <td key={i} className="border border-slate-400 px-1 py-0.5 text-center font-bold">{p}</td>
            ))}
          </tr>
          {/* Tempos */}
          <tr className="bg-slate-100">
            <td className="border border-slate-400 px-1 py-0.5 font-bold">Tempo (min)</td>
            {TEMPOS.map((t, i) => (
              <td key={i} className="border border-slate-400 px-1 py-0.5 text-center font-bold">{t}</td>
            ))}
          </tr>
          {/* Header: Pressão Padrão */}
          <tr className="bg-slate-200 font-bold">
            <td className="border border-slate-400 px-1 py-0.5 text-[7px]"></td>
            <td className="border border-slate-400 px-1 py-0.5 text-[7px]">Pressão Padrão</td>
            {PENETRACOES.map((_, pi) => (
              <td key={pi} className="border border-slate-400 px-1 py-0.5 text-center text-[7px]">{PRESSAO_PADRAO[pi] || ''}</td>
            ))}
          </tr>
          {/* Cilindros */}
          {cbr.map((cil, cidx) => {
            const { pressoes, isc254, isc508 } = calcISC(cil, fator);
            return (
              <React.Fragment key={cidx}>
                {/* Leitura do anel */}
                <tr className="bg-white">
                  <td className="border border-slate-400 px-1 py-0.5 font-semibold" rowSpan={2}>{cil.cilindro_numero || cidx + 1}</td>
                  <td className="border border-slate-400 px-1 py-0.5 text-[7px]">Leitura do anel</td>
                  {(cil.leituras || Array(9).fill('')).map((l, li) => (
                    <td key={li} className="border border-slate-400 px-1 py-0.5 text-center">{parseFloat(l) > 0 ? fmtN(l, 0) : ''}</td>
                  ))}
                </tr>
                {/* ISC */}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-400 px-1 py-0.5 text-[7px]">ISC (%)</td>
                  {PENETRACOES.map((_, pi) => (
                    <td key={pi} className="border border-slate-400 px-1 py-0.5 text-center text-blue-800">
                      {pi === 3 && isc254 != null ? isc254 : pi === 5 && isc508 != null ? isc508 : ''}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/* ─────────── EXPANSÃO TABLE (common) ─────────── */
function ExpansaoSection({ ensaio }) {
  const exps = ensaio.expansao_cilindros || [];
  const altInicial = exps[0]?.altura_inicial;
  return (
    <section>
      <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">EXPANSÃO</div>
      <div className="text-[9px] mb-1 px-1">
        <strong>Altura Inicial (mm):</strong> {fmtN(altInicial, 2)}
      </div>
      <table className="w-full border-collapse border border-slate-400 text-[8px]">
        <thead>
          <tr className="bg-slate-200">
            <th className="border border-slate-400 px-1 py-0.5">Data</th>
            <th className="border border-slate-400 px-1 py-0.5">Hora</th>
            <th className="border border-slate-400 px-1 py-0.5">Cilindro</th>
            <th className="border border-slate-400 px-1 py-0.5 bg-slate-100">1° dia (mm)</th>
            <th className="border border-slate-400 px-1 py-0.5 bg-slate-100">2° dia (mm)</th>
            <th className="border border-slate-400 px-1 py-0.5 bg-slate-100">3° dia (mm)</th>
            <th className="border border-slate-400 px-1 py-0.5 bg-slate-100">4° dia (mm)</th>
            <th className="border border-slate-400 px-1 py-0.5">Dif. (mm)</th>
            <th className="border border-slate-400 px-1 py-0.5 font-bold">Exp. (%)</th>
          </tr>
        </thead>
        <tbody>
          {exps.map((exp, i) => {
            const { diferenca, expansao_pct } = calcExpansao(exp);
            const cilNome = ensaio.densidades?.[i]?.cilindro_numero || (i + 1);
            return (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-400 px-1 py-0.5 text-center">{exp.data ? fmtDate(exp.data) : '-'}</td>
                <td className="border border-slate-400 px-1 py-0.5 text-center">{exp.hora || '-'}</td>
                <td className="border border-slate-400 px-1 py-0.5 text-center font-semibold">{cilNome}</td>
                {['leitura_1dia', 'leitura_2dia', 'leitura_3dia', 'leitura_4dia'].map(f => (
                  <td key={f} className="border border-slate-400 px-1 py-0.5 text-center bg-gray-100">{fmtN(exp[f], 2)}</td>
                ))}
                <td className="border border-slate-400 px-1 py-0.5 text-center">{diferenca != null ? fmtN(diferenca, 2) : '-'}</td>
                <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-blue-800">{expansao_pct != null ? fmtN(expansao_pct, 2) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/* ─────────── GRÁFICOS (common) ─────────── */
function GraficosSection({ ensaio, isHigro, chartPoints, parabola, iscPoints, expPoints, iscParabola, expParabola, iscAtWotima, expAtWotima }) {
  const buildCurve = (pts, par) => {
    if (!par || !pts.length) return [];
    const xs = pts.map(p => p.x);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    return Array.from({ length: 30 }, (_, i) => {
      const x = minX + (maxX - minX) * i / 29;
      return { x: parseFloat(x.toFixed(2)), y: parseFloat((par.a * x ** 2 + par.b * x + par.c).toFixed(3)) };
    });
  };

  const curveData = buildCurve(chartPoints, parabola);

  return (
    <section>
      <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">GRÁFICOS</div>
      <div className="grid grid-cols-3 gap-2" style={{ height: 213 }}>
        {/* Proctor curve */}
        <div className="border border-slate-300 p-1 relative">
          <div className="text-[7px] text-center text-gray-500 mb-0.5 font-semibold">Densidade do Solo Seco (g/cm³)</div>
          {parabola && (
            <div className="absolute bottom-1 right-1 text-[6px] text-gray-600 text-right leading-tight print:hidden">
              <div>Dens. máx. = {fmtN(parabola.gamma_max, 3)} g/cm³</div>
              <div>Hótima = {fmtN(parabola.w_otima, 1)}%</div>
            </div>
          )}
          <div style={{ height: 198 }}>
            <MiniChart
              data={chartPoints.map(p => ({ x: p.x, y: p.y }))}
              lineData={curveData}
              refX={parabola?.w_otima}
              refY={parabola?.gamma_max}
              xLabel="Umidade (%)" yLabel="γd (g/cm³)"
            />
          </div>
        </div>
        {/* ISC */}
        <div className="border border-slate-300 p-1 relative">
          <div className="text-[7px] text-center text-gray-500 mb-0.5 font-semibold">ISC (%)</div>
          <div style={{ height: 198 }}>
            <MiniChart
              data={iscPoints}
              lineData={buildCurve(iscPoints, iscParabola)}
              refX={parabola?.w_otima}
              refY={iscAtWotima}
              xLabel="Umidade (%)" yLabel="ISC (%)"
              color="#1e3a5f"
            />
          </div>
        </div>
        {/* Expansão */}
        <div className="border border-slate-300 p-1 relative">
          <div className="text-[7px] text-center text-gray-500 mb-0.5 font-semibold">Expansão (%)</div>
          <div style={{ height: 198 }}>
            <MiniChart
              data={expPoints}
              lineData={buildCurve(expPoints, expParabola)}
              refX={parabola?.w_otima}
              refY={expAtWotima}
              xLabel="Umidade (%)" yLabel="Exp. (%)"
              color="#1e3a5f"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── COMPACTAÇÃO HIGROSCÓPICA ─────────── */
function CompactacaoHigroscopica({ ensaio }) {
  const u0 = (ensaio.umidades || [])[0] || {};
  const densidades = ensaio.densidades || [];
  const umidMedia = fmtN(u0.teor_umidade_media, 2);

  const higRows = [
    ["Cápsula Nº", u0.capsula_numero_1 || '-', u0.capsula_numero_2 || '-'],
    ["C+S+A (g)", fmtN(u0.capsula_solo_umido_1), fmtN(u0.capsula_solo_umido_2)],
    ["C+S (g)", fmtN(u0.capsula_solo_seco_1), fmtN(u0.capsula_solo_seco_2)],
    ["A - Água (g)", fmtN(u0.capsula_solo_umido_1 - u0.capsula_solo_seco_1), fmtN(u0.capsula_solo_umido_2 - u0.capsula_solo_seco_2)],
    ["C - Cápsula (g)", fmtN(u0.peso_capsula_1), fmtN(u0.peso_capsula_2)],
    ["S - Solo (g)", fmtN(u0.capsula_solo_seco_1 - u0.peso_capsula_1), fmtN(u0.capsula_solo_seco_2 - u0.peso_capsula_2)],
    ["Umidade (%)", fmtN(u0.teor_umidade_1), fmtN(u0.teor_umidade_2)],
    ["Umidade média (%)", umidMedia, ''],
  ];

  const moldeRowLabels = [
    "Umidade calculada (%)", "Água adicionada (g)", "% Água adicionada",
    "M+S+A (g)", "S+A (g)", "Dens. úmida (g/cm³)", "Dens. seca (g/cm³)",
  ];
  const moldeRowValues = densidades.map(d => {
    const pctAgua = (d.agua_adicionada_ml != null && d.peso_seco > 0)
      ? parseFloat((d.agua_adicionada_ml / d.peso_seco * 100).toFixed(1))
      : null;
    return [
      fmtN(d.umidade_calculada, 1),
      fmtN(d.agua_adicionada_ml, 1),
      fmtN(pctAgua, 1),
      fmtN(d.cilindro_solo_umido, 1),
      fmtN(d.peso_solo_umido, 1),
      fmtN(d.dens_ap_umida, 3),
      fmtN(d.dens_ap_seca, 3),
    ];
  });

  return (
    <section>
      <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">COMPACTAÇÃO</div>
      <table className="w-full border-collapse border border-slate-400 text-[8px]">
        <thead>
          <tr className="bg-slate-200">
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}} colSpan={3}>UMIDADE HIGROSCÓPICA</th>
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}} colSpan={6}>
              Nº MOLDES — {densidades.map(d => d.cilindro_numero || '?').join(' | ')}
            </th>
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}} colSpan={3}>CILINDROS</th>
          </tr>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 px-1 text-left" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Campo</th>
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Am. 1</th>
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Am. 2</th>
            <th className="border border-slate-400 px-1 text-left" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Campo</th>
            {densidades.map((d, i) => (
              <th key={i} className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{d.cilindro_numero || i+1}</th>
            ))}
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Nº</th>
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Peso (g)</th>
            <th className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Vol (cm³)</th>
          </tr>
        </thead>
        <tbody>
          {higRows.map(([label, am1, am2], ri) => {
            const isMediaRow = label === 'Umidade média (%)';
            const moldeLabel = moldeRowLabels[ri] || '';
            return (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-400 px-1 font-medium" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{label}</td>
                {isMediaRow ? (
                  <td className="border border-slate-400 px-1 text-center font-bold" colSpan={2} style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{am1}</td>
                ) : (
                  <>
                    <td className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{am1}</td>
                    <td className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{am2}</td>
                  </>
                )}
                <td className="border border-slate-400 px-1 font-medium" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{moldeLabel}</td>
                {densidades.map((_, di) => (
                  <td key={di} className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>
                    {moldeRowValues[di]?.[ri] ?? '-'}
                  </td>
                ))}
                {ri < densidades.length ? (
                  <>
                    <td className="border border-slate-400 px-1 text-center font-semibold" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{densidades[ri].cilindro_numero || ri+1}</td>
                    <td className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{fmtN(densidades[ri].peso_cilindro, 1)}</td>
                    <td className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{fmtN(densidades[ri].volume_cilindro, 1)}</td>
                  </>
                ) : ri === densidades.length ? (
                  <>
                    <td className="border border-slate-400 px-1 font-medium" colSpan={2} style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Peso mat. (g)</td>
                    <td className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{fmtN(densidades[0]?.peso_amostra_umida, 1)}</td>
                  </>
                ) : ri === densidades.length + 1 ? (
                  <>
                    <td className="border border-slate-400 px-1 font-medium" colSpan={2} style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>Peso seco (g)</td>
                    <td className="border border-slate-400 px-1 text-center" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}>{fmtN(densidades[0]?.peso_seco, 1)}</td>
                  </>
                ) : (
                  <td colSpan={3} className="border border-slate-400" style={{paddingTop: '0.185rem', paddingBottom: '0.185rem'}}></td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/* ─────────── COMPACTAÇÃO PONTO A PONTO ─────────── */
function CompactacaoPontoAPonto({ ensaio }) {
  const densidades = ensaio.densidades || [];
  const umidades = ensaio.umidades || [];

  const densRows = [
    { label: "Cilindro+Solo Úmido (g)", sym: "A", field: "cilindro_solo_umido" },
    { label: "Peso do Cilindro (g)", sym: "B", field: "peso_cilindro" },
    { label: "Peso do Solo Úmido (g)", sym: "C=A-B", field: "peso_solo_umido", calc: true },
    { label: "Volume do Cilindro (cm³)", sym: "D", field: "volume_cilindro" },
    { label: "Dens. Apar. Úmida (g/cm³)", sym: "E=C/D", field: "dens_ap_umida", calc: true, dec: 3 },
  ];

  const umidRows = [
    { label: "Cápsula Nº", sym: "-", field: "capsula_numero_1", str: true },
    { label: "Cápsula+Solo Úmido (g)", sym: "F", field: "capsula_solo_umido_1" },
    { label: "Cápsula+Solo Seco (g)", sym: "G", field: "capsula_solo_seco_1" },
    { label: "Peso da Cápsula (g)", sym: "I", field: "peso_capsula_1" },
    { label: "Teor de Umidade (%)", sym: "K", field: "teor_umidade_media", calc: true },
    { label: "Dens. Apar. Seca (g/cm³)", sym: "L=E/(100+K)", field: "dens_ap_seca", calc: true, dec: 3 },
  ];

  const getCilVal = (d, row) => {
    if (row.str) return d[row.field] || '-';
    const v = d[row.field];
    return (v != null && !isNaN(v)) ? fmtN(v, row.dec ?? 1) : '-';
  };

  const getUmVal = (u, d, row) => {
    if (row.str) return u[row.field] || '-';
    if (row.field === 'dens_ap_seca') {
      return (d?.dens_ap_seca != null && !isNaN(d.dens_ap_seca)) ? fmtN(d.dens_ap_seca, row.dec ?? 3) : '-';
    }
    const v = u[row.field];
    return (v != null && !isNaN(v)) ? fmtN(v, row.dec ?? 1) : '-';
  };

  return (
    <section>
      <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">DETERMINAÇÃO DA UMIDADE E DENSIDADE</div>
      {/* Density table */}
      <table className="w-full border-collapse border border-slate-400 text-[8px] mb-1" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '10%' }} />
          {densidades.map((_, i) => (
            <col key={i} style={{ width: `${60 / densidades.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-slate-200">
            <th className="border border-slate-400 px-1 py-0.5 text-left">Campo</th>
            <th className="border border-slate-400 px-1 py-0.5 text-center">Fórmula</th>
            {densidades.map((d, i) => (
              <th key={i} className="border border-slate-400 px-1 py-0.5 text-center">Cil. {d.cilindro_numero || i+1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {densRows.map((row, ri) => (
            <tr key={ri} className={row.calc ? 'bg-slate-100 font-semibold' : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="border border-slate-400 px-1 py-0.5 font-medium">{row.label}</td>
              <td className="border border-slate-400 px-1 py-0.5 text-center text-[7px] text-gray-500">{row.sym}</td>
              {densidades.map((d, di) => (
                <td key={di} className={`border border-slate-400 px-1 py-0.5 text-center ${row.calc ? 'text-blue-800' : ''}`}>
                  {getCilVal(d, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Humidity table */}
      <table className="w-full border-collapse border border-slate-400 text-[8px]" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '10%' }} />
          {umidades.map((_, i) => (
            <col key={i} style={{ width: `${60 / umidades.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-slate-200">
            <th className="border border-slate-400 px-1 py-0.5 text-left">Campo</th>
            <th className="border border-slate-400 px-1 py-0.5 text-center">Fórmula</th>
            {umidades.map((_, i) => (
              <th key={i} className="border border-slate-400 px-1 py-0.5 text-center">Ponto {i+1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {umidRows.map((row, ri) => (
            <tr key={ri} className={row.calc ? 'bg-slate-100 font-semibold' : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="border border-slate-400 px-1 py-0.5 font-medium">{row.label}</td>
              <td className="border border-slate-400 px-1 py-0.5 text-center text-[7px] text-gray-500">{row.sym}</td>
              {umidades.map((u, ui) => (
                <td key={ui} className={`border border-slate-400 px-1 py-0.5 text-center ${row.calc ? 'text-blue-800' : ''}`}>
                  {getUmVal(u, densidades[ui], row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ─────────── MAIN REPORT ─────────── */
export default function RelatorioProctor() {
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useReportMode();

  const loadData = useCallback(async () => {
    try {
      const id = new URLSearchParams(window.location.search).get('id');
      if (!id) { setError("ID não fornecido"); return; }
      const data = await base44.entities.EnsaioProctor.get(id);
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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const isHigro = ensaio?.correcao_densidade === 'higroscopica';

  const chartPoints = useMemo(() => {
    if (!ensaio) return [];
    return (ensaio.densidades || []).map((d, i) => ({
      x: isHigro ? d.umidade_calculada : (ensaio.umidades?.[i]?.teor_umidade_media || 0),
      y: d.dens_ap_seca,
    })).filter(p => p.x > 0 && p.y > 0);
  }, [ensaio, isHigro]);

  const parabola = useMemo(() => fitParabola(chartPoints), [chartPoints]);

  const iscPoints = useMemo(() => {
    if (!ensaio) return [];
    const umidPorCil = isHigro
      ? (ensaio.densidades || []).map(d => d.umidade_calculada)
      : (ensaio.umidades || []).map(u => u.teor_umidade_media);
    return (ensaio.cbr_cilindros || []).map((c, i) => {
      const { isc } = calcISC(c, ensaio.cbr_fator_anel);
      const x = umidPorCil[i];
      return (x > 0 && isc != null) ? { x, y: isc } : null;
    }).filter(Boolean);
  }, [ensaio, isHigro]);

  const expPoints = useMemo(() => {
    if (!ensaio) return [];
    const umidPorCil = isHigro
      ? (ensaio.densidades || []).map(d => d.umidade_calculada)
      : (ensaio.umidades || []).map(u => u.teor_umidade_media);
    return (ensaio.expansao_cilindros || []).map((e, i) => {
      const { expansao_pct } = calcExpansao(e);
      const x = umidPorCil[i];
      return (x > 0 && expansao_pct != null) ? { x, y: expansao_pct } : null;
    }).filter(p => p !== null);
  }, [ensaio, isHigro]);

  const iscParabola = useMemo(() => fitParabola(iscPoints), [iscPoints]);
  const expParabola = useMemo(() => fitParabola(expPoints), [expPoints]);

  // ISC e Expansão no ponto da umidade ótima do Proctor
  const wOtima = parabola?.w_otima;
  const iscAtWotima = useMemo(() => {
    if (!iscParabola || wOtima == null) return null;
    return parseFloat((iscParabola.a * wOtima ** 2 + iscParabola.b * wOtima + iscParabola.c).toFixed(2));
  }, [iscParabola, wOtima]);
  const expAtWotima = useMemo(() => {
    if (!expParabola || wOtima == null) return null;
    return parseFloat((expParabola.a * wOtima ** 2 + expParabola.b * wOtima + expParabola.c).toFixed(2));
  }, [expParabola, wOtima]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  if (error || !ensaio) return <div className="flex justify-center items-center h-screen text-red-600">{error || "Erro"}</div>;

  const title = 'CARACTERIZAÇÃO MECÂNICA';
  const docNum = isHigro ? 'FORM 101 E' : 'FORM 101 B';

  const infoFields = [
    ["OBRA", obra?.name || '-'],
    ["LOCAL", ensaio.local_coleta || '-'],
    ["MATERIAL", ensaio.material || '-'],
    ["RODOVIA", ensaio.rodovia || '-'],
    ["ENERGIA", ensaio.energia_compactacao || '-'],
    ["LABORATORISTA", ensaio.laboratorista_name || '-'],
    ["TRECHO", ensaio.trecho || '-'],
    ["CAMADA", ensaio.camada || '-'],
    ["DATA", fmtDate(ensaio.data_ensaio)],
  ];

  return (
    <div className="relatorio-page bg-white min-h-screen">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-3 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-800">Relatório Proctor — {isHigro ? 'Higroscópica' : 'Ponto a Ponto'}</h2>
          <div className="flex items-center gap-2">
            {ensaio && <AprovacaoBar entityName="EnsaioProctor" recordId={ensaio.id} />}
            <Button onClick={() => window.print()} className="bg-slate-800 text-white hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" /> Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-2 print:p-1 flex flex-col">
        {/* Header */}
        <header className="grid items-center py-1" style={{ gridTemplateColumns: '60px 1fr 60px' }}>
          <div>
            <img
              src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"}
              alt="Logo" className="h-8 object-contain"
              width="auto" height="32"
            />
          </div>
          <h1 className="text-xs font-bold text-gray-800 text-center">{title}</h1>
        </header>

        <main className="text-xs space-y-2">
          {/* INFO */}
          <section>
            <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[9px] border border-slate-300 p-1 rounded">
              {infoFields.map(([label, val]) => (
                <div key={label}>
                  <span className="font-bold text-gray-700">{label}: </span>
                  <span className="text-gray-900">{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* RESULTADOS FINAIS */}
          <section>
            <div className="bg-slate-200 px-2 py-0.5 font-bold text-[9px] mb-0.5 text-center">RESULTADOS FINAIS</div>
            <div className="border border-slate-300 flex gap-2 text-[8px] px-2 py-1">
              {[
                ["Dens. Máx. (g/cm³)", fmtN(ensaio.densidade_maxima_seca || parabola?.gamma_max, 3)],
                ["Umid. Ótima (%)", fmtN(ensaio.umidade_otima || parabola?.w_otima, 2)],
                ["ISC/CBR (%)", fmtN(iscAtWotima ?? ensaio.isc_cbr, 2)],
                ["Exp. (%)", fmtN(expAtWotima ?? ensaio.expansao, 2)],
              ].map(([label, val]) => (
                <div key={label} className="flex-1">
                  <div style={{fontSize: '7px'}} className="text-gray-600">{label}</div>
                  <div className="font-bold text-blue-800">{val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* COMPACTAÇÃO (conditional) */}
          {isHigro
            ? <CompactacaoHigroscopica ensaio={ensaio} />
            : <CompactacaoPontoAPonto ensaio={ensaio} />
          }

          {/* ISC */}
          {ensaio.realizar_cbr_expansao && <ISCSection ensaio={ensaio} />}

          {/* EXPANSÃO */}
          {ensaio.realizar_cbr_expansao && <ExpansaoSection ensaio={ensaio} />}

          {/* GRÁFICOS */}
          <GraficosSection ensaio={ensaio} isHigro={isHigro} chartPoints={chartPoints} parabola={parabola} iscPoints={iscPoints} expPoints={expPoints} iscParabola={iscParabola} expParabola={expParabola} iscAtWotima={iscAtWotima} expAtWotima={expAtWotima} />

          {/* OBSERVAÇÕES */}
          {ensaio.observacoes && (
            <section>
              <div className="bg-slate-200 px-2 py-0.5 font-bold" style={{fontSize: '10px'}}>OBSERVAÇÕES</div>
              <div className="border border-slate-300 p-1 whitespace-pre-wrap" style={{fontSize: '9px'}}>{ensaio.observacoes}</div>
            </section>
          )}
        </main>

        {/* Footer — página 1 */}
        <footer className="mt-4 pt-2">
          <SignatureFooter
            labName={ensaio.laboratorista_name}
            labEmail={ensaio.created_by}
            labCreatedDate={ensaio.created_date}
            labPosition="Laboratorista"
            approverName={ensaio.approver_details?.name}
            approverEmail={ensaio.approved_by}
            approverPosition={ensaio.approver_details?.position}
            approverCREA={ensaio.approver_details?.crea_number}
            approverDate={ensaio.approved_date}
            clientName={ensaio.client_signature?.engineer_name}
            clientEmail={ensaio.client_signature?.signed_by}
            clientPosition={ensaio.client_signature?.position}
            clientCREA={ensaio.client_signature?.crea_number}
            clientDate={ensaio.client_signature?.signed_date}
          />
        </footer>
      </div>

      {/* ENSAIOS FÍSICOS DE CARACTERIZAÇÃO — página 2 */}
      {ensaio.realizar_limites && ensaio.limites && (
        <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-2 print:p-1">
          <RelatorioLimites limites={ensaio.limites} ensaio={ensaio} obra={obra} regional={regional} />
        </div>
      )}

      <style jsx>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 10mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .relatorio-page > div:first-child { display: none !important; }
        }
        table tr { line-height: 1.078; }
        table td, table th { padding-top: 0.176rem; padding-bottom: 0.176rem; }
      `}</style>
    </div>
  );
}