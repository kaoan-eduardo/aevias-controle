
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/entities/User";
import { Regional } from "@/entities/Regional";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Users as UsersIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

// Memoizar componente de formulário
const UserForm = React.memo(({ user: editingUser, onSave, onCancel, currentUser, regionais }) => {
  const [formData, setFormData] = useState(
    editingUser ? {
      ...editingUser,
      access_level: editingUser.access_level || (editingUser.role === 'admin' ? 'admin' : 'user')
    } : {
      laboratorista_name: "",
      email: "",
      access_level: "user",
      company: "",
      position: "",
      phone: "",
      crea_number: "",
      is_active: true
    }
  );

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    if (!editingUser && formData.email) {
      const email = formData.email.toLowerCase();
      const emailDomain = email.split('@')[1];

      if (formData.access_level === 'sala_tecnica_afirmaevias' || formData.access_level === 'gestor_contrato') {
        if (emailDomain !== 'afirmaevias.com.br') {
          alert('Para os níveis de acesso "Sala Técnica" e "Gestor de Contrato", apenas o domínio @afirmaevias.com.br é permitido.');
          return;
        }
      } else {
        const allowedDomains = ['afirmaevias.com.br', 'gmail.com'];
        if (!allowedDomains.includes(emailDomain)) {
          alert('Apenas emails dos domínios autorizados são permitidos: ' + allowedDomains.join(', '));
          return;
        }
      }
    }

    const cleanedData = { ...formData };
    cleanedData.role = ['admin', 'sala_tecnica_afirmaevias', 'gestor_contrato'].includes(cleanedData.access_level) ? 'admin' : 'user';

    if (!cleanedData.phone || cleanedData.phone.trim() === '' || cleanedData.phone === '(XX) XXXXX-XXXX') {
      delete cleanedData.phone;
    }
    if (!cleanedData.crea_number || cleanedData.crea_number.trim() === '' || cleanedData.crea_number === 'Ex: CREA-PR 12345/D') {
      delete cleanedData.crea_number;
    }
    if (!cleanedData.position || cleanedData.position.trim() === '') {
      delete cleanedData.position;
    }

    onSave(cleanedData);
  }, [formData, editingUser, onSave]);

  const currentUserAccessLevel = currentUser?.access_level || (currentUser?.role === 'admin' ? 'admin' : 'user');
  const isGestorOrSalaTecnica = currentUserAccessLevel === 'gestor_contrato' || currentUserAccessLevel === 'sala_tecnica_afirmaevias';
  
  const regionalDoUsuario = useMemo(() => {
    if (!isGestorOrSalaTecnica || !regionais || !currentUser) return null;
    
    return regionais.find(regional => {
      if (currentUserAccessLevel === 'gestor_contrato') {
        return regional.gestor_contrato_responsavel?.toLowerCase() === currentUser.email.toLowerCase();
      } else if (currentUserAccessLevel === 'sala_tecnica_afirmaevias') {
        const salas = regional.salas_tecnicas_responsaveis || [];
        return salas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
      }
      return false;
    });
  }, [isGestorOrSalaTecnica, regionais, currentUser, currentUserAccessLevel]);

  return (
    <div className="space-y-6">
      {!editingUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900">Cadastro Corporativo</h4>
              <p className="text-sm text-blue-700 mt-1">
                O usuário receberá um convite por email para acessar o sistema.
                {isGestorOrSalaTecnica && regionalDoUsuario && (
                  <span className="block mt-2 font-semibold">
                    ✅ O laboratorista será automaticamente alocado na regional "{regionalDoUsuario.nome}".
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="laboratorista_name">Nome Completo *</Label>
            <Input
              id="laboratorista_name"
              value={formData.laboratorista_name}
              onChange={(e) => handleInputChange("laboratorista_name", e.target.value)}
              required
              placeholder="Nome completo do colaborador"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Corporativo *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="usuario@empresa.com"
              required
              disabled={!!editingUser}
            />
            {!editingUser && (
              <p className="text-xs text-slate-500 mt-1">
                Apenas emails dos domínios autorizados pela empresa são aceitos
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Empresa/Setor *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
              placeholder="Ex: Afirmaevias, Laboratório, etc."
              required
            />
          </div>
          <div>
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange("position", e.target.value)}
              placeholder="Ex: Engenheiro, Técnico, Analista"
            />
            {formData.access_level === 'cliente' && (
              <p className="text-xs text-slate-500 mt-1">
                <strong>Engenheiros</strong> poderão assinar registros para dar ciência
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="access_level">Nível de Acesso *</Label>
          <Select 
            value={formData.access_level} 
            onValueChange={(value) => handleInputChange("access_level", value)}
            disabled={isGestorOrSalaTecnica}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {!isGestorOrSalaTecnica && <SelectItem value="admin">Administrador</SelectItem>}
              {!isGestorOrSalaTecnica && <SelectItem value="sala_tecnica_afirmaevias">Sala Técnica - Afirmaevias</SelectItem>}
              {!isGestorOrSalaTecnica && <SelectItem value="gestor_contrato">Gestor de Contrato</SelectItem>}
              <SelectItem value="user">Laboratorista</SelectItem>
              {!isGestorOrSalaTecnica && <SelectItem value="cliente">Cliente</SelectItem>}
            </SelectContent>
          </Select>
          {isGestorOrSalaTecnica && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Você só pode criar usuários com nível "Laboratorista"
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <div>
            <Label htmlFor="crea_number">Número do CREA/CAU</Label>
            <Input
              id="crea_number"
              value={formData.crea_number}
              onChange={(e) => handleInputChange("crea_number", e.target.value)}
              placeholder="Ex: CREA-PR 12345/D"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleInputChange("is_active", checked)}
          />
          <Label htmlFor="is_active">Usuário Ativo</Label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} className="hover:bg-black/10">
            Cancelar
          </Button>
          <Button type="submit" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
            {editingUser ? "Salvar Alterações" : "Cadastrar e Enviar Convite"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
});

UserForm.displayName = 'UserForm';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const userAccessLevel = currentUser?.access_level || (currentUser?.role === 'admin' ? 'admin' : 'user');
  const isAdmin = userAccessLevel === 'admin';
  const isSalaTecnica = userAccessLevel === 'sala_tecnica_afirmaevias';
  const isGestorContrato = userAccessLevel === 'gestor_contrato';
  const isCliente = userAccessLevel === 'cliente';
  const canManageUsers = isAdmin || isSalaTecnica || isGestorContrato;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserData = await User.me();
      setCurrentUser(currentUserData);
      
      const regionaisData = await Regional.list();
      setRegionais(regionaisData);
      
      const { data: response } = await base44.functions.invoke('getRegionalUsers');
      let allUsers = response.users || [];
      
      // Filtrar usuários baseado no nível de acesso
      const currentAccessLevel = currentUserData.access_level || (currentUserData.role === 'admin' ? 'admin' : 'user');
      
      if (currentAccessLevel === 'sala_tecnica_afirmaevias' || currentAccessLevel === 'gestor_contrato' || currentAccessLevel === 'cliente') {
        // Encontrar regionais do usuário
        const regionaisDoUsuario = regionaisData.filter(regional => {
          if (currentAccessLevel === 'sala_tecnica_afirmaevias') {
            const salas = regional.salas_tecnicas_responsaveis || [];
            return salas.some(email => email.toLowerCase() === currentUserData.email.toLowerCase());
          } else if (currentAccessLevel === 'gestor_contrato') {
            return regional.gestor_contrato_responsavel?.toLowerCase() === currentUserData.email.toLowerCase();
          } else if (currentAccessLevel === 'cliente') {
            const clientes = regional.clientes_responsaveis || [];
            return clientes.some(email => email.toLowerCase() === currentUserData.email.toLowerCase());
          }
          return false;
        });

        // Coletar todos os emails permitidos
        const emailsPermitidos = new Set();
        
        regionaisDoUsuario.forEach(regional => {
          // Adicionar laboratoristas
          if (regional.laboratoristas_responsaveis) {
            regional.laboratoristas_responsaveis.forEach(email => emailsPermitidos.add(email.toLowerCase()));
          }
          // Adicionar gestor
          if (regional.gestor_contrato_responsavel) {
            emailsPermitidos.add(regional.gestor_contrato_responsavel.toLowerCase());
          }
          // Adicionar salas técnicas
          if (regional.salas_tecnicas_responsaveis) {
            regional.salas_tecnicas_responsaveis.forEach(email => emailsPermitidos.add(email.toLowerCase()));
          }
          // Adicionar clientes
          if (regional.clientes_responsaveis) {
            regional.clientes_responsaveis.forEach(email => emailsPermitidos.add(email.toLowerCase()));
          }
        });

        // Filtrar usuários
        allUsers = allUsers.filter(user => emailsPermitidos.has(user.email.toLowerCase()));
      }
      
      setUsers(allUsers);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Não foi possível carregar a lista de usuários. Por favor, contate o administrador.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveUser = useCallback(async (userData) => {
    const currentUserAccessLevel = currentUser?.access_level || (currentUser?.role === 'admin' ? 'admin' : 'user');
    const isGestorOrSalaTecnica = currentUserAccessLevel === 'gestor_contrato' || currentUserAccessLevel === 'sala_tecnica_afirmaevias';

    try {
      if (editingUser?.id) {
        // EDIÇÃO: Remover todos os campos built-in e enviar apenas campos customizados do schema
        const customFields = {
          laboratorista_name: userData.laboratorista_name,
          company: userData.company,
          position: userData.position,
          phone: userData.phone,
          crea_number: userData.crea_number,
          is_active: userData.is_active,
          access_level: userData.access_level
        };

        // Remover campos vazios/null/undefined para não sobrescrever com valores inválidos
        Object.keys(customFields).forEach(key => {
          if (customFields[key] === '' || customFields[key] === null || customFields[key] === undefined) {
            delete customFields[key];
          }
        });

        // Atualizar role baseado no access_level
        if (customFields.access_level) {
          customFields.role = ['admin', 'sala_tecnica_afirmaevias', 'gestor_contrato'].includes(customFields.access_level) ? 'admin' : 'user';
        }

        console.log('Atualizando usuário:', editingUser.id, 'com dados:', customFields);
        
        await User.update(editingUser.id, customFields);
        
        alert("Usuário atualizado com sucesso!");
      } else {
        // CRIAÇÃO: Criar novo usuário
        const newUserData = {
          laboratorista_name: userData.laboratorista_name,
          email: userData.email,
          company: userData.company,
          position: userData.position,
          phone: userData.phone,
          crea_number: userData.crea_number,
          is_active: userData.is_active,
          access_level: userData.access_level,
          role: ['admin', 'sala_tecnica_afirmaevias', 'gestor_contrato'].includes(userData.access_level) ? 'admin' : 'user'
        };

        // Remover campos vazios
        Object.keys(newUserData).forEach(key => {
          if (newUserData[key] === '' || newUserData[key] === null || newUserData[key] === undefined) {
            delete newUserData[key];
          }
        });

        console.log('Criando novo usuário com dados:', newUserData);
        
        await User.create(newUserData);
        
        // Se for gestor ou sala técnica criando um laboratorista, alocar na regional
        if (isGestorOrSalaTecnica && userData.access_level === 'user') {
          const regionalDoUsuario = regionais.find(regional => {
            if (currentUserAccessLevel === 'gestor_contrato') {
              return regional.gestor_contrato_responsavel?.toLowerCase() === currentUser.email.toLowerCase();
            } else if (currentUserAccessLevel === 'sala_tecnica_afirmaevias') {
              const salas = regional.salas_tecnicas_responsaveis || [];
              return salas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
            }
            return false;
          });
          
          if (regionalDoUsuario) {
            const laboratoristasAtuais = regionalDoUsuario.laboratoristas_responsaveis || [];
            const novoEmail = userData.email.toLowerCase();
            
            if (!laboratoristasAtuais.some(email => email.toLowerCase() === novoEmail)) {
              const novosLaboratoristas = [...laboratoristasAtuais, userData.email];
              await Regional.update(regionalDoUsuario.id, {
                laboratoristas_responsaveis: novosLaboratoristas
              });
            }
          }
        }
        
        const successMessage = isGestorOrSalaTecnica && userData.access_level === 'user'
          ? "Usuário cadastrado com sucesso! O laboratorista foi automaticamente alocado na sua regional. Um convite foi enviado por email."
          : "Usuário cadastrado com sucesso! Um convite foi enviado por email.";
        
        alert(successMessage);
      }
      
      setIsFormOpen(false);
      setEditingUser(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      let mensagemErro = "Erro desconhecido ao salvar usuário";
      
      if (error.response?.data?.detail) {
        mensagemErro = error.response.data.detail;
      } else if (error.response?.data?.message) {
        mensagemErro = error.response.data.message;
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      alert(`Erro ao salvar usuário: ${mensagemErro}`);
    }
  }, [editingUser, currentUser, regionais, loadData]);

  const handleEdit = useCallback((user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.laboratorista_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const getAccessLevelLabel = useCallback((accessLevel) => {
    switch(accessLevel) {
      case 'admin': return 'Administrador';
      case 'sala_tecnica_afirmaevias': return 'Sala Técnica';
      case 'gestor_contrato': return 'Gestor Contrato';
      case 'user': return 'Laboratorista';
      case 'cliente': return 'Cliente';
      default: return 'Desconhecido';
    }
  }, []);
  
  const getAccessLevelBadgeVariant = useCallback((accessLevel) => {
    switch(accessLevel) {
      case 'admin': return 'default';
      case 'sala_tecnica_afirmaevias': return 'outline';
      case 'gestor_contrato': return 'secondary';
      case 'user': return 'secondary';
      case 'cliente': return 'outline';
      default: return 'secondary';
    }
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-transparent min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-[#00233B]/20 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-[#00233B] mb-2">
              Carregando usuários...
            </h3>
            <p className="text-[#00233B]/80">
              Aguarde enquanto carregamos os dados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00233B] flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-[#BFCF99]" />
              {isAdmin ? 'Gestão de Usuários Corporativos' : 'Usuários da Minha Regional'}
            </h1>
            <p className="text-[#00233B]/80 mt-2">
              {isAdmin 
                ? 'Cadastre colaboradores e laboratoristas.'
                : isCliente
                ? 'Visualize os usuários da sua regional'
                : 'Visualize, gerencie e cadastre laboratoristas para sua regional'}
            </p>
          </div>
          {canManageUsers && !isCliente && (
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen);
              if (!isOpen) setEditingUser(null);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                  <Plus className="w-4 h-4 mr-2 text-[#BFCF99]" />
                  Cadastrar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20 text-[#00233B]">
                <DialogHeader>
                  <DialogTitle className="text-[#00233B]">
                    {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário Corporativo'}
                  </DialogTitle>
                </DialogHeader>
                <UserForm
                  user={editingUser}
                  onSave={handleSaveUser}
                  onCancel={() => setIsFormOpen(false)}
                  currentUser={currentUser}
                  regionais={regionais}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="mb-6 bg-white/20 backdrop-blur-lg border border-white/20">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#BFCF99]" />
              <Input
                placeholder="Pesquisar por nome, email, empresa ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-transparent border-white/20 text-[#00233B] placeholder:text-[#00233B]/60"
              />
            </div>
          </CardContent>
        </Card>

        <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/5">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Usuário</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Empresa/Cargo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Nível</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#00233B]/70 uppercase tracking-wider">Status</th>
                {(canManageUsers && !isCliente) && (
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Editar</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-black/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[#00233B]">{user.laboratorista_name}</div>
                      <div className="text-sm text-[#00233B]/80">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-[#00233B]">{user.company || "—"}</div>
                      <div className="text-sm text-[#00233B]/80">{user.position || "—"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getAccessLevelBadgeVariant(user.access_level)}>
                      {getAccessLevelLabel(user.access_level)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.is_active ? 'success' : 'destructive'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  {(canManageUsers && !isCliente) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="hover:bg-black/10">
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-[#00233B]/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#00233B] mb-2">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </h3>
              <p className="text-[#00233B]/80">
                {searchTerm 
                  ? 'Tente ajustar os filtros de pesquisa.' 
                  : isAdmin 
                    ? 'Comece convidando seu primeiro usuário.' 
                    : 'Não há usuários ativos vinculados às suas regionais.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
