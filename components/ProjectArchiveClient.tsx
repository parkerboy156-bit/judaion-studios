"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import projectArchiveBgAvif from "@/public/project-archive-home-bg.avif";

// ─────────────────────────────────────────────
// HITBOX TUNING — adjust these values freely
// ─────────────────────────────────────────────
const HITBOX = {
  // Position (% of the background container)
  top:    "15%",
  left:   "64%",

  // Size (% of the background container)
  width:  "23.7%",
  height: "50%",

  // Rotation — positive = clockwise, negative = counter-clockwise
  rotate: "-4deg",

  // Selection box line opacity (0–1)
  lineOpacity: 0.65,

  // Corner handle size in px
  handleSize: 7.5,

  // Animation speed (seconds)
  lineDuration:   0.4,
  cornerDelay:    0.35,
  cornerDuration: 0.18,
};
// ─────────────────────────────────────────────

export default function ProjectArchive() {
  const [isMobile, setIsMobile] = useState(false);
  const [hitboxHovered, setHitboxHovered] = useState(false);
  const [hoverCoords, setHoverCoords] = useState({ x: 0, y: 0 });

  // INTRO PEEK — half-opens the hitbox on load to signal interactivity
  const [peekOn, setPeekOn] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Replays a partial "peek" of the selection box until the user first hovers,
  // telegraphing that the region is interactive. Desktop only.
  useEffect(() => {
    if (isMobile || hasInteracted) return;
    const peek = () => {
      setPeekOn(true);
      window.setTimeout(() => setPeekOn(false), 650); // hold half-open briefly
    };
    const start = window.setTimeout(peek, 1200); // wait out the intro fade
    const loop = window.setInterval(peek, 3200); // replay every few seconds
    return () => {
      window.clearTimeout(start);
      window.clearInterval(loop);
    };
  }, [isMobile, hasInteracted]);

  // Reveal target: full on hover, ~half during the intro peek, otherwise hidden.
  const revealTarget = hitboxHovered ? 1 : peekOn ? 0.6 : 0;

  // MOUSE PARALLAX LOGIC
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const bgMoveX = useTransform(mouseX, [0, 1920], ["1.5%", "-1.5%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1.5%", "-1.5%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    x.set(e.clientX);
    y.set(e.clientY);
  };

  return (
    <main className="relative bg-black">
      <div
        onMouseMove={handleMouseMove}
        className={`relative w-full h-screen bg-black ${isMobile ? "overflow-x-auto overflow-y-hidden overscroll-x-none block" : "overflow-hidden"}`}
      >
        {/*
          BACKGROUND + HITBOX — single motion.div carries both.
          Desktop: CSS background cover + scale(1.05) parallax buffer + x/y translate.
          Mobile: real <img> at h-full w-auto defines the scroll width from the
          image's natural aspect — fills edge-to-edge with no black gap or cutoff.
        */}
        <motion.div
          style={
            isMobile
              ? {}
              : {
                  x: bgMoveX,
                  y: bgMoveY,
                  scale: 1.05,
                  backgroundImage: `url(${projectArchiveBgAvif.src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.95,
                }
          }
          className={`${isMobile ? "absolute top-0 left-0 h-full w-auto" : "absolute inset-0"}`}
          initial={false}
          animate={{ opacity: isMobile ? 1 : 0.95 }}
          transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
        >
          {/* MOBILE BG — real <img> defines the scroll width from its natural
              aspect (never cropped), so the page scrolls to the true image edge. */}
          {isMobile && (
            <img
              src={projectArchiveBgAvif.src}
              alt=""
              draggable={false}
              className="h-full w-auto max-w-none block select-none pointer-events-none"
            />
          )}

          {/* HITBOX */}
          {isMobile ? (
            <Link
              href="/archivecatalogue"
              style={{ top: HITBOX.top, left: HITBOX.left, width: HITBOX.width, height: HITBOX.height }}
              className="absolute z-50 cursor-pointer"
            />
          ) : (
            <div
              className="absolute z-50"
              style={{
                top: HITBOX.top,
                left: HITBOX.left,
                width: HITBOX.width,
                height: HITBOX.height,
                transform: `rotate(${HITBOX.rotate})`,
              }}
              onMouseEnter={() => {
                setHitboxHovered(true);
                setHasInteracted(true); // stop the intro peek loop
                setPeekOn(false);
              }}
              onMouseLeave={() => setHitboxHovered(false)}
              onMouseMove={(e) => { setHoverCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) }); }}
            >
              <Link href="/archivecatalogue" className="absolute inset-0 cursor-pointer" />

              {/* Peek-only faint black fill — draws a little attention during
                  the peek WITHOUT the scan-line texture (scan lines stay
                  hover-only). Tune the bg-black/[..] value for darkness. */}
              <motion.div
                animate={{ opacity: peekOn && !hitboxHovered ? 1 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none bg-black/[0.08]"
              />

              {/* Scan lines — HOVER ONLY (kept out of the peek so the peek shows
                  just the border lines + faint fill, not a filled rectangle). */}
              <motion.div
                animate={{ opacity: hitboxHovered ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 overflow-hidden pointer-events-none bg-black/[0.10]"
              >
                <motion.div
                  animate={{ y: ["0px", "-12px"] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-12px]"
                  style={{
                    // CRT-style scan lines: 1px line + 2px gap (3px period).
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.20) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 3px)",
                    backgroundSize: "100% 3px",
                  }}
                />
              </motion.div>

              {/* Top line */}
              <motion.div
                animate={{ scaleX: revealTarget }}
                transition={{ duration: HITBOX.lineDuration, ease: "easeOut" }}
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{ transformOrigin: "center", backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})` }}
              />
              {/* Bottom line */}
              <motion.div
                animate={{ scaleX: revealTarget }}
                transition={{ duration: HITBOX.lineDuration, ease: "easeOut" }}
                className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                style={{ transformOrigin: "center", backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})` }}
              />
              {/* Left line */}
              <motion.div
                animate={{ scaleY: revealTarget }}
                transition={{ duration: HITBOX.lineDuration, ease: "easeOut" }}
                className="absolute top-0 bottom-0 left-0 w-px pointer-events-none"
                style={{ transformOrigin: "center", backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})` }}
              />
              {/* Right line */}
              <motion.div
                animate={{ scaleY: revealTarget }}
                transition={{ duration: HITBOX.lineDuration, ease: "easeOut" }}
                className="absolute top-0 bottom-0 right-0 w-px pointer-events-none"
                style={{ transformOrigin: "center", backgroundColor: `rgba(255,255,255,${HITBOX.lineOpacity})` }}
              />

              {/* Corner handles — centered on each corner intersection */}
              {([
                { top: -HITBOX.handleSize / 2, left: -HITBOX.handleSize / 2 },
                { top: -HITBOX.handleSize / 2, right: -HITBOX.handleSize / 2 },
                { bottom: -HITBOX.handleSize / 2, left: -HITBOX.handleSize / 2 },
                { bottom: -HITBOX.handleSize / 2, right: -HITBOX.handleSize / 2 },
              ] as React.CSSProperties[]).map((pos, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: hitboxHovered ? 1 : 0 }}
                  transition={{ duration: HITBOX.cornerDuration, delay: hitboxHovered ? HITBOX.cornerDelay : 0 }}
                  className="absolute bg-white pointer-events-none"
                  style={{ width: HITBOX.handleSize, height: HITBOX.handleSize, ...pos }}
                />
              ))}

              {/* Right-side X/Y coordinate display */}
              <motion.div
                animate={{ opacity: hitboxHovered ? 1 : 0, x: hitboxHovered ? 0 : -4 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: hitboxHovered ? 0.1 : 0 }}
                className="absolute top-0 pointer-events-none flex flex-col gap-[3px]"
                style={{ left: "calc(100% + 10px)" }}
              >
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                  <span className="text-white">X: </span><span className="text-white/50">{hoverCoords.x} PX</span>
                </span>
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                  <span className="text-white">Y: </span><span className="text-white/50">{hoverCoords.y} PX</span>
                </span>
              </motion.div>

              {/* Below-hitbox description label */}
              <motion.div
                animate={{ opacity: hitboxHovered ? 1 : 0, y: hitboxHovered ? 0 : 4 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: hitboxHovered ? 0.15 : 0 }}
                className="absolute left-0 right-0 pointer-events-none"
                style={{ top: "calc(100% + 8px)" }}
              >
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.2em] text-white">
                  ASSET 2:<span className="text-white/50"> "ARCHIVE CATALOUGE"</span>
                </span>
              </motion.div>
            </div>
          )}

          {/* INSPECT INSTRUCTION — mobile only (desktop uses the cursor tag) */}
          {isMobile && (
            <div className="absolute top-[63%] left-[65%] flex items-center space-x-3 pointer-events-none mobile-inspect-fix">
              <img src="/tap-icon.png" alt="Tap Icon" className="w-12 h-auto filter brightness-110" />
              <span className="text-[13px] tracking-[0.3em] uppercase text-white font-brand-cn whitespace-nowrap">
                TAP ITEM TO INSPECT
              </span>
            </div>
          )}
        </motion.div>

        {/* Cursor-attached tag — desktop only, shown on hitbox hover.
            Sits OUTSIDE the parallax wrapper so its fixed position tracks the
            viewport (not the scaled layer). Same formatting as the contact page. */}
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
              Enter The Archive
            </span>
          </motion.div>
        )}

        {/* --- MOBILE NAVIGATION --- */}
        {isMobile && (
          <div className="absolute top-0 left-0 h-full pointer-events-none">
            {/* Hidden spacer image — sizes this layer to the exact same width
                as the background so the nav arrows sit at the true image edges. */}
            <img
              src={projectArchiveBgAvif.src}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-auto max-w-none block invisible"
            />
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-12 left-10 pointer-events-auto"
            >
              <Link
                href="/services"
                className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer"
              >
                <motion.img
                  src="/down-stairs-last-floor.webp"
                  className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                  animate={{ x: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="flex flex-col items-start font-brand-secondary-thin">
                  <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">
                    Previous Floor
                  </span>
                  <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                    02 Services
                  </span>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-12 right-10 pointer-events-auto"
            >
              <Link
                href="/thenarrative"
                className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right"
              >
                <motion.img
                  src="/upstairs.webp"
                  className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="flex flex-col items-end font-secondary-thin text-right">
                  <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">
                    Next Floor
                  </span>
                  <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                    04 The Narrative
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        )}

        {/* --- DESKTOP NAVIGATION --- */}
        {!isMobile && (
          <>
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-12 left-12 z-50 pointer-events-auto"
            >
              <Link
                href="/services"
                className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer"
              >
                <motion.img
                  src="/down-stairs-last-floor.webp"
                  className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                  animate={{ x: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="flex flex-col items-start font-brand-secondary-thin">
                  <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">
                    Previous Floor
                  </span>
                  <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                    02 Services
                  </span>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-12 right-12 z-50 pointer-events-auto"
            >
              <Link
                href="/thenarrative"
                className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right"
              >
                <motion.img
                  src="/upstairs.webp"
                  className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="flex flex-col items-end font-secondary-thin text-right">
                  <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">
                    Next Floor
                  </span>
                  <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                    04 The Narrative
                  </span>
                </div>
              </Link>
            </motion.div>
          </>
        )}
      </div>

    </main>
  );
}
