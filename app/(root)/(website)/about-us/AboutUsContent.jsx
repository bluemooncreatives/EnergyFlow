"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import CustomEase from "gsap/CustomEase";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitType from "@/lib/SplitType/index";
import ShopAllButton from "@/components/Application/Website/ShopAllButton";
import ProductBox from "@/components/Application/Website/ProductBox";
import styles from "./about-us.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase, ScrollTrigger);
  if (!CustomEase.get("hop")) {
    CustomEase.create(
      "hop",
      "M0,0 C0.354,0 0.464,0.133 0.498,0.502 0.532,0.872 0.651,1 1,1"
    );
  }
}

// ── Scroll-controlled middle image ──────────────────────────────────
const SCROLL_IMAGE = "https://res.cloudinary.com/darrsi9y2/image/upload/v1781947528/qcbfdwai0pmvv97khlcw.jpg";

// Hero images (left thumb · center · right thumb)
const HERO_LEFT_IMAGE = "https://res.cloudinary.com/darrsi9y2/image/upload/v1783146225/DSCF5008_1_r7uftx.jpg";
const HERO_CENTER_IMAGE = "https://res.cloudinary.com/darrsi9y2/image/upload/v1783063101/WhatsApp_Image_2026-07-03_at_12.46.03_PM_uqte4t.jpg";
const HERO_RIGHT_IMAGE = "https://res.cloudinary.com/darrsi9y2/image/upload/v1781942605/x98cddrvoz82losytye7.jpg";

// Director portraits — kept separate from the hero images above so each can change independently.
const DIRECTOR_ONE_IMAGE = "https://res.cloudinary.com/darrsi9y2/image/upload/v1781945835/einxusjo1pubrtkgfddc.jpg";
const DIRECTOR_TWO_IMAGE = "https://res.cloudinary.com/darrsi9y2/image/upload/v1783063101/WhatsApp_Image_2026-07-03_at_12.46.03_PM_uqte4t.jpg";

/// Brand-story paragraphs shown beneath the statement.
const STORY = [
  "Energy Flow Supply Hub Pvt. Ltd. was registered on 19 November 2025 with a clear ambition: to build a trusted, recognisable name in healthy food and nutrition. Not another shelf of imported packets, but a brand people could rely on for the everyday staples that actually make a difference to how they eat.",
  "We began with our first ENERGYFLOW DRY FRUITS AND SUPER FOOD STORE, a single dedicated destination for premium dry fruits, nuts, seeds, super foods and wholesome pantry essentials. That store is the foundation of a wider retail and franchise network we are building across India.",
  "Our approach is simple. Source from growers and producers we can vouch for. Check every lot for grade, freshness and purity. Price it fairly. Pack it so it reaches you the way it left us. Whether you are buying a 200g pack of almonds or a hundred festive hampers, the standard does not change.",
];

