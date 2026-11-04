import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { LiteSession } from "@/components/lite/session";
import "./lite.css";

// The website's two fonts: Instrument Sans (loaded here with the bold weights Lite's buttons and
// numbers use) and Source Serif 4 (already loaded by the root layout).
const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-lite-sans" });

export const metadata: Metadata = {
  title: "800Path Lite",
  description: "On-the-go SAT practice: quick question streams, vocab flashcards and sprints.",
  // Installed on an iPhone, the status bar takes the page's own background with dark icons, so
  // the strip around the Dynamic Island reads as part of the page. ("black-translucent" would let
  // content run under it, but forces white icons, which need a tinted block to stay readable on
  // a light page.) In Safari, content already slides under the island as the page scrolls.
  appleWebApp: { capable: true, title: "800Path Lite", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fcfbf8",
  viewportFit: "cover",
};

export default function LiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lite ${sans.variable}`}>
      <div className="l-app">
        <LiteSession>{children}</LiteSession>
      </div>
    </div>
  );
}
