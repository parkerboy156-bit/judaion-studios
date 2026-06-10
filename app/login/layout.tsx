import type { Metadata } from "next";

// Private route — keep it out of search indexes.
export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
