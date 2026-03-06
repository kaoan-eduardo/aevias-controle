import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Configurar worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
        <img
          key={i}
          src={dataUrl}
          alt={`Página ${i + 1}`}
          className="w-full block"
          style={{ pageBreakAfter: i < pages.length - 1 ? "always" : "auto" }}
        />
      ))}
    </div>
  );
}