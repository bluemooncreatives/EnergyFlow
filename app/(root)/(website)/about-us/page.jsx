import AboutUsClient from "./AboutUsClient";
import { getBestsellerProducts } from "@/lib/services/productService";
import { pickRandom } from "@/lib/utils";

const DESCRIPTION =
  "Energy Flow Supply Hub Pvt. Ltd. was registered in November 2025 and opened its first dry fruits and super food store. Meet the directors, read how we source, and see the retail and franchise network we are building across India.";

export const metadata = {
  title: "About Us | Our Story, Vision & Leadership",
  description: DESCRIPTION,
  alternates: { canonical: "/about-us" },
  openGraph: {
    title: "About Energyflow | Our Story, Vision & Leadership",
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
  return <AboutUsClient products={pickRandom(products ?? [], 4)} />;
}
