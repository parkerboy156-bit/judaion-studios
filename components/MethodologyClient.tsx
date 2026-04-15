"use client";

import { motion, useMotionValue, useSpring, useTransform, useScroll, AnimatePresence } from 'framer-motion';
import * as React from 'react';
import { useRouter } from 'next/navigation'; // REQUIRED: Framework-required structural wrapping
import Image from 'next/image';
import methodBgAvif from '@/public/method-bg.avif';
import methodBgMobileAvif from '@/public/method-bg-mobile.avif'
import methodBgPng from '@/public/method-bg.png';
import methodBgMobilePng from '@/public/method-bg-mobile.png'

export default function MethodologyPage() {
  const { scrollYProgress } = useScroll();
  const [showProcess, setShowProcess] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const router = useRouter(); // REQUIRED: Replacement for useNavigate

  // Detect Mobile and lock scroll position
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) window.scrollTo(0, 0); // Prevent dead space from 300vh
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop Zoom Logic
  const scrollScale = useTransform(scrollYProgress, [1, 0], [1.02, 1.85]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.9, 0.8]);

  const [isZoomed, setIsZoomed] = React.useState(false);
  
  React.useEffect(() => {
    if (isMobile) {
      setIsZoomed(true); // Keep triggers active on mobile
      return;
    }
    window.scrollTo(0, document.body.scrollHeight);
    return scrollYProgress.onChange((latest) => {
      setIsZoomed(latest < 0.5);
    });
  }, [scrollYProgress, isMobile]);

  // Mouse Parallax (Disabled on Mobile)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const bgMoveX = useTransform(mouseX, [0, 1920], ["1%", "-1%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1%", "-1%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
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
      className={`relative w-full bg-[#0a0a0a] ${isMobile ? 'h-screen overflow-x-auto overflow-y-hidden' : 'h-[300vh]'}`}
    >
      <div className={`sticky top-0 h-screen overflow-hidden ${isMobile ? 'w-[300vw] relative left-[-100v]' : 'w-full'}`}>
        
        <motion.div 
          style={{ 
            x: isMobile ? 0 : bgMoveX, 
            y: isMobile ? 0 : bgMoveY, 
            scale: isMobile ? 1 : scrollScale, // Start zoomed out
            opacity: isMobile ? 1 : scrollOpacity
          }}
          className="absolute inset-0 w-full h-full origin-[50%_50%]"
        >
<picture>
  {/* 1. Primary choice: AVIF (Desktop & Mobile) */}
  <source 
    srcSet={isMobile ? methodBgMobileAvif.src : methodBgAvif.src} 
    type="image/avif" 
  />

  {/* 2. Safety Net: PNG (Desktop & Mobile) */}
  <img
    src={isMobile ? methodBgMobilePng.src : methodBgPng.src}
    alt="Methodology Focus"
    className="w-full h-full object-cover"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
    }}
    fetchPriority="high"
  />
