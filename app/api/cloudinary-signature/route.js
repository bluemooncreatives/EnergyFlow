import cloudinary from "@/lib/cloudinary";
import { response } from "@/lib/helperFunction";
import { isAuthenticated } from '@/lib/authentication'
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })
        const payload = await request.json().catch(() => null)
        const paramsToSign = payload?.paramsToSign
        if (!paramsToSign || typeof paramsToSign !== 'object' || Array.isArray(paramsToSign) || !Number.isFinite(Number(paramsToSign.timestamp))) {
            return response(false, 400, 'Invalid upload parameters.', {}, { status: 400 })
        }
        if (!process.env.CLOUDINARY_SECRET_KEY) return response(false, 503, 'Cloudinary upload is not configured.', {}, { status: 503 })

        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_SECRET_KEY)

        return NextResponse.json({ signature })

    } catch (error) {
        return response(false, 503, 'Could not prepare the upload. Please retry.', {}, { status: 503 })
    }
}
