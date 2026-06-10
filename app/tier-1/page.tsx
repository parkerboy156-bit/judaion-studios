import Tier1Client from '@/components/Tier1Client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tier 1 — The Identity Launchpad',
  description:
    'Tier 1: the Identity Launchpad. Establish a strategic brand foundation with JUDAION.',
  alternates: { canonical: '/tier-1' },
};

export default function Tier1Page() {
  return <Tier1Client />;
}