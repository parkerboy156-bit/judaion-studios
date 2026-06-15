import MethodologyClient from '@/components/MethodologyClient';
import { Metadata } from 'next';
import ReactDOM from 'react-dom';
import methodBgAvif from '@/public/method-bg-V2.1.avif';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'The architectural framework behind JUDAION’s creative execution.',
  alternates: { canonical: '/methodology' },
};

export default function MethodologyPage() {
  // Preload the LCP background during HTML parse — see app/contact/page.tsx.
  ReactDOM.preload(methodBgAvif.src, {
    as: 'image',
    type: 'image/avif',
    fetchPriority: 'high',
  });

  return <MethodologyClient />;
}