import Tier2Client from '@/components/Tier2Client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tier 2 — Digital Authority',
  description:
    'Tier 2: Digital Authority. Build a commanding digital presence with JUDAION.',
  alternates: { canonical: '/tier-2' },
};

export default function Tier2Page() {
  return <Tier2Client />;
}