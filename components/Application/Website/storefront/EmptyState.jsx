import { cn } from '@/lib/utils'

/**
 * Storefront empty / not-found block: tinted icon disc, title, short copy and
 * an optional call to action (pass a StoreButton or Button as `action`).
 */
const EmptyState = ({ icon: Icon, title, description, action, tone = 'honey', className }) => (
    <div role="status" className={cn('mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-12 text-center', className)}>
        {Icon && (
            <span
                className={cn(
                    'flex size-14 items-center justify-center rounded-full',
                    tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-tint-honey text-brand'
                )}
            >
                <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </span>
        )}
        <div className="flex flex-col gap-1.5">
            <p className="text-lg font-semibold text-ink-strong">{title}</p>
            {description && <p className="text-sm leading-relaxed text-ink-body">{description}</p>}
        </div>
        {action && <div className="mt-1 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
)

export default EmptyState
