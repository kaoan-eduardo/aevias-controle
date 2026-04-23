import React from "react";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink } from "lucide-react";

export default function BulkSelectionBar({ selectedCount, onOpenAll, onClear }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#00233B] text-white px-5 py-3 rounded-full shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} {selectedCount === 1 ? "registro selecionado" : "registros selecionados"}
      </span>
      <Button
        size="sm"
        className="bg-[#BFCF99] text-[#00233B] hover:bg-[#BFCF99]/80 font-semibold h-8 px-3 text-xs whitespace-nowrap"
        onClick={onOpenAll}
      >
        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
        Abrir relatórios ({selectedCount})
      </Button>
      <button
        onClick={onClear}
        className="text-white/60 hover:text-white transition-colors ml-1"
        title="Cancelar seleção"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}