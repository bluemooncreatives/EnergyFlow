import test from 'node:test'
import assert from 'node:assert/strict'
import { productPath, withProductQuery } from '../lib/productRoute.js'
import ProductModel from '../models/Product.model.js'

test('category-aware links use the same path for cards, checkout and metadata', () => {
    assert.equal(productPath({ slug: 'Chia-Seed', category: { slug: 'Seeds' } }), '/shop/seeds/chia-seed')
    assert.equal(productPath({ url: 'chia-seed', categorySlug: 'seeds' }), '/shop/seeds/chia-seed')
    assert.equal(productPath('chia-seed', 'seeds'), '/shop/seeds/chia-seed')
})

test('legacy carts resolve via the legacy route; missing items lead to shop', () => {
    assert.equal(productPath({ url: 'chia-seed' }), '/product/chia-seed')
    assert.equal(productPath(null), '/shop')
    assert.equal(productPath({ slug: ' ' }), '/shop')
    assert.equal(productPath({ slug: 'chia-seed', category: 'database-id' }), '/product/chia-seed')
})

test('segments cannot inject paths, queries or external redirect destinations', () => {
    assert.equal(productPath('tea/bag?x=1#top', 'a&b'), '/shop/a%26b/tea%2Fbag%3Fx%3D1%23top')
    assert.equal(productPath('//example.com'), '/product/%2F%2Fexample.com')
})

test('redirects preserve pack size and repeated campaign parameters', () => {
    const result = withProductQuery('/shop/seeds/chia', { size: '500 g', utm_source: ['a', 'b'], absent: undefined })
    assert.equal(result, '/shop/seeds/chia?size=500+g&utm_source=a&utm_source=b')
    assert.equal(withProductQuery('/shop/seeds/chia'), '/shop/seeds/chia')
})

const fixture = () => new ProductModel({
    name: 'Chia seed', parentSku: 'TEST-CHIA', slug: 'chia-seed',
    category: '507f1f77bcf86cd799439011', mrp: 100, sellingPrice: 80,
    discountPercentage: 20, description: 'Test fixture',
})

test('new products reserve their slug and renamed products retain all aliases', async () => {
    const exists = ProductModel.exists
    const findById = ProductModel.findById
    try {
        ProductModel.exists = async () => null
        const product = fixture()
        await product.validate()
        assert.deepEqual([...product.routeSlugs], ['chia-seed'])
        product.isNew = false
        ProductModel.findById = () => ({ select: () => ({ lean: async () => ({ slug: 'chia-seed', routeSlugs: ['old-chia', 'chia-seed'] }) }) })
        product.slug = 'organic-chia'
        await product.validate()
        assert.deepEqual([...product.routeSlugs], ['old-chia', 'chia-seed', 'organic-chia'])
    } finally {
        ProductModel.exists = exists
        ProductModel.findById = findById
    }
})

test('a historical slug cannot be assigned to another product', async () => {
    const exists = ProductModel.exists
    try {
        ProductModel.exists = async () => ({ _id: 'another-product' })
        await assert.rejects(fixture().validate(), /already reserved/)
    } finally {
        ProductModel.exists = exists
    }
})
