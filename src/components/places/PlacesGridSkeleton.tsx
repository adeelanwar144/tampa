import { Skeleton } from "@/components/ui/skeleton";

export function PlacesGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-line rounded-[var(--radius-card)] overflow-hidden"
        >
          <div className="w-full bg-gulf-50" style={{ paddingBottom: "62.5%" }} />
          <div className="p-4 space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
