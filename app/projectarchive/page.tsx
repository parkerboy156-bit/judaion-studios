import ProjectArchiveClient from '@/components/ProjectArchiveClient';
import { Metadata } from 'next';
import ReactDOM from 'react-dom';
import projectArchiveBgAvif from '@/public/project-archive-home-bg.avif';

export const metadata: Metadata = {
  title: 'Project Archive',
  description:
    'A curated archive of JUDAION projects — brand identity, creative direction and strategic execution.',
  alternates: { canonical: '/projectarchive' },
};

export default function ProjectArchivePage() {
  // Preload the LCP background during HTML parse — see app/contact/page.tsx.
  ReactDOM.preload(projectArchiveBgAvif.src, {
    as: 'image',
    type: 'image/avif',
    fetchPriority: 'high',
  });

  return <ProjectArchiveClient />;
}