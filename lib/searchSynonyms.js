// Storefront search vocabulary. Shoppers type the English name, the Hindi
// name or a plural ("almonds", "badam", "kaju"), while the catalogue uses
// whichever one the admin picked. Each group lists words that mean the same
// product; a query word matching any of them searches for all of them.
const SYNONYM_GROUPS = [
    ['almond', 'badam'],
    ['cashew', 'kaju'],
    ['pistachio', 'pista'],
    ['raisin', 'kishmish', 'munakka'],
    ['walnut', 'akhrot'],
    ['fig', 'anjeer', 'anjir'],
    ['date', 'khajur', 'khajoor'],
    ['apricot', 'khubani', 'khumani'],
    ['peanut', 'moongphali', 'mungfali'],
    ['makhana', 'foxnut', 'lotus'],
    ['ghee', 'clarified'],
    ['honey', 'shahad'],
    ['flax', 'alsi'],
    ['pumpkin', 'kaddu'],
    ['mango', 'aam'],
    // "cheery" is how one catalogue listing spells cherry.
    ['cherry', 'cheery'],
    ['kaunch', 'konch', 'kaunj', 'kapikachhu', 'mucuna'],
    ['ashwagandha', 'ashvagandha', 'aswagandha'],
    ['muesli', 'musli', 'granola'],
    ['chocolate', 'choco'],
    ['candy', 'toffee', 'goli'],
    ['pepper', 'mirch'],
    ['gift', 'hamper'],
    ['dry', 'dried', 'dehydrated'],
    ['mix', 'mixed', 'assorted'],
]

// Words that describe the shopping, not the product.
const STOP_WORDS = new Set(['buy', 'online', 'best', 'price', 'shop', 'and', 'the', 'for', 'with', 'of', 'in', 'near', 'me', 'india'])

// Crude English stemming, enough for grocery nouns: almonds → almond,
// cherries/cherry → cherr, mangoes → mango. The stem is used as a substring
// match, so it only needs to be a shared prefix of every form.
export const stem = (word) => {
    let w = String(word || '').toLowerCase()
    if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3)
    if (w.length > 4 && w.endsWith('oes')) return w.slice(0, -2)
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
    if (w.length > 4 && w.endsWith('y')) w = w.slice(0, -1)
    return w
}

const STEM_TO_GROUP = new Map()
for (const group of SYNONYM_GROUPS) {
    const stems = [...new Set(group.map(stem))]
    for (const s of stems) STEM_TO_GROUP.set(s, stems)
}

// Split a query into terms; each term is the list of stems that may match it.
// "buy Almonds online" → [['almond', 'badam']]
export const expandSearchTerms = (query) =>
    String(query || '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
        .slice(0, 6)
        .map((word) => STEM_TO_GROUP.get(stem(word)) || [stem(word)])
