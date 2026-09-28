'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)

// Past this many characters the review body folds behind "Read more".
const FOLD_AT = 280

const initialsOf = (name) =>
    String(name || '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || '?'

// One shopper review. Deleted accounts fall back to "Energyflow shopper" and
// initials; missing dates and ratings degrade instead of rendering "NaN".
const ReviewList = ({ review }) => {
    const [open, setOpen] = useState(false)
    const [avatarFailed, setAvatarFailed] = useState(false)
    const name = review?.reviewedBy?.trim() || 'Energyflow shopper'
    const rating = Math.max(0, Math.min(5, Math.round(Number(review?.rating) || 0)))
    const created = review?.createdAt ? dayjs(review.createdAt) : null
    const body = String(review?.review || '').trim()
    const long = body.length > FOLD_AT
    const avatar = review?.avatar?.url

    return (
        <article className="group rounded-[var(--radius-card)] bg-surface-card p-5 shadow-[inset_0_0_0_1px_var(--line-soft)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_transparent,var(--elev-2)] sm:p-6">
            <header className="flex items-center gap-3">
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-tint-sage font-header text-sm font-semibold text-brand">
                    {/* A plain img: avatars can come from any sign-in provider's
                        host, and a blocked or broken one falls back to initials. */}
                    {avatar && !avatarFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="" loading="lazy" onError={() => setAvatarFailed(true)} className="size-full object-cover" />
                    ) : (
                        initialsOf(name)
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-semibold text-ink-strong">{name}</p>
                    {created?.isValid() && (
                        <time dateTime={created.toISOString()} title={created.format('D MMM YYYY')} className="text-xs text-ink-muted">
                            {created.fromNow()}
                        </time>
                    )}
                </div>
                <span className="flex shrink-0 items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} aria-hidden="true" className={cn('size-3.5', i < rating ? 'fill-gold text-gold' : 'text-ink-strong/20')} />
                    ))}
                </span>
            </header>

            {review?.title && (
                <h3 className="mt-4 font-neue text-base font-semibold leading-snug text-ink-strong">{review.title}</h3>
            )}
            {body && (
                <>
                    <p className={cn('mt-2 whitespace-pre-line break-words text-[0.9375rem] leading-relaxed text-ink-body', long && !open && 'line-clamp-4')}>
                        {body}
                    </p>
                    {long && (
                        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="ef-link mt-2 text-sm">
                            {open ? 'Show less' : 'Read more'}
                        </button>
                    )}
                </>
            )}
        </article>
    )
}

export default ReviewList
