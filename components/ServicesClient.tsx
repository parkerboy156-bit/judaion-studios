"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as React from "react";
import Link from "next/link";
import servicesBgAvif from "@/public/service-home-bg.avif";

export default function ServicesHome() {
  // MOUSE PARALLAX LOGIC (PRESERVED)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const bgMoveX = useTransform(mouseX, [0, 1920], ["1%", "-1%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1%", "-1%"]);

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
      tag: "ASSET 1",
      name: "FOUNDATION",
      top: "18.5%",
      left: "11%",
      width: "23.4%",
      height: "65.5%",
      rotate: "0deg",
    },
    {
      path: "/tier-2",
      tag: "ASSET",
      name: "FRONT-DOOR",
      top: "18.5%",
      left: "38.5%",
      width: "23.5%",
      height: "65.5%",
      rotate: "0deg",
    },
    {
      path: "/tier-3",
      tag: "ASSET",
      name: "ARCHITECTURE",
      top: "18.5%",
      left: "65.9%",
      width: "23.7%",
      height: "65.5%",
      rotate: "0deg",
    },
  ];

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

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
        className={`relative h-screen bg-black select-none ${
          isMobile ? "overflow-x-auto overflow-y-hidden" : "overflow-hidden"
        }`}
      >
        <motion.section
          className={`relative h-screen bg-black overflow-hidden flex-shrink-0 ${
            isMobile ? "w-[300vw]" : "w-full"
          }`}
        >
          {/*
            PARALLAX BACKGROUND LAYER — archive-style background-image setup.
            Desktop: background-size cover + scale(1.05) buffer + x/y parallax translate.
            Mobile: min-w-[300vw] div, background-size auto 100% to preserve full image width (native scroll).
          */}
          <motion.div
            style={
              isMobile
                ? {
                    backgroundImage: `url(${servicesBgAvif.src})`,
                    backgroundSize: "auto 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left center",
                  }
                : {
                    x: bgMoveX,
                    y: bgMoveY,
                    scale: 1.05,
                    backgroundImage: `url(${servicesBgAvif.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.95,
                  }
            }
            className={`${isMobile ? "absolute top-0 left-0 min-w-[300vw] h-full" : "absolute inset-0"} origin-center`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isMobile ? 1 : 0.95 }}
            transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
          >
            {/* MASTER INSTRUCTION LABEL (PRESERVED) */}
            <div
              className={`absolute top-[08%] left-1/2 -translate-x-1/2 flex items-center space-x-3 opacity-80 pointer-events-none ${isMobile ? "mobile-inspect-fix-services" : ""}`}
            >
              <span className="text-[15px] tracking-[0.6em] uppercase text-white font-brand-secondary-thin whitespace-nowrap">
                {isMobile
                  ? "SERVICES ONLY VIEWABLE ON DESKTOP"
                  : "CLICK ITEMS TO ENTER"}
              </span>
              {!isMobile && (
                <img
                  src="/right-click.png"
                  alt="Inspect Icon"
                  className="w-14 h-auto filter brightness-110"
                />
              )}
            </div>

            {/* --- HIT BOXES with selection-box hover effect — %-positioned children of bg layer (DESKTOP ONLY) --- */}
            {!isMobile &&
              HITBOXES.map((box) => {
                const active = hoveredBox === box.path;
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
                    onMouseEnter={() => setHoveredBox(box.path)}
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

                    {/* Scan lines — fade in on hover, scroll upward continuously */}
                    <motion.div
                      animate={{ opacity: active ? 1 : 0 }}
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
                            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 12px)",
                          backgroundSize: "100% 12px",
                        }}
                      />
                    </motion.div>

                    {/* Edge lines */}
                    <motion.div
                      animate={{ scaleX: active ? 1 : 0 }}
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
                      animate={{ scaleX: active ? 1 : 0 }}
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
                      animate={{ scaleY: active ? 1 : 0 }}
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
                      animate={{ scaleY: active ? 1 : 0 }}
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
                        <span className="text-white/50"> "{box.name}"</span>
                      </span>
                    </motion.div>
                  </div>
                );
              })}
          </motion.div>

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
              <motion.img
                src="/down-stairs-last-floor.webp"
                className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                animate={{ x: [0, -5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
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
              <motion.img
                src="/next-floor.webp"
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
