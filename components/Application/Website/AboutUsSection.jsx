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
    intro: 'is a healthy food brand from Pune bringing premium dry fruits, nuts, seeds, super foods, millets, cold pressed oils and A2 Gir cow bilona ghee under one roof.',
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

// SplitText masks clip at the line box, which trims descenders (g, y, p) on
// tight display leading. Give every mask a little room below the baseline.
const MASK_ROOM = '[&_.ef-w-mask]:pb-[0.14em] [&_.ef-w-mask]:-mb-[0.14em]'

// Photo frame used across the section. Three layers so each motion owns its
// own transform: the frame is clipped open, the middle layer drifts on scroll
// (parallax), and the inner layer settles from a zoom. The <img> itself only
// takes the hover zoom.
const Frame = ({ image, sizes, reveal = 'up', parallax = 0, className, imgClassName }) => (
    <div data-img-reveal={reveal} className={cn('group relative overflow-hidden rounded-well bg-surface-well', className)}>
        <div
            data-parallax={parallax || undefined}
            className={cn('absolute inset-x-0', parallax ? '-top-[10%] h-[120%]' : 'inset-y-0')}
        >
            <div data-img-media className="absolute inset-0">
                <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={sizes}
                    className={cn(
                        'object-cover transition-transform duration-[1200ms] ease-[var(--ease-spring)] group-hover:scale-[1.045] motion-reduce:transition-none',
                        imgClassName
                    )}
                />
            </div>
        </div>
    </div>
)

const AboutUsSection = ({ tone = 'sunken' }) => {
    const sectionRef = useRef(null)

    useGSAP(() => {
        const root = sectionRef.current
        if (!root) return
        const q = gsap.utils.selector(root)
        const mm = gsap.matchMedia()

        mm.add(
            {
                motion: '(prefers-reduced-motion: no-preference)',
                desktop: '(min-width: 1024px)',
            },
            ({ conditions }) => {
                if (!conditions.motion) return

                // ── Display type: words rise out of a mask, slightly tilted ──
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

                // ── Photos: clip open, then settle from a zoom ──
                q('[data-img-reveal]').forEach((frame, i) => {
                    const media = frame.querySelector('[data-img-media]')
                    const r = getComputedStyle(frame).borderTopLeftRadius || '0px'
                    const closed = frame.dataset.imgReveal === 'left'
                        ? `inset(0% 100% 0% 0% round ${r})`
                        : `inset(100% 0% 0% 0% round ${r})`

                    gsap.timeline({
                        scrollTrigger: { trigger: frame, start: 'top 88%', once: true },
                        delay: (i % 3) * 0.08,
                    })
                        .fromTo(frame,
                            { clipPath: closed },
                            { clipPath: `inset(0% 0% 0% 0% round ${r})`, duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' })
                        .fromTo(media,
                            { scale: 1.32 },
                            { scale: 1, duration: 1.9, ease: 'expo.out', clearProps: 'transform' },
                            0.15)
                })

                // Parallax drift inside the frame (the layer is 120% tall, so
                // ±8% of it never exposes an edge).
                q('[data-parallax]').forEach((layer) => {
                    const amount = parseFloat(layer.dataset.parallax)
                    gsap.fromTo(layer, { yPercent: -amount }, {
                        yPercent: amount,
                        ease: 'none',
                        scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
                    })
                })

                // Whole elements floating at their own scroll speed, desktop only
                // so the stacked phone layout stays still.
                if (conditions.desktop) {
                    q('[data-float]').forEach((el) => {
                        const amount = parseFloat(el.dataset.float)
                        gsap.fromTo(el, { y: amount }, {
                            y: -amount,
                            ease: 'none',
                            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
                        })
                    })
                }

                // ── Small copy: soft fade up, batched as it enters ──
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

                // ── Mission: words ink in as you scroll, the rule draws between ──
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
                        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'none' })
                        .fromTo(tail, { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: 'none' })
                }
            }
        )

        // This section is lazy-loaded below several lazily hydrated sections,
        // so trigger positions measured now can go stale once that content
        // settles. Re-measure after it has.
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
        <Section ref={sectionRef} tone={tone} aria-labelledby="about-title" className={cn('overflow-hidden', MASK_ROOM)}>

            {/* ── Display heading: an indented olive kicker over a line that
                   splits across the grid, its second half starting where the
                   photo columns begin. ── */}
            <h2
                id="about-title"
                data-rise-group
                className="m-0 text-[clamp(2.25rem,0.9rem+4vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.035em] text-ink-strong"
            >
                <span data-rise className="block text-fern lg:pl-[calc(100%/12)]">
                    {CONTENT.kicker}
                </span>
                <span className="block lg:grid lg:grid-cols-12 lg:gap-x-6">
                    <span data-rise data-delay="0.12" className="lg:col-span-6 lg:whitespace-nowrap">
                        {CONTENT.titleLead}
                    </span>{' '}
                    <span data-rise data-delay="0.24" className="lg:col-span-6 lg:col-start-7">
                        {CONTENT.titleTail}
                    </span>
                </span>
            </h2>

            {/* ── Editorial grid ──
                 Phone: intro, feature photo, a two-up of photos, mission.
                 Desktop (12 cols): intro / thumbnail / mission stacked on the
                 left, a square photo with its caption in the middle, and the
                 large feature photo holding the full height on the right. */}
            <div className="mt-[clamp(2.5rem,5vw,4.5rem)] grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:gap-x-6 lg:gap-y-8">

                <div className="col-span-2 flex flex-col items-start gap-4 lg:col-span-4 lg:col-start-1 lg:row-start-1">
                    <span data-fade className="text-[0.75rem] text-ink-muted">({CONTENT.label})</span>
                    <p data-fade className="m-0 max-w-[34ch] text-[0.9375rem] leading-[1.65] text-ink-body">
                        <strong className="font-semibold text-ink-strong">{CONTENT.brandName}</strong>{' '}{CONTENT.intro}
                    </p>
                    <div data-fade>
                        <StoreLink href="/about-us">Read our story</StoreLink>
                    </div>
                </div>

                <Frame
                    image={images.feature}
                    parallax={8}
                    sizes="(max-width: 1024px) 92vw, 40vw"
                    imgClassName="object-top"
                    className="col-span-2 aspect-square lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1 lg:self-start"
                />

                <figure className="m-0 flex flex-col gap-4 lg:col-span-3 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:self-start">
                    <Frame
                        image={images.store}
                        parallax={6}
                        sizes="(max-width: 1024px) 46vw, 22vw"
                        className="aspect-square"
                    />
                    <figcaption data-fade className="max-w-[30ch] text-[0.8125rem] leading-[1.55] text-ink-body">
                        {CONTENT.caption}
                    </figcaption>
                </figure>

                <div data-float="28" className="lg:col-start-1 lg:row-start-2 lg:self-end">
                    <Frame
                        image={images.seeds}
                        reveal="left"
                        sizes="(max-width: 1024px) 46vw, 128px"
                        className="aspect-square w-full lg:w-[clamp(5.5rem,9vw,8rem)]"
                    />
                </div>

                <p
                    data-mission
                    className="col-span-2 m-0 max-w-[30ch] text-[clamp(1.25rem,0.95rem+0.9vw,1.75rem)] font-medium leading-[1.3] tracking-[-0.015em] text-ink-strong lg:col-span-6 lg:col-start-1 lg:row-start-3 lg:self-end"
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
            </div>
        </Section>
    )
}

export default AboutUsSection
