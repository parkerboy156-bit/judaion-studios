import Tier1Client from '@/components/Tier1Client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Identity Launchpad | T1',
  description: 'The JUDAION Service Tiers.',
};

export default function Tier1Page() {
  return <Tier1Client />;
}