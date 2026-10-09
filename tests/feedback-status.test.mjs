import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import mongoose from 'mongoose'
import { z } from 'zod'
import ReviewModel from '../models/Review.model.js'

const id = '507f1f77bcf86cd799439011'
const load = (path, modules) => {
    const context = { exports: {}, require: (name) => {
        if (!(name in modules)) throw new Error(`Missing test dependency: ${name}`)
        return modules[name]
    } }
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: false,
    } }).outputText, context)
    return context.exports
}

// Execute the real handlers against isolated records; never modify the store DB.
const app = () => {
    let authenticated = true
    let writes = 0
    const tags = []
    const review = new ReviewModel({
        _id: id, product: new mongoose.Types.ObjectId(), reviewerName: 'Priya Sharma',
        isDraft: true, rating: 4, title: 'Evening snack', review: 'A pleasant snack with chai.',
    })
    review.save = async () => { await review.validate(); writes++ }
    let testimonial = { _id: id, name: 'Priya Sharma', review: 'A pleasant snack with chai.', rating: 4, isDraft: true, isActive: false, deletedAt: null }
    const modules = {
        mongoose: { default: mongoose },
        'next/cache': { revalidateTag: (tag) => tags.push(tag) },
        '@/lib/authentication': { isAuthenticated: async () => ({ isAuth: authenticated }) },
        '@/lib/databaseConnection': { connectDB: async () => {} },
        '@/lib/helperFunction': {
            response: (success, statusCode, message, data) => ({ success, statusCode, message, data }),
            catchError: (error) => { throw error },
        },
        '@/lib/zodSchema': { zSchema: z.object({ name: z.string().min(1), review: z.string().min(1), testimonialRating: z.number().min(1).max(5) }) },
        '@/lib/services/testimonialService': { TESTIMONIALS_TAG: 'storefront-testimonials' },
        '@/models/Review.model': { default: { findOne: async (filter) => String(review._id) === filter._id && !review.deletedAt ? review : null } },
        '@/models/Testimonial.model': { default: {
            findOneAndUpdate: (filter, update) => ({ lean: async () => {
                if (testimonial._id !== filter._id || testimonial.deletedAt) return null
                Object.assign(testimonial, update.$set)
                writes++
                return testimonial
            } }),
            findOne: () => ({ sort: () => ({ select: () => ({ lean: async () => ({ sortOrder: 1 }) }) }) }),
            create: async (fields) => { testimonial = { _id: id, deletedAt: null, ...fields }; writes++ },
        } },
    }
    modules['@/lib/reviewCache'] = load('../lib/reviewCache.js', modules)
    const updateReview = load('../app/api/review/update/route.js', modules).PUT
    const updateTestimonial = load('../app/api/testimonial/update/route.js', modules).PUT
    const createTestimonial = load('../app/api/testimonial/route.js', modules).POST
    const request = (payload) => ({ json: async () => payload })
    return {
        review, tags,
        get testimonial() { return testimonial },
        get writes() { return writes },
        deny: () => { authenticated = false },
        updateReview: (payload) => updateReview(request({ _id: id, ...payload })),
        updateTestimonial: (payload) => updateTestimonial(request({ _id: id, ...payload })),
        createTestimonial: (payload) => createTestimonial(request(payload)),
    }
}

test('an admin can publish a named review, then return it to draft without losing its author', async () => {
    const api = app()
    assert.equal((await api.updateReview({ status: 'live', reviewerName: 'Tampered author' })).success, true)
    assert.equal(api.review.isDraft, false)
    assert.equal(api.review.reviewerName, 'Priya Sharma')
    assert.equal(api.review.user, undefined)
    assert.ok(api.tags.includes('storefront-product-details'))
    assert.ok(api.tags.includes('storefront-store-stats'))
    assert.ok(api.tags.includes('storefront-shop-default-products'))
    assert.ok(api.tags.includes('storefront-home-categories'))
    assert.equal((await api.updateReview({ status: 'draft' })).success, true)
    assert.equal(api.review.isDraft, true)
    assert.equal(api.writes, 2)
})

test('a customer review keeps its account reference when hidden and republished', async () => {
    const api = app()
    const user = new mongoose.Types.ObjectId()
    api.review.user = user
    api.review.reviewerName = undefined
    for (const status of ['draft', 'live']) assert.equal((await api.updateReview({ status })).success, true)
    assert.equal(String(api.review.user), String(user))
    assert.equal(api.review.isDraft, false)
})

test('testimonial publication updates both flags and edits preserve visibility', async () => {
    const api = app()
    assert.equal((await api.updateTestimonial({ status: 'live' })).success, true)
    assert.equal(api.testimonial.isDraft, false)
    assert.equal(api.testimonial.isActive, true)
    assert.equal((await api.updateTestimonial({ name: 'Priya', review: 'Updated quote', testimonialRating: 5 })).success, true)
    assert.equal(api.testimonial.isActive, true)
    assert.equal((await api.updateTestimonial({ status: 'draft' })).success, true)
    assert.equal(api.testimonial.isDraft, true)
    assert.equal(api.testimonial.isActive, false)
    assert.ok(api.tags.includes('storefront-testimonials'))
})

