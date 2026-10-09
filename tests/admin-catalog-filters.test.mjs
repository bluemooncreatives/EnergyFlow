import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCatalogPipeline, catalogResult, parseCatalogParams } from '../lib/adminCatalogQuery.mjs'
import { formatFilterRange, serverColumnFilter } from '../lib/adminCatalogFilters.mjs'
import { createTable, getCoreRowModel } from '@tanstack/react-table'

const query = (kind = 'product', values = {}) => parseCatalogParams(new URLSearchParams(Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : value]),
)), kind)
const facet = (kind, values) => buildCatalogPipeline(kind, query(kind, values)).at(-1).$facet

test('TanStack preserves server range objects instead of removing them as empty numeric filters', () => {
    let filters = []
    const table = createTable({
        data: [{ mrp: 100, name: 'Sample' }],
        columns: ['mrp', 'name'].map((accessorKey) => ({ accessorKey, filterFn: serverColumnFilter })),
        manualFiltering: true,
        state: { columnFilters: [] },
        getCoreRowModel: getCoreRowModel(),
        onColumnFiltersChange: (updater) => { filters = typeof updater === 'function' ? updater(filters) : updater },
    })
    const values = [{ id: 'mrp', value: { min: 0, max: 50 } }, { id: 'name', value: ['Sample'] }]
    table.setColumnFilters(values)
    assert.deepEqual(filters, values)
    table.setColumnFilters([])
    assert.deepEqual(filters, [])
})

test('defaults exclude recycled records and enforce bounded pagination', () => {
    assert.deepEqual(query(), { filters: [], sorting: [], deleteType: 'SD', globalFilter: '', start: 0, size: 10 })
    assert.equal(query('product', { size: 10000 }).size, 10000)
    for (const values of [{ start: -1 }, { start: 'abc' }, { size: 0 }, { size: 10001 }, { size: 1.5 }, { deleteType: 'unknown' }]) {
        assert.throws(() => query('product', values), { status: 400 })
    }
    assert.deepEqual(buildCatalogPipeline('product', query('product', { deleteType: 'PD' }))[0], { $match: { deletedAt: { $ne: null } } })
})

test('invalid JSON, unknown fields, duplicate filters, and injected values are rejected', () => {
    for (const values of [
        { filters: '[' }, { sorting: 'null' }, { filters: {} },
        { filters: [{ id: '$where', value: ['x'] }] },
        { filters: [{ id: 'name', value: { $ne: null } }] },
        { filters: [{ id: 'name', value: ['x'] }, { id: 'name', value: ['y'] }] },
        { sorting: [{ id: '$where', desc: true }] }, { sorting: [{ id: 'name', desc: 'false' }] },
        { globalFilter: 'x'.repeat(501) },
    ]) assert.throws(() => query('product', values), { status: 400 })
})

test('multiselect uses exact OR matches within a field and AND across fields', () => {
    const filters = [{ id: 'category', value: ['Bars (100%)', 'Gifts', 'Gifts'] }, { id: 'name', value: ['Energy+'] }]
    assert.deepEqual(facet('product', { filters }).data[0], { $match: {
        'categoryData.name': { $in: ['Bars (100%)', 'Gifts'] }, name: { $in: ['Energy+'] },
    } })
    assert.deepEqual(facet('variant', { filters: [{ id: 'product', value: ['Energy+'] }, { id: 'size', value: ['Pack of 6', '12 pcs'] }] }).data[0], {
        $match: { 'productData.name': { $in: ['Energy+'] }, size: { $in: ['Pack of 6', '12 pcs'] } },
    })
})

test('range filters include their endpoints, support zero and either open end', () => {
    const filters = [{ id: 'mrp', value: { min: '0', max: '250.5' } }, { id: 'sellingPrice', value: { min: 10 } }, { id: 'discountPercentage', value: { max: 0 } }]
    assert.deepEqual(facet('product', { filters }).data[0], {
        $match: { mrp: { $gte: 0, $lte: 250.5 }, sellingPrice: { $gte: 10 }, discountPercentage: { $lte: 0 } },
    })
    for (const value of [{ min: 20, max: 10 }, { min: -1 }, { max: 'abc' }, { min: null }, { min: true }, { min: ' ' }, { max: 101 }]) {
        assert.throws(() => query('product', { filters: [{ id: 'discountPercentage', value }] }), { status: 400 })
    }
    assert.deepEqual(query('product', { filters: [{ id: 'name', value: [] }, { id: 'mrp', value: { min: '', max: '' } }] }).filters, [])
})

test('facets exclude only their own filter and are computed before pagination', () => {
    const branches = facet('product', { start: 20, size: 10, filters: [{ id: 'category', value: ['Bars'] }, { id: 'mrp', value: { min: 100 } }] })
    assert.deepEqual(branches.category[0], { $match: { mrp: { $gte: 100 } } })
    assert.deepEqual(branches.mrp[0], { $match: { 'categoryData.name': { $in: ['Bars'] } } })
    assert.deepEqual(branches.name[0], branches.data[0])
    assert.deepEqual(branches.total, [branches.data[0], { $count: 'count' }])
    assert.deepEqual(branches.data.slice(2, 4), [{ $skip: 20 }, { $limit: 10 }])
    for (const [key, branch] of Object.entries(branches)) {
        if (key !== 'data') assert.ok(!branch.some((stage) => '$skip' in stage || '$limit' in stage))
    }
})

