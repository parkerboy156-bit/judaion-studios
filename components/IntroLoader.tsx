"use client"; // Mandatory for Browser APIs and State

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function IntroLoader({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  // Poster covers the video until playback truly starts, hiding blocked-autoplay/play-button chrome.
  const [posterShown, setPosterShown] = useState(true);
  const desktopPoster = "/intro-frame.avif";
  const mobilePoster = "/intro-frame-mobile.avif";
  const [posterSrc, setPosterSrc] = useState(desktopPoster);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Force-mutes the video node immediately since Safari blocks autoplay unless it's genuinely muted at play time.
  const setVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      node.muted = true;
      node.defaultMuted = true;
    }
  };
  const mobileVideoSrc =
    "https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS-Introloader-ALT-Mobile.mp4";
  const desktopVideoSrc =
    "https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS-Introloader-ALT.mp4";
  const [activeVideoSrc, setActiveVideoSrc] = useState(desktopVideoSrc);

  useEffect(() => {
    // Simple check for mobile viewport (typically < 768px)
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) {
      setActiveVideoSrc(mobileVideoSrc);
      setPosterSrc(mobilePoster);
    }
  }, []);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("judaion-intro-seen");
    if (!hasSeenIntro) setShouldShow(true);
    else {
      setShouldShow(false);
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!shouldShow) return;

    // 1. Establish separate delay constants
    const DESKTOP_NAV_DELAY = 3000;
    const MOBILE_NAV_DELAY = 4500; // Increased delay for mobile

    const bootTimer = setTimeout(() => {
      setIsFinished(true);

      // 2. Determine delay based on viewport
      const isMobile = window.matchMedia("(max-width: 1023px)").matches;
      const finalDelay = isMobile ? MOBILE_NAV_DELAY : DESKTOP_NAV_DELAY;

      const navTimer = setTimeout(() => {
        setShowNavigation(true);
      }, finalDelay);

      return () => clearTimeout(navTimer);
    }, 2500);

    return () => clearTimeout(bootTimer);
  }, [shouldShow]);

  const handleEntry = () => {
    sessionStorage.setItem("judaion-intro-seen", "true");
    onComplete?.();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isFinished) return;
    // Rewinds and plays immediately at handover — the clip's ~1s black lead-in covers the grain crossfade before the epilepsy warning appears.
    video.pause();
    video.currentTime = 0;
    video.muted = true; // re-assert before play — Safari blocks autoplay otherwise
    video.play().catch(() => {
      // Autoplay blocked — poster stays up so entry still reads as branded, not broken.
    });
  }, [isFinished, activeVideoSrc]);

  if (!shouldShow) return null;

  return (
    <AnimatePresence onExitComplete={() => onComplete?.()}>
      <motion.div
        key="loader-container"
        className="fixed inset-0 z-[999] bg-[#0a0a0a] overflow-hidden"
      >
        {/* SIGNAL HANDOVER LAYER */}
        <AnimatePresence mode="wait">
          {!isFinished && (
            <motion.div
              key="grain-signal"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 z-[1010] bg-black"
            >
              <video
                muted
                autoPlay
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              >
                {/* Root-relative: a bare "dust-overlay.mp4" resolves against the
                    current route, so it would 404 on any nested path. */}
                <source
                  src="/dust-overlay.mp4"
                  type="video/mp4"
                />
              </video>

              {/* Single-line loader with animated dots, matching the site's other loaders. */}
              <div className="absolute bottom-8 left-8 lg:bottom-10 lg:left-10 z-10">
                <span className="loader-text-intro font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO CONTENT */}
        <motion.div
          animate={
            isFinished
              ? { scale: 1, opacity: 1, filter: "blur(0px)" }
              : { scale: 1.05, opacity: 0, filter: "blur(20px)" }
          }
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-screen flex items-center justify-center"
        >
          {/* NAVIGATION */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={showNavigation ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-12 right-12 z-[1001] group cursor-pointer pointer-events-auto intro-nav-mobile"
            onClick={handleEntry}
          >
            <motion.div
              className="flex flex-row-reverse items-center gap-5 group-hover:translate-x-2 transition-transform duration-700"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src="/start-the-tour.png"
                className="w-37 h-auto opacity-70 group-hover:opacity-100 transition-all duration-700 drop-shadow-[0_0_6px_rgba(255,255,255,0.35)] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              />
            </motion.div>
          </motion.div>

          <video
            ref={setVideoRef}
            src={activeVideoSrc}
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            poster={posterSrc}
            onPlaying={() => setPosterShown(false)}
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none opacity-[0.90]"
          />

          {/* Opaque poster fallback — fully covers the video (and any native play-button chrome) until playback truly begins. */}
          <img
            src={posterSrc}
            alt=""
            onClick={() => videoRef.current?.play().catch(() => {})}
            style={{
              opacity: posterShown ? 1 : 0,
              pointerEvents: posterShown ? "auto" : "none",
              transition: "opacity 0.3s ease",
            }}
            className="absolute inset-0 w-full h-full object-cover bg-black z-[5] cursor-pointer"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
