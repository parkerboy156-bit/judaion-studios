// app/archivecatalogue/page.tsx
import ArchiveClient from '@/components/ArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Archive | JUDAION',
  description: 'A curated catalogue of strategic brand assets and creative architecture.',
};

export default function Page() {
  return <ArchiveClient />;
}