"use client";

import { useState, useEffect } from "react";

// Portrait mobile loader vs. the landscape desktop clip. Swapped by viewport
// below — the source masters live in faststart-export/Loading screen/.
const DESKTOP_SRC = "/loading-screen-v1.1.mp4";
const MOBILE_SRC = "/loading-screen-mobile.mp4";

/**
 * Shared inner content for the site's full-screen loaders (Tier + Archive).
 *
 * Renders the designed loading-screen video (from /public) full-bleed, the
 * pulsing J-logo pinned bottom-right, and the animated loading text pinned
 * bottom-left (same baseline as the logo) — brought back 2026-07-20 once the
 * corner layout was settled. The video starts at opacity-0 and fades in on
 * `canplay` (`onLoadedData`/`onCanPlay`) so a slow network shows a graceful
 * black → fade rather than a janky first-frame pop.
 *
 * On `<1024px` it swaps to the portrait mobile master (added 2026-07-20). The
 * src is set directly on the <video> (+ keyed) — NOT a child <source> — so the
 * viewport swap actually reloads on iOS (see IntroLoader gotcha in CLAUDE.md).
 *
 * Parents own the outer fixed/absolute motion wrapper (positioning, z-index and
 * the AnimatePresence fade-OUT); this component is only the shared bg + logo + text.
 *
 * `textClassName` picks which animated-dots CSS variant to use (loader-text,
 * loader-text-archive, loader-text-catalogue, loader-title, …) — defaults to
 * the generic "loading..." (`loader-text`). `label` is only needed for
 * `loader-title`, which reads it via `data-title`.
 */
export default function LoaderScreen({
  textClassName = "loader-text",
  label,
}: {
  textClassName?: string;
  label?: string;
}) {
  const [ready, setReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState(DESKTOP_SRC);

  // Swap to the portrait master on mobile viewports (matches the site's
  // <1024px breakpoint; same matchMedia pattern as IntroLoader).
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setVideoSrc(MOBILE_SRC);
    }
  }, []);

  return (
    <>
      <video
        key={videoSrc}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ease-out ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
      <span
        data-title={label}
        className={`${textClassName} font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80 absolute bottom-6 left-6 lg:bottom-8 lg:left-8 z-10 max-w-[60%]`}
      />
      <img
        src="/j-logo.svg"
        alt="Loading"
        className="loader-j absolute bottom-6 right-6 lg:bottom-8 lg:right-8 z-10"
      />
    </>
  );
}
