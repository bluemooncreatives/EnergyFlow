import mongoose from 'mongoose'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { revalidateReviews } from '@/lib/reviewCache'
import ReviewModel from '@/models/Review.model'

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        const payload = await request.json()
        if (!payload?._id || !mongoose.isValidObjectId(String(payload._id))) {
            return response(false, 400, 'Invalid review id.')
        }
        if (!['draft', 'live'].includes(payload.status)) {
            return response(false, 400, 'Status must be draft or live.')
        }

        await connectDB()
        const review = await ReviewModel.findOne({ _id: payload._id, deletedAt: null })
        if (!review) return response(false, 404, 'Review not found.')

        review.isDraft = payload.status === 'draft'
        await review.save()
        revalidateReviews()
        return response(true, 200, payload.status === 'live' ? 'Review is now live.' : 'Review moved to draft.', {
            _id: review._id, isDraft: review.isDraft,
        })
    } catch (error) {
        return catchError(error)
    }
}
