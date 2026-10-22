import { PlacesGridSkeleton } from "@/components/places/PlacesGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <div
        className="w-full pt-10 pb-14 md:pt-16 md:pb-20"
        style={{
          background: "linear-gradient(135deg, #08343C 0%, #0B5E6B 55%, #14707E 100%)",
        }}
      >
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col items-center">
          <Skeleton className="h-12 w-80 bg-white/20" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-white/15" />
          <div className="mt-10 h-[84px] w-full max-w-[1000px] rounded-2xl bg-[#F2F5F4]" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <Skeleton className="h-7 w-40 mb-1" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-9 w-44" />
        </div>
        <PlacesGridSkeleton />
      </div>
    </>
  );
}
