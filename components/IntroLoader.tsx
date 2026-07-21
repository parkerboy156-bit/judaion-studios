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
  // Poster stays over the video until playback truly starts — so a blocked
  // autoplay (Low Power Mode etc.) shows branding, never Safari's broken play
  // button. Hidden the moment the video fires `playing`.
  const [posterShown, setPosterShown] = useState(true);
  const desktopPoster = "/intro-frame.avif";
  const mobilePoster = "/intro-frame-mobile.avif";
  const [posterSrc, setPosterSrc] = useState(desktopPoster);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Callback ref: force-mute the instant the node exists. React doesn't reliably
  // apply the `muted` attribute (esp. via SSR), and Safari refuses muted
  // autoplay unless the element is *genuinely* muted at play time — this guarantees it.
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
    }, 4200);

    return () => clearTimeout(bootTimer);
  }, [shouldShow]);

  const handleEntry = () => {
    sessionStorage.setItem("judaion-intro-seen", "true");
    onComplete?.();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isFinished) return;
    // The intro clip now opens with a ~1s BLACK lead-in before the epilepsy
    // warning (which starts at 00:00:01:00 / 1.0s). So at handover we rewind to
    // frame 0 and play IMMEDIATELY: the grain crossfades out (0.6s) over that
    // black runway, we reveal the *playing* black video (not the static poster,
    // which caused the old lighter wash), and the warning lands ~0.4s later —
    // fully in view, at full opacity. (Replaces the old REVEAL_MS delay hack.)
    // autoPlay is kept on the element for reliable iOS unlock; this rewind+play
    // is also the backup for taller iPhones whose muted autoplay is deferred.
    video.pause();
    video.currentTime = 0;
    video.muted = true; // re-assert before play — Safari blocks autoplay otherwise
    video.play().catch(() => {
      // Autoplay blocked (e.g. Low Power Mode) — leave the poster up so the
      // intro reads as branded, not broken. User still enters via the nav.
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
                <source
                  src="dust-overlay.mp4"
                  type="video/mp4"
                />
              </video>

              {/* Single-line loader — bottom-left animated dots, same
                  treatment as the site’s other loaders. */}
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
                src="/start-the-tour.webp"
                className="w-30 h-auto opacity-70 group-hover:opacity-100 transition-opacity duration-700"
              />
              <span className="lg:inline font-brand-secondary-thin text-[10px] tracking-[0.4em] uppercase text-white/50">
                [Begin the Tour]
              </span>
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

          {/* Poster fallback — covers the video until it actually plays, hiding
              Safari's blocked-autoplay button. Tapping it manually starts the
              clip (covers Low Power Mode). Fades out the moment playback begins. */}
          <img
            src={posterSrc}
            alt=""
            onClick={() => videoRef.current?.play().catch(() => {})}
            style={{
              opacity: posterShown ? 0.9 : 0,
              pointerEvents: posterShown ? "auto" : "none",
              transition: "opacity 0.3s ease",
            }}
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen z-[5] cursor-pointer"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
