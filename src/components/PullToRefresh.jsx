import React, { useRef, useState, useCallback } from "react";

const THRESHOLD = 80;

export default function PullToRefresh({ children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  const isInputFocused = useCallback(() => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (isInputFocused()) return;
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, [isInputFocused]);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null || refreshing || isInputFocused()) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, [refreshing, isInputFocused]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !isInputFocused()) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await new Promise((r) => setTimeout(r, 800));
      window.location.reload();
    } else {
      setPullDistance(0);
    }
    startYRef.current = null;
  }, [pullDistance, isInputFocused]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 5;

  // Desabilitar pull-to-refresh em páginas de formulário/digitação
  const isFormPage = typeof window !== 'undefined' && 
    (window.location.pathname.includes('Checklist') || 
     window.location.pathname.includes('Ensaio') ||
     window.location.pathname.includes('Diario') ||
     window.location.pathname.includes('Boletim') ||
     window.location.pathname.includes('Acompanhamento'));

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Pull indicator - desabilitado em páginas de formulário */}
      {showIndicator && !isFormPage && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-30 pointer-events-none transition-all"
          style={{ height: pullDistance, opacity: progress }}
        >
          <div
            className={`w-8 h-8 rounded-full border-2 border-[#BFCF99] border-t-transparent flex items-center justify-center ${
              refreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
              transition: refreshing ? undefined : "transform 0.1s linear",
            }}
          />
        </div>
      )}

      {/* Scrollable content - pull-to-refresh desabilitado em formulários */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-transparent"
        style={{
          transform: pullDistance > 0 && !isFormPage ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? "transform 0.3s ease" : undefined,
        }}
        onTouchStart={isFormPage ? undefined : handleTouchStart}
        onTouchMove={isFormPage ? undefined : handleTouchMove}
        onTouchEnd={isFormPage ? undefined : handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}