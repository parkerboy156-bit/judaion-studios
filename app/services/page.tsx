import ServicesClient from '@/components/ServicesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Architecture | JUDAION',
  description: 'The JUDAION Service Tiers.',
};

export default function ServicesPage() {
  return <ServicesClient />;
}