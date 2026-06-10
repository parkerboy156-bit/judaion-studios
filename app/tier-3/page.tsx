import Tier3Client from '@/components/Tier3Client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tier 3 — The Scale Partner',
  description:
    'Tier 3: the Scale Partner. A full creative strategic partnership to scale your brand with JUDAION.',
  alternates: { canonical: '/tier-3' },
};

export default function Tier3Page() {
  return <Tier3Client />;
}