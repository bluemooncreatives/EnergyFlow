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

// "View all →" style inline link.
export const StoreLink = ({ href, children, className, ...props }) => (
    <Link href={href} className={cn('ef-link', className)} {...props}>
        {children}
        <ArrowRight aria-hidden="true" />
    </Link>
)

export default StoreButton
