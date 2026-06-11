"use client"; // REQUIRED: Component utilizes Framer Motion hooks and Browser APIs

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { createPortal } from "react-dom";
import * as React from "react";
import { useRef } from "react";
import emailjs from "@emailjs/browser";
import Link from "next/link";
import contactBgAvif from "@/public/contact-us-V1.2.avif";
import contactBgWebp from "@/public/contact-us-V1.2.webp";

export default function Contact() {
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = React.useState<
    "idle" | "initiating..." | "initiated"
  >("idle");
  const [isMobile, setIsMobile] = React.useState(false);

  // CONTACT DRAWER STATE
  const [formOpen, setFormOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [hoverCoords, setHoverCoords] = React.useState({ x: 0, y: 0 });
  // INTRO PEEK — faintly half-opens the hitbox until first hover
  const [peekOn, setPeekOn] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  // Portal target only exists on the client — gate to avoid SSR mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close the drawer on ESC
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFormOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Replays a faint partial "peek" of the hitbox until the user first hovers,
  // signalling interactivity without overpowering the page. Desktop only.
  React.useEffect(() => {
    if (isMobile || hasInteracted) return;
    const peek = () => {
      setPeekOn(true);
      window.setTimeout(() => setPeekOn(false), 650);
    };
    const start = window.setTimeout(peek, 1200);
    const loop = window.setInterval(peek, 3200);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(loop);
    };
  }, [isMobile, hasInteracted]);

  // ─────────────────────────────────────────────
  // HITBOX TUNING — position/size as % of the background layer, sitting over
  // the dark "corridor" panel on the right half of the billboard. Tune freely.
  // ─────────────────────────────────────────────
  const HITBOX = { top: "26.3%", left: "52.7%", width: "15%", height: "45%" };
  // Asset label shown beneath the hitbox on hover (same as Services/Archive)
  const HITBOX_LABEL = { tag: "ASSET", name: "AUTHORITY PROTOCOL" };
  // Mobile hitbox — % of the FULL (uncropped) image shown on mobile.
  const HITBOX_MOBILE = {
    top: "26%",
    left: "54.5%",
    width: "21.6%",
    height: "45%",
  };

  // Intro-peek intensity — the peek shows ONLY the border lines (no scan-line
  // fill), so the full hitbox rectangle isn't given away until hover.
  //   line  → border-line opacity during the peek (0–1)
  //   scale → how far the borders draw in during the peek (0–1, "half" = 0.5)
  const PEEK = { line: 0.25, scale: 0.5 };

  // Selection-box hover visuals (mirrors ServicesClient)
  const SELECTION = {
    lineOpacity: 0.65,
    handleSize: 5,
    lineDuration: 0.4,
    cornerDelay: 0.35,
    cornerDuration: 0.18,
  };
  const MOBILE_SELECTION = {
    lineOpacity: 0.4,
    handleSize: 5,
    handleOpacity: 0.55,
    scanTint: 0.2,
  };

  // MOUSE PARALLAX LOGIC
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 110, damping: 25 });
  const mouseY = useSpring(y, { stiffness: 110, damping: 25 });

  // Pinned values - these must match for both the image and the form
  const bgMoveX = useTransform(mouseX, [0, 1920], ["1.6%", "-1.6%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1.6%", "-1.6%"]);

  // --- THE SENDING LOGIC ---
  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("initiating...");

    if (form.current) {
      emailjs
        .sendForm(
          "judaion_outreach",
          "template_i4g317c",
          form.current,
          "t3-Z2koe9RoLgz3Ri", // Public Key verified from original source
        )
        .then(() => {
          setStatus("initiated");
          setTimeout(() => setStatus("idle"), 9000);
        })
        .catch((error) => {
          setStatus("idle");
          // This will now print the specific server response (e.g., "Unauthorized domain")
          console.error("TRANSMISSION_FAILED:", error.text || error);
        });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Freeze the background parallax while the contact drawer is open
    if (formOpen) return;
    x.set(e.clientX);
    y.set(e.clientY);
  };

  return (
    <main className="relative bg-black">
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
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
        className={`relative w-full h-screen bg-[#0a0a0a] ${isMobile ? "overflow-x-auto overflow-y-hidden overscroll-x-none block" : "overflow-hidden"}`}
      >
        {/* MASTER PARALLAX WRAPPER */}
        <motion.div
          style={
            isMobile
              ? { x: 0, y: 0, scale: 1 }
              : { x: bgMoveX, y: bgMoveY, scale: 1.4 }
          }
          className={`${isMobile ? "absolute top-0 left-0 min-w-[250vw] h-full" : "absolute inset-0 w-full h-full pointer-events-none"}`}
        >
          {/* THE BACKGROUND IMAGE */}
          <picture>
            {/* Primary: Ultra-light AVIF */}
            <source srcSet={contactBgAvif.src} type="image/avif" />

            {/* Fallback: Webp */}
            <img
              src={contactBgWebp.src}
              alt="Contact Billboard"
              className={`${
                isMobile
                  ? "w-full h-full object-cover"
                  : "absolute inset-0 w-full h-full object-contain opacity-100"
              }`}
              fetchPriority="high"
            />
          </picture>

          {/* --- CONTACT DRAWER + CURSOR TAG (portaled to <body> so they
                  escape the parallax transform and stay viewport-fixed) --- */}
          {mounted &&
            createPortal(
              <>
                {/* Cursor-attached tag — desktop only, shown on hitbox hover */}
                {!isMobile && (
                  <motion.div
                    style={{ left: x, top: y }}
                    animate={{ opacity: hovered && !formOpen ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-0 left-0 z-[80] translate-x-5 translate-y-5 pointer-events-none flex items-center gap-2 bg-black/80 border border-white/10 backdrop-blur-sm px-3 py-2"
                  >
                    <img
                      src="/right-click.png"
                      alt=""
                      className="w-5 h-auto filter brightness-110"
                    />
                    <span className="font-brand-cn text-[10px] uppercase tracking-[0.3em] text-white whitespace-nowrap">
                      Open protocol form
                    </span>
                  </motion.div>
                )}

                <AnimatePresence>
                  {formOpen && (
                    <>
                      {/* Click-outside scrim */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setFormOpen(false)}
                        className="fixed inset-0 z-[60] bg-black/16 cursor-pointer"
                      />

                      {/* The drawer — flush top/bottom, half-screen on desktop */}
                      <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: isMobile ? "-100%" : "100%" }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        drag={isMobile ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0.7, right: 0 }}
                        onDragEnd={(_e, info) => {
                          // Swipe left past the threshold (or a fast left flick) closes
                          if (info.offset.x < -80 || info.velocity.x < -400) {
                            setFormOpen(false);
                          }
                        }}
                        className="fixed inset-y-0 right-0 z-[70] w-full lg:w-1/2 bg-black/75 backdrop-blur-sm border-l border-white/10 overflow-y-auto flex flex-col px-8 lg:px-16 touch-pan-y"
                      >
                        {/* Mobile-only close — tap or swipe left (desktop uses ESC / click-outside) */}
                        <button
                          type="button"
                          onClick={() => setFormOpen(false)}
                          className="lg:hidden fixed top-20 left-10 z-[210] flex items-center gap-2 font-brand-cn text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                          ‹ Swipe or tap to close
                        </button>

                        {/* Inner wrapper: min-h-full keeps the top/middle/bottom
                            spread when there's room, but lets the drawer scroll
                            cleanly when content overflows (zoom-in / short screens).
                            Vertical padding lives HERE (not the scroll container) so
                            bottom padding is preserved when scrolled to the end. */}
                        <div className="min-h-full flex flex-col justify-start lg:justify-between gap-y-8 lg:gap-y-10 pt-28 pb-16 lg:py-38">
                          {/* Heading — line + label (same as The Narrative) */}
                          <div className="w-full max-w-5xl mx-auto">
                            <div className="flex items-center gap-4">
                              <div className="flex-1 border-t border-white/20" />
                              <h4 className="text-[15px] tracking-[0.1em] uppercase font-brand-secondary-heavy shrink-0">
                                The Authority Protocol
                              </h4>
                            </div>
                          </div>

                          <div className="w-full max-w-5xl mx-auto">
                            {/* UPDATE THIS LINE BELOW */}
                            <form
                              ref={form}
                              onSubmit={sendEmail}
                              className="grid grid-cols-2 gap-x-2 gap-y-5"
                            >
                              {/* EMAIL */}
                              <div className="col-span-2">
                                <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">
                                  Email
                                </label>
                                <input
                                  name="user_email"
                                  type="email"
                                  required
                                  className="form-field-block !text-white"
                                />
                              </div>

                              {/* NAMES */}
                              <div>
                                <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">
                                  First Name
                                </label>
                                <input
                                  name="first_name"
                                  type="text"
                                  required
                                  className="form-field-block !text-white "
                                />
                              </div>
                              <div>
                                <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">
                                  Last Name
                                </label>
                                <input
                                  name="last_name"
                                  type="text"
                                  className="form-field-block !text-white"
                                />
                              </div>

                              {/* COMPANY */}
                              <div className="col-span-2">
                                <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">
                                  Company Name
                                </label>
                                <input
                                  name="company_name"
                                  type="text"
                                  className="form-field-block !text-white"
                                />
                              </div>

                              {/* TIERS */}
                              <div className="col-span-2 border border-white/60 bg-white/[0.02] p-3">
                                <span className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-4 block">
                                  AUTHORITY Selection:
                                </span>
                                <div className="flex gap-4 text-[9px] font-brand-secondary-thin tracking-wide uppercase text-white">
                                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-all group">
                                    <input
                                      name="tier"
                                      value="Foundation"
                                      type="checkbox"
                                      className="custom-form-checkbox group-hover:shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-shadow"
                                    />
                                    The Foundation | T 1
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-all group">
                                    <input
                                      name="tier"
                                      value="Digital Authority"
                                      type="checkbox"
                                      className="custom-form-checkbox group-hover:shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-shadow"
                                    />
                                    Digital Authority | T 2
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-all group">
                                    <input
                                      name="tier"
                                      value="Scale Partner"
                                      type="checkbox"
                                      className="custom-form-checkbox group-hover:shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-shadow"
                                    />
                                    The Scale Partner | T 3
                                  </label>
                                </div>
                              </div>

                              {/* MESSAGE */}
                              <div className="col-span-2">
                                <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">
                                  Message
                                </label>
                                <textarea
                                  name="message"
                                  rows={3}
                                  className="form-field-block !text-white resize-none"
                                />
                              </div>

                              {/* SUBMIT */}
                              <div className="col-span-2 flex justify-end mt-1">
                                <button
                                  type="submit"
                                  disabled={status !== "idle"}
                                  className={`
      group flex items-center border transition-all duration-300 rounded-sm px-4 py-[9px]
      font-brand-bold text-[13px] uppercase tracking-[0.4em] 
      ${
        status === "idle"
          ? "bg-black/60 text-white border-white/40 hover:bg-white hover:text-black hover:border-neutral-200 cursor-pointer active:scale-95 duration-800"
          : "bg-transparent text-white/40 border-white/20 cursor-default"
      }
    `}
                                >
                                  {/* ICON AND VERTICAL BAR */}
                                  <div className="flex items-center gap-3">
                                    <img
                                      src="/initiate-icon.png"
                                      alt="Initiate Icon"
                                      className={`w-[22px] h-[22px] object-contain ${
                                        status === "idle"
                                          ? "group-hover:invert transition-all duration-200"
                                          : "opacity-40"
                                      }`}
                                    />
                                    <div
                                      className={`h-7 w-[1.5px] transition-colors duration-200 ${
                                        status === "idle"
                                          ? "bg-white group-hover:bg-black"
                                          : "bg-white/40"
                                      }`}
                                    />
                                  </div>

                                  {/* SUBMIT STATES */}
                                  <div className="ml-3 flex items-center justify-center min-w-[100px]">
                                    {status === "idle" && "Initiate"}

                                    {status === "initiating..." && (
                                      <motion.span
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                          ease: "linear",
                                        }}
                                      >
                                        Initiating...
                                      </motion.span>
                                    )}

                                    {status === "initiated" && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2"
                                      >
                                        <span>Initiated</span>
                                        <motion.svg
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          initial={{ pathLength: 0 }}
                                          animate={{ pathLength: 1 }}
                                          transition={{
                                            duration: 0.5,
                                            ease: "easeOut",
                                          }}
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </motion.svg>
                                      </motion.div>
                                    )}
                                  </div>
                                </button>
                              </div>
                            </form>
                          </div>

                          {/* Footer — registered-studio line (same as The Narrative) */}
                          <div className="w-full max-w-5xl mx-auto pt-8 border-t border-white/20"></div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </>,
              document.body,
            )}

          {/* --- DESKTOP CONTACT HITBOX (over the dark right panel) --- */}
          {!isMobile && (
            <div
              className="absolute z-20 pointer-events-auto cursor-pointer"
              style={{
                top: HITBOX.top,
                left: HITBOX.left,
                width: HITBOX.width,
                height: HITBOX.height,
              }}
              onMouseEnter={() => {
                setHovered(true);
                setHasInteracted(true); // stop the intro peek loop
                setPeekOn(false);
              }}
              onMouseLeave={() => setHovered(false)}
              onMouseMove={(e) =>
                setHoverCoords({
                  x: Math.round(e.clientX),
                  y: Math.round(e.clientY),
                })
              }
              onClick={() => setFormOpen(true)}
            >
              {/* Peek-only faint black fill — draws a little attention during
                  the peek WITHOUT the scan-line texture (scan lines stay
                  hover-only). Tune the bg-black/[..] value for darkness. */}
              <motion.div
                animate={{ opacity: peekOn && !hovered ? 1 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none bg-black/[0.08]"
              />

              {/* Scan lines — HOVER ONLY. Kept out of the peek so the peek
                  shows just the border lines, not a filled rectangle. */}
              <motion.div
                animate={{ opacity: hovered ? 1 : 0 }}
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
                      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
                    backgroundSize: "100% 3px",
                  }}
                />
              </motion.div>

              {/* Edge lines */}
              <motion.div
                animate={{
                  scaleX: hovered ? 1 : peekOn ? PEEK.scale : 0,
                  opacity: hovered ? 1 : peekOn ? PEEK.line : 1,
                }}
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
                animate={{
                  scaleX: hovered ? 1 : peekOn ? PEEK.scale : 0,
                  opacity: hovered ? 1 : peekOn ? PEEK.line : 1,
                }}
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
                animate={{
                  scaleY: hovered ? 1 : peekOn ? PEEK.scale : 0,
                  opacity: hovered ? 1 : peekOn ? PEEK.line : 1,
                }}
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
                animate={{
                  scaleY: hovered ? 1 : peekOn ? PEEK.scale : 0,
                  opacity: hovered ? 1 : peekOn ? PEEK.line : 1,
                }}
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

              {/* Corner handles */}
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
                  animate={{ opacity: hovered ? 1 : 0 }}
                  transition={{
                    duration: SELECTION.cornerDuration,
                    delay: hovered ? SELECTION.cornerDelay : 0,
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
                animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -4 }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                  delay: hovered ? 0.1 : 0,
                }}
                className="absolute top-0 pointer-events-none flex flex-col gap-[3px]"
                style={{ left: "calc(100% + 10px)" }}
              >
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                  <span className="text-white">X: </span>
                  <span className="text-white/50">{hoverCoords.x} PX</span>
                </span>
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">
                  <span className="text-white">Y: </span>
                  <span className="text-white/50">{hoverCoords.y} PX</span>
                </span>
              </motion.div>

              {/* Below-hitbox asset label */}
              <motion.div
                animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 4 }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                  delay: hovered ? 0.15 : 0,
                }}
                className="absolute left-0 right-0 pointer-events-none"
                style={{ top: "calc(100% + 8px)" }}
              >
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.2em] text-white">
                  {HITBOX_LABEL.tag}:
                  <span className="text-white/50">
                    {" "}
                    {`"${HITBOX_LABEL.name}"`}
                  </span>
                </span>
              </motion.div>
            </div>
          )}

          {/* --- MOBILE CONTACT HITBOX (always-on, tap to open) --- */}
          {isMobile && (
            <div
              className="absolute z-20 pointer-events-auto"
              style={{
                top: HITBOX_MOBILE.top,
                left: HITBOX_MOBILE.left,
                width: HITBOX_MOBILE.width,
                height: HITBOX_MOBILE.height,
              }}
              onClick={() => setFormOpen(true)}
            >
              {/* Scan lines — always scrolling */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  backgroundColor: `rgba(0,0,0,${MOBILE_SELECTION.scanTint})`,
                }}
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
                      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
                    backgroundSize: "100% 3px",
                  }}
                />
              </div>

              {/* Static outline */}
              <span
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})`,
                }}
              />
              <span
                className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})`,
                }}
              />
              <span
                className="absolute top-0 bottom-0 left-0 w-px pointer-events-none"
                style={{
                  backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})`,
                }}
              />
              <span
                className="absolute top-0 bottom-0 right-0 w-px pointer-events-none"
                style={{
                  backgroundColor: `rgba(255,255,255,${MOBILE_SELECTION.lineOpacity})`,
                }}
              />

              {/* Corner handles — static */}
              {(
                [
                  {
                    top: -MOBILE_SELECTION.handleSize / 2,
                    left: -MOBILE_SELECTION.handleSize / 2,
                  },
                  {
                    top: -MOBILE_SELECTION.handleSize / 2,
                    right: -MOBILE_SELECTION.handleSize / 2,
                  },
                  {
                    bottom: -MOBILE_SELECTION.handleSize / 2,
                    left: -MOBILE_SELECTION.handleSize / 2,
                  },
                  {
                    bottom: -MOBILE_SELECTION.handleSize / 2,
                    right: -MOBILE_SELECTION.handleSize / 2,
                  },
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

              {/* Caption */}
              <div
                className="absolute left-0 right-0 flex items-center gap-2 pointer-events-none"
                style={{ top: "calc(100% + 8px)" }}
              >
                <img
                  src="/tap-icon.png"
                  alt=""
                  className="w-6 h-auto filter brightness-110"
                />
                <span className="font-brand-cn text-[10px] uppercase tracking-[0.2em] text-white whitespace-nowrap">
                  Tap to fill form
                </span>
              </div>
            </div>
          )}

          {/* --- INSTAGRAM HITBOX --- */}
          <a
            href="https://www.instagram.com/judaion.studios/"
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute z-20 ${isMobile ? "insta-hitbox-mobile" : "absolute z-20 w-[3%] h-[5%] top-[65%] left-[42%] cursor-pointer pointer-events-auto"}`}
          />

          {/* --- Linked in HITBOX --- */}
          <a
            href="https://www.linkedin.com/company/judaion-studios/"
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute z-20 ${isMobile ? "linkedin-hitbox-mobile" : "absolute z-20 w-[3%] h-[5%] top-[65%] left-[38%] cursor-pointer pointer-events-auto"}`}
          />

          {/* --- EMAIL HITBOX --- */}
          <a
            href="mailto:extraction@judaion.com"
            className={`absolute z-20 ${isMobile ? "email-hitbox-mobile" : "absolute z-20 w-[6%] h-[3%] top-[66%] left-[21%] cursor-pointer pointer-events-auto"}`}
          />
        </motion.div>

        {/* --- PRESERVED FLOOR NAVIGATION (OUTSIDE PARALLAX) --- */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className={`absolute z-50 pointer-events-auto ${isMobile ? "contact-floor-nav-mobile" : "bottom-12 left-12"}`}
        >
          <Link
            href="/thenarrative"
            className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer"
          >
            <motion.img
              src="/re-enter.webp"
              className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex flex-col items-start font-brand-secondary-thin text-left">
              <span className="text-[10px] tracking-[0.5em] uppercase text-white/40  font-brand-secondary-thin">
                Re-Enter Studio
              </span>
              <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
                05 The Narrative
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
