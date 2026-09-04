import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import UserModel from "@/models/User.model";

export async function GET(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        const userId = auth.userId

        // Return only the fields the profile/checkout forms need. Avoids leaking
        // internal blobs like googleProfile.raw to the client. `+password`/`+googleId`
        // are pulled in only to derive booleans for the UI — the values are stripped
        // before responding.
        const user = await UserModel.findById(userId)
            .select('role name email phone address landmark city state pincode country avatar isEmailVerified googleId +password')
            .lean()

        if (!user) {
            return response(false, 404, 'User not found.')
        }

        // Drives the profile "Set a password" vs "Change password" UI.
        const hasPassword = Boolean(user.password)
        const hasGoogle = Boolean(user.googleId)
        delete user.password
        delete user.googleId

        return response(true, 200, 'User data.', { ...user, hasPassword, hasGoogle })
    } catch (error) {
        return catchError(error)
    }
}