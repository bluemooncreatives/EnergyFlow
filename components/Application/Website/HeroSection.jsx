"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";

import PageLoader from "./PageLoader";
import { WEBSITE_SHOP } from "@/routes/WebsiteRoute";
import styles from "./HeroSection.module.css";

gsap.registerPlugin(useGSAP, CustomEase);

const AUTO_SLIDE_MS = 6000;
const MAX_ACTIVE_SLIDES = 2;
const DESKTOP_HEADLINE_STEP = 172;
const MOBILE_TITLE_STEP = 160;
const LOADER_SESSION_KEY = "energyflow_loader_seen";

// Cloudinary serves the plate PNGs; f_auto,q_auto keeps them off the critical
// path budget — the raw files are ~200KB at only 400px wide.
const plateUrl = (version, id) =>
  `https://res.cloudinary.com/g5wdpcrr/image/upload/f_auto,q_auto,w_900/v${version}/${id}.png`;

const SLIDES = [
  {
    id: 1,
    headline: "Pure Nutrition",
    title: "Premium Dry Fruits & Nuts",
    writeup: "Handpicked almonds, cashews, walnuts and pistachios. Sourced at their best, packed fresh, and graded for taste you can trust.",
    plate: plateUrl("1789923296", "ChatGPT_Image_Sep_20_2026_09_57_51_PM"),
    alt: "Energyflow premium dry fruits and nuts including almonds, cashews, walnuts and pistachios",
  },
  {
    id: 2,
    headline: "Super Foods",
    title: "Seeds That Power Your Day",
    writeup: "Chia, flax, pumpkin and sunflower seeds alongside berries and super foods, chosen to make everyday nutrition effortless.",
    plate: plateUrl("1789923316", "ChatGPT_Image_Sep_20_2026_09_58_13_PM"),
    alt: "Energyflow seeds, berries and super foods collection",
  },
  {
    id: 3,
    headline: "Real Wellness",
    title: "Cold Pressed Oils & A2 Ghee",
    writeup: "Cold pressed oils and A2 Gir cow bilona ghee, made the traditional way. Nothing refined, nothing rushed, nothing hidden.",
    plate: plateUrl("1789923316", "ChatGPT_Image_Sep_20_2026_09_58_22_PM"),
    alt: "Energyflow cold pressed oils and A2 Gir cow bilona ghee",
  },
  {
    id: 4,
    headline: "Everyday Good",
    title: "Snacks, Millets & Muesli",
    writeup: "Roasted healthy snacks, millets, pulses, muesli and oats for mindful eating that still tastes like something you look forward to.",
    plate: plateUrl("1789923297", "ChatGPT_Image_Sep_20_2026_09_58_05_PM"),
    alt: "Energyflow healthy roasted snacks, millets, muesli and oats",
  },
];

const TOTAL_SLIDES = SLIDES.length;

// Leaf drift presets — each leaf gets its own amplitude and period so the
// group motion never visibly loops. Depth drives blur via the class.
const LEAVES = [
  { top: "6%", left: "58%", size: 58, rotate: -18, depth: "leafMid", dx: 26, dy: 34, spin: 16, dur: 7.5 },
  { top: "22%", left: "88%", size: 44, rotate: 34, depth: "leafNear", dx: -22, dy: 28, spin: -14, dur: 9.2 },
  { top: "52%", left: "54%", size: 40, rotate: 8, depth: "leafNear", dx: 20, dy: -26, spin: 20, dur: 8.1 },
  { top: "68%", left: "76%", size: 52, rotate: -40, depth: "leafMid", dx: -28, dy: -22, spin: -18, dur: 10.4 },
  { top: "38%", left: "70%", size: 72, rotate: 22, depth: "leafFar", dx: 18, dy: 30, spin: 12, dur: 11.6 },
  { top: "84%", left: "62%", size: 36, rotate: -8, depth: "leafFar", dx: -16, dy: -30, spin: -22, dur: 6.8 },
];

