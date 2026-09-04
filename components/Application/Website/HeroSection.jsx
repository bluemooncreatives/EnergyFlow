"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";

import PageLoader from "./PageLoader";
import { WEBSITE_SHOP } from "@/routes/WebsiteRoute";

gsap.registerPlugin(useGSAP, CustomEase);

const AUTO_SLIDE_MS = 6000;
const MAX_ACTIVE_SLIDES = 2;
const DESKTOP_HEADLINE_STEP = 172;
const MOBILE_TITLE_STEP = 160;
const LOADER_SESSION_KEY = "energyflow_loader_seen";

const SLIDES = [
  {
    id: 1,
    headline: "Mother's Love",
    title: "The Revival Ensemble",
    writeup: "Where tradition meets modern femininity - handcrafted women's wear stitched with a mother's devotion and an artist's eye.",
    src: "/assets/images/hero/01.webp",
    alt: "Energyflow festive ethnic wear collection for women",
  },
  {
    id: 2,
    headline: "Timeless",
    title: "Heritage in Every Thread",
    writeup: "Festive ethnic wear and everyday elegance, curated for the woman who carries grace in every step she takes.",
    src: "/assets/images/hero/02.webp",
    alt: "Energyflow timeless women's ethnic wear collection",
  },
  {
    id: 3,
    headline: "Elegance",
    title: "The Art of Refined Dressing",
    writeup: "Premium fabrics, thoughtful silhouettes, and meticulous detailing — women's fashion that speaks before you say a word.",
    src: "/assets/images/hero/03.webp",
    alt: "Energyflow elegant designer women's wear",
  },
  {
    id: 4,
    headline: "Eternelle",
    title: "Crafted to Be Cherished",
    writeup: "Timeless Indian women's fashion that transcends seasons — pieces made to accompany every celebration, big and small.",
    src: "/assets/images/hero/04.webp",
    alt: "Energyflow eternal women's fashion collection",
  },
];

