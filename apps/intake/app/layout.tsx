import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referral Intake",
  description: "Referral Intelligence Engine — intake (Phase 1)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
