import { useState, useCallback } from 'react';

/**
 * Hook para salvar registros com status em_execucao/finalizado
 * @param {Object} entity - Entidade do base44 (ex: DiarioObra, EnsaioCAUQ)
 * @param {string} recordId - ID do registro (undefined para novo registro)
 * @returns {Object} { saveRecord, isSaving, error }
 */
export function useAutoSaveRecord(entity, recordId) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveRecord = useCallback(
    async (formData, isFinalizado = false) => {
      if (!entity) return;

      setIsSaving(true);
      setError(null);

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

        let newRecordId = recordId;
        if (recordId) {
          await entity.update(recordId, dataToSave);
        } else {
          const newRecord = await entity.create(dataToSave);
          newRecordId = newRecord.id;
        }

        setIsSaving(false);
        return newRecordId;
      } catch (err) {
        console.error('Erro ao salvar registro:', err);
        setError(err.message);
        setIsSaving(false);
        throw err;
      }
    },
    [entity, recordId]
  );

  return {
    saveRecord,
    isSaving,
    error
  };
}