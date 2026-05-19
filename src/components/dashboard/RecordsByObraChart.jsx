import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(242, 241, 239, 0.8)',
  border: '1px solid rgba(0, 35, 59, 0.2)',
  borderRadius: '8px',
  color: '#00233B',
};

export default function RecordsByObraChart({ data }) {
  if (!data?.rows?.length || !data?.lines?.length) return null;

  return (
    <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#00233B]">
          Registros por Obra ao Longo do Tempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 35, 59, 0.1)" />
            <XAxis dataKey="name" stroke="#00233B" />
            <YAxis stroke="#00233B" allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: '#00233B' }} />
            {data.lines.map(line => (
              <Line
                key={line.obraId}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 4, fill: line.color }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}