import { cn } from '@/lib/utils'

// The one heading pattern every storefront section uses:
//   [• EYEBROW]
//   Title with an *accent* half
//   Optional lead paragraph                         [action →]
//
// `title` and `accent` render as one <h2>; the accent is only a colour shift so
// screen readers hear a single phrase. `action` is any node (a link, rail
// controls, a countdown) and sits bottom-right on desktop, below on mobile.
const SectionHeader = ({
    eyebrow,
    title,
    accent,
    description,
    action,
    align = 'left',
    id,
    as: Heading = 'h2',
    className,
}) => {
    const centered = align === 'center'

    return (
        <div
            className={cn(
                'mb-[var(--section-gap)] flex flex-col gap-5',
                centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between md:gap-10',
                className
            )}
        >
            <div data-reveal className={cn('flex min-w-0 flex-col gap-4', centered ? 'items-center' : 'items-start', 'max-w-3xl')}>
                {eyebrow && <span className="ef-eyebrow">{eyebrow}</span>}
                <Heading id={id} className="ef-title">
                    {title}
                    {accent && <> <span className="ef-title__accent">{accent}</span></>}
                </Heading>
                {description && <p className="ef-lead max-w-2xl">{description}</p>}
            </div>

            {action && (
                <div data-reveal className={cn('flex shrink-0 items-center gap-3', centered && 'justify-center')}>
                    {action}
                </div>
            )}
        </div>
    )
}

export default SectionHeader