// Mobile keeps only the three sharpest leaves — the blurred ones cost the
// most to composite and read as noise at that size.
const MOBILE_LEAF_COUNT = 3;

const LeafShape = () => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path
      d="M58 6C58 6 40 4 26 14 12 24 6 40 6 58c0 0 18 2 32-8 14-10 20-26 20-44Z"
      fill="currentColor"
    />
    <path d="M58 6 6 58" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
  </svg>
);

const splitToChars = (text) =>
  text.split(" ").flatMap((word, wordIndex, words) => {
    const wordGroup = (
      <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
        {word.split("").map((char, charIndex) => (
          <span
            key={`${wordIndex}-${charIndex}`}
            className="char inline-block"
            style={{ transformOrigin: "50% 100%" }}
          >
            {char}
          </span>
        ))}
      </span>
    );
    if (wordIndex < words.length - 1) {
      return [
        wordGroup,
        <span
          key={`sp-${wordIndex}`}
          className="char inline-block"
          style={{ transformOrigin: "50% 100%" }}
        >
          {" "}
        </span>,
      ];
    }
    return [wordGroup];
  });

const HeroSection = () => {
  const sliderRef = useRef(null);
  const sliderImagesRef = useRef(null);
  const counterRef = useRef(null);
  const mobileTitleTrackRef = useRef(null);
  const headlineTrackRef = useRef(null);
  const writeupTrackRef = useRef(null);
  const indicatorsRef = useRef(null);
  const previewsRef = useRef([]);
  const progressBarsRef = useRef([]);
  const blobRef = useRef(null);
  const leavesRef = useRef([]);
  const orbitPathRef = useRef(null);
  const orbitThumbsRef = useRef([]);
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  // Chars are split client-side only so the server renders ~150 fewer DOM nodes,
  // cutting hydration time. The loader covers the hero during the transition.
  const [textSplit, setTextSplit] = useState(false);

  useEffect(() => {
    setTextSplit(true);
  }, []);

  useEffect(() => {
    try {
      const hasSeenLoader = window.sessionStorage.getItem(LOADER_SESSION_KEY) === "1";
      if (hasSeenLoader) {
        setShowLoader(false);
        setLoaderComplete(true);
      }
    } catch {
      // no-op
    }
  }, []);

  const handleLoaderReady = useCallback(() => {
    setLoaderComplete(true);
  }, []);

  const handleLoaderDone = useCallback(() => {
    try {
      window.sessionStorage.setItem(LOADER_SESSION_KEY, "1");
    } catch {
      // no-op
    }
    setShowLoader(false);
  }, []);

  useGSAP(
    () => {
      if (!loaderComplete) return;

      // Create the custom ease here — only needed when animations run (~3s after load)
      CustomEase.create("hop2", "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1");

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let currentIndex = 0;
      let indicatorRotation = 0;
      let autoSlideId = 0;
      let isAnimating = false;
      let progressTween = null;
      // Fraction along the dashed arc that thumb 0 sits at; the rest are
      // spaced behind it. Advancing this by one step per swap is what makes
      // the thumbs travel down the arc as the plate changes.
      let orbitOffset = 0;

      const createSlideElement = (slide) => {
        const slideElement = document.createElement("div");
        slideElement.className = `${styles.plate} img`;

        const plateImage = document.createElement("img");
        plateImage.src = slide.plate;
        plateImage.alt = slide.alt;
        plateImage.loading = "eager";
        plateImage.decoding = "async";
        plateImage.className = `${styles.plateImg} slide-visual will-change-transform`;
        plateImage.style.transformOrigin = "center center";
        slideElement.appendChild(plateImage);

        return slideElement;
      };

      // ── Orbit thumbs ────────────────────────────────────────────
      // An SVG <circle> path starts at 3 o'clock and runs clockwise, so
      // length 0.25 is the bottom, 0.5 the left and 0.75 the top. Only the
      // left arc crosses the visible canvas: 0.62 (upper-left) down through
      // 0.5 (left) to 0.40 (lower-left). The span is negative because the
      // thumbs travel DOWNWARD as slot increases, as in the reference —
      // a positive span would walk them up and over the top of the circle.
      const ORBIT_START = 0.62;
      const ORBIT_SPAN = -0.22;

      const placeOrbitThumbs = () => {
        const path = orbitPathRef.current;
        if (!path) return;

        const total = path.getTotalLength();
        const count = orbitThumbsRef.current.filter(Boolean).length;
        if (!count || !total) return;

        // getPointAtLength returns viewBox units (0–100). The SVG fills its
        // square container, so one unit is one hundredth of the box width.
        const box = path.ownerSVGElement?.getBoundingClientRect();
        const unit = (box?.width ?? 0) / 100;
        if (!unit) return;

        orbitThumbsRef.current.forEach((thumb, index) => {
          if (!thumb) return;
          const slot = (index / count + orbitOffset) % 1;
          const point = path.getPointAtLength((ORBIT_START + slot * ORBIT_SPAN) * total);
          // Thumbs grow slightly as they descend the arc, matching the
          // reference's sense of them coming toward the viewer.
          const scale = 0.82 + slot * 0.3;
          gsap.set(thumb, { x: point.x * unit, y: point.y * unit, scale });
        });
      };

      const advanceOrbit = (duration) => {
        const path = orbitPathRef.current;
        if (!path) return;

        const count = orbitThumbsRef.current.filter(Boolean).length;
        if (!count) return;

        gsap.to(
          { t: orbitOffset },
          {
            t: orbitOffset + 1 / count,
            duration,
            ease: "power2.inOut",
            onUpdate() {
              orbitOffset = this.targets()[0].t % 1;
              placeOrbitThumbs();
            },
          }
        );
      };

      // Slow continuous creep at rest, so the arc is never fully static.
      const startOrbitDrift = () => {
        if (reduceMotion) return null;
        const count = orbitThumbsRef.current.filter(Boolean).length;
        if (!count) return null;

        // Incremental rather than absolute, so a swap's advanceOrbit tween can
        // move the same offset without the two fighting. deltaRatio keeps the
        // creep rate identical on 60Hz and 120Hz displays.
        const perFrame = 1 / (140 * 60);
        const tick = () => {
          orbitOffset = (orbitOffset + perFrame * gsap.ticker.deltaRatio()) % 1;
          placeOrbitThumbs();
        };
        gsap.ticker.add(tick);
        return { kill: () => gsap.ticker.remove(tick) };
      };

      // ── Leaf drift ──────────────────────────────────────────────
      const startLeafDrift = () => {
        if (reduceMotion) return;

        leavesRef.current.forEach((leaf, index) => {
          if (!leaf) return;
          const preset = LEAVES[index];
          gsap.to(leaf, {
            x: preset.dx,
            y: preset.dy,
            rotate: `+=${preset.spin}`,
            duration: preset.dur,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            force3D: true,
          });
        });
      };

      const animateCharsForLine = (trackRef) => {
        const activeLine = trackRef.current?.children[currentIndex];
        if (!activeLine) return;

        const chars = activeLine.querySelectorAll(".char");
        gsap.fromTo(
          chars,
          { yPercent: 120, opacity: 0, rotateX: -90, scale: 0.8, force3D: true },
          {
            yPercent: 0,
            opacity: 1,
            rotateX: 0,
            scale: 1,
            duration: 0.85,
            ease: "power4.out",
            stagger: 0.022,
            overwrite: true,
            force3D: true,
          }
        );
      };

      const animateCharsOut = (trackRef, index) => {
        const line = trackRef.current?.children[index];
        if (!line) return;

        const chars = line.querySelectorAll(".char");
        gsap.to(chars, {
          yPercent: -120,
          opacity: 0,
          rotateX: 60,
          scale: 0.85,
          duration: 0.5,
          ease: "power3.in",
          stagger: 0.012,
          force3D: true,
        });
      };

      const startProgressBar = () => {
        if (progressTween) progressTween.kill();

        progressBarsRef.current.forEach((bar) => {
          if (bar) gsap.set(bar, { scaleX: 0 });
        });

        const activeBar = progressBarsRef.current[currentIndex];
        if (!activeBar) return;

        progressTween = gsap.fromTo(
          activeBar,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: AUTO_SLIDE_MS / 1000,
            ease: "none",
          }
        );
      };

      const animateWriteupIn = (index) => {
        const writeupBlock = writeupTrackRef.current?.children[index];
        if (!writeupBlock) return;

        const title = writeupBlock.querySelector(".writeup-title");
        const desc = writeupBlock.querySelector(".writeup-desc");

        if (title) {
          gsap.fromTo(
            title,
            { yPercent: 40, opacity: 0, force3D: true },
            { yPercent: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.15, force3D: true }
          );
        }
        if (desc) {
          gsap.fromTo(
            desc,
            { yPercent: 30, opacity: 0, force3D: true },
            { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.3, force3D: true }
          );
        }
      };

      const animateWriteupOut = (index) => {
        const writeupBlock = writeupTrackRef.current?.children[index];
        if (!writeupBlock) return;

        const title = writeupBlock.querySelector(".writeup-title");
        const desc = writeupBlock.querySelector(".writeup-desc");

        if (title) {
          gsap.to(title, { yPercent: -30, opacity: 0, duration: 0.4, ease: "power2.in", force3D: true });
        }
        if (desc) {
          gsap.to(desc, { yPercent: -20, opacity: 0, duration: 0.35, ease: "power2.in", force3D: true });
        }
      };

      const updateTextAndCounter = (prevIndex) => {
        gsap.to(counterRef.current, {
          y: -20 * currentIndex,
          duration: 0.95,
          ease: "hop2",
          force3D: true,
        });

        gsap.to(mobileTitleTrackRef.current, {
          y: -MOBILE_TITLE_STEP * currentIndex,
          duration: 0.95,
          ease: "hop2",
          force3D: true,
        });

        gsap.to(headlineTrackRef.current, {
          y: -DESKTOP_HEADLINE_STEP * currentIndex,
          duration: 0.95,
          ease: "hop2",
          force3D: true,
        });

        gsap.to(writeupTrackRef.current, {
          y: -176 * currentIndex,
          duration: 0.95,
          ease: "hop2",
          force3D: true,
        });

        if (prevIndex !== undefined && prevIndex !== currentIndex) {
          animateCharsOut(mobileTitleTrackRef, prevIndex);
          animateCharsOut(headlineTrackRef, prevIndex);
          animateWriteupOut(prevIndex);
        }

        animateCharsForLine(mobileTitleTrackRef);
        animateCharsForLine(headlineTrackRef);
        animateWriteupIn(currentIndex);
      };

      const updateActivePreview = () => {
        previewsRef.current.forEach((preview) => preview?.classList.remove("active"));
        previewsRef.current[currentIndex]?.classList.add("active");
      };

      const cleanupSlides = () => {
        const slides = sliderImagesRef.current?.querySelectorAll(".img");
        if (!slides || slides.length <= MAX_ACTIVE_SLIDES) return;

        const slideToRemove = slides[0];
        slideToRemove.remove();
      };

      // ── Plate swap ──────────────────────────────────────────────
      // Measured off the reference recording at 15fps:
      //   outgoing  x 0 → +140%, scale 1 → 1.08, opacity 1 → 0   over 0.45s
      //   incoming  x -60 → 0, scale 0.85 → 1, rotate -35 → 0    over 0.60s
      // The incoming plate is inserted BEHIND the outgoing one and is already
      // fully opaque — it is revealed as the outgoing plate slides clear,
      // rather than crossfading in.
      const animateSlide = (direction) => {
        if (isAnimating) return false;

        const currentSlide = sliderImagesRef.current?.lastElementChild;
        if (!currentSlide || !sliderImagesRef.current) return false;

        isAnimating = true;

        const isRight = direction === "right";
        const sign = isRight ? 1 : -1;

        const nextSlide = createSlideElement(SLIDES[currentIndex]);
        sliderImagesRef.current.insertBefore(nextSlide, currentSlide);

        const outgoingVisual = currentSlide.querySelector(".slide-visual") || currentSlide;
        const incomingVisual = nextSlide.querySelector(".slide-visual") || nextSlide;

        gsap.set(incomingVisual, {
          xPercent: -10 * sign,
          scale: 0.85,
          rotate: -35 * sign,
          opacity: 1,
          force3D: true,
        });

        const tl = gsap.timeline({
          defaults: { force3D: true },
          onComplete: () => {
            isAnimating = false;
          },
        });

        // Outgoing: slides clear of the stage, scaling up a touch as it goes.
        tl.to(
          outgoingVisual,
          {
            xPercent: 140 * sign,
            scale: 1.08,
            rotate: 12 * sign,
            duration: 0.45,
            ease: "power2.in",
          },
          0
        ).to(
          currentSlide,
          {
            opacity: 0,
            duration: 0.3,
            ease: "power1.in",
          },
          0.2
        );

        // Incoming: unwinds its rotation and settles to centre.
        tl.to(
          incomingVisual,
          {
            xPercent: 0,
            scale: 1,
            rotate: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          0.06
        );

        tl.call(
          () => {
            currentSlide.remove();
            cleanupSlides();
          },
          null,
          0.5
        );

        // Orbit thumbs step forward on the same beat as the plate swap.
        advanceOrbit(0.6);

        indicatorRotation += isRight ? -90 : 90;
        gsap.to(indicatorsRef.current?.children, {
          rotate: indicatorRotation,
          duration: 0.95,
          ease: "hop2",
          force3D: true,
        });

        return true;
      };

      const goToSlide = (nextIndex, direction) => {
        if (nextIndex === currentIndex || isAnimating) return false;

        const prevIndex = currentIndex;
        currentIndex = nextIndex;

        const ok = animateSlide(direction);
        if (!ok) {
          currentIndex = prevIndex;
          return false;
        }

        updateTextAndCounter(prevIndex);
        updateActivePreview();
        startProgressBar();
        return true;
      };

      const clearAutoSlide = () => {
        if (!autoSlideId) return;
        window.clearInterval(autoSlideId);
        autoSlideId = 0;
      };

      const startAutoSlide = () => {
        clearAutoSlide();
        autoSlideId = window.setInterval(() => {
          const nextIndex = currentIndex === TOTAL_SLIDES - 1 ? 0 : currentIndex + 1;
          goToSlide(nextIndex, "right");
        }, AUTO_SLIDE_MS);
      };

      const handleClick = (event) => {
        const clickTarget = event.target instanceof Element ? event.target : null;
        if (!clickTarget) return;

        if (clickTarget.closest(".slider-preview")) {
          const clickedPreview = clickTarget.closest(".preview");
          if (!clickedPreview) return;

          const clickedIndex = previewsRef.current.indexOf(clickedPreview);
          if (clickedIndex === -1) return;

          const direction = clickedIndex < currentIndex ? "left" : "right";
          if (goToSlide(clickedIndex, direction)) {
            clearAutoSlide();
            startAutoSlide();
          }
          return;
        }

        const sliderWidth = sliderRef.current?.clientWidth ?? 0;
        const clickPosition = event.clientX;

        if (clickPosition < sliderWidth / 2 && currentIndex !== 0) {
          if (goToSlide(currentIndex - 1, "left")) {
            clearAutoSlide();
            startAutoSlide();
          }
        } else if (clickPosition > sliderWidth / 2 && currentIndex !== TOTAL_SLIDES - 1) {
          if (goToSlide(currentIndex + 1, "right")) {
            clearAutoSlide();
            startAutoSlide();
          }
        }
      };

      // ── Entrance ────────────────────────────────────────────────
      placeOrbitThumbs();

      const intro = gsap.timeline({ defaults: { force3D: true } });

      if (blobRef.current) {
        intro.fromTo(
          blobRef.current,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.4, ease: "power3.out" },
          0
        );
      }

      const initialPlate = sliderImagesRef.current?.querySelector(".slide-visual");
      if (initialPlate) {
        intro.fromTo(
          initialPlate,
          { scale: 0.8, rotate: -20, opacity: 0 },
          { scale: 1, rotate: 0, opacity: 1, duration: 1.5, ease: "power3.out" },
          0.1
        );
      }

      const leafNodes = leavesRef.current.filter(Boolean);
      if (leafNodes.length) {
        intro.fromTo(
          leafNodes,
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out", stagger: 0.08 },
          0.5
        );
      }

      const orbitNodes = orbitThumbsRef.current.filter(Boolean);
      if (orbitNodes.length) {
        intro.from(orbitNodes, { opacity: 0, duration: 0.6, ease: "power2.out", stagger: 0.07 }, 0.7);
      }

      startLeafDrift();
      const orbitDrift = startOrbitDrift();

      const handleResize = () => placeOrbitThumbs();
      window.addEventListener("resize", handleResize);

      updateActivePreview();
      updateTextAndCounter();
      startProgressBar();
      startAutoSlide();

      sliderRef.current?.addEventListener("click", handleClick);

      return () => {
        sliderRef.current?.removeEventListener("click", handleClick);
        window.removeEventListener("resize", handleResize);
        clearAutoSlide();
        if (progressTween) progressTween.kill();
        if (orbitDrift) orbitDrift.kill();
      };
    },
    { scope: sliderRef, dependencies: [loaderComplete] }
  );

  return (
    <>
      {showLoader && <PageLoader onReady={handleLoaderReady} onComplete={handleLoaderDone} />}
      <div
        ref={sliderRef}
        className={`${styles.hero} relative w-full`}
        role="region"
        aria-label="Hero image carousel"
        aria-roledescription="carousel"
      >
        {/* Mint blob */}
        <div ref={blobRef} className={styles.blob} aria-hidden="true" />

        {/* Dashed orbit + travelling thumbnails */}
        <div className={styles.orbit} aria-hidden="true">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
            <circle ref={orbitPathRef} className={styles.orbitPath} cx="50" cy="50" r="92" />
          </svg>
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={styles.orbitThumb}
              ref={(element) => {
                orbitThumbsRef.current[index] = element;
              }}
            >
              <Image src={slide.plate} alt="" width={64} height={64} sizes="64px" />
            </div>
          ))}
        </div>

        {/* Plate stage */}
        <div ref={sliderImagesRef} className={styles.stage}>
          <div className={`${styles.plate} img`}>
            <Image
              src={SLIDES[0].plate}
              alt={SLIDES[0].alt}
              fill
              priority
              sizes="(max-width: 1023px) 72vw, 34vw"
              className={`${styles.plateImg} slide-visual`}
            />
          </div>
        </div>

        {/* Drifting leaves */}
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
          {LEAVES.map((leaf, index) => (
            <div
              key={index}
              className={`${styles.leaf} ${styles[leaf.depth]} ${
                index >= MOBILE_LEAF_COUNT ? "max-lg:hidden" : ""
              }`}
              style={{
                top: leaf.top,
                left: leaf.left,
                width: leaf.size,
                height: leaf.size,
                transform: `rotate(${leaf.rotate}deg)`,
              }}
              ref={(element) => {
                leavesRef.current[index] = element;
              }}
            >
              <LeafShape />
            </div>
          ))}
        </div>

        {/* Mobile title */}
        <div className="absolute left-1/2 top-1/2 z-20 h-40 w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden px-8 lg:hidden">
          <div ref={mobileTitleTrackRef} className="relative top-0 w-full will-change-transform">
            {SLIDES.map((slide) => (
              <div key={slide.id} className="flex h-40 flex-col items-center justify-center">
                <Link
                  href={WEBSITE_SHOP}
                  className={`${styles.mobileTitleLink} pointer-events-auto text-center text-[38px] font-medium leading-tight transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
                  onClick={(event) => event.stopPropagation()}
                >
                  {textSplit ? splitToChars(slide.title) : slide.title}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop headline */}
        <div className="absolute bottom-24 left-18 z-20 hidden h-[172px] w-[68%] overflow-hidden lg:block">
          <div ref={headlineTrackRef} className="relative top-0 will-change-transform">
            {SLIDES.map((slide) => (
              <Link
                key={slide.id}
                href={WEBSITE_SHOP}
                className={`${styles.headlineLink} pointer-events-auto flex h-[172px] items-end pb-2 text-[clamp(4.5rem,10vw,8.5rem)] leading-[1.02] font-semibold tracking-[-0.03em] transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
                onClick={(event) => event.stopPropagation()}
              >
                {textSplit ? splitToChars(slide.headline) : slide.headline}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop writeup */}
        <div className="absolute left-18 top-28 z-20 hidden h-[176px] w-[440px] overflow-hidden lg:block">
          <div ref={writeupTrackRef} className="relative top-0 will-change-transform">
            {SLIDES.map((slide) => (
              <Link
                key={slide.id}
                href={WEBSITE_SHOP}
                className="pointer-events-auto flex h-[176px] flex-col gap-3 rounded-sm transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={(event) => event.stopPropagation()}
              >
                <p className={`${styles.writeupTitle} writeup-title text-[44px] font-medium leading-[46px]`}>
                  {slide.title}
                </p>
                <p className={`${styles.writeupDesc} writeup-desc max-w-[380px] text-base font-medium leading-6`}>
                  {slide.writeup}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Counter */}
        <div
          className="absolute bottom-8 left-1/2 z-20 flex h-6 -translate-x-1/2 gap-2 overflow-hidden max-lg:bottom-40"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex-1">
            <div ref={counterRef} className="relative top-0 will-change-transform">
              {SLIDES.map((slide) => (
                <p key={slide.id} className={`${styles.counter} leading-5`}>
                  {slide.id}
                </p>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className={`${styles.counter} leading-5`}>&mdash;</p>
          </div>
          <div className="flex-1">
            <p className={`${styles.counter} leading-5`}>{TOTAL_SLIDES}</p>
          </div>
        </div>

        {/* Preview thumbnails with progress bars */}
        <div
          className="slider-preview absolute bottom-8 right-8 z-20 flex h-[64px] w-[34%] gap-2.5 max-lg:right-1/2 max-lg:h-[58px] max-lg:w-[92%] max-lg:translate-x-1/2 max-lg:gap-1.5"
          role="tablist"
          aria-label="Slide thumbnails"
        >
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`preview ${styles.preview} relative flex-1 cursor-pointer overflow-hidden after:absolute after:inset-0 after:transition-colors after:duration-300 after:content-[''] ${
                index === 0 ? "active" : ""
              }`}
              ref={(element) => {
                previewsRef.current[index] = element;
              }}
            >
              <Image
                src={slide.plate}
                alt={slide.alt}
                fill
                sizes="(max-width: 1024px) 24vw, 12vw"
                className={styles.previewImg}
              />
              <div
                ref={(element) => {
                  progressBarsRef.current[index] = element;
                }}
                className={`${styles.progressBar} absolute bottom-0 left-0 z-10 h-[3px] w-full origin-left scale-x-0`}
              />
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div
          ref={indicatorsRef}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex w-3/4 -translate-x-1/2 -translate-y-1/2 justify-between max-lg:w-[90%]"
        >
          <p className={`${styles.indicator} relative text-[40px] font-extralight will-change-transform`}>+</p>
          <p className={`${styles.indicator} relative text-[40px] font-extralight will-change-transform`}>+</p>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
