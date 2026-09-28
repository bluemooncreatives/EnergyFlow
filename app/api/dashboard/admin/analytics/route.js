import { isAuthenticated } from "@/lib/authentication"
import { catchError, response } from "@/lib/helperFunction"
import { getStoreAnalytics } from "@/lib/services/analyticsService"

// Admin analytics report. ?range=today|7d|30d|90d|12m|ytd|all|custom
// (custom takes ?from=YYYY-MM-DD&to=YYYY-MM-DD). Never cached: it is
// private and should always reflect the latest orders.
export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        const params = request.nextUrl.searchParams
        const report = await getStoreAnalytics({
            range: params.get('range') || '30d',
            from: params.get('from'),
            to: params.get('to'),
        })

        return response(true, 200, 'Analytics report.', report, {
            headers: { 'Cache-Control': 'private, no-store' },
        })
    } catch (error) {
        return catchError(error)
    }
}
