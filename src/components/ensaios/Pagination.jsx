import React from "react";
import { Button } from "@/components/ui/button";

export const Pagination = React.memo(({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="text-[#00233B] border-white/20 hover:bg-black/10"
      >
        Anterior
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          // Show first page, last page, current page, and pages around current
          const showPage = page === 1 || 
                           page === totalPages || 
                           (page >= currentPage - 1 && page <= currentPage + 1);
          
          if (!showPage && page === currentPage - 2) {
            return <span key={page} className="px-2 text-[#00233B]/50">...</span>;
          }
          if (!showPage && page === currentPage + 2) {
            return <span key={page} className="px-2 text-[#00233B]/50">...</span>;
          }
          if (!showPage) return null;

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={currentPage === page ? "bg-[#00233B] text-white" : "text-[#00233B] border-white/20 hover:bg-black/10"}
            >
              {page}
            </Button>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="text-[#00233B] border-white/20 hover:bg-black/10"
      >
        Próxima
      </Button>
    </div>
  );
});

Pagination.displayName = 'Pagination';