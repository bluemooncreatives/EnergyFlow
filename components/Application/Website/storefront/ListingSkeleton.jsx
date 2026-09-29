import { Skeleton } from '@/components/ui/skeleton'
import ProductBoxSkeleton from '@/components/Application/Website/ProductBoxSkeleton'

// Shared loading.jsx building blocks for the listing pages. They mirror
// PageHero and the product grids so a route's skeleton hands over to the real
// page without the layout jumping.

export const PageHeroSkeleton = () => (
    <section className="relative isolate overflow-hidden bg-surface-sunken">
        <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-40 -z-10 size-[30rem] rounded-full bg-tint-pistachio opacity-70 blur-3xl"
        />
        <div className="ef-container pb-[clamp(1.75rem,3.5vw,3rem)] pt-[clamp(6.25rem,10vw,8.5rem)]">
            <Skeleton className="h-4 w-48 bg-surface-well" />
            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
                <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-3">
                    <Skeleton className="h-3 w-28 bg-surface-well" />
                    <Skeleton className="h-10 w-3/4 bg-surface-well" />
                    <Skeleton className="h-4 w-full max-w-2xl bg-surface-well" />
                </div>
                <Skeleton className="h-11 w-36 shrink-0 rounded-[var(--radius-control)] bg-surface-well" />
            </div>
        </div>
    </section>
)

export const ProductGridSkeleton = ({ count = 8, className = 'grid grid-cols-2 gap-[var(--grid-gap)] md:grid-cols-3 lg:grid-cols-4' }) => (
    <div className={className}>
        {Array.from({ length: count }, (_, i) => (
            <ProductBoxSkeleton key={i} />
        ))}
    </div>
)
