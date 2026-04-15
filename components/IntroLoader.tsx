"use client"; // Mandatory for Browser APIs and State

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function IntroLoader({ onComplete }: { onComplete?: () => void }) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoSrc = "https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20intro%20mobile%20JDS-mobile-video.mp4";
  const desktopVideoSrc = "https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20IntroLoaderJDS-2.1.mp4";
  const [activeVideoSrc, setActiveVideoSrc] = useState(desktopVideoSrc);

  useEffect(() => {
  // Simple check for mobile viewport (typically < 768px)
  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  if (isMobile) {
    setActiveVideoSrc(mobileVideoSrc);
  }
}, []);


  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('judaion-intro-seen');
    if (!hasSeenIntro) setShouldShow(true);
    else {
      setShouldShow(false);
      onComplete?.();
    }
  }, [onComplete]);

useEffect(() => {
  if (!shouldShow) return;
  
  // 1. Establish separate delay constants
  const DESKTOP_NAV_DELAY = 5000;
  const MOBILE_NAV_DELAY = 11000; // Increased delay for mobile

  const bootTimer = setTimeout(() => {
    setIsFinished(true);

    // 2. Determine delay based on viewport
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const finalDelay = isMobile ? MOBILE_NAV_DELAY : DESKTOP_NAV_DELAY;

    const navTimer = setTimeout(() => {
      setShowNavigation(true);
    }, finalDelay);

    return () => clearTimeout(navTimer);
  }, 2200);

  return () => clearTimeout(bootTimer);
}, [shouldShow]);

  const handleEntry = () => {
    sessionStorage.setItem('judaion-intro-seen', 'true');
    onComplete?.();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isFinished) return;
    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
    
    };
    video.play().catch(e => console.log(e));
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isFinished]);

  if (!shouldShow) return null;

  return (
    <AnimatePresence onExitComplete={() => onComplete?.()}>
      <motion.div key="loader-container" className="fixed inset-0 z-[999] bg-[#0a0a0a] overflow-hidden">
        
        {/* SIGNAL HANDOVER LAYER */}
        <AnimatePresence mode="wait">
          {!isFinished && (
            <motion.div 
              key="grain-signal"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 1.1,
                filter: "brightness(1.8) blur(10px)",
              }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="absolute inset-0 z-[1010] bg-black"
            >
              <video 
               muted
               autoPlay
               loop
               playsInline
               className="absolute inset-0 w-full h-full object-cover opacity-20 ">
                <source src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4" type="video/mp4" />
              </video>

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span 
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[14px] tracking-[0.7em] uppercase text-white font-brand-secondary-thin establishing-authority-mobile"
                >
                  Establishing Authority
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO CONTENT */}
        <motion.div 
          animate={isFinished ? { scale: 1, opacity: 1, filter: "blur(0px)" } : { scale: 1.05, opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} 
          className="relative w-full h-screen flex items-center justify-center"
        >
          {/* NAVIGATION */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={showNavigation ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-12 right-12 z-[1001] flex flex-col items-end group cursor-pointer pointer-events-auto intro-nav-mobile"
            onClick={handleEntry}
          >
            <motion.img 
              src="/start-the-tour.png" 
              className="w-30 h-auto mb-4 opacity-70 group-hover:opacity-100 transition-all duration-700"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[11px] tracking-[0.6em] uppercase text-white/70 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">
              Begin the Tour
            </span>
          </motion.div>

          <video ref={videoRef} muted loop playsInline className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none opacity-[0.90]">
            <source src={activeVideoSrc} type="video/mp4" />
          </video>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}