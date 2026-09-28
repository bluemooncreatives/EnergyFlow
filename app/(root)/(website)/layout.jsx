import Footer from '@/components/Application/Website/Footer'
import Header from '@/components/Application/Website/Header'
import NewsletterPopup from '@/components/Application/Website/newsletter/NewsletterPopup'
import { getFooterCategories } from '@/lib/services/categoryService'
import { getPublicNewsletterSettings } from '@/lib/services/newsletterService'

const Layout = async ({ children }) => {
    const [footerCategories, newsletter] = await Promise.all([
        getFooterCategories(),
        // A failed settings read just means no popup / footer strip this render.
        getPublicNewsletterSettings().catch(() => null),
    ])

    return (
        <div className='font-neue overflow-x-clip'>
            <Header />
            <main id="main-content" className='relative min-h-screen bg-surface-page'>
                {children}
            </main>
            <Footer
                categoryLinks={footerCategories}
                newsletter={newsletter?.footer?.enabled ? newsletter.footer : null}
            />
            {newsletter && <NewsletterPopup settings={newsletter} />}
        </div>
    )
}

export default Layout
