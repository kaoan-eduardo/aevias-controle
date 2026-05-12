import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SignatureFooter from './SignatureFooter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function RelatorioGranuMistura({ recordId }) {
  const [record, setRecord] = useState(null);
  const [faixa, setFaixa] = useState(null);
  const [project, setProject] = useState(null);
  const [obra, setObra] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, [recordId, loadData]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const rec = await base44.entities.GranuMistura.get(recordId);
      setRecord(rec);

      if (rec.numero_projeto) {
        const proj = await base44.entities.Project.get(rec.numero_projeto);
        setProject(proj);
        if (proj.faixa_granulometrica_id) {
          const fxGran = await base44.entities.FaixaGranulometrica.get(proj.faixa_granulometrica_id);
          setFaixa(fxGran);
        }
      } else if (rec.faixa) {
        const fxGran = await base44.entities.FaixaGranulometrica.get(rec.faixa);
        setFaixa(fxGran);
      }

      if (rec.obra_id) {
        const obraData = await base44.entities.Obra.get(rec.obra_id);
        setObra(obraData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !record) return <div className="p-6">Carregando...</div>;

  // Obtém peneiras da faixa
  const peneirasExibir = faixa?.peneiras || [];
  const peneirasDoRegistro = record.peneiras || [];

  // Filtra peneiras do registro que pertencem à faixa
  const peneirasParaMostrar = peneirasExibir
    .map(fp => {
      const ab = parseFloat(fp.abertura);
      const peneiraDados = peneirasDoRegistro.find(
        p => Math.abs(p.abertura_mm - ab) < 0.01
      );
      return peneiraDados ? { ...peneiraDados, especMin: fp.min, especMax: fp.max } : null;
    })
    .filter(p => p !== null);

  // Dados para o gráfico
  const chartData = peneirasParaMostrar.map(p => ({
    abertura: p.abertura_mm,
    passante: parseFloat(p.passante_pct) || 0,
    min: p.especMin || 0,
    max: p.especMax || 0
  }));

  return (
    <div className="p-8 bg-white min-h-screen font-sans !light" style={{ colorScheme: 'light', fontSize: '12px' }}>
      <style>{`
        * { font-size: 12px !important; zoom: 100% !important; }
        html, body { zoom: 100% !important; font-size: 16px !important; }
        .dark { display: none !important; }
      `}</style>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-3">
        <div>
          <p className="font-bold text-sm">AFIRMAEVIAS</p>
          <p className="text-[10px]">CONSULTORIA E SERVIÇOS</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm">ANÁLISE GRANULOMÉTRICA</p>
          <p className="text-[10px]">{new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      {/* DADOS DA OBRA */}
      <div className="mb-6 bg-green-50 border border-green-200 p-3">
        <p className="font-bold text-xs mb-2">DADOS DA OBRA</p>
        <div className="grid grid-cols-4 gap-3 text-[10px]">
          <div>
            <p className="font-bold">CLIENTE</p>
            <p>{record.cliente || "—"}</p>
          </div>
          <div>
            <p className="font-bold">CAMADA</p>
            <p>{record.camada || "—"}</p>
          </div>
          <div>
            <p className="font-bold">Nº PROJETO</p>
            <p>{project?.name || record.numero_projeto || "—"}</p>
          </div>
          <div>
            <p className="font-bold">MATERIAL</p>
            <p>{record.material === "OUTRO" ? record.material_outro : record.material}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 text-[10px] mt-2">
          <div>
            <p className="font-bold">OBRA</p>
            <p>{obra?.name || "—"}</p>
          </div>
          <div>
            <p className="font-bold">LOCAL DE COLETA</p>
            <p>{record.local_coleta || "—"}</p>
          </div>
          <div>
            <p className="font-bold">RODOVIA</p>
            <p>{record.rodovia || "—"}</p>
          </div>
          <div>
            <p className="font-bold">PEDREIRA</p>
            <p>{record.pedreira || "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 text-[10px] mt-2">
          <div>
            <p className="font-bold">TRECHO</p>
            <p>{record.trecho || "—"}</p>
          </div>
          <div>
            <p className="font-bold">FAIXA</p>
            <p>{faixa?.nome || record.faixa || "—"}</p>
          </div>
          <div>
            <p className="font-bold">HORÁRIO</p>
            <p>{record.horario || "—"}</p>
          </div>
          <div>
            <p className="font-bold">LABORATORISTA</p>
            <p>{record.laboratorista_name || "—"}</p>
          </div>
        </div>
      </div>

      {/* DADOS DO ENSAIO */}
      <div className="mb-6 bg-green-50 border border-green-200 p-3">
        <p className="font-bold text-xs mb-2">DADOS DO ENSAIO</p>
        <p className="text-[10px] mb-2">ENSAIO DE GRANULOMETRIA - MÉTODO DE ENSAIO DNIT 412/25 - ME</p>

        {/* Tabela Granulometria */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black px-2 py-1" colSpan="2">PENEIRA</th>
                <th className="border border-black px-1 py-1">PESO DA AMOSTRA (g):<br/>{record.peso_amostra || "—"}</th>
                <th className="border border-black px-1 py-1">RETIDO (g)</th>
                <th className="border border-black px-1 py-1">PASS. (g)</th>
                <th className="border border-black px-1 py-1">% PASS.</th>
                <th className="border border-black px-1 py-1" colSpan="2">FAIXA DE TRABALHO</th>
                <th className="border border-black px-1 py-1" colSpan="2">ESPECIFICAÇÃO</th>
                <th className="border border-black px-2 py-1" colSpan="3">DETERMINAÇÃO DE UMIDADE DA MISTURA</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1">ASTM</th>
                <th className="border border-black px-2 py-1">(mm)</th>
                <th colSpan="4" className="border border-black"></th>
                <th className="border border-black px-1 py-1">MÍN. (%)</th>
                <th className="border border-black px-1 py-1">MÁX. (%)</th>
                <th className="border border-black px-1 py-1">MÍN. (%)</th>
                <th className="border border-black px-1 py-1">MÁX. (%)</th>
                <th className="border border-black px-2 py-1">PARÂMETROS</th>
                <th className="border border-black px-2 py-1">CÁLCULOS</th>
                <th className="border border-black px-2 py-1">UN.</th>
                <th className="border border-black px-2 py-1">RESULTADOS</th>
              </tr>
            </thead>
            <tbody>
              {peneirasParaMostrar.map((p, idx) => (
                <tr key={idx}>
                  <td className="border border-black px-2 py-1 font-semibold">{p.astm}</td>
                  <td className="border border-black px-2 py-1">{p.abertura_mm}</td>
                  <td className="border border-black px-1 py-1"></td>
                  <td className="border border-black px-1 py-1 text-center">{p.retido_g || "—"}</td>
                  <td className="border border-black px-1 py-1 text-center bg-gray-50">{p.passante_g || "—"}</td>
                  <td className="border border-black px-1 py-1 text-center bg-gray-50 font-semibold">{p.passante_pct || "—"}</td>
                  <td className="border border-black px-1 py-1 text-center text-blue-700">{p.especMin ?? "—"}</td>
                  <td className="border border-black px-1 py-1 text-center text-blue-700">{p.especMax ?? "—"}</td>
                  <td className="border border-black px-1 py-1 text-center text-green-700">{p.especMin ?? "—"}</td>
                  <td className="border border-black px-1 py-1 text-center text-green-700">{p.especMax ?? "—"}</td>
                  {idx === 0 && (
                    <>
                      <td rowSpan={peneirasParaMostrar.length} className="border border-black px-2 py-1 align-top">
                        <div className="text-[8px] space-y-1">
                          <p>Peso Úmido</p>
                          <p>Peso Seco</p>
                          <p>Peso Água</p>
                          <p>Umidade</p>
                        </div>
                      </td>
                      <td rowSpan={peneirasParaMostrar.length} className="border border-black px-2 py-1 align-top">
                        <div className="text-[8px] space-y-1">
                          <p>P₁</p>
                          <p>P₂</p>
                          <p>Pω = P₁ - P₂</p>
                          <p>U = (Pω/P₂)×100</p>
                        </div>
                      </td>
                      <td rowSpan={peneirasParaMostrar.length} className="border border-black px-2 py-1 align-top text-[8px]">
                        <p>g</p>
                        <p>g</p>
                        <p>g</p>
                        <p>%</p>
                      </td>
                      <td rowSpan={peneirasParaMostrar.length} className="border border-black px-2 py-1 align-top">
                        <div className="text-[8px] space-y-1">
                          <p>{record.umidade?.peso_umido || "—"}</p>
                          <p>{record.umidade?.peso_seco || "—"}</p>
                          <p>{record.umidade?.peso_agua || "—"}</p>
                          <p className="font-semibold">{record.umidade?.umidade_pct || "—"}</p>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Equivalente de Areia */}
        <div className="mb-4 border border-black">
          <p className="font-bold text-[9px] bg-gray-100 px-2 py-1">DETERMINAÇÃO DE EQUIVALENTE DE AREIA</p>
          <div className="grid grid-cols-3 text-[9px]">
            {record.equivalente_areia?.medicoes?.map((m, idx) => (
              <div key={idx} className="border-r border-black p-2">
                <p className="font-bold mb-1">Medição {idx + 1}</p>
                <p>Topo Argila: {m.topo_argila || "—"}</p>
                <p>Topo Areia: {m.topo_areia || "—"}</p>
                <p className="font-semibold">EA: {m.equivalente || "—"}%</p>
              </div>
            ))}
          </div>
          <div className="border-t border-black px-2 py-1 text-[9px] font-semibold">
            Média: {record.equivalente_areia?.media || "—"}%
          </div>
        </div>

        {/* Materiais Pulverulentos */}
        <div className="border border-black">
          <p className="font-bold text-[9px] bg-gray-100 px-2 py-1">DETERMINAÇÃO DE MATERIAIS PULVERULENTOS</p>
          <div className="grid grid-cols-3 text-[9px] p-2">
            <div>
              <p>Peso Inicial (g): {record.materiais_pulverulentos?.peso_inicial || "—"}</p>
              <p>Peso Após Lavagem (g): {record.materiais_pulverulentos?.peso_apos_lavagem || "—"}</p>
              <p className="font-semibold">Teor (%): {record.materiais_pulverulentos?.teor_pct || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className="mb-6 border border-black p-4">
          <p className="font-bold text-xs mb-4">GRANULOMETRIA DA MISTURA</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="abertura" label={{ value: "Abertura (mm)", position: "insideBottomRight", offset: -5 }} />
              <YAxis label={{ value: "% Passando", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="passante" stroke="#000" strokeWidth={2} name="% Passante" />
              <Line type="monotone" dataKey="min" stroke="#0066cc" strokeDasharray="5 5" name="Mín. Especificação" />
              <Line type="monotone" dataKey="max" stroke="#0066cc" strokeDasharray="5 5" name="Máx. Especificação" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Assinaturas */}
      <div className="mt-8 border-t pt-6">
        <SignatureFooter
          labName={record.laboratorista_name}
          labEmail={record.created_by}
          labCreatedDate={record.created_date}
          labPosition="Laboratorista"
          approverName={record.approver_details?.name}
          approverEmail={record.approved_by}
          approverPosition={record.approver_details?.position}
          approverCREA={record.approver_details?.crea_number}
          approverDate={record.approved_date}
          clientName={record.client_signature?.engineer_name}
          clientEmail={record.client_signature?.signed_by}
          clientPosition={record.client_signature?.position}
          clientCREA={record.client_signature?.crea_number}
          clientDate={record.client_signature?.signed_date}
        />
      </div>
    </div>
  );
}