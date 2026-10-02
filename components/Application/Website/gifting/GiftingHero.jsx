'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowDown, ArrowRight, ChevronRight, Gift } from 'lucide-react'
import { formatProductName } from '@/lib/seo'
import { MIN_GIFT_QUANTITY } from '@/lib/giftEnquiry'
import { scrollToElement } from '@/lib/scroll'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { formatINR } from '../storefront/format'
import { COLLECTION_ANCHOR, useGiftingSelection } from './GiftingSelection'
import styles from './gifting.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Where each card sits in the fan, by how many boxes there are. The middle
// (last-listed) card is on top; x / y / w are percentages of the stage.
const FAN = {
    1: [{ x: '22%', y: '6%', r: '-3deg', w: '56%', z: 3 }],
    2: [
        { x: '6%', y: '12%', r: '-8deg', w: '52%', z: 2 },
        { x: '40%', y: '4%', r: '6deg', w: '52%', z: 3 },
    ],
    3: [
        { x: '0%', y: '14%', r: '-10deg', w: '50%', z: 1 },
        { x: '50%', y: '14%', r: '10deg', w: '50%', z: 2 },
        { x: '23%', y: '2%', r: '0deg', w: '54%', z: 3 },
    ],
}
// Pointer parallax depth per card (back cards move less).
const DEPTH = [10, 14, 22]

const SEAL_TEXT = 'Custom branded · Pan-India delivery · '

const jump = (event, id) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    scrollToElement(target)
}

