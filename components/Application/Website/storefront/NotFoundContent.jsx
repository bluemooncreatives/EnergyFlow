import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Shared 404 body for the storefront and the root not-found page. Segment
// level not-found files pass their own copy and primary action so a missing
// product, aisle or order says what went missing and where to go next.
const NotFoundContent = ({
    icon: Icon = Compass,
    eyebrow = 'Error 404',
    title = 'This page',
    accent = 'wandered off.',
    lead = 'The page you are looking for doesn’t exist or may have moved. The pantry is still right here.',
    primary = { href: WEBSITE_SHOP, label: 'Shop all products' },
    secondary = { href: WEBSITE_HOME, label: 'Back to home' },
}) => (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-surface-page px-[var(--website-gutter)] pb-16 pt-32">
        <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(90vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-tint-sage"
        />
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-tint-honey text-brand">
                <Icon className="size-7" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="ef-eyebrow">{eyebrow}</span>
            <h1 className="ef-title">
                {title} <span className="ef-title__accent">{accent}</span>
            </h1>
            <p className="ef-lead">{lead}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href={primary.href} className="ef-btn ef-btn--primary">
                    {primary.label} <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                </Link>
                {secondary && <Link href={secondary.href} className="ef-btn ef-btn--outline">{secondary.label}</Link>}
            </div>
        </div>
    </section>
)

export default NotFoundContent
