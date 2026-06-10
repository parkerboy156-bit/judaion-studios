import ContactClient from '@/components/ContactClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Initiate',
  description:
    'Start a conversation with JUDAION. Build your authority with a creative strategic partner.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return <ContactClient />;
}