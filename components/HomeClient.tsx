"use client"; // Mandatory for Framer Motion, State, and Navigation

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLoading } from "@/components/ClientShell";
import Link from 'next/link';
import homeBgAvif from '@/public/home-bg.avif';
import homeBgMobileAvif from '@/public/home-bg-mobile.avif';
import homeBgWebp from '@/public/home-bg.webp';
import homeBgMobilePng from '@/public/home-bg-mobile.png';

export default function Home({ isLoaded = true }: { isLoaded?: boolean }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasSensorPermission, setHasSensorPermission] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);


  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!isLoaded) return null;

// Detect if the user is on mobile/tablet
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  // --- MOUSE TRACKING ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 }); 
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });
  
  // Parallax: Matches the background image movement
  const moveX = useTransform(mouseX, [0, 1920], ["1.5%", "-1.5%"]);
  const moveY = useTransform(mouseY, [0, 1080], ["1.5%", "-1.5%"]);

const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return; // Ignore mouse movements on touch devices
    x.set(e.clientX);
    y.set(e.clientY);
  };

  useEffect(() => {
  const lockHeight = () => {
    // Sets a custom property for the actual viewable height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  lockHeight();
  window.addEventListener('resize', lockHeight);
  return () => window.removeEventListener('resize', lockHeight);
}, []);


  // Mobile Tilt Logic: Binds the phone's physical movement to your parallax values
  useEffect(() => {
    if (!isMobile || !hasSensorPermission) return;

    const handleTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // We map the physical tilt to the virtual 1920x1080 canvas
        const tiltX = ((e.gamma + 45) / 90) * 1920; 
        const tiltY = ((e.beta - 20) / 60) * 1080;
        x.set(tiltX);
        y.set(tiltY);
      }
    };

    window.addEventListener('deviceorientation', handleTilt);
    return () => window.removeEventListener('deviceorientation', handleTilt);
  }, [isMobile, hasSensorPermission, x, y]);

  if (!isLoaded) return null;

const mobilePositions = {
  vision: "top-[19%] left-[13%]",
  structure: "top-[19%] left-[43%]",
  identity: "top-[19%] left-[74%]",
};


  return (

    <div className="relative bg-black overflow-hidden">
      {/* SURGICAL MASK: Only exists on this page, handles the fade-out from black */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
        onAnimationComplete={() => {
          // Optional: remove from DOM if it interferes with clicks
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'black',
          zIndex: 99,
          pointerEvents: 'none'
        }}
      />


<motion.div 
  className={`relative h-screen bg-black select-none ${
    isMobile ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'
  }`}
>
<section 
  onMouseMove={handleMouseMove}
  className={`relative h-screen bg-black overflow-hidden flex-shrink-0 ${
    isMobile ? 'w-[300vw]' : 'w-full'
  }`}
>
        {/* TOP HUD: SYSTEM STATS */}
        <motion.div 
          animate={{ opacity: hoveredIndex !== null ? 1 : 0, y: hoveredIndex !== null ? 0 : -10 }}
          className="absolute top-12 left-0 w-full px-24 flex justify-between items-start z-20 pointer-events-none"
        >
          <div className="flex flex-col space-y-1 mt-2">
            <span className="text-[7px] tracking-[0.4em] uppercase text-white/30 font-brand-secondary-thin">Protocol 01 // JDS </span>
          </div>
          <div className="flex flex-col items-end space-y-1 mt-1">
            <span className="text-[7px] tracking-[0.4em] uppercase text-white/30 font-brand-secondary-thin">Asset 01</span>
          </div>
        </motion.div>

{/* DYNAMIC BACKGROUND */}
<motion.div 
onTap={() => isMobile && setHoveredIndex(null)}
  style={{ x: moveX, y: moveY, scale: 1.03 }} 
  animate={{ 
    opacity: hoveredIndex !== null ? 0.4 : 1,
    filter: hoveredIndex !== null ? "blur(4px) grayscale(0)" : "blur(0px) grayscale(0)"
  }}
className="absolute inset-0 z-0 w-full h-full overflow-hidden flex items-center justify-center"
>
<picture>
  <source 
    srcSet={isMobile ? homeBgMobileAvif.src : homeBgAvif.src} 
    type="image/avif" 
  />
  
{!isMobile && (
    <source srcSet={homeBgWebp.src} type="image/webp" />
  )}

  {/* 3. The Final Component */}
  <img
    // If mobile, we use the PNG. If desktop, we use WebP as the final 'src'.
    // This is because the desktop browser will only reach this if AVIF fails.
    src={isMobile ? homeBgMobilePng.src : homeBgWebp.src}
    alt="JDS Background"
    className="object-cover object-center w-full h-full"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: -1,
    }}
    fetchPriority="high"
  />
