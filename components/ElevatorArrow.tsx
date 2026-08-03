"use client";

import { useEffect, useRef, useState } from "react";

/* Floor-nav elevator arrow: two stacked copies that slide vertically (one
   exits, one rises/descends in) — the same "ascending floor" motion as the
   CTA elevator. `dir` "up" rises, "down" descends. Width/margin via className.

   `auto` drives that motion from a CSS keyframe loop instead of hover, for
   touch screens where hover never fires. The loop only ever travels in `dir`
   (see the elevator-* keyframes in globals.css) — a toggled transform would
   animate the return leg backwards and read as a pendulum, not an elevator. */
export default function ElevatorArrow({
  src,
  dir,
  className = "",
  glow = true,
  auto = false,
}: {
  src: string;
  dir: "up" | "down";
  className?: string;
  glow?: boolean;
  auto?: boolean;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [running, setRunning] = useState(false);

  /* Pause while off screen — this sits in the hero for the whole page. Driving
     animation-play-state means visibility costs ONE state change, not a
     re-render every beat. */
  useEffect(() => {
    if (!auto) return;
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      ([entry]) => setRunning(entry.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [auto]);

  const exit = dir === "up" ? "group-hover:-translate-y-[120%]" : "group-hover:translate-y-[120%]";
  const rest = dir === "up" ? "translate-y-[120%]" : "-translate-y-[120%]";
  // Subtle white halo; intensifies slightly on hover.
  const glowCls = glow
    ? "drop-shadow-[0_0_6px_rgba(255,255,255,0.35)] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
    : "";

  // auto → one-way keyframe loop; otherwise the original hover transition.
  const lead = auto
    ? `${dir === "up" ? "elev-lead-up" : "elev-lead-down"} opacity-100`
    : `opacity-70 group-hover:opacity-100 transition-all duration-800 ease-out ${exit}`;
  const follow = auto
    ? dir === "up"
      ? "elev-follow-up"
      : "elev-follow-down"
    : `transition-transform duration-800 ease-out ${rest} group-hover:translate-y-0`;

  const playState = auto
    ? ({ animationPlayState: running ? "running" : "paused" } as const)
    : undefined;

  return (
    <span ref={ref} className={`relative block overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`block w-full h-auto object-contain filter brightness-125 ${glowCls} ${lead}`}
        style={playState}
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 w-full h-auto object-contain opacity-100 filter brightness-125 ${glowCls} ${follow}`}
        style={playState}
      />
    </span>
  );
}
