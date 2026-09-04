import { isAuthenticated } from "@/lib/authentication";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/databaseConnection";
import { catchError,  response } from "@/lib/helperFunction";
import MediaModel from "@/models/Media.model";

export async function POST(request) {
    const payload = await request.json()
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024

    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        if (!Array.isArray(payload) || payload.length === 0) {
            return response(false, 400, 'No media provided.')
        }

        const oversized = payload.find((item) => typeof item?.bytes !== 'number' || item.bytes > MAX_IMAGE_BYTES)
        if (oversized) {
            if (payload.length > 0) {
                const publicIds = payload.map(data => data.public_id).filter(Boolean)
                if (publicIds.length > 0) {
                    await cloudinary.api.delete_resources(publicIds)
                }
            }
            return response(false, 413, 'Upload failed. Max image size is 5 MB.')
        }

        await connectDB()
        const newMedia = await MediaModel.insertMany(payload)
        return response(true, 200, 'Media upload successfully.', newMedia)

    } catch (error) {

        if (payload && payload.length > 0) {
            const publicIds = payload.map(data => data.public_id)
            try {
                await cloudinary.api.delete_resources(publicIds)
            } catch (deleteError) {
                error.cloudinary = deleteError
            }
        }

        return catchError(error)
    }
}
