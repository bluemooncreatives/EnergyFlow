import React from 'react'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import InvoiceDocument from '@/components/Application/Website/InvoiceDocument'
import { getOrderDetailsByOrderId, userCanViewOrder } from '@/lib/services/orderService'
import { getCurrentUser } from '@/lib/authentication'

// react-pdf needs the Node runtime (fontkit / yoga wasm); never run on edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
    try {
        const { orderid } = await params

        const order = await getOrderDetailsByOrderId(orderid)
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
        }

        // Only the order owner (or an admin) can download the invoice — it carries
        // the customer's name, address and purchase details.
        const currentUser = await getCurrentUser()
        if (!userCanViewOrder(order, currentUser)) {
            return NextResponse.json({ success: false, message: 'Not authorized to view this invoice.' }, { status: 403 })
        }

        const buffer = await renderToBuffer(React.createElement(InvoiceDocument, { order }))

        // Sanitise the filename — order ids are safe, but guard regardless.
        const safeId = String(orderid).replace(/[^a-zA-Z0-9_-]/g, '')

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-${safeId}.pdf"`,
                'Content-Length': String(buffer.length),
                'Cache-Control': 'no-store',
            },
        })
    } catch (err) {
        console.error('Invoice generation route failed:', err)
        return NextResponse.json({ success: false, message: 'Failed to generate invoice' }, { status: 500 })
    }
}
