import Image from 'next/image'
import Link from 'next/link'
import {
    ArrowRight,
    ArrowUpRight,
    ChevronRight,
    HandCoins,
    Leaf,
    Mail,
    MapPin,
    PackageCheck,
    Phone,
    ShieldCheck,
    Sprout,
    Star,
} from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import SectionHeader from '@/components/Application/Website/storefront/SectionHeader'
import StoreButton, { StoreLink } from '@/components/Application/Website/storefront/StoreButton'
import ProductBox from '@/components/Application/Website/ProductBox'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { cn } from '@/lib/utils'
import AboutMotion from './AboutMotion'
import SourcingSteps from './SourcingSteps'
import StatementSection from '@/components/Application/Website/StatementSection'
import styles from './about-us.module.css'

/* ── Content ──────────────────────────────────────────────────────────
   Page copy lives here rather than in the markup so the writing can be
   edited without touching layout. Every claim is one the business can
   stand behind: sourcing and checking, not certifications we don't hold
   or health outcomes we can't promise. */

// Photos for the hero mosaic. Each is shown across several tiles — `sizes`
// matches the width of its group, not of any one tile, because every tile in
// a group requests the same image (so the browser fetches it once).
const MOSAIC_ART = {
    gift: {
        src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789913710/Elegant_Dry_Fruit_Box.jpg',
        sizes: '(max-width: 768px) 67vw, 30vw',
    },
    store: {
        src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789913475/WhatsApp_Image_2026-09-20_at_7.39.30_PM.jpg',
        sizes: '(max-width: 768px) 100vw, 50vw',
        // Keep the Energyflow board and the OPEN sign in the wide crop.
        position: '50% 60%',
    },
    seeds: {
        src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911945/270e856f021e3e06a3dd84d344bdc8d1.jpg.jpg',
        sizes: '(max-width: 768px) 33vw, 20vw',
    },
}

// Tile ids map to grid placements in about-us.module.css (.t1–.t9); the
// group decides which photo shows through. t2, t6 and t7 are desktop-only.
const MOSAIC_TILES = [
    { id: 't1', group: 'gift' },
    { id: 't2', group: 'gift' },
    { id: 't3', group: 'store' },
    { id: 't4', group: 'store' },
    { id: 't5', group: 'store' },
    { id: 't6', group: 'store' },
    { id: 't7', group: 'store' },
    { id: 't8', group: 'seeds' },
    { id: 't9', group: 'seeds' },
]

const GROUP_CLASS = { gift: 'gGift', store: 'gStore', seeds: 'gSeeds' }

const SOURCING_FIGURE = {
    src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911947/file_00000000d82c8211bcfd587359eeba52.png',
    alt: 'Energyflow premium dry fruits and super foods',
}

const PROMISES = [
    {
        Icon: Sprout,
        label: 'The source',
        title: 'Sourced at origin',
        body: 'Direct from growers, mills and importers we have dealt with ourselves.',
    },
    {
        Icon: ShieldCheck,
        label: 'The standard',
        title: 'Every lot checked',
        body: 'Graded for size, freshness and cleanliness before it earns shelf space.',
    },
    {
        Icon: PackageCheck,
        label: 'The freshness',
        title: 'Sealed for the journey',
        body: 'Packed in small batches so the crunch and aroma survive the trip to you.',
    },
    {
        Icon: HandCoins,
        label: 'The value',
        title: 'Priced without the chain',
        body: 'A short supply chain means the saving reaches your kitchen, not a middleman.',
    },
]

const SOURCING_STEPS = [
    {
        phase: 'Origin',
        title: 'We buy where it grows',
        body: 'Almonds, cashews, raisins, seeds and millets come from the growers, mills and importers behind them, so quality is settled at origin instead of inspected at the end.',
    },
    {
        phase: 'The standard',
        title: 'Every lot is checked',
        body: 'Each batch is opened and graded for size, colour, moisture and cleanliness. What does not meet the mark does not get packed, however good the price was.',
    },
    {
        phase: 'The pack',
        title: 'Packed in small batches',
        body: 'We pack in small runs and seal each pouch, because dry fruits and roasted snacks lose their crunch to air and humidity long before they lose their date.',
    },
    {
        phase: 'The journey',
        title: 'Delivered across India',
        body: 'Orders are packed within 1–2 working days and reach metros in 2–4 working days and the rest of India in 4–7, with free shipping.',
    },
]

