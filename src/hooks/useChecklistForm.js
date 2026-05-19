import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Project } from "@/entities/Project";
import { FaixaGranulometrica } from "@/entities/FaixaGranulometrica";
import { useFormPersistence } from "@/components/hooks/useFormPersistence";
import { createPageUrl } from "@/utils";

/**
 * Hook reutilizável para formulários de checklist
 * Gerencia carregamento de dados, persistência, edição e permissões
 */
export function useChecklistForm(getInitialFormData, entityName, storageName) {
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [projects, setProjects] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(getInitialFormData());

  const location = useLocation();
  const navigate = useNavigate();

  const { clearSavedData } = useFormPersistence(storageName, formData, setFormData, !!editingChecklist);

  // Carregar dados na montagem
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const currentUserAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');
        const isAdmin = currentUserAccessLevel === 'admin';

        // Carregar dados em paralelo
        const dataPromises = [
          Obra.list(),
          Regional.list(),
          Project.list()
        ];

        let faixasData = [];
        try {
          faixasData = await FaixaGranulometrica.list();
        } catch (faixasError) {
          console.warn(`[${entityName}] Faixas indisponíveis:`, faixasError?.message);
        }

        if (isAdmin) {
          dataPromises.push(User.list());
        }

        const loadedData = await Promise.all(dataPromises);
        const [obrasData, regionaisData, projectsData, allUsersDataFetchedIfAdmin] = loadedData;

        setRegionais(regionaisData);
        setProjects(projectsData);
        setFaixas(faixasData);
        setAllUsers(isAdmin ? allUsersDataFetchedIfAdmin : [userData]);

        // Filtrar obras disponíveis para o usuário
        let availableObras = obrasData;
        if (currentUserAccessLevel === 'user') {
          const regionalDoLaboratorista = regionaisData.find(regional => {
            const laboratoristas = regional.laboratoristas_responsaveis || [];
            return laboratoristas.some(email => email.toLowerCase() === userData.email.toLowerCase());
          });

          if (regionalDoLaboratorista) {
            availableObras = obrasData.filter(obra =>
              obra.regional_id === regionalDoLaboratorista.id &&
              obra.status === 'em_andamento'
            );
          } else {
            availableObras = [];
          }
        }
        setObras(availableObras);

        // Carregar checklist para edição se editId presente
        const params = new URLSearchParams(location.search);
        const editId = params.get('editId');

        if (editId) {
          const Entity = (await import(`@/entities/${entityName}`)).default;
          const checklistToEdit = await Entity.get(editId);
          setEditingChecklist(checklistToEdit);

          if (userData.role === 'admin' || (checklistToEdit.created_by === userData.email && (checklistToEdit.status === 'rascunho' || checklistToEdit.approved === false || checklistToEdit.approved === null))) {
            const initialForm = getInitialFormData();
            const loadedFormData = {
              ...initialForm,
              ...checklistToEdit,
              data: checklistToEdit.data ? new Date(checklistToEdit.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              fotos: Array.isArray(checklistToEdit.fotos) ? checklistToEdit.fotos : [],
            };

            setFormData(loadedFormData);
          } else {
            alert("Você não tem permissão para editar este registro.");
            navigate(createPageUrl('MeusEnsaios'));
          }
        } else {
          const initialNewFormData = getInitialFormData();
          initialNewFormData.inspetor_campo = userData.laboratorista_name || userData.full_name;
          if (availableObras.length > 0) {
            initialNewFormData.obra_id = availableObras[0].id;
          }
          setFormData(initialNewFormData);
          setEditingChecklist(null);
        }
      } catch (error) {
        console.error(`[${entityName}] Erro ao carregar:`, error?.message);
        alert("Erro ao carregar os dados.");
        navigate(createPageUrl('MeusEnsaios'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.search, entityName, navigate]);

  // Helpers para obra/regional/projetos
  const obraSelecionada = useMemo(() => obras.find(o => o.id === formData.obra_id), [obras, formData.obra_id]);
  const regionalSelecionada = useMemo(() => obraSelecionada ? regionais.find(r => r.id === obraSelecionada.regional_id) : null, [obraSelecionada, regionais]);
  const projetosDisponiveis = useMemo(() => {
    if (!regionalSelecionada || !projects) return [];
    const regionalProjectIds = regionalSelecionada.project_ids || [];
    return projects.filter(p =>
      regionalProjectIds.includes(p.id) &&
      p.status === 'ativo'
    );
  }, [regionalSelecionada, projects]);

  // Permissões
  const isApproved = formData.approved === true && formData.status !== 'rascunho';
  const userCanEdit = user?.role === 'admin' || (formData.created_by === user?.email && (formData.status === 'rascunho' || formData.approved === false || formData.approved === null));
  const isEditable = !editingChecklist?.id || userCanEdit;

  return {
    obras,
    regionais,
    projects,
    faixas,
    user,
    allUsers,
    editingChecklist,
    loading,
    formData,
    setFormData,
    obraSelecionada,
    regionalSelecionada,
    projetosDisponiveis,
    isApproved,
    userCanEdit,
    isEditable,
    clearSavedData,
    navigate,
  };
}