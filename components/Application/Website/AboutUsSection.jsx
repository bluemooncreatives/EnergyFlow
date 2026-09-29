'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'
import Section from './storefront/Section'
import { StoreLink } from './storefront/StoreButton'

gsap.registerPlugin(ScrollTrigger, SplitText)

const CONTENT = {
    kicker: 'More than a dry fruits store',
    titleLead: 'Good nutrition,',
    titleTail: 'easy to trust.',
    label: 'A bit about us',
    brandName: 'Energyflow',
    intro: 'is a healthy food brand from New Delhi bringing premium dry fruits, nuts, seeds, super foods, millets, cold pressed oils and A2 Gir cow bilona ghee under one roof.',
    caption: 'We source from growers we can vouch for, check every lot for freshness and grade, and pack it to protect taste on the way to you.',
    missionLead: 'Our promise is simple: food that is honest, fresh and fairly priced',
    missionTail: 'nothing we would not serve at home.',
    images: {
        feature: {
            src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911947/file_00000000d82c8211bcfd587359eeba52.png',
            alt: 'Energyflow premium dry fruits and super foods',
        },
        store: {
            src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911947/IMG_20260920_190814.jpg.jpg',
            alt: 'Inside the Energyflow dry fruits and super food store',
        },
        seeds: {
            src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911945/270e856f021e3e06a3dd84d344bdc8d1.jpg.jpg',
            alt: 'Nuts and seeds from the Energyflow range',
        },
    },
}

const MASK_ROOM = '[&_.ef-w-mask]:pb-[0.14em] [&_.ef-w-mask]:-mb-[0.14em]'

