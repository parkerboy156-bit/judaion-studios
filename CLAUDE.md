# CLAUDE.md - JUDAION Studios

<!-- Keep under 170 lines. Focus exclusively on context Claude cannot infer from code. -->

## 🎯 Project Overview & Routing
- **Stack:** Next.js 16.2.3 (App Router), React 19.2, TypeScript, Tailwind CSS v4, Supabase, Oracle Cloud (OCI) Object Storage via `@aws-sdk/*` presigner. Motion = `framer-motion` v12; scroll = `lenis`; PDFs = `pdfjs-dist` v6.
- **Repo Root:** the Next app lives in `judaion-studios-v2.2/` — all commands run from there, not the outer folder.
- **Data Flow:** `app/<route>/page.tsx` are thin server components that own `metadata` (+ `ReactDOM.preload()` of the LCP AVIF) and render a `"use client"` shell from `components/<Page>Client.tsx`. Mapping: `/`→`HomeClient`, `/services`→`ServicesClient`, `/methodology`→`MethodologyClient`, `/thenarrative`→`TheNarrativeClient` (+`NarrativeMobile`, data in `components/narrative.data.ts`), `/contact`→`ContactClient`, `/projectarchive`→`ProjectArchiveClient`, `/archivecatalogue`→`ArchiveClient`, `/tier-N`→`TierNClient`. `/login` and `/adminportal` are self-contained pages (no shell).
- **Entry Sequence:** `app/layout.tsx` (Organization JSON-LD, `bg-black text-white`) → `<Providers>` (`components/Providers.tsx` — Supabase `onAuthStateChange` only: `SIGNED_OUT` on `/adminportal*` → `/login`, `SIGNED_IN` on `/login` → `/adminportal`) → `<ClientShell>` → `<Layout>` → page. `ClientShell` owns `LoadingContext`/`useLoading()`, gates content until `IntroLoader` fires `onComplete`, and runs the elevator sweep off `FLOORS` (`/`=0 → `/contact`=5); routes in `INSPECTIONS` (`/tier-1|2|3`, `/archivecatalogue`) skip the sweep and own their entrance loader. Also mounts `RotateNotice` + `SmoothScroll` (Lenis).
- **Routes:** `/`, `/services`, `/methodology`, `/projectarchive`, `/thenarrative`, `/contact`, `/archivecatalogue`, `/tier-1`, `/tier-2`, `/tier-3`, `/login`, `/adminportal`. Nested layouts: `app/login/layout.tsx` + `app/adminportal/layout.tsx` (both `robots: noindex`). Only API route: `POST /api/upload`.

---

## 🛠️ Essential Build & Optimization Commands
> **Rule:** Execute strictly from root[cite: 1, 2]. No test suite is configured; rely on build/lint to verify compilation[cite: 1, 2].

| Action | Command | Scope / Execution Target |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Localhost:3000 server[cite: 1, 2] |
| **Verify Build** | `npm run build` | Forces strict typechecking and compilation[cite: 1, 2] |
| **Lint & Fix** | `npm run lint` | Runs ESLint analysis[cite: 1, 2] |
| **Optimize Media** | `npm run optimize -- <file\|folder> [maxWidth] [quality] [--to fmt]` | `scripts/optimize.mjs`: `sharp` resize + re-encode, `effort: 6`. Same-format = in-place, only if smaller. `--to` CONVERTS and **deletes the source**[cite: 2] |

### 📐 Asset Optimisation Standard
> **Every raster asset ships as AVIF.** PNG/JPG masters are working files, never served. Ceiling per image = the hero (~550 KB); nothing should exceed it.

| Target | Width | Quality | Command |
| :--- | :--- | :--- | :--- |
| **Desktop full-bleed** | `1920` | `55` | `npm run optimize -- public/<f>.png 1920 55 --to avif` |
| **Mobile full-bleed** | `1170` | `45` | `npm run optimize -- public/<f>-mobile.png 1170 45 --to avif` |
| **Video poster / still** | `1920` | `55` | extract frame 0, then as desktop |
| **UI / icons** | `720` | `82` | `npm run optimize -- public/<f>.png 720 --to webp` |

