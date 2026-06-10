import ServicesClient from '@/components/ServicesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Architecture',
  description:
    'Three engagement tiers — from identity launch to scale partnership. Choose the JUDAION service architecture that fits your brand.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return <ServicesClient />;
}