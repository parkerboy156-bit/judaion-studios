"use client";

import { motion, AnimatePresence } from "framer-motion";

/**
 * Full-screen "inspection" loader — same treatment as the Archive Catalogue.
 * Grain-video bg + J-logo + loader-text. Driven by a `show` prop; fades out
 * (AnimatePresence) when the parent's assets are ready, revealing a fully
 * loaded page. `onExited` fires once the fade-out fully completes — the parent
 * uses it to start its "assemble" animation only AFTER the loader is gone.
 *
 * `label` (optional): show a custom title with the animated dots (e.g. the tier
 * being loaded) instead of the default "loading…". Uses the shared `loader-title`
 * CSS (content: attr(data-title) + dots).
 */
export default function InspectionLoader({
  show,
  onExited,
  label,
}: {
  show: boolean;
  onExited?: () => void;
  label?: string;
}) {
  return (
    <AnimatePresence onExitComplete={onExited}>
      {show && (
        <motion.div
          key="inspection-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-black"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          >
            <source
              src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
              type="video/mp4"
            />
          </video>
          <img
            src="/j-logo.svg"
            alt="Loading"
            className="loader-j opacity-80 relative z-10"
          />
          {label ? (
            <span
              data-title={label}
              className="loader-title font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80 relative z-10 text-center px-6"
            />
          ) : (
            <span className="loader-text font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/80 relative z-10" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
