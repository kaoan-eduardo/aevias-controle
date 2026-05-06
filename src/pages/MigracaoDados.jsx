import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatabaseZap, Trash2, UserX, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MigracaoDados() {
  const [emailParaRemover, setEmailParaRemover] = useState('');
  const [removendoUsuario, setRemovendoUsuario] = useState(false);
  const [resultadoRemocao, setResultadoRemocao] = useState(null);

  const handleRemoverUsuarioRegionais = async () => {
    const emailBusca = emailParaRemover.trim().toLowerCase();
    if (!emailBusca) {
      alert("Por favor, informe o email do usuário.");
      return;
    }

    if (!window.confirm(`Você confirma a remoção do usuário "${emailBusca}" de TODAS as regionais em que ele estiver alocado? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setRemovendoUsuario(true);
    setResultadoRemocao(null);

    try {
      const regionais = await base44.entities.Regional.list();
      const regionaisAfetadas = [];

      for (const regional of regionais) {
        const updates = {};
        let temAlteracao = false;

        // Verificar e remover de laboratoristas_responsaveis
        if (Array.isArray(regional.laboratoristas_responsaveis)) {
          const filtrado = regional.laboratoristas_responsaveis.filter(e => e.toLowerCase() !== emailBusca);
          if (filtrado.length !== regional.laboratoristas_responsaveis.length) {
            updates.laboratoristas_responsaveis = filtrado;
            temAlteracao = true;
          }
        }

        // Verificar e remover de gestores_contrato_responsaveis
        if (Array.isArray(regional.gestores_contrato_responsaveis)) {
          const filtrado = regional.gestores_contrato_responsaveis.filter(e => e.toLowerCase() !== emailBusca);
          if (filtrado.length !== regional.gestores_contrato_responsaveis.length) {
            updates.gestores_contrato_responsaveis = filtrado;
            temAlteracao = true;
          }
        }

        // Verificar e remover de salas_tecnicas_responsaveis
        if (Array.isArray(regional.salas_tecnicas_responsaveis)) {
          const filtrado = regional.salas_tecnicas_responsaveis.filter(e => e.toLowerCase() !== emailBusca);
          if (filtrado.length !== regional.salas_tecnicas_responsaveis.length) {
            updates.salas_tecnicas_responsaveis = filtrado;
            temAlteracao = true;
          }
        }

        // Verificar e remover de clientes_responsaveis
        if (Array.isArray(regional.clientes_responsaveis)) {
          const filtrado = regional.clientes_responsaveis.filter(e => e.toLowerCase() !== emailBusca);
          if (filtrado.length !== regional.clientes_responsaveis.length) {
            updates.clientes_responsaveis = filtrado;
            temAlteracao = true;
          }
        }

        // Verificar e remover de gestor_contrato_responsavel (campo legado)
        if (regional.gestor_contrato_responsavel?.toLowerCase() === emailBusca) {
          updates.gestor_contrato_responsavel = null;
          temAlteracao = true;
        }

        if (temAlteracao) {
          await base44.entities.Regional.update(regional.id, updates);
          regionaisAfetadas.push(regional.nome);
        }
      }

      setResultadoRemocao({
        success: true,
        email: emailBusca,
        regionais: regionaisAfetadas
      });
      setEmailParaRemover('');
    } catch (error) {
      console.error("Erro ao remover usuário das regionais:", error);
      setResultadoRemocao({ success: false, error: error.message });
    } finally {
      setRemovendoUsuario(false);
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

        {/* Remover usuário de todas as regionais */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-500" />
              Remover Usuário de Todas as Regionais
            </CardTitle>
            <CardDescription className="text-[#00233B]/80">
              Informe o email do usuário para removê-lo de todos os campos de alocação em todas as regionais (laboratoristas, gestores, salas técnicas, clientes).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="emailRemover" className="text-[#00233B]">Email do usuário</Label>
                <Input
                  id="emailRemover"
                  type="email"
                  placeholder="usuario@email.com"
                  value={emailParaRemover}
                  onChange={(e) => { setEmailParaRemover(e.target.value); setResultadoRemocao(null); }}
                  disabled={removendoUsuario}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleRemoverUsuarioRegionais}
                disabled={removendoUsuario || !emailParaRemover.trim()}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {removendoUsuario ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removendo...</>
                ) : (
                  <><UserX className="w-4 h-4 mr-2" /> Remover das Regionais</>
                )}
              </Button>
            </div>

            {resultadoRemocao && (
              <div className={`p-3 rounded-lg border text-sm ${resultadoRemocao.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {resultadoRemocao.success ? (
                  resultadoRemocao.regionais.length > 0 ? (
                    <>
                      <p className="font-semibold">✅ Usuário "{resultadoRemocao.email}" removido com sucesso!</p>
                      <p className="mt-1">Regionais atualizadas ({resultadoRemocao.regionais.length}): {resultadoRemocao.regionais.join(', ')}</p>
                    </>
                  ) : (
                    <p>ℹ️ Usuário "{resultadoRemocao.email}" não foi encontrado em nenhuma regional.</p>
                  )
                ) : (
                  <p>❌ Erro ao remover: {resultadoRemocao.error}</p>
                )}
              </div>
            )}
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