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
 * Espera até que os textos de loading desapareçam do documento do iframe.
 * Textos de loading conhecidos: "Carregando relatório...", "Otimizando imagens para impressão..."
 */
function waitForReportReady(iframeDoc, maxWait = 30000) {
  const loadingTexts = [
    'Carregando relatório',
    'Otimizando imagens para impressão',
    'Carregando...',
  ];

  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const bodyText = iframeDoc.body ? iframeDoc.body.innerText || '' : '';
      const elapsed = Date.now() - start;

      const isLoading = loadingTexts.some(t => bodyText.includes(t));
      const hasContent = bodyText.trim().length > 100; // Tem conteúdo real

      if (!isLoading && hasContent) {
        // Aguarda mais um pouco para garantir renderização de imagens
        setTimeout(resolve, 2000);
      } else if (elapsed >= maxWait) {
        reject(new Error('Timeout aguardando relatório carregar'));
      } else {
        setTimeout(check, 500);
      }
    }

    check();
  });
}

/**
 * Carrega uma URL do relatório em um iframe oculto e aguarda estar pronto
 */
function loadReportInIframe(url) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1200px';
    iframe.style.height = '1600px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);

    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      reject(new Error('Timeout carregando relatório'));
    }, 60000);

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        // Aguarda o relatório terminar de renderizar
        await waitForReportReady(doc, 45000);
        clearTimeout(timeout);
        resolve({ iframe, doc });
      } catch (err) {
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        reject(err);
      }
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      document.body.removeChild(iframe);
      reject(new Error('Erro ao carregar relatório'));
    };

    iframe.src = url;
  });
}

/**
 * Converte o documento do iframe em PDF (blob)
 */
async function documentToPdfBlob(iframeDoc, iframeEl) {
  const body = iframeDoc.body;
  if (!body) throw new Error('Documento sem body');

  const canvas = await html2canvas(body, {
    useCORS: true,
    allowTaint: true,
    scale: 1.5,
    logging: false,
    windowWidth: 1200,
    windowHeight: body.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    width: 1200,
    height: body.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.88);
  const pdfWidth = 210; // mm A4
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let yOffset = 0;
  const pageHeight = pdf.internal.pageSize.getHeight();

  while (yOffset < pdfHeight) {
    if (yOffset > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -yOffset, pdfWidth, pdfHeight);
    yOffset += pageHeight;
  }

  document.body.removeChild(iframeEl);

  return pdf.output('blob');
}

/**
 * Exporta múltiplos ensaios como PDFs zipados
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
      console.error(`Erro ao gerar PDF para ${ensaios[i].tipoRegistro}:`, err);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  saveAs(zipBlob, `relatorios_${timestamp}.zip`);
}