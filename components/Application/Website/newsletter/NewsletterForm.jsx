'use client'

import { forwardRef, useId, useState } from 'react'
import { AlertCircle, ArrowRight, Loader2, Mail, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNewsletterSubscribe } from './useNewsletterSubscribe'

/**
 * The newsletter sign-up form used everywhere on the storefront.
 *
 * - `capsule`  email + button share one bordered pill when the form is wide
 *              enough (container query), and stack on narrow widths.
 * - `preview`  admin preview: renders identically but never submits.
 * - `onSuccess(result)` lets the parent swap in its own success view; the
 *   form renders nothing once subscribed so the parent owns that state.
 * - `footer`   a node placed on the same row as the fine print (the popup's
 *              "Maybe later"), keeping the popup short.
 */
const NewsletterForm = forwardRef(function NewsletterForm(
    {
        source,
        placeholder = 'Enter your email address',
        buttonText = 'Subscribe',
        collectName = false,
        consentText = '',
        capsule = false,
        preview = false,
        onSuccess,
        footer = null,
        className,
    },
    emailRef
) {
    const id = useId()
    const { status, error, submit, clearError } = useNewsletterSubscribe({ source })
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [company, setCompany] = useState('')
    const loading = status === 'loading'

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (preview || loading) return
        const result = await submit({ email, name, company })
        if (result) onSuccess?.(result)
    }

    if (status === 'success') return null

    const errorId = `${id}-error`
    const consentId = `${id}-consent`
    const describedBy = [error ? errorId : null, consentText ? consentId : null].filter(Boolean).join(' ') || undefined

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className={cn('ef-nl-form', capsule && 'ef-nl-form--capsule', className)}
            aria-busy={loading}
        >
            {collectName && (
                <label className="ef-nl-input-wrap">
                    <span className="sr-only">First name</span>
                    <User className="ef-nl-input-icon" aria-hidden="true" />
                    <input
                        type="text"
                        name="name"
                        autoComplete="given-name"
                        maxLength={80}
                        placeholder="First name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="ef-nl-field"
                        disabled={loading}
                    />
                </label>
            )}

            <div className="ef-nl-row">
                <label className="ef-nl-input-wrap">
                    <span className="sr-only">Email address</span>
                    <Mail className="ef-nl-input-icon" aria-hidden="true" />
                    <input
                        ref={emailRef}
                        type="email"
                        name="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        maxLength={254}
                        placeholder={placeholder}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            if (error) clearError()
                        }}
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={describedBy}
                        className="ef-nl-field"
                        disabled={loading}
                    />
                </label>

                <button type="submit" className="ef-nl-submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            <span>Joining…</span>
                        </>
                    ) : (
                        <>
                            <span>{buttonText}</span>
                            <ArrowRight aria-hidden="true" />
                        </>
                    )}
                </button>
            </div>

            {/* Honeypot — invisible to people, irresistible to bots. Named so
                browser/password-manager autofill never fills it (a field
                called "company" would be, silently dropping real sign-ups). */}
            <label className="ef-nl-hp" aria-hidden="true">
                Leave this empty
                <input
                    type="text"
                    name="ef_nl_trap"
                    tabIndex={-1}
                    autoComplete="new-password"
                    data-1p-ignore
                    data-lpignore="true"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                />
            </label>

            <div aria-live="polite" className="ef-nl-live">
                {error && (
                    <p id={errorId} className="ef-nl-error">
                        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                        {error}
                    </p>
                )}
            </div>

            {consentText && !footer && <p id={consentId} className="ef-nl-fine">{consentText}</p>}
            {footer && (
                <div className="ef-nl-foot">
                    {consentText && <p id={consentId} className="ef-nl-fine">{consentText}</p>}
                    {footer}
                </div>
            )}
        </form>
    )
})

export default NewsletterForm
