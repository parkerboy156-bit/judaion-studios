import TheNarrativeClient from '@/components/TheNarrativeClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Narrative',
  description:
    'The story behind JUDAION — the pillars and vision that shape our creative strategy.',
  alternates: { canonical: '/thenarrative' },
};

export default function TheNarrativePage() {
  return <TheNarrativeClient />;
}
