import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sendMail } from "@/lib/sendMail";
import { passwordChanged } from "@/email/passwordChanged";
import { zSchema } from "@/lib/zodSchema";
import UserModel from "@/models/User.model";

export async function PUT(request) {
    try {
        await connectDB()
        const payload = await request.json()
        const validationSchema = zSchema.pick({
            email: true, password: true
        })

        const validatedData = validationSchema.safeParse(payload)
        if (!validatedData.success) {
            return response(false, 401, 'Invalid or missing input field.', validatedData.error)
        }

        const { email, password } = validatedData.data

        const getUser = await UserModel.findOne({ deletedAt: null, email }).select("+password")

        if (!getUser) {
            return response(false, 404, 'User not found.')
        }

        getUser.password = password
        // Completing the emailed OTP flow proves the user controls this inbox, so we
        // can safely treat the email as verified. This also lets a Google-only account
        // (which had no password) use "Forgot password" to set one and unlock
        // email + password login.
        getUser.isEmailVerified = true
        await getUser.save()

        // Security notice. Best-effort — the reset already succeeded.
        try {
            await sendMail('Your Energyflow password was reset', getUser.email, passwordChanged({ name: getUser.name, action: 'reset' }))
        } catch (mailError) {
            console.error('Failed to send password-reset email:', mailError?.message || mailError)
        }

        return response(true, 200, 'Password updated successfully. You can now sign in with your email and password.')
    } catch (error) {
        return catchError(error)
    }
}