const PEOPLE = [
    {
        name: 'Mr. Parveen Singla',
        initials: 'PS',
        role: 'Director · Sourcing & operations',
        bio: [
            'Mr. Parveen Singla decides what earns a place on our shelf. He builds direct, lasting relationships with growers, mills and producers so quality is controlled at origin rather than inspected at the end.',
            'It takes longer to set up and it is far more reliable once it runs — and the same discipline shapes how we price: buy well, keep the chain short, pass the difference on.',
        ],
    },
    {
        name: 'Mr. Ayush Singla',
        initials: 'AS',
        role: 'Director · Retail, brand & expansion',
        bio: [
            'Mr. Ayush Singla turns a single store into a network that can grow without losing what makes it work: a range people genuinely want, and a shopping experience that is easy online and in store.',
            'The goal is a professionally managed brand rather than a chain of lookalike outlets — one where every Energyflow store means the same thing to the person walking in.',
        ],
    },
]

const CONTACT = {
    addressLines: ['Rangpuri, Mahipalpur', 'New Delhi 110037'],
    phone: '+91 92896 57742',
    phoneHref: 'tel:+919289657742',
    email: 'energyflow0001@gmail.com',
}

/* ── Micro-components ─────────────────────────────────────────────── */

const Stat = ({ value, label }) => (
    <div data-reveal className="flex flex-col gap-1">
        <span className="font-header text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-none text-ink-strong">
            {value}
        </span>
        <span className="text-[0.8125rem] leading-snug text-ink-muted">{label}</span>
    </div>
)

/* ── Page ─────────────────────────────────────────────────────────── */

