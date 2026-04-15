"use client";

import React, { useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import IntroLoader from "./IntroLoader";
import { useEffect } from 'react';

const LoadingContext = createContext({ isLoaded: false });
export const useLoading = () => useContext(LoadingContext);

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // GLOBAL DETECTION PROTOCOL
    const isGoogleApp = /GSA\/\d/.test(navigator.userAgent);
    
    if (isGoogleApp) {
      document.body.classList.add('is-google-app');
    }
  }, [])

  return (
    <LoadingContext.Provider value={{ isLoaded }}>
      {/* The IntroLoader remains as it handles the very first entry */}
      <IntroLoader onComplete={() => setIsLoaded(true)} />
      
      <div 
        style={{ 
          opacity: isLoaded ? 1 : 0, 
          visibility: isLoaded ? 'visible' : 'hidden',
          backgroundColor: 'black',
          minHeight: '100vh'
        }}
      >
        {/* All Framer Motion wrappers removed for raw testing */}
        {children}
      </div>
    </LoadingContext.Provider>
  );
}