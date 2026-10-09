'use client'

import { cn } from '@/lib/utils'

export default function FeedbackStatusSelect({ value, onChange, disabled = false, label = 'Visibility' }) {
    return (
        <select
            aria-label={label}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
                'h-9 rounded-lg border px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60',
                value === 'live' ? 'ef-tone--forest' : 'ef-tone--sun',
            )}
        >
            <option value="draft">Draft</option>
            <option value="live">Live</option>
        </select>
    )
}
