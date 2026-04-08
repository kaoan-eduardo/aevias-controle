import React, { useMemo } from "react";
import {
  ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, ReferenceLine, ResponsiveContainer, Label
} from "recharts";

// Fits a 2nd degree polynomial y = ax² + bx + c via least squares (Gaussian elimination)
export function fitParabola(points) {
  const n = points.length;
  if (n < 3) return null;

  let sx4=0, sx3=0, sx2=0, sx1=0;
  let sx2y=0, sxy=0, sy=0;

  for (const {x, y} of points) {
    sx4 += x**4; sx3 += x**3; sx2 += x**2; sx1 += x;
    sx2y += x**2*y; sxy += x*y; sy += y;
  }

  const A = [
    [sx4, sx3, sx2, sx2y],
    [sx3, sx2, sx1, sxy],
    [sx2, sx1,   n, sy],
  ];

  // Gaussian elimination with partial pivoting
  for (let i = 0; i < 3; i++) {
    let maxRow = i;
    for (let k = i+1; k < 3; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    if (Math.abs(A[i][i]) < 1e-10) return null;
    for (let k = i+1; k < 3; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j <= 3; j++) A[k][j] -= f * A[i][j];
    }
  }

  // Back substitution
  const coeff = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    coeff[i] = A[i][3];
    for (let j = i+1; j < 3; j++) coeff[i] -= A[i][j] * coeff[j];
    coeff[i] /= A[i][i];
  }

  const [a, b, c] = coeff;
  if (Math.abs(a) < 1e-10 || a >= 0) return null; // must be concave

  const w_otima = -b / (2*a);
  const gamma_max = a*w_otima**2 + b*w_otima + c;

  return { a, b, c, w_otima, gamma_max };
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white border border-[#00233B]/20 rounded-lg p-2 text-xs shadow">
      <p className="font-semibold text-[#00233B]">Umidade: {Number(d.x ?? d.umidade).toFixed(2)}%</p>
      <p className="text-[#00233B]/80">γd: {Number(d.y ?? d.densidade).toFixed(4)} g/cm³</p>
    </div>
  );
};

export default function ProctorChart({ points, parabola }) {
  const curveData = useMemo(() => {
    if (!parabola) return [];
    const xs = points.map(p => p.x);
    const minX = Math.min(...xs) - 2;
    const maxX = Math.max(...xs) + 2;
    const steps = 60;
    const result = [];
    for (let i = 0; i <= steps; i++) {
      const x = minX + (maxX - minX) * i / steps;
      const y = parabola.a*x**2 + parabola.b*x + parabola.c;
      result.push({ umidade: parseFloat(x.toFixed(3)), densidade: parseFloat(y.toFixed(5)) });
    }
    return result;
  }, [parabola, points]);

  const scatterData = points.map(p => ({ umidade: p.x, densidade: p.y }));

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[#00233B]/50 text-sm">
        Preencha ao menos 3 pontos para visualizar o gráfico
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00233B20" />
          <XAxis
            dataKey="umidade"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={v => v.toFixed(1)}
            label={{ value: 'Umidade (%)', position: 'insideBottom', offset: -15, fill: '#00233B', fontSize: 12 }}
            tick={{ fontSize: 11, fill: '#00233B' }}
          />
          <YAxis
            dataKey="densidade"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={v => v.toFixed(3)}
            label={{ value: 'γd (g/cm³)', angle: -90, position: 'insideLeft', offset: 10, fill: '#00233B', fontSize: 12 }}
            tick={{ fontSize: 11, fill: '#00233B' }}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Curve line */}
          {parabola && (
            <Line
              data={curveData}
              dataKey="densidade"
              type="monotone"
              stroke="#00233B"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Curva"
            />
          )}

          {/* Actual scatter points */}
          <Scatter
            data={scatterData}
            dataKey="densidade"
            fill="#BFCF99"
            stroke="#00233B"
            strokeWidth={1.5}
            r={6}
            name="Pontos"
          />

          {/* Optimal point vertical line */}
          {parabola && (
            <ReferenceLine
              x={parseFloat(parabola.w_otima.toFixed(2))}
              stroke="#FF6B35"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: `w_ót=${parabola.w_otima.toFixed(2)}%`, fill: '#FF6B35', fontSize: 10, position: 'top' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}