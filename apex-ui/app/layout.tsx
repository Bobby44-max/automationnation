import type { Metadata } from "next";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Weather Scheduling",
  description:
    "AI-powered weather scheduling automation for service businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <ConvexClientProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
