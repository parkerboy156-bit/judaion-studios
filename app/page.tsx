import HomeClient from "@/components/HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "JUDAION | Creative Brand Architecture",
  description: "High-torque, monochrome-led visuals and strategic foundation.",
};

export default function Page() {
  return <HomeClient isLoaded={true} />;
}
