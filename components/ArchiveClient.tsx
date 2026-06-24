"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const VIDEO_EXTS = ["mp4", "webm", "ogg"];
const isVideoUrl = (url: string) =>
  VIDEO_EXTS.includes(url?.split(".").pop()?.toLowerCase() || "");

// Scattered "loose pile" slots by depth (0 = top, face-up & interactive).
// Alternating x + rotation reads as a dropped stack rather than a staircase.
const STACK_SLOTS = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 30, y: 22, rotate: 3, scale: 0.96 },
  { x: -28, y: 36, rotate: -2.6, scale: 0.92 },
  { x: 22, y: 50, rotate: 2.2, scale: 0.89 },
  { x: -18, y: 62, rotate: -1.8, scale: 0.86 },
];
const slotFor = (depth: number) =>
  STACK_SLOTS[Math.min(depth, STACK_SLOTS.length - 1)];

/**
 * PosterCard — one poster in the stack. Each card keeps its OWN aspect ratio
 * (`object-contain`, centred on the shared stage), so a landscape and a
 * portrait asset coexist without letterboxing — the deck outline is naturally
 * irregular, like a real pile of different-sized prints. Only the top card
 * (depth 0) runs the hover tilt + fixed-light reflection; the rest sit static,
 * dimmed, offset for depth. A video shows its first frame while stacked and
 * becomes a playable <video controls> once it reaches the top.
 */
