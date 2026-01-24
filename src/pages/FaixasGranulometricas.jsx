import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Eye, Trash2, Grid, Loader2, Save, FileText } from "lucide-react";
import { FaixaGranulometrica } from "@/entities/FaixaGranulometrica";
import { User } from "@/entities/User";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";

const PENEIRAS_ASTM = [
  { astm: '3"', abertura_mm: 75.0, descricao: '3" (75.0 mm)' },
  { astm: '2 1/2"', abertura_mm: 63.0, descricao: '2 1/2" (63.0 mm)' },
  { astm: '2"', abertura_mm: 50.0, descricao: '2" (50.0 mm)' },
  { astm: '1 1/2"', abertura_mm: 37.5, descricao: '1 1/2" (37.5 mm)' },
  { astm: '1"', abertura_mm: 25.0, descricao: '1" (25.0 mm)' },
  { astm: '3/4"', abertura_mm: 19.0, descricao: '3/4" (19.0 mm)' },
  { astm: '5/8"', abertura_mm: 16.0, descricao: '5/8" (16.0 mm)' },
  { astm: '1/2"', abertura_mm: 12.5, descricao: '1/2" (12.5 mm)' },
  { astm: '3/8"', abertura_mm: 9.5, descricao: '3/8" (9.5 mm)' },
  { astm: '1/4"', abertura_mm: 6.3, descricao: '1/4" (6.3 mm)' },
  { astm: 'Nº 4', abertura_mm: 4.75, descricao: 'Nº 4 (4.75 mm)' },
  { astm: 'Nº 8', abertura_mm: 2.36, descricao: 'Nº 8 (2.36 mm)' },
  { astm: 'Nº 10', abertura_mm: 2.0, descricao: 'Nº 10 (2.0 mm)' },
  { astm: 'Nº 16', abertura_mm: 1.18, descricao: 'Nº 16 (1.18 mm)' },
  { astm: 'Nº 30', abertura_mm: 0.6, descricao: 'Nº 30 (0.6 mm)' },
  { astm: 'Nº 40', abertura_mm: 0.42, descricao: 'Nº 40 (0.42 mm)' },
  { astm: 'Nº 50', abertura_mm: 0.3, descricao: 'Nº 50 (0.3 mm)' },
  { astm: 'Nº 80', abertura_mm: 0.18, descricao: 'Nº 80 (0.18 mm)' },
  { astm: 'Nº 100', abertura_mm: 0.15, descricao: 'Nº 100 (0.15 mm)' },
  { astm: 'Nº 200', abertura_mm: 0.075, descricao: 'Nº 200 (0.075 mm)' },
  { astm: 'Fundo', abertura_mm: 0.0, descricao: 'Fundo (< 0.075 mm)' }
];

