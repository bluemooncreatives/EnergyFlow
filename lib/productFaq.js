// FAQ for a product page, built from the product itself (its live pack sizes,
// prices and reviews), answers written for its aisle (storage, how to use),
// the store's delivery / return policy, and the category page's own FAQ.
//
// Same rule as lib/catalogSeo.js: nothing here may promise certifications,
// lab results or health outcomes. Policy wording is kept in step with
// ProductAssurance on the same page.

import { getCategorySeo } from '@/lib/catalogSeo'
import { MAX_CART_QTY } from '@/lib/cartConstants'
import { sortSizes } from '@/lib/utils'
import { expandSearchTerms } from '@/lib/searchSynonyms'

const MAX_FAQS = 10
const MAX_CATEGORY_FAQS = 3

const DELIVERY =
    'Orders are packed and dispatched within 1-2 working days, then delivered in 2-4 working days to metros and 4-7 working days elsewhere in India. You get a tracking link as soon as your parcel leaves us.'

const RETURNS =
    'If it arrives damaged, sealed incorrectly or isn’t what you ordered, tell us within 7 days of delivery and we will replace it or refund you. Refunds go back to the original payment method within 5-7 business days. As it is a food product, opened packs can only be returned for a genuine quality issue.'

const DEFAULT_STORAGE =
    'Keep it in an airtight container in a cool, dry place, away from heat, moisture and direct sunlight. The packed and best before dates are printed on every pack.'

// Per aisle, from the buying guides on the category pages.
const CATEGORY_GUIDE = {
    'dry-fruits-and-nuts': {
        storage: 'Keep it in an airtight jar away from heat and sunlight. In warm, humid months, refrigerate opened packs, especially oil-rich nuts such as walnuts, macadamia and Brazil nuts, which turn rancid faster.',
        use: 'Have a small handful (about 20-30g) as a snack, soak almonds overnight for the morning, or add it to kheer, halwa, pulao, smoothies and breakfast bowls.',
    },
    'imported-fruits-and-berries': {
        storage: 'Unopened packs keep for months in a cool, dry place. Once opened, reseal tightly and use within a few weeks for the best texture; in humid weather the fridge keeps it soft without turning sticky.',
        use: 'Snack on it straight from the pack, or add it to muesli, oats, yoghurt, trail mixes, cakes and cookies.',
    },
    'seeds-and-superfoods': {
        storage: 'Keep it airtight in a cool, dry place. Oil-rich seeds such as chia and flax stay freshest in the fridge, especially through humid months.',
        use: 'Stir it into smoothies, oats, curd or salads. Chia seeds are best soaked in water or milk for 15-20 minutes first, and flax seeds ground just before use.',
    },
    'millets-and-grains': {
        storage: 'Keep it in an airtight container in a cool, dry place, away from moisture.',
        use: 'Rinse well and soak for a few hours, then cook it like rice or use it in khichdi, upma, dosa and rotis.',
    },
    'pulses-and-dal': {
        storage: 'Keep it in an airtight container in a cool, dry place, away from moisture.',
        use: 'Rinse well, soak if the dal needs it, then cook it for dal, khichdi, sambar or soups.',
    },
    'herbs-and-ayurveda': {
        storage: 'Keep the pack tightly closed in a cool, dry place, away from moisture and sunlight.',
        use: 'Follow the usage on the pack. Herbs affect everyone differently, so if you are pregnant, nursing, taking medication or managing a health condition, speak to your doctor or an Ayurvedic practitioner first.',
    },
    'flavoured-and-special-nuts': {
        storage: 'Reseal the pack airtight right after opening and keep it away from humidity so the coating stays crisp.',
        use: 'Ready to eat straight from the pack: a desk-drawer snack, a tea-time nibble or part of a party platter.',
    },
    'healthy-candies-and-sweets': {
        storage: 'Stored airtight in a cool, dry place, it keeps for several weeks after opening.',
        use: 'Ready to eat. Enjoy a few after a meal or as a sweet treat, like any other sweet.',
    },
    'premium-chocolates': {
        storage: 'Store below 25°C in an airtight container, away from sunlight and strong smells. In peak summer, put it somewhere cool as soon as it arrives.',
        use: 'Ready to eat, and an easy gift. Serve at a cool room temperature for the best texture.',
    },
    'flavoured-makhana-and-snacks': {
        storage: 'Reseal the pack airtight after every use. If it softens, dry-roast it in a pan for a couple of minutes to bring the crunch back.',
        use: 'Ready to eat straight from the pack: a tiffin, travel or tea-time snack.',
    },
    'roasted-and-healthy-snacks': {
        storage: 'Reseal the pack airtight after opening and keep it in a cool, dry place.',
        use: 'Ready to eat straight from the pack: a tiffin, travel or tea-time snack.',
    },
    'gift-boxes': {
        storage: 'Keep the box in a cool, dry place out of direct sunlight. Once opened, move what is left into airtight containers.',
        use: 'Gift it as it comes, for festivals, weddings, house-warmings, corporate gifting and thank-yous.',
    },
}

