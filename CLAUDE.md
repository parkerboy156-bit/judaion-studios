# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint check
```

No test suite is configured — there are no test files or test scripts.

## Environment Variables

A `.env.local` file is required with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The Oracle Cloud S3-compatible storage credentials are also required for the admin upload API (`/api/upload`), which generates presigned PUT URLs to bypass Vercel's 4.5 MB request limit.

## Architecture

This is a **Next.js 16 App Router** project (React 19, TypeScript, Tailwind CSS v4). The routing convention is `app/<route>/page.tsx` — each page file is a thin server component that simply imports and renders its corresponding `components/<Page>Client.tsx`, which carries the `"use client"` directive and all interactive logic.

### Entry sequence

1. `app/layout.tsx` wraps everything in `<Providers>` → `<ClientShell>` → `<Layout>`.
2. `ClientShell` (client) renders `<IntroLoader>` first. The site content stays `opacity: 0 / visibility: hidden` until `IntroLoader` calls `onComplete`, then fades in. This is the global entry gate — every page goes through it on first load.
3. `Layout` renders the fixed hamburger nav (Framer Motion overlay) and the `<main>` slot.

### Data layer

- **Supabase** (`lib/supabase.ts`) is the single DB client, used directly inside client components with the public anon key.
- The `archive` table stores projects. `file_url` is a `string[]` (array of asset URLs). `thumbnail_url` is a separate single string.
- `catalogue_categories` and `resource_types` are lookup tables managed from the admin portal.
- File assets are stored on **Oracle Cloud Object Storage** (S3-compatible). The `/api/upload` route generates a presigned PUT URL; the browser uploads directly to Oracle to avoid Vercel size limits.

### Key pages

| Route | Client component | Notes |
|---|---|---|
| `/` | `HomeClient` | Main brand landing |
| `/archivecatalogue` | `ArchiveClient` | Masonry grid + focus view lightbox |
| `/projectarchive` | `ProjectArchiveClient` | Project listing |
| `/adminportal` | `adminportal/page.tsx` (inline) | Upload/edit/delete archive entries; no auth guard in the component itself — relies on Supabase session |
| `/login` | `login/page.tsx` | Supabase auth |
| `/tier-1`, `/tier-2`, `/tier-3` | `Tier1/2/3Client` | Service tier detail pages |

### Styling conventions

- **Tailwind CSS v4** — configured via `postcss.config.mjs`. Theme tokens live in the `@theme` block in `app/globals.css`, not in a `tailwind.config` file.
- All custom fonts are declared with `@font-face` in `globals.css` and mapped to CSS variables under `@theme`. Use the Tailwind utility classes (e.g., `font-brand-other`, `font-brand-cn`, `font-brand-secondary-thin`) — never reference font family names directly in JSX.
- Font reference:
  - `font-brand-other` → Khand Bold (headings)
  - `font-brand-cn` → HelveticaNowDisplay-Cn (tags, labels)
  - `font-brand-secondary-thin` → AvenirLTProRoman (body, UI text)
  - `font-brand-compressed` → Helvetica-Compressed
- Mobile-specific overrides are in `globals.css` as `@media (max-width: 1023px)` blocks. Many use highly specific class-name selectors or CSS `:has()` — be careful not to rename Tailwind classes that are targeted there.
- The `<1023px` breakpoint is treated as "mobile"; `lg:` Tailwind prefix aligns with this.
- Global scrollbar is hidden via CSS (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`).

### ArchiveClient focus view

The focus view (`selectedProject` state) is a full-screen overlay with three panels:
- **Left**: scrollable description (tag → title → description), footer with `archive-header.avif` + logo
- **Centre**: main asset (image/video) rendered inline
- **Right**: `52×52px` thumbnail strip — active item gets `border-[1.5px] border-white`, others get `border-white/10`
