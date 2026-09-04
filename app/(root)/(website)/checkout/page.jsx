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
import { WEBSITE_CART, WEBSITE_ORDER_DETAILS, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { addIntoCart, clearCart, decreaseQuantity, increaseQuantity, removeFromCart } from '@/store/reducer/cartReducer'
import { MAX_CART_QTY } from '@/lib/cartConstants'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
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
} from 'lucide-react'
import { z } from 'zod'
import { Textarea } from '@/components/ui/textarea'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const breadCrumb = {
    title: 'Checkout',
    links: [
        { label: "Checkout" }
    ]
}

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

const Checkout = () => {
    const router = useRouter()
    const dispatch = useDispatch()
    const cart = useSelector(store => store.cartStore)
    const authStore = useSelector(store => store.authStore)
    const [verifiedCartData, setVerifiedCartData] = useState([])
    const { data: getVerifiedCartData } = useFetch('/api/cart-verification', 'POST', { data: cart.products })
    const { data: profileData } = useFetch('/api/profile/get')

    const [isCouponApplied, setIsCouponApplied] = useState(false)
    const [subtotal, setSubTotal] = useState(0)
    const [mrpTotal, setMrpTotal] = useState(0)
    const [couponDiscountPercentage, setCouponDiscountPercentage] = useState(0)
    const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)
    const [totalAmount, setTotalAmount] = useState(0)
    const [couponLoading, setCouponLoading] = useState(false)
    const [couponCode, setCouponCode] = useState('')

    const [paymentMethod, setPaymentMethod] = useState('full')
    const [payableAmount, setPayableAmount] = useState(0)
    const [remainingAmount, setRemainingAmount] = useState(0)

    const [placingOrder, setPlacingOrder] = useState(false)
    const [savingOrder, setSavingOrder] = useState(false)

    useEffect(() => {
        if (getVerifiedCartData && getVerifiedCartData.success) {
            const cartData = getVerifiedCartData.data
            setVerifiedCartData(cartData)
            dispatch(clearCart())
            cartData.forEach(cartItem => {
                dispatch(addIntoCart(cartItem))
            });
        }
    }, [getVerifiedCartData])


    useEffect(() => {
        const cartProducts = cart.products

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

    }, [cart, couponDiscountPercentage])

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
        setCouponDiscountPercentage(0)
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
    const getOrderId = async (amount) => {
        try {
            const { data: orderIdData } = await axios.post('/api/payment/get-order-id', { amount })
            if (!orderIdData.success) {
                throw new Error(orderIdData.message)
            }

            return { success: true, order_id: orderIdData.data }

        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    const placeOrder = async (formData) => {

        setPlacingOrder(true)
        try {
            // Build the order line-items from the live cart so any quantity change
            // made in the Order Summary is reflected in the order that is saved.
            const products = cart.products.map((cartItem) => ({
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
                    showToast('success', orderResponse.message)
                    dispatch(clearCart())
                    orderForm.reset()
                    router.push(WEBSITE_ORDER_DETAILS(codOrderId))
                } else {
                    showToast('error', orderResponse.message)
                }

                setSavingOrder(false)
                return
            }

            const generateOrderId = await getOrderId(payableAmount)
            if (!generateOrderId.success) {
                throw new Error(generateOrderId.message)
            }

            const order_id = generateOrderId.order_id

            if (typeof window === 'undefined' || !window.Razorpay) {
                throw new Error('Payment gateway is not ready. Please refresh and try again.')
            }

            const razorpayLogoUrl = new URL('/assets/images/razorpay-logo.png', window.location.origin).toString()

            const razOption = {
                "key": process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                "amount": payableAmount * 100,
                "currency": "INR",
                "name": "Energyflow",
                "description": "Handcrafted Women's Fashion",
                "image": razorpayLogoUrl,
                "order_id": order_id,
                "handler": async function (response) {
                    setSavingOrder(true)

                    const { data: paymentResponseData } = await axios.post('/api/payment/save-order', {
                        ...formData,
                        ...response,
                        saveAddress,
                        products,
                        subtotal,
                        couponDiscountAmount,
                        totalAmount,
                        paymentMethod: 'full',
                        partialPaymentPercentage: 100,
                        paidAmount: payableAmount,
                        remainingAmount: 0
                    })

                    if (paymentResponseData.success) {
                        showToast('success', paymentResponseData.message)
                        dispatch(clearCart())
                        orderForm.reset()
                        router.push(WEBSITE_ORDER_DETAILS(response.razorpay_order_id))
                        setSavingOrder(false)
                    } else {
                        showToast('error', paymentResponseData.message)
                        setSavingOrder(false)
                    }
                },
                "prefill": {
                    "name": formData.name,
                    "email": formData.email,
                    "contact": formData.phone
                },

                "theme": {
                    "color": "#3E000D"
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
            <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--dark-red)] text-[12px] font-semibold text-white tabular-nums">
                {step}
            </span>
            <div className="flex flex-1 items-center gap-2">
                <Icon className="size-[18px] text-[var(--dark-red)]" strokeWidth={1.75} />
                <h2 className="font-neue text-base font-semibold uppercase tracking-[0.06em] text-foreground">
                    {title}
                </h2>
            </div>
            {hint && (
                <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:block">
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
                            <span className='absolute inset-0 animate-spin rounded-full border-[3px] border-[var(--dark-red)]/15 border-t-[var(--dark-red)]' />
                            <Package className='size-6 text-[var(--dark-red)]' strokeWidth={1.75} />
                        </div>
                        <div>
                            <h4 className='font-neue text-lg font-semibold text-foreground'>Confirming your order…</h4>
                            <p className='mt-1.5 text-sm text-muted-foreground'>Please don&apos;t close or refresh this window.</p>
                        </div>
                    </div>
                </div>
            }

            <WebsiteBreadcrumb props={breadCrumb} />

            {cart.count === 0
                ?
                <section className='website-gutter py-20 lg:py-28'>
                    <div className='mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border/60 bg-background px-8 py-14 text-center shadow-sm'>
                        <div className='flex size-16 items-center justify-center rounded-full bg-[var(--brand-cream)]/60 text-[var(--dark-red)]'>
                            <Truck className='size-8' strokeWidth={1.5} />
                        </div>
                        <h4 className='font-neue mt-5 text-2xl font-semibold'>Your cart is empty</h4>
                        <p className='font-neue mt-2 max-w-[260px] text-sm text-muted-foreground'>
                            There&apos;s nothing to check out yet. Discover pieces you&apos;ll love and come back to complete your order.
                        </p>
                        <div className='mt-6 w-full max-w-[220px]'>
                            <BrandButton asChild>
                                <Link href={WEBSITE_SHOP}>Continue Shopping</Link>
                            </BrandButton>
                        </div>
                    </div>
                </section>
                :
                <section className='website-gutter py-10 lg:py-14'>
                    <div className='mx-auto grid w-full items-start gap-8 lg:grid-cols-[1fr_minmax(360px,420px)] lg:gap-10'>

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
                                        <label className='sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-sm border border-border/60 p-3.5 transition-colors hover:border-border'>
                                            <input
                                                type='checkbox'
                                                checked={saveAddress}
                                                onChange={(e) => setSaveAddress(e.target.checked)}
                                                className='mt-0.5 size-4 flex-shrink-0 cursor-pointer accent-[var(--dark-red)]'
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
                                    <label className={`flex cursor-pointer items-center gap-4 rounded-sm border p-4 transition-all ${paymentMethod === 'full' ? 'border-[var(--dark-red)] bg-[var(--dark-red)]/[0.04] shadow-sm' : 'border-border/60 hover:border-border'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="full"
                                            checked={paymentMethod === 'full'}
                                            onChange={() => setPaymentMethod('full')}
                                            className="sr-only"
                                        />
                                        <span className={`flex size-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${paymentMethod === 'full' ? 'border-[var(--dark-red)]' : 'border-muted-foreground/40'}`}>
                                            {paymentMethod === 'full' && <span className='size-2.5 rounded-full bg-[var(--dark-red)]' />}
                                        </span>
                                        <div className='flex-1'>
                                            <div className='flex items-center gap-2'>
                                                <p className='font-neue text-base font-semibold text-foreground'>Pay Online</p>
                                                <span className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-600'>Recommended</span>
                                            </div>
                                            <p className='mt-0.5 text-[11px] text-muted-foreground'>UPI, Cards, Net Banking & Wallets — secured by Razorpay</p>
                                        </div>
                                        <span className='font-neue text-base font-semibold text-[var(--dark-red)]'>{fmt(totalAmount)}</span>
                                    </label>

                                    {/* COD */}
                                    <label className={`flex cursor-pointer items-center gap-4 rounded-sm border p-4 transition-all ${paymentMethod === 'cod' ? 'border-[var(--dark-red)] bg-[var(--dark-red)]/[0.04] shadow-sm' : 'border-border/60 hover:border-border'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="sr-only"
                                        />
                                        <span className={`flex size-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${paymentMethod === 'cod' ? 'border-[var(--dark-red)]' : 'border-muted-foreground/40'}`}>
                                            {paymentMethod === 'cod' && <span className='size-2.5 rounded-full bg-[var(--dark-red)]' />}
                                        </span>
                                        <div className='flex-1'>
                                            <p className='font-neue text-base font-semibold text-foreground'>Cash on Delivery</p>
                                            <p className='mt-0.5 text-[11px] text-muted-foreground'>Pay in cash when your order arrives at your doorstep</p>
                                        </div>
                                        <span className='rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground'>COD</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ───────────────── RIGHT: order summary ───────────────── */}
                        <aside className='w-full'>
                            <div className='space-y-4 lg:sticky lg:top-6'>

                                <div className='overflow-hidden rounded-md border border-border/60 bg-background shadow-sm'>
                                    {/* header */}
                                    <div className='flex items-center justify-between border-b border-border/60 px-5 py-4'>
                                        <h2 className='font-neue text-lg font-semibold uppercase tracking-[0.04em]'>Order Summary</h2>
                                        <span className='rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground'>
                                            {cart.count} {cart.count === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>

                                    {/* line items */}
                                    <div className='thin-scrollbar max-h-[340px] divide-y divide-border/50 overflow-y-auto px-5'>
                                        {cart.products?.map(product => {
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
                                                            <h4 className='line-clamp-2 font-neue text-[13px] font-semibold leading-snug text-foreground'>
                                                                <Link href={WEBSITE_PRODUCT_DETAILS(product.url)}>{product.name}</Link>
                                                            </h4>
                                                            <button
                                                                type='button'
                                                                aria-label='Remove item'
                                                                onClick={() => dispatch(removeFromCart({ productId: product.productId, variantId: product.variantId }))}
                                                                className='flex-shrink-0 cursor-pointer text-muted-foreground/50 transition-colors hover:text-[var(--dark-red)]'
                                                            >
                                                                <Trash2 className='size-4' />
                                                            </button>
                                                        </div>

                                                        <span className='mt-1 w-fit rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground'>
                                                            {product.size} / {product.color}
                                                        </span>

                                                        <div className='mt-auto flex items-center justify-between pt-2.5'>
                                                            {/* quantity stepper */}
                                                            <div className='flex items-center rounded-full border border-border/60'>
                                                                <Button
                                                                    type='button'
                                                                    variant='ghost'
                                                                    size='icon-xs'
                                                                    className='rounded-full disabled:opacity-40'
                                                                    disabled={product.qty <= 1}
                                                                    onClick={() => dispatch(decreaseQuantity({ productId: product.productId, variantId: product.variantId }))}
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
                                                                    onClick={() => dispatch(increaseQuantity({ productId: product.productId, variantId: product.variantId }))}
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
                                                    <ButtonLoading type="submit" text="Apply" className="h-9 shrink-0 rounded-sm px-5 cursor-pointer" loading={couponLoading} />
                                                </form>
                                            </Form>
                                            :
                                            <div className='flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-2.5'>
                                                <div className='flex items-center gap-2.5'>
                                                    <BadgeCheck className='size-5 text-emerald-600' />
                                                    <div>
                                                        <p className='text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>Coupon applied</p>
                                                        <p className='font-neue text-sm font-semibold uppercase text-emerald-700'>{couponCode}</p>
                                                    </div>
                                                </div>
                                                <button type='button' onClick={removeCoupon} aria-label='Remove coupon' className='cursor-pointer text-muted-foreground transition-colors hover:text-[var(--dark-red)]'>
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
                                                <span className='font-medium text-emerald-600'>- {fmt(mrpSavings)}</span>
                                            </div>
                                        )}
                                        {couponDiscountAmount > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Coupon discount</span>
                                                <span className='font-medium text-emerald-600'>- {fmt(couponDiscountAmount)}</span>
                                            </div>
                                        )}
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>Shipping</span>
                                            <span className='font-medium text-emerald-600'>FREE</span>
                                        </div>

                                        <div className='my-1 border-t border-dashed border-border/70' />

                                        <div className='flex items-center justify-between'>
                                            <span className='font-neue text-base font-semibold text-foreground'>Total</span>
                                            <span className='font-neue text-xl font-semibold text-foreground'>{fmt(totalAmount)}</span>
                                        </div>

                                        {(mrpSavings + couponDiscountAmount) > 0 && (
                                            <div className='flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-[13px] font-semibold text-emerald-700'>
                                                <BadgeCheck className='size-4' />
                                                You&apos;re saving {fmt(mrpSavings + couponDiscountAmount)} on this order
                                            </div>
                                        )}

                                        {/* payment split context */}
                                        <div className='mt-1 rounded-lg bg-[var(--dark-red)]/[0.05] px-3 py-2'>
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
                                                        <span className='font-semibold text-[var(--dark-red)]'>{fmt(payableAmount)}</span>
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
                                            className="h-12 w-full rounded-sm bg-[var(--dark-red)] text-base font-semibold uppercase tracking-[0.04em] hover:bg-[var(--dark-red-2)] cursor-pointer"
                                        />
                                        <Link
                                            href={WEBSITE_CART}
                                            className='mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground'
                                        >
                                            ← Edit cart
                                        </Link>
                                    </div>
                                </div>

                                {/* trust badges */}
                                <div className='grid grid-cols-3 gap-2.5'>
                                    {TRUST.map(({ Icon, label }) => (
                                        <div key={label} className='flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background px-2 py-3 text-center'>
                                            <Icon className='size-5 text-[var(--dark-red)]' strokeWidth={1.6} />
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

export default Checkout
