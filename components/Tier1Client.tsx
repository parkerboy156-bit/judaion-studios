"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Tier1() {
  const router = useRouter();

  // Structured data to dynamically render the new dual-column layout
  const deliverables = [
    {
      what: "BRAND BLUEPRINT",
      details: [
        "– A 4-5 page strategic document defining vision, methodology, service pillars and team profile.",
      ],
    },
    {
      what: "LOGOS",
      details: [
        "– Primary Logo: The main brand mark that governs brand. Will be used for general use across website, signage etc.",
        "– Secondary / Alternative logo: A horizontal or stacked version for spaces where the primary logo doesn't fit (e.g., narrow navigation bars or business cards)",
        "– Brand Icon : A simplified version (favicon, social media profile picture) that remains legible at tiny sizes.",
      ],
    },
    {
      what: "READY TO MARKET ASSETS",
      details: [
        "– Custom designed Email Signatures, Digital Letterheads and Business Card templates based on new identity established.",
      ],
    },
    {
      what: "THE BRAND STYLE GUIDE",
      details: [
        '– The Manual : A 5-to-10-page pdf explaining how to use these assets, ensuring client does not "break" the brand when I am not there.',
        "– Typography Suite: Selection of primary and secondary fonts that ensure their brand speaks in a consistent tone.",
      ],
    },
  ];

  return (
    <main className="relative bg-black">
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "black",
          zIndex: 999, // Ensure it sits above all page content
          pointerEvents: "none",
        }}
      />

      <div className="flex flex-col lg:flex-row w-full min-h-screen lg:h-screen bg-[#0a0a0a] lg:overflow-hidden font-mono selection:bg-orange-600">
        {/* --- LEFT COLUMN: THE SPECIFICATION BLOCK --- */}
        <div className="relative w-full lg:w-[52%] min-h-screen lg:h-full overflow-y-auto flex flex-col z-30 pt-12 lg:pt-20 pb-4 lg:pb-6 px-12 xl:px-16">
          {/* 0. NEW VIDEO BACKGROUND LAYER */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4"
                type="video/mp4"
              />
            </video>
            {/* Your Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/56" />
          </div>

          {/* CONTENT WRAPPER: Keeps text above the video */}
          <div className="relative z-10 flex flex-col h-full w-full">
            {/* 2. TIER BADGE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-5 lg:mb-8 shrink-0"
            >
              <p className="font-brand-cn border border-white/40 px-2 py-1 lg:px-3 lg:py-1.5 w-fit uppercase tracking-wider lg:tracking-widest text-[10px] lg:text-xs text-white/70 rounded-sm bg-black/50">
                T1 &nbsp;|&nbsp; The Identity Launchpad
              </p>
            </motion.div>

            {/* 1. TOP TEXT TITLE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full mb-4 lg:mb-10 shrink-0"
            >
              <h2 className="text-white font-brand-other text-[clamp(2.5rem,7vw,5.625rem)] uppercase tracking-[0.5em] leading-[1.1]">
                FOUNDATION
              </h2>
            </motion.div>

            {/* 3. DUAL-COLUMN DELIVERABLES TABLE */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col w-full pr-3"
            >
              {/* Table Headers */}
              <div className="hidden lg:flex w-full py-3 border-b border-white/20 shrink-0">
                <div className="w-[35%] text-white/30 font-brand-cn text-[clamp(0.75rem,1.2vw,0.875rem)] uppercase tracking-[0.20em]">
                  What it is
                </div>
                <div className="w-[65%] text-white/30 font-brand-cn text-[clamp(0.75rem,1.2vw,0.875rem)] uppercase tracking-[0.20em] pl-4">
                  Deliverables
                </div>
              </div>

              {/* Table Rows */}
              <div className="flex flex-col w-full pb-8">
                {deliverables.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.8 + index * 0.15,
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                    className="flex flex-col lg:flex-row w-full py-4 border-b border-white/20 group hover:border-white/20 transition-colors shrink-0"
                  >
                    {/* Category */}
                    <div className="w-full lg:w-[35%] pr-0 lg:pr-4 pb-2 lg:pb-0">
                      <h3 className="text-white font-brand-bold text-[clamp(0.75rem,1.5vw,0.875rem)] uppercase tracking-[0.05em] leading-snug">
                        {item.what}
                      </h3>
                    </div>
                    {/* Details List */}
                    <div className="w-full lg:w-[65%] flex flex-col gap-3 pl-0 lg:pl-4">
                      {item.details.map((detail, i) => (
                        <p
                          key={i}
                          className="text-white/70 font-brand-secondary-thin text-[13px] leading-[1.6] "
                        >
                          {detail}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 4. ANCHORED BOTTOM NAVIGATION (Return) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="w-full flex justify-between items-end pt-4 z-[100] pointer-events-auto shrink-0 "
            >
              {/* Return Arrow */}
              <button
                onClick={() => router.back()}
                className="flex items-center cursor-pointer group bg-transparent border-none p-0"
              >
                <motion.img
                  src="/return-to.webp"
                  className="w-16 lg:w-20 xl:w-24 h-auto opacity-80 group-hover:opacity-100"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  alt="Return"
                />
              </button>
            </motion.div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: THE VISUAL SHOWROOM (PRESERVED) --- */}

        <div className="relative w-full lg:w-[52%] h-[60vh] lg:h-full overflow-hidden bg-[#080808] border-l-2 border-t-2 border-b-2 border-r-2 border-white">
          {/* LAYER 00: ENVIRONMENT BACKGROUND */}
          <img
            src="/tier1-bg.webp"
            alt="Environment"
            className="absolute inset-0 w-full h-full object-cover object-left z-0"
          />

          {/* LAYER 10: FOUNDATION ASSET (BUILDINGS) */}
          <motion.img
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 3.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            src="/tier1-foundation.webp"
            alt="Foundation Asset"
            className="absolute inset-0 w-full h-full object-cover object-left z-10 select-none pointer-events-none"
          />

          {/* LAYER 20: GROUND OVERLAY */}
          <img
            src="/tier1-ground.webp"
            alt="Ground Overlay"
            className="absolute inset-0 w-full h-full object-cover object-left z-20 pointer-events-none"
          />
        </div>
      </div>
    </main>
  );
}
