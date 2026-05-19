import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(242, 241, 239, 0.8)',
  border: '1px solid rgba(0, 35, 59, 0.2)',
  borderRadius: '8px',
  color: '#00233B',
};

export default function MonthlyChart({ data, isClienteUser }) {
  return (
    <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#00233B]">
          Registros nos Últimos Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 35, 59, 0.1)" />
            <XAxis dataKey="name" stroke="#00233B" />
            <YAxis stroke="#00233B" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: '#00233B' }} />
            <Bar dataKey="ensaios" fill="#00233B" name="Total de Registros" />
            {isClienteUser
              ? <Bar dataKey="assinados" fill="#BFCF99" name="Assinados" />
              : <Bar dataKey="aprovados" fill="#BFCF99" name="Aprovados" />
            }
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}