import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Regional } from '@/entities/Regional';

export const useGestoresRegional = (obraId, obras, allUsers = []) => {
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGestores = useCallback(async () => {
    if (!obraId || !obras.length) {
      setGestores([]);
      return;
    }

    setLoading(true);
    try {
      const obra = obras.find(o => o.id === obraId);
      if (!obra) {
        setGestores([]);
        return;
      }

      const regionaisData = await Regional.list();
      const regional = regionaisData.find(r => r.id === obra.regional_id);

      if (regional) {
        const emailsGestores = [
          ...(regional.gestores_contrato_responsaveis || []),
          ...(regional.gestor_contrato_responsavel ? [regional.gestor_contrato_responsavel] : [])
        ];

        if (emailsGestores.length > 0) {
          // Se allUsers foi passado e não está vazio, usá-lo. Senão, carregar usuários
          const todosUsuarios = allUsers.length > 0 ? allUsers : await base44.entities.User.list();
          const gestoresData = todosUsuarios.filter(u =>
            emailsGestores.some(email => email.toLowerCase() === u.email?.toLowerCase())
          );
          setGestores(gestoresData);
        } else {
          setGestores([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar gestores da regional:', error);
      setGestores([]);
    } finally {
      setLoading(false);
    }
  }, [obraId, obras, allUsers]);

  useEffect(() => {
    loadGestores();
  }, [loadGestores]);

  return { gestores, loading };
};