"use client"; // REQUIRED: Component utilizes Framer Motion and Browser APIs

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation'; // MANDATORY CHANGE: Framework compatibility
import heroBgAvif from '@/public/hero-bg-block.avif';
import heroBgPng from '@/public/hero-bg-block.png';
import archiveheaderAvif from '@/public/archive-header.avif';
import archiveheaderWebp from '@/public/archive-header.webp';


export default function AboutTemplate() {
  const router = useRouter(); // MANDATORY CHANGE: Replace useNavigate for Next.js

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
    <div className="relative w-full min-h-screen bg-black ">

      {/* 1. THE FOOLPROOF VIDEO LAYER */}
      <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
         <video
            poster="/global-bg-poster.avif"
            key="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4"
            muted 
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover grayscale opacity-65"
          >
            <source src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4" type="video/mp4" />
          </video>

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* 2. THE CONTENT LAYER (Z-index 10 to stay above video) */}
      <div className="relative z-10 w-full bg-transparent text-white font-brand-secondary-thin selection:bg-orange-600/30">
        


{/* SECTION 1: THE HERO (PRECISION LAYERED BLOCK) */}
<section className="h-screen w-full flex flex-col justify-center px-10 lg:px-20 border-b border-white/10 relative overflow-hidden">



{/* NAVIGATION: RETURN TO Project Archive */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute top-20 left-12 z-50 pointer-events-auto"
      >
        <button 
          onClick={() => router.push('/projectarchive')} // ADJUSTED: Parity with next/navigation
          className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer"
        >
          <motion.img 
            src="/last-floor-straight.png" 
            className="w-22 h-auto mb-1 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain" 
            animate={{ x: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex flex-col items-start font-brand-secondary-thin text-left">
               <span className="text-[9px] tracking-[0.5em] uppercase text-white/40 font-light font-secondary-thin">Previous Floor</span>
            <span className="text-[12px] tracking-[0.4em] uppercase text-white/60 group-hover:text-white transition-colors duration-500">03 Project Archive</span>
          </div>
        </button>
      </motion.div>


  
  {/* --- HALF-SCREEN BACKGROUND IMAGE BLOCK --- */}
  {/* Positioned absolute, z-0 (behind text), half width, right aligned */}
  <div 
    className="absolute top-0 right-0 w-1/2 h-full z-0 overflow-hidden pointer-events-none border-l-3 border-t-3 border-b-3 border-r-3 border-white"
  >

<picture>
  {/* Primary: The modern AVIF version */}
  <source 
    srcSet={heroBgAvif.src} 
    type="image/avif" 
  />

  {/* Fallback: The original PNG version */}
  <img
    src={heroBgPng.src}
    alt="Hero Feature"
    className="w-full h-full object-cover opacity-80"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: -1,
    }}
    // Ensures this loads before secondary assets
    fetchPriority="high"
  />
</picture>

  </div>

        {/* SCROLL LABEL */}
        <div className="absolute bottom-5 right-1 flex items-center space-x-6 opacity-70">
          <img 
            src="/scroll-up.png" 
            alt="Inspect Icon" 
            className="w-20 h-auto filter brightness-110"
          />
        </div>

   {/* Y axis */}
        <div className="absolute top-[97%] left-[25%] flex items-center space-x-6">

          <span className="text-[0.6vw] tracking-[0.1em] uppercase text-white/60 font-brand-italic-thin-cn whitespace-nowrap">
            <span className="text-[0.6vw] tracking-[0.1em] text-white/60 font-brand-cn">Y</span> : 540,34 PX
          </span>
        </div>

                  {/* X axis */}
        <div className="absolute top-[97%] left-[3%] flex items-center space-x-6">

          <span className="text-[0.6vw] tracking-[0.1em] uppercase text-white/60 font-brand-italic-thin-cn whitespace-nowrap">
            <span className="text-[0.6vw] tracking-[0.1em] text-white/60 font-brand-cn">X</span> : 474.69 PX
          </span>
        </div>

                  {/* Descritption */}
        <div className="absolute top-[97%] left-[44%] flex items-center space-x-6">

          <span className="text-[0.5vw] tracking-[0.1em] uppercase text-white/70 font-brand-italic-thin-cn whitespace-nowrap">
            <span className="text-[0.5vw] tracking-[0.1em] text-white/60 font-brand-cn">Asset 3</span> "ARCHITECTURE"
          </span>
        </div>    

  {/* --- CONTENT LAYER (Z-10 to stay over the new image block) --- */}
  <h1 className="relative z-10 flex flex-col font-brand-cn uppercase leading-[1]">
    
    {/* LINE 1: Establishing The */}
    <div className="flex justify-center w-full py-5 self-center gap-x-4">
      <span className="hero-secondary-text-top text-[2vw] tracking-[0.1em] text-white/30">We</span>
      <span className="hero-secondary-text-top text-[2vw] tracking-[0.1em] text-white/98 font-brand-xbold-italic-cn"> Establish </span>
      <span className="hero-secondary-text-top text-[2vw] tracking-[0.1em] text-white/30">The</span>
    </div>

    {/* LINE 2: *Architecture */}
    <span className="text-[13vw] tracking-[0.10em] text-white font-brand-other ml-[-25px]">
       <span className="text-orange-600 font-brand-cn">*</span>Architecture
    </span>

    {/* LINE 3: For Your business's */}
    <div className="flex justify-center w-full py-5 self-center gap-x-4">
      <span className="hero-secondary-text-bottom text-[3vw] tracking-[0.1em] text-white/30 ">For</span>
      <span className="hero-secondary-text-bottom text-[3vw] tracking-[0.2em] text-white/98 font-brand-xbold-italic-cn">Your Vision's</span>
    </div>

    {/* LINE 4: *PERMANANCE */}
    <span className="text-[13vw] tracking-[0.13em] text-white font-brand-other ml-[-25px]">
      <span className="text-orange-600 font-brand-cn">*</span>PERMANANCE
    </span>

  </h1>
</section>

        {/* SECTION 2: THE SPLIT BLOCK (Transparent Backgrounds) */}
        <section className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-transparent ">
<div className="h-[60vh] lg:h-screen sticky top-0 bg-white/5 overflow-hidden ">
  <video
    muted
    autoPlay
    loop
    playsInline
    preload="auto"
    className="w-full h-full object-cover"
  >
    <source src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/Raw%20Logo%20Videologo-video-raw.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>

<div className="flex flex-col justify-center p-10 lg:p-32 space-y-12 ">
  
  {/* TOP LABEL / INDEX */}
  <span className="classification-text text-[11px] tracking-[0.5em] uppercase text-white/30 font-brand-secondary-thin">
    [classification: About us]
  </span>

  <div className="space-y-9">
    {/* HEADER */}
<div className=" inline-block mb-12">
  {/* MAIN HEADING */}
  <h2 className="about-main-title text-[60px] font-brand-cn uppercase tracking-[0.1em] text-white leading-none">
    Who is <span className="font-brand-xbold-italic-cn">Judaion</span>
  </h2>
  
  {/* THE ARCHITECTURAL UNDERLINE */}
  <motion.div 
    initial={{ width: 0 }}
    animate={{ width: '100%' }}
    transition={{ delay: 3, duration: 1.5, ease: "easeInOut" }}
    className="h-[2px] bg-white mt-4 origin-left"
  />
</div>

{/* PARAGRAPH GROUP 1 */}
    <div className="space-y-5">
      <h4 className="text-[34px] tracking-[0.2em] uppercase  font-brand-other">
        <span className="font-brand-med-italic-cn text-orange-600">*</span>THE ARCHITECT 
      </h4>
      <p className="text-white/60 text-[16px] leading-relaxed tracking-[0.15em] font-brand-cn max-w-xl">
       BORN FROM THE CONVERGENCE OF TWO NAMES -ZION // JUDAH- THE BRAND ORIGINATED AS A PERSONAL REFORMATION. IT WAS SHIFTED TOWARDS RIGID DISCIPLINE AND "HACKING AWAY AT THE UNESSENTIAL."
      </p>
            <p className="text-white/60 text-[16px] leading-relaxed tracking-[0.15em] font-brand-cn max-w-xl">
       BEFORE IT BUILT INDENTITIES FOR OTHERS, <span className="text-white text-[18px] leading-relaxed tracking-[0.1em] font-brand-xbold-italic-cn max-w-xl">JUDAION</span> WAS THE FRAMEWORK USED TO BUILD THE <span className="text-white text-[18px] leading-relaxed tracking-[0.1em] font-brand-xbold-italic-cn max-w-xl">ARCHITECT.</span> 
      </p>
    </div>

<div className="pt-4 border-t border-white/20"></div>


{/* PARAGRAPH GROUP 1 */}
    <div className="space-y-5">
      <h4 className="text-[34px] tracking-[0.2em] uppercase  font-brand-other">
        <span className="font-brand-med-italic-cn text-orange-600">*</span>THE COMMITMENT
      </h4>
      <p className="text-white/60 text-[16px] leading-relaxed tracking-[0.15em] font-brand-cn max-w-xl">
      ORIGINALLY ROOTED IN ART-SCHOOL AESTHETICS, PREVIOUS WORK WAS OBSESSED WITH SEEKING VALIDATION AND CREATING "PRETTY PICTURES", THIS CAUSED A STRUCTURAL DECAY IN EARLY FREELANCING WORK. THE TRANSITION FROM FREELANCING TO PARTNERSHIP ENVOKED THE SHIFT OF "WHAT CAN I ADD" TO "WHAT IS ESSENTIAL".
      </p>
            <p className="text-white/60 text-[16px] leading-relaxed tracking-[0.15em] font-brand-cn max-w-xl">
       THIS IS THE PRIMARY LAW OF THE STUDIO: <span className="text-white text-[18px] leading-relaxed tracking-[0.1em] font-brand-xbold-italic-cn max-w-xl">DISCIPLINE COMES FROM FOUNDATION.</span> 
      </p>
    </div>
  <div className="pt-4 border-t border-white/20"></div>

{/* PARAGRAPH GROUP 1 */}
    <div className="space-y-5">
      <h4 className="text-[34px] tracking-[0.2em] uppercase font-brand-other">
        <span className="font-brand-med-italic-cn text-orange-600">*</span>THE PRINCIPLE
      </h4>
      <p className="text-white/60 text-[16px] leading-relaxed tracking-[0.15em] font-brand-cn max-w-xl">
     MOST IDENTITIES SUFFER FROM STRUCTURAL DECAY // THE ACCUMULATION OF VISUAL NOISE, TRENDS AND AESTHETIC VOLUME DESIGNED TO "WOW" RATHER THAN TO ENDURE. WE DO NOT CREATE "LOOKS" WE ARCHITECT PERMANACE.
      </p>
            <p className="text-white/60 text-[16px] leading-relaxed tracking-[0.15em] font-brand-cn max-w-xl">
       <span className="text-white text-[18px] leading-relaxed tracking-[0.1em] font-brand-xbold-italic-cn max-w-xl">LOGIC OVER AESTHETICS.</span> 
      </p>
    </div>

  </div>

  {/* BOTTOM DETAIL */}
  <div className="pt-4 border-t border-white/20">
    <span className="text-[11px] tracking-[0.3em] uppercase text-white/40 font-brand-secondary-thin">
      JUDAION IS YOUR CREATIVE STRATEGIC PARTNER.
    </span>
  </div>
</div>
</section>


{/* SECTION 3: THE CORE PILLARS (CONNECTED ARCHITECTURE) */}
<section className="py-32 px-10 lg:px-20 bg-gradient-to-b from-black/70 to-transparent relative overflow-hidden">
  
  {/* HEADER LABEL */}
  <div className="flex justify-between items-end mb-20 border-b border-white/90 pb-10">
      <h3 className="about-pillars-title text-[11px] uppercase tracking-[0.5em] font-brand-secondary-heavy text-white/90">JUDAION CORE PILLARS // 01 — 03</h3>
      <span className="about-pillars-date text-[10px] font-brand-secondary-thin text-white/90 tracking-[0.2em] uppercase">EST.2026-01</span>
  </div>

  {/* THE CONNECTED FLEX CONTAINER */}
  <div className="flex flex-col lg:flex-row items-center justify-between gap-0 relative">
    
    {/* PILLAR 01 */}
    <div className="w-full lg:w-[30%] group relative border border-white p-5 min-h-[450px] flex flex-col justify-between overflow-hidden bg-black/20 backdrop-blur-sm">
      <img src="/vision.png" className="absolute inset-0 w-full h-full object-cover opacity-75 z-0" />
      <div className="relative z-10 space-y-5">
        <h4 className="pillar-item-title text-[70px] tracking-[0.8em] font-brand-compressed uppercase text-white">Vision</h4>
        <p className="text-white/80 text-md tracking-[0.04em] font-brand-cn leading-relaxed">
          IDENTIFYING THE CORE TRUTH BY HACKING AWAY AT THE UNESSENTIAL NOISE.
        </p>
      </div>
    </div>

    {/* CONNECTOR LINE 1 */}
    <div className="hidden lg:flex flex-col justify-center items-center w-[5%] h-px space-y-2">
      <div className="w-full h-[1px] bg-white/40"></div>
      <div className="w-full h-[1px] bg-white/10"></div>
      <div className="w-full h-[1px] bg-white/40"></div>
    </div>

    {/* PILLAR 02 */}
    <div className="w-full lg:w-[30%] group relative border border-white p-5 min-h-[450px] flex flex-col justify-between overflow-hidden bg-black/20 backdrop-blur-sm">
      <img src="/structure.png" className="absolute inset-0 w-full h-full object-cover opacity-75 z-0" />
      <div className="relative z-10 space-y-80">
        <h4 className="pillar-item-title2 text-[70px] tracking-[0.37em] font-brand-compressed uppercase text-white">STRUCTURE</h4>
        <p className="text-white/80 text-md tracking-[0.04em] font-brand-cn leading-relaxed">
          ENGINEERING A RIGID FRAMEWORK DESIGNED TO WITHSTAND THE PRESSURE OF TRENDS.
        </p>
      </div>
    </div>

    {/* CONNECTOR LINE 2 */}
    <div className="hidden lg:flex flex-col justify-center items-center w-[5%] h-px space-y-2">
      <div className="w-full h-[1px] bg-white/10"></div>
      <div className="w-full h-[1px] bg-white/10"></div>
      <div className="w-full h-[1px] bg-white/40"></div>
    </div>

    {/* PILLAR 03 */}
    <div className="w-full lg:w-[30%] group relative border border-white p-5 min-h-[450px] flex flex-col justify-between overflow-hidden bg-black/20 backdrop-blur-sm">
      <img src="/identity.png" className="absolute inset-0 w-full h-full object-cover opacity-75 z-0" />
      <div className="relative z-10 space-y-4">
        <h4 className="pillar-item-title3 text-[70px] tracking-[0.5em] font-brand-compressed uppercase text-white">IDENTITY</h4>
        <p className="text-white/80 text-md tracking-[0.04em] font-brand-cn leading-relaxed">
          DEPLOYING A MONOCHROME SIGNATURE THAT COMMANDS PERMANENCE IN A CROWDED LANDSCAPE.
        </p>
      </div>
    </div>

  </div>
</section>

{/* SECTION 4: FULL-WIDTH CINEMATIC VIDEO */}
<section className="h-[80vh] w-full bg-black/20 overflow-hidden relative">
  <video
    muted
    autoPlay
    loop
    playsInline
    preload='auto'
    className="w-full h-full object-cover grayscale hover:scale-105 transition-transform duration-[3s]"
  >
    <source src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Section%204%20JDS-section-4-color.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
  
{/* OVERLAY CONTENT */}
<div className="absolute inset-0 flex flex-col justify-end pl-12 lg:p-20 pb-24 lg:pb-15">
  <h2 className="commitment-heading text-white text-4xl lg:text-6xl font-brand-other tracking-[0.4em] uppercase mb-6">
     <span className="font-brand-med-italic-cn text-orange-600">*</span>Where Commitment Meets the Grid</h2>

  {/* PARAGRAPH TEXT MOVED INSIDE FLEX CONTAINER */}
  <p className="commitment-body-text max-w-2xl text-left text-white/60 text-sm lg:text-base leading-relaxed tracking-[0.15em] font-brand-cn uppercase">
   THE RESULT OF PERSONAL DISCIPLINE APPLIED TO DIGITAL PRECISION. WE Don't JUST CREATE LOOKS, WE BUILD <span className="text-white/90 text-[18] leading-relaxed tracking-[0.12em] font-brand-xbold-italic-cn max-w-xl">STRUCTURAL IDENTITIES</span> THAT LAST.
  </p>
</div>
  

  <div className="absolute inset-0 z-10 p-12 pointer-events-none">
    {/* Top Right: Status Marker */}
  <div className="absolute top-8 right-8 flex flex-col   p-4">
    <span className="archive-status-tag text-[10px] tracking-[0.2em] uppercase text-white/30 font-brand-secondary-thin">
      LOG-ID: ZJP-EXT-02
    </span>
    <span className="archive-status-tag text-[10px] tracking-[0.2em] text-white/30 uppercase font-brand-secondary-thin">
      CLEARANCE: LEVEL-04
    </span>
        <span className="archive-status-tag text-[10px] tracking-[0.2em] text-white/30 uppercase font-brand-secondary-thin">
      SUBJECT: THE ARCHITECT
    </span>
  </div>


  
{/* TOP LEFT: LIVE FEED STATUS */}
<div className="absolute top-8 left-8 flex items-center  space-x-4  p-4 pointer-events-none">
  
  {/* PULSING ASSET */}
  <span className="archive-pulse-icon w-3 h-3 bg-orange-600 animate-pulse rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
  
  {/* LIVE TEXT LABELS */}
  <div className="flex flex-col">
    <span className="studio-feed-title text-[11px] tracking-[0.4em] uppercase text-white/90 font-brand-secondary-heavy">
      Studio // Feed 
    </span>
    <span className="archive-status-tag text-[9px] tracking-[0.2em] text-white/30 uppercase font-brand-secondary-thin">
      SESSION-LOG: [06/04/25]
    </span>
  </div>
  </div>
  </div>
</section>

{/* SECTION 5: THE LEADERSHIP (SPLIT ARCHITECTURE) */}
<section className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-transparent relative overflow-hidden"
>
  
  {/* THE GRADIENT OVERLAY */}
  <div className="absolute inset-0  bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
  
{/* LEFT BLOCK: DYNAMIC IMAGE SWITCH */}
<div className="relative h-[70vh] lg:h-screen border-r border-white/10 overflow-hidden group cursor-pointer">
  
  {/* IMAGE 01: INITIAL STATE (Arms Crossed) */}
  <img 
    src="/ZJ-1.png" 
    alt="Lead Architect - State A" 
    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0" 
  />

  {/* IMAGE 02: HOVER STATE (Hand in Pocket) */}
  <img 
    src="/ZJ-2.png" 
    alt="Lead Architect - State B" 
    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-90 group-hover:scale-100" 
  />


</div>

  {/* RIGHT BLOCK: NAME & BIO */}
<div 
  className="flex flex-col justify-between p-12 lg:p-32 h-full backdrop-blur-sm bg-cover bg-center bg-no-repeat">

<picture>
    <source srcSet={archiveheaderAvif.src} type="image/avif" />
    <img
      src={archiveheaderWebp.src}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover object-center -z-20"
    />
  </picture>

  <div 
    className="absolute inset-0 bg-black/75 -z-10" 
    aria-hidden="true"
  />

    
{/* TOP ANCHOR: STATUS & LOGO SPLIT */}
<div className="flex flex-row justify-between items-start w-full">
    
    {/* TOP LEFT: OPERATIONAL STATUS */}
    <div className="flex flex-col space-y-2">
        <span className="operational-lead text-[10px] tracking-[0.8em] uppercase text-white/30 font-brand-secondary-thin">
          Operational Lead // 
        </span>
    </div>

    {/* TOP RIGHT: BRAND LOGO */}
    <img 
      src="/judaion-logo-white.svg" 
      alt="JUDAION Logo" 
      className="w-32 lg:w-30 opacity-90" 
    />
</div>

    {/* CENTER BLOCK: IDENTITY & BIO (Spaced for maximum authority) */}
    <div className="flex flex-col space-y-12 py-16">
        <div className="space-y-9">
            <h2 className="architect-signature-name text-4xl lg:text-6xl font-brand-xbold-italic-cn uppercase tracking-[0.15em] text-white leading-none">
              <span className="border-b-2 border-white ">ZION JUDAH <span className="font-brand-cn text-white">PARKER</span>  
              </span>
                 
            </h2>
            
            
      {/* ROLE TITLE */}
      <div className="flex items-center space-x-4">
        
        <span className="architect-signature-title text-[35px] tracking-[0.4em] uppercase text-white/89 font-brand-other">
          <span className="font-brand-med-italic-cn text-[25px] text-orange-600">*</span>Chief Creative Officer 
        </span>
      </div>
        </div>

        <p className="text-white/60 text-sm lg:text-base leading-relaxed tracking-[0.13em] font-brand-cn uppercase">
            Zion Judah Parker is the architect of the JUDAION system. His methodology 
            focuses on Extracting the core Truth of an organisation to build identities backed by Structural Logic. Guided by a philosophy of permanence, he engineers enduring brand foundations for founders who require their visual presence to operate with <span className="font-brand-xbold-italic-cn text-white/90">Absolute Authority.</span>
        </p>
    </div>

    {/* BOTTOM ANCHOR: SIGNATURE / INDEX */}
    <div className="pt-8 border-t border-white/20">
        <span className="operational-lead text-[10px] tracking-[0.3em] uppercase text-white/30 font-brand-secondary-thin">
            Protocol: Lead Architect // Framework 5.0
        </span>
    </div>
</div>

</section>

{/* SECTION 6: THE CALL TO ACTION (FINAL PROTOCOL) */}
<section className="about-cta-section h-[70vh] w-full flex flex-col lg:flex-row items-center justify-between px-12 lg:px-32 border-t border-white/10 bg-transparent relative overflow-hidden">
  
  {/* LEFT: TEXT STACK */}
  <div className="flex flex-col items-start space-y-4">
    <span className="cta-meta-tag text-[10px] uppercase tracking-[1em] text-white/40 font-brand-secondary-thin">
      NEXT FLOOR // CONTACT US
    </span>
    <h2 className="cta-main-title text-4xl lg:text-6xl font-brand-cn tracking-[0.3em] uppercase text-white leading-tight">
      BUILD YOUR <br /> 
      <span className="cta-accent-title font-brand-other text-white text-[90px] ">AUTHORITY</span>
    </h2>
  </div>

  {/* RIGHT: CTA ASSET ANCHOR */}
  <div className="relative group cursor-pointer mt-13 lg:mt-0">
    <button 
      onClick={() => router.push('/contact')} // ADJUSTED: Parity with next/navigation
      className="relative z-10 overflow-hidden  p-5 transition-all duration-500 hover:border-orange-600/50 cursor-pointer"
    >
      <img 
        src="/CTA.png" 
        alt="Execute Protocol" 
        className="w-64 lg:w-150 h-auto " 
      />
      

    </button>
  </div>

</section>

      </div>
    </div>
    </main>
  );
}