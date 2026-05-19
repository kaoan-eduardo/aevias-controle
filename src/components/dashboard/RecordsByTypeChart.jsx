import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(242, 241, 239, 0.8)',
  border: '1px solid rgba(0, 35, 59, 0.2)',
  borderRadius: '8px',
  color: '#00233B',
};

export default function RecordsByTypeChart({ data, activeTipoRegistro, onSliceClick }) {
  if (!data.length) return null;
  return (
    <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#00233B]">
          Tipos de Registros
          <span className="text-xs font-normal text-[#00233B]/60 ml-2">(clique para filtrar)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
          <BarChart
            data={data}
            layout="vertical"
            onClick={e => e?.activePayload && onSliceClick(e.activePayload[0].payload)}
            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 35, 59, 0.1)" horizontal={false} />
            <XAxis type="number" stroke="#00233B" allowDecimals={false} domain={[0, dataMax => Math.ceil(dataMax * 1.2)]} />
            <YAxis type="category" dataKey="name" stroke="#00233B" width={140} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="value" name="Registros" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeTipoRegistro && entry.entityType !== activeTipoRegistro ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}