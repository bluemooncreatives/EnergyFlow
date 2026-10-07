import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import StoreButton from '@/components/Application/Website/storefront/StoreButton'
import StatementSection from '@/components/Application/Website/StatementSection'
import { fillTokens } from '@/lib/pageContent/shared'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { cn } from '@/lib/utils'
import AboutLeadership from './AboutLeadership'
import AboutMotion from './AboutMotion'
import AboutPromise from './AboutPromise'
import AboutRangeExplorer from './AboutRangeExplorer'
import AboutRelated from './AboutRelated'
import AboutSourcing from './AboutSourcing'
import AboutTestimonials from './AboutTestimonials'
import AboutVisit from './AboutVisit'
import AboutWorkWithUs from './AboutWorkWithUs'
import styles from './about-us.module.css'

/* The page's copy, lists and photos come from Admin → Pages → About us
   (`content`, merged over the designed defaults in lib/pageContent); the
   range, product counts, reviews and testimonials come from the store's own
   records. Every section that would be empty steps aside. */

// Hero mosaic: three photos cut into one grid of rounded tiles. Each photo
// shows across several tiles — `sizes` matches the width of its group, not of
// any one tile, because every tile in a group requests the same image.
const MOSAIC_GROUPS = {
    left: { className: 'gGift', sizes: '(max-width: 768px) 67vw, 30vw', parallax: 6 },
    centre: { className: 'gStore', sizes: '(max-width: 768px) 100vw, 50vw', parallax: 4, priority: true },
    right: { className: 'gSeeds', sizes: '(max-width: 768px) 33vw, 20vw', parallax: 6 },
}

// Tile ids map to grid placements in about-us.module.css (.t1–.t9); the
// group decides which photo shows through. t2, t6 and t7 are desktop-only.
const MOSAIC_TILES = [
    { id: 't1', group: 'left' },
    { id: 't2', group: 'left' },
    { id: 't3', group: 'centre' },
    { id: 't4', group: 'centre' },
    { id: 't5', group: 'centre' },
    { id: 't6', group: 'centre' },
    { id: 't7', group: 'centre' },
    { id: 't8', group: 'right' },
    { id: 't9', group: 'right' },
]

const Stat = ({ value, label }) => (
    <div data-reveal className="flex flex-col gap-1">
        <dt className="text-[0.8125rem] leading-snug text-ink-muted">{label}</dt>
        <dd className="order-first m-0 font-header text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-none text-ink-strong">{value}</dd>
    </div>
)

