'use client'

import { WEBSITE_CHECKOUT, WEBSITE_LOGIN, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { ArrowRight, LogIn, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { decreaseQuantity, increaseQuantity, removeFromCart } from '@/store/reducer/cartReducer'
import { MAX_CART_QTY, MIN_CART_QTY } from '@/lib/cartConstants'
import useFetch from '@/hooks/useFetch'
import { useHydrated } from '@/hooks/useHydrated'
import PageHero from '@/components/Application/Website/storefront/PageHero'
import StoreButton, { StoreLink } from '@/components/Application/Website/storefront/StoreButton'
import { formatINR } from '@/components/Application/Website/storefront/format'

const CartSkeleton = () => (
    <div className="grid gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1fr)_22rem]" aria-hidden="true">
        <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
                <div key={i} className="ef-card h-32 animate-pulse bg-surface-card" />
            ))}
        </div>
        <div className="ef-card h-72 animate-pulse" />
    </div>
)

const EmptyCart = () => (
    <div className="ef-card mx-auto flex max-w-xl flex-col items-center gap-5 px-6 py-14 text-center" style={{ borderRadius: 'var(--radius-tile)' }}>
        <span className="flex size-16 items-center justify-center rounded-full bg-tint-honey text-brand">
            <ShoppingBag className="size-7" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-medium text-ink-strong">Your cart is empty</h2>
            <p className="text-[0.9375rem] leading-relaxed text-ink-body">
                Explore dry fruits, ghee, cold pressed oils and gift boxes. Everything you add shows up here.
            </p>
        </div>
        <StoreButton href={WEBSITE_SHOP} arrow>Start shopping</StoreButton>
    </div>
)

const QtyStepper = ({ product, onDecrease, onIncrease }) => (
    <div className="inline-flex h-10 items-center rounded-[var(--radius-control)] bg-surface-well p-1" role="group" aria-label={`Quantity of ${product.name}`}>
        <button
            type="button"
            onClick={onDecrease}
            disabled={product.qty <= MIN_CART_QTY}
            aria-label={`Decrease quantity of ${product.name}`}
            className="ef-focus flex size-8 items-center justify-center rounded-full text-brand transition-colors hover:bg-surface-card disabled:opacity-35"
        >
            <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <span className="min-w-8 text-center text-[0.9375rem] font-medium tabular-nums text-ink-strong" aria-live="polite">
            {product.qty}
        </span>
        <button
            type="button"
            onClick={onIncrease}
            disabled={product.qty >= MAX_CART_QTY}
            aria-label={`Increase quantity of ${product.name}`}
            className="ef-focus flex size-8 items-center justify-center rounded-full text-brand transition-colors hover:bg-surface-card disabled:opacity-35"
        >
            <Plus className="size-3.5" aria-hidden="true" />
        </button>
    </div>
)

