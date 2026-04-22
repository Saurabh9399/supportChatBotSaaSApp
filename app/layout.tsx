import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { APP_CONFIG } from "@/config";
import { AuthNav } from "@/components/ui/AuthNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: "Multi-tenant AI-powered customer support platform",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ClerkProvider>
          <header
            className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/90 px-3 py-2 shadow-lg backdrop-blur-md"
            aria-label="Account"
          >
            <AuthNav />
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
