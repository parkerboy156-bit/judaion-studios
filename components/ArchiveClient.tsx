"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { preload } from "react-dom";
import { supabase } from "@/lib/supabase";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useDragControls,
} from "framer-motion";
import { useRouter } from "next/navigation";
import PdfReader from "./PdfReader";
import LoaderScreen from "./LoaderScreen";
import { hasInAppHistory } from "./ClientShell";

const VIDEO_EXTS = ["mp4", "webm", "ogg"];
const isVideoUrl = (url: string) =>
  VIDEO_EXTS.includes(url?.split(".").pop()?.toLowerCase() || "");
const isPdfUrl = (url: string) =>
  url?.split(".").pop()?.toLowerCase() === "pdf";
// First image asset of a project (prefers the WebP thumb, falls back to the legacy file_url list); null if none.
// A PDF counts as an image cover when it has a rendered first-page thumb.
// Displayable image for one asset — a video or PDF only qualifies once it has
// a generated thumb, since neither paints as an image on its own.
const assetImage = (a: any): string | null => {
  if (!a?.url) return null;
  if (isPdfUrl(a.url) || isVideoUrl(a.url)) return a.thumb || null;
  return a.thumb || a.url;
};

const firstImage = (item: any): string | null => {
  if (Array.isArray(item?.folders)) {
    // An explicitly chosen cover wins over document order, wherever it sits in
    // the folder structure. Unlike the automatic scan below it may be a video
    // or PDF, because the admin only offers assets that have a usable image.
    for (const f of item.folders)
      for (const a of f?.assets ?? [])
        if (a?.cover) {
          const img = assetImage(a);
          if (img) return img;
        }
    for (const f of item.folders) {
      for (const a of f?.assets ?? []) {
        if (!a?.url) continue;
        if (isPdfUrl(a.url)) {
          if (a.thumb) return a.thumb;
          continue;
        }
        if (!isVideoUrl(a.url)) return a.thumb || a.url;
      }
    }
  }
  const urls = Array.isArray(item?.file_url) ? item.file_url : [item?.file_url];
  return urls.find((u: string) => u && !isVideoUrl(u) && !isPdfUrl(u)) || null;
};

// ── Folder model (mirrors the admin `folders` JSON) ──
interface FolderAsset {
  id: string;
  title: string;
  url: string; // full-quality master — served ONLY in the zoom viewport
  thumb?: string; // auto-generated ≤1600px WebP — all browsing surfaces
  // Upload metadata (written by the admin on upload; absent on legacy assets).
  size?: number; // bytes (of the master)
  mime?: string;
  added?: string; // ISO date
  width?: number; // master pixel dimensions (measured at upload)
  height?: number;
  zoomable?: boolean; // false = view-only in the focus view; absent = zoomable
  group?: string; // shared label — assets with the same one stack into one tile
  cover?: boolean; // this asset is the project's catalogue thumbnail

}

// ── Asset stacks ──
// Images sharing a `group` collapse into ONE tile you flick through (a logo's
// colourways, say). The first is the cover: it owns the tile's position, its
// portrait/landscape span and its grid number, so flicking never relayouts the
// grid. Every variant stays a real asset in `folder.assets`, so preloading,
// zoom and the flat `file_url` union all keep working untouched.
// Videos and PDFs ignore `group` — they have their own player/reader tiles.
interface AssetTile {
  key: string;
  cover: FolderAsset;
  variants: FolderAsset[]; // always includes the cover, at index 0
}

// Loose-pile slots by depth (0 = top, face-up). Alternating x + rotation reads
// as a dropped stack rather than a staircase. Scaled down from the old
// full-screen PosterStack — these cards sit inside a grid cell.
const STACK_SLOTS = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 14, y: 12, rotate: 2.4, scale: 0.965 },
  { x: -13, y: 22, rotate: -2, scale: 0.935 },
  { x: 11, y: 31, rotate: 1.6, scale: 0.91 },
  { x: -9, y: 39, rotate: -1.4, scale: 0.885 },
];
const slotFor = (depth: number) =>
  STACK_SLOTS[Math.min(depth, STACK_SLOTS.length - 1)];

const groupAssets = (assets: FolderAsset[]): AssetTile[] => {
  const tiles: AssetTile[] = [];
  const byGroup = new Map<string, AssetTile>();
  for (const a of assets) {
    const stackable = a.url && !isVideoUrl(a.url) && !isPdfUrl(a.url);
    const g = stackable ? a.group?.trim() : "";
    if (!g) {
      tiles.push({ key: a.id, cover: a, variants: [a] });
      continue;
    }
    const hit = byGroup.get(g);
    if (hit) {
      hit.variants.push(a);
    } else {
      const tile = { key: `group:${g}`, cover: a, variants: [a] };
      byGroup.set(g, tile);
      tiles.push(tile);
    }
  }
  return tiles;
};

// Browsing-surface URL: the thumb when it exists, else the master. Zoom always uses `url`.
const displayUrl = (a: FolderAsset) => a.thumb || a.url;

/* Folder-window description backdrop. The desktop art is a wide landscape
   plate; in the mobile sheet it's `cover`d into a narrow column, which crops
   hard into the middle and magnifies it — soft and over-zoomed. The mobile
   file is the portrait-framed cut of the same artwork. */
const DESC_BG = "/folder-description-bg.avif";
const DESC_BG_MOBILE = "/folder-description-bg-mobile.avif";

// Filename extension (e.g. "jpg"), stripped of any query/hash.
const fileExt = (u: string) =>
  (u.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();

// ── Asset metadata formatter (Upload date) ──
const formatDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
interface Folder {
  id: string;
  title: string;
  description?: string; // per-folder copy; falls back to project.content
  // Admin opt-out: drop the description panel entirely for this folder. Needed
  // as an explicit flag because a BLANK description falls back to the project
  // copy — "none" and "empty" are different intents.
  hideDescription?: boolean;
  assets: FolderAsset[];
}

// Folder anchor positions (% of stage) — a scattered ring around the central
// safe-zone; each folder CENTRES on its anchor. Cycles for >8 folders.
// The lower anchors sit higher than their mirrored top ones on purpose: an icon
// hangs its caption BELOW the poster, so a low anchor pushes the label toward
// the status bar and reads as falling off the stage, while a high one has the
// poster's own height as headroom.
const ANCHORS = [
  { x: 24, y: 42 },
  { x: 76, y: 54 },
  { x: 30, y: 72 },
  { x: 70, y: 24 },
  { x: 15, y: 64 },
  { x: 85, y: 36 },
  { x: 50, y: 74 },
  { x: 50, y: 16 },
];

// The list above is authored for VISUAL scatter, not in ring order, so taking
// the first N put neighbours like {24,42} and {30,76} on screen together — two
// folders in the same column, close enough to collide once their labels wrap.
// Sorting by angle around the centre gives a true ring; picking evenly spaced
// entries from it then spreads N folders as far apart as the ring allows.
const ANCHOR_RING = [...ANCHORS].sort(
  (a, b) =>
    Math.atan2(a.y - 50, a.x - 50) - Math.atan2(b.y - 50, b.x - 50),
);
const anchorFor = (index: number, total: number) => {
  if (total > ANCHOR_RING.length) return ANCHOR_RING[index % ANCHOR_RING.length];
  return ANCHOR_RING[
    Math.round((index * ANCHOR_RING.length) / total) % ANCHOR_RING.length
  ];
};

// First ≤3 image assets of a folder — the "peek" fan shown on hover/selection.
const peekImages = (folder: Folder) =>
  groupAssets(folder.assets)
    .map((t) => t.cover)
    .filter((a) => a.url && !isVideoUrl(a.url) && !isPdfUrl(a.url))
    .slice(0, 3);

// Assets as the viewer counts them — a stack reads as one item, not four.
const tileCount = (assets: FolderAsset[]) => groupAssets(assets).length;

// Preload one asset URL (image / video first-frame); PDFs resolve instantly (loaded lazily in the reader).
const loadAssetUrl = (url: string) =>
  new Promise<void>((resolve) => {
    if (isPdfUrl(url)) {
      resolve();
    } else if (isVideoUrl(url)) {
      const v = document.createElement("video");
      v.muted = true;
      v.preload = "auto";
      v.onloadeddata = () => resolve();
      v.onerror = () => resolve();
      v.src = url;
    } else {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = url;
    }
  });

// ── FolderIcon — one desktop folder: draggable (desktop) / tappable (mobile). Desktop = click-to-select then click-to-open; mobile = single-tap-to-open. ──
function FolderIcon({
  folder,
  index,
  total,
  isMobile,
  stageRef,
  selected,
  dimmed,
  setNode,
  onSelect,
  onOpen,
  onPrefetch,
}: {
  total: number; // folders on the stage — anchors spread to fill the ring
  folder: Folder;
  index: number;
  isMobile: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  selected: boolean;
  dimmed: boolean; // this folder's window is open — icon reads as "in use"
  setNode: (id: string, el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onOpen: (rect: DOMRect | null) => void;
  onPrefetch: () => void;
}) {
  // Anchor (% of stage) the folder centres on; x/y are the drag delta from it (reset every visit).
  const anchor = anchorFor(index, total);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Drag-vs-click guard: a real drag sets moved=true so the click that follows is ignored.
  const moved = useRef(false);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  // Hover shows the highlight plate (no border); selecting adds the border on top.
  const [hovered, setHovered] = useState(false);

  // Rect measured at open time (post-drag position) — the window grows from it.
  const open = () => onOpen(nodeRef.current?.getBoundingClientRect() ?? null);

  const inner = (
    <div
      className={`relative overflow-hidden flex flex-col items-center gap-2.5 select-none px-4 pt-3 pb-2.5 border transition-colors duration-500 ${
        selected
          ? "border-white/50 bg-white/[0.10]"
          : hovered
            ? "border-transparent bg-white/[0.10]"
            : "border-transparent"
      }`}
    >
      {/* Scan lines — same treatment as the archive grid/methodology carousel; shown while this folder is selected. */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
            backgroundSize: "100% 3px",
          }}
        />
      </div>
      <img
        src="/folder-icon.webp"
        alt=""
        draggable={false}
        className={`w-[clamp(90px,12vw,160px)] h-auto drop-shadow-[0_14px_26px_rgba(0,0,0,0.55)] pointer-events-none transition-opacity duration-300 ${
          dimmed ? "opacity-35" : ""
        }`}
      />
      <span className="font-brand-cn uppercase text-white text-[clamp(10px,0.8vw,15px)] tracking-[0.12em] text-center leading-tight max-w-[150px]">
        {folder.title}
      </span>
    </div>
  );

  if (isMobile)
    return (
      <button
        onClick={() => onOpen(null)}
        className="cursor-pointer active:scale-95 transition-transform p-2"
      >
        {inner}
      </button>
    );

  return (
    // Positioning wrapper — places the folder's centre on its anchor; the inner motion.div handles drag.
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
    >
      <motion.div
        ref={(el: HTMLDivElement | null) => {
          nodeRef.current = el;
          setNode(folder.id, el);
        }}
        drag
        dragConstraints={stageRef}
        dragMomentum={false}
        dragElastic={0.12}
        style={{ x, y, touchAction: "none" }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
        onPointerDown={() => {
          moved.current = false;
        }}
        onDragStart={() => {
          moved.current = true;
        }}
        onMouseEnter={() => {
          setHovered(true);
          onPrefetch(); // hover = intent — silently warm the folder
        }}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (moved.current) return;
          if (selected) open();
          else onSelect();
        }}
        onDoubleClick={() => {
          if (!moved.current) open();
        }}
        role="button"
        aria-label={`${folder.title}, ${tileCount(folder.assets)} item${tileCount(folder.assets) === 1 ? "" : "s"}`}
        className="will-change-transform cursor-pointer"
      >
        {inner}
      </motion.div>
    </div>
  );
}

