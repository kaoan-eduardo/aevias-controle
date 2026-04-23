import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

/**
 * Sanitiza string para uso seguro em nome de arquivo
 */
function sanitizeFileName(str) {
  if (!str) return 'desconhecido';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

/**
 * Espera até o relatório estar pronto: sem texto de loading E com conteúdo real
 */
function waitForReportReady(iframeWin, maxWait = 90000) {
  const loadingTexts = [
    'carregando relatório',
    'otimizando imagens',
    'carregando...',
  ];

  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const elapsed = Date.now() - start;
      try {
        const body = iframeWin.document.body;
        if (!body) {
          if (elapsed >= maxWait) return reject(new Error('Timeout: body nunca apareceu'));
          return setTimeout(check, 500);
        }
        const text = (body.innerText || '').toLowerCase();
        const isLoading = loadingTexts.some(t => text.includes(t));
        const hasContent = text.trim().length > 150;

        if (!isLoading && hasContent) {
          // Aguarda mais 5s para imagens, fontes e estilos terminarem
          setTimeout(resolve, 5000);
        } else if (elapsed >= maxWait) {
          reject(new Error(`Timeout aguardando relatório (${Math.round(elapsed / 1000)}s)`));
        } else {
          setTimeout(check, 800);
        }
      } catch (e) {
        if (elapsed >= maxWait) return reject(e);
        setTimeout(check, 800);
      }
    }

    setTimeout(check, 3000);
  });
}

/**
 * Carrega uma URL em um iframe oculto e aguarda o relatório renderizar.
 * Retorna { iframe, iframeWin }
 */
function loadReportInIframe(url) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 1240px;
      height: 1754px;
      opacity: 0;
      pointer-events: none;
      z-index: -999;
      border: none;
      background: white;
    `;
    document.body.appendChild(iframe);

    const hardTimeout = setTimeout(() => {
      cleanup();
      reject(new Error('Hard timeout (120s)'));
    }, 120000);

    function cleanup() {
      clearTimeout(hardTimeout);
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }

    iframe.onload = async () => {
      try {
        const iframeWin = iframe.contentWindow;
        await waitForReportReady(iframeWin, 90000);
        resolve({ iframe, iframeWin });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error('Erro ao carregar iframe'));
    };

    iframe.src = url;
  });
}

/**
 * Usa a API de impressão nativa: injeta um script no iframe que chama print(),
 * mas como isso não gera blob, usamos html2canvas com os estilos do app copiados.
 */
async function captureIframeAsPdf(iframe, iframeWin) {
  const iframeDoc = iframeWin.document;
  const body = iframeDoc.body;

  // 1. Esconder elementos que não devem aparecer no PDF
  const hiddenEls = iframeDoc.querySelectorAll('.print\\:hidden, [class*="print:hidden"], .no-print');
  hiddenEls.forEach(el => el.style.setProperty('display', 'none', 'important'));

  // 2. Copiar todos os stylesheets do documento principal para o iframe
  const existingLinks = new Set(
    Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href)
  );

  const stylePromises = [];

  // Copiar <link rel="stylesheet"> do host
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    if (!existingLinks.has(link.href)) {
      const newLink = iframeDoc.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = link.href;
      iframeDoc.head.appendChild(newLink);
      stylePromises.push(
        new Promise(res => {
          newLink.onload = res;
          newLink.onerror = res;
          setTimeout(res, 3000);
        })
      );
    }
  });

  // Copiar <style> inline do host
  document.querySelectorAll('style').forEach(style => {
    const newStyle = iframeDoc.createElement('style');
    newStyle.textContent = style.textContent;
    iframeDoc.head.appendChild(newStyle);
  });

  // Aguarda stylesheets carregarem
  if (stylePromises.length > 0) {
    await Promise.all(stylePromises);
    await new Promise(res => setTimeout(res, 2000));
  }

  // 3. Garantir fundo branco
  body.style.background = 'white';
  iframeDoc.documentElement.style.background = 'white';

  // 4. Obter dimensões reais do conteúdo
  const scrollHeight = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    iframeDoc.documentElement.scrollHeight,
    1200
  );

  // 5. Redimensionar iframe para mostrar conteúdo completo
  iframe.style.height = scrollHeight + 'px';
  iframe.style.width = '1240px';
  iframe.style.opacity = '0';

  await new Promise(res => setTimeout(res, 1000));

  // 6. Capturar com html2canvas
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(body, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1240,
    windowHeight: scrollHeight,
    scrollX: 0,
    scrollY: 0,
    width: 1240,
    height: scrollHeight,
    foreignObjectRendering: false,
    imageTimeout: 30000,
    removeContainer: false,
  });

  // 7. Gerar PDF A4 com múltiplas páginas
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdfWidthMm = 210;
  const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;
  const pageHeightMm = 297; // A4

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yOffset = 0;
  let pageCount = 0;
  while (yOffset < pdfHeightMm) {
    if (pageCount > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -yOffset, pdfWidthMm, pdfHeightMm);
    yOffset += pageHeightMm;
    pageCount++;
  }

  // 8. Remover iframe
  if (document.body.contains(iframe)) document.body.removeChild(iframe);

  return pdf.output('blob');
}

/**
 * Exporta múltiplos ensaios como PDFs num ZIP
 * @param {Array} ensaios - lista de { url, laboratorista, tipoRegistro, data }
 * @param {Function} onProgress - callback(current, total)
 */
export async function exportarRelatoriosZip(ensaios, onProgress) {
  const zip = new JSZip();
  const total = ensaios.length;

  for (let i = 0; i < ensaios.length; i++) {
    const { url, laboratorista, tipoRegistro, data } = ensaios[i];
    onProgress && onProgress(i + 1, total);

    try {
      const labSafe = sanitizeFileName(laboratorista);
      const tipoSafe = sanitizeFileName(tipoRegistro);
      const dataSafe = sanitizeFileName(data);
      const fileName = `${labSafe} - ${tipoSafe} - ${dataSafe}.pdf`;

      const fullUrl = window.location.origin + url;
      const { iframe, iframeWin } = await loadReportInIframe(fullUrl);
      const pdfBlob = await captureIframeAsPdf(iframe, iframeWin);
      zip.file(fileName, pdfBlob);
    } catch (err) {
      console.error(`Erro ao gerar PDF [${ensaios[i]?.tipoRegistro}]:`, err.message);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  saveAs(zipBlob, `relatorios_${timestamp}.zip`);
}