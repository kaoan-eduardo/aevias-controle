import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, CheckCircle } from "lucide-react";

export default function ChecklistFooter({
  isEditable,
  isApproved,
  loadingUpload,
  onCancel,
  onSaveProgress,
  onFinalize,
}) {
  return (
    <div className="flex justify-end gap-4 mt-6">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      {isEditable && !isApproved && (
        <>
          <Button 
            type="button" 
            variant="outline"
            disabled={loadingUpload}
            onClick={onSaveProgress}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Save className="mr-2 h-4 w-4" /> Salvar Progresso
          </Button>
          <Button type="submit" disabled={loadingUpload} className="bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" /> Finalizar
          </Button>
        </>
      )}
      {isApproved && (
        <Badge className="bg-green-500 hover:bg-green-500 px-4 py-2 text-md">
          <CheckCircle className="mr-2 h-4 w-4" /> Aprovado
        </Badge>
      )}
    </div>
  );
}