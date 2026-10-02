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
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    {Icon && <Icon className="size-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />}
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-[var(--brand-primary)]">{title}</h2>
                        {description && <p className="text-[13px] text-foreground/60">{description}</p>}
                    </div>
                </div>
                {action}
            </header>
        )}
        <div className={bodyClassName}>{children}</div>
    </section>
)

export default AccountCard
