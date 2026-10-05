'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronDown, LayoutGrid } from 'lucide-react'
import { SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { tintAt } from './storefront/format'

/* ================================================================
   Header "Shop" menu — every live category, linked to its /category/… landing page
   Desktop: a mega-menu under the header (hover with intent delays,
   click/keyboard for touch laptops and screen readers) with a live
   preview of the hovered category. Mobile: an accordion inside the
   menu sheet. Data comes from getNavCategories() via the layout.
   ================================================================ */

const OPEN_DELAY = 80     // ms - skip flicker when the cursor just passes over
const CLOSE_DELAY = 240   // ms - room to travel from "Shop" down into the panel

const productLabel = (n) => `${n} ${n === 1 ? 'product' : 'products'}`

// Category thumbnail: product photo, or a tinted tile with the initial.
const CategoryThumb = ({ category, index, className, sizes = '48px' }) => (
    <span
        className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)]', className)}
        style={category.image ? undefined : { background: tintAt(index) }}
        aria-hidden="true"
    >
        {category.image ? (
            <Image src={category.image} alt="" fill sizes={sizes} className="object-cover" />
        ) : (
            <span className="font-header text-lg font-semibold uppercase text-[var(--brand-primary)]">
                {category.name.trim().charAt(0) || '•'}
            </span>
        )}
    </span>
)

/* ── Desktop ─────────────────────────────────────────────────── */

