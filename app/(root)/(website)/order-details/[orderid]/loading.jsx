import { Skeleton } from '@/components/ui/skeleton'

// Always server-rendered: it reads the session cookie to authorise the viewer,
// so it can never be cached and every open starts a round trip.
const OrderDetailsLoading = () => {
    return (
        <div className="font-neue" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading order…</span>
            <section className="ef-container py-10 lg:py-14">
                <div className="mx-auto w-full max-w-5xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <Skeleton className="h-4 w-32 bg-surface-well" />
                        <Skeleton className="h-7 w-36 rounded-[var(--radius-control)] bg-surface-well" />
                    </div>

                    <div className="rounded-[var(--radius-card)] bg-surface-card p-5 shadow-[inset_0_0_0_1px_var(--line-soft)] sm:p-6">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-11 shrink-0 rounded-full bg-surface-well" />
                            <div className="flex flex-1 flex-col gap-2">
                                <Skeleton className="h-5 w-56 max-w-full bg-surface-well" />
                                <Skeleton className="h-3 w-40 bg-surface-well" />
                            </div>
                        </div>
                        <Skeleton className="mt-5 h-16 w-full bg-surface-well" />
                    </div>

                    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
                        <div className="min-w-0 space-y-6">
                            <div className="rounded-[var(--radius-card)] bg-surface-card p-5 shadow-[inset_0_0_0_1px_var(--line-soft)]">
                                <Skeleton className="h-5 w-24 bg-surface-well" />
                                {Array.from({ length: 2 }, (_, i) => (
                                    <div key={i} className="mt-5 flex gap-4">
                                        <Skeleton className="h-[96px] w-[72px] shrink-0 rounded-well bg-surface-well" />
                                        <div className="flex flex-1 flex-col gap-2">
                                            <Skeleton className="h-4 w-3/4 bg-surface-well" />
                                            <Skeleton className="h-4 w-16 bg-surface-well" />
                                            <Skeleton className="mt-auto h-4 w-1/2 bg-surface-well" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-[var(--radius-card)] bg-surface-card p-5 shadow-[inset_0_0_0_1px_var(--line-soft)]">
                                <Skeleton className="h-5 w-40 bg-surface-well" />
                                <Skeleton className="mt-4 h-3 w-full bg-surface-well" />
                                <Skeleton className="mt-2 h-3 w-2/3 bg-surface-well" />
                            </div>
                        </div>

                        <aside className="w-full rounded-[var(--radius-card)] bg-surface-card p-5 shadow-[inset_0_0_0_1px_var(--line-soft)]">
                            <Skeleton className="h-5 w-36 bg-surface-well" />
                            {Array.from({ length: 4 }, (_, i) => (
                                <Skeleton key={i} className="mt-3 h-3 w-full bg-surface-well" />
                            ))}
                            <Skeleton className="mt-5 h-12 w-full rounded-[var(--radius-control)] bg-surface-well" />
                        </aside>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default OrderDetailsLoading
