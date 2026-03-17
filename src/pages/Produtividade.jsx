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

      const userAccessLevel = currentUser?.access_level || 'user';
      // Qualquer usuário com role='admin' vê tudo (independente do access_level)
      const isAdminPuro = currentUser?.role === 'admin';

      const [regionais, allUsers, obras] = await Promise.all([
        base44.entities.Regional.list(),
        base44.entities.User.list(),
        base44.entities.Obra.list()
      ]);

      // ── 1. Determinar quais regionais este usuário gerencia ──────────────────
      let regionaisVisiveis;
      if (isAdminPuro) {
        regionaisVisiveis = regionais; // Admin vê tudo
      } else {
        // Gestor/Sala técnica: só as regionais onde está cadastrado
        regionaisVisiveis = regionais.filter(r =>
          r.gestor_contrato_responsavel?.toLowerCase() === currentUser.email?.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(e => e.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (r.salas_tecnicas_responsaveis || []).some(e => e.toLowerCase() === currentUser.email?.toLowerCase())
        );
      }

      const regionaisVisiveisIds = regionaisVisiveis.map(r => r.id);

      // ── 2. Obras dessas regionais ────────────────────────────────────────────
      const obrasVisiveis = obras.filter(o => regionaisVisiveisIds.includes(o.regional_id));
      const obrasVisiveisIds = new Set(obrasVisiveis.map(o => o.id));

      // ── 3. Laboratoristas cadastrados nessas regionais ───────────────────────
      const labEmailsSet = new Set();
      if (isAdminPuro) {
        // Admin vê todos os usuários com role 'user' (sem access_level especial)
        allUsers.forEach(u => {
          if (!u.access_level && u.role !== 'admin') labEmailsSet.add(u.email.toLowerCase());
        });
      } else {
        regionaisVisiveis.forEach(r => {
          (r.laboratoristas_responsaveis || []).forEach(e => labEmailsSet.add(e.toLowerCase()));
        });
      }

      const labUsers = allUsers.filter(u => labEmailsSet.has(u.email.toLowerCase()));

      // ── 4. Empreiteiras e usinas das obras visíveis ──────────────────────────
      const empresasSet = new Set();
      const usinasSet = new Set();
      obrasVisiveis.forEach(obra => {
        (obra.empreiteiras || []).forEach(e => empresasSet.add(e));
        (obra.usinas || []).forEach(u => usinasSet.add(u));
      });
      setEmpreiteiras(Array.from(empresasSet).sort());
      setUsinas(Array.from(usinasSet).sort());

      // ── 5. Buscar todos os registros e marcadores ────────────────────────────
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const [
        diarios, checklistsUsina, checklistsAplicacao, checklistsMRAF,
        checklistsConcretagem, checklistsTerraplanagem, checklistsReciclagem,
        ensaiosCAUQ, ensaiosDensidade, ensaiosDensidadeInSitu, ensaiosGranAreia,
        ensaiosSondagem, ensaiosTaxaPintura, acompanhamentoCarga, produtividadeDiaria
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
        base44.entities.EnsaioGranAreia.list(),
        base44.entities.EnsaioSondagem.list(),
        base44.entities.EnsaioTaxaPinturaImprimacao.list(),
        base44.entities.AcompanhamentoCarga.list(),
        base44.entities.ProdutividadeDiaria.list()
      ]);

      // ── 6. Montar estrutura de produtividade ─────────────────────────────────
      const prodData = {};
      labUsers.forEach(lab => { prodData[lab.email.toLowerCase()] = {}; });

      // Marcadores manuais de dias
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

      // Processar registros finalizados dentro do mês e das obras visíveis
      const processarRegistros = (registros, entityName) => {
        registros.forEach(reg => {
          if (reg.status !== 'finalizado') return;
          if (!obrasVisiveisIds.has(reg.obra_id)) return;
          if (!reg.data || !reg.created_by) return;

          const email = reg.created_by.toLowerCase();
          if (!prodData[email]) return; // email não está na lista de labs visíveis

          const [y, m, d] = reg.data.split('-').map(Number);
          const regDate = new Date(y, m - 1, d);
          if (regDate < startDate || regDate > endDate) return;

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
      processarRegistros(ensaiosGranAreia, 'EnsaioGranAreia');
      processarRegistros(ensaiosSondagem, 'EnsaioSondagem');
      processarRegistros(ensaiosTaxaPintura, 'EnsaioTaxaPinturaImprimacao');
      processarRegistros(acompanhamentoCarga, 'AcompanhamentoCarga');

      setLaboratoristas(labUsers);
      setProdutividade(prodData);
      window.marcadoresDia = marcadoresDia;

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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

  const userCanEdit = user?.access_level === 'admin' || 
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

  return (
    <div className="min-h-screen bg-[#F2F1EF] p-6">
      <div className="max-w-[95vw] mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#BFCF99]" />
                <CardTitle className="text-2xl text-[#00233B]">
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
                  <tr className="bg-[#00233B]">
                    <th className="border border-[#BFCF99]/20 p-2 text-left text-[#F2F1EF] font-semibold sticky left-0 bg-[#00233B] z-10 min-w-[200px]">
                      Laboratorista
                    </th>
                    {days.map(day => (
                      <th
                        key={day}
                        className="border border-[#BFCF99]/20 p-2 text-center text-[#F2F1EF] font-medium min-w-[50px]"
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
                      className={index % 2 === 0 ? "bg-white" : "bg-[#F2F1EF]/50"}
                    >
                      <td className="border border-[#BFCF99]/20 p-2 sticky left-0 z-10 bg-inherit">
                        <div className="font-medium text-[#00233B]">
                          {lab.laboratorista_name || lab.full_name}
                        </div>
                        <div className="text-xs text-[#00233B]/60">
                          {lab.email}
                        </div>
                      </td>
                      {days.map(day => {
                        const registros = produtividade[lab.email]?.[day] || [];
                        const hasRegistros = registros.length > 0;
                        const markerKey = `${lab.email.toLowerCase()}_${day}`;
                        const markedStatus = window.marcadoresDia?.[markerKey];

                        return (
                          <td
                            key={day}
                            className="border border-[#BFCF99]/20 p-1 text-center align-middle"
                          >
                            {hasRegistros ? (
                              <div className="flex flex-col gap-0.5">
                                {registros.map((reg, idx) => {
                                   const temInfo = reg.empreiteira || reg.usina;
                                   const info = reg.empreiteira || reg.usina;
                                   return (
                                     <div
                                       key={idx}
                                       className={`${temInfo ? 'bg-green-500' : 'bg-orange-500'} text-white text-[10px] px-1 py-0.5 rounded font-medium ${userCanEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                                       title={`${reg.tipo}${temInfo ? ' - ' + info : ' - Sem empreiteira/usina'}`}
                                       onClick={() => userCanEdit && handleEditClick(reg)}
                                     >
                                       <div className="font-bold flex items-center justify-center gap-1">
                                         OK
                                         {userCanEdit && !temInfo && <Edit2 className="w-2 h-2" />}
                                       </div>
                                       <div className="truncate max-w-[60px]">
                                         {info || 'Definir'}
                                       </div>
                                     </div>
                                   );
                                 })}
                              </div>
                            ) : markedStatus ? (
                              <div className={`text-white text-xs px-1 py-1 rounded font-bold ${markedStatus === 'N/A' ? 'bg-blue-400' : 'bg-green-500'} ${userCanEdit ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => userCanEdit && setDiaDialog({ open: true, laborista: lab.email, dia: day })}>
                                {markedStatus}
                              </div>
                            ) : (
                              <div className="bg-yellow-400 text-[#00233B] text-xs px-1 py-1 rounded font-bold cursor-pointer hover:bg-yellow-500 transition-colors" onClick={() => userCanEdit && setDiaDialog({ open: true, laborista: lab.email, dia: day })}>
                                -
                              </div>
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
                <p className="text-[#00233B]/60">Nenhum laboratorista encontrado</p>
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