// Skeleton shown while a product page streams in (arriving from the shop, a
// search result or a related-product card). It mirrors the real hero —
// gallery left, buy box right — so nothing jumps when the page lands.
// Pack-size changes never show this: they switch on the client.
const ProductLoading = () => (
    <div className="pb-[var(--section-space)] pt-[clamp(6.25rem,10vw,8rem)]" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading product…</span>
        <div className="ef-container" aria-hidden="true">
            <div className="mb-6 flex gap-3 lg:mb-8">
                <span className="ef-pd-skel h-3.5 w-12" />
                <span className="ef-pd-skel h-3.5 w-12" />
                <span className="ef-pd-skel h-3.5 w-28" />
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-20">
                <div className="flex flex-col gap-3 xl:flex-row-reverse xl:gap-4">
                    <span className="ef-pd-skel aspect-[4/5] w-full rounded-[var(--radius-tile)] sm:aspect-square" />
                    <div className="flex gap-2.5 xl:w-[5.5rem] xl:flex-col">
                        <span className="ef-pd-skel aspect-square w-[4.5rem] xl:w-full" />
                        <span className="ef-pd-skel aspect-square w-[4.5rem] xl:w-full" />
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="ef-pd-skel h-8 w-40" />
                    <span className="ef-pd-skel mt-5 h-14 w-4/5" />
                    <span className="ef-pd-skel mt-3 h-14 w-3/5" />
                    <span className="ef-pd-skel mt-5 h-4 w-44" />
                    <span className="ef-pd-skel mt-7 h-11 w-48" />
                    <span className="ef-pd-skel mt-6 h-4 w-full" />
                    <span className="ef-pd-skel mt-2 h-4 w-11/12" />
                    <span className="ef-pd-skel mt-2 h-4 w-2/3" />
                    <span className="my-7 h-px w-full bg-line-soft" />
                    <div className="flex gap-2">
                        <span className="ef-pd-skel h-14 w-28" />
                        <span className="ef-pd-skel h-14 w-28" />
                    </div>
                    <div className="mt-6 flex gap-3">
                        <span className="ef-pd-skel h-[3.25rem] w-32" />
                        <span className="ef-pd-skel h-[3.25rem] flex-1" />
                    </div>
                    <span className="ef-pd-skel mt-3 h-[3.25rem] w-full" />
                    <span className="ef-pd-skel mt-6 h-20 w-full" />
                </div>
            </div>
        </div>
    </div>
)

export default ProductLoading
