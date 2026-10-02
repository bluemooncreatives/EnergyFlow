'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Command as CommandPrimitive } from 'cmdk'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'
import Fuse from 'fuse.js'
import {
    Search as SearchIcon,
    ArrowRight,
    Clock,
    LayoutGrid,
    Loader2,
    PackageSearch,
    RotateCcw,
    X,
} from 'lucide-react'

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'
import { getLenis } from '@/components/Application/LenisProvider'
import useDebounce from '@/hooks/useDebounce'
import websiteSearchData from '@/lib/websiteSearchData'
import { WEBSITE_SHOP, WEBSITE_PRODUCT_DETAILS, WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { formatProductName } from '@/lib/seo'

const RECENT_KEY = 'energyflow:recent-searches'
const MAX_RECENT = 6
const RESULT_LIMIT = 8
const MAX_PAGE_MATCHES = 4
const MAX_CATEGORY_MATCHES = 3
const IDLE_CATEGORIES = 4

const formatINR = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    })

const readRecent = () => {
    if (typeof window === 'undefined') return []
    try {
        const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]')
        return Array.isArray(parsed)
            ? parsed.filter((item) => typeof item === 'string' && item.trim()).slice(0, MAX_RECENT)
            : []
    } catch {
        return []
    }
}

const Kbd = ({ children }) => (
    <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium leading-none text-muted-foreground">
        {children}
    </kbd>
)

const Thumb = ({ src, alt }) => (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--product-card-bg)]">
        <Image src={src || imgPlaceholder.src} alt={alt} fill sizes="44px" className="object-cover object-center" />
    </div>
)

