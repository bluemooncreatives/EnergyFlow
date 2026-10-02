import { PageHeroSkeleton, ProductGridSkeleton } from '@/components/Application/Website/storefront/ListingSkeleton'

export default function Loading() {
    return (
        <div>
            <PageHeroSkeleton />
            <section className="ef-section ef-section--page ef-section--tight">
                <div className="ef-container">
                    <ProductGridSkeleton count={4} />
                </div>
            </section>
        </div>
    )
}
