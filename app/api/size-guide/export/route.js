import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { isAuthenticated } from "@/lib/authentication";
import SizeGuideModel from "@/models/SizeGuide.model";

export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const filter = {
            deletedAt: null
        }

        const getSizeGuides = await SizeGuideModel.find(filter)
            .select('-rows')
            .sort({ createdAt: -1 })
            .lean()

        if (!getSizeGuides) {
            return response(false, 404, 'Collection empty.')
        }

        return response(true, 200, 'Data found.', getSizeGuides)

    } catch (error) {
        return catchError(error)
    }
}
