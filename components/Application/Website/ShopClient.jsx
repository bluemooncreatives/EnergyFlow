'use client'
import dynamic from 'next/dynamic'
import Sorting from '@/components/Application/Website/Sorting'

// Filter is never server-rendered (isDesktop starts false; mobile Sheet starts closed)
// so ssr:false defers its Accordion/Checkbox/Slider/radix-ui chunk entirely.
const Filter = dynamic(() => import('@/components/Application/Website/Filter'), { ssr: false })
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import PageHero from '@/components/Application/Website/storefront/PageHero'
import StoreButton from '@/components/Application/Website/storefront/StoreButton'
import { scrollToElement } from '@/lib/scroll'

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

    // Page one of a different result set is a different set of products, so
    // put the visitor at the top of the grid — where paging lands them too —
    // rather than leaving them somewhere in the middle of results that have
    // been replaced under them. Not on mount: arriving at /shop?category=x is
    // a navigation, and the route handles where that opens. Not while the
    // mobile filter sheet is open either, since the page behind it is scroll
    // locked and the visitor is still choosing; that scrolls on close.
    const resultKeyRef = useRef(null)
    const deferredScrollRef = useRef(false)
    useEffect(() => {
        const key = `${searchParamString}|${sorting}`
        if (resultKeyRef.current === key) return
        const first = resultKeyRef.current === null
        resultKeyRef.current = key
        if (first) return
        if (isMobileFilter) deferredScrollRef.current = true
        else scrollToElement(gridTopRef.current)
    }, [searchParamString, sorting, isMobileFilter])

    useEffect(() => {
        if (isMobileFilter || !deferredScrollRef.current) return
        deferredScrollRef.current = false
        // Wait out the sheet's close animation, which holds the scroll lock.
        const timer = setTimeout(() => scrollToElement(gridTopRef.current), 250)
        return () => clearTimeout(timer)
    }, [isMobileFilter])

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

    // The header names what is being browsed — a category, a search, a curated
    // list — because the homepage hero and spotlight deep-link here filtered.
    const heading = useMemo(() => {
        const params = new URLSearchParams(searchParamString)
        const q = params.get('q')?.trim()
        const slugs = (params.get('category') || '').split(',').filter(Boolean)
        const names = slugs
            .map((slug) => initialFilters?.categories?.find((c) => c.slug === slug)?.name?.trim())
            .filter(Boolean)
        const base = [{ label: 'Shop', href: WEBSITE_SHOP }]

        if (q) return { title: `Results for “${q}”`, eyebrow: 'Search', links: [...base, { label: 'Search' }] }
        if (names.length === 1) return { title: names[0], eyebrow: 'Category', links: [...base, { label: names[0] }] }
        if (names.length > 1) return { title: 'Selected categories', eyebrow: names.join(' · '), links: [...base, { label: 'Filtered' }] }
        if (params.get('bestseller')) return { title: 'Bestsellers', eyebrow: 'Most reordered', links: [...base, { label: 'Bestsellers' }] }
        if (params.get('freshlyArrived')) return { title: 'Freshly arrived', eyebrow: 'New in', links: [...base, { label: 'Freshly arrived' }] }
        return {
            title: 'Shop all',
            eyebrow: 'The full pantry',
            description: 'Dry fruits, seeds, ghee, cold pressed oils, chocolates and gift boxes, quality checked and delivered across India.',
            links: [{ label: 'Shop' }],
        }
    }, [searchParamString, initialFilters])

    const handlePageChange = (nextPageIndex) => {
        setPage(nextPageIndex)
        requestAnimationFrame(() => {
            scrollToElement(gridTopRef.current)
        })
    }

    return (
        <div>
            <PageHero
                title={heading.title}
                eyebrow={heading.eyebrow}
                description={heading.description}
                links={heading.links}
            />

            <section className='ef-section ef-section--page ef-section--tight'>
                <div className="ef-container grid grid-cols-1 gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-10">
                    {/* The aside shell always renders (CSS-hidden below lg) so the
                        sidebar column is occupied from the server-rendered first
                        paint — if it only mounted after hydration (isDesktop flips
                        in an effect), the product grid would start in the 290px
                        column and jump right when the aside appeared, a large CLS.
                        Filter itself still mounts only on desktop so mobile never
                        downloads its chunk. */}
                    <aside className="hidden w-full lg:block">
                        <div className='ef-card sticky top-28 p-5'>
                            {isDesktop && <Filter filters={initialFilters} />}
                        </div>
                    </aside>
                    {!isDesktop && (
                        <Sheet open={isMobileFilter} onOpenChange={setIsMobileFilter}>
                            <SheetContent side='left' className="flex w-[86%] max-w-sm flex-col gap-0 bg-background p-0">
                                {/* Header — matches the branded sheet chrome used across the site */}
                                <SheetHeader className="flex-shrink-0 gap-0 border-b border-border/60 px-5 py-4 pr-12">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-well)] text-[var(--brand-primary)]">
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
                        {/* Product cards use <h3>; this keeps the outline h1 → h2 → h3. */}
                        <h2 className="sr-only">Products</h2>

                        {error ? (
                            <div className="ef-card mt-6 flex flex-col items-center gap-4 px-6 py-14 text-center">
                                <h2 className="text-xl font-medium text-ink-strong">Something went wrong</h2>
                                <p className="max-w-sm text-[0.9375rem] text-ink-body">
                                    We couldn&apos;t load products right now. Please try again.
                                </p>
                                <StoreButton onClick={() => refetch()}>
                                    <RotateCcw aria-hidden="true" /> Try again
                                </StoreButton>
                            </div>
                        ) : showSkeleton ? (
                            <div className='grid grid-cols-2 gap-[var(--grid-gap)] pt-6 md:grid-cols-3'>
                                {Array.from({ length: pageSize }).map((_, index) => (
                                    <ProductBoxSkeleton key={index} />
                                ))}
                            </div>
                        ) : showEmptyState ? (
                            <div className="ef-card mt-6 flex flex-col items-center gap-4 px-6 py-14 text-center" style={{ borderRadius: 'var(--radius-tile)' }}>
                                <span className="flex size-16 items-center justify-center rounded-full bg-tint-honey text-brand">
                                    <PackageSearch className="size-7" strokeWidth={1.5} aria-hidden="true" />
                                </span>
                                <h2 className="text-2xl font-medium text-ink-strong">
                                    {searchParams.size > 0 ? 'Nothing here just yet' : 'No products yet'}
                                </h2>
                                <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink-body">
                                    {searchParams.size > 0
                                        ? 'We are still stocking this part of the range. Browse the full collection, or ask us about bulk and gifting orders.'
                                        : 'There are no products to show right now. Please check back soon.'}
                                </p>
                                <div className="mt-2 flex flex-wrap justify-center gap-3">
                                    <StoreButton href={WEBSITE_SHOP} arrow>
                                        {searchParams.size > 0 ? <><RotateCcw aria-hidden="true" /> Browse everything</> : <><Store aria-hidden="true" /> Browse shop</>}
                                    </StoreButton>
                                    {searchParams.size > 0 && <StoreButton href="/contact" variant="outline">Ask about it</StoreButton>}
                                </div>
                            </div>
                        ) : (
                            <div className='grid grid-cols-2 gap-[var(--grid-gap)] pt-6 md:grid-cols-3'>
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
                                    <p className="text-[0.8125rem] text-ink-muted">
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
