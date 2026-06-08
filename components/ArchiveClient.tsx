"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ArchiveCatalogue() {
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [, setIsPlaying] = useState(false);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);
  const focusScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);
  const audioSuppressedByVideoRef = useRef(false);

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const activeItem = scrollRef.current.querySelector(
        '[data-active="true"]',
      );
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [activeCategory, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

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
      audio
        .play()
        .then(() => {
          fadeIn();
          setIsAudioOn(true);
        })
        .catch(() => {});
    }

    function onVisibilityChange() {
      if (!started) return;
      if (document.hidden) {
        audio.volume = 0;
      } else if (!isMutedRef.current) {
        audio.volume = 0.35;
      }
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

  // Lock page scroll + ESC to close while the focus view is open
  useEffect(() => {
    document.body.style.overflow = selectedProject ? "hidden" : "";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProject(null);
    };
    if (selectedProject) document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProject]);

  // Smooth inertia scroll for the focus view container.
  // Intercepts wheel events and lerps scrollTop toward the target each rAF
  // frame — same technique used by Lenis / Locomotive under the hood.
  useEffect(() => {
    const el = focusScrollRef.current;
    if (!el || !selectedProject) return;

    el.scrollTop = 0;
    let target = 0;
    let rafId = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Normalise across delta modes: LINE (mice) → px, PAGE → container height
      const delta =
        e.deltaMode === 1
          ? e.deltaY * 16
          : e.deltaMode === 2
            ? e.deltaY * el.clientHeight
            : e.deltaY;
      target = Math.max(
        0,
        Math.min(target + delta, el.scrollHeight - el.clientHeight),
      );
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const tick = () => {
      const dist = target - el.scrollTop;
      if (Math.abs(dist) < 0.5) {
        el.scrollTop = target;
        rafId = 0;
        return;
      }
      // Lerp factor: 0.1 = silky, 0.15 = snappier
      el.scrollTop += dist * 0.1;
      rafId = requestAnimationFrame(tick);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(rafId);
    };
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && Array.isArray(selectedProject.file_url)) {
      selectedProject.file_url.forEach((url: string) => {
        const extension = url.split(".").pop()?.toLowerCase();
        if (["jpg", "jpeg", "png", "webp", "avif"].includes(extension || "")) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [selectedProject]);

  async function fetchData() {
    try {
      setLoading(true);
      const timer = new Promise((resolve) => setTimeout(resolve, 3000));
      const fetchProjects = supabase
        .from("archive")
        .select("*")
        .order("created_at", { ascending: false });
      const fetchCategories = supabase
        .from("catalogue_categories")
        .select("name");
      const [projectsRes, categoriesRes] = await Promise.all([
        fetchProjects,
        fetchCategories,
        timer,
      ]);
      const projectData = projectsRes.data || [];
      setCategories([{ name: "All" }, ...(categoriesRes.data || [])]);

      // Preload every thumbnail so the grid renders from cache — guaranteed simultaneous reveal
      const thumbnailUrls = projectData
        .map((p: any) => (Array.isArray(p.file_url) ? p.file_url[0] : p.file_url))
        .filter(Boolean);
      await Promise.all(
        thumbnailUrls.map((url: string) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => resolve();
            img.src = url;
          }),
        ),
      );

      setProjects(projectData);
    } catch (err) {
      console.error("System Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = projects.filter(
    (p) => activeCategory === "All" || p.category === activeCategory,
  );

  if (loading)
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source
            src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
            type="video/mp4"
          />
        </video>
        <img src="/j-logo.svg" alt="Loading" className="loader-j opacity-80 relative z-10" />
        <span className="loader-text font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80 relative z-10" />
      </div>
    );

  return (
    <main className="relative bg-black">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "black",
          zIndex: 999,
          pointerEvents: "none",
        }}
      />

      <div className="min-h-screen relative text-white font-brand-secondary-thin antialiased overflow-x-hidden bg-black">
        {/* Fixed video background */}
        <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
          <video
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source
              src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/70 pointer-events-none" />
        </div>

        {/* ── HEADER ── */}
        <header
          className="relative bg-black backdrop-blur-sm px-6 lg:px-35 pt-10 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sticky top-0 z-30 transition-all duration-500 overflow-hidden shadow-2xl border-b border-white/10"
          style={{
            backgroundImage: "url('/archive-header.avif')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
          <div className="flex flex-col">
            <div className="flex items-end justify-between w-full relative"></div>

            <div className="flex items-end gap-5">
              <Link
                href="/projectarchive"
                className="flex items-center cursor-pointer group mb-0 self-start"
              >
                <motion.img
                  src="/return-to.webp"
                  className="pt-8 w-22 h-auto opacity-70 group-hover:opacity-100"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </Link>

              <button
                onClick={toggleAudio}
                className="pt-8 mb-1 self-end flex items-end gap-[3px] opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              >
                {(
                  [
                    { anim: "soundBarB", dur: "1.2s", delay: "0s", maxH: 10 },
                    {
                      anim: "soundBarA",
                      dur: "1.95s",
                      delay: "0.4s",
                      maxH: 16,
                    },
                    {
                      anim: "soundBarC",
                      dur: "1.05s",
                      delay: "0.2s",
                      maxH: 13,
                    },
                    { anim: "soundBarA", dur: "1.3s", delay: "0.7s", maxH: 18 },
                    {
                      anim: "soundBarB",
                      dur: "0.90s",
                      delay: "0.35s",
                      maxH: 12,
                    },
                    {
                      anim: "soundBarC",
                      dur: "1.15s",
                      delay: "0.55s",
                      maxH: 15,
                    },
                  ] as const
                ).map((bar, i) => (
                  <span
                    key={i}
                    className={`block w-[2px] bg-white rounded-full origin-bottom ${isAudioOn ? "animate-sound-bar" : ""}`}
                    style={{
                      height: isAudioOn ? `${bar.maxH}px` : "3px",
                      animationName: isAudioOn ? bar.anim : "none",
                      animationDuration: bar.dur,
                      animationDelay: bar.delay,
                      transition: "height 0.4s ease",
                    }}
                  />
                ))}
              </button>
            </div>
          </div>

          <nav
            ref={scrollRef as any}
            className="archive-nav-scroller flex flex-wrap gap-x-8 gap-y-2 mb-1"
          >
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                data-active={activeCategory === cat.name}
                className={`text-[18px] font-brand-cn uppercase tracking-widest transition-all duration-300 relative pb-1 cursor-pointer ${
                  activeCategory === cat.name
                    ? "text-white/40"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {cat.name}
                {activeCategory === cat.name && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-700" />
                )}
              </button>
            ))}
          </nav>
        </header>

        {/* ── COSMOS-STYLE MASONRY GRID ── */}
        <main className="relative z-10 px-3 lg:px-6 pb-24 pt-7">
          {/* Desktop: CSS columns masonry */}
          {!isMobile ? (
            <div key={activeCategory} className="columns-2 lg:columns-3 xl:columns-4 gap-7">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="break-inside-avoid mb-7 group cursor-pointer relative overflow-hidden bg-[#111] border border-white/10 rounded"
                  onClick={() => {
                    setSelectedProject(item);
                    setIsPlaying(false);
                    setCurrentAssetIndex(0);
                    setImageLoading(true);
                  }}
                >
                  {/* Main image — no thumbnail overlay, full bleed */}
                  <img
                    src={
                      Array.isArray(item.file_url)
                        ? item.file_url[0]
                        : item.file_url
                    }
                    alt={item.title}
                    className="w-full h-auto block object-cover grid-image-reveal"
                  />
                  {/* Hover overlay with title */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-6">
                    <p className="font-brand-other text-white text-[16px] uppercase tracking-[0.15em] leading-tight text-center">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Mobile: 2-column tight grid */
            <div key={activeCategory} className="grid grid-cols-2 gap-2">
              {filtered.map((item, index) => (
                <div
                  key={item.id}
                  className={`group cursor-pointer relative overflow-hidden bg-[#111] border border-white/10 rounded ${index % 5 === 0 ? "col-span-2" : ""}`}
                  onClick={() => {
                    setSelectedProject(item);
                    setIsPlaying(false);
                    setCurrentAssetIndex(0);
                    setImageLoading(true);
                  }}
                >
                  <img
                    src={
                      Array.isArray(item.file_url)
                        ? item.file_url[0]
                        : item.file_url
                    }
                    alt={item.title}
                    className={`w-full object-cover block grid-image-reveal ${index % 5 === 0 ? "h-[50vw]" : "h-[55vw]"}`}
                  />
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-center justify-center px-4 py-2 backdrop-blur-sm">
                    <p className="font-brand-other text-white text-[13px] uppercase tracking-[0.1em] leading-tight text-center">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-80">
              <span className="font-brand-secondary-thin text-[10px] uppercase tracking-[0.5em] text-white/80">
                Nothing to see here...YET
              </span>
            </div>
          )}
        </main>

        {/* ── FOCUS VIEW ── */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed inset-0 z-[100]"
              style={{
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                background: "rgba(0,0,0,0.88)",
              }}
            >
              {/* Exit — fixed top left, always visible while scrolling */}
              <button
                onClick={() => setSelectedProject(null)}
                className="fixed top-15 left-15 z-[200] flex items-center gap-2 font-brand-bold text-[15px] uppercase tracking-[0.1em] text-white hover:text-white transition-colors duration-200 cursor-pointer"
              >
                Exit
                <span className="hidden lg:inline font-brand-secondary-thin text-[10px] tracking-[0.2em] text-white/50">
                  [ESC]
                </span>
              </button>

              {/* Music toggle — fixed top right, mirrors Exit position */}
              <button
                onClick={toggleAudio}
                className="fixed top-15 right-15 z-[200] flex items-center gap-3 cursor-pointer group"
                aria-label={isAudioOn ? "Mute music" : "Unmute music"}
              >
                <span className="hidden lg:inline font-brand-secondary-thin text-[10px] tracking-[0.2em] text-white/50"></span>
                <div className="flex items-end gap-[3px] h-4">
                  {[1, 0.5, 0.8, 0.3, 0.9].map((h, i) =>
                    isAudioOn ? (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-white/60 group-hover:bg-white transition-colors duration-200"
                        animate={{ scaleY: [h, 1, h * 0.4, 0.9, h] }}
                        transition={{
                          duration: 0.8 + i * 0.15,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.1,
                        }}
                        style={{ height: "100%", transformOrigin: "bottom" }}
                      />
                    ) : (
                      <div
                        key={i}
                        className="w-[3px] rounded-full bg-white/20 transition-colors duration-200"
                        style={{ height: `${h * 100}%` }}
                      />
                    ),
                  )}
                </div>
              </button>

              {/* Single scrollable container — two sections stacked */}
              <div
                ref={focusScrollRef}
                className="h-full overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {/*
                  ── SECTION 1: IMAGE FOCUS ──────────────────────────────────
                */}
                <section
                  className="relative flex items-center justify-center sticky top-0 bg-black"
                  style={{ height: "100vh", minHeight: "100vh", zIndex: 1 }}
                >
                  {/* Grain video background */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
                  >
                    <source
                      src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
                      type="video/mp4"
                    />
                  </video>
                  {/* Image + selector row */}
                  <div
                    className={`flex items-center justify-center gap-5 px-16 w-full h-full ${isMobile ? "flex-col gap-4 px-6 pt-16 pb-20" : ""}`}
                  >
                    {/* ── MAIN ASSET ── */}
                    <div
                      className={`relative flex items-center justify-center ${isMobile ? "w-full flex-1" : "h-[80vh] max-w-[70vw] flex-shrink-0"}`}
                    >
                      {(() => {
                        const url = Array.isArray(selectedProject.file_url)
                          ? selectedProject.file_url[currentAssetIndex]
                          : selectedProject.file_url;
                        const ext = url?.split(".").pop()?.toLowerCase();
                        if (["mp4", "webm", "ogg"].includes(ext || "")) {
                          return (
                            <video
                              key={url}
                              src={url}
                              controls
                              className="object-contain max-h-full max-w-full border border-white/20 shadow-2xl rounded-sm"
                              preload="auto"
                              onPlay={() => {
                                const audio = audioRef.current;
                                if (audio && !isMutedRef.current) {
                                  audio.volume = 0;
                                  audioSuppressedByVideoRef.current = true;
                                  setIsAudioOn(false);
                                }
                              }}
                              onPause={() => {
                                const audio = audioRef.current;
                                if (
                                  audio &&
                                  audioSuppressedByVideoRef.current
                                ) {
                                  audio.volume = 0.35;
                                  isMutedRef.current = false;
                                  audioSuppressedByVideoRef.current = false;
                                  setIsAudioOn(true);
                                }
                              }}
                              onEnded={() => {
                                const audio = audioRef.current;
                                if (
                                  audio &&
                                  audioSuppressedByVideoRef.current
                                ) {
                                  audio.volume = 0.35;
                                  isMutedRef.current = false;
                                  audioSuppressedByVideoRef.current = false;
                                  setIsAudioOn(true);
                                }
                              }}
                            />
                          );
                        }
                        return (
                          <div key={url} className="relative flex items-center justify-center" style={{ maxHeight: isMobile ? "48vh" : "83vh" }}>
                            {imageLoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                                <img src="/j-logo.svg" alt="Loading" className="loader-j opacity-80" />
                                <span className="loader-text font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80" />
                              </div>
                            )}
                            <img
                              src={url}
                              alt={selectedProject.title}
                              className="object-contain max-h-full max-w-full border border-white/20 shadow-2xl rounded-sm"
                              style={{ maxHeight: isMobile ? "48vh" : "83vh", opacity: imageLoading ? 0 : 1, transition: "opacity 0.3s ease" }}
                              onLoad={() => setImageLoading(false)}
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* ── THUMBNAIL SELECTOR STRIP ── */}
                    {Array.isArray(selectedProject.file_url) &&
                      selectedProject.file_url.length > 1 && (
                        <div
                          className={`flex shrink-0 ${isMobile ? "flex-row gap-3 overflow-x-auto w-full justify-center" : "flex-col gap-3 overflow-y-auto max-h-[80vh]"}`}
                          style={{ scrollbarWidth: "none" }}
                        >
                          {selectedProject.file_url.map(
                            (url: string, idx: number) => {
                              const ext = url?.split(".").pop()?.toLowerCase();
                              const isVid = ["mp4", "webm", "ogg"].includes(
                                ext || "",
                              );
                              const isActive = idx === currentAssetIndex;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setCurrentAssetIndex(idx);
                                    setImageLoading(true);
                                  }}
                                  className={`w-[72px] h-[72px] shrink-0 relative overflow-hidden cursor-pointer transition-all duration-200 ${
                                    isActive
                                      ? "border-[1px] border-white opacity-100"
                                      : "border border-white/10 opacity-60 hover:opacity-80 hover:border-white/30"
                                  }`}
                                >
                                  {isVid ? (
                                    <>
                                      <video
                                        src={`${url}#t=0.1`}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="white"
                                          opacity="0.8"
                                        >
                                          <polygon points="5,3 19,12 5,21" />
                                        </svg>
                                      </div>
                                    </>
                                  ) : (
                                    <img
                                      src={url}
                                      alt={`Asset ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}
                  </div>

                  {/* Scroll hint — bottom right of section 1 */}
                  <div className="absolute bottom-8 right-6 flex items-center pointer-events-none">
                    <span className="hidden lg:inline font-brand-secondary-thin text-[10px] tracking-[0.3em] uppercase text-white/30">
                      [Scroll to Inspect]
                    </span>
                    <motion.img
                      src="/scroll-up.png"
                      alt="Scroll"
                      className="w-20 h-20 opacity-80"
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </section>

                {/*
                  ── SECTION 2: PROJECT DETAILS ──────────────────────────────
                */}
                <section
                  className="relative min-h-screen border-t border-white/10 flex flex-col"
                  style={{
                    zIndex: 2,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(15px)",
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.60) 100%)",
                  }}
                >
                  {/* flex-1 wrapper grows to fill section, pushing footer to the bottom */}
                  <div className="flex-1">
                    {/* Subtle top rule with upward arrow — visual cue you can scroll back */}
                    <div className="flex justify-center pt-10 pb-4 opacity-90">
                      <svg width="10" height="10" viewBox="0 0 8 5" fill="none">
                        <path
                          d="M0 5L4 0L8 5"
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>

                    {/* Two-column content */}
                    <div
                      className={`flex ${isMobile ? "flex-col" : "flex-row"} max-w-[1200px] mx-auto px-8 lg:px-16 py-12 gap-10 lg:gap-20`}
                    >
                      {/* LEFT — description */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h2
                          className={`font-brand-bold uppercase text-white leading-[0.92] tracking-[0.04em] mb-4 ${isMobile ? "text-[32px]" : "text-[44px] lg:text-[54px]"}`}
                        >
                          Project Description
                        </h2>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-8">
                          <div className="flex-1 h-[1px] bg-white" />
                        </div>

                        {/* Description — no scroll cap, flows naturally */}
                        <p className="font-brand-secondary-thin text-[13px] leading-[1.9] text-white/60 whitespace-pre-wrap tracking-[0em] text-justify">
                          {selectedProject.content}
                        </p>

                        {/* ── VIEW THE LIVE ASSET ── */}
                        {(selectedProject.instagram_url ||
                          selectedProject.linkedin_url) && (
                          <div className="mt-8 pt-5 border-t border-white/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {selectedProject.instagram_url && (
                                <a
                                  href={selectedProject.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-80 hover:opacity-100 transition-opacity duration-200"
                                >
                                  <svg
                                    width="30"
                                    height="30"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="2"
                                      y="2"
                                      width="20"
                                      height="20"
                                      rx="5"
                                      ry="5"
                                    />
                                    <circle cx="12" cy="12" r="4" />
                                    <circle
                                      cx="17.5"
                                      cy="6.5"
                                      r="0.5"
                                      fill="white"
                                      stroke="none"
                                    />
                                  </svg>
                                </a>
                              )}
                              {selectedProject.linkedin_url && (
                                <a
                                  href={selectedProject.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-40 hover:opacity-100 transition-opacity duration-200"
                                >
                                  <svg
                                    width="25"
                                    height="25"
                                    viewBox="0 0 24 24"
                                    fill="white"
                                  >
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.２２７ ２４ ２２．２７１V１．７２９C２４．００３ .７７４ ２３．２ ０ ２２．２２２ ０h．００３z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            <span className="font-brand-cn text-[15px]  tracking-[0.1em] text-white/50">
                              judaion.studios
                            </span>
                          </div>
                        )}
                      </div>

                      {/* RIGHT — product details panel (Flyerwrk baseline layout) */}
                      <div
                        className={`shrink-0 ${isMobile ? "w-full" : "w-[400px]"}`}
                      >
                        <div
                          className="border border-white/15 p-6 sticky top-8 relative overflow-hidden rounded-sm"
                          style={{
                            backgroundImage: "url('/archive-header.avif')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                          <div className="relative z-10">
                            {/* ── HEADER ── */}
                            <h3 className="font-brand-other text-[16px] uppercase tracking-[0.2em] text-white mb-4">
                              {selectedProject.title}
                            </h3>
                            <div className="h-px bg-white/15 mb-5" />

                            {/* ── METADATA ROWS — label left, value right, no row dividers ── */}
                            <div className="flex flex-col gap-1 mb-5">
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[10px] uppercase tracking-[0.12em] text-white">
                                  Category
                                </span>
                                <span className="font-brand-secondary-thin text-[10px] text-white/55">
                                  {selectedProject.category}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[10px] uppercase tracking-[0.12em] text-white">
                                  Type
                                </span>
                                <span className="font-brand-secondary-thin text-[10px] text-white/55">
                                  {selectedProject.resource_type}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[10px] uppercase tracking-[0.12em] text-white">
                                  Number of Assets
                                </span>
                                <span className="font-brand-secondary-thin text-[10px] text-white/55">
                                  {Array.isArray(selectedProject.file_url)
                                    ? selectedProject.file_url.length
                                    : 1}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[10px] uppercase tracking-[0.12em] text-white">
                                  Uploaded
                                </span>
                                <span className="font-brand-secondary-thin text-[10px] text-white/55">
                                  {new Date(selectedProject.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              </div>
                              <div className="flex justify-between items-start py-1">
                                <span className="font-brand-bold text-[10px] uppercase tracking-[0.12em] text-white shrink-0">
                                  File Type
                                </span>
                                <div className="flex flex-col items-end gap-0.5">
                                  {(() => {
                                    const urls = Array.isArray(selectedProject.file_url) ? selectedProject.file_url : [selectedProject.file_url];
                                    const exts = [...new Set<string>(urls.map((u: string) => u?.split(".").pop()?.toUpperCase() ?? "").filter(Boolean))];
                                    return exts.map((ext: string) => (
                                      <span key={ext} className="font-brand-secondary-thin text-[10px] text-white/55">{ext}</span>
                                    ));
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* ── DIVIDER ── */}
                            <div className="h-px bg-white/15 mb-5" />

                            {/* ── FEATURE CHECKLIST ── */}
                            <div className="flex flex-col gap-[10px] mb-6">
                              {["Assets created and pubished by JUDAION (Pty) Ltd", "Vision. Structure. Identity."].map((feat) => (
                                <div key={feat} className="flex items-center gap-3">
                                  <span className="font-brand-cn text-[20px] text-orange-600 shrink-0 leading-none">*</span>
                                  <span className="font-brand-secondary-thin text-[11px] text-white/45 tracking-wide">
                                    {feat}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* — CTA BUTTON — white bg, brand icon left, label centre-left, price right — */}
                            <button className="w-full flex items-center bg-white text-black px-4 py-[11px] mb-5 cursor-pointer rounded-sm border border-neutral-200">
                              {/* Left: Icon and Vertical Separator */}
                              <div className="flex items-center gap-4">
                                <img
                                  src="/box-icon.png"
                                  alt="Box icon"
                                  className="h-8 w-auto object-contain"
                                />
                                <div className="h-8 w-[2px] bg-black" />
                              </div>

                              {/* Center-Left: Main Label */}
                              <span className="font-brand-bold text-[18px] uppercase tracking-[0.12em] ml-4">
                                Project Archive '26
                              </span>
                            </button>
                          </div>
                          {/* end relative z-10 */}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── JOIN THE CLUB + FOOTER ── */}
                  <div
                    className="relative overflow-hidden border-t border-white/10 px-8 lg:px-16 pt-16 pb-12 flex flex-col gap-10"
                    style={{
                      backgroundImage: "url('/archive-header.avif')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Dark overlay so text stays readable over the image */}
                    <div className="absolute inset-0 bg-black/60 pointer-events-none" />

                    {/* Content sits above the overlay */}
                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      {/* Left — logo + subtext */}
                      <div>
                        <img
                          src="/judaion-logo-white.svg"
                          alt="Judaion"
                          className="h-10 w-auto opacity-80 mb-2"
                        />
                      </div>

                      {/* Right — copyright text */}
                      <p className="relative font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/50 text-right">
                        Copyright © {new Date().getFullYear()} Judaion Studios.
                        All Rights Reserved.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
