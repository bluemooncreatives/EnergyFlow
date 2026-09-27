'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { BrandButton } from '@/components/Application/Website/BrandButton'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import useFetch from '@/hooks/useFetch'
import { showToast } from '@/lib/showToast'
import { zSchema } from '@/lib/zodSchema'
import { WEBSITE_BUY_NOW, WEBSITE_CART, WEBSITE_ORDER_DETAILS, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { addIntoCart, clearCart, decreaseQuantity, increaseQuantity, removeFromCart } from '@/store/reducer/cartReducer'
import { MAX_CART_QTY, clampQty } from '@/lib/cartConstants'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useHydrated } from '@/hooks/useHydrated'
import {
    BadgeCheck,
    Lock,
    Minus,
    Package,
    Plus,
    RotateCcw,
    ShieldCheck,
    Tag,
    Trash2,
    Truck,
    User,
    Wallet,
    XCircle,
    Zap,
} from 'lucide-react'
import { z } from 'zod'
import { Textarea } from '@/components/ui/textarea'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const breadCrumb = {
    title: 'Checkout',
    links: [
        { label: "Checkout" }
    ]
}

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
const OBJECT_ID = /^[a-f\d]{24}$/i

// Server error codes that mean "what you are looking at is stale — review it".
const STALE_CODES = ['PRICE_CHANGED', 'ITEM_UNAVAILABLE']

// Saving an order after an online payment must survive a flaky connection:
// the payment is already taken and save-order is idempotent, so retry.
const postWithRetry = async (url, body, attempts = 3) => {
    for (let i = 1; ; i++) {
        try {
            const { data } = await axios.post(url, body)
            return data
        } catch (error) {
            if (i >= attempts) throw error
            await new Promise((resolve) => setTimeout(resolve, 800 * i))
        }
    }
}

