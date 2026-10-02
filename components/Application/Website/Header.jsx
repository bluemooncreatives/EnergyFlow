'use client'

import Navbar from '@/components/ui/navbar'
import { WEBSITE_HOME, WEBSITE_LOGIN, WEBSITE_REGISTER, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// `megaMenu` marks the item that opens the category dropdown.
const menu = [
  { title: 'Home', url: WEBSITE_HOME },
  { title: 'Shop', url: WEBSITE_SHOP, megaMenu: true },
  { title: 'About Us', url: '/about-us' },
  { title: 'Contact', url: '/contact' },
]

// navCategories: { categories: [{ id, name, slug, href, productCount, image }], totalProducts }
// from getNavCategories() in the website layout.
const Header = ({ navCategories }) => {
  return (
    <div className="fixed inset-x-0 top-0 z-50 website-gutter pt-3 sm:pt-4">
      <header className="relative rounded-[var(--radius)] border border-[var(--header-border)] bg-[var(--header-bg)] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[var(--header-blur-bg)]">
        <Navbar
          logo={{
            url: WEBSITE_HOME,
            alt: 'Energyflow logo',
            title: 'Energyflow',
          }}
          menu={menu}
          navCategories={navCategories}
          auth={{
            login: { text: 'Sign in', url: WEBSITE_LOGIN },
            signup: { text: 'Create account', url: WEBSITE_REGISTER },
          }}
        />
      </header>
    </div>
  )
}

export default Header
