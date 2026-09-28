import GlobalProvider from "@/components/Application/GlobalProvider";
import LenisProvider from '@/components/Application/LenisProvider'
import ThemeProvider from "@/components/Application/Admin/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const SITE_NAME = 'Energyflow';
const SITE_URL = 'https://www.energyflow.in';

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
  // Canonicals are route-specific and are declared by each public page.
  // A root canonical would otherwise be inherited by private and utility
  // routes, incorrectly telling crawlers that those URLs duplicate the home
  // page.
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
};

// Browser chrome follows the active colour scheme: cream canvas in light
// mode, deep evergreen in dark.
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F3E8' },
    { media: '(prefers-color-scheme: dark)', color: '#061D16' },
  ],
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
  email: 'energyflow0001@gmail.com',
  telephone: '+91-9289657742',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rangpuri, Mahipalpur',
    addressLocality: 'New Delhi',
    addressRegion: 'Delhi',
    postalCode: '110037',
    addressCountry: 'IN',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <head>
        {/* Cloudinary serves product images, about-us photos and Instagram videos,
            but all of it is below the fold — the homepage LCP is a local /assets hero.
            A full preconnect (TCP + TLS) therefore sits unused during the critical
            window (Lighthouse: "Unused preconnect"), so we only warm DNS here. The
            socket is established lazily when the first below-the-fold Image/video loads. */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Preload only fonts on the LCP critical path.
            Clash Display Semibold (600) sets the hero and section headlines;
            Archivo (variable, latin subset) is the body font on every page. */}
        <link rel="preload" href="/assets/font/ClashDisplay-Semibold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/assets/font/Archivo-Variable-Latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* One theme for the whole app: the storefront and the admin panel
            share the light/dark choice (stored by next-themes). */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlobalProvider>
            <Toaster />
            <LenisProvider>
              {children}
            </LenisProvider>
          </GlobalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
