import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import ReviewModel from "@/models/Review.model"

export async function POST(request) {
    try {
        // Pass the request so Google (NextAuth) sign-ins are recognised too,
        // not only the email/password cookie.
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 403, 'Please sign in to write a review.')
        }

        await connectDB()
        const payload = await request.json()

        const schema = zSchema.pick({
            product: true,
            rating: true,
            title: true,
            review: true
        })

        const validate = schema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        const { product, title, review } = validate.data
        const rating = Math.round(Number(validate.data.rating))
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            return response(false, 400, 'Please choose a rating from 1 to 5 stars.')
        }

        // The author is always the signed-in user — never an id sent by the
        // browser, which anyone could set to someone else's.
        const newReview = new ReviewModel({
            product,
            user: auth.userId,
            rating,
            title: title.trim(),
            review: review.trim(),
        })

        await newReview.save()

        // Rating summaries are cached on the product page and product cards;
        // refresh them so the new review shows straight away.
        revalidateTag('storefront-product-details')
        revalidateTag('storefront-related-products')
        revalidateTag('storefront-freshly-arrived-products')
        revalidateTag('storefront-daily-best-sells')

        return response(true, 200, 'Thanks! Your review has been posted.')

    } catch (error) {
        return catchError(error)
    }
}
