import GlobalProvider from "@/components/Application/GlobalProvider";
import LenisProvider from '@/components/Application/LenisProvider'
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata = {
  metadataBase: new URL('https://www.energyflow.com'),
  title: {
    default: 'Energyflow- NUTS | SEEDS | MILLETS | HERBS',
    template: '%s | Energyflow',
  },
  description:
    "From everyday comfort to festive charm, Energyflow brings you handcrafted women's ethnic wear — designs that make you shine effortlessly.",
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
    siteName: 'Energyflow',
    title: 'Energyflow - NUTS | SEEDS | MILLETS | HERBS',
    description:
      "From everyday comfort to festive charm, Energyflow brings you handcrafted women's ethnic wear — designs that make you shine effortlessly.",
    url: 'https://www.energyflow.com',
    images: [
      {
        url: '/assets/images/hero/01.webp',
        width: 1200,
        height: 630,
        alt: 'Energyflow - NUTS | SEEDS | MILLETS | HERBS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Energyflow - NUTS | SEEDS | MILLETS | HERBS',
    description:
      "From everyday comfort to festive charm, Energyflow brings you handcrafted women's ethnic wear — designs that make you shine effortlessly.",
    images: ['/assets/images/hero/01.webp'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  other: {
    'theme-color': '#3E000D',
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