// Memoizar componente de formulário
const FaixaForm = React.memo(({ faixa: editingFaixa, onSave, onCancel }) => {
  const [faixa, setFaixa] = useState(() => {
    // If editing, use the existing faixa data, otherwise provide default structure
    if (editingFaixa) {
      return editingFaixa;
    }
    return {
      tipo: "CAUQ", // Added default type
      nome: "",
      especificacao: "",
      orgao: "",
      peneiras: [{ astm: "", min: "", max: "" }], // Start with one empty peneira for new forms
      status: "ativo"
    };
  });

  const handleInputChange = (field, value) => {
    setFaixa(prev => ({ ...prev, [field]: value }));
  };

  const handlePeneiraChange = (index, field, value) => {
    const updatedPeneiras = [...faixa.peneiras];

    if (field === 'astm') {
      // The `abertura` field is not present in the new form structure for input,
      // but it might be used for display or saving. Let's make sure it's updated correctly.
      // For the purpose of this form, we're only focused on astm, min, max.
      // If 'abertura' is needed for saving, it should be derived at save time or stored.
      // Given the new JSX, it's simplified.
      updatedPeneiras[index] = {
        ...updatedPeneiras[index],
        astm: value,
      };
    } else {
      updatedPeneiras[index] = {
        ...updatedPeneiras[index],
        [field]: value === '' ? '' : parseFloat(value) // Allow empty string for clearer input
      };
    }

    setFaixa(prev => ({ ...prev, peneiras: updatedPeneiras }));
  };

  const addPeneira = () => {
    setFaixa(prev => ({
      ...prev,
      peneiras: [...prev.peneiras, { astm: "", min: "", max: "" }]
    }));
  };

  const removePeneira = (index) => {
    if (faixa.peneiras.length > 1) { // Ensure at least one peneira remains
      setFaixa(prev => ({
        ...prev,
        peneiras: prev.peneiras.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const peneirasValidas = faixa.peneiras
      .filter(peneira => peneira.astm && peneira.min !== '' && peneira.max !== '')
      .map(peneira => {
        // Re-add 'abertura' based on ASTM selection for saving, if it was simplified in the form
        const astmDetails = PENEIRAS_ASTM.find(p => p.astm === peneira.astm);
        return {
          ...peneira,
          abertura: astmDetails ? `${astmDetails.abertura_mm} mm` : "" // Ensure 'abertura' is present for saving
        };
      });

    if (peneirasValidas.length === 0) {
      alert('Adicione pelo menos uma peneira com Peneira ASTM, Mínimo e Máximo preenchidos.');
      return;
    }

    onSave({
      ...faixa,
      peneiras: peneirasValidas
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-[#00233B]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo *</Label>
          <Select value={faixa.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
            <SelectTrigger className="bg-transparent border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAUQ">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">CAUQ</Badge>
                  <span>Concreto Asfáltico Usinado a Quente</span>
                </div>
              </SelectItem>
              <SelectItem value="MRAF">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">MRAF</Badge>
                  <span>Micro Revestimento Asfáltico a Frio</span>
                </div>
              </SelectItem>
              <SelectItem value="BGS">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500">BGS</Badge>
                  <span>Brita Graduada Simples</span>
                </div>
              </SelectItem>
              <SelectItem value="CAMADAS_GRANULARES">
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-500">CAMADAS GRANULARES</Badge>
                  <span>Camadas Granulares</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nome">Nome da Faixa *</Label>
          <Input
            id="nome"
            value={faixa.nome}
            onChange={(e) => handleInputChange("nome", e.target.value)}
            placeholder="Ex: Faixa III, Faixa B"
            required
            className="bg-transparent border-white/20 placeholder:text-[#00233B]/60 focus:border-[#BFCF99] focus:ring-[#BFCF99]"
          />
        </div>
        <div>
          <Label htmlFor="especificacao">Especificação *</Label>
          <Input
            id="especificacao"
            value={faixa.especificacao}
            onChange={(e) => handleInputChange("especificacao", e.target.value)}
            placeholder="Ex: ES-P 14/05, DNIT 031/2006"
            required
            className="bg-transparent border-white/20 placeholder:text-[#00233B]/60 focus:border-[#BFCF99] focus:ring-[#BFCF99]"
          />
        </div>
        <div>
          <Label htmlFor="orgao">Órgão *</Label>
          <Input
            id="orgao"
            value={faixa.orgao}
            onChange={(e) => handleInputChange("orgao", e.target.value)}
            placeholder="Ex: DER/PR, DNIT, ABNT"
            required
            className="bg-transparent border-white/20 placeholder:text-[#00233B]/60 focus:border-[#BFCF99] focus:ring-[#BFCF99]"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={faixa.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger className="bg-transparent border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Peneiras (% Passante)</h3>
        <div className="space-y-3">
          {faixa.peneiras.map((peneira, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 p-3 rounded-lg bg-black/5">
              <Select value={peneira.astm} onValueChange={(value) => handlePeneiraChange(index, 'astm', value)}>
                <SelectTrigger className="bg-transparent border-white/20">
                  <SelectValue placeholder="Selecione Peneira ASTM" />
                </SelectTrigger>
                <SelectContent>
                  {PENEIRAS_ASTM.map(p => <SelectItem key={p.astm} value={p.astm}>{p.descricao}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.1"
                placeholder="Mínimo %"
                value={peneira.min}
                onChange={(e) => handlePeneiraChange(index, "min", e.target.value)}
                required
                className="bg-transparent border-white/20 placeholder:text-[#00233B]/60 focus:border-[#BFCF99] focus:ring-[#BFCF99]"
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Máximo %"
                value={peneira.max}
                onChange={(e) => handlePeneiraChange(index, "max", e.target.value)}
                required
                className="bg-transparent border-white/20 placeholder:text-[#00233B]/60 focus:border-[#BFCF99] focus:ring-[#BFCF99]"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removePeneira(index)} className="text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" onClick={addPeneira} variant="outline" className="mt-4 hover:bg-black/10 text-[#00233B] border-white/20">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Peneira
        </Button>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="hover:bg-black/10 border-white/20 text-[#00233B]">Cancelar</Button>
        <Button type="submit" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
          <Save className="w-4 h-4 mr-2 text-[#BFCF99]" />
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
});

FaixaForm.displayName = 'FaixaForm';

// Memoizar componente de detalhes
const FaixaDetails = React.memo(({ faixa }) => {
  const statusColors = useMemo(() => ({
    ativo: "bg-green-200/50 text-green-800",
    inativo: "bg-red-200/50 text-red-800"
  }), []);

  const tipoColors = useMemo(() => ({
    CAUQ: "bg-blue-500 text-white",
    MRAF: "bg-green-500 text-white",
    BGS: "bg-purple-500 text-white",
    CAMADAS_GRANULARES: "bg-orange-500 text-white"
  }), []);

  return (
    <div className="space-y-6 text-[#00233B]">
      <Card className="bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl text-[#00233B]">{faixa.nome}</CardTitle>
              <Badge className={tipoColors[faixa.tipo || 'CAUQ']}>
                {faixa.tipo || 'CAUQ'}
              </Badge>
            </div>
            <Badge className={statusColors[faixa.status] || statusColors.ativo}>
              {faixa.status || 'ativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-[#00233B]/60">Especificação</p>
              <p className="text-[#00233B]">{faixa.especificacao}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#00233B]/60">Órgão</p>
              <p className="text-[#00233B]">{faixa.orgao}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-[#00233B]">Faixa Granulométrica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-white/20">
              <thead className="bg-black/5">
                <tr>
                  <th scope="col" className="border border-white/10 px-4 py-2 text-left text-sm font-medium text-[#00233B]/70">
                    Peneira ASTM
                  </th>
                  <th scope="col" className="border border-white/10 px-4 py-2 text-left text-sm font-medium text-[#00233B]/70">
                    Abertura
                  </th>
                  <th scope="col" className="border border-white/10 px-4 py-2 text-center text-sm font-medium text-[#00233B]/70">
                    Mínimo (%)
                  </th>
                  <th scope="col" className="border border-white/10 px-4 py-2 text-center text-sm font-medium text-[#00233B]/70">
                    Máximo (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {faixa.peneiras?.map((peneira, index) => (
                  <tr key={index} className="hover:bg-black/5">
                    <td className="border border-white/10 px-4 py-2 text-sm text-[#00233B] font-medium">
                      {peneira.astm}
                    </td>
                    <td className="border border-white/10 px-4 py-2 text-sm text-[#00233B]">
                      {peneira.abertura}
                    </td>
                    <td className="border border-white/10 px-4 py-2 text-sm text-[#00233B] text-center">
                      {peneira.min}%
                    </td>
                    <td className="border border-white/10 px-4 py-2 text-sm text-[#00233B] text-center">
                      {peneira.max}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

FaixaDetails.displayName = 'FaixaDetails';

export default function FaixasGranulometricasPage() {
  const [faixas, setFaixas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState('all'); // New state for type filter
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaixa, setEditingFaixa] = useState(null);
  const [selectedFaixa, setSelectedFaixa] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, faixasData] = await Promise.all([
        User.me(),
        FaixaGranulometrica.list("-created_date")
      ]);
      
      setUser(userData);
      setFaixas(faixasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveFaixa = useCallback(async (faixaData) => {
    try {
      if (editingFaixa) {
        await FaixaGranulometrica.update(editingFaixa.id, faixaData);
      } else {
        await FaixaGranulometrica.create(faixaData);
      }
      setIsFormOpen(false);
      setEditingFaixa(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar faixa:", error);
      alert('Erro ao salvar faixa. Verifique os dados e tente novamente.');
    }
  }, [editingFaixa, loadData]);

  const handleEdit = useCallback((faixa) => {
    setEditingFaixa(faixa);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta faixa granulométrica?")) {
      try {
        await FaixaGranulometrica.delete(id);
        loadData();
      } catch (error) {
        console.error("Erro ao excluir faixa:", error);
        alert('Erro ao excluir faixa. Tente novamente mais tarde.');
      }
    }
  }, [loadData]);

  const filteredFaixas = useMemo(() => {
    let filtered = faixas.filter(faixa =>
      faixa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faixa.especificacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faixa.orgao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (tipoFilter !== 'all') {
      filtered = filtered.filter(faixa => faixa.tipo === tipoFilter);
    }

    return filtered;
  }, [faixas, searchTerm, tipoFilter]); // Add tipoFilter to dependencies

  const userAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const isAdmin = userAccessLevel === 'admin';
  const isSalaTecnica = userAccessLevel === 'sala_tecnica_afirmaevias';
  const isGestorContrato = userAccessLevel === 'gestor_contrato';
  const canManage = isAdmin || isSalaTecnica || isGestorContrato;

  const tipoProjetoColors = useMemo(() => ({
    CAUQ: "bg-blue-500 text-white",
    MRAF: "bg-green-500 text-white",
    BGS: "bg-purple-500 text-white",
    CAMADAS_GRANULARES: "bg-orange-500 text-white"
  }), []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#BFCF99]" />
          <p className="text-[#00233B]/60 mt-2">Carregando faixas granulométricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00233B] flex items-center gap-3">
              <Grid className="w-8 h-8 text-[#00233B]"/>
              Faixas Granulométricas
            </h1>
            <p className="text-[#00233B]/80 mt-1">Gerencie as especificações de faixas granulométricas.</p>
          </div>
          {canManage && (
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen);
              if (!isOpen) setEditingFaixa(null);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Faixa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20 text-[#00233B]">
                <DialogHeader>
                  <DialogTitle>
                    {editingFaixa ? 'Editar Faixa Granulométrica' : 'Nova Faixa Granulométrica'}
                  </DialogTitle>
                </DialogHeader>
                <FaixaForm
                  faixa={editingFaixa}
                  onSave={handleSaveFaixa}
                  onCancel={() => setIsFormOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="mb-6 bg-white/20 backdrop-blur-lg border border-white/20">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#BFCF99]" />
                <Input
                  placeholder="Pesquisar faixas granulométricas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-transparent border-white/20 placeholder:text-[#00233B]/60 focus:border-[#BFCF99] focus:ring-[#BFCF99] text-[#00233B]"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-48 bg-transparent border-white/20">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="CAUQ">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">CAUQ</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="MRAF">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">MRAF</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="BGS">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500">BGS</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="CAMADAS_GRANULARES">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500">CAMADAS GRANULARES</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/5">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Especificação</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Órgão</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Status</th>
                {(canManage || !canManage) && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredFaixas.map((faixa) => (
                <tr key={faixa.id} className="hover:bg-black/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={tipoProjetoColors[faixa.tipo || 'CAUQ']}>
                      {faixa.tipo || 'CAUQ'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#00233B]">{faixa.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#00233B]/90">{faixa.especificacao}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#00233B]/90">{faixa.orgao}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={
                      faixa.status === 'ativo' 
                        ? "bg-green-200/50 text-green-800" 
                        : "bg-red-200/50 text-red-800"
                    }>
                      {faixa.status || 'ativo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFaixa(faixa)} className="hover:bg-black/10 text-[#00233B]">
                      <Eye className="w-4 h-4 mr-1 text-[#BFCF99]" /> Ver
                    </Button>
                    {canManage && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(faixa)} className="hover:bg-black/10 text-[#00233B]">
                          <Edit className="w-4 h-4 mr-1 text-[#BFCF99]" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(faixa.id)} className="text-red-500 hover:text-red-700 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4 mr-1" /> Excluir
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredFaixas.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-[#00233B]/20 mx-auto mb-4" />
              <h3 className="font-medium text-[#00233B] mb-2">Nenhuma faixa encontrada</h3>
              <p className="text-sm text-[#00233B]/80">
                Ajuste sua busca ou adicione uma nova faixa granulométrica.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={!!selectedFaixa} onOpenChange={() => setSelectedFaixa(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20">
          <DialogHeader>
            <DialogTitle className="text-[#00233B]">Detalhes da Faixa Granulométrica</DialogTitle>
          </DialogHeader>
          {selectedFaixa && (
            <FaixaDetails faixa={selectedFaixa} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}