'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'

const CARDS = [
    {
        num: '01',
        heading: 'Our Story',
        description: 'From a single dry fruits and super food store to a growing retail network, built on sourcing we stand behind.',
        cta: 'Discover more',
        href: '/about-us',
        image: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789902222/IMG_20260920_155108.jpg.jpg',
        overlay: 'linear-gradient(0deg, rgb(10 20 13 / 0.88) 0%, rgb(10 20 13 / 0.35) 45%, rgb(10 20 13 / 0.05) 75%)',
    },
    {
        num: '02',
        heading: 'Shop Now',
        description: 'Dry fruits, nuts, seeds, super foods, millets, cold pressed oils and ghee. Your whole healthy pantry in one place.',
        cta: 'Shop collection',
        href: WEBSITE_SHOP,
        image: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789636906/WhatsApp_Image_2026-09-17_at_2.50.29_PM_jkfnws.jpg',
        overlay: 'linear-gradient(0deg, rgb(22 48 31 / 0.96) 0%, rgb(22 48 31 / 0.72) 42%, rgb(22 48 31 / 0.15) 78%)',
    },
    {
        num: '03',
        heading: 'Bulk & Gifting',
        description: 'Corporate hampers, festive gift boxes and bulk orders, put together to suit your budget and branding.',
        cta: 'Get in touch',
        href: '/contact',
        image: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789902222/file_00000000130082118f16e12f78dc5ff0.png',
        overlay: 'linear-gradient(0deg, rgb(10 20 13 / 0.9) 0%, rgb(10 20 13 / 0.4) 50%, rgb(10 20 13 / 0.05) 80%)',
    },
]

const EditorialCardsSection = () => {
    const sectionRef = useRef(null)
    useReveal(sectionRef)

    return (
        <Section ref={sectionRef} tone="sunken" aria-labelledby="editorial-title">
            <SectionHeader
                id="editorial-title"
                eyebrow="Explore more"
                title="The full"
                accent="picture"
                description="Where we come from, what we stock and how we can help you gift."
            />

            {/* Bento: the story card runs tall on the left, the other two stack. */}
            <div className="grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr] lg:grid-rows-[repeat(2,minmax(17rem,1fr))]">
                {CARDS.map((card, i) => {
                    const featured = i === 0
                    return (
                        <Link
                            key={card.num}
                            href={card.href}
                            data-reveal
                            className={cn(
                                'ef-tile ef-focus group/ed relative flex min-h-[22rem] flex-col justify-end p-6 text-white sm:p-7',
                                featured && 'sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:p-10'
                            )}
                        >
                            <Image
                                src={card.image}
                                alt=""
                                fill
                                quality={82}
                                sizes={featured ? '(max-width: 1024px) 100vw, 56vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw'}
                                className="-z-10 object-cover transition-transform duration-700 ease-out group-hover/ed:scale-[1.05] motion-reduce:transition-none"
                            />
                            <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: card.overlay }} />

                            <span className="absolute left-6 top-6 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-medium tracking-normal backdrop-blur-sm sm:left-7 sm:top-7">
                                {card.num}
                            </span>

                            <span className="flex max-w-md flex-col gap-3">
                                <span
                                    className={cn(
                                        'font-medium leading-[1.05] tracking-[-0.03em]',
                                        featured ? 'text-[clamp(1.75rem,1.2rem+2vw,3rem)]' : 'text-[clamp(1.5rem,1.2rem+1vw,2rem)]'
                                    )}
                                >
                                    {card.heading}
                                </span>
                                <span className="text-[0.9375rem] leading-relaxed text-white/80">{card.description}</span>
                                <span className="mt-2 inline-flex items-center gap-2 text-[0.9375rem] font-medium">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-white text-brand transition-transform duration-300 group-hover/ed:rotate-45 motion-reduce:transition-none">
                                        <ArrowUpRight className="size-[1.1rem]" aria-hidden="true" />
                                    </span>
                                    {card.cta}
                                </span>
                            </span>
                        </Link>
                    )
                })}
            </div>
        </Section>
    )
}

export default EditorialCardsSection
