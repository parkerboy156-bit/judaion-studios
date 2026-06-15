import TheNarrativeClient from '@/components/TheNarrativeClient';
import { Metadata } from 'next';
import ReactDOM from 'react-dom';
import heroBgAvif from '@/public/hero-bg-block.avif';

export const metadata: Metadata = {
  title: 'The Narrative',
  description:
    'The story behind JUDAION — the pillars and vision that shape our creative strategy.',
  alternates: { canonical: '/thenarrative' },
};

export default function TheNarrativePage() {
  // Preload the LCP background during HTML parse — see app/contact/page.tsx.
  ReactDOM.preload(heroBgAvif.src, {
    as: 'image',
    type: 'image/avif',
    fetchPriority: 'high',
  });

  return <TheNarrativeClient />;
}
