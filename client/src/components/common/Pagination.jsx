import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  totalDocs = 0,
  limit = 10,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1 && totalDocs <= limit) return null;

  const startItem = totalDocs === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalDocs);

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 ${className}`}>
      <div className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-900">{startItem}</span> to{' '}
        <span className="font-medium text-slate-900">{endItem}</span> of{' '}
        <span className="font-medium text-slate-900">{totalDocs}</span> entries
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 text-xs text-slate-600 font-medium">
          Page {page} of {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