function PosterCard({
  url,
  title,
  depth,
  isTop,
  isMobile,
  onClick,
  onVideoPlay,
  onVideoRestore,
  onHoverChange,
}: {
  url: string;
  title: string;
  depth: number;
  isTop: boolean;
  isMobile: boolean;
  onClick: () => void;
  onVideoPlay: () => void;
  onVideoRestore: () => void;
  onHoverChange: (h: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const vid = isVideoUrl(url);
  // Only the top image card tilts — videos stay flat so the native controls
  // aren't skewed by the 3D transform.
  const tiltActive = isTop && !vid;

  // When a video card leaves the top (flipped to back) or unmounts, stop its
  // playback and restore the bg music. Prevents the music staying ducked and
  // kills any orphaned audio from the unmounting <video> (the double-play bug).
  useEffect(() => {
    if (isTop) return;
    videoRef.current?.pause();
    onVideoRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);
  useEffect(() => {
    return () => onVideoRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pointer position normalised to −0.5…0.5 across the card.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 140, damping: 16, mass: 0.9 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  // Balanced-but-heavy tilt — ~7° max.
  const MAX = 7;
  const rotateY = useTransform(sx, [-0.5, 0.5], [-MAX, MAX]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [MAX, -MAX]);

  // Fixed-light reflection — diagonal band driven by the tilt (inverted), so it
  // sweeps like a reflection of a stationary source, never glued to the cursor.
  const glareCenter = useTransform(
    [sx, sy],
    ([x, y]: number[]) => 50 - x * 55 - y * 15,
  );
  const gA = useTransform(glareCenter, (v) => `${v - 22}%`);
  const gB = useTransform(glareCenter, (v) => `${v}%`);
  const gC = useTransform(glareCenter, (v) => `${v + 22}%`);
  const glare = useMotionTemplate`linear-gradient(115deg, transparent ${gA}, rgba(255,255,255,0.60) ${gB}, transparent ${gC})`;

  // Lift shadow offsets opposite the tilt → "raised off the wall".
  const shadowX = useTransform(sx, [-0.5, 0.5], [22, -22]);
  const shadowY = useTransform(sy, [-0.5, 0.5], [22, -22]);
  const dropShadow = useMotionTemplate`drop-shadow(${shadowX}px ${shadowY}px 28px rgba(0,0,0,0.5))`;

  const onMove = (e: React.MouseEvent) => {
    if (!tiltActive) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => {
    setHovered(false);
    px.set(0);
    py.set(0);
    onHoverChange(false);
  };

  // Mobile gyroscope tilt — maps device orientation onto the same px/py the
  // mouse would set, so the poster physically reacts to tilting the phone (the
  // tilt/reflection/shadow machinery is reused as-is). Top image card only.
  // First reading becomes the neutral baseline, so the resting hand angle = flat.
  // iOS permission is requested up-front from a gesture (see onFirstInteraction).
  useEffect(() => {
    if (!isMobile || !tiltActive) return;
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window))
      return;

    let base: { beta: number; gamma: number } | null = null;
    const RANGE = 14; // degrees of tilt to reach full deflection (lower = more sensitive)
    const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (!base) base = { beta: e.beta, gamma: e.gamma };
      px.set(clamp((e.gamma - base.gamma) / RANGE)); // left-right
      py.set(clamp((e.beta - base.beta) / RANGE)); // front-back
      setHovered(true); // surface the reflection while tilting
    };

    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      setHovered(false);
      px.set(0);
      py.set(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, tiltActive]);

  const slot = slotFor(depth);
  const maxH = isMobile ? "44vh" : "80vh";
  const maxW = isMobile ? "82vw" : "62vw";
  const mediaStyle: React.CSSProperties = {
    maxHeight: maxH,
    maxWidth: maxW,
    opacity: loaded || vid ? 1 : 0,
    transition: "opacity 0.4s ease",
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 100 - depth }}
      initial={false}
      animate={{ x: slot.x, y: slot.y, rotate: slot.rotate, scale: slot.scale }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      <div className="pointer-events-none" style={{ perspective: 1200 }}>
        <motion.div
          ref={ref}
          onMouseEnter={() => {
            if (tiltActive) {
              setHovered(true);
              onHoverChange(true);
            }
          }}
          onMouseLeave={reset}
          onMouseMove={onMove}
          // Top video: no flip-on-click so the native controls work; flip it
          // away by bringing another card forward. Everything else is clickable.
          onClick={isTop && vid ? undefined : onClick}
          style={{
            rotateX: tiltActive ? rotateX : 0,
            rotateY: tiltActive ? rotateY : 0,
            filter: tiltActive
              ? dropShadow
              : "drop-shadow(0 12px 24px rgba(0,0,0,0.45))",
            transformStyle: "preserve-3d",
          }}
          className={`relative pointer-events-auto will-change-transform ${
            isTop && vid ? "" : "cursor-pointer"
          }`}
        >
          {vid && isTop ? (
            <video
              key={`top-${url}`}
              ref={videoRef}
              src={url}
              controls
              preload="auto"
              className="object-contain block"
              style={mediaStyle}
              onPlay={onVideoPlay}
              onPause={onVideoRestore}
              onEnded={onVideoRestore}
            />
          ) : vid ? (
            <video
              key={`peek-${url}`}
              src={`${url}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              className="object-contain block"
              style={mediaStyle}
            />
          ) : (
            <img
              src={url}
              alt={title}
              draggable={false}
              className="object-contain block select-none"
              style={mediaStyle}
              onLoad={() => setLoaded(true)}
            />
          )}

          {/* Non-top cards: dim for depth + a hairline edge so the pile reads */}
          {!isTop && (
            <div className="absolute inset-0 bg-black/45 border border-white/10 pointer-events-none" />
          )}

          {/* Fixed-light reflection band — top image card only (videos keep
              their own surface). soft-light keeps it matte (satin paper). */}
          {isTop && !vid && (
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: glare,
                mixBlendMode: "soft-light",
                opacity: hovered ? 0.6 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * PosterStack — the focus-view asset deck (replaces the old thumbnail strip).
 * `order[0]` is the top card. Click the top poster to flip it to the back;
 * click any peeking card behind to bring it forward. Cards keep stable keys so
 * framer tweens each to its new slot on reorder. The stage is a fixed centred
 * box; cards are absolutely centred within it, so mixed orientations all pivot
 * around the same point.
 */
function PosterStack({
  urls,
  title,
  isMobile,
  onVideoPlay,
  onVideoRestore,
}: {
  urls: string[];
  title: string;
  isMobile: boolean;
  onVideoPlay: () => void;
  onVideoRestore: () => void;
}) {
  const [order, setOrder] = useState<number[]>(() => urls.map((_, i) => i));
  const multi = urls.length > 1;

  // Cursor-attached tag — same pattern as the Project Archive hitbox hover tag.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [showTag, setShowTag] = useState(false);
  const onStageMove = (e: React.MouseEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  const onCardClick = (assetIndex: number, depth: number) => {
    if (depth === 0) {
      // Flip the top poster to the back of the deck.
      setOrder((prev) =>
        prev.length < 2 ? prev : [...prev.slice(1), prev[0]],
      );
    } else {
      // Bring a peeking card to the front.
      setOrder((prev) => [assetIndex, ...prev.filter((i) => i !== assetIndex)]);
    }
  };

  const stageStyle: React.CSSProperties = isMobile
    ? { width: "86vw", height: "52vh" }
    : { width: "64vw", height: "80vh" };

  return (
    <div
      className="relative flex items-center justify-center"
      style={stageStyle}
      onMouseMove={onStageMove}
    >
      {order.map((assetIndex, depth) => (
        <PosterCard
          key={urls[assetIndex]}
          url={urls[assetIndex]}
          title={title}
          depth={depth}
          isTop={depth === 0}
          isMobile={isMobile}
          onClick={() => onCardClick(assetIndex, depth)}
          onVideoPlay={onVideoPlay}
          onVideoRestore={onVideoRestore}
          onHoverChange={(h) => setShowTag(h && multi)}
        />
      ))}

      {/* Cursor-attached flip tag — desktop, shown while hovering the top
          poster (formatted like the Project Archive hitbox tag). */}
      {!isMobile && multi && (
        <motion.div
          style={{ left: x, top: y }}
          animate={{ opacity: showTag ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 z-[210] translate-x-5 translate-y-5 pointer-events-none flex items-center gap-2 bg-black/80 border border-white/10 backdrop-blur-sm px-3 py-2"
        >
          <img
            src="/right-click.png"
            alt=""
            className="w-5 h-auto filter brightness-110"
          />
          <span className="font-brand-cn text-[10px] uppercase tracking-[0.3em] text-white whitespace-nowrap">
            Click to flip · {order[0] + 1}/{urls.length} Asset
          </span>
        </motion.div>
      )}

      {/* Mobile keeps a static caption (no cursor to attach a tag to). */}
      {isMobile && multi && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.4em] text-white/35 whitespace-nowrap">
            Tap to flip · {order[0] + 1}/{urls.length} Asset
          </span>
        </div>
      )}
    </div>
  );
}

export default function ArchiveCatalogue() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [focusLoading, setFocusLoading] = useState(false);
  const [, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
      // iOS 13+ gates device-orientation behind a permission prompt that must be
      // triggered from a user gesture — request it here on the first tap so the
      // mobile poster gyroscope tilt can receive events.
      const DOE = (typeof DeviceOrientationEvent !== "undefined"
        ? DeviceOrientationEvent
        : null) as unknown as
        | { requestPermission?: () => Promise<string> }
        | null;
      if (DOE && typeof DOE.requestPermission === "function") {
        DOE.requestPermission().catch(() => {});
      }
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

  // Duck the background music while a focus-view video plays, restore after.
  function handleVideoPlay() {
    const audio = audioRef.current;
    if (audio && !isMutedRef.current) {
      audio.muted = true;
      audio.volume = 0;
      audioSuppressedByVideoRef.current = true;
      setIsAudioOn(false);
    }
  }
  function handleVideoRestore() {
    const audio = audioRef.current;
    if (audio && audioSuppressedByVideoRef.current) {
      audio.muted = false;
      audio.volume = 0.35;
      isMutedRef.current = false;
      audioSuppressedByVideoRef.current = false;
      setIsAudioOn(true);
      // iOS pauses the background <audio> entirely when a video with sound
      // plays — muting alone won't bring it back, so explicitly resume.
      audio.play().catch(() => {});
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

  // Gate the focus view behind a loader until ALL of the project's assets are
  // ready — physical objects don't pop in piecemeal. Mirrors the initial-archive
  // loader treatment. A small min-delay avoids a jarring loader flash on cached
  // assets; `cancelled` guards against the user closing/switching mid-load.
  useEffect(() => {
    if (!selectedProject) return;
    let cancelled = false;
    setFocusLoading(true);

    const urls = (
      Array.isArray(selectedProject.file_url)
        ? selectedProject.file_url
        : [selectedProject.file_url]
    ).filter(Boolean);

    const loadAsset = (url: string) =>
      new Promise<void>((resolve) => {
        if (isVideoUrl(url)) {
          const v = document.createElement("video");
          v.muted = true;
          v.preload = "auto";
          v.onloadeddata = () => resolve();
          v.onerror = () => resolve();
          v.src = url;
        } else {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = url;
        }
      });

    // Linger ~1.5s minimum so the project title is readable, but no longer —
    // long enough to register what's loading, short enough to not annoy.
    const minDelay = new Promise((r) => setTimeout(r, 1500));
    // Safety valve: never trap the user on the loader if an asset stalls without
    // firing load/error (rare, but a broken URL or hung connection shouldn't
    // block the whole view). Reveal anyway after maxWait.
    const maxWait = new Promise((r) => setTimeout(r, 8000));
    Promise.race([
      Promise.all([...urls.map(loadAsset), minDelay]),
      maxWait,
    ]).then(() => {
      if (!cancelled) setFocusLoading(false);
    });

    return () => {
      cancelled = true;
    };
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
              src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/%20JDS%20Global%20Bgglobal-bg.mp4"
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
              {/* router.back() (like the tier returns) — a clean history-back
                  to the cached Archive page: no sweep, no mount flash. */}
              <button
                onClick={() => router.back()}
                className="flex items-center cursor-pointer group mb-0 self-start bg-transparent border-none p-0"
              >
                <motion.img
                  src="/return-to.webp"
                  className="pt-8 w-22 h-auto opacity-70 group-hover:opacity-100"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </button>

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
                  className="break-inside-avoid mb-7 group cursor-pointer relative overflow-hidden bg-[#111] border border-white/10"
                  onClick={() => {
                    setFocusLoading(true);
                    setSelectedProject(item);
                    setIsPlaying(false);
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
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6">
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
                  className={`group cursor-pointer relative overflow-hidden bg-[#111] border border-white/10 ${index % 5 === 0 ? "col-span-2" : ""}`}
                  onClick={() => {
                    setFocusLoading(true);
                    setSelectedProject(item);
                    setIsPlaying(false);
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
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-800 flex items-center justify-center px-4 py-2 backdrop-blur-sm">
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
              {/* Asset loader — gates the reveal until all assets are ready, so
                  the deck never pops in piecemeal. Same treatment as the
                  initial-archive loader; fades out over the prepared scene. */}
              <AnimatePresence>
                {focusLoading && (
                  <motion.div
                    key="focus-loader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 z-[260] flex flex-col items-center justify-center gap-6 bg-black"
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                    >
                      <source
                        src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
                        type="video/mp4"
                      />
                    </video>
                    <img
                      src="/j-logo.svg"
                      alt="Loading"
                      className="loader-j opacity-80 relative z-10"
                    />
                    <span
                      data-title={selectedProject.title}
                      className="loader-title font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80 relative z-10 text-center px-6"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Exit — fixed top left, always visible while scrolling */}
              <button
                onClick={() => setSelectedProject(null)}
                className="fixed top-15 left-15 z-[200] flex items-center gap-2 font-brand-bold text-[18px] uppercase tracking-[0.2em] text-white hover:text-white transition-colors duration-200 cursor-pointer"
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
                // overflow-x-hidden clips the poster deck's transform overflow
                // (x-offsets + rotation), which otherwise causes a horizontal
                // overscroll bounce on mobile AND makes Section 2's
                // backdrop-filter mis-render as a flat black bar on desktop.
                className="h-full overflow-y-auto overflow-x-hidden overscroll-x-none"
                style={{ scrollbarWidth: "none" }}
              >
                {/*
                  ── SECTION 1: IMAGE FOCUS ──────────────────────────────────
                */}
                <section
                  className="relative flex items-center justify-center sticky top-0 bg-black"
                  style={{ height: "100vh", minHeight: "100vh", zIndex: 1 }}
                >
                  {/* Grain video background — dropped to atmosphere level so the
                      spotlight reads, not the void */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                  >
                    <source
                      src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
                      type="video/mp4"
                    />
                  </video>
                  {/* ── GALLERY LIGHTING (layered to read as a lit room, not a
                      void) — corners deepened, a soft pool behind the deck lit
                      from the upper-left to match the poster's fixed-light
                      reflection, and a faint floor pool so it reads as standing
                      on a surface rather than floating. ── */}
                  {/* Edge vignette — deepen the corners so the pool reads */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(125% 115% at 50% 42%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.62) 100%)",
                    }}
                  />
                  {/* Spotlight pool behind the deck */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(55% 50% at 48% 38%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.055) 34%, rgba(0,0,0,0) 70%)",
                    }}
                  />
                  {/* Floor pool — faint glow low-centre = lit surface underfoot */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(44% 20% at 50% 84%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 72%)",
                    }}
                  />
                  {/* Poster stack — the deck IS the selector (replaces strip) */}
                  <div
                    className={`flex items-center justify-center w-full h-full ${isMobile ? "px-6 pt-16 pb-20" : "px-16"}`}
                  >
                    <PosterStack
                      key={selectedProject.id}
                      urls={
                        Array.isArray(selectedProject.file_url)
                          ? selectedProject.file_url
                          : [selectedProject.file_url]
                      }
                      title={selectedProject.title}
                      isMobile={isMobile}
                      onVideoPlay={handleVideoPlay}
                      onVideoRestore={handleVideoRestore}
                    />
                  </div>

                  {/* Scroll hint — bottom right of section 1 */}
                  <div className="absolute bottom-8 right-6 flex items-center pointer-events-none">
                    <span className="hidden lg:inline font-brand-secondary-thin text-[10px] tracking-[0.3em] uppercase text-white/30">
                      [PROJ. DESCRIPTION]
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
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(15px)",
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.80) 100%)",
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
                          className={`font-brand-bold uppercase text-white leading-[0.92] tracking-[0.04em] mb-4 ${isMobile ? "text-[32px]" : "text-[clamp(34px,4.5vw,54px)]"}`}
                        >
                          Project Description
                        </h2>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-8">
                          <div className="flex-1 h-[1px] bg-white" />
                        </div>

                        {/* Subtitle — THE ARCHITECT style, only renders if set */}
                        {selectedProject.subtitle && (
                          <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 border-t border-white/20" />
                            <h4 className="font-brand-secondary-heavy text-[clamp(13px,0.55vw,16px)] uppercase tracking-[0.3em] text-white/90 shrink-0">
                              {selectedProject.subtitle}
                            </h4>
                          </div>
                        )}

                        {/* Description — no scroll cap, flows naturally */}
                        <p className="font-brand-secondary-thin text-[clamp(12px,0.68vw,14px)] leading-[1.9] text-white/60 whitespace-pre-wrap tracking-[0em] text-justify">
                          {selectedProject.content}
                        </p>

                        {/* ── VIEW THE LIVE ASSET ── */}
                        {(selectedProject.instagram_url ||
                          selectedProject.linkedin_url) && (
                          <div className="mt-10 pt-5 border-t border-white/20 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              {selectedProject.instagram_url && (
                                <a
                                  href={selectedProject.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                                >
                                  <svg
                                    width="40"
                                    height="40"
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
                                  className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                                >
                                  <svg
                                    width="35"
                                    height="35"
                                    viewBox="0 0 24 24"
                                    fill="white"
                                  >
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227 0 24 .775 24h22.451C23.2 24 24 23.227 24 22.271V1.729C24.003 .774 23.2 0 22.222 0h.003z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            <span className="font-brand-cn text-[clamp(12px,0.80vw,15px)] uppercase tracking-[0.15em] text-white/50">
                              ENGAGE LIVE ASSET
                            </span>
                          </div>
                          
                        )}
                      </div>

                      {/* RIGHT — product details panel (Flyerwrk baseline layout) */}
                      <div
                        className={`shrink-0 ${isMobile ? "w-full" : "w-[clamp(300px,21vw,400px)]"}`}
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
                            <h3 className="font-brand-other text-[clamp(13px,0.83vw,16px)] uppercase tracking-[0.2em] text-white mb-4">
                              {selectedProject.title}
                            </h3>
                            <div className="h-px bg-white/15 mb-5" />

                            {/* ── METADATA ROWS — label left, value right, no row dividers ── */}
                            <div className="flex flex-col gap-1 mb-5">
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[clamp(9px,0.52vw,11px)] uppercase tracking-[0.12em] text-white">
                                  Category
                                </span>
                                <span className="font-brand-secondary-thin text-[clamp(9px,0.52vw,11px)] text-white/55">
                                  {selectedProject.category}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[clamp(9px,0.52vw,11px)] uppercase tracking-[0.12em] text-white">
                                  Type
                                </span>
                                <span className="font-brand-secondary-thin text-[clamp(9px,0.52vw,11px)] text-white/55">
                                  {selectedProject.resource_type}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[clamp(9px,0.52vw,11px)] uppercase tracking-[0.12em] text-white">
                                  Number of Assets
                                </span>
                                <span className="font-brand-secondary-thin text-[clamp(9px,0.52vw,11px)] text-white/55">
                                  {Array.isArray(selectedProject.file_url)
                                    ? selectedProject.file_url.length
                                    : 1}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline py-1">
                                <span className="font-brand-bold text-[clamp(9px,0.52vw,11px)] uppercase tracking-[0.12em] text-white">
                                  Uploaded
                                </span>
                                <span className="font-brand-secondary-thin text-[clamp(9px,0.52vw,11px)] text-white/55">
                                  {selectedProject.created_at
                                    ? new Date(selectedProject.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                                    : "—"}
                                </span>
                              </div>
                              <div className="flex justify-between items-start py-1">
                                <span className="font-brand-bold text-[clamp(9px,0.52vw,11px)] uppercase tracking-[0.12em] text-white shrink-0">
                                  File Type
                                </span>
                                <div className="flex flex-col items-end gap-0.5">
                                  {(() => {
                                    const urls = Array.isArray(selectedProject.file_url) ? selectedProject.file_url : [selectedProject.file_url];
                                    const exts = [...new Set<string>(urls.map((u: string) => u?.split(".").pop()?.toUpperCase() ?? "").filter(Boolean))];
                                    return exts.map((ext: string) => (
                                      <span key={ext} className="font-brand-secondary-thin text-[clamp(9px,0.52vw,11px)] text-white/55">{ext}</span>
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
                                  <span className="font-brand-cn text-[clamp(16px,1.04vw,20px)] text-orange-600 shrink-0 leading-none">*</span>
                                  <span className="font-brand-secondary-thin text-[clamp(10px,0.57vw,12px)] text-white/45 tracking-wide">
                                    {feat}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* — CTA BUTTON — white bg, brand icon left, label centre-left, price right — */}
                            <button className="w-full flex items-center bg-white text-black px-4 py-[11px] mb-5 rounded-sm border border-neutral-200">
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
                              <span className="font-brand-bold text-[clamp(15px,0.94vw,18px)] uppercase tracking-[0.12em] ml-4">
                                JDS PROJ. Archive .26
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
                      <p className="relative font-brand-secondary-thin text-[clamp(8px,0.47vw,9px)] uppercase tracking-[0.25em] text-white/50 text-right">
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
