'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// Storefront light/dark switch. One tap flips the theme (the admin panel's
// ThemeSwitch offers the full light/dark/system menu); the choice is shared
// across the whole app by next-themes.
//
// variant="icon" — bare icon button for the desktop header.
// variant="row"  — labelled full-width row for the mobile menu sheet, where
//                  the header row has no room for a fourth icon.
const ThemeToggle = ({ variant = 'icon', className, iconClassName = 'h-6 w-6' }) => {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    // Until mounted the resolved theme is unknown; render the light state so
    // server and first client render match.
    const isDark = mounted && resolvedTheme === 'dark'
    const toggle = () => setTheme(isDark ? 'light' : 'dark')
    const Icon = isDark ? Sun : Moon

    if (variant === 'row') {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={toggle}
                className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-md px-3 py-3.5 text-left font-neue text-sm font-semibold uppercase tracking-[0em] text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-well)]',
                    className
                )}
            >
                <span className="flex items-center gap-3">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    Dark mode
                </span>
                {/* Track + thumb: sunflower when on. */}
                <span
                    aria-hidden="true"
                    className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
                        isDark ? 'border-[var(--brand-sun)] bg-[var(--brand-sun)]' : 'border-[var(--line-strong)] bg-[var(--surface-well)]'
                    )}
                >
                    <span
                        className={cn(
                            'absolute size-[1.125rem] rounded-full shadow-sm transition-transform duration-200',
                            isDark ? 'translate-x-[1.3rem] bg-[var(--palette-pine)]' : 'translate-x-[0.15rem] bg-[var(--brand-primary)]'
                        )}
                    />
                </span>
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={toggle}
            className={cn('text-[var(--ink-body)] transition-colors hover:text-[var(--brand-primary-hover)]', className)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light theme' : 'Dark theme'}
        >
            <Icon className={iconClassName} strokeWidth={1.75} aria-hidden="true" />
        </button>
    )
}

export default ThemeToggle
