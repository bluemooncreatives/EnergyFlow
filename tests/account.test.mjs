import test from 'node:test'
import assert from 'node:assert/strict'
import {
    addressLines,
    filterOrders,
    firstName,
    formatCurrency,
    formatDate,
    greetingFor,
    initials,
    orderItemCount,
    orderProductSummary,
    orderThumbnails,
    paginate,
    profileCompletion,
    statusGroupOf,
    summarizeOrders,
} from '../lib/account.js'

const img = (url) => ({ variantId: { media: [{ secure_url: url }] } })

test('statuses fall into customer-facing groups; unknown reads as active', () => {
    assert.equal(statusGroupOf('pending'), 'active')
    assert.equal(statusGroupOf('shipped'), 'active')
    assert.equal(statusGroupOf('DELIVERED'), 'delivered')
    assert.equal(statusGroupOf('unverified'), 'cancelled')
    assert.equal(statusGroupOf('something-new'), 'active')
    assert.equal(statusGroupOf(undefined), 'active')
})

test('summary counts groups and excludes cancelled / unverified from spend', () => {
    const summary = summarizeOrders([
        { status: 'pending', totalAmount: 100 },
        { status: 'delivered', totalAmount: 250.5 },
        { status: 'cancelled', totalAmount: 999 },
        { status: 'unverified', totalAmount: 50 },
        { status: 'shipped', totalAmount: 'not-a-number' },
        null,
    ])
    assert.deepEqual(summary, { total: 6, active: 3, delivered: 1, cancelled: 2, totalSpent: 350.5 })
    assert.deepEqual(summarizeOrders(undefined), { total: 0, active: 0, delivered: 0, cancelled: 0, totalSpent: 0 })
})

test('item count sums quantities and falls back to line count', () => {
    assert.equal(orderItemCount({ products: [{ qty: 2 }, { qty: 3 }] }), 5)
    assert.equal(orderItemCount({ products: [{}, {}] }), 2)
    assert.equal(orderItemCount({ products: [{ qty: -4 }] }), 1)
    assert.equal(orderItemCount({}), 0)
    assert.equal(orderItemCount(null), 0)
})

test('thumbnails dedupe, cap and survive missing or odd media shapes', () => {
    const order = {
        products: [
            { name: 'A', ...img('a.jpg') },
            { name: 'A again', ...img('a.jpg') },
            { name: 'B', variantId: { media: { url: 'b.jpg' } } },
            { name: 'C', variantId: null },
            { name: 'D', variantId: { media: ['64f0c0ffee'] } },
            { name: 'E', ...img('e.jpg') },
        ],
    }
    const { thumbs, extra } = orderThumbnails(order, 3)
    assert.deepEqual(thumbs, [
        { src: 'a.jpg', name: 'A' },
        { src: 'b.jpg', name: 'B' },
        { src: null, name: 'C' },
    ])
    assert.equal(extra, 3)
    assert.deepEqual(orderThumbnails(undefined), { thumbs: [], extra: 0 })
})

test('product summary names the first item and counts the rest', () => {
    assert.equal(orderProductSummary({ products: [{ name: 'Cashew' }] }), 'Cashew')
    assert.equal(orderProductSummary({ products: [{ name: 'Cashew' }, { productId: { name: 'Almond' } }, {}] }), 'Cashew +1 more')
    assert.equal(orderProductSummary({ products: [] }), 'No items')
})

test('filter by status group and search order id or product name', () => {
    const orders = [
        { order_id: 'ORD-1001', status: 'pending', products: [{ name: 'Cashew Nuts' }] },
        { order_id: 'ORD-2002', status: 'delivered', products: [{ productId: { name: 'Almonds' } }] },
        { order_id: 'ORD-3003', status: 'cancelled', products: [] },
    ]
    assert.equal(filterOrders(orders).length, 3)
    assert.deepEqual(filterOrders(orders, { status: 'delivered' }).map((o) => o.order_id), ['ORD-2002'])
    assert.deepEqual(filterOrders(orders, { query: '  cashew ' }).map((o) => o.order_id), ['ORD-1001'])
    assert.deepEqual(filterOrders(orders, { query: 'ord-3' }).map((o) => o.order_id), ['ORD-3003'])
    assert.deepEqual(filterOrders(orders, { status: 'active', query: 'almond' }), [])
    assert.deepEqual(filterOrders(null, { query: 'x' }), [])
})

test('pagination clamps out-of-range and junk page numbers', () => {
    const items = Array.from({ length: 17 }, (_, i) => i)
    assert.deepEqual(paginate(items, 1, 8).items, [0, 1, 2, 3, 4, 5, 6, 7])
    assert.equal(paginate(items, 3, 8).items.length, 1)
    assert.equal(paginate(items, 99, 8).page, 3)
    assert.equal(paginate(items, -2, 8).page, 1)
    assert.equal(paginate(items, 'abc', 8).page, 1)
    assert.deepEqual(paginate([], 4, 8), { items: [], page: 1, totalPages: 1, total: 0 })
    assert.equal(paginate(items, 1, 0).items.length, 1)
})

test('profile completion ignores whitespace and the optional landmark', () => {
    assert.deepEqual(profileCompletion(null).percent, 0)
    const partial = profileCompletion({ name: 'Asha', phone: '   ', city: 'Pune' })
    assert.equal(partial.percent, 25)
    assert.ok(partial.missing.includes('Phone number'))
    const full = profileCompletion({
        name: 'Asha', phone: '+919876543210', avatar: { url: 'x.jpg' },
        address: '12 MG Road', city: 'Pune', state: 'MH', pincode: '411001', country: 'India',
    })
    assert.equal(full.complete, true)
    assert.equal(full.percent, 100)
})

test('address lines only appear when there is a usable address', () => {
    assert.equal(addressLines(null), null)
    assert.equal(addressLines({ country: 'India' }), null)
    assert.deepEqual(addressLines({ address: ' 12 MG Road ', landmark: 'Mall', city: 'Pune', state: 'MH', pincode: '411001', country: 'India' }),
        ['12 MG Road', 'Near Mall', 'Pune, MH – 411001', 'India'])
    assert.deepEqual(addressLines({ city: 'Pune' }), ['Pune'])
})

test('names, greetings, dates and currency degrade gracefully', () => {
    assert.equal(firstName('  Asha  Rao '), 'Asha')
    assert.equal(firstName(''), 'there')
    assert.equal(initials('Asha Kumari Rao'), 'AR')
    assert.equal(initials('asha'), 'A')
    assert.equal(initials(null), 'U')
    assert.equal(greetingFor(new Date(2026, 0, 1, 8)), 'Good morning')
    assert.equal(greetingFor(new Date(2026, 0, 1, 14)), 'Good afternoon')
    assert.equal(greetingFor(new Date(2026, 0, 1, 21)), 'Good evening')
    assert.equal(greetingFor(new Date('invalid')), 'Good afternoon')
    assert.equal(formatDate(null), null)
    assert.equal(formatDate('not a date'), null)
    assert.match(formatDate('2026-03-05T10:00:00Z'), /2026/)
    assert.equal(formatCurrency(undefined), '₹0')
    assert.equal(formatCurrency(1099), '₹1,099')
})
