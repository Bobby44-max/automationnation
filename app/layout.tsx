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
  title: "Rain Check — Weather Scheduling for Contractors",
  description:
    "Automated weather monitoring and job rescheduling for roofing, painting, landscaping, and concrete contractors. Protect $47K+ in annual revenue.",
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
