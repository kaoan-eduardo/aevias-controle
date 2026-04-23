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
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

/**
 * Carrega uma URL do relatório em um iframe oculto e retorna o documento
 */
function loadReportInIframe(url) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1200px';
    iframe.style.height = '900px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);

    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      reject(new Error('Timeout carregando relatório'));
    }, 30000);

    iframe.onload = () => {
      clearTimeout(timeout);
      // Aguardar renderização
      setTimeout(() => {
        resolve({ iframe, doc: iframe.contentDocument || iframe.contentWindow.document });
      }, 3000);
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

  // Capturar como canvas
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

  // Criar PDF A4
  const imgData = canvas.toDataURL('image/jpeg', 0.85);
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

  // Remover iframe
  document.body.removeChild(iframeEl);

  return pdf.output('blob');
}

/**
 * Exporta múltiplos ensaios como PDFs zipados
 * @param {Array} ensaios - lista de ensaios selecionados com { url, laboratorista, tipoRegistro, data }
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
      // Continua para o próximo
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  saveAs(zipBlob, `relatorios_${timestamp}.zip`);
}