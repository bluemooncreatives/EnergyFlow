import { PackageX } from 'lucide-react'
import NotFoundContent from '@/components/Application/Website/storefront/NotFoundContent'
import { USER_ORDERS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Also shown when the order exists but belongs to someone else, so the copy
// never confirms whether an order ID is real.
export default function OrderNotFound() {
    return (
        <NotFoundContent
            icon={PackageX}
            eyebrow="Order not found"
            title="We couldn’t find"
            accent="that order."
            lead="Check the order ID in your confirmation email, or make sure you’re signed in to the account that placed it."
            primary={{ href: USER_ORDERS, label: 'View my orders' }}
            secondary={{ href: WEBSITE_SHOP, label: 'Continue shopping' }}
        />
    )
}
