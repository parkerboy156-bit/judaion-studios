import HomeClient from "@/components/HomeClient";
import { Metadata } from "next";
import ReactDOM from "react-dom";
import homeBgAvif from "@/public/home-bg-V1.2.avif";

export const metadata: Metadata = {
  title: { absolute: "JUDAION | Creative Brand Architecture" },
  description:
    "JUDAION is a brand strategy and identity studio for founders — high-torque, monochrome-led visuals built on a strategic foundation.",
  alternates: { canonical: "/" },
};

export default function Page() {
  // Preload the LCP background during HTML parse — see app/contact/page.tsx.
  ReactDOM.preload(homeBgAvif.src, {
    as: "image",
    type: "image/avif",
    fetchPriority: "high",
  });

  return <HomeClient isLoaded={true} />;
}
