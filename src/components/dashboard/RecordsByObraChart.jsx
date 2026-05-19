import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(242, 241, 239, 0.8)',
  border: '1px solid rgba(0, 35, 59, 0.2)',
  borderRadius: '8px',
  color: '#00233B',
};

export default function RecordsByObraChart({ data, activeObraId, onSliceClick }) {
  if (!data.length) return null;
  return (
    <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#00233B]">
          Registros por Obra
          <span className="text-xs font-normal text-[#00233B]/60 ml-2">(clique para filtrar)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              onClick={onSliceClick}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeObraId && entry.obraId !== activeObraId ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: '#00233B' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}