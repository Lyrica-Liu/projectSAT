import type { MetadataRoute } from "next";

/** "Add to Home Screen" installs 800Path Lite: it opens full-screen at /lite. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "800Path Lite",
    short_name: "800Path",
    description: "On-the-go SAT practice: quick question streams, vocab flashcards and sprints.",
    start_url: "/lite",
    scope: "/",
    display: "standalone",
    background_color: "#fcfbf8",
    theme_color: "#fcfbf8",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
