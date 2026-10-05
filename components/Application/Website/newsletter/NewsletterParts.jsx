'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Heart, Leaf, Mail, Sparkles, Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Small building blocks shared by the popup, the homepage band and the
   footer strip. Styling lives in design-system.css §24 (.ef-nl-*). */

// Two-tone headline; the accent half gets a hand-drawn sunflower swash.
// `id` is only forwarded when given: Radix's Dialog.Title supplies its own id
// for aria-labelledby, and an explicit undefined would override it.
export const NewsletterTitle = ({ as: Tag = 'h2', title, accent, id, className }) => (
    <Tag {...(id ? { id } : {})} className={cn('ef-nl-title', className)}>
        {title}
        {accent && (
            <>
                {' '}
                <span className="ef-nl-title__accent">
                    {accent}
                    <svg className="ef-nl-swash" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                        <path d="M3 14 C 45 5, 110 2, 197 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                </span>
            </>
        )}
    </Tag>
)

// Split "10% OFF" into two stacked lines so it fits the seal.
const splitBadge = (text = '') => {
    const trimmed = text.trim()
    const i = trimmed.indexOf(' ')
    return i > 0 ? [trimmed.slice(0, i), trimmed.slice(i + 1)] : [trimmed, '']
}

/**
 * Rotating seal: ring text spinning around a scalloped sunflower seal.
 * With an offer it shows the badge ("10% OFF"), otherwise a mail icon.
 */
export const NewsletterBadge = ({ offer, className, style }) => {
    const pathId = `nl-ring-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
    const ring = offer
        ? 'Welcome gift ✦ Join the club ✦ Welcome gift ✦ Join the club ✦ '
        : 'Join the club ✦ Fresh drops ✦ Member deals ✦ '
    const [line1, line2] = splitBadge(offer?.badge)
    // Scale the text to the longest line so "FREE SHIPPING" fits as well as "10%".
    const longest = Math.max(line1.length, line2.length, 1)
    const bigStyle = { fontSize: `calc(var(--nl-badge-size, 8.5rem) * ${Math.min(0.16, 0.8 / longest).toFixed(3)})` }

    return (
        <div className={cn('ef-nl-badge', className)} style={style} aria-hidden="true">
            <span className="ef-nl-badge__disc" />
            <svg className="ef-nl-badge__ring" viewBox="0 0 120 120" focusable="false">
                <defs>
                    <path id={pathId} d="M60,60 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0" />
                </defs>
                <text>
                    <textPath href={`#${pathId}`} textLength="304" lengthAdjust="spacing">{ring}</textPath>
                </text>
            </svg>
            <span className="ef-seal ef-seal--sun">
                {offer ? (
                    <>
                        <span className="ef-nl-badge__big" style={bigStyle}>{line1}</span>
                        {line2 && <span className="ef-nl-badge__big" style={bigStyle}>{line2}</span>}
                    </>
                ) : (
                    <Mail strokeWidth={2} />
                )}
            </span>
        </div>
    )
}

// Illustrated panel used when the admin hasn't picked a photo: dotted field,
// dashed orbit rings and floating seals — the storefront's seal motif.
export const NewsletterArt = () => (
    <div className="ef-nl-art" aria-hidden="true">
        <span className="ef-nl-art__ring" style={{ width: '22rem', height: '22rem', left: '-6rem', top: '-5rem' }} />
        <span className="ef-nl-art__ring" style={{ width: '13rem', height: '13rem', right: '-3rem', bottom: '-4rem' }} />
        <span className="ef-nl-art__float" style={{ left: '14%', top: '16%' }}>
            <span className="ef-seal ef-seal--sun" style={{ width: '3.5rem', height: '3.5rem' }}><Leaf strokeWidth={2} /></span>
        </span>
        <span className="ef-nl-art__float" style={{ right: '16%', top: '22%' }}>
            <span className="ef-seal ef-seal--cream" style={{ width: '2.75rem', height: '2.75rem' }}><Sprout strokeWidth={2} /></span>
        </span>
        <span className="ef-nl-art__float" style={{ left: '38%', top: '50%' }}>
            <span className="ef-seal ef-seal--forest" style={{ width: '3rem', height: '3rem' }}><Heart strokeWidth={2} /></span>
        </span>
        <span className="ef-nl-art__float" style={{ right: '22%', bottom: '14%', color: 'var(--palette-sunflower)' }}>
            <Sparkles className="size-6" strokeWidth={1.75} />
        </span>
        <span className="ef-nl-art__float" style={{ left: '12%', bottom: '22%', color: 'var(--nl-ink)', opacity: 0.6 }}>
            <Sparkles className="size-4" strokeWidth={1.75} />
        </span>
    </div>
)

// Clipboard API needs a secure context and permission; fall back to the
// legacy selection + execCommand path (older Safari, in-app browsers, http).
// `host` must be inside the open dialog: a textarea on <body> would be
// outside the modal's focus trap, which steals focus back mid-copy.
const copyText = async (text, host = document.body) => {
    try {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
            return true
        }
    } catch {
        // fall through to the legacy path
    }
    try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
        host.appendChild(area)
        area.select()
        area.setSelectionRange(0, text.length)
        const ok = document.execCommand('copy')
        area.remove()
        return ok
    } catch {
        return false
    }
}

// The welcome code after sign-up, with one-tap copy.
export const CodeReveal = ({ code, className }) => {
    const [copied, setCopied] = useState(false)
    const timerRef = useRef(null)
    const rootRef = useRef(null)

    useEffect(() => () => clearTimeout(timerRef.current), [])

    const copy = async () => {
        if (await copyText(code, rootRef.current || undefined)) {
            setCopied(true)
            toast.success(`Code ${code} copied - apply it at checkout.`)
            clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => setCopied(false), 2200)
        } else {
            toast.error("Couldn't copy. Press and hold the code to copy it.")
        }
    }

    return (
        <div ref={rootRef} className={cn('ef-nl-code', className)}>
            <span className="min-w-0">
                <span className="ef-nl-code__label">Your welcome code</span>
                <span className="ef-nl-code__value">{code}</span>
            </span>
            <button type="button" className="ef-nl-copy" onClick={copy} aria-label={`Copy code ${code}`}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    )
}

// A one-shot burst of palette-coloured confetti from behind the success seal.
const CONFETTI_COLORS = ['#F2C94C', '#2F6B3F', '#F7F3E8', '#8C7A3B', '#F5D56E', '#8FB59A']
const CONFETTI = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1)
    const distance = 70 + ((i * 37) % 60)
    return {
        '--x': `${Math.round(Math.cos(angle) * distance)}px`,
        '--y': `${Math.round(Math.sin(angle) * distance - 20)}px`,
        '--r': `${(i * 67) % 360}deg`,
        '--s': `${7 + (i % 3) * 2}px`,
        '--d': `${(i % 4) * 40}ms`,
        '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }
})

export const SuccessSeal = ({ size = '4.25rem' }) => (
    <span className="relative inline-flex w-fit">
        <span className="ef-nl-confetti" aria-hidden="true">
            {CONFETTI.map((style, i) => <i key={i} style={style} />)}
        </span>
        <span className="ef-seal ef-seal--sun ef-nl-success__seal" style={{ width: size, height: size }}>
            <Check strokeWidth={3} aria-hidden="true" />
        </span>
    </span>
)

export const PerkCheck = () => (
    <span className="ef-nl-check" aria-hidden="true"><Check /></span>
)
