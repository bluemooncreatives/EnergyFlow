import fs from 'node:fs'
import path from 'node:path'
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import { FiPhone, FiMail, FiMapPin, FiCalendar, FiHash, FiCreditCard, FiTruck, FiFileText, FiCheckCircle, FiUser, FiGift } from 'react-icons/fi'
import PdfIcon from '@/lib/pdf/PdfIcon'

/**
 * Vector PDF invoice built with @react-pdf/renderer primitives and rendered on
 * the server by /api/order-invoice/[orderid].
 *
 * Styled after the storefront design system (app/design-system.css): pine /
 * forest / sunflower / cream palette, Clash Display for headings and amounts,
 * Archivo for body copy. Archivo's Latin subset has no Rupee glyph, so every
 * amount is set in Clash Display, which does.
 */

// ── Fonts ─────────────────────────────────────────────────────────────────
// react-pdf's fontkit can't read woff2 and can't pick a variable-font axis,
// so public/assets/invoice holds TTF copies of Clash Display and static
// 400/600 instances of the Archivo variable font.
const asset = (...parts) => path.join(process.cwd(), 'public', 'assets', ...parts)

Font.register({
    family: 'Clash Display',
    fonts: [
        { src: asset('invoice', 'ClashDisplay-Medium.ttf'), fontWeight: 500 },
        { src: asset('invoice', 'ClashDisplay-Semibold.ttf'), fontWeight: 600 },
    ],
})
Font.register({
    family: 'Archivo',
    fonts: [
        { src: asset('invoice', 'Archivo-Regular.ttf'), fontWeight: 400 },
        { src: asset('invoice', 'Archivo-SemiBold.ttf'), fontWeight: 600 },
    ],
})
// Keep words whole — automatic hyphenation splits names and order ids.
Font.registerHyphenationCallback((word) => [word])

// Read as a Buffer: react-pdf mistakes Windows drive paths (C:\…) for URLs.
const LOGO = fs.readFileSync(asset('invoice', 'logo-green.png'))

const BRAND = {
    name: 'Energyflow',
    tagline: 'Fuel your health, energize your life.',
    email: 'energyflow0001@gmail.com',
    phone: '+91 92896 57742',
    address: 'Rangpuri, Mahipalpur, New Delhi 110037',
}

// Mirrors the --palette-* / semantic tokens in app/design-system.css.
const C = {
    pine: '#0B3D2E',
    pineDeep: '#072A20',
    forest: '#2F6B3F',
    sun: '#F2C94C',
    sunSoft: '#FBEDC4',
    cream: '#F7F3E8',
    card: '#FDFBF6',
    well: '#EFEADC',
    secondary: '#E6ECDD',
    border: '#E3DDCB',
    ink: '#0A2F24',
    body: '#34453C',
    muted: '#5A6A5F',
    olive: '#6B5C27',
    danger: '#B3261E',
}

const money = (n) =>
    Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS = {
    pending: { label: 'Order Placed', bg: C.sunSoft, fg: C.olive },
    processing: { label: 'Processing', bg: C.sunSoft, fg: C.olive },
    shipped: { label: 'Shipped', bg: C.secondary, fg: C.forest },
    delivered: { label: 'Delivered', bg: C.secondary, fg: C.forest },
    cancelled: { label: 'Cancelled', bg: '#F6DEDC', fg: C.danger },
    unverified: { label: 'Payment Unverified', bg: '#F6DEDC', fg: C.danger },
}
const PAYMENT_METHOD_LABEL = { cod: 'Cash on Delivery', full: 'Paid Online', partial: 'Partial Payment' }
const PAYMENT_STATUS_LABEL = { unpaid: 'Unpaid', partial_paid: 'Partially Paid', fully_paid: 'Fully Paid' }

