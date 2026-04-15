"use client";

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import projectArchiveBgAvif from '@/public/project-archive-home-bg.avif';
import projectArchiveBgPng from '@/public/project-archive-home-bg.png';

export default function ProjectArchive() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // MOUSE PARALLAX LOGIC
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  // Match these percentages exactly across all moving parts
  const bgMoveX = useTransform(mouseX, [0, 1920], ["1.5%", "-1.5%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1.5%", "-1.5%"]);

const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return; // KILL PARALLAX ON MOBILE
    x.set(e.clientX);
    y.set(e.clientY);
  };

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
    /* Change: display block ensures the 300vw content forces a scrollbar */
    className={`relative w-full h-screen bg-[#0a0a0a] ${isMobile ? 'overflow-x-auto overflow-y-hidden block' : 'overflow-hidden'}`}
  >
      {/* BACKGROUND LAYER */}
<picture>
  {/* Primary Choice: AVIF */}
  <source srcSet={projectArchiveBgAvif.src} type="image/avif" />

  {/* Fallback & Animated Element */}
  <motion.img
    src={projectArchiveBgPng.src}
    alt="Project Archive Portal"
    style={isMobile ? { x: 0, y: 0, scale: 1 } : { x: bgMoveX, y: bgMoveY, scale: 1.4 }}
    className={`${
      isMobile 
        ? 'min-w-[300vw] h-full object-cover' 
        : 'absolute inset-0 w-full h-full object-contain opacity-95 pointer-events-none'
    }`}
  />
</picture>

      {/* --- THE PINNED WRAPPER --- */}
      {/* This container moves exactly like the image, effectively "carrying" the icons with it */}
      <motion.div
      style={isMobile ? { x: 0, y: 0 } : { x: bgMoveX, y: bgMoveY }}
      /* Change: Wrapper is now 300vw and absolute to the scrollable area */
      className={`${isMobile ? 'absolute top-0 left-0 min-w-[300vw] h-full pointer-events-none' : 'absolute inset-0 pointer-events-none'}`}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
    >
        {/* HITBOX: Coordinates (top-[15%] left-[65%]) remain identical */}
        <Link
        href="/archivecatalogue"
        className="absolute z-50 w-[24%] h-[45%] top-[15%] left-[65%] cursor-pointer pointer-events-auto"
      />


        {/* INSPECT INSTRUCTION (Pinned to specific coordinates on the graphic) */}
       <div className={`absolute top-[69%] left-[67%] flex items-center space-x-3 opacity-100 ${isMobile ? 'mobile-inspect-fix' : ''}`}>
        {/* Conditional Icon Swap */}
        <img 
          src={isMobile ? "/tap-icon.png" : "/right-click.png"} 
          alt="Inspect Icon" 
          className={isMobile ? "w-12 h-auto filter brightness-110" : "w-17 h-auto filter brightness-110"} 
        />
        
        {/* Conditional Text Swap */}
        <span className="text-[13px] tracking-[0.7em] uppercase text-white font-brand-secondary-heavy whitespace-nowrap">
          {isMobile ? "TAP ITEM TO INSPECT" : "CLICK ITEM TO INSPECT"}
        </span>
      </div>
      </motion.div>



      {/* --- MOBILE NAVIGATION (Pinned to far left/right of the 300vw world) --- */}
      {isMobile && (
        <div className="absolute top-0 left-0 w-[300vw] h-full pointer-events-none">
          <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
          {/* PREVIOUS FLOOR: Pinned to the start of the 300vw image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 left-10 pointer-events-auto"
          >
            <Link 
            href="/services" className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer">
              <motion.img 
                src="/last-floor-straight.png" 
                className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex flex-col items-start font-brand-secondary-thin">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">Previous Floor</span>
                <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">02 Services</span>
              </div>
            </Link>
          </motion.div>

          {/* NEXT FLOOR: Pinned to the far end of the 300vw image */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 right-10 pointer-events-auto"
          >
            <Link 
            href="/aboutus" className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right">
              <motion.img 
                src="/next-floor.png" 
                className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex flex-col items-end font-secondary-thin text-right">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">Next Floor</span>
                <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">04 About us</span>
              </div>
            </Link>
          </motion.div>
        </div>
      )}

      {/* --- DESKTOP NAVIGATION (Fixed to viewport corners) --- */}
      {!isMobile && (
        <>
        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 left-12 z-50 pointer-events-auto"
          >
            <Link 
            href="/services"
             className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer">
              <motion.img 
                src="/last-floor-straight.png" 
                className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex flex-col items-start font-brand-secondary-thin">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">Previous Floor</span>
                <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">02 Services</span>
              </div>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 right-12 z-50 pointer-events-auto"
          >
            <Link 
            href="/aboutus"
             className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right">
              <motion.img 
                src="/next-floor.png" 
                className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex flex-col items-end font-secondary-thin text-right">
                <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">Next Floor</span>
                <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">04 About us</span>
              </div>
            </Link>
          </motion.div>
        </>
      )} 
    </div>
    </main>
  );
}