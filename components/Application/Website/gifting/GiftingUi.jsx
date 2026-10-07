import { COMPANY } from '@/lib/company'
import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'

export const WHATSAPP_HREF = `https://wa.me/${COMPANY.phoneHref.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Energyflow, I would like to enquire about corporate gift boxes.')}`

export const MAIL_HREF = `mailto:${COMPANY.email}?subject=${encodeURIComponent('Corporate gifting enquiry')}`

export const pad = pad2

export const priceOf = (product) => product?.defaultVariant?.sellingPrice ?? product?.sellingPrice

export const photoOf = (product) => product?.media?.find((m) => m?.secure_url)?.secure_url || null

/**
 * The photo a section should show: the admin's pick when it has one, else
 * the n-th gift box photo (cycling, so neighbouring tiles rarely repeat),
 * else null and the section draws its own artwork. Box photos stand in as
 * decoration, so they carry no alt text of their own.
 */
export const pickImage = (image, photos = [], n = 0) => {
    if (image?.url) return { src: image.url, alt: image.alt || '', position: image.position || 'center' }
    if (!photos.length) return null
    return { src: photos[((n % photos.length) + photos.length) % photos.length], alt: '', position: 'center' }
}

// The section's number in a disc beside its label: "(02) [• PROGRAMS]".
export const SectionTag = ({ number, eyebrow, inverse = false, className }) => (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
        {number ? (
            <span
                aria-hidden="true"
                className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold tabular-nums',
                    inverse ? 'bg-sun text-sun-ink' : 'bg-brand text-on-brand'
                )}
            >
                {pad2(number)}
            </span>
        ) : null}
        {eyebrow && <span className="ef-eyebrow">{eyebrow}</span>}
    </div>
)

/**
 * The gifting page's numbered section heading: a hairline rule, the section
 * number and its label on the left, the headline on the right. Without a
 * title it is just the ruled label row (for sections that set their own
 * headline inside the layout).
 */
export const GiftSectionHead = ({ number, eyebrow, title, accent, id, inverse = false, className, children }) => (
    <div className={cn('mb-[var(--section-gap)] border-t pt-5 sm:pt-6', inverse ? 'border-cream/20' : 'border-line-strong', className)}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
            <SectionTag number={number} eyebrow={eyebrow} inverse={inverse} className="self-start" />
            {title && (
                <div className="flex min-w-0 flex-col items-start gap-4" data-reveal>
                    <h2 id={id} className="ef-title">
                        {title}
                        {accent && <> <span className="ef-title__accent">{accent}</span></>}
                    </h2>
                    {children}
                </div>
            )}
        </div>
    </div>
)
