'use client'
import { ShoppingBag, ShoppingCart, ShoppingCartIcon } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useDispatch, useSelector } from "react-redux"
import Image from "next/image"
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { removeFromCart } from "@/store/reducer/cartReducer"
import Link from "next/link"
import { WEBSITE_CART, WEBSITE_CHECKOUT, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
import { BrandButton, BrandOutlineButton } from "@/components/Application/Website/BrandButton"
import { useEffect, useState } from "react"
import { showToast } from "@/lib/showToast"

const fmt = (n) => n?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

const Cart = () => {
    const [open, setOpen] = useState(false)
    const [subtotal, setSubTotal] = useState(0)
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const cart = useSelector(store => store.cartStore)
    const dispatch = useDispatch()
    const cartCount = mounted ? cart.count : 0

    useEffect(() => {
        const cartProducts = cart.products
        setSubTotal(cartProducts.reduce((s, p) => s + p.sellingPrice * p.qty, 0))
    }, [cart])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* ── Trigger ── */}
            <SheetTrigger aria-label="Open cart" className="relative flex items-center justify-center rounded-md px-1.5 py-1.5 transition hover:bg-muted/40 sm:px-2.5 sm:py-2">
                <ShoppingCart className="h-4 w-4 text-foreground sm:h-5 sm:w-5" strokeWidth={1.75} />
                {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--dark-red)] px-1 text-[9px] font-semibold text-white tabular-nums sm:-right-2 sm:-top-2 sm:h-5 sm:min-w-5 sm:text-[10px]">
                        {cartCount}
                    </span>
                )}
            </SheetTrigger>

            {/* ── Drawer ── */}
            <SheetContent className="w-full gap-0 border-l border-border/40 bg-background p-0 shadow-xl sm:max-w-[440px]">

                {/* Header */}
                <SheetHeader className="flex-shrink-0 border-b border-border/50 px-5 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center justify-between pr-8">
                        <SheetTitle className="font-header text-2xl leading-none tracking-wide text-[var(--brand-primary)] sm:font-neue sm:text-xl sm:font-semibold sm:leading-normal sm:tracking-[0.01em] sm:text-foreground">
                            My Cart
                        </SheetTitle>
                        {cartCount > 0 && (
                            <span className="rounded-full bg-[var(--brand-cream)]/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--brand-primary)] sm:bg-muted/60 sm:text-muted-foreground">
                                {cartCount} {cartCount === 1 ? 'item' : 'items'}
                            </span>
                        )}
                    </div>
                    <SheetDescription className="sr-only">Your selected items</SheetDescription>
                </SheetHeader>

                {/* Scrollable product list */}
                <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">
                    {cart.count === 0 ? (
                        <div className="flex flex-col items-center rounded-lg border border-border/60 bg-background px-6 py-12 text-center shadow-sm sm:py-14">
                            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--brand-cream)]/50 text-[var(--brand-primary)]">
                                <ShoppingCartIcon className="size-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-header mt-5 text-2xl leading-none tracking-wide text-[var(--brand-primary)] sm:font-neue sm:text-xl sm:font-semibold sm:leading-normal sm:tracking-normal sm:text-foreground">
                                Your cart is empty
                            </h3>
                            <p className="font-neue mt-2.5 max-w-[220px] text-sm text-muted-foreground">
                                Add pieces you love to see them here with pricing and quick checkout.
                            </p>
                            <div className="mt-6 w-full">
                                <BrandButton asChild onClick={() => setOpen(false)}>
                                    <Link href={WEBSITE_SHOP}>
                                        <ShoppingBag className="mr-2 size-4" />
                                        Shop Now
                                    </Link>
                                </BrandButton>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.products?.map(product => (
                                <div
                                    key={product.variantId}
                                    className="group relative flex items-stretch gap-3 rounded-xs border border-border/40 bg-background p-3 transition-all duration-200 hover:border-border/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-[80px] flex-shrink-0 overflow-hidden rounded-xs border border-border/30">
                                        <Image
                                            src={product?.media || imgPlaceholder.src}
                                            fill
                                            sizes="80px"
                                            alt={product.name}
                                            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.06]"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                                        <h4 className="line-clamp-2 font-neue text-[13px] font-semibold leading-snug text-foreground">
                                            {product.name}
                                        </h4>
                                        <span className="w-fit rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                            {product.size} / {product.color}
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="rounded-xs bg-[var(--dark-red)]/10 px-1.5 py-0.5 font-neue text-[10px] font-semibold text-[var(--dark-red)]">
                                                ×{product.qty}
                                            </span>
                                            <span className="font-neue text-[14px] font-semibold text-foreground">
                                                {fmt(product.sellingPrice)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => dispatch(removeFromCart({ productId: product.productId, variantId: product.variantId }))}
                                            className="w-fit cursor-pointer text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/50 transition-colors hover:text-[var(--dark-red)]"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-border/50 bg-background px-6 pb-6 pt-5">
                    {cart.count > 0 ? (
                        <>
                            {/* Price summary */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-neue text-[15px] text-muted-foreground">Subtotal</span>
                                    <span className="font-neue text-[15px] font-medium text-foreground">{fmt(subtotal)}</span>
                                </div>

                                <div className="my-1 border-t border-border/40" />

                                <div className="flex items-center justify-between">
                                    <span className="font-neue text-[17px] font-semibold text-foreground">Total</span>
                                    <span className="font-neue text-[17px] font-semibold text-foreground">{fmt(subtotal)}</span>
                                </div>
                            </div>

                            <p className="mt-2.5 rounded-lg bg-muted/40 px-3 py-2 text-center text-[11.5px] font-medium text-muted-foreground">
                                Have a coupon? Apply it at checkout.
                            </p>
                        </>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-neue text-[15px] font-semibold text-foreground">Total</span>
                                <span className="font-neue text-[15px] font-semibold text-foreground">{fmt(0)}</span>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                        <BrandOutlineButton
                            type="button"
                            asChild
                            className="text-[13px] tracking-wide sm:text-base sm:tracking-normal"
                            onClick={() => setOpen(false)}
                        >
                            <Link href={WEBSITE_CART}>View Cart</Link>
                        </BrandOutlineButton>
                        <BrandButton
                            type="button"
                            asChild
                            className="text-[13px] tracking-wide sm:text-base sm:tracking-normal"
                            onClick={() => setOpen(false)}
                        >
                            {cart.count ? (
                                <Link href={WEBSITE_CHECKOUT}>Checkout</Link>
                            ) : (
                                <span onClick={(e) => { e.preventDefault(); showToast('error', 'Your cart is empty!') }}>
                                    Checkout
                                </span>
                            )}
                        </BrandButton>
                    </div>
                </div>

            </SheetContent>
        </Sheet>
    )
}

export default Cart
