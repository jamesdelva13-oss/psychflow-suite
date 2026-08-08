import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@suite/ui/tokens.css";
import "@suite/ui/ui.css";

export const metadata: Metadata = {
  title: "PsychReport",
  description: "AI-assisted psychoeducational report writing on the shared case record.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Design-system faces (tokens.css --font-ui/--font-doc/--font-mono).
            Delivered from Google Fonts in dev; offline, the token fallbacks
            render instead. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      {/* suppressHydrationWarning: browser extensions inject attributes into
          <body> before hydration (same note as apps/intake). */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
