import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export default function PdfRenderer({ url }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    async function renderPdf() {
      setLoading(true);
      const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
      const rendered = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        rendered.push(canvas.toDataURL("image/png"));
      }

      if (!cancelled) {
        setPages(rendered);
        setLoading(false);
      }
    }

    renderPdf();
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="text-sm text-gray-400">Carregando PDF...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {pages.map((dataUrl, i) => (
        <picture key={i}><source srcSet={dataUrl} /><img src={dataUrl} alt={`Página ${i + 1}`} className="w-full block" width="auto" height="auto" style={{ pageBreakAfter: i < pages.length - 1 ? "always" : "auto" }} /></picture>
      ))}
    </div>
  );
}