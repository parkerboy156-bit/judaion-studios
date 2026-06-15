import ServicesClient from '@/components/ServicesClient';
import { Metadata } from 'next';
import ReactDOM from 'react-dom';
import servicesBgAvif from '@/public/service-home-bg.avif';

export const metadata: Metadata = {
  title: 'Service Architecture',
  description:
    'Three engagement tiers — from identity launch to scale partnership. Choose the JUDAION service architecture that fits your brand.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  // Preload the LCP background during HTML parse — see app/contact/page.tsx.
  ReactDOM.preload(servicesBgAvif.src, {
    as: 'image',
    type: 'image/avif',
    fetchPriority: 'high',
  });

  return <ServicesClient />;
}