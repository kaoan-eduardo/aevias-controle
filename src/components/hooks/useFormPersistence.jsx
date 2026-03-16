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
          console.log('📥 Recuperando dados salvos do formulário:', formKey);
          setFormData(parsed);
          hasRestoredRef.current = true;
        }
      } catch (error) {
        console.error('Erro ao recuperar dados do formulário:', error);
      }
      isInitialMount.current = false;
    }
  }, [storageKey, setFormData, isEditing, formKey, hasEditId]);

  // Auto-save quando formData muda (debounced) - não salvar quando estiver editando via editId
  useEffect(() => {
    if (isInitialMount.current) return;
    if (hasEditId) return; // Nunca salvar no sessionStorage quando editando registro existente

    const timeoutId = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
        console.log('💾 Auto-save realizado:', formKey);
      } catch (error) {
        console.error('Erro ao salvar dados do formulário:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey, formKey, hasEditId]);

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