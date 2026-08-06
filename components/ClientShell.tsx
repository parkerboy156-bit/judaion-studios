"use client";

import React, {
  useState,
  createContext,
  useContext,
  useRef,
  useEffect,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import IntroLoader from "./IntroLoader";
import RotateNotice from "./RotateNotice";
import SmoothScroll from "./SmoothScroll";

const LoadingContext = createContext({ isLoaded: false });
export const useLoading = () => useContext(LoadingContext);

// ─────────────────────────────────────────────────────────────────────────
// SPATIAL MAP — drives the elevator transition.
//   FLOORS:      vertical spine. Higher index = higher floor. Moving between
//                floors plays the two-phase sweep (ascend = up, descend = down).
//   INSPECTIONS: tiers + catalogue. "Step in to inspect" pages that own their
//                own entrance (loading screen) — the sweep is SKIPPED for them.
// ─────────────────────────────────────────────────────────────────────────
const FLOORS: Record<string, number> = {
  "/": 0,
  "/methodology": 1,
  "/services": 2,
  "/projectarchive": 3,
  "/thenarrative": 4,
  "/contact": 5, // roof
};
const INSPECTIONS = new Set([
  "/tier-1",
  "/tier-2",
  "/tier-3",
  "/archivecatalogue",
]);

const clean = (p: string) => p.replace(/\/+$/, "") || "/";

/* ── IN-APP HISTORY ───────────────────────────────────────────────────────
   Counts client-side navigations THIS document has performed, so an exit
   button can tell whether router.back() would land on one of our pages or
   leave the site entirely.

   Nothing the browser exposes can answer that: history.length counts other
   origins' entries too, and Next's history.state looks the same on a fresh
   load as it does after a push. The only reliable signal is one we record.

   Module scope is deliberate — it resets on a hard load (so a deep link
   correctly starts at zero) and survives client-side navigation (so it keeps
   counting as you move around). Incremented from the pathname effect below. */
let inAppNavigations = 0;
export const hasInAppHistory = () => inAppNavigations > 0;

type Phase = "cover" | "covered" | "reveal";
type Transition = {
  dir: "up" | "down";
  phase: Phase;
  href: string;
  id: number;
  // "sweep" = full intercepted cover→swap→reveal (clicks).
  // "reveal" = reveal-only, no cover (browser back/forward — route already changed).
  kind: "sweep" | "reveal";
};

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [transition, setTransition] = useState<Transition | null>(null);

  // Tracks the current path (feeds the click handler) AND detects "external"
  // navigations — browser back/forward, or anything we didn't intercept. Those
  // can't be covered (the route already changed), so they get a reveal-only
  // sweep: the veil drops over the new page and sweeps away in the travel
  // direction. Keeps back/forward consistent with the clicked sweeps.
  const pathRef = useRef(pathname);
  useEffect(() => {
    const from = pathRef.current ? clean(pathRef.current) : null;
    const to = clean(pathname);
    pathRef.current = pathname;

    // Record the navigation BEFORE the sweep guards below bail out — this
    // tracks that we moved, not whether the move happened to animate.
    // (A transition-only re-run has from === to, so it can't double count.)
    if (from && from !== to) inAppNavigations += 1;

    // Skip first load, same path, or while a clicked sweep is already running.
    if (!from || from === to || transition) return;

    // Only floor→floor (inspections / off-map routes navigate plainly).
    const inspection = INSPECTIONS.has(from) || INSPECTIONS.has(to);
    const f = FLOORS[from];
    const t = FLOORS[to];
    if (inspection || f === undefined || t === undefined) return;

    setTransition({
      dir: t > f ? "up" : "down",
      phase: "reveal",
      href: to,
      id: Date.now(),
      kind: "reveal",
    });
  }, [pathname, transition]);

  useEffect(() => {
    const isGoogleApp = /GSA\/\d/.test(navigator.userAgent);
    if (isGoogleApp) document.body.classList.add("is-google-app");
  }, []);

  // ── Intercept floor→floor link clicks and run the two-phase sweep ────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Let the browser do its normal thing for modified / non-left clicks.
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented
      )
        return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || !href.startsWith("/")) return;
      if (anchor.target === "_blank") return;

      const from = clean(pathRef.current);
      const to = clean(href);
      if (from === to) return;

      // Only intercept pure floor→floor moves. Inspections (tiers / catalogue)
      // navigate plainly on entry (their loader owns it) and return via
      // router.back() — so they never trigger the sweep.
      const inspection = INSPECTIONS.has(from) || INSPECTIONS.has(to);
      const f = FLOORS[from];
      const t = FLOORS[to];
      if (inspection || f === undefined || t === undefined) return;

      // Take over: stop Next's Link from navigating, run the sweep ourselves.
      e.preventDefault();
      e.stopPropagation();
      setTransition({
        dir: t > f ? "up" : "down",
        phase: "cover",
        href: to,
        id: Date.now(),
        kind: "sweep",
      });
    };

    // Capture phase so we beat React's (root-bound) click handlers.
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  // Once the veil has fully COVERED, the route push has already fired (below).
  // Hold for a fixed beat, then always sweep away — so the cover→reveal cadence
  // is identical on every navigation, independent of how fast the new route
  // commits (that variability is what made it snap on fast pages / stall on
  // slow ones). Static/prerendered routes commit well within this hold.
  useEffect(() => {
    if (transition?.phase !== "covered") return;
    const id = window.setTimeout(() => {
      setTransition((t) =>
        t && t.phase === "covered" ? { ...t, phase: "reveal" } : t,
      );
    }, 260);
    return () => window.clearTimeout(id);
  }, [transition?.phase, transition?.id]);

  const handleAnimComplete = () => {
    if (!transition) return;
    if (transition.phase === "cover") {
      router.push(transition.href);
      setTransition((t) => (t ? { ...t, phase: "covered" } : t));
    } else if (transition.phase === "reveal") {
      setTransition(null);
    }
  };

  // Geometry: ascend enters from BELOW (rises up); descend enters from ABOVE
  // (falls down). The veil covers at y:0, then continues off in the travel dir.
  const up = transition?.dir !== "down";
  const enterY = up ? "100%" : "-100%";
  const exitY = up ? "-100%" : "100%";
  const targetY = transition?.phase === "reveal" ? exitY : "0%";

  return (
    <LoadingContext.Provider value={{ isLoaded }}>
      {/* Site-wide smooth scroll (floor routes, desktop-only) */}
      <SmoothScroll />

      {/* Phone-landscape "rotate to portrait" prompt (CSS-gated, top of stack) */}
      <RotateNotice />

      {/* The IntroLoader handles the very first entry */}
      <IntroLoader onComplete={() => setIsLoaded(true)} />

      {/* ── ELEVATOR SWEEP ─────────────────────────────────────────────────
          Two-phase: rises/falls to cover the page being left, the route swaps
          while covered, then it continues sweeping to reveal the new floor.
          Feathered edges keep it soft (not a hard slab). */}
      {transition && (
        <motion.div
          key={transition.id}
          initial={transition.kind === "reveal" ? { y: "0%" } : { y: enterY }}
          animate={{ y: targetY }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={handleAnimComplete}
          className="fixed inset-x-0 z-[9999]"
          style={{
            top: "-20vh",
            height: "140vh",
            background:
              "linear-gradient(to bottom, transparent 0%, #000 13%, #000 87%, transparent 100%)",
            pointerEvents: "auto", // block interaction during the sweep
            willChange: "transform",
          }}
        />
      )}

      <div
        style={{
          opacity: isLoaded ? 1 : 0,
          visibility: isLoaded ? "visible" : "hidden",
          backgroundColor: "black",
          minHeight: "100vh",
          // Smooth first-load reveal after the IntroLoader.
          transition: "opacity 0.6s ease",
        }}
      >
        {children}
      </div>
    </LoadingContext.Provider>
  );
}
