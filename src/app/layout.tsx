import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: { default: "Miroku Calendar", template: "%s · Miroku Calendar" },
  description: "Plan, print and share the monthly activities calendar of Miroku organizations and centres.",
  icons: { icon: "/izunome-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer no-print">
          Miroku Calendar · Miroku Association
        </footer>
      </body>
    </html>
  );
}
