import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "AOH Church of God Directory",
  description:
    "Church directory app for members, visitors, pastors, leaders, and families to find Apostolic Overcoming Holy Church of God, Inc. churches.",
  applicationName: "AOH Church of God Directory",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AOH Church of God Directory"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: "/aoh-directory-badge.png",
    apple: "/aoh-directory-badge.png"
  },
  alternates: {
    canonical: "https://aohdirectory.com"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17352f"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="mobile-safe-area bg-aura font-sans text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
