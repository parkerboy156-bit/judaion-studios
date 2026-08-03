"use client";

import { useEffect, useState } from "react";

/* True below `breakpoint` (default 1024, the site's lg: mobile line).
   SSR-safe: renders false on the server + first client paint (matching the
   server HTML so there's no hydration mismatch), then corrects on mount. */
export function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
