import React from 'react';
import { Loader2 } from 'lucide-react';
import { getUserAccessLevel, canSeeFilters, canSeeObraChart } from '@/utils/accessControl';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import DashboardStats from '@/components/dashboard/DashboardStats';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import StatusPieChart from '@/components/dashboard/StatusPieChart';
import RecordsByObraChart from '@/components/dashboard/RecordsByObraChart';
import RecordsByTypeChart from '@/components/dashboard/RecordsByTypeChart';

export default function Dashboard() {
  const {
    loading,
    user,
    filters,
    setFilters,
    clearFilters,
    handlePieClick,
    stats,
    charts,
    approvalPercentage,
    obras,
    isClienteUser,
    isEngenheiroUser,
    hasActiveFilters,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/50" />
          <p className="text-[#00233B]/80 mt-2">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const userAccessLevel = getUserAccessLevel(user);
  const showObraChart = canSeeObraChart(user) && charts.porObra.length > 0;
  const showTypeChartSeparate = (
    userAccessLevel === 'gestor_contrato' ||
    userAccessLevel === 'sala_tecnica_afirmaevias' ||
    userAccessLevel === 'cliente'
  ) && charts.porTipo.length > 0;

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader user={user} isClienteUser={isClienteUser} />

        {canSeeFilters(user) && (
          <DashboardFilters
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            obras={obras}
          />
        )}

        <DashboardStats
          stats={stats}
          isClienteUser={isClienteUser}
          isEngenheiroUser={isEngenheiroUser}
          approvalPercentage={approvalPercentage}
        />

        {/* Gráficos principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MonthlyChart data={charts.monthly} isClienteUser={isClienteUser} />
          <StatusPieChart
            data={charts.status}
            activeStatus={filters.status}
            isClienteUser={isClienteUser}
            onSliceClick={data => handlePieClick(data, 'status')}
          />
        </div>

        {/* Gráficos adicionais para Admin e Cliente */}
        {showObraChart && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RecordsByObraChart
              data={charts.porObra}
              activeObraId={filters.obraId}
              onSliceClick={data => handlePieClick(data, 'obra')}
            />
            <RecordsByTypeChart
              data={charts.porTipo}
              activeTipoRegistro={filters.tipoRegistro}
              onSliceClick={data => handlePieClick(data, 'type')}
            />
          </div>
        )}

        {/* Gráfico de tipos para Gestores, Sala Técnica e Cliente (quando não mostrado acima) */}
        {!showObraChart && showTypeChartSeparate && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <RecordsByTypeChart
              data={charts.porTipo}
              activeTipoRegistro={filters.tipoRegistro}
              onSliceClick={data => handlePieClick(data, 'type')}
            />
          </div>
        )}
      </div>
    </div>
  );
}