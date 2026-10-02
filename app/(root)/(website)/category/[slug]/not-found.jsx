import { LayoutGrid } from 'lucide-react'
import NotFoundContent from '@/components/Application/Website/storefront/NotFoundContent'

export default function CategoryNotFound() {
    return (
        <NotFoundContent
            icon={LayoutGrid}
            eyebrow="Category not found"
            title="This aisle"
            accent="doesn’t exist."
            lead="The category may have been renamed or retired. Everything we stock is still in the shop."
        />
    )
}
