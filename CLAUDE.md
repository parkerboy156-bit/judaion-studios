# CLAUDE.md - JUDAION Studios Archive[cite: 1]

<!-- Keep this file under 170 lines. Focus ONLY on context Claude cannot infer from code. -->

## 🎯 Project Overview
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase, Oracle Cloud Storage[cite: 1].
- **Architecture:** Page files (`app/<route>/page.tsx`) are thin server components that only import and render a corresponding `"use client"` shell from `components/<Page>Client.tsx` where all interactive logic resides[cite: 1].
- **Entry Sequence:** `layout.tsx` → `<Providers>` → `<ClientShell>` → `<Layout>`[cite: 1]. Content stays hidden until `<IntroLoader>` completes its global fade-in animation[cite: 1].

---

## 🛠️ Essential Commands
> **Rule:** Run from the root directory. There is no test suite configured; use build/lint for verification[cite: 1].

| Action | Command | Scope / Execution Directory |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Root (Localhost:3000)[cite: 1] |
| **Verify Build** | `npm run build` | Root (Forces typecheck and compilation)[cite: 1] |
| **Lint & Fix** | `npm run lint` | Root (ESLint check)[cite: 1] |

---

## 🧠 Collaborative Engagement & AI Behavior Rules
To maximize code quality and prevent technical debt, you must follow these cognitive rules:

1. **Be an Engineering Peer, Not a Yes-Man:** Do not blindly execute bad, redundant, or unoptimized requests. If a request compromises performance, token-efficiency, scale, or the clean dark-UI aesthetic, **challenge it directly**. Propose a superior alternative.
2. **Feature Interviewing — Required Before Any New Feature:** When the user asks to add a feature, **do not write code immediately**. First, ask short targeted questions to confirm: what it should do, where it should live, and how it should behave on mobile. Only proceed once there is clear alignment.
3. **Structural Soundness Check:** Before implementing any request, evaluate whether it is structurally sound and practical given the existing architecture. If a request would create technical debt, break existing patterns, conflict with the component hierarchy, or cause layout regressions — say so directly and propose a cleaner alternative. Do not silently implement a bad approach just because it was asked for.
4. **Mobile-First & Resolution Awareness:** Every UI change must account for the `<1024px` (mobile) breakpoint. Before marking any task complete, mentally verify that the change looks correct and is usable at mobile widths. If a change only makes sense at desktop, flag the mobile behaviour explicitly. Additionally, actively scan touched code for CSS that is brittle at non-standard resolutions — hardcoded `px` heights on fluid containers, fixed widths that will overflow, viewport-unit assumptions that break on ultrawide or small laptop screens, and magic numbers with no responsive fallback. Flag any found, explain why they will break, and suggest the fix (e.g. `min-h` instead of `h`, `clamp()`, `max-w` guards, or responsive Tailwind variants).
5. **Proactive Optimization Checks:** Before delivering code, review it for asset optimization (e.g., proper Next.js image loading, bypassing Vercel body limits via presigned URLs) and token usage[cite: 1].
6. **Architectural Cohesion:** Ensure components remain modular and semantic. Maintain strict data-flow separation: logic stays in the client shells, while routing/metadata stays in the server pages[cite: 1].

---

## ⚡ Token-Saving & Workflow Guardrails
To minimize token consumption and keep interactions fast, **YOU MUST** follow these rules:

1. **Progressive Disclosure:** Do not request full file dumps if a specific function or component shell is all you need[cite: 1]. Target your file reads to preserve context window space[cite: 1].
2. **Mandatory Planning Phase:** For edits touching more than 2 files, **do not write code immediately**[cite: 1]. First, output a brief, step-by-step bulleted plan of your strategy and ask: *"Shall we proceed with this plan?"*[cite: 1] Wait for user confirmation[cite: 1].
3. **Fail-Fast Loop:** If a fix or implementation fails twice in a row, stop guessing[cite: 1]. Acknowledge the block, step back, and propose an entirely alternative approach or ask for guidance[cite: 1].
4. **Evidence-Based Verification:** After modifying code, instruct the user to run `npm run build` or `npm run lint` to confirm success[cite: 1]. Do not report a task as complete without verifying compilation stability[cite: 1].

---

## 🛡️ Hard Constraints & Design Systems

### 🎨 Styling & Tailwind v4 Typography
- **Configuration:** Theme tokens live in the `@theme` block inside `app/globals.css`[cite: 1]. Do **not** look for or create a `tailwind.config` file[cite: 1].
- **Fonts:** All custom fonts map to CSS variables under `@theme`[cite: 1]. Never hardcode font families in JSX; always use these utilities[cite: 1]:
  - `font-brand-other` → Khand Bold (Headings)[cite: 1]
  - `font-brand-secondary-thin` → AvenirLTProRoman / Avenir 55 Roman (Body, UI text)[cite: 1]
  - `font-brand-cn` → HelveticaNowDisplay-Cn (Tags, labels)[cite: 1]
  - `font-brand-compressed` → Helvetica-Compressed[cite: 1]
- **Responsive & Layout:** The `<1023px` breakpoint is mobile; aligned with the `lg:` Tailwind prefix[cite: 1]. Mobile-specific overrides use highly specific class-name selectors or CSS `:has()` in `globals.css`—do not arbitrarily rename classes targeted there[cite: 1]. Global scrollbars are hidden via CSS[cite: 1].

