'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// Storefront light/dark switch. One tap flips the theme (the admin panel's
// ThemeSwitch offers the full light/dark/system menu); the choice is shared
// across the whole app by next-themes.
const ThemeToggle = ({ className, iconClassName = 'h-6 w-6' }) => {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    // Until mounted the resolved theme is unknown; render the light icon so
    // server and first client render match.
    const isDark = mounted && resolvedTheme === 'dark'

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn('text-[var(--ink-body)] transition-colors hover:text-[var(--brand-primary-hover)]', className)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light theme' : 'Dark theme'}
        >
            {isDark
                ? <Sun className={iconClassName} strokeWidth={1.75} aria-hidden="true" />
                : <Moon className={iconClassName} strokeWidth={1.75} aria-hidden="true" />}
        </button>
    )
}

export default ThemeToggle
