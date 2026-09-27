import { cn } from '@/lib/utils'

const TONES = {
    page: 'ef-section--page',
    sunken: 'ef-section--sunken',
    inverse: 'ef-section--inverse',
    none: '',
}

// Storefront section shell: background tone + the shared vertical rhythm, with
// the content held in the max-width container. Pass `bleed` to skip the
// container when a child needs the full viewport width (bands, marquees).
const Section = ({
    as: Tag = 'section',
    tone = 'page',
    tight = false,
    bleed = false,
    className,
    containerClassName,
    children,
    ...props
}) => (
    <Tag className={cn('ef-section', TONES[tone], tight && 'ef-section--tight', className)} {...props}>
        {bleed ? children : <div className={cn('ef-container', containerClassName)}>{children}</div>}
    </Tag>
)

export default Section
