"use client";

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import * as React from 'react';
import { useRouter } from 'next/navigation'; // FRAMEWORK REQUIRED: Replacement for react-router-dom
import Image from 'next/image';
import servicesBgAvif from '@/public/service-home-bg.avif';
import servicesBgPng from '@/public/service-home-bg.png';

export default function ServicesHome() {
  const router = useRouter(); // FRAMEWORK REQUIRED: Replacement for useNavigate

  // MOUSE PARALLAX LOGIC (PRESERVED)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const bgMoveX = useTransform(mouseX, [0, 1920], ["1%", "-1%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1%", "-1%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  // Paths preserved for the invisible hitboxes (PRESERVED)
  const serviceTiers = [
    { id: "01", path: "/tier-1" },
    { id: "02", path: "/tier-2" },
    { id: "03", path: "/tier-3" }
  ];

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (

   <main className="relative bg-black">
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'black',
          zIndex: 999, // Ensure it sits above all page content
          pointerEvents: 'none'
        }}
      /> 
    <div 
      onMouseMove={handleMouseMove}
      className={`relative h-screen bg-[#0a0a0a] select-none ${
        isMobile ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'
      }`}
    >
      <motion.section 
        className={`relative h-screen bg-[#0a0a0a] overflow-hidden flex-shrink-0 ${
          isMobile ? 'w-[300vw]' : 'w-full'
        }`}
      >
        {/* --- PARALLAX BACKGROUND LAYER (PRESERVED) --- */}
        <motion.div 
          // Add drag properties only when isMobile is true
          drag={isMobile ? "x" : false}
          dragConstraints={{ 
            left: (typeof window !== 'undefined' ? -window.innerWidth * 2 : -2000), 
            right: 0 
          }}
          dragElastic={0.05} 
          
          // Existing parallax styles remain for desktop compatibility
          style={{ x: bgMoveX, y: bgMoveY }}
          className="absolute inset-0 w-full h-full pointer-events-none origin-center"
        >
<picture>
  {/* Primary: Modern High-Quality AVIF */}
  <source 
    srcSet={servicesBgAvif.src} 
    type="image/avif" 
  />

  {/* Fallback: Universal PNG */}
  <img
    src={servicesBgPng.src}
    alt="JUDAION Service Tiers"
    className="w-full h-full object-cover scale-102"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
    }}
    fetchPriority="high"
  />
</picture>

          {/* MASTER INSTRUCTION LABEL (PRESERVED) */}
          <div className={`absolute top-[06%] left-1/2 -translate-x-1/2 flex items-center space-x-6 opacity-80 ${isMobile ? 'mobile-inspect-fix-services' : ''}`}>
            <img 
              src={isMobile ? "/tap-icon.png" : "/right-click.png"} 
              alt="Inspect Icon" 
              className={isMobile ? "w-12 h-auto filter brightness-110" : "w-17 h-auto filter brightness-110"} 
            />
            
            <span className="text-[15px] tracking-[0.6em] uppercase text-white font-brand-secondary-thin whitespace-nowrap">
              {isMobile ? "TAP ITEMS TO INSPECT" : "CLICK ITEMS TO INSPECT"}
            </span>
          </div>

          {/* MASTER INSTRUCTION LABEL (PRESERVED) */}
          <div className={isMobile 
            ? "fixed inset-x-0 z-50 collector-footer-mobile" 
            : "absolute top-[86%] left-[11%] flex items-center space-x-6 opacity-80"
          }>
            <span className="text-[13px] tracking-[0.4em] uppercase text-white/68 font-brand-secondary-thin whitespace-nowrap">
              Read <span className="text-[13px] tracking-[0.4em] uppercase text-white font-brand-secondary-heavy italic whitespace-nowrap"><span className="text-[13px] tracking-[0.4em] uppercase text-orange-600 font-brand-secondary-heavy italic whitespace-nowrap">*</span>Collector Assets </span> for all tiers in the JDS <span className="text-[13px] tracking-[0.4em] uppercase text-white font-brand-secondary-heavy italic whitespace-nowrap">"Project archive" </span> // Next floor
            </span>
          </div>
        </motion.div>

        {/* --- INVISIBLE CLICKABLE HIT BOXES (PRESERVED LOGIC) --- */}
        <div className={isMobile 
          ? "absolute inset-0 z-20 w-[300vw] h-full" 
          : "absolute inset-0 z-20 flex items-center justify-center px-20"}>
          <div className={isMobile ? "relative w-full h-full" : "w-full max-w-[1400px] h-[650px] flex justify-between relative"}>
            {serviceTiers.map((tier, index) => (
              <div 
                key={`${tier.id}-hitbox`} 
                onClick={() => router.push(`/tier-${index + 1}`)}
                className={`cursor-pointer ${
                  isMobile 
                    ? `w-[80vw] h-[70vh] tier-0${index + 1}-mobile` 
                    : "w-[30%] h-full"                            
                }`}
              >
              </div>
            ))}
          </div>
        </div>

        {/* --- FLOOR NAVIGATION (PRESERVED) --- */}
        
        {/* PREVIOUS FLOOR (BOTTOM LEFT) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-12 z-50 pointer-events-auto"
        >
          <button onClick={() => router.push('/methodology')} className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer">
            <motion.img 
              src="/down-stairs-last-floor.png" 
              className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex flex-col items-start font-brand-secondary-thin text-left">
              <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-brand-secondary-thin">Previous Floor</span>
              <span className="text-[12px] tracking-[0.6em] uppercase text-white/800 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">01 Methodology</span>
            </div>
          </button>
        </motion.div>

        {/* NEXT FLOOR (BOTTOM RIGHT) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 right-12 z-50 pointer-events-auto"
        >
          <button onClick={() => router.push('/projectarchive')} className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right">
            <motion.img 
              src="/next-floor.png" 
              className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex flex-col items-end font-brand-secondary-thin text-right">
              <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-brand-secondary-thin">Next Floor</span>
              <span className="text-[12px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">03 Project Archive</span>
            </div>
          </button>
        </motion.div>

        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
      </motion.section>
    </div>
    </main>
  );
}