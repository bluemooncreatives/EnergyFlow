import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SizeGuideModel from "@/models/SizeGuide.model"
import { isValidObjectId } from "mongoose"

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

const normalizeColumns = (columns) => columns.map((column) => String(column || "").trim())

const validateColumns = (columns) => {
    if (!Array.isArray(columns) || columns.length === 0) {
        return { ok: false, message: "Columns must be a non-empty array." }
    }

    const normalized = normalizeColumns(columns)
    if (normalized.some((column) => !column)) {
        return { ok: false, message: "Columns must be non-empty strings." }
    }

    const unique = new Set(normalized.map((column) => column.toLowerCase()))
    if (unique.size !== normalized.length) {
        return { ok: false, message: "Columns must be unique." }
    }

    return { ok: true, value: normalized }
}

const validateRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, message: "Rows must be a non-empty array." }
    }

    const invalidRow = rows.find((row) => !row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).length === 0)
    if (invalidRow) {
        return { ok: false, message: "Rows must be a non-empty array of objects." }
    }

    return { ok: true, value: rows }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated("admin")
        if (!auth.isAuth) {
            return response(false, 403, "Unauthorized.")
        }

        await connectDB()
        const payload = await request.json()

        const id = payload?._id
        if (!isValidObjectId(id)) {
            return response(false, 400, "Invalid object id.")
        }

        const name = String(payload?.name || "").trim()
        const slug = String(payload?.slug || "").trim().toLowerCase()
        const type = String(payload?.type || "").trim()
        const columns = payload?.columns
        const rows = payload?.rows
        const note = typeof payload?.note === "string" ? payload.note.trim() : payload?.note
        const parsedIsActive = parseBoolean(payload?.isActive)

        if (!name) {
            return response(false, 400, "Name is required.")
        }

        if (!slug) {
            return response(false, 400, "Slug is required.")
        }

        if (!type || !SIZE_GUIDE_TYPES.includes(type)) {
            return response(false, 400, "Invalid size guide type.")
        }

        if (!parsedIsActive.isValid) {
            return response(false, 400, "Invalid isActive value.")
        }

        const columnValidation = validateColumns(columns)
        if (!columnValidation.ok) {
            return response(false, 400, columnValidation.message)
        }

        const rowValidation = validateRows(rows)
        if (!rowValidation.ok) {
            return response(false, 400, rowValidation.message)
        }

        const existingSlug = await SizeGuideModel.findOne({ slug, _id: { $ne: id } }).lean()
        if (existingSlug) {
            return response(false, 400, "Slug already exists.")
        }

        const sizeGuide = await SizeGuideModel.findOne({ _id: id, deletedAt: null })
        if (!sizeGuide) {
            return response(false, 404, "Size guide not found.")
        }

        sizeGuide.name = name
        sizeGuide.slug = slug
        sizeGuide.type = type
        sizeGuide.columns = columnValidation.value
        sizeGuide.rows = rowValidation.value
        sizeGuide.note = note

        if (parsedIsActive.value !== undefined) {
            sizeGuide.isActive = parsedIsActive.value
        }

        await sizeGuide.save()

        return response(true, 200, "Size guide updated successfully.")
    } catch (error) {
        return catchError(error)
    }
}
