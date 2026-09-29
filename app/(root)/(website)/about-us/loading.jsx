import { Skeleton } from '@/components/ui/skeleton'

// Mirrors the About hero: breadcrumb, headline, lead + buttons, then the
// three-panel image band. Matching the real layout's shape keeps the swap to
// content from shifting the page around.
const AboutUsLoading = () => {
    return (
        <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading…</span>

            <section className="bg-surface-page">
                <div className="ef-container pb-[var(--section-space)] pt-[clamp(6.25rem,10vw,8.5rem)]">
                    <Skeleton className="h-3 w-32 bg-surface-well" />

                    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
                        <div className="flex w-full max-w-3xl flex-col gap-4">
                            <Skeleton className="h-7 w-40 rounded-full bg-surface-well" />
                            <Skeleton className="h-[clamp(2.25rem,5vw,5rem)] w-full bg-surface-well" />
                            <Skeleton className="h-[clamp(2.25rem,5vw,5rem)] w-4/5 bg-surface-well" />
                        </div>
                        <div className="flex w-full max-w-md flex-col gap-3">
                            <Skeleton className="h-3 w-full bg-surface-well" />
                            <Skeleton className="h-3 w-11/12 bg-surface-well" />
                            <Skeleton className="mt-2 h-11 w-48 rounded-full bg-surface-well" />
                        </div>
                    </div>

                    <div className="mt-[clamp(2rem,4vw,3.5rem)] grid gap-[var(--grid-gap)] md:grid-cols-[1fr_1.25fr_1fr]">
                        {[0, 1, 2].map((panel) => (
                            <Skeleton
                                key={panel}
                                className="aspect-[16/11] w-full rounded-tile bg-surface-well md:aspect-[4/5]"
                            />
                        ))}
                    </div>

                    <div className="mt-[clamp(2rem,4vw,3rem)] grid grid-cols-2 gap-6 border-t border-line-soft pt-8 sm:grid-cols-4">
                        {[0, 1, 2, 3].map((stat) => (
                            <div key={stat} className="flex flex-col gap-2">
                                <Skeleton className="h-7 w-20 bg-surface-well" />
                                <Skeleton className="h-3 w-28 bg-surface-well" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default AboutUsLoading
