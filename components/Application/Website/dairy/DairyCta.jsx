import Image from 'next/image'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { DairyIcon } from './DairyUi'
import { DAIRY_WHATSAPP_HREF, RANGE_ANCHOR } from './dairyContent'

/**
 * The closing band, in the gifting banner's shape: a rounded pine tile with
 * the pitch and two actions (back up to the aisle / WhatsApp for bulk), an
 * aisle photo filling the other half (above the copy on phones).
 */
const DairyCta = ({ photo }) => (
    <section className="ef-section ef-section--page ef-section--tight" aria-labelledby="dairy-cta-title">
        <div className="ef-container">
            <div className="ef-tile ef-on-inverse grid bg-pine text-cream shadow-elev-3 lg:min-h-[24rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />

                {photo ? (
                    <div className="relative min-h-[13rem] sm:min-h-[16rem] lg:order-last lg:min-h-0">
                        <Image src={photo.src} alt="" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" style={{ objectPosition: photo.position || 'center' }} />
                        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-pine via-pine/10 to-transparent lg:bg-gradient-to-r lg:from-pine lg:via-pine/20" />
                    </div>
                ) : (
                    <div aria-hidden="true" className="relative grid min-h-[11rem] place-items-center lg:order-last">
                        <span className="grid size-36 place-items-center rounded-full bg-sun text-sun-ink shadow-elev-3"><DairyIcon name="milk" className="size-16" /></span>
                    </div>
                )}

                <div className="relative flex flex-col items-start justify-center gap-5 p-[clamp(1.5rem,4vw,3.5rem)]">
                    <span className="ef-eyebrow">From our dairy to yours</span>
                    <h2 id="dairy-cta-title" className="ef-title">
                        Pure dairy, <span className="ef-title__accent">delivered.</span>
                    </h2>
                    <p className="ef-lead max-w-lg">
                        Desi dairy staples, packed within 1-2 working days and shipped free across India. Buying for a
                        family function, a temple or a shop? Message us for bulk.
                    </p>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                        <a href={`#${RANGE_ANCHOR}`} className="ef-btn ef-btn--accent ef-btn--lg">
                            Shop dairy <ArrowUp aria-hidden="true" />
                        </a>
                        <a href={DAIRY_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="ef-btn ef-btn--ghost-light ef-btn--lg">
                            <MessageCircle aria-hidden="true" /> Bulk orders on WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
)

export default DairyCta
