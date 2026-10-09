const priceFilters = [
    { id: 'mrp', label: 'MRP', type: 'range', unit: '₹' },
    { id: 'sellingPrice', label: 'Selling price', type: 'range', unit: '₹' },
    { id: 'discountPercentage', label: 'Discount', type: 'range', unit: '%' },
]

// Keep server filter values intact in TanStack's filter-state normalization.
// No client row matching runs because these tables use manualFiltering.
export const serverColumnFilter = () => true

export const PRODUCT_FILTERS = [
    { id: 'name', label: 'Product', type: 'select' },
    { id: 'category', label: 'Category', type: 'select' },
    ...priceFilters,
]

export const PRODUCT_VARIANT_FILTERS = [
    { id: 'product', label: 'Product', type: 'select' },
    { id: 'size', label: 'Pack size', type: 'select' },
    { id: 'sku', label: 'SKU', type: 'select' },
    ...priceFilters,
]

export const formatFilterNumber = (value, unit) => {
    const number = Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })
    return unit === '%' ? `${number}%` : `${unit || ''}${number}`
}

export const formatFilterRange = (value, unit) => {
    const hasMin = value?.min !== undefined && value.min !== ''
    const hasMax = value?.max !== undefined && value.max !== ''
    if (hasMin && hasMax) return `${formatFilterNumber(value.min, unit)} – ${formatFilterNumber(value.max, unit)}`
    if (hasMin) return `≥ ${formatFilterNumber(value.min, unit)}`
    if (hasMax) return `≤ ${formatFilterNumber(value.max, unit)}`
    return ''
}
