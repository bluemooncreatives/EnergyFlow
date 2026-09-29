// Server-rendered on purpose: the story, sourcing and leadership copy must be
// in the HTML for crawlers. AboutUsContent is a server component too — only the
// motion wrapper and the sourcing list ship JavaScript.
import AboutUsContent from "./AboutUsContent";
import { getBestsellerProducts } from "@/lib/services/productService";
import { getHomeCategories, getNavCategories } from "@/lib/services/categoryService";
import { getTestimonials } from "@/lib/services/testimonialService";
import { formatCategoryName, JsonLd, absoluteUrl, breadcrumbSchema } from "@/lib/seo";
import { pickRandom } from "@/lib/utils";

const DESCRIPTION =
  "Energyflow is a New Delhi dry fruits and superfoods brand by Energy Flow Supply Hub Pvt. Ltd. See how we source at origin, check every lot, and meet the directors.";

export const metadata = {
  title: { absolute: "About Energyflow | Dry Fruits & Superfoods Brand, Delhi" },
  description: DESCRIPTION,
  alternates: { canonical: "/about-us" },
  openGraph: {
    title: "About Energyflow | Dry Fruits & Superfoods Brand, Delhi",
    description: DESCRIPTION,
    url: "/about-us",
    images: [
      {
        url: "https://res.cloudinary.com/g5wdpcrr/image/upload/v1789913475/WhatsApp_Image_2026-09-20_at_7.39.30_PM.jpg",
        alt: "Inside the Energyflow dry fruits and super food store",
      },
    ],
  },
  twitter: {
    title: "About Energyflow | Dry Fruits & Superfoods Brand, Delhi",
    description: DESCRIPTION,
  },
};

// Every read below is a cached service, so this page can be served from the
// edge cache and refreshed in the background rather than re-queried per visit.
// (It was force-dynamic only so the "You may also like" picks could be
// re-randomised on every request — not worth a database round trip per view.)
export const revalidate = 300;

const EMPTY_NAV = { categories: [], totalProducts: 0 };

export default async function AboutUsPage() {
  const [bestsellers, homeCategories, nav, testimonials] = await Promise.all([
    // A failed read just drops the section — the page never breaks on it.
    getBestsellerProducts().catch(() => []),
    getHomeCategories().catch(() => []),
    getNavCategories().catch(() => EMPTY_NAV),
    getTestimonials().catch(() => []),
  ]);

  const categories = (homeCategories ?? []).map((category) => ({
    ...category,
    name: formatCategoryName(category.name),
  }));

  const stats = {
    categoryCount: nav?.categories?.length || categories.length,
    productCount: nav?.totalProducts || 0,
  };

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${absoluteUrl("/about-us")}#about`,
    url: absoluteUrl("/about-us"),
    name: "About Energyflow",
    description: DESCRIPTION,
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    // Ties this page to the brand entity declared sitewide in the root layout,
    // which is what lets search engines attach it to the knowledge panel.
    about: { "@id": `${absoluteUrl("/")}#organization` },
  };

  return (
    <>
      <JsonLd data={aboutSchema} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About us", path: "/about-us" },
        ])}
      />
      <AboutUsContent
        products={pickRandom(bestsellers ?? [], 4)}
        categories={categories}
        stats={stats}
        testimonials={testimonials ?? []}
      />
    </>
  );
}
