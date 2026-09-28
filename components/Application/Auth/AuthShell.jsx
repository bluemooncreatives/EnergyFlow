'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowLeft } from 'lucide-react'
import { WEBSITE_HOME } from '@/routes/WebsiteRoute'
import Logo from '@/public/assets/images/hero/logo.png'
import { NewsletterArt, NewsletterTitle, PerkCheck } from '../Website/newsletter/NewsletterParts'

gsap.registerPlugin(useGSAP)

export const NO_REDUCED_MOTION = '(prefers-reduced-motion: no-preference)'

/**
 * The one card every auth page renders: the newsletter popup's pine art
 * panel (logo, back link, a display line and perks) beside a cream form body.
 * On phones the art collapses to a short band, as in the popup.
 *
 * art: { title, accent, lead, perks[] } — the panel's copy (desktop only)
 */
const AuthShell = ({ art, children }) => {
    const cardRef = useRef(null)

    // Entrance: the card rises in and the panel copy follows. The form's own
    // items are staggered by AuthStep.
    useGSAP(() => {
        const card = cardRef.current
        const mm = gsap.matchMedia()

        mm.add(NO_REDUCED_MOTION, () => {
            gsap.timeline({ defaults: { ease: 'power3.out' } })
                .fromTo(card, { autoAlpha: 0, y: 28, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, clearProps: 'transform' })
                .from('[data-auth-art-item]', { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.08, clearProps: 'transform,opacity,visibility' }, 0.2)
        })

        // Hands visibility over from the CSS pre-state to the timeline.
        card.dataset.motion = 'ready'
    }, { scope: cardRef })

    return (
        <div ref={cardRef} className="ef-auth-card" data-motion="pending">
            <aside className="ef-auth-art ef-nl ef-nl--pine" aria-label="Energyflow">
                <NewsletterArt />

                <div className="ef-auth-art__top">
                    <Link href={WEBSITE_HOME} className="ef-auth-logo" data-auth-art-item aria-label="Energyflow home">
                        <Image src={Logo} alt="" sizes="68px" priority />
                    </Link>
                    <Link href={WEBSITE_HOME} className="ef-auth-back" data-auth-art-item>
                        <ArrowLeft aria-hidden="true" />
                        Back to store
                    </Link>
                </div>

                {art && (
                    <div className="ef-auth-art__foot">
                        <div data-auth-art-item>
                            <NewsletterTitle as="p" title={art.title} accent={art.accent} />
                        </div>
                        {art.lead && <p data-auth-art-item className="ef-nl-lead max-w-[26rem]">{art.lead}</p>}
                        {art.perks?.length > 0 && (
                            <ul data-auth-art-item className="ef-nl-perks">
                                {art.perks.map((perk) => (
                                    <li key={perk}><PerkCheck />{perk}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </aside>

            <section className="ef-auth-body ef-nl ef-nl--cream">
                {children}
            </section>
        </div>
    )
}

export default AuthShell
