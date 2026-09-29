"use client";

import { useEffect, useRef, useState } from "react";
import NarrativeVideoPlate from "./NarrativeVideoPlate";
import {
  TITLES,
  CENTER_LINE,
  BIO_LABEL,
  BIO_KICKER,
  BIO_NAME,
  BIO_ROLE,
  BIO_PARAGRAPHS,
  clamp01,
} from "./narrative.data";

/* ------------------------------------------------------------------
   NARRATIVE — MOBILE (Principles section only)

   PINNED CROSSFADE STAGE. A tall stage provides the scroll distance; a
   sticky viewport stays pinned while one scroll-progress value `p` (0→1)
   drives everything:

     p 0.00 → 0.24   INTRO — "SECT.1 THE PRINCIPLES" over section-2-bg;
                     the line kerns wide, holds, then fades as the plate
                     hands over to the first principle image.
     p 0.24 → 1.00   PRINCIPLES — each title + its full-screen image
                     crossfades IN THE CENTRED POSITION into the next,
                     drifting up slightly as it hands over. No scrolling
                     text, no nearest-centre detection.

   Renders ONLY the Principles section; Hero / Bio / CTA stay in the
   desktop file. Drop-in for the Section-02 slot on mobile.
------------------------------------------------------------------- */

export default function NarrativeMobile() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [p, setP] = useState(0);
  const pRef = useRef(0); // latest p for the idle timer, which outlives renders

  /* IDLE CUE — a fallback for readers who've stopped, not part of the
     design. Appears after 4s without scrolling while inside this stage;
     any scroll hides it and restarts the clock. Shorter than desktop's 8s
     because there's no hover interaction here for it to compete with. */
  const [showCue, setShowCue] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- one scroll-progress value across the whole pinned stage ---- */
  useEffect(() => {
    let raf = 0;
    const armIdle = () => {
      setShowCue(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        const cp = pRef.current;
        if (cp > 0.001 && cp < 0.995) setShowCue(true); // only while pinned
      }, 4000);
    };
    const onScroll = () => {
      armIdle();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        const next = scrollable > 0 ? clamp01(-rect.top, 0, scrollable) : 0;
        pRef.current = next;
        setP(next);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const n = TITLES.length;

  /* ---- INTRO phase ---- */
  const kern = clamp01(p, 0, 0.1); // line spreads to full kern, then holds
  const introLineOpacity = 0.9 * (1 - clamp01(p, 0.15, 0.22)); // fades during handover
  const reveal = clamp01(p, 0.17, 0.26); // section-2 plate → principle images

  /* Dwell + crossfade: each principle sits FULLY focused within HOLD of its
     slot, then fades over CROSS. HOLD+CROSS > 0.5 so adjacent fades overlap
     (a real crossfade, never a blank gap). fade = 0 (focused) → 1 (gone). */
  const HOLD = 0.4;
  const CROSS = 0.2;

  /* ---- PRINCIPLES phase ----
     LEAD/TAIL pad the ends so the FIRST and LAST principles get a full dwell.
     Without them idxFloat starts exactly at slot 0, so principle 01 only ever
     gets the back half of its hold band — a visibly shorter dwell than 02/03.
     Keep LEAD <= HOLD, or 01 starts already fading as the intro hands over. */
  const LEAD = HOLD;
  const TAIL = HOLD;
  const principlesP = clamp01(p, 0.24, 1); // 0 → 1 across the four principles
  const idxFloat = -LEAD + principlesP * (n - 1 + LEAD + TAIL); // -LEAD .. n-1+TAIL

  const slotFade = (i: number) =>
    clamp01((Math.abs(idxFloat - i) - HOLD) / CROSS, 0, 1);

  /* Tap the cue: go to the NEXT principle's settled centre (from the intro,
     that's 01); past the last, run out of the stage into the bio. Native
     smooth scroll — Lenis doesn't run on mobile. */
  const goNext = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const top = stage.getBoundingClientRect().top + window.scrollY;
    const scrollable = stage.offsetHeight - window.innerHeight;
    const next = idxFloat < 0 ? 0 : Math.floor(idxFloat + 0.5) + 1;
    const span = n - 1 + LEAD + TAIL;
    const targetP =
      next >= n ? 1 : 0.24 + ((next + LEAD) / span) * (1 - 0.24); // inverse of idxFloat
    window.scrollTo({
      top: top + scrollable * targetP + (next >= n ? 2 : 0),
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={stageRef}
      className="relative w-full bg-black"
      style={{ height: "600vh" }}
    >
      {/* PINNED VIEWPORT — svh keeps it exact under mobile address-bar collapse */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* SECTION-2 BASE PLATE — the intro backdrop; fades out on handover */}
        <NarrativeVideoPlate
          className="z-0"
          style={{ opacity: 1 - reveal }}
        />

        {/* base darkening — absent over the clean plate, fades IN over the images */}
        <div
          className="absolute inset-0 bg-black z-[1] pointer-events-none"
          style={{ opacity: reveal * 0.10 }}
        />

        {/* PRINCIPLE IMAGES — crossfade in place, keyed to idxFloat */}
        {TITLES.map((t, i) => (
          <img
            key={t.index}
            src={t.mobileImage ?? t.image}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
            style={{ filter: "brightness(0.6)", opacity: (1 - slotFade(i)) * reveal }}
          />
        ))}

        {/* legibility scrim over the backdrop */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/30 via-black/20 to-black/80 pointer-events-none" />

        {/* PINNED KERNING INTRO LINE — centred; kerns wide, holds, fades */}
        <div
          className="absolute inset-0 z-[3] flex items-center justify-center px-6 pointer-events-none"
          aria-label={CENTER_LINE}
        >
          <span
            className="font-brand-thin-cn uppercase text-white text-[3.2vw] whitespace-nowrap"
            style={{
              letterSpacing: `${kern * 1.0}em`,
              paddingLeft: `${kern * 1.0}em`, // matches letterSpacing (as desktop does) to cancel the trailing-space drift
              opacity: introLineOpacity,
            }}
          >
            {CENTER_LINE}
          </span>
        </div>

        {/* PINNED PRINCIPLE TITLES — crossfade into one another in the centred
            position, each drifting up as it hands over to the next */}
        {TITLES.map((t, i) => {
          const fade = slotFade(i);
          // static during the dwell (fade 0); only moves while crossfading — outgoing
          // lifts up, incoming rises from below. + a small lift-in on the intro handover.
          const dir = idxFloat >= i ? -1 : 1; // ahead of slot → exit up; before slot → rise from below
          const drift = dir * fade * 8 + (1 - reveal) * 6;
          return (
            <div
              key={t.index}
              // pr-9 (not px-6) leaves the right edge free as the rail's lane.
              className="absolute inset-0 z-[4] flex flex-col justify-center pl-6 pr-9 pointer-events-none"
              style={{ opacity: (1 - fade) * reveal, transform: `translateY(${drift}vh)` }}
            >
              <div className="max-w-[46ch]">
                {/* word + index sitting bottom-right of it, matching desktop TitleLine */}
                <div className="flex items-end gap-3 mb-6">
                  <h2 className="font-brand-other uppercase text-white text-[13vw] leading-[0.9] tracking-[0.02em]">
                    {t.word}
                  </h2>
                  <span className="font-brand-cn text-[13px] tracking-[0.15em] text-white/60 pb-[0.7em] shrink-0">
                    {t.index}
                  </span>
                </div>
                <p className="font-brand-secondary-thin text-white/80 text-[13px] leading-[1.7] tracking-[0.04em] text-justify">
                  {t.body}
                </p>
              </div>
            </div>
          );
        })}

        {/* PRINCIPLE RAIL — orientation only, for the title sequence alone:
            fades in with Reformation, out after Monolith. One square per
            principle; the solid one is showing, and the fill reaches each
            square exactly as its principle comes into focus (same idxFloat
            the crossfade uses). Not tappable — the scroll is the navigation. */}
        <div
          aria-hidden="true"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-[5] h-[30svh] w-px bg-white/35 pointer-events-none"
          style={{ opacity: reveal * (1 - clamp01(p, 0.975, 0.995)) }}
        >
          <div
            className="absolute top-0 left-0 w-px bg-white"
            // +0.5: reach square i at the HANDOVER into principle i (idx
            // i-0.5), the same instant Math.round below lights it and the
            // title becomes the visible one — not at the centre of its slot.
            style={{ height: `${clamp01(idxFloat + 0.5, 0, n - 1) * 100}%` }}
          />
          {TITLES.map((t, i) => {
            const showing = Math.round(Math.min(Math.max(idxFloat, 0), n - 1)) === i;
            return (
              <span
                key={t.index}
                className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 h-[6px] w-[6px] border transition-colors duration-300 ${
                  showing ? "bg-white border-white" : "bg-black border-white/70"
                }`}
                style={{ top: `${(i / (n - 1)) * 100}%` }}
              />
            );
          })}
        </div>

        {/* IDLE CUE — same chevron as desktop's. Tap target ~58px; only
            tappable while shown, so an invisible one can't catch taps. */}
        <button
          type="button"
          onClick={goNext}
          aria-label="Next principle"
          tabIndex={showCue ? 0 : -1}
          className="absolute bottom-[3svh] left-1/2 -translate-x-1/2 z-[5] p-3"
          style={{
            opacity: showCue ? 1 : 0,
            pointerEvents: showCue ? "auto" : "none",
            transition: "opacity 900ms ease-out",
          }}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,1)"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            className="narrative-chevron-drift"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   NARRATIVE — MOBILE CTA CONTENT (Sect.2 → contact)

   Only the CONTENTS of the CTA bar: the rise, the plate and the <Link>
   wrapper all stay in the desktop file, untouched.

   Desktop packs four assets into one row, which can't fit a phone. Here
   they stack into two: tagline row, then the line running out to the
   elevator. `lineReveal` is the same scroll-driven value desktop uses,
   so the draw carries over; the elevator's rise is hover-only and simply
   sits static on touch.
------------------------------------------------------------------- */

export function NarrativeCtaMobile({ lineReveal }: { lineReveal: number }) {
  /* Touch has no hover, so the ascend runs on a CSS keyframe loop instead —
     always UPWARD, never returning (see elevator-* in globals.css). The old
     flag-toggle animated the return leg back down, which read as a pendulum
     rather than a lift climbing. */
  const elevatorRef = useRef<HTMLSpanElement | null>(null);
  const [running, setRunning] = useState(false);

  /* Pause while off screen — the CTA sits in the DOM for the whole page.
     Driving animation-play-state costs ONE state change per visibility
     change instead of a re-render every beat. */
  useEffect(() => {
    const node = elevatorRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setRunning(entry.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const playState = {
    animationPlayState: running ? "running" : "paused",
  } as const;

  return (
    <div className="relative z-10 flex flex-col gap-3 px-6 pt-8 pb-5">
      {/* ROW 1 — mail + tagline. min-w-0 lets the text shrink instead of
          forcing the row wider than the viewport. */}
      <div className="flex items-center gap-4 min-w-0">
        <img
          src="/mail-icon.webp"
          alt=""
          aria-hidden="true"
          className="h-6 w-auto shrink-0 object-contain"
        />
        <span className="font-brand-other uppercase text-black text-[6.5vw] leading-none tracking-[0.18em] whitespace-nowrap min-w-0">
          <span className="font-brand-other-medium">Build </span>
          <span className="font-bold">Your </span>
          <span className="font-brand-other-medium">Authority</span>
        </span>
      </div>

      {/* ROW 2 — line draws left→right into the elevator on the right */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative flex-1 min-w-0 h-px flex items-center">
          <span
            className="block h-[1.5px] bg-black origin-left"
            style={{
              width: `${lineReveal * 100}%`,
              transition: "width 500ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </span>
        {/* ELEVATOR — two stacked copies: the first rides up and out, the
            second follows it in from below. Same pairing desktop uses on
            hover, driven by the one-way keyframe loop instead. */}
        <span
          ref={elevatorRef}
          className="relative shrink-0 h-18 overflow-hidden flex items-end"
        >
          <img
            src="/cta-elevator.webp"
            alt=""
            aria-hidden="true"
            className="h-18 w-auto object-contain elev-lead-up"
            style={playState}
          />
          <img
            src="/cta-elevator.webp"
            alt=""
            aria-hidden="true"
            className="absolute left-0 bottom-0 h-18 w-auto object-contain elev-follow-up"
            style={playState}
          />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   NARRATIVE — MOBILE BIO COMPOSITION (Sect.2 The Leadership)

   Drops into the SAME slot as the desktop bio layers, inside the outro
   stage's scale wrapper — so the pinned stage, depth overlay and rising
   CTA around it are completely untouched.

   Stacked, not overlapped: label / text zone / portrait zone each own
   their band, so no copy sits over the photo.

   BLEND: the root is a plain flex column — no transform, opacity or
   z-index — and the portrait zone is bare `relative`, so neither opens a
   stacking context between the cutout and PARKER. They stay siblings
   resolving against the scale wrapper, exactly as on desktop. Reveals use
   clip-path for the same reason (a transform would break the blend).

   `bioIn` is the desktop stage's own scroll flag, passed straight in —
   same pattern, no duplicated scroll logic.
------------------------------------------------------------------- */

const BIO_BG = "/section-3-bg.avif";

export function NarrativeBioMobile({ bioIn }: { bioIn: boolean }) {
  return (
    // Bottom padding = the orange CTA bar (h-11) + home indicator, so PARKER
    // sits on top of the bar instead of under it. The plate still fills.
    <div
      className="absolute inset-0 flex flex-col"
      style={{ paddingBottom: "calc(2.75rem + env(safe-area-inset-bottom))" }}
    >
      {/* ELONGATED PLATE */}
      <img
        src={BIO_BG}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 z-0 w-full h-full object-cover object-center pointer-events-none"
      />
      <div className="absolute inset-0 z-0 bg-black/35 pointer-events-none" />

      {/* SECTION LABEL — static */}
      <div className="relative flex items-center gap-3 px-5 pt-[10.5vh] pb-[3vh]">
        <span className="h-px flex-1 bg-white/20" />
        <span className="font-brand-thin-cn uppercase text-white text-[9px] tracking-[0.4em] whitespace-nowrap">
          {BIO_LABEL}
        </span>
      </div>

      {/* TEXT ZONE — its own band on flat plate, nothing behind it */}
      <div className="relative shrink-0 px-5">
        <h3
          className="font-brand-secondary-heavy italic uppercase text-white text-[6vw] leading-[1.15] tracking-[0.12em] mb-5"
          style={{
            opacity: bioIn ? 1 : 0,
            transform: bioIn ? "translateY(0)" : "translateY(12px)",
            transition:
              "opacity 800ms ease-out 600ms, transform 800ms cubic-bezier(0.16,1,0.3,1) 600ms",
          }}
        >
          {BIO_ROLE}
        </h3>
        <div
          className="flex flex-col gap-3"
          style={{
            opacity: bioIn ? 1 : 0,
            transform: bioIn ? "translateY(0)" : "translateY(12px)",
            transition:
              "opacity 800ms ease-out 900ms, transform 800ms cubic-bezier(0.16,1,0.3,1) 900ms",
          }}
        >
          {BIO_PARAGRAPHS.map((para, i) => (
            <p
              key={i}
              className="font-brand-secondary-thin text-white/75 text-[10.5px] leading-[1.5] tracking-[0.03em] text-justify"
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* PORTRAIT ZONE — bare `relative`: no z/transform/opacity, so the
          cutout + PARKER keep blending against the plate */}
      <div className="relative flex-1 min-h-0 w-full">
        {/* ZION.JUDAH — sits above PARKER, blended like desktop. PARKER at
            32vw / leading-0.78 stands ~25vw tall from bottom-1, so this has to
            clear that; retune this value whenever PARKER's size changes. */}
        <div
          className="absolute bottom-[28vw] left-0 right-0 z-30 px-5 pointer-events-none"
          style={{
            clipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
            WebkitClipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
            transition: "clip-path 1100ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* right-aligned: rule runs in from the left, text sits at the edge.
              -mr cancels the trailing letter-space so it lands flush. */}
          <div className="flex items-center">
            <span className="h-px flex-1 bg-white/60" />
            <span className="font-brand-cn uppercase text-white text-[17px] leading-none tracking-[0.50em] whitespace-nowrap pl-[0.9em] -mr-[0.60em]">
              {BIO_KICKER}
            </span>
          </div>
        </div>

        {/* CUTOUT — sibling of PARKER, static. Centred and filling the band:
            desktop's left-[2%] only makes sense with copy in a right column.
            object-contain centres it without a transform, which would open a
            stacking context between it and PARKER. */}
        <img
          src="/ZP-1-mobile.avif"
          alt="Zion Parker"
          className="absolute bottom-0 left-[12%] z-10 h-[100%] w-auto object-contain object-bottom pointer-events-none select-none"
        />

        {/* LEGIBILITY SCRIM — sits between the cutout (z-10) and the name
            layers, so ZION.JUDAH reads against a settled base instead of the
            shirt. Below PARKER too, so PARKER still blends against it. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[55vw] z-[15] bg-gradient-to-t from-black/2 via-black/55 to-transparent pointer-events-none"
        />

        {/* PARKER — clip-path reveal; mobile size/kerning, no nowrap needed */}
        <h2
          className="absolute bottom-1 left-0 right-0 z-20 px-5 font-brand-other uppercase text-white text-[32vw] leading-[0.78em] tracking-[0.0em] mix-blend-difference pointer-events-none"
          style={{
            clipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
            WebkitClipPath: bioIn ? "inset(0 0 0 0)" : "inset(calc(100% - 1px) 0 0 0)",
            transition: "clip-path 1400ms cubic-bezier(0.16,1,0.3,1) 150ms",
          }}
        >
          {BIO_NAME}
        </h2>
      </div>
    </div>
  );
}
