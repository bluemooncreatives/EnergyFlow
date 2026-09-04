import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sendMail } from "@/lib/sendMail";
import { passwordChanged } from "@/email/passwordChanged";
import { zSchema } from "@/lib/zodSchema";
import UserModel from "@/models/User.model";
import { z } from "zod";

export async function PUT(request) {
    try {
        await connectDB()

        // Must be signed in. Works for both custom-JWT users and Google (NextAuth)
        // users — isAuthenticated reads the access_token cookie first, then falls
        // back to the NextAuth token (which needs the request object).
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        const payload = await request.json()
        const schema = z.object({
            currentPassword: z.string().optional(),
            password: zSchema.shape.password,
            confirmPassword: z.string(),
        }).refine((data) => data.password === data.confirmPassword, {
            message: 'New password and confirm password must be the same.',
            path: ['confirmPassword'],
        })

        const validated = schema.safeParse(payload)
        if (!validated.success) {
            return response(false, 400, 'Invalid or missing fields.', { error: validated.error })
        }

        const { currentPassword, password } = validated.data

        const user = await UserModel.findById(auth.userId).select('+password')
        if (!user) {
            return response(false, 404, 'User not found.')
        }

        const hasPassword = Boolean(user.password)

        if (hasPassword) {
            // Changing an existing password requires proving knowledge of the old one.
            if (!currentPassword) {
                return response(false, 400, 'Please enter your current password.')
            }
            const isCurrentValid = await user.comparePassword(currentPassword)
            if (!isCurrentValid) {
                return response(false, 400, 'Your current password is incorrect.')
            }
            // Block a pointless no-op change.
            const isSameAsOld = await user.comparePassword(password)
            if (isSameAsOld) {
                return response(false, 400, 'New password must be different from your current password.')
            }
        }
        // If the account has NO password yet (e.g. created via Google), an
        // authenticated session is sufficient authorization to set one for the
        // first time — no current password to verify.

        user.password = password
        await user.save()

        // Security notice. Best-effort — the change already succeeded.
        try {
            await sendMail(
                hasPassword ? 'Your Energyflow password was changed' : 'Your Energyflow password is set',
                user.email,
                passwordChanged({ name: user.name, action: hasPassword ? 'changed' : 'set' })
            )
        } catch (mailError) {
            console.error('Failed to send password-changed email:', mailError?.message || mailError)
        }

        return response(true, 200, hasPassword
            ? 'Password changed successfully.'
            : 'Password set successfully. You can now sign in with your email and password too.')

    } catch (error) {
        return catchError(error)
    }
}
