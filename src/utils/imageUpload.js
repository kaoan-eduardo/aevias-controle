import { base44 } from '@/api/base44Client';

/**
 * Comprime uma imagem antes do upload usando Canvas API.
 * Reduz fotos de câmera de ~5-10MB para ~200-500KB.
 */
export async function compressImage(file, maxWidth = 1920, quality = 0.82) {
  // Só comprimir imagens
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Redimensionar se necessário
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Se não conseguiu comprimir ou ficou maior, usar original
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback para original
    };

    img.src = url;
  });
}

/**
 * Comprime e faz upload de um arquivo de imagem.
 * Retorna a URL do arquivo enviado.
 */
export async function compressAndUpload(file) {
  const compressed = await compressImage(file);
  const result = await base44.integrations.Core.UploadFile({ file: compressed });
  return result.file_url;
}

/**
 * Faz upload de múltiplos arquivos em paralelo com compressão.
 * Retorna array de { url, error, fileName }
 */
export async function uploadMultipleFiles(files, onProgress) {
  const results = await Promise.allSettled(
    files.map(async (file, i) => {
      onProgress?.(i, 'uploading');
      const url = await compressAndUpload(file);
      onProgress?.(i, 'success');
      return url;
    })
  );

  const urls = [];
  const errors = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      urls.push(result.value);
    } else {
      onProgress?.(i, 'error', result.reason?.message);
      errors.push({ fileName: files[i].name, error: result.reason?.message });
    }
  });

  return { urls, errors };
}