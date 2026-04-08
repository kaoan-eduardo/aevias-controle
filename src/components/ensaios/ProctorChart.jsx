import React, { useMemo } from "react";
import {
  ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, ReferenceLine, ResponsiveContainer, Label
} from "recharts";

// Gaussian elimination helper for any NxN system (augmented matrix)
function gaussianElim(A) {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i+1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    if (Math.abs(A[i][i]) < 1e-10) return null;
    for (let k = i+1; k < n; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j <= n; j++) A[k][j] -= f * A[i][j];
    }
  }
  const coeff = new Array(n).fill(0);
  for (let i = n-1; i >= 0; i--) {
    coeff[i] = A[i][n];
    for (let j = i+1; j < n; j++) coeff[i] -= A[i][j] * coeff[j];
    coeff[i] /= A[i][i];
  }
  return coeff;
}

// Fits polynomial via least squares:
// n=3 → degree 2 (y = ax² + bx + c)
// n>=4 → degree 3 (y = ax³ + bx² + cx + d)
export function fitParabola(points) {
  const n = points.length;
  if (n < 3) return null;

  if (n === 3) {
    // Degree 2: normal equations 3x3
    let sx4=0, sx3=0, sx2=0, sx1=0, sx2y=0, sxy=0, sy=0;
    for (const {x, y} of points) {
      sx4+=x**4; sx3+=x**3; sx2+=x**2; sx1+=x;
      sx2y+=x**2*y; sxy+=x*y; sy+=y;
    }
    const A = [
      [sx4, sx3, sx2, sx2y],
      [sx3, sx2, sx1, sxy],
      [sx2, sx1, n,   sy],
    ];
    const coeff = gaussianElim(A);
    if (!coeff) return null;
    const [a, b, c] = coeff;
    if (Math.abs(a) < 1e-10 || a >= 0) return null;
    const w_otima = -b / (2 * a);
    const gamma_max = a * w_otima**2 + b * w_otima + c;
    return { a, b, c, d: 0, degree: 2, w_otima, gamma_max };
  } else {
    // Degree 3: normal equations 4x4
    // y = ax³ + bx² + cx + d
    let s6=0,s5=0,s4=0,s3=0,s2=0,s1=0,s0=n;
    let s3y=0,s2y=0,s1y=0,sy=0;
    for (const {x, y} of points) {
      s6+=x**6; s5+=x**5; s4+=x**4; s3+=x**3;
      s2+=x**2; s1+=x;
      s3y+=x**3*y; s2y+=x**2*y; s1y+=x*y; sy+=y;
    }
    const A = [
      [s6, s5, s4, s3, s3y],
      [s5, s4, s3, s2, s2y],
      [s4, s3, s2, s1, s1y],
      [s3, s2, s1, s0, sy],
    ];
    const coeff = gaussianElim(A);
    if (!coeff) return null;
    const [a, b, c, d] = coeff;
    const evalPoly = x => a*x**3 + b*x**2 + c*x + d;
    // Find maximum numerically in the range of data points (extended by 5 on each side)
    const xs = points.map(p => p.x);
    const xMin = Math.min(...xs) - 5;
    const xMax = Math.max(...xs) + 5;
    const STEPS = 10000;
    let w_otima = xMin;
    let gamma_max = evalPoly(xMin);
    for (let i = 1; i <= STEPS; i++) {
      const xi = xMin + (xMax - xMin) * i / STEPS;
      const yi = evalPoly(xi);
      if (yi > gamma_max) { gamma_max = yi; w_otima = xi; }
    }
    // Refine with golden section search around found peak
    let lo = w_otima - (xMax - xMin) / STEPS;
    let hi = w_otima + (xMax - xMin) / STEPS;
    for (let i = 0; i < 100; i++) {
      const m1 = lo + (hi - lo) / 3;
      const m2 = hi - (hi - lo) / 3;
      if (evalPoly(m1) < evalPoly(m2)) lo = m1; else hi = m2;
    }
    w_otima = (lo + hi) / 2;
    gamma_max = evalPoly(w_otima);
    return { a, b, c, d, degree: 3, w_otima, gamma_max };
  }
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

export default function ProctorChart({ points, parabola, validCount }) {
  const curveData = useMemo(() => {
    if (!parabola) return [];
    const xs = points.map(p => p.x);
    const minX = Math.min(...xs) - 2;
    const maxX = Math.max(...xs) + 2;
    const steps = 80;
    const result = [];
    for (let i = 0; i <= steps; i++) {
      const x = minX + (maxX - minX) * i / steps;
      const y = parabola.degree === 3
        ? parabola.a*x**3 + parabola.b*x**2 + parabola.c*x + parabola.d
        : parabola.a*x**2 + parabola.b*x + parabola.c;
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