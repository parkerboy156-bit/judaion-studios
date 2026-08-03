"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as React from "react";
import Link from "next/link";
import ElevatorArrow from "./ElevatorArrow";
import servicesBgAvif from "@/public/service-home-bg.avif";

export default function ServicesHome() {
  // MOUSE PARALLAX LOGIC (PRESERVED)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 110, damping: 25 });
  const mouseY = useSpring(y, { stiffness: 110, damping: 25 });

  const bgMoveX = useTransform(mouseX, [0, 1920], ["1.6%", "-1.6%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1.6%", "-1.6%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  // ─────────────────────────────────────────────
  // HITBOX TUNING — position/size as % of the background layer so they
  // track the image and don't drift across screen sizes. Adjust freely.
  // ─────────────────────────────────────────────
  const HITBOXES = [
    {
      path: "/tier-1",
      tag: "ASSET 3",
      name: "FOUNDATION",
      top: "18.5%",
      left: "11%",
      width: "23.4%",
      height: "65.5%",
      rotate: "0deg",
    },
    {
      path: "/tier-2",
      tag: "ASSET 4",
      name: "FRONT-DOOR",
      top: "18.5%",
      left: "38.5%",
      width: "23.5%",
      height: "65.5%",
      rotate: "0deg",
    },
    {
      path: "/tier-3",
      tag: "ASSET 5",
      name: "THE ARCHITECTURE",
      top: "18.5%",
      left: "65.9%",
      width: "23.7%",
      height: "65.5%",
      rotate: "0deg",
    },
  ];

  // ─────────────────────────────────────────────
  // MOBILE HITBOXES — always-on (no hover). Positioned as % of the FULL
  // image (which mobile shows uncropped), so these differ from the desktop
  // set above. Measured off the three posters; tune freely.
  // ─────────────────────────────────────────────
  const HITBOXES_MOBILE = [
    {
      path: "/tier-1",
      tag: "ASSET 3",
      name: "FOUNDATION",
      top: "25%",
      left: "10.4%",
      width: "25%",
      height: "53%",
    },
    {
      path: "/tier-2",
      tag: "ASSET 4",
      name: "FRONT-DOOR",
      top: "25%",
      left: "37.8%",
      width: "25%",
      height: "53%",
    },
    {
      path: "/tier-3",
      tag: "ASSET 5",
      name: "THE ARCHITECTURE",
      top: "25%",
      left: "65%",
      width: "25%",
      height: "53%",
    },
  ];

  // ─────────────────────────────────────────────
  // MOBILE BOX STYLING — independent of desktop. Tweak freely:
  //   lineOpacity   → outline line opacity (0–1). Lower = dimmer, less stark white.
  //   handleSize    → corner box size in px.
  //   handleOpacity → corner box opacity (0–1). Lower = dimmer.
  //   scanTint      → darkness of the always-on scan overlay (0–1).
  // ─────────────────────────────────────────────
  const MOBILE_SELECTION = {
    lineOpacity: 0.4,
    handleSize: 6,
    handleOpacity: 0.55,
    scanTint: 0.25,
  };

  // Selection-box hover visuals (shared across all hitboxes)
  const SELECTION = {
    lineOpacity: 0.65,
    handleSize: 7.5,
    lineDuration: 0.4,
    cornerDelay: 0.35,
    cornerDuration: 0.18,
  };

  const [hoveredBox, setHoveredBox] = React.useState<string | null>(null);
  const [hoverCoords, setHoverCoords] = React.useState({ x: 0, y: 0 });
  // Name of the hovered tier, shown in the cursor tag. Not cleared on leave so
  // the label stays put while the tag fades out.
  const [tagName, setTagName] = React.useState("");

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <main className="relative bg-black">
      <div
        onMouseMove={handleMouseMove}
        className={`relative h-screen bg-black select-none ${
          isMobile ? "overflow-x-auto overflow-y-hidden overscroll-x-none" : "overflow-hidden"
        }`}
      >
        <motion.section
          className={`relative h-screen bg-black overflow-hidden flex-shrink-0 ${
            isMobile ? "w-max" : "w-full"
          }`}
        >
          {/*
            BACKGROUND LAYER.
            Desktop: CSS background cover + scale(1.05) buffer + x/y parallax translate.
            Mobile: a real <img> at h-full w-auto defines the scroll width from the
            image's natural aspect — fills edge-to-edge, no black gap or cutoff.
            The motion.div below then becomes a transparent overlay for the label.
          */}
          {isMobile && (
            <motion.img
              src={servicesBgAvif.src}
              alt=""
              draggable={false}
              className="h-full w-auto max-w-none block select-none pointer-events-none"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
            />
          )}
          <motion.div
            style={
              isMobile
                ? {}
                : {
                    x: bgMoveX,
                    y: bgMoveY,
                    scale: 1.03,
                    backgroundImage: `url(${servicesBgAvif.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.95,
                  }
            }
            className={`absolute inset-0 origin-center ${isMobile ? "pointer-events-none" : ""}`}
            initial={false}
            animate={{ opacity: isMobile ? 1 : 0.95 }}
            transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
          >
            {/* MASTER INSTRUCTION LABEL — mobile only (desktop uses cursor tags) */}
            {isMobile && (
              <div className="absolute top-[13%] left-1/2 -translate-x-1/2 flex items-center space-x-3 opacity-80 pointer-events-none mobile-inspect-fix-services">
                <span className="text-[16px] tracking-[0.3em] uppercase text-white font-brand-cn whitespace-nowrap">
                  TAP A TIER TO ENTER
                </span>
                <img
                  src="/tap-icon.png"
                  alt="Tap Icon"
                  className="w-9 h-auto filter brightness-110"
                />
              </div>
            )}

            {/* --- HIT BOXES with selection-box hover effect — %-positioned children of bg layer (DESKTOP ONLY) --- */}
            {!isMobile &&
              HITBOXES.map((box) => {
                const active = hoveredBox === box.path;
                // Borders + scan-lines reveal on hover only.
                const reveal = active ? 1 : 0;
                return (
                  <div
                    key={box.path}
                    className="absolute z-20 pointer-events-auto"
                    style={{
                      top: box.top,
                      left: box.left,
                      width: box.width,
                      height: box.height,
                      transform: `rotate(${box.rotate})`,
                    }}
                    onMouseEnter={() => {
                      setHoveredBox(box.path);
                      setTagName(box.name);
                    }}
                    onMouseLeave={() => setHoveredBox(null)}
                    onMouseMove={(e) =>
                      setHoverCoords({
                        x: Math.round(e.clientX),
                        y: Math.round(e.clientY),
                      })
                    }
                  >
                    <Link
                      href={box.path}
                      className="absolute inset-0 cursor-pointer"
                    />

                    {/* Scan lines — fade in on hover (half during the intro peek) */}
                    <motion.div
                      animate={{ opacity: reveal }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 overflow-hidden pointer-events-none bg-black/[0.15]"
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
                          backgroundImage:
                            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
                          backgroundSize: "100% 3px",
                        }}
                      />
                    </motion.div>

                    {/* Edge lines */}
                    <motion.div
                      animate={{ scaleX: reveal }}
                      transition={{
                        duration: SELECTION.lineDuration,
                        ease: "easeOut",
                      }}
                      className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                      style={{
                        transformOrigin: "center",
                        backgroundColor: `rgba(255,255,255,${SELECTION.lineOpacity})`,
                      }}
                    />
                    <motion.div
                      animate={{ scaleX: reveal }}
                      transition={{
                        duration: SELECTION.lineDuration,
                        ease: "easeOut",
                      }}
                      className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                      style={{
                        transformOrigin: "center",
                        backgroundColor: `rgba(255,255,255,${SELECTION.lineOpacity})`,
                      }}
                    />
                    <motion.div
                      animate={{ scaleY: reveal }}
                      transition={{
                        duration: SELECTION.lineDuration,
                        ease: "easeOut",
                      }}
                      className="absolute top-0 bottom-0 left-0 w-px pointer-events-none"
                      style={{
                        transformOrigin: "center",
                        backgroundColor: `rgba(255,255,255,${SELECTION.lineOpacity})`,
                      }}
                    />
                    <motion.div
                      animate={{ scaleY: reveal }}
                      transition={{
                        duration: SELECTION.lineDuration,
                        ease: "easeOut",
                      }}
                      className="absolute top-0 bottom-0 right-0 w-px pointer-events-none"
                      style={{
                        transformOrigin: "center",
                        backgroundColor: `rgba(255,255,255,${SELECTION.lineOpacity})`,
                      }}
                    />

                    {/* Corner handles — centered on each corner intersection */}
                    {(
                      [
                        {
                          top: -SELECTION.handleSize / 2,
                          left: -SELECTION.handleSize / 2,
                        },
                        {
                          top: -SELECTION.handleSize / 2,
                          right: -SELECTION.handleSize / 2,
                        },
                        {
                          bottom: -SELECTION.handleSize / 2,
                          left: -SELECTION.handleSize / 2,
                        },
                        {
                          bottom: -SELECTION.handleSize / 2,
                          right: -SELECTION.handleSize / 2,
                        },
                      ] as React.CSSProperties[]
                    ).map((pos, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: active ? 1 : 0 }}
                        transition={{
                          duration: SELECTION.cornerDuration,
                          delay: active ? SELECTION.cornerDelay : 0,
                        }}
                        className="absolute bg-white pointer-events-none"
                        style={{
                          width: SELECTION.handleSize,
                          height: SELECTION.handleSize,
                          ...pos,
                        }}
                      />
                    ))}

                    {/* Right-side X/Y coordinate display */}
                    <motion.div
                      animate={{ opacity: active ? 1 : 0, x: active ? 0 : -4 }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                        delay: active ? 0.1 : 0,
                      }}
                      className="absolute top-0 pointer-events-none flex flex-col gap-[3px]"
                      style={{ left: "calc(100% + 10px)" }}
                    >
                      <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                        <span className="text-white">X: </span>
                        <span className="text-white/50">
                          {hoverCoords.x} PX
                        </span>
                      </span>
                      <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                        <span className="text-white">Y: </span>
                        <span className="text-white/50">
                          {hoverCoords.y} PX
                        </span>
                      </span>
                    </motion.div>

                    {/* Below-hitbox description label */}
                    <motion.div
                      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 4 }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                        delay: active ? 0.15 : 0,
                      }}
                      className="absolute left-0 right-0 pointer-events-none"
                      style={{ top: "calc(100% + 8px)" }}
                    >
                      <span className="font-brand-cn text-[10px] uppercase tracking-[0.2em] text-white">
                        {box.tag}:
                        <span className="text-white/50"> {`"${box.name}"`}</span>
                      </span>
                    </motion.div>
                  </div>
                );
              })}

            {/* --- MOBILE HIT BOXES — always-on (scan + outline + label), tap to enter --- */}
            {isMobile &&
              HITBOXES_MOBILE.map((box) => (
                <motion.div
                  key={box.path}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
                  className="absolute z-20 pointer-events-auto"
                  style={{
                    top: box.top,
                    left: box.left,
                    width: box.width,
                    height: box.height,
                  }}
                >
                  <Link
                    href={box.path}
                    aria-label={box.name}
                    className="absolute inset-0 z-10 cursor-pointer"
                  />

                  {/* Scan lines — always scrolling */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ backgroundColor: `rgba(0,0,0,${MOBILE_SELECTION.scanTint})` }}
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
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
                        backgroundSize: "100% 3px",
                      }}
                    />
                  </div>

                  {/* Outline — static, always visible */}
                  <span
                    className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{ backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})` }}
                  />
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                    style={{ backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})` }}
                  />
                  <span
                    className="absolute top-0 bottom-0 left-0 w-px pointer-events-none"
                    style={{ backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})` }}
                  />
                  <span
                    className="absolute top-0 bottom-0 right-0 w-px pointer-events-none"
                    style={{ backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})` }}
                  />

                  {/* Corner handles — static */}
                  {(
                    [
                      { top: -MOBILE_SELECTION.handleSize / 2, left: -MOBILE_SELECTION.handleSize / 2 },
                      { top: -MOBILE_SELECTION.handleSize / 2, right: -MOBILE_SELECTION.handleSize / 2 },
                      { bottom: -MOBILE_SELECTION.handleSize / 2, left: -MOBILE_SELECTION.handleSize / 2 },
                      { bottom: -MOBILE_SELECTION.handleSize / 2, right: -MOBILE_SELECTION.handleSize / 2 },
                    ] as React.CSSProperties[]
                  ).map((pos, i) => (
                    <span
                      key={i}
                      className="absolute pointer-events-none"
                      style={{
                        width: MOBILE_SELECTION.handleSize,
                        height: MOBILE_SELECTION.handleSize,
                        backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.handleOpacity})`,
                        ...pos,
                      }}
                    />
                  ))}

                  {/* Label caption — always visible */}
                  <div
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: "calc(100% + 8px)" }}
                  >
                    <span className="font-brand-cn text-[10px] uppercase tracking-[0.2em] text-white">
                      {box.tag}:<span className="text-white/50"> {`"${box.name}"`}</span>
                    </span>
                  </div>
                </motion.div>
              ))}
          </motion.div>

          {/* Cursor-attached tag — desktop only, shown while hovering any tier.
              Outside the parallax layer so its fixed position tracks the viewport.
              Same formatting as the contact / project archive pages. */}
          {!isMobile && (
            <motion.div
              style={{ left: x, top: y }}
              animate={{ opacity: hoveredBox ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 z-[80] translate-x-5 translate-y-5 pointer-events-none flex items-center gap-2 bg-black/70 border border-white/10 backdrop-blur-sm px-3 py-2"
            >
              <img
                src="/right-click.png"
                alt=""
                className="w-5 h-auto filter brightness-110"
              />
              <span className="font-brand-cn text-[10px] uppercase tracking-[0.3em] text-white whitespace-nowrap">
                Enter {tagName}
              </span>
            </motion.div>
          )}

          {/* --- FLOOR NAVIGATION (PRESERVED) --- */}

          {/* PREVIOUS FLOOR (BOTTOM LEFT) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 left-12 z-50 pointer-events-auto"
          >
            <Link
              href="/methodology"
              className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer"
            >
              <ElevatorArrow src="/elevator-down.png" dir="down" className="w-23 mb-2" />
              <div className="flex flex-col items-start font-brand-secondary-thin text-left">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-brand-secondary-thin">
                  Previous Floor
                </span>
                <span className="text-[12px] tracking-[0.6em] uppercase text-white/800 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                  01 Methodology
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
              href="/projectarchive"
              className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right"
            >
              <ElevatorArrow src="/elevator-up.png" dir="up" className="w-23 mb-2" />
              <div className="flex flex-col items-end font-brand-secondary-thin text-right">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-brand-secondary-thin">
                  Next Floor
                </span>
                <span className="text-[12px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                  03 Project Archive
                </span>
              </div>
            </Link>
          </motion.div>

          <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
        </motion.section>
      </div>
    </main>
  );
}
