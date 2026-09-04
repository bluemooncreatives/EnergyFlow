import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

/**
 * Vector PDF invoice built with @react-pdf/renderer primitives.
 * Generated client-side and streamed straight to the user as a download.
 *
 * Note: the built-in Helvetica font has no Rupee (₹) glyph, so amounts are
 * formatted with an "Rs." prefix to render reliably without a custom font.
 */

const BRAND = {
    name: 'ENERGYFLOW',
    tagline: 'Fashion, stitched with love',
    email: 'support@energyflow.com',
    web: 'www.energyflow.com',
}

const OX = '#3E000D'
const CREAM = '#FFECD1'
const INK = '#1A1A1A'
const MUTE = '#8a8a8a'
const GREEN = '#15803d'

const money = (n) =>
    'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (d) => {
    if (!d) return '—'
    try {
        return new Date(d).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    } catch {
        return '—'
    }
}

const STATUS_LABEL = {
    pending: 'Order Placed', processing: 'Processing', shipped: 'Shipped',
    delivered: 'Delivered', cancelled: 'Cancelled', unverified: 'Payment Unverified',
}
const PAYMENT_METHOD_LABEL = { cod: 'Cash on Delivery', full: 'Paid Online', partial: 'Partial Payment' }
const PAYMENT_STATUS_LABEL = { unpaid: 'Unpaid', partial_paid: 'Partially Paid', fully_paid: 'Fully Paid' }

const s = StyleSheet.create({
    page: { paddingVertical: 40, paddingHorizontal: 44, fontFamily: 'Helvetica', fontSize: 9, color: INK, lineHeight: 1.5 },

    // header
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: OX, paddingBottom: 14 },
    brandName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: OX, letterSpacing: 1 },
    brandTag: { fontSize: 7.5, color: MUTE, marginTop: 2, letterSpacing: 0.5 },
    brandMeta: { fontSize: 7.5, color: '#6a6a6a', marginTop: 6 },
    invTitleWrap: { alignItems: 'flex-end' },
    invTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: INK, letterSpacing: 3 },
    badge: { marginTop: 6, backgroundColor: CREAM, color: OX, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },

    // meta
    meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
    metaBlock: { width: '48%' },
    metaRight: { alignItems: 'flex-end' },
    label: { fontSize: 6.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#9a9a9a', fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    strong: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: INK },
    line: { fontSize: 8.5, color: '#555', marginTop: 2 },
    kv: { fontSize: 8.5, color: '#555', marginTop: 2 },
    kvb: { fontFamily: 'Helvetica-Bold', color: INK },

    // items table
    table: { marginTop: 22 },
    thead: { flexDirection: 'row', backgroundColor: OX, color: '#fff', paddingVertical: 7, paddingHorizontal: 8 },
    th: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8, color: '#fff' },
    row: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#ececec' },
    cNum: { width: '7%', color: '#9a9a9a' },
    cProd: { width: '45%' },
    cPrice: { width: '18%', textAlign: 'right' },
    cQty: { width: '10%', textAlign: 'center' },
    cTotal: { width: '20%', textAlign: 'right' },
    pName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: INK },
    pVariant: { fontSize: 7, color: MUTE, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    strike: { fontSize: 7, color: '#aaa', textDecoration: 'line-through', marginTop: 1 },
    totalCell: { fontFamily: 'Helvetica-Bold' },

    // lower
    lower: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    notes: { width: '52%' },
    noteBox: { borderWidth: 1, borderColor: '#ececec', backgroundColor: '#fafafa', borderRadius: 4, padding: 9, fontSize: 8.5, color: '#555', marginTop: 4 },
    totals: { width: '42%' },
    sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    sumLabel: { fontSize: 9, color: '#888' },
    sumVal: { fontSize: 9, color: INK },
    sumGreen: { color: GREEN, fontFamily: 'Helvetica-Bold' },
    grand: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: INK, marginTop: 6, paddingTop: 8 },
    grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: INK },
    grandVal: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: INK },
    saved: { marginTop: 8, backgroundColor: '#e9f7ef', color: GREEN, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 9, fontSize: 8.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    payBox: { marginTop: 12, borderWidth: 1, borderColor: '#ececec', borderRadius: 4 },
    payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 10 },
    payRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    payLabel: { fontSize: 8.5, color: '#888' },
    payVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK },

    // footer
    foot: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#ececec', paddingTop: 14, alignItems: 'center' },
    thanks: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: OX },
    footSmall: { fontSize: 7.5, color: '#9a9a9a', marginTop: 5, textAlign: 'center', lineHeight: 1.6 },
})

