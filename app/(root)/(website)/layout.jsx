import Footer from '@/components/Application/Website/Footer'
import Header from '@/components/Application/Website/Header'
import { getFooterCategories } from '@/lib/services/categoryService'

const Layout = async ({ children }) => {
    const footerCategories = await getFooterCategories()

    return (
        <div className='font-neue overflow-x-hidden'>
            <Header />
            <main id="main-content" className='relative min-h-screen bg-background'>
                {children}
            </main>
            <Footer categoryLinks={footerCategories} />
        </div>
    )
}

export default Layout