// The directors behind the company. `reverse` flips the image/text order.
const PEOPLE = [
  {
    name: "Mr. Parveen Singla",
    role: "Director",
    image: DIRECTOR_ONE_IMAGE,
    bio: [
      "Parveen leads sourcing and operations at Energyflow, the part of the business that decides what actually earns a place on our shelf.",
      "Their focus is on building direct, lasting relationships with growers, mills and producers, so quality is controlled at origin rather than inspected at the end. It takes longer to set up and it is far more reliable once it runs.",
      "That same discipline shapes how we price: buy well, keep the chain short, and pass the difference on to the customer instead of spending it on middlemen.",
    ],
  },
  {
    name: "Mr. Ayush Singla",
    role: "Director",
    image: DIRECTOR_TWO_IMAGE,
    reverse: true,
    bio: [
      "Ayush drives retail, brand and expansion, turning a single store into a network that can grow without losing what makes it work.",
      "That means getting the fundamentals right first: a product range people genuinely want, a shopping experience that is easy online and in store, and a franchise model partners can run profitably.",
      "The goal is a professionally managed brand rather than a chain of lookalike outlets, one where every Energyflow store, wherever it opens, means the same thing to the person walking in.",
    ],
  },
];
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AboutUsContent = ({ products = [] }) => {
  const container = useRef(null);
  const headlineRef = useRef(null);
  const statementRef = useRef(null);
  const supportRef = useRef(null);
  const peopleRef = useRef(null);
  const scrollImgRef = useRef(null);
  const heroRef = useRef(null);
  const flankLeftRef = useRef(null);
  const flankRightRef = useRef(null);
  const centerImgRef = useRef(null);

  // ── SplitType line reveals + scroll-scrub image ──────────────────
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const splitInstances = [];
    const triggers = [];
    const tweens = [];
    let cancelled = false;

    // Wrap each split line in an overflow-hidden mask so the slide-up reads
    // as a clean "popup from bottom" reveal.
    const splitToMaskedLines = (root) => {
      const targets = root.querySelectorAll("h1, h2, h3, p");
      const spans = [];
      targets.forEach((el) => {
        const split = new SplitType(el, { types: "lines", tagName: "span" });
        splitInstances.push(split);
        split.lines.forEach((line) => {
          const wrapper = document.createElement("div");
          wrapper.className = styles.lineWrapper;
          line.parentNode.insertBefore(wrapper, line);
          wrapper.appendChild(line);
          spans.push(line);
        });
      });
      return spans;
    };

    const run = () => {
      if (cancelled || !container.current) return;

      // Statement + supporting copy: reveal when scrolled into view.
      [statementRef.current, supportRef.current].forEach((root) => {
        if (!root) return;
        const spans = splitToMaskedLines(root);
        if (reduced) {
          gsap.set(spans, { y: 0 });
          return;
        }
        gsap.set(spans, { y: "115%" });
        const t = ScrollTrigger.create({
          trigger: root,
          start: "top 82%",
          once: true,
          onEnter: () =>
            tweens.push(
              gsap.to(spans, {
                y: 0,
                stagger: 0.05,
                duration: 1.2,
                ease: "power4.out",
              })
            ),
        });
        triggers.push(t);
      });

      // Profile blocks: editorial reveal — the image clips up from the bottom
      // while its photo settles from a soft zoom, and the text lines stagger in.
      // Each photo also gets a gentle scroll-scrub Ken-Burns drift for depth.
      if (peopleRef.current) {
        const profiles = peopleRef.current.querySelectorAll(`.${styles.profile}`);
        profiles.forEach((profile) => {
          const imgWrap = profile.querySelector(`.${styles.profileImg}`);
          const photo = imgWrap?.querySelector("img");
          const textEls = profile.querySelectorAll(`.${styles.profileBody} > *`);

          if (reduced) {
            if (imgWrap) gsap.set(imgWrap, { clipPath: "none" });
            if (photo) gsap.set(photo, { scale: 1 });
            gsap.set(textEls, { autoAlpha: 1, y: 0 });
            return;
          }

          // Initial hidden states
          if (imgWrap)
            gsap.set(imgWrap, { clipPath: "inset(100% 0% 0% 0% round 6px)" });
          if (photo) gsap.set(photo, { scale: 1.3 });
          gsap.set(textEls, { autoAlpha: 0, y: 28 });

          const tl = gsap.timeline({
            scrollTrigger: { trigger: profile, start: "top 75%", once: true },
          });
          if (imgWrap)
            tl.to(
              imgWrap,
              {
                clipPath: "inset(0% 0% 0% 0% round 6px)",
                duration: 1.1,
                ease: "power4.out",
              },
              0
            );
          if (photo)
            tl.to(photo, { scale: 1.04, duration: 1.3, ease: "power3.out" }, 0);
          tl.to(
            textEls,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.08,
            },
            0.25
          );

          tweens.push(tl);
          if (tl.scrollTrigger) triggers.push(tl.scrollTrigger);

          // Ongoing Ken-Burns drift (scale 1.04 baseline gives headroom so no edge gap)
          if (photo) {
            const kb = gsap.fromTo(
              photo,
              { yPercent: -2.5 },
              {
                yPercent: 2.5,
                ease: "none",
                scrollTrigger: {
                  trigger: profile,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              }
            );
            tweens.push(kb);
            if (kb.scrollTrigger) triggers.push(kb.scrollTrigger);
          }
        });
      }

      // Hero images: layered parallax — each moves at a different rate as the
      // page scrolls, giving depth. Side thumbs drift the most, center least.
      if (heroRef.current && !reduced) {
        const parallax = [
          { el: flankLeftRef.current, y: -180 },
          { el: flankRightRef.current, y: -260 },
          { el: centerImgRef.current, y: -90 },
        ];
        parallax.forEach(({ el, y }) => {
          if (!el) return;
          const tween = gsap.fromTo(
            el,
            { yPercent: 0 },
            {
              y,
              ease: "none",
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            }
          );
          tweens.push(tween);
          if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
        });
      }

      // Middle image: scrub-scale on scroll (skipped under reduced motion).
      if (scrollImgRef.current && !reduced) {
        const tween = gsap.fromTo(
          scrollImgRef.current,
          { scale: 1 },
          {
            scale: 1.4,
            ease: "none",
            scrollTrigger: {
              trigger: scrollImgRef.current.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
        tweens.push(tween);
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      }

      // Recompute trigger positions once everything is laid out.
      setTimeout(() => ScrollTrigger.refresh(), 100);
    };

    // Split only after fonts are ready so line breaks (and therefore the
    // masks) match the rendered text instead of the fallback font.
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(run);

    // A late refresh covers async image loads shifting layout.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      tweens.forEach((t) => t.kill());
      triggers.forEach((t) => t.kill());
      splitInstances.forEach((s) => s.revert());
    };
  }, []);

  // ── Intro reveal: headline slides up after mount ─────────────────
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(headlineRef.current, { y: 0 });
        return;
      }
      gsap.to(headlineRef.current, {
        y: 0,
        delay: 0.35,
        duration: 1.3,
        ease: "hop",
      });
    },
    { scope: container }
  );

  return (
    <div className={styles.page} ref={container}>
      <div className={styles.inner}>
        {/* Hero: centered image, flanking thumbs, giant headline */}
        <div className={styles.hero} ref={heroRef}>
          <div className={`${styles.flankImage} ${styles.flankLeft}`} ref={flankLeftRef}>
            <Image
              src={HERO_LEFT_IMAGE}
              alt="Energyflow detail"
              fill
              sizes="130px"
              className="object-cover"
            />
          </div>
          <div className={`${styles.flankImage} ${styles.flankRight}`} ref={flankRightRef}>
            <Image
              src={HERO_RIGHT_IMAGE}
              alt="Energyflow detail"
              fill
              sizes="110px"
              className="object-cover"
            />
          </div>

          <div className={styles.centerImage} ref={centerImgRef}>
            <Image
              src={HERO_CENTER_IMAGE}
              alt="Inside the Energyflow dry fruits and super food store"
              fill
              priority
              sizes="(max-width: 900px) 70vw, 360px"
              className="object-cover"
            />
          </div>

          <div className={styles.headlineMask}>
            <h1 className={styles.headline} ref={headlineRef}>
              about us
            </h1>
          </div>
        </div>

        {/* Plus marker + caption */}
        <div className={styles.marker}>
          <span className={styles.plus}>+</span>
          <span className={styles.rule} />
          <span className={styles.caption}>
            Registered 19 Nov 2025 · first store open,
            <br />
            franchise network growing
          </span>
        </div>

        {/* Big statement + brand story */}
        <div className={styles.statementWrap}>
          <div ref={statementRef}>
            <h2 className={styles.statement}>
              Energyflow isn&apos;t just a store. It&apos;s a standard for what
              healthy food should be: honest, fresh, and worth trusting.
            </h2>
          </div>
          <div className={styles.story} ref={supportRef}>
            {STORY.map((para, i) => (
              <p className={styles.storyText} key={i}>
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width scroll-scaled middle image (Image 2) */}
      <div className={styles.scrollImageWrap}>
        <img
          ref={scrollImgRef}
          src={SCROLL_IMAGE}
          alt="Premium dry fruits, nuts and seeds from Energyflow"
          className={styles.scrollImage}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className={styles.inner}>
        {/* The family behind the brand */}
        <div className={styles.people} ref={peopleRef}>
          <div className={styles.peopleHead}>
            <span className={styles.peopleEyebrow}>LEADERSHIP</span>
            <h2 className={styles.peopleHeadline}>
              Built by people who care where every product comes from.
            </h2>
            <p className={styles.peopleIntro}>
              Energyflow is led by two directors who between them handle
              sourcing, quality, retail and expansion, with a shared focus on
              customer satisfaction, innovation and sustainable growth.
            </p>
          </div>

          {PEOPLE.map((person) => (
            <article
              key={person.name}
              className={`${styles.profile} ${
                person.reverse ? styles.profileReverse : ""
              }`}
            >
              <div className={styles.profileImg}>
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className={styles.profileBody}>
                <span className={styles.profileRole}>{person.role}</span>
                <h3 className={styles.profileName}>{person.name}</h3>
                {person.bio.map((para, i) => (
                  <p className={styles.profileBio} key={i}>
                    {para}
                  </p>
                ))}
              </div>
            </article>
          ))}

          {/* CTA — shared website button for consistent styling */}
          <div className={styles.ctaWrap}>
            <ShopAllButton
              label="Get in touch"
              href="/contact"
              colorScheme="dark-red"
              radius="sm"
            />
          </div>
        </div>
      </div>

      {/* ── Curated For You · You May Also Like (centered) ───────────── */}
      {products.length > 0 && (
        <div className={styles.inner}>
          <section className={styles.related}>
            <div className="mb-8 text-center lg:mb-10">
              <p className="text-[1rem] font-semibold uppercase text-[var(--dark-red)]/60">
                Curated For You
              </p>
              <h2 className="mt-1.5 font-neue text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium uppercase leading-[1.1] text-[var(--dark-red-2)]">
                You May Also Like
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {products.map((item) => (
                <ProductBox key={item._id} product={item} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AboutUsContent;
