'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center font-neue">
            <p
                className="font-header select-none leading-none text-[var(--dark-red)]"
                style={{ fontSize: 'clamp(5rem,16vw,12rem)', opacity: 0.07 }}
            >
                Oops
            </p>

            <div className="-mt-6 flex flex-col items-center gap-4">
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--dark-red-2)]">
                    Something went wrong
                </h1>
                <p className="mx-auto max-w-md text-base leading-relaxed text-[var(--dark-red)]/60">
                    An unexpected error occurred. Please try again or return to the homepage.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                    <button
                        onClick={reset}
                        className="border border-[var(--dark-red)] px-8 py-3 text-sm font-medium uppercase tracking-widest text-[var(--dark-red)] transition-colors hover:bg-[var(--dark-red)] hover:text-white"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="bg-[var(--dark-red)] px-8 py-3 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-[var(--dark-red-2)]"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
