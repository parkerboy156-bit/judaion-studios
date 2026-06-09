"use client"; // REQUIRED: Component utilizes Framer Motion and Browser APIs

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import heroBgAvif from "@/public/hero-bg-block.avif";
import heroBgPng from "@/public/hero-bg-block.webp";
import archiveheaderAvif from "@/public/archive-header.avif";
import archiveheaderWebp from "@/public/archive-header.webp";

export default function AboutTemplate() {
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  function handlePillarMove(e: React.MouseEvent, index: number) {
    setHoveredPillar(index);
    setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
  }
  function handlePillarLeave() {
    setHoveredPillar(null);
  }

  const [heroHovered, setHeroHovered] = useState(false);
  const [heroImageHovered, setHeroImageHovered] = useState(false);
  const [heroCoords, setHeroCoords] = useState({ x: 0, y: 0 });

  function handleHeroMove(e: React.MouseEvent) {
    const overRightBlock = e.clientX > window.innerWidth / 2;
    setHeroHovered(true);
    setHeroImageHovered(overRightBlock);
    setHeroCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
  }
  function handleHeroLeave() {
    setHeroHovered(false);
    setHeroImageHovered(false);
  }

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
      <div className="relative w-full min-h-screen bg-black ">
        {/* 1. THE FOOLPROOF VIDEO LAYER */}
        <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
          <video
            poster="/global-bg-poster.avif"
            key="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover grayscale opacity-65"
          >
            <source
              src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* 2. THE CONTENT LAYER (Z-index 10 to stay above video) */}
        <div className="relative z-10 w-full bg-transparent text-white font-brand-secondary-thin selection:bg-orange-600/30">
          {/* SECTION 1: THE HERO (PRECISION LAYERED BLOCK) */}
          <section
            className="h-screen w-full flex flex-col justify-center px-10 lg:px-20 border-b border-white/10 relative overflow-hidden"
            style={{ cursor: heroImageHovered ? "pointer" : "default" }}
            onMouseMove={handleHeroMove}
            onMouseLeave={handleHeroLeave}
          >
            {/* NAVIGATION: RETURN TO Project Archive */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute top-20 left-12 z-50 pointer-events-auto"
            >
              <Link
                href="/projectarchive"
                className="flex flex-col items-start gap-2 lg:flex-row lg:items-center group no-underline appearance-none bg-transparent border-none cursor-pointer"
              >
                <motion.img
                  src="/last-floor-straight.webp"
                  className="w-22 h-auto opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain shrink-0"
                  animate={{ x: [0, -5, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="flex flex-col items-start font-brand-secondary-thin text-left">
                  <span className="text-[11px] tracking-[0.3em] uppercase text-white/40 font-light font-secondary-thin">
                    [Previous Floor]
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* --- HALF-SCREEN BACKGROUND IMAGE BLOCK --- */}
            {/* Positioned absolute, z-0 (behind text), half width, right aligned */}
            <div className={`absolute top-0 right-0 w-1/2 h-full z-0 overflow-hidden pointer-events-none rounded-sm border-[1px] lg:border-[2px] transition-colors duration-800 border-white/60 ${heroImageHovered ? "lg:border-white/60" : "lg:border-white/10"}`}>
              {/* SCAN LINES — fade in when mouse is over the right block */}
              <div
                className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-800 opacity-100 ${heroImageHovered ? "lg:opacity-100" : "lg:opacity-0"}`}
              >
                <div
                  className="pillar-scanlines absolute inset-[-12px] bg-black/[0.08] "
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px)",
                    backgroundSize: "100% 12px",
                  }}
                />
              </div>
              <picture>
                {/* Primary: The modern AVIF version */}
                <source srcSet={heroBgAvif.src} type="image/avif" />

                {/* Fallback: The original PNG version */}
                <img
                  src={heroBgPng.src}
                  alt="Hero Feature"
                  className="w-full h-full object-cover opacity-80"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: -1,
                  }}
                  // Ensures this loads before secondary assets
                  fetchPriority="high"
                />
              </picture>
            </div>

            {/* SCROLL LABEL */}
            <div className="absolute bottom-5 right-1 flex items-center space-x-6">
              <motion.img
                src="/scroll-up.png"
                alt="Scroll"
                className="w-25 h-25 opacity-80"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Asset label — live on hero hover */}
            <div
              className={`absolute top-[97%] left-[02%] flex items-center space-x-6 transition-opacity duration-300 ${heroHovered ? "opacity-100" : "opacity-0"}`}
            >
              <span className="font-brand-cn text-[11px] uppercase tracking-[0.15em] whitespace-nowrap">
                <span className="text-white/60">Asset 3</span>
                <span className="text-white/40"> "ARCHITECTURE"</span>
              </span>
            </div>

            {/* Y axis — live on hero hover */}
            <div
              className={`absolute top-[97%] left-[35%] flex items-center space-x-6 transition-opacity duration-300 ${heroHovered ? "opacity-100" : "opacity-0"}`}
            >
              <span className="font-brand-cn text-[11px] uppercase tracking-[0.15em] whitespace-nowrap">
                <span className="text-white">Y: </span>
                <span className="text-white/50">{heroCoords.y} PX</span>
              </span>
            </div>

            {/* X axis — live on hero hover */}
            <div
              className={`absolute top-[97%] left-[20%] flex items-center space-x-6 transition-opacity duration-300 ${heroHovered ? "opacity-100" : "opacity-0"}`}
            >
              <span className="font-brand-cn text-[11px] uppercase tracking-[0.15em] whitespace-nowrap">
                <span className="text-white">X: </span>
                <span className="text-white/50">{heroCoords.x} PX</span>
              </span>
            </div>



            {/* --- CONTENT LAYER (Z-10 to stay over the new image block) --- */}
            <h1 className="relative z-10 flex flex-col font-brand-cn uppercase leading-[1]">
              {/* LINE 1: Establishing The */}
              <div className="flex justify-center w-full py-2 self-center gap-x-4">
                <span className="hero-secondary-text-top text-[1.7vw] tracking-[0.1em] text-white/50">
                  We establish the
                </span>
              </div>

              {/* LINE 2: *Architecture */}
              <span className="text-[13vw] tracking-[0.10em] text-white font-brand-other ml-[-25px]">
                <span className="text-orange-600 font-brand-cn">*</span>
                Architecture
              </span>

              {/* LINE 3: For Your business's */}
              <div className="flex justify-center w-full py-5 self-center gap-x-4">
                <span className="hero-secondary-text-bottom text-[3.3vw] tracking-[0.1em] text-white/50 ">
                  For
                </span>
                <span className="hero-secondary-text-bottom text-[3.3vw] tracking-[0.1em] text-white/98 font-brand-xbold-italic-cn">
                  Your Vision's
                </span>
              </div>

              {/* LINE 4: *PERMANANCE */}
              <span className="text-[13vw] tracking-[0.13em] text-white font-brand-other ml-[-25px]">
                <span className="text-orange-600 font-brand-cn">*</span>
                PERMANENCE
              </span>
            </h1>
          </section>

          {/* SECTION 2: THE SPLIT BLOCK (Transparent Backgrounds) */}
          <section className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-transparent ">
            <div className="h-[60vh] lg:h-screen sticky top-0 bg-white/5 overflow-hidden ">
              <video
                muted
                autoPlay
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              >
                <source
                  src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/Raw%20Logo%20Videologo-video-raw.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="flex flex-col justify-center p-10 lg:p-30 space-y-15 ">
              <div className="space-y-9">
                {/* HEADER */}
                <div className=" inline-block mb-25">
                  {/* MAIN HEADING */}
                  <h2 className="about-main-title text-[clamp(2rem,4vw,5.625rem)] font-brand-bold uppercase tracking-[0.1em] text-white leading-none">
                    THE NARRATIVE
                  </h2>

                  {/* THE ARCHITECTURAL UNDERLINE */}
                  <div className="h-[1px] bg-white mt-4 origin-left" />
                </div>

                {/* PARAGRAPH GROUP 1 */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-white/20" />
                    <h4 className="text-[22px] tracking-[0.1em] uppercase font-brand-secondary-heavy shrink-0">
                      THE ARCHITECT
                    </h4>
                  </div>
                  <p className="text-white/70 text-[16px] leading-[1.9] tracking-[0em] font-brand-secondary-thin max-w-auto text-justify">
                    Born from the convergence of two names — Zion & Judah. The
                    brand originated as a personal reformation. It was shifted
                    towards rigid discipline and "hacking away at the
                    unnesential".
                  </p>
                  <p className="text-white/70 text-[16px] leading-relaxed tracking-[0em] font-brand-secondary-thin max-w-auto text-justify">
                    Before it built identities for others, it was an identity in
                    need of its own architecture. The name JUDAION was the first
                    asset, the first identity and the first monolith built by
                    the architect.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <span className="font-brand-secondary-thin text-[11px] text-white/40 italic leading-[1.7] tracking-[0.3em] shrink-0">
                    - WE BUILD THE MONOLITHS THAT DEFINE BRANDS.
                  </span>
                </div>

                {/* PARAGRAPH GROUP 1 */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-white/20" />
                    <h4 className="text-[22px] tracking-[0.1em] uppercase  font-brand-secondary-heavy">
                      THE COMMITMENT
                    </h4>
                  </div>
                  <p className="text-white/70 text-[16px] leading-[1.9] tracking-[0em] font-brand-secondary-thin max-w-auto text-justify">
                    Originally rooted in art-school aesthetics, previous work
                    was obsessed with seeking validation and creating 'pretty
                    pictures'; this caused a structural decay in early
                    freelancing work. The transition from freelancing to
                    partnership invoked a shift from 'what can I add' to 'what
                    is essential.' This is the primary law of the studio:
                    discipline comes from foundation.
                  </p>
                  <p className="text-white/70 text-[16px] leading-[1.9] tracking-[0em] font-brand-secondary-thin max-w-auto text-justify">
                    This is the primary law of the studio: discipline comes from
                    foundation
                  </p>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <span className="font-brand-secondary-thin text-[11px] text-white/40 italic leading-[1.7] tracking-[0.3em] shrink-0">
                    - THE EVOLUTION FROM ART TO ARCHITECTURE.
                  </span>
                </div>

                {/* PARAGRAPH GROUP 1 */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-white/20" />
                    <h4 className="text-[22px] tracking-[0.1em] uppercase font-brand-secondary-heavy shrink-0">
                      THE PRINCIPLE
                    </h4>
                  </div>
                  <p className="text-white/70 text-[16px] leading-[1.9] tracking-[0em] font-brand-secondary-thin max-w-auto text-justify">
                    Most identities suffer from structural decay and the
                    accumulation of visual noise, trends, and aesthetic volume
                    designed to wow rather than to endure. We do not create
                    'looks' — we architect permanence.
                  </p>
                  <p className="text-white/70 text-[16px] leading-[1.9] tracking-[0em] font-brand-secondary-thin max-w-auto text-justify">
                    Logic over aesthetics. Foundation over trends. The result of
                    personal discipline applied to digital precision.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <span className="font-brand-secondary-thin text-[11px] text-white/40 italic leading-[1.7] tracking-[0.3em] shrink-0">
                    - BUILT TO OUTLAST THE NOISE.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: THE CORE PILLARS (CONNECTED ARCHITECTURE) */}
          <section
            className="py-32 px-10 lg:px-20 bg-gradient-to-b from-black/70 to-transparent relative overflow-hidden border-t border-white/10"
            style={{
              zIndex: 2,
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(5px)",
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.50) 100%)",
            }}
          >
            {/* HEADER LABEL */}
            <div className="flex justify-between items-end mb-20 border-b border-white/60 pb-10">
              <h3 className="about-pillars-title text-[11px] uppercase tracking-[0.5em] font-brand-secondary-heavy text-white/70">
                JUDAION CORE PILLARS | 01 — 03
              </h3>
              <span className="about-pillars-date text-[10px] font-brand-secondary-thin text-white/90 tracking-[0.5em] uppercase">
                EST.2025
              </span>
            </div>

            {/* THE CONNECTED FLEX CONTAINER */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-0 relative">
              {/* PILLAR 01 */}
              <div
                className="group w-full lg:w-[30%] flex flex-col gap-3"
                onMouseMove={(e) => handlePillarMove(e, 0)}
                onMouseLeave={handlePillarLeave}
              >
                <div className="relative border border-white/70 lg:border-white/20 lg:hover:border-white/70 border-[1px] lg:border-[2px] duration-900 rounded-sm p-5 min-h-[450px] flex flex-col justify-between overflow-hidden bg-black hover:cursor-pointer">
                  <img
                    src="/vision.webp"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-75 z-0"
                  />
                  {/* SCAN LINES — fade in on hover */}
                  <div className="absolute inset-0 z-[5] pointer-events-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px)",
                        backgroundSize: "100% 12px",
                      }}
                    />
                  </div>
                  <div className="relative z-10 space-y-5">
                    <h4 className="pillar-item-title text-[clamp(2rem,3.8vw,5.625rem)] tracking-[0.7em] font-brand-other uppercase text-white">
                      VISION
                    </h4>
                    <p className="text-white/60 text-sm tracking-[0em] font-brand-secondary-thin leading-relaxed">
                      <span className="font-brand-cn text-[clamp(16px,1.04vw,20px)] text-orange-600">
                        *{" "}
                      </span>
                      Identifying the core truth by hacking away at the
                      unessential noise.
                    </p>
                  </div>
                </div>
                {/* Asset label — visible only on hover */}
                <div
                  className={`flex items-center justify-between px-1 transition-opacity duration-300 ${hoveredPillar === 0 ? "opacity-100" : "opacity-0"}`}
                >
                  <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] text-white/40 whitespace-nowrap">
                    <span className="text-white/60">Asset 01</span>{" "}
                    &nbsp;"VISION"
                  </span>
                  <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] text-white/40 whitespace-nowrap">
                    <span className="text-white">X: </span>
                    <span className="text-white/50">{coords.x} PX</span>
                    &nbsp;&nbsp;
                    <span className="text-white">Y: </span>
                    <span className="text-white/50">{coords.y} PX</span>
                  </span>
                </div>
              </div>

              {/* CONNECTOR LINE 1 */}
              <div className="hidden lg:flex flex-col justify-center items-center w-[5%] h-px space-y-2">
                <div className="w-full h-[1px] bg-white/40"></div>
                <div className="w-full h-[1px] bg-white/10"></div>
                <div className="w-full h-[1px] bg-white/40"></div>
              </div>

              {/* PILLAR 02 */}
              <div
                className="group w-full lg:w-[30%] flex flex-col gap-3"
                onMouseMove={(e) => handlePillarMove(e, 1)}
                onMouseLeave={handlePillarLeave}
              >
                <div className="relative border border-white/70 lg:border-white/20 lg:hover:border-white/70 border-[1px] lg:border-[2px] duration-800 rounded-sm p-5 min-h-[450px] flex flex-col justify-between overflow-hidden bg-black hover:cursor-pointer">
                  <img
                    src="/structure.webp"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-75 z-0"
                  />
                  {/* SCAN LINES — fade in on hover */}
                  <div className="absolute inset-0 z-[5] pointer-events-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px)",
                        backgroundSize: "100% 12px",
                      }}
                    />
                  </div>
                  <div className="relative z-10 space-y-80">
                    <h4 className="pillar-item-title2 text-[clamp(2rem,3.8vw,5.625rem)] tracking-[0.3em] font-brand-other uppercase text-white">
                      STRUCTURE
                    </h4>
                    <p className="text-white/75 text-sm tracking-[0em] font-brand-secondary-thin leading-relaxed">
                      <span className="font-brand-cn text-[clamp(16px,1.04vw,20px)] text-orange-600">
                        *{" "}
                      </span>
                      Engineering a rigid framework designed to withstand the
                      pressure of trends.
                    </p>
                  </div>
                </div>
                {/* Asset label — visible only on hover */}
                <div
                  className={`flex items-center justify-between px-1 transition-opacity duration-300 ${hoveredPillar === 1 ? "opacity-100" : "opacity-0"}`}
                >
                  <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] text-white/40 whitespace-nowrap">
                    <span className="text-white/60">Asset 02</span>{" "}
                    &nbsp;"STRUCTURE"
                  </span>
                  <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] text-white/40 whitespace-nowrap">
                    <span className="text-white">X: </span>
                    <span className="text-white/50">{coords.x} PX</span>
                    &nbsp;&nbsp;
                    <span className="text-white">Y: </span>
                    <span className="text-white/50">{coords.y} PX</span>
                  </span>
                </div>
              </div>

              {/* CONNECTOR LINE 2 */}
              <div className="hidden lg:flex flex-col justify-center items-center w-[5%] h-px space-y-2">
                <div className="w-full h-[1px] bg-white/10"></div>
                <div className="w-full h-[1px] bg-white/10"></div>
                <div className="w-full h-[1px] bg-white/40"></div>
              </div>

              {/* PILLAR 03 */}
              <div
                className="group w-full lg:w-[30%] flex flex-col gap-3"
                onMouseMove={(e) => handlePillarMove(e, 2)}
                onMouseLeave={handlePillarLeave}
              >
                <div className="relative border border-white/70 lg:border-white/20 lg:hover:border-white/70 border-[1px] lg:border-[2px] duration-800 rounded-sm p-5 min-h-[450px] flex flex-col justify-between overflow-hidden bg-black hover:cursor-pointer">
                  <img
                    src="/identity.webp"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-75 z-0"
                  />
                  {/* SCAN LINES — fade in on hover */}
                  <div className="absolute inset-0 z-[5] pointer-events-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 12px)",
                        backgroundSize: "100% 12px",
                      }}
                    />
                  </div>
                  <div className="relative z-10 ">
                    <h4 className="pillar-item-title3 text-[clamp(2rem,3.9vw,5.625rem)] tracking-[0.4em] font-brand-other uppercase text-white">
                      IDENTITY
                    </h4>
                    <p className="text-white/60 text-sm tracking-[0em] font-brand-secondary-thin leading-relaxed max-w-[350px]">
                      <span className="font-brand-cn text-[clamp(16px,1.04vw,20px)] text-orange-600">
                        *{" "}
                      </span>
                      Deploying a monochromatic signature that commands
                      permanence in a crowded landscape.
                    </p>
                  </div>
                </div>
                {/* Asset label — visible only on hover */}
                <div
                  className={`flex items-center justify-between px-1 transition-opacity duration-300 ${hoveredPillar === 2 ? "opacity-100" : "opacity-0"}`}
                >
                  <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] text-white/40 whitespace-nowrap">
                    <span className="text-white/60">Asset 03</span>{" "}
                    &nbsp;"IDENTITY"
                  </span>
                  <span className="font-brand-cn text-[10px] uppercase tracking-[0.15em] text-white/40 whitespace-nowrap">
                    <span className="text-white">X: </span>
                    <span className="text-white/50">{coords.x} PX</span>
                    &nbsp;&nbsp;
                    <span className="text-white">Y: </span>
                    <span className="text-white/50">{coords.y} PX</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: FULL-WIDTH CINEMATIC VIDEO */}
          <section className="h-[80vh] w-full bg-black/20 overflow-hidden relative">
            <video
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover grayscale hover:scale-105 transition-transform duration-[3s]"
            >
              <source
                src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Section%204%20JDS-section-4-color.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>

            {/* OVERLAY CONTENT */}
            <div className="absolute inset-0 flex flex-col justify-end pl-12 lg:p-20 pb-5 lg:pb-15">
              <h2 className="commitment-heading text-white text-[clamp(2rem,3.9vw,5.625rem)] font-brand-other tracking-[0.2em] uppercase">
                Where Commitment Meets the Grid
              </h2>

              {/* PARAGRAPH TEXT MOVED INSIDE FLEX CONTAINER */}
              <p className="commitment-body-text hidden lg:block max-w-2xl text-justify text-white/60 text-[13px] leading-[1.6] tracking-[0em] font-brand-secondary-thin">
                The result of personal discipline applied to digital precision.
                WE don't create brands based on aesthetics and trends. We build
                identities rooted in logic and structure designed to endure. The
                commitment to permanence is the commitment that lasts.
              </p>
            </div>

            <div className="absolute inset-0 z-10 p-12 pointer-events-none">
              {/* Top Right: Status Marker */}
              <div className="absolute top-8 right-8 flex flex-col p-4">
                <span className="archive-status-tag text-[10px] tracking-[0.2em] uppercase text-white/30 font-brand-secondary-thin">
                  LOG-ID: ZJP-EXT-02
                </span>
                <span className="archive-status-tag text-[10px] tracking-[0.2em] text-white/30 uppercase font-brand-secondary-thin">
                  CLEARANCE: LEVEL-04
                </span>
                <span className="archive-status-tag text-[10px] tracking-[0.2em] text-white/30 uppercase font-brand-secondary-thin">
                  SUBJECT: THE ARCHITECT
                </span>
              </div>

              {/* TOP LEFT: LIVE FEED STATUS */}
              <div className="absolute top-8 left-8 flex items-center  space-x-4  p-4 pointer-events-none">
                {/* PULSING ASSET */}
                <span className="archive-pulse-icon w-3 h-3 bg-orange-600 animate-pulse rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />

                {/* LIVE TEXT LABELS */}
                <div className="flex flex-col">
                  <span className="studio-feed-title text-[11px] tracking-[0.4em] uppercase text-white/90 font-brand-secondary-heavy">
                    Studio Feed
                  </span>
                  <span className="archive-status-tag text-[9px] tracking-[0.2em] text-white/30 uppercase font-brand-secondary-thin">
                    SESSION-LOG: [06/04/25]
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: THE LEADERSHIP (SPLIT ARCHITECTURE) */}
          <section className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-transparent relative overflow-hidden">
            {/* THE GRADIENT OVERLAY */}
            <div className="absolute inset-0  bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

            {/* LEFT BLOCK: DYNAMIC IMAGE SWITCH */}
            <div className="relative z-10 h-[70vh] lg:h-screen overflow-hidden group cursor-pointer">
              {/* IMAGE 01: INITIAL STATE (Arms Crossed) */}
              <img
                src="/ZJ-1.webp"
                alt="Lead Architect - State A"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0"
              />

              {/* IMAGE 02: HOVER STATE (Hand in Pocket) */}
              <img
                src="/ZJ-2.webp"
                alt="Lead Architect - State B"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-90 group-hover:scale-100"
              />
            </div>

            {/* RIGHT BLOCK: NAME & BIO */}
            <div className="relative overflow-hidden flex flex-col justify-between p-12 lg:p-32 h-full bg-cover bg-center bg-no-repeat rounded-sm border border-white/10">
              <picture>
                <source srcSet={archiveheaderAvif.src} type="image/avif" />
                <img
                  src={archiveheaderWebp.src}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover object-center -z-20"
                />
              </picture>

              <div
                className="absolute inset-0 bg-black/60 -z-10"
                aria-hidden="true"
              />

              {/* CENTER BLOCK: IDENTITY & BIO (Spaced for maximum authority) */}
              <div className="flex flex-col space-y-20 py-24">
                <div className="space-y-6">
                  <h2 className="architect-signature-name text-[clamp(2rem,4.5vw,6.625rem)] font-brand-other uppercase tracking-[0.2em] text-white leading-none">
                    <span className="border-b-2 border-white ">
                      ZION{" "}
                      <span className="font-brand-other text-white">
                        PARKER
                      </span>
                    </span>
                  </h2>

                  {/* ROLE TITLE */}
                  <div className="flex items-center space-x-4">
                    <span className="architect-signature-title text-[clamp(1.5rem,1.8vw,2.25rem)] tracking-[0.4em] uppercase text-white/89 font-brand-cn italic">
                      Chief Creative Officer
                    </span>
                  </div>
                </div>

                <p className="text-white/60 text-sm lg:text-base leading-relaxed tracking-[0em] font-brand-secondary-thin max-w-auto text-justify">
                  Zion Judah Parker is the architect of the JUDAION system. His
                  methodology focuses on Extracting the core Truth of an
                  organisation to build identities backed by Structural Logic.
                  Guided by a philosophy of permanence, he engineers enduring
                  brand foundations for founders who require their visual
                  presence to operate with absolute authority.
                </p>
              </div>

              {/* BOTTOM ANCHOR: SIGNATURE / INDEX */}
              <div className="pt-8 border-t border-white/20">
                <span className="operational-lead text-[10px] tracking-[0.16em] uppercase text-white/30 font-brand-secondary-thin">
                  JUDAION (Pty) Ltd is a registered studio in the Republic of
                  South Africa. All rights reserved. &copy; 2025
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 6: THE CALL TO ACTION (FINAL PROTOCOL) */}
          <section className="about-cta-section h-[70vh] w-full flex flex-col lg:flex-row items-center justify-between px-12 lg:px-32 border-t border-white/10 bg-transparent relative overflow-hidden"
                      style={{
              zIndex: 2,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(5px)",
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.70) 100%)",
            }}
          >
          
            {/* LEFT: TEXT STACK */}
            <div className="flex flex-col items-start space-y-4">
              <span className="cta-meta-tag text-[10px] uppercase tracking-[1em] text-white/40 font-brand-secondary-thin">
                [NEXT FLOOR]
              </span>
              <h2 className="cta-main-title text-4xl lg:text-6xl font-brand-cn tracking-[0.3em] uppercase text-white leading-tight">
                BUILD YOUR <br />
                <span className="cta-accent-title font-brand-other text-white text-[90px] ">
                  AUTHORITY
                </span>
              </h2>
            </div>

            {/* RIGHT: CTA ASSET ANCHOR */}
            <div className="relative group cursor-pointer mt-13 lg:mt-0">
              <Link
                href="/contact"
                className="relative z-10 overflow-hidden  p-5 transition-all duration-500 hover:border-orange-600/50 cursor-pointer"
              >
                <img
                  src="/CTA.webp"
                  alt="Execute Protocol"
                  loading="lazy"
                  className="w-64 lg:w-150 h-auto "
                />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
