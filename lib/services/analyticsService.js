import mongoose from 'mongoose'
import { connectDB } from '@/lib/databaseConnection'
import OrderModel from '@/models/Order.model'
import ProductModel from '@/models/Product.model'
import UserModel from '@/models/User.model'
import ReviewModel from '@/models/Review.model'
import ContactModel from '@/models/Contact.model'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'
import CouponModel from '@/models/Coupon.model'
import '@/models/Category.model'
import { formatCategoryName, formatProductName } from '@/lib/seo'

/**
 * Store analytics for the admin dashboard — one report per date range,
 * compared with the previous period of the same length.
 *
 * Definitions (kept in one place so every tile and chart agrees):
 *   • Placed order  — any non-deleted order created in the range.
 *   • Valid order   — placed and not cancelled / unverified. Revenue, AOV,
 *                     units and product/geo/customer rankings use these.
 *   • Net sales     — sum of totalAmount on valid orders (after coupons).
 *   • Collected     — paidAmount on valid orders; Outstanding = remainingAmount.
 *   • Returning     — a customer whose first-ever order is before the range.
 *
 * All day / hour / weekday buckets are in India time (IST, UTC+5:30), the
 * store's own clock, regardless of where the server runs.
 */

const IST_OFFSET_MS = 330 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const INVALID_STATUSES = new Set(['cancelled', 'unverified'])
const MAX_ORDERS = 25000 // safety cap on a single report's working set

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

export const RANGES = {
    today: { label: 'Today', days: 1 },
    yesterday: { label: 'Yesterday', days: 1 },
    '7d': { label: 'Last 7 days', days: 7 },
    this_month: { label: 'This month' },
    last_month: { label: 'Last month' },
    '30d': { label: 'Last 30 days', days: 30 },
    '90d': { label: 'Last 90 days', days: 90 },
    '12m': { label: 'Last 12 months', days: 365 },
    ytd: { label: 'Year to date' },
    this_year: { label: 'This year' },
    last_year: { label: 'Last year' },
    all: { label: 'All time' },
}

// ── IST calendar helpers ─────────────────────────────────────────────
const toIst = (date) => new Date(new Date(date).getTime() + IST_OFFSET_MS)
const istDayKey = (date) => toIst(date).toISOString().slice(0, 10)
const istMonthKey = (date) => toIst(date).toISOString().slice(0, 7)
// Start of the IST calendar day containing `date`, as a real instant.
const istStartOfDay = (date) => {
    const ist = toIst(date)
    ist.setUTCHours(0, 0, 0, 0)
    return new Date(ist.getTime() - IST_OFFSET_MS)
}
// Monday-start ISO week key in IST.
const istWeekKey = (date) => {
    const start = istStartOfDay(date)
    const ist = toIst(start)
    const weekday = (ist.getUTCDay() + 6) % 7
    return istDayKey(new Date(start.getTime() - weekday * DAY_MS))
}

const round = (n, dp = 2) => {
    const f = 10 ** dp
    return Math.round((Number(n) || 0) * f) / f
}
const pctChange = (current, previous) => {
    if (!previous) return current ? null : 0 // null = "new" (no base to compare)
    return round(((current - previous) / previous) * 100, 1)
}

