import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { WEBSITE_HOME } from '@/routes/WebsiteRoute'
import { cn } from '@/lib/utils'

// Header band for every inner storefront page (shop, cart, checkout, account,
// legal…): breadcrumb trail, the page's single <h1>, an optional lead and an
// optional right-hand slot (result counts, actions). The top padding clears the
// fixed site header.
//
//   links — trail after "Home": [{ label, href? }]; the last item is the
//           current page and renders without a link.
const PageHero = ({ title, eyebrow, description, links = [], children, className }) => (
    <section className={cn('relative isolate overflow-hidden bg-surface-sunken', className)}>
        {/* soft produce-tint glow, echoing the homepage hero disc */}
        <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-40 -z-10 size-[30rem] rounded-full bg-tint-pistachio opacity-70 blur-3xl"
        />

        <div className="ef-container pb-[clamp(1.75rem,3.5vw,3rem)] pt-[clamp(6.25rem,10vw,8.5rem)]">
            <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-ink-muted">
                    <li>
                        <Link href={WEBSITE_HOME} className="ef-focus rounded-sm transition-colors hover:text-brand">
                            Home
                        </Link>
                    </li>
                    {links.map((link, i) => {
                        const last = i === links.length - 1
                        return (
                            <li key={`${link.label}-${i}`} className="flex items-center gap-1.5">
                                <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />
                                {link.href && !last ? (
                                    <Link href={link.href} className="ef-focus rounded-sm transition-colors hover:text-brand">
                                        {link.label}
                                    </Link>
                                ) : (
                                    <span aria-current={last ? 'page' : undefined} className={cn(last && 'text-ink-strong')}>
                                        {link.label}
                                    </span>
                                )}
                            </li>
                        )
                    })}
                </ol>
            </nav>

            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
                <div className="flex min-w-0 max-w-3xl flex-col items-start gap-3">
                    {eyebrow && <span className="ef-eyebrow">{eyebrow}</span>}
                    <h1 className="ef-title">{title}</h1>
                    {description && <p className="ef-lead max-w-2xl">{description}</p>}
                </div>
                {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
            </div>
        </div>
    </section>
)

export default PageHero
