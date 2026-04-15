"use client"; // REQUIRED: Component utilizes Framer Motion hooks and Browser APIs

import { motion, useMotionValue, useSpring, useTransform,} from 'framer-motion';
import * as React from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation'; // MANDATORY CHANGE: Framework compatibility
import emailjs from '@emailjs/browser';
import Image from 'next/image';
import contactBgAvif from '@/public/contact-us-bg.avif';
import contactBgWebp from '@/public/contact-us-bg.webp';

export default function Contact() {
  const router = useRouter(); // MANDATORY CHANGE: Replace useNavigate for Next.js
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = React.useState<'idle' | 'initiating...' | 'initiated'>('idle');
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
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

  // Pinned values - these must match for both the image and the form
  const bgMoveX = useTransform(mouseX, [0, 1920], ["1.5%", "-1.5%"]);
  const bgMoveY = useTransform(mouseY, [0, 1080], ["1.5%", "-1.5%"]);

// --- THE SENDING LOGIC ---
const sendEmail = (e: React.FormEvent) => {
  e.preventDefault();
  setStatus('initiating...');

  if (form.current) {
    emailjs.sendForm(
      'judaion_outreach', 
      'template_i4g317c', 
      form.current, 
      't3-Z2koe9RoLgz3Ri' // Public Key verified from original source
    )
    .then((result) => {
        setStatus('initiated');
        setTimeout(() => setStatus('idle'), 9000);
    })
    .catch((error) => {
        setStatus('idle');
        // This will now print the specific server response (e.g., "Unauthorized domain")
        console.error("TRANSMISSION_FAILED:", error.text || error); 
    });
  }
};

  const handleMouseMove = (e: React.MouseEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  return (

    <main className="relative bg-black">
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
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
      className={`relative w-full h-screen bg-[#0a0a0a] ${isMobile ? 'overflow-x-auto overflow-y-hidden block' : 'overflow-hidden'}`}
    >
      {/* MASTER PARALLAX WRAPPER */}
      <motion.div
      style={isMobile ? { x: 0, y: 0, scale: 1 } 
      : { x: bgMoveX, y: bgMoveY, scale: 1.4 }}
      className={`${isMobile ? 'absolute top-0 left-0 min-w-[250vw] h-full' : 'absolute inset-0 w-full h-full pointer-events-none'}`}
    >
        {/* THE BACKGROUND IMAGE */}
<picture>
  {/* Primary: Ultra-light AVIF */}
  <source srcSet={contactBgAvif.src} type="image/avif" />

  {/* Fallback: Webp */}
  <img
    src={contactBgWebp.src}
    alt="Contact Billboard"
    className={`${
      isMobile 
        ? 'w-full h-full object-cover' 
        : 'absolute inset-0 w-full h-full object-contain opacity-100'
    }`}
    fetchPriority="high"
  />
</picture>

{/* THE PINNED CONTACT FORM */}
<div className={`absolute z-10 ${isMobile ? 'contact-form-mobile-pinned'
   : 'w-[26%] h-[39%] top-[28%] left-[52%]'} pointer-events-auto flex flex-col justify-center`}>

 {/* UPDATE THIS LINE BELOW */}
  <form 
    ref={form} 
    onSubmit={sendEmail} 
    className="grid grid-cols-2 gap-x-4 gap-y-3"
  >
    
    {/* EMAIL */}
    <div className="col-span-2">
      <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">Email</label>
      <input name="user_email" type="email" required className="form-field-block !text-white" />
    </div>

    {/* NAMES */}
    <div>
      <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">First Name</label>
      <input name="first_name" type="text" required className="form-field-block !text-white " />
    </div>
    <div>
      <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">Last Name</label>
      <input name="last_name" type="text" className="form-field-block !text-white" />
    </div>

    {/* COMPANY */}
    <div className="col-span-2">
      <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">Company Name</label>
      <input name="company_name" type="text" className="form-field-block !text-white" />
    </div>

    {/* TIERS */}
    <div className="col-span-2 border border-white/60 bg-white/[0.02] p-3">
      <span className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-2 block">AUTHORITY Selection:</span>
      <div className="flex gap-4 text-[9px] font-brand-secondary-thin tracking-wide uppercase text-white">
        <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-all group">
          <input name="tier" value="Foundation" type="checkbox" className="custom-form-checkbox group-hover:shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-shadow" />
          The Foundation // T 1
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-all group">
          <input name="tier" value="Digital Authority" type="checkbox" className="custom-form-checkbox group-hover:shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-shadow" />
          Digital Authority // T 2
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-all group">
          <input name="tier" value="Scale Partner" type="checkbox" className="custom-form-checkbox group-hover:shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-shadow" />
          The Scale Partner // T 3
        </label>
      </div>
    </div>

    {/* MESSAGE */}
    <div className="col-span-2">
      <label className="text-white font-brand-secondary-thin text-[10px] tracking-widest uppercase mb-1 block">Message</label>
      <textarea name="message" rows={3} className="form-field-block !text-white resize-none" />
    </div>

{/* SUBMIT */}
<div className="col-span-2 flex justify-end mt-1">
  <button 
  type="submit" 
  disabled={status !== 'idle'}
  className={`
    font-brand-secondary-heavy italic text-[12px] uppercase tracking-[0.4em] 
    border px-10 py-3 transition-all duration-300 flex items-center justify-center gap-3
    ${status === 'idle' 
      ? 'text-white border-white/60 hover:border-white hover:bg-black/40 cursor-pointer active:scale-95' 
      : 'text-white/40 border-white/20 cursor-default'}
  `}
>
  {status === 'idle' && "Initiate"}
  
  {status === 'initiating...' && (
    <motion.span
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      Initiating...
    </motion.span>
  )}

  {status === 'initiated' && (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-white"
    >
      <span>Initiated</span>
      <motion.svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <polyline points="20 6 9 17 4 12" />
      </motion.svg>
    </motion.div>
  )}
          </button>
      </div>
  </form>
</div>


{/* --- INSTAGRAM HITBOX --- */}
        <a
          href="https://www.instagram.com/judaion.studios/" 
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute z-20 ${isMobile ? 'insta-hitbox-mobile' : 'absolute z-20 w-[3%] h-[5%] top-[65%] left-[42%] cursor-pointer pointer-events-auto'}`}
        />

        {/* --- Linked in HITBOX --- */}
        <a
          href="https://www.linkedin.com/company/judaion-studios/" 
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute z-20 ${isMobile ? 'linkedin-hitbox-mobile' : 'absolute z-20 w-[3%] h-[5%] top-[65%] left-[38%] cursor-pointer pointer-events-auto'}`}
        />

        {/* --- EMAIL HITBOX --- */}
        <a
          href="mailto:extraction@judaion.com" 
          className={`absolute z-20 ${isMobile ? 'email-hitbox-mobile' : 'absolute z-20 w-[6%] h-[3%] top-[66%] left-[21%] cursor-pointer pointer-events-auto'}`}
        />
      </motion.div>

      {/* --- PRESERVED FLOOR NAVIGATION (OUTSIDE PARALLAX) --- */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className={`absolute z-50 pointer-events-auto ${isMobile ? 'contact-floor-nav-mobile' : 'bottom-12 left-12'}`}
        >
      
        <button onClick={() => router.push('/aboutus')} className="flex flex-col items-start group no-underline appearance-none bg-transparent border-none cursor-pointer">
          <motion.img 
            src="/re-enter.png" 
            className="w-22 h-auto mb-3 opacity-70 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-700 filter brightness-125 object-contain"
            animate={{ x: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex flex-col items-start font-brand-secondary-thin text-left">
            <span className="text-[10px] tracking-[0.5em] uppercase text-white/40  font-brand-secondary-thin">Re-Enter Studio</span>
            <span className="text-[13px] tracking-[0.6em] uppercase text-white/80 group-hover:text-white transition-colors duration-500 font-brand-secondary-thin">05 About Us</span>
          </div>
        </button>
      </motion.div>
    </div>
    </main>
  );
}