const AboutUsContent = ({ products = [], categories = [], stats, testimonials = [] }) => {
    const bentoCategories = categories.slice(0, 7)

    return (
        <AboutMotion>
            {/* ── 1 · Hero ───────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-surface-page">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-40 -top-48 -z-10 size-[34rem] rounded-full bg-tint-pistachio opacity-70 blur-3xl"
                />

                <div className="ef-container pb-[var(--section-space)] pt-[clamp(6.25rem,10vw,8.5rem)]">
                    <nav aria-label="Breadcrumb" className="mb-8">
                        <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-ink-muted">
                            <li>
                                <Link href={WEBSITE_HOME} className="ef-focus rounded-sm transition-colors hover:text-brand">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />
                                <span aria-current="page" className="text-ink-strong">About us</span>
                            </li>
                        </ol>
                    </nav>

                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
                        <div className="min-w-0 max-w-3xl">
                            <span className="ef-eyebrow mb-6">About Energyflow</span>
                            <h1 className={styles.heroTitle}>
                                <span className={styles.lineMask}>
                                    <span data-headline className="block">One honest pantry.</span>
                                </span>
                                <span className={styles.lineMask}>
                                    <span data-headline className="block">
                                        <em>Dry fruits, nuts &amp; superfoods.</em>
                                    </span>
                                </span>
                            </h1>
                        </div>

                        <div data-reveal className="flex max-w-md flex-col items-start gap-5 lg:pb-2">
                            <p className="ef-lead">
                                Energyflow is a New Delhi dry fruits and superfood brand by Energy Flow Supply Hub
                                Pvt. Ltd. We source at origin, check every lot, and pack it so it reaches you the
                                way it left us.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <StoreButton href={WEBSITE_SHOP} arrow>Shop the range</StoreButton>
                                <StoreButton href="/contact" variant="outline">Bulk &amp; gifting</StoreButton>
                            </div>
                        </div>
                    </div>

                    {/* Hero mosaic — three photos cut into one grid of rounded
                        tiles; the cuts, stars and scalloped edge are the page
                        showing through. One accessible image: the tiles are
                        slices of it, not separate pictures. */}
                    <div
                        className={cn(styles.mosaic, 'mt-[clamp(2rem,4vw,3.5rem)]')}
                        role="img"
                        aria-label="A dry fruits gift box, the Energyflow store front in New Delhi, and hampers of nuts and seeds"
                        data-parallax-scope
                    >
                        {MOSAIC_TILES.map(({ id, group }) => {
                            const art = MOSAIC_ART[group]
                            return (
                                <div key={id} data-tile className={cn(styles.tile, styles[id], styles[GROUP_CLASS[group]])}>
                                    <div className={styles.tileArt} data-parallax={group === 'store' ? 4 : 6}>
                                        <Image
                                            src={art.src}
                                            alt=""
                                            fill
                                            sizes={art.sizes}
                                            priority={group === 'store'}
                                            loading={group === 'store' ? undefined : 'eager'}
                                            className="object-cover"
                                            style={art.position ? { objectPosition: art.position } : undefined}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Facts, straight from the catalogue — never hand-typed, so
                        they cannot drift as the range grows. */}
                    <dl className="mt-[clamp(2rem,4vw,3rem)] grid grid-cols-2 gap-6 border-t border-line-soft pt-8 sm:grid-cols-4">
                        <Stat value={`${stats.categoryCount}`} label="Categories in the range" />
                        <Stat value={`${stats.productCount}+`} label="Products on the shelf" />
                        <Stat value="1–2 days" label="Packed and dispatched" />
                        <Stat value="Pan-India" label="Delivered with free shipping" />
                    </dl>
                </div>
            </section>

            {/* ── 2 · Statement ──────────────────────────────────────── */}
            <StatementSection />

            {/* ── 3 · Promises ───────────────────────────────────────── */}
            <Section tone="page">
                <div className={styles.promiseGrid}>
                    <div data-reveal className={styles.promiseLead}>
                        <span className="ef-eyebrow self-start">Why shoppers stay</span>
                        <div className={styles.promiseLeadContent}>
                            <p className={styles.promiseKicker}>Good food, thoughtfully handled.</p>
                            <h2 className={styles.promiseTitle}>
                                Better from<br /><span>the beginning.</span>
                            </h2>
                            <p className={styles.promiseIntro}>
                                From the people we buy from to the pack on your doorstep, the details make the difference.
                            </p>
                            <Link href={WEBSITE_SHOP} className={styles.promiseLink}>
                                Explore our range
                                <span className={styles.promiseLinkIcon}>
                                    <ArrowRight aria-hidden="true" />
                                </span>
                            </Link>
                        </div>
                    </div>

                    <div className={styles.promiseCells}>
                        <svg className={styles.cornerClipDef} aria-hidden="true" focusable="false">
                            <defs>
                                <clipPath id="about-promise-notch" clipPathUnits="objectBoundingBox">
                                    <path d="M0 0 H.672 C.7206 0 .76 .0394 .76 .088 C.76 .172 .828 .24 .912 .24 C.9606 .24 1 .2794 1 .328 V1 H0 Z" />
                                </clipPath>
                            </defs>
                        </svg>
                        {PROMISES.map(({ Icon, label, title, body }) => (
                            <div
                                key={title}
                                data-reveal
                                className={styles.promiseCell}
                            >
                                <div className={styles.promiseCellTop}>
                                    <span className={styles.promiseIcon}>
                                        <Icon aria-hidden="true" />
                                    </span>
                                </div>
                                <span className={styles.promiseCornerBadge} aria-hidden="true">
                                    <ArrowUpRight />
                                </span>
                                <div className={styles.promiseCellCopy}>
                                    <span className={styles.promiseCellLabel}>{label}</span>
                                    <h3>{title}</h3>
                                    <p>{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── 4 · The range ──────────────────────────────────────── */}
            {bentoCategories.length > 0 && (
                <Section tone="sunken">
                    <SectionHeader
                        eyebrow="What we sell"
                        title="One shelf for the"
                        accent="whole pantry"
                        description="Dry fruits and nuts, dried berries, seeds and superfoods, Ayurvedic herbs, flavoured nuts and healthy candies — with millets, pulses, chocolates, makhana and gift boxes joining the shelf as we stock them."
                        action={<StoreLink href={WEBSITE_SHOP}>Shop all products</StoreLink>}
                    />

                    <div className={styles.bento}>
                        <div data-reveal className="relative">
                            <svg className={styles.cornerClipDef} aria-hidden="true" focusable="false">
                                <defs>
                                    <clipPath id="about-range-notch" clipPathUnits="objectBoundingBox">
                                        <path d="M0 0 H1 V.67 Q1 .73 .94 .73 C.86 .73 .83 .83 .83 .94 Q.83 1 .78 1 H0 Z" />
                                    </clipPath>
                                </defs>
                            </svg>
                            <div className={styles.bentoTab}>
                                <span className="text-[0.75rem] font-semibold uppercase tracking-[0em] text-amber">
                                    Our range
                                </span>
                                <p className="font-header text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] leading-tight">
                                    {stats.categoryCount} categories, one standard
                                </p>
                            </div>
                            <Link href={WEBSITE_SHOP} aria-label="Shop our range" className={styles.rangeBadge}>
                                <ArrowUpRight className="size-5" aria-hidden="true" />
                            </Link>
                        </div>

                        {bentoCategories.map((category) => (
                            <Link
                                key={category.slug}
                                href={category.href}
                                data-reveal
                                className={cn(styles.bentoTile, 'ef-focus group block')}
                            >
                                <Image
                                    src={category.previewImage}
                                    alt={category.alt || category.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"
                                    className="object-cover"
                                />
                                <span className={styles.bentoLabel}>
                                    <span className="min-w-0">
                                        <span className={cn(styles.bentoName, 'block')}>{category.name}</span>
                                        <span className={cn(styles.bentoCount, 'block')}>
                                            {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                                        </span>
                                    </span>
                                    <span className={styles.bentoGo} aria-hidden="true">
                                        <ArrowUpRight />
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── 5 · How we source ──────────────────────────────────── */}
            <Section tone="page" id="how-we-work">
                <div className={styles.sourcingHeader} data-reveal>
                    <div className={styles.sourcingHeaderMeta}>
                        <span className="ef-eyebrow">How we work</span>
                        <span className={styles.sourcingHeaderIndex}>The journey / four stages</span>
                    </div>
                    <div className={styles.sourcingHeaderMain}>
                        <h2 className={styles.sourcingHeadline}>
                            From the grower<br />
                            <span>to your kitchen.</span>
                        </h2>
                        <p className={styles.sourcingLead}>
                            Four steps, and none of them are a shortcut. This is the part of the business customers never see, and the part that decides what the pack tastes like.
                        </p>
                    </div>
                </div>
                <SourcingSteps steps={SOURCING_STEPS} figure={SOURCING_FIGURE} />
            </Section>

            {/* ── 6 · Leadership ─────────────────────────────────────── */}
            <Section tone="sunken">
                <SectionHeader
                    eyebrow="Who runs it"
                    title="Built by people who care"
                    accent="where it comes from"
                    description="Energy Flow Supply Hub Pvt. Ltd. was registered on 19 November 2025 and opened its first Energyflow dry fruits and super food store. Two directors run it between them."
                />

                <div className="grid gap-[var(--grid-gap)] lg:grid-cols-2">
                    {PEOPLE.map((person) => (
                        <article key={person.name} data-reveal className={styles.person}>
                            <span className={styles.monogram} aria-hidden="true">{person.initials}</span>
                            <div className="min-w-0">
                                <h3 className="font-header text-[clamp(1.125rem,1rem+0.6vw,1.5rem)] leading-tight text-ink-strong">
                                    {person.name}
                                </h3>
                                <p className="mt-1 text-[0.8125rem] font-medium uppercase tracking-[0em] text-brand">
                                    {person.role}
                                </p>
                                <div className="mt-4 flex flex-col gap-3">
                                    {person.bio.map((paragraph) => (
                                        <p key={paragraph} className="text-[0.9375rem] leading-[1.7] text-ink-body">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </Section>

            {/* ── 7 · Testimonials — renders only once the admin adds any ─ */}
            {testimonials.length > 0 && (
                <Section tone="page">
                    <SectionHeader eyebrow="In their words" title="What shoppers" accent="tell us" />
                    <div className="grid gap-[var(--grid-gap)] md:grid-cols-2 lg:grid-cols-3">
                        {testimonials.slice(0, 3).map((testimonial) => (
                            <figure key={testimonial._id} data-reveal className="ef-card gap-4 p-6">
                                <div className="flex gap-0.5 text-sun" aria-label={`${testimonial.rating} out of 5`}>
                                    {Array.from({ length: testimonial.rating }, (_, i) => (
                                        <Star key={i} className="size-4 fill-current" aria-hidden="true" />
                                    ))}
                                </div>
                                <blockquote className="text-[0.9375rem] leading-[1.7] text-ink-body">
                                    {testimonial.review}
                                </blockquote>
                                <figcaption className="mt-auto text-[0.8125rem] font-medium text-ink-strong">
                                    {testimonial.name}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── 8 · Visit / talk to us ─────────────────────────────── */}
            <Section tone="inverse">
                <SectionHeader
                    eyebrow="Come and find us"
                    title="Bulk orders, gifting"
                    accent="and franchise"
                    description="We put together dry fruit and chocolate hampers for Diwali, weddings and corporate gifting, and we are building a retail and franchise network across India. Tell us what you need."
                    action={<StoreButton href="/contact" variant="accent" arrow>Talk to us</StoreButton>}
                />

                <address className={cn(styles.visitGrid, 'not-italic')}>
                    <div data-reveal className={styles.visitItem}>
                        <span className={styles.visitLabel}>
                            <MapPin className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
                            Store
                        </span>
                        <span className={styles.visitValue}>
                            {CONTACT.addressLines.map((line) => (
                                <span key={line} className="block">{line}</span>
                            ))}
                        </span>
                    </div>
                    <div data-reveal className={styles.visitItem}>
                        <span className={styles.visitLabel}>
                            <Phone className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
                            Phone
                        </span>
                        <span className={styles.visitValue}>
                            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                        </span>
                    </div>
                    <div data-reveal className={styles.visitItem}>
                        <span className={styles.visitLabel}>
                            <Mail className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
                            Email
                        </span>
                        <span className={cn(styles.visitValue, 'break-words')}>
                            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                        </span>
                    </div>
                </address>
            </Section>

            {/* ── 9 · Related products ───────────────────────────────── */}
            {products.length > 0 && (
                <Section tone="page">
                    <SectionHeader eyebrow="Curated for you" title="You may" accent="also like" align="center" />
                    <div className="grid grid-cols-2 gap-[var(--grid-gap)] sm:grid-cols-3 lg:grid-cols-4">
                        {products.map((item) => (
                            <ProductBox key={item._id} product={item} />
                        ))}
                    </div>
                </Section>
            )}
        </AboutMotion>
    )
}

export default AboutUsContent
