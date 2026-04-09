import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Standard penetration values (mm) per ABNT 9895 / DNIT 172
const PENETRACOES = [0.64, 1.27, 1.91, 2.54, 3.81, 5.08, 6.35, 7.62, 8.89];
const TEMPOS = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0];
// Standard pressure (kgf/cm²) at 2.54mm and 5.08mm
const PRESSAO_PADRAO = { 3: 70.31, 5: 105.46 }; // index in PENETRACOES array

function calcCBR(cilindro, fatorAnel) {
  const fator = parseFloat(fatorAnel);
  const leituras = cilindro.leituras || Array(9).fill('');
  const pressoes = leituras.map(l => {
    const v = parseFloat(l);
    return (!isNaN(v) && !isNaN(fator) && fator > 0) ? v * fator : null;
  });
  const p254 = pressoes[3];
  const p508 = pressoes[5];
  const isc254 = (p254 != null && PRESSAO_PADRAO[3] > 0) ? (p254 / PRESSAO_PADRAO[3]) * 100 : null;
  const isc508 = (p508 != null && PRESSAO_PADRAO[5] > 0) ? (p508 / PRESSAO_PADRAO[5]) * 100 : null;
  const isc = (isc254 != null && isc508 != null) ? Math.max(isc254, isc508) : (isc254 ?? isc508);
  return { pressoes, isc254, isc508, isc };
}

function calcExpansao(exp) {
  const altInicial = parseFloat(exp.altura_inicial);
  // Use last filled leitura
  const leituras = [exp.leitura_1dia, exp.leitura_2dia, exp.leitura_3dia, exp.leitura_4dia];
  const leituraFinal = [...leituras].reverse().find(l => l !== '' && !isNaN(parseFloat(l)));
  const leituraInicial = parseFloat(exp.leitura_1dia);
  const leituraFinalVal = parseFloat(leituraFinal);
  const diferenca = (!isNaN(leituraFinalVal) && !isNaN(leituraInicial)) ? leituraFinalVal - leituraInicial : null;
  const expansao_pct = (diferenca != null && !isNaN(altInicial) && altInicial > 0) ? (diferenca / altInicial) * 100 : null;
  return { diferenca, expansao_pct };
}

