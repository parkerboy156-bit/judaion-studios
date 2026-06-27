"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * PdfReader — branded, in-experience PDF reader (no native viewer, no download).
 * Renders each page to a canvas via pdfjs-dist as a white "paper" sheet on the
 * dark grain background, so reading a dossier feels like flipping through a
 * physical document. pdfjs is dynamically imported here → ZERO bundle cost
 * unless a reader actually opens. Works identically on desktop + mobile (canvas,
 * not an iframe). Controls: page nav + zoom (re-renders for crispness; baseline
 * is fit-to-width, so there's no jarring "actual size" mode).
 */
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.2;
const pad = (n: number) => String(n).padStart(2, "0");

export default function PdfReader({
  url,
  onClose,
  isMobile,
}: {
  url: string;
  title?: string;
  onClose: () => void;
  isMobile: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const renderToken = useRef(0);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // ESC closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Load the document once (pdfjs imported lazily). Kept in a ref so zoom
  // re-renders never re-fetch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import("pdfjs-dist");
        const pdfjs = mod?.getDocument ? mod : (mod?.default ?? mod);
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) {
          doc.destroy?.();
          return;
        }
        docRef.current = doc;
        setNumPages(doc.numPages);
        setReady(true);
      } catch (e) {
        console.error("PdfReader failed:", e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        docRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      docRef.current = null;
    };
  }, [url]);

  // Render (and re-render on zoom). Pages are drawn at the target scale so they
  // stay crisp instead of being CSS-stretched. Scroll position is preserved.
  const renderAll = useCallback(
    async (zoomVal: number) => {
      const doc = docRef.current;
      const host = pagesRef.current;
      const sc = scrollRef.current;
      if (!doc || !host || !sc) return;

      const token = ++renderToken.current;
      const prevRatio = sc.scrollHeight ? sc.scrollTop / sc.scrollHeight : 0;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wide = sc.clientWidth || window.innerWidth;
      const fit = Math.max(
        280,
        Math.min(wide - (isMobile ? 24 : 80), isMobile ? 99999 : 820),
      );
      const targetW = fit * zoomVal;

      host.innerHTML = "";
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        if (token !== renderToken.current) return; // superseded by a newer render
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: targetW / base.width });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        Object.assign(canvas.style, {
          width: `${viewport.width}px`,
          height: `${viewport.height}px`,
          display: "block",
        });

        const sheet = document.createElement("div");
        Object.assign(sheet.style, {
          width: `${viewport.width}px`,
          margin: "0 auto 26px",
          background: "#fff",
          boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
        });
        sheet.appendChild(canvas);
        host.appendChild(sheet);

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
        if (n === 1) setLoading(false);
      }
      // Keep the reader roughly where it was after a zoom re-render.
      sc.scrollTop = prevRatio * sc.scrollHeight;
    },
    [isMobile],
  );

  useEffect(() => {
    if (ready) renderAll(zoom);
  }, [ready, zoom, renderAll]);

  // Track the current page from scroll position.
  const onScroll = () => {
    const sc = scrollRef.current;
    const host = pagesRef.current;
    if (!sc || !host) return;
    const mid = sc.scrollTop + sc.clientHeight / 2;
    let cur = 1;
    for (let i = 0; i < host.children.length; i++) {
      if ((host.children[i] as HTMLElement).offsetTop <= mid) cur = i + 1;
    }
    setCurrent(cur);
  };

  const goToPage = (n: number) => {
    const sc = scrollRef.current;
    const host = pagesRef.current;
    if (!sc || !host) return;
    const target = Math.max(1, Math.min(n, host.children.length));
    const sheet = host.children[target - 1] as HTMLElement | undefined;
    if (sheet) sc.scrollTo({ top: sheet.offsetTop - (isMobile ? 84 : 96), behavior: "smooth" });
  };

  const zoomBy = (d: number) =>
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + d) * 100) / 100)));

  const iconBtn =
    "flex items-center justify-center w-8 h-8 text-white/70 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[300] bg-black"
    >
      {/* Grain background — consistent with the rest of the archive */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      >
        <source
          src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
          type="video/mp4"
        />
      </video>

      {/* Exit — mirrors the focus-view Exit */}
      <button
        onClick={onClose}
        className="fixed top-15 left-15 z-[310] flex items-center gap-2 font-brand-bold text-[18px] uppercase tracking-[0.2em] text-white transition-colors duration-200 cursor-pointer"
      >
        Exit
        <span className="hidden lg:inline font-brand-secondary-thin text-[10px] tracking-[0.2em] text-white/50">
          [ESC]
        </span>
      </button>

      {/* Loader while pdfjs loads + first page renders */}
      {loading && !error && (
        <div className="absolute inset-0 z-[305] flex flex-col items-center justify-center gap-6 pointer-events-none">
          <img src="/j-logo.svg" alt="Loading" className="loader-j opacity-80" />
          <span
            data-title="Opening dossier"
            className="loader-title font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80 text-center px-6"
          />
        </div>
      )}

      {/* Error surface */}
      {error && (
        <div className="absolute inset-0 z-[306] flex flex-col items-center justify-center gap-4 px-10 pointer-events-none">
          <span className="font-brand-cn text-[11px] uppercase tracking-[0.3em] text-white/70">
            Could not open document
          </span>
          <span className="font-brand-secondary-thin text-[11px] text-white/45 text-center max-w-[520px] break-words">
            {error}
          </span>
        </div>
      )}

      {/* Scrollable column of page sheets */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative z-[301] h-full overflow-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div style={{ padding: isMobile ? "88px 12px 110px" : "104px 0 120px" }}>
          <div ref={pagesRef} />
        </div>
      </div>

      {/* Control bar — page nav + zoom (no "actual size" mode; fit-to-width base) */}
      {!error && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[310] flex items-center gap-4 bg-black/75 border border-white/15 backdrop-blur-sm px-4 py-2">
          {/* Page nav */}
          <button
            onClick={() => goToPage(current - 1)}
            disabled={current <= 1}
            aria-label="Previous page"
            className={iconBtn}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <span className="font-brand-cn text-[11px] tracking-[0.2em] text-white/80 tabular-nums min-w-[58px] text-center">
            {pad(current)} / {pad(numPages || 1)}
          </span>
          <button
            onClick={() => goToPage(current + 1)}
            disabled={current >= numPages}
            aria-label="Next page"
            className={iconBtn}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className="w-px h-4 bg-white/20" />

          {/* Zoom */}
          <button
            onClick={() => zoomBy(-ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Zoom out"
            className={iconBtn}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4M8 11h6" />
            </svg>
          </button>
          <span className="font-brand-cn text-[11px] tracking-[0.2em] text-white/80 tabular-nums w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoom in"
            className={iconBtn}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4M8 11h6M11 8v6" />
            </svg>
          </button>
        </div>
      )}
    </motion.div>
  );
}