const CartPageClient = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const hydrated = useHydrated()
    const cart = useSelector((store) => store.cartStore)

    // Authoritative (cookie-based) auth check so the checkout CTA reflects the real
    // session state — redux auth is not persisted and is unreliable on the client.
    const { data: profile, loading: authLoading } = useFetch('/api/profile/get')
    const isLoggedIn = Boolean(profile?.success)

    const products = hydrated ? cart.products : []
    const itemCount = products.reduce((n, p) => n + (Number(p.qty) || 0), 0)
    const subtotal = products.reduce((sum, p) => sum + (Number(p.sellingPrice) || 0) * (Number(p.qty) || 0), 0)
    const mrpTotal = products.reduce((sum, p) => sum + (Number(p.mrp) || Number(p.sellingPrice) || 0) * (Number(p.qty) || 0), 0)
    const savings = Math.max(0, mrpTotal - subtotal)

    // Checkout is account-required: signed-in users go straight to checkout, guests
    // are sent to sign-in and bounced back to checkout afterwards via ?callback.
    const handleCheckout = () => {
        if (authLoading || isLoggedIn) {
            // Unresolved auth: let the protected route + middleware decide.
            router.push(WEBSITE_CHECKOUT)
        } else {
            router.push(`${WEBSITE_LOGIN}?callback=${encodeURIComponent(WEBSITE_CHECKOUT)}`)
        }
    }

    const showSignInCta = !authLoading && !isLoggedIn
    const ids = (p) => ({ productId: p.productId, variantId: p.variantId })

    return (
        <div>
            <PageHero
                title="Your cart"
                links={[{ label: 'Cart' }]}
                description={hydrated && products.length
                    ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout.`
                    : undefined}
            />

            <section className="ef-section ef-section--page ef-section--tight">
                <div className="ef-container">
                    {!hydrated ? (
                        <CartSkeleton />
                    ) : products.length === 0 ? (
                        <EmptyCart />
                    ) : (
                        <div className="grid items-start gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
                            {/* ── Line items ── */}
                            <ul className="flex list-none flex-col gap-3 p-0" aria-label="Items in your cart">
                                {products.map((product) => {
                                    const href = WEBSITE_PRODUCT_DETAILS(product.url)
                                    const line = (Number(product.sellingPrice) || 0) * (Number(product.qty) || 0)
                                    return (
                                        <li key={product.variantId} className="ef-card grid grid-cols-[5rem_minmax(0,1fr)] gap-4 p-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-center sm:p-4">
                                            <Link href={href} className="ef-focus relative block aspect-square overflow-hidden rounded-well bg-surface-well" tabIndex={-1} aria-hidden="true">
                                                <Image
                                                    src={product.media || imgPlaceholder.src}
                                                    alt=""
                                                    fill
                                                    sizes="104px"
                                                    className="object-cover"
                                                />
                                            </Link>

                                            <div className="flex min-w-0 flex-col gap-1">
                                                <h2 className="text-[1rem] font-medium leading-snug text-ink-strong">
                                                    <Link href={href} className="ef-focus ef-clamp-2 rounded-sm hover:text-brand-hover">{product.name}</Link>
                                                </h2>
                                                <p className="text-[0.8125rem] text-ink-muted">
                                                    {product.size && <>{product.size} · </>}{formatINR(product.sellingPrice)} each
                                                </p>
                                                <div className="mt-2 flex items-center gap-3 sm:hidden">
                                                    <QtyStepper
                                                        product={product}
                                                        onDecrease={() => dispatch(decreaseQuantity(ids(product)))}
                                                        onIncrease={() => dispatch(increaseQuantity(ids(product)))}
                                                    />
                                                    <span className="ml-auto text-[1rem] font-semibold text-ink-strong">{formatINR(line)}</span>
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex items-center justify-between gap-4 border-t border-line-soft pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                                                <div className="hidden sm:block">
                                                    <QtyStepper
                                                        product={product}
                                                        onDecrease={() => dispatch(decreaseQuantity(ids(product)))}
                                                        onIncrease={() => dispatch(increaseQuantity(ids(product)))}
                                                    />
                                                </div>
                                                <span className="hidden min-w-[5.5rem] text-right text-[1.0625rem] font-semibold text-ink-strong sm:block">
                                                    {formatINR(line)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch(removeFromCart(ids(product)))}
                                                    aria-label={`Remove ${product.name} from cart`}
                                                    className="ef-focus inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-2 py-1.5 text-[0.8125rem] text-ink-muted transition-colors hover:text-destructive"
                                                >
                                                    <Trash2 className="size-4" aria-hidden="true" />
                                                    <span className="sm:sr-only">Remove</span>
                                                </button>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>

                            {/* ── Summary ── */}
                            <aside className="lg:sticky lg:top-28" aria-labelledby="summary-title">
                                <div className="ef-card gap-5 p-5 sm:p-6" style={{ borderRadius: 'var(--radius-tile)' }}>
                                    <h2 id="summary-title" className="text-xl font-medium text-ink-strong">Order summary</h2>

                                    <dl className="flex flex-col gap-3 text-[0.9375rem]">
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-ink-body">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
                                            <dd className="font-medium text-ink-strong">{formatINR(mrpTotal)}</dd>
                                        </div>
                                        {savings > 0 && (
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-ink-body">You save</dt>
                                                <dd className="font-medium text-brand-bright">−{formatINR(savings)}</dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between gap-4 border-t border-line-soft pt-3 text-[1.0625rem]">
                                            <dt className="font-medium text-ink-strong">Total</dt>
                                            <dd className="font-semibold text-ink-strong">{formatINR(subtotal)}</dd>
                                        </div>
                                    </dl>
                                    <p className="text-[0.8125rem] text-ink-muted">Coupons and delivery are applied at checkout.</p>

                                    <button
                                        type="button"
                                        onClick={handleCheckout}
                                        disabled={authLoading}
                                        className="ef-btn ef-btn--primary ef-btn--lg ef-btn--block"
                                    >
                                        {showSignInCta ? <><LogIn aria-hidden="true" /> Sign in to checkout</> : <>Proceed to checkout <ArrowRight className="ef-btn__arrow" aria-hidden="true" /></>}
                                    </button>
                                    {showSignInCta && (
                                        <p className="-mt-2 text-center text-[0.8125rem] text-ink-muted">You&apos;ll need an account to place your order.</p>
                                    )}

                                    <ul className="flex list-none flex-col gap-2.5 border-t border-line-soft p-0 pt-4 text-[0.8125rem] text-ink-body">
                                        <li className="flex items-center gap-2.5"><ShieldCheck className="size-4 text-brand" aria-hidden="true" /> Secure payment via Razorpay</li>
                                        <li className="flex items-center gap-2.5"><Truck className="size-4 text-brand" aria-hidden="true" /> Delivered across India</li>
                                    </ul>

                                    <StoreLink href={WEBSITE_SHOP} className="self-center">Continue shopping</StoreLink>
                                </div>
                            </aside>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default CartPageClient