// Resolve the report window [start, end) and the comparison window.
export const resolveWindow = ({ range = '30d', from, to, year, month, date, firstOrderAt }) => {
    const now = new Date()
    const istNow = toIst(now)
    const currentYear = istNow.getUTCFullYear()
    const currentMonth = istNow.getUTCMonth() + 1 // 1-12
    const endOfToday = new Date(istStartOfDay(now).getTime() + DAY_MS) // end of today (IST)

    // 1. Single Date Filter (exact date YYYY-MM-DD)
    if (date || range === 'date') {
        const dStr = date || istDayKey(now)
        const dObj = new Date(dStr)
        if (!Number.isNaN(dObj.getTime())) {
            const start = istStartOfDay(dObj)
            const end = new Date(start.getTime() + DAY_MS)
            const prevStart = new Date(start.getTime() - DAY_MS)
            const prevEnd = start
            return {
                key: 'date',
                label: `Date: ${dStr}`,
                start,
                end,
                prevStart,
                prevEnd,
                days: 1,
                granularity: 'hour',
            }
        }
    }

    // 2. Specific Month Filter (e.g. month=9 & year=2026 or month='2026-09')
    if ((month && month !== 'all') || range === 'month') {
        let y = Number(year) || currentYear
        let m = Number(month)
        if (typeof month === 'string' && month.includes('-')) {
            const parts = month.split('-')
            y = Number(parts[0]) || y
            m = Number(parts[1]) || 1
        }
        if (!m || m < 1 || m > 12) m = currentMonth

        const start = new Date(Date.UTC(y, m - 1, 1) - IST_OFFSET_MS)
        const end = new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS)
        const prevStart = new Date(Date.UTC(m === 1 ? y - 1 : y, m === 1 ? 11 : m - 2, 1) - IST_OFFSET_MS)
        const prevEnd = start
        const length = end.getTime() - start.getTime()
        const days = Math.round(length / DAY_MS)
        return {
            key: 'month',
            label: `${MONTH_NAMES[m - 1]} ${y}`,
            start,
            end,
            prevStart,
            prevEnd,
            days,
            granularity: 'day',
        }
    }

    // 3. Specific Year Filter (e.g. year=2025 or range=year)
    if ((year && year !== 'all' && (!range || range === 'year')) || range === 'year') {
        const y = Number(year) || currentYear
        const start = new Date(Date.UTC(y, 0, 1) - IST_OFFSET_MS)
        const end = new Date(Date.UTC(y + 1, 0, 1) - IST_OFFSET_MS)
        const prevStart = new Date(Date.UTC(y - 1, 0, 1) - IST_OFFSET_MS)
        const prevEnd = start
        const length = end.getTime() - start.getTime()
        const days = Math.round(length / DAY_MS)
        return {
            key: 'year',
            label: `Year ${y}`,
            start,
            end,
            prevStart,
            prevEnd,
            days,
            granularity: 'month',
        }
    }

    // 4. Custom range
    if (range === 'custom') {
        const f = from ? new Date(from) : null
        const t = to ? new Date(to) : null
        if (f && t && !Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime()) && f <= t) {
            const start = istStartOfDay(f)
            const customEnd = new Date(istStartOfDay(t).getTime() + DAY_MS)
            return finishWindow('custom', start, customEnd)
        }
    }

    // 5. Yesterday
    if (range === 'yesterday') {
        const end = istStartOfDay(now)
        const start = new Date(end.getTime() - DAY_MS)
        return {
            key: 'yesterday',
            label: 'Yesterday',
            start,
            end,
            prevStart: new Date(start.getTime() - DAY_MS),
            prevEnd: start,
            days: 1,
            granularity: 'hour',
        }
    }

    // 6. This Month
    if (range === 'this_month') {
        const start = new Date(Date.UTC(currentYear, currentMonth - 1, 1) - IST_OFFSET_MS)
        const end = endOfToday
        const prevStart = new Date(Date.UTC(currentMonth === 1 ? currentYear - 1 : currentYear, currentMonth === 1 ? 11 : currentMonth - 2, 1) - IST_OFFSET_MS)
        const daysIntoMonth = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS))
        const prevEnd = new Date(prevStart.getTime() + daysIntoMonth * DAY_MS)
        return {
            key: 'this_month',
            label: `This month (${MONTH_NAMES[currentMonth - 1]})`,
            start,
            end,
            prevStart,
            prevEnd,
            days: daysIntoMonth,
            granularity: 'day',
        }
    }

    // 7. Last Month
    if (range === 'last_month') {
        const y = currentMonth === 1 ? currentYear - 1 : currentYear
        const m = currentMonth === 1 ? 12 : currentMonth - 1
        const start = new Date(Date.UTC(y, m - 1, 1) - IST_OFFSET_MS)
        const end = new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS)
        const prevY = m === 1 ? y - 1 : y
        const prevM = m === 1 ? 12 : m - 1
        const prevStart = new Date(Date.UTC(prevY, prevM - 1, 1) - IST_OFFSET_MS)
        const prevEnd = start
        const days = Math.round((end.getTime() - start.getTime()) / DAY_MS)
        return {
            key: 'last_month',
            label: `Last month (${MONTH_NAMES[m - 1]} ${y})`,
            start,
            end,
            prevStart,
            prevEnd,
            days,
            granularity: 'day',
        }
    }

    // 8. This Year / Last Year
    if (range === 'this_year') {
        const start = new Date(Date.UTC(currentYear, 0, 1) - IST_OFFSET_MS)
        const end = endOfToday
        const prevStart = new Date(Date.UTC(currentYear - 1, 0, 1) - IST_OFFSET_MS)
        const daysIntoYear = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS))
        const prevEnd = new Date(prevStart.getTime() + daysIntoYear * DAY_MS)
        return {
            key: 'this_year',
            label: `This year (${currentYear})`,
            start,
            end,
            prevStart,
            prevEnd,
            days: daysIntoYear,
            granularity: 'month',
        }
    }

    if (range === 'last_year') {
        const y = currentYear - 1
        const start = new Date(Date.UTC(y, 0, 1) - IST_OFFSET_MS)
        const end = new Date(Date.UTC(y + 1, 0, 1) - IST_OFFSET_MS)
        const prevStart = new Date(Date.UTC(y - 1, 0, 1) - IST_OFFSET_MS)
        const prevEnd = start
        return {
            key: 'last_year',
            label: `Last year (${y})`,
            start,
            end,
            prevStart,
            prevEnd,
            days: 365,
            granularity: 'month',
        }
    }

    // 9. Standard Presets (ytd, all, 7d, 30d, 90d, 12m)
    let start
    const key = RANGES[range] ? range : '30d'
    if (key === 'ytd') {
        start = new Date(Date.UTC(currentYear, 0, 1) - IST_OFFSET_MS)
    } else if (key === 'all') {
        start = istStartOfDay(firstOrderAt || new Date(endOfToday.getTime() - 30 * DAY_MS))
    } else {
        start = new Date(endOfToday.getTime() - (RANGES[key]?.days || 30) * DAY_MS)
    }
    return finishWindow(key, start, endOfToday)
}

