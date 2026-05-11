import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, CheckCircle2, XCircle, TrendingDown } from 'lucide-react';

export default function ControleLaboratoristas() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [obras, setObras] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroObra, setFiltroObra] = useState('todas');

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData?.role !== 'admin') {
        return;
      }

      // Buscar todas as obras
      const obrasData = await base44.entities.Obra.list();
      setObras(obrasData);

      // Buscar todos os registros de todas as entidades
      const [
        diariosObra,
        checklistsUsina,
        checklistsAplicacao,
        checklistsMRAF,
        checklistsConcretagem,
        checklistsTerraplanagem,
        checklistsReciclagem,
        ensaiosSondagem,
        ensaiosDensidadeInSitu,
        ensaiosTaxaPintura,
        ensaiosCAUQ,
        ensaiosMRAF,
        ensaiosDensidade,
        ensaiosGranAreia,
        ensaiosGranIndividual,
        acompanhamentosUsinagem
      ] = await Promise.all([
        base44.entities.DiarioObra.list(),
        base44.entities.ChecklistUsina.list(),
        base44.entities.ChecklistAplicacao.list(),
        base44.entities.ChecklistMRAF.list(),
        base44.entities.ChecklistConcretagem.list(),
        base44.entities.ChecklistTerraplanagem.list(),
        base44.entities.ChecklistReciclagem.list(),
        base44.entities.EnsaioSondagem.list(),
        base44.entities.EnsaioDensidadeInSitu.list(),
        base44.entities.EnsaioTaxaPinturaImprimacao.list(),
        base44.entities.EnsaioCAUQ.list(),
        base44.entities.EnsaioMRAF.list(),
        base44.entities.EnsaioDensidade.list(),
        base44.entities.EnsaioGranAreia.list(),
        base44.entities.EnsaioGranulometriaIndividual.list(),
        base44.entities.AcompanhamentoUsinagem.list()
      ]);

      // Combinar todos os registros
      const todosRegistros = [
        ...diariosObra,
        ...checklistsUsina,
        ...checklistsAplicacao,
        ...checklistsMRAF,
        ...checklistsConcretagem,
        ...checklistsTerraplanagem,
        ...checklistsReciclagem,
        ...ensaiosSondagem,
        ...ensaiosDensidadeInSitu,
        ...ensaiosTaxaPintura,
        ...ensaiosCAUQ,
        ...ensaiosMRAF,
        ...ensaiosDensidade,
        ...ensaiosGranAreia,
        ...ensaiosGranIndividual,
        ...acompanhamentosUsinagem
      ];

      setRegistros(todosRegistros);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const estatisticasLaboratoristas = useMemo(() => {
    const stats = {};

    registros.forEach(registro => {
      const labName = registro.laboratorista_name || registro.created_by?.split('@')[0] || 'Sem nome';
      const obraId = registro.obra_id;

      if (!stats[labName]) {
        stats[labName] = {
          nome: labName,
          total: 0,
          aprovados: 0,
          reprovados: 0,
          registrosPorObra: {}
        };
      }

      stats[labName].total++;

      if (obraId) {
        if (!stats[labName].registrosPorObra[obraId]) {
          stats[labName].registrosPorObra[obraId] = 0;
        }
        stats[labName].registrosPorObra[obraId]++;
      }

      if (registro.approved === true) {
        stats[labName].aprovados++;
      } else if (registro.approved === false) {
        stats[labName].reprovados++;
      }
    });

    // Calcular percentual de reprovação
    Object.values(stats).forEach(stat => {
      const totalAvaliados = stat.aprovados + stat.reprovados;
      stat.percentualReprovacao = totalAvaliados > 0 
        ? ((stat.reprovados / totalAvaliados) * 100).toFixed(1)
        : '0.0';
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [registros]);

  const laboratoristasFiltrados = useMemo(() => {
    return estatisticasLaboratoristas.filter(lab => {
      const matchNome = lab.nome.toLowerCase().includes(filtroNome.toLowerCase());
      const matchObra = filtroObra === 'todas' || lab.registrosPorObra[filtroObra] > 0;
      return matchNome && matchObra;
    });
  }, [estatisticasLaboratoristas, filtroNome, filtroObra]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#BFCF99]" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Acesso restrito a administradores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#00233B] mb-2">Controle de Laboratoristas</h1>
        <p className="text-gray-600">Estatísticas de registros por laboratorista</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filtro-nome">Nome do Laboratorista</Label>
              <Input
                id="filtro-nome"
                placeholder="Buscar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filtro-obra">Obra</Label>
              <Select value={filtroObra} onValueChange={setFiltroObra}>
                <SelectTrigger id="filtro-obra">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as obras</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Laboratoristas ({laboratoristasFiltrados.length})
            </CardTitle>
            <Badge variant="secondary" className="bg-[#BFCF99]/20 text-[#00233B]">
              {registros.length} registros totais
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Laboratorista</TableHead>
                  <TableHead className="text-center font-bold">Total de Registros</TableHead>
                  <TableHead className="text-center font-bold">Aprovados</TableHead>
                  <TableHead className="text-center font-bold">Reprovados</TableHead>
                  <TableHead className="text-center font-bold">% Reprovação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laboratoristasFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      Nenhum laboratorista encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  laboratoristasFiltrados.map((lab, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{lab.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {lab.total}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-700">{lab.aprovados}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-700">{lab.reprovados}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <TrendingDown className="w-4 h-4 text-orange-600" />
                          <span className={`font-bold ${
                            parseFloat(lab.percentualReprovacao) > 20 
                              ? 'text-red-600' 
                              : parseFloat(lab.percentualReprovacao) > 10 
                                ? 'text-orange-600' 
                                : 'text-green-600'
                          }`}>
                            {lab.percentualReprovacao}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}