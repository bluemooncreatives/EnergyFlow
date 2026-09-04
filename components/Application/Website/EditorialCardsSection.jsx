'use client'

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'

gsap.registerPlugin(ScrollTrigger)

const CARDS = [
    {
        num: '01',
        heading: 'Our Story',
        description: "Crafted with a mother's love — each piece carries the warmth, care, and attention that defines who we are.",
        cta: 'Discover More',
        href: '/about-us',
        image: 'https://res.cloudinary.com/darrsi9y2/image/upload/v1783145809/mom.stitched_1770484683_3827423237227958318_47423868805_yw1u6u.png',
        overlay: 'bg-gradient-to-t from-black/80 via-black/30 to-black/10',
    },
    {
        num: '02',
        heading: 'Shop Now',
        description: 'From everyday essentials to statement pieces — explore our full range of thoughtfully designed clothing.',
        cta: 'Shop Collection',
        href: WEBSITE_SHOP,
        image: '/assets/images/hero/01.webp',
        overlay: 'bg-gradient-to-t from-[var(--dark-red)]/90 via-[var(--dark-red)]/25 to-transparent',
    },
    {
        num: '03',
        heading: 'Contact Us',
        description: "Have a question or need help finding the right fit? We're always here to help you.",
        cta: 'Get In Touch',
        href: '/contact',
        image: 'https://res.cloudinary.com/darrsi9y2/image/upload/v1783145808/medha111_1744463187_3609141260625880268_2034285964_kpfguy.jpg',
        overlay: 'bg-gradient-to-t from-black/85 via-black/35 to-black/10',
    },
]

const EditorialCardsSection = () => {
    const sectionRef = useRef(null)
    const headerRef = useRef(null)
    const ruleRef = useRef(null)
    const cardRefs = useRef([])
    const imgRefs = useRef([])

    useGSAP(() => {
        gsap.fromTo(
            headerRef.current,
            { autoAlpha: 0, y: 40 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.9,
                ease: 'power4.out',
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
            }
        )

        gsap.fromTo(
            ruleRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            {
                scaleX: 1,
                duration: 1.2,
                ease: 'expo.inOut',
                delay: 0.12,
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
            }
        )

        gsap.fromTo(
            cardRefs.current,
            { autoAlpha: 0, y: 50, scale: 0.97 },
            {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.95,
                ease: 'power4.out',
                stagger: 0.1,
                scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
            }
        )
    }, { scope: sectionRef })

    const handleEnter = (i) => {
        if (!imgRefs.current[i]) return
        gsap.to(imgRefs.current[i], { scale: 1.07, duration: 0.7, ease: 'power2.out', overwrite: true })
    }

    const handleLeave = (i) => {
        if (!imgRefs.current[i]) return
        gsap.to(imgRefs.current[i], { scale: 1, duration: 0.7, ease: 'power2.out', overwrite: true })
    }

    return (
        <section ref={sectionRef} className="website-gutter bg-background pt-[clamp(1.25rem,2.5vw,2rem)] pb-[clamp(2rem,4vw,3.5rem)]">

            {/* section header */}
            <div ref={headerRef} className="mb-4 flex items-end justify-between lg:mb-6">
                <div>
                    <p className="text-[1rem] font-semibold uppercase text-[var(--dark-red)]/60">
                        Explore More
                    </p>
                    <h2 className="mt-1.5 font-neue text-[clamp(1.8rem,4.8vw,3.8rem)] font-medium uppercase text-[var(--dark-red-2)]">
                        The Full Picture
                    </h2>
                </div>
                <span className="hidden text-[0.68rem] font-semibold uppercase text-muted-foreground sm:block">
                    Story · Shop · Connect
                </span>
            </div>

            {/* animated rule */}
            <div ref={ruleRef} className="mb-10 h-px w-full bg-foreground/10 lg:mb-12" />

            {/* cards grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {CARDS.map((card, i) => (
                    <Link
                        key={card.num}
                        href={card.href}
                        ref={(el) => { cardRefs.current[i] = el }}
                        onMouseEnter={() => handleEnter(i)}
                        onMouseLeave={() => handleLeave(i)}
                        className="group relative overflow-hidden rounded-xl"
                        style={{ aspectRatio: '4/5' }}
                    >
                        {/* background image */}
                        <Image
                            ref={(el) => { imgRefs.current[i] = el }}
                            src={card.image}
                            alt={card.heading}
                            fill
                            quality={82}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover will-change-transform"
                        />

                        {/* gradient overlay */}
                        <div className={`absolute inset-0 ${card.overlay} transition-opacity duration-500`} />

                        {/* content — bottom anchored */}
                        <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">

                            {/* number tag */}
                            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-white/50">
                                {card.num}
                            </p>

                            {/* heading */}
                            <h3 className="font-neue text-[1.55rem] font-semibold uppercase leading-tight tracking-[0.03em] text-white lg:text-[1.7rem]">
                                {card.heading}
                            </h3>

                            {/* divider */}
                            <div className="my-3 h-px w-8 bg-white/30" />

                            {/* description */}
                            <p className="line-clamp-2 text-[0.8rem] leading-relaxed text-white/70">
                                {card.description}
                            </p>

                            {/* CTA */}
                            <div className="mt-5 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase text-white/85 transition-colors duration-200 group-hover:text-white">
                                {card.cta}
                                <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default EditorialCardsSection
