import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { categorySchema, categoryUpdateSchema } from '../lib/categoryConfig.js'
import { categoryCover, resolveCategoryArt, isCategoryCoverUrl } from '../lib/categoryCover.js'
import CategoryModel from '../models/Category.model.js'

const firstId = '507f1f77bcf86cd799439011'
const secondId = '507f1f77bcf86cd799439012'
const categoryId = '507f1f77bcf86cd799439013'
const photo = (id, name = 'cover') => ({ _id: id, secure_url: `https://res.cloudinary.com/store/image/upload/v1/${name}.jpg`, alt: 'Library description', deletedAt: null })

const load = (path, modules) => {
    const context = { exports: {}, require: (name) => {
        if (!(name in modules)) throw new Error(`Missing test dependency: ${name}`)
        return modules[name]
    } }
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: false } }).outputText, context)
    return context.exports
}

// Real request handlers and validation, with in-memory persistence so these
// tests never upload assets or mutate the connected store's catalogue.
const app = () => {
    let record = null
    let authenticated = true
    let refreshes = 0
    const assets = new Map([[firstId, photo(firstId)], [secondId, photo(secondId, 'replacement')]])
    class Category {
        constructor(fields) { Object.assign(this, { _id: categoryId }, fields) }
        async save() { record = this }
        static findOne() {
            return {
                then: (resolve) => Promise.resolve(record).then(resolve),
                populate: () => ({ lean: async () => record ? {
                    ...record,
                    coverImage: assets.get(record.coverImage)?.deletedAt === null ? assets.get(record.coverImage) : null,
                } : null }),
            }
        }
    }
    const modules = {
        '@/lib/categoryConfig': { categorySchema, categoryUpdateSchema },
        '@/lib/categoryCover': { isCategoryCoverUrl },
        '@/models/Category.model': { default: Category },
        '@/models/Media.model': { default: { findOne: ({ _id }) => ({ select: () => ({ lean: async () => {
            const asset = assets.get(_id)
            return asset?.deletedAt === null ? asset : null
        } }) }) } },
        '@/lib/authentication': { isAuthenticated: async () => ({ isAuth: authenticated }) },
        '@/lib/databaseConnection': { connectDB: async () => {} },
        '@/lib/helperFunction': {
            response: (success, statusCode, message, data) => ({ success, statusCode, message, data }),
            catchError: (error) => { throw error },
        },
        '@/lib/catalogueCache': { revalidateCatalogue: () => { refreshes++ } },
        'next/cache': { revalidateTag: () => {} },
        mongoose: { isValidObjectId: (id) => /^[a-f\d]{24}$/i.test(id) },
    }
    modules['@/lib/services/categoryCoverService'] = load('../lib/services/categoryCoverService.js', modules)
    const create = load('../app/api/category/create/route.js', modules).POST
    const update = load('../app/api/category/update/route.js', modules).PUT
    const get = load('../app/api/category/get/[id]/route.js', modules).GET
    const request = (data) => ({ json: async () => data })
    return {
        assets,
        create: (data) => create(request(data)),
        update: (data) => update(request({ _id: categoryId, ...data })),
        get: () => get({}, { params: Promise.resolve({ id: categoryId }) }),
        deny: () => { authenticated = false },
        get refreshes() { return refreshes },
    }
}

test('category covers persist through create, reload, replace and remove, refreshing the storefront each time', async () => {
    const api = app()
    const fields = { name: 'Nuts', slug: 'nuts', coverImage: firstId, coverAlt: 'A bowl of nuts', coverPosition: 'top' }
    assert.equal((await api.create(fields)).success, true)
    let saved = (await api.get()).data
    assert.equal(saved.coverImage._id, firstId)
    const cover = categoryCover(saved)
    assert.equal(cover.alt, fields.coverAlt)
    assert.equal(cover.position, 'top')
    assert.equal(resolveCategoryArt({ cover }, { src: '/hardcoded.jpg' }).src, photo(firstId).secure_url)

    assert.equal((await api.update({ name: 'Nuts', slug: 'nuts' })).success, true)
    assert.equal((await api.get()).data.coverImage._id, firstId, 'older payloads preserve saved covers')
    assert.equal((await api.update({ ...fields, coverImage: secondId })).success, true)
    assert.equal((await api.get()).data.coverImage._id, secondId)
    assert.equal((await api.update({ ...fields, coverImage: null })).success, true)
    saved = (await api.get()).data
    assert.equal(categoryCover(saved), null)
    assert.equal(resolveCategoryArt({ cover: categoryCover(saved), previewImage: '/product.jpg' }).src, '/product.jpg')
    assert.equal(api.refreshes, 4)
})

test('invalid, missing and trashed media cannot be saved as category covers', async () => {
    const api = app()
    for (const coverImage of ['broken', categoryId]) {
        assert.equal((await api.create({ name: 'Nuts', slug: 'nuts', coverImage })).statusCode, 400)
    }
    api.assets.get(firstId).deletedAt = new Date()
    assert.equal((await api.create({ name: 'Nuts', slug: 'nuts', coverImage: firstId })).statusCode, 400)
    api.assets.set(firstId, { ...photo(firstId), secure_url: 'https://example.com/image.jpg' })
    assert.equal((await api.create({ name: 'Nuts', slug: 'nuts', coverImage: firstId })).statusCode, 400)
    assert.equal(api.refreshes, 0)
})

test('category mutation and read handlers reject unauthenticated requests', async () => {
    const api = app()
    api.deny()
    assert.equal((await api.create({})).statusCode, 403)
    assert.equal((await api.update({})).statusCode, 403)
    assert.equal((await api.get()).statusCode, 403)
    assert.equal(api.refreshes, 0)
})

test('deleted assets fall back and restored assets regain their saved cover settings', () => {
    const media = photo(firstId)
    const category = { name: 'Nuts', coverImage: media, coverPosition: 'right' }
    assert.equal(categoryCover(category).alt, 'Library description')
    media.deletedAt = new Date()
    assert.equal(categoryCover(category), null)
    media.deletedAt = null
    assert.equal(categoryCover(category).position, 'right')
    delete media.alt
    assert.equal(categoryCover(category).alt, 'Nuts')
    assert.equal(categoryCover({ ...category, coverImage: firstId }), null)
})

test('schema validates cover IDs, alt length and crop focus; Mongoose retains the fields', async () => {
    const base = { name: 'Nuts', slug: 'nuts', coverImage: firstId, coverAlt: 'Almonds', coverPosition: 'bottom' }
    for (const invalid of [{ coverPosition: 'outside' }, { coverAlt: 'x'.repeat(201) }, { coverImage: 'https://example.com/a.jpg' }]) {
        assert.equal(categorySchema.safeParse({ ...base, ...invalid }).success, false)
    }
    const doc = new CategoryModel(base)
    await doc.validate()
    assert.equal(String(doc.coverImage), firstId)
    assert.equal(doc.coverAlt, base.coverAlt)
    assert.equal(doc.coverPosition, base.coverPosition)
})
