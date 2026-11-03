import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activities Calendar",
  description: "Monthly activities calendar for Miroku organizations and centres",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
