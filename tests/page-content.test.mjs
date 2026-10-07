import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_GIFT_PAGE, mergeGiftPage } from '../lib/pageContent/giftPage.js'
import { DEFAULT_ABOUT_PAGE, mergeAboutPage } from '../lib/pageContent/aboutPage.js'
import { aboutPageSchema, giftPageSchema, firstIssue } from '../lib/pageContent/schema.js'
import { collectImages, fillTokens, mergeContent, paragraphs } from '../lib/pageContent/shared.js'

const gift = () => structuredClone(DEFAULT_GIFT_PAGE)
const about = () => structuredClone(DEFAULT_ABOUT_PAGE)

test('both pages ship valid defaults', () => {
    assert.equal(giftPageSchema.safeParse(gift()).success, true, firstIssue(giftPageSchema.safeParse(gift()).error))
    assert.equal(aboutPageSchema.safeParse(about()).success, true, firstIssue(aboutPageSchema.safeParse(about()).error))
})

test('a missing or partial document keeps the designed page', () => {
    assert.deepEqual(mergeGiftPage(null), DEFAULT_GIFT_PAGE)
    const merged = mergeGiftPage({ hero: { wordmark: 'Diwali Gifts' }, ticker: { enabled: false } })
    assert.equal(merged.hero.wordmark, 'Diwali Gifts')
    assert.equal(merged.hero.caption, DEFAULT_GIFT_PAGE.hero.caption)
    assert.equal(merged.ticker.enabled, false)
    assert.deepEqual(merged.ticker.items, DEFAULT_GIFT_PAGE.ticker.items)
})

test('stored lists replace the defaults and old items gain new fields', () => {
    const merged = mergeGiftPage({ promise: { items: [{ title: 'Only one' }] }, ticker: { items: [] } })
    assert.equal(merged.promise.items.length, 1)
    assert.deepEqual(merged.promise.items[0].tags, [])
    assert.equal(merged.promise.items[0].image.position, 'center')
    assert.deepEqual(merged.ticker.items, [])
})

test('tampered types never reach the storefront', () => {
    const merged = mergeGiftPage({
        hero: { wordmark: 42, image: 'not-an-object' },
        ticker: { items: ['ok', 7, null, { x: 1 }] },
        occasions: { items: ['bad', { title: 'Good' }] },
        unknown: { danger: true },
    })
    assert.equal(merged.hero.wordmark, DEFAULT_GIFT_PAGE.hero.wordmark)
    assert.deepEqual(merged.hero.image, DEFAULT_GIFT_PAGE.hero.image)
    assert.deepEqual(merged.ticker.items, ['ok'])
    assert.equal(merged.occasions.items.length, 1)
    assert.equal(merged.occasions.items[0].occasion, 'other')
    assert.equal('unknown' in merged, false)
})

test('merging never mutates the defaults', () => {
    const before = JSON.stringify(DEFAULT_ABOUT_PAGE)
    const merged = mergeAboutPage({ hero: { title: 'Changed' } })
    merged.leadership.people[0].name = 'Mutated'
    merged.promise.photo.url = ''
    merged.hero.stats.push({ value: 'x', label: 'y' })
    assert.equal(merged.hero.title, 'Changed')
    assert.equal(JSON.stringify(DEFAULT_ABOUT_PAGE), before)
})

test('images need alt text and must come from the media library', () => {
    const value = gift()
    value.hero.image = { mediaId: '', url: 'https://res.cloudinary.com/x/image/upload/a.jpg', alt: '', position: 'center' }
    assert.equal(giftPageSchema.safeParse(value).success, false)
    value.hero.image.alt = 'A gift box'
    assert.equal(giftPageSchema.safeParse(value).success, true)
    for (const url of ['http://res.cloudinary.com/x/image/upload/a.jpg', 'https://evil.example/a.jpg', 'javascript:alert(1)', '//evil.example/a.jpg']) {
        value.hero.image.url = url
        assert.equal(giftPageSchema.safeParse(value).success, false, url)
    }
    value.hero.image.url = 'https://res.cloudinary.com/x/image/upload/a.jpg'
    value.hero.image.mediaId = 'not-an-id'
    assert.equal(giftPageSchema.safeParse(value).success, false)
})

test('links accept storefront paths and https only', () => {
    const value = about()
    for (const href of ['javascript:alert(1)', '//evil.example', 'http://x.com', 'shop', '/shop now']) {
        value.work.tabs[0].ctaHref = href
        assert.equal(aboutPageSchema.safeParse(value).success, false, href)
    }
    for (const href of ['/contact', '/category/gift-boxes#enquire', 'https://wa.me/919289657742']) {
        value.work.tabs[0].ctaHref = href
        assert.equal(aboutPageSchema.safeParse(value).success, true, href)
    }
})

test('occasions only open enquiry occasions the form knows', () => {
    const value = gift()
    value.occasions.items[0].occasion = 'birthday-party'
    assert.equal(giftPageSchema.safeParse(value).success, false)
})

test('an enabled ticker needs at least two phrases', () => {
    const value = gift()
    value.ticker.items = ['Only one']
    assert.equal(giftPageSchema.safeParse(value).success, false)
    value.ticker.enabled = false
    assert.equal(giftPageSchema.safeParse(value).success, true)
})

test('list limits hold', () => {
    const value = gift()
    value.faq.items = Array.from({ length: 16 }, (_, i) => ({ question: `Q${i}?`, answer: 'A.' }))
    assert.equal(giftPageSchema.safeParse(value).success, false)
    value.faq.items = value.faq.items.slice(0, 15)
    assert.equal(giftPageSchema.safeParse(value).success, true)
})

test('collectImages finds every image slot, nested in lists too', () => {
    const slots = collectImages(DEFAULT_ABOUT_PAGE)
    // promise ×2, sourcing, people ×2, testimonials, tabs ×3, visit photos ×3
    assert.equal(slots.length, 15)
    assert.equal(collectImages(DEFAULT_GIFT_PAGE).length, 1 + 5 + 4 + 1 + 4 + 1 + 1)
})

test('helpers: paragraphs and tokens', () => {
    assert.deepEqual(paragraphs('One\nline.\n\n  Two.  \n\n\n'), ['One line.', 'Two.'])
    assert.deepEqual(fillTokens('{products}+', { products: 1250 }), { text: '1,250+', empty: false })
    assert.equal(fillTokens('{products}+', { products: 0 }).empty, true)
    assert.equal(fillTokens('{unknown} days', {}).text, '{unknown} days')
    assert.deepEqual(mergeContent({ a: 1 }, { a: '1' }), { a: 1 })
})