</picture>
</motion.div>

{/* PARALLAX CONTENT LAYER */}
<motion.div 
  style={{ x: moveX, y: moveY }}
  drag={isMobile ? "x" : false}
  dragConstraints={{ 
  left: -2000, // Approximate window.innerWidth * 2 constraint preserved from original logic
  right: 0 
}}
dragElastic={0.05} 
  className={`absolute inset-0 z-10 pointer-events-none ${
    isMobile ? 'w-[300vw]' : 'w-full'
  }`}
>
  {/* --- VISION BLOCK --- */}
  <div className={`absolute flex flex-col group pointer-events-auto vision-block-mobile ${isMobile ? mobilePositions.vision : 'top-[11%] left-[10%]'}`}>
<motion.h3 
  onMouseEnter={() => !isMobile && setHoveredIndex(0)}
  onMouseLeave={() => !isMobile && setHoveredIndex(null)}
  onTap={() => {
    if (isMobile) {
      setHoveredIndex(prev => prev === 0 ? null : 0);
    }
  }}

  animate={{ 
    opacity: hoveredIndex === null ? 0.7 : (hoveredIndex === 0 ? 1 : 0),
    letterSpacing: hoveredIndex === 0 ? "1.4em" : "0.8em",
  }}
  className="text-[14px] uppercase font-medium font-brand-secondary-thin cursor-pointer text-white transition-all duration-500"
