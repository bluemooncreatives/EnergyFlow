import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Shared 404 body for the storefront and the root not-found page.
const NotFoundContent = () => (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-surface-page px-[var(--website-gutter)] pb-16 pt-32">
        <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(90vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-tint-sage"
        />
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
            <span className="ef-eyebrow">Error 404</span>
            <h1 className="ef-title">
                This page <span className="ef-title__accent">wandered off.</span>
            </h1>
            <p className="ef-lead">
                The page you are looking for doesn&apos;t exist or may have moved. The pantry is still right here.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href={WEBSITE_SHOP} className="ef-btn ef-btn--primary">
                    Shop all products <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                </Link>
                <Link href={WEBSITE_HOME} className="ef-btn ef-btn--outline">Back to home</Link>
            </div>
        </div>
    </section>
)

export default NotFoundContent
