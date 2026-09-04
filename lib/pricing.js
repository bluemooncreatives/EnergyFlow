// Single source of truth for MRP / Selling Price / discount rules.
//
// Market standard (India): MRP = Maximum Retail Price. A product can be sold at
// or below MRP, never above it. So the rules are:
//   - MRP must be a number > 0
//   - Selling Price must be a number > 0
//   - Selling Price must be <= MRP   (0% discount, i.e. SP == MRP, is allowed)
//   - discountPercentage is ALWAYS derived from MRP & SP, never trusted from the
//     client, and is bounded to 0..100.
//
// This lives outside the flat zod schema because the cross-field rule
// (SP <= MRP) cannot be expressed on an individual field, and the same rule must
// be enforced identically on every admin form (client) and every API route
// (server).

// Returns the rounded discount percentage (0..100). Any invalid/over-MRP input
// collapses to 0 so callers never produce a negative or NaN discount.
export const computeDiscountPercentage = (mrp, sellingPrice) => {
    const m = Number(mrp)
    const s = Number(sellingPrice)

    if (!Number.isFinite(m) || !Number.isFinite(s) || m <= 0 || s <= 0) return 0
    if (s >= m) return 0

    return Math.round(((m - s) / m) * 100)
}

// Validates a price pair and, when valid, returns the authoritative discount.
// On failure returns the offending field + a user-facing message so forms can
// attach the error inline.
export const validatePricing = (mrp, sellingPrice) => {
    const m = Number(mrp)
    const s = Number(sellingPrice)

    if (!Number.isFinite(m) || m <= 0) {
        return { ok: false, field: 'mrp', message: 'MRP must be greater than 0.' }
    }

    if (!Number.isFinite(s) || s <= 0) {
        return { ok: false, field: 'sellingPrice', message: 'Selling price must be greater than 0.' }
    }

    if (s > m) {
        return { ok: false, field: 'sellingPrice', message: 'Selling price cannot be greater than MRP.' }
    }

    return { ok: true, discountPercentage: computeDiscountPercentage(m, s) }
}
