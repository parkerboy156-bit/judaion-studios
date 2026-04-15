"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  
  // Porting your session logic from App.tsx
useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle Sign Out or session expiry
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        // Only redirect if we are currently in the admin portal
        if (window.location.pathname.startsWith('/adminportal')) {
          router.push('/login');
        }
      }
      
      // Handle successful Sign In
      if (event === 'SIGNED_IN' && session) {
        if (window.location.pathname === '/login') {
          router.push('/adminportal');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return <>{children}</>;
}
