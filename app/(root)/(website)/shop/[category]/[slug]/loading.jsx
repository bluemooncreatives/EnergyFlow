import { Skeleton } from '@/components/ui/skeleton'

// Two jobs, both about how fast a product feels to open:
//
// 1. It is the navigation feedback. Without a loading boundary the router holds
//    the previous page on screen, frozen, until the whole product page has been
//    rendered on the server — a card tap looked like nothing had happened.
// 2. It is what makes <Link> prefetch work here. This route reads searchParams
//    (?size=), so Next treats it as dynamic and prefetches only as far as the
//    nearest loading boundary. With no boundary there was nothing to prefetch,
//    so every card tap started from cold.
//
// The layout mirrors the real hero (breadcrumb, gallery, buy box) so the
// skeleton does not reflow into the page.
const ProductLoading = () => {
    return (
        <div className="pb-[var(--section-space)] pt-[clamp(6.25rem,10vw,8rem)]" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading product…</span>
            <div className="ef-container">
                <Skeleton className="mb-6 h-4 w-64 max-w-full bg-surface-well lg:mb-8" />

                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-20">
                    {/* Gallery: stage + thumbnail rail */}
                    <div className="flex flex-col gap-3">
                        <Skeleton className="aspect-square w-full rounded-well bg-surface-well" />
                        <div className="grid grid-cols-5 gap-3">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-well bg-surface-well" />
                            ))}
                        </div>
                    </div>

                    {/* Buy box */}
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-3 w-24 bg-surface-well" />
                        <Skeleton className="h-9 w-4/5 bg-surface-well" />
                        <Skeleton className="h-4 w-32 bg-surface-well" />
                        <Skeleton className="h-8 w-40 bg-surface-well" />

                        <div className="mt-2 flex flex-col gap-2">
                            <Skeleton className="h-3 w-20 bg-surface-well" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 3 }, (_, i) => (
                                    <Skeleton key={i} className="h-11 w-24 rounded-[var(--radius-control)] bg-surface-well" />
                                ))}
                            </div>
                        </div>

                        <div className="mt-2 flex flex-col gap-3">
                            <Skeleton className="h-12 w-full rounded-[var(--radius-control)] bg-surface-well" />
                            <Skeleton className="h-12 w-full rounded-[var(--radius-control)] bg-surface-well" />
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                            <Skeleton className="h-3 w-full bg-surface-well" />
                            <Skeleton className="h-3 w-11/12 bg-surface-well" />
                            <Skeleton className="h-3 w-2/3 bg-surface-well" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductLoading
