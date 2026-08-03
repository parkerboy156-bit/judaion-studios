"use client";

/* -------------------------------------------------------------------
   NarrativeVideoPlate — the section-02 base plate, shared by the desktop
   stage (TheNarrativeClient) and the mobile stage (NarrativeMobile).

   Two stacked layers, no JS:
     1. <img>   — the poster still, always painted underneath.
     2. <video> — the same first frame, painted on top once it plays.

   A video element that never decodes a frame (load error, blocked autoplay
   under iOS Low Power Mode / data saver) paints nothing, so the img simply
   shows through — the fallback needs no error handler and no state. `poster`
   is set as well so the still paints during buffering even before the img
   decodes, and because the poster IS frame 0 the handover is invisible.

   Callers position/fade the whole plate via className + style so both
   layers always move together.
   ------------------------------------------------------------------- */

/* ── DO NOT REMOVE THE MASK — it is load-bearing, not decorative. ──
   Without it, Chromium promotes this video to a hardware OVERLAY: its own
   swap chain, scanned out directly. Promoting/demoting that overlay as the
   video scrolls in and out of view reconfigures the swap chain, and on some
   Windows GPU configurations that repaints the ENTIRE browser window — tab
   strip included. It reads as a full-app white flash on entering section 3
   and again on scrolling back up.

   A mask forces an ordinary render surface, so the element is no longer
   overlay-eligible and there is no swap chain to reconfigure. The gradient is
   solid black end to end: nothing is actually masked out, and the two stops
   stop it being reduced away as a no-op. Verified fix; `opacity: 0.999` was
   tried first and was NOT enough — modern Chromium promotes through it.

   The hero grain video in TheNarrativeClient has always carried a maskImage,
   which is why it never triggered this and why it was ruled out during the
   bisect. Cost here is a per-frame copy instead of a zero-copy scanout —
   negligible for a 6s 1080p loop, and what the hero video already does. */
const NO_OVERLAY_MASK: React.CSSProperties = {
  maskImage: "linear-gradient(to bottom, black 0%, black 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 100%)",
};

const SRC = "/section-2-bg.mp4";
const POSTER = "/section-2-bg-poster.avif";

const LAYER = "absolute inset-0 w-full h-full object-cover object-center";

export default function NarrativeVideoPlate({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={style}
    >
      <img src={POSTER} alt="" aria-hidden="true" decoding="async" className={LAYER} />
      <video
        src={SRC}
        poster={POSTER}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className={LAYER}
        style={NO_OVERLAY_MASK}
      />
    </div>
  );
}
