import Footer from '@/components/Application/Website/Footer'
import Header from '@/components/Application/Website/Header'
import MobileCartBar from '@/components/Application/Website/MobileCartBar'
import CartSync from '@/components/Application/Website/CartSync'
import WishlistSync from '@/components/Application/Website/WishlistSync'
import NewsletterPopup from '@/components/Application/Website/newsletter/NewsletterPopup'
import ScrollTriggerSync from '@/components/Application/Website/ScrollTriggerSync'
import { getFooterCategories, getNavCategories } from '@/lib/services/categoryService'
import { getPublicNewsletterSettings } from '@/lib/services/newsletterService'

const EMPTY_NAV = { categories: [], totalProducts: 0 }

const Layout = async ({ children }) => {
    const [footerCategories, newsletter, navCategories] = await Promise.all([
        getFooterCategories(),
        // A failed settings read just means no popup / footer strip this render.
        getPublicNewsletterSettings().catch(() => null),
        // A failed read leaves "Shop" as a plain link — the header never breaks.
        getNavCategories().catch(() => EMPTY_NAV),
    ])

    return (
        <div className='font-neue overflow-x-clip'>
            <Header navCategories={navCategories} />
            <main id="main-content" className='relative min-h-screen bg-surface-page'>
                {children}
            </main>
            <Footer
                categoryLinks={footerCategories}
                newsletter={newsletter?.footer?.enabled ? newsletter.footer : null}
            />
            {newsletter && <NewsletterPopup settings={newsletter} />}
            <MobileCartBar />
            <CartSync />
            <WishlistSync />
            <ScrollTriggerSync />
        </div>
    )
}

export default Layout
