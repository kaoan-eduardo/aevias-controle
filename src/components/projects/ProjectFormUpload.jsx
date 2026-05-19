import React from "react";
import { Card } from "@/components/ui/card";
import { FileUp, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProjectFormUpload({
  formData,
  isExtracting,
  uploadedFile,
  extractionError,
  onFileUpload,
  onExtractionError,
  onExtractionStart,
  onExtractionEnd,
  project,
  onFormDataUpdate
}) {
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.tipo_projeto || !formData.faixa_granulometrica_id || !formData.regional_id) {
      onExtractionError('Por favor, selecione o tipo de projeto, faixa granulométrica e regional antes de fazer upload.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      onExtractionError('O arquivo é muito grande. Tamanho máximo: 50MB');
      return;
    }

    onExtractionStart();

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onFileUpload(file_url);

      const response = await base44.functions.invoke('extrairDadosProjeto', {
        file_url,
        tipo_projeto: formData.tipo_projeto,
        faixa_id: formData.faixa_granulometrica_id,
        regional_id: formData.regional_id
      });

      if (response.success && response.dados) {
        onFormDataUpdate(response.dados);
        alert('✅ Dados extraídos com sucesso! Revise os campos antes de salvar.');
      } else {
        throw new Error('Falha ao extrair dados do arquivo');
      }

    } catch (error) {
      onExtractionError(error.message || 'Erro ao extrair dados do arquivo');
    } finally {
      onExtractionEnd();
    }
  };

  const shouldShow = !formData.tipo_projeto === 'CARTA_TRACO_CONCRETO' && 
                     formData.tipo_projeto && 
                     formData.faixa_granulometrica_id && 
                     formData.regional_id && 
                     !project;

  if (!shouldShow) return null;

  return (
    <div className="p-4 border-2 border-dashed border-[#BFCF99] rounded-lg bg-[#BFCF99]/5">
      <div className="flex items-start gap-3 mb-3">
        <Sparkles className="w-5 h-5 text-[#00233B] mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-[#00233B] mb-1">
            Agente de IA - Preenchimento Automático
          </h3>
          <p className="text-sm text-[#00233B]/80 mb-3">
            Faça upload de um arquivo do projeto (PDF, imagem, documento) e deixe a IA preencher os parâmetros automaticamente.
          </p>

          {isExtracting ? (
            <div className="flex items-center gap-2 text-[#00233B]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analisando arquivo e extraindo dados...</span>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#00233B] text-[#F2F1EF] rounded-lg cursor-pointer hover:bg-[#00233B]/90 transition-colors">
              <FileUp className="w-4 h-4" />
              <span className="text-sm font-medium">Escolher Arquivo do Projeto</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isExtracting}
              />
            </label>
          )}

          {uploadedFile && !isExtracting && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Arquivo processado com sucesso
            </div>
          )}

          {extractionError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {extractionError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}