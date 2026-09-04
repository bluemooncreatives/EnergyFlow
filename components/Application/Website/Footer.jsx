'use client'

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import Link from 'next/link'
import { MapPin, Mail, Instagram, Facebook, Twitter, Globe, ArrowRight } from 'lucide-react'

import { USER_DASHBOARD, WEBSITE_HOME, WEBSITE_LOGIN, WEBSITE_REGISTER, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import FooterWordmark from '@/components/Application/Website/FooterWordmark'

gsap.registerPlugin(ScrollTrigger)

const CONTACT_EMAIL = 'energyflow.official@gmail.com'

// Shown when the catalogue has no categories yet, so the column is never empty.
const fallbackCategoryLinks = [
    { label: 'All Products', href: WEBSITE_SHOP },
]

const usefulLinks = [
    { label: 'Home', href: WEBSITE_HOME },
    { label: 'Shop', href: WEBSITE_SHOP },
    { label: 'About', href: '/about-us' },
    { label: 'Register', href: WEBSITE_REGISTER },
    { label: 'Login', href: WEBSITE_LOGIN },
]

const helpLinks = [
    { label: 'Register', href: WEBSITE_REGISTER },
    { label: 'Login', href: WEBSITE_LOGIN },
    { label: 'My Account', href: USER_DASHBOARD },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
]

const socialLinks = [
    { label: 'Instagram', href: 'https://www.instagram.com/mom.stitched', Icon: Instagram },
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100087738263074', Icon: Facebook },
    { label: 'X (Twitter)', href: 'https://twitter.com/energyflow', Icon: Twitter },
]

const LinkColumn = ({ title, links }) => (
    <div className='footer-col'>
        <h3 className='text-2xl font-semibold text-white mb-6'>{title}</h3>
        <nav aria-label={`${title} links`}>
            <ul className='space-y-2'>
                {links.map(({ label, href }) => (
                    <li key={`${title}-${label}`}>
                        <Link href={href} className='text-white/70 hover:text-[var(--brand-cream)] transition-colors'>
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    </div>
)

const Footer = ({ categoryLinks = [] }) => {
    const rootRef = useRef(null)
    const categories = categoryLinks.length ? categoryLinks : fallbackCategoryLinks

    useGSAP(() => {
        const reveal = (selector, vars = {}) =>
            gsap.from(selector, {
                autoAlpha: 0,
                y: 40,
                duration: 0.9,
                ease: 'power4.out',
                scrollTrigger: { trigger: selector, start: 'top 90%', once: true },
                ...vars,
            })

        // Top row — caption, big email, CTA card
        reveal('.footer-caption')
        reveal('.footer-email', { y: 60, duration: 1 })
        reveal('.footer-cta', { x: 60, y: 0, duration: 1, ease: 'power3.out' })

        // Middle row — link columns / office reveal with a stagger
        gsap.from('.footer-col', {
            autoAlpha: 0,
            y: 50,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: { trigger: '.footer-cols', start: 'top 85%', once: true },
        })

        // The footer sits below several lazily-hydrated sections whose real
        // height isn't known yet when these triggers are first measured, so
        // their start positions go stale once that content mounts/loads —
        // leaving the footer stuck at its hidden (autoAlpha: 0) starting
        // state. Recompute once everything above has settled.
        const lateRefresh = () => ScrollTrigger.refresh()
        const timer = setTimeout(lateRefresh, 300)
        window.addEventListener('load', lateRefresh)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('load', lateRefresh)
        }
    }, { scope: rootRef })

    return (
        <footer ref={rootRef} className='sticky z-0 bottom-0 left-0 w-full bg-[var(--brand-primary)] text-white overflow-hidden' aria-label='Site footer'>
            <div className='website-gutter pt-14 pb-8'>

                {/* ───── Top row: caption + big email + CTA card ───── */}
                <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10'>
                    <div className='min-w-0'>
                        <p className='footer-caption text-md text-white/60 leading-snug mb-5 max-w-md'>
                            Every stitch carries a story of care, craft, and grace. Discover handcrafted garments made to celebrate femininity and
                            culture Reach <span className='font-semibold text-white'>Energyflow</span> at
                        </p>
                        <Link
                            href={`mailto:${CONTACT_EMAIL}`}
                            className='footer-email inline-block border-b border-white/30 pb-3 font-semibold tracking-tight text-[clamp(1.25rem,4.8vw,2.6rem)] leading-none hover:text-[var(--brand-cream)] transition-colors break-all'
                        >
                            {CONTACT_EMAIL}
                        </Link>
                    </div>

                    {/* Get Started CTA card */}
                    <div className='shrink-0'>
                        <div className='footer-cta bg-[var(--brand-cream)] rounded-sm p-5 w-56'>
                            <p className='text-[var(--brand-ink)] text-xl font-semibold mb-10'>Get Started</p>
                            <Link
                                href={WEBSITE_SHOP}
                                className='flex items-center justify-between bg-[var(--brand-primary)] text-white rounded-sm pl-5 pr-4 py-3 hover:bg-[var(--brand-primary-hover)] transition-colors'
                            >
                                <span className='text-sm'>Go</span>
                                <ArrowRight className='size-4' />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ───── Middle row: link columns + contact / office ───── */}
                <div className='footer-cols grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mt-14'>
                    <LinkColumn title='Categories' links={categories} />
                    <LinkColumn title='Useful Links' links={usefulLinks} />
                    <LinkColumn title='Help Center' links={helpLinks} />

                    {/* Office / Contact */}
                    <div className='footer-col lg:text-right'>
                        <h3 className='text-2xl font-semibold text-white mb-6'>Office</h3>
                        <ul className='space-y-2 text-white/70'>
                            <li className='flex lg:justify-end items-center gap-2'>
                                <MapPin className='size-5 shrink-0 lg:order-2' />
                                <span>Pune, Maharashtra 411047</span>
                            </li>
                            <li className='flex lg:justify-end items-center gap-2'>
                                <Mail className='size-5 shrink-0 lg:order-2' />
                                <Link href={`mailto:${CONTACT_EMAIL}`} className='hover:text-[var(--brand-cream)] transition-colors'>Email Us</Link>
                            </li>
                            <li className='flex lg:justify-end items-center gap-4'>
                                {socialLinks.map(({ label, href, Icon }) => (
                                    <Link key={label} href={href} target='_blank' rel='noopener noreferrer' aria-label={`Energyflow on ${label}`}>
                                        <Icon className='size-5 text-white/70 hover:text-[var(--brand-cream)] transition-colors' />
                                    </Link>
                                ))}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ───── Giant wordmark (scroll-stretch GSAP effect) ───── */}
                <FooterWordmark />
            </div>

            {/* ───── Bottom bar (purple) ───── */}
            <div className='bg-[var(--brand-ink-soft)] text-[var(--brand-cream)]'>
                <div className='website-gutter py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm'>
                    <div className='flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3'>
                        <p>Copyright © {new Date().getFullYear()} Energyflow. All Rights Reserved.</p>
                        <span className='hidden text-[var(--brand-cream)]/40 sm:inline' aria-hidden='true'>•</span>
                        <p className='text-[var(--brand-cream)]/70'>
                            Designed &amp; built by{' '}
                            <Link
                                href='https://www.instagram.com/bluemoon.creatives/'
                                target='_blank'
                                rel='noopener noreferrer'
                                aria-label='Blue Moon Creatives on Instagram'
                                className='font-semibold text-[var(--brand-cream)] underline decoration-[var(--brand-cream)]/40 underline-offset-2 transition-colors hover:text-[var(--brand-white)] hover:decoration-[var(--brand-white)]'
                            >
                                Blue Moon Creatives
                            </Link>
                        </p>
                    </div>
                    <div className='flex items-center flex-wrap justify-center gap-x-8 gap-y-2'>
                        <span className='flex items-center gap-1.5'>
                            <Globe className='size-4' /> Pune, India
                        </span>
                        {socialLinks.map(({ label, href }) => (
                            <Link key={`bar-${label}`} href={href} target='_blank' rel='noopener noreferrer' className='hover:text-[var(--brand-white)] transition-colors'>
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
