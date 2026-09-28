import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";
import { resolveWindow } from "@/lib/services/analyticsService";

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        await connectDB()

        const searchParams = request.nextUrl.searchParams
        const range = searchParams.get('range')
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const year = searchParams.get('year')
        const month = searchParams.get('month')
        const date = searchParams.get('date')

        const match = { deletedAt: null }

        if (range || year || month || date || from || to) {
            const win = resolveWindow({ range: range || (year ? 'year' : month ? 'month' : date ? 'date' : '30d'), from, to, year, month, date })
            if (win && win.key !== 'all') {
                match.createdAt = { $gte: win.start, $lt: win.end }
            }
        }

        const orderStatus = await OrderModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                }
            },
            {
                $sort: { count: 1 }
            }
        ])

        return response(true, 200, 'Data found', orderStatus)

    } catch (error) {
        return catchError(error)
    }
}