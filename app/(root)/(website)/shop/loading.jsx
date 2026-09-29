import { Skeleton } from '@/components/ui/skeleton'
import { PageHeroSkeleton, ProductGridSkeleton } from '@/components/Application/Website/storefront/ListingSkeleton'

// /shop reads searchParams, so it renders on demand for every filter, sort,
// search and page. Without this boundary the router waited on the full
// aggregation before repainting, and prefetch had nothing to warm.
const ShopLoading = () => {
    return (
        <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading products…</span>
            <PageHeroSkeleton />

            <section className="ef-section ef-section--page ef-section--tight">
                <div className="ef-container grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-10">
                    {/* Filter rail */}
                    <aside className="hidden flex-col gap-6 lg:flex">
                        {Array.from({ length: 3 }, (_, section) => (
                            <div key={section} className="flex flex-col gap-3">
                                <Skeleton className="h-4 w-28 bg-surface-well" />
                                {Array.from({ length: 4 }, (_, row) => (
                                    <Skeleton key={row} className="h-3 w-full bg-surface-well" />
                                ))}
                            </div>
                        ))}
                    </aside>

                    <div className="flex min-w-0 flex-col">
                        <div className="flex items-center justify-between gap-4">
                            <Skeleton className="h-4 w-32 bg-surface-well" />
                            <Skeleton className="h-10 w-44 rounded-[var(--radius-control)] bg-surface-well" />
                        </div>
                        <ProductGridSkeleton
                            count={9}
                            className="grid grid-cols-2 gap-[var(--grid-gap)] pt-6 md:grid-cols-3"
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}

export default ShopLoading
