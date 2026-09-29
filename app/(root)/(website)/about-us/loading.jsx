import { Skeleton } from '@/components/ui/skeleton'
import { PageHeroSkeleton } from '@/components/Application/Website/storefront/ListingSkeleton'

// This page is force-dynamic (its "You may also like" picks are re-randomised
// per visit), so it is server-rendered on every navigation and needs a boundary
// like the listing routes.
const AboutUsLoading = () => {
    return (
        <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading…</span>
            <PageHeroSkeleton />

            <section className="ef-section ef-section--page">
                <div className="ef-container flex flex-col gap-10">
                    {Array.from({ length: 3 }, (_, block) => (
                        <div key={block} className="flex flex-col gap-3">
                            <Skeleton className="h-7 w-64 max-w-full bg-surface-well" />
                            <Skeleton className="h-3 w-full bg-surface-well" />
                            <Skeleton className="h-3 w-11/12 bg-surface-well" />
                            <Skeleton className="h-3 w-3/4 bg-surface-well" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default AboutUsLoading
