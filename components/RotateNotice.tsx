// Phone-landscape "rotate to portrait" prompt.
// Pure CSS — visibility is driven by a media query in globals.css
// (`(orientation: landscape) and (max-height: 500px)`), so it only ever shows
// on phones held sideways, never on tablets or desktop. No JS / no rotation
// API (which iOS doesn't support anyway).
export default function RotateNotice() {
  return (
    <div className="rotate-notice fixed inset-0 z-[10000] bg-[#0a0a0a] gap-7 text-center px-12 select-none">
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
      {/* Phone icon that rocks from landscape → portrait to hint the action */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rotate-phone text-white/70"
        aria-hidden="true"
      >
        <rect x="7" y="2" width="12" height="20" rx="2.5" />
        <line x1="11" y1="18.5" x2="15.5" y2="18.5" />
      </svg>

      <div className="flex flex-col gap-2">
        <p className="font-brand-secondary-thin text-[11px] tracking-[0.4em] uppercase text-white/85">
          Please rotate your device
        </p>
        <p className="font-brand-cn text-[9px] tracking-[0.25em] uppercase text-white/40">
          Best experienced in portrait
        </p>
      </div>
    </div>
  );
}
