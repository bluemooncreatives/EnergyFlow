import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as crypto from 'node:crypto'
import { z } from 'zod'
import { isCategoryCoverUrl } from '../lib/categoryCover.js'

function harness() {
    const records = new Map()
    let authenticated = true
    let failSave = false
    let cloudFailure = false
    let deleteCalls = 0
    let refreshes = 0
    let cloudDeleted = null
    const asset = { asset_id: 'asset-one', public_id: 'cover', secure_url: 'https://res.cloudinary.com/store/image/upload/v1/cover.jpg', format: 'jpg', resource_type: 'image', type: 'upload', bytes: 1024 }
    const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => {
        if (value && typeof value === 'object') {
            if ('$in' in value) return value.$in.includes(doc[key])
            if ('$nin' in value) return !value.$nin.includes(doc[key])
            if ('$ne' in value) return (doc[key] ?? null) !== value.$ne
        }
        return (doc[key] ?? null) === value
    })
    const media = {
        findOne: (filter) => ({ lean: async () => [...records.values()].find(doc => matches(doc, filter)) || null }),
        find: (filter) => ({ lean: async () => [...records.values()].filter(doc => matches(doc, filter)).map(doc => ({ ...doc })) }),
        exists: async (filter) => [...records.values()].some(doc => matches(doc, filter)),
        distinct: async (key, filter) => [...new Set([...records.values()].filter(doc => matches(doc, filter)).map(doc => doc[key]))],
        findById: async (id) => records.get(id),
        findOneAndUpdate: async ({ _id }, update) => {
            if (failSave) throw new Error('Database unavailable')
            if (!records.has(_id)) records.set(_id, { _id, ...update.$setOnInsert })
            return records.get(_id)
        },
        updateMany: async (filter, update) => {
            for (const doc of records.values()) if (matches(doc, filter)) Object.assign(doc, update.$set)
        },
        deleteMany: async (filter) => {
            for (const [id, doc] of records) if (matches(doc, filter)) records.delete(id)
        },
    }
    const modules = {
        'node:crypto': crypto, zod: { z },
        '@/lib/categoryCover': { isCategoryCoverUrl },
        '@/lib/authentication': { isAuthenticated: async () => ({ isAuth: authenticated }) },
        '@/lib/databaseConnection': { connectDB: async () => {} },
        '@/lib/helperFunction': { response: (success, statusCode, message, data) => ({ success, statusCode, message, data }) },
        '@/models/Media.model': { default: media },
        '@/lib/catalogueCache': { revalidateCatalogue: () => { refreshes++ } },
        '@/lib/cloudinary': { default: { api: {
            resource: async () => ({ ...asset }),
            delete_resources: async (ids) => {
                deleteCalls++
                if (cloudFailure) throw new Error('Cloudinary unavailable')
                return { deleted: cloudDeleted || Object.fromEntries(ids.map(id => [id, 'deleted'])) }
            },
        } } },
    }
    const load = (path) => {
        const context = { exports: {}, require: name => { if (!(name in modules)) throw new Error(name); return modules[name] } }
        vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: false } }).outputText, context)
        return context.exports
    }
    const create = load('../app/api/media/create/route.js').POST
    const deletion = load('../app/api/media/delete/route.js')
    const request = payload => ({ json: async () => payload })
    return {
        records, asset,
        upload: (payload = [{ asset_id: asset.asset_id, public_id: asset.public_id }]) => create(request(payload)),
        change: (ids, deleteType) => deletion.PUT(request({ ids, deleteType })),
        remove: (ids, deleteType = 'PD') => deletion.DELETE(request({ ids, deleteType })),
        deny: () => { authenticated = false },
        failSave: (value) => { failSave = value },
        failCloud: (value) => { cloudFailure = value },
        cloudResults: (value) => { cloudDeleted = value },
        get deleteCalls() { return deleteCalls },
        get refreshes() { return refreshes },
    }
}

