"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Tier3() {
  const router = useRouter();

  const deliverables = [
    {
      what: "STRATEGIC VISUAL ASSETS",
      details: [
        "– 12 on-brand content pieces per month (3 per week) for LinkedIn and Instagram.",
      ],
    },
    {
      what: "CONVERSION-OPTIMISED AS CREATIVE",
      details: [
        "– Purpose-built paid campaign visuals (quantity aligned to monthly campaign plan).",
      ],
    },
    {
      what: "MONTHLY PERFROMANCE SYNC",
      details: [
        "– Strategic review aligning creative output with business goals.",
      ],
    },
    {
      what: "PROACTIVE WEBSITE MAINTENANCE",
      details: ["– Monthly technical check-ups and content updates."],
    },
    {
      what: "BASIC COPYWRITING INTEGRATION",
      details: [
        "– Structuring “About Us” page and “Services” text to be persuasive, not just descriptive.",
      ],
    },
    {
      what: "BRAND COLLATERAL UPDATES",
      details: [
        "– Refreshed market assets (Email Signatures, Letterheads) at 6-month intervals where necessary.",
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
                T3 &nbsp;|&nbsp; The Scale Partner
              </p>
            </motion.div>

            {/* 1. TOP TEXT TITLE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full mb-4 lg:mb-10 shrink-0"
            >
              <h2 className="text-white font-brand-other text-[clamp(2.5rem,7vw,5.625rem)] uppercase tracking-[0.35em] leading-[1.1]">
                ARCHITECTURE
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

        {/* --- RIGHT COLUMN: VISUAL ASSEMBLY --- */}

        <div className="tier3-visual-container relative w-[52%] h-full overflow-hidden bg-[#080808] border-l-2 border-t-2 border-b-2 border-r-2 border-white">
          {/* BACKGROUND BASE (Backmost) */}
          <img
            src="/tier3-bg.webp"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* SLIDING ASSETS (Middle Layers - Slide behind Environment) */}
          <motion.img
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 3.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            src="/tier3-black-back-left.webp"
            className="absolute inset-0 w-full h-full object-cover z-10"
          />
          <motion.img
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 3.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            src="/tier3-black-back-right.webp"
            className="absolute inset-0 w-full h-full object-cover z-10"
          />

          <motion.img
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 3.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            src="/tier3-left-wall.webp"
            className="absolute inset-0 w-full h-full object-cover z-20"
          />
          <motion.img
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 3.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            src="/tier3-right-wall.webp"
            className="absolute inset-0 w-full h-full object-cover z-20"
          />

          <motion.img
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 3.2, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            src="/tier3-top.webp"
            className="absolute inset-0 w-full h-full object-cover z-30"
          />
          <motion.img
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 4.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            src="/tier3-top-left-chunk.webp"
            className="absolute inset-0 w-full h-full object-cover z-40"
          />
          <motion.img
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 3.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            src="/tier3-top-right-chunk.webp"
            className="absolute inset-0 w-full h-full object-cover z-40"
          />

          {/* MAIN BASE ASSET (Frontmost Environment Layer) */}
          <img
            src="/tier3-environment.webp"
            className="absolute inset-0 w-full h-full object-cover z-50"
          />
        </div>
      </div>
    </main>
  );
}
