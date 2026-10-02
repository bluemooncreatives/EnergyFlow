import { isAuthenticated } from "@/lib/authentication";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { zSchema } from "@/lib/zodSchema";
import UserModel from "@/models/User.model";
import mongoose from "mongoose";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const PROFILE_KEYS = ['name', 'phone', 'address', 'landmark', 'city', 'state', 'pincode', 'country']

// Same rules as the profile form: name is required, the saved address is an
// optional convenience, so an empty string ("clear this field") is accepted.
const fieldRules = {
    name: zSchema.shape.name,
    phone: zSchema.shape.phone,
    address: zSchema.shape.address,
    landmark: zSchema.shape.landmark,
    city: zSchema.shape.city,
    state: zSchema.shape.state,
    pincode: zSchema.shape.pincode,
    country: zSchema.shape.country,
}

export async function PUT(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        const userId = auth.userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return response(false, 404, 'User not found.')
        }

        const user = await UserModel.findOne({ _id: userId, deletedAt: null })

        if (!user) {
            return response(false, 404, 'User not found.')
        }

        let formData
        try {
            formData = await request.formData()
        } catch {
            return response(false, 400, 'Invalid request body.')
        }
        const file = formData.get('file')

        // Only touch a field when the client actually sent it, so a partial
        // request can never blank out previously-saved data. Empty string is a
        // legitimate "clear this field" value and is preserved.
        for (const key of PROFILE_KEYS) {
            if (!formData.has(key)) continue
            const raw = formData.get(key)
            if (typeof raw !== 'string') {
                return response(false, 400, `Invalid value for ${key}.`)
            }
            const value = raw.trim()
            if (value !== '' || key === 'name') {
                const checked = fieldRules[key].safeParse(value)
                if (!checked.success) {
                    return response(false, 400, checked.error.issues[0]?.message || `Invalid value for ${key}.`)
                }
            }
            user[key] = value
        }

        if (!user.name) {
            return response(false, 400, 'Name is required.')
        }

        if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
            if (file.size > MAX_IMAGE_BYTES) {
                return response(false, 413, 'Upload failed. Max image size is 5 MB.')
            }
            if (!String(file.type || '').startsWith('image/')) {
                return response(false, 415, 'Please upload an image file (JPG, PNG or WebP).')
            }

            const fileBuffer = await file.arrayBuffer()
            const base64Image = `data:${file.type};base64,${Buffer.from(fileBuffer).toString("base64")}`

            const uploadFile = await cloudinary.uploader.upload(base64Image, {
                upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
            })

            // Remove the old avatar. Best-effort: a cleanup failure must not lose
            // the new upload or the rest of the profile changes.
            if (user?.avatar?.public_id) {
                try {
                    await cloudinary.api.delete_resources([user.avatar.public_id])
                } catch (cleanupError) {
                    console.error('Failed to delete old avatar:', cleanupError?.message || cleanupError)
                }
            }

            user.avatar = {
                url: uploadFile.secure_url,
                public_id: uploadFile.public_id
            }

        }

        await user.save()

        return response(true, 200, 'Profile updated successfully.', {
            _id: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            landmark: user.landmark,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            country: user.country,
            avatar: user.avatar
        })
    } catch (error) {
        return catchError(error)
    }
}
