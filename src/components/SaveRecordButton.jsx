import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

/**
 * Botão reutilizável para salvar registro em progresso
 */
export default function SaveRecordButton({ 
  onClick, 
  isSaving = false, 
  isFinalizado = false,
  disabled = false,
  className = ""
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isSaving || disabled}
      className={`bg-[#566E3D] hover:bg-[#566E3D]/90 text-white ${className}`}
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Salvando...
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          {isFinalizado ? 'Finalizar Registro' : 'Salvar Progresso'}
        </>
      )}
    </Button>
  );
}