const InvoiceDocument = ({ order = {} }) => {
    const products = Array.isArray(order?.products) ? order.products : []
    const itemCount = products.reduce((sum, p) => sum + (p?.qty || 0), 0)
    const mrpTotal = products.reduce((sum, p) => sum + ((p?.mrp || p?.sellingPrice || 0) * (p?.qty || 0)), 0)
    const mrpSavings = Math.max(0, mrpTotal - (order?.subtotal || 0))
    const totalSavings = mrpSavings + (order?.couponDiscountAmount || 0)
    const paymentMethod = order?.paymentMethod || 'full'

    const addressLine = [order?.address, order?.landmark, order?.city, order?.state, order?.country, order?.pincode]
        .filter(Boolean).join(', ')

    return (
        <Document title={`Invoice ${order?.order_id || ''}`} author={BRAND.name}>
            <Page size="A4" style={s.page}>

                {/* Header */}
                <View style={s.head}>
                    <View>
                        <Text style={s.brandName}>{BRAND.name}</Text>
                        <Text style={s.brandTag}>{BRAND.tagline}</Text>
                        <Text style={s.brandMeta}>{BRAND.web}   ·   {BRAND.email}</Text>
                    </View>
                    <View style={s.invTitleWrap}>
                        <Text style={s.invTitle}>INVOICE</Text>
                        <Text style={s.badge}>{STATUS_LABEL[order?.status] || 'Order Placed'}</Text>
                    </View>
                </View>

                {/* Meta */}
                <View style={s.meta}>
                    <View style={s.metaBlock}>
                        <Text style={s.label}>Billed To</Text>
                        <Text style={s.strong}>{order?.name || '—'}</Text>
                        {!!addressLine && <Text style={s.line}>{addressLine}</Text>}
                        <Text style={s.kv}><Text style={s.kvb}>Phone: </Text>{order?.phone || '—'}</Text>
                        <Text style={s.kv}><Text style={s.kvb}>Email: </Text>{order?.email || '—'}</Text>
                    </View>
                    <View style={[s.metaBlock, s.metaRight]}>
                        <Text style={s.label}>Invoice Details</Text>
                        <Text style={s.kv}><Text style={s.kvb}>Order ID: </Text>{order?.order_id || '—'}</Text>
                        <Text style={s.kv}><Text style={s.kvb}>Date: </Text>{formatDate(order?.createdAt)}</Text>
                        <Text style={s.kv}><Text style={s.kvb}>Payment: </Text>{PAYMENT_METHOD_LABEL[paymentMethod] || 'Online'}</Text>
                        <Text style={s.kv}><Text style={s.kvb}>Payment Status: </Text>{PAYMENT_STATUS_LABEL[order?.paymentStatus] || 'Unpaid'}</Text>
                        {!!order?.payment_id && <Text style={s.kv}><Text style={s.kvb}>Txn ID: </Text>{order.payment_id}</Text>}
                    </View>
                </View>

                {/* Items */}
                <View style={s.table}>
                    <View style={s.thead}>
                        <Text style={[s.th, s.cNum]}>#</Text>
                        <Text style={[s.th, s.cProd]}>Product</Text>
                        <Text style={[s.th, s.cPrice]}>Price</Text>
                        <Text style={[s.th, s.cQty]}>Qty</Text>
                        <Text style={[s.th, s.cTotal]}>Total</Text>
                    </View>

                    {products.length === 0 ? (
                        <View style={s.row}><Text style={{ width: '100%', textAlign: 'center', color: '#999' }}>No items found.</Text></View>
                    ) : products.map((p, i) => {
                        const name = p?.productId?.name || p?.name || 'Product'
                        const variant = [p?.variantId?.size, p?.variantId?.color].filter(Boolean).join(' / ')
                        const price = p?.sellingPrice || 0
                        const qty = p?.qty || 0
                        const lineTotal = price * qty
                        const lineMrp = (p?.mrp || price) * qty
                        return (
                            <View style={s.row} key={p?.variantId?._id || p?._id || i} wrap={false}>
                                <Text style={s.cNum}>{i + 1}</Text>
                                <View style={s.cProd}>
                                    <Text style={s.pName}>{name}</Text>
                                    {!!variant && <Text style={s.pVariant}>{variant}</Text>}
                                </View>
                                <View style={s.cPrice}>
                                    <Text>{money(price)}</Text>
                                    {lineMrp > lineTotal && <Text style={s.strike}>{money(p?.mrp)}</Text>}
                                </View>
                                <Text style={s.cQty}>{qty}</Text>
                                <Text style={[s.cTotal, s.totalCell]}>{money(lineTotal)}</Text>
                            </View>
                        )
                    })}
                </View>

                {/* Lower */}
                <View style={s.lower}>
                    <View style={s.notes}>
                        {!!order?.ordernote && (
                            <View>
                                <Text style={s.label}>Order Note</Text>
                                <Text style={s.noteBox}>{order.ordernote}</Text>
                            </View>
                        )}
                        <Text style={[s.label, { marginTop: 14 }]}>Summary</Text>
                        <Text style={s.noteBox}>{itemCount} {itemCount === 1 ? 'item' : 'items'} in this order.</Text>
                    </View>

                    <View style={s.totals}>
                        <View style={s.sumRow}>
                            <Text style={s.sumLabel}>{mrpSavings > 0 ? 'Total MRP' : 'Subtotal'}</Text>
                            <Text style={s.sumVal}>{money(mrpSavings > 0 ? mrpTotal : order?.subtotal)}</Text>
                        </View>
                        {mrpSavings > 0 && (
                            <View style={s.sumRow}>
                                <Text style={s.sumLabel}>Discount on MRP</Text>
                                <Text style={[s.sumVal, s.sumGreen]}>- {money(mrpSavings)}</Text>
                            </View>
                        )}
                        {order?.couponDiscountAmount > 0 && (
                            <View style={s.sumRow}>
                                <Text style={s.sumLabel}>Coupon Discount</Text>
                                <Text style={[s.sumVal, s.sumGreen]}>- {money(order.couponDiscountAmount)}</Text>
                            </View>
                        )}
                        <View style={s.sumRow}>
                            <Text style={s.sumLabel}>Shipping</Text>
                            <Text style={[s.sumVal, s.sumGreen]}>FREE</Text>
                        </View>
                        <View style={s.grand}>
                            <Text style={s.grandLabel}>Total</Text>
                            <Text style={s.grandVal}>{money(order?.totalAmount)}</Text>
                        </View>

                        {totalSavings > 0 && (
                            <Text style={s.saved}>You saved {money(totalSavings)} on this order</Text>
                        )}

                        {(order?.paidAmount > 0 || order?.remainingAmount > 0) && (
                            <View style={s.payBox}>
                                {order?.paidAmount > 0 && (
                                    <View style={[s.payRow, order?.remainingAmount > 0 ? s.payRowBorder : null]}>
                                        <Text style={s.payLabel}>Amount Paid</Text>
                                        <Text style={s.payVal}>{money(order.paidAmount)}</Text>
                                    </View>
                                )}
                                {order?.remainingAmount > 0 && (
                                    <View style={s.payRow}>
                                        <Text style={s.payLabel}>{paymentMethod === 'cod' ? 'Pay on Delivery' : 'Remaining'}</Text>
                                        <Text style={s.payVal}>{money(order.remainingAmount)}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View style={s.foot}>
                    <Text style={s.thanks}>Thank you for shopping with {BRAND.name}!</Text>
                    <Text style={s.footSmall}>
                        This is a computer-generated invoice and does not require a signature.{'\n'}
                        For any queries about your order, contact us at {BRAND.email}.
                    </Text>
                </View>

            </Page>
        </Document>
    )
}

export default InvoiceDocument
