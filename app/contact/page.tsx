import ContactClient from '@/components/ContactClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Initiate | JUDAION',
  description: 'Build Your Authority.',
};

export default function ContactPage() {
  return <ContactClient />;
}