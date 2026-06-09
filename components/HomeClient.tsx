"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import homeBgAvif from "@/public/home-bg.avif";
import homeBgMobileAvif from "@/public/home-bg-mobile.avif";
import homeBgWebp from "@/public/home-bg.webp";
import homeBgMobilePng from "@/public/home-bg-mobile.webp";

// Door selection-box hitbox — same treatment as the Archive/Services boxes.
// Box is centred on the door's top/left anchor; size as % of the layer. Tune freely.
const DOOR_HITBOX = {
  lineOpacity: 0.65,
  handleSize: 7.5,
  lineDuration: 0.4,
  cornerDelay: 0.35,
  cornerDuration: 0.18,
};
const DOOR_BOX = {
  desktop: "w-[11.5%] h-[35.5%]",
  mobile: "w-[11.5%] h-[27.5%]",
};

export default function Home({ isLoaded = true }: { isLoaded?: boolean }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasSensorPermission] = useState(false);
  const [doorHovered, setDoorHovered] = useState(false);
  const [doorCoords, setDoorCoords] = useState({ x: 0, y: 0 });

  // Detect if the user is on mobile/tablet
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- MOUSE TRACKING ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  // Parallax: Matches the background image movement
  const moveX = useTransform(mouseX, [0, 1920], ["1.5%", "-1.5%"]);
  const moveY = useTransform(mouseY, [0, 1080], ["1.5%", "-1.5%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return; // Ignore mouse movements on touch devices
    x.set(e.clientX);
    y.set(e.clientY);
  };

  useEffect(() => {
    const lockHeight = () => {
      // Sets a custom property for the actual viewable height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    lockHeight();
    window.addEventListener("resize", lockHeight);
    return () => window.removeEventListener("resize", lockHeight);
  }, []);

  // Mobile Tilt Logic: Binds the phone's physical movement to your parallax values
  useEffect(() => {
    if (!isMobile || !hasSensorPermission) return;

    const handleTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // We map the physical tilt to the virtual 1920x1080 canvas
        const tiltX = ((e.gamma + 45) / 90) * 1920;
        const tiltY = ((e.beta - 20) / 60) * 1080;
        x.set(tiltX);
        y.set(tiltY);
      }
    };

    window.addEventListener("deviceorientation", handleTilt);
    return () => window.removeEventListener("deviceorientation", handleTilt);
  }, [isMobile, hasSensorPermission, x, y]);

  if (!isLoaded) return null;

  const mobilePositions = {
    vision: "top-[19%] left-[13%]",
    structure: "top-[19%] left-[43%]",
    identity: "top-[19%] left-[74%]",
  };

  // Selection box shows on hover (desktop) and is permanently on (mobile).
  const doorActive = true;

  return (
    <div className="relative bg-black overflow-hidden">
      {/* SURGICAL MASK: Only exists on this page, handles the fade-out from black */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
        onAnimationComplete={() => {
          // Optional: remove from DOM if it interferes with clicks
        }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "black",
          zIndex: 99,
          pointerEvents: "none",
        }}
      />

      <motion.div
        className={`relative h-screen bg-black select-none ${
          isMobile
            ? "overflow-x-auto overflow-y-hidden overscroll-x-none"
            : "overflow-hidden"
        }`}
      >
        <section
          onMouseMove={handleMouseMove}
          className={`relative h-screen bg-black overflow-hidden flex-shrink-0 ${
            isMobile ? "w-[300vw]" : "w-full"
          }`}
        >
          {/* TOP HUD: SYSTEM STATS */}
          <motion.div
            animate={{
              opacity: hoveredIndex !== null ? 1 : 0,
              y: hoveredIndex !== null ? 0 : -10,
            }}
            className="absolute top-12 left-0 w-full px-24 flex justify-between items-start z-20 pointer-events-none"
          >
            <div className="flex flex-col space-y-1 mt-2">
              <span className="text-[7px] tracking-[0.4em] uppercase text-white/30 font-brand-secondary-thin">
                Protocol 01 / JDS{" "}
              </span>
            </div>
            <div className="flex flex-col items-end space-y-1 mt-1">
              <span className="text-[7px] tracking-[0.4em] uppercase text-white/30 font-brand-secondary-thin">
                Asset 01
              </span>
            </div>
          </motion.div>

          {/* DYNAMIC BACKGROUND */}
          <motion.div
            onTap={() => isMobile && setHoveredIndex(null)}
            style={{ x: moveX, y: moveY, scale: 1.03 }}
            animate={{
              opacity: hoveredIndex !== null ? 0.4 : 1,
              filter:
                hoveredIndex !== null
                  ? "blur(4px) grayscale(0)"
                  : "blur(0px) grayscale(0)",
            }}
            className="absolute inset-0 z-0 w-full h-full overflow-hidden flex items-center justify-center"
          >
            <picture>
              <source
                srcSet={isMobile ? homeBgMobileAvif.src : homeBgAvif.src}
                type="image/avif"
              />

              {!isMobile && (
                <source srcSet={homeBgWebp.src} type="image/webp" />
              )}

              {/* 3. The Final Component */}
              <img
                // If mobile, we use the PNG. If desktop, we use WebP as the final 'src'.
                // This is because the desktop browser will only reach this if AVIF fails.
                src={isMobile ? homeBgMobilePng.src : homeBgWebp.src}
                alt="JDS Background"
                className="object-cover object-center w-full h-full"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: -1,
                }}
                fetchPriority="high"
              />
            </picture>
          </motion.div>

          {/* PARALLAX CONTENT LAYER */}
          <motion.div
            style={{ x: moveX, y: moveY }}
            drag={isMobile ? "x" : false}
            dragConstraints={{
              left: -2000, // Approximate window.innerWidth * 2 constraint preserved from original logic
              right: 0,
            }}
            dragElastic={0.05}
            className={`absolute inset-0 z-10 pointer-events-none ${
              isMobile ? "w-[300vw]" : "w-full"
            }`}
          >
            {/* MASTER INSTRUCTION LABEL (PRESERVED) */}
            <div
              className={`absolute top-[9.8%] left-1/2 -translate-x-1/2 flex items-center space-x-3 opacity-80 pointer-events-none ${isMobile ? "mobile-inspect-fix-services" : ""}`}
            >
              <span className="text-[13px] tracking-[0.6em] uppercase text-white font-brand-secondary-thin whitespace-nowrap">
                {isMobile ? "TAP TO ENTER THE STUDIO" : "CLICK TO ENTER THE STUDIO"}
              </span>
              {!isMobile && (
                <img
                  src="/right-click.png"
                  alt="Inspect Icon"
                  className="w-14 h-auto filter brightness-110"
                />
              )}
              {isMobile && (
                <img
                  src="/tap-icon.png"
                  alt="Tap Icon"
                  className="w-9 h-auto filter brightness-110"
                />
              )}
            </div>

            {/* --- DOOR HITBOX → Enter the Studio (selection box, same as Archive/Services) --- */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
              onMouseEnter={() => !isMobile && setDoorHovered(true)}
              onMouseLeave={() => !isMobile && setDoorHovered(false)}
              onMouseMove={(e) =>
                !isMobile &&
                setDoorCoords({
                  x: Math.round(e.clientX),
                  y: Math.round(e.clientY),
                })
              }
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto ${
                isMobile
                  ? `top-[53.7%] left-[147vw] ${DOOR_BOX.mobile}`
                  : `top-[54.3%] left-[50%] ${DOOR_BOX.desktop}`
              }`}
            >
              <Link
                href="/methodology"
                aria-label="Enter the Studio"
                className="absolute inset-0 z-20 cursor-pointer"
              />

              {/* Scan lines — fade in (hover desktop / always-on mobile), scroll upward */}
              <motion.div
                animate={{ opacity: doorActive ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 overflow-hidden pointer-events-none bg-black/[0.12]"
              >
                <motion.div
                  animate={{ y: ["0px", "-12px"] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-[-12px] bg-black/[0.20]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 12px)",
                    backgroundSize: "100% 12px",
                  }}
                />
              </motion.div>

              {/* Edge lines */}
              <motion.div
                animate={{ scaleX: doorActive ? 1 : 0 }}
                transition={{
                  duration: DOOR_HITBOX.lineDuration,
                  ease: "easeOut",
                }}
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  transformOrigin: "center",
                  backgroundColor: `rgba(255,255,255,${DOOR_HITBOX.lineOpacity})`,
                }}
              />
              <motion.div
                animate={{ scaleX: doorActive ? 1 : 0 }}
                transition={{
                  duration: DOOR_HITBOX.lineDuration,
                  ease: "easeOut",
                }}
                className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  transformOrigin: "center",
                  backgroundColor: `rgba(255,255,255,${DOOR_HITBOX.lineOpacity})`,
                }}
              />
              <motion.div
                animate={{ scaleY: doorActive ? 1 : 0 }}
                transition={{
                  duration: DOOR_HITBOX.lineDuration,
                  ease: "easeOut",
                }}
                className="absolute top-0 bottom-0 left-0 w-px pointer-events-none"
                style={{
                  transformOrigin: "center",
                  backgroundColor: `rgba(255,255,255,${DOOR_HITBOX.lineOpacity})`,
                }}
              />
              <motion.div
                animate={{ scaleY: doorActive ? 1 : 0 }}
                transition={{
                  duration: DOOR_HITBOX.lineDuration,
                  ease: "easeOut",
                }}
                className="absolute top-0 bottom-0 right-0 w-px pointer-events-none"
                style={{
                  transformOrigin: "center",
                  backgroundColor: `rgba(255,255,255,${DOOR_HITBOX.lineOpacity})`,
                }}
              />

              {/* Corner handles */}
              {(
                [
                  {
                    top: -DOOR_HITBOX.handleSize / 2,
                    left: -DOOR_HITBOX.handleSize / 2,
                  },
                  {
                    top: -DOOR_HITBOX.handleSize / 2,
                    right: -DOOR_HITBOX.handleSize / 2,
                  },
                  {
                    bottom: -DOOR_HITBOX.handleSize / 2,
                    left: -DOOR_HITBOX.handleSize / 2,
                  },
                  {
                    bottom: -DOOR_HITBOX.handleSize / 2,
                    right: -DOOR_HITBOX.handleSize / 2,
                  },
                ] as React.CSSProperties[]
              ).map((pos, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: doorActive ? 1 : 0 }}
                  transition={{
                    duration: DOOR_HITBOX.cornerDuration,
                    delay: doorActive ? DOOR_HITBOX.cornerDelay : 0,
                  }}
                  className="absolute bg-white pointer-events-none"
                  style={{
                    width: DOOR_HITBOX.handleSize,
                    height: DOOR_HITBOX.handleSize,
                    ...pos,
                  }}
                />
              ))}

              {/* Right-side X/Y coordinate display */}
              <motion.div
                animate={{
                  opacity: doorActive ? 1 : 0,
                  x: doorActive ? 0 : -4,
                }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                  delay: doorActive ? 0.1 : 0,
                }}
                className="absolute top-0 pointer-events-none flex flex-col gap-[3px]"
                style={{ left: "calc(100% + 10px)" }}
              >
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                  <span className="text-white">X: </span>
                  <span className="text-white/50">{doorCoords.x} PX</span>
                </span>
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                  <span className="text-white">Y: </span>
                  <span className="text-white/50">{doorCoords.y} PX</span>
                </span>
              </motion.div>

              {/* Label caption */}
              <motion.div
                animate={{ opacity: doorActive ? 1 : 0, y: doorActive ? 0 : 4 }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                  delay: doorActive ? 0.15 : 0,
                }}
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap"
                style={{ top: "calc(100% + 8px)" }}
              >
                <span className="font-brand-cn text-[11px] uppercase tracking-[0.2em] text-white">
                  Asset 1:
                  <span className="text-white/60"> {`"Enter the Studio"`}</span>
                </span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* PERSISTENT BOTTOM HUD */}
          <div className="absolute bottom-12 left-0 w-full px-12 flex justify-between items-end z-20 pointer-events-none">
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] tracking-[0.4em] uppercase text-white/70 font-brand-secondary-thin">
                Est. 2025
              </span>
              <div className="w-17 h-[0.5px] bg-white/60" />
            </div>

            <motion.div
              animate={{ opacity: hoveredIndex !== null ? 1 : 0 }}
              className="flex items-center space-x-1 pb-1"
            >
              {["| JUDAION IS YOUR CREATIVE STRATEGIC PARTNER |"].map(
                (item) => (
                  <React.Fragment key={item}>
                    <span className="text-[10px] tracking-[0.7em] uppercase text-white/80 font-light font-brand-secondary-thin">
                      {item}
                    </span>
                  </React.Fragment>
                ),
              )}
            </motion.div>

            <div className="w-16" />
          </div>
        </section>
      </motion.div>
    </div>
  );
}
