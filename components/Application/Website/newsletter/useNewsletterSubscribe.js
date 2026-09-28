'use client'

import { useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'
import { NEWSLETTER_EMAIL_REGEX } from '@/lib/newsletterShared'

/* ── Per-visitor memory ─────────────────────────────────────────
   What this browser has done with the newsletter, so the popup never nags a
   subscriber and respects the admin's "don't show again for N days".
   Storage can throw (private mode, blocked site data); every access is
   guarded and a failure simply behaves like a first visit. */
export const NEWSLETTER_STORAGE_KEY = 'energyflow:newsletter'
const STORAGE_KEY = NEWSLETTER_STORAGE_KEY
export const NEWSLETTER_SUBSCRIBED_EVENT = 'energyflow:newsletter-subscribed'

export const readNewsletterState = () => {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
}

export const writeNewsletterState = (patch) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readNewsletterState(), ...patch }))
    } catch {
        // Nothing to do — the popup just falls back to its first-visit rules.
    }
}

/**
 * Shared submit logic for the popup, homepage band and footer strip.
 * status: 'idle' | 'loading' | 'success' | 'error'
 * result: { couponCode, alreadySubscribed, message } once subscribed.
 */
export const useNewsletterSubscribe = ({ source }) => {
    const pathname = usePathname()
    const [status, setStatus] = useState('idle')
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    const submit = useCallback(async ({ email, name, company }) => {
        const cleanEmail = String(email || '').trim()
        if (!NEWSLETTER_EMAIL_REGEX.test(cleanEmail)) {
            setStatus('error')
            setError('Please enter a valid email address.')
            return null
        }

        setStatus('loading')
        setError('')
        try {
            const { data } = await axios.post(
                '/api/newsletter/subscribe',
                {
                    email: cleanEmail,
                    name: String(name || '').trim(),
                    company,
                    source,
                    pagePath: pathname,
                },
                // A hung request must not leave the button spinning forever.
                { timeout: 15000 }
            )
            if (!data?.success) throw new Error(data?.message || 'Something went wrong. Please try again.')

            const next = { ...(data.data || {}), message: data.message }
            writeNewsletterState({ subscribed: true, subscribedAt: Date.now() })
            window.dispatchEvent(new CustomEvent(NEWSLETTER_SUBSCRIBED_EVENT, { detail: next }))
            setResult(next)
            setStatus('success')
            return next
        } catch (err) {
            setStatus('error')
            const offline = typeof navigator !== 'undefined' && navigator.onLine === false
            setError(
                offline
                    ? "You're offline. Reconnect and try again."
                    : axios.isAxiosError(err) && err.code === 'ECONNABORTED'
                        ? 'That took too long. Please try again.'
                        : axios.isAxiosError(err) && !err.response
                            ? 'Network error. Please check your connection and try again.'
                            : err.message || 'Something went wrong. Please try again.'
            )
            return null
        }
    }, [pathname, source])

    const clearError = useCallback(() => {
        setError('')
        setStatus((prev) => (prev === 'error' ? 'idle' : prev))
    }, [])

    return { status, error, result, submit, clearError }
}
