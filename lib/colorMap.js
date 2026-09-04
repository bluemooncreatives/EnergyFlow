// Curated name -> hex map for color labels that are NOT valid CSS color
// keywords (e.g. "Emerald", "Mocha", "Nude") so their swatch renders a real
// shade instead of an empty/transparent circle. This is the FALLBACK layer:
// an admin-provided `colorHex` on the variant always wins over this map.
// Keys are normalized to lower-case; look-ups lower-case the incoming name.
export const COLOR_HEX_MAP = {
    // neutrals
    black: '#000000',
    white: '#ffffff',
    ivory: '#fffff0',
    cream: '#fffdd0',
    offwhite: '#faf9f6',
    'off white': '#faf9f6',
    beige: '#f5f5dc',
    nude: '#e3bc9a',
    sand: '#c2b280',
    tan: '#d2b48c',
    taupe: '#b38b6d',
    khaki: '#c3b091',
    camel: '#c19a6b',
    mocha: '#967969',
    chocolate: '#7b3f00',
    coffee: '#6f4e37',
    grey: '#808080',
    gray: '#808080',
    charcoal: '#36454f',
    silver: '#c0c0c0',
    // reds / pinks
    red: '#e11d2a',
    maroon: '#800000',
    burgundy: '#800020',
    wine: '#722f37',
    crimson: '#dc143c',
    rust: '#b7410e',
    coral: '#ff7f50',
    salmon: '#fa8072',
    pink: '#ffc0cb',
    blush: '#de5d83',
    rose: '#ff66cc',
    fuchsia: '#ff00ff',
    magenta: '#ff00ff',
    // oranges / yellows / browns
    orange: '#ff7a00',
    peach: '#ffcba4',
    apricot: '#fbceb1',
    mustard: '#e1ad01',
    gold: '#d4af37',
    yellow: '#ffd400',
    brown: '#7b4b2a',
    // greens
    green: '#2e7d32',
    emerald: '#50c878',
    olive: '#808000',
    sage: '#9caf88',
    mint: '#98ff98',
    teal: '#008080',
    lime: '#bfff00',
    forest: '#228b22',
    // blues / purples
    blue: '#1e3a8a',
    navy: '#000080',
    'navy blue': '#000080',
    royal: '#4169e1',
    'royal blue': '#4169e1',
    sky: '#87ceeb',
    'sky blue': '#87ceeb',
    turquoise: '#40e0d0',
    cyan: '#00ffff',
    indigo: '#4b0082',
    purple: '#7e22ce',
    violet: '#8f00ff',
    lavender: '#b497bd',
    lilac: '#c8a2c8',
    plum: '#8e4585',
}

// Accepts #rgb, #rrggbb, #rrggbbaa (case-insensitive). Trims first.
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export const isValidHex = (value) => typeof value === 'string' && HEX_RE.test(value.trim())

// Lower-cased, trimmed hex for storage; returns '' when not a valid hex.
export const normalizeHex = (value) => (isValidHex(value) ? value.trim().toLowerCase() : '')

// Resolve a single color token to a usable CSS color, or null if we can't.
// Order: curated dictionary -> valid CSS named color (browser only) -> null.
const resolveToken = (token) => {
    const key = String(token || '').trim().toLowerCase()
    if (!key) return null
    if (COLOR_HEX_MAP[key]) return COLOR_HEX_MAP[key]
    // CSS.supports is browser-only; the filter swatch renders client-side.
    if (typeof CSS !== 'undefined' && CSS.supports?.('color', key)) return key
    return null
}

// Returns a style object for a swatch, or null when the color is unresolvable
// (caller should then render a neutral "no swatch" placeholder rather than an
// invisible white circle). An admin `hex` wins; multi-tone names like
// "Black & White" or "Red/Blue" render as a split gradient.
export const resolveColorStyle = (name, hex) => {
    if (isValidHex(hex)) return { backgroundColor: hex.trim() }

    if (!name) return null

    const parts = String(name).split(/\s*[&/]\s*/).filter(Boolean)
    if (parts.length > 1) {
        const resolved = parts.map(resolveToken)
        if (resolved.every(Boolean)) {
            const stops = resolved
                .map((color, index) => {
                    const from = (index / resolved.length) * 100
                    const to = ((index + 1) / resolved.length) * 100
                    return `${color} ${from}%, ${color} ${to}%`
                })
                .join(', ')
            return { backgroundImage: `linear-gradient(135deg, ${stops})` }
        }
    }

    const single = resolveToken(name)
    return single ? { backgroundColor: single } : null
}
