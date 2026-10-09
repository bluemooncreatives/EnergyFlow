import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import ReviewModel from '../models/Review.model.js'
import TestimonialModel from '../models/Testimonial.model.js'
import { PRODUCT_FEEDBACK, buildFeedbackDrafts } from '../scripts/data/indian-feedback.mjs'

test('only eligible catalogue products receive feedback, with valid references and stable seed keys', async () => {
    const product = { _id: new mongoose.Types.ObjectId(), slug: 'american-badam' }
    const first = buildFeedbackDrafts([product], 12)
    const second = buildFeedbackDrafts([product], 20)
    assert.equal(first.reviews.length, 2)
    assert.equal(first.testimonials.length, 1)
    assert.equal(first.testimonials[0].sortOrder, 12)
    assert.deepEqual(first.reviews.map((row) => row.seedKey), second.reviews.map((row) => row.seedKey))
    for (const row of [...first.reviews, ...first.testimonials]) {
        assert.equal(String(row.product), String(product._id))
        assert.equal(row.isDraft, true)
        assert.equal(row.user, undefined)
    }
    for (const row of first.reviews) await new ReviewModel(row).validate()
    for (const row of first.testimonials) {
        assert.equal(row.isActive, false)
        await new TestimonialModel(row).validate()
    }
})

test('reviews retain a customer reference or display name independently of Draft/Live visibility', async () => {
    const base = { product: new mongoose.Types.ObjectId(), title: 'Great with chai', review: 'The cashews make a nice evening snack.', rating: 4 }
    await new ReviewModel({ ...base, isDraft: true, reviewerName: 'Priya Sharma' }).validate()
    await assert.rejects(new ReviewModel({ ...base, isDraft: true }).validate(), /reviewerName/)
    await new ReviewModel({ ...base, isDraft: false, reviewerName: 'Priya Sharma' }).validate()
    await new ReviewModel({ ...base, isDraft: true, user: new mongoose.Types.ObjectId() }).validate()
    await assert.rejects(new ReviewModel({ ...base, isDraft: false }).validate(), /user|reviewerName/)
    await new ReviewModel({ ...base, user: new mongoose.Types.ObjectId() }).validate()
    for (const rating of [0, 6, 3.5]) {
        await assert.rejects(new ReviewModel({ ...base, rating, user: new mongoose.Types.ObjectId() }).validate(), /rating/)
    }
})

test('the full catalogue plan has no duplicate slugs or records and no account data', () => {
    const slugs = PRODUCT_FEEDBACK.map(([slug]) => slug)
    assert.equal(new Set(slugs).size, slugs.length)
    const { reviews, testimonials, skipped } = buildFeedbackDrafts(slugs.map((slug) => ({ slug, _id: new mongoose.Types.ObjectId() })))
    assert.equal(reviews.length, slugs.length * 2)
    assert.equal(testimonials.length, 8)
    assert.deepEqual(skipped, [])
    const keys = [...reviews, ...testimonials].map((row) => row.seedKey)
    assert.equal(new Set(keys).size, keys.length)
    for (const row of [...reviews, ...testimonials]) {
        assert.ok(row.review.length > 40)
        assert.equal(row.email, undefined)
        assert.equal(row.password, undefined)
        assert.equal(row.avatar, undefined)
    }
    assert.equal(buildFeedbackDrafts([]).reviews.length, 0)
})
