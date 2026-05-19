import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(242, 241, 239, 0.8)',
  border: '1px solid rgba(0, 35, 59, 0.2)',
  borderRadius: '8px',
  color: '#00233B',
};

const STATUS_MAP = {
  'Aprovados': 'approved', 'Pendentes': 'pending', 'Reprovados': 'rejected',
  'Assinados': 'approved', 'Aguardando': 'pending',
};

export default function StatusPieChart({ data, activeStatus, isClienteUser, onSliceClick }) {
  return (
    <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#00233B]">
          {isClienteUser ? 'Status das Assinaturas' : 'Status dos Registros'}
          <span className="text-xs font-normal text-[#00233B]/60 ml-2">(clique para filtrar)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} onClick={e => e?.activePayload && onSliceClick(e.activePayload[0].payload)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 35, 59, 0.1)" />
            <XAxis dataKey="name" stroke="#00233B" />
            <YAxis stroke="#00233B" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="value" name="Registros" style={{ cursor: 'pointer' }} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeStatus && STATUS_MAP[entry.name] !== activeStatus ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}