import type { Metadata, Viewport } from "next";
import { Yeseva_One, Josefin_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BabyProvider } from "@/context/BabyContext";

const yesevaOne = Yeseva_One({
  variable: "--font-yeseva-one",
  weight: "400",
  subsets: ["latin"],
});

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Baby Milestone Tracker & Prenatal Suite",
  description: "Stage-aware baby milestone, prenatal tracking, contraction timer, and WHO pediatric growth tracker.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BabyTracker",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${yesevaOne.variable} ${josefinSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <BabyProvider>{children}</BabyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
