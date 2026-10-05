import test from 'node:test'
import assert from 'node:assert/strict'
import {
    DEFAULT_DEAL_SETTINGS,
    dealDeadline,
    dealHasEnded,
    dealSettingsSchema,
    mergeDealSettings,
} from '../lib/dealsConfig.js'

const settings = () => structuredClone(DEFAULT_DEAL_SETTINGS)

test('default settings and partial stored documents retain the storefront design', () => {
    assert.equal(dealSettingsSchema.safeParse(settings()).success, true)
    const merged = mergeDealSettings({ section: { enabled: false }, banner: { title: 'October gifts' } })
    assert.equal(merged.section.enabled, false)
    assert.equal(merged.banner.title, 'October gifts')
    assert.equal(merged.banner.buttonText, 'Shop now')
    assert.deepEqual(merged.countdown, DEFAULT_DEAL_SETTINGS.countdown)
})

test('custom offers require a future deadline and stop at the exact deadline', () => {
    const value = settings()
    value.countdown.mode = 'custom'
    for (const endsAt of ['', 'invalid', '2020-01-01T00:00:00Z']) {
        value.countdown.endsAt = endsAt
        assert.equal(dealSettingsSchema.safeParse(value).success, false)
    }
    value.countdown.endsAt = new Date(Date.now() + 86400000).toISOString()
    assert.equal(dealSettingsSchema.safeParse(value).success, true)
    const deadline = new Date(value.countdown.endsAt)
    assert.equal(dealHasEnded(value.countdown, new Date(deadline.getTime() - 1)), false)
    assert.equal(dealHasEnded(value.countdown, deadline), true)
    assert.equal(dealHasEnded({ mode: 'custom', endsAt: '' }), true)
})

test('monthly timers roll into the next year and off mode has no expiry', () => {
    assert.deepEqual(dealDeadline({ mode: 'month-end' }, new Date(2026, 11, 15)), new Date(2027, 0, 1))
    assert.equal(dealDeadline({ mode: 'off' }), null)
    assert.equal(dealHasEnded({ mode: 'off', endsAt: '2020-01-01' }), false)
})

test('banner images accept media-library URLs and reject sources the image optimizer cannot render', () => {
    for (const url of ['', '/assets/images/banner/gift-box-deal.jpg', 'https://res.cloudinary.com/store/image/upload/gift.jpg']) {
        const value = settings()
        value.banner.image.url = url
        assert.equal(dealSettingsSchema.safeParse(value).success, true, url)
    }
    for (const url of ['//example.com/photo.jpg', '/\\example.com/photo.jpg', 'https://example.com/photo.jpg', 'https://res.cloudinary.com:444/photo.jpg', 'https://res.cloudinary.com/photo.jpg?x=1']) {
        const value = settings()
        value.banner.image.url = url
        assert.equal(dealSettingsSchema.safeParse(value).success, false, url)
    }
    const value = settings()
    value.banner.image = { url: '/assets/photo.jpg', alt: '' }
    assert.equal(dealSettingsSchema.safeParse(value).success, false)
})

test('banner links accept storefront paths and valid HTTPS destinations', () => {
    for (const link of ['/shop', '/shop?category=gifts', 'https://example.com/gifts']) {
        const value = settings()
        value.banner.link = link
        assert.equal(dealSettingsSchema.safeParse(value).success, true, link)
    }
    for (const link of ['', '//example.com', '/\\example.com', 'https://', 'http://example.com', 'javascript:alert(1)']) {
        const value = settings()
        value.banner.link = link
        assert.equal(dealSettingsSchema.safeParse(value).success, false, link)
    }
})
