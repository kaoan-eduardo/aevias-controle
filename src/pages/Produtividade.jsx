import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProdutividadePage() {
  const [loading, setLoading] = useState(true);
  const [laboratoristas, setLaboratoristas] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [produtividade, setProdutividade] = useState({});

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regionais, allUsers] = await Promise.all([
        base44.entities.Regional.list(),
        base44.entities.User.list()
      ]);

      // Coletar laboratoristas únicos de todas as regionais
      const labEmails = new Set();
      regionais.forEach(regional => {
        const labs = regional.laboratoristas_responsaveis || [];
        labs.forEach(email => labEmails.add(email.toLowerCase()));
      });

      // Buscar dados dos usuários laboratoristas
      const labUsers = allUsers.filter(u => 
        labEmails.has(u.email.toLowerCase())
      );

      setLaboratoristas(labUsers);

      // Aqui você pode buscar dados de produtividade (ensaios por dia)
      // Por enquanto, gerando dados mock
      const mockProdutividade = {};
      labUsers.forEach(lab => {
        mockProdutividade[lab.email] = generateMockData();
      });
      setProdutividade(mockProdutividade);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const data = {};
    const daysInMonth = getDaysInMonth(currentMonth);
    for (let i = 1; i <= daysInMonth; i++) {
      data[i] = Math.floor(Math.random() * 5); // 0-4 ensaios por dia
    }
    return data;
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
                        const count = produtividade[lab.email]?.[day] || 0;
                        return (
                          <td
                            key={day}
                            className="border border-[#BFCF99]/20 p-1 text-center"
                          >
                            {count > 0 ? (
                              <Badge
                                className={`
                                  ${count >= 3 ? "bg-green-500" : count >= 2 ? "bg-yellow-500" : "bg-blue-500"}
                                  text-white text-xs
                                `}
                              >
                                {count}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
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
    </div>
  );
}