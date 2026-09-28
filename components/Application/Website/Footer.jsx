'use client'

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import Link from 'next/link'
import { MapPin, Mail, Phone, Instagram, Facebook, Twitter, Globe, ArrowRight } from 'lucide-react'

import { USER_DASHBOARD, WEBSITE_HOME, WEBSITE_LOGIN, WEBSITE_REGISTER, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import FooterWordmark from '@/components/Application/Website/FooterWordmark'
import NewsletterFooterStrip from '@/components/Application/Website/newsletter/NewsletterFooterStrip'

gsap.registerPlugin(ScrollTrigger)

const CONTACT_EMAIL = 'energyflow0001@gmail.com'
const CONTACT_PHONE = '+919289657742'

// Shown when the catalogue has no categories yet, so the column is never empty.
const fallbackCategoryLinks = [
    { label: 'All Products', href: WEBSITE_SHOP },
]

const usefulLinks = [
    { label: 'Home', href: WEBSITE_HOME },
    { label: 'Shop', href: WEBSITE_SHOP },
    { label: 'About', href: '/about-us' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQs', href: `${WEBSITE_HOME}#faq` },
]

const helpLinks = [
    { label: 'My Account', href: USER_DASHBOARD },
    { label: 'Login', href: WEBSITE_LOGIN },
    { label: 'Register', href: WEBSITE_REGISTER },
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
        <h3 className='mb-5 font-header text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[var(--brand-sun)]'>{title}</h3>
        <nav aria-label={`${title} links`}>
            <ul className='space-y-2.5'>
                {links.map(({ label, href }) => (
                    <li key={`${title}-${label}`}>
                        <Link href={href} className='text-[0.9375rem] text-white/80 transition-colors hover:text-[var(--brand-amber)]'>
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    </div>
)

const Footer = ({ categoryLinks = [], newsletter = null }) => {
    const rootRef = useRef(null)
    const categories = categoryLinks.length ? categoryLinks : fallbackCategoryLinks

    // The footer lives in the layout, so it mounts once and stays mounted
    // across client navigations. ScrollTrigger start positions measured on
    // the first page are wrong on every page after it (a trigger measured
    // at 8000px on the home page is never reached on a 4000px product page),
    // and they also go stale as lazy sections above load — which left the
    // footer stuck at its hidden starting state. An IntersectionObserver
    // asks the browser "is it on screen now?" instead of comparing against a
    // stored offset, so it is right on any page, at any height.
    useGSAP((context, contextSafe) => {
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === 'undefined') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const groups = [
            // Top row — caption, big email, CTA card
            { trigger: '.footer-caption', from: { y: 40 }, to: { duration: 0.9, ease: 'power4.out' }, margin: '-10%' },
            { trigger: '.footer-email', from: { y: 60 }, to: { duration: 1, ease: 'power4.out' }, margin: '-10%' },
            { trigger: '.footer-cta', from: { x: 60 }, to: { duration: 1, ease: 'power3.out' }, margin: '-10%' },
            // Middle row — link columns / office reveal with a stagger
            { trigger: '.footer-cols', targets: '.footer-col', from: { y: 50 }, to: { duration: 0.8, ease: 'power3.out', stagger: 0.12 }, margin: '-15%' },
        ]
            .map((group) => ({
                ...group,
                el: root.querySelector(group.trigger),
                targets: gsap.utils.toArray(group.targets || group.trigger, root),
            }))
            .filter((group) => group.el && group.targets.length)

        // Content is visible by default; only hide it once JS is ready to
        // bring it back.
        groups.forEach(({ targets, from }) => gsap.set(targets, { autoAlpha: 0, ...from }))

        const reveal = contextSafe(({ targets, to }) =>
            gsap.to(targets, { autoAlpha: 1, x: 0, y: 0, overwrite: true, ...to })
        )

        const observers = groups.map((group) => {
            const observer = new IntersectionObserver(([entry]) => {
                // Already on screen, or already scrolled past (restored
                // scroll, End key, a jump to the page bottom).
                if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                    observer.disconnect()
                    reveal(group)
                }
            }, { rootMargin: `0px 0px ${group.margin} 0px` })
            observer.observe(group.el)
            return observer
        })

        return () => observers.forEach((observer) => observer.disconnect())
    }, { scope: rootRef })

    return (
        <footer ref={rootRef} className='relative w-full border-t border-[var(--line-soft)] bg-pine-deep text-white overflow-hidden' style={{ backgroundImage: 'var(--pine-panel-gradient)' }} aria-label='Site footer'>
            <div className='website-gutter pt-14 pb-8'>

                {/* ───── Top row: caption + big email + CTA card ───── */}
                <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10'>
                    <div className='min-w-0'>
                        <p className='footer-caption text-md text-white/60 leading-snug mb-5 max-w-md'>
                            Premium dry fruits, nuts, seeds and super foods, sourced with care, checked for quality, and
                            delivered across India. Reach <span className='font-semibold text-white'>Energyflow</span> at
                        </p>
                        <Link
                            href={`mailto:${CONTACT_EMAIL}`}
                            className='footer-email inline-block border-b border-white/30 pb-3 font-header font-medium text-[clamp(1.25rem,4.8vw,2.6rem)] leading-none hover:border-[var(--brand-sun)] hover:text-[var(--brand-sun)] transition-colors break-all'
                        >
                            {CONTACT_EMAIL}
                        </Link>
                    </div>

                    {/* Get Started CTA card — sunflower with a pine button, as in
                        the brand reference; fixed palette so it reads the same
                        in light and dark mode. */}
                    <div className='shrink-0'>
                        <div className='footer-cta w-full rounded-[var(--radius-card)] bg-[var(--palette-sunflower)] p-5 text-[var(--palette-pine)] sm:w-64'>
                            <p className='mb-1 font-header text-xl font-semibold uppercase'>Get Started</p>
                            <p className='mb-6 text-[0.875rem] leading-snug text-[var(--palette-pine)]/80'>Ghee, oils, dry fruits and gifts, delivered across India.</p>
                            <Link
                                href={WEBSITE_SHOP}
                                className='ef-btn ef-btn--pine ef-btn--block justify-between'
                            >
                                <span>Shop now</span>
                                <ArrowRight className='ef-btn__arrow' aria-hidden='true' />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ───── Newsletter strip (Admin → Newsletter → Customise) ───── */}
                {newsletter && <NewsletterFooterStrip footer={newsletter} />}

                {/* ───── Middle row: link columns + contact / office ───── */}
                <div className='footer-cols mt-14 grid grid-cols-2 gap-x-8 gap-y-12 border-t border-white/10 pt-12 lg:grid-cols-4'>
                    <LinkColumn title='Categories' links={categories} />
                    <LinkColumn title='Useful Links' links={usefulLinks} />
                    <LinkColumn title='Help Center' links={helpLinks} />

                    {/* Office / Contact */}
                    <div className='footer-col lg:text-right'>
                        <h3 className='mb-5 font-header text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[var(--brand-sun)]'>Office</h3>
                        <ul className='space-y-2.5 text-[0.9375rem] text-white/80'>
                            <li className='flex lg:justify-end items-center gap-2'>
                                <MapPin className='size-5 shrink-0 lg:order-2' />
                                <span>Rangpuri, Mahipalpur, New Delhi - 110037</span>
                            </li>
                            <li className='flex lg:justify-end items-center gap-2'>
                                <Phone className='size-5 shrink-0 lg:order-2' />
                                <Link href={`tel:${CONTACT_PHONE}`} className='transition-colors hover:text-[var(--brand-amber)]'>+91 92896 57742</Link>
                            </li>
                            <li className='flex lg:justify-end items-center gap-2'>
                                <Mail className='size-5 shrink-0 lg:order-2' />
                                <Link href={`mailto:${CONTACT_EMAIL}`} className='transition-colors hover:text-[var(--brand-amber)]'>Email Us</Link>
                            </li>
                            <li className='flex items-center gap-2 pt-2 lg:justify-end'>
                                {socialLinks.map(({ label, href, Icon }) => (
                                    <Link
                                        key={label}
                                        href={href}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        aria-label={`Energyflow on ${label}`}
                                        className='flex size-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-[var(--brand-amber)] hover:bg-[var(--brand-amber)] hover:text-[var(--brand-primary-deep)]'
                                    >
                                        <Icon className='size-[1.1rem]' aria-hidden='true' />
                                    </Link>
                                ))}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ───── Giant wordmark (scroll-stretch GSAP effect) ───── */}
                <FooterWordmark />
            </div>

            {/* ───── Bottom bar — the sunflower strip that closes the page ───── */}
            <div className='border-t border-[var(--palette-pine)] bg-[var(--surface-sun)] text-[var(--palette-pine)]'>
                <div className='website-gutter py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm'>
                    <div className='flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3'>
                        <p>Copyright © {new Date().getFullYear()} Energyflow. All Rights Reserved.</p>
                        <span className='hidden text-[var(--palette-pine)]/40 sm:inline' aria-hidden='true'>•</span>
                        <p className='text-[var(--palette-pine)]'>
                            Designed &amp; built by{' '}
                            <Link
                                href='https://www.instagram.com/bluemoon.creatives/'
                                target='_blank'
                                rel='noopener noreferrer'
                                aria-label='Blue Moon Creatives on Instagram'
                                className='font-semibold text-[var(--palette-pine)] underline decoration-[var(--palette-pine)]/40 underline-offset-2 transition-colors hover:text-[var(--palette-forest)] hover:decoration-[var(--palette-forest)]'
                            >
                                Blue Moon Creatives
                            </Link>
                        </p>
                    </div>
                    <div className='flex items-center flex-wrap justify-center gap-x-8 gap-y-2'>
                        <span className='flex items-center gap-1.5'>
                            <Globe className='size-4' /> New Delhi, India
                        </span>
                        {socialLinks.map(({ label, href }) => (
                            <Link key={`bar-${label}`} href={href} target='_blank' rel='noopener noreferrer' className='font-medium hover:text-[var(--palette-forest)] transition-colors'>
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
