"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // FRAMEWORK REQUIRED: Replacement for react-router-dom

export default function Tier1() {
  const router = useRouter(); // FRAMEWORK REQUIRED: Replacement for useNavigate
  
  const specs = [
    "BRAND <span>BLUE-PRINT</span>",
    "PRIMARY <span>LOGO</span>",
    "SECONDARY // ALT <span>LOGO</span>",
    "BRAND <span>ICON</span>",
    "THE <span>COLOUR SYSTEM</span>",
    "<span>TYPOGRAPHY</span> SUITE",
    "THE <span> BRAND STYLE</span> GUIDE",
    "<span>READY TO MARKET</span> ASSETS"
  ];

  return (
    <main className="relative bg-black">
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'black',
          zIndex: 999, // Ensure it sits above all page content
          pointerEvents: 'none'
        }}
      />
    <div className="flex w-full h-screen bg-[#0a0a0a] overflow-hidden font-mono selection:bg-orange-600">
      
      {/* --- LEFT COLUMN: THE SPECIFICATION BLOCK (45%) --- */}
      <div 
        className="relative w-[52%] h-full overflow-hidden flex flex-col z-30"
        style={{
          backgroundImage: "url('/tier-1-left.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
     
        {/* TOP FLOATING MARQUEE */}
        <div className="relative w-full pt-12 pb-6 z-20 overflow-hidden">
        </div>

        {/* CENTRAL CONTENT AREA - Added Brand Details */}
        <div className="flex-1 px-16 flex flex-col justify-center items-end text-right">
           <div className="mb-auto mt-top">
             <h2 className="text-[58px] tracking-[0.2em] uppercase text-white font-brand-compressed">What it includes:</h2>
             <div className="w-[580px] h-[3px] bg-white mb-7" />
             <div className="flex flex-col items-end space-y-1">
               {specs.map((spec, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.5 + (i * 0.1) }}
                   className="flex items-center group"
                 >
                   {/* BULLET TEXT WITH INLINE FORMATTING */}
                   <span 
                     className="text-[25px] tracking-[0.2em] uppercase text-white/40 font-brand-cn cursor-pointer group-hover:text-white transition-colors duration-300"
                     dangerouslySetInnerHTML={{ 
                       __html: spec.replace('<span>', '<span class="font-brand-med-italic-cn text-white">').replace('</span>', '</span>') 
                     }}
                   />
                   {/* THE DOT BULLET */}
                   <span className="text-white ml-3 text-[10px] leading-none">•</span>
                 </motion.div>
               ))}
             </div>
           </div>

           {/* --- FREELY POSITIONABLE RETURN BUTTON --- */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 1, duration: 1 }}
             className="absolute z-[100] top-[59%] left-[3%] pointer-events-auto"
           >
             <button 
               onClick={() => router.back()} // REPLACEMENT: Functional equivalent to navigate(-1)
               className="flex items-center cursor-pointer group bg-transparent border-none p-0"
             >
               <motion.img 
                 src="/return-to.png" 
                 className="w-25 h-auto opacity-70 group-hover:opacity-100" 
                 animate={{ x: [0, -4, 0] }} 
                 transition={{ duration: 3, repeat: Infinity }} 
               />
             </button>
           </motion.div>

           {/* 2. FREELY POSITIONABLE CTA BLOCK */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 1.5, duration: 1 }}
             className="absolute z-[100] top-[58%] left-[69%] pointer-events-auto"
           >
              {/* CTA Image Link */}
              <button 
                onClick={() => router.push('/contact')} // REPLACEMENT: Use router.push for Next.js navigation
                className="block cursor-pointer bg-transparent border-none p-0"
              >
                <img 
                  src="/CTA.png" 
                  alt="Build Your Authority"
                  className="w-full max-w-[230px] h-auto object-contain select-none opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
              </button>
           </motion.div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: THE VISUAL SHOWROOM --- */}

      {/* --- MOBILE-ONLY RETURN BUTTON (ISOLATED) --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mobile-only-return hidden"
      >
        <button 
          onClick={() => router.back()} 
          className="flex items-center cursor-pointer p-4 bg-transparent border-none"
        >
          <motion.img 
            src="/return-to.png" 
            className="w-16 h-auto" 
            animate={{ x: [0, -4, 0] }} 
            transition={{ duration: 3, repeat: Infinity }} 
          />
        </button>
      </motion.div>

      <div className="relative w-[52%] h-full overflow-hidden bg-[#080808]">
        {/* LAYER 00: ENVIRONMENT BACKGROUND */}
        <img 
          src="/tier1-bg.png" 
          alt="Environment" 
          className="absolute inset-0 w-full h-full object-cover object-left z-0" 
        />
        
        {/* LAYER 10: FOUNDATION ASSET (BUILDINGS) */}
        <motion.img 
          initial={{ y: "100%", opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}      
          transition={{ duration: 3.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          src="/tier1-foundation.png" 
          alt="Foundation Asset" 
          className="absolute inset-0 w-full h-full object-cover object-left z-10 select-none pointer-events-none"
        />

        {/* LAYER 20: GROUND OVERLAY */}
        <img 
          src="/tier1-ground.png" 
          alt="Ground Overlay" 
          className="absolute inset-0 w-full h-full object-cover object-left z-20 pointer-events-none" 
        />
      </div>

    </div>
    </main>
  );
}