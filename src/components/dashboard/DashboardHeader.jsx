import React from 'react';

export default function DashboardHeader({ user, isClienteUser }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-[#00233B] mb-2">Dashboard</h1>
      <p className="text-[#00233B]/80">
        Bem-vindo(a), {user?.full_name}.{' '}
        {isClienteUser
          ? 'Acompanhe os registros das suas obras.'
          : 'Aqui está o resumo das suas atividades.'}
      </p>
    </div>
  );
}