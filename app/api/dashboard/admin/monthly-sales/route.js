import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        await connectDB()

        const searchParams = request.nextUrl.searchParams
        const yearParam = searchParams.get('year')
        const currentYear = new Date(Date.now() + 330 * 60 * 1000).getUTCFullYear()
        const requestedYear = yearParam && yearParam !== 'all' ? parseInt(yearParam, 10) || currentYear : currentYear

        const startOfYear = new Date(Date.UTC(requestedYear, 0, 1) - 330 * 60 * 1000)
        const endOfYear = new Date(Date.UTC(requestedYear + 1, 0, 1) - 330 * 60 * 1000)

        const match = {
            deletedAt: null,
            status: { $in: ['processing', 'shipped', 'delivered'] },
            createdAt: { $gte: startOfYear, $lt: endOfYear, $type: 'date' }
        }

        const monthlySales = await OrderModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        year: { $year: { date: "$createdAt", timezone: "+05:30" } },
                        month: { $month: { date: "$createdAt", timezone: "+05:30" } },
                    },
                    totalSales: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                }
            },
            {
                $sort: { "_id.month": 1 }
            }
        ])

        // Ensure all 12 months are represented so UI charts are always complete
        const monthMap = new Map((monthlySales || []).map(item => [item._id?.month, item]))
        const full12Months = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1
            const found = monthMap.get(m)
            return {
                _id: { year: requestedYear, month: m },
                totalSales: found?.totalSales || 0,
                orderCount: found?.orderCount || 0,
            }
        })

        return response(true, 200, 'Data found', full12Months)

    } catch (error) {
        return catchError(error)
    }
}