test('lost responses and concurrent retries create one media record and retain edited metadata', async () => {
    const app = harness()
    const results = await Promise.all([app.upload(), app.upload()])
    assert.equal(results.every(result => result.success), true)
    assert.equal(app.records.size, 1)
    const doc = [...app.records.values()][0]
    doc.alt = 'Edited description'
    assert.equal((await app.upload()).data[0].alt, 'Edited description')
    assert.equal(app.records.size, 1)
})

test('a failed library save retains the Cloudinary asset and can be retried', async () => {
    const app = harness()
    app.failSave(true)
    assert.equal((await app.upload()).statusCode, 503)
    assert.equal(app.deleteCalls, 0)
    app.failSave(false)
    assert.equal((await app.upload()).success, true)
})

test('server validates actual Cloudinary size and type instead of browser claims', async () => {
    const app = harness()
    const claimed = [{ asset_id: app.asset.asset_id, public_id: app.asset.public_id, bytes: 1 }]
    app.asset.bytes = 6 * 1024 * 1024
    assert.equal((await app.upload(claimed)).statusCode, 413)
    app.asset.bytes = 100
    app.asset.format = 'svg'
    assert.equal((await app.upload(claimed)).statusCode, 400)
    assert.equal((await app.upload(null)).statusCode, 400)
    assert.equal(app.records.size, 0)
    assert.equal(app.deleteCalls, 0)
})

test('trash and restore refresh covers; upload retry cannot silently restore trash', async () => {
    const app = harness()
    const id = (await app.upload()).data[0]._id
    await app.change([id], 'SD')
    assert.equal((await app.upload()).statusCode, 409)
    await app.change([id], 'RSD')
    assert.equal(app.records.get(id).deletedAt, null)
    assert.equal(app.refreshes, 2)
})

test('permanent deletion requires trash and a valid operation; errors remain retryable', async () => {
    const app = harness()
    const id = (await app.upload()).data[0]._id
    assert.equal((await app.remove([id])).statusCode, 409)
    assert.equal((await app.remove([id], 'RSD')).statusCode, 400)
    assert.equal((await app.remove(['bad-id'])).statusCode, 400)
    assert.equal(app.deleteCalls, 0)
    await app.change([id], 'SD')
    app.failCloud(true)
    assert.equal((await app.remove([id])).statusCode, 503)
    assert.equal(app.records.has(id), true)
    assert.equal((await app.change([id], 'RSD')).statusCode, 409, 'cannot restore an asset whose deletion may already have completed')
    app.failCloud(false)
    app.cloudResults({ cover: 'not_found' })
    assert.equal((await app.remove([id])).success, true)
    assert.equal(app.records.size, 0)
    assert.equal((await app.remove([id])).success, true, 'repeated delete is idempotent')
})

test('partial Cloudinary deletions retain failed records for retry', async () => {
    const app = harness()
    const first = (await app.upload()).data[0]._id
    app.asset.asset_id = 'asset-two'; app.asset.public_id = 'second'
    const second = (await app.upload()).data[0]._id
    await app.change([first, second], 'SD')
    app.cloudResults({ cover: 'deleted', second: 'error' })
    assert.equal((await app.remove([first, second])).statusCode, 503)
    assert.equal(app.records.has(first), false)
    assert.equal(app.records.has(second), true)
})

test('unauthenticated requests cannot create, delete or restore media', async () => {
    const app = harness()
    app.deny()
    assert.equal((await app.upload()).statusCode, 403)
    assert.equal((await app.change([], 'RSD')).statusCode, 403)
    assert.equal((await app.remove([])).statusCode, 403)
    assert.equal(app.records.size, 0)
    assert.equal(app.deleteCalls, 0)
})

test('deleting a duplicate library record preserves the shared Cloudinary asset', async () => {
    const app = harness()
    const id = (await app.upload()).data[0]._id
    const duplicateId = '507f1f77bcf86cd799439014'
    app.records.set(duplicateId, { ...app.records.get(id), _id: duplicateId })
    await app.change([id], 'SD')
    assert.equal((await app.remove([id])).success, true)
    assert.equal(app.records.has(duplicateId), true)
    assert.equal(app.deleteCalls, 0)
})
