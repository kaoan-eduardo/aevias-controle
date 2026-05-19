import { base44 } from '@/api/base44Client';

/**
 * Service centralizado para upload de arquivos e imagens
 */

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export async function uploadImagem(file) {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Tipo de arquivo inválido. Aceitos: JPEG, PNG, GIF, WebP`);
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Arquivo excede o tamanho máximo de 10MB');
  }

  return base44.integrations.Core.UploadFile({ file });
}

export async function uploadMultiplasImagens(files) {
  const validFiles = Array.from(files || []).filter(f => VALID_IMAGE_TYPES.includes(f.type));

  if (validFiles.length === 0) {
    throw new Error('Nenhum arquivo válido foi selecionado');
  }

  const uploads = validFiles.map(async (file, index) => ({
    id: `${Date.now()}_${index}`,
    fileName: file.name,
    file,
  }));

  const promises = validFiles.map(file => uploadImagem(file));
  const results = await Promise.allSettled(promises);

  return results.map((result, index) => ({
    fileName: validFiles[index].name,
    status: result.status,
    url: result.status === 'fulfilled' ? result.value.file_url : null,
    error: result.status === 'rejected' ? result.reason.message : null,
  }));
}

export async function uploadArquivo(file) {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Arquivo excede o tamanho máximo de 50MB');
  }

  return base44.integrations.Core.UploadFile({ file });
}