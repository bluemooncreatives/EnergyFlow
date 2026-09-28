import { createHash } from 'node:crypto'
import mongoose from 'mongoose'
import Razorpay from 'razorpay'
import { clampQty } from '@/lib/cartConstants'
import CouponModel from '@/models/Coupon.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import '@/models/Product.model'
import '@/models/Media.model'
import '@/models/Category.model'

/**
 * The one server-side authority on what a set of checkout lines costs.
 *
 * Takes client lines ({ variantId, productId?, qty }) — from the cart or a
 * buy-now link — and resolves each against the catalogue: soft-deleted
 * variants and products are dropped, prices/names come from the database, and
 * quantities are clamped. Cart verification and order saving both call this,
 * so what checkout shows and what an order is saved at can never disagree.
 *
 * Returns { lines, unavailable } where `unavailable` lists the variantIds that
 * could not be resolved (bad id, deleted, or productId mismatch).
 */
export const priceOrderLines = async (items) => {
    const requested = (Array.isArray(items) ? items : [])
        .map((item) => ({
            variantId: String(item?.variantId ?? ''),
            productId: item?.productId ? String(item.productId) : null,
            qty: clampQty(item?.qty),
        }))

    const validIds = [...new Set(
        requested.map((item) => item.variantId).filter((id) => mongoose.isValidObjectId(id))
    )]

    const variants = validIds.length
        ? await ProductVariantModel.find({ _id: { $in: validIds }, deletedAt: null })
            .populate({ path: 'product', match: { deletedAt: null }, select: 'name slug media category', populate: { path: 'category', match: { deletedAt: null }, select: 'slug' } })
            .populate({ path: 'media', select: 'secure_url' })
            .lean()
        : []

    const variantById = new Map(
        variants.filter((variant) => variant.product?.category).map((variant) => [String(variant._id), variant])
    )

    const lines = []
    const unavailable = []
    const seen = new Set()

    for (const item of requested) {
        const variant = variantById.get(item.variantId)
        const productId = variant ? String(variant.product._id) : null

        if (!variant || (item.productId && item.productId !== productId)) {
            unavailable.push(item.variantId)
            continue
        }
        // Merge duplicate lines for the same variant rather than pricing twice.
        if (seen.has(item.variantId)) {
            const line = lines.find((l) => l.variantId === item.variantId)
            line.qty = clampQty(line.qty + item.qty)
            continue
        }
        seen.add(item.variantId)

        lines.push({
            productId,
            variantId: item.variantId,
            name: variant.product.name,
            url: variant.product.slug,
            categorySlug: variant.product.category.slug,
            size: variant.size,
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            media: variant.media?.[0]?.secure_url || '',
            qty: item.qty,
        })
    }

    return { lines, unavailable }
}

export const subtotalOf = (lines) =>
    Number(lines.reduce((sum, line) => sum + line.sellingPrice * line.qty, 0).toFixed(2))

const round2 = (value) => Number(Number(value || 0).toFixed(2))

/**
 * Prices a whole checkout on the server: lines, coupon and totals. Used before
 * money moves (Razorpay order creation, COD save) so the shopper is stopped
 * while nothing has been charged yet.
 *
 * `products` are what the shopper is looking at; if any price differs from
 * the catalogue the quote is flagged `priceChanged` so the UI can refresh.
 */
export const quoteCheckout = async ({ products, couponCode }) => {
    const { lines, unavailable } = await priceOrderLines(products)

    const clientPrice = new Map((products || []).map((item) => [String(item?.variantId), Number(item?.sellingPrice)]))
    const priceChanged = lines.some((line) =>
        clientPrice.has(line.variantId) && Math.abs(line.sellingPrice - clientPrice.get(line.variantId)) > 0.01
    )

    const subtotal = subtotalOf(lines)
    let couponDiscountAmount = 0
    let couponError = null

    if (couponCode) {
        const coupon = await CouponModel.findOne({ code: String(couponCode).trim().toUpperCase(), deletedAt: null }).lean()
        if (!coupon || new Date() > coupon.validity) {
            couponError = 'Your coupon is no longer valid. Please remove it and try again.'
        } else if (subtotal < coupon.minShoppingAmount) {
            couponError = 'Your order no longer meets the coupon minimum. Please remove it and try again.'
        } else {
            couponDiscountAmount = Math.min(Math.round((subtotal * coupon.discountPercentage) / 100), subtotal)
        }
    }

    return {
        lines,
        unavailable,
        priceChanged,
        couponError,
        subtotal,
        couponDiscountAmount,
        totalAmount: round2(subtotal - couponDiscountAmount),
    }
}

/**
 * The amount due now for a payment mode (COD pays nothing up front).
 */
export const amountDueNow = (totalAmount, paymentMethod, partialPercentage = 100) => {
    if (paymentMethod === 'cod') return 0
    if (paymentMethod === 'partial') return Math.round((totalAmount * partialPercentage) / 100)
    return round2(totalAmount)
}

/**
 * A stable fingerprint of exactly what was quoted — lines (variant, qty,
 * price), coupon discount, total and amount due. It is stamped on the Razorpay
 * order at creation and re-derived from the submitted order after payment, so
 * a paid Razorpay order cannot be replayed against a different basket.
 */
export const checkoutFingerprint = ({ lines, couponDiscountAmount, totalAmount, paidAmount }) => {
    const canonical = JSON.stringify({
        lines: [...lines]
            .map((line) => [String(line.variantId), Number(line.qty), round2(line.sellingPrice)])
            .sort((a, b) => a[0].localeCompare(b[0])),
        coupon: round2(couponDiscountAmount),
        total: round2(totalAmount),
        paid: round2(paidAmount),
    })
    return createHash('sha256').update(canonical).digest('hex')
}

export const razorpayClient = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})
