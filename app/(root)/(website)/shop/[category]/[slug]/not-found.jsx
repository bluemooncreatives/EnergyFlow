import { PackageSearch } from 'lucide-react'
import NotFoundContent from '@/components/Application/Website/storefront/NotFoundContent'

export default function ProductNotFound() {
    return (
        <NotFoundContent
            icon={PackageSearch}
            eyebrow="Product not found"
            title="This product is"
            accent="off the shelf."
            lead="It may have been renamed, sold out for good or removed from the catalogue. Browse the shop for something just as good."
        />
    )
}
