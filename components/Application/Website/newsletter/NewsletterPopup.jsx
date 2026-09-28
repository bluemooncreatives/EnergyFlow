'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Gift, Mail, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNewsletterPathAllowed } from '@/lib/newsletterConfig'
import NewsletterPopupCard from './NewsletterPopupCard'
import {
    NEWSLETTER_SUBSCRIBED_EVENT,
    readNewsletterState,
    writeNewsletterState,
} from './useNewsletterSubscribe'

const DAY_MS = 24 * 60 * 60 * 1000
// When every trigger is switched off the popup opens right after the page
// settles, not in the same frame as hydration.
const IMMEDIATE_MS = 1200

const withinDays = (timestamp, days) => Boolean(timestamp) && Date.now() - timestamp < days * DAY_MS

// Another dialog (search, cart sheet) already owns the screen.
const otherDialogOpen = () =>
    Boolean(document.querySelector('[role="dialog"][data-state="open"]:not(.ef-nl-stage)'))

const isMobileViewport = () => window.matchMedia('(max-width: 767px)').matches

/**
 * Site-wide newsletter popup. Opens on whichever admin-enabled trigger fires
 * first — time on page, scroll depth or exit intent (desktop) — and never for
 * a visitor who has subscribed, on excluded paths, on a disabled device type,
 * or within the admin's "don't show again for N days" window after a dismiss.
 * A dismissed popup can leave a small teaser pill to reopen it.
 *
 * `?newsletter=preview` forces it open (the admin's "Preview on site" link).
 */
