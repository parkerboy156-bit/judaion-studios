"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Tier2() {
  const router = useRouter();
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const urls = ["/tier2-bg.webp", "/tier2-environment.webp", "/tier2-front-door.webp"];
    let count = 0;
    urls.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => { if (++count === urls.length) setAssetsLoaded(true); };
      img.src = src;
    });
  }, []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);

  // --- Parallax (front-door layer only) ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { stiffness: 22, damping: 18 };
  const smoothX = useSpring(mouseX, springCfg);
  const smoothY = useSpring(mouseY, springCfg);

  const doorX = useTransform(smoothX, [-1, 1], [-14, 14]);
  const doorY = useTransform(smoothY, [-1, 1], [-9,   9]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width  * 2 - 1);
    mouseY.set((e.clientY - r.top)  / r.height * 2 - 1);
  }
  function handleMouseLeave() { mouseX.set(0); mouseY.set(0); }

  useEffect(() => {
    const audio = new Audio("/audio/archive-bg-music.mp3");
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
      audio.volume = 0;
      isMutedRef.current = true;
      setIsAudioOn(false);
    } else {
      audio.volume = 0.35;
      isMutedRef.current = false;
      setIsAudioOn(true);
    }
  }

  const deliverables = [
    {
      what: "STRATEGIC 5-PAGE WEBSITE",
      details: [
        "– Home, Methodology, Services, About and Contact-Us OR Based on structure established in Questionnaire.",
      ],
    },
    {
      what: "UX / UI ARCHITECTURE",
      details: [
        "– Conversion-led design guiding visitors toward a defined action (form submission, call).",
      ],
    },
    {
      what: "MOBILE-RESPONSIVENESS ENGINEERING",
      details: [
        "– Ensuring the site looks good and is fully functional across all screen sizes.",
      ],
    },
    {
      what: "ON-PAGE SEO FOUNDATION",
      details: [
        "– Correct Meta Tags (H1, H2) structured for Google indexability.",
      ],
    },
    {
      what: "BASIC COPYWRITING INTEGRATION",
      details: [
        "– Structuring About-Us page and Services text to be persuasive, not just descriptive.",
      ],
    },
    {
      what: "DIGITAL BRAND ASSET INTEGRATION",
      details: [
        "– All logos, icons and typography integrated and archived in a dedicated assets folder within the ZIP.",
      ],
    },
    {
      what: "PERFORMANCE SPEED OPTIMISATION",
      details: [
        "– All assets are optimised, a performance audit report is also included for reassurance.",
      ],
    },
  ];

  return (
    <main className="relative bg-black">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "black",
          zIndex: 999,
          pointerEvents: "none",
        }}
      />

      <div className="flex flex-col lg:flex-row w-full min-h-screen lg:h-screen bg-[#0a0a0a] lg:overflow-hidden font-mono selection:bg-orange-600">
        {/* --- LEFT COLUMN: THE SPECIFICATION BLOCK --- */}
        <div className="relative w-full lg:w-[52%] h-full overflow-hidden flex flex-col z-30 pt-12 lg:pt-20 pb-4 lg:pb-6 px-12 xl:px-16">
          {/* VIDEO BACKGROUND */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source
                src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4"
                type="video/mp4"
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/40" />
          </div>

          {/* LEFT COLUMN BACKDROP */}
          <div className="absolute inset-0 z-[1] pointer-events-none bg-black/60" />

          {/* HEADER BANNER */}
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
            <div className="relative z-10 px-12 xl:px-16 pt-8 lg:pt-18 pb-7 lg:pb-12">
              <h2 className="text-white font-brand-other text-[clamp(2.5rem,7vw,5.625rem)] uppercase tracking-[0.46em] leading-[1.1]">
                FRONT-DOOR
              </h2>
              <div className="mt-4 lg:mt-5 flex items-center gap-4">
                <p className="font-brand-secondary-thin text-[11px] text-white/55 leading-[1.7] tracking-[0.3em] shrink-0">
                  T2 &nbsp;|&nbsp; DIGITAL AUTHORITY
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

          {/* CONTENT WRAPPER */}
          <div className="relative z-10 flex flex-col h-full w-full">
            {/* DELIVERABLES TABLE */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col w-full pr-3"
            >
              <div className="hidden lg:flex w-full py-3 border-b border-white/20 shrink-0">
                <div className="w-[35%] text-white/30 font-brand-cn text-[clamp(0.75rem,1.2vw,0.875rem)] uppercase tracking-[0.20em]">
                  What it is
                </div>
                <div className="w-[65%] text-white/30 font-brand-cn text-[clamp(0.75rem,1.2vw,0.875rem)] uppercase tracking-[0.20em] pl-4">
                  Deliverables
                </div>
              </div>

              <div className="flex flex-col w-full pb-3">
                {deliverables.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.15, duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col lg:flex-row w-full py-2 lg:py-3 border-b border-white/20 group hover:border-white/20 transition-colors shrink-0"
                  >
                    <div className="w-full lg:w-[35%] pr-0 lg:pr-4 pb-2 lg:pb-0">
                      <h3 className="text-white font-brand-bold text-[clamp(0.75rem,1.5vw,0.875rem)] uppercase tracking-[0.05em] leading-snug">
                        {item.what}
                      </h3>
                    </div>
                    <div className="w-full lg:w-[65%] flex flex-col gap-2 pl-0 lg:pl-4">
                      {item.details.map((detail, i) => (
                        <p key={i} className="text-white/70 font-brand-secondary-thin text-[12px] leading-[1.5]">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* FOOTER BANNER */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="relative z-10 shrink-0 overflow-hidden -mx-12 xl:-mx-16 -mb-4 lg:-mb-6 border-t border-white/10"
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
                className="group flex items-center bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-neutral-200 px-4 py-[9px] cursor-pointer rounded-sm transition-colors duration-800"
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

        {/* --- RIGHT COLUMN: VISUAL ASSEMBLY --- */}
        <div
          className="relative w-[52%] h-full overflow-hidden bg-[#080808]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* LAYER 00: ATMOSPHERE — static */}
          <img
            src="/tier2-bg.webp"
            alt="Atmosphere"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* LAYER 10: ENVIRONMENT — static */}
          <img
            src="/tier2-environment.webp"
            alt="Environment"
            className="absolute inset-0 w-full h-full object-cover z-10"
          />

          {/* LAYER 20: FRONT DOOR — entry animation + parallax */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ x: doorX, y: doorY, scale: 1.01 }}
          >
            <motion.img
              initial={{ y: "-100%" }}
              animate={assetsLoaded ? { y: 0 } : { y: "-100%" }}
              transition={{ duration: 3.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              src="/tier2-front-door.webp"
              alt="Front Door Asset"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>

          {/* LOADING OVERLAY */}
          <AnimatePresence>
            {!assetsLoaded && (
              <motion.div
                key="loader"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center gap-4"
              >
                <img src="/j-logo.svg" alt="Loading" className="loader-j opacity-80" />
                <span className="loader-text font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
