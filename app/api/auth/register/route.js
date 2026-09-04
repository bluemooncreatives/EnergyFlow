import { emailVerificationLink } from "@/email/emailVerificationLink";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sendMail } from "@/lib/sendMail";
import { zSchema } from "@/lib/zodSchema";
import UserModel from "@/models/User.model";
import { SignJWT } from "jose";

export async function POST(request) {
    try {
        await connectDB()
        // validation schema  
        const validationSchema = zSchema.pick({
            name: true, email: true, password: true
        })

        const payload = await request.json()

        const validatedData = validationSchema.safeParse(payload)

        if (!validatedData.success) {
            return response(false, 401, 'Invalid or missing input field.', validatedData.error)
        }

        const { name, email, password } = validatedData.data

        // Emails are unique (one account per email). If the address is already taken
        // we never create a duplicate — instead we guide the user to the right path.
        const existingUser = await UserModel.findOne({ email, deletedAt: null }).select('+password')
        if (existingUser) {
            // Account exists via Google but has no password yet → tell them how to
            // either continue with Google or set a password (account linking).
            if (existingUser.googleId && !existingUser.password) {
                return response(false, 409, 'This email is already registered with Google. Please use “Login with Google”, or set a password from “Forgot password”.')
            }
            return response(false, 409, 'An account with this email already exists. Please log in instead.')
        }

        // new registration

        const NewRegistration = new UserModel({
            name, email, password
        })

        await NewRegistration.save()

        const secret = new TextEncoder().encode(process.env.SECRET_KEY)
        const token = await new SignJWT({ userId: NewRegistration._id.toString() })
            .setIssuedAt()
            .setExpirationTime('1h')
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)


        const verifyMailStatus = await sendMail(
            'Verify your email — Energyflow',
            email,
            emailVerificationLink(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email/${token}`, { name })
        )

        // The account exists now, so we never block registration on a mail hiccup —
        // but we DO tell the user honestly so they don't sit waiting for a mail that
        // never arrived. They can trigger a fresh link by attempting to log in.
        if (!verifyMailStatus.success) {
            return response(true, 200, 'Account created. We could not send the verification email right now — please try logging in to resend it.')
        }

        return response(true, 200, 'Registration success, Please verify your email address.')

    } catch (error) {
        return catchError(error)
    }
}
