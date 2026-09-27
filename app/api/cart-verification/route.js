import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { priceOrderLines } from "@/lib/services/orderPricing";

// Re-prices checkout lines (a cart, or a single buy-now line) against the
// catalogue. Deleted / unknown items are dropped, so the caller can tell what
// is no longer purchasable by comparing what it sent with what came back.
export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json()

        const { lines } = await priceOrderLines(payload)

        return response(true, 200, 'Verified Cart Data.', lines)

    } catch (error) {
        return catchError(error)
    }
}