export default function ProctorCBRExpansao({ form, setForm }) {
  // Cylinder numbers auto-filled from compaction data
  const cilindroNomes = (form.densidades || []).map(d => d.cilindro_numero || '');

  const updateCBR = (idx, field, value) => {
    setForm(prev => {
      const updated = prev.cbr_cilindros.map((c, i) => i === idx ? { ...c, [field]: value } : c);
      return { ...prev, cbr_cilindros: updated };
    });
  };

  const updateCBRLeitura = (cilIdx, penIdx, value) => {
    setForm(prev => {
      const updated = prev.cbr_cilindros.map((c, i) => {
        if (i !== cilIdx) return c;
        const leituras = [...(c.leituras || Array(9).fill(''))];
        leituras[penIdx] = value;
        return { ...c, leituras };
      });
      return { ...prev, cbr_cilindros: updated };
    });
  };

  const updateFatorAnel = (value) => setForm(prev => ({ ...prev, cbr_fator_anel: value }));

  const updateExpansao = (idx, field, value) => {
    setForm(prev => {
      const updated = prev.expansao_cilindros.map((e, i) => i === idx ? { ...e, [field]: value } : e);
      return { ...prev, expansao_cilindros: updated };
    });
  };

  return (
    <div className="space-y-6">
      {/* CÁLCULO DO ISC/CBR */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Cálculo do ISC/CBR</CardTitle>
          <p className="text-xs text-[#00233B]/60">ABNT NBR 9895 / DNIT 172 — Penetrações em mm</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(form.cbr_cilindros || []).map((cil, cidx) => {
            const { pressoes, isc254, isc508, isc } = calcCBR(cil);
            return (
              <div key={cidx} className="border border-[#00233B]/20 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-[#00233B]/10 px-3 py-2 flex items-center gap-4">
                  <span className="font-semibold text-[#00233B] text-sm">
                    Cilindro {cilindroNomes[cidx] || cidx + 1}
                  </span>
                  {isc != null && (
                    <span className="ml-auto text-sm font-bold text-[#00233B]">ISC = {isc.toFixed(1)}%</span>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#00233B]/5">
                        <th className="border border-[#00233B]/20 px-2 py-1 text-left text-[#00233B] w-32">Penetração (mm)</th>
                        {PENETRACOES.map(p => (
                          <th key={p} className={`border border-[#00233B]/20 px-2 py-1 text-center text-[#00233B] ${p === 2.54 || p === 5.08 ? 'bg-[#BFCF99]/20 font-bold' : ''}`}>{p}</th>
                        ))}
                      </tr>
                      <tr className="bg-[#00233B]/5">
                        <th className="border border-[#00233B]/20 px-2 py-1 text-left text-[#00233B]">Tempo (min)</th>
                        {TEMPOS.map(t => (
                          <th key={t} className="border border-[#00233B]/20 px-2 py-1 text-center text-[#00233B]/70 font-normal">{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Leitura do anel */}
                      <tr className="bg-white/20">
                        <td className="border border-[#00233B]/20 px-2 py-1 font-medium text-[#00233B]">Leitura do anel</td>
                        {Array(9).fill(null).map((_, pidx) => (
                          <td key={pidx} className={`border border-[#00233B]/20 px-1 py-1 ${pidx === 3 || pidx === 5 ? 'bg-[#BFCF99]/10' : ''}`}>
                            <Input
                              type="number" step="0.01"
                              value={(cil.leituras || [])[pidx] || ''}
                              onChange={e => updateCBRLeitura(cidx, pidx, e.target.value)}
                              className="h-7 text-xs p-1"
                            />
                          </td>
                        ))}
                      </tr>
                      {/* Pressão Padrão */}
                      <tr className="bg-gray-100/30">
                        <td className="border border-[#00233B]/20 px-2 py-1 text-[#00233B]">
                          <div className="text-xs">Pressão</div>
                          <div className="text-[10px] text-[#00233B]/60">Padrão (kgf/cm²)</div>
                        </td>
                        {PENETRACOES.map((_, pidx) => (
                          <td key={pidx} className={`border border-[#00233B]/20 px-2 py-1 text-center text-xs font-semibold text-[#00233B] ${pidx === 3 || pidx === 5 ? 'bg-[#BFCF99]/20' : ''}`}>
                            {PRESSAO_PADRAO[pidx] ?? ''}
                          </td>
                        ))}
                      </tr>
                      {/* Pressão Corrigida */}
                      <tr className="bg-gray-100/30">
                        <td className="border border-[#00233B]/20 px-2 py-1 text-[#00233B]">
                          <div className="text-xs">Pressão</div>
                          <div className="text-[10px] text-[#00233B]/60">Corrigida (kgf/cm²)</div>
                        </td>
                        {pressoes.map((p, pidx) => (
                          <td key={pidx} className={`border border-[#00233B]/20 px-2 py-1 text-center text-xs font-semibold text-gray-600 ${pidx === 3 || pidx === 5 ? 'bg-[#BFCF99]/20' : ''}`}>
                            {p != null ? p.toFixed(2) : '—'}
                          </td>
                        ))}
                      </tr>
                      {/* ISC */}
                      <tr className="bg-[#BFCF99]/10">
                        <td className="border border-[#00233B]/20 px-2 py-1 font-bold text-[#00233B]">ISC (%)</td>
                        {PENETRACOES.map((_, pidx) => (
                          <td key={pidx} className={`border border-[#00233B]/20 px-2 py-1 text-center font-bold text-[#00233B] ${pidx === 3 || pidx === 5 ? 'bg-[#BFCF99]/30' : ''}`}>
                            {pidx === 3 && isc254 != null ? isc254.toFixed(1) : ''}
                            {pidx === 5 && isc508 != null ? isc508.toFixed(1) : ''}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* EXPANSÃO */}
      <Card className="bg-white/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#00233B]">Expansão</CardTitle>
          <p className="text-xs text-[#00233B]/60">ABNT NBR 9895 / DNIT 172</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#00233B]/10">
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B]">Data</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B]">Hora</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B]">Cilindro</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B]">Alt. Inicial (mm)</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B] bg-[#BFCF99]/10">1° dia</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B] bg-[#BFCF99]/10">2° dia</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B] bg-[#BFCF99]/10">3° dia</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B] bg-[#BFCF99]/10">4° dia</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B]">Diferença (mm)</th>
                  <th className="border border-[#00233B]/20 px-2 py-2 text-[#00233B] font-bold">Expansão (%)</th>
                </tr>
              </thead>
              <tbody>
                {(form.expansao_cilindros || []).map((exp, idx) => {
                  const { diferenca, expansao_pct } = calcExpansao(exp);
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white/20' : 'bg-white/10'}>
                      <td className="border border-[#00233B]/20 px-1 py-1">
                        <Input type="date" value={exp.data || ''} onChange={e => updateExpansao(idx, 'data', e.target.value)} className="h-7 text-xs p-1 w-32" />
                      </td>
                      <td className="border border-[#00233B]/20 px-1 py-1">
                        <Input type="time" value={exp.hora || ''} onChange={e => updateExpansao(idx, 'hora', e.target.value)} className="h-7 text-xs p-1 w-24" />
                      </td>
                      <td className="border border-[#00233B]/20 px-2 py-1 text-center font-semibold text-[#00233B]">
                        {cilindroNomes[idx] || idx + 1}
                      </td>
                      <td className="border border-[#00233B]/20 px-1 py-1">
                        <Input type="number" step="0.01" value={exp.altura_inicial || ''} onChange={e => updateExpansao(idx, 'altura_inicial', e.target.value)} className="h-7 text-xs p-1 w-20" />
                      </td>
                      {['leitura_1dia','leitura_2dia','leitura_3dia','leitura_4dia'].map(field => (
                        <td key={field} className="border border-[#00233B]/20 px-1 py-1 bg-[#BFCF99]/5">
                          <Input type="number" step="0.01" value={exp[field] || ''} onChange={e => updateExpansao(idx, field, e.target.value)} className="h-7 text-xs p-1 w-20" />
                        </td>
                      ))}
                      <td className="border border-[#00233B]/20 px-2 py-1 text-center font-semibold text-gray-600">
                        {diferenca != null ? diferenca.toFixed(2) : '—'}
                      </td>
                      <td className="border border-[#00233B]/20 px-2 py-1 text-center font-bold text-[#00233B]">
                        {expansao_pct != null ? expansao_pct.toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}