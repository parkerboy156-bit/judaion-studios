// app/archivecatalogue/page.tsx
import fs from 'node:fs';
import path from 'node:path';
import ArchiveClient from '@/components/ArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Archive',
  description:
    'A curated catalogue of strategic brand assets and creative architecture.',
  alternates: { canonical: '/archivecatalogue' },
};

// Read the focus-view desktop wallpapers straight from the folder — drop a
// new image into public/archive-wallpapers/ and it's picked up automatically
// (build time for the static page; per-request in dev). The client picks one
// at random each session.
function getWallpapers(): string[] {
  try {
    const dir = path.join(process.cwd(), 'public', 'archive-wallpapers');
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(avif|webp|png|jpe?g)$/i.test(f))
      .sort()
      .map((f) => `/archive-wallpapers/${f}`);
  } catch {
    return [];
  }
}

export default function Page() {
  return <ArchiveClient wallpapers={getWallpapers()} />;
}
