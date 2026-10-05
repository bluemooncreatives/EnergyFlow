'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Heart, Info, RotateCcw, ShoppingBag, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import PageHero from '@/components/Application/Website/storefront/PageHero'
import StoreButton from '@/components/Application/Website/storefront/StoreButton'
import EmptyState from '@/components/Application/Website/storefront/EmptyState'
import { ProductGridSkeleton } from '@/components/Application/Website/storefront/ListingSkeleton'
import ProductCard from '@/components/Application/Website/storefront/ProductCard'
import useHydrated from '@/hooks/useHydrated'
import { bumpWishlistVersion, useWishlistActions } from '@/hooks/useWishlist'
import { showToast } from '@/lib/showToast'
import { MAX_WISHLIST_ITEMS } from '@/lib/wishlistConstants'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { WEBSITE_CART, WEBSITE_LOGIN, WEBSITE_SHOP, WEBSITE_WISHLIST } from '@/routes/WebsiteRoute'
import { persistor } from '@/store/store'
import { addIntoCart } from '@/store/reducer/cartReducer'
import { removeWishlistIds, selectWishlistIds } from '@/store/reducer/wishlistReducer'

const GRID = 'grid grid-cols-2 gap-[var(--grid-gap)] md:grid-cols-3 lg:grid-cols-4'
// How long to wait for a signed-in shopper's list to arrive before showing
// whatever is on the device (e.g. offline).
const ACCOUNT_WAIT_MS = 8000

const usePersistBootstrapped = () =>
    useSyncExternalStore(
        persistor.subscribe,
        () => persistor.getState().bootstrapped,
        () => false
    )

const fetchProducts = async (ids) => {
    const { data } = await axios.post('/api/wishlist/products', { productIds: ids })
    if (!data?.success) throw new Error(data?.message || 'Could not load your wishlist.')
    return { requested: ids, products: Array.isArray(data.data?.products) ? data.data.products : [] }
}

