import { useEffect, useRef } from 'react';

/**
 * Hook para persistir dados do formulário em sessionStorage
 * Salva automaticamente quando formData muda e recupera ao montar
 */
export function useFormPersistence(formKey, formData, setFormData, isEditing = false) {
  const storageKey = `form_autosave_${formKey}`;
  const isInitialMount = useRef(true);
  const hasRestoredRef = useRef(false);

  // Verificar se há editId na URL para não restaurar sessionStorage quando editando
  const hasEditId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).has('editId')
    : false;

  // Recuperar dados salvos ao montar (apenas se não estiver editando e não houver editId na URL)
  useEffect(() => {
    // Se há editId na URL, limpar sessionStorage e não restaurar nada
    if (hasEditId) {
      sessionStorage.removeItem(storageKey);
      isInitialMount.current = false;
      return;
    }
    if (!isEditing && isInitialMount.current && !hasRestoredRef.current) {
      try {
        const savedData = sessionStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFormData(parsed);
          hasRestoredRef.current = true;
        }
      } catch (error) {
        console.error('[useFormPersistence] Erro ao recuperar dados do formulário:', error?.message || error);
      }
      isInitialMount.current = false;
    }
  }, [storageKey, setFormData, isEditing, formKey, hasEditId]);

  // Auto-save quando formData muda (debounced 1s) - não salvar quando estiver editando via editId
  useEffect(() => {
    if (isInitialMount.current) return;
    if (hasEditId) return; // Nunca salvar no sessionStorage quando editando registro existente

    const timeoutId = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.error('[useFormPersistence] Erro ao persistir formulário:', error?.message || error);
      }
    }, 1000); // Aumentado para 1s para reduzir frequência de writes

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey, hasEditId]);

  // Função para limpar dados salvos (chamar após submissão ou cancelamento)
  const clearSavedData = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error('[useFormPersistence] Erro ao limpar dados do formulário:', error?.message || error);
    }
  };

  return { clearSavedData };
}