import mongoose from "mongoose";
const MONGODB_URL = process.env.MONGODB_URI

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    }
}

export const connectDB = async () => {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URL, {
            dbName: 'YT-NEXTJS-ECOMMERCE',
            bufferCommands: false
        })
    }

    try {
        cached.conn = await cached.promise
    } catch (error) {
        // Drop the failed attempt so the next request reconnects instead of
        // rethrowing the same cached rejection until the server restarts.
        cached.promise = null
        throw error
    }

    return cached.conn
}