const s = StyleSheet.create({
    page: { paddingTop: 0, paddingBottom: 72, paddingHorizontal: 0, fontFamily: 'Archivo', fontSize: 9, color: C.body, lineHeight: 1.45, backgroundColor: '#FFFFFF' },
    body: { paddingHorizontal: 40 },

    // Header — cream band with the green mark, sunflower rule underneath
    head: { backgroundColor: C.cream, paddingHorizontal: 40, paddingTop: 24, paddingBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    brandRow: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 40, height: 40, marginRight: 10 },
    brandName: { fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: C.pine, letterSpacing: 0.6, textTransform: 'uppercase', lineHeight: 1 },
    brandTag: { fontSize: 8, color: C.muted, marginTop: 4 },
    contact: { marginTop: 10 },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    contactIcon: { marginRight: 5 },
    contactText: { fontSize: 7.5, color: C.muted },
    titleWrap: { alignItems: 'flex-end' },
    eyebrow: { fontSize: 6.5, fontWeight: 600, color: C.forest, letterSpacing: 1.6, textTransform: 'uppercase' },
    title: { fontFamily: 'Clash Display', fontWeight: 600, fontSize: 28, color: C.pine, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1, marginTop: 4 },
    orderId: { fontFamily: 'Clash Display', fontWeight: 500, fontSize: 10, color: C.ink, marginTop: 6 },
    pill: { marginTop: 8, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10, fontSize: 6.5, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' },
    rule: { height: 4, backgroundColor: C.sun },

    // Billing + order details cards
    cards: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
    card: { width: '48.5%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12 },
    cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border },
    cardTitle: { fontSize: 6.5, fontWeight: 600, color: C.forest, letterSpacing: 1.4, textTransform: 'uppercase', marginLeft: 5 },
    name: { fontFamily: 'Clash Display', fontWeight: 600, fontSize: 12, color: C.ink, marginBottom: 3 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
    infoIcon: { marginRight: 6, marginTop: 1.5 },
    infoText: { fontSize: 8.5, color: C.body, flex: 1 },
    kvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    kvLabelWrap: { flexDirection: 'row', alignItems: 'center' },
    kvLabel: { fontSize: 8, color: C.muted, marginLeft: 6 },
    kvValue: { fontSize: 8.5, fontWeight: 600, color: C.ink, textAlign: 'right', maxWidth: '60%' },

    // Items table
    table: { marginTop: 18, borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: 'hidden' },
    thead: { flexDirection: 'row', backgroundColor: C.pine, paddingVertical: 8, paddingHorizontal: 12 },
    th: { fontSize: 6.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.1, color: C.cream },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: C.border },
    rowAlt: { backgroundColor: C.card },
    cNum: { width: '6%' },
    cProd: { width: '46%', paddingRight: 8 },
    cPrice: { width: '18%', textAlign: 'right' },
    cQty: { width: '10%', textAlign: 'center' },
    cTotal: { width: '20%', textAlign: 'right' },
    num: { fontSize: 8, color: C.muted },
    pName: { fontSize: 9.5, fontWeight: 600, color: C.ink },
    pVariant: { alignSelf: 'flex-start', marginTop: 3, paddingVertical: 1.5, paddingHorizontal: 6, borderRadius: 6, backgroundColor: C.well, fontSize: 6.5, fontWeight: 600, color: C.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
    amount: { fontFamily: 'Clash Display', fontWeight: 500, fontSize: 9.5, color: C.ink },
    amountStrong: { fontFamily: 'Clash Display', fontWeight: 600, fontSize: 10, color: C.ink },
    strike: { fontFamily: 'Clash Display', fontWeight: 500, fontSize: 7, color: C.muted, textDecoration: 'line-through', marginTop: 1 },
    qty: { fontSize: 9, fontWeight: 600, color: C.ink },
    empty: { width: '100%', textAlign: 'center', color: C.muted },

    // Notes + totals
    lower: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    notes: { width: '50%' },
    label: { fontSize: 6.5, fontWeight: 600, color: C.forest, letterSpacing: 1.4, textTransform: 'uppercase', marginLeft: 5 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    noteBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 8.5, color: C.body, marginBottom: 10 },
    shipBox: { backgroundColor: C.secondary, borderRadius: 8, padding: 9, marginBottom: 10 },
    shipText: { fontSize: 8.5, color: C.ink },

    totals: { width: '44%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: 'hidden' },
    totalsInner: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
    sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3.5 },
    sumLabel: { fontSize: 8.5, color: C.muted },
    sumGreen: { fontFamily: 'Clash Display', fontWeight: 500, fontSize: 9.5, color: C.forest },
    free: { fontSize: 8, fontWeight: 600, color: C.forest, letterSpacing: 0.8, textTransform: 'uppercase' },
    grand: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.pine, paddingVertical: 10, paddingHorizontal: 12 },
    grandLabel: { fontSize: 7.5, fontWeight: 600, color: C.cream, letterSpacing: 1.4, textTransform: 'uppercase' },
    grandVal: { fontFamily: 'Clash Display', fontWeight: 600, fontSize: 15, color: C.sun },
    saved: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.sun, paddingVertical: 6, paddingHorizontal: 10 },
    savedText: { fontSize: 8, fontWeight: 600, color: C.pine, marginLeft: 5 },
    savedAmount: { fontFamily: 'Clash Display', fontWeight: 600 },
    payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: C.border },

    // Footer — pine band pinned to every page
    foot: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, backgroundColor: C.pine, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    thanks: { fontFamily: 'Clash Display', fontWeight: 600, fontSize: 11, color: C.sun, letterSpacing: 0.3 },
    footSmall: { fontSize: 6.5, color: C.cream, opacity: 0.8, marginTop: 3 },
    pageNum: { fontSize: 6.5, color: C.cream, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' },
})

