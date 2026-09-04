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
    Loader2,
    PackageSearch,
    RotateCcw,
} from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'
import useDebounce from '@/hooks/useDebounce'
import websiteSearchData from '@/lib/websiteSearchData'
import { WEBSITE_SHOP, WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const RECENT_KEY = 'energyflow:recent-searches'
const MAX_RECENT = 6
const RESULT_LIMIT = 8
const MAX_PAGE_MATCHES = 6

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

const GlobalSearch = ({ open, setOpen, isLoggedIn = false }) => {
    const router = useRouter()
    const [query, setQuery] = React.useState('')
    const [recent, setRecent] = React.useState([])

    const trimmed = query.trim()
    const debounced = useDebounce(trimmed, 300)
    const isSearching = debounced.length >= 1

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

    const pageMatches = React.useMemo(() => {
        if (!isSearching) return []
        return pageFuse.search(debounced).slice(0, MAX_PAGE_MATCHES).map((r) => r.item)
    }, [pageFuse, debounced, isSearching])

    // Load recent searches when the modal opens; clear the input when it closes.
    React.useEffect(() => {
        if (open) {
            setRecent(readRecent())
        } else {
            setQuery('')
        }
    }, [open])

    const persistRecent = React.useCallback((term) => {
        const clean = term.trim().slice(0, 80)
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
        (slug) => {
            if (!slug) return
            closeAndGo(WEBSITE_PRODUCT_DETAILS(slug))
        },
        [closeAndGo]
    )

    // Keyed on the debounced term; superseded requests are aborted via `signal`
    // and previous results stay visible while the next load (keepPreviousData),
    // so fast typing never flickers or renders stale, out-of-order data.
    const { data, isFetching, isError, refetch } = useQuery({
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
        enabled: open && isSearching,
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
        retry: 1,
    })

    const products = data?.products ?? []
    const total = data?.total ?? 0
    const productsLoading = isFetching && products.length === 0
    const noResults =
        isSearching && !isFetching && !isError && products.length === 0 && pageMatches.length === 0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                showCloseButton={false}
                className="flex max-h-[85vh] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 ring-1 ring-foreground/10 sm:max-w-xl"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Search Energyflow</DialogTitle>
                    <DialogDescription>Search products, pages and shortcuts across the store.</DialogDescription>
                </DialogHeader>

                <CommandPrimitive
                    shouldFilter={false}
                    loop
                    className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
                >
                    {/* ── Input ── */}
                    <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-4">
                        <SearchIcon className="size-5 shrink-0 text-[var(--brand-primary)]" strokeWidth={1.75} />
                        <CommandPrimitive.Input
                            autoFocus
                            value={query}
                            onValueChange={setQuery}
                            maxLength={80}
                            placeholder="Search products, pages & more..."
                            className="h-14 w-full bg-transparent font-neue text-base text-foreground outline-none placeholder:text-[var(--form-field-placeholder)]"
                        />
                        {isFetching && isSearching && (
                            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    <CommandPrimitive.List
                        data-lenis-prevent
                        className="command-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-py-2 py-1.5 outline-none"
                    >
                        {/* ── Idle: recent + quick links ── */}
                        {!isSearching && (
                            <>
                                {recent.length > 0 && (
                                    <CommandGroup>
                                        <div className="flex items-center justify-between px-2 pb-1">
                                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                                            <span className="font-semibold text-foreground">&ldquo;{debounced}&rdquo;</span>
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

                                {productsLoading && (
                                    <div className="px-2 pb-2 pt-1">
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

                                {isError && !productsLoading && (
                                    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                                        <p className="font-neue text-sm text-destructive">Couldn&apos;t load products.</p>
                                        <button
                                            type="button"
                                            onClick={() => refetch()}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                                        >
                                            <RotateCcw className="size-3.5" /> Try again
                                        </button>
                                    </div>
                                )}

                                {!productsLoading && !isError && products.length > 0 && (
                                    <>
                                        <CommandSeparator className="my-1.5" />
                                        <CommandGroup heading="Products">
                                            {products.map((product) => {
                                                const hasDiscount = product?.mrp > product?.sellingPrice
                                                const thumb = product?.media?.[0]?.secure_url || imgPlaceholder.src
                                                return (
                                                    <CommandItem
                                                        key={product._id}
                                                        value={`product-${product._id}`}
                                                        onSelect={() => goToProduct(product.slug)}
                                                        className="gap-3 px-2 py-2 font-neue"
                                                    >
                                                        <div className="relative size-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--product-card-bg)]">
                                                            <Image
                                                                src={thumb}
                                                                alt={product?.name || 'Product'}
                                                                fill
                                                                sizes="44px"
                                                                className="object-cover object-center"
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-foreground">
                                                                {product?.name}
                                                            </p>
                                                            <p className="flex items-center gap-2 text-[13px]">
                                                                <span className="font-semibold text-foreground">
                                                                    {formatINR(product?.sellingPrice)}
                                                                </span>
                                                                {hasDiscount && (
                                                                    <span className="text-muted-foreground line-through">
                                                                        {formatINR(product?.mrp)}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]/command-item:opacity-100" />
                                                    </CommandItem>
                                                )
                                            })}
                                        </CommandGroup>
                                    </>
                                )}

                                {noResults && (
                                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--brand-cream)]/50 text-[var(--brand-primary)]">
                                            <PackageSearch className="size-6" strokeWidth={1.5} />
                                        </div>
                                        <p className="font-neue text-sm font-semibold text-foreground">
                                            No matches for &ldquo;{debounced}&rdquo;
                                        </p>
                                        <p className="font-neue text-xs text-muted-foreground">
                                            Try a different keyword or browse the full collection.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </CommandPrimitive.List>

                    {/* ── Footer hint bar ── */}
                    <div className="flex shrink-0 items-center justify-end border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
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
