'use client'

import { useState } from 'react'
import { Check, Copy, Download, Loader2 } from 'lucide-react'
import { showToast } from '@/lib/showToast'

/**
 * Client-side action buttons for the Order Details page.
 * Kept isolated so the page itself can remain a server component.
 */
const OrderDetailActions = ({ orderId }) => {
    const [copied, setCopied] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const copyOrderId = async () => {
        try {
            await navigator.clipboard.writeText(orderId)
            setCopied(true)
            showToast('success', 'Order ID copied to clipboard')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            showToast('error', 'Unable to copy. Please copy it manually.')
        }
    }

    // The PDF is rendered server-side (react-pdf needs Node deps) and streamed
    // back as an attachment; we fetch it and trigger a direct download.
    const downloadInvoice = async () => {
        if (downloading) return
        setDownloading(true)
        try {
            const res = await fetch(`/api/order-invoice/${encodeURIComponent(orderId)}`)
            if (!res.ok) throw new Error(`Request failed with ${res.status}`)

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `invoice-${orderId || 'order'}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Invoice download failed:', err)
            showToast('error', 'Could not generate the invoice. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className='grid grid-cols-2 gap-2.5'>
            <button
                type='button'
                onClick={copyOrderId}
                className='inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border/70 bg-background text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-[var(--dark-red)] hover:text-[var(--dark-red)]'
            >
                {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
                {copied ? 'Copied' : 'Copy ID'}
            </button>
            <button
                type='button'
                onClick={downloadInvoice}
                disabled={downloading}
                className='inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border/70 bg-background text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-[var(--dark-red)] hover:text-[var(--dark-red)] disabled:pointer-events-none disabled:opacity-60'
            >
                {downloading ? <Loader2 className='size-3.5 animate-spin' /> : <Download className='size-3.5' />}
                {downloading ? 'Preparing' : 'Invoice'}
            </button>
        </div>
    )
}

export default OrderDetailActions
