import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, HandCoins, Mail, MapPin, PackageCheck, Phone, ShieldCheck, Sprout } from 'lucide-react'
import { COMPANY } from '@/lib/company'

// The same four promises the About Us page makes, in short form.
const PROMISES = [
    { icon: Sprout, title: 'Sourced at origin', text: 'Bought from growers, mills and importers we deal with ourselves.' },
    { icon: ShieldCheck, title: 'Every lot checked', text: 'Graded for size, freshness and cleanliness before it is packed.' },
    { icon: PackageCheck, title: 'Packed in small batches', text: 'Sealed fresh so the crunch and aroma survive the trip to you.' },
    { icon: HandCoins, title: 'Priced without the chain', text: 'A short supply chain, so the saving reaches you, not a middleman.' },
]

/**
 * "Who's behind this pack" — a short introduction to the company on every
 * product page: the store, what Energyflow stands for, and how to reach a
 * person. Photo left, story right on desktop; stacked on phones.
 */
const ProductCompany = ({ productName, tone = 'page' }) => (
    <section aria-labelledby="company-title" className={`ef-section ${tone === 'sunken' ? 'ef-section--sunken' : 'ef-section--page'}`}>
        <div className="ef-container">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 xl:gap-20">
                {/* Store photo */}
                <figure data-reveal className="relative m-0">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-tile)] bg-surface-well shadow-elev-1 sm:aspect-[16/10] lg:aspect-[4/5]">
                        <Image
                            src={COMPANY.storePhoto.src}
                            alt={COMPANY.storePhoto.alt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 40vw"
                            className="object-cover"
                            style={{ objectPosition: COMPANY.storePhoto.position }}
                        />
                    </div>
                    <figcaption className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-[var(--radius-control)] bg-surface-card/90 px-3 py-2 text-[0.8125rem] font-medium text-ink-strong shadow-elev-1 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto">
                        <MapPin className="size-4 shrink-0 text-brand" aria-hidden="true" />
                        Our store in {COMPANY.addressLines[0]}, {COMPANY.city}
                    </figcaption>
                </figure>

                {/* Story */}
                <div className="flex min-w-0 flex-col">
                    <div data-reveal className="flex flex-col items-start gap-4">
                        <span className="ef-eyebrow">About {COMPANY.brand}</span>
                        <h2 id="company-title" className="ef-title">
                            Who&apos;s behind <span className="ef-title__accent">this pack</span>
                        </h2>
                        <p className="ef-lead max-w-2xl">
                            {productName ? <>{productName} is </> : 'Everything here is '}
                            sourced, checked and packed by {COMPANY.brand}, a {COMPANY.city} dry fruits and superfood
                            brand by {COMPANY.legalName}. We run a real store as well as this shop, so every pack
                            has to be one we&apos;d hand across our own counter.
                        </p>
                    </div>

                    <ul className="mt-7 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
                        {PROMISES.map(({ icon: Icon, title, text }) => (
                            <li
                                key={title}
                                data-reveal
                                className="flex items-start gap-3.5 rounded-[var(--radius-card)] bg-surface-card p-4 shadow-[inset_0_0_0_1px_var(--line-soft)]"
                            >
                                <span className="ef-seal ef-seal--sun size-10 shrink-0" aria-hidden="true">
                                    <Icon strokeWidth={2} />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-[0.9375rem] font-semibold leading-snug text-ink-strong">{title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-ink-body">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Reach a person */}
                    <div data-reveal className="mt-6 flex flex-col gap-4 border-t border-dashed border-line-strong pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <address className="flex flex-col gap-2 text-sm not-italic text-ink-body sm:flex-row sm:flex-wrap sm:gap-x-6">
                            <a href={COMPANY.phoneHref} className="ef-focus inline-flex items-center gap-2 rounded-sm transition-colors hover:text-brand">
                                <Phone className="size-4 shrink-0 text-brand" aria-hidden="true" />
                                {COMPANY.phone}
                            </a>
                            <a href={`mailto:${COMPANY.email}`} className="ef-focus inline-flex min-w-0 items-center gap-2 rounded-sm break-all transition-colors hover:text-brand">
                                <Mail className="size-4 shrink-0 text-brand" aria-hidden="true" />
                                {COMPANY.email}
                            </a>
                        </address>
                        <Link href="/about-us" className="ef-link ef-focus self-start sm:self-auto">
                            Our story
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </section>
)

export default ProductCompany
