import { isAuthenticated } from "@/lib/authentication";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import UserModel from "@/models/User.model";

export async function PUT(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        const userId = auth.userId
        const user = await UserModel.findById(userId)

        if (!user) {
            return response(false, 404, 'User not found.')
        }

        const formData = await request.formData()
        const file = formData.get('file')
        const MAX_IMAGE_BYTES = 5 * 1024 * 1024

        // Only touch a field when the client actually sent it, so a partial
        // request can never blank out previously-saved data. Empty string is a
        // legitimate "clear this field" value and is preserved.
        const applyField = (key) => {
            if (formData.has(key)) {
                const value = formData.get(key)
                user[key] = typeof value === 'string' ? value.trim() : value
            }
        }

        applyField('name')
        applyField('phone')
        applyField('address')
        applyField('landmark')
        applyField('city')
        applyField('state')
        applyField('pincode')
        applyField('country')

        if (!user.name) {
            return response(false, 400, 'Name is required.')
        }

        if (file) {
            if (typeof file.size === 'number' && file.size > MAX_IMAGE_BYTES) {
                return response(false, 413, 'Upload failed. Max image size is 5 MB.')
            }

            const fileBuffer = await file.arrayBuffer()
            const base64Image = `data:${file.type};base64,${Buffer.from(fileBuffer).toString("base64")}`

            const uploadFile = await cloudinary.uploader.upload(base64Image, {
                upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
            })

            // REMOVE OLD AVATAR  
            if (user?.avatar?.public_id) {
                await cloudinary.api.delete_resources([user.avatar.public_id])
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
