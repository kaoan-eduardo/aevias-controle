
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Eye, Trash2, Loader2 } from "lucide-react";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { FaixaGranulometrica } from "@/entities/FaixaGranulometrica";
import { Regional } from "@/entities/Regional"; // Added import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import ProjectForm from "../components/projects/ProjectForm";
import ProjectDetails from "../components/projects/ProjectDetails";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [regionais, setRegionais] = useState([]); // Added state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, projectsData, faixasData, regionaisData] = await Promise.all([ // Added regionaisData
        User.me(),
        Project.list("-created_date", 100),
        FaixaGranulometrica.list(),
        Regional.list() // Added Regional.list()
      ]);
      
      setUser(userData);
      setFaixas(faixasData);
      setRegionais(regionaisData); // Set regionais state

      const userAccessLevel = userData.access_level || (userData.role === 'admin' ? 'admin' : 'user');
      
      if (userAccessLevel === 'cliente' || userAccessLevel === 'sala_tecnica_afirmaevias' || userAccessLevel === 'gestor_contrato') {
        const regionaisDoUsuario = regionaisData.filter(regional => {
          if (userAccessLevel === 'cliente') {
            const clientes = regional.clientes_responsaveis || [];
            return clientes.some(email => email.toLowerCase() === userData.email.toLowerCase());
          } else if (userAccessLevel === 'sala_tecnica_afirmaevias') {
            const salas = regional.salas_tecnicas_responsaveis || [];
            return salas.some(email => email.toLowerCase() === userData.email.toLowerCase());
          } else if (userAccessLevel === 'gestor_contrato') {
            return regional.gestor_contrato_responsavel?.toLowerCase() === userData.email.toLowerCase();
          }
          return false;
        });

        const projectIdsPermitidos = new Set();
        regionaisDoUsuario.forEach(regional => {
          if (regional.project_ids) {
            regional.project_ids.forEach(id => projectIdsPermitidos.add(id));
          }
        });

        // Agora também filtrar por regional_id direto
        const regionalIdsPermitidos = new Set(regionaisDoUsuario.map(r => r.id));
        const projectsFiltrados = projectsData.filter(p => 
          projectIdsPermitidos.has(p.id) || 
          (p.regional_id && regionalIdsPermitidos.has(p.regional_id))
        );
        
        setProjects(projectsFiltrados);
      } else {
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProject = useCallback(async (projectData) => {
    try {
      if (editingProject) {
        await Project.update(editingProject.id, projectData);
      } else {
        await Project.create(projectData);
      }
      setIsFormOpen(false);
      setEditingProject(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    }
  }, [editingProject, loadData]);

  const handleEdit = useCallback((project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (project) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
      try {
        await Project.delete(project.id);
        loadData();
      } catch (error) {
        console.error("Erro ao excluir projeto:", error);
      }
    }
  }, [loadData]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tipo_projeto?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const userAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const isAdmin = userAccessLevel === 'admin';
  const isSalaTecnica = userAccessLevel === 'sala_tecnica_afirmaevias';
  const isGestorContrato = userAccessLevel === 'gestor_contrato';
  const canManage = isAdmin || isSalaTecnica || isGestorContrato;

  const statusColors = useMemo(() => ({
    ativo: "bg-[#566E3D]/30 text-[#00233B]",
    inativo: "bg-red-400/20 text-red-800",
    pausado: "bg-yellow-400/20 text-yellow-800"
  }), []);

  const tipoProjetoColors = useMemo(() => ({
    CAUQ: "bg-[#00233B] text-white",
    MRAF: "bg-[#566E3D] text-white",
    BGS: "bg-purple-500 text-white",
    CARTA_TRACO_CONCRETO: "bg-orange-500 text-white"
  }), []);

  const tipoProjetoLabels = useMemo(() => ({
    CAUQ: "CAUQ",
    MRAF: "MRAF",
    BGS: "BGS",
    CARTA_TRACO_CONCRETO: "CARTA TRAÇO"
  }), []);

  const getRegionalNome = useCallback((regionalId) => {
    if (!regionalId) return null;
    const regional = regionais.find(r => r.id === regionalId);
    return regional?.nome || null;
  }, [regionais]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00233B]/50" />
          <p className="text-[#00233B]/80 mt-2">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00233B]">Projetos</h1>
            <p className="text-[#00233B]/80 mt-1">Gerencie os projetos de pavimentação</p>
          </div>
          {canManage && (
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90"
            >
              <Plus className="w-4 h-4 mr-2 text-[#BFCF99]" />
              Novo Projeto
            </Button>
          )}
        </div>

        <Card className="mb-6 bg-white/20 backdrop-blur-lg border border-white/20">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#BFCF99]" />
              <Input
                placeholder="Pesquisar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-transparent border-white/20 placeholder:text-[#00233B]/60 focus:border-[#BFCF99] focus:ring-[#BFCF99] text-[#00233B]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const faixa = faixas.find(f => f.id === project.faixa_granulometrica_id);
            const tipoLabel = tipoProjetoLabels[project.tipo_projeto] || project.tipo_projeto || 'CAUQ';
            const regionalNome = getRegionalNome(project.regional_id); // Get regional name
            
            return (
              <Card key={project.id} className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B] hover:border-white/40 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-[#00233B] line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap"> {/* Added flex-wrap */}
                        <Badge className={tipoProjetoColors[project.tipo_projeto || 'CAUQ']}>
                          {tipoLabel}
                        </Badge>
                        {regionalNome && ( // Display regional name badge if available
                          <Badge variant="outline" className="bg-white/50 text-[#00233B] text-xs">
                            {regionalNome}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={statusColors[project.status] || statusColors.ativo}>
                      {project.status || 'ativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-[#00233B]/80">Cliente</p>
                      <p className="text-sm text-[#00233B]">{project.client}</p>
                    </div>
                    {project.tipo_projeto !== 'CARTA_TRACO_CONCRETO' && (
                      <div>
                        <p className="text-sm font-medium text-[#00233B]/80">Faixa Granulométrica</p>
                        <p className="text-sm text-[#00233B]">
                          {faixa ? faixa.nome : 'Não definida'}
                        </p>
                      </div>
                    )}
                    {project.tipo_projeto === 'CARTA_TRACO_CONCRETO' && project.fck && (
                      <div>
                        <p className="text-sm font-medium text-[#00233B]/80">FCK</p>
                        <p className="text-sm text-[#00233B]">
                          {project.fck} MPa
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-3 border-t border-white/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                        className="text-[#00233B] hover:bg-[#566E3D]/10"
                      >
                        <Eye className="w-4 h-4 mr-1 text-[#566E3D]" />
                        Ver
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(project)}
                            className="text-[#00233B] hover:bg-amber-500/10"
                          >
                            <Edit className="w-4 h-4 mr-1 text-amber-600" />
                            Editar
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(project)}
                              className="text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-[#BFCF99]" />
              </div>
              <h3 className="text-lg font-semibold text-[#00233B] mb-2">
                Nenhum projeto encontrado
              </h3>
              <p className="text-[#00233B]/80 text-center">
                {searchTerm ? 'Tente ajustar seus filtros de pesquisa.' : 'Comece criando seu primeiro projeto.'}
              </p>
            </CardContent>
          </Card>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg border-white/20 text-[#00233B]">
            <DialogHeader>
              <DialogTitle className="text-[#00233B]">
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              faixas={faixas}
              regionais={regionais} // Passed regionais
              user={user} // Passed user
              onSave={handleSaveProject}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingProject(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg border-white/20 text-[#00233B]">
            <DialogHeader>
              <DialogTitle className="text-[#00233B]">Detalhes do Projeto</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <ProjectDetails
                project={selectedProject}
                faixas={faixas}
                onClose={() => setSelectedProject(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
