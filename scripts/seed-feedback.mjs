import env from '@next/env'
import mongoose from 'mongoose'
import ReviewModel from '../models/Review.model.js'
import TestimonialModel from '../models/Testimonial.model.js'
import { buildFeedbackDrafts } from './data/indian-feedback.mjs'

env.loadEnvConfig(process.cwd())

const args = process.argv.slice(2)
if (args.some((arg) => !['--write', '--dry-run'].includes(arg)) || (args.includes('--write') && args.includes('--dry-run'))) {
    console.error('Usage: npm run db:seed-feedback -- [--dry-run | --write]')
    process.exit(1)
}
const write = args.includes('--write')
const dbName = process.env.MONGODB_DB_NAME || 'YT-NEXTJS-ECOMMERCE'

try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in .env.local or .env.')
    await mongoose.connect(process.env.MONGODB_URI, { dbName, serverSelectionTimeoutMS: 15000, autoIndex: false })
    const db = mongoose.connection.db
    const [categories, variantProducts, last] = await Promise.all([
        db.collection('categories').distinct('_id', { deletedAt: null }),
        db.collection('productvariants').distinct('product', { deletedAt: null }),
        TestimonialModel.findOne({ deletedAt: null }).sort({ sortOrder: -1 }).select('sortOrder').lean(),
    ])
    const products = await db.collection('products').find({
        deletedAt: null, category: { $in: categories }, _id: { $in: variantProducts },
    }, { projection: { _id: 1, name: 1, slug: 1 } }).toArray()
    const { reviews, testimonials, skipped } = buildFeedbackDrafts(products, (last?.sortOrder ?? -1) + 1)
    if (!reviews.length) throw new Error('No matching live catalogue products. No records were written.')

    // Validate everything before the first write; reruns only insert missing
    // seed keys and preserve edits, hiding, trash state and original timestamps.
    for (const data of reviews) await new ReviewModel(data).validate()
    for (const data of testimonials) await new TestimonialModel(data).validate()
    const report = {
        mode: write ? 'write' : 'dry-run', database: dbName,
        matchedProducts: new Set(reviews.map((review) => String(review.product))).size,
        plannedReviews: reviews.length, plannedTestimonials: testimonials.length, skipped,
    }

    if (write) {
        await ReviewModel.createIndexes()
        await TestimonialModel.createIndexes()
        const insertedAt = new Date()
        const operations = (docs) => docs.map((doc) => ({
            updateOne: {
                filter: { seedKey: doc.seedKey },
                update: { $setOnInsert: { ...doc, createdAt: insertedAt, updatedAt: insertedAt } },
                upsert: true, timestamps: false,
            },
        }))
        const reviewResult = await ReviewModel.bulkWrite(operations(reviews), { timestamps: false })
        const testimonialResult = testimonials.length
            ? await TestimonialModel.bulkWrite(operations(testimonials), { timestamps: false }) : null
        report.insertedReviews = reviewResult.upsertedCount
        report.insertedTestimonials = testimonialResult?.upsertedCount || 0
        report.existingReviews = reviewResult.matchedCount
        report.existingTestimonials = testimonialResult?.matchedCount || 0
        report.modifiedExistingRecords = reviewResult.modifiedCount + (testimonialResult?.modifiedCount || 0)
        report.visibility = 'Unpublished drafts; excluded from public ratings and customer statistics.'
    }
    console.log(JSON.stringify(report, null, 2))
} catch (error) {
    // Never print connection credentials, including any reflected driver URI.
    console.error(`${error.name}: ${String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[redacted]')}`)
    process.exitCode = 1
} finally {
    await mongoose.disconnect()
}
