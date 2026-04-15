import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Layout from "@/components/Layout";
import ClientShell from "@/components/ClientShell"; // We will create this below

export const metadata: Metadata = {
  title: "JUDAION | Creative Strategic Partner",
  description: "Operating at the intersection of strategic logic and cinematic soul.",
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organisation",
      "name": "JUDAION",
      "url": "https://www.judaion.com",
      "logo": "https://www.judaion.com/j-logo.svg",
      "sameAs": [
        "https://www.linkedin.com/company/judaion",
        "https://www.instagram.com/judaion"
      ]
    }),
  }}
/>


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white">
        <Providers>
          <ClientShell>
            <Layout>
              {children}
            </Layout>
          </ClientShell>
        </Providers>
      </body>
    </html>
  );
}
