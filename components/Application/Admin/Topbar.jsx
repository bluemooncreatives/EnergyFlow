'use client'
import { usePathname } from 'next/navigation'
import ThemeSwitch from './ThemeSwitch'
import UserDropdown from './UserDropdown'
import AdminSearch from './AdminSearch'
import AdminMobileSearch from './AdminMobileSearch'
import Header from './layout/Header'
import TopNav from './layout/TopNav'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import {
    ADMIN_CUSTOMERS_SHOW,
    ADMIN_DASHBOARD,
    ADMIN_PRODUCT_SHOW,
    ADMIN_TRASH,
} from '@/routes/AdminPanelRoute'

const topNav = [
    { title: 'Overview', href: ADMIN_DASHBOARD },
    { title: 'Customers', href: ADMIN_CUSTOMERS_SHOW },
    { title: 'Products', href: ADMIN_PRODUCT_SHOW },
    { title: 'Settings', href: ADMIN_TRASH },
]

const Topbar = () => {
    const pathname = usePathname()
    const links = topNav.map((link) => ({
        ...link,
        isActive: pathname === link.href,
        disabled: link.disabled ?? false,
    }))

    return (
        <Header fixed className="border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70">
            <TopNav links={links} />
            <div className="ms-auto flex items-center gap-2">
                <div className="hidden md:block">
                    <AdminSearch />
                </div>
                <AdminMobileSearch />
                <ThemeSwitch />
                <Button variant="ghost" size="icon" aria-label="Settings">
                    <Settings className="size-4" />
                </Button>
                <UserDropdown />
            </div>
        </Header>
    )
}

export default Topbar