</picture>

          {/* --- TOP LEFT TEXT BLOCK --- */}
          <div className="absolute method-text-block-mobile top-[42%] left-[53.5%] flex flex-col items-start max-w-[320px]">
            
            <h2 className="text-[16px] tracking-[0.23em] uppercase text-white/90 leading-tight font-brand-compressed text-left ">
               YOUR CREATIVE STRATEGIC PARTNER  
            </h2>
            <div className="w-78 h-[1px] bg-white mt-[2px]" />

            
             <p className="text-[9px] tracking-[0.1em] uppercase text-white/60 font-light text-left leading-relaxed font-brand-cn mt-[14px]">
               <span className="font-brand-xbold-italic-cn text-white/90">JUDAION STUDIOS</span> is a Graphic Design Studio that operates at the intersection of <span className="font-brand-xbold-italic-cn text-white/90">Business vision and Cinematic rigour.</span>
                We bridge the gap between  business <span className="font-brand-xbold-italic-cn text-white/90">Vision</span> and <span className="font-brand-xbold-italic-cn text-white/90">Identity.</span>
             </p>
                          <p className="text-[9px] tracking-[0.1em] uppercase text-white/60 font-light text-left leading-relaxed font-brand-cn mt-[14px]">
              We act as your <span className="font-brand-xbold-italic-cn text-white/90">Strategic Architect,</span> building systematic
               identities that provide <span className="font-brand-xbold-italic-cn text-white/90">Leadership,</span> <span className="font-brand-xbold-italic-cn text-white/90">Certainty</span> and <span className="font-brand-xbold-italic-cn text-white/90">Market Authority.</span>
             </p>
                                       <p className="text-[9px] tracking-[0.1em] uppercase text-white/60 font-light text-left leading-relaxed font-brand-cn mt-[14px]">
              We ensure that <span className="font-brand-xbold-italic-cn text-white/90"> Your Brand</span> Remains <span className="font-brand-xbold-italic-cn text-white/90">Consistent,</span> <span className="font-brand-xbold-italic-cn text-white/90">Professional</span> and 
              <span className="font-brand-xbold-italic-cn text-white/90"> High-Converting.</span>
             </p>
          </div>

          {/* --- J ASSET: INTERACTIVE TRIGGER --- */}
          <motion.div 
            className={`absolute method-j-trigger-mobile top-[36%] left-[65%] z-30 transition-all duration-500 ${
              !isMobile && isZoomed ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
             }`}
            onClick={() => isZoomed && setShowProcess(!showProcess)}
            whileHover={!isMobile && isZoomed ? { scale: 1.05 } : {}}
            whileTap={isZoomed ? { scale: 0.95 } : {}}
          >
            <img 
              src="/j-method.png" 
              alt="Brand Mark" 
              className="w-46 h-auto opacity-80 object-contain filter brightness-110" 
            />
          </motion.div>
        </motion.div>

        {/* --- PORSCHE-STYLE HORIZONTAL DRAG SECTION --- */}
        <AnimatePresence>
          {showProcess && (
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="absolute bottom-0 left-0 w-full h-[150vh] bg-gradient-to-t from-[#000] via-black/90 to-transparent z-[60] flex flex-col justify-end overflow-hidden"
            >
              <div 
                className="absolute inset-0 z-0 cursor-default" 
                onClick={() => setShowProcess(false)} 
              />

              <div className="relative z-10 px-12 mb-8 flex justify-between items-end pointer-events-none">
                <span className="text-[12px] tracking-[0.6em] text-white/80 uppercase font-brand-secondary-thin">JUDAION METHODOLOGY //  EST. 2026-01</span>
                <span className="text-white/80 text-[12px] tracking-[0.5em] uppercase font-brand-secondary-thin">
                  Click above to close
                </span>
              </div>

              <motion.div 
                drag="x"
                dragConstraints={{ left: -1800, right: 0 }}
                className="relative z-10 flex space-x-6 px-12 cursor-grab active:cursor-grabbing mb-12"
              >
                {[
                  { id: "01", title: "Extraction", text: "We deep-dive into your business via our strategic questionnaire to extract your core DNA.", bg: "/extraction.png" },
                  { id: "02", title: "Blueprint", text: "We translate data into a strategic anchor, defining your audience, tone of voice and visual logic.", bg: "/blue-print.png" },
                  { id: "03", title: "Execution", text: "We build your Identity Launchpad, a cohesive system (Logo, Type, Colour) designed for total consistency across every touchpoint.", bg: "/execution.png" },
                  { id: "04", title: "Integration", text: "We deploy your brand through Digital Authority websites + high performance visual assets ensuring consistency.", bg: "/integration.png" },
                  { id: "CTA", isCTA: true }
                ].map((step) => (
                  <div 
                    key={step.id} 
                    className={`min-w-[700px] h-[650px] flex flex-col justify-end group transition-all overflow-hidden relative ${
                      step.isCTA ? 'border-none' : 'border border-white/10 hover:border-white/40'
                    }`}
                  >
                    {!step.isCTA && (
                      <>
                        <div 
                          className="absolute inset-0 z-0"
                          style={{ 
                            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%), url(${step.bg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                        <div className="relative z-10 flex flex-col justify-end h-full p-8">
                          <h3 className="text-white text-[55px] tracking-[0.55em] uppercase mb-4 font-brand-other flex items-center">
                            <span className="text-orange-700 font-brand-cn text-[80px] mr-1 leading-none">*</span>
                            {step.title}
                          </h3>
                          <p className="text-white/50 text-[19px] tracking-[0.1em] leading-relaxed uppercase font-brand-cn">{step.text}</p>
                        </div>
                      </>
                    )}

                    {step.isCTA && (
                      <div className="relative z-10 flex flex-col h-full justify-center items-center p-18 pointer-events-auto">
                        <div className="flex flex-col ">
                          <span className="text-[38px] tracking-[0.3em] text-white/ uppercase font-brand-other ">
                            <span className="font-brand-cn">Build your</span> AUTHORITY
                          </span>
                          <button onClick={() => router.push('/contact')} className="block cursor-pointer bg-transparent border-none p-0">
                            <img 
                              src="/CTA.png" 
                              alt="Build Your Authority"
                              className="w-full max-w-[5500px] h-auto object-contain select-none"
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- NAVIGATION & INSTRUCTIONS --- */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-4 pointer-events-none method-instructions-mobile"
        >
          <img 
            src={isMobile ? "/pinch-icon.png" : "/scroll-up.png"} 
            alt={isMobile ? "Pinch and Zoom" : "Scroll Up"} 
            className="w-15 h-15 opacity-80 method-instruction-icon-mobile" 
          />
          <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 font-brand-secondary-thin whitespace-nowrap">
            {isMobile ? "Pinch to Zoom " : (isZoomed ? "Scroll Down to Exit INSPECTION" : "Scroll Up to Inspect")}
          </span>
        </motion.div>

        {/* Floor Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-12 z-50 pointer-events-auto"
        >
          <button onClick={() => router.push('/')} className="flex flex-col items-start group no-underline bg-transparent border-none cursor-pointer">
            <motion.img 
              src="/exit-the-studio-1.png" 
              className="w-20 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex flex-col font-brand-secondary-thin text-left">
              <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light">Previous Floor</span>
              <span className="text-[12px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500">Exit The Studio</span>
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
          <button onClick={() => router.push('/services')} className="flex flex-col items-end group no-underline appearance-none bg-transparent border-none cursor-pointer text-right">
            <motion.img 
              src="/upstairs.png" 
              className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex flex-col items-end font-brand-secondary-thin text-right">
              <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 font-light font-brand-secondary-thin">Next Floor</span>
              <span className="text-[12px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">02 Services</span>
            </div>
          </button>
        </motion.div>

        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-4 z-20" />
      </div>
    </div>
    </main>
  );
}