// ── FolderDesktop — focus-view surface: scattered folders (desktop) / tappable grid (mobile); arrows move selection, Enter opens, bare-desktop click deselects. ──
function FolderDesktop({
  folders,
  isMobile,
  active,
  selectedId,
  openId,
  onSelect,
  onOpen,
  onPrefetch,
}: {
  folders: Folder[];
  isMobile: boolean;
  active: boolean; // keyboard nav enabled (no folder open, not loading)
  selectedId: string | null;
  openId: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (f: Folder, rect: DOMRect | null) => void;
  onPrefetch: (f: Folder) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  // Live icon nodes (post-drag positions) so Enter grows the window from the folder's real location.
  const nodes = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!active || isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"];
      if (!keys.includes(e.key) || folders.length === 0) return;
      e.preventDefault();
      const idx = folders.findIndex((f) => f.id === selectedId);
      if (e.key === "Enter") {
        const f = folders[idx];
        if (f) onOpen(f, nodes.current[f.id]?.getBoundingClientRect() ?? null);
        return;
      }
      const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
      const next =
        idx < 0
          ? dir === 1
            ? 0
            : folders.length - 1
          : (idx + dir + folders.length) % folders.length;
      onSelect(folders[next].id);
      onPrefetch(folders[next]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, isMobile, folders, selectedId, onSelect, onOpen, onPrefetch]);

  // Clicking bare desktop (either wrapper) clears the selection, OS-style.
  const deselect = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onSelect(null);
  };

  const icons = folders.map((f, i) => (
    <FolderIcon
      key={f.id}
      folder={f}
      index={i}
      total={folders.length}
      isMobile={isMobile}
      stageRef={stageRef}
      selected={f.id === selectedId}
      dimmed={f.id === openId}
      setNode={(id, el) => {
        nodes.current[id] = el;
      }}
      onSelect={() => onSelect(f.id)}
      onOpen={(rect) => onOpen(f, rect)}
      onPrefetch={() => onPrefetch(f)}
    />
  ));

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full overflow-hidden"
      onClick={deselect}
    >
      {isMobile ? (
        // Mobile keeps a centred tappable grid (no drag / anchors).
        <div
          onClick={deselect}
          className="w-full h-full flex items-center justify-center"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 place-items-center">
            {icons}
          </div>
        </div>
      ) : (
        // Desktop: each folder absolutely positions itself on its anchor.
        icons
      )}
    </div>
  );
}

