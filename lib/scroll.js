import { getLenis } from '@/components/Application/LenisProvider'

// One way to move the page.
//
// On the storefront Lenis owns the scroll. It pins `scroll-behavior: auto` on
// <html>, so `scrollIntoView({ behavior: 'smooth' })` and
// `window.scrollTo({ behavior: 'smooth' })` both land instantly there, and it
// keeps its own cached position which it writes back on the next frame — so a
// plain `window.scrollTo` can simply be undone. Everywhere Lenis is off
// (admin, auth, reduced motion, slow connections) the platform handles it.
// These helpers pick the right one, so jumping to the reviews or back to the
// top behaves the same on every page.

const canUseDom = () => typeof window !== 'undefined'

const reducedMotion = () =>
    canUseDom() && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Targets sit under the fixed header and say so with `scroll-mt-*`
// (scroll-margin-top). scrollIntoView honours it; Lenis does not, so read it
// off the element and fold it into the offset ourselves.
const scrollMarginOf = (element) => {
    const value = Number.parseFloat(getComputedStyle(element).scrollMarginTop)
    return Number.isFinite(value) ? value : 0
}

/**
 * Move the page to an absolute offset.
 *
 * smooth — animate there; ignored when the visitor asked for reduced motion.
 */
export const scrollToY = (top, { smooth = true } = {}) => {
    if (!canUseDom()) return
    const instant = !smooth || reducedMotion()
    const lenis = getLenis()

    if (!lenis) {
        window.scrollTo({ top, behavior: instant ? 'instant' : 'smooth' })
        return
    }

    if (instant) {
        // Move the real scroller first. Lenis bails out of scrollTo when its
        // own target already matches, which would otherwise leave the window
        // wherever something else (Next's own reset, a dialog's scroll lock)
        // had put it. Telling Lenis afterwards re-syncs its cached position
        // either way, so the next frame doesn't undo this.
        window.scrollTo({ top, behavior: 'instant' })
    }
    // `force` so it still runs while Lenis is stopped — a dialog is open.
    lenis.scrollTo(top, { immediate: instant, force: true })
}

export const scrollToTop = (options) => scrollToY(0, options)

/**
 * Bring an element to the top of the viewport, clearing the fixed header.
 *
 * target — an element, or an id with or without the leading '#'.
 * Returns false when there is no such element (yet), so a caller following a
 * #hash can retry while the page is still streaming in.
 */
export const scrollToElement = (target, { smooth = true, offset = 0 } = {}) => {
    if (!canUseDom()) return false
    const element = typeof target === 'string'
        ? document.getElementById(target.replace(/^#/, ''))
        : target
    if (!element) return false

    // Measured against the live scroll position rather than Lenis's cached
    // one, which can be stale just after a route change.
    const top = element.getBoundingClientRect().top + window.scrollY - scrollMarginOf(element) + offset
    scrollToY(Math.max(0, Math.round(top)), { smooth })
    return true
}
