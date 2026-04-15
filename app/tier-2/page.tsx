import Tier2Client from '@/components/Tier2Client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Authority | T2',
  description: 'The JUDAION Service Tiers.',
};

export default function Tier2Page() {
  return <Tier2Client />;
}