const GiftingHero = ({ products = [] }) => {
    const rootRef = useRef(null)
    const { enquireAbout } = useGiftingSelection()

    const boxes = products.filter((p) => p?.media?.[0]?.secure_url).slice(0, 3)
    const layout = FAN[boxes.length] || []

    useGSAP(() => {
        const root = rootRef.current
        if (!root) return
        const mm = gsap.matchMedia()

        mm.add('(prefers-reduced-motion: no-preference)', () => {
            const lines = root.querySelectorAll('[data-hero-line]')
            const fades = root.querySelectorAll('[data-hero-fade]')
            const cards = gsap.utils.toArray(root.querySelectorAll('[data-hero-card]'))
            const seal = root.querySelector('[data-hero-seal]')

            const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
            intro
                .from(lines, { yPercent: 108, duration: 1.25, stagger: 0.09 }, 0.1)
                .from(fades, { autoAlpha: 0, y: 24, duration: 1, stagger: 0.08, ease: 'power3.out' }, 0.45)
                .from(cards, {
                    autoAlpha: 0,
                    y: 140,
                    rotation: 0,
                    scale: 0.88,
                    duration: 1.5,
                    stagger: 0.12,
                }, 0.25)
            if (seal) intro.from(seal, { scale: 0, rotation: -120, duration: 1.1, ease: 'back.out(1.6)' }, 0.95)

            // Drift the stack up a little as the hero scrolls away.
            const stage = root.querySelector('[data-hero-stage]')
            if (stage) {
                gsap.to(stage, {
                    yPercent: -8,
                    ease: 'none',
                    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
                })
            }
        })

        // Pointer parallax — only for a real mouse, and only with motion on.
        mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
            const cards = gsap.utils.toArray(root.querySelectorAll('[data-hero-card]'))
            if (!cards.length) return
            const movers = cards.map((card, i) => ({
                x: gsap.quickTo(card, 'x', { duration: 0.9, ease: 'power3.out' }),
                y: gsap.quickTo(card, 'y', { duration: 0.9, ease: 'power3.out' }),
                depth: DEPTH[i] ?? 16,
            }))
            const onMove = (event) => {
                const rect = root.getBoundingClientRect()
                const nx = (event.clientX - rect.left) / rect.width - 0.5
                const ny = (event.clientY - rect.top) / rect.height - 0.5
                movers.forEach((m) => {
                    m.x(nx * m.depth * 2)
                    m.y(ny * m.depth * 1.4)
                })
            }
            const onLeave = () => movers.forEach((m) => { m.x(0); m.y(0) })
            root.addEventListener('pointermove', onMove)
            root.addEventListener('pointerleave', onLeave)
            return () => {
                root.removeEventListener('pointermove', onMove)
                root.removeEventListener('pointerleave', onLeave)
            }
        })

        return () => mm.revert()
    }, { scope: rootRef })

    return (
        <section ref={rootRef} className={`ef-on-inverse ${styles.hero}`} aria-labelledby="gifting-title">
            <span aria-hidden="true" className={styles.heroGlow} />
            <span aria-hidden="true" className={styles.heroLines} />

            <div className={`ef-container ${styles.heroInner}`}>
                <div className="min-w-0">
                    <nav aria-label="Breadcrumb" data-hero-fade>
                        <ol className={styles.crumbs}>
                            <li><Link href={WEBSITE_HOME} className="ef-focus">Home</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5 opacity-60" /></li>
                            <li><Link href={WEBSITE_SHOP} className="ef-focus">Shop</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5 opacity-60" /></li>
                            <li><span aria-current="page">Gift Boxes</span></li>
                        </ol>
                    </nav>

                    <span className="ef-eyebrow mt-6" data-hero-fade>
                        Dry fruit gift boxes · Corporate &amp; bulk
                    </span>

                    <h1 id="gifting-title" className={styles.heroTitle}>
                        <span className={styles.line}><span className={styles.lineInner} data-hero-line>Corporate</span></span>
                        <span className={styles.line}><span className={`${styles.lineInner} ${styles.outline}`} data-hero-line>gifting,</span></span>
                        <span className={styles.line}>
                            <span className={styles.lineInner} data-hero-line>done <span className={styles.gold}>right.</span></span>
                        </span>
                    </h1>

                    <p className={styles.heroLead} data-hero-fade>
                        Premium dry fruit gift boxes and hampers for Diwali, client thank-yous and every team milestone.
                        Pick a signature box, or tell us your brief and we&apos;ll put together a branded order at volume pricing.
                    </p>

                    <div className={styles.heroActions} data-hero-fade>
                        <button type="button" className="ef-btn ef-btn--accent ef-btn--lg" onClick={() => enquireAbout()}>
                            Plan a bulk order <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                        </button>
                        {products.length > 0 && (
                            <a href={`#${COLLECTION_ANCHOR}`} onClick={(e) => jump(e, COLLECTION_ANCHOR)} className="ef-btn ef-btn--ghost-light ef-btn--lg">
                                Explore the boxes <ArrowDown aria-hidden="true" />
                            </a>
                        )}
                    </div>

                    <dl className={styles.proof} data-hero-fade>
                        <div>
                            <dt className="sr-only">Minimum order</dt>
                            <dd>
                                <span className={styles.proofValue}>{MIN_GIFT_QUANTITY}+</span>
                                <span className={styles.proofLabel}>boxes for bulk pricing</span>
                            </dd>
                        </div>
                        <div>
                            <dt className="sr-only">Branding</dt>
                            <dd>
                                <span className={styles.proofValue}>Your logo</span>
                                <span className={styles.proofLabel}>on sleeves, cards &amp; notes</span>
                            </dd>
                        </div>
                        <div>
                            <dt className="sr-only">Delivery</dt>
                            <dd>
                                <span className={styles.proofValue}>Pan-India</span>
                                <span className={styles.proofLabel}>delivery, free shipping</span>
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className={styles.fan} data-hero-stage aria-hidden={boxes.length ? undefined : true}>
                    {boxes.length > 0 ? (
                        boxes.map((box, i) => {
                            const pos = layout[i]
                            const name = formatProductName(box.name)
                            const price = formatINR(box.defaultVariant?.sellingPrice ?? box.sellingPrice)
                            const front = pos.z === 3
                            return (
                                <div
                                    key={box._id}
                                    data-hero-card
                                    className={styles.fanCard}
                                    style={{ '--x': pos.x, '--y': pos.y, '--r': pos.r, '--w': pos.w, '--z': pos.z }}
                                >
                                    <Image
                                        src={box.media[0].secure_url}
                                        alt={box.media[0].alt || name}
                                        fill
                                        priority={front}
                                        sizes="(max-width: 1024px) 55vw, 22vw"
                                        className="object-cover"
                                    />
                                    {front && (
                                        <div className={styles.fanCaption}>
                                            <span className={styles.fanName}>{name}</span>
                                            {price && <span className={styles.fanPrice}>{price}</span>}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className={styles.fanEmpty}>
                            <Gift className="size-24" strokeWidth={1} />
                        </div>
                    )}

                    <div className={styles.seal} data-hero-seal aria-hidden="true">
                        <svg viewBox="0 0 100 100" className={styles.sealText}>
                            <defs>
                                <path id="gifting-seal-path" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                            </defs>
                            {/* textLength stretches the phrase to exactly one lap of the circle (2π × 38). */}
                            <text><textPath href="#gifting-seal-path" textLength="237" lengthAdjust="spacing">{SEAL_TEXT}</textPath></text>
                        </svg>
                        <Gift className="size-7" strokeWidth={1.75} />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GiftingHero
