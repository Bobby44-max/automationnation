import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutomationNation — AI Automation That Runs Your Business",
  description:
    "We build deterministic AI systems, weather automation, and custom SaaS products for service businesses. Elite stack: Next.js, Convex, Claude Code, Stripe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${raleway.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
