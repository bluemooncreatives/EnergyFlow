import AboutUsClient from "./AboutUsClient";
import { getBestsellerProducts } from "@/lib/services/productService";
import { pickRandom } from "@/lib/utils";

// Re-render per request so the random picks vary on each visit (the bestseller
// pool itself stays cached inside getBestsellerProducts).
export const dynamic = "force-dynamic";

export default async function AboutUsPage() {
  // "You May Also Like" — 4 random picks from the storefront bestseller pool.
  const products = await getBestsellerProducts();
  return <AboutUsClient products={pickRandom(products ?? [], 4)} />;
}
