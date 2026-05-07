import { ChevronLeft, ChevronRight } from "lucide-react";

const maxVisiblePages = 5;

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - halfWindow);
  let end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({ currentPage, onPageChange, totalPages }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);
  const firstVisiblePage = visiblePages[0];
  const lastVisiblePage = visiblePages[visiblePages.length - 1];

  function goToPage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }

    onPageChange(nextPage);
  }

  return (
    <nav className="pagination-controls" aria-label="Paginare anunturi">
      <button
        className="pagination-arrow"
        type="button"
        disabled={currentPage <= 1}
        aria-label="Pagina anterioara"
        onClick={() => goToPage(currentPage - 1)}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      <div className="pagination-pages">
        {firstVisiblePage > 1 ? (
          <>
            <button className="pagination-page" type="button" onClick={() => goToPage(1)}>
              1
            </button>
            {firstVisiblePage > 2 ? <span className="pagination-ellipsis">...</span> : null}
          </>
        ) : null}

        {visiblePages.map((pageNumber) => (
          <button
            className={`pagination-page ${pageNumber === currentPage ? "active" : ""}`}
            type="button"
            aria-current={pageNumber === currentPage ? "page" : undefined}
            key={pageNumber}
            onClick={() => goToPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        {lastVisiblePage < totalPages ? (
          <>
            {lastVisiblePage < totalPages - 1 ? <span className="pagination-ellipsis">...</span> : null}
            <button className="pagination-page" type="button" onClick={() => goToPage(totalPages)}>
              {totalPages}
            </button>
          </>
        ) : null}
      </div>

      <button
        className="pagination-arrow"
        type="button"
        disabled={currentPage >= totalPages}
        aria-label="Pagina urmatoare"
        onClick={() => goToPage(currentPage + 1)}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </nav>
  );
}
