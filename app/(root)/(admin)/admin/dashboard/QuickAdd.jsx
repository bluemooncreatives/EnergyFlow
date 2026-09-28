import Link from 'next/link'
import { FolderTree, Shirt, TicketPercent, Images } from 'lucide-react'
import { ADMIN_CATEGORY_ADD, ADMIN_COUPON_ADD, ADMIN_MEDIA_SHOW, ADMIN_PRODUCT_ADD } from '@/routes/AdminPanelRoute';
import { CardDefaultSm as Card } from '@/components/ui/card';
const QuickAdd = () => {
    const quickLinks = [
        {
            title: 'Add Category',
            href: ADMIN_CATEGORY_ADD,
            icon: FolderTree,
            description: 'Create a new category',
            chartVar: '--chart-1'
        },
        {
            title: 'Add Product',
            href: ADMIN_PRODUCT_ADD,
            icon: Shirt,
            description: 'Add a new product',
            chartVar: '--chart-2'
        },
        {
            title: 'Add Coupon',
            href: ADMIN_COUPON_ADD,
            icon: TicketPercent,
            description: 'Create a discount code',
            chartVar: '--chart-3'
        },
        {
            title: 'Upload Media',
            href: ADMIN_MEDIA_SHOW,
            icon: Images,
            description: 'Manage media assets',
            chartVar: '--chart-4'
        },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
                <Link key={link.title} href={link.href}>
                    <Card className="rounded-xl border-l-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderLeftColor: `var(${link.chartVar})` }}>
                        <div className="flex flex-col pr-8">
                            <div className="text-sm font-medium text-foreground">{link.title}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{link.description}</div>
                        </div>
                        <span className="absolute top-3 right-3 inline-flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `var(${link.chartVar})`, color: link.chartVar === '--chart-2' ? '#0A2F24' : 'var(--background)' }}>
                            <link.icon className="size-4" />
                        </span>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

export default QuickAdd
