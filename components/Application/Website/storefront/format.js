// Rupee price for storefront cards: "₹750", "₹1,099", "₹49.50". Whole rupees
// drop the ".00" the currency formatter would otherwise print.
export const formatINR = (value) => {
    const n = Number(value)
    if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return null
    return n.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })
}

// Whole-number percentage saved, or 0 when there is no genuine markdown.
export const discountPercent = (mrp, price) => {
    const m = Number(mrp)
    const p = Number(price)
    if (!Number.isFinite(m) || !Number.isFinite(p) || m <= 0 || p >= m) return 0
    return Math.round(((m - p) / m) * 100)
}

// Grid "row trimming": hide the tail items that would sit alone on an
// unfinished last row, per breakpoint, so a product grid always ends flush.
// Only used where a "View all" link sits beside the grid. Class names are
// static strings so Tailwind can see them. `cols` must mirror the grid classes.
const TRIM_CLASSES = { base: 'max-md:hidden', md: 'md:max-lg:hidden', lg: 'lg:max-xl:hidden', xl: 'xl:hidden' }

export const rowTrimClass = (index, total, cols = { base: 2, md: 3, lg: 4, xl: 5 }) =>
    Object.entries(cols)
        .filter(([, c]) => total >= c && index >= Math.floor(total / c) * c)
        .map(([bp]) => TRIM_CLASSES[bp])
        .join(' ')

// Background tints cycled by index across tiles so neighbours never match.
export const TINTS = [
    'var(--tint-pistachio)',
    'var(--tint-almond)',
    'var(--tint-sage)',
    'var(--tint-honey)',
    'var(--tint-berry)',
    'var(--tint-oat)',
]

export const tintAt = (index) => TINTS[((index % TINTS.length) + TINTS.length) % TINTS.length]
