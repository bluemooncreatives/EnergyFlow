'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowLeft } from 'lucide-react'
import { WEBSITE_HOME } from '@/routes/WebsiteRoute'
import Logo from '@/public/assets/images/hero/logo.png'
import { NewsletterArt, NewsletterBadge, NewsletterTitle, PerkCheck } from '../Website/newsletter/NewsletterParts'

gsap.registerPlugin(useGSAP)

export const NO_REDUCED_MOTION = '(prefers-reduced-motion: no-preference)'

/**
 * The one card every auth page renders: the newsletter popup's pine art
 * panel (logo, back link, a display line and perks) beside a cream form body,
 * with the rotating seal riding the seam. On phones the art collapses to a
 * short band and the seal sits on its corner, as in the popup.
 *
 * art:  { title, accent, lead, perks[] }  — the panel's copy (desktop only)
 * seal: { ring, icon }                     — ring text + centre icon
 */
const AuthShell = ({ art, seal, children }) => {
    const cardRef = useRef(null)

    // Entrance: the card rises in, the panel copy follows and the seal spins
    // into place. The form's own items are staggered by AuthStep.
    useGSAP(() => {
        const card = cardRef.current
        const mm = gsap.matchMedia()

        mm.add(NO_REDUCED_MOTION, () => {
            gsap.timeline({ defaults: { ease: 'power3.out' } })
                .fromTo(card, { autoAlpha: 0, y: 28, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, clearProps: 'transform' })
                .from('[data-auth-art-item]', { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.08 }, 0.2)
                .from('[data-auth-seal]', { autoAlpha: 0, scale: 0.4, rotate: -70, duration: 1, ease: 'back.out(1.7)' }, 0.35)
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

            <div className="ef-auth-seal" data-auth-seal>
                <NewsletterBadge ring={seal?.ring} icon={seal?.icon} />
            </div>

            <section className="ef-auth-body ef-nl ef-nl--cream">
                {children}
            </section>
        </div>
    )
}

export default AuthShell
