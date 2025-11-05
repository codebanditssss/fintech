interface PaginationProps {
  currentCount: number;
  totalCount: number;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function Pagination({
  currentCount,
  totalCount,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: PaginationProps) {
  return (
    <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
      <p className="text-xs text-zinc-500">
        Showing {currentCount} of {totalCount} results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-300 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-300 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

