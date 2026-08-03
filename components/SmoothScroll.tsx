"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

// Smooth scroll runs ONLY on the floor routes (the "site scroll" experience) —
// inspection pages (tiers / archive) are app-like with their own nested scroll.
const FLOOR_ROUTES = new Set([
  "/",
  "/methodology",
  "/services",
  "/projectarchive",
  "/thenarrative",
  "/contact",
]);
const clean = (p: string) => p.replace(/\/+$/, "") || "/";

// Scroll weight (lower = heavier). DEFAULT_LERP is every floor page; ROUTE_LERP
// overrides per route — tune the narrative in isolation here.
const DEFAULT_LERP = 0.08;
const ROUTE_LERP: Record<string, number> = {
  "/thenarrative": 0.04, // heavier for the kern choreography
};

export default function SmoothScroll() {
  const pathname = usePathname();

  // Desktop-only + reduced-motion-aware; mobile keeps native touch momentum.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const route = clean(pathname);
    if (!desktop || reduced || !FLOOR_ROUTES.has(route)) return;

    const lenis = new Lenis({ lerp: ROUTE_LERP[route] ?? DEFAULT_LERP });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
