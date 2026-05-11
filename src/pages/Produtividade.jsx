import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ProdutividadePage() {
  const [loading, setLoading] = useState(true);
  const [laboratoristas, setLaboratoristas] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [produtividade, setProdutividade] = useState({});
  const [user, setUser] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, registro: null });
  const [empreiteiras, setEmpreiteiras] = useState([]);
  const [usinas, setUsinas] = useState([]);
  const [diaDialog, setDiaDialog] = useState({ open: false, laborista: null, dia: null });
  const [cacheDias, setCacheDias] = useState({});

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const userAccessLevel = currentUser?.access_level || (currentUser?.role === 'admin' ? 'admin' : 'user');
      const isAdmin = userAccessLevel === 'admin';

      const [regionais, allUsers, obras] = await Promise.all([
        base44.entities.Regional.list(),
        base44.entities.User.list(),
        base44.entities.Obra.list()
      ]);

      // ── 1. Determinar obras visíveis conforme perfil ─────────────────────────
      let obrasVisiveisIds;
      if (isAdmin) {
        obrasVisiveisIds = new Set(obras.map(o => o.id));
      } else {
        const regionaisVisiveis = regionais.filter(r =>
          r.gestor_contrato_responsavel?.toLowerCase() === currentUser.email?.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(e => e.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (r.salas_tecnicas_responsaveis || []).some(e => e.toLowerCase() === currentUser.email?.toLowerCase())
        );
        const regionaisVisiveisIds = new Set(regionaisVisiveis.map(r => r.id));
        obrasVisiveisIds = new Set(obras.filter(o => regionaisVisiveisIds.has(o.regional_id)).map(o => o.id));
      }

      // ── 2. Empreiteiras e usinas das obras visíveis ──────────────────────────
      const empresasSet = new Set();
      const usinasSet = new Set();
      obras.forEach(obra => {
        if (!obrasVisiveisIds.has(obra.id)) return;
        (obra.empreiteiras || []).forEach(e => { empresasSet.add(e); });
        (obra.usinas || []).forEach(u => { usinasSet.add(u); });
      });
      setEmpreiteiras(Array.from(empresasSet).sort());
      setUsinas(Array.from(usinasSet).sort());

      // ── 3. Buscar todos os registros e marcadores ────────────────────────────
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      // Para o mês atual, limitar ao dia de hoje; para meses anteriores, usar o último dia do mês
      const todayLocal = new Date();
      const isViewingCurrentMonth = currentMonth.getFullYear() === todayLocal.getFullYear() &&
                                    currentMonth.getMonth() === todayLocal.getMonth();
      const endDate = isViewingCurrentMonth
        ? new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate())
        : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const [
        diarios, checklistsUsina, checklistsAplicacao, checklistsMRAF,
        checklistsConcretagem, checklistsTerraplanagem, checklistsReciclagem,
        ensaiosCAUQ, ensaiosDensidade, ensaiosDensidadeInSitu,
        ensaiosSondagem, ensaiosTaxaPintura, acompanhamentoCarga,
        ensaiosMRAF, ensaiosManchaPendulo, ensaiosVigaBenkelman, ensaiosTaxaMRAF,
        acompanhamentosUsinagem, ensaiosGranuIndividual, granuMisturas,
        ensaiosProctor, ensaiosRompimentoConcreto,
        boletinsSondagem, boletinsSondagemTrado,
        produtividadeDiaria
      ] = await Promise.all([
        base44.entities.DiarioObra.list(),
        base44.entities.ChecklistUsina.list(),
        base44.entities.ChecklistAplicacao.list(),
        base44.entities.ChecklistMRAF.list(),
        base44.entities.ChecklistConcretagem.list(),
        base44.entities.ChecklistTerraplanagem.list(),
        base44.entities.ChecklistReciclagem.list(),
        base44.entities.EnsaioCAUQ.list(),
        base44.entities.EnsaioDensidade.list(),
        base44.entities.EnsaioDensidadeInSitu.list(),
        base44.entities.EnsaioSondagem.list(),
        base44.entities.EnsaioTaxaPinturaImprimacao.list(),
        base44.entities.AcompanhamentoCarga.list(),
        base44.entities.EnsaioMRAF.list(),
        base44.entities.EnsaioManchaPendulo.list(),
        base44.entities.EnsaioVigaBenkelman.list(),
        base44.entities.EnsaioTaxaMRAF.list(),
        base44.entities.AcompanhamentoUsinagem.list(),
        base44.entities.EnsaioGranulometriaIndividual.list(),
        base44.entities.GranuMistura.list(),
        base44.entities.EnsaioProctor.list(),
        base44.entities.EnsaioRompimentoConcreto.list(),
        base44.entities.BoletimSondagem.list(),
        base44.entities.BoletimSondagemTrado.list(),
        base44.entities.ProdutividadeDiaria.list()
      ]);

      // ── 4. Processar registros — acumular por email ──────────────────────────
      // Cada entidade pode usar um campo de data diferente
      const DATE_FIELD = {
        DiarioObra: 'data',
        ChecklistUsina: 'data',
        ChecklistAplicacao: 'data',
        ChecklistMRAF: 'data',
        ChecklistConcretagem: 'data',
        ChecklistTerraplanagem: 'data',
        ChecklistReciclagem: 'data',
        EnsaioCAUQ: 'data_ensaio',
        EnsaioDensidade: 'extraction_date',
        EnsaioDensidadeInSitu: 'data_ensaio',
        EnsaioSondagem: 'data',
        EnsaioTaxaPinturaImprimacao: 'data_ensaio',
        AcompanhamentoCarga: 'data',
        EnsaioMRAF: 'data_ensaio',
        EnsaioManchaPendulo: 'data_ensaio',
        EnsaioVigaBenkelman: 'data_ensaio',
        EnsaioTaxaMRAF: 'data_ensaio',
        AcompanhamentoUsinagem: 'data',
        EnsaioGranulometriaIndividual: 'data_ensaio',
        GranuMistura: 'data',
        EnsaioProctor: 'data_ensaio',
        EnsaioRompimentoConcreto: 'data_ensaio',
        BoletimSondagem: 'data',
        BoletimSondagemTrado: 'data',
      };

      // prodData: { email: { dia: [registros] } }
      const prodData = {};

      // Entidades que não possuem campo status (sempre contam)
      const SEM_STATUS = new Set(['BoletimSondagem', 'BoletimSondagemTrado']);

      const processarRegistros = (registros, entityName) => {
        const dateField = DATE_FIELD[entityName] || 'data';
        registros.forEach(reg => {
          // Debug: log registros filtrados
          if (!obrasVisiveisIds.has(reg.obra_id)) {
            console.debug(`[Produtividade] ${entityName} (${reg.id}) descartado: obra_id="${reg.obra_id}" (não visível)`);
            return;
          }

          const rawDate = reg[dateField];
          if (!rawDate || !reg.created_by) {
            console.debug(`[Produtividade] ${entityName} (${reg.id}) descartado: data="${rawDate}" ou created_by="${reg.created_by}"`);
            return;
          }

          // Suporta "YYYY-MM-DD" e "YYYY-MM-DDTHH:mm:ss..."
          const datePart = rawDate.substring(0, 10);
          const [y, m, d] = datePart.split('-').map(Number);
          if (!y || !m || !d) {
            console.debug(`[Produtividade] ${entityName} (${reg.id}) descartado: data inválida "${rawDate}"`);
            return;
          }
          const regDate = new Date(y, m - 1, d);
          if (regDate < startDate || regDate > endDate) {
            console.debug(`[Produtividade] ${entityName} (${reg.id}) descartado: data ${regDate.toLocaleDateString()} fora do intervalo`);
            return;
          }

          const email = reg.created_by.toLowerCase();
          if (!prodData[email]) prodData[email] = {};
          const dia = regDate.getDate();
          if (!prodData[email][dia]) prodData[email][dia] = [];
          prodData[email][dia].push({
            id: reg.id,
            tipo: entityName,
            empreiteira: reg.empreiteira || '',
            usina: reg.usina_selecionada || reg.usina || '',
            entityName
          });
        });
      };

      processarRegistros(diarios, 'DiarioObra');
      processarRegistros(checklistsUsina, 'ChecklistUsina');
      processarRegistros(checklistsAplicacao, 'ChecklistAplicacao');
      processarRegistros(checklistsMRAF, 'ChecklistMRAF');
      processarRegistros(checklistsConcretagem, 'ChecklistConcretagem');
      processarRegistros(checklistsTerraplanagem, 'ChecklistTerraplanagem');
      processarRegistros(checklistsReciclagem, 'ChecklistReciclagem');
      processarRegistros(ensaiosCAUQ, 'EnsaioCAUQ');
      processarRegistros(ensaiosDensidade, 'EnsaioDensidade');
      processarRegistros(ensaiosDensidadeInSitu, 'EnsaioDensidadeInSitu');
      processarRegistros(ensaiosSondagem, 'EnsaioSondagem');
      processarRegistros(ensaiosTaxaPintura, 'EnsaioTaxaPinturaImprimacao');
      processarRegistros(acompanhamentoCarga, 'AcompanhamentoCarga');
      processarRegistros(ensaiosMRAF, 'EnsaioMRAF');
      processarRegistros(ensaiosManchaPendulo, 'EnsaioManchaPendulo');
      processarRegistros(ensaiosVigaBenkelman, 'EnsaioVigaBenkelman');
      processarRegistros(ensaiosTaxaMRAF, 'EnsaioTaxaMRAF');
      processarRegistros(acompanhamentosUsinagem, 'AcompanhamentoUsinagem');
      processarRegistros(ensaiosGranuIndividual, 'EnsaioGranulometriaIndividual');
      processarRegistros(granuMisturas, 'GranuMistura');
      processarRegistros(ensaiosProctor, 'EnsaioProctor');
      processarRegistros(ensaiosRompimentoConcreto, 'EnsaioRompimentoConcreto');
      processarRegistros(boletinsSondagem, 'BoletimSondagem');
      processarRegistros(boletinsSondagemTrado, 'BoletimSondagemTrado');

      // ── 5. Marcadores manuais de dias ────────────────────────────────────────
      const marcadoresDia = {};
      produtividadeDiaria.forEach(marc => {
        if (!marc.data || !marc.laboratorista_email) return;
        const [y, m, d] = marc.data.split('-').map(Number);
        const marcDate = new Date(y, m - 1, d);
        if (marcDate >= startDate && marcDate <= endDate) {
          const key = `${marc.laboratorista_email.toLowerCase()}_${marcDate.getDate()}`;
          marcadoresDia[key] = marc.status;
        }
      });

      // ── 6. Montar lista de laboratoristas que lançaram registros no mês ──────
      // Exibe todos os usuários que lançaram registros válidos no mês,
      // sem filtrar por position (campo pode não estar preenchido).
      const emailsComRegistros = new Set(Object.keys(prodData));
      const usersByEmail = Object.fromEntries(allUsers.map(u => [u.email.toLowerCase(), u]));
      const labUsers = Array.from(emailsComRegistros).map(email => {
        // Se não encontrar o usuário cadastrado, cria um objeto mínimo com o email
        return usersByEmail[email] || { email, full_name: email, laboratorista_name: email };
      });

      // Garantir que prodData tenha entrada para cada lab (mesmo sem registros não chegará aqui)
      labUsers.forEach(lab => {
        if (!prodData[lab.email.toLowerCase()]) prodData[lab.email.toLowerCase()] = {};
      });

      setLaboratoristas(labUsers.sort((a, b) => (a.laboratorista_name || a.full_name || '').localeCompare(b.laboratorista_name || b.full_name || '')));
      setProdutividade(prodData);
      window.marcadoresDia = marcadoresDia;

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  const getMonthName = (date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const ENSAIO_LABELS = {
    DiarioObra: 'Diário de Obra',
    ChecklistUsina: 'CL Usina',
    ChecklistAplicacao: 'CL Aplicação',
    ChecklistMRAF: 'CL MRAF',
    ChecklistConcretagem: 'CL Concretagem',
    ChecklistTerraplanagem: 'CL Terraplanagem',
    ChecklistReciclagem: 'CL Reciclagem',
    EnsaioCAUQ: 'Ensaio CAUQ',
    EnsaioDensidade: 'Densidade CP',
    EnsaioDensidadeInSitu: 'Dens. In Situ',
    EnsaioSondagem: 'Sondagem',
    EnsaioTaxaPinturaImprimacao: 'Taxa Pintura',
    AcompanhamentoCarga: 'Ac. Carga',
    EnsaioMRAF: 'Ensaio MRAF',
    EnsaioManchaPendulo: 'Mancha+Pêndulo',
    EnsaioVigaBenkelman: 'Viga Benkelman',
    EnsaioTaxaMRAF: 'Taxa MRAF',
    AcompanhamentoUsinagem: 'Ac. Usinagem',
    EnsaioGranulometriaIndividual: 'Granu. Indiv.',
    GranuMistura: 'Granu. Mistura',
    EnsaioProctor: 'Proctor',
    EnsaioRompimentoConcreto: 'Romp. Concreto',
    BoletimSondagem: 'Boletim Sond.',
    BoletimSondagemTrado: 'Boletim Trado',
  };

  const getDayOfWeek = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  };

  const handleEditClick = (registro) => {
    setEditDialog({ open: true, registro });
  };

  const handleSaveEmpreiteiraOuUsina = async (novoValor, tipo) => {
    if (!editDialog.registro) return;
    
    try {
      const entityName = editDialog.registro.entityName;
      const updateData = tipo === 'empreiteira' 
        ? { empreiteira: novoValor }
        : { usina_selecionada: novoValor, usina: novoValor };
      
      await base44.entities[entityName].update(editDialog.registro.id, updateData);
      
      setEditDialog({ open: false, registro: null });
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar");
    }
  };

  const handleSaveDiaStatus = (status) => {
    if (!diaDialog.laborista || !diaDialog.dia) return;
    
    const key = `${diaDialog.laborista.toLowerCase()}_${diaDialog.dia}`;
    const dataStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(diaDialog.dia).padStart(2, '0')}`;
    
    const newCache = {
      ...cacheDias,
      [key]: { status, data: dataStr, laborista: diaDialog.laborista }
    };
    setCacheDias(newCache);
    window.marcadoresDia[key] = status;
    
    setDiaDialog({ open: false, laborista: null, dia: null });
  };

  const userCanEdit = user?.role === 'admin' || 
                            user?.access_level === 'admin' || 
                            user?.access_level === 'gestor_contrato' || 
                            user?.access_level === 'sala_tecnica_afirmaevias';

  const handleSaveCache = async () => {
    if (Object.keys(cacheDias).length === 0) {
      alert("Nenhuma alteração para salvar");
      return;
    }

    try {
      for (const [key, item] of Object.entries(cacheDias)) {
        const existente = await base44.entities.ProdutividadeDiaria.filter({
          laboratorista_email: item.laborista,
          data: item.data
        });

        if (existente.length > 0) {
          await base44.entities.ProdutividadeDiaria.update(existente[0].id, { status: item.status });
        } else {
          await base44.entities.ProdutividadeDiaria.create({
            laboratorista_email: item.laborista,
            data: item.data,
            status: item.status
          });
        }
      }

      setCacheDias({});
      alert("Dados salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
      alert("Erro ao salvar dados");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#BFCF99]" />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Hoje em hora local — para marcar dias futuros no mês atual
  const today = new Date();
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() &&
                          currentMonth.getMonth() === today.getMonth();
  const isFutureDay = (day) => isCurrentMonth && day > today.getDate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[95vw] mx-auto">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#BFCF99]" />
                <CardTitle className="text-2xl text-foreground">
                  Produtividade dos Laboratoristas
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={previousMonth}
                  className="border-[#BFCF99]/30 hover:bg-[#BFCF99]/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold text-[#00233B] min-w-[200px] text-center capitalize">
                  {getMonthName(currentMonth)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className="border-[#BFCF99]/30 hover:bg-[#BFCF99]/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {Object.keys(cacheDias).length > 0 && userCanEdit && (
                  <Button
                    onClick={handleSaveCache}
                    className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 ml-4"
                  >
                    Salvar {Object.keys(cacheDias).length} alterações
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary">
                    <th className="border border-border p-2 text-left text-primary-foreground font-semibold sticky left-0 bg-primary z-10 min-w-[200px]">
                      Laboratorista
                    </th>
                    {days.map(day => (
                      <th
                        key={day}
                        className="border border-border p-2 text-center text-primary-foreground font-medium min-w-[50px]"
                      >
                        <div className="text-xs">{getDayOfWeek(day)}</div>
                        <div className="text-sm font-bold">{day}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {laboratoristas.map((lab, index) => (
                    <tr
                      key={lab.email}
                      className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    >
                      <td className="border border-border p-2 sticky left-0 z-10 bg-inherit">
                        <div className="font-medium text-foreground">
                          {lab.laboratorista_name || lab.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lab.email}
                        </div>
                      </td>
                      {days.map(day => {
                       const registros = produtividade[lab.email.toLowerCase()]?.[day] || [];
                       const hasRegistros = registros.length > 0;
                       const markerKey = `${lab.email.toLowerCase()}_${day}`;
                       const markedStatus = window.marcadoresDia?.[markerKey];
                       const futureDay = isFutureDay(day);

                       return (
                         <td
                           key={day}
                           className={`border border-border p-1 text-center align-middle ${futureDay ? 'bg-muted/20 opacity-40' : ''}`}
                         >
                           {futureDay ? null : hasRegistros ? (
                              <div className="flex flex-col gap-0.5">
                                {registros.map((reg, idx) => {
                                   const temInfo = reg.empreiteira || reg.usina;
                                   const info = reg.empreiteira || reg.usina;
                                   return (
                                     <button
                                       key={idx}
                                       type="button"
                                       disabled={!userCanEdit}
                                       className={`${temInfo ? 'bg-green-500' : 'bg-orange-500'} text-white text-[10px] px-1 py-0.5 rounded font-medium ${userCanEdit ? 'cursor-pointer hover:opacity-80' : ''} text-left w-full`}
                                      title={`${reg.tipo}${temInfo ? ' - ' + info : ' - Sem empreiteira/usina'}`}
                                      onClick={() => handleEditClick(reg)}
                                     >
                                      <div className="text-[9px] font-semibold opacity-90 truncate max-w-[60px]">
                                        {ENSAIO_LABELS[reg.entityName] || reg.entityName}
                                      </div>
                                      <div className="font-bold flex items-center justify-center gap-1">
                                        OK
                                        {userCanEdit && !temInfo && <Edit2 className="w-2 h-2" />}
                                      </div>
                                      <div className="truncate max-w-[60px]">
                                        {info || 'Definir'}
                                      </div>
                                     </button>
                                   );
                                 })}
                              </div>
                            ) : markedStatus ? (
                              <button
                                type="button"
                                disabled={!userCanEdit}
                                className={`text-white text-xs px-1 py-1 rounded font-bold ${markedStatus === 'N/A' ? 'bg-blue-400' : 'bg-green-500'} ${userCanEdit ? 'cursor-pointer hover:opacity-80' : ''} w-full`}
                                onClick={() => setDiaDialog({ open: true, laborista: lab.email, dia: day })}
                              >
                                {markedStatus}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!userCanEdit}
                                className="bg-yellow-400 text-[#00233B] text-xs px-1 py-1 rounded font-bold cursor-pointer hover:bg-yellow-500 transition-colors w-full"
                                onClick={() => setDiaDialog({ open: true, laborista: lab.email, dia: day })}
                              >
                                -
                              </button>
                            )}
                          </td>
                        );
                      })}

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {laboratoristas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum laboratorista encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para editar empreiteira ou usina */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, registro: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Empreiteira ou Usina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Empreiteira Atendida</Label>
              <Select
                value={editDialog.registro?.empreiteira || ""}
                onValueChange={(value) => handleSaveEmpreiteiraOuUsina(value, 'empreiteira')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empreiteira" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhuma</SelectItem>
                  {empreiteiras.map(emp => (
                    <SelectItem key={emp} value={emp}>
                      {emp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-center text-sm text-gray-500">
              <span className="px-2">ou</span>
            </div>
            
            <div>
              <Label>Usina</Label>
              <Select
                value={editDialog.registro?.usina || ""}
                onValueChange={(value) => handleSaveEmpreiteiraOuUsina(value, 'usina')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a usina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhuma</SelectItem>
                  {usinas.map(usina => (
                    <SelectItem key={usina} value={usina}>
                      {usina}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog({ open: false, registro: null })}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para marcar dia como N/A ou OK */}
      <Dialog open={diaDialog.open} onOpenChange={(open) => !open && setDiaDialog({ open: false, laborista: null, dia: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Dia {diaDialog.dia}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Nenhum registro encontrado para este dia. Marque como:
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDiaDialog({ open: false, laborista: null, dia: null })}>
                Cancelar
              </Button>
              <Button variant="secondary" onClick={() => handleSaveDiaStatus('N/A')} className="bg-blue-400 hover:bg-blue-500 text-white">
                N/A
              </Button>
              <Button onClick={() => handleSaveDiaStatus('OK')} className="bg-green-500 hover:bg-green-600 text-white">
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}