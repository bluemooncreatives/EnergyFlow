import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { decode } from "entities";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Rich-text fields authored in CKEditor are sometimes persisted HTML-entity
// encoded — and legacy rows can be DOUBLE-encoded (e.g. `&amp;lt;p&amp;gt;`),
// which renders visible literal tags like "<p>&nbsp;Why it's called…" on the
// storefront. A single `decode()` only peels one layer. This decodes
// repeatedly until no encoded tags (`&lt;` / `&gt;`) remain or the string
// stabilises, so single-, double- or un-encoded content all render correctly.
export const decodeHTMLDeep = (value, maxPasses = 5) => {
  if (!value || typeof value !== "string") return "";
  let current = value;
  for (let i = 0; i < maxPasses; i++) {
    const next = decode(current);
    if (next === current) break;
    current = next;
    if (!/&lt;|&gt;/i.test(current)) break;
  }
  return current;
};

// Strip all HTML to plain text — used for clamped previews and meta where
// rendering raw markup would be unsafe/ugly. Runs deep-decode first.
export const htmlToText = (value) =>
  decodeHTMLDeep(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// Apparel sizes have a logical order that neither insertion order nor
// alphabetical sort respects (alpha would give L, M, S, XL). Sort by the
// canonical lettered scale first, then numeric sizes, then fall back to
// locale compare so unknown labels still order deterministically.
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];
export const sortSizes = (arr = []) =>
  [...arr].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(String(a).toUpperCase().trim());
    const ib = SIZE_ORDER.indexOf(String(b).toUpperCase().trim());
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });

// Return up to `n` items picked at random from `arr` (Fisher–Yates shuffle).
// Used to vary "You May Also Like" rails on each request.
export const pickRandom = (arr, n) => {
  const copy = Array.isArray(arr) ? [...arr] : [];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

export const sortings = [
  { value: "default_sorting", label: "Default Sorting" },
  { value: "asc", label: "Name: A to Z" },
  { value: "desc", label: "Name: Z to A" },
  { value: "price_low_high", label: "Price: Low to High" },
  { value: "price_high_low", label: "Price: High to Low" },
]

export const sizes = [
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "L", value: "L" },
  { label: "XL", value: "XL" },
  { label: "2XL", value: "2XL" },
]

export const orderStatus = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "unverified",
]

export function getPageNumbers(currentPage, totalPages) {
  const maxVisiblePages = 5
  const rangeWithDots = []

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
  } else {
    rangeWithDots.push(1)

    if (currentPage <= 3) {
      for (let i = 2; i <= 4; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push("...", totalPages)
    } else if (currentPage >= totalPages - 2) {
      rangeWithDots.push("...")
      for (let i = totalPages - 3; i <= totalPages; i++) {
        rangeWithDots.push(i)
      }
    } else {
      rangeWithDots.push("...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push("...", totalPages)
    }
  }

  return rangeWithDots
}