const AboutUsContent = ({ content, products = [], categories = [], stats, testimonials = [], rating = null }) => {
    const { hero } = content

    const mosaic = Object.fromEntries(
        Object.entries(hero.mosaic).map(([group, image]) => [group, image?.url ? image : null])
    )
    const mosaicAlt = Object.values(mosaic).filter(Boolean).map((image) => image.alt).filter(Boolean).join('; ')

    const heroStats = hero.stats
        .map(({ value, label }) => ({ ...fillTokens(value, { categories: stats.categoryCount, products: stats.productCount }), label }))
        .filter((stat) => stat.text && stat.label && !stat.empty)

    // Which numbered sections show, so the meta rows count 02, 03 … with no
    // gaps (the hero is 01).
    const show = {
        promise: content.promise.enabled,
        range: content.range.enabled && categories.length > 0,
        sourcing: content.sourcing.enabled && content.sourcing.steps.some((step) => step.title),
        leadership: content.leadership.enabled && content.leadership.people.some((person) => person.name),
        testimonials: content.testimonials.enabled && testimonials.length > 0,
        work: content.work.enabled && content.work.tabs.some((tab) => tab.label && tab.title),
        visit: content.visit.enabled,
    }
    const numbered = Object.keys(show).filter((key) => show[key])
    const numberOf = (key) => numbered.indexOf(key) + 2
    // Backgrounds alternate by position among the sections that show, so a
    // hidden section never leaves two of the same tone back to back. The
    // statement above is sunken, so the first numbered section is page.
    const toneOf = (key) => (numbered.indexOf(key) % 2 ? 'sunken' : 'page')

    return (
        <AboutMotion>
            {/* ── 01 · Hero ───────────────────────────────────────────── */}
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
                            {hero.eyebrow && <span className="ef-eyebrow mb-6">{hero.eyebrow}</span>}
                            <h1 className={styles.heroTitle}>
                                <span className={styles.lineMask}>
                                    <span data-headline className="block">{hero.title}</span>
                                </span>
                                {hero.titleAccent && (
                                    <span className={styles.lineMask}>
                                        <span data-headline className="block">
                                            <em>{hero.titleAccent}</em>
                                        </span>
                                    </span>
                                )}
                            </h1>
                        </div>

                        <div data-reveal className="flex max-w-md flex-col items-start gap-5 lg:pb-2">
                            <p className="ef-lead">{hero.lead}</p>
                            <div className="flex flex-wrap items-center gap-3">
                                <StoreButton href={WEBSITE_SHOP} arrow>{hero.primaryLabel}</StoreButton>
                                {hero.secondaryLabel && (
                                    <StoreButton href={hero.secondaryHref} variant="outline">{hero.secondaryLabel}</StoreButton>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Three photos cut into one grid of rounded tiles; the
                        cuts, stars and scalloped edge are the page showing
                        through. One accessible image: the tiles are slices of
                        it, not separate pictures. A missing photo leaves its
                        tiles as plain wells. */}
                    <div
                        className={cn(styles.mosaic, 'mt-[clamp(2rem,4vw,3.5rem)]')}
                        role="img"
                        aria-label={mosaicAlt || 'Energyflow dry fruits, nuts and superfoods'}
                        data-parallax-scope
                    >
                        {MOSAIC_TILES.map(({ id, group }) => {
                            const art = mosaic[group]
                            const config = MOSAIC_GROUPS[group]
                            return (
                                <div key={id} data-tile className={cn(styles.tile, styles[id], styles[config.className])}>
                                    {art && (
                                        <div className={styles.tileArt} data-parallax={config.parallax}>
                                            <Image
                                                src={art.url}
                                                alt=""
                                                fill
                                                sizes={config.sizes}
                                                priority={config.priority}
                                                loading={config.priority ? undefined : 'eager'}
                                                className="object-cover"
                                                style={{ objectPosition: art.position }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Catalogue figures are read live, never hand-typed, so
                        they cannot drift as the range grows. */}
                    {heroStats.length > 0 && (
                        <dl className={cn('mt-[clamp(2rem,4vw,3rem)] grid grid-cols-2 gap-6 border-t border-line-soft pt-8', heroStats.length >= 4 ? 'sm:grid-cols-4' : heroStats.length === 3 ? 'sm:grid-cols-3' : '')}>
                            {heroStats.map((stat, i) => <Stat key={`${stat.label}-${i}`} value={stat.text} label={stat.label} />)}
                        </dl>
                    )}
                </div>
            </section>

            {/* ── Statement ──────────────────────────────────────────── */}
            {content.statement.enabled && <StatementSection eyebrow="The promise" />}

            {show.promise && <AboutPromise content={content.promise} number={numberOf('promise')} rating={rating} tone={toneOf('promise')} />}

            {show.range && <AboutRangeExplorer content={content.range} categories={categories} number={numberOf('range')} tone={toneOf('range')} />}

            {show.sourcing && <AboutSourcing content={content.sourcing} number={numberOf('sourcing')} tone={toneOf('sourcing')} />}

            {show.leadership && <AboutLeadership content={content.leadership} number={numberOf('leadership')} tone={toneOf('leadership')} />}

            {show.testimonials && (
                <AboutTestimonials content={content.testimonials} testimonials={testimonials} rating={rating} number={numberOf('testimonials')} tone={toneOf('testimonials')} />
            )}

            {show.work && <AboutWorkWithUs content={content.work} number={numberOf('work')} tone={toneOf('work')} />}

            {show.visit && <AboutVisit content={content.visit} number={numberOf('visit')} tone={toneOf('visit')} />}

            {content.related.enabled && products.length > 0 && <AboutRelated content={content.related} products={products} />}
        </AboutMotion>
    )
}

export default AboutUsContent
