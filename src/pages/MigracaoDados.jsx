import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatabaseZap, Trash2, UserX, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MigracaoDados() {
  const [emailRemover, setEmailRemover] = useState('');
  const [removingUser, setRemovingUser] = useState(false);

  const handleRemoverUsuarioRegionais = async () => {
    const email = emailRemover.trim().toLowerCase();
    if (!email) {
      alert('Digite um e-mail válido.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja remover "${email}" de todas as regionais onde está alocado?`)) return;

    setRemovingUser(true);
    try {
      const regionais = await base44.entities.Regional.list();
      const camposParaVerificar = [
        'laboratoristas_responsaveis',
        'gestores_contrato_responsaveis',
        'salas_tecnicas_responsaveis',
        'clientes_responsaveis'
      ];

      const regionaisAfetadas = [];

      for (const regional of regionais) {
        const updateData = {};
        let foiAfetada = false;

        for (const campo of camposParaVerificar) {
          const lista = regional[campo];
          if (Array.isArray(lista) && lista.some(e => e.toLowerCase() === email)) {
            updateData[campo] = lista.filter(e => e.toLowerCase() !== email);
            foiAfetada = true;
          }
        }

        // Verificar campo legado gestor_contrato_responsavel (string única)
        if (regional.gestor_contrato_responsavel?.toLowerCase() === email) {
          updateData.gestor_contrato_responsavel = null;
          foiAfetada = true;
        }

        if (foiAfetada) {
          await base44.entities.Regional.update(regional.id, updateData);
          regionaisAfetadas.push(regional.nome);
        }
      }

      if (regionaisAfetadas.length === 0) {
        alert(`Usuário "${email}" não foi encontrado em nenhuma regional.`);
      } else {
        alert(`Usuário "${email}" removido de ${regionaisAfetadas.length} regional(is):\n${regionaisAfetadas.join('\n')}`);
        setEmailRemover('');
      }
    } catch (error) {
      console.error('Erro ao remover usuário das regionais:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setRemovingUser(false);
    }
  };

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

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#00233B]">Migração de Dados</h1>
            <p className="text-[#00233B]/80 mt-1">Ferramentas para migração e manutenção de dados do sistema.</p>
        </div>

        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] flex items-center gap-2">
              <UserX className="w-5 h-5 text-[#BFCF99]" />
              Remover Usuário de Todas as Regionais
            </CardTitle>
            <CardDescription className="text-[#00233B]/80">
              Busca o usuário pelo e-mail em todas as regionais e o remove de qualquer lista onde estiver alocado (laboratoristas, gestores, salas técnicas, clientes).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="emailRemover" className="text-[#00233B]">E-mail do usuário</Label>
                <Input
                  id="emailRemover"
                  type="email"
                  value={emailRemover}
                  onChange={(e) => setEmailRemover(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="mt-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleRemoverUsuarioRegionais()}
                />
              </div>
              <Button
                onClick={handleRemoverUsuarioRegionais}
                disabled={removingUser || !emailRemover.trim()}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {removingUser ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removendo...</>
                ) : (
                  <><UserX className="w-4 h-4 mr-2" /> Remover de Todas as Regionais</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}