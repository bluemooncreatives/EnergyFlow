import cloudinary from "@/lib/cloudinary";
import { catchError, response } from "@/lib/helperFunction";
import { isAuthenticated } from '@/lib/authentication'
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })
        const payload = await request.json()
        const { paramsToSign } = payload

        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_SECRET_KEY)

        return NextResponse.json({ signature })

    } catch (error) {
        return catchError(error)
    }
}
