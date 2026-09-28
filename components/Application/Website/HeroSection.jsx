"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Cherry, Gift, Leaf, Pause, Play, Sprout } from "lucide-react";

import PageLoader from "./PageLoader";
import { WEBSITE_CATEGORY, WEBSITE_SHOP } from "@/routes/WebsiteRoute";
import { cn } from "@/lib/utils";
import styles from "./HeroSection.module.css";

gsap.registerPlugin(useGSAP);

// Long enough to read a headline, a line of copy and reach the button.
const AUTO_MS = 5500;
const SWIPE_PX = 48;
const LOADER_SESSION_KEY = "energyflow_loader_seen";

// Cloudinary serves the plate PNGs; f_auto,q_auto keeps them light.
const plateUrl = (version, id) =>
  `https://res.cloudinary.com/g5wdpcrr/image/upload/f_auto,q_auto,w_900/v${version}/${id}.png`;

const shopCategory = (slug) => WEBSITE_CATEGORY(slug);

// Three slides sell straight into the shop (filtered to their category); the
// gifting slide leads to an enquiry instead, because hampers and corporate
// orders are quoted, not carted — its shop link is the secondary action.
const SLIDES = [
  {
    id: 1,
    label: "Dry fruits",
    eyebrow: "Premium Dry Fruits & Nuts",
    headline: "Pure Nutrition",
    writeup: "Handpicked almonds, cashews, walnuts and pistachios. Sourced at their best, packed fresh and graded for taste you can trust.",
    short: "Handpicked almonds, cashews, walnuts and pistachios, packed fresh.",
    plate: plateUrl("1789923296", "ChatGPT_Image_Sep_20_2026_09_57_51_PM"),
    alt: "A bowl of almonds, cashews, walnuts and pistachios",
    tint: "var(--tint-sage)",
    badge: { Icon: Leaf, text: "Handpicked & graded" },
    floaters: ["almond", "cashew", "walnut", "pistachio"],
    cta: { label: "Shop dry fruits", href: shopCategory("dry-fruits-and-nuts"), requires: "dry-fruits-and-nuts", fallback: { label: "Browse all products", href: WEBSITE_SHOP } },
    secondary: { label: "See bestsellers", href: `${WEBSITE_SHOP}?bestseller=true` },
  },
  {
    id: 2,
    label: "Superfoods",
    eyebrow: "Seeds That Power Your Day",
    headline: "Super Foods",
    writeup: "Chia, flax, pumpkin and sunflower seeds alongside berries and super foods, chosen to make everyday nutrition effortless.",
    short: "Chia, flax, pumpkin and sunflower seeds for effortless everyday nutrition.",
    plate: plateUrl("1789923316", "ChatGPT_Image_Sep_20_2026_09_58_13_PM"),
    alt: "A bowl of seeds, berries and super foods",
    tint: "var(--tint-pistachio)",
    badge: { Icon: Sprout, text: "Chia · Flax · Pumpkin" },
    floaters: ["pumpkinSeed", "goji", "sunflowerSeed", "chia"],
    cta: { label: "Shop superfoods", href: shopCategory("seeds-and-superfoods"), requires: "seeds-and-superfoods", fallback: { label: "Browse all products", href: WEBSITE_SHOP } },
    secondary: { label: "Browse all products", href: WEBSITE_SHOP, alt: { label: "Ask about superfoods", href: "/contact" } },
  },
  {
    id: 3,
    label: "Gifting",
    eyebrow: "Festive & Corporate Hampers",
    headline: "Made To Gift",
    writeup: "Chocolate and dry fruit gift boxes, wrapped and ready for festivals, weddings, teams and every reason worth celebrating.",
    short: "Chocolate and dry fruit gift boxes for festivals, weddings and teams.",
    plate: plateUrl("1789923316", "ChatGPT_Image_Sep_20_2026_09_58_22_PM"),
    alt: "A festive gift box of chocolates and dry fruits",
    tint: "var(--tint-almond)",
    badge: { Icon: Gift, text: "Custom & bulk orders" },
    floaters: ["bow", "sparkle", "truffle", "giftBox"],
    cta: { label: "Plan a gift order", href: "/contact" },
    secondary: { label: "Browse gift boxes", href: shopCategory("gift-boxes"), requires: "gift-boxes", fallback: { label: "Browse all products", href: WEBSITE_SHOP } },
  },
  {
    id: 4,
    label: "Treats",
    eyebrow: "Healthy Candies & Treats",
    headline: "Everyday Good",
    writeup: "Guilt free candies and chewables made with real fruit and clean ingredients, so the sweet part of the day stays on your side.",
    short: "Guilt free candies and chewables made with real fruit.",
    plate: plateUrl("1789923297", "ChatGPT_Image_Sep_20_2026_09_58_05_PM"),
    alt: "A bowl of fruit jellies and chocolate coated treats",
    tint: "var(--tint-berry)",
    badge: { Icon: Cherry, text: "Made with real fruit" },
    floaters: ["jellyOrange", "cherry", "candy", "jellyGreen"],
    cta: { label: "Shop healthy treats", href: shopCategory("healthy-candies-and-sweets"), requires: "healthy-candies-and-sweets", fallback: { label: "Browse all products", href: WEBSITE_SHOP } },
    secondary: { label: "Browse all products", href: WEBSITE_SHOP, alt: { label: "Ask about treats", href: "/contact" } },
  },
];

