'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Check,
    ExternalLink,
    GripVertical,
    Info,
    Loader2,
    PackageSearch,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    X,
} from 'lucide-react'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import useReorderList from './useReorderList'
import UnsavedOrderBar from './UnsavedOrderBar'

const inr = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : '—'
}

const Stat = ({ label, value, hint, tone }) => (
    <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
        <p className={cn('mt-1.5 font-header text-2xl font-semibold tabular-nums', tone)}>{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
)

const Thumb = ({ src, alt, className }) => (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-lg bg-muted', className)}>
        <Image src={src || imgPlaceholder.src} alt={alt} fill sizes="96px" className="object-cover" />
    </span>
)

/**
 * Curate a storefront product section (Bestsellers, Freshly Arrived).
 *
 * config:
 *   title, description, icon     page header
 *   endpoint                     '/api/bestseller' — GET list, POST {ids},
 *                                PUT {order}, DELETE {ids}; `${endpoint}/available`
 *   slots                        how many the storefront shows
 *   exact                        true when the section always shows `slots`
 *                                (short lists are topped up automatically)
 *   breadcrumbHref, noun         breadcrumb + copy ("bestseller")
 *
 * Handles: loading skeletons, load failure with retry, empty list, empty
 * catalogue, search with no match, bulk add from a visual picker, drag or
 * arrow reordering with save / discard, storefront cut-off marker.
 */
const CuratedProductsManager = ({ config }) => {
    const { title, description, icon: Icon, endpoint, slots, exact, breadcrumbHref, noun } = config
    const list = useReorderList()
    const [available, setAvailable] = useState([])
    const [status, setStatus] = useState('loading') // loading | ready | error
    const [query, setQuery] = useState('')
    const [picked, setPicked] = useState([])
    const [adding, setAdding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [removingId, setRemovingId] = useState(null)

    const refresh = useCallback(async () => {
        setStatus((s) => (s === 'ready' ? 'ready' : 'loading'))
        try {
            const [current, pool] = await Promise.all([
                axios.get(endpoint),
                axios.get(`${endpoint}/available`),
            ])
            if (!current.data.success) throw new Error(current.data.message)
            if (!pool.data.success) throw new Error(pool.data.message)
            list.load(current.data.data || [])
            setAvailable(pool.data.data || [])
            setPicked([])
            setStatus('ready')
        } catch (error) {
            setStatus('error')
            showToast('error', error?.response?.data?.message || error.message)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint])

    useEffect(() => { refresh() }, [refresh])

    // Warn before leaving with an unsaved order.
    useEffect(() => {
        if (!list.dirty) return
        const onBeforeUnload = (event) => { event.preventDefault(); event.returnValue = '' }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [list.dirty])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return available
        return available.filter((p) => `${p.name} ${p.category?.name || ''}`.toLowerCase().includes(q))
    }, [available, query])

    const togglePick = (id) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

    const handleAdd = async () => {
        if (!picked.length) return
        if (list.dirty) {
            showToast('warning', 'Save or discard your new order before adding products.')
            return
        }
        setAdding(true)
        try {
            const { data } = await axios.post(endpoint, { ids: picked })
            if (!data.success) throw new Error(data.message)
            showToast('success', data.message)
            await refresh()
        } catch (error) {
            showToast('error', error?.response?.data?.message || error.message)
        } finally {
            setAdding(false)
        }
    }

    const handleRemove = async (id) => {
        if (list.dirty) {
            showToast('warning', 'Save or discard your new order before removing products.')
            return
        }
        setRemovingId(id)
        try {
            const { data } = await axios.delete(endpoint, { data: { ids: [id] } })
            if (!data.success) throw new Error(data.message)
            showToast('success', data.message)
            await refresh()
        } catch (error) {
            showToast('error', error?.response?.data?.message || error.message)
        } finally {
            setRemovingId(null)
        }
    }

    const handleSaveOrder = async () => {
        setSaving(true)
        try {
            const { data } = await axios.put(endpoint, { order: list.items.map((p) => p._id) })
            if (!data.success) throw new Error(data.message)
            list.markSaved()
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error?.response?.data?.message || error.message)
        } finally {
            setSaving(false)
        }
    }

    const count = list.items.length
    const live = Math.min(count, slots)
    const autoFilled = exact ? Math.max(0, slots - count) : 0
    const loading = status === 'loading'

    return (
        <div className="flex flex-col gap-5 sm:gap-6">
            <PageHeader
                title={title}
                description={description}
                breadcrumb={<BreadCrumb breadcrumbData={[{ href: ADMIN_DASHBOARD, label: 'Home' }, { href: breadcrumbHref, label: title }]} />}
            />

            {/* Stats + slot meter */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="In your list" value={loading ? '–' : count} hint={`${noun}s you picked`} />
                <Stat label="Live on storefront" value={loading ? '–' : `${live}/${slots}`} hint={`First ${slots} in order`} tone="text-[var(--success)]" />
                <Stat
                    label={exact ? 'Auto-filled slots' : 'Beyond the cut-off'}
                    value={loading ? '–' : exact ? autoFilled : Math.max(0, count - slots)}
                    hint={exact ? 'Topped up with newest products' : 'Saved, not shown yet'}
                    tone={exact && autoFilled > 0 ? 'text-[var(--brand-amber-ink)]' : undefined}
                />
                <Stat label="Available to add" value={loading ? '–' : available.length} hint="Active products not in the list" />
            </div>

            <div className="rounded-xl border bg-card p-4" aria-hidden={loading}>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Storefront slots</span>
                    <span className="tabular-nums">{live} of {slots} filled by you</span>
                </div>
                <div className="flex gap-1">
                    {Array.from({ length: slots }).map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                'h-2 flex-1 rounded-full transition-colors duration-500',
                                i < live ? 'bg-primary' : exact ? 'bg-[var(--brand-sun)]/50' : 'bg-muted'
                            )}
                            style={{ transitionDelay: `${i * 30}ms` }}
                        />
                    ))}
                </div>
                {exact && autoFilled > 0 && !loading && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        This section always shows {slots} products. The {autoFilled} empty {autoFilled === 1 ? 'slot is' : 'slots are'} filled with your newest products until you add more.
                    </p>
                )}
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:gap-6">
                {/* Picker */}
                <section className="flex flex-col overflow-hidden rounded-xl border bg-card" aria-labelledby="picker-title">
                    <div className="flex flex-col gap-3 border-b p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 id="picker-title" className="text-base font-semibold">Add products</h3>
                                <p className="text-sm text-muted-foreground">Tap products to select them, then add them in one go.</p>
                            </div>
                            {picked.length > 0 && (
                                <button type="button" onClick={() => setPicked([])} className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={loading ? 'Loading products…' : `Search ${available.length} products`}
                                disabled={loading || !available.length}
                                aria-label="Search products to add"
                                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <div className="max-h-[26rem] overflow-y-auto p-3 sm:p-4">
                        {loading ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-busy="true">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <span key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
                                ))}
                            </div>
                        ) : status === 'error' ? null : !available.length ? (
                            <div className="flex flex-col items-center py-10 text-center">
                                <Check className="size-8 text-[var(--success)]" aria-hidden="true" />
                                <p className="mt-3 font-medium">Every active product is already in this list</p>
                                <p className="mt-1 text-sm text-muted-foreground">Add new products to the catalogue to feature more.</p>
                            </div>
                        ) : !filtered.length ? (
                            <div className="flex flex-col items-center py-10 text-center">
                                <PackageSearch className="size-8 text-muted-foreground" aria-hidden="true" />
                                <p className="mt-3 font-medium">No products match “{query}”</p>
                                <button type="button" onClick={() => setQuery('')} className="mt-2 text-sm text-primary underline-offset-4 hover:underline">Clear search</button>
                            </div>
                        ) : (
                            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {filtered.map((product) => {
                                    const on = picked.includes(product._id)
                                    return (
                                        <li key={product._id}>
                                            <button
                                                type="button"
                                                onClick={() => togglePick(product._id)}
                                                aria-pressed={on}
                                                className={cn(
                                                    'group relative flex h-full w-full flex-col gap-2 rounded-lg border p-2 text-left transition',
                                                    on ? 'border-primary bg-secondary shadow-[0_0_0_1px_var(--primary)]' : 'hover:border-foreground/30 hover:bg-muted/50'
                                                )}
                                            >
                                                <Thumb src={product.media?.[0]?.secure_url} alt="" className="aspect-square w-full" />
                                                <span className={cn(
                                                    'absolute right-3 top-3 flex size-6 items-center justify-center rounded-full border-2 transition',
                                                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-white/80 bg-black/10 text-transparent'
                                                )}>
                                                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                                                </span>
                                                <span className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</span>
                                                <span className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                                    <span className="truncate">{product.category?.name?.trim() || 'Uncategorised'}</span>
                                                    <span className="shrink-0 font-semibold text-foreground">{inr(product.sellingPrice)}</span>
                                                </span>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t bg-muted/40 p-3 sm:px-5">
                        <span className="text-sm text-muted-foreground">{picked.length ? `${picked.length} selected` : 'Nothing selected'}</span>
                        <Button type="button" className="h-9 gap-2 px-4" onClick={handleAdd} disabled={!picked.length || adding}>
                            {adding ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                            Add {picked.length > 0 ? picked.length : ''} to {title.toLowerCase()}
                        </Button>
                    </div>
                </section>

                {/* Current list */}
                <section className="overflow-hidden rounded-xl border bg-card" aria-labelledby="list-title">
                    <div className="flex items-start justify-between gap-3 border-b p-4 sm:p-5">
                        <div>
                            <h3 id="list-title" className="flex items-center gap-2 text-base font-semibold">
                                {Icon && <Icon className="size-4 text-[var(--success)]" aria-hidden="true" />}
                                Current {title.toLowerCase()} <span className="font-normal text-muted-foreground">({count})</span>
                            </h3>
                            <p className="text-sm text-muted-foreground">Drag rows or use the arrows. The first {slots} appear on the storefront.</p>
                        </div>
                    </div>

                    {loading ? (
                        <ul className="flex flex-col gap-2 p-3 sm:p-4" aria-busy="true">
                            {Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
                        </ul>
                    ) : status === 'error' ? (
                        <div className="flex flex-col items-center px-6 py-14 text-center">
                            <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
                            <p className="mt-3 font-medium">Couldn’t load this list</p>
                            <Button variant="outline" className="mt-4 h-9 gap-2 px-4" onClick={refresh}><RotateCcw className="size-4" /> Retry</Button>
                        </div>
                    ) : count === 0 ? (
                        <div className="flex flex-col items-center px-6 py-14 text-center">
                            {Icon && <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-5" aria-hidden="true" /></span>}
                            <p className="mt-4 font-medium">No {noun}s yet</p>
                            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                {exact ? `Until you pick some, the storefront shows your ${slots} newest products.` : 'Pick products on the left to start this section.'}
                            </p>
                        </div>
                    ) : (
                        <ol className="flex flex-col gap-1.5 p-3 sm:p-4">
                            {list.items.map((product, index) => {
                                const onStore = index < slots
                                return (
                                    <li key={product._id} className="contents">
                                        {index === slots && (
                                            <div className="my-2 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground" role="separator">
                                                <span className="h-px flex-1 border-t border-dashed" /> Storefront cut-off · not shown below <span className="h-px flex-1 border-t border-dashed" />
                                            </div>
                                        )}
                                        <div
                                            {...list.dragProps(index)}
                                            className={cn(
                                                'group flex items-center gap-3 rounded-lg border bg-card p-2 transition sm:p-2.5',
                                                'data-[dragging]:opacity-40 data-[over]:border-primary data-[over]:shadow-[0_-2px_0_var(--primary)]',
                                                !onStore && 'opacity-60'
                                            )}
                                        >
                                            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing max-sm:hidden" aria-hidden="true" />
                                            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums', onStore ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                                                {index + 1}
                                            </span>
                                            <Thumb src={product.media?.[0]?.secure_url} alt="" className="size-12" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{inr(product.sellingPrice)}</span>
                                                    {Number(product.mrp) > Number(product.sellingPrice) && <span className="ml-1.5 line-through">{inr(product.mrp)}</span>}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <Button asChild variant="ghost" size="icon" className="size-8 max-sm:hidden" title="View on storefront">
                                                    <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} target="_blank" aria-label={`View ${product.name} on the storefront`}>
                                                        <ExternalLink className="size-4" />
                                                    </Link>
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === 0} onClick={() => list.move(index, -1)} aria-label={`Move ${product.name} up`}>
                                                    <ArrowUp className="size-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === count - 1} onClick={() => list.move(index, 1)} aria-label={`Move ${product.name} down`}>
                                                    <ArrowDown className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    disabled={removingId === product._id}
                                                    onClick={() => handleRemove(product._id)}
                                                    aria-label={`Remove ${product.name}`}
                                                    title="Remove from list"
                                                >
                                                    {removingId === product._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    )}
                </section>
            </div>

            <UnsavedOrderBar visible={list.dirty} saving={saving} onSave={handleSaveOrder} onDiscard={list.discard} />
        </div>
    )
}

export default CuratedProductsManager

// Re-exported for pages that want the close icon in their own UI.
export { X }
