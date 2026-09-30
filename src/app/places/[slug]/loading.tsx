import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
        <div>
          <div className="grid grid-cols-3 gap-2 mb-8">
            <div className="col-span-2"><Skeleton className="w-full aspect-[4/3] rounded-[10px]" /></div>
            <div className="grid grid-rows-2 gap-2">
              <Skeleton className="w-full rounded-[10px]" />
              <Skeleton className="w-full rounded-[10px]" />
            </div>
          </div>
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-12 w-3/4 mb-3" />
          <Skeleton className="h-5 w-64 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}