const InfoRow = ({ icon, children }) => (
    <View style={s.infoRow}>
        <PdfIcon icon={icon} size={8} color={C.forest} style={s.infoIcon} />
        <Text style={s.infoText}>{children}</Text>
    </View>
)

const KeyValue = ({ icon, label, value }) => (
    <View style={s.kvRow}>
        <View style={s.kvLabelWrap}>
            <PdfIcon icon={icon} size={8} color={C.forest} />
            <Text style={s.kvLabel}>{label}</Text>
        </View>
        <Text style={s.kvValue}>{value}</Text>
    </View>
)

const SectionLabel = ({ icon, children }) => (
    <View style={s.labelRow}>
        <PdfIcon icon={icon} size={8} color={C.forest} />
        <Text style={s.label}>{children}</Text>
    </View>
)

const InvoiceDocument = ({ order = {} }) => {
    const products = Array.isArray(order?.products) ? order.products : []
    const itemCount = products.reduce((sum, p) => sum + (p?.qty || 0), 0)
    const mrpTotal = products.reduce((sum, p) => sum + ((p?.mrp || p?.sellingPrice || 0) * (p?.qty || 0)), 0)
    const mrpSavings = Math.max(0, mrpTotal - (order?.subtotal || 0))
    const totalSavings = mrpSavings + (order?.couponDiscountAmount || 0)
    const paymentMethod = order?.paymentMethod || 'full'
    const status = STATUS[order?.status] || STATUS.pending
    const shipment = order?.shipment || {}

    const addressLine = [order?.address, order?.landmark, order?.city, order?.state, order?.country, order?.pincode]
        .filter(Boolean).join(', ')

    return (
        <Document title={`Invoice ${order?.order_id || ''}`} author={BRAND.name} subject="Order invoice" creator={BRAND.name}>
            <Page size="A4" style={s.page}>

                {/* Header */}
                <View style={s.head}>
                    <View>
                        <View style={s.brandRow}>
                            <Image src={LOGO} style={s.logo} />
                            <View>
                                <Text style={s.brandName}>{BRAND.name}</Text>
                                <Text style={s.brandTag}>{BRAND.tagline}</Text>
                            </View>
                        </View>
                        <View style={s.contact}>
                            <View style={s.contactRow}>
                                <PdfIcon icon={FiMapPin} size={7.5} color={C.forest} style={s.contactIcon} />
                                <Text style={s.contactText}>{BRAND.address}</Text>
                            </View>
                            <View style={s.contactRow}>
                                <PdfIcon icon={FiPhone} size={7.5} color={C.forest} style={s.contactIcon} />
                                <Text style={s.contactText}>{BRAND.phone}</Text>
                            </View>
                            <View style={s.contactRow}>
                                <PdfIcon icon={FiMail} size={7.5} color={C.forest} style={s.contactIcon} />
                                <Text style={s.contactText}>{BRAND.email}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={s.titleWrap}>
                        <Text style={s.eyebrow}>Tax invoice</Text>
                        <Text style={s.title}>Invoice</Text>
                        <Text style={s.orderId}>#{order?.order_id || '—'}</Text>
                        <Text style={[s.pill, { backgroundColor: status.bg, color: status.fg }]}>{status.label}</Text>
                    </View>
                </View>
                <View style={s.rule} />

                <View style={s.body}>
                    {/* Billed to / order details */}
                    <View style={s.cards}>
                        <View style={s.card}>
                            <View style={s.cardHead}>
                                <PdfIcon icon={FiUser} size={8} color={C.forest} />
                                <Text style={s.cardTitle}>Billed to</Text>
                            </View>
                            <Text style={s.name}>{order?.name || '—'}</Text>
                            {!!addressLine && <InfoRow icon={FiMapPin}>{addressLine}</InfoRow>}
                            <InfoRow icon={FiPhone}>{order?.phone || '—'}</InfoRow>
                            <InfoRow icon={FiMail}>{order?.email || '—'}</InfoRow>
                        </View>
                        <View style={s.card}>
                            <View style={s.cardHead}>
                                <PdfIcon icon={FiFileText} size={8} color={C.forest} />
                                <Text style={s.cardTitle}>Order details</Text>
                            </View>
                            <KeyValue icon={FiHash} label="Order ID" value={order?.order_id || '—'} />
                            <KeyValue icon={FiCalendar} label="Date" value={formatDate(order?.createdAt)} />
                            <KeyValue icon={FiCreditCard} label="Payment" value={PAYMENT_METHOD_LABEL[paymentMethod] || 'Online'} />
                            <KeyValue icon={FiCheckCircle} label="Status" value={PAYMENT_STATUS_LABEL[order?.paymentStatus] || 'Unpaid'} />
                            {!!order?.payment_id && <KeyValue icon={FiHash} label="Txn ID" value={order.payment_id} />}
                        </View>
                    </View>

                    {/* Items */}
                    <View style={s.table}>
                        <View style={s.thead} fixed>
                            <Text style={[s.th, s.cNum]}>#</Text>
                            <Text style={[s.th, s.cProd]}>Product</Text>
                            <Text style={[s.th, s.cPrice]}>Price</Text>
                            <Text style={[s.th, s.cQty]}>Qty</Text>
                            <Text style={[s.th, s.cTotal]}>Total</Text>
                        </View>

                        {products.length === 0 ? (
                            <View style={s.row}><Text style={s.empty}>No items found.</Text></View>
                        ) : products.map((p, i) => {
                            const name = p?.productId?.name || p?.name || 'Product'
                            const variant = p?.variantId?.size || ''
                            const price = p?.sellingPrice || 0
                            const qty = p?.qty || 0
                            const lineTotal = price * qty
                            const hasMarkdown = (p?.mrp || 0) > price
                            return (
                                <View style={[s.row, i % 2 === 1 ? s.rowAlt : null]} key={p?.variantId?._id || p?._id || i} wrap={false}>
                                    <Text style={[s.num, s.cNum]}>{String(i + 1).padStart(2, '0')}</Text>
                                    <View style={s.cProd}>
                                        <Text style={s.pName}>{name}</Text>
                                        {!!variant && <Text style={s.pVariant}>{variant}</Text>}
                                    </View>
                                    <View style={s.cPrice}>
                                        <Text style={s.amount}>{money(price)}</Text>
                                        {hasMarkdown && <Text style={s.strike}>{money(p.mrp)}</Text>}
                                    </View>
                                    <Text style={[s.qty, s.cQty]}>{qty}</Text>
                                    <Text style={[s.amountStrong, s.cTotal]}>{money(lineTotal)}</Text>
                                </View>
                            )
                        })}
                    </View>

                    {/* Notes + totals */}
                    <View style={s.lower} wrap={false}>
                        <View style={s.notes}>
                            {!!order?.ordernote && (
                                <View>
                                    <SectionLabel icon={FiFileText}>Order note</SectionLabel>
                                    <Text style={s.noteBox}>{order.ordernote}</Text>
                                </View>
                            )}
                            {!!shipment?.awb && (
                                <View>
                                    <SectionLabel icon={FiTruck}>Shipment</SectionLabel>
                                    <View style={s.shipBox}>
                                        <Text style={s.shipText}>{shipment.courier || 'Courier'} · AWB {shipment.awb}</Text>
                                    </View>
                                </View>
                            )}
                            <SectionLabel icon={FiGift}>Summary</SectionLabel>
                            <Text style={s.noteBox}>
                                {itemCount} {itemCount === 1 ? 'item' : 'items'} across {products.length} {products.length === 1 ? 'product' : 'products'}. Shipping is on us.
                            </Text>
                        </View>

                        <View style={s.totals}>
                            <View style={s.totalsInner}>
                                <View style={s.sumRow}>
                                    <Text style={s.sumLabel}>{mrpSavings > 0 ? 'Total MRP' : 'Subtotal'}</Text>
                                    <Text style={s.amount}>{money(mrpSavings > 0 ? mrpTotal : order?.subtotal)}</Text>
                                </View>
                                {mrpSavings > 0 && (
                                    <View style={s.sumRow}>
                                        <Text style={s.sumLabel}>Discount on MRP</Text>
                                        <Text style={s.sumGreen}>− {money(mrpSavings)}</Text>
                                    </View>
                                )}
                                {order?.couponDiscountAmount > 0 && (
                                    <View style={s.sumRow}>
                                        <Text style={s.sumLabel}>Coupon discount</Text>
                                        <Text style={s.sumGreen}>− {money(order.couponDiscountAmount)}</Text>
                                    </View>
                                )}
                                <View style={s.sumRow}>
                                    <Text style={s.sumLabel}>Shipping</Text>
                                    <Text style={s.free}>Free</Text>
                                </View>
                            </View>

                            <View style={s.grand}>
                                <Text style={s.grandLabel}>Grand total</Text>
                                <Text style={s.grandVal}>{money(order?.totalAmount)}</Text>
                            </View>

                            {order?.paidAmount > 0 && (
                                <View style={s.payRow}>
                                    <Text style={s.sumLabel}>Amount paid</Text>
                                    <Text style={s.amountStrong}>{money(order.paidAmount)}</Text>
                                </View>
                            )}
                            {order?.remainingAmount > 0 && (
                                <View style={s.payRow}>
                                    <Text style={s.sumLabel}>{paymentMethod === 'cod' ? 'Pay on delivery' : 'Remaining'}</Text>
                                    <Text style={s.amountStrong}>{money(order.remainingAmount)}</Text>
                                </View>
                            )}

                            {totalSavings > 0 && (
                                <View style={s.saved}>
                                    <PdfIcon icon={FiGift} size={8} color={C.pine} />
                                    <Text style={s.savedText}>
                                        You saved <Text style={s.savedAmount}>{money(totalSavings)}</Text> on this order
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={s.foot} fixed>
                    <View>
                        <Text style={s.thanks}>Thank you for shopping with {BRAND.name}</Text>
                        <Text style={s.footSmall}>Computer-generated invoice — no signature required. Questions? {BRAND.email}</Text>
                    </View>
                    <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
                </View>

            </Page>
        </Document>
    )
}

export default InvoiceDocument
