"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Using the alias from your project structure
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/adminportal");
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.9), rgba(8,8,8,0.5)), url('/global-bg.avif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="font-brand-secondary-thin text-[11px] tracking-[0.25em] text-white/40 uppercase mb-20 animate-[fadeUp_0.8s_ease_forwards_0.2s] opacity-0">
        JUDAION Studios | Admin Portal
      </div>

      <div
        className="font-brand-other text-center leading-[0.9] tracking-[0.02em] text-white mb-2 animate-[fadeUp_0.8s_ease_forwards_0.4s] opacity-0"
        style={{ fontSize: "clamp(72px, 12vw, 140px)" }}
      >
        ADMIN
        <span
          className="block text-white/50 tracking-[0.08em]"
          style={{ fontSize: "clamp(72px, 12vw, 140px)" }}
        >
          ACCESS
        </span>
      </div>
      <div className="font-brand-secondary-thin text-[13px] tracking-[0.2em] text-white/50 uppercase text-center mb-20 animate-[fadeUp_0.8s_ease_forwards_0.6s] opacity-0">
        Enter credentials to access the admin dashboard
      </div>

      <div className="w-full max-w-[420px] flex flex-col gap-3 animate-[fadeUp_0.8s_ease_forwards_0.8s] opacity-0">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-black/40 border border-white/10 px-4 py-3 text-[13px] font-brand-cn italic tracking-[0.03em] text-white placeholder:text-white/30 focus:border-orange-600 outline-none transition-colors"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full bg-black/40 border border-white/10 px-4 py-3 text-[13px] font-brand-cn italic tracking-[0.03em] text-white placeholder:text-white/30 focus:border-orange-600 outline-none transition-colors"
        />
        {error && (
          <div className="font-brand-secondary-thin text-[11px] tracking-[0.15em] text-red-500 uppercase py-3">
            {error}
          </div>
        )}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-2 border border-white/20 bg-transparent text-white font-brand-secondary-thin text-[11px] uppercase tracking-[0.2em] px-6 py-4 hover:border-white hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Please wait..." : "Log In →"}
        </button>
      </div>
    </div>
  );
}