>
      Vision
    </motion.h3>
    
    <motion.div 
      animate={{ opacity: hoveredIndex === 0 ? 1 : 0 }}
      style={{ originX: 0 }}
      className="mt-1 w-[146px] h-[1px] bg-white" 
    />

    <div
      className={`absolute top-full pt-8 transition-opacity duration-500 pointer-events-none ${hoveredIndex === 0 ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className="text-[15px] leading-relaxed tracking-[0.1em] uppercase text-white/75 font-light font-brand-cn w-[280px]">
        We extract the <span className="font-brand-xbold-italic-cn text-white/90">core objective</span> of your organisation. This is the <span className="font-brand-xbold-italic-cn text-white/90">Strategic foundation</span> required to position your brand as a <span className="font-brand-xbold-italic-cn text-white/90">Category leader</span> before a single pixel is moved.
      </p>
    </div>
  </div>

  {/* --- STRUCTURE BLOCK --- */}
  <div className={`absolute flex flex-col group pointer-events-auto structure-block-mobile ${isMobile ? mobilePositions.structure : 'top-[11%] left-[46%]'}`}>
    <motion.h3 
  onMouseEnter={() => !isMobile && setHoveredIndex(1)}
  onMouseLeave={() => !isMobile && setHoveredIndex(null)}
  onTap={() => {
    if (isMobile) {
      setHoveredIndex(prev => prev === 1 ? null : 1);
    }
  }}

  animate={{ 
    opacity: hoveredIndex === null ? 0.7 : (hoveredIndex === 1 ? 1 : 0),
    letterSpacing: hoveredIndex === 1 ? "1.4em" : "0.8em",
  }}
  className="text-[14px] uppercase font-medium font-brand-secondary-thin cursor-pointer text-white transition-all duration-500"
>
      Structure
    </motion.h3>

    <motion.div 
      animate={{ opacity: hoveredIndex === 1 ? 1 : 0 }}
      style={{ originX: 0 }}
      className="mt-1 w-[238px] h-[1px] bg-white"
    />

    <div
      className={`absolute top-full pt-8 transition-opacity duration-500 pointer-events-none ${hoveredIndex === 1 ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className="text-[15px] leading-relaxed tracking-[0.1em] uppercase text-white/75 font-light font-brand-cn w-[280px]">
        We build the rigid frameworks that ensure your brand remains <span className="font-brand-xbold-italic-cn text-white/90">Consistent</span> and <span className="font-brand-xbold-italic-cn text-white/90">High-performing</span> under the pressure of <span className="font-brand-xbold-italic-cn text-white/90">Rapid Growth.</span>
      </p>
    </div>
  </div>

  {/* --- IDENTITY BLOCK --- */}
  <div className={`absolute flex flex-col group pointer-events-auto identity-block-mobile ${isMobile ? mobilePositions.identity : 'top-[11%] right-[4%]'}`}>
    <motion.h3 
  onMouseEnter={() => !isMobile && setHoveredIndex(2)}
  onMouseLeave={() => !isMobile && setHoveredIndex(null)}
  onTap={() => {
    if (isMobile) {
      setHoveredIndex(prev => prev === 2 ? null : 2);
    }
  }}

  animate={{ 
    opacity: hoveredIndex === null ? 0.7 : (hoveredIndex === 2 ? 1 : 0),
    letterSpacing: hoveredIndex === 2 ? "1.4em" : "0.8em",
  }}
  className="text-[14px] uppercase font-medium font-brand-secondary-thin cursor-pointer text-white transition-all duration-500"
>
      Identity
    </motion.h3>

    <motion.div 
      animate={{ opacity: hoveredIndex === 2 ? 1 : 0 }}
      style={{ originX: 0 }}
      className="mt-1 w-[205px] h-[1px] bg-white"
    />

    <div
      className={`absolute top-full pt-8 transition-opacity duration-500 pointer-events-none ${hoveredIndex === 2 ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className="text-[15px] leading-relaxed tracking-[0.1em] uppercase text-white/75 font-light font-brand-cn w-[280px]">
        We deploy the <span className="font-brand-xbold-italic-cn text-white/90">Visual execution protocol.</span> This is the undeniable stamp of <span className="font-brand-xbold-italic-cn text-white/90">AUTHORITY</span> that declares your status within the market. We create <span className="font-brand-xbold-italic-cn text-white/90">High-torque,</span> monochrome-led visuals designed for absolute <span className="font-brand-xbold-italic-cn text-white/90">permanance.</span>
      </p>
    </div>
  </div>

{/* --- DOOR INTERACTION --- */}
<motion.div
  initial={{ opacity: 0 }} 
  animate={{ opacity: 1 }} 
  transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
  className={`absolute top-[49%] -translate-y-1/2 z-30 pointer-events-auto ${
    isMobile ? 'left-[149vw] -translate-x-1/2' : 'left-[50.5%] -translate-x-1/2'
  }`}
>
  <Link
    href="/methodology" 
    className="flex flex-col items-center group no-underline appearance-none bg-transparent border-none cursor-pointer z-50"
  >
    <motion.img 
      src="/enter-the-studio.png" 
      className={`${isMobile ? 'w-[42px]' : 'w-12'} h-auto mb-2  group-hover:opacity-100 transition-all duration-700 filter brightness-125 animate-pulse`}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
    <div className="flex flex-col items-center space-y-2">
      <span className={`${isMobile ? 'text-[6px]' : 'text-[9px]'} tracking-[0.4em] uppercase text-white/90 group-hover:text-white font-brand-secondary-thin`}>
        Enter the Studio
      </span>
    </div>
  </Link>
</motion.div>
        </motion.div>

        {/* PERSISTENT BOTTOM HUD */}
        <div className="absolute bottom-12 left-0 w-full px-12 flex justify-between items-end z-20 pointer-events-none">
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] tracking-[0.4em] uppercase text-white/70 font-brand-secondary-thin">Est. 2025</span>
            <div className="w-17 h-[0.5px] bg-white/60" />
          </div>

          <motion.div 
            animate={{ opacity: hoveredIndex !== null ? 1 : 0 }}
            className="flex items-center space-x-1 pb-1"
          >
            {['// JUDAION IS YOUR CREATIVE STRATEGIC PARTNER.'].map((item, index) => (
              <React.Fragment key={item}>
                <span className="text-[10px] tracking-[0.7em] uppercase text-white/80 font-light font-brand-secondary-thin">
                  {item}
                </span>
            
              </React.Fragment>
            ))}
          </motion.div>

          <div className="w-16" />
        </div>
      </section>
    </motion.div>
    </div>
  );
}