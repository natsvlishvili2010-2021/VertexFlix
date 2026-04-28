'use client';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const maxVisiblePages = 5;
  
  // Calculate the range of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-12">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* First Page + Ellipsis if needed */}
      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium"
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="text-white/30 px-1">...</span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-10 h-10 rounded-lg border transition-all text-sm font-medium ${
            currentPage === p
              ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]'
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
          }`}
        >
          {p}
        </button>
      ))}

      {/* Show ellipsis if there are more pages, but hide the exact total number */}
      {currentPage < totalPages && (
        <span className="text-white/30 px-1">...</span>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
