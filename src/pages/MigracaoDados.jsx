import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseZap, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MigracaoDados() {

  const handleRunMigration = async () => {
    if (window.confirm("Você tem certeza que deseja executar a migração das peneiras para os projetos? Esta ação não pode ser desfeita.")) {
      try {
        const { data } = await base44.functions.invoke('migrarPeneirasProjects');
        alert(`Migração concluída! Detalhes: ${JSON.stringify(data)}`);
      } catch (error) {
        console.error("Erro na migração:", error);
        alert(`Erro ao executar a migração: ${error.message}`);
      }
    }
  };
  
  const handleCleanMigration = async () => {
    if (window.confirm("ATENÇÃO: Você tem certeza que deseja LIMPAR TODOS os dados de peneiras dos projetos? Esta ação é IRREVERSÍVEL.")) {
      try {
        const { data } = await base44.functions.invoke('limparTodasPeneirasProjects');
        alert(`Limpeza concluída! Detalhes: ${JSON.stringify(data)}`);
      } catch (error) {
        console.error("Erro na limpeza:", error);
        alert(`Erro ao executar a limpeza: ${error.message}`);
      }
    }
  };

  const handleCorrigirNomesDiario = async () => {
    if (window.confirm("Deseja corrigir os nomes dos laboratoristas nos diários de obra?")) {
      try {
        const { data } = await base44.functions.invoke('corrigirNomesDiarioObra');
        alert(`Correção concluída! ${data.atualizados} diários atualizados.`);
      } catch (error) {
        console.error("Erro na correção:", error);
        alert(`Erro ao executar a correção: ${error.message}`);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#00233B]">Migração de Dados</h1>
            <p className="text-[#00233B]/80 mt-1">Ferramentas para migração e manutenção de dados do sistema.</p>
        </div>

        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B]">Migração de Peneiras para Projetos</CardTitle>
            <CardDescription className="text-[#00233B]/80">
              Esta ação irá ler as Faixas Granulométricas e preencher os campos `faixa_trabalho_min` e `faixa_trabalho_max` em todos os Projetos existentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleRunMigration} className="w-full sm:w-auto bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                <DatabaseZap className="w-4 h-4 mr-2 text-[#BFCF99]" />
                Executar Migração
              </Button>
               <Button onClick={handleCleanMigration} variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Dados de Peneiras (CUIDADO)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B]">Corrigir Nomes de Laboratoristas</CardTitle>
            <CardDescription className="text-[#00233B]/80">
              Atualiza os nomes dos laboratoristas nos diários de obra, substituindo usernames de email pelos nomes completos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCorrigirNomesDiario} className="w-full sm:w-auto bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
              <DatabaseZap className="w-4 h-4 mr-2 text-[#BFCF99]" />
              Corrigir Nomes nos Diários
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}