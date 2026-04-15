import AboutUsClient from '@/components/AboutUsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Who we are | JUDAION',
  description: 'Storage assets.',
};

export default function AboutUsPage() {
  return <AboutUsClient />;
}