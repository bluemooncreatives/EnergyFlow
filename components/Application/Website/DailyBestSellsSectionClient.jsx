'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock3 } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import ProductCard from './storefront/ProductCard'

const DEAL_BANNER = {
    title: 'Gift Boxes, Ready To Send',
    copy: 'Get the best deal before close.',
    image: '/assets/images/banner/gift-box-deal.jpg',
    alt: 'A wooden gift tray of raisins, cashews, almonds and pistachios beside a ribboned box',
    href: WEBSITE_SHOP,
}

// Every card in this rail shares one deadline, so one interval drives the one
// countdown in the header. It runs to the end of the current month: the Product
// model carries no per-product deal expiry to read. Rolling past midnight on the
// 1st simply starts the next month's window. State starts null so the server
// HTML and the first client render agree — a live clock rendered on the server
// mismatches on hydration.
const useDealCountdown = () => {
    const [remaining, setRemaining] = useState(null)

    useEffect(() => {
        const tick = () => {
            const now = new Date()
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            const diff = Math.max(0, endOfMonth.getTime() - now.getTime())

            setRemaining({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            })
        }

        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])

    return remaining
}

const pad = (n) => (n === undefined || n === null ? '--' : String(n).padStart(2, '0'))

const Countdown = ({ remaining }) => {
    const cells = [
        { value: remaining?.days, label: 'days' },
        { value: remaining?.hours, label: 'hrs' },
        { value: remaining?.minutes, label: 'min' },
        { value: remaining?.seconds, label: 'sec' },
    ]

    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-body">
                <Clock3 className="size-4 text-amber-ink" aria-hidden="true" />
                Offer ends in
            </span>
            {/* The ticking digits are hidden from assistive tech (a per-second
                live region would be unbearable); the summary label carries it. */}
            <div
                className="flex items-center gap-1.5"
                role="timer"
                aria-label={remaining ? `${remaining.days} days ${remaining.hours} hours left` : 'Loading offer timer'}
            >
                {cells.map((cell) => (
                    <span
                        key={cell.label}
                        aria-hidden="true"
                        className="flex min-w-[3.25rem] flex-col items-center rounded-xl bg-surface-card px-2 py-1.5 shadow-[inset_0_0_0_1px_var(--line-soft)]"
                    >
                        <span className="text-base font-semibold tabular-nums leading-tight text-ink-strong">{pad(cell.value)}</span>
                        <span className="text-[10px] uppercase tracking-[0.1em] text-ink-muted">{cell.label}</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

const DailyBestSellsSectionClient = ({ products = [] }) => {
    const sectionRef = useRef(null)
    const remaining = useDealCountdown()
    useReveal(sectionRef, [products.length])

    if (!products.length) return null

    // On wide screens the banner plus however many deals exist (1–3) share one
    // row, so a short deal list never leaves empty columns behind it.
    const railStyle = { '--deal-cols': `minmax(0,1.15fr) repeat(${products.length}, minmax(0,1fr))` }
    // Below xl the grid is two columns: the banner takes a full row only when
    // that leaves the deal cards in complete pairs, so no card sits alone.
    const bannerSpan = products.length % 2 === 0 ? 'col-span-2' : 'col-span-1'

    return (
        <Section ref={sectionRef} tone="sunken" aria-labelledby="deals-title">
            <SectionHeader
                id="deals-title"
                eyebrow="Limited time"
                title="Daily"
                accent="best sells"
                action={<Countdown remaining={remaining} />}
            />

            <div className="grid grid-cols-2 gap-[var(--grid-gap)] xl:grid-cols-(--deal-cols)" style={railStyle}>
                {/* ── Deal banner ── */}
                <Link
                    href={DEAL_BANNER.href}
                    data-reveal
                    className={`ef-tile ef-focus ef-on-inverse group/deal relative ${bannerSpan} flex min-h-[15rem] flex-col justify-between gap-6 p-5 text-white sm:min-h-[22rem] sm:p-7 xl:col-span-1`}
                >
                    <Image
                        src={DEAL_BANNER.image}
                        alt={DEAL_BANNER.alt}
                        fill
                        quality={82}
                        sizes="(max-width: 1280px) 50vw, 25vw"
                        className="-z-10 object-cover transition-transform duration-700 ease-out group-hover/deal:scale-[1.04] motion-reduce:transition-none"
                    />
                    {/* The photograph is warm and light throughout, so the copy
                        gets its own deep-green ground rather than sitting on it. */}
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 -z-10"
                        style={{ background: 'linear-gradient(180deg, rgb(46 22 8 / 0.9) 0%, rgb(46 22 8 / 0.55) 42%, rgb(46 22 8 / 0.05) 75%)' }}
                    />

                    <span className="flex flex-col gap-2">
                        <span className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-medium leading-[1.08] tracking-[-0.025em]">
                            {DEAL_BANNER.title}
                        </span>
                        <span className="text-[0.9375rem] text-white/80">{DEAL_BANNER.copy}</span>
                    </span>

                    <span className="ef-btn ef-btn--accent ef-btn--sm self-start">
                        Shop now <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                    </span>
                </Link>

                {/* ── Deal cards ── */}
                {products.map((product) => (
                    <div key={product._id} data-reveal className="min-w-0">
                        <ProductCard
                            product={product}
                            actions="bar"
                            sizes="(max-width: 1280px) 50vw, 25vw"
                        />
                    </div>
                ))}
            </div>
        </Section>
    )
}

export default DailyBestSellsSectionClient
