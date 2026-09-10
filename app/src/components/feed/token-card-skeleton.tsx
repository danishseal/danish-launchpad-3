import { Skeleton } from "@/components/ui/skeleton";

export function TokenCardSkeleton() {
  return (
    <div className="rounded-[16px] border border-[#161616] bg-[#070707] p-4">
      <div className="flex gap-5"><Skeleton className="h-[68px] w-[68px] rounded-full bg-[#161616]" /><div className="flex-1 space-y-2 pt-2"><Skeleton className="h-4 w-28 bg-[#161616]" /><Skeleton className="h-3 w-20 bg-[#161616]" /></div></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><Skeleton className="h-8 bg-[#161616]" /><Skeleton className="h-8 bg-[#161616]" /></div>
      <Skeleton className="my-4 h-px bg-[#161616]" /><div className="flex justify-between"><Skeleton className="h-8 w-24 bg-[#161616]" /><Skeleton className="h-8 w-24 bg-[#161616]" /></div>
    </div>
  );
}