const finishWindow = (key, start, end) => {
    const length = Math.max(DAY_MS, end.getTime() - start.getTime())
    const days = Math.round(length / DAY_MS)
    const granularity = days <= 1 ? 'hour' : days <= 45 ? 'day' : days <= 190 ? 'week' : 'month'
    return {
        key,
        label: RANGES[key]?.label || 'Custom range',
        start,
        end,
        prevStart: new Date(start.getTime() - length),
        prevEnd: start,
        days,
        granularity,
    }
}


// Every bucket key between start and end, so gaps chart as zero, not as
// missing points.
const HOUR_MS = 60 * 60 * 1000
const istHourKey = (date) => toIst(date).toISOString().slice(0, 13)

const bucketKeys = (start, end, granularity) => {
    const keys = []
    const seen = new Set()
    if (granularity === 'hour') {
        for (let t = start.getTime(); t < end.getTime(); t += HOUR_MS) keys.push(istHourKey(new Date(t)))
        return keys
    }
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
        const d = new Date(t)
        const key = granularity === 'day' ? istDayKey(d) : granularity === 'week' ? istWeekKey(d) : istMonthKey(d)
        if (!seen.has(key)) { seen.add(key); keys.push(key) }
    }
    return keys
}
const bucketOf = (date, granularity) =>
    granularity === 'hour' ? istHourKey(date) : granularity === 'day' ? istDayKey(date) : granularity === 'week' ? istWeekKey(date) : istMonthKey(date)

const customerKey = (order) => (order.user ? `u:${order.user}` : order.email ? `e:${String(order.email).toLowerCase().trim()}` : null)
const titleCase = (s) => String(s || '').trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

// Totals for one window of orders.
const summarise = (orders) => {
    let sales = 0, gross = 0, discounts = 0, units = 0, collected = 0, outstanding = 0, valid = 0, cancelled = 0
    const customers = new Set()
    for (const o of orders) {
        if (INVALID_STATUSES.has(o.status)) {
            if (o.status === 'cancelled') cancelled++
            continue
        }
        valid++
        sales += Number(o.totalAmount) || 0
        gross += Number(o.subtotal) || 0
        discounts += Number(o.couponDiscountAmount) || 0
        collected += Number(o.paidAmount) || 0
        outstanding += Number(o.remainingAmount) || 0
        for (const p of o.products || []) units += Number(p.qty) || 0
        const key = customerKey(o)
        if (key) customers.add(key)
    }
    return {
        placed: orders.length,
        orders: valid,
        cancelled,
        sales: round(sales),
        gross: round(gross),
        discounts: round(discounts),
        units,
        collected: round(collected),
        outstanding: round(outstanding),
        aov: valid ? round(sales / valid) : 0,
        unitsPerOrder: valid ? round(units / valid, 2) : 0,
        cancelRate: orders.length ? round((cancelled / orders.length) * 100, 1) : 0,
        customers: customers.size,
    }
}

