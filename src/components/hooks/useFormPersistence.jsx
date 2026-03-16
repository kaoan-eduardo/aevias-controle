import { useEffect, useRef } from 'react';

/**
 * Hook para persistir dados do formulário em sessionStorage
 * Salva automaticamente quando formData muda e recupera ao montar
 */
export function useFormPersistence(formKey, formData, setFormData, isEditing = false) {
  const storageKey = `form_autosave_${formKey}`;
  const isInitialMount = useRef(true);

  // Verificar se há editId na URL — se sim, nunca usar sessionStorage
  const hasEditId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).has('editId')
    : false;

  // Recuperar dados salvos ao montar (apenas se for novo registro, sem editId na URL)
  useEffect(() => {
    if (!hasEditId && isInitialMount.current) {
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
    }
    isInitialMount.current = false;
  }, []); // Roda apenas uma vez na montagem

  // Auto-save quando formData muda (debounced) — apenas para novos registros
  useEffect(() => {
    if (isInitialMount.current || hasEditId) return;

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