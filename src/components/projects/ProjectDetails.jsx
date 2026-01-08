
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

const DetailSection = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold text-[#00233B] flex items-center gap-2">
      {title}
    </h3>
    <div className="pl-4 space-y-3">
      {children}
    </div>
  </div>
);

const DetailItem = ({ label, value, unit }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm font-medium text-[#00233B]/80 col-span-1">{label}:</span>
      <span className="text-sm text-[#00233B] col-span-2">
        {value}{unit && ` ${unit}`}
      </span>
    </div>
  );
};

const DetailRange = ({ label, min, max, otimo, unit }) => {
  if ((!min && min !== 0) && (!max && max !== 0) && (!otimo && otimo !== 0)) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm font-medium text-[#00233B]/80 col-span-1">{label}:</span>
      <div className="text-sm text-[#00233B] col-span-2">
        {min !== undefined && min !== null && <span>Mín: {min}{unit}</span>}
        {max !== undefined && max !== null && <span className="ml-3">Máx: {max}{unit}</span>}
        {otimo !== undefined && otimo !== null && <span className="ml-3 font-semibold">Ótimo: {otimo}{unit}</span>}
      </div>
    </div>
  );
};

const AgregadosList = ({ agregados }) => {
  if (!agregados || agregados.length === 0) return null;
  
  const peneirasOrdenadas = [
    { key: 'peneira_75_0mm', astm: '3"', abertura: '75.0 mm' },
    { key: 'peneira_63_0mm', astm: '2 1/2"', abertura: '63.0 mm' },
    { key: 'peneira_50_0mm', astm: '2"', abertura: '50.0 mm' },
    { key: 'peneira_37_5mm', astm: '1 1/2"', abertura: '37.5 mm' },
    { key: 'peneira_25_0mm', astm: '1"', abertura: '25.0 mm' },
    { key: 'peneira_19_0mm', astm: '3/4"', abertura: '19.0 mm' },
    { key: 'peneira_16_0mm', astm: '5/8"', abertura: '16.0 mm' },
    { key: 'peneira_12_5mm', astm: '1/2"', abertura: '12.5 mm' },
    { key: 'peneira_9_5mm', astm: '3/8"', abertura: '9.5 mm' },
    { key: 'peneira_4_75mm', astm: 'Nº 4', abertura: '4.75 mm' },
    { key: 'peneira_2_36mm', astm: 'Nº 8', abertura: '2.36 mm' },
    { key: 'peneira_2_0mm', astm: 'Nº 10', abertura: '2.0 mm' },
    { key: 'peneira_1_18mm', astm: 'Nº 16', abertura: '1.18 mm' },
    { key: 'peneira_0_6mm', astm: 'Nº 30', abertura: '0.6 mm' },
    { key: 'peneira_0_42mm', astm: 'Nº 40', abertura: '0.42 mm' },
    { key: 'peneira_0_3mm', astm: 'Nº 50', abertura: '0.3 mm' },
    { key: 'peneira_0_18mm', astm: 'Nº 80', abertura: '0.18 mm' },
    { key: 'peneira_0_15mm', astm: 'Nº 100', abertura: '0.15 mm' },
    { key: 'peneira_0_075mm', astm: 'Nº 200', abertura: '0.075 mm' }
  ];

  // Filtrar apenas peneiras que têm dados em pelo menos um agregado
  const peneirasComDados = peneirasOrdenadas.filter(peneira =>
    agregados.some(agregado => 
      agregado.granulometria && 
      agregado.granulometria[peneira.key] !== undefined && 
      agregado.granulometria[peneira.key] !== null
    )
  );

  const formatValue = (value) => {
    if (value === undefined || value === null) return '—';
    return `${Number(value).toFixed(1)}%`;
  };
  
  return (
    <div className="overflow-x-auto">
      <h4 className="font-semibold text-[#00233B] mb-3">Granulometria Individual dos Agregados</h4>
      <table className="w-full border border-[#00233B]/20 text-sm">
        <thead className="bg-[#00233B] text-white">
          <tr>
            <th colSpan="2" className="border border-[#00233B]/20 px-3 py-3 text-center font-bold">
              PENEIRA
            </th>
            <th colSpan={agregados.length} className="border border-[#00233B]/20 px-3 py-3 text-center font-bold">
              PASSANTE EM PESO (%)
            </th>
          </tr>
          <tr>
            <th className="border border-[#00233B]/20 px-3 py-2 text-center font-semibold">
              NÚMERO
            </th>
            <th className="border border-[#00233B]/20 px-3 py-2 text-center font-semibold">
              ABERTURA (mm)
            </th>
            {agregados.map((agregado, index) => (
              <th key={index} className="border border-[#00233B]/20 px-3 py-2 text-center font-semibold">
                <div className="flex flex-col gap-1">
                  <div className="font-bold uppercase">{agregado.nome || `Agregado ${index + 1}`}</div>
                  {agregado.pedreira && <div className="text-xs font-normal">{agregado.pedreira}</div>}
                  {agregado.percentual_mistura !== null && agregado.percentual_mistura !== undefined && (
                    <div className="text-xs font-normal">% Mistura: {agregado.percentual_mistura}%</div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {peneirasComDados.map((peneira, idx) => (
            <tr key={idx} className="hover:bg-[#F2F1EF]">
              <td className="border border-[#00233B]/20 px-3 py-2 text-center font-semibold">
                {peneira.astm}
              </td>
              <td className="border border-[#00233B]/20 px-3 py-2 text-center">
                {peneira.abertura}
              </td>
              {agregados.map((agregado, agregadoIdx) => (
                <td key={agregadoIdx} className="border border-[#00233B]/20 px-3 py-2 text-center">
                  {formatValue(agregado.granulometria?.[peneira.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const LiganteInfo = ({ ligante }) => {
  if (!ligante || Object.keys(ligante).length === 0) return null;
  
  return (
    <div className="p-4 bg-[#F2F1EF] rounded-lg border border-[#00233B]/10">
      <h4 className="font-semibold text-[#00233B] mb-3">Ligante Asfáltico</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DetailItem label="Tipo" value={ligante.tipo} />
        <DetailItem label="Fornecedor" value={ligante.fornecedor} />
        <DetailItem label="Densidade" value={ligante.densidade} unit="g/cm³" />
      </div>
    </div>
  );
};

const TemperaturasControl = ({ temperaturas }) => {
  if (!temperaturas || Object.keys(temperaturas).length === 0) return null;
  
  return (
    <div className="p-4 bg-[#F2F1EF] rounded-lg border border-[#00233B]/10 space-y-3">
      <h4 className="font-semibold text-[#00233B]">Temperaturas de Controle</h4>
      {temperaturas.mistura && (
        <DetailRange 
          label="Mistura" 
          min={temperaturas.mistura.min} 
          max={temperaturas.mistura.max}
          unit="°C" 
        />
      )}
      {temperaturas.compactacao && (
        <DetailRange 
          label="Compactação" 
          min={temperaturas.compactacao.min} 
          max={temperaturas.compactacao.max}
          unit="°C" 
        />
      )}
      {temperaturas.espalhamento && (
        <DetailRange 
          label="Espalhamento" 
          min={temperaturas.espalhamento.min} 
          max={temperaturas.espalhamento.max}
          unit="°C" 
        />
      )}
    </div>
  );
};

const FaixaEspecificacaoTable = ({ faixaEspecificacao }) => {
  if (!faixaEspecificacao || !faixaEspecificacao.peneiras || faixaEspecificacao.peneiras.length === 0) return null;

  const formatValue = (value) => {
    if (value === undefined || value === null) return '—';
    return Number(value).toFixed(2);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-[#00233B]/20 text-sm">
        <thead className="bg-[#00233B] text-white">
          <tr>
            <th className="border border-[#00233B]/20 px-3 py-2 text-left">Peneira</th>
            <th className="border border-[#00233B]/20 px-3 py-2 text-center">Mín (%)</th>
            <th className="border border-[#00233B]/20 px-3 py-2 text-center">Máx (%)</th>
          </tr>
        </thead>
        <tbody>
          {faixaEspecificacao.peneiras.map((peneira, index) => (
            <tr key={index} className="hover:bg-[#F2F1EF]">
              <td className="border border-[#00233B]/20 px-3 py-2 font-medium">{peneira.abertura}</td>
              <td className="border border-[#00233B]/20 px-3 py-2 text-center">
                {formatValue(peneira.min)}
              </td>
              <td className="border border-[#00233B]/20 px-3 py-2 text-center">
                {formatValue(peneira.max)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FaixaTrabalhoTable = ({ faixaTrabalho, faixaMin, faixaMax }) => {
  if (!faixaTrabalho && !faixaMin && !faixaMax) return null;

  const peneirasOrdenadas = [
    { key: 'peneira_75_0mm', label: '75.0 mm (3")' },
    { key: 'peneira_63_0mm', label: '63.0 mm (2 1/2")' },
    { key: 'peneira_50_0mm', label: '50.0 mm (2")' },
    { key: 'peneira_37_5mm', label: '37.5 mm (1 1/2")' },
    { key: 'peneira_25_0mm', label: '25.0 mm (1")' },
    { key: 'peneira_19_0mm', label: '19.0 mm (3/4")' },
    { key: 'peneira_16_0mm', label: '16.0 mm (5/8")' },
    { key: 'peneira_12_5mm', label: '12.5 mm (1/2")' },
    { key: 'peneira_9_5mm', label: '9.5 mm (3/8")' },
    { key: 'peneira_4_75mm', label: '4.75 mm (Nº 4)' },
    { key: 'peneira_2_36mm', label: '2.36 mm (Nº 8)' },
    { key: 'peneira_2_0mm', label: '2.0 mm (Nº 10)' },
    { key: 'peneira_1_18mm', label: '1.18 mm (Nº 16)' },
    { key: 'peneira_0_6mm', label: '0.6 mm (Nº 30)' },
    { key: 'peneira_0_42mm', label: '0.42 mm (Nº 40)' },
    { key: 'peneira_0_3mm', label: '0.3 mm (Nº 50)' },
    { key: 'peneira_0_18mm', label: '0.18 mm (Nº 80)' },
    { key: 'peneira_0_15mm', label: '0.15 mm (Nº 100)' },
    { key: 'peneira_0_075mm', label: '0.075 mm (Nº 200)' }
  ];

  const peneirasComDados = peneirasOrdenadas.filter(peneira => 
    (faixaTrabalho && faixaTrabalho[peneira.key] !== undefined && faixaTrabalho[peneira.key] !== null) ||
    (faixaMin && faixaMin[peneira.key] !== undefined && faixaMin[peneira.key] !== null) ||
    (faixaMax && faixaMax[peneira.key] !== undefined && faixaMax[peneira.key] !== null)
  );

  if (peneirasComDados.length === 0) return null;

  const formatValue = (value) => {
    if (value === undefined || value === null) return '—';
    return Number(value).toFixed(2);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-[#00233B]/20 text-sm">
        <thead className="bg-[#00233B] text-white">
          <tr>
            <th className="border border-[#00233B]/20 px-3 py-2 text-left">Peneira</th>
            {faixaMin && <th className="border border-[#00233B]/20 px-3 py-2 text-center">Mín (%)</th>}
            {faixaTrabalho && <th className="border border-[#00233B]/20 px-3 py-2 text-center">Mistura (%)</th>}
            {faixaMax && <th className="border border-[#00233B]/20 px-3 py-2 text-center">Máx (%)</th>}
          </tr>
        </thead>
        <tbody>
          {peneirasComDados.map((peneira) => (
            <tr key={peneira.key} className="hover:bg-[#F2F1EF]">
              <td className="border border-[#00233B]/20 px-3 py-2 font-medium">{peneira.label}</td>
              {faixaMin && (
                <td className="border border-[#00233B]/20 px-3 py-2 text-center">
                  {formatValue(faixaMin[peneira.key])}
                </td>
              )}
              {faixaTrabalho && (
                <td className="border border-[#00233B]/20 px-3 py-2 text-center font-semibold">
                  {formatValue(faixaTrabalho[peneira.key])}
                </td>
              )}
              {faixaMax && (
                <td className="border border-[#00233B]/20 px-3 py-2 text-center">
                  {formatValue(faixaMax[peneira.key])}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabelaMarshall = ({ project }) => {
  const formatValue = (value, unit = '') => {
    if (value === undefined || value === null || value === '') return '—';
    return `${Number(value).toFixed(2)}${unit}`;
  };

  const parametros = [
    {
      nome: 'Teor de Ligante',
      min: project.teor_ligante?.min,
      max: project.teor_ligante?.max,
      projeto: project.teor_ligante?.otimo,
      unit: '%'
    },
    {
      nome: 'Massa Específica Aparente',
      min: null,
      max: null,
      projeto: project.massa_especifica_aparente,
      unit: ' g/cm³'
    },
    {
      nome: 'Densidade Máxima Medida (RICE)',
      min: null,
      max: null,
      projeto: project.densidade_maxima_medida,
      unit: ' g/cm³'
    },
    {
      nome: 'Volume de Vazios (Vv)',
      min: project.volume_vazios?.min,
      max: project.volume_vazios?.max,
      projeto: project.volume_vazios?.otimo,
      unit: '%'
    },
    {
      nome: 'RTCD',
      min: project.rtcd?.min,
      max: null,
      projeto: null,
      unit: ''
    },
    {
      nome: 'Estabilidade Marshall',
      min: project.estabilidade?.min,
      max: null,
      projeto: project.estabilidade?.projeto,
      unit: ' N'
    },
    {
      nome: 'Fluência Marshall',
      min: project.fluencia?.min,
      max: project.fluencia?.max,
      projeto: project.fluencia?.projeto,
      unit: ' mm'
    },
    {
      nome: 'VAM (Vazios Agregado Mineral)',
      min: project.vam?.min,
      max: null,
      projeto: project.vam?.projeto,
      unit: '%'
    },
    {
      nome: 'RBV (Relação Betume/Vazios)',
      min: project.rbv?.min,
      max: project.rbv?.max,
      projeto: project.rbv?.projeto,
      unit: '%'
    }
  ];

  const hasAnyMarshallData = parametros.some(param => 
    (param.min !== null && param.min !== undefined) || 
    (param.max !== null && param.max !== undefined) || 
    (param.projeto !== null && param.projeto !== undefined)
  );

  if (!hasAnyMarshallData) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-[#00233B]/20 text-sm">
        <thead className="bg-[#00233B] text-white">
          <tr>
            <th className="border border-[#00233B]/20 px-3 py-2 text-left">Parâmetro</th>
            <th className="border border-[#00233B]/20 px-3 py-2 text-center">Mínimo</th>
            <th className="border border-[#00233B]/20 px-3 py-2 text-center">Máximo</th>
            <th className="border border-[#00233B]/20 px-3 py-2 text-center">Projeto/Ótimo</th>
          </tr>
        </thead>
        <tbody>
          {parametros.map((param, index) => {
            const displayMin = formatValue(param.min, param.unit);
            const displayMax = formatValue(param.max, param.unit);
            const displayProjeto = formatValue(param.projeto, param.unit);

            // Only render row if there is at least one non-empty value
            if (displayMin === '—' && displayMax === '—' && displayProjeto === '—') {
              return null;
            }

            return (
              <tr key={index} className="hover:bg-[#F2F1EF]">
                <td className="border border-[#00233B]/20 px-3 py-2 font-medium">{param.nome}</td>
                <td className="border border-[#00233B]/20 px-3 py-2 text-center">
                  {displayMin}
                </td>
                <td className="border border-[#00233B]/20 px-3 py-2 text-center">
                  {displayMax}
                </td>
                <td className="border border-[#00233B]/20 px-3 py-2 text-center font-semibold">
                  {displayProjeto}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


const GraficoGranulometriaProject = ({ project, faixaEspecificacao }) => {
  if (!project.faixa_trabalho || !faixaEspecificacao) return null;

  const PENEIRAS_MAP = {
    'peneira_75_0mm': 75.0,
    'peneira_63_0mm': 63.0,
    'peneira_50_0mm': 50.0,
    'peneira_37_5mm': 37.5,
    'peneira_25_0mm': 25.0,
    'peneira_19_0mm': 19.0,
    'peneira_16_0mm': 16.0,
    'peneira_12_5mm': 12.5,
    'peneira_9_5mm': 9.5,
    'peneira_4_75mm': 4.75,
    'peneira_2_36mm': 2.36,
    'peneira_2_0mm': 2.0,
    'peneira_1_18mm': 1.18,
    'peneira_0_6mm': 0.6,
    'peneira_0_42mm': 0.42,
    'peneira_0_3mm': 0.3,
    'peneira_0_18mm': 0.18,
    'peneira_0_15mm': 0.15,
    'peneira_0_075mm': 0.075
  };

  const extrairAberturaNumero = (aberturaString) => {
    const match = aberturaString.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  const chartData = [];
  const peneirasUsadas = new Set();

  Object.entries(project.faixa_trabalho).forEach(([key, value]) => {
    if (PENEIRAS_MAP[key] && value !== null && value !== undefined) {
      const abertura = PENEIRAS_MAP[key];
      peneirasUsadas.add(abertura);
      
      let existingPoint = chartData.find(d => d.abertura === abertura);
      if (!existingPoint) {
        existingPoint = { abertura, name: key.replace('peneira_', '').replace('_', '.') };
        chartData.push(existingPoint);
      }
      existingPoint.mistura = Number(value);
    }
  });

  if (project.faixa_trabalho_min) {
    Object.entries(project.faixa_trabalho_min).forEach(([key, value]) => {
      if (PENEIRAS_MAP[key] && value !== null && value !== undefined) {
        const abertura = PENEIRAS_MAP[key];
        peneirasUsadas.add(abertura);
        
        let existingPoint = chartData.find(d => d.abertura === abertura);
        if (!existingPoint) {
          existingPoint = { abertura, name: key.replace('peneira_', '').replace('_', '.') };
          chartData.push(existingPoint);
        }
        existingPoint.trabalho_min = Number(value);
      }
    });
  }

  if (project.faixa_trabalho_max) {
    Object.entries(project.faixa_trabalho_max).forEach(([key, value]) => {
      if (PENEIRAS_MAP[key] && value !== null && value !== undefined) {
        const abertura = PENEIRAS_MAP[key];
        peneirasUsadas.add(abertura);
        
        let existingPoint = chartData.find(d => d.abertura === abertura);
        if (!existingPoint) {
          existingPoint = { abertura, name: key.replace('peneira_', '').replace('_', '.') };
          chartData.push(existingPoint);
        }
        existingPoint.trabalho_max = Number(value);
      }
    });
  }

  if (faixaEspecificacao.peneiras && Array.isArray(faixaEspecificacao.peneiras)) {
    faixaEspecificacao.peneiras.forEach(peneira => {
      const abertura = extrairAberturaNumero(peneira.abertura);
      if (abertura) {
        let existingPoint = chartData.find(d => d.abertura === abertura);
        if (!existingPoint) {
          existingPoint = { abertura, name: abertura.toString() };
          chartData.push(existingPoint);
        }
        if (peneira.min !== null && peneira.min !== undefined) {
          existingPoint.espec_min = Number(peneira.min);
        }
        if (peneira.max !== null && peneira.max !== undefined) {
          existingPoint.espec_max = Number(peneira.max);
        }
        peneirasUsadas.add(abertura);
      }
    });
  }

  chartData.sort((a, b) => b.abertura - a.abertura);
  const xTicks = Array.from(peneirasUsadas).sort((a, b) => b - a);

  if (chartData.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 35, 59, 0.1)" />
          <XAxis
            dataKey="abertura"
            type="number"
            scale="log"
            domain={['dataMin', 'dataMax']}
            reversed={true}
            ticks={xTicks}
            label={{ value: 'Abertura (mm)', position: 'insideBottom', offset: -15, fill: '#00233B' }}
            tick={{ fill: '#00233B', fontSize: 11 }}
          />
          <YAxis 
            label={{ value: '% Passante', angle: -90, position: 'insideLeft', fill: '#00233B' }}
            tick={{ fill: '#00233B' }}
          />
          <Tooltip 
            formatter={(value) => `${Number(value).toFixed(2)}%`}
            contentStyle={{ backgroundColor: 'rgba(242, 241, 239, 0.95)', border: '1px solid rgba(0, 35, 59, 0.2)', borderRadius: '8px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          
          <Line 
            type="monotone" 
            dataKey="espec_min" 
            stroke="#FF6B6B" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Faixa Especificada" 
            dot={false}
            connectNulls
          />
          <Line 
            type="monotone" 
            dataKey="espec_max" 
            stroke="#FF6B6B" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Faixa Especificada" 
            dot={false}
            connectNulls
            legendType="none"
          />
          
          <Line 
            type="monotone" 
            dataKey="trabalho_min" 
            stroke="#FFA500" 
            strokeWidth={2}
            strokeDasharray="3 3"
            name="Faixa de Trabalho" 
            dot={false}
            connectNulls
          />
          <Line 
            type="monotone" 
            dataKey="trabalho_max" 
            stroke="#FFA500" 
            strokeWidth={2}
            strokeDasharray="3 3"
            name="Faixa de Trabalho" 
            dot={false}
            connectNulls
            legendType="none"
          />
          
          <Line 
            type="monotone" 
            dataKey="mistura" 
            stroke="#00233B" 
            strokeWidth={3}
            name="Mistura (Projeto)" 
            dot={{ r: 4, fill: '#00233B' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function ProjectDetails({ project, faixas, onClose }) {
  if (!project) return null;

  const faixa = faixas?.find(f => f.id === project.faixa_granulometrica_id);
  const isCauq = project.tipo_projeto === 'CAUQ';
  const isMraf = project.tipo_projeto === 'MRAF';
  const isCartaTraco = project.tipo_projeto === 'CARTA_TRACO_CONCRETO';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-[#00233B]">{project.name}</h2>
          <Badge className={
            project.tipo_projeto === 'CAUQ' ? 'bg-[#00233B] text-white' :
            project.tipo_projeto === 'MRAF' ? 'bg-[#566E3D] text-white' :
            project.tipo_projeto === 'CARTA_TRACO_CONCRETO' ? 'bg-orange-500 text-white' :
            'bg-purple-500 text-white'
          }>
            {project.tipo_projeto === 'CARTA_TRACO_CONCRETO' ? 'CARTA TRAÇO' : project.tipo_projeto || 'CAUQ'}
          </Badge>
        </div>
        {project.description && (
          <p className="text-sm text-[#00233B]/80">{project.description}</p>
        )}
        {project.location && (
          <p className="text-sm text-[#00233B]/60 mt-1">📍 {project.location}</p>
        )}
      </div>

      <Separator className="bg-[#00233B]/20" />

      <DetailSection title="📋 Informações Básicas">
        <DetailItem label="Cliente" value={project.client} />
        <DetailItem label="Status" value={
          project.status === 'ativo' ? 'Ativo' :
          project.status === 'inativo' ? 'Inativo' :
          'Pausado'
        } />
        {!isCartaTraco && faixa && <DetailItem label="Faixa Granulométrica" value={faixa.nome} />}
      </DetailSection>

      <Separator className="bg-[#00233B]/20" />

      {isCartaTraco && (
        <>
          <DetailSection title="🏗️ Especificações da Carta Traço">
            <div className="space-y-4">
              {/* FCK - Resistência Característica */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg border-2 border-orange-300/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💪</span>
                  <h4 className="font-bold text-orange-900">Resistência Característica</h4>
                </div>
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-orange-600">
                    {project.fck || '—'} <span className="text-2xl">MPa</span>
                  </p>
                  <p className="text-xs text-orange-700 mt-1">FCK</p>
                </div>
              </div>

              {/* Concreteira */}
              {project.concreteira && (
                <div className="p-4 bg-[#F2F1EF] rounded-lg border border-[#00233B]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏭</span>
                    <h4 className="font-semibold text-[#00233B]">Concreteira Fornecedora</h4>
                  </div>
                  <p className="text-lg font-medium text-[#00233B]">
                    {project.concreteira}
                  </p>
                </div>
              )}

              {/* Slump */}
              <div className="p-4 bg-[#F2F1EF] rounded-lg border border-[#00233B]/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📏</span>
                  <h4 className="font-semibold text-[#00233B]">Controle de Slump (cm)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded border border-[#00233B]/20 text-center">
                    <p className="text-xs font-semibold text-[#00233B]/60 mb-2">MÍNIMO</p>
                    <p className="text-2xl font-bold text-[#00233B]">
                      {project.slump_minimo !== undefined && project.slump_minimo !== null ? project.slump_minimo : '—'}
                    </p>
                    <p className="text-xs text-[#00233B]/60 mt-1">cm</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded border-2 border-blue-400 text-center">
                    <p className="text-xs font-semibold text-blue-800 mb-2">PROJETO</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {project.slump_projeto !== undefined && project.slump_projeto !== null ? project.slump_projeto : '—'}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">cm</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#00233B]/20 text-center">
                    <p className="text-xs font-semibold text-[#00233B]/60 mb-2">MÁXIMO</p>
                    <p className="text-2xl font-bold text-[#00233B]">
                      {project.slump_maximo !== undefined && project.slump_maximo !== null ? project.slump_maximo : '—'}
                    </p>
                    <p className="text-xs text-[#00233B]/60 mt-1">cm</p>
                  </div>
                </div>
              </div>

              {/* Consumo de Água */}
              {(project.consumo_agua !== undefined && project.consumo_agua !== null) && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">💧</span>
                    <h4 className="font-semibold text-blue-900">Consumo de Água</h4>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {project.consumo_agua} <span className="text-lg">L/m³</span>
                  </p>
                </div>
              )}

              {/* Materiais Utilizados */}
              <div className="p-4 bg-[#F2F1EF] rounded-lg border border-[#00233B]/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🧱</span>
                  <h4 className="font-semibold text-[#00233B]">Materiais Utilizados</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded border border-[#00233B]/10">
                    <p className="text-xs font-semibold text-[#00233B]/70 mb-1">Tipo de Cimento</p>
                    <p className="text-base font-medium text-[#00233B]">
                      {project.tipo_cimento || 'Não especificado'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#00233B]/10">
                    <p className="text-xs font-semibold text-[#00233B]/70 mb-1">Tipo de Aditivo</p>
                    <p className="text-base font-medium text-[#00233B]">
                      {project.tipo_aditivo || 'Não especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DetailSection>
          <Separator className="bg-[#00233B]/20" />
        </>
      )}

      {!isCartaTraco && (
        <>
          {project.agregados && project.agregados.length > 0 && (
            <>
              <DetailSection title="🪨 Agregados">
                <AgregadosList agregados={project.agregados} />
              </DetailSection>
              <Separator className="bg-[#00233B]/20" />
            </>
          )}

          {isCauq && project.ligante && (
            <>
              <DetailSection title="🛢️ Ligante Asfáltico">
                <LiganteInfo ligante={project.ligante} />
              </DetailSection>
              <Separator className="bg-[#00233B]/20" />
            </>
          )}

          {isMraf && (
            <>
              <DetailSection title="🛢️ Emulsão Asfáltica">
                <div className="space-y-3">
                  <DetailItem label="Emulsão Utilizada" value={project.emulsao_utilizada} />
                  <DetailItem label="Percentual de Emulsão" value={project.percentual_emulsao} unit="%" />
                  <DetailRange 
                    label="Teor Ligante Residual" 
                    min={project.teor_ligante_residual?.min}
                    max={project.teor_ligante_residual?.max}
                    otimo={project.teor_ligante_residual?.otimo}
                    unit="%" 
                  />
                  <DetailRange 
                    label="Taxa de Aplicação" 
                    min={project.taxa_aplicacao_mraf?.min}
                    max={project.taxa_aplicacao_mraf?.max}
                    otimo={project.taxa_aplicacao_mraf?.otimo}
                    unit=" kg/m²" 
                  />
                  <DetailItem label="Densidade da Mistura" value={project.densidade_mistura_mraf} unit="g/cm³" />
                </div>
              </DetailSection>
              <Separator className="bg-[#00233B]/20" />
            </>
          )}

          {isCauq && project.temperaturas && (
            <>
              <DetailSection title="🌡️ Controle de Temperaturas">
                <TemperaturasControl temperaturas={project.temperaturas} />
              </DetailSection>
              <Separator className="bg-[#00233B]/20" />
            </>
          )}

          {faixa && (
            <>
              <DetailSection title="📐 Faixa de Especificação (% Passante)">
                <div className="space-y-2 mb-3">
                  <DetailItem label="Nome" value={faixa.nome} />
                  <DetailItem label="Órgão" value={faixa.orgao} />
                  <DetailItem label="Especificação" value={faixa.especificacao} />
                </div>
                <FaixaEspecificacaoTable faixaEspecificacao={faixa} />
              </DetailSection>
              <Separator className="bg-[#00233B]/20" />
            </>
          )}

          {(project.faixa_trabalho || project.faixa_trabalho_min || project.faixa_trabalho_max) && (
            <>
              <DetailSection title="📊 Faixa de Trabalho (% Passante)">
                <FaixaTrabalhoTable 
                  faixaTrabalho={project.faixa_trabalho}
                  faixaMin={project.faixa_trabalho_min}
                  faixaMax={project.faixa_trabalho_max}
                />
                
                {project.faixa_trabalho && faixa && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-[#00233B] mb-3">Gráfico da Faixa de Trabalho</h4>
                    <GraficoGranulometriaProject
                      project={project}
                      faixaEspecificacao={faixa}
                    />
                  </div>
                )}
              </DetailSection>
              <Separator className="bg-[#00233B]/20" />
            </>
          )}

          {isCauq && (
            <>
              <DetailSection title="🔬 Parâmetros Marshall">
                <TabelaMarshall project={project} />
              </DetailSection>
            </>
          )}
        </>
      )}
    </div>
  );
}
