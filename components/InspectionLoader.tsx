"use client";

import { motion, AnimatePresence } from "framer-motion";
import LoaderScreen from "./LoaderScreen";

/**
 * Full-screen "inspection" loader — same treatment as the Archive Catalogue.
 * Loading-screen video bg + corner J-logo (see `LoaderScreen`). Driven by a
 * `show` prop; fades out (AnimatePresence) when the parent's assets are ready,
 * revealing a fully loaded page. `onExited` fires once the fade-out fully
 * completes — the parent uses it to start its "assemble" animation only AFTER
 * the loader is gone.
 *
 * `label` (optional): show a custom title with the animated dots (e.g. the tier
 * being loaded) instead of the default "loading…" — passed through to
 * `LoaderScreen`'s `loader-title` variant.
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        >
          <LoaderScreen
            textClassName={label ? "loader-title" : "loader-text"}
            label={label}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
