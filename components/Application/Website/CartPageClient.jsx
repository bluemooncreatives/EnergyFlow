'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WEBSITE_CHECKOUT, WEBSITE_LOGIN, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { LogIn, Minus, Plus, XCircle } from 'lucide-react'
import { decreaseQuantity, increaseQuantity, removeFromCart } from '@/store/reducer/cartReducer'
import { MAX_CART_QTY } from '@/lib/cartConstants'
import useFetch from '@/hooks/useFetch'

const CartPageClient = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const cart = useSelector((store) => store.cartStore)

    // Authoritative (cookie-based) auth check so the checkout CTA reflects the real
    // session state — redux auth is not persisted and is unreliable on the client.
    const { data: profile, loading: authLoading } = useFetch('/api/profile/get')
    const isLoggedIn = Boolean(profile?.success)

    const [subtotal, setSubTotal] = useState(0)

    useEffect(() => {
        const cartProducts = cart.products

        const totalAmount = cartProducts.reduce((sum, product) => sum + (product.sellingPrice * product.qty), 0)

        setSubTotal(totalAmount)
    }, [cart])

    const isEmpty = cart.count === 0

    // Checkout is account-required: signed-in users go straight to checkout, guests
    // are sent to sign-in and bounced back to checkout afterwards via ?callback.
    const handleCheckout = () => {
        if (authLoading) {
            // Auth state not resolved yet — let the protected route + middleware decide.
            router.push(WEBSITE_CHECKOUT)
            return
        }
        if (isLoggedIn) {
            router.push(WEBSITE_CHECKOUT)
        } else {
            router.push(`${WEBSITE_LOGIN}?callback=${encodeURIComponent(WEBSITE_CHECKOUT)}`)
        }
    }

    const showSignInCta = !authLoading && !isLoggedIn

    return (
        <div>
            <section className="relative isolate h-[172px] overflow-hidden sm:h-[220px] lg:h-[280px]">
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
                        Cart
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-b from-transparent via-white/50 to-white sm:h-36" />
            </section>

            <section className="website-gutter bg-background pt-4 pb-10 sm:py-10 lg:py-14">
                <div className="grid w-full gap-6 lg:grid-cols-[290px_1fr] lg:gap-8">
                    {isEmpty ? (
                        <div className="lg:col-span-2">
                            <Card className="mx-auto w-full max-w-2xl border-border/60 shadow-sm">
                                <CardHeader className="border-b border-border/60">
                                    <CardTitle className="text-xl font-semibold uppercase tracking-[0.04em]">Your cart is empty</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-muted-foreground">
                                    <p>Looks like you haven&apos;t added anything yet.</p>
                                    <p>Explore the shop and add items you love to see them here.</p>
                                </CardContent>
                                <CardFooter className="flex justify-start">
                                    <Button type="button" asChild variant="brand" className="px-6 text-[11px] font-semibold uppercase tracking-[0em]">
                                        <Link href={WEBSITE_SHOP}>Continue Shopping</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    ) : (
                        <>
                            <aside className="w-full">
                                <div className="sticky top-6">
                                    <Card className="border-border/60 shadow-sm">
                                        <CardHeader className="border-b border-border/60">
                                            <CardTitle className="text-lg font-semibold uppercase tracking-[0.04em]">Order Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-medium">
                                                    {subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-base font-semibold">
                                                <span>Total</span>
                                                <span>
                                                    {subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Coupon discounts can be applied at checkout.
                                            </p>
                                        </CardContent>
                                        <CardFooter className="flex flex-col gap-3">
                                            <Button type="button" onClick={handleCheckout} disabled={authLoading} variant="brand" className="h-11 w-full text-[11px] font-semibold uppercase tracking-[0.2em]">
                                                {showSignInCta ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <LogIn className="size-4" /> Sign in to Checkout
                                                    </span>
                                                ) : (
                                                    'Proceed to Checkout'
                                                )}
                                            </Button>
                                            {showSignInCta && (
                                                <p className="text-center text-[11px] text-muted-foreground">
                                                    You&apos;ll need an account to place your order.
                                                </p>
                                            )}
                                            <Button type="button" variant="link" asChild className="h-auto p-0 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground">
                                                <Link href={WEBSITE_SHOP}>Continue Shopping</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            </aside>

                            <div className="w-full">
                                <div className="rounded-lg border border-border/60 bg-background shadow-sm">
                                    <Table>
                                        <TableHeader className="hidden bg-muted/40 md:table-header-group">
                                            <TableRow>
                                                <TableHead className="px-3">Product</TableHead>
                                                <TableHead className="px-3 text-center">Price</TableHead>
                                                <TableHead className="px-3 text-center">Quantity</TableHead>
                                                <TableHead className="px-3 text-center">Total</TableHead>
                                                <TableHead className="px-3 text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.products.map((product) => (
                                                <TableRow key={product.variantId} className="block border-b md:table-row">
                                                    <TableCell className="px-3 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <Image
                                                                src={product.media || imgPlaceholder.src}
                                                                width={64}
                                                                height={64}
                                                                alt={product.name}
                                                                className="h-16 w-16 rounded-md border border-border/60 object-cover"
                                                            />
                                                            <div>
                                                                <h4 className="line-clamp-1 text-base font-semibold">
                                                                    <Link href={WEBSITE_PRODUCT_DETAILS(product.url)}>
                                                                        {product.name}
                                                                    </Link>
                                                                </h4>
                                                                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                                    {product.color} / {product.size}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="flex justify-between px-3 pb-3 text-center md:table-cell md:py-4">
                                                        <span className="font-medium md:hidden">Price</span>
                                                        <span>
                                                            {product.sellingPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="flex justify-between px-3 pb-3 md:table-cell md:py-4">
                                                        <span className="font-medium md:hidden">Quantity</span>
                                                        <div className="flex justify-center">
                                                            <div className="flex items-center justify-center rounded-full border border-border/60 bg-background">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    className="rounded-full"
                                                                    onClick={() => dispatch(decreaseQuantity({ productId: product.productId, variantId: product.variantId }))}
                                                                >
                                                                    <Minus className="size-4" />
                                                                </Button>
                                                                <input
                                                                    type="text"
                                                                    value={product.qty}
                                                                    className="w-10 border-none bg-transparent text-center text-sm outline-offset-0 md:w-12"
                                                                    readOnly
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    className="rounded-full"
                                                                    disabled={product.qty >= MAX_CART_QTY}
                                                                    onClick={() => dispatch(increaseQuantity({ productId: product.productId, variantId: product.variantId }))}
                                                                >
                                                                    <Plus className="size-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="flex justify-between px-3 pb-3 text-center md:table-cell md:py-4">
                                                        <span className="font-medium md:hidden">Total</span>
                                                        <span>
                                                            {(product.sellingPrice * product.qty).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="flex justify-between px-3 pb-4 text-center md:table-cell md:py-4">
                                                        <span className="font-medium md:hidden">Remove</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="text-destructive"
                                                            onClick={() => dispatch(removeFromCart({ productId: product.productId, variantId: product.variantId }))}
                                                        >
                                                            <XCircle className="size-5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}

export default CartPageClient
