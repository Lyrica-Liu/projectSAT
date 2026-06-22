import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrepWise — SAT Reading & Writing",
  description:
    "AI-powered, personalized SAT Reading & Writing training. Practice smart, reflect deeper, improve faster.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