// ── Four-pointed star / diamond ornament ─────────────────────────
// Rendered at every seam junction point between scallops.
const DiamondStar = ({ size = 40 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        {/* Outer four-pointed star */}
        <path
            d="M20 1 L22.5 17.5 L39 20 L22.5 22.5 L20 39 L17.5 22.5 L1 20 L17.5 17.5 Z"
            fill="var(--brand-cream, #F7F3E8)"
            stroke="var(--brand-primary, #0B3D2E)"
            strokeWidth="0.8"
        />
        {/* Inner accent circle */}
        <circle cx="20" cy="20" r="3" fill="var(--brand-primary-bright, #2F6B3F)" />
    </svg>
)

const AboutUsSection = ({ tone = 'sunken' }) => {
    const sectionRef   = useRef(null)
    const stripRef     = useRef(null)
    const leftRef      = useRef(null)
    const rightRef     = useRef(null)
    const leftWrapRef  = useRef(null)
    const rightWrapRef = useRef(null)

    useGSAP(() => {
        const root = sectionRef.current
        if (!root) return
        const q  = gsap.utils.selector(root)
        const mm = gsap.matchMedia()

        mm.add(
            {
                motion:  '(prefers-reduced-motion: no-preference)',
                desktop: '(min-width: 1024px)',
            },
            ({ conditions }) => {
                if (!conditions.motion) return

                // ── Display type: words rise out of a mask ──
                q('[data-rise]').forEach((el) => {
                    const split = SplitText.create(el, {
                        type: 'words',
                        mask: 'words',
                        wordsClass: 'ef-w',
                        tag: 'span',
                        aria: 'none',
                    })
                    gsap.from(split.words, {
                        yPercent: 118,
                        rotate: 3,
                        transformOrigin: '0% 100%',
                        duration: 1.25,
                        ease: 'expo.out',
                        stagger: 0.07,
                        delay: parseFloat(el.dataset.delay || 0),
                        scrollTrigger: {
                            trigger: el.closest('[data-rise-group]') || el,
                            start: 'top 82%',
                            once: true,
                        },
                    })
                })

                // ── Collage strip: fade + lift on entry ──
                const strip = stripRef.current
                if (strip) {
                    gsap.from(strip, {
                        y: 48,
                        autoAlpha: 0,
                        duration: 1.2,
                        ease: 'expo.out',
                        scrollTrigger: { trigger: strip, start: 'top 88%', once: true },
                    })
                }

                // ── Left panel: slide in from left + inner photo settle ──
                const left = leftRef.current
                if (left && leftWrapRef.current) {
                    gsap.timeline({
                        scrollTrigger: { trigger: strip, start: 'top 88%', once: true },
                    })
                        .from(left, { x: '-15%', autoAlpha: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity' })
                        .from(leftWrapRef.current, { scale: 1.22, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0)
                }

                // ── Right panel: slide in from right + inner photo settle ──
                // NOTE: We do NOT animate clipPath here — the SVG seam clip
                // is set as an inline style and must NOT be cleared by GSAP.
                const right = rightRef.current
                if (right && rightWrapRef.current) {
                    gsap.timeline({
                        scrollTrigger: { trigger: strip, start: 'top 88%', once: true },
                        delay: 0.1,
                    })
                        .from(right, { x: '15%', autoAlpha: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity' })
                        .from(rightWrapRef.current, { scale: 1.22, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0)
                }

                // ── Parallax drift on scroll (desktop only) ──
                if (conditions.desktop) {
                    const pairs = [
                        [leftRef.current,  leftWrapRef.current,  -6],
                        [rightRef.current, rightWrapRef.current,  6],
                    ]
                    pairs.forEach(([trigger, layer, amount]) => {
                        if (!layer) return
                        gsap.fromTo(layer, { yPercent: -Math.abs(amount) }, {
                            yPercent: Math.abs(amount),
                            ease: 'none',
                            scrollTrigger: {
                                trigger,
                                start: 'top bottom',
                                end: 'bottom top',
                                scrub: true,
                            },
                        })
                    })

                    // Floating seed thumbnail drifts at its own speed
                    q('[data-float]').forEach((el) => {
                        const amount = parseFloat(el.dataset.float)
                        gsap.fromTo(el, { y: amount }, {
                            y: -amount,
                            ease: 'none',
                            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
                        })
                    })
                }

                // ── Small copy: soft fade up ──
                const fades = q('[data-fade]')
                gsap.set(fades, { autoAlpha: 0, y: 22 })
                ScrollTrigger.batch(fades, {
                    start: 'top 90%',
                    once: true,
                    onEnter: (batch) => gsap.to(batch, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1,
                        ease: 'power3.out',
                        stagger: 0.09,
                        overwrite: true,
                    }),
                })

                // ── Mission: words ink in on scroll ──
                const mission = q('[data-mission]')[0]
                if (mission) {
                    const [leadEl, tailEl] = mission.querySelectorAll('[data-mission-words]')
                    const rule = mission.querySelector('[data-mission-rule]')
                    const splitOpts = { type: 'words', tag: 'span', aria: 'none' }
                    const lead = SplitText.create(leadEl, splitOpts).words
                    const tail = SplitText.create(tailEl, splitOpts).words

                    gsap.timeline({
                        scrollTrigger: { trigger: mission, start: 'top 85%', end: 'bottom 50%', scrub: 0.8 },
                    })
                        .fromTo(lead, { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: 'none' })
                        .fromTo(rule,  { scaleX: 0 },    { scaleX: 1, duration: 0.5, ease: 'none' })
                        .fromTo(tail,  { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: 'none' })
                }
            }
        )

        const lateRefresh = () => ScrollTrigger.refresh()
        const timer = setTimeout(lateRefresh, 300)
        window.addEventListener('load', lateRefresh)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('load', lateRefresh)
            mm.revert()
        }
    }, { scope: sectionRef })

    const { images } = CONTENT

    return (
        <Section
            ref={sectionRef}
            tone={tone}
            aria-labelledby="about-title"
            className={cn('overflow-hidden', MASK_ROOM)}
        >

            {/* ── HEADER: kicker + display title (left), intro text + CTA (right) ── */}
            <div
                data-rise-group
                className="mb-[clamp(2rem,4vw,3.5rem)] grid grid-cols-1 items-end gap-[clamp(1.5rem,3vw,2.5rem)] md:grid-cols-[1fr_auto]"
            >
                <div>
                    <span
                        data-rise
                        className="mb-3 block font-body text-[0.75rem] font-medium uppercase tracking-[0.2em] text-[var(--brand-primary-bright)]"
                    >
                        {CONTENT.kicker}
                    </span>
                    <h2
                        id="about-title"
                        className="m-0 text-[clamp(2.25rem,1rem+4vw,4.5rem)] font-medium leading-[1.02] text-ink-strong"
                    >
                        <span data-rise data-delay="0.1" className="block">{CONTENT.titleLead}</span>
                        <span data-rise data-delay="0.22" className="block text-[var(--brand-primary-bright)]">{CONTENT.titleTail}</span>
                    </h2>
                </div>

                <div className="flex max-w-[32ch] flex-col gap-4 md:max-w-[28ch]">
                    <p data-fade className="m-0 text-[0.9375rem] leading-[1.65] text-ink-body">
                        <strong className="font-semibold text-ink-strong">{CONTENT.brandName}</strong>
                        {' '}{CONTENT.intro}
                    </p>
                    <div data-fade>
                        <StoreLink href="/about-us">Read our story</StoreLink>
                    </div>
                </div>
            </div>

            {/*
              ═══════════════════════════════════════════════════════════════
              CONNECTED COLLAGE STRIP — zero-gap seamless scalloped seam

              HOW THE GAP-FREE SEAM WORKS:
              ──────────────────────────────
              Instead of clipping both panels with mirrored paths (which
              requires matching objectBoundingBox coordinates across different
              panel widths and creates gaps at the concave parts), we:

              1. LEFT panel  → plain rectangle, position absolute, 0–55 % wide.
              2. RIGHT panel → position absolute, starts at 40 %, extends to
                 100 %. It physically OVERLAPS the left panel by 15 %.
              3. The RIGHT panel has a clip-path with 4 scalloped bites on its
                 left edge. Because the left panel extends past every concave
                 point of the right panel's clip, the left image ALWAYS shows
                 through the bites — zero gap, zero background exposed.
              4. z-index: right panel is on top (z-index: 1) so its clip edge
                 is the ONLY visible seam.

              CLIP-PATH COORDINATE MATH (objectBoundingBox, right panel):
              ──────────────────────────────────────────────────────────────
              Right panel width  = 60 % of strip  (starts at 40 %, ends 100 %)
              Seam center        = strip 52 %
                                 = local (52-40)/60 = 0.2000
              Scallop depth      = strip 38 %  (14 % into left panel space)
                                 = local (38-40)/60 = -0.0333

              4 scallops → junctions at local Y = 0, 0.25, 0.50, 0.75, 1.0
              Each scallop goes from junction (X=0.20) → depth (X=-0.033)
              → back to junction (X=0.20).

              Left panel covers 0–55 % of strip, so at scallop depth (38 %)
              the left panel (which goes to 55 %) ALWAYS covers it. ✓ No gap.
              ═══════════════════════════════════════════════════════════════
            */}
            <div
                ref={stripRef}
                className="relative overflow-hidden"
                style={{
                    marginInline: 'calc(var(--website-gutter) * -1)',
                    height: 'clamp(20rem, 36vw, 42rem)',
                }}
            >
                {/*
                  Hidden SVG that defines the single seam clip-path.
                  Only the RIGHT panel uses this clip. The id is specific
                  enough to avoid conflicts if this component appears twice.
                  We use `overflow: visible` on the svg so browsers don't
                  silently drop the defs (some blink versions had this quirk).
                */}
                <svg
                    aria-hidden="true"
                    focusable="false"
                    style={{
                        position: 'absolute',
                        width: 0,
                        height: 0,
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                >
                    <defs>
                        {/*
                          4-scallop seam on the right panel's LEFT edge.
                          Each scallop covers 25 % of the strip height.
                          Junction X = 0.20 (strip 52 %)
                          Bite X    = -0.033 (strip 38 %)

                          Control points are chosen so the curve looks like
                          smooth circular arcs (not pointed zigzags):
                            C junction,0.045  bite,0.08  bite,0.125
                            C bite,0.17       junction,0.21 junction,0.25
                          … repeated four times.
                        */}
                        <clipPath id="ef-about-seam-clip" clipPathUnits="objectBoundingBox">
                            <path d="
                                M 1,0
                                L 0.20,0
                                C 0.20,0.045  -0.033,0.08  -0.033,0.125
                                C -0.033,0.17  0.20,0.21   0.20,0.25
                                C 0.20,0.295  -0.033,0.33  -0.033,0.375
                                C -0.033,0.42  0.20,0.46   0.20,0.50
                                C 0.20,0.545  -0.033,0.58  -0.033,0.625
                                C -0.033,0.67  0.20,0.71   0.20,0.75
                                C 0.20,0.795  -0.033,0.83  -0.033,0.875
                                C -0.033,0.92  0.20,0.96   0.20,1.0
                                L 1,1
                                Z
                            " />
                        </clipPath>
                    </defs>
                </svg>

                {/* ══ LEFT PANEL ══════════════════════════════════════════
                    Plain rectangle — 0 to 55 % of strip.
                    Extends 15 % past the seam center (strip 52 %) so the
                    left image fills every scallop bite of the right panel.
                    No clip-path needed: simple overflow:hidden rectangle.
                   ══════════════════════════════════════════════════════ */}
                <div
                    ref={leftRef}
                    className="group absolute inset-y-0 left-0 overflow-hidden bg-surface-well"
                    style={{ width: '55%' }}
                >
                    {/* Parallax wrapper — 24 % taller so drift never exposes an edge */}
                    <div
                        ref={leftWrapRef}
                        className="absolute inset-x-0"
                        style={{ top: '-12%', bottom: '-12%' }}
                    >
                        <Image
                            src={images.store.src}
                            alt={images.store.alt}
                            fill
                            sizes="(max-width: 639px) 100vw, 56vw"
                            className="object-cover object-center transition-transform duration-[1200ms] ease-[var(--ease-spring)] group-hover:scale-[1.045] motion-reduce:transition-none"
                            priority
                        />
                    </div>

                    {/* Brand label anchored to the bottom-left */}
                    <div className="absolute bottom-[clamp(1rem,2vw,1.75rem)] left-[clamp(1.25rem,3vw,2.5rem)] z-[4]">
                        <span
                            className="inline-flex items-center gap-[0.375rem] rounded-full px-[0.75rem] py-[0.3125rem] text-[0.75rem] font-medium uppercase tracking-[0.06em] text-[var(--on-brand)] backdrop-blur-[8px]"
                            style={{ background: 'color-mix(in srgb, var(--brand-primary) 88%, transparent)' }}
                        >
                            <span className="h-[6px] w-[6px] rounded-full bg-[var(--brand-amber)]" aria-hidden="true" />
                            {CONTENT.label}
                        </span>
                    </div>
                </div>

                {/* ══ RIGHT PANEL ═════════════════════════════════════════
                    Starts at 40 % — physically overlaps the left panel by
                    15 %. The SVG clip-path creates 4 scalloped bites on the
                    left edge; the left panel content shows through every bite.
                    z-index:1 puts this panel on top so its clip edge is the
                    only visible seam between the two photos.
                   ══════════════════════════════════════════════════════ */}
                <div
                    ref={rightRef}
                    className="group absolute inset-y-0 right-0 overflow-hidden bg-surface-well"
                    style={{
                        left: '40%',
                        clipPath: 'url(#ef-about-seam-clip)',
                        zIndex: 1,
                    }}
                >
                    {/* Parallax wrapper */}
                    <div
                        ref={rightWrapRef}
                        className="absolute inset-x-0"
                        style={{ top: '-12%', bottom: '-12%' }}
                    >
                        <Image
                            src={images.feature.src}
                            alt={images.feature.alt}
                            fill
                            sizes="(max-width: 639px) 100vw, 62vw"
                            className="object-cover object-center transition-transform duration-[1200ms] ease-[var(--ease-spring)] group-hover:scale-[1.045] motion-reduce:transition-none"
                            priority
                        />
                    </div>

                    {/* Glassmorphism caption pill */}
                    <div className="absolute bottom-[clamp(1rem,2.5vw,2rem)] right-[clamp(1rem,3vw,2.5rem)] z-[4]">
                        <span
                            className="inline-flex items-center gap-[0.5rem] rounded-full border border-white/40 px-[1rem] py-[0.5rem] text-[0.8125rem] font-medium text-ink-strong backdrop-blur-[10px]"
                            style={{ background: 'color-mix(in srgb, var(--surface-card) 88%, transparent)' }}
                        >
                            <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[var(--brand-primary-bright)]" aria-hidden="true" />
                            Premium. Honest. Fresh.
                        </span>
                    </div>
                </div>

                {/*
                  ── SEAM JUNCTION STARS ───────────────────────────────
                  Four-pointed diamond stars sit at each scallop junction
                  (where one scallop ends and the next begins). With 4
                  scallops the junctions are at Y = 0%, 25%, 50%, 75%, 100%.
                  We render 3 visible ones (25%, 50%, 75%) — the edge ones
                  are hidden by the strip's overflow:hidden.

                  Star X = seam junction X = 52% of strip width.
                */}
                {[25, 50, 75].map((yPct) => (
                    <div
                        key={yPct}
                        className="pointer-events-none absolute z-[10]"
                        style={{
                            left: '52%',
                            top: `${yPct}%`,
                            transform: 'translate(-50%, -50%)',
                            animation: `starPulse ${3.5 + yPct * 0.01}s ease-in-out infinite`,
                            animationDelay: `${yPct * 0.08}s`,
                        }}
                        aria-hidden="true"
                    >
                        <DiamondStar
                            size={yPct === 50 ? 44 : 34}
                        />
                    </div>
                ))}

                {/* ── FLOATING SEED THUMBNAIL ── */}
                <div
                    data-float="20"
                    className="absolute z-[12] hidden sm:block"
                    style={{
                        bottom: 'clamp(-1.5rem, -2.5vw, -2.5rem)',
                        left: 'clamp(1.5rem, 5vw, 5rem)',
                    }}
                >
                    <div
                        className="relative overflow-hidden rounded-[14px] border-[3px] border-[var(--surface-card)] bg-surface-well transition-transform duration-[600ms] ease-[var(--ease-spring)] hover:-translate-y-1"
                        style={{
                            width: 'clamp(4.5rem, 7vw, 6.5rem)',
                            height: 'clamp(4.5rem, 7vw, 6.5rem)',
                            boxShadow: '0 8px 24px rgb(11 61 46 / 0.18)',
                        }}
                    >
                        <Image
                            src={images.seeds.src}
                            alt={images.seeds.alt}
                            fill
                            sizes="(max-width: 639px) 0vw, 7vw"
                            className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-spring)] hover:scale-[1.07]"
                        />
                    </div>
                </div>
            </div>

            {/* ── MISSION BAND ── */}
            <div className="mt-[clamp(3.5rem,6vw,6rem)] flex flex-wrap items-start gap-[clamp(1.5rem,3vw,3.5rem)]">
                <p
                    data-mission
                    className="m-0 max-w-[36ch] flex-[1_1_28ch] text-[clamp(1.125rem,0.85rem+0.8vw,1.5rem)] font-medium leading-[1.35] tracking-[-0.015em] text-ink-strong"
                >
                    <span data-mission-words>{CONTENT.missionLead}</span>
                    <span
                        data-mission-rule
                        aria-hidden="true"
                        className="mx-3 inline-block h-px w-[clamp(2.5rem,5vw,4.5rem)] origin-left bg-current align-middle"
                    />
                    <span className="sr-only">, </span>
                    <span data-mission-words>{CONTENT.missionTail}</span>
                </p>

                <p
                    data-fade
                    className="m-0 max-w-[26ch] flex-[0_0_auto] border-l border-[var(--line-rule,rgb(0_0_0/0.12))] pl-[1.25rem] text-[0.8125rem] leading-[1.6] text-ink-muted max-sm:border-l-0 max-sm:border-t max-sm:pl-0 max-sm:pt-4"
                >
                    {CONTENT.caption}
                </p>
            </div>
        </Section>
    )
}

export default AboutUsSection
