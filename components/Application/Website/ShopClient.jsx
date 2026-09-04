'use client'
import dynamic from 'next/dynamic'
import Sorting from '@/components/Application/Website/Sorting'

// Filter is never server-rendered (isDesktop starts false; mobile Sheet starts closed)
// so ssr:false defers its Accordion/Checkbox/Slider/radix-ui chunk entirely.
const Filter = dynamic(() => import('@/components/Application/Website/Filter'), { ssr: false })
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import ProductBox from '@/components/Application/Website/ProductBox'
import ProductBoxSkeleton from '@/components/Application/Website/ProductBoxSkeleton'
import ShopPagination from '@/components/Application/Website/ShopPagination'
import { BrandButton, BrandOutlineButton } from '@/components/Application/Website/BrandButton'
import Link from 'next/link'
import { PackageSearch, RotateCcw, SlidersHorizontal, Store } from 'lucide-react'

// Storefront shows a denser 5-row (2-col) grid on phones and a 3×3 grid on
// larger screens. The server pre-renders the first page at the desktop size,
// so any mobile-only size difference is resolved client-side after mount.
const DESKTOP_PAGE_SIZE = 9
const MOBILE_PAGE_SIZE = 10

const ShopClient = ({ initialProducts = [], initialTotal = 0, initialTotalPages = 0, initialFilters, initialSearchParamsString = '' }) => {
    const searchParams = useSearchParams()
    const searchParamString = searchParams.toString()
    const [sorting, setSorting] = useState('default_sorting')
    const [page, setPage] = useState(0)
    const [isMobileFilter, setIsMobileFilter] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)
    // Mobile (< sm) shows 10 cards/page; everything else keeps the server's 9.
    // Starts false so SSR + first client render match; corrected after mount.
    const [isMobile, setIsMobile] = useState(false)
    const gridTopRef = useRef(null)

    const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1025px)')

        const onChange = (event) => {
            setIsDesktop(event.matches)
        }

        setIsDesktop(mediaQuery.matches)
        mediaQuery.addEventListener('change', onChange)

        return () => {
            mediaQuery.removeEventListener('change', onChange)
        }
    }, [])

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 639px)')

        const onChange = (event) => {
            setIsMobile(event.matches)
        }

        setIsMobile(mediaQuery.matches)
        mediaQuery.addEventListener('change', onChange)

        return () => {
            mediaQuery.removeEventListener('change', onChange)
        }
    }, [])

    // Filters, sort, or page size changed → always restart at the first page,
    // otherwise the user could be stranded on a page index that no longer exists
    // (e.g. switching from 9- to 10-per-page shrinks the total page count).
    useEffect(() => {
        setPage(0)
    }, [searchParamString, sorting, pageSize])

    const fetchProduct = useCallback(async (pageParam) => {
        const { data: getProduct } = await axios.get('/api/shop', {
            params: {
                page: pageParam,
                limit: pageSize,
                sort: sorting,
                ...(searchParamString ? Object.fromEntries(new URLSearchParams(searchParamString)) : {}),
            }
        })
        if (!getProduct.success) {
            throw new Error(getProduct.message || 'Failed to load products.')
        }
        return getProduct.data
    }, [sorting, searchParamString, pageSize])

    const isInitialQuery = searchParamString === initialSearchParamsString
        && sorting === 'default_sorting'

    const { error, data, isFetching, isPending, refetch } = useQuery({
        queryKey: ['products', sorting, searchParamString, page, pageSize],
        queryFn: () => fetchProduct(page),
        // Reuse the server-rendered first page so the initial paint needs no
        // refetch — but only when the client wants the same size the server
        // rendered (desktop 9). Mobile (10) fetches its own first page.
        initialData: (page === 0 && isInitialQuery && pageSize === DESKTOP_PAGE_SIZE)
            ? { products: initialProducts, total: initialTotal, totalPages: initialTotalPages, page: 0 }
            : undefined,
        // Keep the current cards visible while the next page (or the mobile
        // page-size swap) loads, so pagination doesn't flash a skeleton.
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
    })

    const products = data?.products ?? []
    const total = data?.total ?? 0
    const totalPages = data?.totalPages ?? 0

    // If the result set shrank below the current page (e.g. tighter filter),
    // fall back to the last valid page.
    const pageOutOfRange = !isFetching && totalPages > 0 && page > totalPages - 1
    useEffect(() => {
        if (pageOutOfRange) {
            setPage(totalPages - 1)
        }
    }, [pageOutOfRange, totalPages])

    // No cached data for this page yet, or we're about to clamp → show skeletons.
    const showSkeleton = isPending || pageOutOfRange
    const showEmptyState = !isFetching && !error && total === 0
    const resultCount = error ? null : total

    const handlePageChange = (nextPageIndex) => {
        setPage(nextPageIndex)
        requestAnimationFrame(() => {
            gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
    }

    return (
        <div>
            <section className="relative isolate h-[172px] overflow-hidden sm:h-[180px] lg:h-[280px]">
                <div className="absolute inset-0 bg-[var(--dark-red-2)]" />
                <div className="absolute inset-x-0 top-14 z-10 flex justify-center sm:top-5 lg:top-6">
                    <div
                        className="pointer-events-none select-none font-neue font-semibold uppercase tracking-[0.02em] text-white/90"
                        style={{
                            fontSize: "clamp(7.5rem, 34vw, 30rem)",
                            lineHeight: 0.78,
                            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 38%, rgba(0,0,0,0) 100%)",
                            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 38%, rgba(0,0,0,0) 100%)",
                            textShadow: "0 12px 32px rgba(0,0,0,0.18)",
                        }}
                        aria-hidden
                    >
                        Shop
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-b from-transparent via-background/50 to-background sm:h-36" />
            </section>

            <section className='website-gutter bg-background pt-4 pb-10 sm:py-10 lg:py-14'>
                <div className="grid w-full gap-6 lg:grid-cols-[290px_1fr] lg:gap-8">
                    {/* The aside shell always renders (CSS-hidden below lg) so the
                        sidebar column is occupied from the server-rendered first
                        paint — if it only mounted after hydration (isDesktop flips
                        in an effect), the product grid would start in the 290px
                        column and jump right when the aside appeared, a large CLS.
                        Filter itself still mounts only on desktop so mobile never
                        downloads its chunk. */}
                    <aside className='hidden w-full lg:block'>
                        <div className='sticky top-6'>
                            {isDesktop && <Filter filters={initialFilters} />}
                        </div>
                    </aside>
                    {!isDesktop && (
                        <Sheet open={isMobileFilter} onOpenChange={setIsMobileFilter}>
                            <SheetContent side='left' className="flex w-[86%] max-w-sm flex-col gap-0 bg-background p-0">
                                {/* Header — matches the branded sheet chrome used across the site */}
                                <SheetHeader className="flex-shrink-0 gap-0 border-b border-border/60 px-5 py-4 pr-12">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-cream)]/60 text-[var(--brand-primary)]">
                                            <SlidersHorizontal className="size-4" strokeWidth={1.75} />
                                        </span>
                                        <div className="min-w-0">
                                            <SheetTitle className="font-header text-2xl leading-none tracking-wide text-[var(--brand-primary)]">
                                                Filter
                                            </SheetTitle>
                                            <SheetDescription className="mt-1 font-neue text-[13px] text-muted-foreground">
                                                Refine your results quickly.
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                {/* Scrollable filter body */}
                                <div className="shop-filter-panel min-h-0 flex-1 overflow-y-auto px-5 py-5">
                                    <Filter filters={initialFilters} showClearLink={false} />
                                </div>

                                {/* Sticky action footer */}
                                <div className="flex-shrink-0 border-t border-border/60 bg-background p-4">
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <BrandOutlineButton asChild onClick={() => setIsMobileFilter(false)} className="text-[13px] tracking-normal">
                                            <Link href={WEBSITE_SHOP}>Clear All</Link>
                                        </BrandOutlineButton>
                                        <BrandButton type="button" onClick={() => setIsMobileFilter(false)} className="text-[13px] tracking-normal">
                                            {typeof resultCount === 'number'
                                                ? `Show ${resultCount} ${resultCount === 1 ? 'item' : 'items'}`
                                                : 'Show Results'}
                                        </BrandButton>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    <div className='w-full'>
                        <div>
                            <Sorting
                                sorting={sorting}
                                setSorting={setSorting}
                                mobileFilterOpen={isMobileFilter}
                                setMobileFilterOpen={setIsMobileFilter}
                                resultCount={resultCount}
                            />
                        </div>

                        {/* Scroll anchor — page changes bring this back into view. */}
                        <div ref={gridTopRef} className="scroll-mt-24" />

                        {error ? (
                            <div className="mt-8 flex flex-col items-center rounded-lg border border-border/60 bg-background px-6 py-14 text-center shadow-sm">
                                <h3 className="font-neue text-xl font-semibold text-destructive">Something went wrong</h3>
                                <p className="font-neue mt-2 max-w-sm text-sm text-muted-foreground">
                                    We couldn&apos;t load products right now. Please try again.
                                </p>
                                <div className="mt-6 w-full max-w-xs">
                                    <BrandButton type="button" onClick={() => refetch()}>
                                        <RotateCcw className="mr-2 size-4" />Retry
                                    </BrandButton>
                                </div>
                            </div>
                        ) : showSkeleton ? (
                            <div className='grid grid-cols-2 gap-4 pt-7 md:grid-cols-3 md:gap-5 lg:gap-6'>
                                {Array.from({ length: pageSize }).map((_, index) => (
                                    <ProductBoxSkeleton key={index} />
                                ))}
                            </div>
                        ) : showEmptyState ? (
                            <div className="mt-8 flex flex-col items-center rounded-lg border border-border/60 bg-background px-6 py-14 text-center shadow-sm">
                                <div className="flex size-16 items-center justify-center rounded-full bg-[var(--brand-cream)]/50 text-[var(--brand-primary)]">
                                    <PackageSearch className="size-8" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-neue mt-5 text-xl font-semibold">No Products Found</h3>
                                <p className="font-neue mt-2 max-w-sm text-sm text-muted-foreground">
                                    {searchParams.size > 0
                                        ? 'No products match your current filters. Try clearing them or browse the full collection.'
                                        : 'There are no products to show right now. Please check back soon.'}
                                </p>
                                <div className="mt-6 w-full max-w-xs">
                                    <BrandButton asChild>
                                        <Link href={WEBSITE_SHOP}>
                                            {searchParams.size > 0 ? (
                                                <><RotateCcw className="mr-2 size-4" />Clear Filters</>
                                            ) : (
                                                <><Store className="mr-2 size-4" />Browse Shop</>
                                            )}
                                        </Link>
                                    </BrandButton>
                                </div>
                            </div>
                        ) : (
                            <div className='grid grid-cols-2 gap-4 pt-7 md:grid-cols-3 md:gap-5 lg:gap-6'>
                                {products.map((product, index) => (
                                    <ProductBox key={product._id} product={product} priority={index < 3} />
                                ))}
                            </div>
                        )}

                        {!error && !showEmptyState && (
                            <div className='mt-10 flex flex-col items-center gap-4'>
                                <ShopPagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    disabled={isFetching}
                                    siblings={isMobile ? 0 : 1}
                                />
                                {total > 0 && (
                                    <p className="font-neue text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                        Page {Math.min(page + 1, totalPages)} of {totalPages} · {total} {total === 1 ? 'item' : 'items'}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default ShopClient