test('joined-name counts and sorting use the lookup fields, with stable ties', () => {
    for (const [kind, id, field] of [['product', 'category', 'categoryData.name'], ['variant', 'product', 'productData.name']]) {
        const pipeline = buildCatalogPipeline(kind, query(kind, { sorting: [{ id, desc: false }], filters: [{ id, value: ['Example'] }] }))
        assert.ok(pipeline.findIndex((stage) => '$lookup' in stage) < pipeline.findIndex((stage) => '$facet' in stage))
        assert.deepEqual(pipeline.at(-1).$facet.total[0], { $match: { [field]: { $in: ['Example'] } } })
        assert.deepEqual(pipeline.at(-1).$facet.data[1], { $sort: { [field]: 1, _id: -1 } })
    }
})

test('literal regex characters in search are escaped for both tables', () => {
    for (const kind of ['product', 'variant']) {
        const pipeline = buildCatalogPipeline(kind, query(kind, { globalFilter: ' [(a)+.*?] ' }))
        const alternatives = pipeline[3].$match.$or
        const expected = '\\[\\(a\\)\\+\\.\\*\\?\\]'
        assert.equal(Object.values(alternatives[0])[0].$regex, expected)
        assert.equal(alternatives.at(-1).$expr.$regexMatch.regex, expected)
        assert.deepEqual(alternatives.at(-1).$expr.$regexMatch.input, { $ifNull: [{ $toString: '$discountPercentage' }, ''] })
    }
})

test('missing joins have an Unassigned option that can filter null or empty values', () => {
    assert.deepEqual(facet('product', { filters: [{ id: 'category', value: [''] }] }).data[0], { $match: { 'categoryData.name': { $in: ['', null] } } })
    assert.deepEqual(catalogResult('product', { category: [{ value: '', count: 2 }] }).meta.facets.category, [{ value: '', label: 'Unassigned', count: 2 }])
})

test('export shares all matches, sorting and displayed fields and omits pagination', () => {
    for (const kind of ['product', 'variant']) {
        const q = query(kind, { start: 30, size: 10, globalFilter: 'gift', deleteType: 'PD', filters: [{ id: 'sellingPrice', value: { min: 0, max: 50 } }] })
        const listing = buildCatalogPipeline(kind, q)
        const exported = buildCatalogPipeline(kind, q, { exportRows: true })
        assert.deepEqual(exported.slice(0, 4), listing.slice(0, 4))
        assert.deepEqual(exported.slice(4), listing.at(-1).$facet.data.filter((stage) => !('$skip' in stage) && !('$limit' in stage)))
        assert.ok(!exported.some((stage) => '$skip' in stage || '$limit' in stage || '$facet' in stage))
    }
})

test('empty responses include zero counts and usable empty facets', () => {
    const result = catalogResult('variant')
    assert.equal(result.success, true)
    assert.deepEqual(result.data, [])
    assert.equal(result.meta.totalRowCount, 0)
    assert.deepEqual(result.meta.facets.product, [])
    assert.deepEqual(result.meta.facets.sellingPrice, { min: null, max: null })
    assert.equal(formatFilterRange({ min: 0, max: 100 }, '%'), '0% – 100%')
    assert.equal(formatFilterRange({ min: 0 }, '₹'), '≥ ₹0')
    assert.equal(formatFilterRange({ max: 50 }, '₹'), '≤ ₹50')
})

// Explicitly opt into read-only checks against the configured database.
test('MongoDB: dynamic facets, paging, joined filters and export agree on current records', { skip: process.env.CATALOG_DB_CHECK !== '1' }, async () => {
    const { default: mongoose } = await import('mongoose')
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'YT-NEXTJS-ECOMMERCE', serverSelectionTimeoutMS: 15000 })
    try {
        for (const [kind, collection, selectId] of [['product', 'products', 'category'], ['variant', 'productvariants', 'product']]) {
            const aggregate = async (values = {}, exportRows = false) => mongoose.connection.db.collection(collection).aggregate(buildCatalogPipeline(kind, query(kind, values), { exportRows })).toArray()
            const [raw] = await aggregate()
            const listed = catalogResult(kind, raw)
            const exported = await aggregate({}, true)
            assert.equal(listed.meta.totalRowCount, exported.length)
            assert.deepEqual(listed.data, exported.slice(0, 10))
            assert.deepEqual(catalogResult(kind, (await aggregate({ start: 10 }))[0]).data, exported.slice(10, 20))
            const firstOption = listed.meta.facets[selectId][0]
            if (firstOption) {
                const filters = [{ id: selectId, value: [firstOption.value] }]
                const filtered = catalogResult(kind, (await aggregate({ filters }))[0])
                const filteredExport = await aggregate({ filters }, true)
                assert.equal(filtered.meta.totalRowCount, firstOption.count)
                assert.equal(filteredExport.length, firstOption.count)
                assert.ok(filteredExport.every((row) => (row[selectId] || '') === firstOption.value))
                assert.deepEqual(filtered.meta.facets[selectId], listed.meta.facets[selectId])
                assert.deepEqual(filtered.data, filteredExport.slice(0, 10))
            }
            const impossible = [{ id: 'sellingPrice', value: { min: Number.MAX_SAFE_INTEGER } }]
            assert.equal(catalogResult(kind, (await aggregate({ filters: impossible }))[0]).meta.totalRowCount, 0)
            assert.deepEqual(await aggregate({ filters: impossible }, true), [])
            await aggregate({ globalFilter: '[()+.*?' })
            const binExport = await aggregate({ deleteType: 'PD' }, true)
            assert.equal(catalogResult(kind, (await aggregate({ deleteType: 'PD' }))[0]).meta.totalRowCount, binExport.length)
        }
    } finally {
        await mongoose.disconnect()
    }
})
