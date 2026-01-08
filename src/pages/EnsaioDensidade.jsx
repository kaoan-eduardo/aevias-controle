
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { EnsaioDensidade as EnsaioDensidadeEntity } from "@/entities/EnsaioDensidade";
import { Obra } from "@/entities/Obra";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { Regional } from "@/entities/Regional"; // Added import for Regional entity
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const EnsaioForm = ({ ensaio, obras, projects, onSave, onCancel }) => {
    const [formData, setFormData] = useState(ensaio || {});
    // Add logic for form state management
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields will be rendered here based on the entity schema */}
            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="hover:bg-black/10">Cancelar</Button>
                <Button type="submit" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">Salvar</Button>
            </div>
        </form>
    );
};

export default function EnsaioDensidadePage() {
  const [obras, setObras] = useState([]);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [editingEnsaio, setEditingEnsaio] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        let obrasData = await Obra.list();
        const projectsData = await Project.list();
        
        // Se for laboratorista, filtrar apenas obras em andamento da sua regional
        const currentUserAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');
        if (currentUserAccessLevel === 'user') {
          const regionaisData = await Regional.list();
          const regionalDoLaboratorista = regionaisData.find(regional => {
            const laboratoristas = regional.laboratoristas_responsaveis || [];
            return laboratoristas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
          });
          
          if (regionalDoLaboratorista) {
            obrasData = obrasData.filter(obra => 
              obra.regional_id === regionalDoLaboratorista.id &&
              obra.status === 'em_andamento'
            );
          } else {
            obrasData = [];
          }
        }
        
        setObras(obrasData);
        setProjects(projectsData);
        
        const params = new URLSearchParams(location.search);
        const editId = params.get('editId');

        if (editId) {
          const ensaioToEdit = await EnsaioDensidadeEntity.get(editId);
          if (currentUser.role === 'admin' || (ensaioToEdit.created_by === currentUser.email && ensaioToEdit.approved !== true)) {
            setEditingEnsaio(ensaioToEdit);
          } else {
            alert("Você não tem permissão para editar este registro.");
            navigate(createPageUrl('MeusEnsaios'));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        navigate(createPageUrl('MeusEnsaios'));
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [location.search, navigate]);
  
  const handleSave = async (formData) => {
    const pesosParsed = (formData.pesos || "")
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
            const [cp, p1, p2, p3] = line.split(/\s+/);
            return { cp, p1: parseFloat(p1), p2: parseFloat(p2), p3: parseFloat(p3) };
        });
    
    try {
      if (editingEnsaio) {
        // Se o registro estava reprovado e está sendo editado, volta para pendente
        const updateData = { ...formData, pesos: pesosParsed };
        let successMessage = "Ensaio atualizado com sucesso!";

        if (editingEnsaio.approved === false) {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
          successMessage = "Ensaio atualizado com sucesso! O registro voltará para análise do administrador.";
        }
        
        await EnsaioDensidadeEntity.update(editingEnsaio.id, updateData);
        alert(successMessage);
      } else {
        await EnsaioDensidadeEntity.create({ ...formData, pesos: pesosParsed, laboratorista_name: user?.laboratorista_name || user?.full_name });
        alert("Ensaio criado com sucesso!");
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("Erro ao salvar ensaio:", error);
      alert("Erro ao salvar ensaio.");
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
          <CardHeader>
            <CardTitle className="text-[#00233B]">{editingEnsaio ? 'Editar Ensaio de Densidade' : 'Novo Ensaio: Densidade CP Extraído'}</CardTitle>
            <CardDescription className="text-[#00233B]/80">
              {editingEnsaio ? `Editando amostra: ${editingEnsaio.sample_id}` : "Preencha as informações para registrar um novo ensaio."}
            </CardDescription>
             {editingEnsaio?.rejection_reason && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-50/50 border border-red-200/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                        <p className="text-sm text-red-700">{editingEnsaio.rejection_reason}</p>
                    </div>
                </div>
            )}
          </CardHeader>
          <CardContent>
             <EnsaioForm
              ensaio={editingEnsaio}
              obras={obras}
              projects={projects}
              onSave={handleSave}
              onCancel={() => navigate(createPageUrl('MeusEnsaios'))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