const TOTAL_SLIDES = SLIDES.length;

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
          {"\u00A0"}
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

      let currentIndex = 0;
      let indicatorRotation = 0;
      let autoSlideId = 0;
      let isAnimating = false;
      let progressTween = null;

      const createSlideElement = (slide) => {
        const slideElement = document.createElement("div");
        slideElement.className = "img absolute inset-0 h-full w-full overflow-hidden";

        const textureImage = document.createElement("img");
        textureImage.src = slide.src;
        textureImage.alt = slide.alt;
        textureImage.loading = "eager";
        textureImage.decoding = "async";
        textureImage.className = "slide-visual h-full w-full object-cover will-change-transform";
        textureImage.style.transformOrigin = "center center";
        slideElement.appendChild(textureImage);

        return slideElement;
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

      const animateSlide = (direction) => {
        if (isAnimating) return false;

        const currentSlide = sliderImagesRef.current?.lastElementChild;
        if (!currentSlide || !sliderImagesRef.current) return false;

        isAnimating = true;

        const isRight = direction === "right";

        // Insert incoming BEHIND the outgoing so it's visible underneath
        const nextSlide = createSlideElement(SLIDES[currentIndex]);
        sliderImagesRef.current.insertBefore(nextSlide, currentSlide);

        const outgoingVisual = currentSlide.querySelector(".slide-visual") || currentSlide;
        const incomingVisual = nextSlide.querySelector(".slide-visual") || nextSlide;

        // Incoming starts zoomed in with directional offset — already fully visible underneath
        gsap.set(incomingVisual, {
          scale: 1.35,
          x: isRight ? -100 : 100,
          force3D: true,
        });

        const tl = gsap.timeline({
          defaults: { force3D: true },
          onComplete: () => {
            isAnimating = false;
          },
        });

        // Outgoing: fade out + zoom + directional drift
        tl.to(currentSlide, {
          opacity: 0,
          duration: 1.2,
          ease: "power2.inOut",
        })
        .to(
          outgoingVisual,
          {
            scale: 1.15,
            x: isRight ? 80 : -80,
            duration: 1.2,
            ease: "power2.inOut",
          },
          0
        );

        // Incoming: parallax settle — zoom + offset ease back to natural
        tl.to(
          incomingVisual,
          {
            scale: 1,
            x: 0,
            duration: 1.8,
            ease: "power3.out",
          },
          0
        );

        // Remove old slide after outgoing fully transparent
        tl.call(() => {
          currentSlide.remove();
          cleanupSlides();
        }, null, 1.2);

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

      // Initial entrance — cinematic zoom settle
      const initialImage = sliderImagesRef.current?.querySelector(".slide-visual");
      if (initialImage) {
        gsap.fromTo(
          initialImage,
          { scale: 1.25, opacity: 0.7, force3D: true },
          { scale: 1, opacity: 1, duration: 2.0, ease: "power3.out", force3D: true }
        );
      }

      updateActivePreview();
      updateTextAndCounter();
      startProgressBar();
      startAutoSlide();

      sliderRef.current?.addEventListener("click", handleClick);

      return () => {
        sliderRef.current?.removeEventListener("click", handleClick);
        clearAutoSlide();
        if (progressTween) progressTween.kill();
      };
    },
    { scope: sliderRef, dependencies: [loaderComplete] }
  );

  return (
    <>
      {showLoader && <PageLoader onReady={handleLoaderReady} onComplete={handleLoaderDone} />}
      <div ref={sliderRef} className="relative h-svh w-full overflow-hidden bg-black text-white" role="region" aria-label="Hero image carousel" aria-roledescription="carousel">
        <div ref={sliderImagesRef} className="absolute inset-0 h-full w-full">
          <div className="img absolute inset-0 h-full w-full">
            <Image
              src={SLIDES[0].src}
              alt={SLIDES[0].alt}
              fill
              priority
              sizes="100vw"
              className="slide-visual h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Mobile title */}
        <div className="absolute left-1/2 top-1/2 z-20 h-40 w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden px-8 lg:hidden">
          <div ref={mobileTitleTrackRef} className="relative top-0 w-full will-change-transform">
            {SLIDES.map((slide) => (
              <div key={slide.id} className="flex h-40 flex-col items-center justify-center">
                <Link
                  href={WEBSITE_SHOP}
                  className="pointer-events-auto text-center text-[38px] font-medium leading-tight text-white transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
                className="pointer-events-auto flex h-[172px] items-end pb-2 text-[clamp(4.5rem,10vw,8.5rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-white transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={(event) => event.stopPropagation()}
              >
                {textSplit ? splitToChars(slide.headline) : slide.headline}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop writeup */}
        <div className="absolute right-8 top-28 z-20 hidden h-[176px] w-[440px] overflow-hidden lg:block">
          <div ref={writeupTrackRef} className="relative top-0 will-change-transform">
            {SLIDES.map((slide) => (
              <Link
                key={slide.id}
                href={WEBSITE_SHOP}
                className="pointer-events-auto flex h-[176px] flex-col gap-3 rounded-sm transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dark-red)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="writeup-title text-[44px] font-medium leading-[46px] text-[var(--dark-red-2)]">{slide.title}</p>
                <p className="writeup-desc max-w-[380px] text-base font-medium leading-6 text-[var(--dark-red)]">{slide.writeup}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Counter */}
        <div className="absolute bottom-8 left-1/2 z-20 flex h-6 -translate-x-1/2 gap-2 overflow-hidden max-lg:bottom-40" aria-live="polite" aria-atomic="true">
          <div className="flex-1">
            <div ref={counterRef} className="relative top-0 will-change-transform">
              {SLIDES.map((slide) => (
                <p key={slide.id} className="leading-5 text-white">
                  {slide.id}
                </p>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="leading-5 text-white">&mdash;</p>
          </div>
          <div className="flex-1">
            <p className="leading-5 text-white">{TOTAL_SLIDES}</p>
          </div>
        </div>

        {/* Preview thumbnails with progress bars */}
        <div className="slider-preview absolute bottom-8 right-8 z-20 flex h-[64px] w-[34%] gap-2.5 max-lg:right-1/2 max-lg:h-[58px] max-lg:w-[92%] max-lg:translate-x-1/2 max-lg:gap-1.5" role="tablist" aria-label="Slide thumbnails">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`preview relative flex-1 cursor-pointer overflow-hidden after:absolute after:inset-0 after:bg-black/25 after:transition-colors after:duration-300 after:content-[''] [&.active]:after:bg-transparent ${
                index === 0 ? "active" : ""
              }`}
              ref={(element) => {
                previewsRef.current[index] = element;
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 1024px) 24vw, 12vw"
                className="h-full w-full object-cover"
              />
              <div
                ref={(element) => {
                  progressBarsRef.current[index] = element;
                }}
                className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-white z-10"
              />
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div
          ref={indicatorsRef}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex w-3/4 -translate-x-1/2 -translate-y-1/2 justify-between max-lg:w-[90%]"
        >
          <p className="relative text-[40px] font-extralight text-white will-change-transform">+</p>
          <p className="relative text-[40px] font-extralight text-white will-change-transform">+</p>
        </div>
      </div>
    </>
  );
};

export default HeroSection;