const NewsletterPopup = ({ settings }) => {
    const { popup, behavior } = settings
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [teaser, setTeaser] = useState(false)
    const [subscribed, setSubscribed] = useState(false)
    const shownRef = useRef(false)
    const emailRef = useRef(null)

    const isSlide = popup.layout === 'slide-in'
    const allowedHere = isNewsletterPathAllowed(pathname, behavior)

    // Hide everything the moment another sign-up form (band, footer) succeeds.
    useEffect(() => {
        const onSubscribed = () => {
            setSubscribed(true)
            setTeaser(false)
        }
        window.addEventListener(NEWSLETTER_SUBSCRIBED_EVENT, onSubscribed)
        return () => window.removeEventListener(NEWSLETTER_SUBSCRIBED_EVENT, onSubscribed)
    }, [])

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('newsletter') === 'preview') {
            shownRef.current = true
            setOpen(true)
            return
        }

        if (!popup.enabled || !allowedHere) {
            // Client navigation onto an excluded page (e.g. checkout).
            if (isSlide) setOpen(false)
            setTeaser(false)
            return
        }

        const onMobile = isMobileViewport()
        if (onMobile ? !behavior.showOnMobile : !behavior.showOnDesktop) return

        const state = readNewsletterState()
        if (state.subscribed) return

        if (withinDays(state.dismissedAt, behavior.dismissDays) || shownRef.current) {
            const teaserHidden = withinDays(state.teaserHiddenAt, Math.max(behavior.dismissDays, 1))
            if (popup.teaser.enabled && !teaserHidden) setTeaser(true)
            return
        }

        let done = false
        const cleanups = []
        const cleanup = () => cleanups.splice(0).forEach((fn) => fn())

        const fire = () => {
            if (done) return
            if (readNewsletterState().subscribed) {
                done = true
                cleanup()
                return
            }
            // Don't stack on top of the search dialog or the cart — try again shortly.
            if (otherDialogOpen()) {
                const retry = setTimeout(fire, 2500)
                cleanups.push(() => clearTimeout(retry))
                return
            }
            done = true
            cleanup()
            shownRef.current = true
            setOpen(true)
        }

        const delay = Number(behavior.delaySeconds) || 0
        const scrollPct = Number(behavior.scrollPercent) || 0
        const exit = Boolean(behavior.exitIntent) && !onMobile && window.matchMedia('(pointer: fine)').matches
        const noTriggers = delay === 0 && scrollPct === 0 && !exit

        if (delay > 0 || noTriggers) {
            const timer = setTimeout(fire, noTriggers ? IMMEDIATE_MS : delay * 1000)
            cleanups.push(() => clearTimeout(timer))
        }

        if (scrollPct > 0) {
            const onScroll = () => {
                const doc = document.documentElement
                const scrollable = doc.scrollHeight - window.innerHeight
                const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100
                if (progress >= scrollPct) fire()
            }
            window.addEventListener('scroll', onScroll, { passive: true })
            cleanups.push(() => window.removeEventListener('scroll', onScroll))
        }

        if (exit) {
            const onMouseOut = (event) => {
                if (!event.relatedTarget && event.clientY <= 0) fire()
            }
            document.addEventListener('mouseout', onMouseOut)
            cleanups.push(() => document.removeEventListener('mouseout', onMouseOut))
        }

        return cleanup
        // Re-evaluated per page; settings only change with a server re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, allowedHere])

    const dismiss = useCallback(() => {
        setOpen(false)
        if (subscribed || readNewsletterState().subscribed) return
        writeNewsletterState({ dismissedAt: Date.now() })
        if (popup.teaser.enabled && allowedHere) setTeaser(true)
    }, [subscribed, popup.teaser.enabled, allowedHere])

    const reopen = () => {
        setTeaser(false)
        setOpen(true)
    }

    const hideTeaser = () => {
        setTeaser(false)
        writeNewsletterState({ teaserHiddenAt: Date.now() })
    }

    const onOpenAutoFocus = (event) => {
        event.preventDefault()
        // Desktop: straight into the email field. Mobile: focus the sheet
        // itself so the keyboard doesn't jump up over the offer. Slide-in:
        // leave focus where the shopper is.
        if (isSlide) return
        if (!isMobileViewport() && emailRef.current) emailRef.current.focus()
        else event.target?.focus?.()
    }

    return (
        <>
            <DialogPrimitive.Root
                open={open}
                onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
                modal={!isSlide}
            >
                <DialogPrimitive.Portal>
                    {!isSlide && <DialogPrimitive.Overlay className="ef-nl-backdrop" />}
                    <DialogPrimitive.Content
                        className={cn('ef-nl-stage', isSlide ? 'ef-nl-stage--slide' : 'ef-nl-stage--modal')}
                        onOpenAutoFocus={onOpenAutoFocus}
                        onInteractOutside={isSlide ? (e) => e.preventDefault() : undefined}
                        data-lenis-prevent
                    >
                        {/* The frame fills the screen around the dialog, so a
                            click on it is a click on the backdrop. */}
                        <div
                            className="ef-nl-frame"
                            onClick={(e) => {
                                if (!isSlide && e.target === e.currentTarget) dismiss()
                            }}
                        >
                            <div
                                className={cn(
                                    'ef-nl ef-nl-dialog',
                                    `ef-nl--${popup.theme}`,
                                    `ef-nl-dialog--${isSlide ? 'slide' : popup.layout}`,
                                    popup.imagePosition === 'right' && 'is-img-right'
                                )}
                            >
                                <NewsletterPopupCard
                                    ref={emailRef}
                                    popup={popup}
                                    onClose={dismiss}
                                    onDecline={dismiss}
                                    Title={DialogPrimitive.Title}
                                    Description={DialogPrimitive.Description}
                                />
                            </div>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            {teaser && !open && !subscribed && (
                <div className="ef-nl-teaser" role="region" aria-label="Newsletter offer">
                    <button type="button" className="ef-nl-teaser__open" onClick={reopen}>
                        <span className="ef-nl-teaser__icon">
                            {popup.offer.enabled ? <Gift aria-hidden="true" /> : <Mail aria-hidden="true" />}
                        </span>
                        {popup.teaser.text}
                    </button>
                    <button type="button" className="ef-nl-teaser__dismiss" onClick={hideTeaser} aria-label="Hide newsletter offer">
                        <X aria-hidden="true" />
                    </button>
                </div>
            )}
        </>
    )
}

export default NewsletterPopup