const TOTAL = SLIDES.length;

// A link that `requires` a category swaps to its `fallback` while that
// category has no products, so no hero button opens an empty results page.
// If both buttons would then point at the same place, the secondary uses its
// `alt`. With no availability data (fetch failed) links are left as authored.
const resolveLinks = (slide, availability) => {
  const live = (link) => !availability || !link.requires || availability.categories?.includes(link.requires);
  const cta = live(slide.cta) ? slide.cta : slide.cta.fallback;
  let secondary = live(slide.secondary) ? slide.secondary : slide.secondary.fallback;
  if (secondary.href === cta.href && slide.secondary.alt) secondary = slide.secondary.alt;
  return { cta, secondary };
};
const pad = (n) => String(n).padStart(2, "0");

// Orbit "dial": four evenly spaced slots (32° apart) on an arc centred on
// 9 o'clock, so the group sits balanced beside the plate. The active thumb
// takes the slot just below centre, the upcoming ones wait above it and the
// previous one has just passed below; each change turns the dial one slot.
// Angles are CSS rotations (clockwise from 3 o'clock; 180 = left).
// Index: slot for the active slide, then +1, +2, and -1 (previous).
const SLOTS_DESKTOP = [164, 196, 228, 132];
// Phones: the same dial turned a quarter, so the arc runs under the plate
// (there is no room beside it in portrait) and the active thumb sits just
// right of 6 o'clock.
const SLOTS_PHONE = SLOTS_DESKTOP.map((angle) => angle - 90);
const PHONE_QUERY = "(max-width: 639px)";
const angleFor = (index, active, slots = SLOTS_DESKTOP) => slots[(index - active + TOTAL) % TOTAL];

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Four floating slots, gently drifting, kept to the right half of the dial —
// clear of the thumb arc on the left, the badge at the lower right and the
// orbit line itself. Each slot shows a small illustration from the active
// slide's range (see `floaters` on each slide) and crossfades on change.
// The two soft (blurred) slots are desktop-only.
const FLOATERS = [
  { top: "-4%", left: "66%", size: 50, rotate: -18, soft: false, dx: 12, dy: 14, spin: 12, dur: 8 },
  { top: "18%", left: "93%", size: 42, rotate: 24, soft: false, dx: -10, dy: 14, spin: -10, dur: 9.5 },
  { top: "50%", left: "99%", size: 46, rotate: -30, soft: true, dx: -10, dy: -12, spin: -14, dur: 11 },
  { top: "99%", left: "72%", size: 32, rotate: 10, soft: true, dx: 10, dy: -8, spin: 16, dur: 7.5 },
];

