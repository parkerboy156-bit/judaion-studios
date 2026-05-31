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
  const [, setImageLoading] = useState(true);
  const scrollRef = useRef<HTMLElement>(null);

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

  // Lock page scroll while the focus view is open
  useEffect(() => {
    document.body.style.overflow = selectedProject ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
      setProjects(projectData);
      setCategories([{ name: "All" }, ...(categoriesRes.data || [])]);
      projectData.forEach((project: any) => {
        const urls = Array.isArray(project.file_url)
          ? project.file_url
          : [project.file_url];
        urls.forEach((url: string) => {
          if (!url) return;
          const ext = url.split(".").pop()?.toLowerCase();
          if (["jpg", "jpeg", "png", "webp", "avif"].includes(ext || "")) {
            const img = new Image();
            img.src = url;
          }
        });
      });
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
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
        <div className="relative z-10 flex flex-col items-center">
          <div className="font-brand-secondary-thin text-[13px] tracking-[0.7em] uppercase text-white animate-pulse">
            Loading Project Archive
          </div>
        </div>
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
          className="relative bg-black backdrop-blur-sm px-6 lg:px-35 pt-10 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sticky top-0 z-30 transition-all duration-500 overflow-hidden shadow-2xl"
          style={{
            backgroundImage: "url('/archive-header.avif')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
          <div className="flex flex-col">
            <div className="flex items-end justify-between w-full relative"></div>

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
            <div className="columns-2 lg:columns-3 xl:columns-4 gap-7">
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
                    loading="lazy"
                    className="w-full h-auto block object-cover transition-transform duration-700 ease-out"
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
            <div className="grid grid-cols-2 gap-2">
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
                    loading="lazy"
                    className={`w-full object-cover block ${index % 5 === 0 ? "h-[50vw]" : "h-[55vw]"}`}
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
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed inset-0 z-[100] flex items-center justify-center"
            >
              {/* Blurred dark backdrop */}
              <div
                className="absolute inset-0"
                style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", background: "rgba(0,0,0,0.90)" }}
              />

              {/* X close — absolute top-left of screen */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 left-6 z-30 flex items-center justify-center text-white/40 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <svg width="40" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* ── MASTER LAYOUT WRAPPER ── */}
              <div className="flex flex-col lg:flex-row items-center justify-start lg:justify-center gap-6 lg:gap-15 w-full max-w-[95vw] mx-auto h-screen overflow-y-auto lg:overflow-visible py-20 lg:py-0 relative z-50">

                {/* ── LEFT PANEL — project info ── */}
                <div className="flex flex-col justify-between h-auto lg:h-[78vh] w-full lg:w-[600px] shrink-0 order-3 lg:order-none">

                  <div>
                    {/* Tag label */}
                    <div className="font-brand-cn border border-white/20 px-3 py-1.5 w-fit uppercase tracking-widest text-xs text-white/70">
                      JDS Archive &nbsp;|&nbsp; {selectedProject.category}
                    </div>

                    {/* Title */}
                    <h2 className="font-brand-other text-white text-5xl lg:text-6xl uppercase tracking-[0.05em] mt-6 mb-4 leading-[0.9]">
                      {selectedProject.title}
                    </h2>

                    {/* Rule + label */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="font-brand-cn text-[9px] uppercase tracking-[0.45em] text-white/40 whitespace-nowrap">
                        Project Description
                      </span>
                      <div className="flex-1 h-px bg-white/15" />
                    </div>

                    {/* Description */}
                    <div
                      className="desc-scroll overflow-y-scroll max-h-[40vh] pr-2"
                    >
                      <p className="font-brand-secondary-thin text-sm text-white/65 leading-relaxed whitespace-pre-wrap">
                        {selectedProject.content}
                      </p>
                    </div>
                  </div>

                  {/* Footer logo block */}
                  <div className="relative w-full h-[180px] mt-8 border border-white/10 overflow-hidden">
                    <img src="/archive-header.avif" alt="" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/30" />
                    <img src="/judaion-logo-white.svg" alt="Judaion" className="absolute inset-0 m-auto w-1/3 opacity-45" />
                  </div>
                </div>

                {/* ── CENTRE CONTAINER — main asset ── */}
                <div className="relative flex items-center justify-center h-[50vh] lg:h-[85vh] w-full lg:w-auto max-w-full lg:max-w-[55vw] shrink-0 order-1 lg:order-none">
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
                          className="object-contain max-h-full max-w-full border border-white/10 bg-black/20 shadow-2xl"
                          preload="auto"
                        />
                      );
                    }
                    return (
                      <img
                        key={url}
                        src={url}
                        alt={selectedProject.title}
                        className="object-contain max-h-full max-w-full border border-white/10 bg-black/20 shadow-2xl"
                      />
                    );
                  })()}
                </div>

                {/* ── RIGHT CONTAINER — thumbnails ── */}
                {Array.isArray(selectedProject.file_url) && selectedProject.file_url.length > 1 && (
                  <div
                    className="flex flex-row lg:flex-col gap-4 shrink-0 overflow-x-auto lg:overflow-x-visible overflow-y-visible lg:overflow-y-auto w-full lg:w-auto max-w-full lg:max-w-none max-h-none lg:max-h-[85vh] order-2 lg:order-none"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {selectedProject.file_url.map((url: string, idx: number) => {
                      const ext = url?.split(".").pop()?.toLowerCase();
                      const isVid = ["mp4", "webm", "ogg"].includes(ext || "");
                      const isActive = idx === currentAssetIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setCurrentAssetIndex(idx); setImageLoading(true); }}
                          className={`w-[80px] h-[80px] relative overflow-hidden shrink-0 cursor-pointer transition-opacity duration-300 ${
                            isActive
                              ? "border-[1.5px] border-white opacity-100"
                              : "border border-white/10 opacity-40 hover:opacity-100"
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
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.85">
                                  <polygon points="5,3 19,12 5,21" />
                                </svg>
                              </div>
                            </>
                          ) : (
                            <img src={url} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}