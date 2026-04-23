import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
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
 * Espera até o relatório no iframe estar completamente renderizado.
 * Verifica que os textos de loading sumiram E que há conteúdo real.
 */
function waitForReportReady(iframeDoc, maxWait = 60000) {
  const loadingTexts = [
    'Carregando relatório',
    'Otimizando imagens para impressão',
    'Carregando...',
    'carregando',
  ];

  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const elapsed = Date.now() - start;
      const body = iframeDoc.body;

      if (!body) {
        if (elapsed >= maxWait) return reject(new Error('Timeout: body nunca apareceu'));
        return setTimeout(check, 500);
      }

      const bodyText = body.innerText || '';
      const isLoading = loadingTexts.some(t => bodyText.toLowerCase().includes(t.toLowerCase()));
      const hasContent = bodyText.trim().length > 200;

      if (!isLoading && hasContent) {
        // Aguarda mais 4 segundos para imagens e estilos renderizarem
        setTimeout(resolve, 4000);
      } else if (elapsed >= maxWait) {
        reject(new Error(`Timeout aguardando relatório (${Math.round(elapsed / 1000)}s)`));
      } else {
        setTimeout(check, 800);
      }
    }

    // Começa checando após 2 segundos (tempo mínimo de boot do React)
    setTimeout(check, 2000);
  });
}

/**
 * Carrega URL em iframe oculto e aguarda relatório estar pronto
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
      z-index: -1;
      border: none;
    `;
    document.body.appendChild(iframe);

    const hardTimeout = setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      reject(new Error('Hard timeout (90s) carregando relatório'));
    }, 90000);

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        await waitForReportReady(doc, 60000);
        clearTimeout(hardTimeout);
        resolve({ iframe, doc });
      } catch (err) {
        clearTimeout(hardTimeout);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        reject(err);
      }
    };

    iframe.onerror = () => {
      clearTimeout(hardTimeout);
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      reject(new Error('Erro ao carregar iframe'));
    };

    iframe.src = url;
  });
}

/**
 * Captura o documento do iframe e gera PDF blob
 */
async function documentToPdfBlob(iframeDoc, iframeEl) {
  const body = iframeDoc.body;
  if (!body) throw new Error('Documento sem body');

  // Esconder a barra de aprovação (print:hidden) antes de capturar
  const printHiddenEls = iframeDoc.querySelectorAll('.print\\:hidden, .no-print');
  printHiddenEls.forEach(el => { el.style.display = 'none'; });

  const scrollH = Math.max(body.scrollHeight, body.offsetHeight, 800);

  const canvas = await html2canvas(body, {
    useCORS: true,
    allowTaint: true,
    scale: 1.5,
    logging: false,
    windowWidth: 1240,
    windowHeight: scrollH,
    scrollX: 0,
    scrollY: 0,
    width: 1240,
    height: scrollH,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.88);
  const pdfWidth = 210; // A4 mm
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = pdf.internal.pageSize.getHeight();
  let yOffset = 0;

  while (yOffset < pdfHeight) {
    if (yOffset > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -yOffset, pdfWidth, pdfHeight);
    yOffset += pageHeight;
  }

  if (document.body.contains(iframeEl)) document.body.removeChild(iframeEl);

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
      const { iframe, doc } = await loadReportInIframe(fullUrl);
      const pdfBlob = await documentToPdfBlob(doc, iframe);
      zip.file(fileName, pdfBlob);
    } catch (err) {
      console.error(`Erro ao gerar PDF [${ensaios[i].tipoRegistro}]:`, err.message);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  saveAs(zipBlob, `relatorios_${timestamp}.zip`);
}