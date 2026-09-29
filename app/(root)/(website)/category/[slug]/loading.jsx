import { Skeleton } from '@/components/ui/skeleton'
import { PageHeroSkeleton, ProductGridSkeleton } from '@/components/Application/Website/storefront/ListingSkeleton'

// Category landings are reached from the header mega-menu and from every
// product card's category link, so they need the same instant-feedback +
// prefetchable boundary as /shop.
const CategoryLoading = () => {
    return (
        <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading category…</span>
            <PageHeroSkeleton />

            <section className="ef-section ef-section--page ef-section--tight">
                <div className="ef-container">
                    <div className="flex max-w-3xl flex-col gap-2">
                        <Skeleton className="h-3 w-full bg-surface-well" />
                        <Skeleton className="h-3 w-5/6 bg-surface-well" />
                    </div>
                    <Skeleton className="mt-6 h-3 w-40 bg-surface-well" />
                    <ProductGridSkeleton className="grid grid-cols-2 gap-[var(--grid-gap)] pt-4 md:grid-cols-3 lg:grid-cols-4" />
                </div>
            </section>
        </div>
    )
}

export default CategoryLoading
