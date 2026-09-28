/* ================================================================
   NEWSLETTER — dependency-free helpers
   Kept apart from lib/newsletterConfig.js (which pulls in zod) because
   the popup ships on every storefront page and should stay light.
   ================================================================ */

export const NEWSLETTER_LAYOUTS = ['split', 'centered', 'slide-in']
export const NEWSLETTER_THEMES = ['pine', 'sun', 'cream']
export const NEWSLETTER_SOURCES = ['popup', 'section', 'footer']

export const NEWSLETTER_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Does the popup belong on this path? Prefix match, so "/checkout" also
// covers "/checkout/success".
export const isNewsletterPathAllowed = (pathname = '/', behavior = {}) => {
    const path = pathname || '/'
    // Never pitch the newsletter on its own unsubscribe page.
    if (path.startsWith('/newsletter')) return false
    if (behavior.pages === 'home' && path !== '/') return false
    return !(behavior.excludePaths || []).some((prefix) => {
        if (!prefix) return false
        // "/" means the homepage only — as a prefix it would match every page.
        if (prefix === '/') return path === '/'
        return path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)
    })
}
