import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook reutilizável para auto-save de registros com status em_execucao/finalizado
 * @param {Object} entity - Entidade do base44 (ex: DiarioObra, EnsaioCAUQ)
 * @param {string} recordId - ID do registro (undefined para novo registro)
 * @param {boolean} autoSaveEnabled - Se auto-save está ativado
 * @param {number} autoSaveInterval - Intervalo em ms para auto-save (padrão: 30000)
 * @returns {Object} { saveRecord, isSaving, lastSavedAt, error }
 */
export function useAutoSaveRecord(entity, recordId, autoSaveEnabled = true, autoSaveInterval = 30000) {
  const timeoutRef = useRef(null);
  const lastFormDataRef = useRef(null);

  const saveRecord = useCallback(
    async (formData, isFinalizado = false) => {
      if (!entity) return;

      try {
        const dataToSave = {
          ...formData,
          status_preenchimento: isFinalizado ? 'finalizado' : 'em_execucao'
        };

        // Remove campos vazios
        Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key] === '' || dataToSave[key] === null) {
            delete dataToSave[key];
          }
        });

        if (recordId) {
          await entity.update(recordId, dataToSave);
        } else {
          const newRecord = await entity.create(dataToSave);
          return newRecord.id;
        }
      } catch (error) {
        console.error('Erro ao salvar registro:', error);
        throw error;
      }
    },
    [entity, recordId]
  );

  // Função auxiliar para agendamento de auto-save
  const scheduleAutoSave = useCallback(
    (formData) => {
      if (!autoSaveEnabled || !entity) return;

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Comparar com último dado salvo
      if (JSON.stringify(lastFormDataRef.current) === JSON.stringify(formData)) {
        return; // Sem mudanças
      }

      lastFormDataRef.current = JSON.stringify(formData);

      // Agendar novo save
      timeoutRef.current = setTimeout(() => {
        saveRecord(formData, false).catch(err => {
          console.error('Auto-save falhou:', err);
        });
      }, autoSaveInterval);
    },
    [autoSaveEnabled, entity, saveRecord, autoSaveInterval]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveRecord,
    scheduleAutoSave
  };
}