export const ShopMegaMenu = ({ item, data, linkClassName }) => {
    const categories = data?.categories || []
    const pathname = usePathname()
    const panelId = useId()

    const [open, setOpen] = useState(false)
    // Images load only after the menu is first opened, not on every page view.
    const [primed, setPrimed] = useState(false)
    const [previewId, setPreviewId] = useState(categories[0]?.id)
    const timer = useRef(null)
    const rootRef = useRef(null)
    const toggleRef = useRef(null)
    const panelRef = useRef(null)

    const active = pathname === item.url || pathname.startsWith(`${item.url}/`)

    const schedule = useCallback((next, delay) => {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
            if (next) setPrimed(true)
            setOpen(next)
        }, delay)
    }, [])

    const openNow = useCallback(() => {
        clearTimeout(timer.current)
        setPrimed(true)
        setOpen(true)
    }, [])

    const close = useCallback((returnFocus = false) => {
        clearTimeout(timer.current)
        setOpen(false)
        if (returnFocus) toggleRef.current?.focus()
    }, [])

    // Close on navigation (a tile was clicked, or back/forward).
    useEffect(() => { close() }, [pathname, close])
    useEffect(() => () => clearTimeout(timer.current), [])

    // Keep the preview pointing at a category that still exists.
    useEffect(() => {
        if (!categories.some((c) => c.id === previewId)) setPreviewId(categories[0]?.id)
    }, [categories, previewId])

    // Escape closes; a click/tap anywhere outside closes.
    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') close(rootRef.current?.contains(document.activeElement))
        }
        const onPointerDown = (e) => {
            if (!rootRef.current?.contains(e.target)) close()
        }
        document.addEventListener('keydown', onKey)
        document.addEventListener('pointerdown', onPointerDown)
        return () => {
            document.removeEventListener('keydown', onKey)
            document.removeEventListener('pointerdown', onPointerDown)
        }
    }, [open, close])

    // Mouse only: touch "hover" events would open the menu on the same tap
    // that should navigate to /shop.
    const onPointerEnter = (e) => { if (e.pointerType === 'mouse') schedule(true, OPEN_DELAY) }
    const onPointerLeave = (e) => { if (e.pointerType === 'mouse') schedule(false, CLOSE_DELAY) }

    // Leaving the whole menu by keyboard (Tab past the last tile) closes it.
    const onBlur = (e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget)) close()
    }

    const focusFirstTile = () =>
        requestAnimationFrame(() => panelRef.current?.querySelector('a[data-tile]')?.focus())

    const onTriggerKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            openNow()
            focusFirstTile()
        }
    }

    // Arrow keys move between tiles; the grid reads as a simple list.
    const onPanelKeyDown = (e) => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
        const tiles = [...(panelRef.current?.querySelectorAll('a[data-tile]') || [])]
        const i = tiles.indexOf(document.activeElement)
        if (i === -1) return
        e.preventDefault()
        const next =
            e.key === 'Home' ? 0
                : e.key === 'End' ? tiles.length - 1
                    : ['ArrowDown', 'ArrowRight'].includes(e.key) ? Math.min(tiles.length - 1, i + 1)
                        : i === 0 ? -1 : i - 1
        if (next === -1) toggleRef.current?.focus()
        else tiles[next]?.focus()
    }

    // No live categories: plain link, no dropdown affordance.
    if (!categories.length) {
        return (
            <Link href={item.url} className={cn(linkClassName, active && 'text-[var(--brand-primary)] underline')}>
                {item.title}
            </Link>
        )
    }

    const preview = categories.find((c) => c.id === previewId) || categories[0]
    const previewIndex = categories.indexOf(preview)

    return (
        <div ref={rootRef} className="flex items-center" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onBlur={onBlur}>
            <Link
                href={item.url}
                className={cn(linkClassName, (active || open) && 'text-[var(--brand-primary)] underline')}
                onKeyDown={onTriggerKeyDown}
                onClick={() => close()}
            >
                {item.title}
            </Link>
            <button
                ref={toggleRef}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={`${open ? 'Hide' : 'Show'} shop categories`}
                onClick={() => (open ? close() : openNow())}
                onKeyDown={onTriggerKeyDown}
                className="ml-0.5 flex size-7 items-center justify-center rounded-full text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-well)] hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-color)]"
            >
                <ChevronDown className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} strokeWidth={2} />
            </button>

            {/* Panel — spans the header's width (header is the positioned ancestor). */}
            <div
                ref={panelRef}
                id={panelId}
                role="region"
                aria-label="Shop by category"
                inert={!open}
                onKeyDown={onPanelKeyDown}
                className={cn(
                    'absolute inset-x-0 top-full z-10 pt-2 transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none',
                    open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1.5 opacity-0'
                )}
            >
                <div className="overflow-hidden rounded-[var(--radius-tile)] border border-[var(--line-soft)] bg-[var(--surface-card)] shadow-[var(--elev-3)]">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem] xl:grid-cols-[minmax(0,1fr)_17rem]">
                        {/* Category grid */}
                        <div className="flex min-w-0 flex-col gap-3 p-4 xl:px-5">
                            <div className="flex items-center justify-between gap-4">
                                <span className="ef-eyebrow">Shop by category</span>
                                <Link
                                    href={item.url}
                                    data-tile
                                    className="ef-cta h-9 min-h-9 gap-2.5 py-1 pl-3.5 pr-1 text-xs"
                                >
                                    Shop all
                                    <span className="ef-cta__box size-7 [&_svg]:size-3.5">
                                        <ArrowRight aria-hidden="true" />
                                    </span>
                                </Link>
                            </div>

                            <ul
                                className="grid max-h-[min(55vh,24rem)] list-none grid-cols-2 gap-1 overflow-y-auto overscroll-contain p-0 pr-1 xl:grid-cols-3"
                                data-lenis-prevent
                            >
                                {categories.map((category, index) => {
                                    const current = category.id === preview.id
                                    return (
                                        <li key={category.id}>
                                            <Link
                                                href={category.href}
                                                data-tile
                                                onPointerEnter={() => setPreviewId(category.id)}
                                                onFocus={() => setPreviewId(category.id)}
                                                className={cn(
                                                    'group flex items-center gap-3 rounded-[var(--radius-card)] p-1.5 pr-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-color)]',
                                                    current ? 'bg-[var(--surface-sunken)]' : 'hover:bg-[var(--surface-sunken)]'
                                                )}
                                            >
                                                {primed ? (
                                                    <CategoryThumb category={category} index={index} className="size-11" sizes="44px" />
                                                ) : (
                                                    <span className="size-11 shrink-0 rounded-[var(--radius-control)] bg-[var(--surface-well)]" aria-hidden="true" />
                                                )}
                                                <span className="flex min-w-0 flex-1 flex-col">
                                                    <span className="truncate text-[0.9375rem] font-semibold text-[var(--ink-strong)] group-hover:text-[var(--brand-primary)]">
                                                        {category.name}
                                                    </span>
                                                    <span className="text-xs text-[var(--ink-muted)]">{productLabel(category.productCount)}</span>
                                                </span>
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'size-4 shrink-0 text-[var(--brand-primary)] transition-all duration-300',
                                                        current ? 'translate-x-0 opacity-100' : '-translate-x-1.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                                                    )}
                                                />
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>

                        {/* Live preview of the hovered / focused category */}
                        <Link
                            href={preview.href}
                            tabIndex={-1}
                            aria-hidden="true"
                            className="group relative m-2 ml-0 hidden min-h-[10rem] overflow-hidden rounded-[var(--radius-card)] lg:block"
                            style={{ background: preview.image ? 'var(--palette-pine)' : tintAt(previewIndex) }}
                        >
                            {primed && preview.image ? (
                                <Image
                                    key={preview.id}
                                    src={preview.image}
                                    alt=""
                                    fill
                                    sizes="(min-width: 1280px) 272px, 240px"
                                    className="object-cover transition-transform duration-700 ease-out animate-in fade-in-0 group-hover:scale-[1.04] motion-reduce:animate-none"
                                />
                            ) : (
                                <span
                                    key={preview.id}
                                    className="absolute inset-0 flex items-center justify-center font-header text-[7rem] font-semibold uppercase leading-none text-[var(--brand-primary)]/15 animate-in fade-in-0"
                                >
                                    {preview.name.trim().charAt(0)}
                                </span>
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-[rgb(4_28_21/0.85)] via-[rgb(4_28_21/0.2)] to-transparent" />
                            <span key={`label-${preview.id}`} className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 animate-in fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none">
                                <span className="w-fit rounded-full bg-[var(--palette-sunflower)] px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0em] text-[var(--palette-pine)]">
                                    {productLabel(preview.productCount)}
                                </span>
                                <span className="font-header text-xl font-semibold uppercase leading-none text-[var(--palette-cream)]">
                                    {preview.name}
                                </span>
                                <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0em] text-[var(--palette-sunflower)]">
                                    Shop now <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                </span>
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Mobile (inside the menu sheet) ──────────────────────────── */

export const MobileShopMenu = ({ item, data, linkClassName }) => {
    const categories = data?.categories || []
    const totalProducts = data?.totalProducts || 0
    const pathname = usePathname()
    const listId = useId()
    // Start expanded when already browsing the shop.
    const [expanded, setExpanded] = useState(() => pathname.startsWith(item.url))

    if (!categories.length) {
        return (
            <SheetClose asChild>
                <Link href={item.url} className={linkClassName}>{item.title}</Link>
            </SheetClose>
        )
    }

    return (
        <div>
            <div className="flex items-center">
                <SheetClose asChild>
                    <Link href={item.url} className={cn(linkClassName, 'flex-1')}>{item.title}</Link>
                </SheetClose>
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={listId}
                    aria-label={`${expanded ? 'Hide' : 'Show'} shop categories`}
                    onClick={() => setExpanded((v) => !v)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-well)] active:bg-[var(--surface-sunken)]"
                >
                    <ChevronDown className={cn('size-5 transition-transform duration-300', expanded && 'rotate-180')} strokeWidth={2} />
                </button>
            </div>

            {/* grid-rows 0fr → 1fr animates the height without measuring it */}
            <div
                id={listId}
                inert={!expanded}
                className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
                    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
            >
                <ul className="min-h-0 list-none overflow-hidden p-0">
                    <li>
                        <SheetClose asChild>
                            <Link
                                href={item.url}
                                className="mx-1 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[var(--surface-well)] active:bg-[var(--surface-sunken)]"
                            >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--brand-sun)] text-[var(--brand-sun-ink)]" aria-hidden="true">
                                    <LayoutGrid className="size-[1.125rem]" />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold text-[var(--ink-strong)]">All products</span>
                                    <span className="text-xs text-[var(--ink-muted)]">{productLabel(totalProducts)}</span>
                                </span>
                            </Link>
                        </SheetClose>
                    </li>
                    {categories.map((category, index) => (
                        <li key={category.id}>
                            <SheetClose asChild>
                                <Link
                                    href={category.href}
                                    className="mx-1 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[var(--surface-well)] active:bg-[var(--surface-sunken)]"
                                >
                                    {expanded ? (
                                        <CategoryThumb category={category} index={index} className="size-10" sizes="40px" />
                                    ) : (
                                        <span className="size-10 shrink-0 rounded-[var(--radius-control)] bg-[var(--surface-well)]" aria-hidden="true" />
                                    )}
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-semibold text-[var(--ink-strong)]">{category.name}</span>
                                        <span className="text-xs text-[var(--ink-muted)]">{productLabel(category.productCount)}</span>
                                    </span>
                                    <ArrowRight className="size-4 shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
                                </Link>
                            </SheetClose>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