- **Mobile is compressed harder AND is not automatically smaller** — a 1170×2080 portrait is *more* pixels than 1920×1080, so mobile q45 is a deliberate offset, not a rounding of the desktop number[cite: 2].
- **Audit alpha before encoding** (`sharp(f).stats().channels[3]`). `min===255` = fully opaque, so `.removeAlpha()` — free bytes. Real transparency (cutouts like `ZP-1`) must survive: re-check `min`/`mean` on the output, and never downscale a cutout below the height it's displayed at (`ZP-1` is `h-[98%]` of the viewport)[cite: 2].
- **Verify with PSNR, not eyeballs alone**, but discount it on grainy stock: AVIF smooths film grain, which tanks PSNR while looking identical. >40 dB = transparent; 32–36 dB is normal for grain-heavy photographic plates[cite: 2].
- **Never delete a source until the user has SEEN the result.** `--to` deletes on success and `public/` masters are untracked (`git ls-files` to confirm) — encode alongside, report, wait. A >90% reduction is a prompt to inspect, not a win to report[cite: 2].
- **Check how an asset is DISPLAYED before downscaling.** Full-bleed elements (`w-full object-cover`, e.g. `cta-bg` at 2590px) keep native width — capping them at 1920 just upscales on wide monitors. Textured/saturated plates need q80–85, not q55: q55 smeared `cta-bg`'s canvas grain flat[cite: 2].
- **Video:** `ffmpeg -i in.mp4 -vf "scale=-2:1080" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -an -movflags +faststart out.mp4`. Dials: `scale` + `crf` (18–28; 22–23 for loops). `+faststart` is mandatory — it front-loads the index so playback streams[cite: 2].
- **Every background `<video>` MUST carry a mask-image** (`linear-gradient(to bottom, black 0%, black 100%)` if no real mask is wanted). Chromium promotes an unmasked playing video to a hardware overlay with its own swap chain; promoting/demoting it as it scrolls in and out of view repaints the WHOLE browser window, tab strip included. A mask forces an ordinary render surface. `opacity` does NOT work as a disqualifier. Never strip a mask off a video "because it does nothing"[cite: 2].
- **Diagnosing a flash that covers browser chrome:** page CSS cannot paint over the tab strip — if chrome flashes it is compositor-level, so stop debugging CSS. Check GPU process PID (stable = not a crash), then bisect videos before anything else[cite: 2].
- **Every background `<video>` ships a poster still extracted from frame 0** (flat luma across frames = no fade-in, so frame 0 is a seamless handover), with an `<img>` of that same poster beneath it. A video that never decodes paints nothing, so the img shows through — covers load error, blocked autoplay and iOS Low Power Mode with zero JS. See `NarrativeVideoPlate`[cite: 2].
- **Preload only the variant the viewport paints.** Derive warm-up lists from the data module (e.g. `TITLES`), never hardcode paths, and read `matchMedia` inside the effect rather than `useIsMobile` — that hook starts `false` and corrects on mount, which warms both sets on mobile[cite: 2].

---

## 🧠 Code & Layout Conventions
> **Conduct rules live in the user-level `~/.claude/CLAUDE.md`** — how to verify, when to plan before coding, commit/push etiquette, communication. They apply here and are deliberately not repeated. This section is only what's specific to THIS codebase.

- **Responsive guardrails:** Every layout change must explicitly account for the mobile break (`<1024px`). Actively reject brittle CSS constants — hardcoded `px` heights on fluid containers, fixed widths, un-guarded viewport units. Use `min-h`, `clamp()`, or responsive Tailwind variants[cite: 2].
- **Aesthetic constraint:** Challenge any directive that harms the high-contrast dark UI, breaks component hierarchies, or degrades performance — offer the cleaner approach rather than executing it silently[cite: 1, 2].
- **Terse code comments:** Maximum **one short descriptive sentence** explaining intent. If the logic needs a multi-line explanation, fix the function/variable naming instead[cite: 2].
- **Read targeted ranges,** not whole files — `ArchiveClient.tsx` alone is ~2.5k lines and the admin portal ~1.5k[cite: 1, 2].

---

## 🛡️ Hard Constraints & Design Systems

### 🎨 Styling & Tailwind v4 Typography
- **Core Tokens:** Theme tokens are defined inside the `@theme` block of `app/globals.css`[cite: 1, 2]. **Do not** look for or generate a `tailwind.config` file[cite: 1, 2].
- **Font Mappings:** Custom fonts use variables via `@theme`. Never declare raw font families in JSX[cite: 1, 2]; use these utility classes:
  - `font-brand-other` → Khand Bold (Headings)[cite: 1, 2]
  - `font-brand-secondary-thin` → AvenirLTProRoman / Avenir 55 Roman (Body, UI text)[cite: 1, 2]
  - `font-brand-cn` → HelveticaNowDisplay-Cn (Tags, labels); variants exist: `-thin-cn`, `-italic-cn`, `-med-italic-cn`, `-xbold-italic-cn`, `font-brand-bold` (HelveticaNowMicro-CnBold)[cite: 1, 2]
  - `font-brand-compressed` → Helvetica-Compressed; `font-brand-secondary-heavy` → Avenir-Heavy; `font-brand-other-medium|-semi` → Khand Medium/SemiBold[cite: 1, 2]
