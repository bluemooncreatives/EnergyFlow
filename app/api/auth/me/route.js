import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import UserModel from "@/models/User.model";

/**
 * Returns the currently signed-in user (custom-JWT OR Google/NextAuth session),
 * for either role. Used to hydrate the client auth store on every load so the
 * navbar / dashboard sidebar show the real name + avatar reliably — including for
 * Google users and across full-page refreshes (Redux auth is not persisted).
 */
export async function GET(request) {
    try {
        await connectDB()

        // Accept either role — the same store backs the website nav and the admin nav.
        let auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            auth = await isAuthenticated('admin', request)
        }
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        const user = await UserModel.findById(auth.userId)
            .select('role name email avatar')
            .lean()

        if (!user) {
            return response(false, 404, 'User not found.')
        }

        return response(true, 200, 'Current user.', {
            _id: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
            avatar: user.avatar || null,
        })
    } catch (error) {
        return catchError(error)
    }
}
