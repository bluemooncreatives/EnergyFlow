'use client'

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { RotateCcw, Truck, Headset, BadgePercent } from 'lucide-react'
import ShopAllButton from '@/components/Application/Website/ShopAllButton'

gsap.registerPlugin(ScrollTrigger)

const BENEFITS = [
    {
        num: '01',
        Icon: RotateCcw,
        title: '7-Days Returns',
        description: 'Risk-free shopping with easy, hassle-free returns on every order.',
    },
    {
        num: '02',
        Icon: Truck,
        title: 'Free Shipping',
        description: 'No hidden costs — just the price you see at checkout.',
    },
    {
        num: '03',
        Icon: Headset,
        title: '24/7 Support',
        description: 'Our team is always here, ready to help you at any hour.',
    },
    {
        num: '04',
        Icon: BadgePercent,
        title: 'Member Discounts',
        description: 'Exclusive offers and special deals for our loyal customers.',
    },
]

const BenefitsSection = () => {
    const sectionRef = useRef(null)
    const headerRef = useRef(null)
    const ruleRef = useRef(null)
    const itemRefs = useRef([])
    const ctaRef = useRef(null)

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
            itemRefs.current,
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

        gsap.fromTo(
            ctaRef.current,
            { autoAlpha: 0, y: 24 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                ease: 'power4.out',
                scrollTrigger: { trigger: ctaRef.current, start: 'top 88%', once: true },
            }
        )
    }, { scope: sectionRef })

    return (
        <section ref={sectionRef} className="website-gutter bg-background py-16 lg:py-14">

            {/* box */}
            <div className="relative overflow-hidden rounded-3xl bg-[var(--dark-red)] p-8 lg:p-16">

                {/* watermark */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-4 -top-8 select-none font-neue text-[22rem] font-semibold leading-none text-white/[0.03] lg:text-[28rem]"
                >
                    &amp;
                </div>

                {/* header */}
                <div ref={headerRef} className="relative mb-6 flex items-end justify-between lg:mb-8">
                    <div>
                        <p className="text-[1rem] font-semibold uppercase text-white/40">
                            Our Promise
                        </p>
                        <h2 className="mt-1.5 font-neue text-[clamp(1.8rem,4.8vw,3.8rem)] font-medium uppercase text-white">
                            Why Choose Us
                        </h2>
                    </div>
                    <span className="hidden text-[0.68rem] font-semibold uppercase text-white/30 sm:block">
                        Quality · Care · Trust
                    </span>
                </div>

                {/* divider */}
                <div ref={ruleRef} className="mb-12 h-px w-full bg-white/20 lg:mb-16" />

                {/* benefits grid */}
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
                    {BENEFITS.map((item, i) => (
                        <div
                            key={item.num}
                            ref={(el) => { itemRefs.current[i] = el }}
                            className="relative lg:pr-10 [&:not(:last-child)]:lg:border-r [&:not(:last-child)]:lg:border-white/10 [&:not(:first-child)]:lg:pl-10"
                        >

                            {/* icon */}
                            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.07]">
                                <item.Icon className="size-[18px] text-white" />
                            </div>

                            {/* title */}
                            <h3 className="font-neue text-lg font-semibold uppercase tracking-[0.04em] text-white">
                                {item.title}
                            </h3>

                            {/* description */}
                            <p className="mt-2.5 text-[0.82rem] leading-relaxed text-white/50">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div ref={ctaRef} className="mt-14 flex justify-center lg:mt-16">
                    <ShopAllButton
                        label="Shop All Products"
                        colorScheme="white"
                        radius="md"
                    />
                </div>
            </div>
        </section>
    )
}

export default BenefitsSection
