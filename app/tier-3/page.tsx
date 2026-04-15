import Tier3Client from '@/components/Tier3Client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Scale Partner | T3',
  description: 'The JUDAION Service Tiers.',
};

export default function Tier3Page() {
  return <Tier3Client />;
}