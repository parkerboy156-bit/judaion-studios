import AboutUsClient from '@/components/AboutUsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Narrative | JUDAION',
  description: 'Storage assets.',
};

export default function AboutUsPage() {
  return <AboutUsClient />;
}