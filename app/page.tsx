import HomeClient from "@/components/HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "JUDAION | Creative Brand Architecture" },
  description:
    "JUDAION is a brand strategy and identity studio for founders — high-torque, monochrome-led visuals built on a strategic foundation.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeClient isLoaded={true} />;
}