const WishlistPageClient = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const hydrated = useHydrated()
    const bootstrapped = usePersistBootstrapped()
    const { clear } = useWishlistActions()

    const ids = useSelector(selectWishlistIds)
    const ownerId = useSelector((state) => state.wishlistStore?.ownerId)
    const auth = useSelector((state) => state.authStore?.auth)
    const authHydrated = useSelector((state) => state.authStore?.hydrated)
    const cartLines = useSelector((state) => state.cartStore?.products)

    const userId = auth?.role === 'user' && auth?._id ? String(auth._id) : null
    const [confirmClear, setConfirmClear] = useState(false)
    const [gaveUpWaiting, setGaveUpWaiting] = useState(false)

    // A signed-in shopper on a new device has an empty local list until their
    // account list arrives — don't flash "empty" in the meantime.
    const awaitingAccount = Boolean(userId) && ownerId !== userId && !gaveUpWaiting
    useEffect(() => {
        if (!userId || ownerId === userId) return
        const timer = setTimeout(() => setGaveUpWaiting(true), ACCOUNT_WAIT_MS)
        return () => clearTimeout(timer)
    }, [userId, ownerId])

    const ready = hydrated && bootstrapped && authHydrated && !awaitingAccount
    const idsKey = ids.join(',')

    const { data, error, isFetching, isPlaceholderData, refetch } = useQuery({
        queryKey: ['wishlist-products', idsKey],
        queryFn: () => fetchProducts(ids),
        enabled: ready && ids.length > 0,
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
    })

    const byId = useMemo(
        () => new Map((data?.products || []).map((product) => [String(product._id).toLowerCase(), product])),
        [data]
    )
    // Removals show at once from the products already loaded.
    const products = useMemo(() => ids.map((id) => byId.get(id)).filter(Boolean), [ids, byId])

    // Saved products that are no longer sold come back missing: take them off
    // the list (once per answer) and say so.
    const prunedFor = useRef(null)
    useEffect(() => {
        if (!data || isPlaceholderData || isFetching || data.requested.join(',') !== idsKey) return
        if (prunedFor.current === idsKey) return
        prunedFor.current = idsKey
        const missing = data.requested.filter((id) => !byId.has(id))
        if (!missing.length) return
        bumpWishlistVersion()
        dispatch(removeWishlistIds(missing))
        showToast('info', missing.length === 1
            ? 'A saved item is no longer available and was removed from your wishlist.'
            : `${missing.length} saved items are no longer available and were removed from your wishlist.`)
    }, [byId, data, dispatch, idsKey, isFetching, isPlaceholderData])

    const purchasable = products.filter((product) => product?.defaultVariant?._id)

    const addAllToCart = () => {
        const inCart = new Set((cartLines || []).map((line) => `${line.productId}:${line.variantId}`))
        const toAdd = purchasable.filter((product) => !inCart.has(`${product._id}:${product.defaultVariant._id}`))
        if (!toAdd.length) {
            showToast('info', purchasable.length ? 'Everything here is already in your cart.' : 'None of these items can be ordered right now.')
            return
        }
        for (const product of toAdd) {
            const variant = product.defaultVariant
            dispatch(addIntoCart({
                productId: product._id,
                variantId: variant._id,
                name: product.name,
                url: product.slug,
                categorySlug: product.category?.slug,
                size: variant.size,
                mrp: variant.mrp ?? product.mrp,
                sellingPrice: variant.sellingPrice ?? product.sellingPrice,
                media: product.media?.[0]?.secure_url || imgPlaceholder.src,
                qty: 1,
            }))
        }
        const skipped = products.length - toAdd.length
        showToast('success', `${toAdd.length} ${toAdd.length === 1 ? 'item' : 'items'} added to your cart.`, {
            ...(skipped > 0 ? { description: `${skipped} ${skipped === 1 ? 'was' : 'were'} already in your cart or unavailable.` } : {}),
            action: { label: 'View cart', onClick: () => router.push(WEBSITE_CART) },
        })
    }

    const handleClear = async () => {
        setConfirmClear(false)
        await clear()
    }

    const loading = !ready || (ids.length > 0 && !data && !error)
    const count = ready ? ids.length : 0
    const isGuest = authHydrated && !userId

    return (
        <div>
            <PageHero
                title="Wishlist"
                eyebrow="Saved for later"
                description={count > 0
                    ? `${count} saved ${count === 1 ? 'item' : 'items'}. Tap the heart on any product to add or remove it.`
                    : 'Tap the heart on any product to save it here for later.'}
                links={[{ label: 'Wishlist' }]}
            >
                {products.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        <StoreButton onClick={addAllToCart} disabled={!purchasable.length}>
                            <ShoppingBag aria-hidden="true" /> Add all to cart
                        </StoreButton>
                        <StoreButton variant="outline" onClick={() => setConfirmClear(true)}>
                            <Trash2 aria-hidden="true" /> Clear
                        </StoreButton>
                    </div>
                )}
            </PageHero>

            <section className="ef-section ef-section--page ef-section--tight">
                <div className="ef-container flex flex-col gap-6">
                    {isGuest && ready && (
                        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-tint-pistachio p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="flex items-start gap-2.5 text-ink-body">
                                <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                                {auth?.role === 'admin'
                                    ? 'Saved on this device only. Admin accounts don’t have an account wishlist.'
                                    : 'Your wishlist is saved on this device only. Sign in to keep it on every device - it’s added to your account automatically.'}
                            </p>
                            {!auth && (
                                <StoreButton
                                    href={`${WEBSITE_LOGIN}?callback=${encodeURIComponent(WEBSITE_WISHLIST)}`}
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0 self-start sm:self-auto"
                                >
                                    Sign in
                                </StoreButton>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div aria-busy="true" aria-label="Loading your wishlist">
                            <ProductGridSkeleton count={Math.min(Math.max(ids.length, 4), 8)} className={GRID} />
                        </div>
                    ) : ids.length === 0 ? (
                        <EmptyState
                            icon={Heart}
                            title="Your wishlist is empty"
                            description="Save products you love with the heart icon and they’ll wait for you here."
                            action={<StoreButton href={WEBSITE_SHOP} arrow>Browse the shop</StoreButton>}
                        />
                    ) : error && products.length === 0 ? (
                        <EmptyState
                            icon={RotateCcw}
                            tone="danger"
                            title="We couldn’t load your wishlist"
                            description="Your saved items are safe. Check your connection and try again."
                            action={<StoreButton onClick={() => refetch()}><RotateCcw aria-hidden="true" /> Try again</StoreButton>}
                        />
                    ) : (
                        <>
                            <h2 className="sr-only">Saved products</h2>
                            <div className={GRID}>
                                {products.map((product, index) => (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                        actions="full"
                                        priority={index < 4}
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    />
                                ))}
                            </div>
                            {count >= MAX_WISHLIST_ITEMS && (
                                <p className="text-center text-sm text-ink-muted">
                                    Your wishlist is full ({MAX_WISHLIST_ITEMS} items). Remove something to save more.
                                </p>
                            )}
                            <p className="text-center text-sm text-ink-muted">
                                Prices and availability are shown live.{' '}
                                <Link href={WEBSITE_SHOP} className="ef-link">Keep shopping</Link>
                            </p>
                        </>
                    )}
                </div>
            </section>

            <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Clear your wishlist?</DialogTitle>
                        <DialogDescription>
                            This removes all {count} saved {count === 1 ? 'item' : 'items'}. You can undo it straight after.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <StoreButton variant="outline" size="sm">Keep them</StoreButton>
                        </DialogClose>
                        <StoreButton size="sm" onClick={handleClear}>Clear wishlist</StoreButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default WishlistPageClient
