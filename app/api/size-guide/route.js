import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SizeGuideModel from "@/models/SizeGuide.model"
import { NextResponse } from "next/server"

const SIZE_GUIDE_TYPES = [
    "bottomwear",
    "maxi-skirt",
    "topwear",
    "dress-bodycon",
    "dress-flowy",
    "coord-set",
    "ethnic",
    "free-size",
]

const parseBoolean = (value) => {
    if (value === undefined || value === null || value === "") return { isValid: true, value: undefined }
    if (typeof value === "boolean") return { isValid: true, value }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase()
        if (normalized === "true") return { isValid: true, value: true }
        if (normalized === "false") return { isValid: true, value: false }
    }
    return { isValid: false, value: undefined }
}

export async function GET(request) {
    try {
        const auth = await isAuthenticated("admin")
        if (!auth.isAuth) {
            return response(false, 403, "Unauthorized.")
        }

        await connectDB()

        const searchParams = request.nextUrl.searchParams
        const start = parseInt(searchParams.get("start") || 0, 10)
        const size = parseInt(searchParams.get("size") || 10, 10)
        const deleteType = searchParams.get("deleteType")
        const activeOnlyParam = searchParams.get("activeOnly")
        const typeParam = searchParams.get("type")

        let matchQuery = {}

        if (deleteType === "SD" || !deleteType) {
            matchQuery.deletedAt = null
        } else if (deleteType === "PD") {
            matchQuery.deletedAt = { $ne: null }
        }

        if (typeParam) {
            const normalizedType = String(typeParam).trim()
            if (!SIZE_GUIDE_TYPES.includes(normalizedType)) {
                return response(false, 400, "Invalid size guide type.")
            }
            matchQuery.type = normalizedType
        }

        if (activeOnlyParam !== null) {
            const parsed = parseBoolean(activeOnlyParam)
            if (!parsed.isValid) {
                return response(false, 400, "Invalid activeOnly value.")
            }
            if (parsed.value === true) {
                matchQuery.isActive = true
            }
        }

        const sizeGuides = await SizeGuideModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(start)
            .limit(size)
            .lean()

        const totalRowCount = await SizeGuideModel.countDocuments(matchQuery)

        return NextResponse.json({
            success: true,
            data: sizeGuides,
            meta: { totalRowCount }
        })
    } catch (error) {
        return catchError(error)
    }
}
