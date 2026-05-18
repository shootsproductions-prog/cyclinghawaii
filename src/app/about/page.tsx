import type { Metadata } from "next";
import { Manifesto } from "../page";

// The Manifesto used to live on /club (and briefly at the bottom of the
// new homepage). It's now its own page — for people who actually want to
// read the long version. The homepage stays clean; this page goes deep.
export const metadata: Metadata = {
  title: "About — Cycling Hawaii",
  description:
    "Vini's letter, Laura's introduction, and the whole story of Cycling Hawaii — the Maui-based Strava club that doesn't take itself too seriously.",
};

export const revalidate = 86400;

export default function AboutPage() {
  return (
    <main>
      <Manifesto />
    </main>
  );
}
