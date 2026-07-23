"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InspectionLoader from "./InspectionLoader";

export default function Tier1() {
  const router = useRouter();
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverCoords, setHoverCoords] = useState({ x: 0, y: 0 });
  const [animationDone, setAnimationDone] = useState(false);

  // Offscreen canvas of the foundation asset for per-pixel alpha hit-testing
  const hitRef = useRef<{ ctx: CanvasRenderingContext2D; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      hitRef.current = { ctx, w: img.naturalWidth, h: img.naturalHeight };
    };
    img.src = "/tier1-foundation.webp";
  }, []);

  useEffect(() => {
    const urls = ["/tier1&2-bg.webp", "/tier1-foundation.webp", "/tier1-ground.webp"];
    let count = 0;
    urls.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => { if (++count === urls.length) setAssetsLoaded(true); };
      img.src = src;
    });
  }, []);

  // Minimum loader display so it doesn't flash on fast / cached loads.
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const ready = assetsLoaded && minElapsed;
  // Flipped only AFTER the loader has fully faded out, so the room's assets
  // always assemble in view (never behind the loader).
  const [entered, setEntered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);

  // --- Parallax (ground layer only) ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Slow, heavy spring — deliberate feel
  const springCfg = { stiffness: 22, damping: 18 };
  const smoothX = useSpring(mouseX, springCfg);
  const smoothY = useSpring(mouseY, springCfg);

  const foundX = useTransform(smoothX, [-1, 1], [-14, 14]);
  const foundY = useTransform(smoothY, [-1, 1], [-9,   9]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const W = r.width, H = r.height;
    const px = e.clientX - r.left, py = e.clientY - r.top;
    mouseX.set(px / W * 2 - 1);
    mouseY.set(py / H * 2 - 1);
    setHoverCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });

    // Per-pixel hit-test against the foundation asset's alpha channel.
    const hit = hitRef.current;
    if (!hit) { setIsHovered(false); return; }
    // Undo the layer transform: scale(1.05) about centre + parallax translate.
    const scale = 1.05, cx = W / 2, cy = H / 2;
    const lx = cx + (px - cx - foundX.get()) / scale;
    const ly = cy + (py - cy - foundY.get()) / scale;
    // Undo object-cover / object-left to reach natural pixel coords.
    const s = Math.max(W / hit.w, H / hit.h);
    const ix = lx / s;                       // object-left → no x offset
    const iy = (ly - (H - hit.h * s) / 2) / s; // vertical centre
    if (ix < 0 || iy < 0 || ix >= hit.w || iy >= hit.h) { setIsHovered(false); return; }
    const alpha = hit.ctx.getImageData(ix, iy, 1, 1).data[3];
    setIsHovered(alpha > 10);
  }
  function handleMouseLeave() { mouseX.set(0); mouseY.set(0); setIsHovered(false); }

  useEffect(() => {
    const audio = new Audio("/audio/t1-bg.mp3");
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    let started = false;

    function fadeIn() {
      let v = 0;
      const step = () => {
        v = Math.min(v + 0.35 / 30, 0.35);
        audio.volume = v;
        if (v < 0.35) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function onFirstInteraction() {
      if (started) return;
      started = true;
      document.removeEventListener("click", onFirstInteraction);
      audio.play().then(() => { fadeIn(); setIsAudioOn(true); }).catch(() => {});
    }

    function onVisibilityChange() {
      if (!started) return;
      if (document.hidden) { audio.volume = 0; }
      else if (!isMutedRef.current) { audio.volume = 0.35; }
    }

    document.addEventListener("click", onFirstInteraction);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("click", onFirstInteraction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioOn) {
      audio.muted = true;
      audio.volume = 0;
      isMutedRef.current = true;
      setIsAudioOn(false);
    } else {
      audio.muted = false;
      audio.volume = 0.35;
      isMutedRef.current = false;
      setIsAudioOn(true);
    }
  }

  // Structured data to dynamically render the new dual-column layout
  const deliverables = [
    {
      what: "BRAND BLUEPRINT",
      details: [
        "– A 4-5 page strategic document defining vision, methodology, service pillars and team profile.",
      ],
    },
    {
      what: "LOGOS",
      details: [
        "– Primary Logo: The main brand mark that governs the brand. Will be used for general use across website, signage etc.",
        "– Secondary / Alternative logo: A horizontal or stacked version for spaces where the primary logo doesn't fit (e.g., narrow navigation bars or business cards)",
        "– Brand Icon : A simplified version (favicon, social media profile picture) that remains legible at tiny sizes.",
      ],
    },
    {
      what: "READY TO MARKET ASSETS",
      details: [
        "– Custom designed Email Signatures, Digital Letterheads and Business Card templates based on new identity established.",
      ],
    },
    {
      what: "THE BRAND STYLE GUIDE",
      details: [
        '– The Manual : A 5-to-10-page pdf explaining how to use these assets, ensuring client does not "break" the brand when I am not there.',
        "– Typography Suite: Selection of primary and secondary fonts that ensure their brand speaks in a consistent tone.",
      ],
    },
  ];

  return (
    <main className="relative bg-black">
      {/* Inspection loader — waits for the tier assets, then reveals. */}
      <InspectionLoader
        show={!ready}
        onExited={() => setEntered(true)}
        label="The Identity Launchpad"
      />
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "black",
          zIndex: 999, // Ensure it sits above all page content
          pointerEvents: "none",
        }}
      />

      <div className="flex flex-col lg:flex-row w-full min-h-screen lg:h-screen bg-[#0a0a0a] lg:overflow-hidden font-mono selection:bg-orange-600">
        {/* --- LEFT COLUMN: THE SPECIFICATION BLOCK --- */}
        <div className="relative w-full lg:w-[52%] h-full overflow-hidden flex flex-col z-30 pt-12 lg:pt-20 pb-4 lg:pb-6 px-12 xl:px-16">
          {/* 0. NEW VIDEO BACKGROUND LAYER */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/%20JDS%20Global%20Bgglobal-bg.mp4"
                type="video/mp4"
              />
            </video>
            {/* Your Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/40"
             />
          </div>

          {/* 0b. LEFT COLUMN BACKDROP — black blur over global bg */}
          <div className="absolute inset-0 z-[1] pointer-events-none bg-black/40" />

          {/* 1. TOP TEXT TITLE — archive-header banner, flush to top & sides */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 shrink-0 overflow-hidden -mt-12 lg:-mt-20 -mx-12 xl:-mx-16 mb-4 lg:mb-6 w-auto border-b border-white/10"
            style={{
              backgroundImage: "url('/archive-header.avif')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            <div className="relative z-10 px-12 xl:px-16 pt-20 lg:pt-18 pb-7 lg:pb-12">
              <h2 className="text-white font-brand-other text-[clamp(2rem,4.4vw,5.625rem)] uppercase tracking-[0.47em] leading-[1.1] whitespace-nowrap">
                FOUNDATION
              </h2>
              <div className="mt-4 lg:mt-5 flex items-center gap-4">
                <p className="font-brand-secondary-thin text-[11px] text-white/55 leading-[1.7] tracking-[0.3em] shrink-0">
                  T1 &nbsp;|&nbsp; THE IDENITY LAUNCHPAD
                </p>
                <div className="flex-1 border-t border-white/20" />
                <button
                  onClick={toggleAudio}
                  className="flex items-end gap-[3px] h-4 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer shrink-0 px-7 xl:px-7"
                  aria-label={isAudioOn ? "Mute music" : "Unmute music"}
                >
                  {[1, 0.5, 0.8, 0.3, 0.9].map((h, i) =>
                    isAudioOn ? (
                      <motion.div
                        key={i}
                        className="w-[2px] rounded-full bg-white"
                        animate={{ scaleY: [h, 1, h * 0.4, 0.9, h] }}
                        transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                        style={{ height: "100%", transformOrigin: "bottom" }}
                      />
                    ) : (
                      <div
                        key={i}
                        className="w-[2px] rounded-full bg-white/40"
                        style={{ height: `${h * 100}%` }}
                      />
                    )
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* CONTENT WRAPPER: Keeps text above the video. flex-1 + min-h-0 lets
              the deliverables area scroll while header/footer banners stay pinned. */}
          <div className="desc-scroll relative z-10 flex flex-col flex-1 min-h-0 w-full lg:overflow-y-auto">
            {/* 3. DUAL-COLUMN DELIVERABLES TABLE */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col w-full pr-3"
            >
              {/* Table Headers */}
              <div className="hidden lg:flex w-full py-3 border-b border-white/20 shrink-0">
                <div className="w-[35%] text-white/30 font-brand-cn text-[clamp(0.75rem,1.2vw,0.875rem)] uppercase tracking-[0.20em]">
                  What it is
                </div>
                <div className="w-[65%] text-white/30 font-brand-cn text-[clamp(0.75rem,1.2vw,0.875rem)] uppercase tracking-[0.20em] pl-4">
                  Deliverables
                </div>
              </div>

              {/* Table Rows */}
              <div className="flex flex-col w-full pb-8">
                {deliverables.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.8 + index * 0.15,
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                    className="flex flex-col lg:flex-row w-full py-3 lg:py-4 border-b border-white/20 group hover:border-white/20 transition-colors shrink-0"
                  >
                    {/* Category */}
                    <div className="w-full lg:w-[35%] pr-0 lg:pr-4 pb-2 lg:pb-0">
                      <h3 className="text-white font-brand-bold text-[clamp(0.75rem,1.5vw,0.875rem)] uppercase tracking-[0.05em] leading-snug">
                        {item.what}
                      </h3>
                    </div>
                    {/* Details List */}
                    <div className="w-full lg:w-[65%] flex flex-col gap-3 pl-0 lg:pl-4">
                      {item.details.map((detail, i) => (
                        <p
                          key={i}
                          className="text-white/70 font-brand-secondary-thin text-[13px] leading-[1.5] text-justify"
                        >
                          {detail}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* FOOTER: Return button banner — mirrors the header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="relative z-10 shrink-0 overflow-hidden -mx-15 xl:-mx-16 -mb-5 lg:-mb-6 border-t border-white/10"
            style={{
              backgroundImage: "url('/archive-header.avif')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            <div className="relative z-10 px-12 xl:px-16 py-6 lg:py-8 flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center cursor-pointer group bg-transparent border-none p-0"
              >
                <motion.img
                  src="/return-to.webp"
                  className="w-16 lg:w-20 xl:w-24 h-auto opacity-80 group-hover:opacity-100"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  alt="Return"
                />
              </button>

              <button
                onClick={() => router.push("/contact")}
                className="group flex items-center bg-black/60 text-white border border-white/20 hover:bg-white hover:text-black hover:border-neutral-200 px-4 py-[9px] cursor-pointer rounded-sm transition-colors duration-800"
              >
                <div className="flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 7l10 7 10-7" />
                  </svg>
                  <div className="h-7 w-[1.5px] bg-white group-hover:bg-black transition-colors duration-200" />
                </div>
                <span className="font-brand-bold text-[13px] lg:text-[15px] uppercase tracking-[0.12em] ml-3">
                  Build Your Authority
                </span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* --- RIGHT COLUMN: THE VISUAL SHOWROOM — PARALLAX --- */}

        <div
          className="relative w-full lg:w-[52%] h-[60vh] lg:h-full overflow-hidden bg-[#080808]"
          style={{ cursor: isHovered ? "pointer" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* LAYER 00: ENVIRONMENT BACKGROUND — static */}
          <img
            src="/tier1&2-bg.webp"
            alt="Environment"
            className="absolute inset-0 w-full h-full object-cover object-left z-0"
          />

          {/* LAYER 10: FOUNDATION ASSET — entry animation + parallax */}
          <motion.div
            className="absolute inset-0 z-10 select-none pointer-events-none overflow-hidden"
            style={{ x: foundX, y: foundY, scale: 1.04 }}
          >
            <motion.img
              initial={{ y: "100%", opacity: 0 }}
              animate={entered ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
              transition={{ duration: 2.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => { if (entered) setAnimationDone(true); }}
              src="/tier1-foundation.webp"
              alt="Foundation Asset"
              className="absolute inset-0 w-full h-full object-cover object-left"
            />

            {/* X/Y COORDINATE DISPLAY — top-right corner of the foundation asset */}
            <motion.div
              animate={{ opacity: isHovered && animationDone ? 1 : 0, x: isHovered && animationDone ? 0 : 4 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: isHovered ? 0.1 : 0 }}
              className="absolute top-[62%] right-[10%] z-10 pointer-events-none flex flex-col gap-[4px] items-end"
            >
              <span className="font-brand-cn text-[11px] uppercase tracking-[0.15em] whitespace-nowrap">
                <span className="text-white">X: </span><span className="text-white/50">{hoverCoords.x} PX</span>
              </span>
              <span className="font-brand-cn text-[11px] uppercase tracking-[0.15em] whitespace-nowrap">
                <span className="text-white">Y: </span><span className="text-white/50">{hoverCoords.y} PX</span>
              </span>
            </motion.div>

            {/* SCAN LINES — masked to foundation asset shape, fade in on hover (after entry animation) */}
            <motion.div
              animate={{ opacity: isHovered && animationDone ? 1 : 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 overflow-hidden"
              style={{
                maskImage: "url('/tier1-foundation.webp')",
                maskSize: "cover",
                maskPosition: "left center",
                WebkitMaskImage: "url('/tier1-foundation.webp')",
                WebkitMaskSize: "cover",
                WebkitMaskPosition: "left center",
              }}
            >
              <motion.div
                animate={{ y: ["0px", "-12px"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-12px] bg-black/[0.18]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)",
                  backgroundSize: "100% 3px",
                }}
              />
            </motion.div>
          </motion.div>

          {/* LAYER 20: GROUND OVERLAY — static */}
          <img
            src="/tier1-ground.webp"
            alt="Ground Overlay"
            className="absolute inset-0 w-full h-full object-cover object-left z-20 pointer-events-none"
          />

          {/* Right-column loader removed — the full-page InspectionLoader now
              gates entry until all assets are preloaded. */}
        </div>
      </div>
    </main>
  );
}
