import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { LiteSession } from "@/components/lite/session";
import "./lite.css";

const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "800Path Lite",
  description: "On-the-go SAT practice: quick question streams, vocab flashcards and sprints.",
  // Installed on an iPhone, Lite draws under the status bar and Dynamic Island (with a brand
  // band there so the white clock and battery stay readable; see .l-statusbar).
  appleWebApp: { capable: true, title: "800Path Lite", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function LiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lite ${geist.variable}`}>
      <div className="l-statusbar" aria-hidden="true" />
      <div className="l-app">
        <LiteSession>{children}</LiteSession>
      </div>
    </div>
  );
}