// categories: navbar's live categories — [{ id, name, slug, href, productCount, image }]
const GlobalSearch = ({ open, setOpen, isLoggedIn = false, categories = [] }) => {
    const router = useRouter()
    const [query, setQuery] = React.useState('')
    const [recent, setRecent] = React.useState([])
    const inputRef = React.useRef(null)

    // Local matches (pages, categories) and the result rows key off the live
    // text so Enter always acts on what was typed; only the network request
    // waits for the debounce.
    const trimmed = query.trim()
    const debounced = useDebounce(trimmed, 250)
    const isSearching = trimmed.length >= 1
    const canFetch = debounced.length >= 1

    // Destinations visible to this user (mirrors middleware auth rules).
    const pages = React.useMemo(
        () =>
            websiteSearchData.filter((page) => {
                if (page.guestOnly) return !isLoggedIn
                if (page.requiresAuth) return isLoggedIn
                return true
            }),
        [isLoggedIn]
    )

    // Fuse handles fuzzy/typo-tolerant matching against label + keywords, and is
    // immune to the regex pitfalls of the product backend (no special-char risk).
    const pageFuse = React.useMemo(
        () =>
            new Fuse(pages, {
                keys: ['label', 'keywords', 'description'],
                threshold: 0.4,
                ignoreLocation: true,
            }),
        [pages]
    )

    const liveCategories = React.useMemo(
        () => (Array.isArray(categories) ? categories.filter((c) => c?.slug && c?.name) : []),
        [categories]
    )

    const categoryFuse = React.useMemo(
        () =>
            new Fuse(liveCategories, {
                keys: [{ name: 'name', weight: 2 }, 'slug'],
                threshold: 0.35,
                ignoreLocation: true,
            }),
        [liveCategories]
    )

    const pageMatches = React.useMemo(() => {
        if (!isSearching) return []
        return pageFuse.search(trimmed).slice(0, MAX_PAGE_MATCHES).map((r) => r.item)
    }, [pageFuse, trimmed, isSearching])

    const categoryMatches = React.useMemo(() => {
        if (!isSearching) return []
        return categoryFuse.search(trimmed).slice(0, MAX_CATEGORY_MATCHES).map((r) => r.item)
    }, [categoryFuse, trimmed, isSearching])

    // Load recent searches when the modal opens; clear the input when it closes.
    React.useEffect(() => {
        if (open) {
            setRecent(readRecent())
        } else {
            setQuery('')
        }
    }, [open])

    // Lenis drives the page from wheel/touch on window, so it would keep
    // scrolling the store behind the modal. Pause it while search is open.
    React.useEffect(() => {
        if (!open) return
        const lenis = getLenis()
        lenis?.stop()
        return () => lenis?.start()
    }, [open])

    const persistRecent = React.useCallback((term) => {
        const clean = String(term || '').trim().slice(0, 80)
        if (!clean) return
        setRecent((prev) => {
            const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENT)
            try {
                window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
            } catch {
                /* storage unavailable (private mode / quota) — non-fatal */
            }
            return next
        })
    }, [])

    const clearRecent = React.useCallback(() => {
        setRecent([])
        try {
            window.localStorage.removeItem(RECENT_KEY)
        } catch {
            /* non-fatal */
        }
        inputRef.current?.focus()
    }, [])

    const clearQuery = React.useCallback(() => {
        setQuery('')
        inputRef.current?.focus()
    }, [])

    const closeAndGo = React.useCallback(
        (url) => {
            setOpen(false)
            setQuery('')
            router.push(url)
        },
        [router, setOpen]
    )

    const goToResults = React.useCallback(
        (term) => {
            const q = (term ?? trimmed).trim()
            if (!q) return
            persistRecent(q)
            closeAndGo(`${WEBSITE_SHOP}?q=${encodeURIComponent(q)}`)
        },
        [trimmed, persistRecent, closeAndGo]
    )

    const goToProduct = React.useCallback(
        (product) => {
            if (!product?.slug) return
            persistRecent(trimmed)
            closeAndGo(WEBSITE_PRODUCT_DETAILS(product))
        },
        [trimmed, persistRecent, closeAndGo]
    )

    const goToCategory = React.useCallback(
        (category) => {
            persistRecent(trimmed)
            closeAndGo(category.href || WEBSITE_CATEGORY(category.slug))
        },
        [trimmed, persistRecent, closeAndGo]
    )

    // Keyed on the debounced term; superseded requests are aborted via `signal`
    // and previous results stay visible (dimmed) while the next load, so fast
    // typing never flickers or renders stale, out-of-order data.
    const { data, isFetching, isError, isPlaceholderData, refetch } = useQuery({
        queryKey: ['global-search', debounced],
        queryFn: async ({ signal }) => {
            const { data: res } = await axios.get('/api/shop', {
                params: { q: debounced, limit: RESULT_LIMIT, page: 0 },
                signal,
            })
            if (!res?.success) {
                throw new Error(res?.message || 'Search failed.')
            }
            return res.data
        },
        enabled: open && canFetch,
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
        retry: 1,
    })

    // Results are "current" only once they belong to the text in the box.
    const settled = debounced === trimmed && !isPlaceholderData
    const products = isSearching && canFetch ? data?.products ?? [] : []
    const total = settled ? data?.total ?? 0 : 0
    const productsLoading = isSearching && products.length === 0 && !isError && !settled
    const productsStale = products.length > 0 && !settled
    const pending = isSearching && (!settled || isFetching)
    const noResults =
        isSearching &&
        settled &&
        !isFetching &&
        !isError &&
        products.length === 0 &&
        pageMatches.length === 0 &&
        categoryMatches.length === 0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                showCloseButton={false}
                // Anchored to the top, not centred: the on-screen keyboard
                // covers the lower half of a phone, and on desktop the input
                // stays put while the result list grows and shrinks.
                className="top-3 flex max-h-[min(40rem,calc(100dvh-1.5rem))] max-w-[calc(100%-1.5rem)] translate-y-0 flex-col gap-0 overflow-hidden p-0 ring-1 ring-foreground/10 sm:top-[12vh] sm:max-h-[min(40rem,76vh)] sm:max-w-xl"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Search Energyflow</DialogTitle>
                    <DialogDescription>Search products, categories, pages and shortcuts across the store.</DialogDescription>
                </DialogHeader>

                <CommandPrimitive
                    shouldFilter={false}
                    loop
                    label="Search Energyflow"
                    className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
                >
                    {/* ── Input ── */}
                    <div className="flex shrink-0 items-center gap-3 border-b border-border/70 pl-4 pr-2 sm:pr-3">
                        <SearchIcon className="size-5 shrink-0 text-[var(--brand-primary)]" strokeWidth={1.75} />
                        <CommandPrimitive.Input
                            ref={inputRef}
                            autoFocus
                            value={query}
                            onValueChange={setQuery}
                            maxLength={80}
                            inputMode="search"
                            enterKeyHint="search"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            placeholder="Search products, pages & more..."
                            className="h-14 min-w-0 flex-1 bg-transparent font-neue text-base text-foreground outline-none placeholder:text-[var(--form-field-placeholder)]"
                        />
                        {pending && canFetch && (
                            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                        )}
                        {query && (
                            <button
                                type="button"
                                onClick={clearQuery}
                                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                        <DialogClose
                            className="shrink-0 rounded-[var(--radius-control)] px-2 py-1.5 font-neue text-sm font-medium text-[var(--brand-primary)] sm:hidden"
                        >
                            Cancel
                        </DialogClose>
                    </div>

                    <CommandPrimitive.List
                        data-lenis-prevent
                        className="command-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain scroll-py-2 py-1.5 outline-none"
                    >
                        {/* ── Idle: recent + quick links + categories ── */}
                        {!isSearching && (
                            <>
                                {recent.length > 0 && (
                                    <CommandGroup>
                                        <div className="flex items-center justify-between px-2 pb-1">
                                            <span className="text-[11px] font-semibold uppercase tracking-[0em] text-muted-foreground">
                                                Recent
                                            </span>
                                            <button
                                                type="button"
                                                onClick={clearRecent}
                                                className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-[var(--brand-primary-hover)]"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {recent.map((term) => (
                                            <CommandItem
                                                key={`recent-${term}`}
                                                value={`recent-${term}`}
                                                onSelect={() => goToResults(term)}
                                                className="gap-3 px-2 py-2 font-neue"
                                            >
                                                <Clock className="size-4 text-muted-foreground" />
                                                <span className="truncate">{term}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                <CommandGroup heading="Quick links">
                                    {pages.slice(0, 6).map((page) => {
                                        const Icon = page.icon ?? ArrowRight
                                        return (
                                            <CommandItem
                                                key={`quick-${page.url}`}
                                                value={`quick-${page.url}`}
                                                onSelect={() => closeAndGo(page.url)}
                                                className="gap-3 px-2 py-2 font-neue"
                                            >
                                                <Icon className="size-4 text-[var(--brand-primary)]" />
                                                <span>{page.label}</span>
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>

                                {liveCategories.length > 0 && (
                                    <CommandGroup heading="Popular categories">
                                        {liveCategories.slice(0, IDLE_CATEGORIES).map((category) => (
                                            <CommandItem
                                                key={`idle-cat-${category.slug}`}
                                                value={`idle-cat-${category.slug}`}
                                                onSelect={() => goToCategory(category)}
                                                className="gap-3 px-2 py-2 font-neue"
                                            >
                                                <LayoutGrid className="size-4 text-[var(--brand-primary)]" />
                                                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                                                {category.productCount > 0 && (
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        {category.productCount}
                                                    </span>
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </>
                        )}

                        {/* ── Active search ── */}
                        {isSearching && (
                            <>
                                <CommandGroup>
                                    <CommandItem
                                        value="search-all"
                                        onSelect={() => goToResults()}
                                        className="gap-3 px-2 py-2 font-neue"
                                    >
                                        <SearchIcon className="size-4 shrink-0 text-[var(--brand-primary)]" />
                                        <span className="min-w-0 flex-1 truncate">
                                            Search for{' '}
                                            <span className="font-semibold text-foreground">&ldquo;{trimmed}&rdquo;</span>
                                        </span>
                                        {total > 0 ? (
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {total} {total === 1 ? 'result' : 'results'}
                                            </span>
                                        ) : (
                                            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                                        )}
                                    </CommandItem>
                                </CommandGroup>

                                {categoryMatches.length > 0 && (
                                    <>
                                        <CommandSeparator className="my-1.5" />
                                        <CommandGroup heading="Categories">
                                            {categoryMatches.map((category) => (
                                                <CommandItem
                                                    key={`cat-${category.slug}`}
                                                    value={`cat-${category.slug}`}
                                                    onSelect={() => goToCategory(category)}
                                                    className="gap-3 px-2 py-2 font-neue"
                                                >
                                                    <Thumb src={category.image} alt={category.name} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-foreground">{category.name}</p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {category.productCount > 0
                                                                ? `${category.productCount} ${category.productCount === 1 ? 'product' : 'products'}`
                                                                : 'Category'}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]/command-item:opacity-100" />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </>
                                )}

                                {productsLoading && (
                                    <div className="px-2 pb-2 pt-1" aria-hidden>
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <div key={index} className="flex items-center gap-3 px-2 py-2">
                                                <div className="size-11 shrink-0 animate-pulse rounded-[var(--radius-sm)] bg-muted" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                                                    <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isError && !isFetching && products.length === 0 && (
                                    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                                        <p className="font-neue text-sm text-destructive">Couldn&apos;t load products.</p>
                                        <button
                                            type="button"
                                            onClick={() => refetch()}
                                            className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                                        >
                                            <RotateCcw className="size-3.5" /> Try again
                                        </button>
                                    </div>
                                )}

                                {products.length > 0 && (
                                    <>
                                        <CommandSeparator className="my-1.5" />
                                        <CommandGroup
                                            heading="Products"
                                            className={productsStale ? 'opacity-60 transition-opacity' : 'transition-opacity'}
                                        >
                                            {products.map((product) => {
                                                const price = product?.defaultVariant?.sellingPrice ?? product?.sellingPrice
                                                const mrp = product?.defaultVariant?.mrp ?? product?.mrp
                                                const hasDiscount = Number(mrp) > Number(price)
                                                return (
                                                    <CommandItem
                                                        key={product._id}
                                                        value={`product-${product._id}`}
                                                        onSelect={() => goToProduct(product)}
                                                        className="gap-3 px-2 py-2 font-neue"
                                                    >
                                                        <Thumb
                                                            src={product?.media?.[0]?.secure_url}
                                                            alt={product?.media?.[0]?.alt || product?.name || 'Product'}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-foreground">
                                                                {formatProductName(product?.name)}
                                                            </p>
                                                            <p className="flex min-w-0 items-center gap-2 text-[13px]">
                                                                <span className="font-semibold text-foreground">{formatINR(price)}</span>
                                                                {hasDiscount && (
                                                                    <span className="text-muted-foreground line-through">{formatINR(mrp)}</span>
                                                                )}
                                                                {product?.category?.name && (
                                                                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                                                                        · {product.category.name}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]/command-item:opacity-100" />
                                                    </CommandItem>
                                                )
                                            })}
                                            {total > products.length && (
                                                <CommandItem
                                                    value="search-all-bottom"
                                                    onSelect={() => goToResults()}
                                                    className="justify-center gap-2 px-2 py-2.5 font-neue text-sm font-semibold text-[var(--brand-primary)]"
                                                >
                                                    View all {total} results
                                                    <ArrowRight className="size-4" />
                                                </CommandItem>
                                            )}
                                        </CommandGroup>
                                    </>
                                )}

                                {pageMatches.length > 0 && (
                                    <>
                                        <CommandSeparator className="my-1.5" />
                                        <CommandGroup heading="Pages & shortcuts">
                                            {pageMatches.map((page) => {
                                                const Icon = page.icon ?? ArrowRight
                                                return (
                                                    <CommandItem
                                                        key={`page-${page.url}`}
                                                        value={`page-${page.url}`}
                                                        onSelect={() => closeAndGo(page.url)}
                                                        className="gap-3 px-2 py-2 font-neue"
                                                    >
                                                        <Icon className="size-4 shrink-0 text-[var(--brand-primary)]" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-foreground">{page.label}</p>
                                                            <p className="truncate text-xs text-muted-foreground">{page.description}</p>
                                                        </div>
                                                    </CommandItem>
                                                )
                                            })}
                                        </CommandGroup>
                                    </>
                                )}

                                {noResults && (
                                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                        <div className="flex size-12 items-center justify-center rounded-full bg-tint-honey text-[var(--brand-primary)]">
                                            <PackageSearch className="size-6" strokeWidth={1.5} />
                                        </div>
                                        <p className="font-neue text-sm font-semibold text-foreground">
                                            No matches for &ldquo;{trimmed}&rdquo;
                                        </p>
                                        <p className="font-neue text-xs text-muted-foreground">
                                            Try a different keyword or browse the full collection.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </CommandPrimitive.List>

                    {/* ── Footer hint bar (keyboard users only) ── */}
                    <div className="hidden shrink-0 items-center justify-end gap-4 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground sm:flex">
                        <span className="flex items-center gap-1">
                            <Kbd>↑</Kbd>
                            <Kbd>↓</Kbd>
                            <span className="ml-0.5">navigate</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Kbd>↵</Kbd>
                            <span className="ml-0.5">open</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Kbd>esc</Kbd>
                            <span className="ml-0.5">close</span>
                        </span>
                    </div>
                </CommandPrimitive>
            </DialogContent>
        </Dialog>
    )
}

export default GlobalSearch
