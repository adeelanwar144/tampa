import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-32 flex flex-col items-center text-center">
      <h1 className="font-display font-800 text-[52px] text-gulf-900 mb-3">
        Page not found
      </h1>
      <p className="text-ink-600 mb-8 max-w-md">
        We couldn&apos;t find that page. The listing may have been removed, or the URL might be off.
      </p>
      <Link
        href="/places"
        className="px-6 py-3 rounded-[var(--radius-btn)] bg-gulf-700 text-white font-medium text-sm hover:bg-gulf-500 transition-hover"
      >
        Browse the directory
      </Link>
    </div>
  );
}