const Checkout = () => {
    const router = useRouter()
    const dispatch = useDispatch()
    const cart = useSelector(store => store.cartStore)
    const hydrated = useHydrated()
    const authStore = useSelector(store => store.authStore)

    // Two checkout modes share this page:
    //   cart    — everything in the cart (/checkout)
    //   buy now — one variant straight from a product (/checkout?buy=<id>&qty=<n>)
    // Buy now lives entirely in the URL, so it never touches the cart, survives
    // the sign-in redirect and a reload, and each tab has its own.
    const searchParams = useSearchParams()
    const buyParam = searchParams.get('buy')
    const isBuyNow = buyParam !== null
    const buyVariantId = OBJECT_ID.test(buyParam || '') ? buyParam : null
    const buyQty = clampQty(searchParams.get('qty'))

    // The buy-now request body only depends on the variant, so changing the
    // quantity does not re-verify; the quantity is applied locally.
    const verifyBody = useMemo(
        () => isBuyNow ? (buyVariantId ? [{ variantId: buyVariantId, qty: 1 }] : []) : cart.products,
        [isBuyNow, buyVariantId, cart.products]
    )
    const {
        data: getVerifiedCartData,
        error: verifyError,
        refetch: reverify,
    } = useFetch('/api/cart-verification', 'POST', { data: verifyBody })
    const { data: profileData } = useFetch('/api/profile/get')

    const [isCouponApplied, setIsCouponApplied] = useState(false)
    const [subtotal, setSubTotal] = useState(0)
    const [mrpTotal, setMrpTotal] = useState(0)
    const [couponDiscountPercentage, setCouponDiscountPercentage] = useState(0)
    const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)
    const [totalAmount, setTotalAmount] = useState(0)
    const [couponLoading, setCouponLoading] = useState(false)
    const [couponCode, setCouponCode] = useState('')
    const [couponMin, setCouponMin] = useState(0)

    const [paymentMethod, setPaymentMethod] = useState('full')
    const [payableAmount, setPayableAmount] = useState(0)
    const [remainingAmount, setRemainingAmount] = useState(0)

    const [placingOrder, setPlacingOrder] = useState(false)
    const [savingOrder, setSavingOrder] = useState(false)

    // Cart mode: replace the stored cart with the server-priced lines, and say
    // so when something was dropped (deleted product, retired pack size).
    useEffect(() => {
        if (isBuyNow || !getVerifiedCartData?.success) return
        const cartData = getVerifiedCartData.data
        if (cartData.length < cart.products.length) {
            showToast('error', 'Some items are no longer available and were removed from your cart.')
        }
        dispatch(clearCart())
        cartData.forEach(cartItem => {
            dispatch(addIntoCart(cartItem))
        });
    }, [getVerifiedCartData])

    // Buy-now mode: the single server-priced line (or null when unavailable).
    const buyLine = isBuyNow && getVerifiedCartData?.success && getVerifiedCartData.data[0]
        ? { ...getVerifiedCartData.data[0], qty: buyQty }
        : null
    const buyResolved = !isBuyNow || !buyVariantId || Boolean(getVerifiedCartData) || Boolean(verifyError)

    // What is being checked out, whichever the mode.
    const lines = useMemo(
        () => isBuyNow ? (buyLine ? [buyLine] : []) : cart.products,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isBuyNow, getVerifiedCartData, buyQty, cart.products]
    )

    // Buy-now quantity is part of the URL; replace (not push) so Back still
    // leads to the product rather than through every stepper click.
    const setBuyQty = (next) => {
        if (!buyVariantId) return
        router.replace(WEBSITE_BUY_NOW(buyVariantId, clampQty(next)), { scroll: false })
    }


    useEffect(() => {
        const cartProducts = lines

        const subTotalAmount = cartProducts.reduce((sum, product) => sum + (product.sellingPrice * product.qty), 0)
        const mrpTotalAmount = cartProducts.reduce((sum, product) => sum + ((product.mrp || product.sellingPrice) * product.qty), 0)

        // Coupon is the only checkout-stage discount. Always derive it from the live
        // subtotal so it stays correct if the cart changes after a coupon is applied.
        const newCouponDiscount = Math.round((subTotalAmount * couponDiscountPercentage) / 100)

        setSubTotal(subTotalAmount)
        setMrpTotal(mrpTotalAmount)
        setCouponDiscountAmount(newCouponDiscount)
        setTotalAmount(subTotalAmount - newCouponDiscount)

        couponForm.setValue('minShoppingAmount', subTotalAmount)

        // Lowering a quantity can drop the order below the coupon's minimum;
        // take the coupon off rather than let the server reject the order.
        if (isCouponApplied && subTotalAmount < couponMin) {
            removeCoupon()
            showToast('error', `Coupon removed — it needs a minimum order of ${fmt(couponMin)}.`)
        }

    }, [lines, couponDiscountPercentage])

    useEffect(() => {
        if (paymentMethod === 'cod') {
            setPayableAmount(0)
            setRemainingAmount(totalAmount)
        } else {
            setPayableAmount(totalAmount)
            setRemainingAmount(0)
        }
    }, [paymentMethod, totalAmount])

    // MRP savings (product-level discount, before coupon)
    const mrpSavings = Math.max(0, mrpTotal - subtotal)


    // coupon form

    const couponFormSchema = zSchema.pick({
        code: true,
        minShoppingAmount: true
    })

    const couponForm = useForm({
        resolver: zodResolver(couponFormSchema),
        defaultValues: {
            code: "",
            minShoppingAmount: subtotal
        }
    })

    const applyCoupon = async (values) => {
        setCouponLoading(true)
        try {
            const { data: response } = await axios.post('/api/coupon/apply', values)
            if (!response.success) {
                throw new Error(response.message)
            }

            const discountPercentage = response.data.discountPercentage
            setCouponMin(Number(response.data.minShoppingAmount) || 0)
            // Store the percentage; the cart effect derives the discount amount + total.
            setCouponDiscountPercentage(discountPercentage)
            showToast('success', response.message)
            // values.code is the trimmed + uppercased value from the zod schema.
            setCouponCode(values.code)
            setIsCouponApplied(true)

            couponForm.resetField('code', '')
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setCouponLoading(false)
        }
    }

    const removeCoupon = () => {
        setIsCouponApplied(false)
        setCouponCode('')
        setCouponMin(0)
        setCouponDiscountPercentage(0)
    }

    // A server rejection that means the page is out of date: refresh the
    // prices (and drop a dead coupon) so the shopper can review and retry.
    const handleStale = (res) => {
        const code = res?.data?.code
        if (code === 'COUPON_INVALID') removeCoupon()
        if (STALE_CODES.includes(code)) reverify()
        showToast('error', res?.message || 'Something went wrong. Please try again.')
    }

    // After an order: the cart is only emptied when the cart was what was
    // bought. replace() so Back does not return to a spent checkout.
    const finishOrder = (orderId, message) => {
        showToast('success', message)
        if (!isBuyNow) dispatch(clearCart())
        orderForm.reset()
        router.replace(WEBSITE_ORDER_DETAILS(orderId))
    }


    // place order
    const orderFormSchema = zSchema.pick({
        name: true,
        email: true,
        phone: true,
        address: true,
        country: true,
        state: true,
        city: true,
        pincode: true,
        landmark: true,
        ordernote: true
    }).extend({
        userId: z.string().optional()
    })

    const orderForm = useForm({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            country: '',
            state: '',
            city: '',
            pincode: '',
            landmark: '',
            ordernote: '',
            userId: authStore?.auth?._id,
        }
    })

    // Opt-in to persist the entered shipping address back onto the user profile so
    // the next checkout is pre-filled (Amazon-style "save address"). Defaulted on or
    // off based on whether the saved profile address is already complete (see below).
    const [saveAddress, setSaveAddress] = useState(false)


    useEffect(() => {
        if (authStore) {
            orderForm.setValue('userId', authStore?.auth?._id)
        }
    }, [authStore])

    useEffect(() => {
        if (profileData?.success) {
            const user = profileData.data
            // Pre-fill from the saved profile. keepDirtyValues ensures that if the
            // profile fetch resolves AFTER the customer has already started typing,
            // we never overwrite the fields they edited.
            orderForm.reset({
                userId: user?._id || '',
                name: user?.name || '',
                email: user?.email || '',
                phone: user?.phone || '',
                address: user?.address || '',
                landmark: user?.landmark || '',
                city: user?.city || '',
                state: user?.state || '',
                pincode: user?.pincode || '',
                country: user?.country || '',
                ordernote: '',
            }, { keepDirtyValues: true })

            // If the saved address is incomplete, default the "save to profile" opt-in
            // ON (so a first-time buyer gets pre-filled next time). If it's already
            // complete, leave it OFF so a one-off/gift address never silently
            // overwrites the customer's saved default.
            const hasCompleteAddress = Boolean(
                user?.phone && user?.address && user?.city && user?.state && user?.pincode && user?.country
            )
            setSaveAddress(!hasCompleteAddress)
        }
    }, [profileData])

    // get order id
    // The server prices the order and creates the Razorpay order for ITS
    // amount; `amount` is only sent so a stale page is caught before paying.
    const getOrderId = async (orderLines, amount) => {
        try {
            const { data: orderIdData } = await axios.post('/api/payment/get-order-id', {
                products: orderLines.map(({ productId, variantId, qty, sellingPrice }) => ({ productId, variantId, qty, sellingPrice })),
                couponCode: isCouponApplied ? couponCode : undefined,
                amount,
            })
            if (!orderIdData.success) {
                return { success: false, response: orderIdData }
            }

            return { success: true, order_id: orderIdData.data.order_id, amount: orderIdData.data.amount }

        } catch (error) {
            return { success: false, response: { message: error.message } }
        }
    }

    const placeOrder = async (formData) => {

        setPlacingOrder(true)
        try {
            if (!lines.length) {
                throw new Error('There is nothing to check out.')
            }

            // Build the order line-items from the live lines so any quantity change
            // made in the Order Summary is reflected in the order that is saved.
            const products = lines.map((cartItem) => ({
                productId: cartItem.productId,
                variantId: cartItem.variantId,
                name: cartItem.name,
                qty: cartItem.qty,
                mrp: cartItem.mrp,
                sellingPrice: cartItem.sellingPrice,
            }))

            if (paymentMethod === 'cod') {
                setSavingOrder(true)
                const codOrderId = `COD_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

                const { data: orderResponse } = await axios.post('/api/payment/save-order', {
                    ...formData,
                    saveAddress,
                    products,
                    couponCode: isCouponApplied ? couponCode : undefined,
                    subtotal,
                    couponDiscountAmount,
                    totalAmount,
                    paymentMethod: 'cod',
                    partialPaymentPercentage: 100,
                    paidAmount: 0,
                    remainingAmount: totalAmount,
                    order_id: codOrderId
                })

                if (orderResponse.success) {
                    finishOrder(codOrderId, orderResponse.message)
                } else {
                    handleStale(orderResponse)
                }

                setSavingOrder(false)
                return
            }

            const generateOrderId = await getOrderId(lines, payableAmount)
            if (!generateOrderId.success) {
                handleStale(generateOrderId.response)
                return
            }

            const order_id = generateOrderId.order_id
            const chargeAmount = generateOrderId.amount

            if (typeof window === 'undefined' || !window.Razorpay) {
                throw new Error('Payment gateway is not ready. Please refresh and try again.')
            }

            const razorpayLogoUrl = new URL('/assets/images/razorpay-logo.png', window.location.origin).toString()

            const razOption = {
                "key": process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                "amount": Math.round(chargeAmount * 100),
                "currency": "INR",
                "name": "Energyflow",
                "description": "Premium Dry Fruits, Nuts & Super Foods",
                "image": razorpayLogoUrl,
                "order_id": order_id,
                "handler": async function (response) {
                    setSavingOrder(true)

                    // The shopper has paid at this point. save-order is idempotent,
                    // so a dropped connection is retried rather than lost.
                    try {
                        const paymentResponseData = await postWithRetry('/api/payment/save-order', {
                            ...formData,
                            ...response,
                            saveAddress,
                            products,
                            couponCode: isCouponApplied ? couponCode : undefined,
                            subtotal,
                            couponDiscountAmount,
                            totalAmount,
                            paymentMethod: 'full',
                            partialPaymentPercentage: 100,
                            paidAmount: chargeAmount,
                            remainingAmount: 0
                        })

                        if (paymentResponseData.success) {
                            finishOrder(response.razorpay_order_id, paymentResponseData.message)
                        } else {
                            showToast('error', `${paymentResponseData.message} (Payment id: ${response.razorpay_payment_id})`)
                        }
                    } catch {
                        showToast('error', `Your payment went through but we could not confirm the order. Please don't pay again — contact support with payment id ${response.razorpay_payment_id}.`)
                    } finally {
                        setSavingOrder(false)
                    }
                },
                "prefill": {
                    "name": formData.name,
                    "email": formData.email,
                    "contact": formData.phone
                },

                "theme": {
                    "color": "#BB3E00"
                }
            }

            const rzp = new window.Razorpay(razOption)
            rzp.on('payment.failed', function (response) {
                showToast('error', response.error.description)
            });

            rzp.open()

        } catch (error) {
            showToast('error', error.message)
        } finally {
            setPlacingOrder(false)
        }
    }

    // ── reusable bits ──────────────────────────────────────────────
    const SectionHeading = ({ step, icon: Icon, title, hint }) => (
        <div className="mb-5 flex items-center gap-3">
            <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[0.8125rem] font-semibold text-white tabular-nums">
                {step}
            </span>
            <div className="flex flex-1 items-center gap-2">
                <Icon className="size-[18px] text-brand" strokeWidth={1.75} aria-hidden="true" />
                <h2 className="font-neue text-[1.125rem] font-medium tracking-[-0.01em] text-ink-strong">
                    {title}
                </h2>
            </div>
            {hint && (
                <span className="hidden text-[0.8125rem] text-ink-muted sm:block">
                    {hint}
                </span>
            )}
        </div>
    )

    const TRUST = [
        { Icon: ShieldCheck, label: '100% Secure Payments' },
        { Icon: Truck, label: 'Free Shipping' },
        { Icon: RotateCcw, label: '7-Day Easy Returns' },
    ]

    const ctaText = paymentMethod === 'cod'
        ? (
            <span className="inline-flex items-center gap-2">
                <Wallet className="size-4" /> Place Order · {fmt(totalAmount)}
            </span>
        )
        : (
            <span className="inline-flex items-center gap-2">
                <Lock className="size-4" /> Pay {fmt(payableAmount)} Securely
            </span>
        )

    return (
        <div>

            {savingOrder &&
                <div className='fixed inset-0 z-[400] flex items-center justify-center bg-[var(--brand-ink)]/40 px-4 backdrop-blur-sm'>
                    <div className='flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-border/60 bg-background px-8 py-10 text-center shadow-xl'>
                        <div className='relative flex size-16 items-center justify-center'>
                            <span className='absolute inset-0 animate-spin rounded-full border-[3px] border-brand/15 border-t-brand' />
                            <Package className='size-6 text-brand' strokeWidth={1.75} />
                        </div>
                        <div>
                            <h4 className='font-neue text-lg font-semibold text-foreground'>Confirming your order…</h4>
                            <p className='mt-1.5 text-sm text-muted-foreground'>Please don&apos;t close or refresh this window.</p>
                        </div>
                    </div>
                </div>
            }

            <WebsiteBreadcrumb props={breadCrumb} />

            {/* The cart is restored from localStorage after hydration; until then
                render a neutral placeholder so the server's empty cart and the
                client's restored cart never produce two different trees. */}
            {(!hydrated || (isBuyNow && !buyResolved))
                ? <section className='ef-section ef-section--tight' aria-busy='true'>
                    <div className='ef-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]'>
                        <div className='ef-card h-96 animate-pulse' />
                        <div className='ef-card h-80 animate-pulse' />
                    </div>
                </section>
                : isBuyNow && !buyLine
                ?
                <section className='ef-section ef-section--tight'>
                    <div className='ef-container'>
                    <div className='ef-card mx-auto max-w-md items-center px-8 py-14 text-center' style={{ borderRadius: 'var(--radius-tile)' }}>
                        <div className='flex size-16 items-center justify-center rounded-full bg-tint-honey text-brand'>
                            <Package className='size-8' strokeWidth={1.5} />
                        </div>
                        <h2 className='font-neue mt-5 text-2xl font-medium tracking-[-0.02em] text-ink-strong'>
                            {verifyError ? 'We couldn’t load this item' : 'This item is no longer available'}
                        </h2>
                        <p className='font-neue mt-2 max-w-[280px] text-sm text-muted-foreground'>
                            {verifyError
                                ? 'Please check your connection and try again.'
                                : 'It may have sold out or been removed. Your cart has not been changed.'}
                        </p>
                        <div className='mt-6 flex w-full max-w-[220px] flex-col gap-2'>
                            {verifyError ? (
                                <BrandButton type='button' onClick={reverify}>Try again</BrandButton>
                            ) : (
                                <BrandButton asChild>
                                    <Link href={WEBSITE_SHOP}>Continue Shopping</Link>
                                </BrandButton>
                            )}
                            {cart.count > 0 && (
                                <Link href={WEBSITE_CART} className='text-[0.8125rem] font-medium text-ink-muted transition-colors hover:text-brand'>
                                    Go to your cart
                                </Link>
                            )}
                        </div>
                    </div>
                    </div>
                </section>
                : !isBuyNow && cart.count === 0
                ?
                <section className='ef-section ef-section--tight'>
                    <div className='ef-container'>
                    <div className='ef-card mx-auto max-w-md items-center px-8 py-14 text-center' style={{ borderRadius: 'var(--radius-tile)' }}>
                        <div className='flex size-16 items-center justify-center rounded-full bg-tint-honey text-brand'>
                            <Truck className='size-8' strokeWidth={1.5} />
                        </div>
                        <h2 className='font-neue mt-5 text-2xl font-medium tracking-[-0.02em] text-ink-strong'>Your cart is empty</h2>
                        <p className='font-neue mt-2 max-w-[260px] text-sm text-muted-foreground'>
                            There&apos;s nothing to check out yet. Discover pieces you&apos;ll love and come back to complete your order.
                        </p>
                        <div className='mt-6 w-full max-w-[220px]'>
                            <BrandButton asChild>
                                <Link href={WEBSITE_SHOP}>Continue Shopping</Link>
                            </BrandButton>
                        </div>
                    </div>
                    </div>
                </section>
                :
                <section className='ef-section ef-section--tight'>
                    <div className='ef-container grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:gap-12'>

                        {/* ───────────────── LEFT: details + payment ───────────────── */}
                        <div className='min-w-0'>
                            <Form {...orderForm}>
                                <form id='checkout-form' onSubmit={orderForm.handleSubmit(placeOrder)}>

                                    {/* Contact */}
                                    <SectionHeading step={1} icon={User} title='Contact Details' hint='Order updates' />
                                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                        <FormField
                                            control={orderForm.control}
                                            name='name'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Full name*" className="form-field" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='email'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="email" placeholder="Email*" className="form-field" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='phone'
                                            render={({ field }) => (
                                                <FormItem className='sm:col-span-2'>
                                                    <FormControl>
                                                        <PhoneInput placeholder="Phone number*" className="form-field" value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Shipping */}
                                    <div className='mt-10'>
                                        <SectionHeading step={2} icon={Truck} title='Shipping Address' hint='Where we deliver' />
                                    </div>
                                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                        <FormField
                                            control={orderForm.control}
                                            name='address'
                                            render={({ field }) => (
                                                <FormItem className='sm:col-span-2'>
                                                    <FormControl>
                                                        <Textarea autoComplete="street-address" placeholder="Flat, House no., Building, Street, Area*" className="form-field form-field-area" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='city'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input autoComplete="address-level2" placeholder="City*" className="form-field" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='pincode'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input inputMode="numeric" autoComplete="postal-code" placeholder="Pincode*" className="form-field" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='state'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input autoComplete="address-level1" placeholder="State*" className="form-field" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='country'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input autoComplete="country-name" placeholder="Country*" className="form-field" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='landmark'
                                            render={({ field }) => (
                                                <FormItem className='sm:col-span-2'>
                                                    <FormControl>
                                                        <Input placeholder="Landmark (optional) — e.g. near City Mall" className="form-field" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={orderForm.control}
                                            name='ordernote'
                                            render={({ field }) => (
                                                <FormItem className='sm:col-span-2'>
                                                    <FormControl>
                                                        <Textarea placeholder="Order note (optional) — delivery instructions, gift message, etc." className="form-field form-field-area" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Save address back to profile for faster checkout next time */}
                                        <label className='sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-card bg-surface-card p-4 shadow-[inset_0_0_0_1px_var(--line-soft)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--line-strong)]'>
                                            <input
                                                type='checkbox'
                                                checked={saveAddress}
                                                onChange={(e) => setSaveAddress(e.target.checked)}
                                                className='mt-0.5 size-4 flex-shrink-0 cursor-pointer accent-[var(--brand-primary)]'
                                            />
                                            <span className='text-[13px] text-muted-foreground'>
                                                <span className='font-semibold text-foreground'>Save this address to my profile</span> for faster checkout next time.
                                            </span>
                                        </label>
                                    </div>
                                </form>
                            </Form>

                            {/* Payment method */}
                            <div className='mt-10'>
                                <SectionHeading step={3} icon={Wallet} title='Payment Method' hint='Choose how to pay' />
                                <div className='space-y-3'>
                                    {/* Full / online */}
                                    <label className={`flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-all ${paymentMethod === 'full' ? 'border-brand bg-brand/[0.04] shadow-sm' : 'border-border/60 hover:border-border'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="full"
                                            checked={paymentMethod === 'full'}
                                            onChange={() => setPaymentMethod('full')}
                                            className="sr-only"
                                        />
                                        <span className={`flex size-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${paymentMethod === 'full' ? 'border-brand' : 'border-muted-foreground/40'}`}>
                                            {paymentMethod === 'full' && <span className='size-2.5 rounded-full bg-brand' />}
                                        </span>
                                        <div className='flex-1'>
                                            <div className='flex items-center gap-2'>
                                                <p className='font-neue text-base font-semibold text-foreground'>Pay Online</p>
                                                <span className='rounded-[var(--radius-control)] bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-success'>Recommended</span>
                                            </div>
                                            <p className='mt-0.5 text-[11px] text-muted-foreground'>UPI, Cards, Net Banking & Wallets — secured by Razorpay</p>
                                        </div>
                                        <span className='font-neue text-base font-semibold text-brand'>{fmt(totalAmount)}</span>
                                    </label>

                                    {/* COD */}
                                    <label className={`flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-all ${paymentMethod === 'cod' ? 'border-brand bg-brand/[0.04] shadow-sm' : 'border-border/60 hover:border-border'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="sr-only"
                                        />
                                        <span className={`flex size-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${paymentMethod === 'cod' ? 'border-brand' : 'border-muted-foreground/40'}`}>
                                            {paymentMethod === 'cod' && <span className='size-2.5 rounded-full bg-brand' />}
                                        </span>
                                        <div className='flex-1'>
                                            <p className='font-neue text-base font-semibold text-foreground'>Cash on Delivery</p>
                                            <p className='mt-0.5 text-[11px] text-muted-foreground'>Pay in cash when your order arrives at your doorstep</p>
                                        </div>
                                        <span className='rounded-[var(--radius-control)] bg-muted/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground'>COD</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ───────────────── RIGHT: order summary ───────────────── */}
                        <aside className='w-full'>
                            <div className='space-y-4 lg:sticky lg:top-28'>

                                <div className='overflow-hidden rounded-[var(--radius-tile)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)]'>
                                    {/* header */}
                                    <div className='flex items-center justify-between border-b border-line-soft px-5 py-4 sm:px-6'>
                                        <h2 className='font-neue text-xl font-medium tracking-[-0.01em] text-ink-strong'>Order summary</h2>
                                        {isBuyNow ? (
                                            <span className='inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-tint-honey px-2.5 py-1 text-[0.75rem] font-medium text-brand'>
                                                <Zap className='size-3' aria-hidden='true' /> Buy now
                                            </span>
                                        ) : (
                                            <span className='rounded-[var(--radius-control)] bg-surface-well px-2.5 py-1 text-[0.75rem] font-medium text-ink-body'>
                                                {cart.count} {cart.count === 1 ? 'item' : 'items'}
                                            </span>
                                        )}
                                    </div>

                                    {/* line items */}
                                    <div className='thin-scrollbar max-h-[340px] divide-y divide-border/50 overflow-y-auto px-5'>
                                        {lines.map(product => {
                                            const lineTotal = product.sellingPrice * product.qty
                                            const lineMrp = (product.mrp || product.sellingPrice) * product.qty
                                            return (
                                                <div key={product.variantId} className='flex gap-3 py-4'>
                                                    <Link
                                                        href={WEBSITE_PRODUCT_DETAILS(product.url)}
                                                        className='relative h-[84px] w-[64px] flex-shrink-0 overflow-hidden rounded-md border border-border/40'
                                                    >
                                                        <Image
                                                            src={product.media || imgPlaceholder.src}
                                                            fill
                                                            sizes='64px'
                                                            alt={product.name}
                                                            className='object-cover object-center'
                                                        />
                                                    </Link>

                                                    <div className='flex min-w-0 flex-1 flex-col'>
                                                        <div className='flex items-start justify-between gap-2'>
                                                            <h3 className='line-clamp-2 font-neue text-[0.875rem] font-medium leading-snug text-ink-strong'>
                                                                <Link href={WEBSITE_PRODUCT_DETAILS(product.url)}>{product.name}</Link>
                                                            </h3>
                                                            {!isBuyNow && (
                                                            <button
                                                                type='button'
                                                                aria-label='Remove item'
                                                                onClick={() => dispatch(removeFromCart({ productId: product.productId, variantId: product.variantId }))}
                                                                className='flex-shrink-0 cursor-pointer text-muted-foreground/50 transition-colors hover:text-brand'
                                                            >
                                                                <Trash2 className='size-4' />
                                                            </button>
                                                            )}
                                                        </div>

                                                        <span className='mt-1 w-fit rounded-[var(--radius-control)] bg-surface-well px-2 py-0.5 text-[0.75rem] text-ink-body'>
                                                            {product.size}
                                                        </span>

                                                        <div className='mt-auto flex items-center justify-between pt-2.5'>
                                                            {/* quantity stepper */}
                                                            <div className='flex items-center rounded-[var(--radius-control)] border border-border/60'>
                                                                <Button
                                                                    type='button'
                                                                    variant='ghost'
                                                                    size='icon-xs'
                                                                    className='rounded-full disabled:opacity-40'
                                                                    disabled={product.qty <= 1}
                                                                    onClick={() => isBuyNow
                                                                        ? setBuyQty(product.qty - 1)
                                                                        : dispatch(decreaseQuantity({ productId: product.productId, variantId: product.variantId }))}
                                                                    aria-label='Decrease quantity'
                                                                >
                                                                    <Minus className='size-3' />
                                                                </Button>
                                                                <span className='w-7 text-center text-[12px] font-semibold tabular-nums'>{product.qty}</span>
                                                                <Button
                                                                    type='button'
                                                                    variant='ghost'
                                                                    size='icon-xs'
                                                                    className='rounded-full'
                                                                    disabled={product.qty >= MAX_CART_QTY}
                                                                    onClick={() => isBuyNow
                                                                        ? setBuyQty(product.qty + 1)
                                                                        : dispatch(increaseQuantity({ productId: product.productId, variantId: product.variantId }))}
                                                                    aria-label='Increase quantity'
                                                                >
                                                                    <Plus className='size-3' />
                                                                </Button>
                                                            </div>

                                                            <div className='text-right'>
                                                                <p className='font-neue text-[14px] font-semibold text-foreground'>{fmt(lineTotal)}</p>
                                                                {lineMrp > lineTotal && (
                                                                    <p className='text-[11px] text-muted-foreground line-through'>{fmt(lineMrp)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* coupon */}
                                    <div className='border-t border-border/60 px-5 py-4'>
                                        {!isCouponApplied
                                            ?
                                            <Form {...couponForm}>
                                                <form className='flex items-start gap-2.5' onSubmit={couponForm.handleSubmit(applyCoupon)}>
                                                    <div className='relative flex-1'>
                                                        <Tag className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                                                        <FormField
                                                            control={couponForm.control}
                                                            name='code'
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Coupon code" className="form-field !pl-9 uppercase" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <ButtonLoading type="submit" text="Apply" className="h-11 shrink-0 rounded-[var(--radius-control)] px-6 cursor-pointer" loading={couponLoading} />
                                                </form>
                                            </Form>
                                            :
                                            <div className='flex items-center justify-between rounded-lg border border-success/30 bg-success/[0.06] px-4 py-2.5'>
                                                <div className='flex items-center gap-2.5'>
                                                    <BadgeCheck className='size-5 text-success' />
                                                    <div>
                                                        <p className='text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>Coupon applied</p>
                                                        <p className='font-neue text-sm font-semibold uppercase text-success'>{couponCode}</p>
                                                    </div>
                                                </div>
                                                <button type='button' onClick={removeCoupon} aria-label='Remove coupon' className='cursor-pointer text-muted-foreground transition-colors hover:text-brand'>
                                                    <XCircle className='size-5' />
                                                </button>
                                            </div>
                                        }
                                    </div>

                                    {/* totals */}
                                    <div className='space-y-2.5 border-t border-border/60 bg-muted/20 px-5 py-4'>
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>{mrpSavings > 0 ? 'Total MRP' : 'Subtotal'}</span>
                                            <span className='font-medium text-foreground'>{fmt(mrpSavings > 0 ? mrpTotal : subtotal)}</span>
                                        </div>
                                        {mrpSavings > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Discount on MRP</span>
                                                <span className='font-medium text-success'>- {fmt(mrpSavings)}</span>
                                            </div>
                                        )}
                                        {couponDiscountAmount > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Coupon discount</span>
                                                <span className='font-medium text-success'>- {fmt(couponDiscountAmount)}</span>
                                            </div>
                                        )}
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>Shipping</span>
                                            <span className='font-medium text-success'>FREE</span>
                                        </div>

                                        <div className='my-1 border-t border-dashed border-border/70' />

                                        <div className='flex items-center justify-between'>
                                            <span className='font-neue text-base font-semibold text-foreground'>Total</span>
                                            <span className='font-neue text-xl font-semibold text-foreground'>{fmt(totalAmount)}</span>
                                        </div>

                                        {(mrpSavings + couponDiscountAmount) > 0 && (
                                            <div className='flex items-center justify-center gap-1.5 rounded-lg bg-success/[0.08] px-3 py-2 text-[13px] font-semibold text-success'>
                                                <BadgeCheck className='size-4' />
                                                You&apos;re saving {fmt(mrpSavings + couponDiscountAmount)} on this order
                                            </div>
                                        )}

                                        {/* payment split context */}
                                        <div className='mt-1 rounded-card bg-tint-honey/60 px-3 py-2.5'>
                                            {paymentMethod === 'cod'
                                                ? (
                                                    <div className='flex items-center justify-between text-[13px]'>
                                                        <span className='text-muted-foreground'>Pay on delivery</span>
                                                        <span className='font-semibold text-foreground'>{fmt(remainingAmount)}</span>
                                                    </div>
                                                )
                                                : (
                                                    <div className='flex items-center justify-between text-[13px]'>
                                                        <span className='text-muted-foreground'>Pay now</span>
                                                        <span className='font-semibold text-brand'>{fmt(payableAmount)}</span>
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className='border-t border-border/60 px-5 py-5'>
                                        <ButtonLoading
                                            form='checkout-form'
                                            type="submit"
                                            text={ctaText}
                                            loading={placingOrder}
                                            className="h-12 w-full rounded-[var(--radius-control)] bg-brand text-[0.9375rem] font-medium hover:bg-brand-hover cursor-pointer"
                                        />
                                        <Link
                                            href={isBuyNow ? WEBSITE_PRODUCT_DETAILS(buyLine?.url) : WEBSITE_CART}
                                            className='mt-3 flex items-center justify-center gap-1.5 text-[0.8125rem] font-medium text-ink-muted transition-colors hover:text-brand'
                                        >
                                            {isBuyNow ? '← Back to product' : '← Edit cart'}
                                        </Link>
                                        {isBuyNow && (
                                            <p className='mt-2 text-center text-[0.75rem] text-ink-muted'>
                                                Only this item is being ordered — your cart stays as it is.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* trust badges */}
                                <div className='grid grid-cols-3 gap-2.5'>
                                    {TRUST.map(({ Icon, label }) => (
                                        <div key={label} className='flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background px-2 py-3 text-center'>
                                            <Icon className='size-5 text-brand' strokeWidth={1.6} />
                                            <span className='text-[10px] font-medium leading-tight text-muted-foreground'>{label}</span>
                                        </div>
                                    ))}
                                </div>

                                <p className='flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground'>
                                    <Lock className='size-3' /> Secure checkout — your details are encrypted &amp; protected.
                                </p>
                            </div>
                        </aside>
                    </div>
                </section>
            }

            <Script src='https://checkout.razorpay.com/v1/checkout.js' />
        </div>
    )
}

// useSearchParams() needs a Suspense boundary in the App Router.
const CheckoutPage = () => (
    <Suspense fallback={null}>
        <Checkout />
    </Suspense>
)

export default CheckoutPage
