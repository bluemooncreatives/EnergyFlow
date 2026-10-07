import Image from 'next/image'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { EnquireButton } from './GiftingSelection'
import { WHATSAPP_HREF, pickImage } from './GiftingUi'

/**
 * The closing band, after the reference's "Join us" banner: a rounded pine
 * tile with the bulk-order pitch and its two actions, a photograph filling
 * the other half (above the copy on phones). Without any photo the pine
 * artwork carries it alone.
 */
const GiftCtaBanner = ({ content, photos = [] }) => {
    const art = pickImage(content.image, photos, 2)

    return (
        <section className="ef-section ef-section--page ef-section--tight" aria-labelledby="gift-cta-title">
            <div className="ef-container">
                <div className="ef-tile ef-on-inverse grid bg-pine text-cream shadow-elev-3 lg:min-h-[26rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />

                    {art && (
                        <div className="relative min-h-[13rem] sm:min-h-[16rem] lg:order-last lg:min-h-0">
                            <Image src={art.src} alt={art.alt} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" style={{ objectPosition: art.position }} />
                            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-pine via-pine/10 to-transparent lg:bg-gradient-to-r lg:from-pine lg:via-pine/20" />
                        </div>
                    )}

                    <div className="relative flex flex-col items-start justify-center gap-5 p-[clamp(1.5rem,4vw,3.5rem)]">
                        {content.eyebrow && <span className="ef-eyebrow">{content.eyebrow}</span>}
                        <h2 id="gift-cta-title" className="ef-title">
                            {content.title}
                            {content.titleAccent && <> <span className="ef-title__accent">{content.titleAccent}</span></>}
                        </h2>
                        {content.description && <p className="ef-lead max-w-lg">{content.description}</p>}
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                            {/* ef-btn, not ef-cta: on a pine band .ef-cta turns outline. */}
                            <EnquireButton className="ef-btn ef-btn--accent ef-btn--lg">
                                {content.buttonLabel} <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                            </EnquireButton>
                            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="ef-btn ef-btn--ghost-light ef-btn--lg">
                                <MessageCircle aria-hidden="true" /> WhatsApp us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GiftCtaBanner
