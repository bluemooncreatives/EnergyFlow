# Product URLs

The storefront canonical URL is `/shop/{category.slug}/{product.slug}`.
Names are display text; the saved lowercase, hyphenated slugs identify URLs.
All cards, search results, order links, new cart lines, metadata, structured
data and sitemap entries use `productPath` through `WEBSITE_PRODUCT_DETAILS`.

## Resolution and lifecycle

- `/product/{slug}` permanently redirects (HTTP 308) to the current URL.
- Incorrect or previous categories, mixed case, and saved product aliases
  redirect directly to the current URL. Query parameters, including `size`,
  survive the redirect. Canonicals exclude query parameters.
- Old persisted carts without a category use the legacy resolver. New carts
  save `categorySlug`; checkout verification refreshes it from the database.
- Missing products, deleted products/categories, orphaned categories, and
  products without a live variant return 404. Invalid pack sizes fall back
  to an available variant.
- Product edits retain previous slugs in `routeSlugs`. Slugs are globally
  unique, including historical aliases, so moving categories cannot change
  which product an old link identifies. Soft deletion retains reservations;
  permanent deletion removes the product and its reservations.
- Renames made before this change cannot be reconstructed automatically.
  The existing `cheery` → `candied-cherries` mapping remains supported.
- `/shop/{category}` redirects to the existing `/category/{slug}` landing
  page. Category landing pages keep their existing canonical URLs.

Catalogue mutations invalidate shared storefront caches and the sitemap.
The route resolver reads current product/category state on every request,
with request-local deduplication for layout, page and metadata.

## Deployment and checks

No existing slug or category data needs rewriting. Ensure deployment creates
the Product model's unique sparse multikey index on `routeSlugs` (as with
the existing unique slug index). Installations that disable Mongoose automatic
index creation must create this index through their normal migration process:

```javascript
db.products.createIndex({ routeSlugs: 1 }, { unique: true, sparse: true })
```

Run focused tests with `node --test tests/product-routing.test.mjs` and lint
with `npx eslint app components lib models routes hooks tests --quiet`.
For a production build alongside `next dev`, use an isolated output directory:

```powershell
$env:NEXT_DIST_DIR = '.next-check'
npm run build
```

Google recommends descriptive URLs and consistent product URLs across links,
canonical tags and sitemaps:
[Ecommerce URL structure](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites).
Next.js supports HTTP 308 through
[`permanentRedirect`](https://nextjs.org/docs/app/api-reference/functions/permanentRedirect).
