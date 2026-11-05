import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable Pagination component
 * @param {number} currentPage Current active page (1-based)
 * @param {number} totalPages Total number of pages
 * @param {function} onPageChange Callback when page changes: (pageNumber) => void
 * @param {number} totalItems Total number of items across all pages
 * @param {number} itemsPerPage Number of items per page
 * @param {string} itemLabel Singular or plural label (e.g. "analyses", "competitors")
 */
function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  itemLabel = "items",
  className = "",
}) {
  if (totalPages <= 1 && (!totalItems || totalItems <= itemsPerPage)) {
    return null;
  }

  const startRecord = (currentPage - 1) * itemsPerPage + 1;
  const endRecord = totalItems
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : currentPage * itemsPerPage;

  return (
    <div className={`biz-pagination-container ${className}`}>
      <div className="biz-pagination-info">
        {totalItems !== undefined ? (
          <span>
            Showing <strong>{startRecord}–{endRecord}</strong> of{" "}
            <strong>{totalItems}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="biz-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="biz-pagination-btn"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span>Previous</span>
        </button>

        <span className="biz-pagination-page-badge">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="biz-pagination-btn"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
