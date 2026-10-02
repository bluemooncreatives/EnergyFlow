import { cn } from '@/lib/utils'

/**
 * Card shell shared by every account panel: hairline border, optional header
 * row (icon + title + right-aligned action) and an unpadded body slot.
 */
const AccountCard = ({ icon: Icon, title, description, action, className, bodyClassName, children, ...props }) => (
    <section
        className={cn('overflow-hidden rounded-[var(--radius-card)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)]', className)}
        {...props}
    >
        {title && (
            <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-line-soft px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    {Icon && <Icon className="mt-1 size-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />}
                    <div className="min-w-0">
                        <h2 className="text-base leading-snug font-semibold text-[var(--brand-primary)] sm:text-lg">{title}</h2>
                        {description && <p className="mt-0.5 text-xs leading-relaxed text-foreground/60 sm:text-[13px]">{description}</p>}
                    </div>
                </div>
                {action}
            </header>
        )}
        <div className={bodyClassName}>{children}</div>
    </section>
)

export default AccountCard
