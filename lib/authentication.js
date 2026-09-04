import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { getToken } from "next-auth/jwt"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

export const isAuthenticated = async (role, request = null) => {
    try {
        const cookieStore = await cookies()
        let resolvedRole = null
        let userId = null
        let email = null

        if (cookieStore.has('access_token')) {
            const access_token = cookieStore.get('access_token')
            const { payload } = await jwtVerify(access_token.value, new TextEncoder().encode(process.env.SECRET_KEY))
            resolvedRole = payload.role
            userId = payload._id
            if (payload.email) {
                email = payload.email
            }
        } else if (request) {
            const nextAuthToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
            if (nextAuthToken) {
                resolvedRole = nextAuthToken.role
                userId = nextAuthToken.userId || nextAuthToken.sub
                email = nextAuthToken.email || null
            }
        }

        if (!resolvedRole || !userId) {
            return {
                isAuth: false
            }
        }

        if (resolvedRole !== role) {
            return {
                isAuth: false
            }
        }

        return {
            isAuth: true,
            userId,
            email
        }

    } catch (error) {
        return {
            isAuth: false,
            error
        }
    }
}

/**
 * Resolve the current user inside a React Server Component or route handler
 * (no `request` object needed). Reads the custom JWT cookie first, then falls
 * back to the NextAuth (Google) session. Returns null when not signed in.
 */
export const getCurrentUser = async () => {
    try {
        const cookieStore = await cookies()

        if (cookieStore.has('access_token')) {
            const access_token = cookieStore.get('access_token')
            const { payload } = await jwtVerify(access_token.value, new TextEncoder().encode(process.env.SECRET_KEY))
            return {
                userId: payload._id || null,
                email: payload.email || null,
                role: payload.role || 'user',
            }
        }

        const session = await getServerSession(authOptions)
        if (session?.user) {
            return {
                userId: session.user.id || null,
                email: session.user.email || null,
                role: session.user.role || 'user',
            }
        }

        return null
    } catch (error) {
        return null
    }
}
