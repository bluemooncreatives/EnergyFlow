import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SizeGuideModel from "@/models/SizeGuide.model"
import { isValidObjectId } from "mongoose"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated("admin")
        if (!auth.isAuth) {
            return response(false, 403, "Unauthorized.")
        }

        await connectDB()

        const getParams = await params
        const id = getParams.id

        if (!isValidObjectId(id)) {
            return response(false, 400, "Invalid object id.")
        }

        const sizeGuide = await SizeGuideModel.findOne({ _id: id, deletedAt: null }).lean()

        if (!sizeGuide) {
            return response(false, 404, "Size guide not found.")
        }

        return response(true, 200, "Size guide found.", sizeGuide)
    } catch (error) {
        return catchError(error)
    }
}
