import { Skeleton } from '@/components/ui/skeleton'

// Mirrors the ProductBox layout so the grid doesn't shift when real cards load.
const ProductBoxSkeleton = () => {
    return (
        <div className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border/60 bg-background">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />

            <div className="flex flex-1 flex-col items-center gap-3 border-t border-border/60 px-3 py-3.5 sm:px-4 sm:py-5">
                <Skeleton className="h-4 w-3/4" />

                <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                    <Skeleton className="h-9 w-full rounded-sm" />
                    <Skeleton className="h-9 w-full rounded-sm" />
                </div>
            </div>
        </div>
    )
}

export default ProductBoxSkeleton
