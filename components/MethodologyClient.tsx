"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import * as React from "react";
// Same background is used for desktop AND mobile.
import methodBgAvif from "@/public/method-bg-V2.1.avif";
import methodBgPng from "@/public/method-bg-V2.1.webp";
import Link from "next/link";

// ─────────────────────────────────────────────
// METHODOLOGY HITBOX — sits over the billboard, opens the carousel.
// Position/size are % of the (scaled) image layer, so the box tracks the
// billboard as the page zooms. Adjust these freely; the live X/Y readout on
// hover helps you dial in the exact spot.
// ─────────────────────────────────────────────
const HITBOX = {
  top: "31%",
  left: "46.7%",
  width: "21.6%",
  height: "37%",
  rotate: "0deg",

  label: { tag: "ASSET 2", name: "METHODOLOGY" },

  lineOpacity: 0.65, // selection-box border opacity (0–1)
  handleSize: 5, // corner handle size (px)
  lineDuration: 0.4,
  cornerDelay: 0.35,
  cornerDuration: 0.18,
};

// ─────────────────────────────────────────────
// MOBILE HITBOX — always-on tap target over the billboard (opens the
// carousel). Coords are % of the mobile image layer (the w-[300vw] strip),
// so left is measured across the full horizontal-scroll width. Tune freely.
// ─────────────────────────────────────────────
const HITBOX_MOBILE = {
  top: "35%",
  left: "46.7%",
  width: "21.5%",
  height: "29.3%",
  borderOpacity: 0.4, // visible target outline (0–1)
};
// ─────────────────────────────────────────────

