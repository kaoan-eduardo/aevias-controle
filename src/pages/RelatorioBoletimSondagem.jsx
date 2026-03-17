import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export default function RelatorioBoletimSondagem() {
  const [boletim, setBoletim] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) { setError("ID não fornecido"); return; }

      const data = await base44.entities.BoletimSondagem.get(id);
      setBoletim(data);

      if (data.obra_id) {
        const obraData = await base44.entities.Obra.get(data.obra_id);
        setObra(obraData);
        if (obraData.regional_id) {
          const regionalData = await base44.entities.Regional.get(obraData.regional_id);
          setRegional(regionalData);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-';
  const formatDateTime = (d) => {
    if (!d) return 'N/A';
    const normalized = (!d.endsWith('Z') && !d.includes('+') && !d.includes('-', 10)) ? d + 'Z' : d;
    return new Date(normalized).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };
  const fmtNum = (v, dec = 2) => (v !== null && v !== undefined) ? parseFloat(v).toFixed(dec) : '-';

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  if (error || !boletim) return <div className="flex justify-center items-center h-screen"><p className="text-red-600">{error || "Erro ao carregar"}</p></div>;

  const un = boletim.umidade_natural || {};
  const den = boletim.densidade_in_situ || {};
  const camadas = boletim.camadas || [];
  const temCol2 = camadas.some(c => c.classificacao_2 !== null && c.classificacao_2 !== undefined);

  return (
    <div className="bg-white min-h-screen">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Boletim de Sondagem (PI)</h2>
          <Button onClick={() => window.print()} className="bg-slate-800 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </div>

      <div className="w-full max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none pt-2 px-6 pb-4 print:pt-0 print:px-4 print:pb-2">
        {/* Header */}
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-1 mb-2">
          <div>
            <img
              src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"}
              alt="Logo"
              className="h-12 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-sm font-bold text-gray-800 leading-tight">BOLETIM DE SONDAGEM</h1>
            <p className="text-xs text-gray-500">Umidade Natural e Densidade In Situ</p>
            <p className="text-xs text-gray-500">DNER-ME 213/94 | DNER-ME 092/94</p>
          </div>
          <div></div>
        </header>

        <main className="text-xs space-y-3">
          {/* DADOS DA OBRA */}
          <section>
            <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">DADOS DA OBRA</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px]">
              {[
                ["OBRA", obra?.name || '-'],
                ["CLIENTE", boletim.cliente || regional?.cliente || '-'],
                ["DATA", formatDate(boletim.data)],
                ["RODOVIA", boletim.rodovia || '-'],
                ["KM", boletim.km || '-'],
                ["PISTA", boletim.pista || '-'],
                ["BORDO", boletim.bordo || '-'],
                ["FURO", boletim.furo || '-'],
                ["OPERADOR", boletim.operador || boletim.laboratorista_name || '-'],
              ].map(([label, val]) => (
                <div key={label}>
                  <span className="font-bold text-gray-700">{label}: </span>
                  <span className="text-gray-900">{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SONDAGEM — CAMADAS */}
          <section>
            {!temCol2 ? (
              /* Apenas 1 classificação — tabela simples */
              <div>
                <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">
                  SONDAGEM — CAMADAS{boletim.face_classificacao_1 ? ` — ${boletim.face_classificacao_1}` : ''}
                </div>
                <table className="w-full border-collapse border border-slate-400 text-[9px]">
                  <thead>
                    <tr className="bg-slate-200">
                      <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">Nº</th>
                      <th colSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">PROF. (m)</th>
                      <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">ESP.</th>
                      <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">N.A</th>
                      <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">CLASSIFICAÇÃO</th>
                    </tr>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 px-1 py-0.5 text-center text-[8px]">DE</th>
                      <th className="border border-slate-400 px-1 py-0.5 text-center text-[8px]">ATÉ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {camadas.map((c, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-400 px-1 py-0.5 text-center font-semibold">{c.numero}</td>
                        <td className="border border-slate-400 px-1 py-0.5 text-center">{c.prof_de !== null && c.prof_de !== undefined ? fmtNum(c.prof_de) : '-'}</td>
                        <td className="border border-slate-400 px-1 py-0.5 text-center">{c.prof_ate !== null && c.prof_ate !== undefined ? fmtNum(c.prof_ate) : '-'}</td>
                        <td className="border border-slate-400 px-1 py-0.5 text-center">{c.espessura !== null && c.espessura !== undefined ? fmtNum(c.espessura) : '-'}</td>
                        <td className="border border-slate-400 px-1 py-0.5 text-center">{c.na !== null && c.na !== undefined ? fmtNum(c.na) : '-'}</td>
                        <td className="border border-slate-400 px-1 py-0.5">{c.classificacao_1 || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* 2 classificações — tabelas lado a lado */
              <div>
                <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">SONDAGEM — CAMADAS</div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Classificação 1 */}
                  <div>
                    <div className="bg-slate-500 text-white px-1 py-0.5 font-bold text-center text-[9px] mb-0.5">
                      {boletim.face_classificacao_1 || 'Classificação 1'}
                    </div>
                    <table className="w-full border-collapse border border-slate-400 text-[9px]">
                      <thead>
                        <tr className="bg-slate-200">
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">Nº</th>
                          <th colSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">PROF. (m)</th>
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">ESP.</th>
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">N.A</th>
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">CLASSIFICAÇÃO</th>
                        </tr>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-400 px-1 py-0.5 text-center text-[8px]">DE</th>
                          <th className="border border-slate-400 px-1 py-0.5 text-center text-[8px]">ATÉ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {camadas.map((c, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-400 px-1 py-0.5 text-center font-semibold">{c.numero}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.prof_de != null ? fmtNum(c.prof_de) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.prof_ate != null ? fmtNum(c.prof_ate) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.espessura != null ? fmtNum(c.espessura) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.na != null ? fmtNum(c.na) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5">{c.classificacao_1 || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Classificação 2 */}
                  <div>
                    <div className="bg-slate-500 text-white px-1 py-0.5 font-bold text-center text-[9px] mb-0.5">
                      {boletim.face_classificacao_2 || 'Classificação 2'}
                    </div>
                    <table className="w-full border-collapse border border-slate-400 text-[9px]">
                      <thead>
                        <tr className="bg-slate-200">
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">Nº</th>
                          <th colSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">PROF. (m)</th>
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">ESP.</th>
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">N.A</th>
                          <th rowSpan={2} className="border border-slate-400 px-1 py-0.5 text-center font-bold">CLASSIFICAÇÃO</th>
                        </tr>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-400 px-1 py-0.5 text-center text-[8px]">DE</th>
                          <th className="border border-slate-400 px-1 py-0.5 text-center text-[8px]">ATÉ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(boletim.camadas_2?.length ? boletim.camadas_2 : camadas).map((c, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-400 px-1 py-0.5 text-center font-semibold">{c.numero}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.prof_de != null ? fmtNum(c.prof_de) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.prof_ate != null ? fmtNum(c.prof_ate) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.espessura != null ? fmtNum(c.espessura) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{c.na != null ? fmtNum(c.na) : '-'}</td>
                            <td className="border border-slate-400 px-1 py-0.5">{c.classificacao_2 || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* UMIDADE NATURAL — lado a lado se houver 2, senão tabela simples */}
          <section>
            <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">UMIDADE NATURAL — DNER-ME 213/94</div>
            {!boletim.umidade_natural_2 ? (
              /* Apenas 1 umidade */
              <table className="w-full border-collapse border border-slate-400 text-[9px]">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="border border-slate-400 px-1 py-0.5 text-left font-bold w-1/2">Campo</th>
                    <th className="border border-slate-400 px-1 py-0.5 text-center font-bold">Am. 1</th>
                    <th className="border border-slate-400 px-1 py-0.5 text-center font-bold">Am. 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white font-bold">
                    <td className="border border-slate-400 px-1 py-0.5 font-bold text-gray-800">Camada ensaiada</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-gray-900" colSpan={2}>{un.camada_ensaiada_1 || '-'}</td>
                  </tr>
                  {[
                    ["Nº cápsula", un.no_capsula_1, un.no_capsula_2, false],
                    ["Massa cápsula (g)", un.massa_capsula_1, un.massa_capsula_2, true],
                    ["Massa cap + solo úmido (g)", un.massa_cap_solo_umido_1, un.massa_cap_solo_umido_2, true],
                    ["Massa cap + solo seco (g)", un.massa_cap_solo_seco_1, un.massa_cap_solo_seco_2, true],

                  ].map(([label, v1, v2, isNum], ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border border-slate-400 px-1 py-0.5 text-gray-700">{label}</td>
                      <td className="border border-slate-400 px-1 py-0.5 text-center">{isNum ? fmtNum(v1) : (v1 || '-')}</td>
                      <td className="border border-slate-400 px-1 py-0.5 text-center">{isNum ? fmtNum(v2) : (v2 || '-')}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-200 font-bold">
                    <td className="border border-slate-400 px-1 py-0.5 font-bold">Umidade (%)</td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-blue-700" colSpan={2}>
                      {(() => { const u1 = un.umidade_1, u2 = un.umidade_2; if (u1 != null && u2 != null) return `${((u1+u2)/2).toFixed(2)}%`; if (u1 != null) return `${fmtNum(u1)}%`; return '-'; })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              /* 2 umidades lado a lado */
              (() => {
                const un2 = boletim.umidade_natural_2 || {};
                const calcU2 = (idx) => {
                  const csu = un2[`massa_cap_solo_umido_${idx}`], css = un2[`massa_cap_solo_seco_${idx}`], cap = un2[`massa_capsula_${idx}`];
                  if (csu && css && cap != null) { const ss = css - cap; return ss > 0 ? parseFloat((((csu-css)/ss)*100).toFixed(2)) : null; }
                  return null;
                };
                const agua1u2 = un2.massa_cap_solo_umido_1 && un2.massa_cap_solo_seco_1 ? parseFloat((un2.massa_cap_solo_umido_1 - un2.massa_cap_solo_seco_1).toFixed(2)) : null;
                const agua2u2 = un2.massa_cap_solo_umido_2 && un2.massa_cap_solo_seco_2 ? parseFloat((un2.massa_cap_solo_umido_2 - un2.massa_cap_solo_seco_2).toFixed(2)) : null;
                const ss1u2 = un2.massa_cap_solo_seco_1 && un2.massa_capsula_1 != null ? parseFloat((un2.massa_cap_solo_seco_1 - un2.massa_capsula_1).toFixed(2)) : null;
                const ss2u2 = un2.massa_cap_solo_seco_2 && un2.massa_capsula_2 != null ? parseFloat((un2.massa_cap_solo_seco_2 - un2.massa_capsula_2).toFixed(2)) : null;
                const u2_1 = calcU2(1), u2_2 = calcU2(2);
                const renderUmidadeTable = (title, uData, rows, umidMedia) => (
                  <div>
                    <div className="bg-slate-500 text-white px-1 py-0.5 font-bold text-center text-[9px] mb-0.5">{title}</div>
                    <table className="w-full border-collapse border border-slate-400 text-[9px]">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border border-slate-400 px-1 py-0.5 text-left font-bold">Campo</th>
                          <th className="border border-slate-400 px-1 py-0.5 text-center font-bold">Am. 1</th>
                          <th className="border border-slate-400 px-1 py-0.5 text-center font-bold">Am. 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white font-bold">
                          <td className="border border-slate-400 px-1 py-0.5 font-bold text-gray-800">Camada ensaiada</td>
                          <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-gray-900" colSpan={2}>{uData.camada_ensaiada_1 || '-'}</td>
                        </tr>
                        {rows.map(([label, v1, v2, isNum], ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="border border-slate-400 px-1 py-0.5 text-gray-700">{label}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{isNum ? fmtNum(v1) : (v1 || '-')}</td>
                            <td className="border border-slate-400 px-1 py-0.5 text-center">{isNum ? fmtNum(v2) : (v2 || '-')}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-200 font-bold">
                          <td className="border border-slate-400 px-1 py-0.5 font-bold">Umidade (%)</td>
                          <td className="border border-slate-400 px-1 py-0.5 text-center font-bold text-blue-700" colSpan={2}>{umidMedia}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
                const umid1Media = (() => { const u1 = un.umidade_1, u2 = un.umidade_2; if (u1 != null && u2 != null) return `${((u1+u2)/2).toFixed(2)}%`; if (u1 != null) return `${fmtNum(u1)}%`; return '-'; })();
                const umid2Media = u2_1 != null && u2_2 != null ? `${((u2_1+u2_2)/2).toFixed(2)}%` : u2_1 != null ? `${fmtNum(u2_1)}%` : '-';
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {renderUmidadeTable(
                      un.camada_ensaiada_1 || 'Umidade Natural 1',
                      un,
                      [
                        ["Nº cápsula", un.no_capsula_1, un.no_capsula_2, false],
                        ["Massa cápsula (g)", un.massa_capsula_1, un.massa_capsula_2, true],
                        ["Massa cap + solo úmido (g)", un.massa_cap_solo_umido_1, un.massa_cap_solo_umido_2, true],
                        ["Massa cap + solo seco (g)", un.massa_cap_solo_seco_1, un.massa_cap_solo_seco_2, true],
                        ["Massa da água (g)", un.massa_agua_1, un.massa_agua_2, true],
                        ["Massa do solo seco (g)", un.massa_solo_seco_1, un.massa_solo_seco_2, true],
                      ],
                      umid1Media
                    )}
                    {renderUmidadeTable(
                      un2.camada_ensaiada_1 || 'Umidade Natural 2',
                      un2,
                      [
                        ["Nº cápsula", un2.no_capsula_1, un2.no_capsula_2, false],
                        ["Massa cápsula (g)", un2.massa_capsula_1, un2.massa_capsula_2, true],
                        ["Massa cap + solo úmido (g)", un2.massa_cap_solo_umido_1, un2.massa_cap_solo_umido_2, true],
                        ["Massa cap + solo seco (g)", un2.massa_cap_solo_seco_1, un2.massa_cap_solo_seco_2, true],
                        ["Massa da água (g)", agua1u2, agua2u2, true],
                        ["Massa do solo seco (g)", ss1u2, ss2u2, true],
                      ],
                      umid2Media
                    )}
                  </div>
                );
              })()
            )}
          </section>

          {/* DENSIDADE IN SITU — em tabela */}
          <section>
            <div className="bg-slate-700 text-white px-2 py-0.5 font-bold text-center text-[10px] mb-1">MASSA ESPECÍFICA APARENTE IN SITU — DNER-ME 092/94</div>
            <table className="w-full border-collapse border border-slate-400 text-[9px]">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 px-2 py-0.5 text-left font-bold w-1/2">Campo</th>
                  <th className="border border-slate-400 px-2 py-0.5 text-center font-bold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Camada ensaiada", den.camada_ensaiada, false],
                  ["Peso do frasco antes (gf)", den.peso_frasco_antes, true],
                  ["Peso do frasco depois (gf)", den.peso_frasco_depois, true],
                  ["Peso areia deslocada (gf)", den.peso_areia_deslocada, true],
                  ["Peso areia funil e placa (gf)", den.peso_areia_funil_placa, true],
                  ["Peso areia na cavidade (gf)", den.peso_areia_cavidade, true],
                  ["Massa esp. aparente areia (g/dm³)", den.massa_esp_aparente_areia, true],
                  ["Volume do buraco (dm³)", den.volume_buraco, true, 3],
                  ["Peso solo + recipiente (gf)", den.peso_solo_recipiente, true],
                  ["Peso do recipiente (gf)", den.peso_recipiente, true],
                  ["Peso do solo (gf)", den.peso_solo, true],
                  ["Peso do solo úmido (gf)", den.peso_solo_umido, true],
                  ["Peso do solo seco (gf)", den.peso_solo_seco, true],
                  ["Peso da água (gf)", den.peso_agua, true],
                  ["Teor de umidade (%)", den.teor_umidade, true],
                ].map(([label, val, isNum, dec], ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-400 px-2 py-0.5 text-gray-700">{label}</td>
                    <td className="border border-slate-400 px-2 py-0.5 text-center font-semibold">
                      {isNum ? fmtNum(val, dec ?? 2) : (val || '-')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-400 px-2 py-0.5">Dens. Aparente Solo Úmido (g/dm³)</td>
                  <td className="border border-slate-400 px-2 py-0.5 text-center text-blue-700">{fmtNum(den.densidade_aparente_solo_umido, 3)}</td>
                </tr>
                <tr className="bg-slate-200 font-bold">
                  <td className="border border-slate-400 px-2 py-0.5">Dens. Aparente Solo Seco (g/dm³)</td>
                  <td className="border border-slate-400 px-2 py-0.5 text-center text-blue-700 text-sm">{fmtNum(den.densidade_aparente_solo_seco, 3)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Observações */}
          {boletim.observacoes && (
            <section>
              <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px]">OBSERVAÇÕES</div>
              <div className="border border-slate-300 p-1 text-[10px] min-h-[20px]">{boletim.observacoes}</div>
            </section>
          )}

          {/* Fotos */}
          {boletim.fotos?.length > 0 && (
            <section>
              <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px] mb-1">REGISTRO FOTOGRÁFICO</div>
              <div className="grid grid-cols-3 gap-2">
                {boletim.fotos.map((url, i) => (
                  <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover rounded border border-slate-300" />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-4 pt-2 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4 items-end text-center">
            <div>
              <div className="min-h-[40px] flex flex-col justify-end items-center text-[9px] text-slate-500 mb-1">
                {boletim.laboratorista_name && (
                  <>
                    <p className="font-bold text-slate-600">{boletim.laboratorista_name}</p>
                    <p>{boletim.created_by}</p>
                    <p>em {formatDateTime(boletim.created_date)}</p>
                  </>
                )}
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-[9px] font-semibold">LABORATORISTA RESPONSÁVEL</p>
              </div>
            </div>

            <div>
              <div className="min-h-[40px] flex flex-col justify-end items-center text-[9px] text-slate-500 mb-1">
                {boletim.approver_details ? (
                  <>
                    <p className="font-bold text-slate-600">{boletim.approver_details.name}</p>
                    {boletim.approver_details.crea_number && <p>CREA: {boletim.approver_details.crea_number}</p>}
                    <p>em {formatDateTime(boletim.approved_date)}</p>
                  </>
                ) : null}
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-[9px] font-semibold">ENGENHEIRO RESPONSÁVEL</p>
              </div>
            </div>

            <div>
              <div className="min-h-[40px] flex flex-col justify-end items-center text-[9px] text-slate-500 mb-1">
                {boletim.client_signature?.signed_by ? (
                  <>
                    <p className="font-bold text-slate-600">{boletim.client_signature.engineer_name}</p>
                    {boletim.client_signature.crea_number && <p>CREA: {boletim.client_signature.crea_number}</p>}
                    <p>em {formatDateTime(boletim.client_signature.signed_date)}</p>
                  </>
                ) : null}
              </div>
              <div className="border-t-2 border-gray-500 pt-1 w-3/4 mx-auto">
                <p className="text-[9px] font-semibold">ENGENHEIRO CLIENTE</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 10mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}