test('new testimonials persist the selected state and legacy active toggles stay consistent', async () => {
    const api = app()
    const content = { name: 'Priya', review: 'A pleasant snack', testimonialRating: 4 }
    for (const status of ['draft', 'live']) {
        assert.equal((await api.createTestimonial({ ...content, status })).success, true)
        assert.equal(api.testimonial.isDraft, status === 'draft')
        assert.equal(api.testimonial.isActive, status === 'live')
    }
    await api.updateTestimonial({ isActive: false })
    assert.equal(api.testimonial.isDraft, true)
    await api.updateTestimonial({ isActive: true })
    assert.equal(api.testimonial.isDraft, false)
})

test('status endpoints reject invalid input, deleted records and unauthorized changes', async () => {
    const api = app()
    for (const update of [api.updateReview, api.updateTestimonial]) {
        for (const status of ['hidden', true, null, 'LIVE']) assert.equal((await update({ status })).statusCode, 400)
        assert.equal((await update({ _id: 'invalid', status: 'live' })).statusCode, 400)
        assert.equal((await update({ _id: '507f1f77bcf86cd799439012', status: 'live' })).statusCode, 404)
    }
    assert.equal(api.writes, 0)
    api.review.deletedAt = new Date()
    api.testimonial.deletedAt = new Date()
    assert.equal((await api.updateReview({ status: 'live' })).statusCode, 404)
    assert.equal((await api.updateTestimonial({ status: 'live' })).statusCode, 404)
    api.deny()
    assert.equal((await api.updateReview({ status: 'live' })).statusCode, 403)
    assert.equal((await api.updateTestimonial({ status: 'live' })).statusCode, 403)
    assert.equal((await api.createTestimonial({ status: 'live' })).statusCode, 403)
    assert.equal(api.writes, 0)
    assert.equal(api.tags.length, 0)
})

test('storefront review lists and rating summaries follow visibility, preserving named authors', async () => {
    const api = app()
    const matches = (record, query) => !record.deletedAt && (!query.isDraft || record.isDraft !== query.isDraft.$ne)
    const evaluate = (expression, record) => {
        if (typeof expression === 'string' && expression.startsWith('$')) {
            return expression.slice(1).split('.').reduce((value, key) => value?.[key], record)
        }
        if (expression?.$ifNull) return evaluate(expression.$ifNull[0], record) ?? evaluate(expression.$ifNull[1], record)
        return expression
    }
    const modules = {
        mongoose: { default: mongoose },
        '@/lib/databaseConnection': { connectDB: async () => {} },
        '@/lib/helperFunction': {
            response: (success, statusCode, message, data) => ({ success, statusCode, message, data }),
            catchError: (error) => { throw error },
        },
        '@/models/Review.model': { default: {
            countDocuments: async (query) => matches(api.review, query) ? 1 : 0,
            aggregate: async (pipeline) => {
                if (!matches(api.review, pipeline[0].$match)) return []
                if (pipeline.some((stage) => stage.$group)) return [{ _id: api.review.rating, count: 1 }]
                const projection = pipeline.find((stage) => stage.$project).$project
                return [Object.fromEntries(Object.entries(projection).map(([key, expression]) => [key,
                    expression === 1 ? api.review[key] : evaluate(expression, api.review),
                ]))]
            },
        } },
    }
    const list = load('../app/api/review/get/route.js', modules).GET
    const summary = load('../app/api/review/details/route.js', modules).GET
    const request = { nextUrl: { searchParams: new URLSearchParams({ productId: String(api.review.product) }) } }
    assert.equal((await list(request)).data.reviews.length, 0)
    assert.equal((await summary(request)).data.totalReview, 0)
    await api.updateReview({ status: 'live' })
    const visible = (await list(request)).data
    assert.equal(visible.reviews.length, 1)
    assert.equal(visible.reviews[0].reviewedBy, 'Priya Sharma')
    assert.equal(visible.totalReview, 1)
    assert.equal((await summary(request)).data.averageRating, '4.0')
    await api.updateReview({ status: 'draft' })
    assert.equal((await list(request)).data.reviews.length, 0)
    assert.equal((await summary(request)).data.totalReview, 0)
})

test('the cached storefront testimonial read shows only live, non-deleted quotes', async () => {
    const api = app()
    const { getTestimonials } = load('../lib/services/testimonialService.js', {
        'next/cache': { unstable_cache: (fn) => fn },
        '@/lib/databaseConnection': { connectDB: async () => {} },
        '@/models/Testimonial.model': { default: {
            find: (query) => ({ sort: () => ({ select: () => ({ lean: async () => {
                const row = api.testimonial
                return row.deletedAt === query.deletedAt && row.isActive === query.isActive && row.isDraft !== query.isDraft.$ne
                    ? [row] : []
            } }) }) }),
        } },
    })
    assert.equal((await getTestimonials()).length, 0)
    await api.updateTestimonial({ status: 'live' })
    assert.equal((await getTestimonials())[0].name, 'Priya Sharma')
    await api.updateTestimonial({ status: 'draft' })
    assert.equal((await getTestimonials()).length, 0)
    await api.updateTestimonial({ status: 'live' })
    api.testimonial.deletedAt = new Date()
    assert.equal((await getTestimonials()).length, 0)
})
