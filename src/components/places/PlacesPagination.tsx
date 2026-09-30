import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function PlacesPagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta;

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) {
      pages.push(i);
    }
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }

  const pages = getPageNumbers();

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gulf-700 hover:bg-gulf-50 rounded-[var(--radius-btn)] border border-line transition-hover"
        >
          <ChevronLeft size={15} /> Previous
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-ink-600/40 rounded-[var(--radius-btn)] border border-line cursor-not-allowed">
          <ChevronLeft size={15} /> Previous
        </span>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-3 py-2 text-sm text-ink-600">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p as number)}
            aria-current={p === currentPage ? "page" : undefined}
            className={[
              "px-3 py-2 text-sm font-medium rounded-[var(--radius-btn)] border transition-hover",
              p === currentPage
                ? "bg-gulf-700 text-white border-gulf-700"
                : "bg-white text-gulf-900 border-line hover:bg-gulf-50 hover:border-gulf-500",
            ].join(" ")}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gulf-700 hover:bg-gulf-50 rounded-[var(--radius-btn)] border border-line transition-hover"
        >
          Next <ChevronRight size={15} />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-ink-600/40 rounded-[var(--radius-btn)] border border-line cursor-not-allowed">
          Next <ChevronRight size={15} />
        </span>
      )}
    </nav>
  );
}
