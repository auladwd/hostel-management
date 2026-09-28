import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "হোস্টেল ও মেস ম্যানেজমেন্ট সিস্টেম | Aulad IT Solution",
  description: "আধুনিক, নিরাপদ ও স্বয়ংক্রিয় হোস্টেল ও মেস পরিচালনা সমাধান। সিট বুকিং, ভাড়া হিসাব, মিল ম্যানেজমেন্ট ও বাজার হিসাব এক ক্লিকে।",
  keywords: ["hostel management", "mess management", "মেস হিসাব", "হোস্টেল সফটওয়্যার", "bangladesh hostel software"],
  authors: [{ name: "Aulad IT Solution" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1e3a8a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={hindSiliguri.variable}>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
