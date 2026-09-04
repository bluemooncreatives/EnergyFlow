import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { connectDB } from "./databaseConnection"
import { claimGuestOrders } from "@/lib/services/orderService"
import UserModel from "@/models/User.model"

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== "google") {
                return true
            }

            try {
                await connectDB()

                let existingUser = await UserModel.findOne({ email: user.email })

                if (!existingUser) {
                    existingUser = new UserModel({
                        name: user.name,
                        email: user.email,
                        isEmailVerified: true,
                        googleId: account.providerAccountId,
                        avatar: {
                            url: user.image,
                        },
                        role: "user",
                    })
                    await existingUser.save()
                } else if (!existingUser.googleId) {
                    existingUser.googleId = account.providerAccountId
                    existingUser.isEmailVerified = true

                    if (!existingUser.avatar?.url) {
                        existingUser.avatar = {
                            url: user.image,
                        }
                    }

                    await existingUser.save()
                }

                // Google has verified this email, so link any guest orders placed
                // with the same address to the account.
                try {
                    await claimGuestOrders(existingUser._id, existingUser.email)
                } catch (claimError) {
                    console.error("Failed to claim guest orders on Google sign-in:", claimError)
                }

                return true
            } catch (error) {
                console.error("Error during Google sign-in database operation:", error)
                return false
            }
        },
        async jwt({ token, user, account }) {
            try {
                if (account?.provider === "google" || user?.email) {
                    await connectDB()
                    const dbUser = await UserModel.findOne({ email: token.email || user.email })

                    if (dbUser) {
                        token.userId = dbUser._id.toString()
                        token.role = dbUser.role
                        token.name = dbUser.name
                        token.email = dbUser.email
                    }
                }
            } catch (error) {
                console.error("Error while enriching JWT token:", error)
            }

            return token
        },
        async session({ session, token }) {
            if (session?.user && token) {
                session.user.id = token.userId
                session.user.role = token.role
                session.user.name = token.name
                session.user.email = token.email
            }
            return session
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
