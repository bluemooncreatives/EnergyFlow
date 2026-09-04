import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <p
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center font-header select-none leading-none text-[var(--dark-red)]"
                style={{ fontSize: 'clamp(10rem,28vw,22rem)', opacity: 0.06 }}
            >
                404
            </p>

            <div className="relative z-10 flex flex-col items-center gap-4">
                <h1 className="font-neue text-3xl font-semibold tracking-tight text-[var(--dark-red-2)]">
                    Page not found
                </h1>
                <p className="mx-auto max-w-md text-base leading-relaxed text-[var(--dark-red)]/60">
                    The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                    Let&apos;s get you back to something beautiful.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="border border-[var(--dark-red)] px-8 py-3 text-sm font-medium uppercase tracking-widest text-[var(--dark-red)] transition-colors hover:bg-[var(--dark-red)] hover:text-white"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/shop"
                        className="bg-[var(--dark-red)] px-8 py-3 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-[var(--dark-red-2)]"
                    >
                        Shop Now
                    </Link>
                </div>
            </div>
        </div>
    )
}
