import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, ExternalLink, Loader2 } from 'lucide-react';
import { exportarRelatoriosZip } from '@/utils/exportZip';

export default function BulkSelectionBar({ selectedCount, ensaiosSelecionados, onOpenAll, onClear }) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  if (selectedCount === 0) return null;

  const handleExportZip = async () => {
    if (!ensaiosSelecionados || ensaiosSelecionados.length === 0) return;
    setExporting(true);
    setProgress({ current: 0, total: ensaiosSelecionados.length });
    try {
      await exportarRelatoriosZip(ensaiosSelecionados, (current, total) => {
        setProgress({ current, total });
      });
    } catch (err) {
      console.error('Erro ao exportar ZIP:', err);
      alert('Erro ao gerar arquivo ZIP. Tente novamente.');
    } finally {
      setExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#00233B] text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-white/10">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
      </span>

      {exporting ? (
        <div className="flex items-center gap-2 text-xs text-white/80">
          <Loader2 className="w-4 h-4 animate-spin text-[#BFCF99]" />
          <span>Gerando PDF {progress.current}/{progress.total}...</span>
        </div>
      ) : (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenAll}
            className="text-white hover:bg-white/10 h-8 text-xs gap-1"
            title="Abrir relatórios em novas abas"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#BFCF99]" />
            Abrir abas
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleExportZip}
            className="text-white hover:bg-white/10 h-8 text-xs gap-1"
            title="Exportar PDFs em ZIP"
          >
            <Download className="w-3.5 h-3.5 text-[#BFCF99]" />
            Exportar ZIP
          </Button>
        </>
      )}

      <button
        onClick={onClear}
        className="text-white/60 hover:text-white transition-colors ml-1"
        title="Limpar seleção"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}