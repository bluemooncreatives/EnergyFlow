'use client'

import Link from 'next/link'
import { ArrowLeft, Loader2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Shared empty / not-found / error block for the admin panel.
 *
 * tone: 'neutral' (empty lists) | 'danger' (load failures, missing records)
 * action: { href, label } renders a back link; onRetry renders a retry button.
 */
const AdminEmptyState = ({ icon: Icon, title, description, action, onRetry, tone = 'neutral', className }) => (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
        {Icon && (
            <span
                className={cn(
                    'flex size-12 items-center justify-center rounded-full',
                    tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary'
                )}
            >
                <Icon className="size-5" aria-hidden="true" />
            </span>
        )}
        <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
        {(action || onRetry) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry} className="h-9 px-4">
                        <RotateCw /> Try again
                    </Button>
                )}
                {action && (
                    <Button asChild size="sm" className="h-9 px-4">
                        <Link href={action.href}><ArrowLeft /> {action.label}</Link>
                    </Button>
                )}
            </div>
        )}
    </div>
)

export const AdminLoadingState = ({ label = 'Loading…', className }) => (
    <div role="status" className={cn('flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground', className)}>
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {label}
    </div>
)

export default AdminEmptyState
