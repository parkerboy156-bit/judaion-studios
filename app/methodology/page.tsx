import MethodologyClient from '@/components/MethodologyClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology | JUDAION',
  description: 'The architectural framework of our creative execution.',
};

export default function MethodologyPage() {
  return <MethodologyClient />;
}