import { useEffect, useRef } from 'react';

/**
 * Hook para persistir dados do formulário em sessionStorage
 * Salva automaticamente quando formData muda e recupera ao montar
 */
export function useFormPersistence(formKey, formData, setFormData, isEditing = false) {
  const storageKey = `form_autosave_${formKey}`;
  const isInitialMount = useRef(true);

  // Recuperar dados salvos ao montar (apenas se não estiver editando)
  useEffect(() => {
    if (!isEditing && isInitialMount.current) {
      try {
        const savedData = sessionStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          console.log('📥 Recuperando dados salvos do formulário:', formKey);
          setFormData(parsed);
        }
      } catch (error) {
        console.error('Erro ao recuperar dados do formulário:', error);
      }
      isInitialMount.current = false;
    }
  }, [storageKey, setFormData, isEditing, formKey]);

  // Auto-save quando formData muda (debounced)
  useEffect(() => {
    if (isInitialMount.current) return;

    const timeoutId = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
        console.log('💾 Auto-save realizado:', formKey);
      } catch (error) {
        console.error('Erro ao salvar dados do formulário:', error);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey, formKey]);

  // Função para limpar dados salvos (chamar após submissão ou cancelamento)
  const clearSavedData = () => {
    try {
      sessionStorage.removeItem(storageKey);
      console.log('🗑️ Dados do formulário removidos:', formKey);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  };

  return { clearSavedData };
}