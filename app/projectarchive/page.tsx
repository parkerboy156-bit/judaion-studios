import ProjectArchiveClient from '@/components/ProjectArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Archive',
  description:
    'A curated archive of JUDAION projects — brand identity, creative direction and strategic execution.',
  alternates: { canonical: '/projectarchive' },
};

export default function ProjectArchivePage() {
  return <ProjectArchiveClient />;
}