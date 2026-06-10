import MethodologyClient from '@/components/MethodologyClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'The architectural framework behind JUDAION’s creative execution.',
  alternates: { canonical: '/methodology' },
};

export default function MethodologyPage() {
  return <MethodologyClient />;
}