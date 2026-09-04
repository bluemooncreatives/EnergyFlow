'use client'

import Navbar from '@/components/ui/navbar'
import { WEBSITE_HOME, WEBSITE_LOGIN, WEBSITE_REGISTER, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

const menu = [
  { title: 'Home', url: WEBSITE_HOME },
  { title: 'Shop', url: WEBSITE_SHOP },
  { title: 'About Us', url: '/about-us' },
  { title: 'Contact', url: '/contact' },
]

const Header = () => {
  return (
    <div className="fixed inset-x-0 top-0 z-50 website-gutter pt-3 sm:pt-4">
      <header className="rounded-[var(--radius)] border border-black/[0.208] bg-background/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Navbar
          logo={{
            url: WEBSITE_HOME,
            src: '/assets/images/hero/logo.png',
            alt: 'Energyflow logo',
            title: 'Energyflow',
          }}
          menu={menu}
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