// Small produce / gifting illustrations, drawn on a 64×64 grid.
const svg = (children) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">{children}</svg>
);
const SUGAR = (
  <g fill="#FFF8EC" opacity="0.75">
    <circle cx="22" cy="21" r="1.6" /><circle cx="34" cy="18" r="1.4" /><circle cx="44" cy="26" r="1.6" />
    <circle cx="26" cy="33" r="1.3" /><circle cx="40" cy="40" r="1.5" /><circle cx="22" cy="44" r="1.4" />
  </g>
);
const FLOATER_ART = {
  // Dry fruits
  almond: svg(<>
    <path d="M32 4C20 16 14 30 18 44c3 10 10 16 14 16s11-6 14-16C50 30 44 16 32 4Z" fill="#B96F35" />
    <path d="M31 11c-6 10-9 21-7 33" stroke="#D99A5E" strokeWidth="3" strokeLinecap="round" />
  </>),
  cashew: svg(<>
    <path d="M46 8c9 6 13 19 9 31-5 15-21 21-33 15-6-3-8-9-4-12 4-3 9 0 14-1 8-2 12-9 11-17-1-6-5-9-3-13 1-3 4-4 6-3Z" fill="#E8C487" />
    <path d="M50 18c2 9 0 19-8 25" stroke="#CFA05C" strokeWidth="3" strokeLinecap="round" />
  </>),
  walnut: svg(<>
    <path d="M32 7C20 7 10 16 10 30c0 14 10 27 22 27s22-13 22-27C54 16 44 7 32 7Z" fill="#A86B36" />
    <path d="M32 9v46M20 19c6 4 6 10 0 14s-6 10 0 14M44 19c-6 4-6 10 0 14s6 10 0 14" stroke="#7E4B22" strokeWidth="2.5" strokeLinecap="round" />
  </>),
  pistachio: svg(<>
    <path d="M32 5C19 11 12 25 14 39c2 12 10 19 18 19s16-7 18-19C52 25 45 11 32 5Z" fill="#DCC49A" />
    <path d="M32 15c-6 8-8 18-6 28 1 5 3 8 6 8s5-3 6-8c2-10 0-20-6-28Z" fill="#8FA33A" />
  </>),
  // Superfoods
  pumpkinSeed: svg(<>
    <path d="M32 4C21 12 16 26 18 40c2 12 8 20 14 20s12-8 14-20C48 26 43 12 32 4Z" fill="#7F9A3C" />
    <path d="M31 9c-9 8-13 20-11 32" stroke="#AFC46A" strokeWidth="3" strokeLinecap="round" />
  </>),
  goji: svg(<>
    <ellipse cx="32" cy="37" rx="13" ry="21" fill="#D4462B" />
    <ellipse cx="27" cy="29" rx="3" ry="7" fill="#F08A6A" />
    <path d="M32 16c0-4 2-8 7-10" stroke="#2F6B3F" strokeWidth="3" strokeLinecap="round" />
  </>),
  sunflowerSeed: svg(<>
    <path d="M32 4C24 14 20 28 22 42c1 10 5 18 10 18s9-8 10-18C44 28 40 14 32 4Z" fill="#2E2A26" />
    <path d="M29 14l-2 40M35 14l2 40" stroke="#D8D2C4" strokeWidth="2.5" strokeLinecap="round" />
  </>),
  chia: svg(<>
    <circle cx="22" cy="26" r="9" fill="#5E574C" /><circle cx="41" cy="22" r="8" fill="#8E8576" /><circle cx="34" cy="42" r="10" fill="#3F3A33" />
    <circle cx="19" cy="23" r="2" fill="#B5AC9C" /><circle cx="38" cy="19" r="2" fill="#D0C8B8" /><circle cx="31" cy="38" r="2" fill="#8E8576" />
  </>),
  // Gifting
  bow: svg(<>
    <path d="M32 30C22 18 8 16 8 26s14 10 24 4Z" fill="#2F6B3F" />
    <path d="M32 30c10-12 24-14 24-4s-14 10-24 4Z" fill="#4E8A5C" />
    <path d="M28 32l-8 22 8-4 4 6 2-24Z" fill="#0B3D2E" /><path d="M36 32l8 22-8-4-4 6-2-24Z" fill="#2F6B3F" />
    <circle cx="32" cy="30" r="5" fill="#0B3D2E" />
  </>),
  sparkle: svg(<>
    <path d="M32 4l6 20 20 8-20 8-6 20-6-20-20-8 20-8Z" fill="#F2C94C" />
    <path d="M32 18l2.5 9.5L44 32l-9.5 2.5L32 44l-2.5-9.5L20 32l9.5-2.5Z" fill="#FBEDC4" />
  </>),
  truffle: svg(<>
    <path d="M12 40l6 16h28l6-16c-10 6-30 6-40 0Z" fill="#E0A93E" />
    <circle cx="32" cy="32" r="19" fill="#5A3319" />
    <path d="M17 28c7-6 23-6 30 0" stroke="#8A5530" strokeWidth="3.5" strokeLinecap="round" />
  </>),
  giftBox: svg(<>
    <rect x="10" y="26" width="44" height="30" rx="4" fill="#2F6B3F" />
    <rect x="8" y="18" width="48" height="12" rx="3" fill="#4E8A5C" />
    <rect x="28" y="18" width="8" height="38" fill="#F2C94C" />
    <path d="M32 18c-4-8-14-10-14-4s10 4 14 4c4 0 14 2 14-4s-10-4-14 4Z" fill="#F2C94C" />
  </>),
  // Treats
  jellyOrange: svg(<>
    <rect x="12" y="12" width="40" height="40" rx="10" fill="#F28C28" />
    <rect x="12" y="12" width="40" height="14" rx="7" fill="#F2C94C" opacity="0.55" />
    {SUGAR}
  </>),
  cherry: svg(<>
    <path d="M24 38c4-12 10-24 22-30M42 40c0-12 1-22 4-32" stroke="#2F6B3F" strokeWidth="3" strokeLinecap="round" />
    <path d="M46 8c7 0 11 4 11 9-7 0-11-4-11-9Z" fill="#4E8A5C" />
    <circle cx="22" cy="46" r="11" fill="#C8202F" /><circle cx="42" cy="46" r="11" fill="#E03A3E" />
    <circle cx="18" cy="42" r="3" fill="#F28A8F" /><circle cx="38" cy="42" r="3" fill="#F7A3A6" />
  </>),
  candy: svg(<>
    <path d="M18 32L5 21v22Z" fill="#2F6B3F" /><path d="M46 32l13-11v22Z" fill="#2F6B3F" />
    <ellipse cx="32" cy="32" rx="16" ry="12" fill="#F2C94C" />
    <path d="M23 25l18 13M21 33l12 7M30 21l13 8" stroke="#F7F3E8" strokeWidth="2.5" strokeLinecap="round" />
  </>),
  jellyGreen: svg(<>
    <rect x="12" y="12" width="40" height="40" rx="10" fill="#8FB63A" />
    <rect x="12" y="12" width="40" height="14" rx="7" fill="#C4DB7A" opacity="0.6" />
    {SUGAR}
  </>),
};

