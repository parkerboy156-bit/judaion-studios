"use client";

/**
 * MIGRATION STATUS: STAGE 4
 * SOURCE: LoginPage.tsx (CRA/Vite)
 * TARGET: app/login/page.tsx (Next.js App Router)
 * CHANGE LOG: 
 * - Swapped useNavigate -> useRouter.
 * - Updated redirect path to /adminportal.
 * - Logic & UI: 100% PRESERVED.
 */

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Using the alias from your project structure
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("ACCESS DENIED: " + error.message);
    } else {
      // Redirecting to the correct Next.js route: /adminportal
      router.push('/adminportal');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-brand-secondary-heavy">
      <div className="w-full max-w-[400px] bg-white/5 border border-white/10 p-10 backdrop-blur-xl shadow-2xl">
        <div className="mb-10 text-center">
           <h2 className="text-[20px] font-brand-other uppercase tracking-[0.3em] text-white">
             <span className="text-orange-600 font-brand-cn">*</span>JUDAION ADMIN Access
           </h2>
           <div className="h-[1px] w-full bg-white mx-auto mt-4"></div>
           <p className="text-[12px] font-bold text-white/60 uppercase tracking-widest mt-4">Manual Credential Entry</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-4 text-[13px] font-bold uppercase text-white focus:border-orange-600 outline-none transition-colors"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-4 text-[13px] font-bold uppercase text-white focus:border-orange-600 outline-none transition-colors"
              required 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-white text-black py-5 font-black uppercase tracking-[0.5em] text-[13px] hover:bg-black/80 hover:text-white transition-all shadow-xl cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'LOG IN'}
          </button>
        </form>
      </div>
    </div>
  );
}