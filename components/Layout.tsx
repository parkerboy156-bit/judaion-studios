"use client"; // Mandatory for State and Framer Motion

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link'; // Replaced react-router-dom Link

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white">
      {/* 1. CLOUDY DIMMER OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm cursor-pointer"
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
          />
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <header className="fixed top-0 left-0 w-full z-[100] px-10 py-8 flex justify-between items-start pointer-events-none">
        
        {/* CENTERED NAVIGATION MENU */}
        <div className="flex flex-col pointer-events-auto">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="group flex flex-col gap-[6px] w-8 focus:outline-none cursor-pointer z-[110]"
          >
            <motion.span 
              animate={isOpen ? { rotate: 45, y: 7, backgroundColor: "#fff" } : { rotate: 0, y: 0, backgroundColor: "#fff" }}
              className="w-full h-[1px] transition-colors duration-300" 
            />
            <motion.span 
              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-full h-[1px] bg-white transition-colors duration-300" 
            />
            <motion.span 
              animate={isOpen ? { rotate: -45, y: -7, backgroundColor: "#fff" } : { rotate: 0, y: 0, backgroundColor: "#fff" }}
              className="w-full h-[1px] transition-colors duration-300" 
            />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.nav 
                className="fixed inset-0 flex flex-col items-center justify-center gap-12 z-[95] pointer-events-none mobile-nav-container"
                style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
              >
                {['Home', 'Methodology', 'Services', 'Project Archive', 'About Us', 'Contact'].map((item, i) => (
                  <Link
                    key={item}
                    href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(/\s+/g, '')}`} // Changed 'to' to 'href'
                    onClick={() => setIsOpen(false)}
                    className="text-white font-brand-secondary-thin text-[1.2rem] uppercase tracking-[0.6em] inline-block pointer-events-auto"
                  >
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 0.4, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      whileHover={{ 
                        opacity: 1,
                        transition: { duration: 0.3, ease: "easeOut" } 
                      }}
                      transition={{ 
                        delay: 0.1 + (i * 0.1), 
                        duration: 0.8, 
                        ease: [0.22, 1, 0.36, 1] 
                      }}
                      className="block cursor-pointer text-center nav-link-mobile"
                    >
                      {item}
                    </motion.span>
                  </Link>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: UPDATED "J" LOGO */}
        <Link href="/" className="pointer-events-auto block group relative">
          <motion.img 
            src="/j-logo.svg" 
            alt=""
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: 0.5, 
              x: 3, 
              y: -3,
              filter: "contrast(150%) brightness(150%)" 
            }}
            transition={{ duration: 0.1, ease: "linear" }}
            className="absolute inset-0 h-10 w-auto z-[109] pointer-events-none mix-blend-screen"
          />

          <motion.img 
            whileHover={{ 
              scale: 1.05,
              filter: "brightness(1.2)"
            }}
            transition={{ 
              duration: 0.2, 
              ease: [0.19, 1, 0.22, 1] 
            }}
            src="/j-logo.svg" 
            alt="Judaion" 
            className="h-10 w-auto relative z-[110]" 
          />
        </Link>
      </header>

      {/* 3. FOOTER INFO */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="fixed bottom-12 left-10 z-[90] font-brand-secondary-heavy text-[0.6rem] tracking-[0.2em] text-white/60 space-y-6 mobile-footer-container"
          >
            <div>
              <p className="text-white uppercase mb-1 font-bold"><span className="text-orange-700 font-brand-cn text-[18px] mr-1 leading-none">*</span>JUDAION Digital Studio</p>
              <p>Vision. Structure. Identity.</p>
            </div>


            <div className="enquiries-block-mobile">
              <p className="text-white uppercase mb-1 font-bold">
                <span className="text-orange-700 font-brand-cn text-[18px] mr-1 leading-none">*</span>Enquiries</p>
              <p>extraction@judaion.com</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative">{children}</main>
    </div>
  );
}