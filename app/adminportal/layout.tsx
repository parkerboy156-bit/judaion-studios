import type { Metadata } from "next";

// Private route — keep it out of search indexes.
export const metadata: Metadata = {
  title: "Admin Portal",
  robots: { index: false, follow: false },
};

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