export const getStoreAnalytics = async ({ range, from, to, year, month, date } = {}) => {
    await connectDB()

    // "All time" starts at the store's first activity: an order or a sign-up.
    const [firstOrder, firstUser] = await Promise.all([
        OrderModel.findOne({ deletedAt: null }).sort({ createdAt: 1 }).select('createdAt').lean(),
        UserModel.findOne({ deletedAt: null, role: 'user' }).sort({ createdAt: 1 }).select('createdAt').lean(),
    ])
    const firstActivity = [firstOrder?.createdAt, firstUser?.createdAt].filter(Boolean).map((d) => new Date(d)).sort((a, b) => a - b)[0]
    const win = resolveWindow({ range, from, to, year, month, date, firstOrderAt: firstActivity })
    const { start, end, prevStart, prevEnd, granularity } = win
    const now = new Date()

    const orderFields = 'user name email state city createdAt totalAmount subtotal couponDiscountAmount status paymentMethod paymentStatus paidAmount remainingAmount products.productId products.name products.qty products.sellingPrice shipment.shipmentStatus order_id'

    const [
        orders,
        prevOrders,
        newCustomers,
        prevNewCustomers,
        totalCustomers,
        signupDates,
        reviewsInRange,
        prevReviewCount,
        reviewDistribution,
        lowReviews,
        newsletterInRange,
        prevNewsletter,
        subscribedTotal,
        contactsInRange,
        unreadContacts,
        activeCoupons,
        pendingOrders,
        staleOrders,
        unverifiedOrders,
        outstandingAll,
        products,
    ] = await Promise.all([
        OrderModel.find({ deletedAt: null, createdAt: { $gte: start, $lt: end } }).select(orderFields).limit(MAX_ORDERS).lean(),
        OrderModel.find({ deletedAt: null, createdAt: { $gte: prevStart, $lt: prevEnd } })
            .select('user email status totalAmount subtotal couponDiscountAmount paidAmount remainingAmount products.qty createdAt').limit(MAX_ORDERS).lean(),
        UserModel.countDocuments({ deletedAt: null, role: 'user', createdAt: { $gte: start, $lt: end } }),
        UserModel.countDocuments({ deletedAt: null, role: 'user', createdAt: { $gte: prevStart, $lt: prevEnd } }),
        UserModel.countDocuments({ deletedAt: null, role: 'user' }),
        UserModel.find({ deletedAt: null, role: 'user', createdAt: { $gte: start, $lt: end } }).select('createdAt').lean(),
        ReviewModel.find({ deletedAt: null, createdAt: { $gte: start, $lt: end } }).select('rating').lean(),
        ReviewModel.countDocuments({ deletedAt: null, createdAt: { $gte: prevStart, $lt: prevEnd } }),
        ReviewModel.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
        ReviewModel.find({ deletedAt: null, rating: { $lte: 2 } }).sort({ createdAt: -1 }).limit(5)
            .populate({ path: 'product', select: 'name slug' }).select('rating title review createdAt product').lean(),
        NewsletterSubscriberModel.find({ deletedAt: null, createdAt: { $gte: start, $lt: end } }).select('source status').lean(),
        NewsletterSubscriberModel.countDocuments({ deletedAt: null, createdAt: { $gte: prevStart, $lt: prevEnd } }),
        NewsletterSubscriberModel.countDocuments({ deletedAt: null, status: 'subscribed' }),
        ContactModel.countDocuments({ deletedAt: null, createdAt: { $gte: start, $lt: end } }),
        ContactModel.countDocuments({ deletedAt: null, isRead: false }),
        CouponModel.countDocuments({ deletedAt: null, validity: { $gte: now } }),
        OrderModel.countDocuments({ deletedAt: null, status: 'pending' }),
        OrderModel.countDocuments({ deletedAt: null, status: { $in: ['pending', 'processing'] }, createdAt: { $lt: new Date(now.getTime() - 2 * DAY_MS) } }),
        OrderModel.countDocuments({ deletedAt: null, status: 'unverified' }),
        OrderModel.aggregate([
            { $match: { deletedAt: null, status: { $nin: [...INVALID_STATUSES] }, remainingAmount: { $gt: 0 } } },
            { $group: { _id: null, amount: { $sum: '$remainingAmount' }, count: { $sum: 1 } } },
        ]),
        ProductModel.find({ deletedAt: null }).select('name slug category media sellingPrice createdAt')
            .populate({ path: 'category', select: 'name slug' })
            .populate({ path: 'media', select: 'secure_url', options: { perDocumentLimit: 1 } })
            .lean(),
    ])

    const current = summarise(orders)
    const previous = summarise(prevOrders)
    const validOrders = orders.filter((o) => !INVALID_STATUSES.has(o.status))

    // ── Returning vs new customers ──
    const customerKeys = [...new Set(validOrders.map(customerKey).filter(Boolean))]
    const userIds = customerKeys.filter((k) => k.startsWith('u:')).map((k) => k.slice(2))
    const emails = customerKeys.filter((k) => k.startsWith('e:')).map((k) => k.slice(2))
    const priorBuyers = new Set()
    if (customerKeys.length) {
        const prior = await OrderModel.aggregate([
            {
                $match: {
                    deletedAt: null,
                    status: { $nin: [...INVALID_STATUSES] },
                    createdAt: { $lt: start },
                    $or: [
                        ...(userIds.length ? [{ user: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } }] : []),
                        ...(emails.length ? [{ email: { $in: emails } }] : []),
                    ],
                },
            },
            { $group: { _id: { user: '$user', email: { $toLower: '$email' } } } },
        ])
        for (const row of prior) {
            if (row._id.user) priorBuyers.add(`u:${row._id.user}`)
            if (row._id.email) priorBuyers.add(`e:${row._id.email}`)
        }
    }
    let returningCustomers = 0, returningSales = 0, newBuyerSales = 0
    const returningSet = new Set()
    for (const key of customerKeys) if (priorBuyers.has(key)) { returningCustomers++; returningSet.add(key) }
    for (const o of validOrders) {
        const amt = Number(o.totalAmount) || 0
        if (returningSet.has(customerKey(o))) returningSales += amt
        else newBuyerSales += amt
    }

    // ── Time series ──
    const keys = bucketKeys(start, end, granularity)
    const series = new Map(keys.map((k) => [k, { key: k, sales: 0, orders: 0, units: 0, customers: 0, signups: 0 }]))
    for (const o of validOrders) {
        const row = series.get(bucketOf(o.createdAt, granularity))
        if (!row) continue
        row.sales += Number(o.totalAmount) || 0
        row.orders += 1
        for (const p of o.products || []) row.units += Number(p.qty) || 0
    }
    for (const u of signupDates) {
        const row = series.get(bucketOf(u.createdAt, granularity))
        if (row) row.signups += 1
    }
    // Previous period, aligned bucket-by-bucket so the comparison line
    // overlays the same position in the period.
    const prevKeys = bucketKeys(prevStart, prevEnd, granularity)
    const prevSeries = new Map(prevKeys.map((k) => [k, 0]))
    for (const o of prevOrders) {
        if (INVALID_STATUSES.has(o.status)) continue
        const k = bucketOf(o.createdAt, granularity)
        if (prevSeries.has(k)) prevSeries.set(k, prevSeries.get(k) + (Number(o.totalAmount) || 0))
    }
    const prevValues = [...prevSeries.values()]
    const timeline = keys.map((k, i) => {
        const row = series.get(k)
        return {
            ...row,
            sales: round(row.sales),
            aov: row.orders ? round(row.sales / row.orders) : 0,
            previousSales: round(prevValues[i] ?? 0),
        }
    })

    // ── Status funnel, payments, shipments ──
    const statusCounts = {}
    const shipmentCounts = {}
    const paymentMethods = {}
    const paymentStatuses = {}
    for (const o of orders) {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
        const ship = o.shipment?.shipmentStatus || 'PENDING'
        shipmentCounts[ship] = (shipmentCounts[ship] || 0) + 1
        if (INVALID_STATUSES.has(o.status)) continue
        const m = o.paymentMethod || 'unknown'
        paymentMethods[m] ??= { orders: 0, sales: 0 }
        paymentMethods[m].orders++
        paymentMethods[m].sales += Number(o.totalAmount) || 0
        const ps = o.paymentStatus || 'unpaid'
        paymentStatuses[ps] ??= { orders: 0, amount: 0 }
        paymentStatuses[ps].orders++
        paymentStatuses[ps].amount += Number(o.totalAmount) || 0
    }

    // ── Weekday × hour heatmap (IST) ──
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const o of validOrders) {
        const ist = toIst(o.createdAt)
        heatmap[(ist.getUTCDay() + 6) % 7][ist.getUTCHours()]++
    }

    // ── Products & categories ──
    const productById = new Map(products.map((p) => [String(p._id), p]))
    const productStats = new Map()
    for (const o of validOrders) {
        for (const line of o.products || []) {
            const id = String(line.productId)
            const stat = productStats.get(id) || { id, name: line.name, units: 0, sales: 0, orders: 0 }
            stat.units += Number(line.qty) || 0
            stat.sales += (Number(line.qty) || 0) * (Number(line.sellingPrice) || 0)
            stat.orders += 1
            productStats.set(id, stat)
        }
    }
    const topProducts = [...productStats.values()]
        .sort((a, b) => b.sales - a.sales || b.units - a.units)
        .slice(0, 8)
        .map((s) => {
            const p = productById.get(s.id)
            return {
                ...s,
                sales: round(s.sales),
                name: formatProductName(p?.name || s.name),
                slug: p?.slug || null,
                categorySlug: p?.category?.slug || null,
                image: p?.media?.[0]?.secure_url || null,
                category: p?.category?.name ? formatCategoryName(p.category.name) : null,
                live: Boolean(p),
            }
        })

    const categoryStats = new Map()
    for (const s of productStats.values()) {
        const raw = productById.get(s.id)?.category?.name
        const name = raw ? formatCategoryName(raw) : 'Uncategorised'
        const c = categoryStats.get(name) || { name, sales: 0, units: 0 }
        c.sales += s.sales
        c.units += s.units
        categoryStats.set(name, c)
    }
    const categories = [...categoryStats.values()].sort((a, b) => b.sales - a.sales).map((c) => ({ ...c, sales: round(c.sales) }))

    // Catalogue health: live products with no sale in the range.
    const unsold = products.filter((p) => !productStats.has(String(p._id)))
    const catalogue = {
        total: products.length,
        sold: products.length - unsold.length,
        unsold: unsold.length,
        withoutImage: products.filter((p) => !p.media?.length).length,
        unsoldSample: unsold.slice(0, 6).map((p) => ({ id: String(p._id), name: formatProductName(p.name), slug: p.slug })),
    }

    // ── Geography ──
    const geo = new Map()
    for (const o of validOrders) {
        const state = titleCase(o.state) || 'Unknown'
        const g = geo.get(state) || { state, orders: 0, sales: 0, cities: new Map() }
        g.orders++
        g.sales += Number(o.totalAmount) || 0
        const city = titleCase(o.city) || 'Unknown'
        g.cities.set(city, (g.cities.get(city) || 0) + 1)
        geo.set(state, g)
    }
    const regions = [...geo.values()]
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 8)
        .map((g) => ({
            state: g.state,
            orders: g.orders,
            sales: round(g.sales),
            topCity: [...g.cities.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        }))

    // ── Top customers ──
    const buyers = new Map()
    for (const o of validOrders) {
        const key = customerKey(o)
        if (!key) continue
        const b = buyers.get(key) || { key, name: o.name, email: o.email, orders: 0, sales: 0, lastOrderAt: o.createdAt, returning: returningSet.has(key) }
        b.orders++
        b.sales += Number(o.totalAmount) || 0
        if (o.createdAt > b.lastOrderAt) b.lastOrderAt = o.createdAt
        buyers.set(key, b)
    }
    const topCustomers = [...buyers.values()].sort((a, b) => b.sales - a.sales).slice(0, 6).map((b) => ({ ...b, sales: round(b.sales) }))

    // ── Recent orders (for the activity feed) ──
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((o) => ({ order_id: o.order_id, name: o.name, totalAmount: o.totalAmount, status: o.status, createdAt: o.createdAt, items: (o.products || []).reduce((s, p) => s + (Number(p.qty) || 0), 0) }))

    // ── Reviews & audience ──
    const reviewAvg = reviewsInRange.length ? round(reviewsInRange.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewsInRange.length, 1) : 0
    const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviewDistribution.find((r) => r._id === stars)?.count || 0 }))
    const newsletterSources = {}
    for (const n of newsletterInRange) newsletterSources[n.source || 'unknown'] = (newsletterSources[n.source || 'unknown'] || 0) + 1

    const buyersCount = customerKeys.length
    const outstanding = outstandingAll[0] || { amount: 0, count: 0 }

    return {
        generatedAt: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        range: {
            key: win.key,
            label: win.label,
            start: win.start.toISOString(),
            end: win.end.toISOString(),
            previousStart: win.prevStart.toISOString(),
            previousEnd: win.prevEnd.toISOString(),
            days: win.days,
            granularity,
        },
        truncated: orders.length >= MAX_ORDERS,
        kpis: {
            sales: { value: current.sales, previous: previous.sales, change: pctChange(current.sales, previous.sales) },
            orders: { value: current.orders, previous: previous.orders, change: pctChange(current.orders, previous.orders) },
            aov: { value: current.aov, previous: previous.aov, change: pctChange(current.aov, previous.aov) },
            units: { value: current.units, previous: previous.units, change: pctChange(current.units, previous.units) },
            customers: { value: buyersCount, previous: previous.customers, change: pctChange(buyersCount, previous.customers) },
            newCustomers: { value: newCustomers, previous: prevNewCustomers, change: pctChange(newCustomers, prevNewCustomers) },
            returningRate: { value: buyersCount ? round((returningCustomers / buyersCount) * 100, 1) : 0 },
            cancelRate: { value: current.cancelRate, previous: previous.cancelRate, change: pctChange(current.cancelRate, previous.cancelRate) },
            discounts: { value: current.discounts, previous: previous.discounts, change: pctChange(current.discounts, previous.discounts) },
            collected: { value: current.collected, previous: previous.collected, change: pctChange(current.collected, previous.collected) },
            outstanding: { value: current.outstanding },
            reviews: { value: reviewsInRange.length, previous: prevReviewCount, change: pctChange(reviewsInRange.length, prevReviewCount), avg: reviewAvg },
            signups: { value: newsletterInRange.length, previous: prevNewsletter, change: pctChange(newsletterInRange.length, prevNewsletter) },
            unitsPerOrder: { value: current.unitsPerOrder },
        },
        breakdown: {
            gross: current.gross,
            discounts: current.discounts,
            sales: current.sales,
            collected: current.collected,
            outstanding: current.outstanding,
            placed: current.placed,
            cancelled: current.cancelled,
        },
        timeline,
        statusCounts,
        shipmentCounts,
        paymentMethods: Object.entries(paymentMethods).map(([method, v]) => ({ method, orders: v.orders, sales: round(v.sales) })),
        paymentStatuses: Object.entries(paymentStatuses).map(([status, v]) => ({ status, orders: v.orders, amount: round(v.amount) })),
        heatmap,
        topProducts,
        categories,
        catalogue,
        regions,
        topCustomers,
        recentOrders,
        customerMix: {
            newCustomers: buyersCount - returningCustomers,
            returningCustomers,
            newSales: round(newBuyerSales),
            returningSales: round(returningSales),
        },
        reviews: { distribution, avgInRange: reviewAvg, lowRated: lowReviews.map((r) => ({ id: String(r._id), rating: r.rating, title: r.title, review: r.review, createdAt: r.createdAt, product: r.product?.name ? formatProductName(r.product.name) : 'Deleted product', slug: r.product?.slug || null })) },
        audience: { totalCustomers, subscribers: subscribedTotal, newsletterSources, contacts: contactsInRange },
        actions: {
            pendingOrders,
            staleOrders,
            unverifiedOrders,
            unreadContacts,
            outstandingAmount: round(outstanding.amount),
            outstandingOrders: outstanding.count,
            lowRatedReviews: lowReviews.length,
            activeCoupons,
            productsWithoutImage: catalogue.withoutImage,
        },
    }
}
