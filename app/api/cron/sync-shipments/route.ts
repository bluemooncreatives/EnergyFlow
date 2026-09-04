import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/databaseConnection"
import { syncOrderShipment } from "@/lib/services/shipmentTrackingService"
import OrderModel from "@/models/Order.model"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const Order = OrderModel as any
const BATCH_SIZE = 100
const CONCURRENCY = 5

type SyncCandidate = {
    _id: { toString: () => string }
    order_id: string
    shipment: {
        awb: string
        shipmentStatus?: string | null
        deliveredAt?: Date | string | null
    }
}

type SyncFailure = {
    orderId: string
    awb: string
    message: string
}

const log = (
    level: "info" | "warn" | "error",
    event: string,
    context: Record<string, unknown> = {},
) => {
    console[level](JSON.stringify({
        service: "shipment-sync-cron",
        event,
        timestamp: new Date().toISOString(),
        ...context,
    }))
}

const isAuthorized = (request: NextRequest) => {
    const secret = process.env.CRON_SECRET
    const authorization = request.headers.get("authorization") || ""
    if (!secret) return false

    const actual = Buffer.from(authorization)
    const expected = Buffer.from(`Bearer ${secret}`)
    return actual.length === expected.length && timingSafeEqual(actual, expected)
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Unknown sync error."

export async function GET(request: NextRequest) {
    const startedAt = Date.now()

    if (!process.env.CRON_SECRET) {
        log("error", "cron_not_configured")
        return NextResponse.json(
            { success: false, message: "CRON_SECRET is not configured." },
            { status: 500 },
        )
    }

    if (!isAuthorized(request)) {
        log("warn", "unauthorized_request")
        return NextResponse.json(
            { success: false, message: "Unauthorized." },
            { status: 401 },
        )
    }

    log("info", "sync_started")

    try {
        await connectDB()

        let cursor: SyncCandidate["_id"] | null = null
        let found = 0
        let succeeded = 0
        let failed = 0
        let statusChanged = 0
        const failures: SyncFailure[] = []

        while (true) {
            const query: Record<string, unknown> = {
                deletedAt: null,
                "shipment.awb": { $exists: true, $nin: [null, ""] },
                "shipment.shipmentStatus": { $ne: "DELIVERED" },
                ...(cursor ? { _id: { $gt: cursor } } : {}),
            }

            const orders = await Order.find(query)
                .select("_id order_id shipment.awb shipment.shipmentStatus shipment.deliveredAt")
                .sort({ _id: 1 })
                .limit(BATCH_SIZE)
                .lean() as SyncCandidate[]

            if (!orders.length) break
            found += orders.length

            for (let index = 0; index < orders.length; index += CONCURRENCY) {
                const chunk = orders.slice(index, index + CONCURRENCY)
                const results = await Promise.allSettled(chunk.map(async (order) => {
                    const previousStatus = order.shipment.shipmentStatus || "PENDING"
                    const tracking = await syncOrderShipment({
                        orderId: order._id.toString(),
                        awb: order.shipment.awb,
                        deliveredAt: order.shipment.deliveredAt,
                    })

                    return { order, previousStatus, tracking }
                }))

                results.forEach((result, resultIndex) => {
                    const order = chunk[resultIndex]
                    if (result.status === "fulfilled") {
                        succeeded += 1
                        if (result.value.previousStatus !== result.value.tracking.shipmentStatus) {
                            statusChanged += 1
                        }
                        log("info", "shipment_synced", {
                            orderId: order.order_id,
                            awb: order.shipment.awb,
                            previousStatus: result.value.previousStatus,
                            shipmentStatus: result.value.tracking.shipmentStatus,
                        })
                        return
                    }

                    failed += 1
                    const failure = {
                        orderId: order.order_id,
                        awb: order.shipment.awb,
                        message: errorMessage(result.reason),
                    }
                    // Keep the response bounded, while still logging every failure.
                    if (failures.length < 25) failures.push(failure)
                    log("error", "shipment_sync_failed", failure)
                })
            }

            cursor = orders[orders.length - 1]._id
            if (orders.length < BATCH_SIZE) break
        }

        const summary = {
            found,
            succeeded,
            failed,
            statusChanged,
            durationMs: Date.now() - startedAt,
            failures,
        }
        log(failed ? "warn" : "info", "sync_completed", summary)

        const allFailed = found > 0 && succeeded === 0
        return NextResponse.json(
            {
                success: !allFailed,
                message: allFailed
                    ? "All shipment tracking updates failed."
                    : "Shipment tracking sync completed.",
                data: summary,
            },
            { status: allFailed ? 502 : 200 },
        )
    } catch (error) {
        log("error", "sync_crashed", {
            durationMs: Date.now() - startedAt,
            message: errorMessage(error),
        })
        return NextResponse.json(
            { success: false, message: "Shipment tracking sync failed." },
            { status: 500 },
        )
    }
}

