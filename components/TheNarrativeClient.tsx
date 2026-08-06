"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ElevatorArrow from "./ElevatorArrow";
import NarrativeVideoPlate from "./NarrativeVideoPlate";
import NarrativeMobile, {
  NarrativeBioMobile,
  NarrativeCtaMobile,
} from "./NarrativeMobile";
import { useIsMobile } from "./useIsMobile";
import {
  TITLES,
  KICKER,
  CENTER_LINE,
  BIO_LABEL,
  BIO_KICKER,
  BIO_NAME,
  BIO_ROLE,
  BIO_PARAGRAPHS,
  clamp01,
  type Title,
} from "./narrative.data";

/* ------------------------------------------------------------------
   THE NARRATIVE — FLOOR 04
   SECTION 01: HERO
   SECTION 02: THE NARRATIVE — PINNED SCROLL STAGE

   Scroll choreography (driven by one progress value p, 0 → 1):
     p 0.00 → 0.36   "SECT.2 THE NARRATIVE" kerning widens; overlay → 57%.
     p 0.32 → 0.68   four titles wipe in (right → left), staggered,
     p 0.66 → 0.72   then the four body boxes fade in.
     p 0.72 → 1.00   DWELL — everything sits in its final state, pinned,
                     so users can linger and hover the titles before release.

   Hover (once boxes are in):
     - hovered title stays clean; the other three get struck + dimmed
     - background crossfades to the hovered title's image
     - that title's body box lifts to full opacity; the rest stay faint
------------------------------------------------------------------- */

/* map v from [a,b] onto [0,1], clamped */

