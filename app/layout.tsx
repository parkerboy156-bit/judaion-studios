import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Layout from "@/components/Layout";
import ClientShell from "@/components/ClientShell"; // We will create this below

const SITE_URL = "https://judaion.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JUDAION | Creative Strategic Partner",
    template: "%s | JUDAION",
  },
  description:
    "JUDAION is a brand strategy and identity studio for founders — operating at the intersection of strategic logic and cinematic rigour.",
  applicationName: "JUDAION",
  keywords: [
    "JUDAION",
    "creative strategy",
    "brand architecture",
    "creative studio",
    "brand identity",
    "cinematic branding",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "JUDAION",
    url: SITE_URL,
    title: "JUDAION | Creative Strategic Partner",
    description:
      "JUDAION is a brand strategy and identity studio for founders — operating at the intersection of strategic logic and cinematic rigour.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JUDAION — Creative Strategic Partner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JUDAION | Creative Strategic Partner",
    description:
      "JUDAION is a brand strategy and identity studio for founders — operating at the intersection of strategic logic and cinematic rigour.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JUDAION",
  url: SITE_URL,
  logo: `${SITE_URL}/judaion-logo-white.svg`,
  sameAs: [
    "https://www.linkedin.com/company/judaion",
    "https://www.instagram.com/judaion",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <Providers>
          <ClientShell>
            <Layout>{children}</Layout>
          </ClientShell>
        </Providers>
      </body>
    </html>
  );
}
