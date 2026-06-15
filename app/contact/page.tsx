import ContactClient from '@/components/ContactClient';
import { Metadata } from 'next';
import ReactDOM from 'react-dom';
import contactBgAvif from '@/public/contact-us-V1.2.avif';

export const metadata: Metadata = {
  title: 'Initiate',
  description:
    'Start a conversation with JUDAION. Build your authority with a creative strategic partner.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  // Preload the LCP billboard during HTML parse — the bg <img> lives in a
  // client component, so without this hint the browser can't fetch it until
  // the JS bundle hydrates. Emitting the preload from this server component
  // streams it into <head>, so the download runs parallel to the bundle and
  // dedupes with the <picture>'s AVIF <source>.
  ReactDOM.preload(contactBgAvif.src, {
    as: 'image',
    type: 'image/avif',
    fetchPriority: 'high',
  });

  return <ContactClient />;
}