const HIDDEN = { opacity: 0, visibility: "hidden" };

const HeroSection = ({ availability = null }) => {
  const rootRef = useRef(null);
  const discRef = useRef(null);
  const fillsRef = useRef([]);
  const armsRef = useRef([]);
  const thumbsRef = useRef([]);
  const leavesRef = useRef([]);

  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [canAutoplay, setCanAutoplay] = useState(false);
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const activeRef = useRef(0);
  const prevRef = useRef(0);
  const dirRef = useRef(1);
  const swapTlRef = useRef(null);
  const progressRef = useRef(null);
  // Reasons autoplay is held, besides the pause button.
  const holdRef = useRef({ hover: false, focus: false, offscreen: false, hidden: false });
  const pointerRef = useRef(null);
  const slotsRef = useRef(SLOTS_DESKTOP);
  const angleNow = (index, active) => angleFor(index, active, slotsRef.current);

  // Pick the dial's slot set for the viewport before paint, and re-park the
  // thumbs if the viewport crosses the phone breakpoint (rotation, resize).
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const apply = () => {
      swapTlRef.current?.progress(1);
      slotsRef.current = mq.matches ? SLOTS_PHONE : SLOTS_DESKTOP;
      armsRef.current.forEach((arm, i) => {
        if (!arm) return;
        const a = angleFor(i, activeRef.current, slotsRef.current);
        gsap.set(arm, { rotation: a });
        gsap.set(thumbsRef.current[i], { rotation: -a });
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── Loader handshake (unchanged behaviour: once per session) ──────
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(LOADER_SESSION_KEY) === "1") {
        setShowLoader(false);
        setLoaderComplete(true);
      }
    } catch {
      // storage blocked — the loader simply plays
    }
    // Auto-advance only where hover can pause it (mouse / trackpad). On touch
    // screens a slide changing under the thumb causes mis-taps, so phones and
    // tablets advance by swipe and tabs alone.
    setCanAutoplay(
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  const handleLoaderReady = useCallback(() => setLoaderComplete(true), []);
  const handleLoaderDone = useCallback(() => {
    try {
      window.sessionStorage.setItem(LOADER_SESSION_KEY, "1");
    } catch {
      // no-op
    }
    setShowLoader(false);
  }, []);

  const goTo = useCallback((index, direction) => {
    const next = (index + TOTAL) % TOTAL;
    if (next === activeRef.current) return;
    dirRef.current = direction ?? (next > activeRef.current ? 1 : -1);
    activeRef.current = next;
    setActive(next);
  }, []);

  // ── Autoplay: one progress tween per slide drives the tab fill ────
  const syncPlayback = useCallback(() => {
    const tween = progressRef.current;
    if (!tween) return;
    const h = holdRef.current;
    const hold = userPaused || h.hover || h.focus || h.offscreen || h.hidden;
    if (hold) tween.pause();
    else tween.resume();
  }, [userPaused]);

  useEffect(() => {
    // Completed segments stay full, upcoming ones empty — story style.
    fillsRef.current.forEach((fill, i) => {
      if (fill) gsap.set(fill, { scaleX: i < active ? 1 : 0 });
    });
    progressRef.current?.kill();
    progressRef.current = null;

    const fill = fillsRef.current[active];
    if (!fill) return;
    if (!loaderComplete || !canAutoplay) {
      gsap.set(fill, { scaleX: canAutoplay ? 0 : 1 });
      return;
    }

    progressRef.current = gsap.fromTo(
      fill,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: AUTO_MS / 1000,
        ease: "none",
        paused: true,
        onComplete: () => goTo(activeRef.current + 1, 1),
      }
    );
    syncPlayback();

    return () => progressRef.current?.kill();
  }, [active, loaderComplete, canAutoplay, goTo, syncPlayback]);

  useEffect(() => {
    syncPlayback();
  }, [userPaused, syncPlayback]);

  // Hold autoplay while the hero is off screen or the tab is hidden.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => {
      holdRef.current.offscreen = !entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.25 });
    io.observe(root);
    const onVisibility = () => {
      holdRef.current.hidden = document.hidden;
      syncPlayback();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncPlayback]);

  const hold = (key, value) => {
    holdRef.current[key] = value;
    syncPlayback();
  };

  // ── Entrance + ambient motion ─────────────────────────────────────
  useGSAP(
    () => {
      if (!loaderComplete) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const root = rootRef.current;

      // Park the orbit thumbs on their slots.
      armsRef.current.forEach((arm, i) => {
        const a = angleNow(i, activeRef.current);
        gsap.set(arm, { rotation: a });
        gsap.set(thumbsRef.current[i], { rotation: -a });
      });

      if (reduce) return;

      const first = root.querySelector('[data-slide="0"]');
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(discRef.current, { scale: 0.86, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.1 }, 0)
        .fromTo(root.querySelector('[data-plate="0"]'), { scale: 0.85, rotation: -24, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.3 }, 0.1)
        .fromTo(first.querySelectorAll("[data-word]"), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.08 }, 0.2)
        .fromTo(first.querySelectorAll("[data-anim]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.35)
        .fromTo(armsRef.current.map((a) => a?.firstElementChild).filter(Boolean), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.07 }, 0.6)
        .fromTo(root.querySelector('[data-badge="0"]'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.8)
        .fromTo(leavesRef.current.filter(Boolean), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.08 }, 0.5);

      leavesRef.current.forEach((leaf, i) => {
        if (!leaf) return;
        const p = FLOATERS[i];
        gsap.to(leaf, { x: p.dx, y: p.dy, rotation: `+=${p.spin}`, duration: p.dur, ease: "sine.inOut", repeat: -1, yoyo: true });
      });
    },
    { scope: rootRef, dependencies: [loaderComplete] }
  );

  // ── Slide change: the dial turns ──────────────────────────────────
  useGSAP(
    () => {
      const prev = prevRef.current;
      if (prev === active) return;
      prevRef.current = active;

      // A swap requested mid-swap finishes the old one instantly first,
      // so rapid clicks never leave two slides half-visible.
      swapTlRef.current?.progress(1).kill();

      const root = rootRef.current;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const dir = dirRef.current;
      const $ = (sel) => root.querySelector(sel);
      const outSlide = $(`[data-slide="${prev}"]`);
      const inSlide = $(`[data-slide="${active}"]`);
      const outPlate = $(`[data-plate="${prev}"]`);
      const inPlate = $(`[data-plate="${active}"]`);
      const outBadge = $(`[data-badge="${prev}"]`);
      const inBadge = $(`[data-badge="${active}"]`);

      if (reduce) {
        gsap.set([outSlide, outPlate, outBadge], { autoAlpha: 0 });
        gsap.set([inSlide, inPlate, inBadge], { autoAlpha: 1, clearProps: "transform" });
        gsap.set(inSlide.querySelectorAll("[data-word],[data-anim]"), { autoAlpha: 1, yPercent: 0, y: 0 });
        gsap.set(discRef.current, { backgroundColor: SLIDES[active].tint });
        armsRef.current.forEach((arm, i) => {
          const a = angleNow(i, active);
          gsap.set(arm, { rotation: a });
          gsap.set(thumbsRef.current[i], { rotation: -a });
        });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      swapTlRef.current = tl;

      // Copy: outgoing lifts away, incoming words rise from their masks.
      tl.to(outSlide.querySelectorAll("[data-word],[data-anim]"), { autoAlpha: 0, y: -14, duration: 0.3, ease: "power2.in", stagger: 0.02 }, 0)
        .set(outSlide, { autoAlpha: 0 })
        .set(inSlide, { autoAlpha: 1 }, 0.28)
        .fromTo(inSlide.querySelectorAll("[data-word]"), { autoAlpha: 1, y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.85, stagger: 0.07 }, 0.3)
        .fromTo(inSlide.querySelectorAll("[data-anim]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.42);

      // Plate: the old one turns away, the new one turns in — a lazy Susan.
      tl.to(outPlate, { rotation: -28 * dir, scale: 0.9, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, 0)
        .fromTo(inPlate, { rotation: 28 * dir, scale: 0.9, autoAlpha: 0 }, { rotation: 0, scale: 1, autoAlpha: 1, duration: 1 }, 0.25)
        .to(discRef.current, { backgroundColor: SLIDES[active].tint, duration: 0.9, ease: "power2.inOut" }, 0.1)
        .to(outBadge, { autoAlpha: 0, y: 8, duration: 0.25, ease: "power2.in" }, 0)
        .fromTo(inBadge, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.7);

      // Orbit: every thumb steps one notch. The one wrapping round the
      // back of the dial fades across instead of sweeping the long way.
      armsRef.current.forEach((arm, i) => {
        const thumb = thumbsRef.current[i];
        const from = angleNow(i, prev);
        const to = angleNow(i, active);
        if (Math.abs(to - from) > 60) {
          tl.to(thumb, { autoAlpha: 0, scale: 0.6, duration: 0.25, ease: "power2.in" }, 0)
            .set(arm, { rotation: to }, 0.25)
            .set(thumb, { rotation: -to }, 0.25)
            .to(thumb, { autoAlpha: 1, scale: 1, duration: 0.4 }, 0.5);
        } else {
          tl.to(arm, { rotation: to, duration: 0.9, ease: "power2.inOut" }, 0.1)
            .to(thumb, { rotation: -to, duration: 0.9, ease: "power2.inOut" }, 0.1);
        }
      });
    },
    { scope: rootRef, dependencies: [active] }
  );

  // ── Input ─────────────────────────────────────────────────────────
  // A slide the shopper picks stays put: any manual navigation ends
  // autoplay (the play button brings it back).
  const choose = (index, direction) => {
    setUserPaused(true);
    goTo(index, direction);
  };

  const onTabKeyDown = (event) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: "home", End: "end" };
    const k = keys[event.key];
    if (k === undefined) return;
    event.preventDefault();
    const next = k === "home" ? 0 : k === "end" ? TOTAL - 1 : (active + k + TOTAL) % TOTAL;
    choose(next, k === "home" ? -1 : k === "end" ? 1 : k);
    event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  // Touch swipe (mouse drags are left alone so text stays selectable).
  const onPointerDown = (event) => {
    if (event.pointerType === "mouse") return;
    pointerRef.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    choose(activeRef.current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  };

  // Pause for keyboard focus only — a mouse click on a tab also focuses it,
  // and that shouldn't freeze the slideshow until the next click elsewhere.
  const onFocusCapture = (event) => {
    if (event.target.matches?.(":focus-visible")) hold("focus", true);
  };

  // Hover pauses only over what is being read or operated — the hero fills
  // the viewport, so a section-wide hover would stop autoplay almost always.
  const hoverProps = {
    onMouseEnter: () => hold("hover", true),
    onMouseLeave: () => hold("hover", false),
  };

  const onBlurCapture = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) hold("focus", false);
  };

  const playing = canAutoplay && !userPaused;

  return (
    <>
      {showLoader && <PageLoader onReady={handleLoaderReady} onComplete={handleLoaderDone} />}
      <section
        ref={rootRef}
        className={styles.hero}
        aria-roledescription="carousel"
        aria-label="Featured collections"
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointerRef.current = null; }}
      >
        <h1 className="sr-only">Energyflow: buy premium dry fruits, nuts, superfoods, healthy snacks and gift boxes online</h1>

        <div className={cn("ef-container", styles.inner)}>
          <div className={styles.layout}>
            {/* ── Copy ── */}
            <div className={styles.copy} id="hero-slides" aria-live={playing ? "off" : "polite"} {...hoverProps}>
              {SLIDES.map((slide, i) => {
                const words = slide.headline.split(" ");
                const { cta, secondary } = resolveLinks(slide, availability);
                const isActive = i === active;
                return (
                  <div
                    key={slide.id}
                    data-slide={i}
                    id={`hero-slide-${i}`}
                    className={styles.slide}
                    role="tabpanel"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${TOTAL}: ${slide.label}`}
                    aria-hidden={!isActive}
                    inert={!isActive}
                    style={i === 0 ? undefined : HIDDEN}
                  >
                    <span data-anim className="ef-eyebrow">{slide.eyebrow}</span>

                    <h2 className={styles.headline}>
                      {words.map((word, w) => (
                        <span key={w}>
                          <span className={styles.mask}>
                            <span data-word className={cn(styles.word, w === words.length - 1 && styles.accentWord)}>
                              {word}
                            </span>
                          </span>
                          {w < words.length - 1 && " "}
                        </span>
                      ))}
                    </h2>

                    <p data-anim className={styles.writeup}>
                      {/* Phones get a two-line version instead of a clamped one. */}
                      <span className={styles.writeupFull}>{slide.writeup}</span>
                      <span className={styles.writeupShort}>{slide.short}</span>
                    </p>

                    <div data-anim className={styles.ctaRow}>
                      {/* Sunflower lead + pine second, as in the brand reference. */}
                      <Link href={cta.href} className="ef-btn ef-btn--accent ef-btn--lg">
                        {cta.label}
                        <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                      </Link>
                      <Link href={secondary.href} className="ef-btn ef-btn--pine ef-btn--lg">
                        {secondary.label}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── The dial ── */}
            <div className={styles.stageWrap}>
              <div className={styles.stage}>
                <div ref={discRef} className={styles.disc} style={{ backgroundColor: SLIDES[0].tint }} aria-hidden="true" />

                <svg viewBox="0 0 100 100" className={styles.orbit} aria-hidden="true">
                  <circle className={styles.orbitPath} cx="50" cy="50" r="62" />
                </svg>

                {SLIDES.map((slide, i) => (
                  <div key={slide.id} data-plate={i} className={styles.plate} style={i === 0 ? undefined : HIDDEN}>
                    <Image
                      src={slide.plate}
                      alt={i === active ? slide.alt : ""}
                      fill
                      priority={i === 0}
                      loading={i === 0 ? undefined : "eager"}
                      fetchPriority={i === 0 ? "high" : "low"}
                      sizes="(max-width: 1023px) 64vw, 35rem"
                      className={cn(styles.plateImg, i === 0 && "slide-visual")}
                    />
                  </div>
                ))}

                {/* Mouse shortcut only — the tab bar is the accessible control. */}
                {SLIDES.map((slide, i) => (
                  <div
                    key={slide.id}
                    className={styles.arm}
                    style={{ "--slot-d": `${angleFor(i, 0)}deg`, "--slot-m": `${angleFor(i, 0, SLOTS_PHONE)}deg` }}
                    ref={(el) => { armsRef.current[i] = el; }}
                    aria-hidden="true"
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      className={cn(styles.thumb, i === active && styles.thumbActive)}
                      ref={(el) => { thumbsRef.current[i] = el; }}
                      onClick={() => choose(i)}
                    >
                      <span className={styles.thumbImg}>
                        <Image src={slide.plate} alt="" fill sizes="80px" />
                      </span>
                      <span className={styles.thumbLabel}>{slide.label}</span>
                    </button>
                  </div>
                ))}

                {SLIDES.map(({ id, badge: { Icon, text } }, i) => (
                  <span key={id} data-badge={i} className={styles.badge} style={i === 0 ? undefined : HIDDEN} aria-hidden="true">
                    <span className={styles.badgeIcon}><Icon className="size-4" /></span>
                    {text}
                  </span>
                ))}

                {FLOATERS.map((slot, i) => (
                  <div
                    key={i}
                    ref={(el) => { leavesRef.current[i] = el; }}
                    className={cn(styles.leaf, slot.soft && `${styles.leafSoft} max-lg:hidden`)}
                    style={{ top: slot.top, left: slot.left, width: slot.size, height: slot.size, transform: `rotate(${slot.rotate}deg)` }}
                    aria-hidden="true"
                  >
                    {SLIDES.map((slide, s) => (
                      <span key={slide.id} className={styles.floater} data-on={s === active ? "" : undefined}>
                        {FLOATER_ART[slide.floaters[i]]}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Controls ── */}
          <div className={styles.controls} {...hoverProps}>
            <div className={styles.tabs} role="tablist" aria-label="Choose a collection" onKeyDown={onTabKeyDown}>
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  id={`hero-tab-${i}`}
                  aria-selected={i === active}
                  aria-controls={`hero-slide-${i}`}
                  tabIndex={i === active ? 0 : -1}
                  className={cn(styles.tab, "ef-focus")}
                  onClick={() => choose(i)}
                >
                  <span className={styles.track} aria-hidden="true">
                    <span className={styles.fill} ref={(el) => { fillsRef.current[i] = el; }} />
                  </span>
                  <span className={styles.tabText}>
                    <span className={styles.tabNum}>{pad(i + 1)}</span>
                    <span className={styles.tabLabel}>{slide.label}</span>
                  </span>
                </button>
              ))}
            </div>

            {canAutoplay && (
              <button
                type="button"
                className={cn("ef-icon-btn", styles.playBtn)}
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              >
                {userPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
