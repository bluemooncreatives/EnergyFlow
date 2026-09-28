import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Storefront call-to-action. Renders a real <a> (via next/link) when given an
// href so it can be middle-clicked, prefetched and crawled; a <button> otherwise.
//
// variant: primary | accent | outline | light | ghost-light
// size:    sm | md | lg
export const StoreButton = ({
    href,
    variant = 'primary',
    size = 'md',
    arrow = false,
    block = false,
    className,
    children,
    ...props
}) => {
    const classes = cn(
        'ef-btn',
        `ef-btn--${variant}`,
        size !== 'md' && `ef-btn--${size}`,
        block && 'ef-btn--block',
        className
    )

    const content = (
        <>
            {children}
            {arrow && <ArrowRight className="ef-btn__arrow" aria-hidden="true" />}
        </>
    )

    if (href) {
        return <Link href={href} className={classes} {...props}>{content}</Link>
    }

    return <button type="button" className={classes} {...props}>{content}</button>
}

// "View all" style secondary CTA: an outlined button with the arrow boxed on
// the right (design-system.css `.ef-cta`).
export const StoreLink = ({ href, children, className, ...props }) => (
    <Link href={href} className={cn('ef-cta', className)} {...props}>
        <span>{children}</span>
        <span className="ef-cta__box" aria-hidden="true">
            <ArrowRight />
        </span>
    </Link>
)

export default StoreButton
