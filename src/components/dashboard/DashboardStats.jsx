import React from 'react';
import { Building2, FolderOpen, FlaskConical, CheckCircle, Clock, FileSignature } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const StatCard = React.memo(({ title, value, icon: Icon, note, onClick, className }) => (
  <Card
    className={`relative overflow-hidden bg-white/20 backdrop-blur-lg border border-white/20 shadow-sm text-[#00233B] ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className || ''}`}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-[#00233B]/80">{title}</CardTitle>
      <div className="p-2 rounded-lg bg-[#BFCF99]/20">
        <Icon className="w-4 h-4 text-[#00233B]" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-[#00233B]">{value}</div>
      {note && <p className="text-xs text-[#00233B]/70 mt-1">{note}</p>}
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';

export default function DashboardStats({ stats, isClienteUser, isEngenheiroUser, approvalPercentage }) {
  const navigate = useNavigate();

  if (isClienteUser) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Obras" value={stats.obras} icon={Building2} />
        <StatCard title="Projetos" value={stats.projects} icon={FolderOpen} />
        <StatCard
          title="Registros Assinados"
          value={stats.assinados}
          icon={CheckCircle}
          note={isEngenheiroUser ? `${approvalPercentage}% assinados` : undefined}
        />
        {isEngenheiroUser && (
          <StatCard
            title="Aguardando Assinatura"
            value={stats.aguardando_assinatura}
            icon={FileSignature}
            note="Clique para visualizar"
            onClick={() => navigate(createPageUrl('MeusEnsaios'))}
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      <StatCard title="Obras Ativas" value={stats.obras} icon={Building2} />
      <StatCard title="Projetos" value={stats.projects} icon={FolderOpen} />
      <StatCard title="Total de Registros" value={stats.ensaios} icon={FlaskConical} />
      <StatCard title="Aprovados" value={stats.approved} icon={CheckCircle} note={`${approvalPercentage}% de aprovação`} />
      <StatCard title="Pendentes" value={stats.pending} icon={Clock} />
    </div>
  );
}