import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "AOH Directory",
  description: "Tenant-aware church directory platform for Apostolic Overcoming Holy Church of God, Inc."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-aura font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
