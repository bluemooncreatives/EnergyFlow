'use client'

import Link from 'next/link'
import { formatProductName } from '@/lib/seo'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { formatINR } from '../storefront/format'
import GiftSchedule, { PillArrow, SCHEDULE_PILL } from './GiftSchedule'
import { COLLECTION_ANCHOR, EnquireButton } from './GiftingSelection'
import { priceOf } from './GiftingUi'

const photosOf = (product) => (product?.media || []).filter((m) => m?.secure_url)

/**
 * "Our boxes" in the schedule layout (GiftSchedule): the headline and lead
 * with the open box's photo on the left, every box as an indexed row on the
 * right — the open one with its story, price and "View details", plus its
 * second photo as the thumbnail, so the two photos never repeat.
 */
const GiftCollectionIndex = ({ products = [], content, number }) => {
    if (!products.length) return null

    // The thumbnail is the same box's second photo (its own gallery), so it
    // never repeats the left photo and never shows another box. A box with
    // a single photo shows none.
    const thumbFor = (index) => {
        const second = photosOf(products[index])[1]
        return second ? { src: second.secure_url, alt: '' } : null
    }

    const items = products.map((product, index) => {
        const photos = photosOf(product)
        const thumb = thumbFor(index)
        const price = formatINR(priceOf(product))
        const mrp = formatINR(product.defaultVariant?.mrp ?? product.mrp)
        const showMrp = mrp && Number(product.defaultVariant?.mrp ?? product.mrp) > Number(priceOf(product))
        return {
            key: product._id,
            title: formatProductName(product.name),
            body: (
                <>
                    {product.summary && <p className="ef-clamp-2">{product.summary}</p>}
                    <p className="mt-1.5 tabular-nums">
                        <span className="font-semibold text-ink-strong">{price || 'Price on request'}</span>
                        {showMrp && <span className="ml-2 line-through"><span className="sr-only">MRP </span>{mrp}</span>}
                        {product.sizes?.length > 0 && <span> · {product.sizes.join(' / ')}</span>}
                    </p>
                </>
            ),
            action: (
                <Link href={WEBSITE_PRODUCT_DETAILS(product)} className="ef-btn ef-btn--outline ef-btn--sm rounded-full">
                    View details
                </Link>
            ),
            thumb,
            photo: photos[0] ? { src: photos[0].secure_url, alt: photos[0].alt || `${formatProductName(product.name)} gift box` } : null,
        }
    })

    // The accent line leads, as in the reference ("Game On: / Upcoming…").
    const kicker = content.titleAccent ? content.title : ''
    const title = content.titleAccent || content.title

    return (
        <GiftSchedule
            id={COLLECTION_ANCHOR}
            tone="page"
            number={number}
            eyebrow={content.eyebrow}
            kicker={kicker}
            title={title}
            lead={content.note}
            photo={(open) => items[open]?.photo || items.find((item) => item.photo)?.photo || null}
            items={items}
            cta={
                <EnquireButton className={SCHEDULE_PILL}>
                    Plan a bulk order <PillArrow />
                </EnquireButton>
            }
        />
    )
}

export default GiftCollectionIndex
