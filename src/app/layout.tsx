import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SubKill — The Subscription Killer",
  description:
    "SubKill links your accounts, detects every recurring charge, scores how hard each one is to cancel, and walks you through the kill — step by step.",
  keywords: ["SubKill", "subscription tracker", "cancel subscriptions", "recurring charges", "personal finance"],
  authors: [{ name: "SubKill" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "SubKill — The Subscription Killer",
    description: "Detect every recurring charge. Score how hard it is to cancel. Finish the kill.",
    url: "https://subkill-theta.vercel.app",
    siteName: "SubKill",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SubKill — The Subscription Killer",
    description: "Detect every recurring charge. Score how hard it is to cancel. Finish the kill.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}