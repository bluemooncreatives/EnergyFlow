import { Skeleton } from '@/components/ui/skeleton'

// Mirrors the storefront ProductCard ("full" actions) so the grid doesn't shift
// when real cards load.
const ProductBoxSkeleton = () => {
    return (
        <div className="ef-card @container/card" aria-hidden="true">
            <div className="p-2 pb-0 @[15rem]/card:p-2.5 @[15rem]/card:pb-0">
                <Skeleton className="aspect-square w-full rounded-well bg-surface-well" />
            </div>

            <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-3 @[15rem]/card:px-4 @[15rem]/card:pb-4">
                <Skeleton className="h-3 w-1/3 bg-surface-well" />
                <Skeleton className="h-4 w-4/5 bg-surface-well" />
                <Skeleton className="mb-1 h-4 w-1/2 bg-surface-well" />
                <Skeleton className="h-3 w-12 bg-surface-well" />
                <Skeleton className="h-5 w-20 bg-surface-well" />
                <div className="mt-2 grid grid-cols-1 gap-2 @[17rem]/card:grid-cols-2">
                    <Skeleton className="h-10 w-full rounded-[var(--radius-control)] bg-surface-well" />
                    <Skeleton className="h-10 w-full rounded-[var(--radius-control)] bg-surface-well" />
                </div>
            </div>
        </div>
    )
}

export default ProductBoxSkeleton
