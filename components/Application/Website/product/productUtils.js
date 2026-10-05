import gsap from 'gsap'
import { formatINR } from '@/components/Application/Website/storefront/format'

export const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Grams in a pack-size label ("200g", "1 kg", "500 gms"), or null when the
// label is not a weight (legacy apparel sizes, "Pack of 2").
export const packGrams = (size) => {
    const match = String(size ?? '').trim().match(/^([\d.]+)\s*(g|gm|gms|gram|grams|kg|kgs)$/i)
    if (!match) return null
    const amount = parseFloat(match[1])
    if (!Number.isFinite(amount) || amount <= 0) return null
    return /^kg/i.test(match[2]) ? amount * 1000 : amount
}

// "₹175 / 100 g" — the comparison shoppers make between pack sizes. Only for
// weight labels; anything else has no honest unit price.
export const unitPriceLabel = (price, size) => {
    const grams = packGrams(size)
    const value = Number(price)
    if (!grams || !Number.isFinite(value) || value <= 0) return null
    const per100 = Math.round((value / grams) * 100 * 100) / 100
    // Paise always in pairs: "₹439.50", never "₹439.5"; whole rupees stay whole.
    const amount = Number.isInteger(per100)
        ? formatINR(per100)
        : per100.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${amount} / 100 g`
}

// Genuine markdown only: a stale discountPercentage with equal prices is 0.
export const savingOf = (variant) => {
    const mrp = Number(variant?.mrp)
    const price = Number(variant?.sellingPrice)
    if (!Number.isFinite(mrp) || !Number.isFinite(price) || mrp <= price) return { amount: 0, percent: 0 }
    return { amount: mrp - price, percent: Math.round(((mrp - price) / mrp) * 100) }
}

// A variant's own photos, else the product's, never an empty list.
export const galleryFor = (variant, product, placeholder, name) => {
    const own = (variant?.media || []).filter((m) => m?.secure_url)
    const fallback = (product?.media || []).filter((m) => m?.secure_url)
    const list = own.length ? own : fallback
    return list.length
        ? list.map((m, i) => ({ id: m._id || `${m.secure_url}-${i}`, src: m.secure_url, alt: m.alt || `${name} - photo ${i + 1}` }))
        : [{ id: 'placeholder', src: placeholder, alt: name, placeholder: true }]
}

// Delivery window from the shipping promise (delivered in 4–7 days). Built on
// the client only — the server's clock and time zone are not the shopper's.
export const deliveryWindow = (now = new Date()) => {
    const at = (days) => {
        const d = new Date(now)
        d.setDate(d.getDate() + days)
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    }
    return `${at(4)} - ${at(7)}`
}

// The header cart button that is actually on screen (there can be more than
// one across breakpoints).
const visibleCartButton = () =>
    Array.from(document.querySelectorAll('[aria-label="Open cart"]'))
        .find((el) => {
            const r = el.getBoundingClientRect()
            return r.width > 0 && r.height > 0
        }) || null

// Sends a small copy of the product photo into the header cart, then bumps
// the cart. Purely decorative: silently does nothing with reduced motion or
// when either end is missing.
export const flyToCart = (sourceEl, src) => {
    if (typeof window === 'undefined' || !sourceEl || !src || prefersReducedMotion()) return
    const target = visibleCartButton()
    if (!target) return

    const from = sourceEl.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const size = Math.min(96, Math.max(56, from.width * 0.35))

    const ghost = document.createElement('img')
    ghost.src = src
    ghost.alt = ''
    ghost.setAttribute('aria-hidden', 'true')
    Object.assign(ghost.style, {
        position: 'fixed',
        left: `${from.left + from.width / 2 - size / 2}px`,
        top: `${from.top + from.height / 2 - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'cover',
        borderRadius: '9999px',
        boxShadow: '0 18px 40px -12px rgb(4 28 21 / 0.45)',
        zIndex: 'var(--z-toast)',
        pointerEvents: 'none',
    })
    document.body.appendChild(ghost)

    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)

    gsap.timeline({ onComplete: () => ghost.remove() })
        .fromTo(ghost, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' })
        // x and y on different eases trace an arc rather than a straight line.
        .to(ghost, { x: dx, duration: 0.75, ease: 'power2.inOut' }, '>')
        .to(ghost, { y: dy, duration: 0.75, ease: 'back.in(1.4)' }, '<')
        .to(ghost, { scale: 0.2, opacity: 0.6, duration: 0.75, ease: 'power2.in' }, '<')
        .fromTo(target, { scale: 1 }, { scale: 1.25, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'transform' }, '>-0.05')
}
