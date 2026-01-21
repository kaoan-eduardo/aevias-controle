import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, CheckCircle, FileText, Users } from "lucide-react";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { DiarioObra } from "@/entities/DiarioObra";
import { EnsaioDensidade } from "@/entities/EnsaioDensidade";
import { ChecklistUsina } from "@/entities/ChecklistUsina";
import { ChecklistAplicacao } from "@/entities/ChecklistAplicacao";
import { ChecklistMRAF } from "@/entities/ChecklistMRAF";
import { ChecklistConcretagem } from "@/entities/ChecklistConcretagem";
import { base44 } from "@/api/base44Client";

export default function MonitorProdutividade() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [gestoresData, setGestoresData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Verificar se é admin
      if (user.role !== 'admin' && user.access_level !== 'admin') {
        alert('Acesso negado. Esta página é exclusiva para administradores.');
        return;
      }

      // Carregar dados
      const [todosUsuarios, regionaisData, obrasData] = await Promise.all([
        base44.entities.User.list(),
        Regional.list(),
        Obra.list(),
      ]);

      // Carregar todos os registros
      const [
        diariosData,
        ensaiosCAUQData,
        densidadeData,
        densidadeInSituData,
        taxaPinturaData,
        checklistsData,
        checklistsAplicacaoData,
        checklistsMRAFData,
        checklistsConcretagemData,
        checklistsTerraplanamemData,
        sondagemData
      ] = await Promise.all([
        DiarioObra.list("-created_date", 500),
        base44.entities.EnsaioCAUQ.list("-created_date", 500),
        EnsaioDensidade.list("-created_date", 500),
        base44.entities.EnsaioDensidadeInSitu.list("-created_date", 500),
        base44.entities.EnsaioTaxaPinturaImprimacao.list("-created_date", 500),
        ChecklistUsina.list("-created_date", 500),
        ChecklistAplicacao.list("-created_date", 500),
        ChecklistMRAF.list("-created_date", 500),
        ChecklistConcretagem.list("-created_date", 500),
        base44.entities.ChecklistTerraplanagem.list("-created_date", 500),
        base44.entities.EnsaioSondagem.list("-created_date", 500)
      ]);

      const todosRegistros = [
        ...diariosData,
        ...ensaiosCAUQData,
        ...densidadeData,
        ...densidadeInSituData,
        ...taxaPinturaData,
        ...checklistsData,
        ...checklistsAplicacaoData,
        ...checklistsMRAFData,
        ...checklistsConcretagemData,
        ...checklistsTerraplanamemData,
        ...sondagemData
      ];

      // Identificar gestores de contrato
      const gestores = todosUsuarios.filter(u => 
        u.access_level === 'gestor_contrato' || 
        regionaisData.some(r => 
          r.gestor_contrato_responsavel?.toLowerCase() === u.email?.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(email => email.toLowerCase() === u.email?.toLowerCase())
        )
      );

      // Calcular métricas para cada gestor
      const gestoresComMetricas = gestores.map(gestor => {
        // Encontrar regionais do gestor
        const regionaisDoGestor = regionaisData.filter(r => 
          r.gestor_contrato_responsavel?.toLowerCase() === gestor.email?.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(email => email.toLowerCase() === gestor.email?.toLowerCase())
        );

        const regionaisIds = regionaisDoGestor.map(r => r.id);
        const obrasDoGestor = obrasData.filter(o => regionaisIds.includes(o.regional_id));
        const obrasIds = obrasDoGestor.map(o => o.id);

        // Contar registros criados nas obras do gestor
        const registrosCriados = todosRegistros.filter(r => obrasIds.includes(r.obra_id));

        // Contar registros aprovados pelo gestor (somente das obras dele)
        const registrosAprovados = registrosCriados.filter(r => 
          r.approved === true && 
          r.approved_by?.toLowerCase() === gestor.email?.toLowerCase()
        );

        // Calcular taxa de aprovação
        const taxaAprovacao = registrosCriados.length > 0 
          ? ((registrosAprovados.length / registrosCriados.length) * 100).toFixed(1)
          : 0;

        return {
          gestor,
          regionais: regionaisDoGestor,
          totalObras: obrasDoGestor.length,
          registrosCriados: registrosCriados.length,
          registrosAprovados: registrosAprovados.length,
          registrosPendentes: registrosCriados.filter(r => r.approved === null && r.status === 'finalizado').length,
          registrosReprovados: registrosCriados.filter(r => r.approved === false).length,
          taxaAprovacao
        };
      });

      // Ordenar por número de registros criados (maior para menor)
      gestoresComMetricas.sort((a, b) => b.registrosCriados - a.registrosCriados);

      setGestoresData(gestoresComMetricas);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert('Erro ao carregar dados do monitor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/50" />
            <p className="text-[#00233B]/80 mt-2">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.access_level !== 'admin')) {
    return (
      <div className="p-6 min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-red-800">Acesso Negado</h2>
              <p className="text-red-600 mt-2">Esta página é exclusiva para administradores.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalRegistrosCriados = gestoresData.reduce((sum, g) => sum + g.registrosCriados, 0);
  const totalRegistrosAprovados = gestoresData.reduce((sum, g) => sum + g.registrosAprovados, 0);
  const mediaAprovacao = gestoresData.length > 0 
    ? (gestoresData.reduce((sum, g) => sum + parseFloat(g.taxaAprovacao), 0) / gestoresData.length).toFixed(1)
    : 0;

  return (
    <div className="p-6 min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#00233B]">Monitor de Produtividade</h1>
          <p className="text-[#00233B]/80 mt-1">Acompanhamento da produtividade dos Gestores de Contrato</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#00233B]/80 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#BFCF99]" />
                Gestores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00233B]">{gestoresData.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#00233B]/80 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#BFCF99]" />
                Total de Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00233B]">{totalRegistrosCriados}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#00233B]/80 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#566E3D]" />
                Total Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#566E3D]">{totalRegistrosAprovados}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#00233B]/80 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#BFCF99]" />
                Taxa Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00233B]">{mediaAprovacao}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de gestores */}
        <div className="space-y-4">
          {gestoresData.map((gestorData) => (
            <Card key={gestorData.gestor.id} className="bg-white/20 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-[#00233B]">
                      {gestorData.gestor.laboratorista_name || gestorData.gestor.full_name}
                    </CardTitle>
                    <p className="text-sm text-[#00233B]/70 mt-1">{gestorData.gestor.email}</p>
                    <div className="flex gap-2 mt-2">
                      {gestorData.regionais.map(r => (
                        <Badge key={r.id} variant="outline" className="text-xs">
                          {r.nome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge className={`${
                    parseFloat(gestorData.taxaAprovacao) >= 80 ? 'bg-[#566E3D]/10 text-[#566E3D]' :
                    parseFloat(gestorData.taxaAprovacao) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {gestorData.taxaAprovacao}% aprovação
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-black/5 rounded-lg">
                    <div className="text-xs text-[#00233B]/70 mb-1">Obras</div>
                    <div className="text-xl font-bold text-[#00233B]">{gestorData.totalObras}</div>
                  </div>
                  <div className="text-center p-3 bg-black/5 rounded-lg">
                    <div className="text-xs text-[#00233B]/70 mb-1">Registros Criados</div>
                    <div className="text-xl font-bold text-[#00233B]">{gestorData.registrosCriados}</div>
                  </div>
                  <div className="text-center p-3 bg-[#566E3D]/10 rounded-lg">
                    <div className="text-xs text-[#566E3D]/90 mb-1">Aprovados</div>
                    <div className="text-xl font-bold text-[#566E3D]">{gestorData.registrosAprovados}</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-100/50 rounded-lg">
                    <div className="text-xs text-yellow-800/90 mb-1">Pendentes</div>
                    <div className="text-xl font-bold text-yellow-800">{gestorData.registrosPendentes}</div>
                  </div>
                  <div className="text-center p-3 bg-red-100/50 rounded-lg">
                    <div className="text-xs text-red-800/90 mb-1">Reprovados</div>
                    <div className="text-xl font-bold text-red-800">{gestorData.registrosReprovados}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {gestoresData.length === 0 && (
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-[#00233B]/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#00233B] mb-2">
                Nenhum gestor encontrado
              </h3>
              <p className="text-[#00233B]/70">
                Não há gestores de contrato cadastrados no sistema.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}