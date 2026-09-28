import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import CategoryModel from "@/models/Category.model"
import OrderModel from "@/models/Order.model"
import ProductModel from "@/models/Product.model"
import UserModel from "@/models/User.model"
import { resolveWindow } from "@/lib/services/analyticsService"

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

        let periodMatch = null
        if (range || year || month || date || from || to) {
            const win = resolveWindow({ range: range || (year ? 'year' : month ? 'month' : date ? 'date' : '30d'), from, to, year, month, date })
            if (win && win.key !== 'all') {
                periodMatch = { $gte: win.start, $lt: win.end }
            }
        }

        const [category, product, customer, order, orderInPeriod, customerInPeriod] = await Promise.all([
            CategoryModel.countDocuments({ deletedAt: null }),
            ProductModel.countDocuments({ deletedAt: null }),
            UserModel.countDocuments({ deletedAt: null, role: 'user' }),
            OrderModel.countDocuments({ deletedAt: null }),
            periodMatch ? OrderModel.countDocuments({ deletedAt: null, createdAt: periodMatch }) : null,
            periodMatch ? UserModel.countDocuments({ deletedAt: null, role: 'user', createdAt: periodMatch }) : null,
        ])

        return response(true, 200, 'Dashboard count.', {
            category,
            product,
            customer,
            order,
            orderInPeriod: orderInPeriod !== null ? orderInPeriod : order,
            customerInPeriod: customerInPeriod !== null ? customerInPeriod : customer,
        })

    } catch (error) {
        return catchError(error)
    }
}