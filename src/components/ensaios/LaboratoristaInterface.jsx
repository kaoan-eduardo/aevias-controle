// Interface de visualização para laboratoristas (cards por status)
import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnsaioCard from "./EnsaioCard";

const LaboratoristaInterface = React.memo(({ ensaios, obras, user, allUsers }) => {
  const emExecucao = useMemo(() =>
    ensaios.filter((e) => (e.status === 'rascunho' || e.approved === false) && !e.client_signature?.signed_by),
    [ensaios]
  );

  const pendentes = useMemo(() =>
    ensaios.filter((e) => {
      const isFinalizadoOuSemStatus = e.status === 'finalizado' || (!e.status && e.status !== 'rascunho');
      return isFinalizadoOuSemStatus && e.approved === null && !e.client_signature?.signed_by && e.approved !== false;
    }),
    [ensaios]
  );

  const aprovados = useMemo(() =>
    ensaios.filter((e) => e.approved === true || e.client_signature?.signed_by),
    [ensaios]
  );

  const triggerClass = "data-[state=active]:bg-white/40 data-[state=active]:text-[#00233B] data-[state=active]:border-b-2 data-[state=active]:border-[#BFCF99] text-[#00233B]/80 hover:bg-black/5 flex flex-col items-center gap-0.5 py-2 px-1";

  const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="text-center py-12 text-[#00233B]/70">
      <Icon className="w-16 h-16 text-[#00233B]/30 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-[#00233B] mb-2">{title}</h3>
      <p>{subtitle}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="emExecucao" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-lg border border-white/20 h-auto">
          <TabsTrigger value="emExecucao" className={triggerClass}>
            <span className="text-xs leading-tight text-center">Em Execução</span>
            <Badge className="text-xs">{emExecucao.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pendentes" className={triggerClass}>
            <span className="text-xs leading-tight text-center">Pendentes</span>
            <Badge className="text-xs">{pendentes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="aprovados" className={triggerClass}>
            <span className="text-xs leading-tight text-center">Aprovados</span>
            <Badge className="text-xs">{aprovados.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emExecucao" className="mt-4 space-y-4">
          {emExecucao.length > 0
            ? emExecucao.map((ensaio) => <EnsaioCard key={ensaio.id} ensaio={ensaio} obra={obras.find((o) => o.id === ensaio.obra_id)} user={user} allUsers={allUsers} />)
            : <EmptyState icon={FileText} title="Nenhum registro em execução" subtitle="Comece criando um novo registro ou finalize os em rascunho." />
          }
        </TabsContent>

        <TabsContent value="pendentes" className="mt-4 space-y-4">
          {pendentes.length > 0
            ? pendentes.map((ensaio) => <EnsaioCard key={ensaio.id} ensaio={ensaio} obra={obras.find((o) => o.id === ensaio.obra_id)} user={user} allUsers={allUsers} />)
            : <EmptyState icon={FileText} title="Nenhum registro pendente" subtitle="Todos os ensaios e diários estão aprovados ou não há registros." />
          }
        </TabsContent>

        <TabsContent value="aprovados" className="mt-4 space-y-4">
          {aprovados.length > 0
            ? aprovados.map((ensaio) => <EnsaioCard key={ensaio.id} ensaio={ensaio} obra={obras.find((o) => o.id === ensaio.obra_id)} user={user} allUsers={allUsers} />)
            : <EmptyState icon={CheckCircle} title="Nenhum registro aprovado ainda" subtitle="Aguarde a aprovação dos ensaios pelo administrador." />
          }
        </TabsContent>
      </Tabs>
    </div>
  );
});

LaboratoristaInterface.displayName = 'LaboratoristaInterface';
export default LaboratoristaInterface;