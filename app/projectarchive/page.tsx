import ProjectArchiveClient from '@/components/ProjectArchiveClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Archive | JUDAION',
  description: 'Storage assets.',
};

export default function ProjectArchivePage() {
  return <ProjectArchiveClient />;
}