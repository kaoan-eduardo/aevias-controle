import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Area } from 'recharts';

const PENEIRAS_INFO = [
    { nome: '25 mm', abertura: 25.0, key: 'peneira_25mm' },
    { nome: '19 mm', abertura: 19.0, key: 'peneira_19mm' },
    { nome: '12.5 mm', abertura: 12.5, key: 'peneira_12_5mm' },
    { nome: '9.5 mm', abertura: 9.5, key: 'peneira_9_5mm' },
    { nome: '4.8 mm', abertura: 4.8, key: 'peneira_4_8mm' },
    { nome: '2.4 mm', abertura: 2.4, key: 'peneira_2_4mm' },
    { nome: '1.2 mm', abertura: 1.2, key: 'peneira_1_2mm' },
    { nome: '0.6 mm', abertura: 0.6, key: 'peneira_0_6mm' },
    { nome: '0.3 mm', abertura: 0.3, key: 'peneira_0_3mm' },
    { nome: '0.15 mm', abertura: 0.15, key: 'peneira_0_15mm' },
    { nome: '0.075 mm', abertura: 0.075, key: 'peneira_0_075mm' },
];

export default function GraficoGranulometria({ project, faixas, granulometriaEnsaio }) {
    if (!project || !faixas || !granulometriaEnsaio) {
        return <div className="p-4 text-center text-slate-500">Dados insuficientes para gerar o gráfico.</div>;
    }

    const faixaProjeto = faixas.find(f => f.id === project.faixa_granulometrica_id);
    if (!faixaProjeto) {
        return <div className="p-4 text-center text-slate-500">Faixa granulométrica não encontrada para este projeto.</div>;
    }

    const pesosRetidos = granulometriaEnsaio;
    const pesoTotal = PENEIRAS_INFO.reduce((sum, p) => sum + (pesosRetidos[p.key] || 0), 0) + (pesosRetidos.fundo || 0);

    let acumulado = 0;
    const resultadosEnsaio = {};
    [...PENEIRAS_INFO, { key: 'fundo' }].forEach(p => {
        const pesoRetido = pesosRetidos[p.key] || 0;
        if (pesoTotal > 0) {
            acumulado += pesoRetido;
            resultadosEnsaio[p.key] = 100 - (acumulado / pesoTotal * 100);
        } else {
            resultadosEnsaio[p.key] = 100;
        }
    });

    const chartData = PENEIRAS_INFO.map(peneiraInfo => {
        const faixaPeneira = faixaProjeto.peneiras.find(p => p.abertura === peneiraInfo.nome);
        return {
            name: peneiraInfo.nome,
            abertura: peneiraInfo.abertura,
            especificacao: faixaPeneira ? [faixaPeneira.min, faixaPeneira.max] : [null, null],
            resultado: resultadosEnsaio[peneiraInfo.key] !== undefined ? resultadosEnsaio[peneiraInfo.key] : null
        };
    }).sort((a, b) => b.abertura - a.abertura);

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="abertura" 
                        type="number" 
                        scale="log" 
                        domain={[0.075, 30]} 
                        reversed={true}
                        ticks={[0.075, 0.15, 0.3, 0.6, 1.2, 2.4, 4.8, 9.5, 19, 25]}
                        tickFormatter={(tick) => `${tick} mm`}
                        label={{ value: "Abertura da Peneira (mm) - Escala Logarítmica", position: "insideBottom", dy: 20 }}
                    />
                    <YAxis 
                        domain={[0, 100]} 
                        label={{ value: "% Passante", angle: -90, position: 'insideLeft', dx: -10 }}
                    />
                    <Tooltip 
                        formatter={(value, name) => {
                            if (name === 'especificacao') return [`${value[0]}% - ${value[1]}%`, 'Faixa de Especificação'];
                            return [`${value.toFixed(2)}%`, 'Resultado do Ensaio'];
                        }}
                        labelFormatter={(label) => `Peneira ${chartData.find(d=>d.abertura === label)?.name || label}`}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area 
                        type="monotone" 
                        dataKey="especificacao" 
                        stroke="#fca5a5" 
                        fill="#fee2e2"
                        name="Faixa de Especificação"
                        activeDot={false}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="resultado" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Resultado do Ensaio" 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}