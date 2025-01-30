import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ImageCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-white/[0.15] border border-[rgba(0,0,0,0.08)]">
      <div className="relative aspect-video">
        <Skeleton className="absolute inset-0 bg-black/[0.08]" />
      </div>
      <div className="p-3 flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-black/[0.08]" />
          <Skeleton className="h-3 w-24 bg-black/[0.08]" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md bg-black/[0.08]" />
      </div>
    </div>
  );
}