export default function MethodologyPage() {
  const { scrollYProgress } = useScroll();
  const [showProcess, setShowProcess] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [hitboxHovered, setHitboxHovered] = React.useState(false);
  const [hoverCoords, setHoverCoords] = React.useState({ x: 0, y: 0 });
  const [activeCallout, setActiveCallout] = React.useState<number | null>(null);

  // Detect Mobile and lock scroll position
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) window.scrollTo(0, 0); // Prevent dead space from 300vh
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Desktop Zoom Logic
  const scrollScale = useTransform(scrollYProgress, [1, 0], [1.04, 1.75]);
  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1, 0.9, 0.8],
  );

  const [isZoomed, setIsZoomed] = React.useState(false);

  React.useEffect(() => {
    if (isMobile) {
      setIsZoomed(true); // Keep triggers active on mobile
      return;
    }
    window.scrollTo(0, document.body.scrollHeight);
    return scrollYProgress.onChange((latest) => {
      setIsZoomed(latest < 0.5);
    });
  }, [scrollYProgress, isMobile]);

  // Mouse Parallax (Disabled on Mobile)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 110, damping: 25 });
  const mouseY = useSpring(y, { stiffness: 110, damping: 25 });

  const bgMoveX = useTransform(mouseX, [0, 1920], ["1.6%", "-1.6%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1.6%", "-1.6%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    x.set(e.clientX);
    y.set(e.clientY);
  };

  // ───────────────────────────────────────────────────────────────────
  // CALLOUTS — leader-line hotspots over the billboard. Hover a node →
  // line draws + panel fades in. All copy is rendered always-in-DOM
  // (opacity-animated, never unmounted) so it stays crawlable for SEO.
  //
  //  node       → marker position (% of the image layer, tracks the zoom)
  //  side       → which way the line + panel extend ("left" | "right")
  //  drop       → px the line falls before turning sideways
  //  lineLength → px of the horizontal run
  //  panelWidth → px width of the text panel
  //  label      → bold heading line of the callout
  //  body       → paragraph copy (edit the words here)
  //
  // ⮕ POSITIONS & COPY for each node live in this array (below).
  // ⮕ FONTS / SIZES / COLORS are shared by all 3 nodes and live in the
  //   render block — search "CALLOUT PANEL STYLES" further down this file.
  // ───────────────────────────────────────────────────────────────────
  const CALLOUTS: {
    id: number;
    node: { top: string; left: string };
    nodeMobile?: { top: string; left: string }; // mobile-only position (falls back to node)
    side: "left" | "right";
    dir?: "up" | "down"; // vertical direction the line travels (default "down")
    drop: number; // px the line travels (down OR up) before running sideways
    lineLength: number; // px of the horizontal run
    panelWidth: number;
    label: string;
    body: React.ReactNode;
  }[] = [
    // ╔══════════════════════════════════════════════════════════════╗
    // ║ NODE 1 — LEFT of billboard  (panel opens to the RIGHT)        ║
    // ╚══════════════════════════════════════════════════════════════╝
    {
      id: 1,
      node: { top: "33%", left: "28%" }, // ← move NODE 1 here (desktop)
      nodeMobile: { top: "37%", left: "29%" }, // ← move NODE 1 here (mobile)
      side: "right",
      drop: 90,
      lineLength: 56,
      panelWidth: 238,
      label: " Your Creative Strategic Partner",
      body: (
        <>
          JUDAION Studios is a Brand Architecture Studio that operates at the
          intersection of Business vision and Cinematic rigour. We bridge the
          gap between business vision and identity.
        </>
      ),
    },
    // ╔══════════════════════════════════════════════════════════════╗
    // ║ NODE 2 — RIGHT of billboard  (panel opens to the LEFT)        ║
    // ╚══════════════════════════════════════════════════════════════╝
    {
      id: 2,
      node: { top: "33.3%", left: "43%" }, // ← move NODE 2 here (desktop)
      nodeMobile: { top: "37%", left: "42%" }, // ← move NODE 2 here (mobile)
      side: "left",
      drop: 100,
      lineLength: 70,
      panelWidth: 230,
      label: "Strategic Architect",
      body: (
        <>
          More than designers, we are your Strategic Architect. We build the
          systems and visual logic that give a brand authority, so your market
          reads you as the obvious choice. Nothing is decorative, every decision
          is structural.
        </>
      ),
    },
    // ╔══════════════════════════════════════════════════════════════╗
    // ║ NODE 3 — lower billboard  (line goes UP, panel opens to the LEFT) ║
    // ╚══════════════════════════════════════════════════════════════╝
    {
      id: 3,
      node: { top: "65.8%", left: "43%" }, // ← move NODE 3 here (desktop)
      nodeMobile: { top: "62%", left: "42%" }, // ← move NODE 3 here (mobile)
      side: "left",
      dir: "up",
      drop: 100,
      lineLength: 56,
      panelWidth: 230,
      label: "Consistent & High-Converting",
      body: (
        <>
          We engineer for performance. The result is an identity that holds
          consistent and high-converting under pressure at every scale, across
          every platform, without losing its edge.
        </>
      ),
    },
  ];

  const STEPS = [
    {
      id: "01",
      title: "Extraction",
      text: "We deep-dive into your business via our strategic questionnaire to extract your core DNA.",
      img: "/extraction",
    },
    {
      id: "02",
      title: "Blueprint",
      text: "We translate the raw data into a strategic visual anchor, used to guide the execution phase.",
      img: "/blue-print",
    },
    {
      id: "03",
      title: "Execution",
      text: "The development cycle, constant internal review against original objectives and presentation of logic-backed designs.",
      img: "/execution",
    },
    {
      id: "04",
      title: "Handover",
      text: "The structural signature is locked. Assets are released for deployment following the final clearnace of the balance.",
      img: "/handover",
    },
  ];


  React.useEffect(() => {
    STEPS.forEach((s) => {
      const img = new Image();
      img.src = `${s.img}.avif`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative bg-black">
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "black",
          zIndex: 999, // Ensure it sits above all page content
          pointerEvents: "none",
        }}
      />
      <div
        onMouseMove={handleMouseMove}
        className={`relative w-full bg-[#0a0a0a] ${isMobile ? "h-screen overflow-x-auto overflow-y-hidden overscroll-x-none" : "h-[300vh]"}`}
      >
        <div
          className={`sticky top-0 h-screen overflow-hidden ${isMobile ? "w-[300vw] relative left-[-100v]" : "w-full"}`}
        >
          <motion.div
            style={{
              x: isMobile ? 0 : bgMoveX,
              y: isMobile ? 0 : bgMoveY,
              scale: isMobile ? 1 : scrollScale, // Start zoomed out
              opacity: isMobile ? 1 : scrollOpacity,
            }}
            className="absolute inset-0 w-full h-full origin-[50%_50%]"
          >
            <picture>
              {/* 1. Primary choice: AVIF (Desktop & Mobile) */}
              <source srcSet={methodBgAvif.src} type="image/avif" />

              {/* 2. Safety Net: WEBP (Desktop & Mobile) */}
              <img
                src={methodBgPng.src}
                alt="Methodology Focus"
                className="w-full h-full object-cover"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                fetchPriority="high"
              />
            </picture>

            {/* TEXT BLOCK removed 2026-06-12 — preserved in
                components/_methodology-removed-blocks.bak.txt pending the
                hover-callout redesign on the V2.1 background. */}

            {/* --- METHODOLOGY HITBOX (desktop) — opens the carousel ---
                Active only while zoomed in (matches the old J trigger). */}
            {!isMobile && (
              <div
                className="absolute z-30"
                style={{
                  top: HITBOX.top,
                  left: HITBOX.left,
                  width: HITBOX.width,
                  height: HITBOX.height,
                  transform: `rotate(${HITBOX.rotate})`,
                  pointerEvents: isZoomed ? "auto" : "none",
                }}
                onMouseEnter={() => setHitboxHovered(true)}
                onMouseLeave={() => setHitboxHovered(false)}
                onMouseMove={(e) =>
                  setHoverCoords({
                    x: Math.round(e.clientX),
                    y: Math.round(e.clientY),
                  })
                }
                onClick={() => isZoomed && setShowProcess(true)}
              >
                <div className="absolute inset-0 cursor-pointer" />

                {/* Scan lines — hover only */}
                <motion.div
                  animate={{ opacity: hitboxHovered ? 1 : 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 overflow-hidden pointer-events-none bg-black/[0.10]"
                >
                  <motion.div
                    animate={{ y: ["0px", "-12px"] }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-[-12px]"
                    style={{
                      // CRT-style scan lines: 1px line + 2px gap (3px period).
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)",
                      backgroundSize: "100% 3px",
                    }}
                  />
                </motion.div>

                {/* Selection-box border lines */}
                <motion.div
                  animate={{ scaleX: hitboxHovered ? 1 : 0 }}
                  transition={{
                    duration: HITBOX.lineDuration,
                    ease: "easeOut",
                  }}
                  className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                  style={{
                    transformOrigin: "center",
                    backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})`,
                  }}
                />
                <motion.div
                  animate={{ scaleX: hitboxHovered ? 1 : 0 }}
                  transition={{
                    duration: HITBOX.lineDuration,
                    ease: "easeOut",
                  }}
                  className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                  style={{
                    transformOrigin: "center",
                    backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})`,
                  }}
                />
                <motion.div
                  animate={{ scaleY: hitboxHovered ? 1 : 0 }}
                  transition={{
                    duration: HITBOX.lineDuration,
                    ease: "easeOut",
                  }}
                  className="absolute top-0 bottom-0 left-0 w-px pointer-events-none"
                  style={{
                    transformOrigin: "center",
                    backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})`,
                  }}
                />
                <motion.div
                  animate={{ scaleY: hitboxHovered ? 1 : 0 }}
                  transition={{
                    duration: HITBOX.lineDuration,
                    ease: "easeOut",
                  }}
                  className="absolute top-0 bottom-0 right-0 w-px pointer-events-none"
                  style={{
                    transformOrigin: "center",
                    backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})`,
                  }}
                />

                {/* Corner handles */}
                {(
                  [
                    {
                      top: -HITBOX.handleSize / 2,
                      left: -HITBOX.handleSize / 2,
                    },
                    {
                      top: -HITBOX.handleSize / 2,
                      right: -HITBOX.handleSize / 2,
                    },
                    {
                      bottom: -HITBOX.handleSize / 2,
                      left: -HITBOX.handleSize / 2,
                    },
                    {
                      bottom: -HITBOX.handleSize / 2,
                      right: -HITBOX.handleSize / 2,
                    },
                  ] as React.CSSProperties[]
                ).map((pos, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: hitboxHovered ? 1 : 0 }}
                    transition={{
                      duration: HITBOX.cornerDuration,
                      delay: hitboxHovered ? HITBOX.cornerDelay : 0,
                    }}
                    className="absolute bg-white pointer-events-none"
                    style={{
                      width: HITBOX.handleSize,
                      height: HITBOX.handleSize,
                      ...pos,
                    }}
                  />
                ))}

                {/* X/Y coordinate readout (right of the box) */}
                <motion.div
                  animate={{
                    opacity: hitboxHovered ? 1 : 0,
                    x: hitboxHovered ? 0 : -4,
                  }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: hitboxHovered ? 0.1 : 0,
                  }}
                  className="absolute top-0 pointer-events-none flex flex-col gap-[3px]"
                  style={{ left: "calc(100% + 10px)" }}
                >
                  <span className="font-brand-cn text-[8px] uppercase tracking-[0.15em] whitespace-nowrap">
                    <span className="text-white">X: </span>
                    <span className="text-white/50">{hoverCoords.x} PX</span>
                  </span>
                  <span className="font-brand-cn text-[8px] uppercase tracking-[0.15em] whitespace-nowrap">
                    <span className="text-white">Y: </span>
                    <span className="text-white/50">{hoverCoords.y} PX</span>
                  </span>
                </motion.div>

                {/* Asset label — right of the box, anchored to the bottom */}
                <motion.div
                  animate={{
                    opacity: hitboxHovered ? 1 : 0,
                    x: hitboxHovered ? 0 : -4,
                  }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: hitboxHovered ? 0.15 : 0,
                  }}
                  className="absolute bottom-0 pointer-events-none"
                  style={{ left: "calc(100% + 10px)" }}
                >
                  <span className="font-brand-cn text-[8px] uppercase tracking-[0.2em] text-white whitespace-nowrap">
                    {HITBOX.label.tag}:
                    <span className="text-white/50">
                      {" "}
                      "{HITBOX.label.name}"
                    </span>
                  </span>
                </motion.div>
              </div>
            )}

            {/* --- METHODOLOGY HITBOX (mobile) — always-on tap target that
                opens the carousel. Reposition via HITBOX_MOBILE at the top. */}
            {isMobile && (
              <div
                className="absolute z-30"
                style={{
                  top: HITBOX_MOBILE.top,
                  left: HITBOX_MOBILE.left,
                  width: HITBOX_MOBILE.width,
                  height: HITBOX_MOBILE.height,
                }}
                onClick={() => setShowProcess(true)}
              >
                {/* Active scan lines — always on (same CRT look as desktop hover) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black/[0.10]">
                  <motion.div
                    animate={{ y: ["0px", "-12px"] }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-[-12px]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)",
                      backgroundSize: "100% 3px",
                    }}
                  />
                </div>

                {/* Always-visible selection outline so the target reads as tappable */}
                <div
                  className="absolute inset-0 pointer-events-none border"
                  style={{
                    borderColor: `rgba(255,255,255,${HITBOX_MOBILE.borderOpacity})`,
                  }}
                />
                {/* Corner ticks */}
                {(
                  [
                    { top: -3, left: -3 },
                    { top: -3, right: -3 },
                    { bottom: -3, left: -3 },
                    { bottom: -3, right: -3 },
                  ] as React.CSSProperties[]
                ).map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-[6px] h-[6px] bg-white pointer-events-none"
                    style={pos}
                  />
                ))}

                {/* X/Y readout — top-right (same position as desktop) */}
                <div
                  className="absolute top-0 pointer-events-none flex flex-col gap-[3px]"
                  style={{ left: "calc(100% + 10px)" }}
                >
                  <span className="font-brand-cn text-[8px] uppercase tracking-[0.15em] whitespace-nowrap">
                    <span className="text-white">X: </span>
                    <span className="text-white/50">{HITBOX_MOBILE.left}</span>
                  </span>
                  <span className="font-brand-cn text-[8px] uppercase tracking-[0.15em] whitespace-nowrap">
                    <span className="text-white">Y: </span>
                    <span className="text-white/50">{HITBOX_MOBILE.top}</span>
                  </span>
                </div>

                {/* Asset label — bottom-right (same position as desktop) */}
                <div
                  className="absolute bottom-0 pointer-events-none"
                  style={{ left: "calc(100% + 10px)" }}
                >
                  <span className="font-brand-cn text-[8px] uppercase tracking-[0.2em] text-white whitespace-nowrap">
                    {HITBOX.label.tag}:
                    <span className="text-white/50">
                      {" "}
                      "{HITBOX.label.name}"
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* --- LEADER-LINE CALLOUTS ---
                Desktop: hover a node → line draws + paragraph fades in.
                Mobile:  tap a node to toggle it open/closed.
                Copy is always in the DOM (opacity only) so it stays crawlable.
                Active only while zoomed in (desktop), always active on mobile. */}
            {CALLOUTS.map((c) => {
              const open = activeCallout === c.id;
              const right = c.side === "right";
              const up = c.dir === "up";
              const elbowY = up ? -c.drop : c.drop; // y of the horizontal run
              const pos = isMobile && c.nodeMobile ? c.nodeMobile : c.node;
              return (
                <div
                  key={c.id}
                  className="absolute z-40"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    pointerEvents: isZoomed ? "auto" : "none",
                  }}
                  onMouseEnter={() => !isMobile && setActiveCallout(c.id)}
                  onMouseLeave={() =>
                    !isMobile &&
                    setActiveCallout((p) => (p === c.id ? null : p))
                  }
                  onClick={() =>
                    isMobile &&
                    setActiveCallout((p) => (p === c.id ? null : c.id))
                  }
                >
                  {/* Node marker + hover hit area (centered on the point).
                        ▸ CURSOR on hover  → "cursor-pointer" on this div
                        ▸ Marker SIZE      → "w-[7px] h-[7px]" below
                        ▸ Marker COLOR     → "bg-white" below */}
                  <div className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center cursor-pointer">
                    {/* Persistent ring — ALWAYS visible so the node never fully
                          disappears between pulses (this is what stops people
                          missing them). Tune size via width/height, strength via
                          border color/opacity. */}

                    {/* Expanding ripple — idle only. A sharp ring that grows
                          outward and fades (smooth, no flash) to catch the eye.
                          Tune: scale max = spread, opacity peak = strength,
                          duration = speed. */}
                    {!open && (
                      <motion.div
                        className="absolute left-1/2 top-1/2 rounded-full border border-white pointer-events-none blur-[0.5px]"
                        style={{ x: "-50%", y: "-50%", width: 13, height: 13 }}
                        animate={{ opacity: [0, 0.3, 0], scale: [1, 2.0, 2.6] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    )}

                    {/* Solid centre dot */}
                    <motion.div
                      // opacity: HOVERED ? IDLE ?  ← change 1 for idle opacity
                      animate={{
                        opacity: 1,
                        scale: open ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-[7px] h-[7px] rounded-md bg-white"
                    />
                  </div>

                  {/* Leader line — elbow: travels up/down from the node,
                        then runs out to the panel (drawn in sequence). */}
                  <motion.div
                    animate={{ scaleY: open ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute left-0 w-px bg-white/50 pointer-events-none"
                    style={{
                      top: up ? -c.drop : 0,
                      height: c.drop,
                      transformOrigin: up ? "bottom" : "top",
                    }}
                  />
                  <motion.div
                    animate={{ scaleX: open ? 1 : 0 }}
                    transition={{
                      duration: 0.35,
                      ease: "easeOut",
                      delay: open ? 0.22 : 0,
                    }}
                    className="absolute h-px bg-white/50 pointer-events-none"
                    style={{
                      top: elbowY,
                      width: c.lineLength,
                      left: right ? 0 : -c.lineLength,
                      transformOrigin: right ? "left" : "right",
                    }}
                  />

                  {/* Text panel — sits at the elbow's horizontal run */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: elbowY,
                      width: c.panelWidth,
                      left: right ? c.lineLength + 8 : undefined,
                      right: right ? undefined : c.lineLength + 8,
                      transform: "translateY(-50%)",
                    }}
                  >
                    {/* ░░░ CALLOUT PANEL STYLES — shared by NODES 1, 2 & 3 ░░░
                          • Panel plate / blur / padding → the className below
                            (bg-black/40, backdrop-blur, px-3 py-2.5)
                          • Heading font/size           → the <h3> className
                          • Paragraph font/size         → the <p> className
                          Changing these affects ALL three callouts. */}
                    <motion.div
                      animate={{
                        opacity: open ? 1 : 0,
                        x: open ? 0 : right ? -6 : 6,
                      }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                        delay: open ? 0.4 : 0,
                      }}
                      className="flex items-stretch gap-3 bg-black/70 backdrop-blur-[5px] px-3 py-2.5 "
                    >
                      <div className="text-left">
                        {/* HEADING + underline grouped in w-fit so the line
                              hugs the HEADER width (not the paragraph width). */}
                        <div className="w-fit mb-[9px]">
                          {/* HEADING (label) font/size/color */}
                          <h3 className="text-[11px] tracking-[0.08em] uppercase text-white/90 leading-tight font-brand-bold mb-[2px]">
                            {c.label}
                          </h3>
                          {/* Header underline — tweak color/spacing here */}
                          <div className="h-px w-full bg-white" />
                        </div>
                        {/* PARAGRAPH (body) font/size/color */}
                        <p className="text-[8.5px] tracking-[0em] text-white/55 leading-relaxed font-brand-secondary-thin text-justify">
                          {c.body}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Cursor-attached tag — desktop only, on hitbox hover. Sits OUTSIDE
              the scaled layer so its fixed position tracks the viewport. */}
          {!isMobile && (
            <motion.div
              style={{ left: x, top: y }}
              animate={{ opacity: hitboxHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 z-[80] translate-x-5 translate-y-5 pointer-events-none flex items-center gap-2 bg-black/80 border border-white/10 backdrop-blur-sm px-3 py-2"
            >
              <img
                src="/right-click.png"
                alt=""
                className="w-5 h-auto filter brightness-110"
              />
              <span className="font-brand-cn text-[10px] uppercase tracking-[0.3em] text-white whitespace-nowrap">
                View The Methodology
              </span>
            </motion.div>
          )}

          {/* --- METHODOLOGY PROCESS ---
              Desktop: Porsche-style horizontal drag carousel.
              Mobile:  full-screen vertical stack that scrolls. */}
          <AnimatePresence>
            {showProcess &&
              (isMobile ? (
                /* ░░░ MOBILE — vertical stacked cards (fixed to viewport, so it
                   escapes the 300vw horizontal-scroll strip) ░░░ */
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 120 }}
                  className="fixed inset-0 w-screen h-screen bg-black/90 backdrop-blur-sm z-[100] flex flex-col overflow-y-auto overscroll-contain"
                >
                  {/* Sticky header — close on the LEFT (contact-page formatting) */}
                  <div className="sticky top-0 z-10 flex items-center px-8 pt-25 pb-5">
                    <button
                      onClick={() => setShowProcess(false)}
                      aria-label="Close"
                      className="flex items-center text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      {/* Custom chevron — sharp corner (miter) + sharp/long ends.
                          Lengthen arms: edit the path. Thickness: strokeWidth. */}
                      <svg
                        width="8"
                        height="44"
                        viewBox="0 0 26 44"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      >
                        <path d="M22 2 L4 22 L22 42" />
                      </svg>
                    </button>
                  </div>

                  {/* Stacked cards */}
                  <div className="flex flex-col gap-5 px-8 pb-16">
                    {STEPS.map((step) => (
                      <div
                        key={step.id}
                        className="group w-full h-[46vh] flex flex-col justify-end overflow-hidden relative border border-white/70 lg:border-white/20 lg:hover:border-white/70 border-[1px] lg:border-[2px] rounded-sm duration-900"
                      >
                        <div className="absolute inset-0 z-0">
                          {/* Real <img> (AVIF→WEBP) decodes async — no progressive
                              "scanner" load like the old large background PNG. */}
                          <picture>
                            <source
                              srcSet={`${step.img}.avif`}
                              type="image/avif"
                            />
                            <img
                              src={`${step.img}.webp`}
                              alt=""
                              decoding="async"
                              loading="eager"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </picture>
                          {/* Bottom-up dark gradient (unchanged) */}
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)",
                            }}
                          />
                        </div>
                        {/* SCAN LINES — same as Narrative pillars (always on mobile) */}
                        <div className="absolute inset-0 z-[5] pointer-events-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                          <div
                            className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
                              backgroundSize: "100% 3px",
                            }}
                          />
                        </div>
                        <div className="relative z-10 flex flex-col justify-end h-full p-6">
                          <h3 className="text-white text-[30px] tracking-[0.3em] uppercase mb-3 font-brand-other">
                            {step.title}
                          </h3>
                          <p className="text-white/50 text-[12px] leading-relaxed font-brand-secondary-thin text-justify">
                            <span className="font-brand-cn text-[16px] text-orange-600">
                              *{" "}
                            </span>
                            {step.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ░░░ DESKTOP — horizontal drag carousel ░░░ */
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 120 }}
                  className="absolute bottom-0 left-0 w-full h-[150vh] bg-gradient-to-t from-[#000] via-black/90 to-transparent z-[60] flex flex-col justify-end overflow-hidden"
                >
                  <div
                    className="absolute inset-0 z-0 cursor-default"
                    onClick={() => setShowProcess(false)}
                  />

                  <div className="relative z-10 px-12 mb-8 flex justify-between items-center pointer-events-none gap-4">
                    <span className="text-[12px] tracking-[0.6em] text-white/80 uppercase font-brand-secondary-thin">
                      JUDAION METHODOLOGY | EST. 2025
                    </span>
                    {/* Close hint — styled like the cursor tags, icon on the right */}
                    <div className="flex items-center gap-2 bg-black/70 border border-white/10 backdrop-blur-sm px-3 py-2">
                      <img
                        src="/right-click.png"
                        alt=""
                        className="w-5 h-auto filter brightness-110"
                      />
                      <span className="font-brand-cn text-[10px] uppercase tracking-[0.3em] text-white whitespace-nowrap">
                        Click above to close
                      </span>
                    </div>
                  </div>

                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -1050, right: 0 }}
                    dragTransition={{
                      power: 0.1,
                      timeConstant: 350,
                      modifyTarget: (target) => Math.round(target),
                    }}
                    dragElastic={0.05}
                    className="relative z-10 flex space-x-6 px-12 cursor-grab active:cursor-grabbing mb-12"
                  >
                    {STEPS.map((step) => (
                      <div
                        key={step.id}
                        className="min-w-[700px] h-[650px] flex flex-col justify-end group transition-all overflow-hidden relative border border-white/70 lg:border-white/20 lg:hover:border-white/70 border-[1px] lg:border-[2px] rounded-sm duration-900 cursor-grab active:cursor-grabbing"
                      >
                        <div className="absolute inset-0 z-0">
                          {/* Real <img> (AVIF→WEBP) decodes async — no progressive
                              "scanner" load like the old large background PNG. */}
                          <picture>
                            <source
                              srcSet={`${step.img}.avif`}
                              type="image/avif"
                            />
                            <img
                              src={`${step.img}.webp`}
                              alt=""
                              decoding="async"
                              loading="eager"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </picture>
                          {/* Bottom-up dark gradient (unchanged) */}
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)",
                            }}
                          />
                        </div>
                        {/* SCAN LINES — same as Narrative pillars (fade in on hover) */}
                        <div className="absolute inset-0 z-[5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div
                            className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
                              backgroundSize: "100% 3px",
                            }}
                          />
                        </div>
                        <div className="relative z-10 flex flex-col justify-end h-full p-8">
                          <h3 className="text-white text-[55px] tracking-[0.55em] uppercase mb-4 font-brand-other flex items-center">
                            {step.title}
                          </h3>
                          <p className="text-white/50 text-[19px] tracking-[0em] leading-relaxed font-brand-secondary-thin text-justify">
                            <span className="font-brand-cn text-[clamp(16px,1.04vw,20px)] text-orange-600">
                              *{" "}
                            </span>
                            {step.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              ))}
          </AnimatePresence>

          {/* --- NAVIGATION & INSTRUCTIONS --- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-4 pointer-events-none method-instructions-mobile"
          >
            <img
              src={isMobile ? "/tap-icon.png" : "/scroll-up.png"}
              alt={isMobile ? "Tap" : "Scroll Up"}
              className="w-15 h-15 opacity-80 method-instruction-icon-mobile"
            />
            <span className="text-[17px] tracking-[0.5em] uppercase text-white/80 font-brand-cn whitespace-nowrap">
              {isMobile
                ? "Tap to view methodology"
                : isZoomed
                  ? "Scroll Down to Exit"
                  : "Scroll Up to Inspect"}
            </span>
          </motion.div>

          {/* Floor Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-12 left-12 z-50 pointer-events-auto"
          >
            <Link
              href="/"
              className="flex flex-col items-start group no-underline bg-transparent border-none cursor-pointer"
            >
              <motion.img
                src="/exit-the-studio-1.webp"
                className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                animate={{ x: [0, -5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="flex flex-col font-brand-secondary-thin text-left">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light">
                  Previous Floor
                </span>
                <span className="text-[12px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500">
                  Exit The Studio
                </span>
              </div>
            </Link>
          </motion.div>

          {/* NEXT FLOOR (BOTTOM RIGHT) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 right-12 z-50 pointer-events-auto"
          >
            <Link
              href="/services"
              className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right"
            >
              <motion.img
                src="/upstairs.webp"
                className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="flex flex-col items-end font-brand-secondary-thin text-right">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-brand-secondary-thin">
                  Next Floor
                </span>
                <span className="text-[12px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                  02 Services
                </span>
              </div>
            </Link>
          </motion.div>

          <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
        </div>
      </div>
    </main>
  );
}
