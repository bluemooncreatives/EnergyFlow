// Server-rendered on purpose: the story, sourcing and leadership copy must be
// in the HTML for crawlers. It was previously loaded with ssr:false, which
// left the page with no headings or text until JavaScript ran.
import AboutUsContent from "./AboutUsContent";
import { getBestsellerProducts } from "@/lib/services/productService";
import { pickRandom } from "@/lib/utils";

const DESCRIPTION =
  "Energyflow is a Delhi-based dry fruits and superfoods brand by Energy Flow Supply Hub Pvt. Ltd. Read how we source and quality check every lot, and meet our directors.";

export const metadata = {
  title: { absolute: "About Energyflow | Dry Fruits & Superfoods Brand, Delhi" },
  description: DESCRIPTION,
  alternates: { canonical: "/about-us" },
  openGraph: {
    title: "About Energyflow | Dry Fruits & Superfoods Brand, Delhi",
    description: DESCRIPTION,
    url: "/about-us",
  },
};

// Re-render per request so the random picks vary on each visit (the bestseller
// pool itself stays cached inside getBestsellerProducts).
export const dynamic = "force-dynamic";

export default async function AboutUsPage() {
  // "You May Also Like" — 4 random picks from the storefront bestseller pool.
  const products = await getBestsellerProducts();
  return <AboutUsContent products={pickRandom(products ?? [], 4)} />;
}