// A few products are used differently from the rest of their aisle.
const NAME_GUIDES = [
    {
        match: /muesli|granola/i,
        use: 'Serve it with cold milk or curd, top it with fresh fruit, or soak it overnight in milk for a ready breakfast.',
        storage: 'Keep it airtight in a cool, dry place and reseal the pack after every use so it stays crunchy.',
    },
    { match: /ashwagandha/i, use: 'Ashwagandha root powder is traditionally taken with warm milk at night. Follow the usage on the pack, and if you are pregnant, nursing, taking medication or managing a health condition, speak to your doctor first.' },
    { match: /kaunch|konch|kapikachhu|mucuna/i, use: 'Kaunch beej is usually used as a powder mixed into milk. Follow the usage on the pack, and if you are pregnant, nursing, taking medication or managing a health condition, speak to your doctor first.' },
]

// Category questions often name one product ("What is kaunch beej?"). Only
// those about this product, or about the aisle in general, belong on its page.
// Items are matched through the search synonyms, so "konch" finds "kaunch".
// expandSearchTerms keeps only a search's first six words, so every word is
// expanded on its own here.
const termKeys = (text) =>
    String(text || '')
        .split(/\s+/)
        .flatMap((word) => expandSearchTerms(word))
        .map((alternatives) => alternatives.join('|'))

const ITEM_KEYS = new Set(termKeys(
    'almond cashew pistachio raisin walnut fig apricot peanut makhana ghee honey flax pumpkin mango cherry ' +
    'kaunch ashwagandha muesli chocolate candy pepper gift blueberry cranberry kiwi chia sunflower moringa macadamia brazil'
))

const itemsIn = (text) => new Set(termKeys(text).filter((key) => ITEM_KEYS.has(key)))

// 2 = about this product, 1 = general to the aisle, 0 = about another product.
const relevance = (questionItems, productItems) => {
    if (!questionItems.size) return 1
    for (const item of questionItems) if (productItems.has(item)) return 2
    return 0
}

const rupees = (value) => {
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) return null
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

const listJoin = (items) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

const packAnswer = (name, variants) => {
    const bySize = new Map()
    for (const variant of variants || []) {
        if (variant?.size && !bySize.has(variant.size)) bySize.set(variant.size, variant)
    }
    const sizes = sortSizes([...bySize.keys()])
    if (!sizes.length) return null

    const packs = sizes.map((size) => {
        const variant = bySize.get(size)
        const price = rupees(variant.sellingPrice)
        return price ? `${size} (${price})` : size
    })
    return sizes.length === 1
        ? `You can buy ${name} in a ${packs[0]} pack. The price includes all taxes.`
        : `You can buy ${name} in ${sizes.length} pack sizes: ${listJoin(packs)}. Prices include all taxes; pick a pack size above to switch.`
}

/**
 * @returns {{ q: string, a: string }[]} up to 10 questions, product-specific first.
 */
export const buildProductFaqs = ({ product, variants = [], reviewCount = 0, ratingAvg = 0 }) => {
    const name = product?.name || 'This product'
    const category = product?.category
    const guide = CATEGORY_GUIDE[category?.slug] || {}
    const nameGuide = NAME_GUIDES.find((item) => item.match.test(name))

    const faqs = []
    const add = (q, a) => { if (q && a) faqs.push({ q, a }) }

    add(`What pack sizes is ${name} available in?`, packAnswer(name, variants))
    const storage = nameGuide?.storage || guide.storage
    add(`How should I store ${name}?`, storage ? `${storage} The packed and best before dates are printed on every pack.` : DEFAULT_STORAGE)
    add(`How can I use ${name}?`, nameGuide?.use || guide.use)

    const count = Number(reviewCount) || 0
    const avg = Number(ratingAvg) || 0
    if (count > 0 && avg > 0) {
        add(
            `What do customers say about ${name}?`,
            `${name} is rated ${avg.toFixed(1)} out of 5 from ${count} customer ${count === 1 ? 'review' : 'reviews'}. You can read them, or add your own, in the reviews section on this page.`
        )
    }

    add(`How soon will ${name} be delivered?`, DELIVERY)
    add(`Can I return ${name}?`, RETURNS)
    add(
        `Can I order ${name} in bulk or for gifting?`,
        `You can add up to ${MAX_CART_QTY} packs of each size to one order. For larger quantities, corporate gifting or custom hampers, contact us with what you need and we will confirm availability and volume pricing.`
    )

    // Then what shoppers ask about the aisle, minus delivery (answered above).
    if (category?.slug && category?.name) {
        const seen = new Set(faqs.map((faq) => faq.q.toLowerCase()))
        const productItems = itemsIn(name)
        const categoryFaqs = (getCategorySeo(category.slug, category.name).faqs || [])
            .filter((faq) => faq?.q && faq?.a && !/\b(deliver|shipping|ship)\b/i.test(faq.q) && !seen.has(faq.q.toLowerCase()))
            .map((faq, index) => ({ faq, index, score: relevance(itemsIn(faq.q), productItems) }))
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score || a.index - b.index)
            .slice(0, MAX_CATEGORY_FAQS)
            .map((entry) => entry.faq)
        faqs.push(...categoryFaqs)
    }

    return faqs.slice(0, MAX_FAQS)
}
