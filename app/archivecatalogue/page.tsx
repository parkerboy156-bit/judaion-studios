// app/archivecatalogue/page.tsx
import ArchiveClient from '@/components/ArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Archive',
  description:
    'A curated catalogue of strategic brand assets and creative architecture.',
  alternates: { canonical: '/archivecatalogue' },
};

export default function Page() {
  return <ArchiveClient />;
}