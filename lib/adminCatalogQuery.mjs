import { PRODUCT_FILTERS, PRODUCT_VARIANT_FILTERS } from './adminCatalogFilters.mjs'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const invalid = (message) => { throw Object.assign(new Error(message), { status: 400 }) }
const configFor = (kind) => {
    if (kind === 'product') return {
        filters: PRODUCT_FILTERS,
        joinedField: 'category', collection: 'categories', joinedAs: 'categoryData',
        fields: { category: 'categoryData.name' },
        search: ['name', 'slug', 'categoryData.name'],
        projection: { _id: 1, name: 1, slug: 1, category: '$categoryData.name', mrp: 1, sellingPrice: 1, discountPercentage: 1, createdAt: 1, updatedAt: 1, deletedAt: 1 },
    }
    if (kind === 'variant') return {
        filters: PRODUCT_VARIANT_FILTERS,
        joinedField: 'product', collection: 'products', joinedAs: 'productData',
        fields: { product: 'productData.name' },
        search: ['size', 'sku', 'productData.name'],
        projection: { _id: 1, product: '$productData.name', size: 1, sku: 1, mrp: 1, sellingPrice: 1, discountPercentage: 1, createdAt: 1, updatedAt: 1, deletedAt: 1 },
    }
    throw new Error('Unknown catalogue type')
}

const readArray = (params, key) => {
    let result
    try { result = JSON.parse(params.get(key) || '[]') } catch { invalid(`Invalid ${key}.`) }
    if (!Array.isArray(result)) invalid(`Invalid ${key}.`)
    return result
}

export function parseCatalogParams(params, kind) {
    const config = configFor(kind)
    const integer = (key, fallback, min, max) => {
        const value = Number(params.get(key) ?? fallback)
        if (!Number.isSafeInteger(value) || value < min || value > max) invalid(`Invalid ${key}.`)
        return value
    }
    const filters = readArray(params, 'filters')
    if (filters.length > config.filters.length) invalid('Too many filters.')
    const seen = new Set()
    const normalized = filters.map((filter) => {
        const spec = config.filters.find((item) => item.id === filter?.id)
        if (!spec || seen.has(spec.id)) invalid('Invalid filter column.')
        seen.add(spec.id)
        if (spec.type === 'select') {
            if (!Array.isArray(filter.value) || filter.value.length > 1000 || filter.value.some((v) => typeof v !== 'string' || v.length > 500)) invalid(`Invalid ${spec.label} filter.`)
            return { id: spec.id, value: [...new Set(filter.value)] }
        }
        if (!filter.value || typeof filter.value !== 'object' || Array.isArray(filter.value)) invalid(`Invalid ${spec.label} range.`)
        const value = {}
        for (const bound of ['min', 'max']) {
            const raw = filter.value[bound]
            if (raw === undefined || raw === '') continue
            if (!['number', 'string'].includes(typeof raw) || (typeof raw === 'string' && !raw.trim())) invalid(`Invalid ${spec.label} range.`)
            const number = Number(raw)
            if (!Number.isFinite(number) || number < 0 || (spec.unit === '%' && number > 100)) invalid(`Invalid ${spec.label} range.`)
            value[bound] = number
        }
        if (value.min !== undefined && value.max !== undefined && value.min > value.max) invalid('Minimum must not exceed maximum.')
        return { id: spec.id, value }
    }).filter((filter) => Array.isArray(filter.value) ? filter.value.length : Object.keys(filter.value).length)
    const sorting = readArray(params, 'sorting')
    if (sorting.length > 10 || sorting.some((sort) => !sort || !Object.hasOwn(config.projection, sort.id) || sort.id === '_id' || typeof sort.desc !== 'boolean')) invalid('Invalid sorting.')
    const deleteType = params.get('deleteType') || 'SD'
    if (!['SD', 'PD'].includes(deleteType)) invalid('Invalid delete type.')
    const globalFilter = (params.get('globalFilter') || '').trim()
    if (globalFilter.length > 500) invalid('Search is too long.')
    // Variant create/edit forms also use this endpoint for their product picker.
    return { filters: normalized, sorting, deleteType, globalFilter, start: integer('start', 0, 0, Number.MAX_SAFE_INTEGER), size: integer('size', 10, 1, 10000) }
}

export function buildCatalogPipeline(kind, query, { exportRows = false } = {}) {
    const config = configFor(kind)
    const fieldFor = (id) => config.fields[id] || id
    const baseMatch = { deletedAt: query.deleteType === 'PD' ? { $ne: null } : null }
    if (query.globalFilter) {
        const regex = escapeRegex(query.globalFilter)
        baseMatch.$or = [
            ...config.search.map((field) => ({ [field]: { $regex: regex, $options: 'i' } })),
            ...['mrp', 'sellingPrice', 'discountPercentage'].map((field) => ({
                $expr: { $regexMatch: { input: { $ifNull: [{ $toString: `$${field}` }, ''] }, regex, options: 'i' } },
            })),
        ]
    }
    const matchFor = (except) => {
        const match = {}
        for (const filter of query.filters) {
            if (filter.id === except) continue
            match[fieldFor(filter.id)] = Array.isArray(filter.value)
                ? { $in: filter.value.includes('') ? [...filter.value, null] : filter.value }
                : { ...(filter.value.min !== undefined ? { $gte: filter.value.min } : {}), ...(filter.value.max !== undefined ? { $lte: filter.value.max } : {}) }
        }
        return { $match: match }
    }
    const sort = Object.fromEntries(query.sorting.map((item) => [fieldFor(item.id), item.desc ? -1 : 1]))
    if (!Object.keys(sort).length) sort.createdAt = -1
    sort._id = -1 // Stable pages when names/prices/dates tie.
    const prefix = [
        { $match: { deletedAt: baseMatch.deletedAt } },
        { $lookup: { from: config.collection, localField: config.joinedField, foreignField: '_id', as: config.joinedAs } },
        { $unwind: { path: `$${config.joinedAs}`, preserveNullAndEmptyArrays: true } },
        { $match: baseMatch },
    ]
    const data = [matchFor(), { $sort: sort }, ...(!exportRows ? [{ $skip: query.start }, { $limit: query.size }] : []), { $project: config.projection }]
    if (exportRows) return [...prefix, ...data]
    const facets = { data, total: [matchFor(), { $count: 'count' }] }
    // Each facet respects search and the OTHER filters, across every page.
    // Excluding its own filter lets users add alternatives to a multiselect.
    for (const spec of config.filters) {
        const field = `$${fieldFor(spec.id)}`
        facets[spec.id] = spec.type === 'select'
            ? [matchFor(spec.id), { $group: { _id: { $ifNull: [field, ''] }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, value: '$_id', count: 1 } }]
            : [matchFor(spec.id), { $match: { [fieldFor(spec.id)]: { $type: 'number' } } }, { $group: { _id: null, min: { $min: field }, max: { $max: field } } }, { $project: { _id: 0, min: 1, max: 1 } }]
    }
    return [...prefix, { $facet: facets }]
}

export function catalogResult(kind, result = {}) {
    const facets = Object.fromEntries(configFor(kind).filters.map((spec) => [spec.id,
        spec.type === 'select' ? (result[spec.id] || []).map((option) => ({ ...option, label: option.value || 'Unassigned' })) : (result[spec.id]?.[0] || { min: null, max: null }),
    ]))
    return { success: true, data: result.data || [], meta: { totalRowCount: result.total?.[0]?.count || 0, facets } }
}
