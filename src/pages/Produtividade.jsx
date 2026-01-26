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

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [regionais, allUsers, obras] = await Promise.all([
        base44.entities.Regional.list(),
        base44.entities.User.list(),
        base44.entities.Obra.list()
      ]);

      const userAccessLevel = currentUser?.access_level || (currentUser?.role === 'admin' ? 'admin' : 'user');

      // Filtrar regionais baseado no usuário
      let regionaisDoGestor = regionais;
      if (userAccessLevel === 'gestor_contrato' || userAccessLevel === 'sala_tecnica_afirmaevias') {
        regionaisDoGestor = regionais.filter(r => 
          r.gestor_contrato_responsavel?.toLowerCase() === currentUser.email?.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(email => email.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (r.salas_tecnicas_responsaveis || []).some(email => email.toLowerCase() === currentUser.email?.toLowerCase())
        );
      }

      console.log('User access level:', userAccessLevel);
      console.log('Total regionais:', regionais.length);
      console.log('Regionais do gestor:', regionaisDoGestor.length);

      // Coletar laboratoristas únicos das regionais filtradas
      const labEmails = new Set();
      regionaisDoGestor.forEach(regional => {
        const labs = regional.laboratoristas_responsaveis || [];
        labs.forEach(email => labEmails.add(email.toLowerCase()));
      });

      console.log('Emails de laboratoristas encontrados:', Array.from(labEmails));

      // Buscar dados dos usuários laboratoristas
      const labUsers = allUsers.filter(u => 
        labEmails.has(u.email.toLowerCase())
      );

      console.log('Laboratoristas encontrados:', labUsers.length);

      setLaboratoristas(labUsers);

      // Coletar empreiteiras apenas das obras das regionais do gestor
      const regionaisIds = regionaisDoGestor.map(r => r.id);
      const obrasDoGestor = obras.filter(o => regionaisIds.includes(o.regional_id));
      
      const empresasSet = new Set();
      obrasDoGestor.forEach(obra => {
        if (obra.empreiteiras && Array.isArray(obra.empreiteiras)) {
          obra.empreiteiras.forEach(emp => empresasSet.add(emp));
        }
      });
      setEmpreiteiras(Array.from(empresasSet).sort());

      // Buscar registros do mês
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const [diarios, checklistsUsina, checklistsAplicacao, checklistsMRAF, checklistsConcretagem, checklistsTerraplanagem, checklistsReciclagem] = await Promise.all([
        base44.entities.DiarioObra.list(),
        base44.entities.ChecklistUsina.list(),
        base44.entities.ChecklistAplicacao.list(),
        base44.entities.ChecklistMRAF.list(),
        base44.entities.ChecklistConcretagem.list(),
        base44.entities.ChecklistTerraplanagem.list(),
        base44.entities.ChecklistReciclagem.list()
      ]);

      // Processar produtividade
      const prodData = {};
      labUsers.forEach(lab => {
        prodData[lab.email] = {};
      });

      const processarRegistros = (registros) => {
        registros.forEach(reg => {
          if (!reg.data) return;
          // Apenas processar registros finalizados
          if (reg.status !== 'finalizado') return;
          
          const regDate = new Date(reg.data);
          if (regDate >= startDate && regDate <= endDate) {
            const day = regDate.getDate();
            const email = reg.created_by?.toLowerCase();
            
            if (email && prodData[email]) {
              if (!prodData[email][day]) {
                prodData[email][day] = [];
              }
              
              const obra = obras.find(o => o.id === reg.obra_id);
              const empreiteira = reg.empreiteira || '';
              
              prodData[email][day].push({
                id: reg.id,
                tipo: reg.constructor?.name || 'Registro',
                empreiteira: empreiteira,
                status: reg.status || 'finalizado',
                entityName: reg.constructor?.name || 'DiarioObra'
              });
            }
          }
        });
      };

      processarRegistros(diarios);
      processarRegistros(checklistsUsina);
      processarRegistros(checklistsAplicacao);
      processarRegistros(checklistsMRAF);
      processarRegistros(checklistsConcretagem);
      processarRegistros(checklistsTerraplanagem);
      processarRegistros(checklistsReciclagem);

      setProdutividade(prodData);

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

  const handleSaveEmpreiteira = async (novaEmpreiteira) => {
    if (!editDialog.registro) return;
    
    try {
      const entityName = editDialog.registro.entityName;
      await base44.entities[entityName].update(editDialog.registro.id, {
        empreiteira: novaEmpreiteira
      });
      
      setEditDialog({ open: false, registro: null });
      await loadData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao salvar empreiteira:", error);
      alert("Erro ao salvar empreiteira");
    }
  };

  const userCanEdit = user?.access_level === 'admin' || 
                      user?.access_level === 'gestor_contrato' || 
                      user?.access_level === 'sala_tecnica_afirmaevias';

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
                        
                        return (
                          <td
                            key={day}
                            className="border border-[#BFCF99]/20 p-1 text-center align-middle"
                          >
                            {hasRegistros ? (
                              <div className="flex flex-col gap-0.5">
                                {registros.map((reg, idx) => (
                                  <div
                                    key={idx}
                                    className={`${reg.empreiteira ? 'bg-green-500' : 'bg-orange-500'} text-white text-[10px] px-1 py-0.5 rounded font-medium ${userCanEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                                    title={`${reg.tipo}${reg.empreiteira ? ' - ' + reg.empreiteira : ' - Sem empreiteira'}`}
                                    onClick={() => userCanEdit && handleEditClick(reg)}
                                  >
                                    <div className="font-bold flex items-center justify-center gap-1">
                                      OK
                                      {userCanEdit && !reg.empreiteira && <Edit2 className="w-2 h-2" />}
                                    </div>
                                    <div className="truncate max-w-[60px]">
                                      {reg.empreiteira || 'Definir'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-blue-400 text-white text-[10px] px-1 py-1 rounded font-bold">
                                N/A
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

      {/* Dialog para editar empreiteira */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, registro: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Empreiteira</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Empreiteira Atendida</Label>
              <Select
                defaultValue={editDialog.registro?.empreiteira || ""}
                onValueChange={(value) => {
                  if (editDialog.registro) {
                    editDialog.registro.empreiteira = value;
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empreiteira" />
                </SelectTrigger>
                <SelectContent>
                  {empreiteiras.map(emp => (
                    <SelectItem key={emp} value={emp}>
                      {emp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog({ open: false, registro: null })}>
                Cancelar
              </Button>
              <Button onClick={() => handleSaveEmpreiteira(editDialog.registro?.empreiteira)}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}