- **Scrollbar Architecture:** `globals.css` KILLS scrollbars globally (`* { scrollbar-width: none }` + `*::-webkit-scrollbar { display: none }`). Scrollbars are opt-IN per element — e.g. `.desc-scroll` re-enables with `scrollbar-width: thin` + `scrollbar-color` AND `::-webkit-scrollbar { display: block }`. Never "hide" a scrollbar (already hidden); to show one, copy the `.desc-scroll` pattern including the WebKit re-enable[cite: 2].

### 💾 Data Layer & Environments
- **Client Queries:** `lib/supabase.ts` exports a single `supabase` client (`NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`) used directly from client components — there is no server DB layer, no typed schema, no query helper module[cite: 1, 2].
- **Tables:** `archive` (projects), `catalogue_categories`, `resource_types`. Reads go through `supabase.from("archive").select(...)`; the admin portal is the only writer[cite: 2].
- **Asset Pipelines:** `POST /api/upload` returns an OCI presigned PUT URL (`getSignedUrl`, `expiresIn: 60`, `OCI_BUCKET_NAME`); the browser PUTs the file directly, circumventing Vercel’s 4.5 MB body limit[cite: 1, 2]. `DELETE /api/storage` removes objects by their stored public URL. **Both routes are admin-only** — they call `requireUser()` (`lib/apiAuth.ts`, validates the caller's Supabase JWT with the anon key); the client must send `Authorization: Bearer <session.access_token>`. Never add a route that signs or deletes without that guard[cite: 2].
- **OCI is S3-compatible only up to a point.** The batch `DeleteObjectsCommand` FAILS — OCI demands `Content-MD5`/`sha256`/`crc32c` on it and the SDK sends `crc32`. Use one `DeleteObjectCommand` per key (no checksum required, plus per-key errors). Assume the same for other batch/multipart APIs until proven[cite: 2].
- **Deletion order is DB row first, objects second.** The row is the only record of what a project owns, so collect URLs (asset `url` + `thumb`, plus the legacy `file_url` union) BEFORE deleting it. A failed object delete then leaves orphans — recoverable; the reverse leaves rows pointing at missing files. Object cleanup is best-effort and never blocks the user[cite: 2].
- **`supabase-js` does NOT throw on query failure** — it returns `{ data: null, error }`. An unchecked `data || []` renders a dead request as a convincingly empty page (this caused the cold-start "Nothing to see here" and vanishing categories). Always check `.error`, retry, and never overwrite good state with the results of a request that didn't land[cite: 2].
- **DB State:** `archive.folders` is JSONB: `[{ id, title, description?, assets: [{ id, title, url, thumb?, size?, mime?, added?, width?, height? }] }]`. `archive.file_url` is the flat `string[]` union of every asset URL — legacy/fallback, must stay in sync on every write[cite: 2].

---

## 🧠 Codebase Gotchas & Interface Systems
*Strict boundaries to avoid breaking established layouts and wasting context cycles:*

- **Archive Monolith:** `components/ArchiveClient.tsx` (~2.3k lines) holds the ENTIRE focus view — `FolderIcon`, `FolderDesktop`, `OpenFolderView`, `DesktopMenuBar`, `DesktopStatusBar`, `GlobeIcon` are private functions in that one file, not separate modules. Read targeted ranges; do not split the file without being asked[cite: 2]. Wallpapers are read server-side in `app/archivecatalogue/page.tsx` from `public/archive-wallpapers/` and passed as the `wallpapers` prop (drop-in = auto-detected)[cite: 2].
- **Layout Integrity:** Independent containers with custom blurred backgrounds. Do not convert the catalogue or folder window into a standard modal. Keep expanded grid spacing intact. Never add noise/grain to dark overlays[cite: 1, 2].
- **`FolderDesktop` Surface:** Full-screen stage; icons are placed on `ANCHORS` — 8 `{x,y}` percent anchors forming a scattered ring around a central keep-out safe zone, cycled for >8 folders. Desktop icons are `drag` with `dragConstraints={stageRef}` / `dragElastic={0.12}`; post-drag positions are tracked via the `nodes` ref so the window grows from the icon's REAL rect. Desktop = click-to-select then click-to-open; **mobile = single tap opens** (grid, not scatter). Arrow keys move selection, `Enter` opens, bare-stage click deselects — keyboard nav only while `active`. Entry animation is `scale 0.85 → 1` + `active:scale-95`; do not add hover/drag scale on top[cite: 2].
- **`OpenFolderView` Split:** OS-style window that springs from the `origin` DOMRect; clears the top menu bar and bottom status bar. Assets preload before content (`ready` prop drives the in-window loader); `settled` defers the blurred paint until the open spring finishes — keep that gate. `OPEN_GUARD_MS = 500` blocks asset double-clicks bleeding out of the open gesture[cite: 2].
  - *Left Pane (`hidden lg:block`, `lg:w-[32%]`):* `folder.description` → falls back to `project.content`; background `/folder-description-bg.avif` (preloaded at module level); `desc-scroll` container with a chevron cue (`showScrollCue`) + pinned `folderMeta` footer row. On **mobile** this pane becomes a drag-to-dismiss slide-up sheet (`useDragControls`, `dragConstraints={{top:0,bottom:0}}`, `dragElastic={{top:0,bottom:0.6}}`, `max-h-[85%]`) — not a hidden div[cite: 2].
  - *Right Pane:* ambient `paneThumb` layers (`scale-110 blur-2xl`, first folder image else `firstImage(project)`) behind `grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-x-8 lg:gap-y-14 [grid-auto-flow:dense] max-w-[1100px]`. Portrait detection = stored master `width/height`, else measured into `portraitMap` on load. A LONE portrait (`isPortrait && !gridPortraits`) gets `max-h-[72vh] w-auto mx-auto`; paired portraits keep column width[cite: 2].
- **Zoom Viewport:** Not a fixed scale — `computeZoom(iw, ih)` sets `zoomSize` to `Math.max(cw/iw, ch/ih) * 1.3` (cover + 30% pan headroom) against `zoomRef`, fading in `scale 0.55 → 1`; pan is `drag` with `dragConstraints={zoomRef}` / `dragElastic={0}`. **Click closes** (guarded by the `zoomMoved` drag-vs-click ref); the open gesture is `onDoubleClick` on desktop and `onClick` on mobile — this `[isMobile ? "onClick" : "onDoubleClick"]` computed-key pattern is used for every asset, keep it. ESC collapses the enlarged asset first via a capture-phase `stopImmediatePropagation`, before the folder-close handler[cite: 2].
  - *Zoom geometry — two boxes, don't merge them.* The OUTER layer is `absolute inset-0 bg-black` over the whole pane: it is the backing, so panning past the image's edge shows black instead of the asset grid reading through the title bar's blur. The INNER box (`top-14`, holding `zoomRef`) only SIZES and CENTRES the image below the bar so it doesn't open half-hidden — it must NOT be `overflow-hidden`, or the image is clipped at the bar and the bar goes permanently black instead of showing the image through it. The overlay must also be a sibling of the asset scroller, never inside it: `absolute inset-0` within a scroller anchors to the scrollable CONTENT, so a zoom opened after scrolling renders off-screen and leaves an invisible click-trap over the pane[cite: 2].
- **`PdfReader`:** `components/PdfReader.tsx`. `pdfjs-dist` is **dynamically imported** inside the component (zero bundle cost until a reader opens) with `GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"` — never static-import it. Pages render to `<canvas>` (never an iframe/native viewer, no download). Zoom is `ZOOM_MIN 0.6` / `ZOOM_MAX 3` / `ZOOM_STEP 0.2` re-rendering at `page.getViewport({ scale: targetW / base.width })` × `dpr` for crispness; baseline is fit-to-width. `variant="inline"` (absolute, fills the folder assets pane) vs `"overlay"` (fixed, full screen) — archive uses `inline`; do not promote it to full-screen. `dominantColor()` samples the page canvas for the ambient spotlight[cite: 2].
- **Admin Portal Pipeline (`app/adminportal/page.tsx`, ~1k lines):** Single client page — form builds `FolderDraft[]` → `cleanFolders` → `resolvedFolders`. `uploadFile()` POSTs to `/api/upload` for a presigned URL then PUTs. `makeThumb()` downscales images to `THUMB_MAX = 1600` long edge via canvas `toBlob("image/webp", THUMB_QUALITY)` and uploads as `${base}_thumb.webp` — **the thumb is kept only when it saves bytes**; `makePdfThumb()` rasterises page 1 and always keeps it. Every write must set both `folders` and `file_url` (flat union). Edit mode wraps legacy `file_url` rows into a single synthetic folder. Option tables `catalogue_categories` / `resource_types` are managed inline (`insert`/`delete` by `id`)[cite: 2].
- **Mobile Paradigms & Image Scrollers:** Mobile background translation maps (`ServicesClient`, `ProjectArchiveClient`) require real `<img>` children at native aspect (`h-full w-auto`), not CSS background blocks. Apply `overscroll-x-none` to kill rubber-banding. Keep the `w-[300vw]` drag structure on `HomeClient` unchanged[cite: 2].
- **Audio Architecture:** Background tracks fade in on first interaction and run at `volume = 0.35`; mute toggles set **both** `audio.muted = true` and `audio.volume = 0` (and restore both) — iOS honours `muted`, the volume write keeps desktop state consistent. Visibility change ducks to `0`. Inline videos duck the track via `handleVideoPlay`; restore must be wired to **both** `onPause` and `onEnded` or the track is lost when a video exits[cite: 2].