/* fixed positioning + text alignment per corner */
const CORNER_POS: Record<Title["corner"], string> = {
  tl: "top-[10%] left-8 lg:left-16 text-left items-start",
  bl: "top-[calc(10%+15rem)] left-8 lg:left-16 text-left items-start",
  tr: "top-[10%] right-8 lg:right-16 text-right items-end",
  br: "top-[calc(10%+15rem)] right-8 lg:right-16 text-right items-end",
};
export default function TheNarrative() {
  const isMobile = useIsMobile(1024); // swap the pinned Principles stage for the mobile version below lg
  const stageRef = useRef<HTMLDivElement | null>(null);
  const outroRef = useRef<HTMLDivElement | null>(null);
  const [p, setP] = useState(0);
  const [q, setQ] = useState(0); // bio→CTA outro stage progress
  const [hovered, setHovered] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showOutroHint, setShowOutroHint] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);
  const [ctaPos, setCtaPos] = useState({ x: 0, y: 0 });
  const [elevIn, setElevIn] = useState(false); // hero elevator fade-in on entry
  const [kernLow, setKernLow] = useState(0.06); // kern-start bound; rises on scroll-up

  useEffect(() => {
    const t = setTimeout(() => setElevIn(true), 1100);
    return () => clearTimeout(t);
  }, []);

  /* Warm the below-the-fold bio/CTA/hover images so a first scroll-in never waits
     on a decode — that decode-on-reveal was the entry flash. Fully decode (not
     just fetch) so the bitmap is ready to paint. Cheap now they're small AVIFs. */
  useEffect(() => {
    // Read the breakpoint directly rather than via useIsMobile: that hook
    // starts false and corrects on mount, which would run this twice and warm
    // BOTH image sets on mobile. Keep 1023 in step with useIsMobile's 1024.
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    const srcs = [
      "/section-3-bg.avif", // bio plate — the flash culprit
      "/ZP-1.avif", // founder cutout
      "/cta-bg.avif",
      // Only the variant this viewport actually paints — derived from TITLES so
      // it can't drift out of step with the plates the stages render.
      ...TITLES.map((t) => (mobile ? (t.mobileImage ?? t.image) : t.image)),
    ];
    const imgs = srcs.map((src) => {
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => {}); // ignore aborts/unsupported
      return img;
    });
    return () => imgs.forEach((img) => (img.src = ""));
  }, []);

  /* Scroll-driven choreography. Smoothing now comes from the GLOBAL Lenis
     (SmoothScroll, floor routes desktop-only), which eases the real scroll
     position — so this loop just reads that (already-smoothed) position each
     frame and tracks it 1:1. A local lerp on top would double-smooth (laggy);
     the kerning has no CSS transition so it rides Lenis without snapping. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Track scroll directly — Lenis owns the smoothing globally now.
    const easeP = 1;

    let renderedP = 0;
    let raf = 0;
    // Direction-aware kern-start bound: short lead-in going down (0.06), but a
    // longer hold going up (0.18) so the line finishes un-kerning with a buffer
    // before the hero arrives. Smoothed (renderedLow) so reversing never snaps.
    let targetLow = 0.06;
    let renderedLow = 0.06;
    let prevRP = 0;

    const targets = () => {
      const rect = stage.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const tp = scrollable > 0 ? clamp01(-rect.top, 0, scrollable) : 0;

      let tq = 0;
      const outro = outroRef.current;
      if (outro) {
        const oRect = outro.getBoundingClientRect();
        const oScroll = oRect.height - window.innerHeight;
        tq = oScroll > 0 ? clamp01(-oRect.top, 0, oScroll) : 0;
      }
      return [tp, tq] as const;
    };

    const frame = () => {
      const [tp, tq] = targets();
      renderedP += (tp - renderedP) * easeP;
      // settle exactly when close enough (kills endless sub-pixel updates)
      if (Math.abs(tp - renderedP) < 0.0002) renderedP = tp;

      // pick the low bound from scroll direction (idle keeps the current one),
      // then ease toward it so a mid-scroll reversal glides instead of jumping
      if (renderedP < prevRP - 0.00003) targetLow = 0.18; // scrolling up
      else if (renderedP > prevRP + 0.00003) targetLow = 0.06; // scrolling down
      renderedLow += (targetLow - renderedLow) * 0.05;
      prevRP = renderedP;

      setP(renderedP);
      setQ(tq); // direct — React bails if unchanged, so no idle churn on the bio
      setKernLow(renderedLow);
      raf = requestAnimationFrame(frame);
    };

    // seed at the true position so a mid-page reload doesn't animate from 0
    const [seedP, seedQ] = targets();
    renderedP = seedP;
    prevRP = seedP;
    setP(seedP);
    setQ(seedQ);
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---- bio name entrance: fire once when the section enters view ---- */
  const bioRef = useRef<HTMLElement | null>(null);
  const [bioIn, setBioIn] = useState(false);

  useEffect(() => {
    const node = bioRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Hysteresis: latch ON at 0.9, only reset once mostly out of view (≤0.1).
        // A single 0.9 threshold chattered under Lenis's smooth settle (ratio
        // hovering around 0.9), replaying the entrance — a flash.
        const r = entries[0].intersectionRatio;
        if (r >= 0.9) setBioIn(true);
        else if (r <= 0.1) setBioIn(false);
      },
      { threshold: [0.1, 0.9] },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Clear any stuck hover when the titles aren't on-stage — scrolling away while
     the cursor sits over a title never fires onMouseLeave, so the image + body
     box would otherwise stay lit when you leave and return. */
  const titlesPresent = p >= 0.66 && p < 0.99;
  useEffect(() => {
    if (!titlesPresent) setHovered(null);
  }, [titlesPresent]);

  const inDwell = p >= 0.72 && p < 0.99;

  /* ── SELF-DEMONSTRATING HOVER ───────────────────────────────────────────
     Nothing signals the titles are interactive, so a reader who never thinks
     to hover simply misses all four bodies. Instead of instructing them, the
     stage performs the interaction once: title 01 lights up on its own, holds,
     and releases.

     It plays the REAL hover state (same `hovered` value a cursor sets), so
     there is no second code path to keep in sync — and no separate "demo look"
     that could drift from the actual behaviour.

     Timing is dictated by the existing choreography, not chosen: the image
     takes 1500ms and the body box is deliberately delayed 1100ms behind it, so
     the reveal only completes at ~1800ms. Anything shorter shows a
     half-crossfaded plate and no copy at all — a glitch, not an invitation.
     Hence land (1.8s) → hold (2.2s) → release.

     Fires once per visit. A real hover at any point cancels it and stops it
     ever running: someone who already understands must never be interrupted. */
  const [demoIndex, setDemoIndex] = useState<number | null>(null);
  const demoSpentRef = useRef(false);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Called from the titles' own hover handler rather than an effect watching
     `hovered` — the cursor arriving IS the cancellation, so handling it at the
     source keeps cause and effect together (and avoids a cascading render). */
  const retireDemo = () => {
    demoSpentRef.current = true;
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    setDemoIndex(null);
  };

  useEffect(() => {
    if (!inDwell || demoSpentRef.current) return;
    // Let the body boxes finish their own entrance (p 0.66 → 0.72) before
    // taking the stage, so the two reveals don't overlap.
    const start = setTimeout(() => {
      if (demoSpentRef.current) return;
      demoSpentRef.current = true; // spent on play, so it can't repeat
      setDemoIndex(0);
      // 1800ms to land + 2200ms to read.
      const end = setTimeout(() => setDemoIndex(null), 4000);
      demoTimers.current.push(end);
    }, 800);
    demoTimers.current.push(start);
    return () => {
      // Scrolling out mid-demo kills the timer that would have ended it, so
      // reset here too — otherwise demoIndex sticks and the demo re-appears on
      // the way back. (Cancelled during the 800ms lead-in it stays unspent, so
      // a reader who scrolls out and returns still gets it.)
      demoTimers.current.forEach(clearTimeout);
      demoTimers.current = [];
      setDemoIndex(null);
    };
  }, [inDwell]);

  /* A cursor always wins over the demo, and scrolling the titles off-stage
     drops it — gated here rather than in an effect so there's no state to keep
     in sync. Everything downstream reads this, so the demo is indistinguishable
     from a real hover. */
  const activeTitle = hovered ?? (titlesPresent ? demoIndex : null);

  /* Scroll hint appears on a dwell TIMER (not scroll) once titles have landed;
     resets if the user scrolls back out of the dwell zone. Waits out the demo
     so the two never share the screen. */
  useEffect(() => {
    if (!inDwell) {
      setShowHint(false);
      return;
    }
    const t = setTimeout(() => setShowHint(true), demoIndex !== null ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [inDwell, demoIndex]);

  /* Bio→CTA outro: while the bio is pinned in its dwell, a timer shows a chevron;
     it hides once the CTA starts rising. */
  const outroDwell = q >= 0.08 && q < 0.45;
  useEffect(() => {
    if (!outroDwell) {
      setShowOutroHint(false);
      return;
    }
    const t = setTimeout(() => setShowOutroHint(true), 2500);
    return () => clearTimeout(t);
  }, [outroDwell]);

  /* ---- derived animation values ---- */
  const kernPhase = clamp01(p, kernLow, 0.36); // kernLow: short down, longer up-hold
  const overlayOpacity = kernPhase * 0.57;
  const titlesPhase = clamp01(p, 0.32, 0.68);
  const boxesPhase = clamp01(p, 0.66, 0.72); // boxes fade in after titles land
  // p 0.72 → 1.00 is dwell — the section stays pinned in its final state.

  /* CTA rises over the pinned bio after a dwell; heavy ease-out arrival.
     q 0 → 0.5 dwell on bio, q 0.5 → 0.9 the CTA slides up, then rests. */
  const ctaRaw = clamp01(q, 0.45, 0.85);
  const ctaRise = 1 - Math.pow(1 - ctaRaw, 3); // easeOutCubic
  const ctaTranslate = (1 - ctaRise) * 100; // %: 100 (below fold) → 0 (rested)
  // CTA content reveals after the bar has largely rested
  const ctaLineReveal = clamp01(ctaRise, 0.91, 1.0); // line draws after

  return (
    <main className="relative bg-black">
      {/* ===== SECTION 01: HERO ===== */}
      <section className="relative isolate w-full h-screen overflow-hidden bg-black">
        {/* Desktop bg ≥1024px, portrait mobile bg below — only the match loads */}
        <picture>
          <source srcSet="/section-1-bg.avif" media="(min-width: 1024px)" />
          <img
            src="/section-1-bg-mobile.avif"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </picture>
        {/* Grain video overlay — masked to fade out toward the bottom (grain only up top).
            The mask also keeps this off the hardware-overlay path, which is why this
            video never caused the whole-window flash — see NarrativeVideoPlate.

            DESKTOP ONLY, and not merely hidden: mobile promotes the video to its
            own compositing layer, which breaks the backdrop the <h1> below needs
            for mix-blend-difference — the headline rendered as flat white instead
            of inverting. Guarded in JS so the element (and its request) never
            exists on mobile; `hidden` alone would still create the layer. The
            grain is barely perceptible at phone size, so nothing is lost. */}
        {!isMobile && (
          <video
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 0%, black 15%, transparent 60%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 15%, transparent 60%)",
            }}
          >
            <source
              src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
              type="video/mp4"
            />
          </video>
        )}
        {/* Top scrim. Lighter below lg: the grain video used to sit over this on
            desktop and lifted the top, so without it mobile read too dark.
            Tune the mobile value only — `lg:` keeps desktop exactly as it was. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 lg:from-black/65 via-black/0 to-transparent pointer-events-none" />

        {/* ELEVATOR DOWN — faint top-left accent. Descends on hover; on touch
            there is no hover, so `auto` runs the same motion on a timer. */}
        <Link
          href="/projectarchive"
          aria-label="Project Archive"
          className={`group absolute top-[47vh] left-[2.5vw] z-20 w-16 lg:w-23 ${elevIn ? "opacity-100" : "opacity-0"} transition-opacity duration-800 cursor-pointer invert`}
        >
          <ElevatorArrow
            src="/elevator-down.png"
            dir="down"
            className="w-full"
            glow={false}
            auto={isMobile}
          />
        </Link>

        <div className="absolute bottom-[4vh] left-0 right-0 px-[2.5vw]">
          <div className="flex w-full items-center gap-[1vw] font-brand-secondary-heavy text-[10px] lg:text-[11px] uppercase tracking-[0.60em] text-black mb-[4vh]">
            <span className="shrink-0">JUDAION</span>
            <span aria-hidden="true" className="flex-1 h-[1px] bg-black/50" />
            <span className="shrink-0">Studios</span>
          </div>
          <div
            aria-label={KICKER}
            className="flex w-full justify-between font-brand-cn uppercase text-black/80 text-[clamp(11px,3.2vw,13px)] lg:text-[2.6vw] leading-none mb-[2vh] select-none"
          >
            {KICKER.split("").map((char, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={char === " " ? "w-[1.2vw]" : ""}
              >
                {char === " " ? "" : char}
              </span>
            ))}
          </div>
          <h1 className="relative font-brand-other uppercase text-white text-[15vw] leading-[0.82] tracking-[0em] whitespace-nowrap mix-blend-difference select-none">
            I Rebuilt Myself
          </h1>
        </div>
      </section>

      {/* ===== SECTION 02: PINNED SCROLL STAGE ===== */}
      {/* Desktop only — the pinned rAF stage doesn't work at mobile widths;
          below lg we swap in the scroll-activated NarrativeMobile version.
          (Guarded in JS, not CSS, so the desktop scroll loop never mounts on
          mobile — the loop's `if (!stage) return` no-ops when unmounted.) */}
      {isMobile ? (
        <NarrativeMobile />
      ) : (
        <div ref={stageRef} className="relative w-full h-[420vh] bg-black">
        <div className="sticky top-0 h-screen w-full overflow-hidden isolate">
          {/* BASE PLATE — video over its own poster still; the still carries
              the plate if the video can't play (see NarrativeVideoPlate). */}
          <NarrativeVideoPlate />

          {/* SCROLL-DRIVEN BLACK OVERLAY → 57% — sits BEHIND the hover images
              so darkening the base plate never lightens on hover, and a
              hovered image (on top) shows at full brightness. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black pointer-events-none"
            style={{
              opacity: overlayOpacity,
              transition: "opacity 600ms ease-out",
            }}
          />

          {/* HOVER IMAGE LAYER — one plate per title, crossfaded */}
          {TITLES.map((t, i) => (
            <img
              key={t.index}
              src={t.image}
              alt=""
              aria-hidden="true"
              decoding="async"
              loading="eager"
              fetchPriority="low"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none will-change-[opacity,clip-path,transform]"
              style={{
                filter: "brightness(0.70)", // soften the plates so they aren't harsh
                opacity: activeTitle === i ? 1 : 0,
                transform: activeTitle === i ? "scale(1.03)" : "scale(1)", // very subtle drift-in, scaling up so no edge shows
                clipPath:
                  activeTitle === i ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                WebkitClipPath:
                  activeTitle === i ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                transition:
                  "opacity 1500ms ease-out, transform 1700ms cubic-bezier(0.16, 1, 0.3, 1), clip-path 1500ms cubic-bezier(0.16, 1, 0.3, 1), -webkit-clip-path 1700ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          ))}

          {/* CENTERED KERNING LINE — sits BELOW the boxes (z-10) */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center px-[3vw] pointer-events-none"
            aria-label={CENTER_LINE}
          >
            <span
              className="font-brand-thin-cn uppercase text-white text-[clamp(11px,1.5vw,20px)] whitespace-nowrap"
              style={{
                letterSpacing: `${kernPhase * 4}em`,
                paddingLeft: `${kernPhase * 4}em`,
                opacity: 1 - clamp01(p, 0.52, 0.66) * 0.80, // ease down to ~0.15, not fully out
                // No CSS transition — the rAF lerp on `p` already smooths this
                // every frame; a transition on top re-creates the snap.
              }}
            >
              {CENTER_LINE}
            </span>
          </div>

          {/* BODY BOXES — all anchored top-left (01's spot); only the hovered
              title's box shows. z-20, above the Sect line. */}
          {TITLES.map((t, i) => {
            const isActive = activeTitle === i;
            return (
              <div
                key={t.index}
                className={`absolute z-20 flex flex-col overflow-hidden pointer-events-none top-[10%] ${
                  t.side === "left"
                    ? "left-8 lg:left-16 text-left items-start"
                    : "right-8 lg:right-16 text-right items-end"
                }`}
                style={{
                  width: t.w,
                  height: t.h,
                  opacity: isActive ? 1 : 0,
                  transition: isActive
                    ? "opacity 700ms ease-out 1100ms" // wait for the image to land, then fade in
                    : "opacity 300ms ease-out", // leave promptly, no delay
                }}
              >
                <span className="font-brand-cn text-[10px] lg:text-[11px] tracking-[0.2em] text-white/30 mb-2">
                  {t.index}
                </span>
                <p className="font-brand-secondary-thin text-justify text-white/75 text-[9.5px] lg:text-[13px] leading-[1.6] tracking-[0.07em]">
                  {t.body}
                </p>
              </div>
            );
          })}

          {/* FOUR TITLES — wipe in right → left, staggered */}
          <div className="absolute inset-x-0 bottom-[6vh] z-30 px-8 lg:px-16 flex justify-between items-end gap-8 pointer-events-none">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-1 lg:gap-2 items-start">
              {TITLES.filter((t) => t.side === "left").map((t, i) => {
                const idx = TITLES.indexOf(t);
                return (
                  <TitleLine
                    key={t.index}
                    title={t}
                    reveal={clamp01(titlesPhase, i * 0.2, i * 0.2 + 0.62)}
                    struck={activeTitle !== null && activeTitle !== idx}
                    onHover={() => {
                      retireDemo();
                      setHovered(idx);
                    }}
                    onLeave={() => setHovered(null)}
                  />
                );
              })}
            </div>
            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-1 lg:gap-2 items-end text-right">
              {TITLES.filter((t) => t.side === "right").map((t, i) => {
                const idx = TITLES.indexOf(t);
                return (
                  <TitleLine
                    key={t.index}
                    title={t}
                    reveal={clamp01(
                      titlesPhase,
                      i * 0.2 + 0.09,
                      i * 0.2 + 0.71,
                    )}
                    struck={activeTitle !== null && activeTitle !== idx}
                    onHover={() => {
                      retireDemo();
                      setHovered(idx);
                    }}
                    onLeave={() => setHovered(null)}
                    align="right"
                  />
                );
              })}
            </div>
          </div>

          {/* SCROLL HINT — appears on a dwell timer so lingering users know to keep going */}
          <div
            aria-hidden="true"
            className="absolute bottom-[2vh] left-1/2 -translate-x-1/2 z-40 pointer-events-none"
            style={{
              opacity: showHint ? 1 : 0,
              transition: "opacity 900ms ease-out",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="narrative-chevron-drift"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        </div>
      )}
      {/* ===== SECTION 03: BIO ===== */}
      {/* Drop in after Section 2's closing </div>, before </main>.
         Normal document flow — follows the pinned stage.

         Stacking (bottom → top):
           plate → PARKER (mix-blend-difference) → cutout PNG → text/UI
         The name spans full width like the hero and blends against the
         plate; the cutout sits IN FRONT so you overlap the letters. */}
      {/* ===== OUTRO STAGE: bio pinned as a backdrop, CTA rises over it ===== */}
      <div ref={outroRef} className="relative w-full h-[250vh] bg-black">
        <section
          ref={bioRef}
          className="sticky top-0 isolate w-full h-screen overflow-hidden bg-black"
        >
          {/* SCALE WRAPPER — the whole bio composition recedes (scales down)
              as the CTA rises. PARKER + cutout live inside together, so their
              mix-blend stays intact. Overlay/hint/CTA are OUTSIDE this. */}
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${1 - ctaRise * 0.07})`,
              transformOrigin: "center center",
              // No will-change: it eagerly promoted this mix-blend layer, which
              // painted white for one frame on first composite (the whole-section
              // flash on first scroll-in). The scale still promotes on demand.
            }}
          >
            {/* Below lg the same composition is stacked instead of overlapped;
                everything outside this wrapper (hint, overlay, CTA) is shared. */}
            {isMobile ? (
              <NarrativeBioMobile bioIn={bioIn} />
            ) : (
            <>
            {/* TEXTURED BACKGROUND PLATE */}
            <img
              src="/section-3-bg.avif"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/25 pointer-events-none" />

            {/* SECTION LABEL RULE — full-width line behind the cutout, with the
            section tag at the right. Sits above the plate, below the cutout. */}
            <div className="absolute top-[11%] left-0 right-0 z-[5] flex items-center gap-3 px-[3vw] pointer-events-none">
              <span className="h-[1px] flex-1 bg-white/20" />
              <span className="font-brand-thin-cn uppercase text-white text-[10px] lg:text-[11px] tracking-[0.58em] whitespace-nowrap">
                {BIO_LABEL}
              </span>
            </div>

            {/* ZION kicker — rises in on entry AND wipes via clip-path. Hidden
            state keeps a 1px sliver (not opacity:0) so the mix-blend layer never
            goes cold — opacity would both cold-start the layer AND break the
            difference blend mid-fade (opacity ≠ 1 makes a stacking context). */}
            <div
              className="absolute bottom-[16vw] lg:bottom-[17vw] left-0 right-0 z-30 px-[2vw] pointer-events-none mix-blend-difference"
              style={{
                transform: bioIn ? "translateY(0)" : "translateY(1.2em)",
                clipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
                WebkitClipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
                transition:
                  "transform 1200ms cubic-bezier(0.16,1,0.3,1), clip-path 1100ms cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div className="flex items-center pl-[0.7em] pr-[0vw]">
                <span className="font-brand-cn uppercase text-white/90 text-[3.4vw] lg:text-[2.7vw] leading-none tracking-[1em] whitespace-nowrap">
                  {BIO_KICKER}
                </span>
                <span className="h-[1.5px] flex-1 bg-white/50" />
              </div>
            </div>

            {/* CUTOUT — z-10, static. Stays put so PARKER's blend against it holds. */}
            <img
              src="/ZP-1.avif"
              alt="Zion Parker"
              className="absolute bottom-0 left-[2%] lg:left-[5%] z-10 h-[94%] lg:h-[98%] w-auto object-contain object-bottom pointer-events-none select-none"
            />

            {/* PARKER — z-20, direct child of the section so it blends against
            the cutout + plate below it. Wipes UP via clip-path (a transform
            would create a stacking context and break the blend).
            Hidden state keeps a 1px sliver (not full inset(100%)) so the
            mix-blend layer never goes cold — a cold first-composite on reveal
            was the entry flash. The sliver is imperceptible on a 20vw wordmark. */}
            <h2
              className="absolute bottom-2 left-0 right-0 z-20 px-[2vw] font-brand-other uppercase text-white text-[19vw] lg:text-[20vw] leading-[0.78] tracking-[0.4em] whitespace-nowrap mix-blend-difference pointer-events-none"
              style={{
                clipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
                WebkitClipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
                transition: "clip-path 1500ms cubic-bezier(0.16,1,0.3,1) 150ms",
              }}
            >
              {BIO_NAME}
            </h2>

            {/* ===== TITLE — own container, kerned wide ===== */}
            <div className="absolute top-[20%] left-[41%] right-[3%] z-30 text-left pointer-events-none">
              <h3
                className="font-brand-secondary-heavy italic uppercase text-white text-[6vw] lg:text-[2.4vw] leading-[0.95] tracking-[0.5em] whitespace-nowrap"
                style={{
                  opacity: bioIn ? 1 : 0,
                  transform: bioIn ? "translateY(0)" : "translateY(12px)",
                  transition:
                    "opacity 800ms ease-out 1200ms, transform 800ms cubic-bezier(0.16,1,0.3,1) 1200ms",
                }}
              >
                {BIO_ROLE}
              </h3>
            </div>

            {/* ===== BODY — own container, independent position ===== */}
            <div
              className="absolute top-[29%] left-[41%] right-[3%] z-30 text-justify pointer-events-none"
              style={{
                opacity: bioIn ? 1 : 0,
                transform: bioIn ? "translateY(0)" : "translateY(12px)",
                transition:
                  "opacity 800ms ease-out 1500ms, transform 800ms cubic-bezier(0.16,1,0.3,1) 1500ms",
              }}
            >
              <div className="flex flex-col gap-4 lg:gap-5 max-w-[122ch]">
                {BIO_PARAGRAPHS.map((para, i) => (
                  <p
                    key={i}
                    className="font-brand-secondary-thin text-white/70 text-[10px] lg:text-[15px] leading-[1.55] tracking-[0.04em] text-justify"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
            </>
            )}
            {/* END SCALE WRAPPER */}
          </div>

          {/* SCROLL HINT — dwell timer, cues the CTA rise below. Desktop only. */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute bottom-[3vh] left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            style={{
              opacity: showOutroHint ? 1 : 0,
              transition: "opacity 900ms ease-out",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="narrative-chevron-drift"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* DEPTH OVERLAY — bio recedes into shadow as the CTA rises over it */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[35] bg-black pointer-events-none"
            style={{ opacity: ctaRise * 0.6 }}
          />
          {/* ===== CTA — rises up over the pinned bio after the dwell =====
           Whole bar is one link to /contact. Arrow is code-drawn so it
           always spans the gap between the CTA text and the elevator. */}
          <div
            className="absolute inset-x-0 bottom-0 z-40 will-change-transform"
            style={{
              transform: `translateY(${ctaTranslate}%)`,
              boxShadow: `0 -${40 * ctaRise}px ${60 * ctaRise}px rgba(0,0,0,${0.7 * ctaRise})`,
            }}
          >
            <Link
              href="/contact"
              aria-label="Build your authority — contact the studio"
              className="group relative block w-full overflow-hidden"
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              onMouseMove={(e) => setCtaPos({ x: e.clientX, y: e.clientY })}
            >
              {/* ORANGE BACKGROUND PLATE */}
              <img
                src="/cta-bg.avif"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* CONTENT — one row on desktop; below lg the four assets stack
                  into two rows so nothing gets cut. Rise/plate/link unchanged. */}
              {isMobile ? (
                <NarrativeCtaMobile lineReveal={ctaLineReveal} />
              ) : (
              <div className="relative z-10 flex items-center gap-6 lg:gap-11 px-6 lg:px-10 py-5 lg:py-4">
                {/* MAIL ICON */}
                <img
                  src="/mail-icon.png"
                  alt=""
                  aria-hidden="true"
                  className="h-6 lg:h-10 w-auto shrink-0 object-contain"
                />

                {/* CTA TEXT — Khand, YOUR bold */}
                <span
                  className="font-brand-other uppercase text-black text-[5vw] lg:text-[3vw] leading-none tracking-[0.27em] whitespace-nowrap shrink-0"
                >
                  <span className="font-brand-other-medium">Build </span>
                  <span className="font-bold">Your </span>
                  <span className="font-brand-other-medium">Authority</span>
                </span>

                {/* ARROW — code-drawn line + head, flexes to fill the gap */}
                {/* LINE — plain, spans the gap */}
                {/* LINE — draws left→right after the text, guiding the eye to the elevator */}
                <span className="relative flex-1 min-w-[3rem] h-[2px] flex items-center">
                  <span
                    className="block h-[2.5px] bg-black origin-left"
                    style={{
                      width: `${ctaLineReveal * 100}%`,
                      transition: "width 500ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </span>

                {/* ELEVATOR — rises on hover, like ascending a floor */}
                <span className="relative shrink-0 h-28 lg:h-28 overflow-hidden flex items-end">
                  <img
                    src="/cta-elevator.png"
                    alt=""
                    aria-hidden="true"
                    className="h-28 w-auto object-contain transition-transform duration-600 ease-out group-hover:-translate-y-[120%]"
                  />
                  <img
                    src="/cta-elevator.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute left-0 bottom-0 h-28 w-auto object-contain translate-y-[120%] transition-transform duration-600 ease-out group-hover:translate-y-0"
                  />
                </span>
              </div>
              )}
            </Link>
          </div>
        </section>
      </div>

      {/* CURSOR TAG — desktop, shown on CTA hover; same format as the archive tag */}
      <div
        aria-hidden="true"
        className="hidden lg:flex fixed top-0 left-0 z-[80] translate-x-5 translate-y-5 pointer-events-none items-center gap-2 bg-black/80 border border-white/10 backdrop-blur-sm px-3 py-2"
        style={{
          left: ctaPos.x,
          top: ctaPos.y,
          opacity: ctaHover ? 1 : 0,
          transition: "opacity 500ms ease-out",
        }}
      >
        <img
          src="/right-click.png"
          alt=""
          className="w-5 h-auto filter brightness-110"
        />
        <span className="font-brand-cn text-[10px] uppercase tracking-[0.3em] text-white whitespace-nowrap">
          Next floor ~ 05 CONTACT
        </span>
      </div>
    </main>
  );
}

/* Single title. `reveal` 0→1 drives a right-to-left clip-path wipe.
   clip-path preserves mix-blend-difference (opacity would break it). */
function TitleLine({
  title,
  reveal,
  struck,
  onHover,
  onLeave,
  align = "left",
}: {
  title: Title;
  reveal: number;
  struck: boolean;
  onHover: () => void;
  onLeave: () => void;
  align?: "left" | "right";
}) {
  const clip = `inset(0 0 0 ${(1 - reveal) * 100}%)`;
  const interactive = reveal >= 1; // only hoverable once fully wiped in

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      tabIndex={interactive ? 0 : -1}
      className={`${
        interactive
          ? "pointer-events-auto cursor-pointer"
          : "pointer-events-none"
      } bg-transparent border-none appearance-none p-0 m-0 flex items-end gap-2 lg:gap-3 focus:outline-none`}
    >
      <span className="relative inline-block">
        <span
          className="block font-brand-other uppercase text-white leading-[1] tracking-[0.01em] text-[9vw] lg:text-[8.5vw] transition-opacity duration-300 ease-out"
          style={{
            clipPath: clip,
            WebkitClipPath: clip,
            opacity: struck ? 0.35 : 1,
          }}
        >
          {title.word}
        </span>
      </span>

      <span
        className="font-brand-cn text-[13px] lg:text-[16px] tracking-[0.15em] text-white/60 pb-[0.7em] shrink-0"
        style={{ opacity: reveal }}
      >
        {title.index}
      </span>
    </button>
  );
}
