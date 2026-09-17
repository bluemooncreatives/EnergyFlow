import GlobalProvider from "@/components/Application/GlobalProvider";
import LenisProvider from '@/components/Application/LenisProvider'
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const SITE_NAME = 'Energyflow';
const SITE_URL = 'https://www.energyflow.com';

// One canonical description, reused by the document head, Open Graph and the
// Twitter card so search and social previews can never drift apart.
const SITE_DESCRIPTION =
  'Buy premium dry fruits, nuts, seeds, super foods and healthy snacks online at Energyflow. Shop millets, muesli, berries, cold pressed oils, A2 Gir cow bilona ghee, herbal powders, honey and festive gift hampers, all quality checked and delivered across India.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Energyflow | Buy Premium Dry Fruits, Nuts, Seeds & Super Foods Online',
    template: '%s | Energyflow',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'dry fruits online',
    'buy dry fruits',
    'premium nuts',
    'super foods',
    'healthy snacks',
    'seeds and super foods',
    'millets and pulses',
    'muesli and oats',
    'cold pressed oil',
    'A2 Gir cow bilona ghee',
    'organic wellness products',
    'herbal powders',
    'natural honey',
    'corporate gifting dry fruits',
    'Energyflow',
  ],
  category: 'Food & Nutrition',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE_NAME,
    title: 'Energyflow | Premium Dry Fruits, Nuts, Seeds & Super Foods',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: '/assets/images/hero/01.webp',
        width: 1200,
        height: 630,
        alt: 'Energyflow premium dry fruits, nuts, seeds and super foods',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Energyflow | Premium Dry Fruits, Nuts, Seeds & Super Foods',
    description: SITE_DESCRIPTION,
    images: ['/assets/images/hero/01.webp'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  other: {
    'theme-color': '#1E4229',
  },
};

// Organisation-level structured data, emitted sitewide rather than per page so
// crawlers can attach the brand, its legal name and its founding date to every
// URL they reach. This is what feeds the brand knowledge panel.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  legalName: 'Energy Flow Supply Hub Pvt. Ltd.',
  url: SITE_URL,
  logo: `${SITE_URL}/assets/images/logo-maroon.png`,
  description: SITE_DESCRIPTION,
  foundingDate: '2025-11-19',
  slogan: 'Fuel Your Health, Energize Your Life.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-sans">
      <head>
        {/* Cloudinary serves product images, about-us photos and Instagram videos,
            but all of it is below the fold — the homepage LCP is a local /assets hero.
            A full preconnect (TCP + TLS) therefore sits unused during the critical
            window (Lighthouse: "Unused preconnect"), so we only warm DNS here. The
            socket is established lazily when the first below-the-fold Image/video loads. */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Preload only fonts on the LCP critical path.
            Felixti is the display font (.font-header) used by LCP headings
            on auth/checkout and other hero-text pages; it's 20 KB and swaps
            late without a preload, which tanks Speed Index.
            Medium (weight 600) is used by the LCP "Shop" heading.
            Book (weight 400) is the primary body font — preloaded so it's
            ready before below-the-fold content renders. */}
        <link rel="preload" href="/assets/font/Felixti.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/assets/font/PPNeueMontreal-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/assets/font/PPNeueMontreal-Book.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <GlobalProvider>
          <Toaster />
          <LenisProvider>
            {children}
          </LenisProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