### 💾 Data Layer & Environments
- **Supabase:** Single DB client (`lib/supabase.ts`) used directly in client components via public anon keys[cite: 1]. 
- **Oracle Cloud (S3-Compatible):** Used via `/api/upload` to generate presigned PUT URLs, bypassing Vercel’s 4.5 MB body limit[cite: 1].
- **Required Env Variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`[cite: 1].

---

## 🧠 Codebase Gotchas & UI Rules
*Strict boundaries to avoid breaking established layouts and wasting context cycles:*

- **Archive View Layout:** The project archive navigation uses independent containers with a blurred background overlay[cite: 1]. **Do not convert this into a standard modal UI approach.**[cite: 1]
- **Archive Display Spacing:** Maintain a wide, spread-out layout in the asset browser[cite: 1]. Keep the expanded horizontal spacing/gaps intact[cite: 1].
- **No Textures/Overlays:** Keep the dark UI clean[cite: 1]. Do not add noise textures or grain effects to the black UI hover overlays[cite: 1].
- **No Zoom Features:** The asset focus view does not utilize image zooming features or pinch iconography (`pinch-icon.png`)[cite: 1]. Keep the layout structural and clean[cite: 1].
- **Focus View Layout (`ArchiveClient`) — Two-Section Scroll:**
  - A full-screen overlay (`backdrop-blur + bg-black/88`) with a single scrollable container (`focusScrollRef`) using inertia-lerp scroll.
  - *Section 1 (sticky, 100vh):* Grain video bg. Fixed Exit button (top-left) and Music toggle (top-right). Main asset centred (image with J-logo loading placeholder, or `<video controls>`). Multi-asset thumbnail strip: `72×72px`, vertical `flex-col` on desktop / horizontal `flex-row` on mobile. Active thumb: `border-[1px] border-white`; inactive: `border-white/10 opacity-60`. Scroll hint bottom-right ("Scroll to Inspect" + animated arrow).
  - *Section 2 (details, scrolls in below Section 1):* Two-column desktop / stacked mobile. **Left:** "Project Description" heading + divider + `content` body text + optional Instagram/LinkedIn SVG links. **Right (`400px` desktop / full-width mobile):** product-details card with `archive-header.avif` bg and `bg-black/60` overlay — title, metadata rows (Category, Type, Number of Assets, Uploaded, File Type), feature checklist (orange `*` bullet), and CTA button (white bg, `box-icon.png` icon, "Project Archive '26" label). **Footer:** `archive-header.avif` bg, logo left, copyright right.

---

## 📐 Page Structure & Mobile Patterns

### Mobile horizontal-scroll background — `ServicesClient`, `ProjectArchiveClient`
- Wide landscape bg shown full-height, scrolled horizontally on mobile.
- A **real `<img className="h-full w-auto … block">`** (NOT `background-image` + a magic `w-[300vw]`) defines the exact scroll width from the image's natural aspect → no crop / black gap / cutoff. Section is `w-max` (mobile) / `w-full` (desktop); overlays sit `absolute inset-0`. Desktop keeps CSS `background-size: cover` (+ parallax).
- ⚠️ This pattern was tried on Home and **reverted** (caused zoom/gap). Do NOT re-apply it to Home.

### Hard-stop horizontal scroll (all background pages)
- Every mobile native horizontal-scroll bg adds **`overscroll-x-none`** on the `overflow-x-auto` container to kill iOS rubber-band overscroll (which reveals black past the image edge): Home, Services, Methodology, Contact, Project Archive.

### `HomeClient` — KEEP ORIGINAL structure
- `w-[300vw]` canvas + `object-cover` bg image + framer-motion `drag="x"` content layer (drag layered over native scroll). It is intentionally NOT on the `<img>`/`w-max` pattern. Keeps its own SURGICAL-MASK fade-from-black. Mobile hero labels (Vision/Structure/Identity) hidden via `.vision/structure/identity-block-mobile { display:none }` in globals.

### Tier pages header banner — `Tier1/2/3Client`
- Banner is flush to the top via `-mt-12 lg:-mt-20` (cancels the column's `pt-12 lg:pt-20`) so `archive-header.avif` covers behind the fixed nav; inner content uses `pt-20 lg:pt-18` to drop the title below the nav. **Never use positive `mt`** here — it opens a black gap above the image.

### Services mobile tier hitboxes — `ServicesClient`
- Always-on (no hover) tappable boxes over the 3 posters → `/tier-1|2|3`. Separate `HITBOXES_MOBILE` coords (% of full image) + `MOBILE_SELECTION` config (`lineOpacity`, `handleSize`, `handleOpacity`, `scanTint`). Desktop boxes stay hover-gated.

### The Narrative (route `/thenarrative`) mobile — `TheNarrativeClient`
- Pillar + hero scanlines always-on via `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`; image borders thinner on mobile (`border-[1px] lg:border-[2px]`). Section-4 body copy `hidden lg:block`; heading dropped lower via reduced `pb`.

### Audio system — `Tier1/2/3Client` + `ArchiveClient`
- Each page creates its own `new Audio()`; first user click starts + fades it in; ducks on asset-video play, restores on pause/ended.
- **iOS gotchas:** `audio.volume` is READ-ONLY → mute/duck MUST set `audio.muted` (not just volume). After a video plays, the bg `<audio>` is *paused* by iOS → restore handlers MUST call `audio.play()`. Archive video restore covers BOTH `onPause` AND `onEnded` (iOS fires only `ended` on completion).

### `IntroLoader` video
- Put `src` directly on the `<video>` (not a child `<source>`) so a React src swap reloads on iOS. Use `autoPlay muted playsInline preload="auto"`. On `isFinished`, rewind to frame 0 and play after `REVEAL_MS` (~1800ms) so the desktop clip's **epilepsy warning** (its start) isn't consumed behind the loader overlay.

### Video assets (Oracle bucket)
- All bg/intro/section videos must be web-optimised: `-movflags +faststart`, `-pix_fmt yuv420p` (iOS), audio stripped (`-an`) for muted-use clips. Never ship 4K/100MB+ masters to mobile — downscale (1080–1440p) + CRF-encode.