// ── OpenFolderView — OS-style window that grows from the clicked icon: breadcrumb title bar, description (left), assets (right, double-click to zoom). Intercepts ESC only while an image is enlarged. ──
function OpenFolderView({
  folder,
  project,
  isMobile,
  origin,
  ready,
  onClose,
  onVideoPlay,
  onVideoRestore,
}: {
  folder: Folder;
  project: any;
  isMobile: boolean;
  origin: DOMRect | null; // clicked icon rect — the window grows from it
  ready: boolean; // folder assets preloaded (in-window loader until true)
  onClose: () => void;
  onVideoPlay: () => void;
  onVideoRestore: () => void;
}) {
  const [enlargedId, setEnlargedId] = useState<string | null>(null);
  const enlarged = folder.assets.find((a) => a.id === enlargedId) || null;
  // Mobile only: the description lives in a slide-up sheet so the asset stays
  // the priority. Toggled from the title-bar description icon; drag-to-dismiss
  // via a grip handle (the content still scrolls normally).
  // No-description folder: no left pane, no mobile sheet, no launcher — just
  // the assets, with a minimal Upload/Type label in place of the full meta row.
  const noDesc = folder.hideDescription === true;
  const [descOpen, setDescOpen] = useState(false);
  const sheetDrag = useDragControls();

  /* Hold-to-read on the mobile meta marquee. Driven by touch handlers rather
     than CSS :active — iOS only fires :active reliably when the element already
     has a touch listener, which is exactly the thing we'd be relying on. */
  const [metaPaused, setMetaPaused] = useState(false);

  // Desktop left-pane scroll cue — a down-chevron shown while the description
  // overflows and isn't yet scrolled to the bottom (hidden otherwise). Signals
  // that more copy continues beneath the pinned gradient footer.
  const descScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollCue, setShowScrollCue] = useState(false);
  const updateScrollCue = () => {
    const el = descScrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight + 8;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setShowScrollCue(scrollable && !atBottom);
  };
  useEffect(() => {
    const raf = requestAnimationFrame(updateScrollCue);
    window.addEventListener("resize", updateScrollCue);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateScrollCue);
    };
    // Recompute when the folder (and thus the description) changes.
  }, [folder.id]);

  // True once the open spring finishes — defers expensive paint (blurred bg) to fix open-lag.
  const [settled, setSettled] = useState(false);

  // Ambient (blurred) background thumb for the assets pane — folder's first image, else the project's.
  const paneThumbAsset = folder.assets.find(
    (a) => a.url && !isVideoUrl(a.url) && !isPdfUrl(a.url),
  );
  const paneThumb = paneThumbAsset
    ? displayUrl(paneThumbAsset)
    : firstImage(project);

  // Open timestamp — briefly guards asset double-clicks so the opening gesture can't bleed into a zoom.
  const openedAtRef = useRef(Date.now());
  const OPEN_GUARD_MS = 500;

  // Aspect ratio (w/h) per asset, measured on image load — the grid needs more
  // than portrait/landscape now that squares are treated separately.
  const [ratioMap, setRatioMap] = useState<Record<string, number>>({});
  const recordDims = (id: string, el: HTMLImageElement) => {
    if (!el.naturalWidth || !el.naturalHeight) return;
    setRatioMap((m) =>
      id in m ? m : { ...m, [id]: el.naturalWidth / el.naturalHeight },
    );
  };

  // Prefer the stored master dims, else the measured ratio once loaded.
  const ratioOf = (a: FolderAsset) =>
    a.width && a.height ? a.width / a.height : ratioMap[a.id];
  const isPortrait = (a: FolderAsset) => {
    const r = ratioOf(a);
    return !!r && r < 1;
  };
  // Near-square (1080² logos, 4:5-ish crops). At full column width these blow
  // up to fill the pane and read as a zoomed-in detail rather than an asset, so
  // they get the same one-column + height-cap treatment as a stack.
  const isSquarish = (a: FolderAsset) => {
    const r = ratioOf(a);
    return !!r && r >= 0.85 && r <= 1.18;
  };
  // Stacks: one tile per group, and the active variant within each.
  const tiles = useMemo(() => groupAssets(folder.assets), [folder.assets]);
  const [variantIndex, setVariantIndex] = useState<Record<string, number>>({});
  const activeOf = (t: AssetTile) =>
    t.variants[variantIndex[t.key] ?? 0] || t.cover;
  // A swipe ends in a tap the browser still reports — suppress the zoom briefly.
  const swipedAtRef = useRef(0);
  const swipeStartRef = useRef(0);

  // Only pair portraits when there are ≥2; a lone vertical stays full-width.
  // Counted on covers, since covers are what the grid lays out.
  const portraitCount = tiles.filter((t) => isPortrait(t.cover)).length;
  const gridPortraits = portraitCount >= 2;

  // Measure every visual asset (images AND videos) up-front with dedicated elements — cached media often never fires onLoad, which would leave the portrait grid blank.
  useEffect(() => {
    const record = (id: string, w: number, h: number) => {
      if (!w || !h) return;
      setRatioMap((m) => (id in m ? m : { ...m, [id]: w / h }));
    };
    folder.assets.forEach((a) => {
      if (!a.url || isPdfUrl(a.url)) return;
      if (a.width && a.height) return; // known from upload
      if (isVideoUrl(a.url)) {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => record(a.id, v.videoWidth, v.videoHeight);
        v.src = displayUrl(a);
      } else {
        const img = new Image();
        img.onload = () => record(a.id, img.naturalWidth, img.naturalHeight);
        img.src = displayUrl(a);
      }
    });
  }, [folder]);

  // Zoom viewport: enlarged image renders oversized (cover + headroom) and pans via drag; zoomSize computed from natural dims once loaded.
  const zoomRef = useRef<HTMLDivElement>(null);
  const [zoomSize, setZoomSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const zoomMoved = useRef(false); // drag-vs-click guard (click closes)
  const computeZoom = (iw: number, ih: number) => {
    const el = zoomRef.current;
    if (!el || !iw || !ih) return;
    const { width: cw, height: ch } = el.getBoundingClientRect();
    const scale = Math.max(cw / iw, ch / ih) * 1.3; // cover + 30% pan headroom
    setZoomSize({ w: iw * scale, h: ih * scale });
  };
  useEffect(() => {
    setZoomSize(null); // recompute per asset
  }, [enlargedId]);

  // ESC collapses an enlarged asset (image zoom or the inline PDF reader) first,
  // capture phase, before the parent's folder-close handler fires.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !enlargedId) return;
      e.stopImmediatePropagation();
      setEnlargedId(null);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [enlargedId]);

  // Grow-from-folder offsets: clicked icon centre → viewport centre (centre zoom if no origin).
  const hasWin = typeof window !== "undefined";
  const dx =
    origin && hasWin
      ? origin.left + origin.width / 2 - window.innerWidth / 2
      : 0;
  const dy =
    origin && hasWin
      ? origin.top + origin.height / 2 - window.innerHeight / 2
      : 0;

  // Cursor-attached tag (desktop) shown while hovering an asset. Tracks WHAT is
  // hovered, not just whether — a PDF opens the reader, so it needs its own
  // wording rather than the generic zoom prompt.
  const tagX = useMotionValue(0);
  const tagY = useMotionValue(0);
  const [tagKind, setTagKind] = useState<"image" | "pdf" | "stack" | null>(
    null,
  );
  const setShowTag = (on: boolean | "pdf" | "stack") =>
    setTagKind(
      on === false ? null : on === true ? "image" : (on as "pdf" | "stack"),
    );
  const showTag = tagKind !== null;

  const renderMedia = (asset: FolderAsset) => {
    const url = asset.url;
    // A lone/unpaired portrait would otherwise render full-column-width and blow
    // up huge (and a compressed thumb looks soft at that size). Cap its height
    // and centre it so it reads at a natural, crisp size. Paired portraits
    // (gridPortraits) keep their column width.
    const sizeCls = isSquarish(asset)
      ? "max-h-[42vh] w-auto max-w-full mx-auto h-auto"
      : isPortrait(asset) && !gridPortraits
        ? "max-h-[72vh] w-auto max-w-full mx-auto h-auto"
        : "w-full h-auto";
    if (isVideoUrl(url))
      return (
        <video
          src={url}
          // Captured frame (admin portal). Without it an unplayed video is a
          // black box — iOS draws a play glyph on it, desktop just shows black.
          // Legacy assets uploaded before this have no thumb and stay black
          // until re-uploaded; `undefined` simply omits the attribute.
          poster={asset.thumb}
          controls
          // No thumb → still fetch metadata so SOMETHING renders. With a poster
          // there's nothing to show until play, so don't spend the request.
          preload={asset.thumb ? "none" : "metadata"}
          className={`block bg-black border border-white/10 ${sizeCls}`}
          onPlay={onVideoPlay}
          onPause={onVideoRestore}
          onEnded={onVideoRestore}
        />
      );
    if (isPdfUrl(url)) {
      // PDF — the rendered first page (thumb) is the cover; double-click opens
      // the inline JUDAION reader in the right viewport (same enlarged flow as
      // images). Legacy PDFs with no thumb fall back to a compact document card.
      const openPdf = () => {
        if (Date.now() - openedAtRef.current < OPEN_GUARD_MS) return;
        setEnlargedId(asset.id);
      };
      // Mobile: one tap opens (easier to discover); desktop keeps double-click.
      const openPdfHandlerProp = { [isMobile ? "onClick" : "onDoubleClick"]: openPdf };
      if (asset.thumb)
        return (
          <img
            src={asset.thumb}
            alt={asset.title || folder.title}
            draggable={false}
            decoding="async"
            {...openPdfHandlerProp}
            onMouseEnter={() => !isMobile && setShowTag("pdf")}
            onMouseLeave={() => setShowTag(false)}
            className={`block border border-white/10 select-none cursor-pointer ${sizeCls}`}
          />
        );
      return (
        <button
          {...openPdfHandlerProp}
          onMouseEnter={() => !isMobile && setShowTag("pdf")}
          onMouseLeave={() => setShowTag(false)}
          className="group relative w-full bg-[#121212] border border-white/15 flex flex-col justify-between text-left select-none p-6 lg:p-7 cursor-pointer"
          style={{ aspectRatio: "1 / 1.32" }}
        >
          <span className="font-brand-cn text-[10px] tracking-[0.35em] uppercase text-white/45">
            Document
          </span>
          <div>
            <span className="font-brand-cn text-[clamp(16px,1vw,20px)] text-orange-600 leading-none">
              *
            </span>
            <h3 className="font-brand-other uppercase text-white leading-[0.95] tracking-[0.02em] mt-3 text-[clamp(20px,2vw,32px)]">
              {asset.title?.trim() || folder.title}
            </h3>
          </div>
          <div className="flex items-end justify-between border-t border-white/15 pt-4">
            <span className="font-brand-cn text-[10px] tracking-[0.3em] uppercase text-white/40">
              PDF Document
            </span>
            <span className="font-brand-cn text-[10px] tracking-[0.3em] uppercase text-white/70 opacity-70 group-hover:opacity-100">
              {isMobile ? "Tap to open →" : "Double-click to open →"}
            </span>
          </div>
        </button>
      );
    }
    // Image — double-click zooms into the pan viewport; serves the WebP thumb (master only in zoom).
    // Per-asset opt-OUT (admin): aspect ratios the cover-based zoom crops badly
    // stay view-only. Absent flag = zoomable, so legacy assets are unchanged.
    const zoomable = asset.zoomable !== false;
    return (
      <img
        // Measure immediately for cached images whose onLoad may never fire.
        ref={(el) => {
          if (el && el.complete) recordDims(asset.id, el);
        }}
        src={displayUrl(asset)}
        alt={asset.title || folder.title}
        draggable={false}
        decoding="async"
        {...(zoomable
          ? {
              // Mobile: one tap opens (easier to discover); desktop keeps double-click.
              [isMobile ? "onClick" : "onDoubleClick"]: () => {
                if (Date.now() - openedAtRef.current < OPEN_GUARD_MS) return;
                if (Date.now() - swipedAtRef.current < 400) return;
                setEnlargedId(asset.id);
              },
            }
          : {})}
        onLoad={(e) => recordDims(asset.id, e.currentTarget)}
        onMouseEnter={() => !isMobile && zoomable && setShowTag(true)}
        onMouseLeave={() => setShowTag(false)}
        className={`block border border-white/10 select-none ${zoomable ? "cursor-pointer" : ""} ${sizeCls}`}
      />
    );
  };

  const asTitle = (a: FolderAsset, i: number) =>
    a.title?.trim() || `Asset ${String(i + 1).padStart(2, "0")}`;

  // Folder info footer — "i" icon + divider-separated fields (Author / Category / Upload / Type).
  const infoFields = [
    { title: "Author", value: project?.author?.trim() || "JUDAION (Pty) Ltd" },
    { title: "Category", value: project?.category || "—" },
    {
      title: "Upload",
      value: formatDate(folder.assets[0]?.added || project?.created_at) || "—",
    },
    {
      title: "Type",
      value:
        [
          ...new Set(
            folder.assets
              .map((a) => (fileExt(a.url) ? fileExt(a.url).toUpperCase() : ""))
              .filter(Boolean),
          ),
        ].join(" / ") || "—",
    },
  ];
  // One field's label + value. Shared so the desktop scroller and the mobile
  // marquee can never drift apart in styling.
  const metaField = (f: { title: string; value: string }) => (
    <div className="flex flex-col gap-1 shrink-0">
      <span className="font-brand-cn text-[8px] tracking-[0.3em] uppercase text-white/45">
        {f.title}
      </span>
      <span className="font-brand-bold text-[11px] uppercase tracking-[0.06em] text-white/90 whitespace-nowrap">
        {f.value}
      </span>
    </div>
  );

  // Info fields row ("i" icon + Author/Category/Upload/Type). Shared by the
  // mobile sheet card (folderMeta) and the desktop left-pane pinned footer.
  // Info "i" icon — shared by the full meta row and the minimal no-description
  // label so the two can't drift apart.
  const infoIcon = (size = 22) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-white/70"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
      <line
        x1="12"
        y1="11"
        x2="12"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.75" r="1" fill="currentColor" />
    </svg>
  );

  const folderMetaInner = (
    <div className="relative z-10 flex items-center gap-5 px-9 py-6 min-w-0">
      {infoIcon()}
      {isMobile ? (
        /* Mobile: the fields are wider than a phone, so a scroller just looked
           cut off and hid the affordance. Walk them past instead — see
           .folder-meta-marquee. Two identical copies, translated exactly -50%,
           so the loop reset is invisible. Every field carries a LEADING divider
           here (unlike the desktop row) so the two copies chain seamlessly
           rather than butting together without a separator. */
        <div
          className="overflow-hidden min-w-0 flex-1"
          onTouchStart={() => setMetaPaused(true)}
          onTouchEnd={() => setMetaPaused(false)}
          onTouchCancel={() => setMetaPaused(false)}
        >
          <div
            className="folder-meta-marquee flex items-stretch gap-4 w-max"
            style={{ animationPlayState: metaPaused ? "paused" : "running" }}
          >
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex items-stretch gap-4"
                /* The duplicate is presentational — don't read it out twice. */
                aria-hidden={copy === 1 || undefined}
              >
                {infoFields.map((f) => (
                  <React.Fragment key={`${copy}-${f.title}`}>
                    <div className="w-px self-stretch bg-white/20 shrink-0" />
                    {metaField(f)}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Desktop: the pane is wide enough that these usually fit; scroll is
           the right fallback when they don't. pb keeps the values off the
           horizontal scrollbar. */
        <div className="desc-scroll flex items-stretch gap-4 overflow-x-auto min-w-0 pb-3">
          {infoFields.map((f, i) => (
            <React.Fragment key={f.title}>
              {i > 0 && (
                <div className="w-px self-stretch bg-white/20 shrink-0" />
              )}
              {metaField(f)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );

  // Mobile sheet metadata — solid-black fields band, formatted to match the
  // desktop left-pane footer (no gradient/scrim). Rendered full-bleed & flush at
  // the bottom of the sheet's scroll content.
  const folderMeta = <div className="bg-black">{folderMetaInner}</div>;

  // Folder description copy — shared by the desktop left pane and the mobile
  // slide-up sheet (per-folder, falling back to project content).
  const descParagraph = (
    <p className="font-brand-secondary-thin text-[clamp(12px,0.68vw,14px)] leading-[1.9] text-white/60 whitespace-pre-wrap tracking-[0em] text-justify">
      {folder.description?.trim() || project?.content}
    </p>
  );

  // Folder-description heading — the line + title, identical on desktop and in
  // the mobile sheet so the formatting matches.
  const descHeading = (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex-1 border-t border-white/20" />
      <h4 className="font-brand-bold text-[clamp(17px,0.55vw,16px)] uppercase tracking-[0.15em] text-white/90 shrink-0">
        Folder Description
      </h4>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-[140]"
      style={{
        background: "rgba(0,0,0,0.30)",
      }}
    >
      {/* ── WINDOW — grows from the clicked icon (mobile: full-bleed sheet; desktop: centred frame). ── */}
      <motion.div
        initial={
          isMobile
            ? { opacity: 0, y: 24 }
            : { x: dx, y: dy, scale: 0.1, opacity: 0 }
        }
        animate={
          isMobile ? { opacity: 1, y: 0 } : { x: 0, y: 0, scale: 1, opacity: 1 }
        }
        exit={
          isMobile
            ? { opacity: 0, y: 24 }
            : { x: dx, y: dy, scale: 0.1, opacity: 0 }
        }
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        onAnimationComplete={() => setSettled(true)}
        className={
          isMobile
            ? "absolute inset-x-[3vw] top-[70px] bottom-[70px] flex flex-col bg-[#060606] border border-white/12 shadow-[0_30px_90px_rgba(0,0,0,0.8)] will-change-transform rounded-sm overflow-hidden"
            : "absolute left-[3.5vw] right-[3.5vw] top-[84px] bottom-[84px] flex flex-col bg-[#060606] border border-white/15 shadow-[0_50px_140px_rgba(0,0,0,0.85)] will-change-transform rounded-sm"
        }
      >
        {/* ── TITLE BAR — breadcrumb (left) + X close (right); floats over the panels so its blur has content beneath. ── */}
        <div className="absolute top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6 border-b border-white/10 bg-black/75 backdrop-blur-md select-none rounded-t-sm">
          {/* Breadcrumb — full path on desktop; mobile shows the home icon +
              only the last (folder) crumb to save space. */}
          <div className="flex items-center gap-2.5 min-w-0 font-brand-cn text-[9px] tracking-[0.25em] uppercase">
            <img
              src="/home-focus-icon.svg"
              alt=""
              className="h-4 w-auto opacity-80 shrink-0"
            />
            <span className="hidden lg:inline text-white/30 shrink-0">|</span>
            <span className="hidden lg:inline text-white/55 shrink-0">
              Archive Focus
            </span>
            {project?.title && (
              <>
                <span className="hidden lg:inline text-white/30 shrink-0">
                  |
                </span>
                <span className="hidden lg:inline text-white/55 truncate">
                  {project.title}
                </span>
              </>
            )}
            <span className="text-white/30 shrink-0">|</span>
            <span className="text-white truncate">{folder.title}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-4">
            <button
              onClick={onClose}
              aria-label="Close folder"
              className="flex items-center justify-center text-white/70 hover:text-white transition-colors duration-150 cursor-pointer"
            >
              <span className="text-[21px] leading-none font-brand-cn">X</span>
            </button>
          </div>
        </div>

        {/* ── BODY — description + assets panes; mobile shows assets first. While
            an asset is enlarged, the mobile body stops scrolling so the zoom
            viewport can resolve a full height (no bottom gap). ── */}
        <div
          className={`relative flex-1 min-h-0 flex flex-col lg:flex-row lg:overflow-hidden ${
            enlarged ? "overflow-hidden" : "overflow-y-auto"
          }`}
          style={{ scrollbarWidth: "none" }}
        >
          {/* ── LEFT PANEL — folder description + metadata; desktop only (mobile
              moves it into the slide-up sheet). Stays visible during zoom.
              Omitted entirely for no-description folders, so the asset grid
              takes the full window width. ── */}
          {!noDesc && (
          <div className="hidden lg:block order-2 lg:order-1 shrink-0 lg:w-[32%] lg:h-full relative overflow-hidden lg:border-r border-white/8">
            {/* Custom folder-description background (designed asset); fades in on open. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 z-0 pointer-events-none"
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url('${DESC_BG}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              {/* Vertical gradient — darker at the bottom, lighter toward the top. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/15" />
            </motion.div>
            {/* Scrolling description — bottom padding clears the pinned footer
                so long copy scrolls beneath it. */}
            <div
              ref={descScrollRef}
              onScroll={updateScrollCue}
              className="relative z-10 min-h-full lg:h-full lg:overflow-y-auto flex flex-col"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex-1 px-7 lg:px-10 pt-[96px] lg:pt-[104px] pb-28">
                {/* Per-folder description — falls back to project content. */}
                {descHeading}
                {descParagraph}
              </div>
            </div>
            {/* Scroll cue — pulsing chevron; visible only while the description
                overflows and isn't scrolled to the bottom.
                Gated on `ready` as well: this sits at z-30, above the z-20
                per-folder loader, so on a slow connection it pulsed over the
                black loading screen pointing at copy nobody could see yet. */}
            <AnimatePresence>
              {ready && showScrollCue && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.75, y: [0, 5, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="absolute bottom-23 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-white/80"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Pinned info footer. The fade scrim above the fields dissolves the
                copy while more remains below, then fades away once you reach the
                bottom (so the last lines are fully readable). The fields sit on a
                solid backing and stay put. Scrim is click-through so wheel-scroll
                reaches the copy beneath it. */}
            <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
              <motion.div
                animate={{ opacity: showScrollCue ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute bottom-full inset-x-0 h-35 bg-gradient-to-t from-black to-transparent"
              />
              <div className="pointer-events-auto bg-black">
                {folderMetaInner}
              </div>
            </div>
          </div>
          )}

          {/* ── RIGHT PANEL — assets (first on mobile); becomes a fixed viewport in zoom mode. ── */}
          <div
            className="order-1 lg:order-2 flex-1 lg:h-full relative overflow-hidden"
            onMouseMove={(e) => {
              tagX.set(e.clientX);
              tagY.set(e.clientY);
            }}
          >
            {/* Ambient blurred thumbnail + dark overlay; mounted only after the open spring settles. */}
            {paneThumb && settled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 z-0 pointer-events-none"
              >
                <div
                  className="absolute inset-0 scale-110 blur-2xl"
                  style={{
                    backgroundImage: `url('${paneThumb}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-0 bg-black/70" />
              </motion.div>
            )}
            <div
              className={`relative z-10 h-full ${
                enlarged
                  ? "overflow-hidden"
                  : "desc-scroll overflow-y-auto px-5 lg:px-12 pt-[88px] lg:pt-[96px] pb-12"
              }`}
            >
              {folder.assets.length === 0 ? (
                <div className="h-full min-h-[40vh] flex items-center justify-center">
                  <span className="font-brand-secondary-thin text-[10px] uppercase tracking-[0.5em] text-white/50">
                    Nothing filed here...yet
                  </span>
                </div>
              ) : enlarged && isPdfUrl(enlarged.url) ? (
                /* ── INLINE PDF READER — the JUDAION reader fills the assets pane
              (not a new window); ESC / its own close button returns to the grid.
              Absolute, not h-full: the percentage chain (h-full → h-full →
              flex-1) doesn't resolve reliably on mobile, which is why this was
              pinned to a fixed 70vh — and that left ~30vh of dead black below
              the reader. Insetting against the already-relative parent fills the
              pane exactly without depending on percentage heights at all. ── */
                <div className="absolute inset-0 overflow-hidden">
                  <PdfReader
                    variant="inline"
                    url={enlarged.url}
                    title={enlarged.title || folder.title}
                    isMobile={isMobile}
                    onClose={() => setEnlargedId(null)}
                  />
                </div>
              ) : enlarged ? (
                /* ── ZOOM VIEWPORT — oversized image, pans via drag; click closes. ── */
                <motion.div
                  key={`zoom-${enlarged.id}`}
                  ref={zoomRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative w-full h-full overflow-hidden flex items-center justify-center"
                >
                  <motion.img
                    src={enlarged.url}
                    alt={enlarged.title || folder.title}
                    draggable={false}
                    decoding="async"
                    drag
                    dragConstraints={zoomRef}
                    dragMomentum={false}
                    dragElastic={0}
                    // Invisible until zoomSize is computed, then a smooth zoom-in (scale 0.55 → 1 + fade).
                    initial={false}
                    animate={
                      zoomSize
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.55 }
                    }
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      recordDims(enlarged.id, el);
                      computeZoom(el.naturalWidth, el.naturalHeight);
                    }}
                    onPointerDown={() => {
                      zoomMoved.current = false;
                    }}
                    onDragStart={() => {
                      zoomMoved.current = true;
                    }}
                    {...{
                      // Mobile: one tap closes (matches the one-tap open); desktop keeps double-click.
                      [isMobile ? "onClick" : "onDoubleClick"]: () => {
                        if (!zoomMoved.current) setEnlargedId(null);
                      },
                    }}
                    onMouseEnter={() => !isMobile && setShowTag(true)}
                    onMouseLeave={() => setShowTag(false)}
                    className="shrink-0 max-w-none select-none cursor-grab active:cursor-grabbing"
                    style={
                      zoomSize
                        ? { width: zoomSize.w, height: zoomSize.h }
                        : { maxWidth: "100%", maxHeight: "100%", opacity: 0 }
                    }
                  />
                </motion.div>
              ) : (
                // Asset grid — 2 cols on desktop; landscapes span both, paired portraits take one each. grid-flow-dense backfills gaps.
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-x-8 lg:gap-y-14 [grid-auto-flow:dense] max-w-[1100px] mx-auto w-full">
                  {tiles.map((tile, i) => {
                    // The cover drives layout; the active variant only swaps
                    // the pixels, so flicking can never reflow the grid.
                    const a = activeOf(tile);
                    const stacked = tile.variants.length > 1;
                    const idx = variantIndex[tile.key] ?? 0;
                    const step = (n: number) =>
                      setVariantIndex((m) => ({
                        ...m,
                        [tile.key]:
                          (n + tile.variants.length) % tile.variants.length,
                      }));
                    // Stacks are square logo decks — a full-width column would
                    // blow them up to fill the pane, so they keep one column.
                    const span =
                      (gridPortraits && isPortrait(tile.cover)) ||
                      isSquarish(tile.cover) ||
                      tile.variants.length > 1
                        ? "lg:col-span-1"
                        : "lg:col-span-2";
                    // Lone portraits are height-capped + centred (see renderMedia), so
                    // the caption must hug the image width instead of the full column —
                    // otherwise it floats out to the far left of the empty column.
                    const capped =
                      isSquarish(tile.cover) ||
                      (isPortrait(tile.cover) && !gridPortraits);
                    const caption = (
                      <div className="flex items-baseline gap-3">
                        <span className="font-brand-cn text-[10px] tracking-[0.3em] text-white/35">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-brand-other-semi uppercase text-white/85 text-[14px] tracking-[0.12em]">
                          {/* Variants are untitled — the stack is named once, on
                              its cover — so fall back to the cover's title. */}
                          {a.title?.trim()
                            ? asTitle(a, i)
                            : asTitle(tile.cover, i)}
                        </span>
                        {/* Position marker — squares, not dots. The deck itself
                            is the control; this just says where you are. */}
                        {stacked && (
                          <span className="ml-auto flex items-center gap-3 pl-3">
                            <span className="flex items-center gap-1.5">
                              {tile.variants.map((v, n) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    step(n);
                                  }}
                                  aria-label={`Variant ${n + 1} of ${tile.variants.length}`}
                                  className="p-1.5 -m-1.5 cursor-pointer"
                                >
                                  <span
                                    className={`block h-1.5 w-1.5 transition-colors ${
                                      n === idx
                                        ? "bg-orange-600"
                                        : "bg-white/30 hover:bg-white/60"
                                    }`}
                                  />
                                </button>
                              ))}
                            </span>
                            <span className="font-brand-cn text-[10px] tracking-[0.3em] text-white/35 tabular-nums">
                              {String(idx + 1).padStart(2, "0")}/
                              {String(tile.variants.length).padStart(2, "0")}
                            </span>
                          </span>
                        )}
                      </div>
                    );
                    // ── Stack deck ──
                    // Ported from the old full-screen PosterStack: the pile IS
                    // the control. Click the top card to send it to the back,
                    // click a peeking card to bring it forward. Double-click
                    // still zooms. `order` is just the variants rotated by the
                    // active index, so the deck needs no state of its own.
                    const order = [
                      ...tile.variants.slice(idx),
                      ...tile.variants.slice(0, idx),
                    ];
                    const cover = tile.cover;
                    const deck = (
                      <div
                        className="relative mx-auto w-full"
                        style={{
                          // Stack assets are square masters (1080²); the cap
                          // stops one eating the whole pane the way a
                          // full-column landscape would.
                          aspectRatio:
                            cover.width && cover.height
                              ? `${cover.width} / ${cover.height}`
                              : "1 / 1",
                          maxWidth: "min(100%, 42vh)",
                          // Room for the peek offsets below the top card.
                          marginBottom: 48,
                        }}
                      >
                        {order.map((v, depth) => {
                          const slot = slotFor(depth);
                          const isTop = depth === 0;
                          return (
                            <motion.div
                              key={v.id}
                              className="absolute inset-0"
                              style={{ zIndex: 100 - depth }}
                              initial={false}
                              animate={{
                                x: slot.x,
                                y: slot.y,
                                rotate: slot.rotate,
                                scale: slot.scale,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 30,
                              }}
                            >
                              <img
                                ref={(el) => {
                                  if (isTop && el && el.complete)
                                    recordDims(cover.id, el);
                                }}
                                src={displayUrl(v)}
                                alt={v.title || tile.cover.title || folder.title}
                                draggable={false}
                                decoding="async"
                                onLoad={(e) =>
                                  isTop && recordDims(cover.id, e.currentTarget)
                                }
                                onClick={() => {
                                  if (
                                    Date.now() - openedAtRef.current <
                                    OPEN_GUARD_MS
                                  )
                                    return;
                                  if (Date.now() - swipedAtRef.current < 400)
                                    return;
                                  // Top card steps forward; a peeking card
                                  // jumps straight to the front.
                                  // Stacks don't zoom — a single click is the
                                  // only gesture, so it fires immediately.
                                  step(
                                    isTop
                                      ? idx + 1
                                      : tile.variants.findIndex(
                                          (x) => x.id === v.id,
                                        ),
                                  );
                                }}
                                onMouseEnter={() =>
                                  !isMobile && isTop && setShowTag("stack")
                                }
                                onMouseLeave={() => setShowTag(false)}
                                className="block h-full w-full object-contain select-none cursor-pointer"
                                style={{
                                  filter: isTop
                                    ? "drop-shadow(0 12px 24px rgba(0,0,0,0.45))"
                                    : "drop-shadow(0 6px 14px rgba(0,0,0,0.5))",
                                }}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    );

                    // Mobile: swipe across the tile to flick. Guarded by a
                    // distance threshold so a tap still means zoom.
                    const swipe = stacked
                      ? {
                          onTouchStart: (e: React.TouchEvent) => {
                            swipeStartRef.current = e.touches[0].clientX;
                          },
                          onTouchEnd: (e: React.TouchEvent) => {
                            const dx =
                              e.changedTouches[0].clientX -
                              swipeStartRef.current;
                            if (Math.abs(dx) < 40) return;
                            swipedAtRef.current = Date.now();
                            step(dx < 0 ? idx + 1 : idx - 1);
                          },
                        }
                      : {};
                    return (
                      <motion.div
                        key={tile.key}
                        {...swipe}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{
                          delay: 0.1 + i * 0.09,
                          type: "spring",
                          stiffness: 150,
                          damping: 22,
                        }}
                        className={`col-span-1 ${span} flex flex-col gap-4`}
                      >
                        {stacked ? (
                          <>
                            {deck}
                            {caption}
                          </>
                        ) : capped ? (
                          <div className="mx-auto flex w-fit max-w-full flex-col gap-4">
                            {renderMedia(a)}
                            {caption}
                          </div>
                        ) : (
                          <>
                            {renderMedia(a)}
                            {caption}
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* No-description folders lose the meta row with the panel. Author
                and Category repeat at project level, so only Upload and Type —
                the two facts that are per-folder — are worth keeping. */}
            {noDesc && !enlarged && (
              <div className="absolute bottom-4 left-4 z-30 flex items-center gap-4 bg-black/75 backdrop-blur-md border border-white/12 px-4 py-2.5 pointer-events-none">
                {infoIcon(18)}
                {infoFields
                  .filter((f) => f.title === "Upload" || f.title === "Type")
                  .map((f, i) => (
                    <React.Fragment key={f.title}>
                      {i > 0 && <span className="h-6 w-px bg-white/15" />}
                      {metaField(f)}
                    </React.Fragment>
                  ))}
              </div>
            )}

            {/* Mobile description launcher — blurred square pinned bottom-right,
                floats over the assets (hidden while an asset is enlarged). Same
                bg-blur as the title bar. Opens the slide-up description sheet. */}
            {!enlarged && !noDesc && (
              <button
                onClick={() => setDescOpen((v) => !v)}
                aria-label="Folder description"
                className="lg:hidden absolute bottom-4 right-4 z-40 h-11 w-11 flex items-center justify-center bg-black/75 backdrop-blur-md border border-white/12 rounded-sm text-white/75 hover:text-white transition-colors duration-150 cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M5 6h14M5 10h14M5 14h9M5 18h9" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── MOBILE DESCRIPTION SHEET — slides up over the assets when the
            title-bar description icon is tapped (desktop keeps the left pane).
            Backdrop starts below the title bar so Close/description stay tappable. ── */}
        <AnimatePresence>
          {descOpen && !noDesc && (
            <motion.div
              key="desc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={() => setDescOpen(false)}
              className="lg:hidden absolute inset-x-0 top-14 bottom-0 z-40 flex items-end bg-black/50"
            >
              <motion.div
                drag="y"
                dragControls={sheetDrag}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_e, info) => {
                  if (info.offset.y > 90 || info.velocity.y > 500)
                    setDescOpen(false);
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-h-[85%] flex flex-col bg-[black] border-t border-white/15 rounded-t-sm overflow-hidden"
              >
                {/* Grip handle — drag this to slide the sheet down to close.
                    z-30 keeps it crisp above the top blur strip. */}
                <div
                  onPointerDown={(e) => sheetDrag.start(e)}
                  style={{ touchAction: "none" }}
                  className="relative z-30 shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                >
                  <span className="h-1 w-10 rounded-full bg-white/25" />
                </div>
                {/* Scrollable content — the background lives INSIDE the scroll
                    flow (inner relative wrapper) so it travels with the text
                    instead of staying a fixed backdrop. */}
                <div className="relative z-10 desc-scroll overflow-y-auto overscroll-y-none flex-1">
                  <div className="relative">
                    {/* Designed bg + gradient — matches the desktop left pane;
                        as tall as the content, so it scrolls with it. */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url('${DESC_BG_MOBILE}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                    </div>
                    <div className="relative z-10">
                      <div className="px-6 pt-12 pb-8">
                        {descHeading}
                        {descParagraph}
                      </div>
                      {folderMeta}
                    </div>
                  </div>
                </div>
                {/* Top fade — extends down past the grip strip so the solid-black top blends smoothly into the content (no visible hard black block). */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-black via-black/70 to-transparent" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Per-folder loader — covers the body until this folder's assets preload. ── */}
        <AnimatePresence>
          {!ready && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-x-0 top-11 bottom-0 z-20 bg-[#060606] flex items-center justify-center"
            >
              <img src="/j-logo.svg" alt="Loading" className="loader-j" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cursor-attached tag — desktop only, while hovering an image or PDF
          cover. Hidden while the inline PDF reader is open (it has its own UI). */}
      {!isMobile && (
        <motion.div
          style={{ left: tagX, top: tagY }}
          animate={{
            opacity: showTag && !(enlarged && isPdfUrl(enlarged.url)) ? 1 : 0,
          }}
          transition={{ duration: 0.18 }}
          className="fixed top-0 left-0 z-[150] translate-x-5 translate-y-5 pointer-events-none flex items-center gap-2 bg-black/80 border border-white/10 backdrop-blur-sm px-3 py-2"
        >
          <img
            src={enlarged ? "/drag-icon.webp" : "/right-click.webp"}
            alt=""
            className="w-5 h-auto filter brightness-110"
          />
          <span className="font-brand-cn text-[10px] uppercase tracking-[0.3em] text-white whitespace-nowrap">
            {enlarged
              ? "Drag to pan — Double-click to close"
              : tagKind === "pdf"
                ? "Double-click to open PDF"
                : tagKind === "stack"
                  ? "Click to flip"
                  : "Double-click to open"}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── DesktopMenuBar — OS-style top strip: Exit nav + folder/asset counts (left), live clock + music toggle (right). ──
function DesktopMenuBar({
  folderCount,
  assetCount,
  isAudioOn,
  onNav,
  onToggleAudio,
}: {
  folderCount: number;
  assetCount: number;
  isAudioOn: boolean;
  onNav: () => void;
  onToggleAudio: () => void;
}) {
  // Clock starts null and ticks after mount (avoids SSR/render mismatch).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const clockDate = now
    ? now
        .toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })
        .toUpperCase()
    : "";
  const clockTime = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      className="fixed top-0 inset-x-0 z-[200] h-15 flex items-center justify-between px-4 lg:px-8 border-b border-white/10 backdrop-blur-md overflow-hidden"
      style={{
        backgroundImage: "url('/archive-header.avif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-4 lg:gap-5 min-w-0">
        <button
          onClick={onNav}
          className="flex items-center gap-2 font-brand-bold text-[14px] lg:text-[15px] uppercase tracking-[0.2em] text-white/85 hover:text-white transition-colors duration-200 cursor-pointer shrink-0"
        >
          Exit
          <span className="hidden lg:inline font-brand-secondary-thin text-[9px] tracking-[0.2em] text-white/40">
            [ESC]
          </span>
        </button>
        <span className="h-4 w-px bg-white/15 shrink-0" />
        <span className="flex items-center gap-2 shrink-0">
          <img
            src="/home-focus-icon.svg"
            alt=""
            className="h-5 lg:h-5.5 w-auto opacity-90"
          />
        </span>
        <span className="h-4 w-px bg-white/15 shrink-0" />
        <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55 shrink-0">
          {folderCount} Folder{folderCount === 1 ? "" : "s"} · {assetCount}{" "}
          Asset{assetCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="relative z-10 flex items-center gap-4 lg:gap-5 shrink-0 pl-4">
        <span className="hidden lg:inline font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55 tabular-nums">
          {clockDate}
        </span>
        <span className="hidden lg:inline h-4 w-px bg-white/15" />
        <span className="hidden lg:inline font-brand-bold text-[14px] uppercase tracking-[0.2em] text-white/80 tabular-nums">
          {clockTime}
        </span>
        <span className="hidden lg:inline h-4 w-px bg-white/15" />
        {/* Music toggle — same bars as the masonry header, sized a tad bigger. */}
        <button
          onClick={onToggleAudio}
          aria-label={isAudioOn ? "Mute music" : "Unmute music"}
          className="flex items-end gap-[3px] opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          {(
            [
              { anim: "soundBarB", dur: "1.2s", delay: "0s", maxH: 13 },
              { anim: "soundBarA", dur: "1.95s", delay: "0.4s", maxH: 21 },
              { anim: "soundBarC", dur: "1.05s", delay: "0.2s", maxH: 17 },
              { anim: "soundBarA", dur: "1.3s", delay: "0.7s", maxH: 23 },
              { anim: "soundBarB", dur: "0.90s", delay: "0.35s", maxH: 16 },
              { anim: "soundBarC", dur: "1.15s", delay: "0.55s", maxH: 20 },
            ] as const
          ).map((bar, i) => (
            <span
              key={i}
              className={`block w-[2px] bg-white rounded-full origin-bottom ${isAudioOn ? "animate-sound-bar" : ""}`}
              style={{
                height: isAudioOn ? `${bar.maxH}px` : "3px",
                animationName: isAudioOn ? bar.anim : "none",
                animationDuration: bar.dur,
                animationDelay: bar.delay,
                transition: "height 0.4s ease",
              }}
            />
          ))}
        </button>
      </div>
    </div>
  );
}

// ── DesktopStatusBar — bottom strip (desktop): interaction hints + J-logo; hints hide while a folder is open. ──
const STATUS_HINTS = [
  { icon: "/right-click.webp", text: "Click to select · Click again to open" },
  { icon: "/arrows-icon.png", text: "Arrow keys to navigate" },
  { icon: "/drag-icon.webp", text: "Folders are draggable" },
];
// Globe icon (no site asset exists for "website") — same stroke-line
// treatment as the other inline SVGs in this file (currentColor, opacity-driven).
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function DesktopStatusBar({
  openTitle,
  instagramUrl,
  linkedinUrl,
  websiteUrl,
}: {
  openTitle: string | null;
  instagramUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}) {
  const hasLinks = !!(instagramUrl || linkedinUrl || websiteUrl);
  // Mobile bottom bar cycles copyright ⇄ "All Rights Reserved" ⇄ (if any
  // links exist) engage-live-asset — the narrow width can't show it all at once.
  const totalSteps = hasLinks ? 3 : 2;
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSteps);
    }, 4500);
    return () => clearInterval(t);
  }, [totalSteps]);

  return (
    <>
      <div
        className="hidden lg:flex fixed bottom-0 inset-x-0 z-[150] h-15 items-center px-8 border-t border-white/10 backdrop-blur-md pointer-events-none overflow-hidden"
        style={{
          backgroundImage: "url('/archive-header.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />
        {/* Crossfade between the two states (mode="wait") so the hints don't snap back when a folder closes. */}
        <AnimatePresence mode="wait" initial={false}>
          {openTitle ? (
            <motion.div
              key="open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`relative z-10 w-full flex items-center gap-5 ${
                hasLinks ? "justify-between" : "justify-end"
              }`}
            >
              {/* "Engage Live Asset" only renders when at least one link exists — otherwise it's a dead label. */}
              {hasLinks && (
                <div className="relative flex items-center gap-4 pointer-events-auto">
                  <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55">
                    Engage Live Asset
                  </span>
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                      aria-label="Instagram"
                    >
                      <img
                        src="/insta-icon.png"
                        alt="Instagram"
                        className="h-[22px] w-auto"
                      />
                    </a>
                  )}
                  {linkedinUrl && (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                      aria-label="LinkedIn"
                    >
                      <img
                        src="/linkedin-icon.png"
                        alt="LinkedIn"
                        className="h-[22px] w-auto"
                      />
                    </a>
                  )}
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                      aria-label="Website"
                    >
                      <GlobeIcon className="h-[20px] w-[20px]" />
                    </a>
                  )}
                </div>
              )}
              <div className="relative flex items-center gap-5">
                <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55">
                  Copyright © {new Date().getFullYear()} Judaion Studios. All
                  Rights Reserved.
                </span>
                <span className="h-4 w-px bg-white/15" />
                <img src="/j-logo.svg" alt="Judaion" className="h-6 w-auto" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hints"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative z-10 w-full flex items-center justify-end gap-5"
            >
              {STATUS_HINTS.map((h, i) => (
                <React.Fragment key={h.text}>
                  {i > 0 && <span className="relative h-4 w-px bg-white/15" />}
                  <span className="relative flex items-center gap-3">
                    <img
                      src={h.icon}
                      alt=""
                      className="h-6 w-auto filter brightness-110"
                    />
                    <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55">
                      {h.text}
                    </span>
                  </span>
                </React.Fragment>
              ))}
              <span className="relative h-4 w-px bg-white/15" />
              <img
                src="/j-logo.svg"
                alt="Judaion"
                className="relative h-6 w-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MOBILE BOTTOM BAR — mirrors the top menu bar (brick bg + overlay).
        Left content auto-swaps engage-live-asset ⇄ copyright; J-logo pins right. ── */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-[150] h-15 flex items-center justify-between gap-4 px-4 border-t border-white/10 backdrop-blur-md overflow-hidden"
        style={{
          backgroundImage: "url('/archive-header.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />
        <div className="relative z-10 min-w-0 flex-1">
          {/* Cycles copyright ⇄ "All Rights Reserved" ⇄ (only if hasLinks) engage-live-asset. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-center gap-4 min-w-0"
            >
              {/* Step 0: Main Copyright */}
              {activeIndex === 0 && (
                <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55 truncate">
                  Copyright © {new Date().getFullYear()} Judaion Studios.
                </span>
              )}

              {/* Step 1: All Rights Reserved */}
              {activeIndex === 1 && (
                <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55 truncate">
                  All Rights Reserved.
                </span>
              )}

              {/* Step 2: Engage Live Asset — only ever reached when hasLinks (totalSteps caps the cycle at 2 otherwise). */}
              {activeIndex === 2 && (
                <>
                  <span className="font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] text-white/55 shrink-0">
                    Engage Live Asset
                  </span>
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="opacity-80 hover:opacity-100 transition-opacity duration-200"
                    >
                      <img
                        src="/insta-icon.png"
                        alt="Instagram"
                        className="h-[20px] w-auto"
                      />
                    </a>
                  )}
                  {linkedinUrl && (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                    >
                      <img
                        src="/linkedin-icon.png"
                        alt="LinkedIn"
                        className="h-[20px] w-auto"
                      />
                    </a>
                  )}
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Website"
                      className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                    >
                      <GlobeIcon className="h-[18px] w-[18px]" />
                    </a>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <img
          src="/j-logo.svg"
          alt="Judaion"
          className="relative z-10 h-6 w-auto shrink-0"
        />
      </div>
    </>
  );
}

export default function ArchiveCatalogue({
  wallpapers = [],
}: {
  wallpapers?: string[];
}) {
  const router = useRouter();
  /* Shared folder-window description background — same asset for every project,
     so hint the browser to fetch it now rather than waiting for the first
     folder open. Only the variant this viewport will actually paint: warming
     the desktop plate on a phone downloads a file that is never shown.
     matchMedia rather than useIsMobile — that hook starts false and corrects on
     mount, which would warm the wrong one first. Guarded for SSR, where the
     hint is simply skipped. */
  preload(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
      ? DESC_BG_MOBILE
      : DESC_BG,
    { as: "image", fetchPriority: "high" },
  );
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  /* Focus-view wallpaper, from public/archive-wallpapers/ (drop a file in and
     it's picked up automatically — see getWallpapers in the page).

     Keyed to the PROJECT, not the session: opening a project always gives it
     the same backdrop, so a project reads as a place you return to rather than
     a lucky dip. Deriving it from the id rather than rolling a die also means
     two projects opened back-to-back can't land on the same wallpaper and look
     like nothing happened — with only a handful of files, random would repeat
     often enough to feel broken.

     Projects do share wallpapers once there are more projects than files; add
     more images and they spread out on their own. */
  const wallpaper = useMemo<string | null>(() => {
    if (!wallpapers.length) return null;
    const id = Number(selectedProject?.id);
    if (!Number.isFinite(id)) return wallpapers[0];
    return wallpapers[Math.abs(id) % wallpapers.length];
  }, [selectedProject, wallpapers]);

  const [openFolder, setOpenFolder] = useState<Folder | null>(null);
  const [focusLoading, setFocusLoading] = useState(false);
  // OS click model: the currently selected (highlighted) folder on the desktop.
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  // Clicked icon rect — OpenFolderView grows out of it. Null = centre zoom.
  const [openOrigin, setOpenOrigin] = useState<DOMRect | null>(null);
  // Per-folder preload gate for the open window (see openFolderWindow).
  const [folderReady, setFolderReady] = useState(true);
  // Folder preload cache: in-flight promises + resolved ids (persists across projects).
  const folderLoadsRef = useRef<Map<string, Promise<void>>>(new Map());
  const loadedFoldersRef = useRef<Set<string>>(new Set());
  // Deep-link plumbing (?project=&folder=).
  const deepLinkAppliedRef = useRef(false);
  const pendingFolderRef = useRef<string | null>(null);

  // Selected project's folders, normalised (wraps a legacy file_url array into one folder).
  const projectFolders: Folder[] = useMemo(() => {
    if (!selectedProject) return [];
    const raw = selectedProject.folders;
    if (Array.isArray(raw) && raw.length > 0) return raw as Folder[];
    const urls = (
      Array.isArray(selectedProject.file_url)
        ? selectedProject.file_url
        : [selectedProject.file_url]
    ).filter(Boolean);
    return [
      {
        id: "legacy",
        title: selectedProject.title || "ARCHIVE",
        assets: urls.map((u: string, i: number) => ({
          id: `legacy-${i}`,
          title: "",
          url: u,
        })),
      },
    ];
  }, [selectedProject]);

  // Preload a folder's assets once (deduped by in-flight promise cache).
  const loadFolder = (f: Folder) => {
    let p = folderLoadsRef.current.get(f.id);
    if (!p) {
      p = Promise.all(f.assets.map((a) => loadAssetUrl(displayUrl(a)))).then(
        () => {
          loadedFoldersRef.current.add(f.id);
        },
      );
      folderLoadsRef.current.set(f.id, p);
    }
    return p;
  };
  // Hover/selection = intent — warm the folder silently in the background.
  const prefetchFolder = (f: Folder) => {
    loadFolder(f);
  };

  // Open a folder window: instant if cached, else an in-window loader (6s safety valve).
  const openFolderWindow = (f: Folder, rect: DOMRect | null) => {
    setOpenOrigin(rect);
    setSelectedFolderId(f.id);
    setOpenFolder(f);
    if (loadedFoldersRef.current.has(f.id)) {
      setFolderReady(true);
      return;
    }
    setFolderReady(false);
    const maxWait = new Promise<void>((r) => setTimeout(r, 6000));
    Promise.race([loadFolder(f), maxWait]).then(() => setFolderReady(true));
  };

  const [, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);
  const audioSuppressedByVideoRef = useRef(false);

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const activeItem = scrollRef.current.querySelector(
        '[data-active="true"]',
      );
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [activeCategory, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const audio = new Audio("/audio/archive-bg-music.mp3");
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    let started = false;

    function fadeIn() {
      let v = 0;
      const step = () => {
        v = Math.min(v + 0.35 / 30, 0.35);
        audio.volume = v;
        if (v < 0.35) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function onFirstInteraction() {
      if (started) return;
      started = true;
      document.removeEventListener("click", onFirstInteraction);
      audio
        .play()
        .then(() => {
          fadeIn();
          setIsAudioOn(true);
        })
        .catch(() => {});
    }

    function onVisibilityChange() {
      if (!started) return;
      if (document.hidden) {
        audio.volume = 0;
      } else if (!isMutedRef.current) {
        audio.volume = 0.35;
      }
    }

    document.addEventListener("click", onFirstInteraction);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("click", onFirstInteraction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioOn) {
      audio.muted = true;
      audio.volume = 0;
      isMutedRef.current = true;
      setIsAudioOn(false);
    } else {
      audio.muted = false;
      audio.volume = 0.35;
      isMutedRef.current = false;
      setIsAudioOn(true);
    }
  }

  // Duck the background music while a focus-view video plays, restore after.
  function handleVideoPlay() {
    const audio = audioRef.current;
    if (audio && !isMutedRef.current) {
      audio.muted = true;
      audio.volume = 0;
      audioSuppressedByVideoRef.current = true;
      setIsAudioOn(false);
    }
  }
  function handleVideoRestore() {
    const audio = audioRef.current;
    if (audio && audioSuppressedByVideoRef.current) {
      audio.muted = false;
      audio.volume = 0.35;
      isMutedRef.current = false;
      audioSuppressedByVideoRef.current = false;
      setIsAudioOn(true);
      // iOS pauses the bg audio when a video with sound plays — muting won't resume it, so play() explicitly.
      audio.play().catch(() => {});
    }
  }

  // Lock page scroll + ESC while focus is open. ESC peels back one layer at a time:
  // enlarged asset / inline PDF (OpenFolderView intercepts in capture) → folder → selection → close.
  useEffect(() => {
    document.body.style.overflow = selectedProject ? "hidden" : "";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openFolder) setOpenFolder(null);
      else if (selectedFolderId) setSelectedFolderId(null);
      else setSelectedProject(null);
    };
    if (selectedProject) document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProject, openFolder, selectedFolderId]);

  // Closing/switching a project collapses any open folder and clears the selection.
  useEffect(() => {
    setOpenFolder(null);
    setSelectedFolderId(null);
    setOpenOrigin(null);
  }, [selectedProject]);

  // Deep-link open: once the deep-linked project's folders are computed, open the requested folder (centre zoom).
  useEffect(() => {
    const fid = pendingFolderRef.current;
    if (!fid || !selectedProject) return;
    pendingFolderRef.current = null;
    const f = projectFolders.find((x) => x.id === fid);
    if (f) openFolderWindow(f, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, projectFolders]);

  // Apply a ?project=&folder= deep link once the archive has loaded.
  useEffect(() => {
    if (loading || deepLinkAppliedRef.current || projects.length === 0) return;
    deepLinkAppliedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("project");
    if (!pid) return;
    const proj = projects.find((p) => String(p.id) === pid);
    if (!proj) return;
    pendingFolderRef.current = params.get("folder");
    setFocusLoading(true);
    setSelectedProject(proj);
  }, [loading, projects]);

  // Mirror focus-view state into the URL (replaceState) so views are shareable and survive a refresh.
  useEffect(() => {
    if (loading) return;
    const url = new URL(window.location.href);
    if (selectedProject)
      url.searchParams.set("project", String(selectedProject.id));
    else url.searchParams.delete("project");
    if (selectedProject && openFolder)
      url.searchParams.set("folder", openFolder.id);
    else url.searchParams.delete("folder");
    window.history.replaceState(null, "", url.toString());
  }, [selectedProject, openFolder, loading]);

  // Gate the focus view behind a loader until the peek-fan thumbnails preload (folders load per-folder later).
  useEffect(() => {
    if (!selectedProject) return;
    let cancelled = false;
    setFocusLoading(true);

    const urls = projectFolders.flatMap((f) =>
      peekImages(f).map((a) => displayUrl(a)),
    );

    // Linger ~1.5s minimum so the project title is readable.
    const minDelay = new Promise((r) => setTimeout(r, 1500));
    // Safety valve: reveal anyway after maxWait if an asset stalls without firing load/error.
    const maxWait = new Promise((r) => setTimeout(r, 8000));
    Promise.race([
      Promise.all([...urls.map(loadAssetUrl), minDelay]),
      maxWait,
    ]).then(() => {
      if (!cancelled) setFocusLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedProject, projectFolders]);

  // One attempt at both queries. supabase-js reports failures in `res.error`
  // rather than throwing, so an unchecked `.data || []` turns a dead request
  // into a convincingly empty page — the cold-start "Nothing to see here" and
  // vanished categories were both this. Throwing puts them on the retry path.
  async function fetchOnce() {
    const [projectsRes, categoriesRes] = await Promise.all([
      supabase
        .from("archive")
        .select("*")
        .order("created_at", { ascending: false }),
      // Filter-bar order is the admin's drag order; name is only a tiebreak.
      supabase
        .from("catalogue_categories")
        .select("name,sort_order")
        .order("sort_order", { nullsFirst: false })
        .order("name"),
    ]);
    if (projectsRes.error) throw projectsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    return {
      projects: projectsRes.data || [],
      categories: categoriesRes.data || [],
    };
  }

  async function fetchData() {
    setLoading(true);
    setLoadFailed(false);
    const timer = new Promise((resolve) => setTimeout(resolve, 3000));

    let data: { projects: any[]; categories: any[] } | null = null;
    // Cold starts are exactly when a request is most likely to fail: no warm
    // connection, and the database may still be waking. Two retries turn the
    // reload the user was doing by hand into something automatic.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        data = await fetchOnce();
        break;
      } catch (err) {
        console.error(`Archive fetch failed (attempt ${attempt + 1}/3):`, err);
        if (attempt < 2)
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }

    await timer;

    if (!data) {
      // Leave whatever is already on screen alone — replacing it with empties
      // would turn a failed refetch into a blank page.
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    setCategories([{ name: "All" }, ...data.categories]);

    // Preload every grid cover so the grid renders from cache (simultaneous
    // reveal). Capped: a stalled request fires neither onload nor onerror, and
    // an uncapped wait here would hold the loader open indefinitely.
    const thumbnailUrls = data.projects
      .map((p: any) => firstImage(p))
      .filter((u: string | null): u is string => Boolean(u));
    await Promise.race([
      Promise.all(
        thumbnailUrls.map(
          (url: string) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = img.onerror = () => resolve();
              img.src = url;
            }),
        ),
      ),
      new Promise((r) => setTimeout(r, 8000)),
    ]);

    setProjects(data.projects);
    setLoading(false);
  }

  const filtered = projects.filter(
    (p) => activeCategory === "All" || p.category === activeCategory,
  );

  if (loading)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
        <LoaderScreen textClassName="loader-text-catalogue" />
      </div>
    );

  return (
    <main className="relative bg-black">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "black",
          zIndex: 999,
          pointerEvents: "none",
        }}
      />

      <div className="min-h-screen relative text-white font-brand-secondary-thin antialiased overflow-x-hidden bg-black">
        {/* Fixed video background */}
        <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
          <video
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source
              src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/%20JDS%20Global%20Bgglobal-bg.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/75 pointer-events-none" />
        </div>

        {/* ── HEADER ── */}
        <header
          className="relative bg-black backdrop-blur-sm px-6 lg:px-35 pt-10 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sticky top-0 z-30 transition-all duration-500 overflow-hidden shadow-2xl border-b border-white/10"
          style={{
            backgroundImage: "url('/archive-header.avif')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
          <div className="flex flex-col">
            <div className="flex items-end gap-5">
              {/* Prefer history-back — it returns to the CACHED Archive page with
                  its scroll position intact, which a push would reset. But on a
                  deep link (/archivecatalogue opened directly) there is no in-app
                  entry behind us and back() would leave the site, so fall back to
                  the page this view belongs to. */}
              <button
                onClick={() =>
                  hasInAppHistory() ? router.back() : router.push("/projectarchive")
                }
                className="flex items-center cursor-pointer group mb-0 self-start bg-transparent border-none p-0"
              >
                <motion.img
                  src="/exit.png"
                  className="pt-8 w-25 h-auto opacity-75 group-hover:opacity-100 transition-all duration-300 drop-shadow-[0_0_6px_rgba(255,255,255,0.35)] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </button>

              <button
                onClick={toggleAudio}
                className="pt-8 mb-1 self-end flex items-end gap-[3px] opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              >
                {(
                  [
                    { anim: "soundBarB", dur: "1.2s", delay: "0s", maxH: 10 },
                    {
                      anim: "soundBarA",
                      dur: "1.95s",
                      delay: "0.4s",
                      maxH: 16,
                    },
                    {
                      anim: "soundBarC",
                      dur: "1.05s",
                      delay: "0.2s",
                      maxH: 13,
                    },
                    { anim: "soundBarA", dur: "1.3s", delay: "0.7s", maxH: 18 },
                    {
                      anim: "soundBarB",
                      dur: "0.90s",
                      delay: "0.35s",
                      maxH: 12,
                    },
                    {
                      anim: "soundBarC",
                      dur: "1.15s",
                      delay: "0.55s",
                      maxH: 15,
                    },
                  ] as const
                ).map((bar, i) => (
                  <span
                    key={i}
                    className={`block w-[2px] bg-white rounded-full origin-bottom ${isAudioOn ? "animate-sound-bar" : ""}`}
                    style={{
                      height: isAudioOn ? `${bar.maxH}px` : "3px",
                      animationName: isAudioOn ? bar.anim : "none",
                      animationDuration: bar.dur,
                      animationDelay: bar.delay,
                      transition: "height 0.4s ease",
                    }}
                  />
                ))}
              </button>
            </div>
          </div>

          <nav
            ref={scrollRef as any}
            className="relative z-10 archive-nav-scroller flex flex-wrap gap-x-7 gap-y-2 mb-1"
          >
            {categories.map((cat, i) => (
              <React.Fragment key={cat.name}>
                <button
                  onClick={() => setActiveCategory(cat.name)}
                  data-active={activeCategory === cat.name}
                  className={`text-[15px] font-brand-secondary-thin uppercase tracking-[0.1em] transition-colors duration-300 relative pb-1 cursor-pointer ${
                    activeCategory === cat.name
                      ? "text-white"
                      : "text-white/40 hover:text-white/50"
                  }`}
                >
                  {cat.name}
                  {/* "All" always stays underlined, marking it as the distinct reset option regardless of the active category; opacity tracks the text (full white when active, dimmed to match otherwise). */}
                  {cat.name === "All" && (
                    <span
                      className={`absolute bottom-0 left-0 w-full h-[2px] transition-colors duration-300 ${
                        activeCategory === "All" ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  )}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </header>

        {/* ── COSMOS-STYLE MASONRY GRID ── */}
        <main className="relative z-10 px-3 lg:px-6 pb-24 pt-7">
          {/* Desktop: CSS columns masonry */}
          {!isMobile ? (
            <div
              key={activeCategory}
              className="columns-2 lg:columns-3 xl:columns-4 gap-7"
            >
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="break-inside-avoid mb-7 group relative overflow-hidden bg-[#111] border border-white/15 hover:border-white/45 duration-800 cursor-pointer select-none "
                  onClick={() => {
                    setFocusLoading(true);
                    setSelectedProject(item);
                    setIsPlaying(false);
                  }}
                >
                  {/* Cover — first image, or a branded placeholder for image-less projects. */}
                  {firstImage(item) ? (
                    // Wrapper keeps the mount reveal animation (which also animates filter); img carries the permanent desaturation so the two don't clobber each other.
                    <div className="grid-image-reveal">
                      <img
                        src={firstImage(item) as string}
                        alt={item.title}
                        className="w-full h-auto block object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/5] bg-[#141414] flex flex-col items-center justify-center gap-3 grid-image-reveal">
                      <span className="font-brand-cn text-[16px] text-orange-600 leading-none">
                        *
                      </span>
                      <span className="font-brand-other uppercase text-white/85 text-[16px] tracking-[0.1em] text-center px-5 leading-tight">
                        {item.title}
                      </span>
                      <span className="font-brand-cn text-[9px] tracking-[0.3em] uppercase text-white/40">
                        Archive
                      </span>
                    </div>
                  )}
                  {/* Scan lines — same treatment as the Methodology carousel; fades in on hover. */}
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
                        backgroundSize: "100% 3px",
                      }}
                    />
                  </div>
                  {/* Hover — top-to-bottom gradient with the title in the top-left, instead of a full dark overlay. */}
                  <div className="absolute z-10 top-0 inset-x-0 h-95 bg-gradient-to-b from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-800 flex items-start p-4">
                    <p className="font-brand-other-semi text-white text-[17px] uppercase tracking-[0.1em] leading-tight">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Mobile: same CSS-columns masonry as desktop, two columns and a
               tighter gutter. Was a rigid grid that forced every cover to a
               fixed 55vw (and every 5th to full-width at 50vw) — so covers were
               cropped to a uniform height regardless of their real proportions,
               and the periodic wide item made the rhythm feel mechanical.
               Letting each cover keep its own aspect is what makes the desktop
               version read well; mobile now does the same. */
            <div key={activeCategory} className="columns-2 gap-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="break-inside-avoid mb-2 group relative overflow-hidden bg-[#111] border border-white/10 select-none"
                  onClick={() => {
                    setFocusLoading(true);
                    setSelectedProject(item);
                    setIsPlaying(false);
                  }}
                >
                  {firstImage(item) ? (
                    // Wrapper keeps the mount reveal animation (which also animates filter); img carries the permanent desaturation so the two don't clobber each other.
                    <div className="grid-image-reveal">
                      <img
                        src={firstImage(item) as string}
                        alt={item.title}
                        className="w-full h-auto block object-cover"
                      />
                    </div>
                  ) : (
                    // No cover to take a height from, so give the placeholder
                    // the same portrait ratio the desktop one uses.
                    <div
                      className="w-full aspect-[4/5] bg-[#141414] flex flex-col items-center justify-center gap-2 grid-image-reveal"
                    >
                      <span className="font-brand-cn text-[14px] text-orange-600 leading-none">
                        *
                      </span>
                      <span className="font-brand-other uppercase text-white/85 text-[13px] tracking-[0.1em] text-center px-3 leading-tight">
                        {item.title}
                      </span>
                      <span className="font-brand-cn text-[8px] tracking-[0.3em] uppercase text-white/40">
                        Archive
                      </span>
                    </div>
                  )}
                  {/* Scan lines — always on, same as the Methodology mobile stack (no hover on touch). */}
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-100">
                    <div
                      className="pillar-scanlines absolute inset-[-12px] bg-black/[0.05]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
                        backgroundSize: "100% 3px",
                      }}
                    />
                  </div>
                  {/* Hover — top-to-bottom gradient with the title in the top-left, instead of a full dark overlay. */}
                  <div className="absolute z-10 top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-start p-3">
                    <p className="font-brand-other text-white text-[12px] uppercase tracking-[0.1em] leading-tight">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-6 py-80">
              <span className="font-brand-secondary-thin text-[10px] uppercase tracking-[0.5em] text-white/80">
                {/* A failed load is not an empty archive — say so, and offer the
                    reload the user was performing manually. */}
                {loadFailed
                  ? "Couldn't reach the archive"
                  : "Nothing to see here...YET"}
              </span>
              {loadFailed && (
                <button
                  type="button"
                  onClick={fetchData}
                  className="font-brand-secondary-thin text-[10px] uppercase tracking-[0.4em] text-white/50 hover:text-orange-500 border border-white/15 hover:border-orange-600/60 px-6 py-3 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </main>


        {/* ── FOCUS VIEW ── */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed inset-0 z-[100]"
              style={{
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                background: "rgba(0,0,0,0.88)",
              }}
            >
              {/* Asset loader — gates the reveal until all assets are ready. */}
              <AnimatePresence>
                {focusLoading && (
                  <motion.div
                    key="focus-loader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 z-[260] flex items-center justify-center bg-black"
                  >
                    <LoaderScreen
                      textClassName="loader-title"
                      label={selectedProject.title}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OS desktop furniture — top menu bar + bottom status bar. */}
              <DesktopMenuBar
                folderCount={projectFolders.length}
                assetCount={projectFolders.reduce(
                  (n, f) => n + tileCount(f.assets),
                  0,
                )}
                isAudioOn={isAudioOn}
                onNav={() => setSelectedProject(null)}
                onToggleAudio={toggleAudio}
              />
              <DesktopStatusBar
                openTitle={openFolder?.title ?? null}
                instagramUrl={selectedProject.instagram_url || undefined}
                linkedinUrl={selectedProject.linkedin_url || undefined}
                websiteUrl={selectedProject.website_url || undefined}
              />

              {/* Focus body — single full-screen folder desktop. */}
              <div className="h-full overflow-hidden">
                <section className="relative flex items-center justify-center bg-black w-full h-full">
                  {/* Desktop wallpaper — base layer, keyed to this project. */}
                  {wallpaper && (
                    <img
                      src={wallpaper}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    />
                  )}
                  {/* Grain video background — toned down over the wallpaper */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                  >
                    <source
                      src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4"
                      type="video/mp4"
                    />
                  </video>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(125% 115% at 50% 42%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.62) 100%)",
                    }}
                  />
                  {/* Folder desktop — scattered folders; click one to open it. */}
                  <div
                    className={`flex items-center justify-center w-full h-full ${isMobile ? "px-6 pt-16 pb-20" : "px-16 pt-12 pb-9"}`}
                  >
                    <FolderDesktop
                      key={selectedProject.id}
                      folders={projectFolders}
                      isMobile={isMobile}
                      active={!openFolder && !focusLoading}
                      selectedId={selectedFolderId}
                      openId={openFolder?.id ?? null}
                      onSelect={setSelectedFolderId}
                      onOpen={openFolderWindow}
                      onPrefetch={prefetchFolder}
                    />
                  </div>
                </section>
              </div>

              {/* Open-folder layer — keyed by folder id so state resets between folders. */}
              <AnimatePresence>
                {openFolder && (
                  <OpenFolderView
                    key={openFolder.id}
                    folder={openFolder}
                    project={selectedProject}
                    isMobile={isMobile}
                    origin={openOrigin}
                    ready={folderReady}
                    onClose={() => setOpenFolder(null)}
                    onVideoPlay={handleVideoPlay}
                    onVideoRestore={handleVideoRestore}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
